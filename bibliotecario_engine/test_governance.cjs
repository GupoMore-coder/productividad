/**
 * TEST SUITE: Gobernanza, Control de Acceso y Boletín Dominical (Paso 5)
 */

const assert = require('assert');
const {
  registerUser,
  updateUserProfile,
  updateUserLanguage,
  resolveCountryAndLanguage,
  translateAnnouncement,
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

// 4. Registro con Correo Electrónico Institucional/Personal
runTest('Prueba 4: Registro con correo electrónico y resguardo en perfil', () => {
  const EMAIL_PHONE = `+57315${Date.now().toString().slice(-7)}`;
  const regResult = registerUser({
    phone: EMAIL_PHONE,
    fullName: 'Dra. Valentina Gomez',
    email: 'valentina.gomez@hospitalmilitar.edu.co',
    university: 'Universidad Militar',
    level: 'Residente R2'
  });

  assert.strictEqual(regResult.status, 'PENDING_APPROVAL');
  assert.strictEqual(regResult.user.email, 'valentina.gomez@hospitalmilitar.edu.co');
  assert.strictEqual(regResult.alertForGerente.includes('valentina.gomez@hospitalmilitar.edu.co'), true);
  assert.strictEqual(Array.isArray(regResult.user.updateHistory), true);
  assert.strictEqual(regResult.user.updateHistory.length, 0);
});

// 5. Actualización de Datos Personales y Límite de Frecuencia (3 en 6m / 6 en 12m)
runTest('Prueba 5: Actualización de datos on-demand y estricto control de frecuencia', () => {
  const UPD_PHONE = `+57316${Date.now().toString().slice(-7)}`;
  registerUser({
    phone: UPD_PHONE,
    fullName: 'Dr. Mateo Restrepo',
    email: 'mateo.restrepo@javeriana.edu.co',
    university: 'Pontificia Universidad Javeriana',
    level: 'Residente R1'
  });
  approveUser(UPD_PHONE);

  // Actualización 1 (Permitida)
  const up1 = updateUserProfile(UPD_PHONE, {
    level: 'Residente R2',
    university: 'Hospital Universitario San Ignacio'
  });
  assert.strictEqual(up1.success, true);
  assert.strictEqual(up1.count6m, 1);
  assert.strictEqual(up1.count12m, 1);
  assert.strictEqual(up1.user.level, 'Residente R2');
  assert.strictEqual(up1.user.university, 'Hospital Universitario San Ignacio');

  // Actualización 2 (Permitida)
  const up2 = updateUserProfile(UPD_PHONE, {
    email: 'mateo.restrepo@husi.org.co'
  });
  assert.strictEqual(up2.success, true);
  assert.strictEqual(up2.count6m, 2);
  assert.strictEqual(up2.user.email, 'mateo.restrepo@husi.org.co');

  // Actualización 3 (Permitida - límite semestral alcanzado)
  const up3 = updateUserProfile(UPD_PHONE, {
    name: 'Dr. Mateo Restrepo PhD'
  });
  assert.strictEqual(up3.success, true);
  assert.strictEqual(up3.count6m, 3);
  assert.strictEqual(up3.user.name, 'Dr. Mateo Restrepo PhD');

  // Actualización 4 en menos de 6 meses (RECHAZADA por límite institucional)
  const up4 = updateUserProfile(UPD_PHONE, {
    level: 'Residente R3'
  });
  assert.strictEqual(up4.success, false);
  assert.strictEqual(up4.error, 'LIMIT_6M_EXCEEDED');
  assert.strictEqual(up4.count6m, 3);
});

// 6. Inferencia de Código de País, Asignación de Bandera, Nombre y Saludo Fraterno
runTest('Prueba 6: Mapeo exacto de código de área a bandera, país y saludo fraternal', () => {
  const col = resolveCountryAndLanguage('+573001234567');
  assert.strictEqual(col.flag, '🇨🇴');
  assert.strictEqual(col.name, 'Colombia');
  assert.strictEqual(col.defaultLang, 'ES');
  assert.strictEqual(col.greeting.includes('Colombia 🇨🇴'), true);

  const bra = resolveCountryAndLanguage('+5511999998888');
  assert.strictEqual(bra.flag, '🇧🇷');
  assert.strictEqual(bra.name, 'Brasil');
  assert.strictEqual(bra.defaultLang, 'PT');
  assert.strictEqual(bra.greeting.includes('Brasil 🇧🇷'), true);

  const esp = resolveCountryAndLanguage('+34600123456');
  assert.strictEqual(esp.flag, '🇪🇸');
  assert.strictEqual(esp.name, 'España');

  const usa = resolveCountryAndLanguage('+13051234567');
  assert.strictEqual(usa.flag, '🇺🇸');
  assert.strictEqual(usa.defaultLang, 'EN');

  const ecu = resolveCountryAndLanguage('+593991234567');
  assert.strictEqual(ecu.flag, '🇪🇨');
  assert.strictEqual(ecu.name, 'Ecuador');
});

// 7. Registro con Idioma Preferido y Almacenamiento en Perfil
runTest('Prueba 7: Registro con bandera, país y preferencia de idioma', () => {
  const BRAZIL_PHONE = `+5521${Date.now().toString().slice(-7)}`;
  const regResult = registerUser({
    phone: BRAZIL_PHONE,
    fullName: 'Dr. Lucas Silva',
    email: 'lucas.silva@usp.br',
    university: 'Universidade de São Paulo',
    level: 'Residente R2',
    preferredLanguage: 'PT'
  });

  assert.strictEqual(regResult.status, 'PENDING_APPROVAL');
  assert.strictEqual(regResult.user.countryFlag, '🇧🇷');
  assert.strictEqual(regResult.user.countryName, 'Brasil');
  assert.strictEqual(regResult.user.preferredLanguage, 'PT');
  assert.strictEqual(regResult.alertForGerente.includes('🇧🇷 Brasil'), true);
  assert.strictEqual(regResult.welcomeForUser.includes('Bem-vindo(a)'), true);
});

// 8. Actualización Inmediata de Idioma Sin Límites de Frecuencia
runTest('Prueba 8: Cambio ilimitado de idioma sin consumir cuota de datos personales', () => {
  const LANG_PHONE = `+57317${Date.now().toString().slice(-7)}`;
  registerUser({
    phone: LANG_PHONE,
    fullName: 'Dr. Fernando Torres',
    email: 'ftorres@udea.edu.co',
    university: 'Universidad de Antioquia',
    level: 'Residente R3'
  });
  approveUser(LANG_PHONE);

  // Realizamos 5 cambios continuos de idioma (debe permitir TODOS sin límite)
  const c1 = updateUserLanguage(LANG_PHONE, 'EN');
  assert.strictEqual(c1.success, true);
  assert.strictEqual(c1.newLanguage, 'EN');

  const c2 = updateUserLanguage(LANG_PHONE, 'PT');
  assert.strictEqual(c2.success, true);
  assert.strictEqual(c2.newLanguage, 'PT');

  const c3 = updateUserLanguage(LANG_PHONE, 'FR');
  assert.strictEqual(c3.success, true);
  assert.strictEqual(c3.newLanguage, 'FR');

  const c4 = updateUserLanguage(LANG_PHONE, 'ES');
  assert.strictEqual(c4.success, true);
  assert.strictEqual(c4.newLanguage, 'ES');

  const c5 = updateUserLanguage(LANG_PHONE, 'EN');
  assert.strictEqual(c5.success, true);
  assert.strictEqual(c5.newLanguage, 'EN');

  // Verificar que el historial de datos personales sigue INTACTO (0 actualizaciones)
  assert.strictEqual(c5.user.updateHistory.length, 0);
});

// 9. Traducción Dinámica de Comunicados Masivos del Gestor de Contenido
runTest('Prueba 9: Traducción de comunicados a idiomas preferidos (EN, PT, FR)', () => {
  const rawMsg = 'Comunicado oficial: Estimados colegas, mantenimiento programado de la base de datos por 2 horas. Gracias por su comprensión. Atentamente, Gestor de Contenido.';

  const enMsg = translateAnnouncement(rawMsg, 'EN');
  assert.strictEqual(enMsg.includes('🌐 *[English Version]*'), true);
  assert.strictEqual(enMsg.includes('Official Announcement'), true);
  assert.strictEqual(enMsg.includes('Dear Colleagues'), true);

  const ptMsg = translateAnnouncement(rawMsg, 'PT');
  assert.strictEqual(ptMsg.includes('🌐 *[Versão em Português]*'), true);
  assert.strictEqual(ptMsg.includes('Prezados colegas'), true);

  const esMsg = translateAnnouncement(rawMsg, 'ES');
  assert.strictEqual(esMsg, rawMsg);
});

console.log('\n================================================================');
console.log(`📊 RESULTADOS FINALES: ${passed} / ${total} PRUEBAS EXITOSAS (${Math.round((passed/total)*100)}%)`);
console.log('================================================================\n');

if (passed === total) process.exit(0);
else process.exit(1);
