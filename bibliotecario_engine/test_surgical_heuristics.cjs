/**
 * TEST SUITE: Heurísticas Quirúrgicas y Autoaprendizaje (Fase 0)
 * Valida los 6 casos extraídos del documento del Gerente General + 1 caso de autoaprendizaje dinámico.
 */

const assert = require('assert');
const path = require('path');
const { analyzeSpecializedDocument, extractYearFromColophon, recordLearnedRule } = require('./classifier_heuristics.cjs');

console.log('================================================================');
console.log('🧪 EJECUTANDO BATERÍA DE PRUEBAS: FASE 0 - HEURÍSTICAS QUIRÚRGICAS');
console.log('================================================================\n');

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
  }
}

// CASO 1: Página 1 - CSLP VA Placa cervical Synthes (Técnica quirúrgica, colofón 2008)
runTest('Caso 1: CSLP VA Placa cervical Synthes -> Catálogos Materiales Ortopédicos, año 2008', () => {
  const result = analyzeSpecializedDocument({
    filename: 'CSLP VA Placa autoestable para columna cervical con angulo variable.pdf',
    firstPageText: 'CSLP VA. Placa autoestable para columna cervical con ángulo variable. Técnica quirúrgica. Synthes.',
    lastPageText: 'Synthes GmbH CH-4436 Oberdorf www.synthes.com 046.000.382 SE_053725 AA Synthes 2008 Impreso en Suiza CE 0123'
  });
  assert.strictEqual(result.matched, true);
  assert.strictEqual(result.targetFolder, 'Catálogos de Materiales ortopédicos');
  assert.strictEqual(result.standardName.includes('2008'), true);
  assert.strictEqual(result.standardName.includes('Synthes'), true);
  assert.strictEqual(result.standardName.includes('Técnica quirúrgica'), true);
});

// CASO 2: Página 2 - Clavo Expert Artrodesis Synthes (Técnica quirúrgica, colofón 2007)
runTest('Caso 2: Clavo Expert artrodesis pie Synthes -> Catálogos Materiales Ortopédicos, año 2007', () => {
  const result = analyzeSpecializedDocument({
    filename: 'Clavo Expert para artrodesis de la parte posterior del pie.pdf',
    firstPageText: 'Clavo Expert para artrodesis de la parte posterior del pie. Mejora de la estabilidad. Técnica quirúrgica. Synthes.',
    lastPageText: 'Synthes GmbH CH-4436 Oberdorf www.synthes.com 046.000.980 SE_114322 AA 10077052 © 2007 Synthes Expert CE 0123'
  });
  assert.strictEqual(result.matched, true);
  assert.strictEqual(result.targetFolder, 'Catálogos de Materiales ortopédicos');
  assert.strictEqual(result.standardName.includes('2007'), true);
  assert.strictEqual(result.standardName.includes('Synthes'), true);
});

// CASO 3: Página 3 Izquierda - Extracto Capítulo AO (Norbert P. Südkamp)
runTest('Caso 3: Extracto Capítulo AO Norbert P. Südkamp -> Temas Generales, "Capitulo AO, ..."', () => {
  const result = analyzeSpecializedDocument({
    filename: 'Soft-tissue injury pathophysiology.pdf',
    firstPageText: '1.5 Soft-tissue injury: pathophysiology and its influence on fracture management. Evaluation/classification of closed and open injuries. Norbert P. Südkamp. Introduction.',
    lastPageText: 'AO Foundation references'
  });
  assert.strictEqual(result.matched, true);
  assert.strictEqual(result.targetFolder, 'Temas generales');
  assert.strictEqual(result.standardName.startsWith('Capitulo AO, Norbert P. Südkamp'), true);
});

// CASO 4: Página 3 Derecha - Manual del Participante AO (Emanuel Gautier)
runTest('Caso 4: Manual del Participante AO Emanuel Gautier -> Temas Generales, "Manual AO Foundation, ..."', () => {
  const result = analyzeSpecializedDocument({
    filename: 'Laboratorio de habilidades AO.pdf',
    firstPageText: 'AO Foundation. Manual del Participante. Editor Científico: Emanuel Gautier. Laboratorio de habilidades AO.',
    lastPageText: 'AO Foundation print'
  });
  assert.strictEqual(result.matched, true);
  assert.strictEqual(result.targetFolder, 'Temas generales');
  assert.strictEqual(result.standardName.startsWith('Manual AO Foundation, Emanuel Gautier'), true);
});

