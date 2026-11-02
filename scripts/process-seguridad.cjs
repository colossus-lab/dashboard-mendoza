// ════════════════════════════════════════════════════════════════════
// process-seguridad.cjs — Dashboard Mendoza
// Procesa SNIC provincial 2000–2024 (Ministerio de Seguridad de la Nación).
// Genera 1 informe: SNIC para Mendoza con comparativa contra 24 jurisdicciones.
//
// La serie tiene rupturas: 21 categorías aparecen en 2017 y 9 en 2023. Por eso
// se publica también una serie de "categorías comparables" (las que ya tenían
// datos antes de 2017) y los gráficos marcan esos años.
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

const SNIC_FILE = path.join(
  SEG_BASE,
  'seguridad-snic-provincial-estadisticas-criminales-republica-argentina-por-provincias',
  'estadísticas-criminales-en-la-república-argentina-por-provincias-(panel)-(.csv).csv'
);
const SNIC_PAIS_FILE = path.join(
  SEG_BASE,
  'seguridad-snic-total-pais-estadisticas-criminales-republica-argentina',
  'estadísticas-criminales-en-la-república-argentina-(panel)-(.csv).csv'
);
const OUT_DIR = path.join(__dirname, '..', 'public', 'data', 'seguridad');

const MENDOZA_PROV_ID = '50';
const SOURCE = 'Sistema Nacional de Información Criminal (SNIC) — Ministerio de Seguridad de la Nación';
const ANOTACIONES = [
  { x: '2017', label: '2017: nuevas categorías' },
  { x: '2023', label: '2023: nuevas categorías' },
];

function readCsv(file) {
  const content = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true, delimiter: ',' });
  return parsed.data;
}

