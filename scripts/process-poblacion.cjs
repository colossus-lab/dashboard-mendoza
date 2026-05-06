// ════════════════════════════════════════════════════════════════════
// process-poblacion.cjs — Dashboard Mendoza
// Genera los 8 informes de Población a partir de cuadros INDEC Censo 2022
// para Mendoza (sufijo _13). Una fila por departamento + fila Total provincial.
//
// Outputs:
//   public/data/poblacion/estructura.json
//   public/data/poblacion/habitacional-personas.json
//   public/data/poblacion/salud-prevision.json
//   public/data/poblacion/hogares.json
//   public/data/poblacion/viviendas.json
//   public/data/poblacion/educacion.json
//   public/data/poblacion/actividad-economica.json
//   public/data/poblacion/fecundidad.json
//   public/data/resumen.json
// ════════════════════════════════════════════════════════════════════

const path = require('path');
const {
  INDEC_BASE,
  MENDOZA,
  MENDOZA_DEPTOS,
  toNumber,
  readSheetMatrix,
  findTotalRow,
  extractDeptoRows,
  rankDeptos,
  buildMapData,
  writeJson,
  fmtInt,
  fmtPct,
  fmtDec,
  buildFeatured,
} = require('./lib/mendoza-utils.cjs');

const CENSO_DIR = path.join(INDEC_BASE, 'poblacion', 'censo_2022');
const OUT_DIR = path.join(__dirname, '..', 'public', 'data', 'poblacion');
const SOURCE = 'INDEC — Censo Nacional de Población, Hogares y Viviendas 2022';
const DATE = new Date().toISOString().slice(0, 10);

function loadCuadro(file) {
  return readSheetMatrix(path.join(CENSO_DIR, file));
}

function safeRatio(num, den) {
  if (!den) return null;
  return (num / den) * 100;
}

// ════════════════════════════════════════════════════════════════════
// 1. ESTRUCTURA POR SEXO Y EDAD
// ════════════════════════════════════════════════════════════════════
function processEstructura() {
  console.log('\n─── 1. Estructura ───');

  // est_c1: Población 2010, 2022, variación
  const c1 = loadCuadro('c2022_mendoza_est_c1_13.xlsx');
  const c1Total = findTotalRow(c1);
  const pob2010 = toNumber(c1Total[2]);
  const pob2022 = toNumber(c1Total[3]);
  const varAbs = toNumber(c1Total[4]);
  const varRel = toNumber(c1Total[5]);

  // est_c2: superficie y densidad
  const c2 = loadCuadro('c2022_mendoza_est_c2_13.xlsx');
  const c2Total = findTotalRow(c2);
  const superficie = toNumber(c2Total[2]);
  const densidad = toNumber(c2Total[4]);

  // est_c4: distribución por sexo (total + por edad)
  const c4 = loadCuadro('c2022_mendoza_est_c4_13.xlsx');
  // Fila "Total" (col 0 == "Total")
  const c4Total = c4.find(r => r && String(r[0]).toLowerCase() === 'total');
  const totalPob = toNumber(c4Total?.[1]);
  const mujeres = toNumber(c4Total?.[2]);
  const varones = toNumber(c4Total?.[3]);
  const indiceFem = toNumber(c4Total?.[4]);

  // est_c6: edad mediana por departamento
  const c6 = loadCuadro('c2022_mendoza_est_c6_13.xlsx');
  const c6Total = findTotalRow(c6);
  const edadMediana = toNumber(c6Total[2]);
  const edadMedianaMuj = toNumber(c6Total[3]);
  const edadMedianaVar = toNumber(c6Total[4]);

  const c1Deptos = extractDeptoRows(c1);
  const rankPob2022 = rankDeptos(c1Deptos, r => r[3], 'desc');
  const rankVarRel = rankDeptos(c1Deptos, r => r[5], 'desc');

  const c2Deptos = extractDeptoRows(c2);
  const rankDensidad = rankDeptos(c2Deptos, r => r[4], 'desc');

  const c6Deptos = extractDeptoRows(c6);
  const rankEdadMediana = rankDeptos(c6Deptos, r => r[2], 'desc');

  // Pirámide simplificada por grupos quinquenales desde est_c4
  // (col 0 = etiqueta edad, col 1 = total, col 2 = mujeres, col 3 = varones)
  const grupos = ['0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74', '75-79', '80 y más'];
  const piramide = [];
  for (const g of grupos) {
    const row = c4.find(r => r && String(r[0]).trim() === g);
    if (!row) continue;
    piramide.push({
      grupo: g,
      mujeres: toNumber(row[2]) || 0,
      varones: toNumber(row[3]) || 0,
    });
  }

  const json = {
    meta: {
      id: 'poblacion-estructura',
      title: 'Estructura por Sexo y Edad — Mendoza',
      category: 'Población',
      subcategory: 'Estructura',
      source: SOURCE,
      date: DATE,
    },
    kpis: [
      { id: 'pob-2022', label: 'Población 2022', value: pob2022, formatted: fmtInt(pob2022), unit: 'hab', status: 'good', comparison: `Variación 2010-2022: ${fmtPct(varRel)}` },
      { id: 'var-abs', label: 'Crecimiento absoluto 2010-2022', value: varAbs, formatted: '+' + fmtInt(varAbs), unit: 'hab', status: 'good', comparison: `${fmtPct(varRel)} respecto a 2010` },
      { id: 'densidad', label: 'Densidad provincial', value: densidad, formatted: fmtDec(densidad), unit: 'hab/km²', comparison: `Superficie: ${fmtInt(superficie)} km²` },
      { id: 'edad-mediana', label: 'Edad mediana', value: edadMediana, formatted: String(edadMediana), unit: 'años', comparison: `Mujeres: ${edadMedianaMuj} · Varones: ${edadMedianaVar}` },
      { id: 'mujeres', label: 'Mujeres', value: mujeres, formatted: fmtInt(mujeres), comparison: indiceFem ? `Índice de feminidad: ${indiceFem}` : undefined },
      { id: 'varones', label: 'Varones', value: varones, formatted: fmtInt(varones), comparison: `Población total: ${fmtInt(totalPob)}` },
    ],
    charts: [
      {
        id: 'piramide-etaria',
        type: 'pyramid',
        title: 'Pirámide etaria — Mendoza 2022',
        sectionId: 'estructura',
        data: piramide,
      },
      {
        id: 'rank-poblacion',
        type: 'bar',
        title: 'Población 2022 por departamento',
        sectionId: 'departamentos',
        data: rankPob2022.map(r => ({ id: r.name, Población: r.value })),
        config: { xAxis: 'id', layout: 'horizontal' },
      },
      {
        id: 'rank-densidad',
        type: 'bar',
        title: 'Densidad poblacional por departamento (hab/km²)',
        sectionId: 'departamentos',
        data: rankDensidad.map(r => ({ id: r.name, Densidad: r.value })),
        config: { xAxis: 'id', layout: 'horizontal' },
      },
      {
        id: 'mapa-poblacion',
        type: 'map',
        title: 'Mapa: población por departamento',
        sectionId: 'departamentos',
        data: buildMapData(c1Deptos, r => r[3]),
      },
    ],
    rankings: [
      { id: 'rank-pob', title: 'Departamentos por población 2022', sectionId: 'departamentos', items: rankPob2022, order: 'desc' },
      { id: 'rank-var', title: 'Departamentos por variación 2010-2022 (%)', sectionId: 'departamentos', items: rankVarRel, order: 'desc' },
      { id: 'rank-densidad', title: 'Departamentos por densidad (hab/km²)', sectionId: 'departamentos', items: rankDensidad, order: 'desc' },
      { id: 'rank-edad', title: 'Departamentos por edad mediana (años)', sectionId: 'departamentos', items: rankEdadMediana, order: 'desc' },
    ],
    mapData: buildFeatured(pob2022, fmtInt(pob2022), 'Habitantes Mendoza · Censo 2022'),
  };
  writeJson(path.join(OUT_DIR, 'estructura.json'), json);
  return { pob2022, viviendas: null }; // for resumen
}

