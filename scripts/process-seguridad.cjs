// ════════════════════════════════════════════════════════════════════
// process-seguridad.cjs — Dashboard Mendoza
// Procesa SNIC provincial (Ministerio de Seguridad de la Nación).
// Genera 1 informe: SNIC para Mendoza con comparativa contra 24 jurisdicciones.
//
// Fuente: bases del Ministerio de Seguridad (npm run download-seguridad).
//
// Atención: desde 2017 la base publica categorías (ej. 21) y sus subcategorías
// (ej. 21_3) como filas separadas. Los totales suman SOLO categorías: si se suman
// todas las filas se cuenta dos veces, como advierte el manual del SNIC.
// Verificado contra el informe oficial para Mendoza 2023: "Total de hechos: 151.443".
//
// Output: public/data/seguridad/snic.json
// ════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const {
  SEG_BASE,
  writeJson,
  fmtInt,
  fmtPct,
  fmtDec,
  buildFeatured,
} = require('./lib/mendoza-utils.cjs');

const SNIC_FILE = path.join(SEG_BASE, 'snic-provincias.csv');
const SNIC_PAIS_FILE = path.join(SEG_BASE, 'snic-pais.csv');
const OUT_DIR = path.join(__dirname, '..', 'public', 'data', 'seguridad');

const MENDOZA_PROV_ID = '50';
const SOURCE = 'Sistema Nacional de Información Criminal (SNIC) — Ministerio de Seguridad de la Nación';

const esSubcategoria = id => String(id).includes('_');

// La base de provincias viene en Latin-1 con ";" y coma decimal; la de país, en UTF-8 con ",".
function readCsv(file, { delimiter = ',', encoding = 'utf8' } = {}) {
  const content = fs.readFileSync(file, encoding).replace(/^\uFEFF/, '');
  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true, delimiter });
  return parsed.data;
}

