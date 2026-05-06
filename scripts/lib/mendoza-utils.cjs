// ════════════════════════════════════════════════════════════════════
// Utilidades compartidas para el pipeline del Dashboard Mendoza.
// Fuentes: INDEC Censo 2022 (xlsx por cuadro provincial, una fila por
//          departamento + fila "Total" provincial),
//          SNIC provincial (CSV panel por provincia).
// ════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const INDEC_BASE =
  'C:/Users/dante/Desktop/Laboratorio Colossus/Pipeline OpenArg/datos_indec';
const SEG_BASE =
  'C:/Users/dante/Desktop/Laboratorio Colossus/Pipeline OpenArg/datos_abiertos/datasets/seguridad';

// ── Identidad provincial ────────────────────────────────────────────
const MENDOZA = {
  codigo: '50',         // código provincial (aparece como número 50 en celdas XLSX)
  codigoIndec: '13',    // sufijo de archivo (orden alfabético-INDEC de provincias)
  nombre: 'Mendoza',
  nombreUpper: 'MENDOZA',
};

// ── Los 18 departamentos de Mendoza ──────────────────────────────────
// Códigos INDEC tal como aparecen en los cuadros (números enteros).
const MENDOZA_DEPTOS = [
  { codigo: '50007', nombre: 'Capital' },
  { codigo: '50014', nombre: 'General Alvear' },
  { codigo: '50021', nombre: 'Godoy Cruz' },
  { codigo: '50028', nombre: 'Guaymallén' },
  { codigo: '50035', nombre: 'Junín' },
  { codigo: '50042', nombre: 'La Paz' },
  { codigo: '50049', nombre: 'Las Heras' },
  { codigo: '50056', nombre: 'Lavalle' },
  { codigo: '50063', nombre: 'Luján de Cuyo' },
  { codigo: '50070', nombre: 'Maipú' },
  { codigo: '50077', nombre: 'Malargüe' },
  { codigo: '50084', nombre: 'Rivadavia' },
  { codigo: '50091', nombre: 'San Carlos' },
  { codigo: '50098', nombre: 'San Martín' },
  { codigo: '50105', nombre: 'San Rafael' },
  { codigo: '50112', nombre: 'Santa Rosa' },
  { codigo: '50119', nombre: 'Tunuyán' },
  { codigo: '50126', nombre: 'Tupungato' },
];

const DEPTO_CODIGOS = new Set(MENDOZA_DEPTOS.map(d => d.codigo));

// ── Normalización de strings ─────────────────────────────────────────
function normalize(s) {
  return (s || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[.,()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// ── Parse de números (formato INDEC) ─────────────────────────────────
function toNumber(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return v;
  const cleaned = String(v).replace(/\s/g, '').replace(/,/g, '');
  if (!/^-?[\d.]+$/.test(cleaned)) return null;
  return Number(cleaned);
}

// ── Lectura de hoja como matriz ──────────────────────────────────────
function readSheetMatrix(file, sheetName) {
  const wb = XLSX.readFile(file);
  let resolved;
  if (sheetName && wb.Sheets[sheetName]) {
    resolved = sheetName;
  } else if (sheetName) {
    const target = sheetName.replace(/\s+/g, '').toLowerCase();
    resolved = wb.SheetNames.find(n => n.replace(/\s+/g, '').toLowerCase() === target);
  }
  if (!resolved) {
    resolved = wb.SheetNames.find(n => /cuadro\s*\d+\.13$/i.test(n))
      || wb.SheetNames.find(n => /cuadro/i.test(n))
      || wb.SheetNames[0];
  }
  const sheet = wb.Sheets[resolved];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true });
}

// ── Encuentra la fila Total provincial ───────────────────────────────
// En los cuadros de Mendoza la fila total es la primera donde col 0 = "50"
// (número) o col 1 contiene "Total" o "Mendoza".
function findTotalRow(matrix) {
  for (const row of matrix) {
    if (!row || row.length === 0) continue;
    const c0 = row[0];
    const c1 = row[1] == null ? '' : String(row[1]).trim().toLowerCase();
    if (c0 === 50 || c0 === '50') return row;
    if (c1 === 'total' || c1 === 'mendoza') return row;
  }
  return null;
}

// ── Encuentra la fila de un departamento por código ──────────────────
function findDeptoRow(matrix, codigo) {
  const numCode = Number(codigo);
  for (const row of matrix) {
    if (!row || row.length === 0) continue;
    const c0 = row[0];
    if (c0 === numCode || String(c0) === codigo) return row;
  }
  return null;
}

// ── Extrae todas las filas de los 18 departamentos ───────────────────
function extractDeptoRows(matrix) {
  const rows = [];
  for (const d of MENDOZA_DEPTOS) {
    const r = findDeptoRow(matrix, d.codigo);
    if (r) rows.push({ codigo: d.codigo, nombre: d.nombre, row: r });
  }
  return rows;
}

// ── Escritura de JSON ────────────────────────────────────────────────
function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  const sizeKb = (fs.statSync(filePath).size / 1024).toFixed(1);
  console.log(`  ✓ ${path.relative(process.cwd(), filePath)} (${sizeKb} KB)`);
}

