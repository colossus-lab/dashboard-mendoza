// ═══════════════════════════════════════════════════════════════
// ReportData — Schema for data.json files
// ═══════════════════════════════════════════════════════════════

export type ValueFormat = 'int' | 'pct' | 'dec1';

export interface ReportMeta {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  source: string;
  date: string;
  /** Qué cubre el informe y qué comparan sus rankings */
  scope: string;
}

export interface KPI {
  id: string;
  label: string;
  value: number;
  formatted: string;
  unit?: string;
  status?: 'good' | 'warning' | 'critical';
  comparison?: string;
}

export type ChartType = 'bar' | 'line' | 'pie' | 'pyramid' | 'map';

export interface ChartAnnotation {
  x: string;
  label: string;
}

export interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  /** Debe coincidir con un ancla {#id} de un título del .md */
  sectionId: string;
  data: any[];
  config?: {
    xAxis?: string;
    layout?: 'horizontal' | 'vertical';
    format?: ValueFormat;
    unit?: string;
    /** Total esperado: lo usa la validación y el cálculo de porcentajes */
    total?: number;
    max?: number;
    annotations?: ChartAnnotation[];
  };
}

export interface RankingConfig {
  id: string;
  title: string;
  sectionId: string;
  items: Array<{
    name: string;
    value: number;
    municipioId?: string;
  }>;
  order: 'asc' | 'desc';
  format?: ValueFormat;
  unit?: string;
}

export interface MapDataItem {
  municipioId: string;
  municipioNombre: string;
  value: number;
  /** Número ya formateado para mostrar en el hero ("331.183", "80,8 %") */
  formatted?: string;
  /** Caption que explica qué representa el número (overline) */
  caption?: string;
  label: string;
}

export interface ReportData {
  meta: ReportMeta;
  kpis: KPI[];
  charts: ChartConfig[];
  rankings: RankingConfig[];
  mapData: MapDataItem[];
}

// ═══════════════════════════════════════════════════════════════
// Report Registry Entry
// ═══════════════════════════════════════════════════════════════

export interface ReportEntry {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  category: string;
  subcategory?: string;
  /** Clave de src/data/generated/image-credits.json */
  image: string;
  mdPath: string;      // path to .md in public/reports/
  dataPath: string;    // path to data.json in public/data/
  order: number;
}
