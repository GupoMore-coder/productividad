/**
 * TEST SUITE: Gobernanza, Control de Acceso y Boletín Dominical (Paso 5)
 */

const assert = require('assert');
const {
  registerUser,
  approveUser,
  isUserApproved,
  getWeeklyNewTitles,
  formatSundayBulletinPrompt,
  generateWeeklyBulletinReport
} = require('./governance_and_bulletin.cjs');

console.log('================================================================');
console.log('🧪 EJECUTANDO BATERÍA DE PRUEBAS: PASO 5 - GOBERNANZA Y BOLETÍN');
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

const fs = require('fs');
const path = require('path');
const TEST_PHONE = `+57311${Date.now().toString().slice(-7)}`;

// 1. Registro de Primer Ingreso (Onboarding)
runTest('Prueba 1: Registro de primer ingreso y estado PENDIENTE_APROBACION', () => {
  const regResult = registerUser({
    phone: TEST_PHONE,
    fullName: 'Dr. Santiago Morales',
    university: 'Pontificia Universidad Javeriana',
    level: 'Residente R3'
  });

  assert.strictEqual(regResult.status, 'PENDING_APPROVAL');
  assert.strictEqual(regResult.user.status, 'PENDIENTE_APROBACION');
  assert.strictEqual(regResult.alertForGerente.includes('Dr. Santiago Morales'), true);
  assert.strictEqual(regResult.welcomeForUser.includes('Gestor de Contenido'), true);
  assert.strictEqual(regResult.welcomeForUser.includes('F.A.M.L.'), false);
  assert.strictEqual(regResult.welcomeForUser.includes('Fernando Marulanda'), false);

  // Verificar que el usuario no tiene acceso antes de ser aprobado
  assert.strictEqual(isUserApproved(TEST_PHONE), false);
});

// 2. Aprobación por parte del Gestor de Contenido
runTest('Prueba 2: Aprobación formal por parte del Gestor de Contenido', () => {
  const appResult = approveUser(TEST_PHONE);
  assert.strictEqual(appResult.success, true);
  assert.strictEqual(appResult.user.status, 'APROBADO');
  assert.strictEqual(appResult.messageForUser.includes('formalmente aprobada'), true);

  // Verificar que ahora sí está aprobado
  assert.strictEqual(isUserApproved(TEST_PHONE), true);
});

// 3. Generación y Formato del Boletín Dominical
runTest('Prueba 3: Generación del Boletín Dominical (Prompt y Reporte por Categorías)', () => {
  const prompt = formatSundayBulletinPrompt(10);
  assert.strictEqual(prompt.includes('Boletín Dominical'), true);
  assert.strictEqual(prompt.includes('10 nuevos documentos'), true);

  const newDocs = getWeeklyNewTitles(7);
  assert.strictEqual(Array.isArray(newDocs), true);
  assert.strictEqual(newDocs.length > 0, true);

  const report = generateWeeklyBulletinReport(newDocs);
  assert.strictEqual(report.includes('CATÁLOGO DE NOVEDADES SEMANALES'), true);
  assert.strictEqual(report.includes('CATEGORÍA:'), true);
});

console.log('\n================================================================');
console.log(`📊 RESULTADOS FINALES: ${passed} / ${total} PRUEBAS EXITOSAS (${Math.round((passed/total)*100)}%)`);
console.log('================================================================\n');

if (passed === total) process.exit(0);
else process.exit(1);