// ════════════════════════════════════════════════════════════════════
// 2. CONDICIONES HABITACIONALES DE LA POBLACIÓN
// ════════════════════════════════════════════════════════════════════
function processHabitacionalPersonas() {
  console.log('\n─── 2. Habitacional Personas ───');

  // pob_c2: agua (procedencia y provisión)
  const c2 = loadCuadro('c2022_mendoza_pob_c2_13.xlsx');
  const c2Total = c2.find(r => r && String(r[0]).toLowerCase() === 'total');
  const pobTotal = toNumber(c2Total[1]);
  const aguaCanieria = toNumber(c2Total[2]);
  const aguaFueraTerreno = toNumber(c2Total[4]);
  const pctCanieria = safeRatio(aguaCanieria, pobTotal);

  // Procedencia agua: filas 5-? son tipos de procedencia
  const procedenciaRows = c2.slice(5).filter(r => r && r[0] && r[1] != null && typeof r[1] === 'number');
  const procedencia = procedenciaRows.slice(0, 6).map(r => ({ id: String(r[0]).slice(0, 30), value: toNumber(r[1]) }));

  // pob_c4: combustible para cocinar — por departamento
  const c4 = loadCuadro('c2022_mendoza_pob_c4_13.xlsx');
  const c4Total = findTotalRow(c4);
  const totalPob4 = toNumber(c4Total[2]);
  const gasRed = toNumber(c4Total[4]);
  const garrafa = toNumber(c4Total[6]);
  const pctGasRed = safeRatio(gasRed, totalPob4);
  const pctGarrafa = safeRatio(garrafa, totalPob4);

  const c4Deptos = extractDeptoRows(c4);
  // Ranking deptos por % gas de red (col 4 / col 2)
  const rankGasRed = c4Deptos
    .map(({ codigo, nombre, row }) => ({
      name: nombre,
      municipioId: codigo,
      value: safeRatio(toNumber(row[4]), toNumber(row[2])),
    }))
    .filter(d => d.value != null)
    .sort((a, b) => b.value - a.value);

  const json = {
    meta: {
      id: 'poblacion-habitacional-personas',
      title: 'Condiciones Habitacionales de la Población — Mendoza',
      category: 'Población',
      subcategory: 'Habitacional Personas',
      source: SOURCE,
      date: DATE,
    },
    kpis: [
      { id: 'pob-particulares', label: 'Población en viviendas particulares', value: pobTotal, formatted: fmtInt(pobTotal), unit: 'hab' },
      { id: 'agua-canieria', label: 'Acceso a agua por cañería', value: pctCanieria, formatted: fmtPct(pctCanieria), status: 'good' },
      { id: 'gas-red', label: 'Cocina con gas de red', value: pctGasRed, formatted: fmtPct(pctGasRed), status: 'good', comparison: `${fmtInt(gasRed)} personas` },
      { id: 'garrafa', label: 'Cocina con garrafa', value: pctGarrafa, formatted: fmtPct(pctGarrafa), status: 'warning', comparison: `${fmtInt(garrafa)} personas` },
    ],
    charts: [
      {
        id: 'procedencia-agua',
        type: 'pie',
        title: 'Procedencia del agua — Mendoza',
        sectionId: 'agua',
        data: procedencia,
      },
      {
        id: 'rank-gas-red',
        type: 'bar',
        title: '% de población con gas de red por departamento',
        sectionId: 'departamentos',
        data: rankGasRed.map(r => ({ id: r.name, '% Gas red': r.value })),
        config: { xAxis: 'id', layout: 'horizontal' },
      },
      {
        id: 'mapa-gas-red',
        type: 'map',
        title: 'Mapa: % de población con gas de red',
        sectionId: 'departamentos',
        data: c4Deptos.map(({ codigo, row }) => ({ id: codigo, value: safeRatio(toNumber(row[4]), toNumber(row[2])) })).filter(d => d.value != null),
      },
    ],
    rankings: [
      { id: 'rank-gas', title: 'Departamentos por % de gas de red', sectionId: 'departamentos', items: rankGasRed, order: 'desc' },
    ],
    mapData: buildFeatured(pctGasRed, fmtPct(pctGasRed), 'Población con gas de red en Mendoza'),
  };
  writeJson(path.join(OUT_DIR, 'habitacional-personas.json'), json);
}

