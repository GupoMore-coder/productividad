/**
 * TEST SUITE: Flujo Conversacional End-to-End de WhatsApp
 * Valida integralmente las 6 Reglas de Uso Apropiado, Gobernanza y Protocolo de Anonimato Estricto:
 * 1. Onboarding de residente con bienvenida institucional
 * 2. Alerta interactiva a la Dirección (Gestor de Contenido)
 * 3. Aprobación por Gestor de Contenido y entrega del Manual Oficial en PDF
 * 4. Búsqueda clínica (sin falsos positivos en términos anatómicos como "artículos")
 * 5. Comando on-demand "MANUAL" / "AYUDA" con link al PDF
 * 6. Canal intermediado confidencial (MENSAJE AL GESTOR:)
 * 7. Despacho anónimo de respuesta por el Gestor de Contenido (RESPONDER)
 * 8. Moderación activa y suspensión preventiva por lenguaje vulgar
 * 9. Desbloqueo disciplinario por el Gestor de Contenido
 * 10. Detección de DOI no existente con emisión de Ticket
 * 11. Menú de subespecialidades ortopédicas
 * 12. Blindaje de Anonimato Estricto (cero filtración de nombre real, iniciales o teléfono en respuestas a usuarios)
 */

const assert = require('assert');
const { processIncomingWhatsAppMessage, ADMIN_PHONE } = require('./whatsapp_conversational_engine.cjs');
const { LIVE_WEBAPP_URL } = require('./anonymous_proxy.cjs');

console.log('================================================================');
console.log('🧪 BATERÍA DE PRUEBAS: REGLAS DE USO APROPIADO & FLUJO WHATSAPP');
console.log('================================================================\n');

let passed = 0;
let total = 0;

async function runAsyncTest(name, fn) {
  total++;
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
  }
}

