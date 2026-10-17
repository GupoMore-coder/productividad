/**
 * TEST SUITE: Proxy de Descarga Anónima y Enmascaramiento Seguro (Paso 3)
 */

const assert = require('assert');
const { createSecureDownloadToken, verifyAndDecodeToken } = require('./anonymous_proxy.cjs');

console.log('================================================================');
console.log('🧪 EJECUTANDO BATERÍA DE PRUEBAS: PASO 3 - PROXY ANÓNIMO SEGURO');
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

const TEST_DRIVE_ID = '1Kri9evBjJWfWpTMvpbvh3CfKQkOJPs05';
const USER_A_PHONE = '+573105551234';
const USER_B_PHONE = '+573209998877';

// 1. Creación y validación legítima
runTest('Prueba 1: Emisión legítima y descifrado exitoso', () => {
  const token = createSecureDownloadToken({
    driveId: TEST_DRIVE_ID,
    userPhone: USER_A_PHONE,
    ttlMinutes: 20
  });

  assert.strictEqual(typeof token, 'string');
  assert.strictEqual(token.includes('.'), true);

  const verification = verifyAndDecodeToken(token, { userPhone: USER_A_PHONE });
  assert.strictEqual(verification.valid, true);
  assert.strictEqual(verification.driveId, TEST_DRIVE_ID);
  assert.strictEqual(verification.userPhone, USER_A_PHONE.replace(/[^\d+]/g, ''));
});

// 2. Resistencia a manipulación criptográfica (Tampering)
runTest('Prueba 2: Detección y rechazo de manipulación de firma', () => {
  const token = createSecureDownloadToken({
    driveId: TEST_DRIVE_ID,
    userPhone: USER_A_PHONE
  });

  const tamperedToken = token.slice(0, -4) + 'abcd';
  const verification = verifyAndDecodeToken(tamperedToken);
  assert.strictEqual(verification.valid, false);
  assert.strictEqual(verification.error, 'SIGNATURE_INVALID');
});

// 3. Caducidad estricta (TTL vencido)
runTest('Prueba 3: Caducidad estricta (Token expirado no permite descarga)', () => {
  const expiredToken = createSecureDownloadToken({
    driveId: TEST_DRIVE_ID,
    userPhone: USER_A_PHONE,
    ttlMinutes: -5 // Emitido en el pasado
  });

  const verification = verifyAndDecodeToken(expiredToken);
  assert.strictEqual(verification.valid, false);
  assert.strictEqual(verification.error, 'TOKEN_EXPIRED');
});

// 4. Bloqueo de redistribución entre usuarios (Anti-Forwarding)
runTest('Prueba 4: Bloqueo si el enlace es compartido a otro usuario (Usuario B intenta usar token de Usuario A)', () => {
  const tokenForUserA = createSecureDownloadToken({
    driveId: TEST_DRIVE_ID,
    userPhone: USER_A_PHONE
  });

  // Usuario B intenta validar el token emitido para Usuario A
  const verification = verifyAndDecodeToken(tokenForUserA, { userPhone: USER_B_PHONE });
  assert.strictEqual(verification.valid, false);
  assert.strictEqual(verification.error, 'USER_MISMATCH');
});

// 5. Garantía Zero-Knowledge de Google Drive
runTest('Prueba 5: Cero exposición de URLs de Google Drive en el token', () => {
  const token = createSecureDownloadToken({
    driveId: TEST_DRIVE_ID,
    userPhone: USER_A_PHONE
  });

  assert.strictEqual(token.includes('drive.google.com'), false);
  assert.strictEqual(token.includes('https://'), false);
  assert.strictEqual(token.includes('view?usp=sharing'), false);
});

console.log('\n================================================================');
console.log(`📊 RESULTADOS FINALES: ${passed} / ${total} PRUEBAS EXITOSAS (${Math.round((passed/total)*100)}%)`);
console.log('================================================================\n');

if (passed === total) process.exit(0);
else process.exit(1);