// ════════════════════════════════════════════════════════════════════
// 3. SALUD Y PREVISIÓN SOCIAL
// ════════════════════════════════════════════════════════════════════
function processSaludPrevision() {
  console.log('\n─── 3. Salud y Previsión ───');

  // salud_c1: cobertura por departamento
  const c1 = loadCuadro('c2022_mendoza_salud_c1_13.xlsx');
  const c1Total = findTotalRow(c1);
  const pobTotal = toNumber(c1Total[2]);
  const obraSocial = toNumber(c1Total[3]);
  const planEstatal = toNumber(c1Total[4]);
  const sinCobertura = toNumber(c1Total[5]);
  const pctObraSocial = safeRatio(obraSocial, pobTotal);
  const pctSinCobertura = safeRatio(sinCobertura, pobTotal);
  const pctEstatal = safeRatio(planEstatal, pobTotal);

  const c1Deptos = extractDeptoRows(c1);
  const rankObraSocial = c1Deptos
    .map(({ codigo, nombre, row }) => ({
      name: nombre,
      municipioId: codigo,
      value: safeRatio(toNumber(row[3]), toNumber(row[2])),
    }))
    .filter(d => d.value != null)
    .sort((a, b) => b.value - a.value);

  const rankSinCobertura = c1Deptos
    .map(({ codigo, nombre, row }) => ({
      name: nombre,
      municipioId: codigo,
      value: safeRatio(toNumber(row[5]), toNumber(row[2])),
    }))
    .filter(d => d.value != null)
    .sort((a, b) => b.value - a.value);

  // prevision_c3: jubilados/pensionados por departamento
  const p3 = loadCuadro('c2022_mendoza_prevision_c3_13.xlsx');
  const p3Total = findTotalRow(p3);
  const pobP3 = toNumber(p3Total[2]);
  const percibe = toNumber(p3Total[3]);
  const noPercibe = toNumber(p3Total[8]);
  const pctPercibe = safeRatio(percibe, pobP3);

  const p3Deptos = extractDeptoRows(p3);
  const rankPercibe = p3Deptos
    .map(({ codigo, nombre, row }) => ({
      name: nombre,
      municipioId: codigo,
      value: safeRatio(toNumber(row[3]), toNumber(row[2])),
    }))
    .filter(d => d.value != null)
    .sort((a, b) => b.value - a.value);

  const json = {
    meta: {
      id: 'poblacion-salud-prevision',
      title: 'Salud y Previsión Social — Mendoza',
      category: 'Población',
      subcategory: 'Salud y Previsión',
      source: SOURCE,
      date: DATE,
    },
    kpis: [
      { id: 'pob-total', label: 'Población en viviendas particulares', value: pobTotal, formatted: fmtInt(pobTotal), unit: 'hab' },
      { id: 'obra-social', label: 'Con obra social o prepaga', value: pctObraSocial, formatted: fmtPct(pctObraSocial), status: 'good', comparison: `${fmtInt(obraSocial)} personas (incluye PAMI)` },
      { id: 'sin-cobertura', label: 'Sin obra social ni plan estatal', value: pctSinCobertura, formatted: fmtPct(pctSinCobertura), status: 'critical', comparison: `${fmtInt(sinCobertura)} personas` },
      { id: 'plan-estatal', label: 'Con plan estatal de salud', value: pctEstatal, formatted: fmtPct(pctEstatal), comparison: `${fmtInt(planEstatal)} personas` },
      { id: 'percibe-jubilacion', label: 'Percibe jubilación o pensión', value: pctPercibe, formatted: fmtPct(pctPercibe), comparison: `${fmtInt(percibe)} personas` },
    ],
    charts: [
      {
        id: 'cobertura-pie',
        type: 'pie',
        title: 'Cobertura de salud — Mendoza',
        sectionId: 'cobertura',
        data: [
          { id: 'Obra social/prepaga', value: obraSocial },
          { id: 'Plan estatal', value: planEstatal },
          { id: 'Sin cobertura', value: sinCobertura },
        ],
      },
      {
        id: 'rank-obra-social',
        type: 'bar',
        title: '% con obra social/prepaga por departamento',
        sectionId: 'departamentos',
        data: rankObraSocial.map(r => ({ id: r.name, '% Cobertura': r.value })),
        config: { xAxis: 'id', layout: 'horizontal' },
      },
      {
        id: 'rank-sin-cobertura',
        type: 'bar',
        title: '% sin cobertura por departamento',
        sectionId: 'departamentos',
        data: rankSinCobertura.map(r => ({ id: r.name, '% Sin cobertura': r.value })),
        config: { xAxis: 'id', layout: 'horizontal' },
      },
      {
        id: 'mapa-cobertura',
        type: 'map',
        title: 'Mapa: % de cobertura obra social/prepaga',
        sectionId: 'departamentos',
        data: c1Deptos.map(({ codigo, row }) => ({ id: codigo, value: safeRatio(toNumber(row[3]), toNumber(row[2])) })).filter(d => d.value != null),
      },
    ],
    rankings: [
      { id: 'rank-obra', title: 'Departamentos por % con obra social', sectionId: 'departamentos', items: rankObraSocial, order: 'desc' },
      { id: 'rank-sin', title: 'Departamentos por % sin cobertura', sectionId: 'departamentos', items: rankSinCobertura, order: 'desc' },
      { id: 'rank-jubilados', title: 'Departamentos por % de jubilados/pensionados', sectionId: 'departamentos', items: rankPercibe, order: 'desc' },
    ],
    mapData: buildFeatured(pctObraSocial, fmtPct(pctObraSocial), 'Cobertura obra social/prepaga en Mendoza'),
  };
  writeJson(path.join(OUT_DIR, 'salud-prevision.json'), json);
}

