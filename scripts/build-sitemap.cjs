// Genera public/sitemap.xml a partir del registro de informes.

const fs = require('fs');
const path = require('path');
const { ROOT } = require('./lib/mendoza-utils.cjs');

const registry = fs.readFileSync(path.join(ROOT, 'src', 'data', 'reportRegistry.ts'), 'utf8');
const slugs = [...registry.matchAll(/slug:\s*'([^']+)'/g)].map(m => m[1]);
const urls = ['', ...slugs, 'creditos'];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>https://mendoza.openarg.org/${u}</loc></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, 'public', 'sitemap.xml'), xml, 'utf8');
console.log(`  ✓ public/sitemap.xml (${urls.length} URLs)`);
