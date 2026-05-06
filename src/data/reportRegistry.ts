import type { ReportEntry } from '../types/report';

// ═══════════════════════════════════════════════════════════════
// Report Registry — Dashboard Mendoza
// 9 informes: 8 de Población (Censo 2022) + 1 de Seguridad (SNIC)
//
// Categorías espejadas de la organización del usuario en
// /Poblacion/<n>- <categoria>/ (Censo 2022 INDEC, sufijo _13).
// ═══════════════════════════════════════════════════════════════

export const REPORTS: ReportEntry[] = [
  {
    id: 'poblacion-estructura',
    slug: 'poblacion/estructura',
    title: 'Estructura por Sexo y Edad',
    shortTitle: 'Estructura',
    category: 'Población',
    subcategory: 'Estructura',
    icon: '👥',
    color: '#00d4ff',
    mdPath: '/reports/poblacion/estructura.md',
    dataPath: '/data/poblacion/estructura.json',
    order: 1,
  },
  {
    id: 'poblacion-habitacional-personas',
    slug: 'poblacion/habitacional-personas',
    title: 'Condiciones Habitacionales de la Población',
    shortTitle: 'Hábitat Personas',
    category: 'Población',
    subcategory: 'Habitacional Personas',
    icon: '🏠',
    color: '#f59e0b',
    mdPath: '/reports/poblacion/habitacional-personas.md',
    dataPath: '/data/poblacion/habitacional-personas.json',
    order: 2,
  },
  {
    id: 'poblacion-salud-prevision',
    slug: 'poblacion/salud-prevision',
    title: 'Salud y Previsión Social',
    shortTitle: 'Salud y Previsión',
    category: 'Población',
    subcategory: 'Salud y Previsión',
    icon: '🏥',
    color: '#10b981',
    mdPath: '/reports/poblacion/salud-prevision.md',
    dataPath: '/data/poblacion/salud-prevision.json',
    order: 3,
  },
  {
    id: 'poblacion-hogares',
    slug: 'poblacion/hogares',
    title: 'Condiciones Habitacionales de los Hogares',
    shortTitle: 'Hogares',
    category: 'Población',
    subcategory: 'Hogares',
    icon: '🏗️',
    color: '#f97316',
    mdPath: '/reports/poblacion/hogares.md',
    dataPath: '/data/poblacion/hogares.json',
    order: 4,
  },
  {
    id: 'poblacion-viviendas',
    slug: 'poblacion/viviendas',
    title: 'Stock Habitacional y Viviendas',
    shortTitle: 'Viviendas',
    category: 'Población',
    subcategory: 'Viviendas',
    icon: '🏘️',
    color: '#8b5cf6',
    mdPath: '/reports/poblacion/viviendas.md',
    dataPath: '/data/poblacion/viviendas.json',
    order: 5,
  },
  {
    id: 'poblacion-educacion',
    slug: 'poblacion/educacion',
    title: 'Educación',
    shortTitle: 'Educación',
    category: 'Población',
    subcategory: 'Educación',
    icon: '🎓',
    color: '#ec4899',
    mdPath: '/reports/poblacion/educacion.md',
    dataPath: '/data/poblacion/educacion.json',
    order: 6,
  },
  {
    id: 'poblacion-actividad-economica',
    slug: 'poblacion/actividad-economica',
    title: 'Características Económicas',
    shortTitle: 'Actividad',
    category: 'Población',
    subcategory: 'Actividad Económica',
    icon: '💼',
    color: '#14b8a6',
    mdPath: '/reports/poblacion/actividad-economica.md',
    dataPath: '/data/poblacion/actividad-economica.json',
    order: 7,
  },
  {
    id: 'poblacion-fecundidad',
    slug: 'poblacion/fecundidad',
    title: 'Fecundidad',
    shortTitle: 'Fecundidad',
    category: 'Población',
    subcategory: 'Fecundidad',
    icon: '👶',
    color: '#a855f7',
    mdPath: '/reports/poblacion/fecundidad.md',
    dataPath: '/data/poblacion/fecundidad.json',
    order: 8,
  },
  {
    id: 'seguridad-snic',
    slug: 'seguridad/snic',
    title: 'Seguridad Ciudadana — SNIC Provincial',
    shortTitle: 'Delitos SNIC',
    category: 'Seguridad',
    subcategory: 'SNIC',
    icon: '🛡️',
    color: '#6366f1',
    mdPath: '/reports/seguridad/snic.md',
    dataPath: '/data/seguridad/snic.json',
    order: 9,
  },
];

export function getReportBySlug(slug: string): ReportEntry | undefined {
  return REPORTS.find(r => r.slug === slug);
}

export function getReportsByCategory(category: string): ReportEntry[] {
  return REPORTS.filter(r => r.category === category);
}

export function getPoblacionReports(): ReportEntry[] {
  return REPORTS.filter(r => r.category === 'Población');
}

export function getSectorialReports(): ReportEntry[] {
  return REPORTS.filter(r => r.category !== 'Población');
}
