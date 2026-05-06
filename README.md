# Dashboard Mendoza — Guía de uso

> **Mendoza en números**: 9 informes interactivos sobre la provincia, hechos con datos abiertos del Censo 2022 (INDEC) y el SNIC.
>
> 🔗 **Visitalo en producción**: [mendoza.openarg.org](https://mendoza.openarg.org) *(próximamente)*
>
> Hecho desde [**Colossus Lab**](https://colossuslab.org) vía [**OpenArg**](https://www.openarg.org). 🇦🇷

---

## ¿Qué vas a encontrar?

El dashboard responde, en clave de datos, **quién vive en Mendoza, cómo vive, dónde y en qué condiciones**. Está pensado para que cualquier persona —vecino curioso, periodista, funcionario, investigadora— pueda explorar la provincia con la misma información que tiene el INDEC.

### 🏠 Sección 1 — Quiénes somos en Mendoza (8 informes)

Cubrimos **toda la batería de cuadros provinciales del Censo Nacional 2022** que publicó el INDEC para Mendoza:

| # | Informe | ¿Qué responde? |
|---|---|---|
| 1 | 👥 **Estructura por sexo y edad** | Cuántos somos, cómo nos repartimos por edad y sexo, cuánto creció la provincia entre 2010 y 2022. |
| 2 | 🏠 **Hábitat de las personas** | Acceso al agua, cloaca, gas y combustibles. La fortaleza histórica del agua mendocina y la deuda con la red cloacal. |
| 3 | 🏥 **Salud y previsión social** | ¿Quién tiene obra social? ¿Quién depende solo del sistema público? ¿Cuántos jubilados hay por departamento? |
| 4 | 🏗️ **Hogares** | 652 mil hogares mendocinos: tamaño, materiales, servicios. |
| 5 | 🏘️ **Viviendas** | El stock habitacional: 702 mil viviendas, 82 % son casas, contraste con Capital y Godoy Cruz. |
| 6 | 🎓 **Educación** | Asistencia escolar, nivel alcanzado, peso de la UNCuyo en la matrícula universitaria. |
| 7 | 💼 **Características económicas** | Tasas de actividad, empleo, desocupación. La importancia del trabajo por cuenta propia (30 %). |
| 8 | 👶 **Fecundidad** | Hijos por mujer (14-49 años), brechas urbano-rural, transición demográfica en marcha. |

### 🛡️ Sección 2 — Seguridad en Mendoza (1 informe)

| # | Informe | ¿Qué responde? |
|---|---|---|
| 9 | 🛡️ **Seguridad — SNIC provincial** | Hechos delictivos en Mendoza 2000–2024, comparado contra las 24 provincias. Patrimoniales, homicidios, estafas, evolución temporal. |

---

## ¿Cómo se usa?

### En la pantalla principal (Landing)

Cuando entrás por primera vez ves un **intro animado** que se cierra con un click. Después llegás a la pantalla principal con:

1. **Hero con KPIs macro animados** — habitantes, km², departamentos, informes.
2. **Resumen de la provincia** — 4 cifras agregadas del Censo 2022 (población, superficie, departamentos, viviendas).
3. **Grid de categorías** — 9 tarjetas, una por informe. Cada tarjeta muestra una mini-estadística contextual (ej. "2,04M hab · +17,5%", "Cobertura agua/cloaca", etc.).

Hacé click en cualquier tarjeta para abrir el informe correspondiente.

### Dentro de un informe

Cada informe sigue la misma estructura, así que aprendés a leerlo una vez:

| Sección | Qué muestra |
|---|---|
| **Hero del informe** | Título grande, fuente del dato, fecha. |
| **Grid de KPIs** | Hasta 8 indicadores clave con animación de count-up. Los que están en rojo (`critical`) son alarmas; los verdes (`good`) son fortalezas; los amarillos (`warning`) son datos a vigilar. |
| **Bloque destacado** | Un dato hero a nivel provincial (ej. "Mendoza · Provincia completa. Los rankings y comparativos usan los 18 departamentos."). |
| **Secciones de contenido** | Narrativa markdown con tablas + gráficos asociados a cada sección (`##` en el markdown → sección visual). |
| **Mapa coroplético** | Mapa de los 18 departamentos coloreados según el indicador. **Hover** sobre cualquier departamento para ver el valor exacto. |
| **Charts y rankings** | Gráficos `@nivo` (barras, líneas, torta, pirámide etaria). Los **rankings** muestran los 18 departamentos ordenados por el indicador. |
| **Anterior / Siguiente** | Al final del informe, navegación al informe contiguo. |

### Atajos y navegación

- **Logo "Dashboard Mendoza"** → vuelve a la home.
- **☰ menú lateral** (mobile/tablet) → lista completa de los 9 informes con iconos.
- **🌗 toggle de tema** → claro / oscuro. La preferencia se guarda en el navegador.
- **Breadcrumb** (top-bar) → muestra `Dashboard Mendoza › Población › Estructura` cuando estás dentro de un informe.

---

## ¿De dónde salen los datos?

| Fuente | Período | Lo que aporta |
|---|---|---|
| **INDEC — Censo 2022** | 2022 | Los 8 informes de población. Cuadros provinciales `c2022_mendoza_*_13.xlsx` (sufijo `_13` = código provincia INDEC para Mendoza). |
| **SNIC — Min. Seguridad** | 2000–2024 | Estadísticas criminales por provincia. Hechos delictivos, víctimas por sexo, tasas /100K. |
| **IGN / JGM** | 2024 | Geometría de los 18 departamentos (geojson) para el mapa coroplético. |

Cada informe declara su fuente exacta en la cabecera. Los **JSONs procesados** viven en `public/data/` y se generan a partir de los XLSX/CSV crudos vía `npm run build-data`.

---

## Limitaciones que conviene saber

- **El SNIC no se publica desagregado por departamento mendocino**, solo a nivel provincial. Por eso el informe de seguridad compara Mendoza con las otras 23 jurisdicciones, no entre los departamentos internos.
- **El SAT (muertes viales) es total nacional**, no provincial. Por eso este dashboard no incluye un informe de víctimas viales específico para Mendoza.
- Los datos del **SNIC dependen de la denuncia**, así que cambios temporales pueden reflejar tanto cambios reales como cambios en el comportamiento de denunciar.
- La **fecundidad** del Censo es **acumulada** (cuántos hijos tuvo cada mujer hasta hoy), no la **tasa global** del año (esa requiere registros vitales). Por eso la cohorte 14-29 muestra cifras bajas: aún no completaron su período fértil.
- Los **JSONs procesados se commitean en el repo** (`public/data/`) — los cuadros XLSX crudos del INDEC NO. Si querés regenerar todo desde cero necesitás bajar los XLSX del [sitio de INDEC](https://www.indec.gob.ar/indec/web/Nivel4-Tema-2-41-165) y los CSV del SNIC del [portal de datos abiertos](https://datos.gob.ar/dataset/seguridad-snic-provincial).

---

## Cosas que **no** hace (todavía)

- ❌ **No hay desagregación por barrio o radio censal.** El nivel mínimo es el departamento.
- ❌ **No hay series anuales del Censo** (solo el corte 2022 + comparación 2010 cuando aplica). Los datos no se actualizan en tiempo real.
- ❌ **No hay endpoint de API.** Si necesitás los datos crudos, descargá los JSONs desde `/data/` o cloná el repo.
- ❌ **No hay buscador.** Si querés un dato puntual, usá `Ctrl+F` dentro del informe.

---

## Para desarrolladores

<details>
<summary><strong>📦 Stack y arquitectura</strong></summary>

- **React 19 + TypeScript + Vite** — frontend SPA.
- **@nivo/bar, @nivo/line, @nivo/pie** — visualizaciones.
- **d3-geo** — mapa coroplético custom con `geoMercator().fitExtent()` (autoencuadre).
- **react-router-dom v7** — routing client-side.
- **react-markdown + remark-gfm** — render de los informes desde `.md`.
- **@vercel/analytics** — métricas de uso.
- **Sin backend, sin base de datos, sin variables de entorno**. Todo es estático.

</details>

<details>
<summary><strong>🗂️ Estructura del repo</strong></summary>

```
Dashboard Mendoza OpenArg/
├── public/
│   ├── data/                       # JSONs procesados (commiteados)
│   │   ├── poblacion/*.json        # 8 informes
│   │   ├── seguridad/snic.json
│   │   └── resumen.json
│   ├── reports/                    # Narrativas markdown
│   │   ├── poblacion/*.md
│   │   └── seguridad/snic.md
│   ├── mendoza-departamentos.geojson  # 18 deptos (29.6 KB)
│   └── og-image.png
├── scripts/                        # Pipeline de datos (Node CJS)
│   ├── build-data.cjs              # Orquestador
│   ├── lib/mendoza-utils.cjs       # Identidad provincial + 18 deptos
│   ├── process-poblacion.cjs       # XLSX INDEC → 8 JSONs
│   └── process-seguridad.cjs       # CSV SNIC → snic.json
├── src/
│   ├── components/
│   │   ├── charts/ChartRenderer.tsx     # bar, line, pie, pyramid, map
│   │   ├── layout/Layout.tsx
│   │   └── ui/{KPICounter,SectionReveal,IntroHero,ThemeToggle}.tsx
│   ├── data/reportRegistry.ts      # Registro de los 9 informes
│   ├── hooks/{useFirstVisit,useReportData,useIntersectionObserver}.ts
│   ├── pages/{Landing,ReportView}.tsx
│   ├── store/useStore.ts           # Zustand: tema + sidebar
│   ├── types/report.ts             # Schema de los JSONs
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── vite.config.ts
└── vercel.json                     # SPA rewrites + security headers + cache
```

</details>

<details>
<summary><strong>🚀 Desarrollo local</strong></summary>

```bash
npm install
npm run dev          # http://localhost:5173

# regenerar los JSONs desde XLSX/CSV crudos:
npm run build-data

# build de producción:
npm run build        # tsc -b && vite build → dist/
npm run preview      # http://localhost:4173 (sirve dist/)
```

Los scripts del pipeline (`scripts/process-*.cjs`) usan paths absolutos a `Pipeline OpenArg/` (configurados en `scripts/lib/mendoza-utils.cjs` con las constantes `INDEC_BASE` y `SEG_BASE`). Si moviste el pipeline, actualizá esas dos constantes.

**⚠ Bug conocido en Windows ARM64**: tras `npm install` puede aparecer `Cannot find module @rollup/rollup-win32-arm64-msvc`. Workaround:
```bash
npm install @rollup/rollup-win32-arm64-msvc --no-save
```
Ver [npm/cli#4828](https://github.com/npm/cli/issues/4828).

</details>

<details>
<summary><strong>🌐 Deploy en Vercel</strong></summary>

**Opción A — CLI:**
```bash
npm i -g vercel
vercel login
vercel --prod
```

**Opción B — GitHub + Vercel Dashboard:**
1. En vercel.com → "New Project" → importar `colossus-lab/dashboard-mendoza`.
2. Vercel detecta Vite automáticamente. Click en Deploy.

**No requiere variables de entorno.**

El `vercel.json` ya está configurado con:
- **SPA rewrites** para que `/poblacion/*` y `/seguridad/*` resuelvan a `index.html`.
- **Security headers** (HSTS, CSP estricto, X-Frame-Options DENY).
- **Cache** de 1 día para `/data/*` y `/reports/*`, 30 días para el geojson, 1 año immutable para `/assets/*`.

Para apuntar un dominio custom: Vercel Dashboard → Project Settings → Domains.

</details>

<details>
<summary><strong>➕ Cómo agregar un informe nuevo</strong></summary>

1. **Procesar los datos**: agregar una función en `scripts/process-poblacion.cjs` (o un nuevo `process-<categoria>.cjs`) que lea el XLSX/CSV y emita un JSON con el [schema de `ReportData`](src/types/report.ts) en `public/data/<categoria>/<slug>.json`.
2. **Escribir el markdown**: crear `public/reports/<categoria>/<slug>.md` con la narrativa.
3. **Registrar el informe** en [`src/data/reportRegistry.ts`](src/data/reportRegistry.ts) — agregar una entrada nueva con `id`, `slug`, `title`, `icon`, `color`, `mdPath`, `dataPath`, `order`.
4. **Mini-stat para la card**: agregar el ID del informe en el objeto `MINI_STATS` de [`src/pages/Landing.tsx`](src/pages/Landing.tsx).
5. Listo: la card aparece en la home, el routing la sirve, y el `ReportView` la renderiza con el mismo template.

</details>

<details>
<summary><strong>🤝 Contribuir</strong></summary>

Issues y PRs bienvenidos en [github.com/colossus-lab/dashboard-mendoza](https://github.com/colossus-lab/dashboard-mendoza).

Para reportes de errores en datos, por favor incluí:
- Informe afectado (`/poblacion/educacion`, etc.).
- Cifra que parece incorrecta y la fuente con la que la comparaste.
- Screenshot si ayuda.

</details>

---

## Licencia

**MIT** — código y datos pueden reutilizarse libremente con atribución.

Los datos originales son de **INDEC** y el **Ministerio de Seguridad de la Nación**. Por favor, citalos también si los reutilizás.

---

<sub>Construido con ❤️ desde [Colossus Lab](https://colossuslab.org) · Datos abiertos vía [OpenArg](https://www.openarg.org)</sub>
