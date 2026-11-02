# Mendoza, en datos

> 11 informes interactivos sobre la provincia de Mendoza, hechos con datos abiertos del Censo 2022 (INDEC) y del Sistema Nacional de Información Criminal.
>
> [mendoza.openarg.org](https://mendoza.openarg.org) · Hecho desde [Colossus Lab](https://colossuslab.org) vía [OpenArg](https://www.openarg.org).

## Qué vas a encontrar

### Población (Censo 2022)

| # | Informe | Qué responde |
|---|---|---|
| 1 | Estructura por sexo y edad | Cuántos somos, cuánto creció cada departamento y cómo se reparte la población. |
| 2 | Condiciones habitacionales de la población | Acceso al agua, la cloaca y la energía para cocinar. |
| 3 | Salud y previsión social | Cobertura de salud y percepción de jubilaciones y pensiones. |
| 4 | Condiciones habitacionales de los hogares | Cantidad de hogares, tamaño, materiales y servicios. |
| 5 | Stock habitacional y viviendas | Cantidad de viviendas, tipo y condición de ocupación. |
| 6 | Educación | Asistencia, nivel al que se asiste, máximo nivel alcanzado y brecha por sexo. |
| 7 | Características económicas | Actividad, empleo, desocupación y categoría ocupacional. |
| 8 | Fecundidad | Hijas e hijos por mujer, por edad y por departamento. |

### Seguridad

| # | Informe | Qué responde |
|---|---|---|
| 9 | Hechos delictivos en la provincia | Serie 2000-2024 y comparación con las 24 jurisdicciones. |
| 10 | Seguridad por departamento | Tasas, cantidades, robos, hurtos y homicidios en los 18 departamentos. |
| 11 | Muertes viales | Víctimas fatales 2017-2023, por año, departamento y tipo de usuario. |

## Cómo se lee un informe

Todos siguen la misma estructura: foto y cifra destacada, indicadores, índice y secciones numeradas con texto, mapas, gráficos y rankings. Cada gráfico tiene debajo la opción **Ver datos**, con la tabla completa.

## De dónde salen los datos

| Fuente | Período | Uso |
|---|---|---|
| INDEC, Censo 2022 | 2022 | Informes de población. Cuadros `c2022_mendoza_*_13.xlsx`. |
| SNIC, Ministerio de Seguridad | 2000-2024 | Hechos delictivos por provincia, departamento y total país. |
| SNIC-SAT, Ministerio de Seguridad | 2017-2023 | Muertes viales. |
| IGN / JGM | 2024 | Geometría de los 18 departamentos. |

Autores y licencias de las fotos, y detalle de fuentes, en [/creditos](https://mendoza.openarg.org/creditos).

## Limitaciones

- **El SNIC depende de la denuncia y del registro.** Una variación puede reflejar cambios reales o cambios en cómo se denuncia y se carga.
- **Categorías y subcategorías del SNIC.** Desde 2017, el panel provincial publica ambas como filas separadas. Los totales suman solo categorías; sumar todas las filas cuenta dos veces. El método se validó contra el total oficial de Mendoza 2023 (151.443).
- **La fecundidad del censo es acumulada**, no la tasa global de fecundidad, que surge de estadísticas vitales.
- **La desocupación censal** es una medición puntual, no comparable directamente con la de la EPH.
- **El nivel mínimo es el departamento.** No hay datos por barrio ni radio censal.

## Para desarrolladores

### Stack

React 19, TypeScript y Vite. Gráficos con `@nivo` y mapa con `d3-geo`. Sin backend ni variables de entorno en producción: todo es estático.

### Desarrollo local

```bash
npm install
npm run dev
```

En Windows ARM64 puede hacer falta instalar el binario de rollup (ver [npm/cli#4828](https://github.com/npm/cli/issues/4828)):

```bash
npm install @rollup/rollup-win32-arm64-msvc --no-save
```

### Comandos

| Comando | Qué hace |
|---|---|
| `npm run build-data` | Regenera JSON, portada y sitemap desde las fuentes. Falla con código 1 si algo se rompe. |
| `npm run build-images` | Baja las fotos de Commons, genera WebP y actualiza los créditos. |
| `npm run validate` | Controla informes, totales, mapas, fotos, rutas y emojis. |
| `npm run check` | `validate` + TypeScript + build. Es lo que corre en CI. |

`build-data` necesita las fuentes, que no están en el repo:

- **Censo:** cuadros de INDEC en `Poblacion/`, o donde indique `MENDOZA_CENSO_DIR`.
- **Seguridad:** el pipeline de OpenArg en `../../Pipelines de datos/Pipeline OpenArg`, o donde indique `OPENARG_PIPELINE_DIR`.

### Agregar un informe

1. Generá el JSON con el schema de [`src/types/report.ts`](src/types/report.ts) en `public/data/<categoria>/<slug>.json`.
2. Escribí `public/reports/<categoria>/<slug>.md`. Cada título lleva un ancla: `## 2. Tipo de vivienda {#tipos}`. El `sectionId` de cada gráfico y ranking debe coincidir con un ancla.
3. Registralo en [`src/data/reportRegistry.ts`](src/data/reportRegistry.ts) con una foto de `scripts/images.config.json`.
4. Agregá su mini-estadística en `scripts/build-landing.cjs` y su ruta en `vercel.json`.
5. Corré `npm run build-data` y `npm run check`.

### Diseño

Sigue el sistema editorial de OpenArg (`openarg_frontend/src/app/globals.css`, tokens `--ed-*`): Familjen Grotesk, Inter y JetBrains Mono, celeste y sol, bordes rectos, líneas finas, sin sombras ni emojis. Los tokens están en [`src/styles/tokens.css`](src/styles/tokens.css).

## Licencia

**Código:** MIT. **Datos:** INDEC y Ministerio de Seguridad de la Nación; citalos si los reutilizás. **Fotos:** no están cubiertas por MIT; cada una conserva su licencia de Wikimedia Commons, detallada en [/creditos](https://mendoza.openarg.org/creditos).

Para reportar errores en los datos, abrí un issue en [colossus-lab/dashboard-mendoza](https://github.com/colossus-lab/dashboard-mendoza) con el informe, la cifra y la fuente con la que la comparaste.
