// ════════════════════════════════════════════════════════════════════
// process-images.cjs — Dashboard Mendoza
// Baja las fotos de Wikimedia Commons listadas en images.config.json, genera
// derivados WebP y deja autor y licencia tal como los publica Commons.
//
// Outputs:
//   public/images/mendoza/<key>-<ancho>.webp
//   public/og-image.png
//   src/data/generated/image-credits.json
//
// Uso: npm run build-images  (no corre en el build; los derivados se commitean)
// ════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { ROOT, writeJson } = require('./lib/mendoza-utils.cjs');

const CONFIG = require('./images.config.json');
const OUT_DIR = path.join(ROOT, 'public', 'images', 'mendoza');
const USER_AGENT = 'DashboardMendozaOpenArg/1.0 (https://mendoza.openarg.org)';
const QUALITY = 70;
const MIN_QUALITY = 34;
const OG_KEY = 'aconcagua';
// Anchos y peso máximo: el hero llena la pantalla; el resto, el ancho del contenido.
const HERO = { widths: [640, 1280, 1920], maxKb: 250 };
const BANNER = { widths: [640, 1280], maxKb: 120 };

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const stripHtml = s => (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

async function fetchOk(url) {
  for (let intento = 1; intento <= 4; intento++) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (res.ok) return res;
    if (res.status !== 429 && res.status < 500) throw new Error(`${res.status} en ${url}`);
    await sleep(2000 * intento);
  }
  throw new Error(`Reintentos agotados en ${url}`);
}

async function imageInfo(title) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  Object.entries({
    action: 'query',
    format: 'json',
    titles: `File:${title}`,
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata',
    iiurlwidth: '1920',
    iiextmetadatafilter: 'LicenseShortName|LicenseUrl|Artist|Credit',
  }).forEach(([k, v]) => url.searchParams.set(k, v));
  const json = await (await fetchOk(url)).json();
  const info = Object.values(json.query.pages)[0].imageinfo?.[0];
  if (!info) throw new Error(`Commons no tiene el archivo: ${title}`);
  return info;
}

async function buildOgImage(buffer) {
  // 1200×630 con la franja celeste y la marca, como pide el metadata de index.html.
  const overlay = Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#06090F" stop-opacity="0.15"/>
        <stop offset="1" stop-color="#06090F" stop-opacity="0.92"/>
      </linearGradient></defs>
      <rect width="1200" height="630" fill="url(#g)"/>
      <rect width="1200" height="8" fill="#74ACDF"/>
      <rect y="8" width="1200" height="8" fill="#FFFFFF"/>
      <rect y="16" width="1200" height="8" fill="#74ACDF"/>
      <text x="64" y="490" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="700" fill="#E8ECF4">Mendoza, en datos.</text>
      <text x="64" y="560" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="#8892A8">OpenArg por Colossus Lab</text>
    </svg>`);
  await sharp(buffer)
    .resize(1200, 630, { fit: 'cover' })
    .composite([{ input: overlay }])
    .png({ compressionLevel: 9, palette: true, quality: 80 })
    .toFile(path.join(ROOT, 'public', 'og-image.png'));
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const credits = {};

  for (const [key, entry] of Object.entries(CONFIG)) {
    console.log(`  · ${key}: ${entry.title}`);
    const info = await imageInfo(entry.title);
    const buffer = Buffer.from(await (await fetchOk(info.thumburl || info.url)).arrayBuffer());
    const meta = await sharp(buffer).metadata();

    const preset = key === OG_KEY ? HERO : BANNER;
    const widths = (entry.widths || preset.widths).filter(w => w <= meta.width);
    if (widths.length === 0) widths.push(meta.width);
    const sizes = {};
    for (const width of widths) {
      const file = path.join(OUT_DIR, `${key}-${width}.webp`);
      let quality = QUALITY;
      do {
        await sharp(buffer).resize({ width }).webp({ quality }).toFile(file);
        quality -= 6;
      } while (fs.statSync(file).size / 1024 > preset.maxKb && quality >= MIN_QUALITY);
      sizes[width] = Math.round(fs.statSync(file).size / 1024);
    }
    if (key === OG_KEY) await buildOgImage(buffer);

    const license = info.extmetadata?.LicenseShortName?.value;
    const author = stripHtml(info.extmetadata?.Artist?.value);
    if (!license || !author) throw new Error(`Falta licencia o autor en ${entry.title}`);

    credits[key] = {
      key,
      alt: entry.alt,
      place: entry.place,
      author,
      license,
      licenseUrl: info.extmetadata?.LicenseUrl?.value || null,
      sourceUrl: info.descriptionurl,
      fileName: entry.title,
      width: meta.width,
      height: meta.height,
      widths,
    };
    console.log(`    ${license} · ${author} · ${JSON.stringify(sizes)} KB`);
    await sleep(800);
  }

  writeJson(path.join(ROOT, 'src', 'data', 'generated', 'image-credits.json'), credits);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