// CASO 5: Página 4 - Atlas de Osteosíntesis (J. Miquel Sales, Vol 2 Extremidad Inferior)
runTest('Caso 5: Atlas de Osteosíntesis Vol 2 -> Temas Generales, "J. Miquel Sales, Atlas de Osteosíntesis, Volumen 2 Extremidad Inferior.pdf"', () => {
  const result = analyzeSpecializedDocument({
    filename: 'Atlas de Osteosintesis Vol 2.pdf',
    firstPageText: 'Orozco. Fundación Maurice E. Müller. ATLAS de OSTEOSÍNTESIS. FRACTURAS DE LOS HUESOS LARGOS. VÍAS DE ACCESO QUIRÚRGICO. VOLUMEN 2. EXTREMIDAD INFERIOR. 2. Edición. Autores: J. Miquel Sales, Miquel Videla.',
    lastPageText: 'Editorial Masson Elsevier'
  });
  assert.strictEqual(result.matched, true);
  assert.strictEqual(result.targetFolder, 'Temas generales');
  assert.strictEqual(result.standardName.includes('J. Miquel Sales'), true);
  assert.strictEqual(result.standardName.includes('Volumen 2 Extremidad Inferior'), true);
});

// CASO 6: Página 5 - TomoFix Osteotomy System Synthes (Technique Guide, colofón 2005)
runTest('Caso 6: TomoFix Osteotomy System Synthes -> Catálogos Materiales Ortopédicos, año 2005', () => {
  const result = analyzeSpecializedDocument({
    filename: 'TomoFix Osteotomy System.pdf',
    firstPageText: 'TomoFix Osteotomy System with chronOS option. Technique Guide. Synthes.',
    lastPageText: 'SYNTHES (USA) 1302 Wrights Lane East West Chester, PA 19380 © 2005 SYNTHES (USA) Printed in U.S.A.'
  });
  assert.strictEqual(result.matched, true);
  assert.strictEqual(result.targetFolder, 'Catálogos de Materiales ortopédicos');
  assert.strictEqual(result.standardName.includes('2005'), true);
  assert.strictEqual(result.standardName.includes('Synthes'), true);
});

// CASO 7: Ciclo de Autoaprendizaje Dinámico
runTest('Caso 7: Autoaprendizaje Dinámico -> Registro de nuevo caso y recuperación autónoma inmediata', () => {
  const newSignature = 'stryker hoffmann 3 modular external fixation system';
  const recorded = recordLearnedRule({
    signature: newSignature,
    manufacturer: 'Stryker',
    doc_type: 'Catálogo Quirúrgico',
    target_folder: 'Catálogos de Materiales ortopédicos',
    naming_format: '2022 - Stryker - Hoffmann 3 Modular External Fixation System [Catálogo Quirúrgico].pdf',
    learned_from: 'Caso Resuelto en Entrenamiento de Campo'
  });

  assert.strictEqual(recorded.id.startsWith('LEARNED-'), true);

  // Consultar inmediatamente con un texto similar
  const testQuery = analyzeSpecializedDocument({
    filename: 'Hoffmann 3 Ext Fix.pdf',
    firstPageText: 'Stryker Hoffmann 3 Modular External Fixation System Operative Technique',
    lastPageText: 'Stryker Trauma AG'
  });

  assert.strictEqual(testQuery.matched, true);
  assert.strictEqual(testQuery.strategy, 'AUTOLEARNING_MEMORY');
  assert.strictEqual(testQuery.standardName, '2022 - Stryker - Hoffmann 3 Modular External Fixation System [Catálogo Quirúrgico].pdf');
  assert.strictEqual(testQuery.targetFolder, 'Catálogos de Materiales ortopédicos');
});

console.log('\n================================================================');
console.log(`📊 RESULTADOS FINALES: ${passed} / ${total} PRUEBAS EXITOSAS (${Math.round((passed/total)*100)}%)`);
console.log('================================================================\n');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