// ════════════════════════════════════════════════════════════════════
// 4. CONDICIONES HABITACIONALES DE LOS HOGARES
// ════════════════════════════════════════════════════════════════════
function processHogares() {
  console.log('\n─── 4. Hogares ───');

  // hogares_c1: techos x pisos
  const c1 = loadCuadro('c2022_mendoza_hogares_c1_13.xlsx');
  const c1Total = c1.find(r => r && String(r[0]).toLowerCase() === 'total');
  const totalHogares = toNumber(c1Total[1]);
  const pisoBuenos = toNumber(c1Total[2]);
  const pisoCarpeta = toNumber(c1Total[3]);
  const pisoTierra = toNumber(c1Total[4]);
  const pctPisoBuenos = safeRatio(pisoBuenos, totalHogares);
  const pctPisoTierra = safeRatio(pisoTierra, totalHogares);

  // hogares_c2: agua para hogares
  const c2 = loadCuadro('c2022_mendoza_hogares_c2_13.xlsx');
  const c2Total = c2.find(r => r && String(r[0]).toLowerCase() === 'total');
  const aguaCanieria = toNumber(c2Total[2]);
  const pctAguaCanieria = safeRatio(aguaCanieria, totalHogares);

  // vivienda_c2: hogares por departamento (col 3)
  const v2 = loadCuadro('c2022_mendoza_vivienda_c2_13.xlsx');
  const v2Deptos = extractDeptoRows(v2);
  const rankHogares = v2Deptos
    .map(({ codigo, nombre, row }) => ({
      name: nombre,
      municipioId: codigo,
      value: toNumber(row[3]),
    }))
    .filter(d => d.value != null)
    .sort((a, b) => b.value - a.value);

  const json = {
    meta: {
      id: 'poblacion-hogares',
      title: 'Condiciones Habitacionales de los Hogares — Mendoza',
      category: 'Población',
      subcategory: 'Hogares',
      source: SOURCE,
      date: DATE,
    },
    kpis: [
      { id: 'total-hogares', label: 'Total de hogares', value: totalHogares, formatted: fmtInt(totalHogares) },
      { id: 'pct-piso-bueno', label: 'Hogares con pisos terminados', value: pctPisoBuenos, formatted: fmtPct(pctPisoBuenos), status: 'good', comparison: 'Cerámica/mosaico/baldosa/madera' },
      { id: 'pct-piso-tierra', label: 'Hogares con piso de tierra/ladrillo suelto', value: pctPisoTierra, formatted: fmtPct(pctPisoTierra), status: 'critical', comparison: `${fmtInt(pisoTierra)} hogares` },
      { id: 'pct-agua-can', label: 'Hogares con agua por cañería', value: pctAguaCanieria, formatted: fmtPct(pctAguaCanieria), status: 'good', comparison: `${fmtInt(aguaCanieria)} hogares` },
    ],
    charts: [
      {
        id: 'pisos',
        type: 'pie',
        title: 'Material predominante de los pisos',
        sectionId: 'materiales',
        data: [
          { id: 'Pisos terminados', value: pisoBuenos },
          { id: 'Carpeta/contrapiso', value: pisoCarpeta },
          { id: 'Tierra/ladrillo suelto', value: pisoTierra },
        ],
      },
      {
        id: 'rank-hogares',
        type: 'bar',
        title: 'Hogares por departamento',
        sectionId: 'departamentos',
        data: rankHogares.map(r => ({ id: r.name, Hogares: r.value })),
        config: { xAxis: 'id', layout: 'horizontal' },
      },
      {
        id: 'mapa-hogares',
        type: 'map',
        title: 'Mapa: hogares por departamento',
        sectionId: 'departamentos',
        data: buildMapData(v2Deptos, r => r[3]),
      },
    ],
    rankings: [
      { id: 'rank-hogares', title: 'Departamentos por cantidad de hogares', sectionId: 'departamentos', items: rankHogares, order: 'desc' },
    ],
    mapData: buildFeatured(totalHogares, fmtInt(totalHogares), 'Hogares en Mendoza · Censo 2022'),
  };
  writeJson(path.join(OUT_DIR, 'hogares.json'), json);
  return { totalHogares };
}

