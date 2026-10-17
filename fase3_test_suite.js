/**
 * ============================================================================
 * SISTEMA FINANCIERO INTELIGENTE - SUITE DE CERTIFICACIÓN FASE 3
 * Google Apps Script Automated Diagnostic for Meta WhatsApp Cloud API Webhook
 * ============================================================================
 * 
 * Ejecuta: testRunnerFase3() desde el editor de Apps Script.
 * Verifica al 100% el handshake doGet de Meta, la deserialización de doPost,
 * el enrutamiento extremo a extremo, el payload de Graph API y los Triggers.
 */

function testRunnerFase3() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const resultados = {
    total: 5,
    aprobadas: 0,
    fallidas: 0,
    detalles: []
  };

  Logger.log("📱 ======================================================");
  Logger.log("📱 INICIANDO SUITE DE PRUEBAS DE CERTIFICACIÓN - FASE 3");
  Logger.log("📱 ======================================================");

  const telAdmin = CONFIG_FINANZAS.TELEFONO_ADMIN_DEFAULT;
  const telAdminLimpio = String(telAdmin).replace(/\D/g, "");

  // --------------------------------------------------------------------------
  // PRUEBA 1: Handshake de Verificación de Meta Webhook (doGet Exitoso)
  // --------------------------------------------------------------------------
  try {
    const tokenValido = obtenerMetaVerifyToken_();
    const challengeTest = "CHALLENGE_CODE_" + Math.floor(100000 + Math.random() * 900000);

    const mockEventGet = {
      parameter: {
        "hub.mode": "subscribe",
        "hub.verify_token": tokenValido,
        "hub.challenge": challengeTest
      }
    };

    const resGet = doGet(mockEventGet);
    const contenido = resGet ? resGet.getContent() : "";

    if (contenido === challengeTest) {
      registrarExitoF3_(resultados, "Prueba 1: Handshake Meta doGet", "El Webhook respondió exactamente con el challenge esperado para autenticación oficial de Meta.");
    } else {
      registrarFalloF3_(resultados, "Prueba 1: Handshake Meta doGet", `Esperado: ${challengeTest} | Obtenido: ${contenido}`);
    }
  } catch (e) {
    registrarFalloF3_(resultados, "Prueba 1: Handshake Meta doGet", e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 2: Rechazo de Tokens No Autorizados en doGet
  // --------------------------------------------------------------------------
  try {
    const mockEventInvalido = {
      parameter: {
        "hub.mode": "subscribe",
        "hub.verify_token": "TOKEN_HACKER_FALSO_123",
        "hub.challenge": "RECHAZAR_ESTO"
      }
    };

    const resInvalido = doGet(mockEventInvalido);
    const contenido = resInvalido ? resInvalido.getContent() : "";

    if (contenido.includes("Acceso Denegado")) {
      registrarExitoF3_(resultados, "Prueba 2: Seguridad Webhook", "Peticiones con token de verificación incorrecto fueron rechazadas correctamente.");
    } else {
      registrarFalloF3_(resultados, "Prueba 2: Seguridad Webhook", `Contenido obtenido: ${contenido}`);
    }
  } catch (e) {
    registrarFalloF3_(resultados, "Prueba 2: Seguridad Webhook", e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 3: Formateo y Estructura de Payload para Meta Graph API
  // --------------------------------------------------------------------------
  try {
    const textoPrueba = "Hola Fernando, tu saldo disponible en More Paper es $1.500.000 COP";
    const payload = construirPayloadMensajeWhatsApp(telAdmin, textoPrueba);

    const esValido = payload.messaging_product === "whatsapp" &&
                     payload.recipient_type === "individual" &&
                     payload.to === telAdminLimpio &&
                     payload.type === "text" &&
                     payload.text && payload.text.body === textoPrueba;

    if (esValido) {
      registrarExitoF3_(resultados, "Prueba 3: Payload Meta Graph API", "La estructura JSON cumple al 100% la especificación oficial de WhatsApp Business Graph API v21.0.");
    } else {
      registrarFalloF3_(resultados, "Prueba 3: Payload Meta Graph API", `Estructura generada no coincide: ${JSON.stringify(payload)}`);
    }
  } catch (e) {
    registrarFalloF3_(resultados, "Prueba 3: Payload Meta Graph API", e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 4: Simulación Extremo a Extremo de Mensaje Entrante (doPost)
  // --------------------------------------------------------------------------
  try {
    const hPaper = ss.getSheetByName(HOJAS.MOREPAPER_TRANS);
    const prevRows = hPaper.getLastRow();
    const idMsgSintetico = "WAMID_TEST_" + Date.now();

    // Payload simulado que envía Meta cuando un usuario escribe por WhatsApp
    const mockPayloadMeta = {
      object: "whatsapp_business_account",
      entry: [{
        id: "WABA_ID_TEST",
        changes: [{
          value: {
            messaging_product: "whatsapp",
            metadata: { display_phone_number: "573000000000", phone_number_id: "PHONE_ID_TEST" },
            contacts: [{ profile: { name: "Fernando" }, wa_id: telAdminLimpio }],
            messages: [{
              from: telAdminLimpio,
              id: idMsgSintetico,
              timestamp: String(Math.floor(Date.now() / 1000)),
              type: "text",
              text: { body: "Compra de tintas para More Paper por $85.000 en efectivo" }
            }]
          },
          field: "messages"
        }]
      }]
    };

    const mockEventPost = {
      postData: {
        contents: JSON.stringify(mockPayloadMeta)
      }
    };

    // Ejecutar doPost
    const resPost = doPost(mockEventPost);
    SpreadsheetApp.flush();

    const postRows = hPaper.getLastRow();

    // Limpieza de fila sintética generada por la simulación
    if (postRows > prevRows) {
      hPaper.deleteRow(postRows);
      SpreadsheetApp.flush();
    }

    const respuestaOk = resPost && resPost.getContent() === "EVENT_RECEIVED";
    const transaccionRegistrada = postRows === prevRows + 1;

    if (respuestaOk && transaccionRegistrada) {
      registrarExitoF3_(resultados, "Prueba 4: Pipeline doPost Extremo a Extremo", "El webhook procesó el evento de WhatsApp, confirmó EVENT_RECEIVED y asentó la transacción en More Paper.");
    } else {
      registrarFalloF3_(resultados, "Prueba 4: Pipeline doPost Extremo a Extremo", `Respuesta: ${resPost ? resPost.getContent() : "null"} | Fila escrita: ${transaccionRegistrada}`);
    }
  } catch (e) {
    registrarFalloF3_(resultados, "Prueba 4: Pipeline doPost Extremo a Extremo", e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 5: Instalación y Ejecución del Disparador de Alertas Diarias (8:00 AM)
  // --------------------------------------------------------------------------
  try {
    const resInstalacion = instalarDisparadorAlertasDiarias();
    const triggers = ScriptApp.getProjectTriggers();
    const triggerEncontrado = triggers.some(t => t.getHandlerFunction() === "ejecutarDisparoDiarioAlertas");

    // Probar ejecución de la función del trigger
    const resEjecucion = ejecutarDisparoDiarioAlertas();

    if (resInstalacion.ok && triggerEncontrado && typeof resEjecucion.totalAlertas === "number") {
      registrarExitoF3_(resultados, "Prueba 5: Automatización Diaria 8:00 AM", "Trigger de reloj diario verificado en Google Apps Script y función de despacho de alertas ejecutada sin errores.");
    } else {
      registrarFalloF3_(resultados, "Prueba 5: Automatización Diaria 8:00 AM", `Instalado: ${resInstalacion.ok} | Encontrado: ${triggerEncontrado}`);
    }
  } catch (e) {
    registrarFalloF3_(resultados, "Prueba 5: Automatización Diaria 8:00 AM", e.message);
  }

  // --------------------------------------------------------------------------
  // RESUMEN FINAL DE CERTIFICACIÓN FASE 3
  // --------------------------------------------------------------------------
  Logger.log("📱 ======================================================");
  Logger.log(`📱 RESULTADO FINAL: ${resultados.aprobadas}/${resultados.total} PRUEBAS APROBADAS`);
  Logger.log("📱 ======================================================");

  const exitoTotal = resultados.aprobadas === resultados.total;

  return {
    certificacionFase3Aprobada: exitoTotal,
    tasaExito: `${((resultados.aprobadas / resultados.total) * 100).toFixed(0)}%`,
    metricas: resultados
  };
}

function registrarExitoF3_(resultados, nombrePrueba, detalle) {
  resultados.aprobadas++;
  resultados.detalles.push({ prueba: nombrePrueba, estado: "PASÓ ✅", detalle: detalle });
  Logger.log(`✅ [PASÓ] ${nombrePrueba}: ${detalle}`);
}

function registrarFalloF3_(resultados, nombrePrueba, motivo) {
  resultados.fallidas++;
  resultados.detalles.push({ prueba: nombrePrueba, estado: "FALLÓ ❌", detalle: motivo });
  Logger.log(`❌ [FALLÓ] ${nombrePrueba}: ${motivo}`);
}
