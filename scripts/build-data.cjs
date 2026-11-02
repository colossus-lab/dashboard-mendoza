/**
 * build-data.cjs
 *
 * Orquestador del pipeline de datos del Dashboard Mendoza.
 * Corre los processors en orden y termina con código 1 si alguno falla.
 *
 * Uso: npm run build-data
 *
 * Fuentes:
 *   - Censo: <repo>/Poblacion/ (o MENDOZA_CENSO_DIR)
 *   - Seguridad: <Laboratorio>/Pipelines de datos/Pipeline OpenArg (o OPENARG_PIPELINE_DIR)
 */

const { execSync } = require("child_process");
const path = require("path");

const PIPELINE = [
  "process-poblacion.cjs",
  "process-seguridad.cjs",
  "process-seguridad-territorial.cjs",
  "build-landing.cjs",
  "build-sitemap.cjs",
];

console.log("═══ Dashboard Mendoza — Data Build Pipeline ═══");

const start = Date.now();
let failed = 0;

for (const script of PIPELINE) {
  console.log(`\n── Running: ${script}`);
  try {
    execSync(`node "${path.join(__dirname, script)}"`, { stdio: "inherit" });
  } catch (err) {
    console.error(`  ❌ FAILED: ${script}`);
    failed++;
  }
}

const elapsed = ((Date.now() - start) / 1000).toFixed(1);
if (failed === 0) {
  console.log(`\n  ✅ ${PIPELINE.length} scripts OK en ${elapsed}s`);
} else {
  console.error(`\n  ❌ ${failed} de ${PIPELINE.length} scripts fallaron (${elapsed}s)`);
  process.exit(1);
}
