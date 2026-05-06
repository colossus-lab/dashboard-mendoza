# Dashboard Mendoza — OpenArg

Dashboard interactivo de datos abiertos de la **Provincia de Mendoza**. Construido por [Colossus Lab](https://colossuslab.org) con datos del Censo Nacional 2022 (INDEC) y el SNIC del Ministerio de Seguridad de la Nación, vía [OpenArg](https://www.openarg.org).

## Contenidos

- **8 informes de Población** (Censo 2022 INDEC, cuadros provinciales para Mendoza con sufijo `_13`)
  1. Estructura por sexo y edad
  2. Condiciones habitacionales de la población
  3. Salud y previsión social
  4. Condiciones habitacionales de los hogares
  5. Stock habitacional y viviendas
  6. Educación
  7. Características económicas
  8. Fecundidad

- **1 informe de Seguridad** (SNIC provincial 2000-2024, comparado contra las 24 jurisdicciones del país).

Cada informe incluye KPIs, charts (`@nivo/*`) y un mapa coroplético con los **18 departamentos** de Mendoza.

## Stack

- **React 19 + TypeScript + Vite**
- **@nivo/bar, @nivo/line, @nivo/pie** para visualizaciones
- **d3-geo** para el mapa coroplético custom (auto-fit con `geoMercator().fitExtent()`)
- **react-router-dom** para navegación SPA
- **react-markdown + remark-gfm** para los informes en markdown
- **@vercel/analytics** para métricas de uso

## Estructura

```
Dashboard Mendoza OpenArg/
├── public/
│   ├── data/
│   │   ├── poblacion/*.json        # 8 informes procesados
│   │   ├── seguridad/snic.json
│   │   └── resumen.json
│   ├── reports/
│   │   ├── poblacion/*.md          # narrativas markdown
│   │   └── seguridad/snic.md
│   ├── mendoza-departamentos.geojson  # 18 deptos (29.6 KB)
│   └── og-image.png
├── scripts/
│   ├── build-data.cjs              # orquestador del pipeline
│   ├── lib/mendoza-utils.cjs       # identidad provincial + 18 deptos
│   ├── process-poblacion.cjs       # genera 8 JSONs desde XLSX INDEC
│   └── process-seguridad.cjs       # genera SNIC desde CSV
├── src/
│   ├── components/
│   │   ├── charts/ChartRenderer.tsx
│   │   ├── layout/Layout.tsx
│   │   └── ui/{KPICounter,SectionReveal,IntroHero,ThemeToggle}.tsx
│   ├── data/reportRegistry.ts
│   ├── hooks/{useFirstVisit,useReportData,useIntersectionObserver}.ts
│   ├── pages/{Landing,ReportView}.tsx
│   ├── store/useStore.ts
│   ├── types/report.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vercel.json                     # SPA rewrites + security headers + cache
```

## Desarrollo local

```bash
npm install
npm run dev          # http://localhost:5173
```

### Regenerar los datos

El pipeline lee XLSX/CSV crudos del Censo y SNIC y emite los JSONs en `public/data/`:

```bash
npm run build-data
```

Las fuentes están en `C:/Users/dante/Desktop/Laboratorio Colossus/Pipeline OpenArg/` (paths absolutos en `scripts/lib/mendoza-utils.cjs`). Si moviste el pipeline, actualizá `INDEC_BASE` y `SEG_BASE`.

### Build de producción

```bash
npm run build        # tsc -b && vite build → dist/
npm run preview      # http://localhost:4173 (sirve dist/)
```

## Deploy en Vercel

### Opción A — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel              # primer deploy (preview)
vercel --prod       # deploy a producción
```

Vercel detecta automáticamente Vite (`framework: "vite"` en `vercel.json`) y usa el `outputDirectory: dist`.

### Opción B — GitHub + Vercel Dashboard

1. Pushear el repo a GitHub.
2. En vercel.com → "New Project" → importar el repo.
3. Vercel detecta el framework Vite automáticamente, no hay que configurar nada (todo está en `vercel.json`).
4. Click en Deploy.

### Variables de entorno

**No requiere ninguna**. El proyecto no usa Supabase, base de datos ni servicios externos. Todo es estático: datos pre-procesados que viven en `public/data/`.

### Dominio

Para apuntar `mendoza.openarg.org` (o el dominio que prefieras) al deploy, en el Vercel Dashboard → Project Settings → Domains.

## Configuración Vercel (`vercel.json`)

- **SPA rewrites**: cualquier ruta que no sea `/assets/`, `/data/`, `/reports/`, `/mendoza-departamentos.geojson`, `/favicon.ico`, `/og-image.png` o `/.well-known/` se reescribe a `/index.html` para que React Router maneje el routing client-side.
- **Headers de seguridad**: HSTS, X-Frame-Options DENY, CSP estricto que solo permite `va.vercel-scripts.com`.
- **Cache**: 1 día para `/data/*` y `/reports/*`, 30 días para el geojson, 1 año immutable para `/assets/*` (con hash de Vite).

## Licencia

MIT — Laboratorio Colossus.