// ════════════════════════════════════════════════════════════════════
// 5. VIVIENDAS
// ════════════════════════════════════════════════════════════════════
function processViviendas() {
  console.log('\n─── 5. Viviendas ───');

  // vivienda_c1: viviendas por depto
  const v1 = loadCuadro('c2022_mendoza_vivienda_c1_13.xlsx');
  const v1Total = findTotalRow(v1);
  const totalViv = toNumber(v1Total[2]);
  const vivPart = toNumber(v1Total[3]);
  const vivOcupadas = toNumber(v1Total[4]);
  const vivVacias = totalViv - vivPart;

  const v1Deptos = extractDeptoRows(v1);
  const rankViv = v1Deptos
    .map(({ codigo, nombre, row }) => ({
      name: nombre,
      municipioId: codigo,
      value: toNumber(row[2]),
    }))
    .filter(d => d.value != null)
    .sort((a, b) => b.value - a.value);

  // vivienda_c3: tipo de vivienda particular
  const v3 = loadCuadro('c2022_mendoza_vivienda_c3_13.xlsx');
  const v3Total = findTotalRow(v3);
  const casas = toNumber(v3Total[3]);
  const ranchos = toNumber(v3Total[4]);
  const casillas = toNumber(v3Total[5]);
  const departamentos = toNumber(v3Total[6]);

  const json = {
    meta: {
      id: 'poblacion-viviendas',
      title: 'Stock Habitacional y Viviendas — Mendoza',
      category: 'Población',
      subcategory: 'Viviendas',
      source: SOURCE,
      date: DATE,
    },
    kpis: [
      { id: 'total-viviendas', label: 'Total de viviendas', value: totalViv, formatted: fmtInt(totalViv) },
      { id: 'viviendas-particulares', label: 'Viviendas particulares', value: vivPart, formatted: fmtInt(vivPart), comparison: `${fmtInt(totalViv - vivPart)} colectivas` },
      { id: 'pct-casas', label: '% de casas (sobre vivienda particular)', value: safeRatio(casas, casas + departamentos), formatted: fmtPct(safeRatio(casas, casas + departamentos)), comparison: `${fmtInt(casas)} casas vs ${fmtInt(departamentos)} departamentos` },
      { id: 'departamentos-viv', label: 'Departamentos (vivienda)', value: departamentos, formatted: fmtInt(departamentos) },
    ],
    charts: [
      {
        id: 'tipo-vivienda',
        type: 'pie',
        title: 'Tipo de vivienda particular ocupada',
        sectionId: 'tipos',
        data: [
          { id: 'Casa', value: casas },
          { id: 'Departamento', value: departamentos },
          { id: 'Rancho', value: ranchos },
          { id: 'Casilla', value: casillas },
        ],
      },
      {
        id: 'rank-viviendas',
        type: 'bar',
        title: 'Total de viviendas por departamento',
        sectionId: 'departamentos',
        data: rankViv.map(r => ({ id: r.name, Viviendas: r.value })),
        config: { xAxis: 'id', layout: 'horizontal' },
      },
      {
        id: 'mapa-viviendas',
        type: 'map',
        title: 'Mapa: total de viviendas por departamento',
        sectionId: 'departamentos',
        data: buildMapData(v1Deptos, r => r[2]),
      },
    ],
    rankings: [
      { id: 'rank-viv', title: 'Departamentos por viviendas totales', sectionId: 'departamentos', items: rankViv, order: 'desc' },
    ],
    mapData: buildFeatured(totalViv, fmtInt(totalViv), 'Viviendas totales en Mendoza · Censo 2022'),
  };
  writeJson(path.join(OUT_DIR, 'viviendas.json'), json);
  return { totalViv, vivPart };
}

