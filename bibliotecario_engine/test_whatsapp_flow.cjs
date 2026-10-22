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
const {
  processIncomingWhatsAppMessage,
  ADMIN_PHONE,
  computeSentinelStats,
  recordSentinelMetric,
  clearSentinelMetrics,
  signTrustTokenLocal,
  validateTrustTokenLocal,
  verifyDonorPhoneLocal,
  uploadBuzonFileLocal,
  sendTransactionalEmailResendLocal,
  generateInvitationEmailHtml
} = require('./whatsapp_conversational_engine.cjs');
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
    assert.strictEqual(res.replyText.includes('Dirección') || res.replyText.includes('Iniciativa independiente'), true);
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

  // JORNADA 5: Canal Intermediado con la Dirección
  await runAsyncTest('Jornada 5: Residente envía "MENSAJE A LA DIRECCION:" -> Relé confidencial a la Dirección', async () => {
    const res = await processIncomingWhatsAppMessage({
      fromPhone: TEST_RESIDENT_PHONE,
      senderName: 'Dr. Mateo Valencia',
      messageText: 'MENSAJE A LA DIRECCION: Tenemos una duda con el abordaje anterolateral para pilón tibial.'
    });

    assert.strictEqual(res.recipientPhone, TEST_RESIDENT_PHONE);
    assert.strictEqual(res.replyText.includes('Mensaje Transmitido a la Dirección'), true);
    assert.strictEqual(res.replyText.includes('Dirección del Proyecto'), true);

    // Verificar que la Dirección recibe la alerta privada
    assert.strictEqual(Boolean(res.alertToGerente), true);
    assert.strictEqual(res.alertToGerente.phone, ADMIN_PHONE);
    assert.strictEqual(res.alertToGerente.message.includes('MENSAJE RECIBIDO PARA LA DIRECCIÓN DEL PROYECTO'), true);
    assert.strictEqual(res.alertToGerente.message.includes('pilón tibial'), true);
  });

  // JORNADA 6: Respuesta Despachada por la Dirección
  await runAsyncTest('Jornada 6: Dirección despacha respuesta "RESPONDER +57..." -> Entrega anónima al residente', async () => {
    const res = await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: `RESPONDER ${TEST_RESIDENT_PHONE} Revisar el capítulo de abordajes de Judet en la sección de pie y tobillo.`
    });

    assert.strictEqual(res.recipientPhone, ADMIN_PHONE);
    assert.strictEqual(res.replyText.includes('Mensaje Despachado al Usuario'), true);
    assert.strictEqual(Boolean(res.notifyUser), true);
    assert.strictEqual(res.notifyUser.phone, TEST_RESIDENT_PHONE);
    assert.strictEqual(res.notifyUser.message.includes('DIRECCIÓN DEL PROYECTO:'), true);
    assert.strictEqual(res.notifyUser.message.includes('Gestor de Contenido:'), false); // Cero fuga de figura personal al usuario
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

  // JORNADA 12: Suspensión Temporal Granular (24h - 48h - 72h) y Notificación Automática
  await runAsyncTest('Jornada 12: Gestor de Contenido suspende usuario por 48h -> Notificación con horas y bloqueo temporal', async () => {
    const SUSP_PHONE = '+573154443322';
    // Onboard first
    await processIncomingWhatsAppMessage({
      fromPhone: SUSP_PHONE,
      senderName: 'Dr. Carlos Rivas',
      messageText: 'Dr. Carlos Rivas - Universidad del Valle - Especialista en Ortopedia'
    });
    await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: `APROBAR ${SUSP_PHONE}`
    });

    // Suspend 48h
    const resSusp = await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: `SUSPENDER ${SUSP_PHONE} 48h Uso excesivo de consultas simultáneas`
    });

    assert.strictEqual(resSusp.recipientPhone, ADMIN_PHONE);
    assert.strictEqual(resSusp.replyText.includes('48h'), true);
    assert.strictEqual(Boolean(resSusp.notifyUser), true);
    assert.strictEqual(resSusp.notifyUser.phone, SUSP_PHONE);
    assert.strictEqual(resSusp.notifyUser.message.includes('SUSPENDIDO TEMPORALMENTE'), true);
    assert.strictEqual(resSusp.notifyUser.message.includes('48 horas'), true);

    // Intento de consulta durante la suspensión
    const resQuery = await processIncomingWhatsAppMessage({
      fromPhone: SUSP_PHONE,
      senderName: 'Dr. Carlos Rivas',
      messageText: 'fracturas de clavicula'
    });

    assert.strictEqual(resQuery.recipientPhone, SUSP_PHONE);
    assert.strictEqual(resQuery.replyText.includes('ACCESO TEMPORALMENTE SUSPENDIDO'), true);
    assert.strictEqual(resQuery.replyText.includes('Tiempo restante'), true);
  });

  // JORNADA 13: Reactivación Autónoma tras Expiración de Suspensión
  await runAsyncTest('Jornada 13: Suspensión expirada -> Reactivación autónoma automática', async () => {
    const EXPIRED_SUSP_PHONE = '+573181112233';
    const { loadUsers, saveUsers } = require('./governance_and_bulletin.cjs');
    const users = loadUsers();
    users.push({
      phone: EXPIRED_SUSP_PHONE,
      name: 'Dra. Elena Silva',
      university: 'Hospital San Vicente',
      level: 'Residente R3',
      status: 'SUSPENDIDO_24H',
      registeredAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      suspendedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      suspensionEnd: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), // Ya expiró hace 12h
      blockReason: 'Revisión preventiva',
      downloadQuota: 50,
      downloadsCount: 0
    });
    saveUsers(users);

    const resQuery = await processIncomingWhatsAppMessage({
      fromPhone: EXPIRED_SUSP_PHONE,
      senderName: 'Dra. Elena Silva',
      messageText: 'fracturas expuestas'
    });

    assert.strictEqual(resQuery.recipientPhone, EXPIRED_SUSP_PHONE);
    assert.strictEqual(resQuery.replyText.includes('LITERATURA ENCONTRADA'), true);
  });

  // JORNADA 14: Expulsión Definitiva (Irrevocable) y Cero Re-registro
  await runAsyncTest('Jornada 14: Expulsión definitiva -> Notificación al usuario y prohibición de por vida', async () => {
    const EXPEL_PHONE = '+573198889900';
    await processIncomingWhatsAppMessage({
      fromPhone: EXPEL_PHONE,
      senderName: 'Dr. Infiltrado',
      messageText: 'Dr. Infiltrado - Hospital Central - Especialista en Ortopedia'
    });
    await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: `APROBAR ${EXPEL_PHONE}`
    });

    // Expulsar
    const resExpel = await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: `EXPULSAR ${EXPEL_PHONE} Intento deliberado de sustracción de catálogo`
    });

    assert.strictEqual(resExpel.recipientPhone, ADMIN_PHONE);
    assert.strictEqual(resExpel.replyText.includes('Usuario Expulsado Permanentemente'), true);
    assert.strictEqual(Boolean(resExpel.notifyUser), true);
    assert.strictEqual(resExpel.notifyUser.message.includes('EXPULSADOS DE FORMA PERMANENTE E IRREVOCABLE'), true);

    // Intento de consulta
    const resQuery = await processIncomingWhatsAppMessage({
      fromPhone: EXPEL_PHONE,
      senderName: 'Dr. Infiltrado',
      messageText: 'menu'
    });
    assert.strictEqual(resQuery.recipientPhone, EXPEL_PHONE);
    assert.strictEqual(resQuery.replyText.includes('ACCESO REVOCADO PERMANENTEMENTE'), true);

    // Intento de re-registro
    const resReReg = await processIncomingWhatsAppMessage({
      fromPhone: EXPEL_PHONE,
      senderName: 'Dr. Infiltrado',
      messageText: 'Dr. Infiltrado - Universidad Nueva - Especialista'
    });
    assert.strictEqual(resReReg.recipientPhone, EXPEL_PHONE);
    assert.strictEqual(resReReg.replyText.includes('ACCESO REVOCADO PERMANENTEMENTE'), true);
  });

  // JORNADA 15: Comando ACTIVAR como restablecimiento directo
  await runAsyncTest('Jornada 15: Gestor de Contenido activa usuario con "ACTIVAR +57..." -> Restablecimiento', async () => {
    const USER_PHONE = '+573179998877';
    await processIncomingWhatsAppMessage({
      fromPhone: USER_PHONE,
      senderName: 'Dr. David Suarez',
      messageText: 'Dr. David Suarez - Universidad Javeriana - Residente R1'
    });

    const resAct = await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: `ACTIVAR ${USER_PHONE}`
    });

    assert.strictEqual(resAct.recipientPhone, ADMIN_PHONE);
    assert.strictEqual(resAct.replyText.includes('Usuario Autorizado con Éxito'), true);
    assert.strictEqual(Boolean(resAct.notifyUser), true);
    assert.strictEqual(resAct.notifyUser.phone, USER_PHONE);
  });

  // JORNADA 16: Onboarding con Correo Electrónico Personal/Institucional
  await runAsyncTest('Jornada 16: Onboarding con correo electrónico -> Registro y alerta con correo', async () => {
    const MAIL_USER_PHONE = `+57318${Date.now().toString().slice(-7)}`;
    const resRegMail = await processIncomingWhatsAppMessage({
      fromPhone: MAIL_USER_PHONE,
      senderName: 'Dra. Camila Morales',
      messageText: 'Dra. Camila Morales - camila.morales@hospitalgeneral.org - Hospital General - Residente R3'
    });

    assert.strictEqual(resRegMail.recipientPhone, MAIL_USER_PHONE);
    assert.strictEqual(resRegMail.replyText.includes('camila.morales@hospitalgeneral.org'), true);
    assert.strictEqual(Boolean(resRegMail.alertToGerente), true);
    assert.strictEqual(resRegMail.alertToGerente.message.includes('camila.morales@hospitalgeneral.org'), true);
  });

  // JORNADA 17: Solicitud de Guía de Actualización de Datos (ACTUALIZAR DATOS)
  await runAsyncTest('Jornada 17: Usuario consulta "ACTUALIZAR DATOS" -> Recibe directrices y formato', async () => {
    const TEST_ACT_PHONE = `+57319${Date.now().toString().slice(-7)}`;
    await processIncomingWhatsAppMessage({
      fromPhone: TEST_ACT_PHONE,
      senderName: 'Dr. Felipe Duarte',
      messageText: 'Dr. Felipe Duarte - Hospital San Ignacio - Especialista'
    });
    // Gestor aprueba
    await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: `APROBAR ${TEST_ACT_PHONE}`
    });

    const resPrompt = await processIncomingWhatsAppMessage({
      fromPhone: TEST_ACT_PHONE,
      senderName: 'Dr. Felipe Duarte',
      messageText: 'ACTUALIZAR DATOS'
    });

    assert.strictEqual(resPrompt.recipientPhone, TEST_ACT_PHONE);
    assert.strictEqual(resPrompt.replyText.includes('ACTUALIZACIÓN DE DATOS PERSONALES'), true);
    assert.strictEqual(resPrompt.replyText.includes('ACTUALIZAR: [Nombre], [Correo], [Hospital/Universidad], [Nivel]'), true);
    assert.strictEqual(resPrompt.replyText.includes('Máximo *3 actualizaciones en 6 meses*'), true);
    assert.strictEqual(resPrompt.replyText.includes('Máximo *6 actualizaciones en 12 meses*'), true);
  });

  // JORNADA 18: Ejecución de Actualización y Límite Estricto (Máx 3 en 6 meses)
  await runAsyncTest('Jornada 18: Actualización on-demand y bloqueo de 4ta actualización en 6 meses', async () => {
    const LIMIT_PHONE = `+57321${Date.now().toString().slice(-7)}`;
    await processIncomingWhatsAppMessage({
      fromPhone: LIMIT_PHONE,
      senderName: 'Dr. Andrés Castro',
      messageText: 'Dr. Andrés Castro - Clinica Reina Sofia - Residente R2'
    });
    await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: `APROBAR ${LIMIT_PHONE}`
    });

    // 1ra actualización
    const act1 = await processIncomingWhatsAppMessage({
      fromPhone: LIMIT_PHONE,
      senderName: 'Dr. Andrés Castro',
      messageText: 'ACTUALIZAR: Dr. Andrés Castro M., andres.castro@colsanitas.com, Clinica Reina Sofia, Residente R3'
    });
    assert.strictEqual(act1.replyText.includes('DATOS PERSONALES ACTUALIZADOS CON ÉXITO'), true);
    assert.strictEqual(act1.replyText.includes('1 de 3'), true);
    assert.strictEqual(act1.replyText.includes('andres.castro@colsanitas.com'), true);

    // 2da actualización
    const act2 = await processIncomingWhatsAppMessage({
      fromPhone: LIMIT_PHONE,
      senderName: 'Dr. Andrés Castro',
      messageText: 'ACTUALIZAR: Dr. Andrés Castro M., andres.castro@hospital.edu.co, Hospital Universitario, Residente R3'
    });
    assert.strictEqual(act2.replyText.includes('DATOS PERSONALES ACTUALIZADOS CON ÉXITO'), true);
    assert.strictEqual(act2.replyText.includes('2 de 3'), true);

    // 3ra actualización (tope semestral)
    const act3 = await processIncomingWhatsAppMessage({
      fromPhone: LIMIT_PHONE,
      senderName: 'Dr. Andrés Castro',
      messageText: 'ACTUALIZAR: Dr. Andrés Castro PhD, andres.castro@hospital.edu.co, Hospital Universitario, Especialista'
    });
    assert.strictEqual(act3.replyText.includes('DATOS PERSONALES ACTUALIZADOS CON ÉXITO'), true);
    assert.strictEqual(act3.replyText.includes('3 de 3'), true);

    // 4ta actualización (RECHAZADA por límite de 3 en 6 meses)
    const act4 = await processIncomingWhatsAppMessage({
      fromPhone: LIMIT_PHONE,
      senderName: 'Dr. Andrés Castro',
      messageText: 'ACTUALIZAR: Dr. Andrés Castro Fellow, andres.castro@hospital.edu.co, Hospital Universitario, Fellow'
    });
    assert.strictEqual(act4.replyText.includes('LÍMITE DE ACTUALIZACIÓN ALCANZADO'), true);
    assert.strictEqual(act4.replyText.includes('3 actualizaciones en un periodo de 6 meses'), true);
    assert.strictEqual(act4.replyText.includes('MENSAJE A LA DIRECCIÓN'), true);
  });

  // JORNADA 19: Detección de Procedencia Internacional (+55 Brasil) y Bienvenida Fraterna
  await runAsyncTest('Jornada 19: Teléfono de Brasil (+55) recibe bienvenida fraterna en portugués con bandera', async () => {
    const BRAZIL_PHONE = `+55119${Date.now().toString().slice(-7)}`;
    const res = await processIncomingWhatsAppMessage({
      fromPhone: BRAZIL_PHONE,
      senderName: 'Dr. Thiago Santos',
      messageText: 'Olá, bom dia! Gostaria de conhecer o acervo da biblioteca.'
    });

    assert.strictEqual(res.replyText.includes('Bem-vindo(a) à Biblioteca Médica'), true);
    assert.strictEqual(res.replyText.includes('Brasil 🇧🇷'), true);
    assert.strictEqual(res.replyText.includes('Seleção de Idioma:'), true);
    assert.strictEqual(res.replyText.includes('IDIOMA: PT'), true);
  });

  // JORNADA 20: Detección de Procedencia Internacional (+1 USA/Canadá) y Bienvenida en Inglés
  await runAsyncTest('Jornada 20: Teléfono de Norteamérica (+1) recibe bienvenida fraterna en inglés', async () => {
    const USA_PHONE = `+1305${Date.now().toString().slice(-7)}`;
    const res = await processIncomingWhatsAppMessage({
      fromPhone: USA_PHONE,
      senderName: 'Dr. John Miller',
      messageText: 'Hello, I would like to access orthopaedic surgical techniques.'
    });

    assert.strictEqual(res.replyText.includes('Welcome to the Orthopaedic Surgery'), true);
    assert.strictEqual(res.replyText.includes('United States and Canada'), true);
    assert.strictEqual(res.replyText.includes('Language Selection:'), true);
    assert.strictEqual(res.replyText.includes('LANGUAGE: EN'), true);
  });

  // JORNADA 21: Elección y Cambio Ilimitado de Idioma de Comunicación
  await runAsyncTest('Jornada 21: Selección y cambio ilimitado de idioma (EN -> PT -> ES) sin consumo de cuota', async () => {
    const MULTI_LANG_PHONE = `+57318${Date.now().toString().slice(-7)}`;
    // Registro
    await processIncomingWhatsAppMessage({
      fromPhone: MULTI_LANG_PHONE,
      senderName: 'Dra. Camila Morales',
      messageText: 'Nombre: Dra. Camila Morales, Correo: camila@hospital.org, Hospital Universitario, Residente R3'
    });
    // Aprobación por Gestor de Contenido
    await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: `APROBAR ${MULTI_LANG_PHONE}`
    });

    // 1. Consulta menú de idioma
    const menuLang = await processIncomingWhatsAppMessage({
      fromPhone: MULTI_LANG_PHONE,
      senderName: 'Dra. Camila Morales',
      messageText: 'IDIOMA'
    });
    assert.strictEqual(menuLang.replyText.includes('PREFERENCIA DE IDIOMA'), true);
    assert.strictEqual(menuLang.replyText.includes('Preservación de Literatura Médica:'), true);

    // 2. Cambio a Inglés
    const changeEN = await processIncomingWhatsAppMessage({
      fromPhone: MULTI_LANG_PHONE,
      senderName: 'Dra. Camila Morales',
      messageText: 'LANGUAGE: EN'
    });
    assert.strictEqual(changeEN.replyText.includes('LANGUAGE SUCCESSFULLY UPDATED'), true);
    assert.strictEqual(changeEN.replyText.includes('English (EN)'), true);
    assert.strictEqual(changeEN.replyText.includes('Original scientific PDF articles and textbooks are preserved'), true);

    // 3. Cambio inmediato a Portugués (Sin límites de frecuencia)
    const changePT = await processIncomingWhatsAppMessage({
      fromPhone: MULTI_LANG_PHONE,
      senderName: 'Dra. Camila Morales',
      messageText: 'IDIOMA: PT'
    });
    assert.strictEqual(changePT.replyText.includes('IDIOMA ATUALIZADO COM SUCESSO'), true);
    assert.strictEqual(changePT.replyText.includes('Português (PT)'), true);

    // 4. Retorno a Español
    const changeES = await processIncomingWhatsAppMessage({
      fromPhone: MULTI_LANG_PHONE,
      senderName: 'Dra. Camila Morales',
      messageText: 'IDIOMA: ES'
    });
    assert.strictEqual(changeES.replyText.includes('IDIOMA DE COMUNICACIÓN ACTUALIZADO'), true);
    assert.strictEqual(changeES.replyText.includes('Español (ES)'), true);
  });

  // JORNADA 22: Despacho de Comunicado Oficial del Gestor de Contenido con Traducción Dinámica
  await runAsyncTest('Jornada 22: COMUNICADO del Gestor de Contenido se traduce dinámicamente al idioma de cada médico', async () => {
    // Registramos un médico con preferencia en inglés y otro en portugués
    const EN_DOCTOR_PHONE = `+44791${Date.now().toString().slice(-7)}`;
    await processIncomingWhatsAppMessage({
      fromPhone: EN_DOCTOR_PHONE,
      senderName: 'Dr. Arthur Pendelton',
      messageText: 'Arthur Pendelton, arthur@oxford.nhs.uk, Oxford Hospital, Specialist, Language: EN'
    });
    await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: `APROBAR ${EN_DOCTOR_PHONE}`
    });

    const PT_DOCTOR_PHONE = `+55219${Date.now().toString().slice(-7)}`;
    await processIncomingWhatsAppMessage({
      fromPhone: PT_DOCTOR_PHONE,
      senderName: 'Dr. Rafael Costa',
      messageText: 'Rafael Costa, rafael@ufrj.br, Hospital Clementino Fraga, Especialista, Idioma: PT'
    });
    await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: `APROBAR ${PT_DOCTOR_PHONE}`
    });

    // Gestor de Contenido despacha comunicado institucional en español
    const broadcastRes = await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: 'COMUNICADO: Estimados colegas, mantenimiento programado de la base de datos por 2 horas. Gracias por su comprensión.'
    });

    assert.strictEqual(broadcastRes.replyText.includes('COMUNICADO MASIVO DESPACHADO'), true);
    assert.strictEqual(Array.isArray(broadcastRes.broadcastDispatches), true);

    // Verificamos que el médico angloparlante lo recibió en inglés
    const enDispatch = broadcastRes.broadcastDispatches.find(d => d.phone === EN_DOCTOR_PHONE);
    assert.strictEqual(Boolean(enDispatch), true);
    assert.strictEqual(enDispatch.language, 'EN');
    assert.strictEqual(enDispatch.message.includes('Dear Colleagues'), true);

    // Verificamos que el médico brasileño lo recibió en portugués
    const ptDispatch = broadcastRes.broadcastDispatches.find(d => d.phone === PT_DOCTOR_PHONE);
    assert.strictEqual(Boolean(ptDispatch), true);
    assert.strictEqual(ptDispatch.language, 'PT');
    assert.strictEqual(ptDispatch.message.includes('Prezados colegas'), true);
  });

  // JORNADA 23: Preservación de la Originalidad de los Documentos Médicos en PDF
  await runAsyncTest('Jornada 23: Descarga de literatura científica preserva íntegro el idioma original del documento', async () => {
    const SEARCH_PHONE = `+57319${Date.now().toString().slice(-7)}`;
    await processIncomingWhatsAppMessage({
      fromPhone: SEARCH_PHONE,
      senderName: 'Dr. Gabriel Ruiz',
      messageText: 'Gabriel Ruiz, gabriel@unal.edu.co, Hospital San Juan, Residente R4'
    });
    await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: `APROBAR ${SEARCH_PHONE}`
    });

    // Búsqueda de técnica quirúrgica
    const searchRes = await processIncomingWhatsAppMessage({
      fromPhone: SEARCH_PHONE,
      senderName: 'Dr. Gabriel Ruiz',
      messageText: 'AO 31-A2'
    });

    assert.strictEqual(searchRes.replyText.includes('LITERATURA ENCONTRADA'), true);
    assert.strictEqual(searchRes.replyText.includes('Descarga Segura en la Nube'), true);
    assert.strictEqual(searchRes.replyText.includes(LIVE_WEBAPP_URL), true);
  });

  // JORNADA 24: Botón / Comando RECHAZAR Solicitud de Acceso
  await runAsyncTest('Jornada 24: Gestor de Contenido rechaza solicitud -> Notificación enviada al postulante', async () => {
    const REJ_PHONE = `+58414${Date.now().toString().slice(-7)}`;
    await processIncomingWhatsAppMessage({
      fromPhone: REJ_PHONE,
      senderName: 'Dr. Solicitante Incompleto',
      messageText: 'Dr. Solicitante, sin_hospital@correo.com, Residente'
    });

    // Rechazo con botón o comando RECHAZAR
    const rejRes = await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: `RECHAZAR ${REJ_PHONE} No adjuntó constancia hospitalaria`
    });

    assert.strictEqual(rejRes.recipientPhone, ADMIN_PHONE);
    assert.strictEqual(rejRes.replyText.includes('Solicitud de Acceso Rechazada'), true);
    assert.strictEqual(Boolean(rejRes.notifyUser), true);
    assert.strictEqual(rejRes.notifyUser.phone, REJ_PHONE);
    assert.strictEqual(rejRes.notifyUser.message.includes('no ha sido aprobada'), true);
    assert.strictEqual(rejRes.notifyUser.message.includes('No adjuntó constancia hospitalaria'), true);
  });

  // JORNADA 25: Botón / Comando MENSAJE para Enviar Mensaje Dirigido al Postulante
  await runAsyncTest('Jornada 25: Gestor de Contenido envía mensaje dirigido específicamente al postulante', async () => {
    const MSG_PHONE = `+58424${Date.now().toString().slice(-7)}`;
    await processIncomingWhatsAppMessage({
      fromPhone: MSG_PHONE,
      senderName: 'Dr. Carlos Mendoza',
      messageText: 'Carlos Mendoza, carlos@hospital.com, Hospital Central, Residente R2'
    });

    // 1. Gestor pulsa botón MENSAJE (sin texto aún)
    const promptRes = await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: `msg_${MSG_PHONE}`
    });
    assert.strictEqual(promptRes.recipientPhone, ADMIN_PHONE);
    assert.strictEqual(promptRes.replyText.includes('Redactar Mensaje'), true);

    // 2. Gestor despacha el mensaje específico
    const sendRes = await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: `MENSAJE ${MSG_PHONE} Estimado Doctor, por favor confirme en qué servicio realiza su rotación.`
    });

    assert.strictEqual(sendRes.recipientPhone, ADMIN_PHONE);
    assert.strictEqual(sendRes.replyText.includes('Mensaje Despachado al Usuario'), true);
    assert.strictEqual(Boolean(sendRes.notifyUser), true);
    assert.strictEqual(sendRes.notifyUser.phone, MSG_PHONE);
    assert.strictEqual(sendRes.notifyUser.message.includes('confirme en qué servicio realiza su rotación'), true);
    assert.strictEqual(sendRes.notifyUser.message.includes('DIRECCIÓN DEL PROYECTO'), true);
  });

  // JORNADA 26: Postulante en PENDIENTE responde y Gestor recibe alerta con botones de acción rápida
  await runAsyncTest('Jornada 26: Postulante pendiente responde -> Gestor recibe alerta con opciones de acción rápida', async () => {
    const PEND_PHONE = `+58412${Date.now().toString().slice(-7)}`;
    await processIncomingWhatsAppMessage({
      fromPhone: PEND_PHONE,
      senderName: 'Dr. Edicson Matos',
      messageText: 'Edicson Matos, javier@correo.com, Hospital Vargas, Residente R3'
    });

    // El postulante envía un mensaje aclaratorio mientras está en PENDIENTE_APROBACION
    const replyRes = await processIncomingWhatsAppMessage({
      fromPhone: PEND_PHONE,
      senderName: 'Dr. Edicson Matos',
      messageText: 'Adjunto confirmación de rotación en Cirugía de Columna en Hospital Vargas.'
    });

    assert.strictEqual(replyRes.recipientPhone, PEND_PHONE);
    assert.strictEqual(replyRes.replyText.includes('Información Recibida por la Dirección'), true);
    assert.strictEqual(Boolean(replyRes.alertToGerente), true);
    assert.strictEqual(replyRes.alertToGerente.phone, ADMIN_PHONE);
    assert.strictEqual(replyRes.alertToGerente.message.includes('RESPUESTA / MENSAJE DE POSTULANTE PENDIENTE'), true);
    assert.strictEqual(replyRes.alertToGerente.message.includes('ACTIVAR'), true);
    assert.strictEqual(replyRes.alertToGerente.message.includes('RECHAZAR'), true);
    assert.strictEqual(replyRes.alertToGerente.message.includes('MENSAJE'), true);
  });

  // JORNADA 27: Centinela Perpetuo de Rendimiento y Escalabilidad Heredada (Media + Mediana)
  await runAsyncTest('Jornada 27: Gestor de Contenido consulta "RENDIMIENTO" y "ESTADO" -> Auditoría activa del Centinela', async () => {
    // 1. Consulta explícita de RENDIMIENTO
    const perfRes = await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: 'RENDIMIENTO'
    });

    assert.strictEqual(perfRes.recipientPhone, ADMIN_PHONE);
    assert.strictEqual(perfRes.replyText.includes('CENTINELA DE RENDIMIENTO Y ESCALABILIDAD'), true);
    assert.strictEqual(perfRes.replyText.includes('Estado Operativo:'), true);
    assert.strictEqual(perfRes.replyText.includes('Latencia Media:'), true);
    assert.strictEqual(perfRes.replyText.includes('Mediana (P50):'), true);
    assert.strictEqual(perfRes.replyText.includes('Percentil 90'), true);
    assert.strictEqual(perfRes.replyText.includes('Dictamen de Escalabilidad:'), true);
    assert.strictEqual(perfRes.replyText.includes('Google Apps Script'), true);

    // 2. Consulta de ESTADO incluye Centinela
    const estadoRes = await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: 'ESTADO'
    });

    assert.strictEqual(estadoRes.recipientPhone, ADMIN_PHONE);
    assert.strictEqual(estadoRes.replyText.includes('Centinela Rendimiento:'), true);
    assert.strictEqual(estadoRes.replyText.includes('Mediana'), true);
    assert.strictEqual(estadoRes.replyText.includes('RENDIMIENTO'), true);
  });

  // JORNADA 28: Prueba de Robustez Estadística (Valor Atípico / Cold-Start no dispara falso ROJO)
  await runAsyncTest('Jornada 28: Simulación de Cold-Start (Media alta, Mediana 1.4s) -> Permanece VERDE sin falso ROJO', async () => {
    clearSentinelMetrics();
    // Registramos 1 muestra atípica de 120s (ej. cold start de despliegue) y 10 muestras normales de 1.4s (total 11 muestras reales)
    recordSentinelMetric('COLD_START', 120000);
    for (let i = 0; i < 10; i++) {
      recordSentinelMetric('NORMAL_REQ', 1400);
    }
    const stats = computeSentinelStats();
    assert.strictEqual(stats.avgMs > 6000, true);
    assert.strictEqual(stats.medianMs <= 2500, true);
    assert.strictEqual(stats.status, 'VERDE');
    assert.strictEqual(stats.verdict.includes('Cold-Start asimilado'), true);
  });

  // JORNADA 29: Buzón Digital Seguro - Validación de Teléfono Obligatorio y Bloqueo de Número No Registrado
  await runAsyncTest('Jornada 29: Dispositivo desconocido con teléfono no registrado -> Bloqueo y enlace WhatsApp', async () => {
    const UNKNOWN_PHONE = '+573998887766';
    
    // 1. Verificación directa de teléfono no registrado
    const checkRes = verifyDonorPhoneLocal(UNKNOWN_PHONE);
    assert.strictEqual(checkRes.valid, false);
    assert.strictEqual(checkRes.notRegistered, true);
    assert.strictEqual(checkRes.error.includes('no se encuentra registrado'), true);
    assert.strictEqual(checkRes.waLink.includes('https://wa.me/573205955993'), true);
    assert.strictEqual(checkRes.waLink.includes(encodeURIComponent('Hola, solicito registro y aprobación en la Biblioteca Médica para acceder al Buzón Digital. Mi número es ' + UNKNOWN_PHONE)), true);

    // 2. Intento de subida de archivo bloqueado
    const uploadRes = uploadBuzonFileLocal({
      fileName: 'Caso_Clinico_Fractura.pdf',
      donorPhone: UNKNOWN_PHONE,
      trustDevice: true
    });
    assert.strictEqual(uploadRes.success, false);
    assert.strictEqual(uploadRes.notRegistered, true);
    assert.strictEqual(uploadRes.error.includes('no se encuentra registrado'), true);
    assert.strictEqual(Boolean(uploadRes.waLink), true);
  });

  // JORNADA 30: Buzón Digital Seguro - Bloqueo de Teléfono en PENDIENTE o SUSPENDIDO
  await runAsyncTest('Jornada 30: Teléfono registrado pero PENDIENTE o SUSPENDIDO -> Bloqueo y solicitud de aprobación', async () => {
    const PEND_PHONE = `+57316${Date.now().toString().slice(-7)}`;
    // Registramos usuario pero queda en PENDIENTE_APROBACION
    await processIncomingWhatsAppMessage({
      fromPhone: PEND_PHONE,
      senderName: 'Dra. Andrea Morales',
      messageText: 'Andrea Morales, andrea@hospital.org, Hospital Militar, Residente R1'
    });

    const checkRes = verifyDonorPhoneLocal(PEND_PHONE);
    assert.strictEqual(checkRes.valid, false);
    assert.strictEqual(checkRes.suspended, true);
    assert.strictEqual(checkRes.error.includes('PENDIENTE_APROBACION'), true);
    assert.strictEqual(checkRes.waLink.includes('https://wa.me/573205955993'), true);

    const uploadRes = uploadBuzonFileLocal({
      fileName: 'Tesis_Ortopedia.pdf',
      donorPhone: PEND_PHONE,
      trustDevice: false
    });
    assert.strictEqual(uploadRes.success, false);
    assert.strictEqual(uploadRes.suspended, true);
    assert.strictEqual(Boolean(uploadRes.waLink), true);
  });

  // JORNADA 31: Buzón Digital Seguro - Usuario Aprobado con [x] Recordar Dispositivo
  await runAsyncTest('Jornada 31: Usuario registrado y aprobado deposita PDF con [x] Recordar Dispositivo -> Token emitido', async () => {
    const APPR_PHONE = `+57318${Date.now().toString().slice(-7)}`;
    // 1. Registro
    await processIncomingWhatsAppMessage({
      fromPhone: APPR_PHONE,
      senderName: 'Dr. Fernando Restrepo',
      messageText: 'Fernando Restrepo, fernando@clinica.com, Clínica Medellín, Especialista'
    });
    // 2. Aprobación por Gestor de Contenido
    await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: `APROBAR ${APPR_PHONE}`
    });

    // 3. Verificación de teléfono aprobado
    const checkRes = verifyDonorPhoneLocal(APPR_PHONE);
    assert.strictEqual(checkRes.valid, true);
    assert.strictEqual(checkRes.user.nombre.includes('Fernando Restrepo'), true);
    assert.strictEqual(Boolean(checkRes.trustToken), true);

    // 4. Depósito de documento marcando "Recordar este dispositivo"
    const uploadRes = uploadBuzonFileLocal({
      fileName: 'Artroplastia_Total_Cadera.pdf',
      donorPhone: APPR_PHONE,
      trustDevice: true
    });
    assert.strictEqual(uploadRes.success, true);
    assert.strictEqual(uploadRes.fileName, 'Artroplastia_Total_Cadera.pdf');
    assert.strictEqual(uploadRes.donorRecord.includes('Fernando Restrepo'), true);
    assert.strictEqual(uploadRes.donorRecord.includes(APPR_PHONE), true);
    assert.strictEqual(uploadRes.donorRecord.includes('(Buzón Verificado WhatsApp)'), true);
    assert.strictEqual(Boolean(uploadRes.trustToken), true);
  });

  // JORNADA 32: Conexión Futura - Dispositivo de Confianza Reconocido sin Pedir Teléfono
  await runAsyncTest('Jornada 32: Dispositivo de confianza reanuda sesión con token -> Reconocimiento automático y depósito inmediato', async () => {
    const TRUSTED_PHONE = `+57319${Date.now().toString().slice(-7)}`;
    // Registro y aprobación previa
    await processIncomingWhatsAppMessage({
      fromPhone: TRUSTED_PHONE,
      senderName: 'Dra. Valentina Gómez',
      messageText: 'Valentina Gómez, valentina@univalle.edu.co, Hospital Universitario, Fellow'
    });
    await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: `APROBAR ${TRUSTED_PHONE}`
    });

    // Emisión del token de confianza (1 año)
    const token = signTrustTokenLocal(TRUSTED_PHONE);
    assert.strictEqual(typeof token, 'string');
    assert.strictEqual(token.includes('.'), true);

    // Validación del token por el servidor en la próxima visita
    const tokenCheck = validateTrustTokenLocal(token);
    assert.strictEqual(tokenCheck.valid, true);
    assert.strictEqual(tokenCheck.user.nombre.includes('Valentina Gómez'), true);
    assert.strictEqual(tokenCheck.payload.type, 'TRUSTED_DEVICE');

    // Carga de archivo desde dispositivo previamente verificado
    const uploadRes = uploadBuzonFileLocal({
      fileName: 'Guia_Manejo_Osteomielitis.pdf',
      donorInfo: `${tokenCheck.user.nombre} | ${tokenCheck.user.hospital} (Verificado por WhatsApp)`
    });
    assert.strictEqual(uploadRes.success, true);
    assert.strictEqual(uploadRes.donorRecord.includes('Valentina Gómez'), true);
    assert.strictEqual(uploadRes.donorRecord.includes('(Verificado por WhatsApp)'), true);

    // Prueba de seguridad: Token con firma adulterada es rechazado de inmediato
    const tamperedToken = token.slice(0, -6) + 'XXXXXX';
    const badTokenCheck = validateTrustTokenLocal(tamperedToken);
    assert.strictEqual(badTokenCheck.valid, false);
    assert.strictEqual(badTokenCheck.error.includes('Firma de autenticidad inválida'), true);
  });

  // JORNADA 33: Invitaciones Transaccionales Desacopladas (Resend Plug & Play 1-a-1)
  await runAsyncTest('Jornada 33: Gestor envía INVITAR CORREO -> Modo Plug & Play y Despacho Atómico 1-a-1', async () => {
    const TEST_EMAIL_1 = 'iran.tranii@gmail.com';
    const TEST_EMAIL_2 = 'colega.trauma@hospital.org';

    // 1. Caso A: Sin API Key de Resend (Modo Plug & Play)
    delete process.env.RESEND_API_KEY;
    delete global.MOCK_RESEND_KEY;

    const plugPlayRes = await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: `INVITAR CORREO: ${TEST_EMAIL_1}, ${TEST_EMAIL_2}`
    });

    assert.strictEqual(plugPlayRes.recipientPhone, ADMIN_PHONE);
    assert.strictEqual(plugPlayRes.plugAndPlayReady, true);
    assert.strictEqual(plugPlayRes.detectedEmails.length, 2);
    assert.strictEqual(plugPlayRes.detectedEmails.includes(TEST_EMAIL_1), true);
    assert.strictEqual(plugPlayRes.detectedEmails.includes(TEST_EMAIL_2), true);
    assert.strictEqual(plugPlayRes.replyText.includes('PLUG & PLAY'), true);
    assert.strictEqual(plugPlayRes.replyText.includes('RESEND_API_KEY'), true);

    // 2. Caso B: Con API Key de Resend configurada -> Despacho Atómico 1-a-1
    global.MOCK_RESEND_KEY = 're_test_mock_123456789';

    const dispatchRes = await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: `INVITAR CORREO: ${TEST_EMAIL_1}, ${TEST_EMAIL_2}`
    });

    assert.strictEqual(dispatchRes.recipientPhone, ADMIN_PHONE);
    assert.strictEqual(dispatchRes.replyText.includes('REPORTE DE INVITACIONES TRANSACCIONALES (1-a-1)'), true);
    assert.strictEqual(dispatchRes.replyText.includes('Despachos Exitosos:* 2'), true);
    assert.strictEqual(dispatchRes.dispatches.length, 2);

    // Verificación de aislamiento estricto (1 a 1): Cada correo fue a un único destinatario
    const dispatch1 = dispatchRes.dispatches[0];
    const dispatch2 = dispatchRes.dispatches[1];

    assert.strictEqual(dispatch1.email, TEST_EMAIL_1);
    assert.strictEqual(dispatch1.payload.to.length, 1);
    assert.strictEqual(dispatch1.payload.to[0], TEST_EMAIL_1);
    assert.strictEqual(dispatch1.payload.html.includes(TEST_EMAIL_1), true);
    // CERO fuga: El primer correo NO contiene la dirección del segundo
    assert.strictEqual(dispatch1.payload.html.includes(TEST_EMAIL_2), false);

    assert.strictEqual(dispatch2.email, TEST_EMAIL_2);
    assert.strictEqual(dispatch2.payload.to.length, 1);
    assert.strictEqual(dispatch2.payload.to[0], TEST_EMAIL_2);
    assert.strictEqual(dispatch2.payload.html.includes(TEST_EMAIL_2), true);
    // CERO fuga: El segundo correo NO contiene la dirección del primero
    assert.strictEqual(dispatch2.payload.html.includes(TEST_EMAIL_1), false);

    // Verificación de contenido institucional (WhatsApp + Cloudflare + Portafolio)
    assert.strictEqual(dispatch1.payload.html.includes('https://wa.me/573205955993'), true);
    assert.strictEqual(dispatch1.payload.html.includes('https://biblioteca-medica.ortopedia.workers.dev/'), true);
    assert.strictEqual(dispatch1.payload.html.includes('Portafolio Clínico Ampliado'), true);
    assert.strictEqual(dispatch1.payload.html.includes('Directrices de Uso y Convivencia'), true);

    // 3. Caso C: Usuario común intenta usar INVITAR CORREO -> No tiene privilegios de envío
    const unauthorizedRes = await processIncomingWhatsAppMessage({
      fromPhone: '+573151112233',
      senderName: 'Dr. Usuario Regular',
      messageText: `INVITAR CORREO: sospechoso@externo.com`
    });
    assert.strictEqual(Boolean(unauthorizedRes.dispatches), false);
    assert.strictEqual(unauthorizedRes.recipientPhone, '+573151112233');

    delete global.MOCK_RESEND_KEY;
  });

  // =========================================================================
  // JORNADAS DE SUPERPODERES CLÍNICOS Y GOBERNANZA AVANZADA
  // =========================================================================

  // Jornada 34: Superpoder 1: Calculadora Quirúrgica y Scores Clínicos (MESS y Gustilo)
  await runAsyncTest('Jornada 34: Superpoder 1: Calculadora de Scores Quirúrgicos con enlaces directos verificados', async () => {
    // 1. Consulta guiada de MESS
    const resGuide = await processIncomingWhatsAppMessage({
      fromPhone: TEST_RESIDENT_PHONE,
      senderName: 'Dr. Mateo Valencia',
      messageText: 'SCORE: MESS'
    });
    assert.strictEqual(resGuide.replyText.includes('MESS (Mangled Extremity Severity Score)'), true);
    assert.strictEqual(resGuide.replyText.includes('Johansen et al. J Trauma 1990'), true);
    assert.strictEqual(resGuide.replyText.includes('https://biblioteca-medica.ortopedia.workers.dev/r/pm_2342140'), true);

    // 2. Cálculo de MESS = 7 (Amputación primaria predicha)
    const resCalc = await processIncomingWhatsAppMessage({
      fromPhone: TEST_RESIDENT_PHONE,
      senderName: 'Dr. Mateo Valencia',
      messageText: 'CALCULAR MESS: 3 2 1 1'
    });
    assert.strictEqual(resCalc.replyText.includes('Puntaje Total:* *7 PUNTOS*'), true);
    assert.strictEqual(resCalc.replyText.includes('AMPUTACIÓN PRIMARIA'), true);

    // 3. Consulta de Gustilo-Anderson y protocolo antimicrobiano
    const resGustilo = await processIncomingWhatsAppMessage({
      fromPhone: TEST_RESIDENT_PHONE,
      senderName: 'Dr. Mateo Valencia',
      messageText: 'SCORE: GUSTILO'
    });
    assert.strictEqual(resGustilo.replyText.includes('Clasificación de Gustilo-Anderson'), true);
    assert.strictEqual(resGustilo.replyText.includes('Cefazolina 2g IV'), true);
    assert.strictEqual(resGustilo.replyText.includes('https://biblioteca-medica.ortopedia.workers.dev/r/pm_773941'), true);
  });

  // Jornada 35: Superpoder 2: Copiloto Pre-Operatorio (Briefing Quirúrgico de la Noche Anterior)
  await runAsyncTest('Jornada 35: Superpoder 2: Copiloto Pre-Operatorio con distinción DUAL Repositorio vs Web', async () => {
    const resPreop = await processIncomingWhatsAppMessage({
      fromPhone: TEST_RESIDENT_PHONE,
      senderName: 'Dr. Mateo Valencia',
      messageText: 'CASO: Clavo trocanterico'
    });
    assert.strictEqual(resPreop.replyText.includes('BRIEFING QUIRÚRGICO PRE-OPERATORIO'), true);
    assert.strictEqual(resPreop.replyText.includes('Posicionamiento del Paciente'), true);
    assert.strictEqual(resPreop.replyText.includes('Fluoroscopía y Arco en C'), true);
    assert.strictEqual(resPreop.replyText.includes('Riesgo Anatómico:* Nervio glúteo superior'), true);
    assert.strictEqual(resPreop.replyText.includes('TAD (Tip-Apex Distance) menor a 20 mm'), true);

    // Verificación de la distinción DUAL explícita
    assert.strictEqual(resPreop.replyText.includes('1. DOCUMENTOS EN EL REPOSITORIO DE LA BIBLIOTECA'), true);
    assert.strictEqual(resPreop.replyText.includes('https://biblioteca-medica.ortopedia.workers.dev/r/d_'), true);
    assert.strictEqual(resPreop.replyText.includes('2. DOCUMENTOS Y GUÍAS CONSULTADAS EN LA WEB ACADÉMICA'), true);
    assert.strictEqual(resPreop.replyText.includes('https://biblioteca-medica.ortopedia.workers.dev/r/pm_7790785'), true);
    assert.strictEqual(resPreop.replyText.includes('https://biblioteca-medica.ortopedia.workers.dev/r/ao_31-a'), true);
  });

  // Jornada 36: Superpoder 3: Ficha Técnica Rápida de Implantes e Instrumentación
  await runAsyncTest('Jornada 36: Superpoder 3: Ficha de Implantes con sustento oficial de fabricante/AO', async () => {
    // 1. Placa PHILOS
    const resPhilos = await processIncomingWhatsAppMessage({
      fromPhone: TEST_RESIDENT_PHONE,
      senderName: 'Dr. Mateo Valencia',
      messageText: 'IMPLANTE: Placa PHILOS'
    });
    assert.strictEqual(resPhilos.replyText.includes('FICHA TÉCNICA DE INSTRUMENTACIÓN OFICIAL'), true);
    assert.strictEqual(resPhilos.replyText.includes('PHILOS'), true);
    assert.strictEqual(resPhilos.replyText.includes('Broca calibrada 2.8 mm'), true);
    assert.strictEqual(resPhilos.replyText.includes('Stardrive T15'), true);
    assert.strictEqual(resPhilos.replyText.includes('DePuy Synthes Trauma - PHILOS Surgical Technique Guide'), true);
    assert.strictEqual(resPhilos.replyText.includes('https://biblioteca-medica.ortopedia.workers.dev/r/pm_18171958'), true);

    // 2. Tornillo 3.5 Cortical
    const resTornillo = await processIncomingWhatsAppMessage({
      fromPhone: TEST_RESIDENT_PHONE,
      senderName: 'Dr. Mateo Valencia',
      messageText: 'IMPLANTE: Tornillo 3.5'
    });
    assert.strictEqual(resTornillo.replyText.includes('Broca de 2.5 mm'), true);
    assert.strictEqual(resTornillo.replyText.includes('Macho de 3.5 mm'), true);
    assert.strictEqual(resTornillo.replyText.includes('Small Fragment System Technical Guide'), true);
  });

  // Jornada 37: Superpoder 4: Interconsulta de Urgencias Estructurada (ATLS/AO y SOAP)
  await runAsyncTest('Jornada 37: Superpoder 4: Interconsulta con personalización de esquema y datos faltantes', async () => {
    // 1. Esquema ATLS/AO con datos faltantes detectados proactivamente
    const resConsult = await processIncomingWhatsAppMessage({
      fromPhone: TEST_RESIDENT_PHONE,
      senderName: 'Dr. Mateo Valencia',
      messageText: 'INTERCONSULTA: Paciente masculino de 32 años, caída en motocicleta, deformidad y dolor en tobillo izquierdo con herida de 2 cm'
    });
    assert.strictEqual(resConsult.replyText.includes('FICHA DE INTERCONSULTA Y URGENCIAS (ESTÁNDAR ATLS / AO)'), true);
    assert.strictEqual(resConsult.replyText.includes('Fractura Maleolar de Tobillo'), true);
    assert.strictEqual(resConsult.replyText.includes('DATOS CRÍTICOS PENDIENTES POR INTERROGAR O EVALUAR'), true);
    assert.strictEqual(resConsult.replyText.includes('Estado Vascular Distal'), true);
    assert.strictEqual(resConsult.replyText.includes('Vigilancia de Síndrome Compartimental'), true);
    assert.strictEqual(resConsult.replyText.includes('https://biblioteca-medica.ortopedia.workers.dev/r/pm_24872288'), true);

    // 2. Personalización a Esquema SOAP
    const resSoap = await processIncomingWhatsAppMessage({
      fromPhone: TEST_RESIDENT_PHONE,
      senderName: 'Dr. Mateo Valencia',
      messageText: 'ESQUEMA: SOAP Paciente femenino de 78 años, caída en domicilio con dolor e impotencia en cadera derecha'
    });
    assert.strictEqual(resSoap.replyText.includes('ESQUEMA: SOAP (Subjetivo - Objetivo - Análisis - Plan)'), true);
    assert.strictEqual(resSoap.replyText.includes('Fractura de Fémur Proximal'), true);
  });

  // Jornada 38: Superpoder 5: Agente Rastreador Open Access y Circuito de Adquisición
  await runAsyncTest('Jornada 38: Superpoder 5: Open Access y Circuito de Solicitud/Adquisición de Literatura', async () => {
    // 1. Búsqueda de literatura externa (despliega Open Access y Paywalled con opciones)
    const resSearch = await processIncomingWhatsAppMessage({
      fromPhone: TEST_RESIDENT_PHONE,
      senderName: 'Dr. Mateo Valencia',
      messageText: 'BUSCAR_WEB: fractura de pelvis'
    });
    assert.strictEqual(resSearch.replyText.includes('LITERATURA CIENTÍFICA GLOBAL'), true);
    assert.strictEqual(resSearch.replyText.includes('LITERATURA OPEN ACCESS DISPONIBLE'), true);
    assert.strictEqual(resSearch.replyText.includes('ARTÍCULOS CON ACCESO DE PAGO / SUSCRIPCIÓN'), true);
    assert.strictEqual(resSearch.replyText.includes('SOLICITAR: PAY_PELVIS_2024'), true);
    assert.strictEqual(resSearch.replyText.includes('DESCARTAR: PAY_PELVIS_2024'), true);

    // 2. Usuario solicita artículo de pago con SOLICITAR: PAY_PELVIS_2024
    const resReq = await processIncomingWhatsAppMessage({
      fromPhone: TEST_RESIDENT_PHONE,
      senderName: 'Dr. Mateo Valencia',
      messageText: 'SOLICITAR: PAY_PELVIS_2024'
    });
    assert.strictEqual(resReq.replyText.includes('SOLICITUD DE ADQUISICIÓN REGISTRADA'), true);
    assert.strictEqual(resReq.replyText.includes('PAY_PELVIS_2024'), true);
    assert.strictEqual(resReq.alertToGerente.phone, ADMIN_PHONE);
    assert.strictEqual(resReq.alertToGerente.message.includes('NUEVA SOLICITUD DE ARTÍCULO EXTERNO REGISTRADA'), true);
    assert.strictEqual(resReq.alertToGerente.message.includes('ADQUIRIDO: PAY_PELVIS_2024'), true);

    // 3. Gestor de Contenido incorpora el documento y responde ADQUIRIDO: PAY_PELVIS_2024
    const resFulfill = await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: 'ADQUIRIDO: PAY_PELVIS_2024'
    });
    assert.strictEqual(resFulfill.replyText.includes('DOCUMENTO ENTREGADO AUTOMÁTICAMENTE'), true);
    assert.strictEqual(resFulfill.replyText.includes(TEST_RESIDENT_PHONE), true);
    assert.strictEqual(resFulfill.notifyUsersList.length, 1);
    assert.strictEqual(resFulfill.notifyUsersList[0].phone, TEST_RESIDENT_PHONE);
    assert.strictEqual(resFulfill.notifyUsersList[0].message.includes('¡SU ARTÍCULO SOLICITADO YA ESTÁ DISPONIBLE!'), true);
    assert.strictEqual(resFulfill.notifyUsersList[0].message.includes('https://biblioteca-medica.ortopedia.workers.dev/r/d_PAY_PELVIS_2024'), true);
  });

  // Jornada 39: Acción Adicional: Consolidado Diario de Aportes a las 18:00
  await runAsyncTest('Jornada 39: Acción Adicional: Consolidado Diario de Aportes a las 18:00 sin spam inmediato', async () => {
    const { registrarAporteDiario, generarInformeDiarioAportes18h } = require('./whatsapp_conversational_engine.cjs');
    
    // Simulación de dos aportes recibidos en el día
    registrarAporteDiario({ phone: '+573001234567', name: 'Dr. Santiago Morales', fileName: 'Campbell_Tomo_4.pdf', size: '42 MB' });
    registrarAporteDiario({ phone: '+573205559999', name: 'Dra. Paola Rodrigo', fileName: 'Luo_Tibial_Plateau_2024.pdf', size: '15 MB' });

    // Gestor consulta el consolidado de aportes
    const resDigest = await processIncomingWhatsAppMessage({
      fromPhone: ADMIN_PHONE,
      senderName: 'Gestor de Contenido',
      messageText: 'CONSOLIDADO_APORTES'
    });
    assert.strictEqual(resDigest.replyText.includes('CONSOLIDADO DIARIO DE APORTES (18:00)'), true);
    assert.strictEqual(resDigest.replyText.includes('Dr. Santiago Morales (+573001234567)'), true);
    assert.strictEqual(resDigest.replyText.includes('Campbell_Tomo_4.pdf'), true);
    assert.strictEqual(resDigest.replyText.includes('Dra. Paola Rodrigo (+573205559999)'), true);
    assert.strictEqual(resDigest.replyText.includes('Luo_Tibial_Plateau_2024.pdf'), true);
  });

  console.log('\n================================================================');
  console.log(`📊 RESULTADOS FINALES: ${passed} / ${total} PRUEBAS EXITOSAS (${Math.round((passed/total)*100)}%)`);
  console.log('================================================================\n');

  if (passed === total) process.exit(0);
  else process.exit(1);
}

startSuite();
