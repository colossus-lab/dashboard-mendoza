// ════════════════════════════════════════════════════════════════════
// validate-reports.cjs — Dashboard Mendoza
// Corre antes de cada build y falla si un informe quedaría roto o incompleto:
//   - un gráfico o ranking sin sección (no se mostraría)
//   - un total que no cierra (torta, pirámide, barras con total)
//   - un mapa sin los 18 departamentos
//   - una foto sin crédito o sin archivo
//   - una ruta sin rewrite o fuera del sitemap
//   - un emoji en la interfaz o en las narrativas
// ════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const errors = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);

const registry = read('src/data/reportRegistry.ts');
const entries = [...registry.matchAll(/slug:\s*'([^']+)'[\s\S]*?image:\s*'([^']+)'[\s\S]*?mdPath:\s*'([^']+)'[\s\S]*?dataPath:\s*'([^']+)'/g)]
  .map(m => ({ slug: m[1], image: m[2], mdPath: m[3], dataPath: m[4] }));
if (entries.length === 0) fail('registro', 'no se encontraron informes');

const geo = JSON.parse(read('public/mendoza-departamentos.geojson'));
const geoIds = geo.features.map(f => String(f.id ?? f.properties?.id));
const credits = JSON.parse(read('src/data/generated/image-credits.json'));
const landing = JSON.parse(read('src/data/generated/landing.json'));

const ANCHORED = /^##\s+(.*?)\s*\{#([a-z0-9-]+)\}\s*$/;

function checkReport({ slug, mdPath, dataPath }) {
  const data = JSON.parse(read(`public${dataPath}`));
  const anchors = new Set();
  let unanchored = 0;
  for (const line of read(`public${mdPath}`).split(/\r?\n/)) {
    const match = line.match(ANCHORED);
    if (match) {
      if (anchors.has(match[2])) fail(slug, `ancla repetida {#${match[2]}}`);
      anchors.add(match[2]);
    } else if (line.startsWith('## ')) {
      unanchored++;
      if (anchors.size > 0 || unanchored > 1) fail(slug, `título sin ancla: "${line}"`);
    }
  }

  if (!data.meta?.scope) fail(slug, 'falta meta.scope');
  if (!data.kpis?.length) fail(slug, 'no tiene KPIs');

  for (const item of [...data.charts, ...data.rankings]) {
    if (!anchors.has(item.sectionId)) fail(slug, `${item.id} no tiene sección: {#${item.sectionId}}`);
  }

  for (const chart of data.charts) {
    const where = `${slug} · ${chart.id}`;
    if (!chart.config?.format) fail(where, 'falta config.format');
    const total = chart.config?.total;
    if (total != null) {
      let sum = null;
      if (chart.type === 'pie') sum = chart.data.reduce((a, d) => a + d.value, 0);
      if (chart.type === 'pyramid') sum = chart.data.reduce((a, d) => a + d.mujeres + d.varones, 0);
      if (chart.type === 'bar') {
        const xKey = chart.config.xAxis;
        const key = Object.keys(chart.data[0]).find(k => k !== xKey);
        sum = chart.data.reduce((a, d) => a + d[key], 0);
      }
      if (sum !== total) fail(where, `suma ${sum} y el total es ${total}`);
    }
    if (chart.type === 'map') {
      const ids = chart.data.map(d => String(d.id));
      const missing = geoIds.filter(id => !ids.includes(id));
      if (missing.length) fail(where, `faltan departamentos: ${missing.join(', ')}`);
    }
  }

  for (const ranking of data.rankings) {
    if (!ranking.format) fail(`${slug} · ${ranking.id}`, 'falta format');
    if (!ranking.items?.length) fail(`${slug} · ${ranking.id}`, 'está vacío');
  }
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
}

for (const entry of entries) {
  try {
    checkReport(entry);
  } catch (err) {
    fail(entry.slug, err.message);
  }
  if (!credits[entry.image]) fail(entry.slug, `foto sin crédito: ${entry.image}`);
}

for (const [key, photo] of Object.entries(credits)) {
  if (!photo.author || !photo.license || !photo.sourceUrl || !photo.alt) fail(`foto ${key}`, 'faltan autor, licencia, fuente o alt');
  for (const width of photo.widths) {
    if (!fs.existsSync(path.join(ROOT, 'public', 'images', 'mendoza', `${key}-${width}.webp`))) fail(`foto ${key}`, `falta el archivo de ${width}px`);
  }
}

const vercel = read('vercel.json');
const sitemap = fs.existsSync(path.join(ROOT, 'public/sitemap.xml')) ? read('public/sitemap.xml') : '';
for (const { slug } of entries) {
  const [section, page] = slug.split('/');
  const rule = JSON.parse(vercel).rewrites.find(r => r.source.startsWith(`/${section}/`));
  if (!rule || !rule.source.includes(page)) fail(slug, 'no tiene rewrite en vercel.json');
  if (!sitemap.includes(`/${slug}<`)) fail(slug, 'no está en sitemap.xml (npm run build-data)');
  if (!Object.keys(landing.miniStats).length) fail(slug, 'landing.json sin miniStats');
}
for (const id of [...registry.matchAll(/\bid:\s*'([^']+)'/g)].map(m => m[1])) {
  if (!landing.miniStats[id]) fail(id, 'falta su mini-estadística en landing.json');
}

const EMOJI = /\p{Extended_Pictographic}/u;
const textFiles = [
  'index.html',
  ...walk(path.join(ROOT, 'src')).map(f => path.relative(ROOT, f)),
  ...walk(path.join(ROOT, 'public', 'reports')).map(f => path.relative(ROOT, f)),
].filter(f => /\.(tsx?|md|html)$/.test(f));
for (const file of textFiles) {
  read(file).split(/\r?\n/).forEach((line, i) => {
    if (EMOJI.test(line)) fail(`${file}:${i + 1}`, 'contiene un emoji');
  });
}

if (errors.length) {
  console.error(`\n❌ Validación: ${errors.length} problema(s)\n`);
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
}
console.log(`✅ Validación OK: ${entries.length} informes, ${Object.keys(credits).length} fotos`);