// ════════════════════════════════════════════════════════════════════
// 6. EDUCACIÓN
// ════════════════════════════════════════════════════════════════════
function processEducacion() {
  console.log('\n─── 6. Educación ───');

  // educacion_c1: condición de asistencia escolar
  const e1 = loadCuadro('c2022_mendoza_educacion_c1_13.xlsx');
  const e1Total = e1.find(r => r && String(r[0]).toLowerCase() === 'total');
  const pob = toNumber(e1Total[2]);
  const asiste = toNumber(e1Total[3]);
  const asistio = toNumber(e1Total[4]);
  const nuncaAsistio = toNumber(e1Total[5]);
  const pctAsiste = safeRatio(asiste, pob);
  const pctNunca = safeRatio(nuncaAsistio, pob);

  // educacion_c2: nivel educativo al que asiste
  const e2 = loadCuadro('c2022_mendoza_educacion_c2_13.xlsx');
  const e2Total = e2.find(r => r && String(r[0]).toLowerCase() === 'total');
  const matJard = toNumber(e2Total[4]);
  const sala45 = toNumber(e2Total[5]);
  const primario = toNumber(e2Total[6]);
  const secundario = toNumber(e2Total[7]);
  const terciario = toNumber(e2Total[8]);
  const universitario = toNumber(e2Total[9]);
  const posgrado = toNumber(e2Total[10]);

  // educacion_c3: máximo nivel
  const e3 = loadCuadro('c2022_mendoza_educacion_c3_13.xlsx');
  const e3Total = e3.find(r => r && String(r[0]).toLowerCase() === 'total');
  const pob5mas = toNumber(e3Total?.[2]);

  const json = {
    meta: {
      id: 'poblacion-educacion',
      title: 'Educación — Mendoza',
      category: 'Población',
      subcategory: 'Educación',
      source: SOURCE,
      date: DATE,
    },
    kpis: [
      { id: 'pob-edu', label: 'Población en viviendas particulares', value: pob, formatted: fmtInt(pob) },
      { id: 'pct-asiste', label: '% que asiste actualmente', value: pctAsiste, formatted: fmtPct(pctAsiste), status: 'good', comparison: `${fmtInt(asiste)} personas` },
      { id: 'pct-nunca', label: '% que nunca asistió', value: pctNunca, formatted: fmtPct(pctNunca), status: 'warning', comparison: `${fmtInt(nuncaAsistio)} personas (incluye <4 años)` },
      { id: 'universitario', label: 'Cursando universitario de grado', value: universitario, formatted: fmtInt(universitario) },
      { id: 'secundario', label: 'Cursando secundario', value: secundario, formatted: fmtInt(secundario) },
      { id: 'pob-5mas', label: 'Población 5 años y más', value: pob5mas, formatted: fmtInt(pob5mas) },
    ],
    charts: [
      {
        id: 'nivel-educativo',
        type: 'bar',
        title: 'Población que asiste por nivel educativo',
        sectionId: 'niveles',
        data: [
          { nivel: 'Inicial (jardín)', cantidad: (matJard || 0) + (sala45 || 0) },
          { nivel: 'Primario', cantidad: primario || 0 },
          { nivel: 'Secundario', cantidad: secundario || 0 },
          { nivel: 'Terciario', cantidad: terciario || 0 },
          { nivel: 'Universitario', cantidad: universitario || 0 },
          { nivel: 'Posgrado', cantidad: posgrado || 0 },
        ],
        config: { xAxis: 'nivel', layout: 'horizontal' },
      },
    ],
    rankings: [],
    mapData: buildFeatured(pctAsiste, fmtPct(pctAsiste), 'Población que asiste a un establecimiento educativo'),
  };
  writeJson(path.join(OUT_DIR, 'educacion.json'), json);
}

