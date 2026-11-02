import type { ReportEntry } from '../types/report';

// ═══════════════════════════════════════════════════════════════
// Report Registry — Dashboard Mendoza
// Informes de Población (Censo 2022) y de Seguridad.
//
// Categorías espejadas de la organización de /Poblacion/<n>- <categoria>/
// (Censo 2022 INDEC, sufijo _13).
// ═══════════════════════════════════════════════════════════════

export const REPORTS: ReportEntry[] = [
  {
    id: 'poblacion-estructura',
    slug: 'poblacion/estructura',
    title: 'Estructura por sexo y edad',
    shortTitle: 'Estructura',
    description: 'Cuántos somos, cuánto creció cada departamento y cómo se reparte la población por edad y sexo.',
    category: 'Población',
    subcategory: 'Estructura',
    image: 'valle-de-uco',
    mdPath: '/reports/poblacion/estructura.md',
    dataPath: '/data/poblacion/estructura.json',
    order: 1,
  },
  {
    id: 'poblacion-habitacional-personas',
    slug: 'poblacion/habitacional-personas',
    title: 'Condiciones habitacionales de la población',
    shortTitle: 'Hábitat',
    description: 'Acceso de las personas al agua, la cloaca y la energía para cocinar.',
    category: 'Población',
    subcategory: 'Hábitat',
    image: 'potrerillos',
    mdPath: '/reports/poblacion/habitacional-personas.md',
    dataPath: '/data/poblacion/habitacional-personas.json',
    order: 2,
  },
  {
    id: 'poblacion-salud-prevision',
    slug: 'poblacion/salud-prevision',
    title: 'Salud y previsión social',
    shortTitle: 'Salud y previsión',
    description: 'Cobertura de salud y percepción de jubilaciones y pensiones, por departamento.',
    category: 'Población',
    subcategory: 'Salud y previsión',
    image: 'puente-del-inca',
    mdPath: '/reports/poblacion/salud-prevision.md',
    dataPath: '/data/poblacion/salud-prevision.json',
    order: 3,
  },
  {
    id: 'poblacion-hogares',
    slug: 'poblacion/hogares',
    title: 'Condiciones habitacionales de los hogares',
    shortTitle: 'Hogares',
    description: 'Cuántos hogares hay, de qué tamaño y con qué materiales y servicios.',
    category: 'Población',
    subcategory: 'Hogares',
    image: 'pueblo-uco',
    mdPath: '/reports/poblacion/hogares.md',
    dataPath: '/data/poblacion/hogares.json',
    order: 4,
  },
  {
    id: 'poblacion-viviendas',
    slug: 'poblacion/viviendas',
    title: 'Stock habitacional y viviendas',
    shortTitle: 'Viviendas',
    description: 'Cuántas viviendas hay, de qué tipo y en qué condición de ocupación.',
    category: 'Población',
    subcategory: 'Viviendas',
    image: 'ciudad',
    mdPath: '/reports/poblacion/viviendas.md',
    dataPath: '/data/poblacion/viviendas.json',
    order: 5,
  },
  {
    id: 'poblacion-educacion',
    slug: 'poblacion/educacion',
    title: 'Educación',
    shortTitle: 'Educación',
    description: 'Asistencia escolar, nivel al que se asiste y máximo nivel alcanzado.',
    category: 'Población',
    subcategory: 'Educación',
    image: 'uncuyo',
    mdPath: '/reports/poblacion/educacion.md',
    dataPath: '/data/poblacion/educacion.json',
    order: 6,
  },
  {
    id: 'poblacion-actividad-economica',
    slug: 'poblacion/actividad-economica',
    title: 'Características económicas',
    shortTitle: 'Actividad',
    description: 'Actividad, empleo, desocupación y categoría ocupacional.',
    category: 'Población',
    subcategory: 'Actividad económica',
    image: 'vinedos',
    mdPath: '/reports/poblacion/actividad-economica.md',
    dataPath: '/data/poblacion/actividad-economica.json',
    order: 7,
  },
  {
    id: 'poblacion-fecundidad',
    slug: 'poblacion/fecundidad',
    title: 'Fecundidad',
    shortTitle: 'Fecundidad',
    description: 'Hijas e hijos por mujer, por grupo de edad y por departamento.',
    category: 'Población',
    subcategory: 'Fecundidad',
    image: 'parque',
    mdPath: '/reports/poblacion/fecundidad.md',
    dataPath: '/data/poblacion/fecundidad.json',
    order: 8,
  },
  {
    id: 'seguridad-snic',
    slug: 'seguridad/snic',
    title: 'Seguridad: hechos delictivos en la provincia',
    shortTitle: 'Delitos (SNIC)',
    description: 'Hechos registrados entre 2000 y 2024 y comparación con las otras jurisdicciones.',
    category: 'Seguridad',
    subcategory: 'SNIC provincial',
    image: 'payunia',
    mdPath: '/reports/seguridad/snic.md',
    dataPath: '/data/seguridad/snic.json',
    order: 9,
  },
];

export function getReportBySlug(slug: string): ReportEntry | undefined {
  return REPORTS.find(r => r.slug === slug);
}

export function getPoblacionReports(): ReportEntry[] {
  return REPORTS.filter(r => r.category === 'Población');
}

export function getSeguridadReports(): ReportEntry[] {
  return REPORTS.filter(r => r.category === 'Seguridad');
}
