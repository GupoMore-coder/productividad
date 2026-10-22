/**
 * 🌟 SUITE DE VERIFICACIÓN DE LOS 5 SUPERPODERES CLÍNICOS PARA GOOGLE APPS SCRIPT
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const { handleCalculatorRequest } = require('./orthopedic_clinical_calculators.cjs');
const { handlePreopCopilotRequest } = require('./preoperative_copilot.cjs');
const { handleImplantRequest } = require('./implant_technical_engine.cjs');
const { handleEmergencyConsultRequest } = require('./clinical_emergency_consult_engine.cjs');
const { 
  handleOpenAccessSearchRequest, 
  registerAcquisitionRequest, 
  fulfillAcquisitionRequest 
} = require('./open_access_tracker_engine.cjs');

console.log('Validando integración de los 5 superpoderes...');

// 1. Calculadoras
const calc1 = handleCalculatorRequest('SCORE: MESS');
assert.strictEqual(calc1.handled, true);
assert.strictEqual(calc1.replyText.includes('Johansen et al.'), true);

const calc2 = handleCalculatorRequest('CALCULAR MESS: 3 2 1 1');
assert.strictEqual(calc2.handled, true);
assert.strictEqual(calc2.replyText.includes('7 PUNTOS'), true);

// 2. Pre-op Copilot
const preop = handlePreopCopilotRequest('CASO: clavo trocanterico');
assert.strictEqual(preop.handled, true);
assert.strictEqual(preop.replyText.includes('1. DOCUMENTOS EN EL REPOSITORIO'), true);
assert.strictEqual(preop.replyText.includes('2. DOCUMENTOS Y GUÍAS CONSULTADAS EN LA WEB ACADÉMICA'), true);
assert.strictEqual(preop.replyText.includes('/r/d_'), true);
assert.strictEqual(preop.replyText.includes('/r/pm_'), true);

// 3. Implantes
const imp = handleImplantRequest('IMPLANTE: Placa PHILOS');
assert.strictEqual(imp.handled, true);
assert.strictEqual(imp.replyText.includes('Broca calibrada 2.8 mm'), true);
assert.strictEqual(imp.replyText.includes('DePuy Synthes Trauma'), true);

// 4. Interconsulta
const consult = handleEmergencyConsultRequest('INTERCONSULTA: Paciente masculino de 30 años con fractura expuesta de tibia', 'AO');
assert.strictEqual(consult.handled, true);
assert.strictEqual(consult.replyText.includes('ESTÁNDAR ATLS / AO'), true);
assert.strictEqual(consult.replyText.includes('DATOS CRÍTICOS PENDIENTES'), true);

// 5. Open Access
const oa = handleOpenAccessSearchRequest('fractura de pelvis');
assert.strictEqual(oa.handled, true);
assert.strictEqual(oa.replyText.includes('SOLICITAR: PAY_PELVIS_2024'), true);
assert.strictEqual(oa.replyText.includes('DESCARTAR: PAY_PELVIS_2024'), true);

console.log('✅ Todos los superpoderes validados con éxito total.');