// ════════════════════════════════════════════════════════════════════
// 7. CARACTERÍSTICAS ECONÓMICAS
// ════════════════════════════════════════════════════════════════════
function processActividadEconomica() {
  console.log('\n─── 7. Actividad Económica ───');

  // actividad_economica_c1: PEA por depto
  const a1 = loadCuadro('c2022_mendoza_actividad_economica_c1_13.xlsx');
  const a1Total = findTotalRow(a1);
  const pob14mas = toNumber(a1Total[2]);
  const pea = toNumber(a1Total[3]);
  const ocupada = toNumber(a1Total[4]);
  const desocupada = toNumber(a1Total[5]);
  const noPea = toNumber(a1Total[6]);
  const tasaActividad = safeRatio(pea, pob14mas);
  const tasaEmpleo = safeRatio(ocupada, pob14mas);
  const tasaDesocupacion = safeRatio(desocupada, pea);

  const a1Deptos = extractDeptoRows(a1);
  const rankEmpleo = a1Deptos
    .map(({ codigo, nombre, row }) => ({
      name: nombre,
      municipioId: codigo,
      value: safeRatio(toNumber(row[4]), toNumber(row[2])),
    }))
    .filter(d => d.value != null)
    .sort((a, b) => b.value - a.value);

  const rankDesocupacion = a1Deptos
    .map(({ codigo, nombre, row }) => ({
      name: nombre,
      municipioId: codigo,
      value: safeRatio(toNumber(row[5]), toNumber(row[3])),
    }))
    .filter(d => d.value != null)
    .sort((a, b) => b.value - a.value);

  // actividad_economica_c3: categoría ocupacional
  const a3 = loadCuadro('c2022_mendoza_actividad_economica_c3_13.xlsx');
  const a3Total = a3.find(r => r && String(r[0]).toLowerCase() === 'total');
  const totalOcup = toNumber(a3Total[2]);
  const servDom = toNumber(a3Total[3]);
  const empleados = toNumber(a3Total[4]);
  const cuentaPropia = toNumber(a3Total[5]);
  const patron = toNumber(a3Total[6]);
  const trabFamiliar = toNumber(a3Total[7]);

  const json = {
    meta: {
      id: 'poblacion-actividad-economica',
      title: 'Características Económicas — Mendoza',
      category: 'Población',
      subcategory: 'Actividad Económica',
      source: SOURCE,
      date: DATE,
    },
    kpis: [
      { id: 'pob-14mas', label: 'Población 14 años y más', value: pob14mas, formatted: fmtInt(pob14mas) },
      { id: 'tasa-actividad', label: 'Tasa de actividad', value: tasaActividad, formatted: fmtPct(tasaActividad), comparison: `${fmtInt(pea)} económicamente activos` },
      { id: 'tasa-empleo', label: 'Tasa de empleo', value: tasaEmpleo, formatted: fmtPct(tasaEmpleo), status: 'good', comparison: `${fmtInt(ocupada)} ocupados` },
      { id: 'tasa-desocupacion', label: 'Tasa de desocupación', value: tasaDesocupacion, formatted: fmtPct(tasaDesocupacion), status: 'warning', comparison: `${fmtInt(desocupada)} desocupados` },
    ],
    charts: [
      {
        id: 'categoria-ocupacional',
        type: 'pie',
        title: 'Categoría ocupacional — ocupados',
        sectionId: 'categoria',
        data: [
          { id: 'Empleados/obreros', value: empleados },
          { id: 'Cuenta propia', value: cuentaPropia },
          { id: 'Servicio doméstico', value: servDom },
          { id: 'Patrón/empleador', value: patron },
          { id: 'Trab. familiar', value: trabFamiliar },
        ],
      },
      {
        id: 'rank-empleo',
        type: 'bar',
        title: 'Tasa de empleo por departamento (%)',
        sectionId: 'departamentos',
        data: rankEmpleo.map(r => ({ id: r.name, '% Empleo': r.value })),
        config: { xAxis: 'id', layout: 'horizontal' },
      },
      {
        id: 'rank-desocupacion',
        type: 'bar',
        title: 'Tasa de desocupación por departamento (%)',
        sectionId: 'departamentos',
        data: rankDesocupacion.map(r => ({ id: r.name, '% Desocup.': r.value })),
        config: { xAxis: 'id', layout: 'horizontal' },
      },
      {
        id: 'mapa-empleo',
        type: 'map',
        title: 'Mapa: tasa de empleo por departamento',
        sectionId: 'departamentos',
        data: a1Deptos.map(({ codigo, row }) => ({ id: codigo, value: safeRatio(toNumber(row[4]), toNumber(row[2])) })).filter(d => d.value != null),
      },
    ],
    rankings: [
      { id: 'rank-empleo', title: 'Departamentos por tasa de empleo', sectionId: 'departamentos', items: rankEmpleo, order: 'desc' },
      { id: 'rank-desocupacion', title: 'Departamentos por tasa de desocupación', sectionId: 'departamentos', items: rankDesocupacion, order: 'desc' },
    ],
    mapData: buildFeatured(tasaEmpleo, fmtPct(tasaEmpleo), 'Tasa de empleo en Mendoza'),
  };
  writeJson(path.join(OUT_DIR, 'actividad-economica.json'), json);
}

