// Baja las bases del Ministerio de Seguridad de la Nación a Seguridad/ (no se
// commitea). Fuente: https://www.argentina.gob.ar/seguridad/estadisticascriminales/bases-de-datos
//
// Uso: npm run download-seguridad

const fs = require('fs');
const path = require('path');
const { SEG_BASE } = require('./lib/mendoza-utils.cjs');

const BASE = 'https://cloud-snic.minseg.gob.ar/Bases';
const FILES = [
  `${BASE}/SNIC/snic-pais.csv`,
  `${BASE}/SNIC/snic-provincias.csv`,
  `${BASE}/SNIC/snic-departamentos-anual.csv`,
  `${BASE}/SAT/MV/SAT-MV-BU.csv`,
];

async function main() {
  fs.mkdirSync(SEG_BASE, { recursive: true });
  for (const url of FILES) {
    const res = await fetch(url, { headers: { 'User-Agent': 'DashboardMendozaOpenArg/1.0 (https://mendoza.openarg.org)' } });
    if (!res.ok) throw new Error(`${res.status} en ${url}`);
    const file = path.join(SEG_BASE, path.basename(url));
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    console.log(`  ✓ ${path.basename(url)} (${Math.round(fs.statSync(file).size / 1024)} KB)`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
