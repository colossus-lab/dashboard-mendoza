// ════════════════════════════════════════════════════════════════════
// build-landing.cjs — Dashboard Mendoza
// Fuente única de las cifras de la portada: se derivan de los JSON ya
// generados, para que ningún número quede escrito a mano en el frontend.
//
// Output: src/data/generated/landing.json
// ════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const { ROOT, writeJson, fmtInt, fmtDec, fmtPct } = require('./lib/mendoza-utils.cjs');

const readData = rel => JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'data', rel), 'utf8'));

function kpi(report, id) {
  const found = report.kpis.find(k => k.id === id);
  if (!found) throw new Error(`Falta el KPI ${id} en ${report.meta.id}`);
  return found.formatted;
}

const REPORTS = {
  'poblacion-estructura': ['poblacion/estructura.json', r => `${kpi(r, 'pob-2022')} habitantes`],
  'poblacion-habitacional-personas': ['poblacion/habitacional-personas.json', r => `${kpi(r, 'cloaca')} con cloaca`],
  'poblacion-salud-prevision': ['poblacion/salud-prevision.json', r => `${kpi(r, 'sin-cobertura')} sin cobertura`],
  'poblacion-hogares': ['poblacion/hogares.json', r => `${kpi(r, 'total-hogares')} hogares`],
  'poblacion-viviendas': ['poblacion/viviendas.json', r => `${kpi(r, 'total-viviendas')} viviendas`],
  'poblacion-educacion': ['poblacion/educacion.json', r => `${kpi(r, 'pct-asiste')} asiste`],
  'poblacion-actividad-economica': ['poblacion/actividad-economica.json', r => `${kpi(r, 'tasa-desocupacion')} desocupación`],
  'poblacion-fecundidad': ['poblacion/fecundidad.json', r => `${kpi(r, 'promedio-hijos')} hijos por mujer`],
  'seguridad-snic': ['seguridad/snic.json', r => `${kpi(r, 'pos-tasa-pais')} en tasa de hechos`],
};

const miniStats = {};
for (const [id, [file, build]] of Object.entries(REPORTS)) {
  if (fs.existsSync(path.join(ROOT, 'public', 'data', file))) {
    miniStats[id] = build(readData(file));
  }
}

const resumen = readData('resumen.json');

writeJson(path.join(ROOT, 'src', 'data', 'generated', 'landing.json'), {
  poblacion: resumen.poblacion,
  poblacionFmt: fmtInt(resumen.poblacion),
  variacion2010Fmt: fmtPct(resumen.variacion2010),
  superficieFmt: fmtInt(resumen.superficieKm2),
  densidadFmt: fmtDec(resumen.densidad),
  departamentos: resumen.departamentos,
  viviendasFmt: fmtInt(resumen.viviendas),
  viviendasParticularesFmt: fmtInt(resumen.viviendasParticulares),
  viviendasColectivasFmt: fmtInt(resumen.viviendasColectivas),
  hogaresFmt: fmtInt(resumen.hogares),
  miniStats,
});
