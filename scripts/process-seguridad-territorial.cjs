// ════════════════════════════════════════════════════════════════════
// process-seguridad-territorial.cjs — Dashboard Mendoza
// Genera 2 informes:
//   public/data/seguridad/departamentos.json  SNIC departamental
//   public/data/seguridad/viales.json         Muertes viales (SNIC-SAT)
//
// El panel departamental no repite categorías y subcategorías: sus filas se
// pueden sumar directamente. El provincial sí (ver process-seguridad.cjs).
// El total de ambos debe coincidir; si no, el script falla.
// ════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const {
  SEG_BASE,
  MENDOZA_DEPTOS,
  writeJson,
  fmtInt,
  fmtPct,
  fmtDec,
  buildFeatured,
} = require('./lib/mendoza-utils.cjs');

const OUT_DIR = path.join(__dirname, '..', 'public', 'data', 'seguridad');
const SOURCE_SNIC = 'Sistema Nacional de Información Criminal (SNIC) — Ministerio de Seguridad de la Nación';
const SOURCE_SAT = 'Sistema de Alerta Temprana de Muertes Viales (SNIC-SAT) — Ministerio de Seguridad de la Nación';
const SIN_DETERMINAR = '50999';
const NOMBRES = Object.fromEntries(MENDOZA_DEPTOS.map(d => [d.codigo, d.nombre]));

const DEP_FILE = path.join(
  SEG_BASE,
  'seguridad-snic-departamental-estadisticas-criminales-republica-argentina-por-departamentos',
  'estadísticas-criminales-en-la-república-argentina-por-departamentos-(panel)-(.csv).csv'
);
const PROV_FILE = path.join(
  SEG_BASE,
  'seguridad-snic-provincial-estadisticas-criminales-republica-argentina-por-provincias',
  'estadísticas-criminales-en-la-república-argentina-por-provincias-(panel)-(.csv).csv'
);
const VIALES_FILE = path.join(
  SEG_BASE,
  'seguridad-muertes-viales-sistema-alerta-temprana-estadisticas-criminales-republica-argentina',
  'hechos-y-víctimas-de-muertes-viales-en-la-república-argentina.-total-nacional-(panel)-(.csv).csv'
);

function readCsv(file, delimiter) {
  const content = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  return Papa.parse(content, { header: true, skipEmptyLines: true, delimiter }).data;
}

const num = v => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const esMendoza = r => String(r.provincia_id).padStart(2, '0') === '50';

function ranking(valores, order = 'desc') {
  return Object.entries(valores)
    .filter(([codigo]) => NOMBRES[codigo])
    .map(([codigo, value]) => ({ name: NOMBRES[codigo], municipioId: codigo, value }))
    .sort((a, b) => (order === 'desc' ? b.value - a.value : a.value - b.value));
}

function mapa(valores) {
  return Object.entries(valores)
    .filter(([codigo]) => NOMBRES[codigo])
    .map(([id, value]) => ({ id, value }));
}