async function startSuite() {
  const TEST_RESIDENT_PHONE = `+57312${Date.now().toString().slice(-7)}`;

  // JORNADA 1: Onboarding y Registro de Residente
  await runAsyncTest('Jornada 1.1: Solicitud inicial sin credenciales -> Bot solicita datos de registro', async () => {
    const res = await processIncomingWhatsAppMessage({
      fromPhone: TEST_RESIDENT_PHONE,
      senderName: 'Mateo',
      messageText: 'Hola, buenas tardes. Quisiera consultar unos artículos sobre trauma.'
    });

    assert.strictEqual(res.recipientPhone, TEST_RESIDENT_PHONE);
    assert.strictEqual(res.replyText.includes('Bienvenido(a) a la Biblioteca Médica'), true);
    assert.strictEqual(res.replyText.includes('Universidad u Hospital'), true);
    assert.strictEqual(res.replyText.includes('Gestor de Contenido'), true);
  });

  await runAsyncTest('Jornada 1.2: Envío de datos -> Registro en PENDIENTE_APROBACION y alerta a Gestor de Contenido', async () => {
    const res = await processIncomingWhatsAppMessage({
      fromPhone: TEST_RESIDENT_PHONE,
      senderName: 'Dr. Mateo Valencia',
      messageText: 'Dr. Mateo Valencia - Universidad de Antioquia - Residente R2 Ortopedia'
    });

    assert.strictEqual(res.recipientPhone, TEST_RESIDENT_PHONE);
    assert.strictEqual(res.replyText.includes('Gestor de Contenido'), true);
    assert.strictEqual(res.replyText.includes('En espera de autorización'), true);

    // Verificar alerta para la Dirección
    assert.strictEqual(Boolean(res.alertToGerente), true);
    assert.strictEqual(res.alertToGerente.phone, ADMIN_PHONE);
    assert.strictEqual(res.alertToGerente.message.includes('NUEVA SOLICITUD DE ACCESO'), true);
    assert.strictEqual(res.alertToGerente.message.includes('Dr. Mateo Valencia'), true);
    assert.strictEqual(res.alertToGerente.message.includes(TEST_RESIDENT_PHONE), true);
  });

  // JORNADA 2: Aprobación por Gestor de Contenido y Entrega de Manual PDF
  await runAsyncTest('Jornada 2: Gestor de Contenido aprueba residente -> Usuario recibe bienvenida y link al Manual PDF', async () => {
    const res = await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: `APROBAR ${TEST_RESIDENT_PHONE}`
    });

    assert.strictEqual(res.recipientPhone, ADMIN_PHONE);
    assert.strictEqual(res.replyText.includes('Usuario Autorizado con Éxito'), true);
    assert.strictEqual(Boolean(res.notifyUser), true);
    assert.strictEqual(res.notifyUser.phone, TEST_RESIDENT_PHONE);
    assert.strictEqual(res.notifyUser.message.includes('formalmente aprobada'), true);
    assert.strictEqual(res.notifyUser.message.includes('Manual de Uso Oficial (PDF)'), true);
    assert.strictEqual(res.notifyUser.message.includes('token='), true);
  });

  // JORNADA 3: Búsqueda Clínica Exitosa sin Falsos Positivos
  await runAsyncTest('Jornada 3: Residente busca "artículos de profilaxis antibiotica" -> Entrega ficha clínica y token anónimo', async () => {
    const res = await processIncomingWhatsAppMessage({
      fromPhone: TEST_RESIDENT_PHONE,
      senderName: 'Dr. Mateo Valencia',
      messageText: 'artículos de profilaxis antibiotica en fracturas expuestas'
    });

    assert.strictEqual(res.recipientPhone, TEST_RESIDENT_PHONE);
    assert.strictEqual(res.replyText.includes('LITERATURA ENCONTRADA'), true);
    assert.strictEqual(res.replyText.includes('Descarga Segura en la Nube'), true);
    assert.strictEqual(res.replyText.includes(LIVE_WEBAPP_URL), true);
    assert.strictEqual(res.replyText.includes('drive.google.com'), false); // Zero-Knowledge Drive
  });

  // JORNADA 4: Solicitud On-Demand del Manual
  await runAsyncTest('Jornada 4: Residente envía "MANUAL" -> Entrega resumen de gobernanza y link al PDF', async () => {
    const res = await processIncomingWhatsAppMessage({
      fromPhone: TEST_RESIDENT_PHONE,
      senderName: 'Dr. Mateo Valencia',
      messageText: 'MANUAL'
    });

    assert.strictEqual(res.recipientPhone, TEST_RESIDENT_PHONE);
    assert.strictEqual(res.replyText.includes('MANUAL DE USO Y GOBERNANZA DEL PROYECTO'), true);
    assert.strictEqual(res.replyText.includes('Gestor de Contenido'), true);
    assert.strictEqual(res.replyText.includes('Descargar Manual Oficial en PDF'), true);
    assert.strictEqual(res.replyText.includes('token='), true);
  });

  // JORNADA 5: Canal Intermediado con el Gestor de Contenido
  await runAsyncTest('Jornada 5: Residente envía "MENSAJE AL GESTOR:" -> Relé confidencial a la Dirección', async () => {
    const res = await processIncomingWhatsAppMessage({
      fromPhone: TEST_RESIDENT_PHONE,
      senderName: 'Dr. Mateo Valencia',
      messageText: 'MENSAJE AL GESTOR: Tenemos una duda con el abordaje anterolateral para pilón tibial.'
    });

    assert.strictEqual(res.recipientPhone, TEST_RESIDENT_PHONE);
    assert.strictEqual(res.replyText.includes('Mensaje Transmitido a la Dirección'), true);
    assert.strictEqual(res.replyText.includes('Gestor de Contenido'), true);

    // Verificar que Gestor de Contenido recibe la alerta privada
    assert.strictEqual(Boolean(res.alertToGerente), true);
    assert.strictEqual(res.alertToGerente.phone, ADMIN_PHONE);
    assert.strictEqual(res.alertToGerente.message.includes('MENSAJE RECIBIDO PARA EL GESTOR DE CONTENIDO'), true);
    assert.strictEqual(res.alertToGerente.message.includes('pilón tibial'), true);
  });

  // JORNADA 6: Respuesta Despachada por Gestor de Contenido
  await runAsyncTest('Jornada 6: Gestor de Contenido despacha respuesta "RESPONDER +57..." -> Entrega anónima al residente', async () => {
    const res = await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: `RESPONDER ${TEST_RESIDENT_PHONE} Revisar el capítulo de abordajes de Judet en la sección de pie y tobillo.`
    });

    assert.strictEqual(res.recipientPhone, ADMIN_PHONE);
    assert.strictEqual(res.replyText.includes('Mensaje Despachado al Usuario'), true);
    assert.strictEqual(Boolean(res.notifyUser), true);
    assert.strictEqual(res.notifyUser.phone, TEST_RESIDENT_PHONE);
    assert.strictEqual(res.notifyUser.message.includes('RESPUESTA DE LA DIRECCIÓN DEL PROYECTO'), true);
    assert.strictEqual(res.notifyUser.message.includes('Gestor de Contenido:'), true);
    assert.strictEqual(res.notifyUser.message.includes('capítulo de abordajes de Judet'), true);
  });

  // JORNADA 7: Moderación Activa y Suspensión Preventiva
  await runAsyncTest('Jornada 7: Mensaje con lenguaje soez/vulgar -> Suspensión preventiva inmediata y alerta', async () => {
    const BAD_PHONE = '+573197778899';
    const res = await processIncomingWhatsAppMessage({
      fromPhone: BAD_PHONE,
      senderName: 'Infractor',
      messageText: 'Esto es una completa mierda no sirve'
    });

    assert.strictEqual(res.recipientPhone, BAD_PHONE);
    assert.strictEqual(res.replyText.includes('ACCESO SUSPENDIDO POR VIOLACIÓN DEL CÓDIGO DE CONDUCTA'), true);
    assert.strictEqual(res.replyText.includes('Gestor de Contenido'), true);

    // Verificar que la Dirección fue alertada de la infracción
    assert.strictEqual(Boolean(res.alertToGerente), true);
    assert.strictEqual(res.alertToGerente.phone, ADMIN_PHONE);
    assert.strictEqual(res.alertToGerente.message.includes('ALERTA DE INCUMPLIMIENTO DISCIPLINARIO'), true);
    assert.strictEqual(res.alertToGerente.message.includes('DESBLOQUEAR'), true);
  });

  // JORNADA 8: Desbloqueo Disciplinario por Gestor de Contenido
  await runAsyncTest('Jornada 8: Gestor de Contenido desbloquea usuario -> Restablecimiento de acceso', async () => {
    const BAD_PHONE = '+573197778899';
    const res = await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: `DESBLOQUEAR ${BAD_PHONE}`
    });

    assert.strictEqual(res.recipientPhone, ADMIN_PHONE);
    assert.strictEqual(res.replyText.includes('Usuario Desbloqueado'), true);
    assert.strictEqual(Boolean(res.notifyUser), true);
    assert.strictEqual(res.notifyUser.phone, BAD_PHONE);
  });

  // JORNADA 9: Ticketing ante DOI Ausente
  await runAsyncTest('Jornada 9: Residente consulta DOI no existente -> Apertura de ticket y alerta', async () => {
    const testDoi = '10.1016/j.fas.2023.01.004';
    const res = await processIncomingWhatsAppMessage({
      fromPhone: TEST_RESIDENT_PHONE,
      senderName: 'Dr. Mateo Valencia',
      messageText: `Por favor me ayudan con este DOI: ${testDoi}`
    });

    assert.strictEqual(res.recipientPhone, TEST_RESIDENT_PHONE);
    assert.strictEqual(res.replyText.includes('Solicitud de Adquisición Registrada'), true);
    assert.strictEqual(res.replyText.includes('TCK-'), true);
    assert.strictEqual(Boolean(res.alertToGerente), true);
    assert.strictEqual(res.alertToGerente.phone, ADMIN_PHONE);
    assert.strictEqual(res.alertToGerente.message.includes(testDoi), true);
  });

  // JORNADA 10: Menú de Especialidades
  await runAsyncTest('Jornada 10: Residente solicita "menu" -> Despliegue de especialidades', async () => {
    const res = await processIncomingWhatsAppMessage({
      fromPhone: TEST_RESIDENT_PHONE,
      senderName: 'Dr. Mateo Valencia',
      messageText: 'menu'
    });

    assert.strictEqual(res.recipientPhone, TEST_RESIDENT_PHONE);
    assert.strictEqual(res.replyText.includes('ESPECIALIDADES DISPONIBLES'), true);
    assert.strictEqual(res.replyText.includes('Cadera y Pelvis'), true);
  });

  // JORNADA 11: Blindaje de Anonimato Absoluto
  await runAsyncTest('Jornada 11: Garantía Inviolable de Anonimato -> Nombre real, iniciales y teléfono jamás expuestos a usuarios', async () => {
    const sampleQueries = ['Hola', 'ayuda', 'manual', 'menu', 'infeccioso', 'contacto', 'quien administra'];
    for (const q of sampleQueries) {
      const res = await processIncomingWhatsAppMessage({
        fromPhone: TEST_RESIDENT_PHONE,
        senderName: 'Dr. Mateo Valencia',
        messageText: q
      });
      if (res.replyText) {
        assert.strictEqual(res.replyText.includes('Fernando Marulanda'), false, `Fuga de nombre en consulta "${q}"`);
        assert.strictEqual(res.replyText.includes('F.A.M.L'), false, `Fuga de iniciales en consulta "${q}"`);
        assert.strictEqual(res.replyText.includes('+573008880001'), false, `Fuga de teléfono en consulta "${q}"`);
        assert.strictEqual(res.replyText.includes('3008880001'), false, `Fuga de dígitos de teléfono en consulta "${q}"`);
      }
    }
  });

  console.log('\n================================================================');
  console.log(`📊 RESULTADOS FINALES: ${passed} / ${total} PRUEBAS EXITOSAS (${Math.round((passed/total)*100)}%)`);
  console.log('================================================================\n');

  if (passed === total) process.exit(0);
  else process.exit(1);
}

startSuite();