function num(v) {
  if (v == null || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function signo(v) {
  return `${v >= 0 ? '+' : ''}${fmtDec(v)} %`;
}

function processSNIC() {
  console.log('\n─── SNIC Provincial ───');
  console.log('Leyendo:', SNIC_FILE);
  const rows = readCsv(SNIC_FILE);
  console.log(`  ${rows.length} filas leídas`);

  // Agregaciones:
  //   mendozaByYear: { year → { hechos, victimas, masc, fem, delitos: {} } }
  //   provByYear:    { provNombre → { year → { hechos, tasa } } }
  //   homByYear:     { provNombre → { year → tasaHomicidios } }
  const mendozaByYear = {};
  const provByYear = {};
  const homByYear = {};
  const provNames = new Set();

  for (const r of rows) {
    const provId = r.provincia_id ? String(r.provincia_id).padStart(2, '0') : null;
    const provNombre = r.provincia_nombre;
    const year = parseInt(r.anio, 10);
    if (!year || !provNombre) continue;
    const delito = r.codigo_delito_snic_nombre;
    const hechos = num(r.cantidad_hechos);
    const victimas = num(r.cantidad_victimas);
    const masc = num(r.cantidad_victimas_masc);
    const fem = num(r.cantidad_victimas_fem);
    const tasa = num(r.tasa_hechos);

    provNames.add(provNombre);

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
    provByYear[provNombre][year].tasa += tasa;

    if (/^Homicidios dolosos$/.test(delito)) {
      if (!homByYear[provNombre]) homByYear[provNombre] = {};
      homByYear[provNombre][year] = tasa;
    }
  }

  const years = Object.keys(mendozaByYear).map(Number).sort((a, b) => a - b);
  const lastYear = years[years.length - 1];
  const last = mendozaByYear[lastYear] || {};
  const prev = mendozaByYear[lastYear - 1] || {};
  const fiveYearsAgo = mendozaByYear[lastYear - 5] || {};

  const delitoEnAnio = (year, patron) => Object.entries(mendozaByYear[year]?.delitos || {})
    .filter(([nombre]) => patron.test(nombre))
    .reduce((acc, [, hechos]) => acc + hechos, 0);

  // Rupturas de serie: primer año con hechos > 0 por categoría.
  const primerAnio = {};
  for (const y of years) {
    for (const [nombre, hechos] of Object.entries(mendozaByYear[y].delitos)) {
      if (hechos > 0 && primerAnio[nombre] == null) primerAnio[nombre] = y;
    }
  }
  const CORTE_COMPARABLE = 2017;
  const comparables = Object.keys(primerAnio).filter(nombre => primerAnio[nombre] < CORTE_COMPARABLE);
  const hechosComparables = y => comparables.reduce((acc, nombre) => acc + (mendozaByYear[y]?.delitos[nombre] || 0), 0);
  const nuevas = corte => Object.keys(primerAnio).filter(nombre => primerAnio[nombre] === corte);
  const hechosNuevos2023 = nuevas(2023).reduce((acc, nombre) => acc + (last.delitos[nombre] || 0), 0);
  console.log(`  Categorías: comparables=${comparables.length} · nuevas 2017=${nuevas(2017).length} · nuevas 2023=${nuevas(2023).length}`);

  const variacionAnual = prev.hechos ? ((last.hechos - prev.hechos) / prev.hechos) * 100 : null;
  const variacion5y = fiveYearsAgo.hechos ? ((last.hechos - fiveYearsAgo.hechos) / fiveYearsAgo.hechos) * 100 : null;
  const baseComparable = hechosComparables(lastYear - 5);
  const variacion5yComparable = baseComparable ? ((hechosComparables(lastYear) - baseComparable) / baseComparable) * 100 : null;

  const totalHechos = last.hechos || 0;
  const homicidios = last.homicidios || 0;
  const tasaHomicidios = last.homicidiosTasa || 0;
  const robos = delitoEnAnio(lastYear, /^Robos \(excluye/);
  const hurtos = delitoEnAnio(lastYear, /^Hurtos$/);
  const otrosPropiedad = delitoEnAnio(lastYear, /^Otros delitos contra la propiedad$/);
  const estafas = delitoEnAnio(lastYear, /Estafas y defraudaciones/i);
  const estafasVirtuales = delitoEnAnio(lastYear, /asistidas virtualmente/i);
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
    if (!y) continue;
    if (!paisByYear[y]) paisByYear[y] = { tasa: 0, hom: 0 };
    paisByYear[y].tasa += num(r.tasa_hechos);
    if (/^Homicidios dolosos$/.test(r.codigo_delito_snic_nombre)) paisByYear[y].hom = num(r.tasa_hechos);
  }
  if (!paisByYear[lastYear]) throw new Error(`El panel total país no tiene datos de ${lastYear}`);

  // Series temporales para Mendoza
  const redondear = v => Math.round(v * 10) / 10;
  const seriesHechos = years.map(y => ({ x: String(y), y: mendozaByYear[y].hechos || 0 }));
  const seriesComparables = years.map(y => ({ x: String(y), y: hechosComparables(y) }));
  const seriesHomicidios = years.map(y => ({ x: String(y), y: mendozaByYear[y].homicidios || 0 }));
  const seriesTasaTotal = years.map(y => ({ x: String(y), y: redondear(mendozaByYear[y].tasaSum || 0) }));
  const seriesTasaPais = years.map(y => ({ x: String(y), y: redondear(paisByYear[y]?.tasa || 0) }));

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
      { id: 'var-5y', label: `Variación ${lastYear - 5}-${lastYear}, todas las categorías`, value: variacion5y, formatted: variacion5y != null ? signo(variacion5y) : '—', status: 'warning', comparison: variacion5yComparable != null ? `${signo(variacion5yComparable)} en categorías comparables` : undefined },
      { id: 'robos-hurtos', label: 'Robos y hurtos (% del total)', value: pctRobosHurtos, formatted: fmtPct(pctRobosHurtos), comparison: `${fmtInt(robosHurtos)} hechos` },
      { id: 'propiedad', label: 'Robos, hurtos y otros contra la propiedad (% del total)', value: pctPropiedad, formatted: fmtPct(pctPropiedad), comparison: `${fmtInt(propiedad)} hechos` },
      { id: 'homicidios', label: `Homicidios dolosos ${lastYear}`, value: homicidios, formatted: fmtInt(homicidios), status: 'critical', comparison: `Tasa: ${fmtDec(tasaHomicidios)} cada 100 mil · País: ${fmtDec(paisByYear[lastYear].hom)}` },
      { id: 'pos-tasa-pais', label: 'Posición por tasa de hechos', value: posMendozaTasa, formatted: `${posMendozaTasa}° de ${provRankTasa.length}`, comparison: '1° = tasa más alta' },
      { id: 'pos-hom', label: 'Posición por tasa de homicidios', value: posMendozaHom, formatted: posMendozaHom > 0 ? `${posMendozaHom}° de ${homRankTasa.length}` : '—', comparison: '1° = tasa más alta' },
      { id: 'estafas', label: `Estafas y defraudaciones ${lastYear}`, value: estafas, formatted: fmtInt(estafas), status: 'warning', comparison: `${fmtInt(estafasVirtuales)} asistidas virtualmente · categoría nueva en 2023` },
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
        data: [
          { id: 'Todas las categorías', data: seriesHechos },
          { id: 'Categorías comparables', data: seriesComparables },
        ],
        config: { format: 'int', annotations: ANOTACIONES },
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
        config: { format: 'int', annotations: ANOTACIONES },
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
  console.log(`  Nuevas 2023 en ${lastYear}: ${fmtInt(hechosNuevos2023)} hechos · var comparable ${fmtDec(variacion5yComparable)}%`);
  console.log(`  ✅ SNIC procesado: ${years.length} años, ${provNames.size} provincias`);
}

processSNIC();