function num(v) {
  if (v == null || v === '') return 0;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

// La tasa total es hechos / población. No se suman las tasas por delito porque la
// de suicidios usa otra base (población de más de 5 años). La población sale de la
// categoría con más hechos de cada año.
function registrarPoblacion(acc, r, hechos, tasa) {
  if (r.codigo_delito_snic_id === '31' || tasa <= 0 || hechos <= (acc.hechosRef || 0)) return;
  acc.hechosRef = hechos;
  acc.poblacion = (hechos / tasa) * 100000;
}

function tasaDesdePoblacion(acc) {
  return acc.poblacion ? (acc.hechos / acc.poblacion) * 100000 : 0;
}

function signo(v) {
  return `${v >= 0 ? '+' : ''}${fmtDec(v)} %`;
}

function processSNIC() {
  console.log('\n─── SNIC Provincial ───');
  console.log('Leyendo:', SNIC_FILE);
  const rows = readCsv(SNIC_FILE, { delimiter: ';', encoding: 'latin1' });
  console.log(`  ${rows.length} filas leídas`);

  // Agregaciones:
  //   mendozaByYear: { year → { hechos, victimas, masc, fem, delitos: {} } }
  //   provByYear:    { provNombre → { year → { hechos, tasa } } }
  //   homByYear:     { provNombre → { year → tasaHomicidios } }
  const mendozaByYear = {};
  const subcategoriasMendoza = {};
  const provByYear = {};
  const homByYear = {};
  const provNames = new Set();

  for (const r of rows) {
    const provId = r.provincia_id ? String(r.provincia_id).padStart(2, '0') : null;
    const provNombre = r.provincia_nombre;
    const year = parseInt(r.anio, 10);
    if (!year || !provNombre) continue;
    const delito = r.codigo_delito_snic_nombre;
    const subcategoria = esSubcategoria(r.codigo_delito_snic_id);
    const hechos = num(r.cantidad_hechos);
    const victimas = num(r.cantidad_victimas);
    const masc = num(r.cantidad_victimas_masc);
    const fem = num(r.cantidad_victimas_fem);
    const tasa = num(r.tasa_hechos);

    provNames.add(provNombre);

    if (provId === MENDOZA_PROV_ID && subcategoria) {
      if (!subcategoriasMendoza[year]) subcategoriasMendoza[year] = {};
      subcategoriasMendoza[year][r.codigo_delito_snic_id] = { nombre: delito, hechos };
    }
    if (subcategoria) continue;

    if (provId === MENDOZA_PROV_ID) {
      if (!mendozaByYear[year]) mendozaByYear[year] = { hechos: 0, tasaSum: 0, delitos: {}, homMasc: 0, homFem: 0 };
      mendozaByYear[year].hechos += hechos;
      mendozaByYear[year].tasaSum += tasa;
      mendozaByYear[year].delitos[delito] = (mendozaByYear[year].delitos[delito] || 0) + hechos;
      if (/^Homicidios dolosos$/.test(delito)) {
        mendozaByYear[year].homicidios = hechos;
        mendozaByYear[year].homicidiosTasa = tasa;
        mendozaByYear[year].homMasc = masc;
        mendozaByYear[year].homFem = fem;
        mendozaByYear[year].homVictimas = victimas;
      }
    }

    if (!provByYear[provNombre]) provByYear[provNombre] = {};
    if (!provByYear[provNombre][year]) provByYear[provNombre][year] = { hechos: 0, tasa: 0 };
    provByYear[provNombre][year].hechos += hechos;
    registrarPoblacion(provByYear[provNombre][year], r, hechos, tasa);

    if (/^Homicidios dolosos$/.test(delito)) {
      if (!homByYear[provNombre]) homByYear[provNombre] = {};
      homByYear[provNombre][year] = tasa;
    }
  }

  for (const byYear of Object.values(provByYear)) {
    for (const d of Object.values(byYear)) d.tasa = tasaDesdePoblacion(d);
  }
  for (const [y, d] of Object.entries(mendozaByYear)) d.tasaSum = provByYear.Mendoza[y].tasa;

  const years = Object.keys(mendozaByYear).map(Number).sort((a, b) => a - b);
  const lastYear = years[years.length - 1];
  const last = mendozaByYear[lastYear] || {};
  const prev = mendozaByYear[lastYear - 1] || {};
  // Base de comparación: último año previo a la pandemia.
  const BASE_YEAR = 2019;
  const baseYear = mendozaByYear[BASE_YEAR] || {};

  const delitoEnAnio = (year, patron) => Object.entries(mendozaByYear[year]?.delitos || {})
    .filter(([nombre]) => patron.test(nombre))
    .reduce((acc, [, hechos]) => acc + hechos, 0);

  const variacionAnual = prev.hechos ? ((last.hechos - prev.hechos) / prev.hechos) * 100 : null;
  const variacionBase = baseYear.hechos ? ((last.hechos - baseYear.hechos) / baseYear.hechos) * 100 : null;

  const totalHechos = last.hechos || 0;
  const homicidios = last.homicidios || 0;
  const tasaHomicidios = last.homicidiosTasa || 0;
  const robos = delitoEnAnio(lastYear, /^Robos \(excluye/);
  const hurtos = delitoEnAnio(lastYear, /^Hurtos$/);
  const otrosPropiedad = delitoEnAnio(lastYear, /^Otros delitos contra la propiedad$/);
  const sub = subcategoriasMendoza[lastYear] || {};
  const estafasVirtuales = sub['21_4']?.hechos || 0;
  const estafas = (sub['21_3']?.hechos || 0) + estafasVirtuales;
  const robosHurtos = robos + hurtos;
  const pctRobosHurtos = totalHechos ? (robosHurtos / totalHechos) * 100 : null;
  const propiedad = robosHurtos + otrosPropiedad;
  const pctPropiedad = totalHechos ? (propiedad / totalHechos) * 100 : null;
  const tasaTotal = last.tasaSum || 0;

  // Ranking de provincias por tasa de hechos último año
  const provRankTasa = Object.entries(provByYear)
    .map(([nombre, byYr]) => ({ name: nombre, value: byYr[lastYear]?.tasa || 0 }))
    .filter(p => p.value > 0)
    .sort((a, b) => b.value - a.value);
  const posMendozaTasa = provRankTasa.findIndex(p => p.name === 'Mendoza') + 1;

  // Ranking por tasa de homicidios
  const homRankTasa = Object.entries(homByYear)
    .map(([nombre, byYr]) => ({ name: nombre, value: byYr[lastYear] || 0 }))
    .filter(p => p.value > 0)
    .sort((a, b) => b.value - a.value);
  const posMendozaHom = homRankTasa.findIndex(p => p.name === 'Mendoza') + 1;

  // Tasa nacional oficial: suma de tasas por delito del panel total país.
  const paisByYear = {};
  for (const r of readCsv(SNIC_PAIS_FILE)) {
    const y = parseInt(r.anio, 10);
    if (!y || esSubcategoria(r.codigo_delito_snic_id)) continue;
    if (!paisByYear[y]) paisByYear[y] = { hechos: 0, tasa: 0, hom: 0 };
    paisByYear[y].hechos += num(r.cantidad_hechos);
    registrarPoblacion(paisByYear[y], r, num(r.cantidad_hechos), num(r.tasa_hechos));
    if (/^Homicidios dolosos$/.test(r.codigo_delito_snic_nombre)) paisByYear[y].hom = num(r.tasa_hechos);
  }
  for (const d of Object.values(paisByYear)) d.tasa = tasaDesdePoblacion(d);
  if (!paisByYear[lastYear]) throw new Error(`El panel total país no tiene datos de ${lastYear}`);

  // Series temporales para Mendoza
  const redondear = v => Math.round(v * 10) / 10;
  const seriesHechos = years.map(y => ({ x: String(y), y: mendozaByYear[y].hechos || 0 }));
  const seriesHomicidios = years.map(y => ({ x: String(y), y: mendozaByYear[y].homicidios || 0 }));
  const seriesTasaTotal = years.map(y => ({ x: String(y), y: redondear(mendozaByYear[y].tasaSum || 0) }));
  const seriesTasaPais = years.map(y => ({ x: String(y), y: redondear(paisByYear[y]?.tasa || 0) }));

  // Apertura de "Otros delitos contra la propiedad" (categoría 21)
  const aperturaPropiedad = Object.entries(sub)
    .filter(([id]) => id.startsWith('21_'))
    .map(([, d]) => ({ id: d.nombre, value: d.hechos }))
    .sort((x, y) => y.value - x.value);

  // Top delitos en Mendoza último año
  const topDelitos = Object.entries(last.delitos || {})
    .map(([nombre, hechos]) => ({ id: nombre, Hechos: hechos }))
    .sort((a, b) => b.Hechos - a.Hechos)
    .slice(0, 8);

  const json = {
    meta: {
      id: 'seguridad-snic',
      title: `Seguridad Ciudadana — Mendoza (SNIC 2000-${lastYear})`,
      category: 'Seguridad',
      subcategory: 'SNIC Provincial',
      source: SOURCE,
      date: String(lastYear),
      scope: 'Provincia de Mendoza · SNIC. Los rankings comparan las 24 jurisdicciones del país.',
    },
    kpis: [
      { id: 'hechos-ult', label: `Hechos delictivos ${lastYear}`, value: totalHechos, formatted: fmtInt(totalHechos), comparison: variacionAnual != null ? `${signo(variacionAnual)} vs ${lastYear - 1}` : undefined, status: variacionAnual != null && variacionAnual < 0 ? 'good' : 'warning' },
      { id: 'tasa-total', label: `Tasa ${lastYear} cada 100 mil habitantes`, value: tasaTotal, formatted: fmtInt(tasaTotal), comparison: `Total país: ${fmtInt(paisByYear[lastYear].tasa)}` },
      { id: 'var-base', label: `Variación ${BASE_YEAR}-${lastYear}`, value: variacionBase, formatted: variacionBase != null ? signo(variacionBase) : '—', status: variacionBase != null && variacionBase < 0 ? 'good' : 'warning', comparison: `${fmtInt(baseYear.hechos)} hechos en ${BASE_YEAR}, antes de la pandemia` },
      { id: 'robos-hurtos', label: 'Robos y hurtos (% del total)', value: pctRobosHurtos, formatted: fmtPct(pctRobosHurtos), comparison: `${fmtInt(robosHurtos)} hechos` },
      { id: 'propiedad', label: 'Robos, hurtos y otros contra la propiedad (% del total)', value: pctPropiedad, formatted: fmtPct(pctPropiedad), comparison: `${fmtInt(propiedad)} hechos` },
      { id: 'homicidios', label: `Homicidios dolosos ${lastYear}`, value: homicidios, formatted: fmtInt(homicidios), status: 'critical', comparison: `Tasa: ${fmtDec(tasaHomicidios)} cada 100 mil · País: ${fmtDec(paisByYear[lastYear].hom)}` },
      { id: 'pos-tasa-pais', label: 'Posición por tasa de hechos', value: posMendozaTasa, formatted: `${posMendozaTasa}° de ${provRankTasa.length}`, comparison: '1° = tasa más alta' },
      { id: 'pos-hom', label: 'Posición por tasa de homicidios', value: posMendozaHom, formatted: posMendozaHom > 0 ? `${posMendozaHom}° de ${homRankTasa.length}` : '—', comparison: '1° = tasa más alta' },
      { id: 'estafas', label: `Estafas y defraudaciones ${lastYear}`, value: estafas, formatted: fmtInt(estafas), status: 'warning', comparison: `Dentro de otros delitos contra la propiedad · ${fmtInt(estafasVirtuales)} asistidas virtualmente` },
      // Víctimas mujeres en homicidios dolosos: dato confiable porque SNIC desagrega
      // por sexo SOLO en homicidios, muertes viales y suicidios. Sumar víctimas_fem
      // del total provincial es engañoso porque el resto va a `cantidad_victimas_sd`
      // (sin declarar) — verificado en auditoría 2026-05-06.
      { id: 'fem-homicidios', label: `Víctimas mujeres en homicidios ${lastYear}`, value: last.homFem || 0, formatted: fmtInt(last.homFem || 0), status: 'critical', comparison: last.homVictimas ? `${fmtInt(last.homMasc || 0)} varones · ${last.homVictimas} víctimas en ${last.homicidios} hechos` : undefined },
    ],
    charts: [
      {
        id: 'serie-hechos',
        type: 'line',
        title: `Hechos delictivos — Mendoza (2000-${lastYear})`,
        sectionId: 'panorama',
        data: [{ id: 'Hechos', data: seriesHechos }],
        config: { format: 'int' },
      },
      {
        id: 'serie-tasa-total',
        type: 'line',
        title: 'Tasa de hechos cada 100 mil habitantes — Mendoza y total país',
        sectionId: 'panorama',
        data: [
          { id: 'Mendoza', data: seriesTasaTotal },
          { id: 'Total país', data: seriesTasaPais },
        ],
        config: { format: 'int' },
      },
      {
        id: 'top-delitos',
        type: 'bar',
        title: `Principales delitos en Mendoza — ${lastYear}`,
        sectionId: 'delitos',
        data: topDelitos,
        config: { xAxis: 'id', layout: 'horizontal', format: 'int' },
      },
      {
        id: 'apertura-propiedad',
        type: 'pie',
        title: `Qué incluye "otros delitos contra la propiedad" — ${lastYear}`,
        sectionId: 'delitos',
        data: aperturaPropiedad,
        config: { total: otrosPropiedad, format: 'int' },
      },
      {
        id: 'serie-homicidios',
        type: 'line',
        title: `Homicidios dolosos — Mendoza (2000-${lastYear})`,
        sectionId: 'homicidios',
        data: [{ id: 'Homicidios', data: seriesHomicidios }],
        config: { format: 'int' },
      },
    ],
    rankings: [
      {
        id: 'rank-prov-tasa',
        title: `Jurisdicciones por tasa de hechos cada 100 mil (${lastYear})`,
        sectionId: 'provincias',
        items: provRankTasa.map(p => ({ name: p.name, value: p.value, municipioId: p.name === 'Mendoza' ? '50' : undefined })),
        order: 'desc',
        format: 'int',
      },
      {
        id: 'rank-prov-hom',
        title: `Jurisdicciones por tasa de homicidios cada 100 mil (${lastYear})`,
        sectionId: 'homicidios',
        items: homRankTasa.map(p => ({ name: p.name, value: p.value, municipioId: p.name === 'Mendoza' ? '50' : undefined })),
        order: 'desc',
        format: 'dec1',
      },
    ],
    mapData: buildFeatured(totalHechos, fmtInt(totalHechos), `Hechos delictivos en Mendoza ${lastYear}`),
  };
  writeJson(path.join(OUT_DIR, 'snic.json'), json);
  console.log(`  ✅ SNIC procesado: ${years.length} años, ${provNames.size} provincias`);
}

processSNIC();