// ════════════════════════════════════════════════════════════════════
// SNIC por departamento
// ════════════════════════════════════════════════════════════════════
function processDepartamentos(provincial) {
  console.log('\n─── SNIC por departamento ───');
  const rows = readCsv(DEP_FILE, ';').filter(esMendoza);
  const lastYear = Math.max(...rows.map(r => +r.anio));

  const hechos = {};
  const tasas = {};
  const homicidios = {};
  const robosHurtosTasa = {};
  const tasaPorAnio = {};
  let total = 0;

  for (const r of rows) {
    const id = String(r.departamento_id);
    const year = +r.anio;
    const h = num(r.cantidad_hechos);
    const t = num(r.tasa_hechos);
    if (!tasaPorAnio[id]) tasaPorAnio[id] = {};
    tasaPorAnio[id][year] = (tasaPorAnio[id][year] || 0) + t;
    if (year !== lastYear) continue;
    total += h;
    hechos[id] = (hechos[id] || 0) + h;
    tasas[id] = (tasas[id] || 0) + t;
    if (r.codigo_delito_snic_nombre === 'Homicidios dolosos') homicidios[id] = (homicidios[id] || 0) + h;
    if (/^Robos \(excluye|^Hurtos$/.test(r.codigo_delito_snic_nombre)) robosHurtosTasa[id] = (robosHurtosTasa[id] || 0) + t;
  }

  if (total !== provincial[lastYear]) {
    throw new Error(`El panel departamental suma ${total} en ${lastYear} y el provincial ${provincial[lastYear]}`);
  }

  const rankTasa = ranking(tasas);
  const rankHechos = ranking(hechos);
  const rankRobos = ranking(robosHurtosTasa);
  const rankHom = ranking(homicidios);
  const sinDeterminar = hechos[SIN_DETERMINAR] || 0;
  const concentracion = rankHechos.slice(0, 5).reduce((acc, r) => acc + r.value, 0);

  // Series de los 5 departamentos con más hechos
  const years = [...new Set(rows.map(r => +r.anio))].sort((a, b) => a - b);
  const series = rankHechos.slice(0, 5).map(r => ({
    id: r.name,
    data: years.map(y => ({ x: String(y), y: Math.round((tasaPorAnio[r.municipioId][y] || 0) * 10) / 10 })),
  }));

  const homTotales = Object.values(homicidios).reduce((a, b) => a + b, 0);

  writeJson(path.join(OUT_DIR, 'departamentos.json'), {
    meta: {
      id: 'seguridad-departamentos',
      title: `Seguridad por departamento — Mendoza (SNIC ${lastYear})`,
      category: 'Seguridad',
      subcategory: 'SNIC departamental',
      source: SOURCE_SNIC,
      date: String(lastYear),
      scope: 'Provincia de Mendoza · SNIC departamental. Los rankings y mapas comparan los 18 departamentos.',
    },
    kpis: [
      { id: 'hechos', label: `Hechos registrados ${lastYear}`, value: total, formatted: fmtInt(total), comparison: `${fmtInt(sinDeterminar)} sin departamento determinado` },
      { id: 'tasa-max', label: 'Mayor tasa cada 100 mil', value: rankTasa[0].value, formatted: fmtInt(rankTasa[0].value), comparison: rankTasa[0].name },
      { id: 'tasa-min', label: 'Menor tasa cada 100 mil', value: rankTasa[17].value, formatted: fmtInt(rankTasa[17].value), comparison: rankTasa[17].name },
      { id: 'hechos-max', label: 'Departamento con más hechos', value: rankHechos[0].value, formatted: fmtInt(rankHechos[0].value), comparison: rankHechos[0].name },
      { id: 'concentracion', label: 'Hechos en los 5 departamentos con más casos', value: (concentracion / total) * 100, formatted: fmtPct((concentracion / total) * 100), comparison: rankHechos.slice(0, 5).map(r => r.name).join(', ') },
      { id: 'homicidios', label: `Homicidios dolosos ${lastYear}`, value: homTotales, formatted: fmtInt(homTotales), status: 'critical', comparison: `${rankHom.filter(r => r.value === 0).length} departamentos sin casos` },
    ],
    charts: [
      {
        id: 'mapa-tasa',
        type: 'map',
        title: `Mapa: hechos cada 100 mil habitantes (${lastYear})`,
        sectionId: 'tasas',
        data: mapa(tasas),
        config: { format: 'int', unit: 'cada 100 mil' },
      },
      {
        id: 'serie-tasa',
        type: 'line',
        title: 'Tasa de hechos cada 100 mil: los 5 departamentos con más casos',
        sectionId: 'tendencia',
        data: series,
        config: { format: 'int' },
      },
      {
        id: 'mapa-robos',
        type: 'map',
        title: `Mapa: robos y hurtos cada 100 mil habitantes (${lastYear})`,
        sectionId: 'propiedad',
        data: mapa(robosHurtosTasa),
        config: { format: 'int', unit: 'cada 100 mil' },
      },
    ],
    rankings: [
      { id: 'rank-tasa', title: `Departamentos por tasa de hechos cada 100 mil (${lastYear})`, sectionId: 'tasas', items: rankTasa, order: 'desc', format: 'int' },
      { id: 'rank-hechos', title: `Departamentos por cantidad de hechos (${lastYear})`, sectionId: 'cantidad', items: rankHechos, order: 'desc', format: 'int', unit: 'hechos' },
      { id: 'rank-robos', title: `Departamentos por robos y hurtos cada 100 mil (${lastYear})`, sectionId: 'propiedad', items: rankRobos, order: 'desc', format: 'int' },
      { id: 'rank-hom', title: `Departamentos por homicidios dolosos (${lastYear})`, sectionId: 'homicidios', items: rankHom, order: 'desc', format: 'int', unit: 'casos' },
    ],
    mapData: buildFeatured(rankTasa[0].value, fmtInt(rankTasa[0].value), `Hechos cada 100 mil en ${rankTasa[0].name}, la tasa más alta`),
  });
}

// ════════════════════════════════════════════════════════════════════
// Muertes viales
// ════════════════════════════════════════════════════════════════════
function processViales(poblacionPorProvincia, poblacionDepto) {
  console.log('\n─── Muertes viales ───');
  const victimas = readCsv(VIALES_FILE, ';').filter(r => r.tipo_persona === 'Víctima');
  const mendoza = victimas.filter(esMendoza);
  const years = [...new Set(victimas.map(r => +r.anio))].sort((a, b) => a - b);
  const lastYear = years[years.length - 1];

  const contar = (filas, campo) => filas.reduce((acc, r) => {
    const clave = (r[campo] || 'Sin determinar').trim() || 'Sin determinar';
    acc[clave] = (acc[clave] || 0) + 1;
    return acc;
  }, {});

  const porAnioMza = contar(mendoza, 'anio');
  const porAnioPais = contar(victimas, 'anio');
  const pobPais = y => Object.values(poblacionPorProvincia[y]).reduce((a, b) => a + b, 0);
  const pobMza = y => poblacionPorProvincia[y].Mendoza;
  const tasaMza = y => (porAnioMza[y] / pobMza(y)) * 100000;
  const tasaPais = y => (porAnioPais[y] / pobPais(y)) * 100000;

  // Control contra el informe oficial 2017-2023 del SNIC-SAT.
  const oficial = { 2021: 5.52, 2022: 5.86, 2023: 5.81 };
  for (const [y, tasa] of Object.entries(oficial)) {
    if (Math.abs(tasaMza(y) - tasa) > 0.05) throw new Error(`Tasa vial ${y}: ${tasaMza(y)} vs oficial ${tasa}`);
  }

  // Ranking de provincias, último año
  const provUlt = contar(victimas.filter(r => +r.anio === lastYear), 'provincia_nombre');
  const rankProv = Object.entries(provUlt)
    .map(([name, n]) => ({ name, value: (n / poblacionPorProvincia[lastYear][name]) * 100000, municipioId: name === 'Mendoza' ? '50' : undefined }))
    .sort((a, b) => b.value - a.value);
  const posMza = rankProv.findIndex(p => p.name === 'Mendoza') + 1;

  // Departamentos, 2017-último año
  const porDepto = mendoza.reduce((acc, r) => {
    const id = String(r.departamento_id);
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});
  const sinDeterminar = porDepto[SIN_DETERMINAR] || 0;
  const tasaDepto = Object.fromEntries(Object.entries(porDepto)
    .filter(([id]) => NOMBRES[id])
    .map(([id, n]) => [id, (n / poblacionDepto[id]) * 100000]));

  const sexo = contar(mendoza, 'victima_sexo');
  const vehiculo = contar(mendoza, 'victima_vehiculo');
  const clase = contar(mendoza, 'victima_clase');
  const orden = obj => Object.entries(obj).sort((a, b) => b[1] - a[1]);
  const total = mendoza.length;
  const varones = sexo.Masculino || 0;
  const mujeres = sexo.Femenino || 0;

  const seriesTasas = [
    { id: 'Mendoza', data: years.map(y => ({ x: String(y), y: Math.round(tasaMza(y) * 100) / 100 })) },
    { id: 'Total país', data: years.map(y => ({ x: String(y), y: Math.round(tasaPais(y) * 100) / 100 })) },
  ];
  const seriesVictimas = [{ id: 'Víctimas', data: years.map(y => ({ x: String(y), y: porAnioMza[y] })) }];

  writeJson(path.join(OUT_DIR, 'viales.json'), {
    meta: {
      id: 'seguridad-viales',
      title: `Muertes viales — Mendoza (${years[0]}-${lastYear})`,
      category: 'Seguridad',
      subcategory: 'Muertes viales',
      source: SOURCE_SAT,
      date: String(lastYear),
      scope: `Provincia de Mendoza · SNIC-SAT, ${years[0]}-${lastYear}. Los rankings comparan las 24 jurisdicciones y los 18 departamentos.`,
    },
    kpis: [
      { id: 'victimas-ult', label: `Víctimas fatales ${lastYear}`, value: porAnioMza[lastYear], formatted: fmtInt(porAnioMza[lastYear]), status: 'critical', comparison: `${fmtInt(porAnioMza[years[0]])} en ${years[0]}` },
      { id: 'tasa-ult', label: `Tasa ${lastYear} cada 100 mil habitantes`, value: tasaMza(lastYear), formatted: fmtDec(tasaMza(lastYear), 2), comparison: `Total país: ${fmtDec(tasaPais(lastYear), 2)}` },
      { id: 'posicion', label: 'Posición por tasa', value: posMza, formatted: `${posMza}° de ${rankProv.length}`, comparison: '1° = tasa más alta' },
      { id: 'acumulado', label: `Víctimas ${years[0]}-${lastYear}`, value: total, formatted: fmtInt(total), comparison: `${fmtInt(sinDeterminar)} sin departamento determinado` },
      { id: 'varones', label: 'Víctimas varones', value: (varones / total) * 100, formatted: fmtPct((varones / total) * 100), comparison: `${fmtInt(varones)} varones · ${fmtInt(mujeres)} mujeres` },
    ],
    charts: [
      { id: 'serie-victimas', type: 'line', title: `Víctimas fatales por año — Mendoza`, sectionId: 'tendencia', data: seriesVictimas, config: { format: 'int' } },
      { id: 'serie-tasa', type: 'line', title: 'Tasa cada 100 mil habitantes — Mendoza y total país', sectionId: 'pais', data: seriesTasas, config: { format: 'dec1' } },
      { id: 'mapa-deptos', type: 'map', title: `Mapa: víctimas ${years[0]}-${lastYear} cada 100 mil habitantes`, sectionId: 'departamentos', data: mapa(tasaDepto), config: { format: 'dec1', unit: 'cada 100 mil' } },
      { id: 'clase-victima', type: 'pie', title: 'Víctimas por tipo de usuario de la vía', sectionId: 'victimas', data: orden(clase).map(([id, value]) => ({ id, value })), config: { total, format: 'int' } },
      { id: 'vehiculo-victima', type: 'bar', title: 'Víctimas por vehículo', sectionId: 'victimas', data: orden(vehiculo).slice(0, 8).map(([id, Victimas]) => ({ id, Víctimas: Victimas })), config: { xAxis: 'id', layout: 'horizontal', format: 'int' } },
    ],
    rankings: [
      { id: 'rank-prov', title: `Jurisdicciones por tasa cada 100 mil (${lastYear})`, sectionId: 'pais', items: rankProv, order: 'desc', format: 'dec1' },
      { id: 'rank-deptos', title: `Departamentos por cantidad de víctimas (${years[0]}-${lastYear})`, sectionId: 'departamentos', items: ranking(porDepto), order: 'desc', format: 'int', unit: 'víctimas' },
    ],
    mapData: buildFeatured(porAnioMza[lastYear], fmtInt(porAnioMza[lastYear]), `Víctimas fatales en siniestros viales ${lastYear}`),
  });

  console.log('  por año', JSON.stringify(porAnioMza));
  console.log('  tasas', years.map(y => `${y}:${tasaMza(y).toFixed(2)}/${tasaPais(y).toFixed(2)}`).join(' '));
  console.log('  sexo', JSON.stringify(sexo));
  console.log('  clase', JSON.stringify(orden(clase)));
  console.log('  vehiculo', JSON.stringify(orden(vehiculo)));
  console.log('  lugar', JSON.stringify(orden(contar(mendoza, 'tipo_lugar')).slice(0, 8)));
}

function main() {
  // Panel provincial: total por año (solo categorías) y población implícita.
  const provinciales = readCsv(PROV_FILE, ',');
  const totalMendoza = {};
  const poblacion = {};
  for (const r of provinciales) {
    if (String(r.codigo_delito_snic_id).includes('_')) continue;
    if (esMendoza(r)) totalMendoza[+r.anio] = (totalMendoza[+r.anio] || 0) + num(r.cantidad_hechos);
    if (r.codigo_delito_snic_nombre === 'Lesiones dolosas' && num(r.tasa_hechos) > 0) {
      if (!poblacion[+r.anio]) poblacion[+r.anio] = {};
      poblacion[+r.anio][r.provincia_nombre] = (num(r.cantidad_hechos) / num(r.tasa_hechos)) * 100000;
    }
  }
  processDepartamentos(totalMendoza);

  const estructura = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'data', 'poblacion', 'estructura.json'), 'utf8'));
  const poblacionDepto = Object.fromEntries(estructura.charts.find(c => c.id === 'mapa-poblacion').data.map(d => [d.id, d.value]));
  processViales(poblacion, poblacionDepto);
  console.log('\n  ✅ Informes territoriales de seguridad generados');
}

main();