// ── CSV simple ───────────────────────────────────────────────────────
function readCsvSimple(file, delimiter = ';') {
  const content = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  const lines = content.split(/\r?\n/).filter(l => l.length > 0);
  const header = lines.shift().split(delimiter);
  return {
    header,
    rows: lines.map(l => {
      const vals = l.split(delimiter);
      const o = {};
      header.forEach((h, i) => { o[h] = vals[i]; });
      return o;
    }),
  };
}

// ── Formatos ─────────────────────────────────────────────────────────
function fmtInt(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('es-AR').format(Math.round(n));
}
function fmtPct(n, digits = 1) {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n.toFixed(digits).replace('.', ',')}%`;
}
function fmtDec(n, digits = 1) {
  if (n == null || Number.isNaN(n)) return '—';
  return n.toFixed(digits).replace('.', ',');
}

// ── KPI hero (item de "mapData" usado como bloque destacado) ─────────
function buildFeatured(value, formatted, caption) {
  if (value == null) return [];
  return [{
    municipioId: '50',
    municipioNombre: 'Mendoza',
    value,
    formatted,
    caption,
    label: `${formatted} · ${caption}`,
  }];
}

// ── Ranking de departamentos ─────────────────────────────────────────
// Recibe filas {codigo, nombre, row} + extractor (row => value) y orden.
function rankDeptos(deptoRows, extractor, order = 'desc') {
  const items = deptoRows
    .map(({ codigo, nombre, row }) => ({
      name: nombre,
      value: toNumber(extractor(row)),
      municipioId: codigo,
    }))
    .filter(d => d.value != null);
  items.sort((a, b) => order === 'desc' ? b.value - a.value : a.value - b.value);
  return items;
}

// ── Construye datos para el mapa coroplético ─────────────────────────
// El componente Map espera entradas con shape { id: '50007', value: N }.
function buildMapData(deptoRows, extractor) {
  return deptoRows
    .map(({ codigo, row }) => ({
      id: codigo,
      value: toNumber(extractor(row)),
    }))
    .filter(d => d.value != null);
}

module.exports = {
  INDEC_BASE,
  SEG_BASE,
  MENDOZA,
  MENDOZA_DEPTOS,
  DEPTO_CODIGOS,
  normalize,
  toNumber,
  readSheetMatrix,
  findTotalRow,
  findDeptoRow,
  extractDeptoRows,
  rankDeptos,
  buildMapData,
  readCsvSimple,
  writeJson,
  fmtInt,
  fmtPct,
  fmtDec,
  buildFeatured,
};
