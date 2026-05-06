// ════════════════════════════════════════════════════════════════════
// process-seguridad.cjs — Dashboard Mendoza
// Procesa SNIC provincial 2000–2024 (Ministerio de Seguridad de la Nación).
// Genera 1 informe: SNIC para Mendoza con comparativa contra 24 provincias.
//
// Output: public/data/seguridad/snic.json
// ════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const {
  SEG_BASE,
  MENDOZA,
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
const OUT_DIR = path.join(__dirname, '..', 'public', 'data', 'seguridad');
const DATE = new Date().toISOString().slice(0, 10);

const MENDOZA_PROV_ID = '50';

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

function processSNIC() {
  console.log('\n─── SNIC Provincial (2000-2024) ───');
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
      if (!mendozaByYear[year]) mendozaByYear[year] = { hechos: 0, victimas: 0, masc: 0, fem: 0, tasaSum: 0, delitos: {} };
      mendozaByYear[year].hechos += hechos;
      mendozaByYear[year].victimas += victimas;
      mendozaByYear[year].masc += masc;
      mendozaByYear[year].fem += fem;
      mendozaByYear[year].tasaSum += tasa;
      mendozaByYear[year].delitos[delito] = (mendozaByYear[year].delitos[delito] || 0) + hechos;
      if (/^Homicidios dolosos$/.test(delito)) {
        mendozaByYear[year].homicidios = hechos;
        mendozaByYear[year].homicidiosTasa = tasa;
      }
      if (/^Robos \(excluye/.test(delito)) {
        mendozaByYear[year].robos = (mendozaByYear[year].robos || 0) + hechos;
      }
      if (/Hurto/i.test(delito)) {
        mendozaByYear[year].hurtos = (mendozaByYear[year].hurtos || 0) + hechos;
      }
      if (/Estafas y defraudaciones/i.test(delito)) {
        mendozaByYear[year].estafas = (mendozaByYear[year].estafas || 0) + hechos;
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

  const variacionAnual = prev.hechos ? ((last.hechos - prev.hechos) / prev.hechos) * 100 : null;
  const variacion5y = fiveYearsAgo.hechos ? ((last.hechos - fiveYearsAgo.hechos) / fiveYearsAgo.hechos) * 100 : null;
  const totalHechos = last.hechos || 0;
  const homicidios = last.homicidios || 0;
  const tasaHomicidios = last.homicidiosTasa || 0;
  const robos = last.robos || 0;
  const hurtos = last.hurtos || 0;
  const estafas = last.estafas || 0;
  const patrimoniales = robos + hurtos;
  const pctPatrimoniales = totalHechos ? (patrimoniales / totalHechos) * 100 : null;
  const pctMujeres = last.victimas ? (last.fem / last.victimas) * 100 : null;
  const tasaTotal = last.tasaSum || 0;

  // Ranking de provincias por tasa de hechos último año
  const provRankTasa = Object.entries(provByYear)
    .map(([nombre, byYr]) => ({
      name: nombre,
      value: byYr[lastYear]?.tasa || 0,
    }))
    .filter(p => p.value > 0)
    .sort((a, b) => b.value - a.value);

  const posMendozaTasa = provRankTasa.findIndex(p => p.name === 'Mendoza') + 1;

  // Ranking por tasa de homicidios
  const homRankTasa = Object.entries(homByYear)
    .map(([nombre, byYr]) => ({ name: nombre, value: byYr[lastYear] || 0 }))
    .filter(p => p.value > 0)
    .sort((a, b) => b.value - a.value);
  const posMendozaHom = homRankTasa.findIndex(p => p.name === 'Mendoza') + 1;

  // Series temporales para Mendoza
  const seriesHechos = years.map(y => ({ x: String(y), y: mendozaByYear[y].hechos || 0 }));
  const seriesHomicidios = years.map(y => ({ x: String(y), y: mendozaByYear[y].homicidios || 0 }));
  const seriesTasaTotal = years.map(y => ({ x: String(y), y: Math.round((mendozaByYear[y].tasaSum || 0) * 10) / 10 }));

  // Promedio nacional por año (de todas las provincias)
  const seriesPromPais = years.map(y => {
    let sum = 0, n = 0;
    for (const prov of Object.keys(provByYear)) {
      if (provByYear[prov][y]) { sum += provByYear[prov][y].tasa; n++; }
    }
    return { x: String(y), y: n ? Math.round((sum / n) * 10) / 10 : 0 };
  });

  // Top 5 delitos en Mendoza último año
  const topDelitos = Object.entries(last.delitos || {})
    .map(([nombre, hechos]) => ({ id: nombre.length > 35 ? nombre.slice(0, 33) + '…' : nombre, value: hechos }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const json = {
    meta: {
      id: 'seguridad-snic',
      title: `Seguridad Ciudadana — Mendoza (SNIC 2000-${lastYear})`,
      category: 'Seguridad',
      subcategory: 'SNIC Provincial',
      source: 'Sistema Nacional de Información Criminal (SNIC) — Ministerio de Seguridad de la Nación',
      date: DATE,
    },
    kpis: [
      { id: 'hechos-ult', label: `Hechos delictivos ${lastYear}`, value: totalHechos, formatted: fmtInt(totalHechos), comparison: variacionAnual != null ? `${variacionAnual >= 0 ? '+' : ''}${fmtDec(variacionAnual)}% vs ${lastYear - 1}` : undefined, status: variacionAnual != null && variacionAnual < 0 ? 'good' : 'warning' },
      { id: 'tasa-total', label: `Tasa total ${lastYear} (/100K hab)`, value: tasaTotal, formatted: fmtDec(tasaTotal) + ' / 100K' },
      { id: 'var-5y', label: `Variación 5 años (${lastYear - 5}→${lastYear})`, value: variacion5y, formatted: variacion5y != null ? `${variacion5y >= 0 ? '+' : ''}${fmtDec(variacion5y)}%` : '—', status: variacion5y != null && variacion5y < 0 ? 'good' : 'warning' },
      { id: 'patrimoniales', label: '% Delitos patrimoniales', value: pctPatrimoniales, formatted: fmtPct(pctPatrimoniales), comparison: `${fmtInt(patrimoniales)} robos + hurtos` },
      { id: 'homicidios', label: `Homicidios dolosos ${lastYear}`, value: homicidios, formatted: fmtInt(homicidios), status: 'critical', comparison: `Tasa: ${fmtDec(tasaHomicidios)} / 100K` },
      { id: 'pos-tasa-pais', label: 'Posición tasa hechos vs provincias', value: posMendozaTasa, formatted: `${posMendozaTasa}° de ${provRankTasa.length}`, comparison: 'Posiciones más altas = mayor tasa' },
      { id: 'pos-hom', label: 'Posición tasa homicidios', value: posMendozaHom, formatted: posMendozaHom > 0 ? `${posMendozaHom}° de ${homRankTasa.length}` : '—' },
      { id: 'estafas', label: `Estafas y defraudaciones ${lastYear}`, value: estafas, formatted: fmtInt(estafas), status: 'warning' },
      { id: 'victimas-fem', label: `Víctimas mujeres ${lastYear}`, value: last.fem || 0, formatted: fmtInt(last.fem || 0), comparison: pctMujeres != null ? `${fmtPct(pctMujeres)} del total · ${fmtInt(last.masc || 0)} varones` : undefined },
    ],
    charts: [
      {
        id: 'serie-hechos',
        type: 'line',
        title: `Evolución de hechos delictivos totales — Mendoza (2000-${lastYear})`,
        sectionId: 'panorama',
        data: [{ id: 'Hechos', data: seriesHechos }],
      },
      {
        id: 'serie-tasa-total',
        type: 'line',
        title: `Tasa de hechos cada 100K — Mendoza vs promedio país`,
        sectionId: 'panorama',
        data: [
          { id: 'Mendoza', data: seriesTasaTotal },
          { id: 'Promedio país', data: seriesPromPais },
        ],
      },
      {
        id: 'serie-homicidios',
        type: 'line',
        title: `Homicidios dolosos — Mendoza (2000-${lastYear})`,
        sectionId: 'homicidios',
        data: [{ id: 'Homicidios', data: seriesHomicidios }],
      },
      {
        id: 'top-delitos',
        type: 'bar',
        title: `Top delitos en Mendoza — ${lastYear}`,
        sectionId: 'delitos',
        data: topDelitos.map(d => ({ id: d.id, Hechos: d.value })),
        config: { xAxis: 'id', layout: 'horizontal' },
      },
      {
        id: 'rank-prov-tasa',
        type: 'bar',
        title: `Tasa de hechos por provincia — ${lastYear}`,
        sectionId: 'provincias',
        data: provRankTasa.slice(0, 24).map(p => ({ id: p.name.length > 22 ? p.name.slice(0, 20) + '…' : p.name, 'Tasa /100K': p.value })),
        config: { xAxis: 'id', layout: 'horizontal' },
      },
    ],
    rankings: [
      {
        id: 'rank-prov-tasa',
        title: `Provincias por tasa de hechos delictivos /100K (${lastYear})`,
        sectionId: 'provincias',
        items: provRankTasa.map(p => ({ name: p.name, value: p.value, municipioId: p.name === 'Mendoza' ? '50' : undefined })),
        order: 'desc',
      },
      {
        id: 'rank-prov-hom',
        title: `Provincias por tasa de homicidios /100K (${lastYear})`,
        sectionId: 'provincias',
        items: homRankTasa.map(p => ({ name: p.name, value: p.value, municipioId: p.name === 'Mendoza' ? '50' : undefined })),
        order: 'desc',
      },
    ],
    mapData: buildFeatured(totalHechos, fmtInt(totalHechos), `Hechos delictivos en Mendoza ${lastYear}`),
  };
  writeJson(path.join(OUT_DIR, 'snic.json'), json);
  console.log(`  ✅ SNIC procesado: ${years.length} años, ${provNames.size} provincias`);
}

processSNIC();
