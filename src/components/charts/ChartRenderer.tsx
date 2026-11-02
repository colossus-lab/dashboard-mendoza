import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import { geoMercator, geoPath, type GeoPermissibleObjects } from 'd3-geo';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { formatCompact, formatShare, formatValue } from '../../lib/format';
import { DEPARTAMENTOS } from '../../data/departamentos';
import type { ChartConfig, ValueFormat } from '../../types/report';
import { LazyMount } from '../ui/LazyMount';

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

// ═══════════════════════════════════════════════════════════════
// Tema editorial OpenArg (DataChart.tsx de openarg_frontend)
// ═══════════════════════════════════════════════════════════════

const COLORS = ['#74ACDF', '#F6B40E', '#34D399', '#A78BFA', '#F87171', '#60A5FA', '#FBBF24', '#E8ECF4'];
const COLORS_LIGHT = ['#1F4E89', '#C03A18', '#2F855A', '#6B46C1', '#D9A20E', '#4A8ABF', '#9B2C2C', '#4A5170'];

function useChartTheme() {
  const isDark = useStore(s => s.theme) === 'dark';
  const ink = isDark ? '#E8ECF4' : '#11142E';
  const axis = isDark ? '#8892A8' : '#4A5170';
  const tooltip = {
    background: isDark ? '#1A1F35' : '#F2EDE2',
    color: isDark ? '#F0F4FC' : '#11142E',
    border: `1px solid ${isDark ? 'rgba(116,172,223,.2)' : 'rgba(17,20,46,.2)'}`,
    borderRadius: 2,
    fontSize: 13,
    padding: '8px 12px',
    maxWidth: 280,
  };

  return {
    colors: isDark ? COLORS : COLORS_LIGHT,
    ink,
    isDark,
    tooltip,
    theme: {
      background: 'transparent',
      text: { fill: axis, fontFamily: 'Inter Variable, Inter, sans-serif' },
      axis: {
        ticks: { text: { fill: axis, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' } },
        legend: { text: { fill: axis, fontSize: 11 } },
      },
      grid: { line: { stroke: isDark ? 'rgba(116,172,223,.14)' : 'rgba(17,20,46,.1)', strokeDasharray: '3 3' } },
      legends: { text: { fill: axis, fontSize: 12 } },
      tooltip: { container: tooltip },
      crosshair: { line: { stroke: ink, strokeOpacity: 0.4 } },
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// Figura: título + gráfico + tabla alternativa
// ═══════════════════════════════════════════════════════════════

export function ChartFigure({ chart }: { chart: ChartConfig }) {
  const table = chartTable(chart);

  return (
    <figure className={`figure figure-${chart.type}`}>
      <figcaption className="figure-title">{chart.title}</figcaption>
      <LazyMount minHeight={chart.type === 'map' ? 420 : 320}>
        <div role="img" aria-label={`${chart.title}. Los datos están en la tabla "Ver datos".`}>
          <ChartRenderer chart={chart} />
        </div>
      </LazyMount>
      <details className="figure-data">
        <summary>Ver datos</summary>
        <div className="table-scroll">
          <table>
            <thead><tr>{table.headers.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

function chartTable(chart: ChartConfig): { headers: string[]; rows: string[][] } {
  const format = chart.config?.format;
  const f = (v: unknown) => formatValue(v as number, format);

  if (chart.type === 'pie') {
    const total = chart.config?.total ?? chart.data.reduce((a, d) => a + d.value, 0);
    return {
      headers: ['Categoría', 'Cantidad', '%'],
      rows: chart.data.map(d => [String(d.id), f(d.value), formatShare(d.value, total)]),
    };
  }
  if (chart.type === 'pyramid') {
    return {
      headers: ['Edad', 'Mujeres', 'Varones'],
      rows: chart.data.map(d => [d.grupo, f(d.mujeres), f(d.varones)]),
    };
  }
  if (chart.type === 'map') {
    return {
      headers: ['Departamento', 'Valor'],
      rows: [...chart.data]
        .sort((a, b) => b.value - a.value)
        .map(d => [DEPARTAMENTOS[d.id] ?? d.id, formatValue(d.value, format, chart.config?.unit)]),
    };
  }
  if (chart.type === 'line' && Array.isArray(chart.data[0]?.data)) {
    const series = chart.data as Array<{ id: string; data: Array<{ x: string; y: number }> }>;
    return {
      headers: ['Año', ...series.map(s => s.id)],
      rows: series[0].data.map((point, i) => [point.x, ...series.map(s => f(s.data[i]?.y))]),
    };
  }
  const xKey = chart.config?.xAxis || Object.keys(chart.data[0] || {})[0];
  const keys = Object.keys(chart.data[0] || {}).filter(k => k !== xKey);
  return {
    headers: [xKey === 'id' ? 'Categoría' : capitalize(xKey), ...keys.map(capitalize)],
    rows: chart.data.map(d => [String(d[xKey]), ...keys.map(k => f(d[k]))]),
  };
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function ChartLegend({ items, colors }: { items: string[]; colors: string[] }) {
  return (
    <ul className="chart-legend">
      {items.map((item, i) => (
        <li key={item}>
          <span className="pie-swatch" style={{ background: colors[i % colors.length] }} aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function ChartRenderer({ chart }: { chart: ChartConfig }) {
  switch (chart.type) {
    case 'pie':
      return <PieChartView chart={chart} />;
    case 'line':
      return <LineChartView chart={chart} />;
    case 'pyramid':
      return <PyramidChartView chart={chart} />;
    case 'map':
      return <MapChartView chart={chart} />;
    case 'bar':
    default:
      return <BarChartView chart={chart} />;
  }
}

// ─── Bar Chart ───
function BarChartView({ chart }: { chart: ChartConfig }) {
  const { theme, colors, tooltip } = useChartTheme();
  const mobile = useIsMobile();
  const format: ValueFormat = chart.config?.format ?? 'int';
  const indexBy = chart.config?.xAxis || 'id';
  const keys = Object.keys(chart.data[0] || {}).filter(k => k !== indexBy);
  const isHorizontal = chart.config?.layout === 'horizontal';
  const fmt = (v: number) => formatValue(v, format);
  const multi = keys.length > 1;

  // nivo dibuja la primera fila abajo: se invierte para leer de arriba hacia abajo.
  const data = isHorizontal ? [...chart.data].reverse() : chart.data;

  const longest = Math.max(...chart.data.map(d => String(d[indexBy]).length), 0);
  const maxChars = mobile ? 18 : 32;
  const left = isHorizontal ? Math.min(longest, maxChars) * 6.6 + 14 : 48;
  const height = isHorizontal ? data.length * (multi ? 44 : 34) + 44 : 300;

  const valueAxis = {
    tickSize: 0,
    tickPadding: 6,
    tickValues: 4,
    format: (v: number) => formatCompact(v, format),
  };
  const categoryAxis = {
    tickSize: 0,
    tickPadding: 8,
    format: (v: string) => (v.length > maxChars ? `${v.slice(0, maxChars - 1)}…` : v),
  };

  return (
    <>
    <div style={{ height }}>
      <ResponsiveBar
        data={data}
        keys={keys}
        indexBy={indexBy}
        layout={isHorizontal ? 'horizontal' : 'vertical'}
        groupMode="grouped"
        margin={{ top: 8, right: 16, bottom: 32, left }}
        padding={0.28}
        innerPadding={multi ? 2 : 0}
        colors={colors}
        maxValue={chart.config?.max ?? 'auto'}
        valueFormat={fmt}
        axisBottom={isHorizontal ? valueAxis : categoryAxis}
        axisLeft={isHorizontal ? categoryAxis : valueAxis}
        gridXValues={isHorizontal ? 4 : undefined}
        gridYValues={isHorizontal ? undefined : 4}
        enableGridX={isHorizontal}
        enableGridY={!isHorizontal}
        theme={theme}
        labelSkipWidth={56}
        labelSkipHeight={14}
        labelTextColor="#06090F"
        animate={false}
        tooltip={({ id, value, indexValue }) => (
          <div style={tooltip}>
            <strong>{String(indexValue)}</strong><br />
            {multi ? `${String(id)}: ` : ''}{fmt(value)}
          </div>
        )}
      />
    </div>
    {multi && <ChartLegend items={keys} colors={colors} />}
    </>
  );
}

// ─── Pie Chart ───
function PieChartView({ chart }: { chart: ChartConfig }) {
  const { theme, colors, tooltip } = useChartTheme();
  const total = chart.config?.total ?? chart.data.reduce((a: number, d: { value: number }) => a + d.value, 0);
  const format = chart.config?.format;

  return (
    <div className="pie">
      <div className="pie-chart">
        <ResponsivePie
          data={chart.data}
          margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          innerRadius={0.58}
          padAngle={1}
          cornerRadius={1}
          colors={colors}
          enableArcLinkLabels={false}
          arcLabelsSkipAngle={22}
          arcLabelsTextColor="#06090F"
          arcLabel={d => formatShare(d.value, total)}
          theme={theme}
          animate={false}
          tooltip={({ datum }) => (
            <div style={tooltip}>
              <strong>{String(datum.id)}</strong><br />
              {formatValue(datum.value, format)} ({formatShare(datum.value, total)})
            </div>
          )}
        />
      </div>
      <ul className="pie-legend">
        {chart.data.map((d: { id: string; value: number }, i: number) => (
          <li key={d.id}>
            <span className="pie-swatch" style={{ background: colors[i % colors.length] }} aria-hidden="true" />
            <span className="pie-name">{d.id}</span>
            <span className="pie-share">{formatShare(d.value, total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Line Chart ───
function LineChartView({ chart }: { chart: ChartConfig }) {
  const { theme, colors, ink, tooltip } = useChartTheme();
  const mobile = useIsMobile();
  const format: ValueFormat = chart.config?.format ?? 'int';

  // Formatos admitidos:
  //  - Nivo nativo: [{ id, data: [{x, y}, …] }]
  //  - Plano:       [{ <xKey>: ..., <serieKey>: ..., … }]
  type Datum = { x: string; y: number };
  const first = chart.data[0] as Record<string, unknown> | undefined;
  let lineData: Array<{ id: string; data: Datum[] }>;
  if (first && Array.isArray(first.data)) {
    lineData = chart.data;
  } else {
    const xKey = chart.config?.xAxis || Object.keys(first || {})[0];
    lineData = Object.keys(first || {}).filter(k => k !== xKey).map(key => ({
      id: key,
      data: chart.data.map(d => ({ x: String(d[xKey]), y: d[key] })),
    }));
  }

  const xValues = lineData[0]?.data.map(p => p.x) ?? [];
  const maxTicks = mobile ? 6 : 14;
  const step = Math.ceil(xValues.length / maxTicks);
  const tickValues = xValues.filter((_, i) => i % step === 0);
  const multi = lineData.length > 1;
  const fmt = (v: number) => formatValue(v, format);

  const markers = (chart.config?.annotations ?? []).map(a => ({
    axis: 'x' as const,
    value: a.x,
    legend: mobile ? a.x : a.label,
    legendOrientation: 'horizontal' as const,
    legendPosition: 'top-left' as const,
    lineStyle: { stroke: ink, strokeOpacity: 0.45, strokeWidth: 1, strokeDasharray: '4 4' },
    textStyle: { fill: ink, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' },
  }));

  return (
    <>
    <div style={{ height: 320 }}>
      <ResponsiveLine
        data={lineData}
        margin={{ top: markers.length ? 26 : 14, right: 18, bottom: 34, left: 52 }}
        xScale={{ type: 'point' }}
        yScale={{ type: 'linear', min: 0, max: 'auto' }}
        curve="linear"
        colors={colors}
        lineWidth={2}
        enablePoints={false}
        axisBottom={{ tickSize: 0, tickPadding: 8, tickValues }}
        axisLeft={{ tickSize: 0, tickPadding: 6, tickValues: 5, format: (v: number) => formatCompact(v, format) }}
        gridYValues={5}
        enableGridX={false}
        markers={markers}
        theme={theme}
        animate={false}
        useMesh
        tooltip={({ point }) => (
          <div style={tooltip}>
            <strong>{String(point.data.x)}</strong><br />
            {multi ? `${point.serieId}: ` : ''}{fmt(Number(point.data.y))}
          </div>
        )}
      />
    </div>
    {multi && <ChartLegend items={lineData.map(s => s.id)} colors={colors} />}
    </>
  );
}

// ─── Pyramid Chart (Diverging Horizontal Bar) ───
function PyramidChartView({ chart }: { chart: ChartConfig }) {
  const { theme, colors, tooltip } = useChartTheme();
  const mobile = useIsMobile();

  const pyramidData = chart.data.map((d: { grupo: string; mujeres: number; varones: number }) => ({
    grupo: d.grupo,
    Varones: -d.varones,
    Mujeres: d.mujeres,
  }));
  const limit = Math.max(...chart.data.map((d: { mujeres: number; varones: number }) => Math.max(d.mujeres, d.varones)));

  return (
    <>
    <div style={{ height: pyramidData.length * (mobile ? 22 : 24) + 44 }}>
      <ResponsiveBar
        data={pyramidData}
        keys={['Varones', 'Mujeres']}
        indexBy="grupo"
        layout="horizontal"
        minValue={-limit}
        maxValue={limit}
        margin={{ top: 8, right: 12, bottom: 32, left: 62 }}
        padding={0.16}
        colors={colors}
        axisBottom={{
          tickSize: 0,
          tickPadding: 6,
          tickValues: 5,
          format: (v: number) => formatCompact(v),
        }}
        axisLeft={{ tickSize: 0, tickPadding: 8 }}
        enableGridX
        enableGridY={false}
        gridXValues={5}
        theme={theme}
        animate={false}
        enableLabel={false}
        tooltip={({ id, value, indexValue }) => (
          <div style={tooltip}>
            <strong>{String(indexValue)} años</strong><br />
            {String(id)}: {formatValue(Math.abs(Number(value)))}
          </div>
        )}
      />
    </div>
    <ChartLegend items={['Varones', 'Mujeres']} colors={colors} />
    </>
  );
}

// ─── Choropleth Map of 18 Mendoza departments ───
type GeoFC = { type: 'FeatureCollection'; features: Array<{ type: 'Feature'; id: string; properties: Record<string, unknown>; geometry: unknown }> };
let mendozaGeoCache: GeoFC | null = null;

function useMendozaGeo() {
  const [geo, setGeo] = useState<GeoFC | null>(mendozaGeoCache);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (mendozaGeoCache) return;
    fetch('/mendoza-departamentos.geojson')
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((data: GeoFC) => { mendozaGeoCache = data; setGeo(data); })
      .catch(() => setFailed(true));
  }, []);
  return { geo, failed };
}

function colorScale(t: number, isDark: boolean): string {
  const c = Math.max(0, Math.min(1, t));
  const [from, to] = isDark
    ? [[40, 52, 78], [147, 197, 248]]
    : [[216, 207, 184], [31, 78, 137]];
  return `rgb(${from.map((v, i) => Math.round(v + (to[i] - v) * c)).join(',')})`;
}

const MAP_LABELS = ['50105', '50077', '50091']; // San Rafael, Malargüe, San Carlos

function MapChartView({ chart }: { chart: ChartConfig }) {
  const { isDark } = useChartTheme();
  const mobile = useIsMobile();
  const { geo, failed } = useMendozaGeo();
  const height = mobile ? 400 : 460;
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<string | null>(null);
  const format = chart.config?.format;
  const unit = chart.config?.unit;

  // Callback ref: el contenedor recién existe cuando llega el geojson.
  const containerRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
  }, []);

  const valueById = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of chart.data || []) {
      const v = Number(d.value);
      if (d.id && Number.isFinite(v)) m.set(String(d.id), v);
    }
    return m;
  }, [chart.data]);

  const paths = useMemo(() => {
    if (!geo || width < 50) return [];
    const projection = geoMercator().fitExtent(
      [[6, 6], [width - 6, height - 6]],
      { type: 'FeatureCollection', features: geo.features } as unknown as GeoPermissibleObjects,
    );
    const pathGen = geoPath(projection);
    return geo.features.map(f => {
      const centroid = pathGen.centroid(f as unknown as GeoPermissibleObjects);
      return {
        id: String(f.id ?? f.properties?.id ?? ''),
        nombre: String(f.properties?.nombre ?? ''),
        d: pathGen(f as unknown as GeoPermissibleObjects) || '',
        cx: centroid[0],
        cy: centroid[1],
      };
    });
  }, [geo, width, height]);

  if (failed) return <p className="figure-empty">No se pudo cargar el mapa. Los datos están en la tabla de abajo.</p>;
  if (!geo) return <p className="figure-empty" style={{ height }}>Cargando mapa…</p>;

  const values = Array.from(valueById.values());
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const activePath = active ? paths.find(p => p.id === active) : undefined;

  return (
    <div className="map">
      <p className="map-readout" aria-live="polite">
        {activePath
          ? <><strong>{activePath.nombre}</strong> {formatValue(valueById.get(activePath.id), format, unit)}</>
          : mobile ? 'Tocá un departamento para ver su valor.' : 'Pasá por un departamento para ver su valor.'}
      </p>
      <div ref={containerRef} style={{ width: '100%', height }}>
        {width >= 50 && (
          <svg width={width} height={height} style={{ display: 'block' }} onMouseLeave={() => setActive(null)}>
            {paths.map(p => {
              const v = valueById.get(p.id);
              const fill = v != null ? colorScale((v - lo) / span, isDark) : 'transparent';
              return (
                <path
                  key={p.id}
                  d={p.d}
                  fill={fill}
                  stroke={active === p.id ? (isDark ? '#FFFFFF' : '#11142E') : (isDark ? '#06090F' : '#F2EDE2')}
                  strokeWidth={active === p.id ? 1.6 : 0.7}
                  tabIndex={0}
                  role="button"
                  aria-label={`${p.nombre}: ${formatValue(v, format, unit)}`}
                  onMouseEnter={() => setActive(p.id)}
                  onFocus={() => setActive(p.id)}
                  onClick={() => setActive(p.id)}
                />
              );
            })}
            {paths.filter(p => MAP_LABELS.includes(p.id)).map(p => (
              <text key={p.id} x={p.cx} y={p.cy} textAnchor="middle" dominantBaseline="middle" className="map-label">
                {p.nombre}
              </text>
            ))}
          </svg>
        )}
      </div>
      <div className="map-legend" aria-hidden="true">
        <span>{formatValue(lo, format)}</span>
        <span
          className="map-legend-bar"
          style={{ background: `linear-gradient(90deg, ${colorScale(0, isDark)}, ${colorScale(1, isDark)})` }}
        />
        <span>{formatValue(hi, format)}</span>
      </div>
    </div>
  );
}
