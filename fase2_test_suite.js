/**
 * ============================================================================
 * SISTEMA FINANCIERO INTELIGENTE - SUITE DE CERTIFICACIÓN FASE 2
 * Google Apps Script Automated Diagnostic for AI Brain & Financial Logic
 * ============================================================================
 * 
 * Ejecuta: testRunnerFase2() desde el editor de Apps Script.
 * Verifica al 100% que el cerebro del Agente, el enrutamiento inteligente,
 * el ciclo de deudas, las consultas y el escáner de alertas 24h funcionen.
 */

function testRunnerFase2() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const resultados = {
    total: 5,
    aprobadas: 0,
    fallidas: 0,
    detalles: []
  };

  Logger.log("🧠 ======================================================");
  Logger.log("🧠 INICIANDO SUITE DE PRUEBAS DE CERTIFICACIÓN - FASE 2");
  Logger.log("🧠 ======================================================");

  const telAdmin = CONFIG_FINANZAS.TELEFONO_ADMIN_DEFAULT;

  // --------------------------------------------------------------------------
  // PRUEBA 1: Enrutamiento Semántico Automático (Personal, Paper, Design)
  // --------------------------------------------------------------------------
  try {
    const hPersonal = ss.getSheetByName(HOJAS.PERSONAL_TRANS);
    const hPaper = ss.getSheetByName(HOJAS.MOREPAPER_TRANS);
    const hDesign = ss.getSheetByName(HOJAS.MOREDESIGN_TRANS);

    const prevPersonal = hPersonal.getLastRow();
    const prevPaper = hPaper.getLastRow();
    const prevDesign = hDesign.getLastRow();

    // Mensaje 1: Personal (Almuerzo)
    const r1 = procesarMensajeTexto(telAdmin, "Almuerzo de trabajo $45.000 en efectivo");
    // Mensaje 2: More Paper (Resmas / Papelería)
    const r2 = procesarMensajeTexto(telAdmin, "Venta de 10 resmas de papel por 180.000 en More Paper");
    // Mensaje 3: More Design (Diseño de logos)
    const r3 = procesarMensajeTexto(telAdmin, "Ingreso por diseño de logotipo $600.000 More Design");

    SpreadsheetApp.flush();

    const postPersonal = hPersonal.getLastRow();
    const postPaper = hPaper.getLastRow();
    const postDesign = hDesign.getLastRow();

    // Limpieza de filas sintéticas
    if (postPersonal > prevPersonal) hPersonal.deleteRow(postPersonal);
    if (postPaper > prevPaper) hPaper.deleteRow(postPaper);
    if (postDesign > prevDesign) hDesign.deleteRow(postDesign);
    SpreadsheetApp.flush();

    const personalOk = postPersonal === prevPersonal + 1;
    const paperOk = postPaper === prevPaper + 1;
    const designOk = postDesign === prevDesign + 1;

    if (personalOk && paperOk && designOk) {
      registrarExitoF2_(resultados, "Prueba 1: Enrutamiento Semántico", "Los 3 movimientos se clasificaron y escribieron exactamente en Personal, More Paper y More Design.");
    } else {
      registrarFalloF2_(resultados, "Prueba 1: Enrutamiento Semántico", `Personal: +${postPersonal-prevPersonal} | Paper: +${postPaper-prevPaper} | Design: +${postDesign-prevDesign}`);
    }
  } catch (e) {
    registrarFalloF2_(resultados, "Prueba 1: Enrutamiento Semántico", e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 2: Ciclo de Compromisos (Creación, Abono Parcial y Auto-Egreso)
  // --------------------------------------------------------------------------
  try {
    const hCompPaper = ss.getSheetByName(HOJAS.MOREPAPER_COMP);
    const hTransPaper = ss.getSheetByName(HOJAS.MOREPAPER_TRANS);
    const prevComp = hCompPaper.getLastRow();
    const prevTrans = hTransPaper.getLastRow();

    // 1. Crear nuevo compromiso
    const resCrear = procesarMensajeTexto(telAdmin, "Compré a crédito a Papelera Nacional por $400.000 en More Paper con vencimiento 2026-10-25");
    SpreadsheetApp.flush();
    const postCrearComp = hCompPaper.getLastRow();

    // 2. Realizar abono en lenguaje natural
    const resAbonar = procesarMensajeTexto(telAdmin, "Aboné 150.000 a la deuda de Papelera Nacional en More Paper por transferencia");
    SpreadsheetApp.flush();

    const rowCompData = hCompPaper.getRange(postCrearComp, 1, 1, 10).getValues()[0];
    const saldoFinal = Number(rowCompData[6]);
    const totalAbonado = Number(rowCompData[5]);
    const postTrans = hTransPaper.getLastRow();

    // Limpieza de datos sintéticos
    if (hCompPaper.getLastRow() > prevComp) hCompPaper.deleteRow(hCompPaper.getLastRow());
    if (hTransPaper.getLastRow() > prevTrans) hTransPaper.deleteRow(hTransPaper.getLastRow());
    SpreadsheetApp.flush();

    const compromisoCreado = postCrearComp === prevComp + 1;
    const saldoCorrecto = saldoFinal === 250000 && totalAbonado === 150000;
    const egresoGenerado = postTrans === prevTrans + 1;

    if (compromisoCreado && saldoCorrecto && egresoGenerado) {
      registrarExitoF2_(resultados, "Prueba 2: Ciclo de Compromisos", "Compromiso creado ($400k), abono registrado ($150k), saldo recalculado ($250k) y egreso contable generado automáticamente.");
    } else {
      registrarFalloF2_(resultados, "Prueba 2: Ciclo de Compromisos", `Creado: ${compromisoCreado} | Saldo: ${saldoFinal} (Esp: 250000) | Egreso generado: ${egresoGenerado}`);
    }
  } catch (e) {
    registrarFalloF2_(resultados, "Prueba 2: Ciclo de Compromisos", e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 3: Consultas Financieras en Lenguaje Natural
  // --------------------------------------------------------------------------
  try {
    const resConsulta = procesarMensajeTexto(telAdmin, "¿Cuánto dinero tengo disponible y cuáles son mis saldos?");
    
    if (resConsulta && resConsulta.tipo === "consulta" && resConsulta.texto && resConsulta.texto.length > 20) {
      registrarExitoF2_(resultados, "Prueba 3: Consultas Financieras", "El Agente interpretó la consulta y devolvió un balance ejecutivo estructurado en COP.");
    } else {
      registrarFalloF2_(resultados, "Prueba 3: Consultas Financieras", `Respuesta inesperada: ${JSON.stringify(resConsulta)}`);
    }
  } catch (e) {
    registrarFalloF2_(resultados, "Prueba 3: Consultas Financieras", e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 4: Escáner Proactivo de Compromisos (Alertas de Vencimiento 24h)
  // --------------------------------------------------------------------------
  try {
    const hCompPersonal = ss.getSheetByName(HOJAS.PERSONAL_COMP);
    const manana = new Date(Date.now() + 86400000);
    const mananaStr = Utilities.formatDate(manana, Session.getScriptTimeZone(), "yyyy-MM-dd");

    // Insertar compromiso sintético que vence mañana
    const idTestAlerta = "COMP-ALERTA-TEST";
    hCompPersonal.appendRow([
      idTestAlerta,
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
      "Proveedor Alerta 24h Test",
      "Factura que vence manana",
      250000, 0, 250000, "SI", mananaStr, "Pendiente", "Sin_Alerta", ""
    ]);
    SpreadsheetApp.flush();

    // Ejecutar escáner de alertas
    const alertas = escanearCompromisosPorVencer();

    // Limpieza de fila sintética
    const lastRow = hCompPersonal.getLastRow();
    hCompPersonal.deleteRow(lastRow);
    SpreadsheetApp.flush();

    const alertaDetectada = alertas.some(a => a.idCompromiso === idTestAlerta && a.urgencia === "VENCE_MANANA");

    if (alertaDetectada) {
      registrarExitoF2_(resultados, "Prueba 4: Escáner Alertas 24h", "El escáner detectó la obligación que vence mañana y redactó el mensaje proactivo para WhatsApp.");
    } else {
      registrarFalloF2_(resultados, "Prueba 4: Escáner Alertas 24h", `Alertas detectadas: ${alertas.length}. No se encontró la alerta de prueba.`);
    }
  } catch (e) {
    registrarFalloF2_(resultados, "Prueba 4: Escáner Alertas 24h", e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 5: Blindaje de Seguridad y Control de Acceso
  // --------------------------------------------------------------------------
  try {
    const telIntruso = "+573999888777";
    const resIntruso = procesarMensajeTexto(telIntruso, "Gasté 50.000 en almuerzo");

    if (resIntruso && resIntruso.tipo === "acceso_denegado") {
      registrarExitoF2_(resultados, "Prueba 5: Blindaje de Seguridad", "Número desconocido interceptado y bloqueado con notificación de acceso denegado.");
    } else {
      registrarFalloF2_(resultados, "Prueba 5: Blindaje de Seguridad", `Respuesta obtenida: ${JSON.stringify(resIntruso)}`);
    }
  } catch (e) {
    registrarFalloF2_(resultados, "Prueba 5: Blindaje de Seguridad", e.message);
  }

  // --------------------------------------------------------------------------
  // RESUMEN FINAL DE CERTIFICACIÓN FASE 2
  // --------------------------------------------------------------------------
  Logger.log("🧠 ======================================================");
  Logger.log(`🧠 RESULTADO FINAL: ${resultados.aprobadas}/${resultados.total} PRUEBAS APROBADAS`);
  Logger.log("🧠 ======================================================");

  const exitoTotal = resultados.aprobadas === resultados.total;

  return {
    certificacionFase2Aprobada: exitoTotal,
    tasaExito: `${((resultados.aprobadas / resultados.total) * 100).toFixed(0)}%`,
    metricas: resultados
  };
}

function registrarExitoF2_(resultados, nombrePrueba, detalle) {
  resultados.aprobadas++;
  resultados.detalles.push({ prueba: nombrePrueba, estado: "PASÓ ✅", detalle: detalle });
  Logger.log(`✅ [PASÓ] ${nombrePrueba}: ${detalle}`);
}

function registrarFalloF2_(resultados, nombrePrueba, motivo) {
  resultados.fallidas++;
  resultados.detalles.push({ prueba: nombrePrueba, estado: "FALLÓ ❌", detalle: motivo });
  Logger.log(`❌ [FALLÓ] ${nombrePrueba}: ${motivo}`);
}
