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
//
// sectionId de cada gráfico y ranking = ancla {#id} de un título del .md.
// ════════════════════════════════════════════════════════════════════

const path = require('path');
const {
  MENDOZA_DEPTOS,
  findCuadro,
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

const OUT_DIR = path.join(__dirname, '..', 'public', 'data', 'poblacion');
const SOURCE = 'INDEC — Censo Nacional de Población, Hogares y Viviendas 2022';
const DATE = '2022-05-18'; // día del censo
const SCOPE_DEPTOS = 'Provincia de Mendoza · Censo 2022. Los rankings y mapas comparan los 18 departamentos.';

function loadCuadro(file) {
  return readSheetMatrix(findCuadro(file));
}

function safeRatio(num, den) {
  if (!den) return null;
  return (num / den) * 100;
}

function rowByLabel(matrix, label) {
  return matrix.find(r => r && String(r[0]).trim().toLowerCase() === label.toLowerCase());
}

// Ranking de departamentos por % entre dos columnas.
function rankRatio(deptos, numCol, denCol) {
  return deptos
    .map(({ codigo, nombre, row }) => ({
      name: nombre,
      municipioId: codigo,
      value: safeRatio(toNumber(row[numCol]), toNumber(row[denCol])),
    }))
    .filter(d => d.value != null)
    .sort((a, b) => b.value - a.value);
}

function mapRatio(deptos, numCol, denCol) {
  return deptos
    .map(({ codigo, row }) => ({ id: codigo, value: safeRatio(toNumber(row[numCol]), toNumber(row[denCol])) }))
    .filter(d => d.value != null);
}

// ════════════════════════════════════════════════════════════════════
// 1. ESTRUCTURA POR SEXO Y EDAD
// ════════════════════════════════════════════════════════════════════
function processEstructura() {
  console.log('\n─── 1. Estructura ───');

  // est_c1: Población 2010, 2022, variación
  const c1 = loadCuadro('c2022_mendoza_est_c1_13.xlsx');
  const c1Total = findTotalRow(c1);
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
  const c4Total = rowByLabel(c4, 'total');
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

  // Pirámide por grupos quinquenales desde est_c4
  // (col 0 = etiqueta edad, col 1 = total, col 2 = mujeres, col 3 = varones).
  // INDEC abre 80-84 … 100 y más: se agrupan en "80 y más".
  const grupos = ['0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74', '75-79'];
  const gruposMayores = ['80-84', '85-89', '90-94', '95-99', '100 y más'];
  const fila = g => {
    const row = rowByLabel(c4, g);
    if (!row) throw new Error(`est_c4: falta el grupo de edad ${g}`);
    return { mujeres: toNumber(row[2]) || 0, varones: toNumber(row[3]) || 0 };
  };
  const piramide = grupos.map(g => ({ grupo: g, ...fila(g) }));
  piramide.push(gruposMayores.map(fila).reduce(
    (acc, f) => ({ grupo: '80 y más', mujeres: acc.mujeres + f.mujeres, varones: acc.varones + f.varones }),
    { grupo: '80 y más', mujeres: 0, varones: 0 },
  ));

  const json = {
    meta: {
      id: 'poblacion-estructura',
      title: 'Estructura por Sexo y Edad — Mendoza',
      category: 'Población',
      subcategory: 'Estructura',
      source: SOURCE,
      date: DATE,
      scope: SCOPE_DEPTOS,
    },
    kpis: [
      { id: 'pob-2022', label: 'Población 2022', value: pob2022, formatted: fmtInt(pob2022), unit: 'hab', status: 'good', comparison: `Variación 2010-2022: ${fmtPct(varRel)}` },
      { id: 'var-abs', label: 'Crecimiento absoluto 2010-2022', value: varAbs, formatted: '+' + fmtInt(varAbs), unit: 'hab', status: 'good', comparison: `${fmtPct(varRel)} respecto a 2010` },
      { id: 'densidad', label: 'Densidad provincial', value: densidad, formatted: fmtDec(densidad), unit: 'hab/km²', comparison: `Superficie: ${fmtInt(superficie)} km²` },
      { id: 'edad-mediana', label: 'Edad mediana', value: edadMediana, formatted: String(edadMediana), unit: 'años', comparison: `Mujeres: ${edadMedianaMuj} · Varones: ${edadMedianaVar}` },
      { id: 'mujeres', label: 'Mujeres', value: mujeres, formatted: fmtInt(mujeres), comparison: indiceFem ? `Índice de feminidad: ${indiceFem}` : undefined },
      { id: 'varones', label: 'Varones', value: varones, formatted: fmtInt(varones), comparison: `Con sexo registrado: ${fmtInt(totalPob)} personas` },
    ],
    charts: [
      {
        id: 'piramide-etaria',
        type: 'pyramid',
        title: 'Pirámide etaria — Mendoza 2022',
        sectionId: 'estructura',
        data: piramide,
        config: { total: totalPob, format: 'int' },
      },
      {
        id: 'mapa-poblacion',
        type: 'map',
        title: 'Mapa: población por departamento',
        sectionId: 'departamentos',
        data: buildMapData(c1Deptos, r => r[3]),
        config: { format: 'int', unit: 'hab' },
      },
    ],
    rankings: [
      { id: 'rank-pob', title: 'Departamentos por población 2022', sectionId: 'departamentos', items: rankPob2022, order: 'desc', format: 'int', unit: 'hab' },
      { id: 'rank-var', title: 'Departamentos por variación 2010-2022', sectionId: 'departamentos', items: rankVarRel, order: 'desc', format: 'pct' },
      { id: 'rank-densidad', title: 'Departamentos por densidad', sectionId: 'departamentos', items: rankDensidad, order: 'desc', format: 'dec1', unit: 'hab/km²' },
      { id: 'rank-edad', title: 'Departamentos por edad mediana', sectionId: 'estructura', items: rankEdadMediana, order: 'desc', format: 'int', unit: 'años' },
    ],
    mapData: buildFeatured(pob2022, fmtInt(pob2022), 'Habitantes Mendoza · Censo 2022'),
  };
  writeJson(path.join(OUT_DIR, 'estructura.json'), json);
  return { pob2022, varRel, superficie, densidad };
}

// ════════════════════════════════════════════════════════════════════
// 2. CONDICIONES HABITACIONALES DE LA POBLACIÓN
// ════════════════════════════════════════════════════════════════════
function processHabitacionalPersonas() {
  console.log('\n─── 2. Habitacional Personas ───');

  // pob_c2: agua (procedencia y provisión)
  const c2 = loadCuadro('c2022_mendoza_pob_c2_13.xlsx');
  const c2Total = rowByLabel(c2, 'total');
  const pobTotal = toNumber(c2Total[1]);
  const aguaCanieria = toNumber(c2Total[2]);
  const pctCanieria = safeRatio(aguaCanieria, pobTotal);

  const etiquetasAgua = [
    ['Red pública (agua corriente)', 'Red pública (agua corriente)'],
    ['Perforación con bomba a motor', 'Perforación con bomba a motor'],
    ['Perforación con bomba manual', 'Perforación con bomba manual'],
    ['Pozo sin bomba', 'Pozo sin bomba'],
    ['Transporte por cisterna, agua de lluvia, río, canal, arroyo o acequia', 'Cisterna, lluvia, río, canal o acequia'],
    ['Otra procedencia', 'Otra procedencia'],
  ];
  const procedencia = etiquetasAgua.map(([fuente, id]) => ({ id, value: toNumber(rowByLabel(c2, fuente)[1]) }));
  const redPublica = procedencia[0].value;

  // pob_c3: desagüe del inodoro (la fila con col 1 = "Total" abre cada tipo)
  const c3 = loadCuadro('c2022_mendoza_pob_c3_13.xlsx');
  const desagueFila = label => toNumber(c3.find(r => r && String(r[0]).trim() === label && String(r[1]).trim() === 'Total')[2]);
  const cloaca = desagueFila('A red pública (cloaca)');
  const pctCloaca = safeRatio(cloaca, pobTotal);
  const desague = [
    { id: 'Red pública (cloaca)', value: cloaca },
    { id: 'Cámara séptica y pozo ciego', value: desagueFila('A cámara séptica y pozo ciego') },
    { id: 'Solo pozo ciego', value: desagueFila('Solo a pozo ciego') },
    { id: 'Hoyo o excavación', value: desagueFila('A hoyo, excavación en la tierra, etc.') },
    { id: 'No tiene', value: desagueFila('No tiene') },
  ];

  // pob_c4: combustible para cocinar — por departamento
  const c4 = loadCuadro('c2022_mendoza_pob_c4_13.xlsx');
  const c4Total = findTotalRow(c4);
  const totalPob4 = toNumber(c4Total[2]);
  const gasRed = toNumber(c4Total[4]);
  const garrafa = toNumber(c4Total[6]);
  const pctGasRed = safeRatio(gasRed, totalPob4);
  const pctGarrafa = safeRatio(garrafa, totalPob4);
  const combustible = [
    { id: 'Gas de red', value: gasRed },
    { id: 'Gas en garrafa', value: garrafa },
    { id: 'Electricidad', value: toNumber(c4Total[3]) },
    { id: 'Gas en tubo o a granel', value: toNumber(c4Total[5]) },
    { id: 'Leña o carbón', value: toNumber(c4Total[7]) },
    { id: 'Otro combustible', value: toNumber(c4Total[8]) },
  ];

  const c4Deptos = extractDeptoRows(c4);
  const rankGasRed = rankRatio(c4Deptos, 4, 2);
  const rankGarrafa = rankRatio(c4Deptos, 6, 2);

  const json = {
    meta: {
      id: 'poblacion-habitacional-personas',
      title: 'Condiciones Habitacionales de la Población — Mendoza',
      category: 'Población',
      subcategory: 'Habitacional Personas',
      source: SOURCE,
      date: DATE,
      scope: SCOPE_DEPTOS,
    },
    kpis: [
      { id: 'pob-particulares', label: 'Población en viviendas particulares', value: pobTotal, formatted: fmtInt(pobTotal), unit: 'hab' },
      { id: 'agua-canieria', label: 'Agua por cañería dentro de la vivienda', value: pctCanieria, formatted: fmtPct(pctCanieria), status: 'good', comparison: `${fmtInt(aguaCanieria)} personas` },
      { id: 'agua-red', label: 'Agua de red pública', value: safeRatio(redPublica, pobTotal), formatted: fmtPct(safeRatio(redPublica, pobTotal)), status: 'good', comparison: `${fmtInt(redPublica)} personas` },
      { id: 'cloaca', label: 'Desagüe a red cloacal', value: pctCloaca, formatted: fmtPct(pctCloaca), status: 'warning', comparison: `${fmtInt(pobTotal - cloaca)} personas sin red` },
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
        config: { total: pobTotal, format: 'int' },
      },
      {
        id: 'desague',
        type: 'pie',
        title: 'Desagüe del inodoro — Mendoza',
        sectionId: 'saneamiento',
        data: desague,
        config: { total: pobTotal, format: 'int' },
      },
      {
        id: 'combustible',
        type: 'pie',
        title: 'Combustible para cocinar — Mendoza',
        sectionId: 'energia',
        data: combustible,
        config: { total: totalPob4, format: 'int' },
      },
      {
        id: 'mapa-gas-red',
        type: 'map',
        title: 'Mapa: % de población con gas de red',
        sectionId: 'departamentos',
        data: mapRatio(c4Deptos, 4, 2),
        config: { format: 'pct' },
      },
    ],
    rankings: [
      { id: 'rank-gas', title: 'Departamentos por % de población con gas de red', sectionId: 'departamentos', items: rankGasRed, order: 'desc', format: 'pct' },
      { id: 'rank-garrafa', title: 'Departamentos por % de población que cocina con garrafa', sectionId: 'departamentos', items: rankGarrafa, order: 'desc', format: 'pct' },
    ],
    mapData: buildFeatured(pctCloaca, fmtPct(pctCloaca), 'Población con desagüe a red cloacal'),
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
  const rankObraSocial = rankRatio(c1Deptos, 3, 2);
  const rankSinCobertura = rankRatio(c1Deptos, 5, 2);

  // prevision_c3: jubilados/pensionados por departamento
  const p3 = loadCuadro('c2022_mendoza_prevision_c3_13.xlsx');
  const p3Total = findTotalRow(p3);
  const pobP3 = toNumber(p3Total[2]);
  const percibe = toNumber(p3Total[3]);
  const noPercibe = toNumber(p3Total[8]);
  const pctPercibe = safeRatio(percibe, pobP3);

  const p3Deptos = extractDeptoRows(p3);
  const rankPercibe = rankRatio(p3Deptos, 3, 2);

  const json = {
    meta: {
      id: 'poblacion-salud-prevision',
      title: 'Salud y Previsión Social — Mendoza',
      category: 'Población',
      subcategory: 'Salud y Previsión',
      source: SOURCE,
      date: DATE,
      scope: SCOPE_DEPTOS,
    },
    kpis: [
      { id: 'pob-total', label: 'Población en viviendas particulares', value: pobTotal, formatted: fmtInt(pobTotal), unit: 'hab' },
      { id: 'obra-social', label: 'Con obra social o prepaga', value: pctObraSocial, formatted: fmtPct(pctObraSocial), status: 'good', comparison: `${fmtInt(obraSocial)} personas (incluye PAMI)` },
      { id: 'sin-cobertura', label: 'Sin obra social, prepaga ni plan estatal', value: pctSinCobertura, formatted: fmtPct(pctSinCobertura), status: 'critical', comparison: `${fmtInt(sinCobertura)} personas` },
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
        config: { total: pobTotal, format: 'int' },
      },
      {
        id: 'mapa-cobertura',
        type: 'map',
        title: 'Mapa: % de población con obra social o prepaga',
        sectionId: 'departamentos',
        data: mapRatio(c1Deptos, 3, 2),
        config: { format: 'pct' },
      },
      {
        id: 'prevision-pie',
        type: 'pie',
        title: 'Percepción de jubilación o pensión — Mendoza',
        sectionId: 'prevision',
        data: [
          { id: 'No percibe', value: noPercibe },
          { id: 'Solo jubilación', value: toNumber(p3Total[4]) },
          { id: 'Solo otro tipo de pensión', value: toNumber(p3Total[7]) },
          { id: 'Jubilación y pensión por fallecimiento', value: toNumber(p3Total[6]) },
          { id: 'Solo pensión por fallecimiento', value: toNumber(p3Total[5]) },
        ],
        config: { total: pobP3, format: 'int' },
      },
    ],
    rankings: [
      { id: 'rank-obra', title: 'Departamentos por % con obra social o prepaga', sectionId: 'departamentos', items: rankObraSocial, order: 'desc', format: 'pct' },
      { id: 'rank-sin', title: 'Departamentos por % sin cobertura', sectionId: 'departamentos', items: rankSinCobertura, order: 'desc', format: 'pct' },
      { id: 'rank-jubilados', title: 'Departamentos por % que percibe jubilación o pensión', sectionId: 'prevision', items: rankPercibe, order: 'desc', format: 'pct' },
    ],
    mapData: buildFeatured(pctSinCobertura, fmtPct(pctSinCobertura), 'Población sin obra social, prepaga ni plan estatal'),
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
  const c1Total = rowByLabel(c1, 'total');
  const totalHogares = toNumber(c1Total[1]);
  const pisoBuenos = toNumber(c1Total[2]);
  const pisoCarpeta = toNumber(c1Total[3]);
  const pisoTierra = toNumber(c1Total[4]);
  const pisoOtro = toNumber(c1Total[5]);
  const pctPisoBuenos = safeRatio(pisoBuenos, totalHogares);
  const pctPisoTierra = safeRatio(pisoTierra, totalHogares);

  // hogares_c2: agua para hogares
  const c2 = loadCuadro('c2022_mendoza_hogares_c2_13.xlsx');
  const c2Total = rowByLabel(c2, 'total');
  const aguaCanieria = toNumber(c2Total[2]);
  const aguaRed = toNumber(rowByLabel(c2, 'Red pública (agua corriente)')[1]);
  const pctAguaCanieria = safeRatio(aguaCanieria, totalHogares);

  // hogares_c3: desagüe; hogares_c4: combustible
  const c3 = loadCuadro('c2022_mendoza_hogares_c3_13.xlsx');
  const cloaca = toNumber(c3.find(r => r && String(r[0]).trim() === 'A red pública (cloaca)' && String(r[1]).trim() === 'Total')[2]);
  const banioDentro = toNumber(rowByLabel(c3, 'total')[3]);
  const c4 = loadCuadro('c2022_mendoza_hogares_c4_13.xlsx');
  const gasRed = toNumber(findTotalRow(c4)[4]);
  const pctCloaca = safeRatio(cloaca, totalHogares);
  const pctGas = safeRatio(gasRed, totalHogares);

  // vivienda_c2: hogares por departamento (col 3)
  const v2 = loadCuadro('c2022_mendoza_vivienda_c2_13.xlsx');
  const v2Deptos = extractDeptoRows(v2);
  const rankHogares = rankDeptos(v2Deptos, r => r[3], 'desc');

  const json = {
    meta: {
      id: 'poblacion-hogares',
      title: 'Condiciones Habitacionales de los Hogares — Mendoza',
      category: 'Población',
      subcategory: 'Hogares',
      source: SOURCE,
      date: DATE,
      scope: SCOPE_DEPTOS,
    },
    kpis: [
      { id: 'total-hogares', label: 'Total de hogares', value: totalHogares, formatted: fmtInt(totalHogares) },
      { id: 'pct-piso-bueno', label: 'Hogares con pisos terminados', value: pctPisoBuenos, formatted: fmtPct(pctPisoBuenos), status: 'good', comparison: 'Cerámica, mosaico, baldosa, alfombra o madera' },
      { id: 'pct-piso-tierra', label: 'Hogares con piso de tierra o ladrillo suelto', value: pctPisoTierra, formatted: fmtPct(pctPisoTierra), status: 'critical', comparison: `${fmtInt(pisoTierra)} hogares` },
      { id: 'pct-agua-can', label: 'Hogares con agua por cañería dentro de la vivienda', value: pctAguaCanieria, formatted: fmtPct(pctAguaCanieria), status: 'good', comparison: `${fmtInt(aguaCanieria)} hogares` },
      { id: 'pct-cloaca', label: 'Hogares con desagüe a red cloacal', value: pctCloaca, formatted: fmtPct(pctCloaca), status: 'warning', comparison: `${fmtInt(cloaca)} hogares` },
      { id: 'pct-gas', label: 'Hogares que cocinan con gas de red', value: pctGas, formatted: fmtPct(pctGas), comparison: `${fmtInt(gasRed)} hogares` },
    ],
    charts: [
      {
        id: 'pisos',
        type: 'pie',
        title: 'Material predominante de los pisos',
        sectionId: 'materiales',
        data: [
          { id: 'Pisos terminados', value: pisoBuenos },
          { id: 'Carpeta, contrapiso o ladrillo fijo', value: pisoCarpeta },
          { id: 'Tierra o ladrillo suelto', value: pisoTierra },
          { id: 'Otro material', value: pisoOtro },
        ],
        config: { total: totalHogares, format: 'int' },
      },
      {
        id: 'servicios',
        type: 'bar',
        title: 'Servicios en el hogar (% de hogares)',
        sectionId: 'servicios',
        data: [
          { servicio: 'Agua por cañería', '% de hogares': pctAguaCanieria },
          { servicio: 'Baño dentro de la vivienda', '% de hogares': safeRatio(banioDentro, totalHogares) },
          { servicio: 'Agua de red pública', '% de hogares': safeRatio(aguaRed, totalHogares) },
          { servicio: 'Red cloacal', '% de hogares': pctCloaca },
          { servicio: 'Gas de red', '% de hogares': pctGas },
        ],
        config: { xAxis: 'servicio', layout: 'horizontal', format: 'pct', max: 100 },
      },
      {
        id: 'mapa-hogares',
        type: 'map',
        title: 'Mapa: hogares por departamento',
        sectionId: 'departamentos',
        data: buildMapData(v2Deptos, r => r[3]),
        config: { format: 'int', unit: 'hogares' },
      },
    ],
    rankings: [
      { id: 'rank-hogares', title: 'Departamentos por cantidad de hogares', sectionId: 'departamentos', items: rankHogares, order: 'desc', format: 'int', unit: 'hogares' },
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
  const colectivas = totalViv - vivPart;

  const v1Deptos = extractDeptoRows(v1);
  const rankViv = rankDeptos(v1Deptos, r => r[2], 'desc');

  // vivienda_c3: tipo de vivienda particular ocupada
  const v3 = loadCuadro('c2022_mendoza_vivienda_c3_13.xlsx');
  const v3Total = findTotalRow(v3);
  const totalOcupadas = toNumber(v3Total[2]);
  const casas = toNumber(v3Total[3]);
  const ranchos = toNumber(v3Total[4]);
  const casillas = toNumber(v3Total[5]);
  const departamentos = toNumber(v3Total[6]);
  const otrosTipos = toNumber(v3Total[7]) + toNumber(v3Total[8]) + toNumber(v3Total[9]);
  const pctCasas = safeRatio(casas, totalOcupadas);
  const v3Deptos = extractDeptoRows(v3);
  const rankDeptosPct = rankRatio(v3Deptos, 6, 2);

  const json = {
    meta: {
      id: 'poblacion-viviendas',
      title: 'Stock Habitacional y Viviendas — Mendoza',
      category: 'Población',
      subcategory: 'Viviendas',
      source: SOURCE,
      date: DATE,
      scope: SCOPE_DEPTOS,
    },
    kpis: [
      { id: 'total-viviendas', label: 'Total de viviendas', value: totalViv, formatted: fmtInt(totalViv) },
      { id: 'viviendas-particulares', label: 'Viviendas particulares', value: vivPart, formatted: fmtInt(vivPart), comparison: `${fmtInt(colectivas)} colectivas` },
      { id: 'viviendas-ocupadas', label: 'Particulares con personas presentes', value: vivOcupadas, formatted: fmtInt(vivOcupadas), comparison: `${fmtPct(safeRatio(vivOcupadas, vivPart))} de las particulares` },
      { id: 'pct-casas', label: '% de casas (sobre viviendas ocupadas)', value: pctCasas, formatted: fmtPct(pctCasas), comparison: `${fmtInt(casas)} casas` },
      { id: 'departamentos-viv', label: '% de departamentos (sobre viviendas ocupadas)', value: safeRatio(departamentos, totalOcupadas), formatted: fmtPct(safeRatio(departamentos, totalOcupadas)), comparison: `${fmtInt(departamentos)} departamentos` },
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
          { id: 'Pieza, local o vivienda móvil', value: otrosTipos },
        ],
        config: { total: totalOcupadas, format: 'int' },
      },
      {
        id: 'mapa-viviendas',
        type: 'map',
        title: 'Mapa: total de viviendas por departamento',
        sectionId: 'departamentos',
        data: buildMapData(v1Deptos, r => r[2]),
        config: { format: 'int', unit: 'viviendas' },
      },
    ],
    rankings: [
      { id: 'rank-pct-dptos', title: 'Departamentos por % de viviendas tipo departamento', sectionId: 'tipos', items: rankDeptosPct, order: 'desc', format: 'pct' },
      { id: 'rank-viv', title: 'Departamentos por viviendas totales', sectionId: 'departamentos', items: rankViv, order: 'desc', format: 'int', unit: 'viviendas' },
    ],
    mapData: buildFeatured(totalViv, fmtInt(totalViv), 'Viviendas totales en Mendoza · Censo 2022'),
  };
  writeJson(path.join(OUT_DIR, 'viviendas.json'), json);
  return { totalViv, vivPart, colectivas };
}

// ════════════════════════════════════════════════════════════════════
// 6. EDUCACIÓN
// ════════════════════════════════════════════════════════════════════
function processEducacion() {
  console.log('\n─── 6. Educación ───');

  // educacion_c1: condición de asistencia escolar
  const e1 = loadCuadro('c2022_mendoza_educacion_c1_13.xlsx');
  const e1Total = rowByLabel(e1, 'total');
  const pob = toNumber(e1Total[2]);
  const asiste = toNumber(e1Total[3]);
  const nuncaAsistio = toNumber(e1Total[5]);
  const pctAsiste = safeRatio(asiste, pob);
  const pctNunca = safeRatio(nuncaAsistio, pob);

  // educacion_c2: nivel educativo al que asiste
  const e2 = loadCuadro('c2022_mendoza_educacion_c2_13.xlsx');
  const e2Total = rowByLabel(e2, 'total');
  const matJard = toNumber(e2Total[4]);
  const sala45 = toNumber(e2Total[5]);
  const primario = toNumber(e2Total[6]);
  const secundario = toNumber(e2Total[7]);
  const terciario = toNumber(e2Total[8]);
  const universitario = toNumber(e2Total[9]);
  const posgrado = toNumber(e2Total[10]);

  // educacion_c3: máximo nivel, sobre quienes ya no asisten (5 años y más).
  // Columnas: 4 sin instr. · 6/7 primario · 9/10 EGB · 12/13 secundario ·
  // 15/16 polimodal · 18/19 terciario · 21/22 univ. · 24/25 posgrado · 26 ignorado.
  const e3 = loadCuadro('c2022_mendoza_educacion_c3_13.xlsx');
  const e3Total = rowByLabel(e3, 'total');
  const pob5mas = toNumber(e3Total[2]);
  const maximoNivel = row => {
    const n = i => toNumber(row[i]) || 0;
    return [
      ['Sin instrucción', n(4)],
      ['Primario/EGB incompleto', n(6) + n(9)],
      ['Primario/EGB completo', n(7) + n(10)],
      ['Secundario/polimodal incompleto', n(12) + n(15)],
      ['Secundario/polimodal completo', n(13) + n(16)],
      ['Superior incompleto', n(18) + n(21) + n(24)],
      ['Superior completo', n(19) + n(22) + n(25)],
      ['Ignorado', n(26)],
    ];
  };
  const denMax = toNumber(e3Total[3]);
  const nivelesTotal = maximoNivel(e3Total);
  const pctSuperiorCompleto = safeRatio(nivelesTotal[6][1], denMax);

  const filaSexo = patron => e3.find(r => r && r[0] && patron.test(String(r[0])) && typeof r[3] === 'number');
  const mujeres = filaSexo(/mujer/i);
  const varones = filaSexo(/var[oó]n/i);
  const nivMuj = maximoNivel(mujeres);
  const nivVar = maximoNivel(varones);
  const brechaSexo = nivelesTotal.slice(0, 7).map(([nivel], i) => ({
    nivel,
    Mujeres: safeRatio(nivMuj[i][1], toNumber(mujeres[3])),
    Varones: safeRatio(nivVar[i][1], toNumber(varones[3])),
  }));

  const json = {
    meta: {
      id: 'poblacion-educacion',
      title: 'Educación — Mendoza',
      category: 'Población',
      subcategory: 'Educación',
      source: SOURCE,
      date: DATE,
      scope: 'Provincia de Mendoza · Censo 2022. Este informe usa solo el total provincial, sin apertura por departamento.',
    },
    kpis: [
      { id: 'pob-edu', label: 'Población en viviendas particulares', value: pob, formatted: fmtInt(pob) },
      { id: 'pct-asiste', label: '% que asiste actualmente', value: pctAsiste, formatted: fmtPct(pctAsiste), status: 'good', comparison: `${fmtInt(asiste)} personas` },
      { id: 'pct-nunca', label: '% que nunca asistió', value: pctNunca, formatted: fmtPct(pctNunca), status: 'warning', comparison: `${fmtInt(nuncaAsistio)} personas (incluye menores de 5 años)` },
      { id: 'universitario', label: 'Cursando universitario de grado', value: universitario, formatted: fmtInt(universitario) },
      { id: 'secundario', label: 'Cursando secundario', value: secundario, formatted: fmtInt(secundario) },
      { id: 'pct-superior', label: 'Superior completo (sobre quienes ya no asisten)', value: pctSuperiorCompleto, formatted: fmtPct(pctSuperiorCompleto), comparison: `${fmtInt(nivelesTotal[6][1])} personas` },
      { id: 'pob-5mas', label: 'Población de 5 años y más', value: pob5mas, formatted: fmtInt(pob5mas) },
    ],
    charts: [
      {
        id: 'nivel-educativo',
        type: 'bar',
        title: 'Población que asiste, por nivel educativo',
        sectionId: 'niveles',
        data: [
          { nivel: 'Inicial', cantidad: matJard + sala45 },
          { nivel: 'Primario', cantidad: primario },
          { nivel: 'Secundario', cantidad: secundario },
          { nivel: 'Terciario', cantidad: terciario },
          { nivel: 'Universitario', cantidad: universitario },
          { nivel: 'Posgrado', cantidad: posgrado },
        ],
        config: { xAxis: 'nivel', layout: 'horizontal', format: 'int', total: asiste },
      },
      {
        id: 'maximo-nivel',
        type: 'bar',
        title: 'Máximo nivel alcanzado (5 años y más que ya no asisten)',
        sectionId: 'maximo-nivel',
        data: nivelesTotal.map(([nivel, cantidad]) => ({ nivel, cantidad })),
        config: { xAxis: 'nivel', layout: 'horizontal', format: 'int', total: denMax },
      },
      {
        id: 'brecha-sexo',
        type: 'bar',
        title: 'Máximo nivel alcanzado por sexo (%)',
        sectionId: 'sexo',
        data: brechaSexo,
        config: { xAxis: 'nivel', layout: 'horizontal', format: 'pct' },
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
  const tasaActividad = safeRatio(pea, pob14mas);
  const tasaEmpleo = safeRatio(ocupada, pob14mas);
  const tasaDesocupacion = safeRatio(desocupada, pea);

  const a1Deptos = extractDeptoRows(a1);
  const rankActividad = rankRatio(a1Deptos, 3, 2);
  const rankEmpleo = rankRatio(a1Deptos, 4, 2);
  const rankDesocupacion = rankRatio(a1Deptos, 5, 3);

  // actividad_economica_c2: edad (col 1) y sexo (col 0)
  const a2 = loadCuadro('c2022_mendoza_actividad_economica_c2_13.xlsx');
  const inicioTotal = a2.findIndex(r => r && String(r[0]).trim().toLowerCase() === 'total');
  const porEdad = [];
  for (let i = inicioTotal + 1; i < a2.length; i++) {
    const r = a2[i];
    if (!r || r[0]) break;
    if (r[1] && typeof r[3] === 'number') {
      porEdad.push({ edad: String(r[1]).trim(), '% desocupación': safeRatio(toNumber(r[5]), toNumber(r[3])) });
    }
  }
  const sexoFila = patron => a2.find(r => r && r[0] && patron.test(String(r[0])) && typeof r[2] === 'number');
  const tasasSexo = (sexo, r) => ({
    sexo,
    'Tasa de actividad': safeRatio(toNumber(r[3]), toNumber(r[2])),
    'Tasa de empleo': safeRatio(toNumber(r[4]), toNumber(r[2])),
    'Tasa de desocupación': safeRatio(toNumber(r[5]), toNumber(r[3])),
  });
  const filaMuj = sexoFila(/mujer/i);
  const filaVar = sexoFila(/var[oó]n/i);
  const actMuj = safeRatio(toNumber(filaMuj[3]), toNumber(filaMuj[2]));
  const actVar = safeRatio(toNumber(filaVar[3]), toNumber(filaVar[2]));

  // actividad_economica_c3: categoría ocupacional
  const a3 = loadCuadro('c2022_mendoza_actividad_economica_c3_13.xlsx');
  const a3Total = rowByLabel(a3, 'total');
  const totalOcup = toNumber(a3Total[2]);
  const servDom = toNumber(a3Total[3]);
  const empleados = toNumber(a3Total[4]);
  const cuentaPropia = toNumber(a3Total[5]);
  const patron = toNumber(a3Total[6]);
  const trabFamiliar = toNumber(a3Total[7]);
  const ignorado = toNumber(a3Total[8]);

  const json = {
    meta: {
      id: 'poblacion-actividad-economica',
      title: 'Características Económicas — Mendoza',
      category: 'Población',
      subcategory: 'Actividad Económica',
      source: SOURCE,
      date: DATE,
      scope: SCOPE_DEPTOS,
    },
    kpis: [
      { id: 'pob-14mas', label: 'Población de 14 años y más', value: pob14mas, formatted: fmtInt(pob14mas) },
      { id: 'tasa-actividad', label: 'Tasa de actividad', value: tasaActividad, formatted: fmtPct(tasaActividad), comparison: `${fmtInt(pea)} personas activas` },
      { id: 'tasa-empleo', label: 'Tasa de empleo', value: tasaEmpleo, formatted: fmtPct(tasaEmpleo), status: 'good', comparison: `${fmtInt(ocupada)} personas ocupadas` },
      { id: 'tasa-desocupacion', label: 'Tasa de desocupación', value: tasaDesocupacion, formatted: fmtPct(tasaDesocupacion), status: 'warning', comparison: `${fmtInt(desocupada)} personas desocupadas` },
      { id: 'cuenta-propia', label: 'Ocupados por cuenta propia', value: safeRatio(cuentaPropia, totalOcup), formatted: fmtPct(safeRatio(cuentaPropia, totalOcup)), comparison: `${fmtInt(cuentaPropia)} personas` },
      { id: 'brecha-actividad', label: 'Tasa de actividad: varones y mujeres', value: actVar - actMuj, formatted: `${fmtDec(actVar - actMuj)} puntos`, comparison: `Varones ${fmtPct(actVar)} · Mujeres ${fmtPct(actMuj)}` },
    ],
    charts: [
      {
        id: 'categoria-ocupacional',
        type: 'pie',
        title: 'Categoría ocupacional — personas ocupadas',
        sectionId: 'categoria',
        data: [
          { id: 'Empleada/o u obrera/o', value: empleados },
          { id: 'Cuenta propia', value: cuentaPropia },
          { id: 'Servicio doméstico', value: servDom },
          { id: 'Patrón/a o empleador/a', value: patron },
          { id: 'Trabajador/a familiar', value: trabFamiliar },
          { id: 'Ignorado', value: ignorado },
        ],
        config: { total: totalOcup, format: 'int' },
      },
      {
        id: 'mapa-empleo',
        type: 'map',
        title: 'Mapa: tasa de empleo por departamento',
        sectionId: 'departamentos',
        data: mapRatio(a1Deptos, 4, 2),
        config: { format: 'pct' },
      },
      {
        id: 'mapa-desocupacion',
        type: 'map',
        title: 'Mapa: tasa de desocupación por departamento',
        sectionId: 'departamentos',
        data: mapRatio(a1Deptos, 5, 3),
        config: { format: 'pct' },
      },
      {
        id: 'desocupacion-edad',
        type: 'line',
        title: 'Tasa de desocupación por edad (%)',
        sectionId: 'edad',
        data: porEdad,
        config: { xAxis: 'edad', format: 'pct' },
      },
      {
        id: 'tasas-sexo',
        type: 'bar',
        title: 'Tasas laborales por sexo (%)',
        sectionId: 'sexo',
        data: [tasasSexo('Mujeres', filaMuj), tasasSexo('Varones', filaVar)],
        config: { xAxis: 'sexo', format: 'pct' },
      },
    ],
    rankings: [
      { id: 'rank-actividad', title: 'Departamentos por tasa de actividad', sectionId: 'departamentos', items: rankActividad, order: 'desc', format: 'pct' },
      { id: 'rank-empleo', title: 'Departamentos por tasa de empleo', sectionId: 'departamentos', items: rankEmpleo, order: 'desc', format: 'pct' },
      { id: 'rank-desocupacion', title: 'Departamentos por tasa de desocupación', sectionId: 'departamentos', items: rankDesocupacion, order: 'desc', format: 'pct' },
    ],
    mapData: buildFeatured(tasaDesocupacion, fmtPct(tasaDesocupacion), 'Tasa de desocupación censal en Mendoza'),
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
  const rankPromedio = rankDeptos(f1Deptos, r => r[9], 'desc');

  // fecundidad_c2: por grupos quinquenales
  const f2 = loadCuadro('c2022_mendoza_fecundidad_c2_13.xlsx');
  const grupos = ['14', '15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49'];
  const promedioPorEdad = grupos.map(g => ({ edad: g, 'Hijos/mujer': toNumber(rowByLabel(f2, g)[8]) }));

  const json = {
    meta: {
      id: 'poblacion-fecundidad',
      title: 'Fecundidad — Mendoza',
      category: 'Población',
      subcategory: 'Fecundidad',
      source: SOURCE,
      date: DATE,
      scope: SCOPE_DEPTOS,
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
        title: 'Mujeres de 14 a 49 años por cantidad de hijos',
        sectionId: 'distribucion',
        data: [
          { id: 'Ninguno', value: ninguno },
          { id: '1', value: uno },
          { id: '2', value: dos },
          { id: '3', value: tres },
          { id: '4', value: cuatro },
          { id: '5 y más', value: cincoMas },
        ],
        config: { total: mujeres, format: 'int' },
      },
      {
        id: 'fecundidad-edad',
        type: 'line',
        title: 'Fecundidad acumulada por grupo de edad (hijos/mujer)',
        sectionId: 'edades',
        data: promedioPorEdad,
        config: { xAxis: 'edad', format: 'dec1' },
      },
      {
        id: 'mapa-fecundidad',
        type: 'map',
        title: 'Mapa: promedio de hijos por mujer (14-49)',
        sectionId: 'departamentos',
        data: buildMapData(f1Deptos, r => r[9]),
        config: { format: 'dec1', unit: 'hijos/mujer' },
      },
    ],
    rankings: [
      { id: 'rank-promedio', title: 'Departamentos por promedio de hijos por mujer', sectionId: 'departamentos', items: rankPromedio, order: 'desc', format: 'dec1', unit: 'hijos/mujer' },
    ],
    mapData: buildFeatured(promedio, fmtDec(promedio, 1) + ' hijos/mujer', 'Fecundidad acumulada · Mendoza'),
  };
  writeJson(path.join(OUT_DIR, 'fecundidad.json'), json);
}

// ════════════════════════════════════════════════════════════════════
// RESUMEN PROVINCIAL
// ════════════════════════════════════════════════════════════════════
function processResumen({ pob2022, varRel, superficie, densidad, totalHogares, totalViv, vivPart, colectivas }) {
  const out = path.join(__dirname, '..', 'public', 'data', 'resumen.json');
  writeJson(out, {
    meta: { source: SOURCE, date: DATE },
    poblacion: pob2022,
    variacion2010: varRel,
    superficieKm2: superficie,
    densidad,
    hogares: totalHogares,
    viviendas: totalViv,
    viviendasParticulares: vivPart,
    viviendasColectivas: colectivas,
    departamentos: MENDOZA_DEPTOS.length,
  });
}

// ════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════
function main() {
  console.log('═══ Pipeline Población — Mendoza (Censo 2022) ═══');
  const estructura = processEstructura();
  processHabitacionalPersonas();
  processSaludPrevision();
  const { totalHogares } = processHogares();
  const { totalViv, vivPart, colectivas } = processViviendas();
  processEducacion();
  processActividadEconomica();
  processFecundidad();
  processResumen({ ...estructura, totalHogares, totalViv, vivPart, colectivas });
  console.log('\n  ✅ 8 informes de población + resumen generados');
}

main();