// ════════════════════════════════════════════════════════════════════
// 8. FECUNDIDAD
// ════════════════════════════════════════════════════════════════════
function processFecundidad() {
  console.log('\n─── 8. Fecundidad ───');

  // fecundidad_c1: hijos por mujer x departamento
  const f1 = loadCuadro('c2022_mendoza_fecundidad_c1_13.xlsx');
  const f1Total = findTotalRow(f1);
  const mujeres = toNumber(f1Total[2]);
  const ninguno = toNumber(f1Total[3]);
  const uno = toNumber(f1Total[4]);
  const dos = toNumber(f1Total[5]);
  const tres = toNumber(f1Total[6]);
  const cuatro = toNumber(f1Total[7]);
  const cincoMas = toNumber(f1Total[8]);
  const promedio = toNumber(f1Total[9]);
  const pctSinHijos = safeRatio(ninguno, mujeres);

  const f1Deptos = extractDeptoRows(f1);
  const rankPromedio = f1Deptos
    .map(({ codigo, nombre, row }) => ({
      name: nombre,
      municipioId: codigo,
      value: toNumber(row[9]),
    }))
    .filter(d => d.value != null)
    .sort((a, b) => b.value - a.value);

  // fecundidad_c2: por grupos quinquenales
  const f2 = loadCuadro('c2022_mendoza_fecundidad_c2_13.xlsx');
  const grupos = ['14', '15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49'];
  const promedioPorEdad = [];
  for (const g of grupos) {
    const row = f2.find(r => r && String(r[0]).trim() === g);
    if (!row) continue;
    promedioPorEdad.push({ grupo: g, promedio: toNumber(row[8]) });
  }

  const json = {
    meta: {
      id: 'poblacion-fecundidad',
      title: 'Fecundidad — Mendoza',
      category: 'Población',
      subcategory: 'Fecundidad',
      source: SOURCE,
      date: DATE,
    },
    kpis: [
      { id: 'mujeres-14-49', label: 'Mujeres de 14 a 49 años', value: mujeres, formatted: fmtInt(mujeres) },
      { id: 'promedio-hijos', label: 'Promedio de hijos por mujer (14-49)', value: promedio, formatted: fmtDec(promedio, 1), unit: 'hijos/mujer' },
      { id: 'pct-sin-hijos', label: '% sin hijos', value: pctSinHijos, formatted: fmtPct(pctSinHijos), comparison: `${fmtInt(ninguno)} mujeres` },
      { id: 'pct-5mas', label: '% con 5 hijos o más', value: safeRatio(cincoMas, mujeres), formatted: fmtPct(safeRatio(cincoMas, mujeres)), comparison: `${fmtInt(cincoMas)} mujeres` },
    ],
    charts: [
      {
        id: 'distribucion-hijos',
        type: 'pie',
        title: 'Distribución de mujeres por cantidad de hijos',
        sectionId: 'distribucion',
        data: [
          { id: 'Ninguno', value: ninguno },
          { id: '1', value: uno },
          { id: '2', value: dos },
          { id: '3', value: tres },
          { id: '4', value: cuatro },
          { id: '5 y más', value: cincoMas },
        ],
      },
      {
        id: 'fecundidad-edad',
        type: 'line',
        title: 'Fecundidad acumulada por grupo de edad (hijos/mujer)',
        sectionId: 'edades',
        data: promedioPorEdad.map(d => ({ edad: d.grupo, 'Hijos/mujer': d.promedio })),
        config: { xAxis: 'edad' },
      },
      {
        id: 'rank-fecundidad',
        type: 'bar',
        title: 'Promedio de hijos por mujer · departamentos',
        sectionId: 'departamentos',
        data: rankPromedio.map(r => ({ id: r.name, 'Hijos/mujer': r.value })),
        config: { xAxis: 'id', layout: 'horizontal' },
      },
      {
        id: 'mapa-fecundidad',
        type: 'map',
        title: 'Mapa: promedio de hijos por mujer (14-49)',
        sectionId: 'departamentos',
        data: buildMapData(f1Deptos, r => r[9]),
      },
    ],
    rankings: [
      { id: 'rank-promedio', title: 'Departamentos por promedio de hijos por mujer', sectionId: 'departamentos', items: rankPromedio, order: 'desc' },
    ],
    mapData: buildFeatured(promedio, fmtDec(promedio, 1) + ' hijos/mujer', 'Fecundidad acumulada · Mendoza'),
  };
  writeJson(path.join(OUT_DIR, 'fecundidad.json'), json);
}

// ════════════════════════════════════════════════════════════════════
// RESUMEN PROVINCIAL (single source of truth)
// ════════════════════════════════════════════════════════════════════
function processResumen({ pob2022, totalHogares, totalViv, vivPart }) {
  const out = path.join(__dirname, '..', 'public', 'data', 'resumen.json');
  writeJson(out, {
    meta: { source: SOURCE, date: DATE },
    poblacion: pob2022,
    hogares: totalHogares,
    viviendas: totalViv,
    viviendasParticulares: vivPart,
    departamentos: MENDOZA_DEPTOS.length,
  });
}

// ════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════
function main() {
  console.log('═══ Pipeline Población — Mendoza (Censo 2022) ═══');
  const { pob2022 } = processEstructura();
  processHabitacionalPersonas();
  processSaludPrevision();
  const { totalHogares } = processHogares();
  const { totalViv, vivPart } = processViviendas();
  processEducacion();
  processActividadEconomica();
  processFecundidad();
  processResumen({ pob2022, totalHogares, totalViv, vivPart });
  console.log('\n  ✅ 8 informes de población + resumen generados');
}

main();
