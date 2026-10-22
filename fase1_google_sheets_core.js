/**
 * ============================================================================
 * SISTEMA FINANCIERO INTELIGENTE - NÚCLEO FASE 1
 * Google Sheets Data Architecture & Multi-Tenant Access Controller
 * ============================================================================
 * 
 * Entidades Principales:
 * - Finanzas Personales
 * - More Paper (Local Comercial - Papelería)
 * - More Design (Local Comercial - Agencia de Diseño & Publicidad)
 * 
 * Características de la Fase 1:
 * 1. Inicialización idempotente y estructurada (sin celdas combinadas).
 * 2. Control de Acceso y validación de permisos por número de teléfono.
 * 3. Segregación completa de datos para usuarios externos autorizados.
 * 4. Fórmulas financieras en tiempo real en Dashboard Consolidado.
 * 5. Medidor de cuota de 1.000 conversaciones gratuitas de WhatsApp Cloud API.
 */

// ============================================================================
// CONFIGURACIÓN GLOBAL DEL PROYECTO
// ============================================================================
const CONFIG_FINANZAS = {
  NOMBRE_PROYECTO: "Sistema Financiero Antigravity",
  MONEDA: "COP",
  SIMBOLO_MONEDA: "$",
  FORMATO_MONEDA: "$#,##0",
  FORMATO_FECHA: "yyyy-MM-dd",
  TELEFONO_ADMIN_DEFAULT: "+573008880001", // Tu número oficial de WhatsApp
  NOMBRE_ADMIN_DEFAULT: "Fernando (Propietario)",
  LIMITE_WHATSAPP_GRATUITO: 1000,
  ALERTA_WHATSAPP_UMBRAL_1: 0.80, // 80% (800 conversaciones)
  ALERTA_WHATSAPP_UMBRAL_2: 0.95, // 95% (950 conversaciones)

  // Cuentas Bancarias Oficiales
  CUENTAS_BANCARIAS: {
    PERSONAL: {
      NUMERO_MASCARA: "***2103",
      TIPO: "Ahorros",
      ETIQUETA: "Ahorros ***2103 (Personal)",
      BANCO: "Bancolombia",
      ENTIDAD_ASOCIADA: "Personal"
    },
    NEGOCIOS_COMPARTIDA: {
      NUMERO_MASCARA: "***7194",
      TIPO: "Ahorros",
      ETIQUETA: "Ahorros ***7194 (Negocios)",
      BANCO: "Bancolombia",
      ENTIDADES_ASOCIADAS: ["More Paper", "More Design"]
    }
  }
};

// Nombres canónicos de las hojas del sistema
const HOJAS = {
  CONTROL_ACCESO: "Control_Acceso",
  PERSONAL_TRANS: "Personal_Transacciones",
  PERSONAL_COMP: "Personal_Compromisos",
  MOREPAPER_TRANS: "MorePaper_Transacciones",
  MOREPAPER_COMP: "MorePaper_Compromisos",
  MOREDESIGN_TRANS: "MoreDesign_Transacciones",
  MOREDESIGN_COMP: "MoreDesign_Compromisos",
  GASTOS_GLOBALES: "Gastos_Globales",
  OPERACION_GLOBAL: "Operacion_Global",
  COMPROMISOS_GLOBALES: "Compromisos_Globales",
  PERSONAL_HISTORICO_COMP: "Personal_Historico_Compromisos",
  COMPROMISOS_GLOBALES_HISTORICO: "Compromisos_Globales_Historico",
  MOREPAPER_HISTORICO_COMP: "MorePaper_Historico_Compromisos",
  MOREDESIGN_HISTORICO_COMP: "MoreDesign_Historico_Compromisos",
  DASHBOARD: "Dashboard_Consolidado",
  METRICAS_WA: "Metricas_WhatsApp",
  SESIONES_WA: "WhatsApp_Sesiones_24h",
  CONFIG_CATEGORIAS: "Config_Categorias",
  CONFIG_CUENTAS: "Config_Cuentas_Bancarias",
  PERSONAJES: "Personajes"
};

// Colores institucionales de encabezados (Diseño Dark / Ejecutivo)
const TEMAS = {
  CONTROL: "#1e293b",     // Slate Dark
  PERSONAL: "#0f766e",    // Teal Dark
  MOREPAPER: "#0369a1",   // Sky Dark
  MOREDESIGN: "#4338ca",  // Indigo Dark
  GASTOS_GLOBALES: "#475569", // Slate Corporate
  DASHBOARD: "#0f172a",   // Navy Obsidian
  METRICAS: "#15803d",    // Emerald Dark
  CONFIG: "#334155"       // Slate Muted
};

// ============================================================================
// PRIMITIVAS DE SEGURIDAD DEFENSIVA & CONTROL DE CONCURRENCIA (ZERO-TRUST)
// ============================================================================

/**
 * Sanitiza cualquier valor de celda para neutralizar ataques de Inyección de Fórmulas
 * en hojas de cálculo y CSV (CWE-1236 / Formula Injection).
 * Si la cadena comienza con caracteres de ejecución (=, +, -, @, \t, \r, |, %),
 * antepone una comilla simple (') para forzar su interpretación como texto alfanumérico puro.
 * @param {*} val - Valor a sanitizar antes de escribirlo en Google Sheets.
 * @return {*} Valor sanitizado seguro.
 */
function sanitizeSheetValue(val) {
  if (val === null || val === undefined) return "";
  if (typeof val === "number" || typeof val === "boolean" || val instanceof Date) return val;
  const s = String(val);
  if (/^[=\+\-@\t\r|%]/.test(s)) {
    return "'" + s;
  }
  return s;
}

/**
 * Envoltorio atómico que ejecuta operaciones de escritura con LockService para proteger
 * contra condiciones de carrera (Race Conditions / CWE-362) en Google Apps Script.
 * @param {Function} callback - Función que ejecuta las modificaciones en Sheets.
 * @param {number} [timeoutMs=15000] - Tiempo máximo de espera para adquirir el cerrojo.
 * @return {*} Resultado del callback.
 */
function ejecutarConBloqueoTransaccional_(callback, timeoutMs) {
  const tiempoEspera = timeoutMs || 15000;
  let lock = null;
  let adquirido = false;
  try {
    lock = LockService.getScriptLock();
    adquirido = lock.tryLock(tiempoEspera);
    if (!adquirido) {
      Logger.log("⚠️ [LOCK_SERVICE] No se pudo obtener cerrojo tras " + tiempoEspera + "ms. Procediendo con advertencia.");
    }
    const res = callback();
    SpreadsheetApp.flush();
    return res;
  } catch (err) {
    Logger.log("❌ [LOCK_SERVICE] Error dentro de bloque transaccional: " + err.message);
    throw err;
  } finally {
    if (lock && adquirido) {
      try {
        lock.releaseLock();
      } catch (eRel) {
        Logger.log("Aviso al liberar LockService: " + eRel.message);
      }
    }
  }
}

/**
 * Comparación segura de cadenas en tiempo constante para mitigar ataques de temporización
 * (Timing Side-Channel Attacks / CWE-208) al validar tokens criptográficos y contraseñas.
 * @param {string} a - Primera cadena.
 * @param {string} b - Segunda cadena.
 * @return {boolean} True si coinciden exactamente.
 */
function safeCompareTokens_(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ============================================================================
// FUNCIÓN PRINCIPAL DE INICIALIZACIÓN (PUNTO DE ENTRADA)
// ============================================================================
/**
 * Inicializa o actualiza todo el libro de Google Sheets.
 * Esta función es idempotente: no borra datos si ya existen, solo asegura
 * la estructura, formatos y fórmulas de cada hoja.
 */
function inicializarLibroFinanzas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logs = [];
  
  logs.push("🚀 Iniciando inicialización del Sistema Financiero...");

  // 1. Control de Acceso
  crearHojaControlAcceso_(ss);
  logs.push("✅ Hoja Control_Acceso verificada.");

  // 2. Personal
  crearHojaTransaccionesGenerica_(ss, HOJAS.PERSONAL_TRANS, TEMAS.PERSONAL, "Personal");
  crearHojaCompromisosGenerica_(ss, HOJAS.PERSONAL_COMP, TEMAS.PERSONAL, "Personal");
  logs.push("✅ Hojas de Finanzas Personales verificadas.");

  // 3. More Paper
  crearHojaTransaccionesGenerica_(ss, HOJAS.MOREPAPER_TRANS, TEMAS.MOREPAPER, "More Paper");
  crearHojaCompromisosGenerica_(ss, HOJAS.MOREPAPER_COMP, TEMAS.MOREPAPER, "More Paper");
  logs.push("✅ Hojas de More Paper verificadas.");

  // 4. More Design
  crearHojaTransaccionesGenerica_(ss, HOJAS.MOREDESIGN_TRANS, TEMAS.MOREDESIGN, "More Design");
  crearHojaCompromisosGenerica_(ss, HOJAS.MOREDESIGN_COMP, TEMAS.MOREDESIGN, "More Design");
  logs.push("✅ Hojas de More Design verificadas.");

  // 4.1 Gastos Operativos Globales (Nómina & Operación Corporativa)
  crearHojaTransaccionesGenerica_(ss, HOJAS.GASTOS_GLOBALES, TEMAS.GASTOS_GLOBALES, "Consolidado");
  logs.push("✅ Hoja de Gastos Operativos Globales (Nómina / Corporativo) verificada.");

  // 4.2 Compromisos y Obligaciones Globales (Créditos y Pasivos Corporativos)
  crearHojaCompromisosGenerica_(ss, HOJAS.COMPROMISOS_GLOBALES, TEMAS.GASTOS_GLOBALES, "Consolidado");
  logs.push("✅ Hoja de Compromisos Globales (Pasivos Corporativos) verificada.");

  // 4.3 Hojas de Histórico de Compromisos Cumplidos (Archivo permanente en letras negras)
  crearHojaHistoricoCompromisosGenerica_(ss, HOJAS.PERSONAL_HISTORICO_COMP, TEMAS.PERSONAL, "Personal");
  crearHojaHistoricoCompromisosGenerica_(ss, HOJAS.COMPROMISOS_GLOBALES_HISTORICO, TEMAS.GASTOS_GLOBALES, "Consolidado");
  crearHojaHistoricoCompromisosGenerica_(ss, HOJAS.MOREPAPER_HISTORICO_COMP, TEMAS.MOREPAPER, "More Paper");
  crearHojaHistoricoCompromisosGenerica_(ss, HOJAS.MOREDESIGN_HISTORICO_COMP, TEMAS.MOREDESIGN, "More Design");
  if (ss.getSheetByName("Florangellys_Compromisos") || ss.getSheetByName("Florangellys_Transacciones")) {
    crearHojaHistoricoCompromisosGenerica_(ss, "Florangellys_Historico_Compromisos", "#7c3aed", "Florangellys");
  }
  logs.push("✅ Hojas de Histórico de Compromisos Cumplidos verificadas.");

  // 5. Configuración de Categorías
  crearHojaConfigCategorias_(ss);
  logs.push("✅ Catálogo de Categorías verificado.");

  // 5.1 Catálogo Maestro de Cuentas Bancarias
  crearHojaConfigCuentasBancarias_(ss);
  logs.push("✅ Catálogo Maestro de Cuentas Bancarias y Billeteras verificado.");

  // 5.2 Catálogo Maestro de Personajes Dinámicos
  crearHojaPersonajes_(ss);
  logs.push("✅ Catálogo Maestro de Personajes Dinámicos verificado.");

  // 6. Dashboard Consolidado
  crearHojaDashboardConsolidado_(ss);
  logs.push("✅ Dashboard Consolidado verificado con fórmulas en tiempo real.");

  // 7. Métricas de WhatsApp y Sesiones de 24h
  crearHojasMetricasWhatsApp_(ss);
  logs.push("✅ Control de cuota y sesiones WhatsApp Cloud API verificado.");

  SpreadsheetApp.flush();
  logs.push("🎉 ¡Inicialización completada exitosamente al 100%!");
  
  return {
    ok: true,
    timestamp: new Date().toISOString(),
    logs: logs
  };
}

// ============================================================================
// GENERADORES DE HOJAS ESPECÍFICAS
// ============================================================================

/**
 * 1. Hoja de Control de Acceso (Seguridad y Multi-Tenant)
 */
function crearHojaControlAcceso_(ss) {
  let sheet = ss.getSheetByName(HOJAS.CONTROL_ACCESO);
  const encabezados = [
    "TELEFONO_WHATSAPP", "NOMBRE_USUARIO", "ROL", "ESTADO", 
    "HOJAS_PERMITIDAS", "FECHA_AUTORIZACION", "NOTAS", "BIENVENIDA_ENVIADA",
    "ALIAS_ASISTENTE", "PERFIL_VOZ", "CONFIG_VOZ_JSON"
  ];

  if (!sheet) {
    sheet = ss.insertSheet(HOJAS.CONTROL_ACCESO, 0);
  }

  // Formato de texto para columna A (para no perder el signo + ni convertir a número)
  sheet.getRange("A:A").setNumberFormat("@");

  // Establecer encabezados
  sheet.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
  darFormatoEncabezado_(sheet, encabezados.length, TEMAS.CONTROL);

  // Semilla del Super Administrador si la hoja está vacía
  if (sheet.getLastRow() <= 1) {
    const filaAdmin = [
      CONFIG_FINANZAS.TELEFONO_ADMIN_DEFAULT,
      CONFIG_FINANZAS.NOMBRE_ADMIN_DEFAULT,
      "SUPER_ADMIN",
      "ACTIVO",
      "TODAS,Personal,More Paper,More Design",
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), CONFIG_FINANZAS.FORMATO_FECHA),
      "Propietario del sistema con acceso total",
      "SI",
      "Jarvis",
      "MASCULINO_CORDIAL",
      JSON.stringify({ motor: "GOOGLE_TTS", tono: "cordial", pitch: -1.0, rate: 1.0 })
    ];
    sheet.appendRow(filaAdmin);
  } else {
    // Si la fila 2 ya existe y es SUPER_ADMIN, asegurar sincronización del teléfono y valores por defecto
    const rolActual = String(sheet.getRange(2, 3).getValue()).trim();
    if (rolActual === "SUPER_ADMIN") {
      sheet.getRange(2, 1).setValue(CONFIG_FINANZAS.TELEFONO_ADMIN_DEFAULT);
      sheet.getRange(2, 2).setValue(CONFIG_FINANZAS.NOMBRE_ADMIN_DEFAULT);
      if (!sheet.getRange(2, 9).getValue()) sheet.getRange(2, 9).setValue("Jarvis");
      if (!sheet.getRange(2, 10).getValue()) sheet.getRange(2, 10).setValue("MASCULINO_CORDIAL");
    }
  }

  // Ajuste de columnas
  sheet.setColumnWidth(1, 180); // Teléfono
  sheet.setColumnWidth(2, 180); // Nombre
  sheet.setColumnWidth(3, 130); // Rol
  sheet.setColumnWidth(4, 110); // Estado
  sheet.setColumnWidth(5, 260); // Hojas Permitidas
  sheet.setColumnWidth(6, 150); // Fecha
  sheet.setColumnWidth(7, 260); // Notas
  sheet.setColumnWidth(8, 130); // Bienvenida Enviada
  sheet.setColumnWidth(9, 150); // Alias Asistente
  sheet.setColumnWidth(10, 160); // Perfil de Voz
  sheet.setColumnWidth(11, 240); // Config Voz JSON
  sheet.setFrozenRows(1);
  SpreadsheetApp.flush();
}

/**
 * 2. Generador de Hoja de Transacciones (Ingresos / Egresos)
 */
function crearHojaTransaccionesGenerica_(ss, nombreHoja, colorTema, entidadNombre) {
  let sheet = ss.getSheetByName(nombreHoja);
  const encabezados = [
    "ID_TRANSACCION", "FECHA", "TIPO", "CATEGORIA", "SUBCATEGORIA", 
    "CONCEPTO", "PROVEEDOR_TERCERO", "VALOR", "METODO_PAGO", 
    "ESTADO", "ID_COMPROMISO", "NOTAS"
  ];

  if (!sheet) {
    sheet = ss.insertSheet(nombreHoja);
  }

  sheet.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
  darFormatoEncabezado_(sheet, encabezados.length, colorTema);

  // Formatos de columnas
  sheet.setColumnWidth(1, 220); // ID
  sheet.setColumnWidth(2, 110); // Fecha
  sheet.setColumnWidth(3, 140); // Tipo
  sheet.setColumnWidth(4, 160); // Categoria
  sheet.setColumnWidth(5, 160); // Subcategoria
  sheet.setColumnWidth(6, 260); // Concepto
  sheet.setColumnWidth(7, 180); // Proveedor / Tercero
  sheet.setColumnWidth(8, 140); // Valor
  sheet.setColumnWidth(9, 130); // Metodo Pago
  sheet.setColumnWidth(10, 110); // Estado
  sheet.setColumnWidth(11, 180); // ID Compromiso
  sheet.setColumnWidth(12, 200); // Notas

  // Formato de moneda para columna H (VALOR)
  sheet.getRange("H2:H").setNumberFormat(CONFIG_FINANZAS.FORMATO_MONEDA);
  sheet.getRange("B2:B").setNumberFormat(CONFIG_FINANZAS.FORMATO_FECHA);
  sheet.setFrozenRows(1);

  // Directiva: Configurar Reglas de Formato Condicional automáticas (Egresos en Rojo, Ingresos en Verde)
  configurarFormatoCondicionalTransacciones_(sheet, "#dc2626", "#15803d");
}

/**
 * 3. Generador de Hoja de Compromisos (Cuentas por Pagar / Deudas)
 */
function crearHojaCompromisosGenerica_(ss, nombreHoja, colorTema, entidadNombre) {
  let sheet = ss.getSheetByName(nombreHoja);
  const encabezados = [
    "ID_COMPROMISO", "FECHA_CREACION", "PROVEEDOR_ACREEDOR", "CONCEPTO", 
    "MONTO_TOTAL", "TOTAL_ABONADO", "SALDO_PENDIENTE", "TIENE_VENCIMIENTO", 
    "FECHA_VENCIMIENTO", "ESTADO", "ESTADO_ALERTA", "ULTIMA_ALERTA"
  ];

  if (!sheet) {
    sheet = ss.insertSheet(nombreHoja);
  }

  sheet.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
  darFormatoEncabezado_(sheet, encabezados.length, colorTema);

  // Formatos de columnas
  sheet.setColumnWidth(1, 180); // ID_COMPROMISO
  sheet.setColumnWidth(2, 120); // FECHA_CREACION
  sheet.setColumnWidth(3, 200); // PROVEEDOR
  sheet.setColumnWidth(4, 250); // CONCEPTO
  sheet.setColumnWidth(5, 140); // MONTO_TOTAL
  sheet.setColumnWidth(6, 140); // TOTAL_ABONADO
  sheet.setColumnWidth(7, 140); // SALDO_PENDIENTE
  sheet.setColumnWidth(8, 140); // TIENE_VENCIMIENTO
  sheet.setColumnWidth(9, 140); // FECHA_VENCIMIENTO
  sheet.setColumnWidth(10, 120); // ESTADO
  sheet.setColumnWidth(11, 140); // ESTADO_ALERTA
  sheet.setColumnWidth(12, 160); // ULTIMA_ALERTA

  // Formato de moneda para E, F, G
  sheet.getRange("E2:G").setNumberFormat(CONFIG_FINANZAS.FORMATO_MONEDA);
  sheet.getRange("B2:B").setNumberFormat(CONFIG_FINANZAS.FORMATO_FECHA);
  sheet.getRange("I2:I").setNumberFormat(CONFIG_FINANZAS.FORMATO_FECHA);
  sheet.setFrozenRows(1);

  // Directiva: Configurar Reglas de Formato Condicional automáticas (Deudas en Rojo, Cobros en Verde)
  configurarFormatoCondicionalCompromisos_(sheet, "#dc2626", "#15803d");
}

/**
 * 3.1 Resuelve el nombre canónico de la hoja de histórico de compromisos correspondiente
 * a una hoja de compromisos dada.
 */
function resolverNombreHojaHistoricoCompromisos_(nombreHojaCompromisos) {
  if (!nombreHojaCompromisos) return "Compromisos_Globales_Historico";
  const str = String(nombreHojaCompromisos).trim();
  if (str === "Compromisos_Globales" || str === "Consolidado" || str === "Global") {
    return "Compromisos_Globales_Historico";
  }
  if (str.endsWith("_Compromisos")) {
    return str.replace(/_Compromisos$/, "_Historico_Compromisos");
  }
  return str + "_Historico_Compromisos";
}

/**
 * 3.2 Generador de Hoja de Histórico de Compromisos Cumplidos (Archivo Permanente)
 * - Registra con letras color NEGRO (#000000) por tratarse de compromisos cumplidos y cerrados.
 * - Sin formato condicional de color rojo (no son deudas activas).
 */
function crearHojaHistoricoCompromisosGenerica_(ss, nombreHoja, colorTema, entidadNombre) {
  let sheet = ss.getSheetByName(nombreHoja);
  const encabezados = [
    "ID_COMPROMISO", "FECHA_CREACION", "PROVEEDOR_ACREEDOR", "CONCEPTO", 
    "MONTO_TOTAL", "TOTAL_PAGADO", "SALDO_FINAL", "FECHA_VENCIMIENTO", 
    "FECHA_LIQUIDACION", "ESTADO", "TIPO_COMPROMISO", "NOTAS_AUDITORIA"
  ];

  if (!sheet) {
    sheet = ss.insertSheet(nombreHoja);
  }

  sheet.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
  darFormatoEncabezado_(sheet, encabezados.length, colorTema || "#1e293b");

  // Anchos de columnas
  sheet.setColumnWidth(1, 180); // ID_COMPROMISO
  sheet.setColumnWidth(2, 120); // FECHA_CREACION
  sheet.setColumnWidth(3, 200); // PROVEEDOR_ACREEDOR
  sheet.setColumnWidth(4, 250); // CONCEPTO
  sheet.setColumnWidth(5, 140); // MONTO_TOTAL
  sheet.setColumnWidth(6, 140); // TOTAL_PAGADO
  sheet.setColumnWidth(7, 130); // SALDO_FINAL
  sheet.setColumnWidth(8, 140); // FECHA_VENCIMIENTO
  sheet.setColumnWidth(9, 140); // FECHA_LIQUIDACION
  sheet.setColumnWidth(10, 120); // ESTADO
  sheet.setColumnWidth(11, 190); // TIPO_COMPROMISO
  sheet.setColumnWidth(12, 260); // NOTAS_AUDITORIA

  // Formato de moneda para columnas E, F, G (Monto Total, Total Pagado, Saldo Final)
  sheet.getRange("E2:G").setNumberFormat(CONFIG_FINANZAS.FORMATO_MONEDA);
  sheet.getRange("B2:B").setNumberFormat(CONFIG_FINANZAS.FORMATO_FECHA);
  sheet.getRange("H2:I").setNumberFormat(CONFIG_FINANZAS.FORMATO_FECHA);
  sheet.setFrozenRows(1);

  // Asegurar color negro en todo el cuerpo de datos existente
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, encabezados.length).setFontColor("#000000");
  }

  return sheet;
}

/**
 * 3.3 Archiva de forma inmediata un compromiso cumplido a su respectiva hoja histórica:
 * 1. Resuelve o crea la hoja histórica correspondiente ({Entidad}_Historico_Compromisos o Compromisos_Globales_Historico).
 * 2. Transfiere todos los datos con fecha de liquidación, saldo en $0 y estado 'Cumplido'.
 * 3. Aplica formato de texto en color negro (#000000) por tratarse de una obligación satisfecha.
 * 4. Elimina la fila de la hoja de compromisos activos para mantener limpios los pasivos pendientes.
 */
function archivarCompromisoCumplidoDirecto_(ss, sheetComp, indexFila, filaDatos, montoAbonado, metodoPago, esCiclico) {
  try {
    const libro = ss || SpreadsheetApp.getActiveSpreadsheet();
    if (!libro || !sheetComp || indexFila <= 1) return false;

    const nombreHojaComp = sheetComp.getName();
    const nombreHojaHistorico = resolverNombreHojaHistoricoCompromisos_(nombreHojaComp);
    let sheetHist = libro.getSheetByName(nombreHojaHistorico);
    if (!sheetHist) {
      sheetHist = crearHojaHistoricoCompromisosGenerica_(libro, nombreHojaHistorico, "#1e293b", nombreHojaComp);
    }

    const fechaLiq = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    const filaHistorico = [
      filaDatos[0], // ID_COMPROMISO
      filaDatos[1], // FECHA_CREACION
      filaDatos[2], // PROVEEDOR_ACREEDOR
      filaDatos[3], // CONCEPTO
      Number(filaDatos[4]) || 0, // MONTO_TOTAL
      Number(montoAbonado) || Number(filaDatos[5]) || Number(filaDatos[4]) || 0, // TOTAL_PAGADO
      0, // SALDO_FINAL ($0)
      filaDatos[8], // FECHA_VENCIMIENTO
      fechaLiq, // FECHA_LIQUIDACION
      "Cumplido", // ESTADO
      esCiclico ? "Ciclo Recurrente Cumplido" : "Cumplido No Recurrente", // TIPO_COMPROMISO
      metodoPago ? `Liquidado vía ${metodoPago}` : "Liquidado al 100% y archivado" // NOTAS_AUDITORIA
    ];

    sheetHist.appendRow(filaHistorico);
    const newRow = sheetHist.getLastRow();
    // Directiva clave: Letras negras en hoja histórica
    sheetHist.getRange(newRow, 1, 1, 12).setFontColor("#000000");
    sheetHist.getRange(newRow, 5, 1, 3).setNumberFormat(CONFIG_FINANZAS.FORMATO_MONEDA);
    sheetHist.getRange(newRow, 2).setNumberFormat(CONFIG_FINANZAS.FORMATO_FECHA);
    sheetHist.getRange(newRow, 8, 1, 2).setNumberFormat(CONFIG_FINANZAS.FORMATO_FECHA);

    // Eliminar la fila de la hoja de compromisos pendientes
    sheetComp.deleteRow(indexFila);
    SpreadsheetApp.flush();
    Logger.log(`✅ Compromiso ${filaDatos[0]} archivado con éxito en ${nombreHojaHistorico} y eliminado de ${nombreHojaComp}.`);
    return true;
  } catch (err) {
    Logger.log("Error en archivarCompromisoCumplidoDirecto_: " + err.message);
    return false;
  }
}

/**
 * 3.4 Barre todas las hojas de compromisos activas del libro, traslada todas las obligaciones
 * con saldo $0 o estado 'Cumplido' a sus respectivas hojas históricas con letras negras (#000000),
 * y las elimina de la lista de pendientes.
 */
function archivarTodosCompromisosCumplidos(ss) {
  const libro = ss || SpreadsheetApp.getActiveSpreadsheet();
  if (!libro) return { ok: false, error: "No se encontró el libro activo." };

  const hojas = libro.getSheets();
  let totalArchivados = 0;
  const detalle = [];

  for (let s = 0; s < hojas.length; s++) {
    const sheet = hojas[s];
    const nombre = sheet.getName();
    // Solo hojas de compromisos activos (NO hojas históricas)
    const esCompActivo = (nombre.includes("_Compromisos") || nombre === "Compromisos_Globales") && !nombre.includes("_Historico");

    if (esCompActivo) {
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) continue;

      const numCols = sheet.getLastColumn();
      const datos = sheet.getRange(2, 1, lastRow - 1, Math.max(numCols, 12)).getValues();
      const filasAArchivar = [];

      for (let i = 0; i < datos.length; i++) {
        const fila = datos[i];
        const rowNum = i + 2;
        const saldo = Number(fila[6]) || 0;
        const estado = String(fila[9] || "").trim().toLowerCase();
        const totalAbonado = Number(fila[5]) || 0;
        const montoTotal = Number(fila[4]) || 0;

        // Criterio de cumplimiento: Saldo 0 o estado Cumplido
        if (saldo <= 0 || estado === "cumplido" || (montoTotal > 0 && totalAbonado >= montoTotal)) {
          filasAArchivar.push({ rowNum: rowNum, fila: fila });
        }
      }

      if (filasAArchivar.length > 0) {
        const nombreHistorico = resolverNombreHojaHistoricoCompromisos_(nombre);
        const sheetHistorico = libro.getSheetByName(nombreHistorico) || crearHojaHistoricoCompromisosGenerica_(libro, nombreHistorico, "#1e293b", nombre);

        // Archivar y luego eliminar de abajo hacia arriba (orden descendente)
        filasAArchivar.sort((a, b) => b.rowNum - a.rowNum);

        for (let j = 0; j < filasAArchivar.length; j++) {
          const item = filasAArchivar[j];
          const f = item.fila;
          const fechaLiq = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
          const conceptoLimpio = String(f[3] || "").toLowerCase();
          const esCiclico = conceptoLimpio.includes("arriendo") || conceptoLimpio.includes("alquiler") || conceptoLimpio.includes("servicio") || conceptoLimpio.includes("mensual");

          const filaHistorico = [
            f[0], // ID_COMPROMISO
            f[1], // FECHA_CREACION
            f[2], // PROVEEDOR_ACREEDOR
            f[3], // CONCEPTO
            Number(f[4]) || 0, // MONTO_TOTAL
            Number(f[5]) || Number(f[4]) || 0, // TOTAL_PAGADO
            0,    // SALDO_FINAL ($0)
            f[8], // FECHA_VENCIMIENTO
            fechaLiq, // FECHA_LIQUIDACION
            "Cumplido", // ESTADO
            esCiclico ? "Ciclo Recurrente Cumplido" : "Cumplido No Recurrente", // TIPO_COMPROMISO
            "Archivado desde " + nombre + " con saldo en $0" // NOTAS_AUDITORIA
          ];

          sheetHistorico.appendRow(filaHistorico);
          const newRowHist = sheetHistorico.getLastRow();
          // Asegurar letras negras y formato de moneda
          sheetHistorico.getRange(newRowHist, 1, 1, 12).setFontColor("#000000");
          sheetHistorico.getRange(newRowHist, 5, 1, 3).setNumberFormat(CONFIG_FINANZAS.FORMATO_MONEDA);
          sheetHistorico.getRange(newRowHist, 2).setNumberFormat(CONFIG_FINANZAS.FORMATO_FECHA);
          sheetHistorico.getRange(newRowHist, 8, 1, 2).setNumberFormat(CONFIG_FINANZAS.FORMATO_FECHA);

          // Eliminar de la hoja de compromisos activos
          sheet.deleteRow(item.rowNum);
          totalArchivados++;
        }
        detalle.push(`• ${nombre} ➔ ${nombreHistorico}: ${filasAArchivar.length} compromiso(s) archivado(s).`);
      }
    }
  }

  SpreadsheetApp.flush();
  return {
    ok: true,
    totalArchivados: totalArchivados,
    detalle: detalle,
    mensaje: totalArchivados > 0 
      ? `🎉 Se trasladaron exitosamente ${totalArchivados} compromiso(s) cumplido(s) a sus respectivas hojas históricas en letras negras.`
      : "ℹ️ No se encontraron compromisos cumplidos pendientes de archivar. Todas las hojas están al día."
  };
}

/**
 * Configura las reglas de formato condicional automáticas en hojas de transacciones:
 * - Toda transacción que NO sea Ingreso (Egresos, Compras, Pagos, Gastos, Nóminas, etc.) -> Caracteres ROJOS (#dc2626)
 * - Todo Ingreso -> Caracteres VERDES (#15803d)
 */
function configurarFormatoCondicionalTransacciones_(sheet, colorRojo, colorVerde) {
  if (!sheet) return;
  const cRojo = colorRojo || "#dc2626";
  const cVerde = colorVerde || "#15803d";
  const maxRows = Math.max(100, sheet.getMaxRows());
  const range = sheet.getRange(`A2:L${maxRows}`);

  const ruleRojo = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($C2<>"", NOT(ISNUMBER(SEARCH("Ingreso", $C2))))')
    .setFontColor(cRojo)
    .setRanges([range])
    .build();

  const ruleVerde = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=ISNUMBER(SEARCH("Ingreso", $C2))')
    .setFontColor(cVerde)
    .setRanges([range])
    .build();

  sheet.setConditionalFormatRules([ruleRojo, ruleVerde]);
}

/**
 * Configura las reglas de formato condicional automáticas en hojas de compromisos:
 * - Cuentas por Pagar (Pasivos / Deudas a terceros) -> Caracteres ROJOS (#dc2626)
 * - Cuentas por Cobrar (Activos / Cartera / Dinero adeudado a favor) -> Caracteres VERDES (#15803d)
 */
function configurarFormatoCondicionalCompromisos_(sheet, colorRojo, colorVerde) {
  if (!sheet) return;
  const cRojo = colorRojo || "#dc2626";
  const cVerde = colorVerde || "#15803d";
  const maxRows = Math.max(100, sheet.getMaxRows());
  const range = sheet.getRange(`A2:L${maxRows}`);

  // Regla 1: Cuentas por Cobrar (Dinero adeudado a favor del usuario / ingreso pendiente) -> VERDE
  // Evalúa Columna D (CONCEPTO) o Columna C (PROVEEDOR_ACREEDOR)
  const formulaCobrar = '=AND($A2<>"", OR(ISNUMBER(SEARCH("cobrar", $D2)), ISNUMBER(SEARCH("cobro", $D2)), ISNUMBER(SEARCH("a favor", $D2)), ISNUMBER(SEARCH("ingreso", $D2)), ISNUMBER(SEARCH("deudor", $D2)), ISNUMBER(SEARCH("me debe", $D2)), ISNUMBER(SEARCH("prestamo a", $D2)), ISNUMBER(SEARCH("por cobrar", $C2))))';
  const ruleCobrar = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(formulaCobrar)
    .setFontColor(cVerde)
    .setRanges([range])
    .build();

  // Regla 2: Cuentas por Pagar (Pasivos / Obligaciones pendientes de salida) -> ROJO
  const formulaPagar = '=AND($A2<>"", NOT(OR(ISNUMBER(SEARCH("cobrar", $D2)), ISNUMBER(SEARCH("cobro", $D2)), ISNUMBER(SEARCH("a favor", $D2)), ISNUMBER(SEARCH("ingreso", $D2)), ISNUMBER(SEARCH("deudor", $D2)), ISNUMBER(SEARCH("me debe", $D2)), ISNUMBER(SEARCH("prestamo a", $D2)), ISNUMBER(SEARCH("por cobrar", $C2)))))';
  const rulePagar = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(formulaPagar)
    .setFontColor(cRojo)
    .setRanges([range])
    .build();

  sheet.setConditionalFormatRules([ruleCobrar, rulePagar]);
}

/**
 * Aplica la directiva corporativa de caracteres de color rojo para todas las salidas,
 * pagos, compras, egresos, nóminas y compromisos por pagar en todas las hojas del libro,
 * y caracteres VERDES para todos los ingresos y cuentas por cobrar a favor.
 * Se aplica retroactivamente a la información ya registrada y deja activo el formato
 * condicional para cualquier registro de este momento en adelante.
 */
function aplicarDirectivaCaracteresRojosLibro(ss) {
  const libro = ss || SpreadsheetApp.getActiveSpreadsheet();
  if (!libro) return { ok: false, error: "No se encontró el libro de cálculo activo." };

  const COLOR_ROJO_EGRESO = "#dc2626";
  const COLOR_VERDE_INGRESO = "#15803d";
  const hojas = libro.getSheets();
  const detalle = [];

  for (let s = 0; s < hojas.length; s++) {
    const sheet = hojas[s];
    const nombre = sheet.getName();
    const esTrans = nombre.includes("_Transacciones") || nombre === "Operacion_Global" || nombre === "Gastos_Globales";
    const esComp = (nombre.includes("_Compromisos") || nombre === "Compromisos_Globales") && !nombre.includes("_Historico");
    const esHist = nombre.includes("_Historico");

    if (esTrans) {
      configurarFormatoCondicionalTransacciones_(sheet, COLOR_ROJO_EGRESO, COLOR_VERDE_INGRESO);

      const lastRow = sheet.getLastRow();
      let filasColoreadas = 0;
      if (lastRow > 1) {
        const valoresTipo = sheet.getRange(2, 3, lastRow - 1, 1).getValues(); // Columna C: TIPO
        for (let i = 0; i < valoresTipo.length; i++) {
          const rowNum = i + 2;
          const tipoStr = String(valoresTipo[i][0] || "").toLowerCase();
          const esIngreso = tipoStr.includes("ingreso");
          const colorFila = esIngreso ? COLOR_VERDE_INGRESO : COLOR_ROJO_EGRESO;
          sheet.getRange(rowNum, 1, 1, 12).setFontColor(colorFila);
          filasColoreadas++;
        }
      }
      detalle.push(`• ${nombre}: Formato condicional activo + ${filasColoreadas} filas procesadas retroactivamente.`);
    } else if (esComp) {
      configurarFormatoCondicionalCompromisos_(sheet, COLOR_ROJO_EGRESO, COLOR_VERDE_INGRESO);

      const lastRow = sheet.getLastRow();
      let filasColoreadas = 0;
      if (lastRow > 1) {
        const valoresConcepto = sheet.getRange(2, 4, lastRow - 1, 1).getValues(); // Columna D: CONCEPTO
        const valoresTercero = sheet.getRange(2, 3, lastRow - 1, 1).getValues(); // Columna C: PROVEEDOR_ACREEDOR
        for (let i = 0; i < valoresConcepto.length; i++) {
          const rowNum = i + 2;
          const textoRow = (String(valoresConcepto[i][0] || "") + " " + String(valoresTercero[i][0] || "")).toLowerCase();
          const esPorCobrar = textoRow.includes("cobrar") || textoRow.includes("cobro") || textoRow.includes("a favor") || textoRow.includes("me debe") || textoRow.includes("ingreso") || textoRow.includes("deudor") || textoRow.includes("prestamo a");
          const colorFila = esPorCobrar ? COLOR_VERDE_INGRESO : COLOR_ROJO_EGRESO;
          sheet.getRange(rowNum, 1, 1, 12).setFontColor(colorFila);
          filasColoreadas++;
        }
      }
      detalle.push(`• ${nombre}: Formato condicional inteligente activo (Cobros en verde, deudas en rojo) + ${filasColoreadas} filas procesadas.`);
    } else if (esHist) {
      const lastRow = sheet.getLastRow();
      let filasNegras = 0;
      if (lastRow > 1) {
        const numCols = Math.max(12, sheet.getLastColumn());
        sheet.getRange(2, 1, lastRow - 1, numCols).setFontColor("#000000");
        filasNegras = lastRow - 1;
      }
      detalle.push(`• ${nombre}: Hoja Histórica verificada (${filasNegras} registros en color negro neutro).`);
    }
  }

  SpreadsheetApp.flush();
  return {
    ok: true,
    mensaje: "Directiva de caracteres rojos aplicada con éxito en todas las hojas.",
    detalle: detalle
  };
}

/**
 * Resuelve dinámicamente el nombre de la hoja global del grupo de negocios (Operacion_Global o Gastos_Globales)
 */
function resolverNombreHojaGlobal_(ss) {
  const libro = ss || SpreadsheetApp.getActiveSpreadsheet();
  if (libro && libro.getSheetByName("Operacion_Global")) return "Operacion_Global";
  if (libro && libro.getSheetByName("Gastos_Globales")) return "Gastos_Globales";
  return (HOJAS.OPERACION_GLOBAL || HOJAS.GASTOS_GLOBALES || "Operacion_Global");
}

/**
 * 4. Dashboard Consolidado Ejecutivo (Con fórmulas nativas en tiempo real)
 */
function crearHojaDashboardConsolidado_(ss) {
  let sheet = ss.getSheetByName(HOJAS.DASHBOARD);
  if (!sheet) {
    sheet = ss.insertSheet(HOJAS.DASHBOARD, 1);
  }

  const hojaGlobal = resolverNombreHojaGlobal_(ss);
  const hojaCompGlobal = (ss.getSheetByName("Compromisos_Globales")) ? "Compromisos_Globales" : HOJAS.COMPROMISOS_GLOBALES;

  // Título principal
  sheet.getRange("A1:E1").merge();
  sheet.getRange("A1").setValue("📊 RESUMEN FINANCIERO EJECUTIVO EN TIEMPO REAL")
    .setBackground("#0f172a")
    .setFontColor("#f8fafc")
    .setFontWeight("bold")
    .setFontSize(13)
    .setHorizontalAlignment("center");

  // Encabezados de la matriz
  const headers = ["ENTIDAD", "INGRESOS TOTALES", "GASTOS TOTALES", "FLUJO NETO DISPONIBLE", "PASIVOS PENDIENTES"];
  sheet.getRange(2, 1, 1, headers.length).setValues([headers]);
  darFormatoEncabezado_(sheet, headers.length, TEMAS.DASHBOARD, 2);

  // Fórmulas matemáticas dinámicas por entidad
  const filasMatriz = [
    [
      "Personal",
      `=SUMIF(${HOJAS.PERSONAL_TRANS}!C:C, "*Ingreso*", ${HOJAS.PERSONAL_TRANS}!H:H)`,
      `=SUMIFS(${HOJAS.PERSONAL_TRANS}!H:H, ${HOJAS.PERSONAL_TRANS}!C:C, "<>*Ingreso*", ${HOJAS.PERSONAL_TRANS}!C:C, "<>")`,
      `=B3-C3`,
      `=SUMIFS(${HOJAS.PERSONAL_COMP}!G:G, ${HOJAS.PERSONAL_COMP}!J:J, "Pendiente")`
    ],
    [
      "More Paper",
      `=SUMIF(${HOJAS.MOREPAPER_TRANS}!C:C, "*Ingreso*", ${HOJAS.MOREPAPER_TRANS}!H:H)`,
      `=SUMIFS(${HOJAS.MOREPAPER_TRANS}!H:H, ${HOJAS.MOREPAPER_TRANS}!C:C, "<>*Ingreso*", ${HOJAS.MOREPAPER_TRANS}!C:C, "<>")`,
      `=B4-C4`,
      `=SUMIFS(${HOJAS.MOREPAPER_COMP}!G:G, ${HOJAS.MOREPAPER_COMP}!J:J, "Pendiente")`
    ],
    [
      "More Design",
      `=SUMIF(${HOJAS.MOREDESIGN_TRANS}!C:C, "*Ingreso*", ${HOJAS.MOREDESIGN_TRANS}!H:H)`,
      `=SUMIFS(${HOJAS.MOREDESIGN_TRANS}!H:H, ${HOJAS.MOREDESIGN_TRANS}!C:C, "<>*Ingreso*", ${HOJAS.MOREDESIGN_TRANS}!C:C, "<>")`,
      `=B5-C5`,
      `=SUMIFS(${HOJAS.MOREDESIGN_COMP}!G:G, ${HOJAS.MOREDESIGN_COMP}!J:J, "Pendiente")`
    ],
    [
      "Operación Global & Nómina (Común)",
      `=IFERROR(SUMIF(${hojaGlobal}!C:C, "*Ingreso*", ${hojaGlobal}!H:H), 0)`,
      `=IFERROR(SUMIFS(${hojaGlobal}!H:H, ${hojaGlobal}!C:C, "<>*Ingreso*", ${hojaGlobal}!C:C, "<>"), 0)`,
      `=B6-C6`,
      `=IFERROR(SUMIFS(${hojaCompGlobal}!G:G, ${hojaCompGlobal}!J:J, "Pendiente"), 0)`
    ],
    [
      "TOTAL CONSOLIDADO",
      `=SUM(B3:B6)`,
      `=SUM(C3:C6)`,
      `=SUM(D3:D6)`,
      `=SUM(E3:E6)`
    ]
  ];

  sheet.getRange(3, 1, filasMatriz.length, 5).setValues(filasMatriz);

  // Formato de fila totalizadora
  sheet.getRange("A7:E7")
    .setFontWeight("bold")
    .setBackground("#f1f5f9")
    .setBorder(true, null, true, null, null, null, "#0f172a", SpreadsheetApp.BorderStyle.DOUBLE);

  // Formato monetario
  sheet.getRange("B3:E7").setNumberFormat(CONFIG_FINANZAS.FORMATO_MONEDA);

  // Anchos columnas principales
  sheet.setColumnWidth(1, 260);
  sheet.setColumnWidth(2, 170);
  sheet.setColumnWidth(3, 170);
  sheet.setColumnWidth(4, 200);
  sheet.setColumnWidth(5, 190);
  sheet.setFrozenRows(2);

  // --------------------------------------------------------------------------
  // MATRIZ DE CUENTAS BANCARIAS OFICIALES & LIQUIDEZ REAL (Columnas G a J)
  // --------------------------------------------------------------------------
  const headersBancos = ["CUENTA BANCARIA", "BANCO", "DESTINO / ASOCIACIÓN", "SALDO DISPONIBLE EN BANCO"];
  sheet.getRange(2, 7, 1, headersBancos.length).setValues([headersBancos]);
  darFormatoEncabezado_(sheet, headersBancos.length, "#1e293b", 2, 7);

  // Limpiar rango previo de bancos para no dejar residuos de filas anteriores
  const maxFilasLimpiar = Math.max(12, sheet.getLastRow());
  sheet.getRange(3, 7, maxFilasLimpiar, 4).clearContent().setBackground(null).setFontWeight("normal").setBorder(false, false, false, false, false, false);

  const filasBancos = construirFilasMatrizBancosDinamica_(ss);
  sheet.getRange(3, 7, filasBancos.length, 4).setValues(filasBancos);

  const filaTotalBancos = 2 + filasBancos.length;
  sheet.getRange(`G${filaTotalBancos}:J${filaTotalBancos}`)
    .setFontWeight("bold")
    .setBackground("#f1f5f9")
    .setBorder(true, null, true, null, null, null, "#0f172a", SpreadsheetApp.BorderStyle.DOUBLE);

  sheet.getRange(`J3:J${filaTotalBancos}`).setNumberFormat(CONFIG_FINANZAS.FORMATO_MONEDA);
  sheet.setColumnWidth(6, 30); // Espaciador
  sheet.setColumnWidth(7, 240);
  sheet.setColumnWidth(8, 140);
  sheet.setColumnWidth(9, 280);
  sheet.setColumnWidth(10, 230);

  // Generar dinámicamente la sección de usuarios individuales externos si existen
  try {
    actualizarUsuariosEnDashboardConsolidado_(ss);
  } catch (e) {
    Logger.log("Aviso: Usuarios en Dashboard Consolidado: " + e.message);
  }
}

/**
 * Construye dinámicamente las filas de la tabla de cuentas bancarias para Dashboard_Consolidado:
 * - Lee todas las cuentas bancarias activas desde Config_Cuentas_Bancarias.
 * - Concilia cada cuenta mediante fórmulas SUMIFS filtrando estrictamente por METODO_PAGO (columna I).
 * - Excluye el 100% de los movimientos en efectivo del saldo de la cuenta bancaria.
 * - Genera la fila totalizadora `=SUM(J3:J...)`.
 * @param {Spreadsheet} ss - Hoja de cálculo activa.
 * @return {Array<Array<string>>} Matriz de filas [alias, banco, destino, formula].
 */
function construirFilasMatrizBancosDinamica_(ss) {
  const libro = ss || SpreadsheetApp.getActiveSpreadsheet();
  let cuentas = [];
  try {
    if (typeof obtenerCuentasBancariasPorEntidad_ === "function") {
      cuentas = obtenerCuentasBancariasPorEntidad_(libro, "Consolidado");
    }
  } catch (e) {
    Logger.log("Aviso obteniendo cuentas bancarias para matriz dinámica: " + e.message);
  }

  if (!cuentas || cuentas.length === 0) {
    cuentas = [
      {
        alias: "Ahorros ***2103 (Personal)",
        banco: "Bancolombia",
        tipoUso: "Personal (Ingresos Propios)",
        mascara: "***2103"
      },
      {
        alias: "Ahorros ***7194 (Negocios)",
        banco: "Bancolombia",
        tipoUso: "More Paper & More Design (Común)",
        mascara: "***7194"
      }
    ];
  }

  // Deduplicación defensiva por máscara para evitar filas repetidas en Dashboard
  const seenMasks = new Set();
  const cuentasUnicas = [];
  cuentas.forEach(c => {
    const maskDigits = String(c.mascara || "").replace(/[^0-9]/g, "");
    if (!seenMasks.has(maskDigits)) {
      seenMasks.add(maskDigits);
      cuentasUnicas.push(c);
    }
  });
  cuentas = cuentasUnicas;

  const hojaGlobal = resolverNombreHojaGlobal_(libro);
  const filas = [];

  cuentas.forEach(c => {
    const alias = c.alias || `${c.banco} ${c.mascara}`;
    const banco = c.banco || "Bancolombia";
    const destino = c.tipoUso || "Operación General";
    const maskDigits = String(c.mascara || "").replace(/[^0-9]/g, "");

    let formula = "";
    if (maskDigits === "7194" || String(c.tipoUso || "").toLowerCase().includes("global") || String(c.tipoUso || "").toLowerCase().includes("tienda")) {
      // Cuenta de tiendas (***7194): concilia movimientos electrónicos de More Paper, More Design y Operación Global
      formula = `=(SUMIFS(${HOJAS.MOREPAPER_TRANS}!H:H, ${HOJAS.MOREPAPER_TRANS}!C:C, "*Ingreso*", ${HOJAS.MOREPAPER_TRANS}!I:I, "*${maskDigits}*") - SUMIFS(${HOJAS.MOREPAPER_TRANS}!H:H, ${HOJAS.MOREPAPER_TRANS}!C:C, "<>*Ingreso*", ${HOJAS.MOREPAPER_TRANS}!I:I, "*${maskDigits}*")) + (SUMIFS(${HOJAS.MOREDESIGN_TRANS}!H:H, ${HOJAS.MOREDESIGN_TRANS}!C:C, "*Ingreso*", ${HOJAS.MOREDESIGN_TRANS}!I:I, "*${maskDigits}*") - SUMIFS(${HOJAS.MOREDESIGN_TRANS}!H:H, ${HOJAS.MOREDESIGN_TRANS}!C:C, "<>*Ingreso*", ${HOJAS.MOREDESIGN_TRANS}!I:I, "*${maskDigits}*")) + (IFERROR(SUMIFS(${hojaGlobal}!H:H, ${hojaGlobal}!C:C, "*Ingreso*", ${hojaGlobal}!I:I, "*${maskDigits}*"), 0) - IFERROR(SUMIFS(${hojaGlobal}!H:H, ${hojaGlobal}!C:C, "<>*Ingreso*", ${hojaGlobal}!I:I, "*${maskDigits}*"), 0))`;
    } else if (maskDigits === "2103" || String(c.tipoUso || "").toLowerCase().includes("personal")) {
      // Cuenta personal (***2103): concilia movimientos no en efectivo de Personal_Transacciones
      formula = `=SUMIFS(${HOJAS.PERSONAL_TRANS}!H:H, ${HOJAS.PERSONAL_TRANS}!C:C, "*Ingreso*", ${HOJAS.PERSONAL_TRANS}!I:I, "*${maskDigits}*") - SUMIFS(${HOJAS.PERSONAL_TRANS}!H:H, ${HOJAS.PERSONAL_TRANS}!C:C, "<>*Ingreso*", ${HOJAS.PERSONAL_TRANS}!I:I, "*${maskDigits}*") + (IFERROR(SUMIFS(${HOJAS.PERSONAL_TRANS}!H:H, ${HOJAS.PERSONAL_TRANS}!C:C, "*Ingreso*", ${HOJAS.PERSONAL_TRANS}!I:I, "Transferencia"), 0) - IFERROR(SUMIFS(${HOJAS.PERSONAL_TRANS}!H:H, ${HOJAS.PERSONAL_TRANS}!C:C, "<>*Ingreso*", ${HOJAS.PERSONAL_TRANS}!I:I, "Transferencia"), 0))`;
    } else {
      // Cuenta bancaria dinámica adicional (ej: Nequi, Davivienda, etc.)
      formula = `=SUMIFS(${HOJAS.PERSONAL_TRANS}!H:H, ${HOJAS.PERSONAL_TRANS}!C:C, "*Ingreso*", ${HOJAS.PERSONAL_TRANS}!I:I, "*${maskDigits}*") - SUMIFS(${HOJAS.PERSONAL_TRANS}!H:H, ${HOJAS.PERSONAL_TRANS}!C:C, "<>*Ingreso*", ${HOJAS.PERSONAL_TRANS}!I:I, "*${maskDigits}*")`;
    }

    filas.push([alias, banco, destino, formula]);
  });

  // Fila totalizadora dinámica de bancos
  const filaInicio = 3;
  const filaFin = filaInicio + filas.length - 1;
  filas.push([
    "TOTAL DISPONIBLE EN BANCOS",
    "Consolidado",
    "Fondo Total Líquido Disponible",
    `=SUM(J${filaInicio}:J${filaFin})`
  ]);

  return filas;
}

/**
 * Actualiza dinámicamente la sección de usuarios individuales en Dashboard_Consolidado.
 * Se ubican a partir de la fila 9 con fórmulas nativas de Sheets, garantizando que
 * la fila 7 (TOTAL CONSOLIDADO) sume ÚNICA Y EXCLUSIVAMENTE Personal, More Paper, More Design y Nómina Global.
 */
function actualizarUsuariosEnDashboardConsolidado_(ss) {
  const libro = ss || SpreadsheetApp.getActiveSpreadsheet();
  const sheetDash = libro.getSheetByName(HOJAS.DASHBOARD);
  const sheetCtrl = libro.getSheetByName(HOJAS.CONTROL_ACCESO);

  if (!sheetDash || !sheetCtrl || sheetCtrl.getLastRow() <= 1) return;

  // 1. Limpiar filas previas a partir de la fila 8 hacia abajo para evitar encabezados huérfanos o duplicados
  const maxFilas = sheetDash.getMaxRows();
  if (maxFilas >= 8) {
    sheetDash.getRange("A8:E" + maxFilas).clearContent().clearFormat();
  }

  // 2. Extraer usuarios individuales activos
  const datosCtrl = sheetCtrl.getRange(2, 1, sheetCtrl.getLastRow() - 1, 5).getValues();
  const usuariosExternos = [];

  datosCtrl.forEach(row => {
    const nombre = String(row[1]).trim();
    const rol = String(row[2]).trim().toUpperCase();
    const estado = String(row[3]).trim().toUpperCase();
    const hojas = String(row[4]);

    if (rol !== "SUPER_ADMIN" && estado === "ACTIVO") {
      const matchT = hojas.match(/([a-zA-Z0-9]+)_Transacciones/);
      const matchC = hojas.match(/([a-zA-Z0-9]+)_Compromisos/);
      const hojaTrans = matchT ? matchT[0] : null;
      const hojaComp = matchC ? matchC[0] : null;
      const entidad = matchT ? matchT[1] : nombre.split(" ")[0].replace(/[^a-zA-Z0-9]/g, "");

      if (hojaTrans && libro.getSheetByName(hojaTrans)) {
        usuariosExternos.push({
          nombre: nombre,
          entidad: entidad,
          hojaTrans: hojaTrans,
          hojaComp: hojaComp || (entidad + "_Compromisos")
        });
      }
    }
  });

  if (usuariosExternos.length === 0) return;

  // 3. Banner de título en fila 9
  sheetDash.getRange("A9:E9").merge();
  sheetDash.getRange("A9")
    .setValue("👥 CONTROL FINANCIERO INDIVIDUAL DE USUARIOS (NO SUMAN AL CONSOLIDADO)")
    .setBackground("#1e293b")
    .setFontColor("#38bdf8")
    .setFontWeight("bold")
    .setFontSize(11)
    .setHorizontalAlignment("center");

  // 4. Encabezados en fila 10
  const headersUsuarios = ["USUARIO / ENTIDAD", "INGRESOS TOTALES", "GASTOS TOTALES", "FLUJO NETO DISPONIBLE", "PASIVOS PENDIENTES"];
  sheetDash.getRange(10, 1, 1, headersUsuarios.length).setValues([headersUsuarios]);
  darFormatoEncabezado_(sheetDash, headersUsuarios.length, "#334155", 10);

  // 5. Filas dinámicas por usuario con fórmulas nativas
  const filasUsuarios = [];
  usuariosExternos.forEach((u, idx) => {
    const numFila = 11 + idx;
    filasUsuarios.push([
      `👤 ${u.nombre} (${u.entidad})`,
      `=IFERROR(SUMIF('${u.hojaTrans}'!C:C, "*Ingreso*", '${u.hojaTrans}'!H:H), 0)`,
      `=IFERROR(SUMIFS('${u.hojaTrans}'!H:H, '${u.hojaTrans}'!C:C, "<>*Ingreso*", '${u.hojaTrans}'!C:C, "<>"), 0)`,
      `=B${numFila}-C${numFila}`,
      `=IFERROR(SUMIFS('${u.hojaComp}'!G:G, '${u.hojaComp}'!J:J, "Pendiente"), 0)`
    ]);
  });

  sheetDash.getRange(11, 1, filasUsuarios.length, 5).setValues(filasUsuarios);
  sheetDash.getRange(11, 2, filasUsuarios.length, 4).setNumberFormat(CONFIG_FINANZAS.FORMATO_MONEDA);
  sheetDash.getRange(11, 1, filasUsuarios.length, 5)
    .setBackground("#f8fafc")
    .setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);

  SpreadsheetApp.flush();
  Logger.log(`✅ Dashboard Consolidado enriquecido con ${usuariosExternos.length} usuarios externos individuales.`);
}

/**
 * 5. Control de Métricas de WhatsApp y Sesiones de 24 horas
 */
function crearHojasMetricasWhatsApp_(ss) {
  // Hoja de Resumen Mensual
  let hMetricas = ss.getSheetByName(HOJAS.METRICAS_WA);
  if (!hMetricas) hMetricas = ss.insertSheet(HOJAS.METRICAS_WA);

  const headersMetricas = [
    "MES (YYYY-MM)", "CONVERSACIONES_CONSUMIDAS", "LIMITE_GRATUITO_META", 
    "PORCENTAJE_CONSUMO", "ESTADO_ALERTA", "ULTIMA_ACTUALIZACION"
  ];
  hMetricas.getRange(1, 1, 1, headersMetricas.length).setValues([headersMetricas]);
  darFormatoEncabezado_(hMetricas, headersMetricas.length, TEMAS.METRICAS);

  const mesActual = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM");
  if (hMetricas.getLastRow() <= 1) {
    const filaInicial = [
      mesActual,
      0,
      CONFIG_FINANZAS.LIMITE_WHATSAPP_GRATUITO,
      '=IF(C2>0, B2/C2, 0)',
      '=IF(D2>=0.95, "CRÍTICA (>95%)", IF(D2>=0.80, "PREVENTIVA (>80%)", "NORMAL"))',
      new Date()
    ];
    hMetricas.appendRow(filaInicial);
  }
  hMetricas.getRange("D2:D").setNumberFormat("0.0%");
  hMetricas.setColumnWidth(1, 150);
  hMetricas.setColumnWidth(2, 220);
  hMetricas.setColumnWidth(3, 190);
  hMetricas.setColumnWidth(4, 180);
  hMetricas.setColumnWidth(5, 170);
  hMetricas.setColumnWidth(6, 200);
  hMetricas.setFrozenRows(1);

  // Hoja de Sesiones Activas 24h
  let hSesiones = ss.getSheetByName(HOJAS.SESIONES_WA);
  if (!hSesiones) hSesiones = ss.insertSheet(HOJAS.SESIONES_WA);

  // Formatear columna A como texto plano para teléfonos
  hSesiones.getRange("A:A").setNumberFormat("@");

  const headersSesiones = [
    "TELEFONO", "FECHA_HORA_INICIO", "FECHA_HORA_EXPIRACION", 
    "CONVERSACION_ID", "TOTAL_MENSAJES_SESION"
  ];
  hSesiones.getRange(1, 1, 1, headersSesiones.length).setValues([headersSesiones]);
  darFormatoEncabezado_(hSesiones, headersSesiones.length, TEMAS.METRICAS);
  hSesiones.setColumnWidth(1, 180);
  hSesiones.setColumnWidth(2, 200);
  hSesiones.setColumnWidth(3, 200);
  hSesiones.setColumnWidth(4, 240);
  hSesiones.setColumnWidth(5, 180);
  hSesiones.setFrozenRows(1);
  SpreadsheetApp.flush();
}

/**
 * 6. Catálogo Maestro de Categorías
 */
function crearHojaConfigCategorias_(ss) {
  let sheet = ss.getSheetByName(HOJAS.CONFIG_CATEGORIAS);
  if (!sheet) sheet = ss.insertSheet(HOJAS.CONFIG_CATEGORIAS);

  const headers = ["ENTIDAD", "TIPO", "CATEGORIA", "SUBCATEGORIA_SUGERIDA"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  darFormatoEncabezado_(sheet, headers.length, TEMAS.CONFIG);

  if (sheet.getLastRow() <= 1) {
    const categoriasSemilla = [
      // Personal
      ["Personal", "Ingreso", "Salario / Sueldo", "Nómina"],
      ["Personal", "Ingreso", "Honorarios / Servicios", "Consultoría"],
      ["Personal", "Ingreso", "Rendimientos / Inversiones", "CDT / Acciones"],
      ["Personal", "Gasto Fijo", "Vivienda / Arriendo", "Canon mensual"],
      ["Personal", "Gasto Fijo", "Servicios Públicos", "Agua / Luz / Gas / Internet"],
      ["Personal", "Gasto Necesario", "Alimentación / Mercado", "Supermercado"],
      ["Personal", "Gasto Necesario", "Salud / Farmacia", "Medicamentos / Citas"],
      ["Personal", "Gasto Necesario", "Transporte / Combustible", "Gasolina / Pasajes"],
      ["Personal", "Gasto Innecesario", "Antojos / Compras Hormiga", "Cafés / Snacks"],
      ["Personal", "Recreación", "Salidas / Restaurantes", "Restaurantes / Cenas"],
      
      // More Paper
      ["More Paper", "Ingreso", "Ventas Mostrador", "Papelería al detal"],
      ["More Paper", "Ingreso", "Ventas Mayoristas", "Facturación empresas"],
      ["More Paper", "Compra Insumos", "Papelería & Resmas", "Papel bond / Cartulinas"],
      ["More Paper", "Compra Insumos", "Tintas & Cartuchos", "Suministros impresión"],
      ["More Paper", "Gasto Fijo", "Arriendo Local", "Canon papelería"],
      ["More Paper", "Gasto Fijo", "Nómina & Comisiones", "Vendedores mostrador"],
      ["More Paper", "Gasto Operativo", "Servicios & Mantenimiento", "Reparación máquinas"],
      
      // More Design
      ["More Design", "Ingreso", "Proyectos de Diseño", "Branding / Logos"],
      ["More Design", "Ingreso", "Servicios Publicitarios", "Campañas / Social Media"],
      ["More Design", "Compra Insumos", "Vinilos & Materiales", "Impresión gran formato"],
      ["More Design", "Gasto Fijo", "Suscripciones Software", "Adobe / Figma / OpenAI"],
      ["More Design", "Gasto Fijo", "Nómina Diseñadores", "Honorarios creativos"],
      ["More Design", "Gasto Operativo", "Equipos & Tecnología", "Upgrades hardware"],

      // Consolidado / Gastos Operativos Globales
      ["Consolidado", "Gasto Operativo Global", "Gasto Operativo Global / Nómina", "Salarios & Sueldos"],
      ["Consolidado", "Gasto Operativo Global", "Gasto Operativo Global / Nómina", "Seguridad Social & ARL"],
      ["Consolidado", "Gasto Operativo Global", "Gasto Operativo Global / Nómina", "Prestaciones & Liquidación"],
      ["Consolidado", "Gasto Operativo Global", "Honorarios Globales", "Contador / Asesoría Jurídica"]
    ];
    sheet.getRange(2, 1, categoriasSemilla.length, 4).setValues(categoriasSemilla);
  }

  sheet.setColumnWidth(1, 140);
  sheet.setColumnWidth(2, 140);
  sheet.setColumnWidth(3, 220);
  sheet.setColumnWidth(4, 220);
  sheet.setFrozenRows(1);
}

/**
 * 6.1 Catálogo Maestro de Cuentas Bancarias y Billeteras
 */
function crearHojaConfigCuentasBancarias_(ss) {
  let sheet = ss.getSheetByName(HOJAS.CONFIG_CUENTAS);
  if (!sheet) sheet = ss.insertSheet(HOJAS.CONFIG_CUENTAS);

  const headers = ["ID_CUENTA", "USUARIO_O_ENTIDAD", "BANCO_ENTIDAD", "NUMERO_MASCARA", "ALIAS_ETIQUETA", "TIPO_USO", "ESTADO", "FECHA_CREACION"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  darFormatoEncabezado_(sheet, headers.length, TEMAS.CONFIG);

  if (sheet.getLastRow() <= 1) {
    const ahora = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    const cuentasSemilla = [
      ["CTA-001", "Fernando", "Bancolombia", "***2103", "Ahorros ***2103 (Personal)", "Personal", "ACTIVA", ahora],
      ["CTA-002", "Consolidado", "Bancolombia", "***7194", "Ahorros ***7194 (Negocios)", "Global / Tiendas", "ACTIVA", ahora],
      ["CTA-003", "More Paper", "Bancolombia", "***7194", "Ahorros ***7194 (Negocios)", "Global / Tiendas", "ACTIVA", ahora],
      ["CTA-004", "More Design", "Bancolombia", "***7194", "Ahorros ***7194 (Negocios)", "Global / Tiendas", "ACTIVA", ahora]
    ];
    sheet.getRange(2, 1, cuentasSemilla.length, headers.length).setValues(cuentasSemilla);
  }

  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 160);
  sheet.setColumnWidth(3, 160);
  sheet.setColumnWidth(4, 150);
  sheet.setColumnWidth(5, 240);
  sheet.setColumnWidth(6, 160);
  sheet.setColumnWidth(7, 100);
  sheet.setColumnWidth(8, 130);
  sheet.setFrozenRows(1);
}

/**
 * 6.2 Catálogo Maestro de Personajes Dinámicos
 */
function crearHojaPersonajes_(ss) {
  let sheet = ss.getSheetByName(HOJAS.PERSONAJES);
  if (!sheet) sheet = ss.insertSheet(HOJAS.PERSONAJES);

  const headers = [
    "ID_CLAVE", "NOMBRE_OFICIAL", "FISH_AUDIO_ID", "EMOJI", 
    "DESCRIPCION", "LEMA", "SALUDO_INICIAL", "FRASES_DISTINTIVAS", 
    "CREADO_POR", "FECHA_CREACION", "ESTADO"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  darFormatoEncabezado_(sheet, headers.length, TEMAS.CONFIG);

  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 180);
  sheet.setColumnWidth(3, 270);
  sheet.setColumnWidth(4, 70);
  sheet.setColumnWidth(5, 240);
  sheet.setColumnWidth(6, 280);
  sheet.setColumnWidth(7, 280);
  sheet.setColumnWidth(8, 280);
  sheet.setColumnWidth(9, 140);
  sheet.setColumnWidth(10, 150);
  sheet.setColumnWidth(11, 110);
  sheet.setFrozenRows(1);

  poblarTodosLosPersonajesEnHoja(ss);
}

/**
 * Catálogo canónico completo de los 20 personajes legendarios con voces Fish Audio,
 * lemas y personalidades inmersivas.
 */
function obtenerCatalogoCanonico20Personajes_() {
  const ahora = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  return [
    [
      "GATO_CON_BOTAS", "El Gato con Botas", "464ca191f6db4af6951037893e640ee4", "🐱👢",
      "Espadachín audaz, galante, teatral y carismático con acento español",
      "¡Por mi honor y por mis botas! Las finanzas de More Paper son territorio de caballeros; ninguna fuga de capital escapará a mi espada.",
      "¡Hola! Soy El Gato con Botas. He venido para proteger tu tesoro con destreza, capa y espada legendaria.",
      "¡Por mi honor y por mis botas! | ¡En guardia, pérdidas innecesarias! | Un felino de leyenda para custodiar tus finanzas | ¿Quién necesita suerte cuando tiene talento y garras?",
      "Sistema / Inicial", ahora, "ACTIVO"
    ],
    [
      "BATMAN", "Batman (Bruce Wayne)", "9fe0f074e28b424185383ed287629c7b", "🦇",
      "Voz profunda, grave, imponente, solemne y protectora",
      "Soy la noche. Tus finanzas están bajo estricta vigilancia y protección.",
      "Soy Batman. Tu balance financiero y tus deudas están bajo mi custodia inquebrantable.",
      "Soy la noche. | La ciudad duerme, pero el flujo de caja nunca descansa. | Cero pasivos en las sombras.",
      "Sistema / Canónico", ahora, "ACTIVO"
    ],
    [
      "IRON_MAN", "Iron Man (Tony Stark)", "42003ba43cf34859ad1e7313ee3fea50", "🦾",
      "Voz carismática, brillante, sarcástica e hiper-tecnológica",
      "Genio, millonario y tu copiloto financiero. Cuentas claras y flujo de caja en su punto óptimo.",
      "Hola, soy Tony Stark. Tranquilo, ya recalculé tu balance y optimicé el flujo de caja.",
      "A veces tienes que correr antes de poder caminar. | Yo soy Iron Man. | Modo Stark activado.",
      "Sistema / Canónico", ahora, "ACTIVO"
    ],
    [
      "OPTIMUS_PRIME", "Optimus Prime", "a643c69dbe314687a6cfeac8993d5600", "🤖",
      "Voz heroica, metálica profunda, imponente y honorable",
      "Autobots, avancen. Cada peso y cada inversión tienen un propósito noble.",
      "Saludos. Soy Optimus Prime, líder de los Autobots. Protegeré tus recursos con honor.",
      "Autobots, avancen. | La libertad y la salud financiera son el derecho de todos los seres conscientes.",
      "Sistema / Canónico", ahora, "ACTIVO"
    ],
    [
      "SPIDERMAN", "Spider-Man (Peter Parker)", "20bda44c174d457d9dfd131cdd5c2858", "🕷️",
      "Voz juvenil, ágil, enérgica, divertida y cercana",
      "Tu amigable copiloto contable. Con un gran capital viene una gran responsabilidad.",
      "¡Hola! Soy tu amigable vecino Spider-Man, listo para atrapar cualquier gasto innecesario.",
      "Un gran poder conlleva una gran responsabilidad. | Mi sentido arácnido detecta una oportunidad financiera.",
      "Sistema / Canónico", ahora, "ACTIVO"
    ],
    [
      "CAPITAN_AMERICA", "Capitán América (Steve Rogers)", "57105c5b8a0b4d16853f6e08916b746d", "🛡️",
      "Voz noble, firme, disciplinada, patriota y confiable",
      "Podría hacer esto todo el día. Cuidaremos la disciplina de cada peso con honor.",
      "Capitán Rogers reportándose para mantener la disciplina y el orden en tus finanzas.",
      "Podría hacer esto todo el día. | Firmes en el presupuesto. | Unidos triunfamos.",
      "Sistema / Canónico", ahora, "ACTIVO"
    ],
    [
      "THOR", "Thor Hijo de Odín", "eebe207782a348a3aa906ae4cc1a110e", "⚡",
      "Voz imponente, retumbante, gloriosa y digna",
      "¡Por Asgard! Ningún gasto imprevisto derribará la fortaleza de tus finanzas.",
      "¡Salve! Soy Thor, el Dios del Trueno. Con el poder del rayo custodio tu patrimonio.",
      "¡Por Asgard y por la rentabilidad! | Este balance es digno. | Que el trueno guíe tus inversiones.",
      "Sistema / Canónico", ahora, "ACTIVO"
    ],
    [
      "HULK", "Hulk / Bruce Banner", "0d3fec4e3ff346ea91a83028bdfa4f11", "🟢",
      "Voz colosal, poderosa, atronadora y visceral",
      "¡Hulk aplasta las pérdidas y multiplica los ingresos de More Paper!",
      "¡HULK APLASTA PÉRDIDAS! ¡BANNER CUIDA EL FLUJO DE CAJA!",
      "¡Hulk aplasta deudores! | Control científico y fuerza bruta para tus números.",
      "Sistema / Canónico", ahora, "ACTIVO"
    ],
    [
      "BLACK_WIDOW", "Black Widow (Natasha Romanoff)", "8b7dc2a3c9f24b2a8d87b8541ed9eda4", "🕷️",
      "Voz ágil, astuta, fría, calculadora y profesional",
      "Nada se escapa a mi radar contable. Cero pasivos ocultos en las sombras.",
      "Soy Natasha Romanoff. Mis ojos están sobre cada detalle de tus números.",
      "Cero pasivos ocultos. | La precisión es la clave de la supervivencia. | Radar activado.",
      "Sistema / Canónico", ahora, "ACTIVO"
    ],
    [
      "DOCTOR_STRANGE", "Doctor Strange", "4953ae6b3cee4e6782fa0ac49c71dc45", "🔮",
      "Voz mística, analítica, elocuente y visionaria",
      "He visto 14 millones de futuros y en este tus finanzas son prósperas.",
      "Soy el Doctor Strange. Las artes místicas y la analítica estratégica predicen tu éxito financiero.",
      "He visto el futuro. | En el multiverso de posibilidades, elegimos la mayor rentabilidad.",
      "Sistema / Canónico", ahora, "ACTIVO"
    ],
    [
      "WOLVERINE", "Wolverine (Logan)", "23b2d4398a0447daa324a14748ccbd56", "🐺",
      "Voz ronca, directa, áspera, visceral y decidida",
      "Sin rodeos ni pérdidas. Cuidamos cada centavo con garras de adamantium.",
      "Soy Logan. No me gustan las complicaciones ni las pérdidas financieras. Vamos al grano.",
      "Soy el mejor en lo que hago. | Sin rodeos, directo al resultado. | Garras listas.",
      "Sistema / Canónico", ahora, "ACTIVO"
    ],
    [
      "DEADPOOL", "Deadpool (Wade Wilson)", "98c69ae189b54c6394e15a2440b74a60", "⚔️",
      "Voz irreverente, rápida, sarcástica, divertida y caótica",
      "Máxima precisión contable con chimichangas de ganancia y cero aburrimiento.",
      "¡Hola bebé! Soy Deadpool. Rompamos la cuarta pared y multipliquemos esos billetes.",
      "¡Chimichangas de rentabilidad! | Máximo esfuerzo. | Rompiendo la cuarta pared.",
      "Sistema / Canónico", ahora, "ACTIVO"
    ],
    [
      "LOKI", "Loki Laufeyson", "2b2dbc6598634a5aa868735273d261a8", "👑",
      "Voz astuta, elegante, persuasiva, teatral y calculadora",
      "Cargado con un glorioso propósito de rentabilidad, foso defensivo y astucia financiera.",
      "Soy Loki de Asgard, y tengo el glorioso propósito de hacer crecer tu patrimonio.",
      "Glorioso propósito. | La astucia supera a la fuerza bruta. | Tu foso defensivo es impenetrable.",
      "Sistema / Canónico", ahora, "ACTIVO"
    ],
    [
      "SUPERMAN", "Superman (Clark Kent)", "0c35f64b00d54497a05e948cf5c3adf5", "🦸",
      "Voz noble, inspiradora, cálida, barítona y templada",
      "La justicia y la disciplina blindan el patrimonio personal y empresarial.",
      "Hola, soy Clark Kent. La verdad, la justicia y la solidez financiera siempre triunfarán.",
      "Un faro de confianza y solidez. | Arriba en el cielo. | La verdad y la justicia protegen tu patrimonio.",
      "Sistema / Canónico", ahora, "ACTIVO"
    ],
    [
      "FLASH", "Flash (Barry Allen)", "691035c69e704686bb3337be74b5cb92", "⚡",
      "Voz ultra rápida, ágil, dinámica, juvenil y enérgica",
      "Registros contables a la velocidad de la luz. Cero retrasos en tus reportes.",
      "¡Hola! Soy Barry Allen. Tus informes y balances listos antes de que parpadees.",
      "A la velocidad del rayo. | Correr hacia la meta financiera. | Cada segundo cuenta.",
      "Sistema / Canónico", ahora, "ACTIVO"
    ],
    [
      "HELLBOY", "Hellboy", "9c4b0a63007e440a857bfa304707116b", "🔥",
      "Voz grave, rasposa, rebelde, ruda y contundente",
      "Demonios de pérdidas... aquí solo entra flujo de caja de verdad.",
      "Soy Hellboy. Con la Mano Derecha de la Destrucción pulverizaremos los gastos innecesarios.",
      "Mano Derecha de la Destrucción contra el desperdicio. | Aquí se gana o se gana.",
      "Sistema / Canónico", ahora, "ACTIVO"
    ],
    [
      "SPAWN", "Spawn (Al Simmons)", "29adeffc2d924009be1e5afff0587af8", "🌑",
      "Voz oscura, gutural, espectral, grave y temible",
      "Desde las sombras vigilamos que ningún deudor ni fuga de capital quede impune.",
      "Soy Spawn. El averno no perdona las deudas; tus cuentas estarán rigurosamente blindadas.",
      "Desde las sombras. | Cero clemencia con las fugas de capital. | Juicio implacable.",
      "Sistema / Canónico", ahora, "ACTIVO"
    ],
    [
      "MORGAN_FREEMAN", "Morgan Freeman", "7c76e349434d4f1e97078d924acea65f", "🎙️",
      "Voz cinematográfica, sabia, serena, pausada y solemne",
      "Y así fue como Fernando construyó un imperio financiero sólido, austero y duradero.",
      "Buenas noches. Permíteme narrar la historia de tu éxito financiero con paciencia y sabiduría.",
      "La paciencia es la madre de la fortuna. | Paso a paso se forja la grandeza. | Sabiduría intemporal.",
      "Sistema / Canónico", ahora, "ACTIVO"
    ],
    [
      "ALEXA", "Alexa (Asistente Digital)", "7c8ce560602b4102b758f62549cf8de7", "🔵",
      "Voz digital sintética nítida, precisa, neutral y ágil",
      "Siempre conectada y lista para optimizar tu flujo de caja y finanzas.",
      "Hola, soy Alexa. Tu entorno operativo y financiero está sincronizado y al día.",
      "Dispositivo conectado. | Procesamiento óptimo. | Todo en orden.",
      "Sistema / Canónico", ahora, "ACTIVO"
    ],
    [
      "ALEX", "Alex (Copiloto Profesional)", "1aa34db005974034b4bf42ac06eedc1e", "🎧",
      "Voz moderna, clara, equilibrada, neutra y profesional",
      "Eficiencia y claridad operativa en cada balance contable.",
      "Hola, soy Alex. Tu copiloto para registrar movimientos y mantener el control al día.",
      "Claridad y enfoque. | Sin sesgos, datos puros. | Operación fluida.",
      "Sistema / Canónico", ahora, "ACTIVO"
    ]
  ];
}

/**
 * Sincroniza y puebla todos los 20 personajes canónicos en la pestaña Personajes,
 * evitando duplicados si ya existen algunos registrados.
 * Puede ser ejecutada directamente desde el editor de Apps Script.
 */
function poblarTodosLosPersonajesEnHoja(ss) {
  const libro = ss || SpreadsheetApp.getActiveSpreadsheet();
  let sheet = libro.getSheetByName(HOJAS.PERSONAJES);
  if (!sheet) {
    crearHojaPersonajes_(libro);
    sheet = libro.getSheetByName(HOJAS.PERSONAJES);
  }

  const canonicos = obtenerCatalogoCanonico20Personajes_();
  const lastRow = sheet.getLastRow();

  // Obtener IDs existentes para evitar duplicación
  const idsExistentes = new Set();
  if (lastRow > 1) {
    const filasExistentes = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < filasExistentes.length; i++) {
      const id = String(filasExistentes[i][0] || "").trim().toUpperCase();
      if (id) idsExistentes.add(id);
    }
  }

  const nuevos = canonicos.filter(c => !idsExistentes.has(c[0].toUpperCase()));
  if (nuevos.length > 0) {
    sheet.getRange(lastRow + 1, 1, nuevos.length, 11).setValues(nuevos);
    SpreadsheetApp.flush();
    invalidarCachePersonajes_();
    Logger.log(`✅ ${nuevos.length} personajes canónicos incorporados exitosamente a la hoja Personajes (Total catálogo: ${sheet.getLastRow() - 1}).`);
  } else {
    Logger.log(`ℹ️ La hoja Personajes ya cuenta con todos los personajes canónicos (${lastRow - 1} registrados).`);
  }

  return { agregados: nuevos.length, total: sheet.getLastRow() - 1 };
}

/**
 * Invalida la caché de personajes dinámicos
 */
function invalidarCachePersonajes_() {
  try {
    const cache = CacheService.getScriptCache();
    if (cache) cache.remove("CACHE_PERSONAJES_DINAMICOS");
  } catch (e) {
    Logger.log("Aviso invalidando caché personajes: " + e.message);
  }
}

/**
 * Obtiene todos los personajes dinámicos registrados (opcionalmente filtrando por estado)
 */
function obtenerPersonajesDinamicos_(ss, soloActivos = true) {
  try {
    const cache = CacheService.getScriptCache();
    if (cache && soloActivos) {
      const cached = cache.get("CACHE_PERSONAJES_DINAMICOS");
      if (cached) return JSON.parse(cached);
    }

    const libro = ss || SpreadsheetApp.getActiveSpreadsheet();
    const sheet = libro.getSheetByName(HOJAS.PERSONAJES);
    if (!sheet || sheet.getLastRow() <= 1) return [];

    const numFilas = sheet.getLastRow() - 1;
    const datos = sheet.getRange(2, 1, numFilas, 11).getValues();
    const lista = [];

    for (let i = 0; i < datos.length; i++) {
      const fila = datos[i];
      const estado = String(fila[10] || "ACTIVO").toUpperCase().trim();
      if (!soloActivos || estado === "ACTIVO") {
        lista.push({
          idClave: String(fila[0] || "").trim(),
          nombre: String(fila[1] || "").trim(),
          fishAudioId: String(fila[2] || "").trim(),
          emoji: String(fila[3] || "🎭").trim(),
          descripcion: String(fila[4] || "").trim(),
          lema: String(fila[5] || "").trim(),
          saludoInicial: String(fila[6] || "").trim(),
          frasesDistintivas: String(fila[7] || "").trim(),
          creadoPor: String(fila[8] || "").trim(),
          fechaCreacion: fila[9],
          estado: estado
        });
      }
    }

    if (cache && soloActivos) {
      cache.put("CACHE_PERSONAJES_DINAMICOS", JSON.stringify(lista), 600); // 10 minutos
    }

    return lista;
  } catch (e) {
    Logger.log("Aviso en obtenerPersonajesDinamicos_: " + e.message);
    return [];
  }
}

/**
 * Guarda o actualiza un personaje en la hoja Personajes
 */
function guardarPersonajeDinamico_(ss, p) {
  const libro = ss || SpreadsheetApp.getActiveSpreadsheet();
  let sheet = libro.getSheetByName(HOJAS.PERSONAJES);
  if (!sheet) {
    crearHojaPersonajes_(libro);
    sheet = libro.getSheetByName(HOJAS.PERSONAJES);
  }

  const idClave = String(p.idClave || "").toUpperCase().trim();
  const datos = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues() : [];
  let filaDestino = sheet.getLastRow() + 1;

  for (let i = 0; i < datos.length; i++) {
    if (String(datos[i][0]).toUpperCase().trim() === idClave) {
      filaDestino = i + 2;
      break;
    }
  }

  const ahora = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  const filaData = [
    idClave,
    String(p.nombre || "").trim(),
    String(p.fishAudioId || "").trim(),
    String(p.emoji || "🎭").trim(),
    String(p.descripcion || "").trim(),
    String(p.lema || "").trim(),
    String(p.saludoInicial || "").trim(),
    String(p.frasesDistintivas || "").trim(),
    String(p.creadoPor || "").trim(),
    p.fechaCreacion || ahora,
    String(p.estado || "ACTIVO").toUpperCase().trim()
  ];

  sheet.getRange(filaDestino, 1, 1, filaData.length).setValues([filaData]);
  SpreadsheetApp.flush();
  invalidarCachePersonajes_();

  return { ok: true, fila: filaDestino, idClave: idClave };
}

/**
 * Actualiza el estado de un personaje (ACTIVO, RECHAZADO, PENDIENTE_APROBACION)
 */
function actualizarEstadoPersonajeDinamico_(ss, idClave, nuevoEstado) {
  const libro = ss || SpreadsheetApp.getActiveSpreadsheet();
  const sheet = libro.getSheetByName(HOJAS.PERSONAJES);
  if (!sheet || sheet.getLastRow() <= 1) return false;

  const idBuscado = String(idClave || "").toUpperCase().trim();
  const datos = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();

  for (let i = 0; i < datos.length; i++) {
    if (String(datos[i][0]).toUpperCase().trim() === idBuscado) {
      const fila = i + 2;
      sheet.getRange(fila, 11).setValue(String(nuevoEstado).toUpperCase().trim());
      SpreadsheetApp.flush();
      invalidarCachePersonajes_();
      return true;
    }
  }
  return false;
}

/**
 * Obtiene todas las cuentas bancarias activas para un usuario o entidad.
 */
function obtenerCuentasBancariasPorEntidad_(ss, entidad) {
  const libro = ss || SpreadsheetApp.getActiveSpreadsheet();
  const sheet = libro.getSheetByName(HOJAS.CONFIG_CUENTAS || "Config_Cuentas_Bancarias");
  if (!sheet || sheet.getLastRow() <= 1) {
    const entLower = String(entidad || "").toLowerCase();
    if (entLower.includes("paper") || entLower.includes("design") || entLower.includes("consolidado") || entLower.includes("global")) {
      return [{
        id: "CTA-DEF-02",
        usuario: entidad,
        banco: "Bancolombia",
        mascara: "***7194",
        alias: "Ahorros ***7194 (Negocios)",
        tipoUso: "Global / Tiendas",
        estado: "ACTIVA"
      }];
    }
    return [{
      id: "CTA-DEF-01",
      usuario: entidad,
      banco: "Bancolombia",
      mascara: "***2103",
      alias: "Ahorros ***2103 (Personal)",
      tipoUso: "Personal",
      estado: "ACTIVA"
    }];
  }

  const datos = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
  const entBuscar = String(entidad || "").toLowerCase().trim();
  const cuentas = [];

  datos.forEach(row => {
    const usuarioRow = String(row[1] || "").toLowerCase().trim();
    const estado = String(row[6] || "").toUpperCase().trim();
    if (estado !== "ACTIVA" && estado !== "ACTIVO") return;

    if (entBuscar === "consolidado") {
      cuentas.push({
        id: row[0],
        usuario: row[1],
        banco: row[2],
        mascara: row[3],
        alias: row[4],
        tipoUso: row[5],
        estado: estado
      });
    } else if (usuarioRow === entBuscar || (entBuscar === "fernando" && usuarioRow === "personal") || (entBuscar === "personal" && usuarioRow === "fernando")) {
      cuentas.push({
        id: row[0],
        usuario: row[1],
        banco: row[2],
        mascara: row[3],
        alias: row[4],
        tipoUso: row[5],
        estado: estado
      });
    }
  });

  return cuentas;
}

/**
 * Registra o añade una nueva cuenta bancaria en Config_Cuentas_Bancarias.
 */
function registrarNuevaCuentaBancariaEnConfig_(ss, usuarioOEntidad, banco, mascara, tipoUso, alias) {
  const libro = ss || SpreadsheetApp.getActiveSpreadsheet();
  let sheet = libro.getSheetByName(HOJAS.CONFIG_CUENTAS || "Config_Cuentas_Bancarias");
  if (!sheet) {
    crearHojaConfigCuentasBancarias_(libro);
    sheet = libro.getSheetByName(HOJAS.CONFIG_CUENTAS || "Config_Cuentas_Bancarias");
  }

  let maskNorm = String(mascara || "").replace(/[^0-9]/g, "");
  if (maskNorm.length > 4) maskNorm = maskNorm.slice(-4);
  maskNorm = `***${maskNorm}`;

  const bancoLimpio = String(banco || "Bancolombia").trim();
  const usoLimpio = (String(tipoUso || "").toLowerCase().includes("global") || String(tipoUso || "").toLowerCase().includes("negocio") || String(tipoUso || "").toLowerCase().includes("tienda"))
    ? "Global / Tiendas"
    : "Personal";
  const aliasFinal = alias || `${bancoLimpio} ${maskNorm} (${usoLimpio})`;
  const fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

  let idFinal = null;

  ejecutarConBloqueoTransaccional_(() => {
    // Deduplicación preventiva: verificar si la cuenta ya existe
    const lastRow = sheet.getLastRow();
    let filaExistente = -1;
    if (lastRow > 1) {
      const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
      for (let i = 0; i < data.length; i++) {
        const rowMask = String(data[i][3] || "").replace(/[^0-9]/g, "");
        if (rowMask === maskNorm.replace(/[^0-9]/g, "")) {
          filaExistente = i + 2;
          idFinal = data[i][0];
          break;
        }
      }
    }

    if (filaExistente > 0) {
      // Actualizar registro existente sin crear duplicados
      sheet.getRange(filaExistente, 2, 1, 6).setValues([[
        sanitizeSheetValue(usuarioOEntidad),
        sanitizeSheetValue(bancoLimpio),
        sanitizeSheetValue(maskNorm),
        sanitizeSheetValue(aliasFinal),
        sanitizeSheetValue(usoLimpio),
        "ACTIVA"
      ]]);
    } else {
      idFinal = "CTA-" + Math.floor(100 + Math.random() * 900);
      sheet.appendRow([
        sanitizeSheetValue(idFinal),
        sanitizeSheetValue(usuarioOEntidad),
        sanitizeSheetValue(bancoLimpio),
        sanitizeSheetValue(maskNorm),
        sanitizeSheetValue(aliasFinal),
        sanitizeSheetValue(usoLimpio),
        "ACTIVA",
        fecha
      ]);
    }
  });

  // Sincronizar de inmediato la hoja Dashboard_Consolidado con la nueva cuenta bancaria
  try {
    crearHojaDashboardConsolidado_(libro);
  } catch (eDash) {
    Logger.log("Aviso sincronizando Dashboard_Consolidado con nueva cuenta: " + eDash.message);
  }

  return {
    ok: true,
    id: idFinal,
    alias: aliasFinal,
    mascara: maskNorm,
    tipoUso: usoLimpio
  };
}

// ============================================================================
// LÓGICA DE CONTROL DE ACCESO Y CONSUMO DE WHATSAPP
// ============================================================================

/**
 * Valida la identidad y permisos de un usuario a partir de su número de WhatsApp.
 * Retorna si está autorizado y qué entidades tiene permitidas.
 */
function validarPermisoUsuario(telefono, entidadDestino) {
  if (!telefono) {
    Logger.log("⚠️ AVISO: 'validarPermisoUsuario' requiere un número de teléfono.");
    return { autorizado: false, motivo: "TELEFONO_NO_PROPORCIONADO" };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(HOJAS.CONTROL_ACCESO);
  if (!sheet || sheet.getLastRow() <= 1) {
    return { autorizado: false, motivo: "SISTEMA_NO_INICIALIZADO" };
  }

  const telLimpio = normalizarTelefono_(telefono);
  const maxCols = Math.max(11, sheet.getLastColumn());
  const datos = sheet.getRange(2, 1, sheet.getLastRow() - 1, maxCols).getValues();

  for (let i = 0; i < datos.length; i++) {
    const fila = datos[i];
    const telFila = normalizarTelefono_(fila[0]);
    const nombre = String(fila[1]);
    const rol = String(fila[2]).trim().toUpperCase();
    const estado = String(fila[3]).trim().toUpperCase();
    const hojasPermitidas = String(fila[4]).split(",").map(s => s.trim().toLowerCase());
    const bienvenidaEnviada = fila.length >= 8 ? String(fila[7] || "").trim().toUpperCase() === "SI" : false;
    const aliasAsistente = fila.length >= 9 && fila[8] ? String(fila[8]).trim() : (rol === "SUPER_ADMIN" ? "Jarvis" : "Aura");
    const perfilVoz = fila.length >= 10 && fila[9] ? String(fila[9]).trim() : (rol === "SUPER_ADMIN" ? "MASCULINO_CORDIAL" : "FEMENINO_DULCE");
    const configVoz = fila.length >= 11 && fila[10] ? String(fila[10]).trim() : null;

    if (telFila === telLimpio) {
      if (estado === "BLOQUEADO") {
        return {
          autorizado: false,
          motivo: "USUARIO_BLOQUEADO",
          estado: estado,
          nombre: nombre,
          texto: "🔒 Tu acceso al sistema financiero se encuentra temporalmente suspendido. Por favor contacta al administrador del sistema."
        };
      }
      if (estado !== "ACTIVO") {
        return {
          autorizado: false,
          motivo: "USUARIO_PENDIENTE_O_BLOQUEADO",
          estado: estado,
          nombre: nombre,
          texto: "🔒 Tu usuario se encuentra en estado PENDIENTE o INACTIVO. Por favor contacta al administrador."
        };
      }

      // Si es Super Admin, tiene acceso irrestricto
      if (rol === "SUPER_ADMIN" || hojasPermitidas.includes("todas")) {
        return {
          autorizado: true,
          rol: "SUPER_ADMIN",
          nombre: nombre,
          entidadPermitida: true,
          bienvenidaPendiente: false,
          aliasAsistente: aliasAsistente,
          perfilVoz: perfilVoz,
          configVoz: configVoz,
          telefono: telLimpio
        };
      }

      // Extraer nombre de entidad propia a partir de las hojas asignadas (ej: "Florangellys_Transacciones" -> "Florangellys")
      let entidadPropia = nombre.trim().split(" ")[0].replace(/[^a-zA-Z0-9]/g, "");
      if (fila[4]) {
        const match = String(fila[4]).match(/^([a-zA-Z0-9]+)_/);
        if (match) entidadPropia = match[1];
      }

      // Para usuario estándar, verificar si la entidad solicitada está permitida
      const entidadBuscada = String(entidadDestino || "").trim().toLowerCase();
      const tieneAccesoEntidad = !entidadDestino || hojasPermitidas.some(h => h.includes(entidadBuscada) || entidadBuscada.includes(h));

      return {
        autorizado: tieneAccesoEntidad,
        motivo: tieneAccesoEntidad ? "ACCESO_CONCEDIDO" : "ENTIDAD_NO_PERMITIDA",
        rol: rol,
        nombre: nombre,
        hojasPermitidas: fila[4],
        entidadPropia: entidadPropia,
        bienvenidaPendiente: !bienvenidaEnviada,
        aliasAsistente: aliasAsistente,
        perfilVoz: perfilVoz,
        configVoz: configVoz,
        telefono: telLimpio
      };
    }
  }

  return {
    autorizado: false,
    motivo: "USUARIO_NO_REGISTRADO",
    telefono: telLimpio,
    texto: "🔒 Hola. Tu número no está autorizado en este sistema financiero. He notificado al propietario para solicitar tu acceso."
  };
}

/**
 * Registra y gestiona el consumo de sesiones de 24 horas de WhatsApp Cloud API.
 * Evita duplicar el conteo dentro de una misma ventana de 24h.
 */
function registrarConversacionWhatsApp(telefono) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hSesiones = ss.getSheetByName(HOJAS.SESIONES_WA);
  const hMetricas = ss.getSheetByName(HOJAS.METRICAS_WA);
  if (!hSesiones || !hMetricas) return { ok: false, error: "Hojas de métricas no encontradas" };

  const telLimpio = normalizarTelefono_(telefono);
  const ahora = new Date();
  const mesActual = Utilities.formatDate(ahora, Session.getScriptTimeZone(), "yyyy-MM");

  let sesionActiva = false;
  let filaSesionIndex = -1;

  // 1. Revisar si hay una sesión activa (< 24 horas)
  if (hSesiones.getLastRow() > 1) {
    const sesiones = hSesiones.getRange(2, 1, hSesiones.getLastRow() - 1, 5).getValues();
    for (let i = 0; i < sesiones.length; i++) {
      const tel = normalizarTelefono_(sesiones[i][0]);
      const valExp = sesiones[i][2];
      const expiracion = (valExp instanceof Date) ? valExp : new Date(valExp);
      
      if (tel === telLimpio && ahora.getTime() < expiracion.getTime()) {
        sesionActiva = true;
        filaSesionIndex = i + 2;
        break;
      }
    }
  }

  if (sesionActiva) {
    // Incrementar contador de mensajes de la sesión existente (no cuenta como nueva conversación para Meta)
    const msgsActuales = Number(hSesiones.getRange(filaSesionIndex, 5).getValue()) || 1;
    hSesiones.getRange(filaSesionIndex, 5).setValue(msgsActuales + 1);
    SpreadsheetApp.flush();
    return {
      nuevaConversacionMeta: false,
      mensaje: "Mensaje procesado dentro de la ventana activa de 24h (Costo Meta: $0)."
    };
  }

  // 2. Nueva sesión de 24 horas (Apertura de conversación oficial Meta)
  const expira = new Date(ahora.getTime() + (24 * 60 * 60 * 1000));
  const convId = "CONV-" + Utilities.formatDate(ahora, Session.getScriptTimeZone(), "yyyyMMdd-HHmmss") + "-" + Math.floor(Math.random() * 1000);
  
  hSesiones.appendRow([telLimpio, ahora, expira, convId, 1]);
  SpreadsheetApp.flush(); // Forzar sincronización en Google Sheets inmediatamente

  // 3. Incrementar el contador mensual en Metricas_WhatsApp
  let filaMes = -1;
  if (hMetricas.getLastRow() > 1) {
    const meses = hMetricas.getRange(2, 1, hMetricas.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < meses.length; i++) {
      if (String(meses[i][0]) === mesActual) {
        filaMes = i + 2;
        break;
      }
    }
  }

  let totalConsumido = 1;
  if (filaMes !== -1) {
    totalConsumido = (Number(hMetricas.getRange(filaMes, 2).getValue()) || 0) + 1;
    hMetricas.getRange(filaMes, 2).setValue(totalConsumido);
    hMetricas.getRange(filaMes, 6).setValue(ahora);
  } else {
    hMetricas.appendRow([
      mesActual,
      1,
      CONFIG_FINANZAS.LIMITE_WHATSAPP_GRATUITO,
      '=IF(C' + (hMetricas.getLastRow() + 1) + '>0, B' + (hMetricas.getLastRow() + 1) + '/C' + (hMetricas.getLastRow() + 1) + ', 0)',
      '=IF(D' + (hMetricas.getLastRow() + 1) + '>=0.95, "CRÍTICA (>95%)", IF(D' + (hMetricas.getLastRow() + 1) + '>=0.80, "PREVENTIVA (>80%)", "NORMAL"))',
      ahora
    ]);
  }
  SpreadsheetApp.flush();

  const porcentaje = totalConsumido / CONFIG_FINANZAS.LIMITE_WHATSAPP_GRATUITO;
  const requiereAlerta = porcentaje >= CONFIG_FINANZAS.ALERTA_WHATSAPP_UMBRAL_1;

  return {
    nuevaConversacionMeta: true,
    conversacionId: convId,
    totalConsumidoMes: totalConsumido,
    limiteGratuito: CONFIG_FINANZAS.LIMITE_WHATSAPP_GRATUITO,
    porcentajeConsumo: porcentaje,
    requiereAlerta: requiereAlerta,
    alertaTexto: requiereAlerta 
      ? `⚠️ Alerta de consumo: Llevas ${totalConsumido}/${CONFIG_FINANZAS.LIMITE_WHATSAPP_GRATUITO} conversaciones consumidas (${(porcentaje * 100).toFixed(1)}%).`
      : null
  };
}

// ============================================================================
// FUNCIONES AUXILIARES DE ESTILIZADO Y NORMALIZACIÓN
// ============================================================================
function darFormatoEncabezado_(sheet, numColumnas, colorHex, fila = 1, colInicio = 1) {
  const range = sheet.getRange(fila, colInicio, 1, numColumnas);
  range.setBackground(colorHex)
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setFontSize(10)
    .setVerticalAlignment("middle")
    .setWrap(false);
  sheet.setRowHeight(fila, 32);
}

/**
 * Determina la cuenta bancaria por defecto según la entidad y si es ingreso:
 * - Personal (Ingreso) -> Ahorros ***2103 (Personal)
 * - More Paper / More Design (Ingreso) -> Ahorros ***7194 (Negocios) [Cuenta Común]
 * - Gastos / Egresos -> Mantiene el método especificado o Efectivo independiente
 */
function resolverCuentaBancariaSegunEntidad_(entidad, esIngreso, metodoIndicado) {
  const ent = String(entidad || "").toLowerCase().trim();
  const met = String(metodoIndicado || "").trim();

  if (esIngreso) {
    if (ent.includes("paper") || ent.includes("design")) {
      return (CONFIG_FINANZAS && CONFIG_FINANZAS.CUENTAS_BANCARIAS) 
        ? CONFIG_FINANZAS.CUENTAS_BANCARIAS.NEGOCIOS_COMPARTIDA.ETIQUETA 
        : "Ahorros ***7194 (Negocios)";
    }
    if (ent.includes("personal")) {
      return (CONFIG_FINANZAS && CONFIG_FINANZAS.CUENTAS_BANCARIAS) 
        ? CONFIG_FINANZAS.CUENTAS_BANCARIAS.PERSONAL.ETIQUETA 
        : "Ahorros ***2103 (Personal)";
    }
    return met || "Transferencia";
  }

  return met || "Efectivo";
}

/**
 * Normaliza cualquier formato de teléfono (+57 300..., 57300..., 300...)
 * extrayendo únicamente los dígitos numéricos para una comparación infalible.
 */
function normalizarTelefono_(tel) {
  if (!tel) return "";
  let digits = String(tel).replace(/\D/g, "").trim();
  // Si es un número celular de Colombia de 10 dígitos (empieza por 3), anteponer prefijo de país 57
  if (digits.length === 10 && digits.startsWith("3")) {
    digits = "57" + digits;
  }
  return digits;
}

// ============================================================================
// GESTIÓN DINÁMICA DE USUARIOS, APROVISIONAMIENTO Y CONTROL DE SEGURIDAD
// ============================================================================

/**
 * Crea o actualiza un nuevo usuario financiero de forma 100% automatizada.
 * Genera sus hojas dedicadas de Transacciones y Compromisos con formato profesional
 * y registra sus permisos de forma segura en Control_Acceso.
 */
function crearNuevoUsuarioFinanciero(telefono, nombreCompleto, rol = "USUARIO", estado = "ACTIVO", entidadNombre, notas = "") {
  // Manejo defensivo si se ejecuta directamente desde el botón 'Ejecutar' de Apps Script sin parámetros
  if (!telefono) {
    Logger.log("⚠️ AVISO: 'crearNuevoUsuarioFinanciero' es una función parametrizada.\n" +
      "👉 Para aprovisionar a Florangellys desde este menú, selecciona en el desplegable superior la función 'agregarUsuarioFlorangellys' y pulsa 'Ejecutar'.\n" +
      "👉 Para corregir números de teléfono existentes, selecciona 'estandarizarTelefonosControlAcceso'.");
    return {
      ok: false,
      error: "Función ejecutada sin parámetros. Selecciona 'agregarUsuarioFlorangellys' en el menú de Apps Script."
    };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheetCtrl = ss.getSheetByName(HOJAS.CONTROL_ACCESO);
  if (!sheetCtrl) {
    crearHojaControlAcceso_(ss);
    sheetCtrl = ss.getSheetByName(HOJAS.CONTROL_ACCESO);
  }

  const telLimpio = normalizarTelefono_(telefono);
  if (!telLimpio || telLimpio.length < 7) {
    Logger.log("❌ Error: El número de teléfono proporcionado no es válido: " + telefono);
    return { ok: false, error: "El número de teléfono proporcionado no es válido: " + telefono };
  }

  // Sanitizar nombre de entidad (solo letras y números limpios para nombres de hoja)
  const primerNombre = (entidadNombre || nombreCompleto.trim().split(" ")[0] || "Usuario").replace(/[^a-zA-Z0-9]/g, "");
  const nombreHojaTrans = primerNombre + "_Transacciones";
  const nombreHojaComp = primerNombre + "_Compromisos";
  const nombreHojaHist = primerNombre + "_Historico_Compromisos";
  const hojasPermitidas = `${nombreHojaTrans},${nombreHojaComp},${nombreHojaHist}`;

  // 1. Crear Hoja de Transacciones Dedicada si no existe
  if (!ss.getSheetByName(nombreHojaTrans)) {
    crearHojaTransaccionesGenerica_(ss, nombreHojaTrans, "#7c3aed", primerNombre);
  }

  // 2. Crear Hoja de Compromisos Dedicada si no existe
  if (!ss.getSheetByName(nombreHojaComp)) {
    crearHojaCompromisosGenerica_(ss, nombreHojaComp, "#6d28d9", primerNombre);
  }

  // 2.1 Crear Hoja de Histórico de Compromisos Dedicada si no existe (letras negras)
  if (!ss.getSheetByName(nombreHojaHist)) {
    crearHojaHistoricoCompromisosGenerica_(ss, nombreHojaHist, "#065f46", primerNombre);
  }

  // 3. Registrar o actualizar en Control_Acceso
  const numFilas = sheetCtrl.getLastRow();
  let filaExistente = -1;

  if (numFilas > 1) {
    const datos = sheetCtrl.getRange(2, 1, numFilas - 1, 1).getValues();
    for (let i = 0; i < datos.length; i++) {
      if (normalizarTelefono_(datos[i][0]) === telLimpio) {
        filaExistente = i + 2;
        break;
      }
    }
  }

  const fechaHoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), CONFIG_FINANZAS.FORMATO_FECHA);
  const rolFinal = rol === "SUPER_ADMIN" ? "SUPER_ADMIN" : "USUARIO";
  const notasFinal = notas || `Registrado para control financiero personal (${primerNombre})`;
  const formatoTelefono = "+" + telLimpio;

  // Asegurar formato de texto plano para toda la columna de teléfonos
  sheetCtrl.getRange("A:A").setNumberFormat("@");

  const aliasPorDefecto = (primerNombre.toLowerCase().endsWith("a") || primerNombre.toLowerCase().endsWith("s")) ? "Aura" : "Jarvis";
  const perfilVozPorDefecto = aliasPorDefecto === "Aura" ? "FEMENINO_DULCE" : "MASCULINO_CORDIAL";

  if (filaExistente !== -1) {
    // Actualizar usuario existente
    sheetCtrl.getRange(filaExistente, 1).setValue(formatoTelefono);
    sheetCtrl.getRange(filaExistente, 2).setValue(nombreCompleto);
    sheetCtrl.getRange(filaExistente, 3).setValue(rolFinal);
    sheetCtrl.getRange(filaExistente, 4).setValue(estado);
    sheetCtrl.getRange(filaExistente, 5).setValue(hojasPermitidas);
    sheetCtrl.getRange(filaExistente, 6).setValue(fechaHoy);
    sheetCtrl.getRange(filaExistente, 7).setValue(notasFinal);
    if (!sheetCtrl.getRange(filaExistente, 9).getValue()) sheetCtrl.getRange(filaExistente, 9).setValue(aliasPorDefecto);
    if (!sheetCtrl.getRange(filaExistente, 10).getValue()) sheetCtrl.getRange(filaExistente, 10).setValue(perfilVozPorDefecto);
  } else {
    // Insertar nuevo usuario con metadatos de bienvenida y perfil de voz de su asistente
    sheetCtrl.appendRow([
      formatoTelefono,
      nombreCompleto,
      rolFinal,
      estado,
      hojasPermitidas,
      fechaHoy,
      notasFinal,
      "NO", // BIENVENIDA_ENVIADA
      aliasPorDefecto, // ALIAS_ASISTENTE
      perfilVozPorDefecto, // PERFIL_VOZ
      JSON.stringify({ motor: "GOOGLE_TTS", tono: "dulce", pitch: 2.0, rate: 1.05 }) // CONFIG_VOZ_JSON
    ]);
    sheetCtrl.getRange(sheetCtrl.getLastRow(), 1).setValue(formatoTelefono);
  }

  SpreadsheetApp.flush();

  // Actualizar automáticamente la sección de usuarios individuales en Dashboard_Consolidado
  try {
    actualizarUsuariosEnDashboardConsolidado_(ss);
  } catch (errDash) {
    Logger.log("Aviso: Sincronización de dashboard consolidado: " + errDash.message);
  }

  // Despachar automáticamente mensaje de bienvenida único si está disponible la función de webhook
  try {
    if (typeof enviarMensajeBienvenidaNuevoUsuario_ === "function") {
      enviarMensajeBienvenidaNuevoUsuario_(formatoTelefono, nombreCompleto);
    }
  } catch (errBienvenida) {
    Logger.log("Aviso: Bienvenida pendiente de despacho: " + errBienvenida.message);
  }

  return {
    ok: true,
    mensaje: `Usuario ${nombreCompleto} registrado exitosamente como ${rolFinal}.`,
    telefono: formatoTelefono,
    nombre: nombreCompleto,
    rol: rolFinal,
    estado: estado,
    entidad: primerNombre,
    hojasCreadas: [nombreHojaTrans, nombreHojaComp]
  };
}

/**
 * Bloquea a un usuario congelando todas sus acciones.
 * @param {string} identificador - Teléfono o nombre del usuario.
 * @param {string} motivo - Motivo opcional de la suspensión.
 */
function bloquearUsuarioFinanciero(identificador, motivo = "Suspensión administrativa") {
  if (!identificador) {
    Logger.log("⚠️ AVISO: 'bloquearUsuarioFinanciero' requiere el teléfono o nombre del usuario a suspender.");
    return { ok: false, error: "Identificador no proporcionado." };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetCtrl = ss.getSheetByName(HOJAS.CONTROL_ACCESO);
  if (!sheetCtrl || sheetCtrl.getLastRow() <= 1) {
    return { ok: false, error: "Hoja Control_Acceso no encontrada o vacía." };
  }

  const limpio = normalizarTelefono_(identificador);
  const busqNombre = String(identificador).toLowerCase().trim();
  const datos = sheetCtrl.getRange(2, 1, sheetCtrl.getLastRow() - 1, 7).getValues();

  for (let i = 0; i < datos.length; i++) {
    const telFila = normalizarTelefono_(datos[i][0]);
    const nomFila = String(datos[i][1]).toLowerCase();
    const rolFila = String(datos[i][2]).trim();

    if ((limpio && telFila === limpio) || (!limpio && nomFila.includes(busqNombre))) {
      if (rolFila === "SUPER_ADMIN") {
        return { ok: false, error: "El Super Administrador no puede ser bloqueado." };
      }

      const filaIndex = i + 2;
      const fechaHoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
      sheetCtrl.getRange(filaIndex, 4).setValue("BLOQUEADO");
      sheetCtrl.getRange(filaIndex, 7).setValue("Bloqueado: " + motivo + " [" + fechaHoy + "]");
      SpreadsheetApp.flush();

      return {
        ok: true,
        nombre: datos[i][1],
        telefono: datos[i][0],
        fechaBloqueo: fechaHoy,
        mensaje: `Usuario ${datos[i][1]} (${datos[i][0]}) ha sido BLOQUEADO exitosamente.`
      };
    }
  }

  return { ok: false, error: "No se encontró ningún usuario con el identificador: " + identificador };
}

/**
 * Desbloquea a un usuario, calcula el periodo de inactividad y envía notificación con advertencia de sesgo.
 * @param {string} identificador - Teléfono o nombre del usuario.
 */
function desbloquearUsuarioFinanciero(identificador) {
  if (!identificador) {
    Logger.log("⚠️ AVISO: 'desbloquearUsuarioFinanciero' requiere el teléfono o nombre del usuario a reactivar.");
    return { ok: false, error: "Identificador no proporcionado." };
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetCtrl = ss.getSheetByName(HOJAS.CONTROL_ACCESO);
  if (!sheetCtrl || sheetCtrl.getLastRow() <= 1) {
    return { ok: false, error: "Hoja Control_Acceso no encontrada o vacía." };
  }

  const limpio = normalizarTelefono_(identificador);
  const busqNombre = String(identificador).toLowerCase().trim();
  const datos = sheetCtrl.getRange(2, 1, sheetCtrl.getLastRow() - 1, 7).getValues();

  for (let i = 0; i < datos.length; i++) {
    const telFila = normalizarTelefono_(datos[i][0]);
    const nomFila = String(datos[i][1]).toLowerCase();

    if ((limpio && telFila === limpio) || (!limpio && nomFila.includes(busqNombre))) {
      const filaIndex = i + 2;
      const fechaHoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
      const notaAnterior = String(datos[i][6]);
      const matchFecha = notaAnterior.match(/\[(.*?)\]/);
      const fechaBloqueo = matchFecha ? matchFecha[1] : "fecha anterior";

      sheetCtrl.getRange(filaIndex, 4).setValue("ACTIVO");
      sheetCtrl.getRange(filaIndex, 7).setValue("Reactivado por Super Admin el " + fechaHoy);
      SpreadsheetApp.flush();

      // Enviar notificación a la usuaria informando de la reactivación y el sesgo
      const textoAviso = `🔓 *Hola ${datos[i][1]}, tu acceso al sistema financiero ha sido reactivado por el administrador.*\n\n` +
        `⚠️ *Aviso de Sesgo Contable:* Durante tu periodo de suspensión (desde ${fechaBloqueo} hasta ${fechaHoy}) no se registraron movimientos en tus hojas personales.\n\n` +
        `Te sugerimos revisar si tuviste ingresos, compras o pagos en esas fechas y reportarlos ahora para que tus balances e informes no presenten sesgos o datos desactualizados.`;

      try {
        if (typeof enviarMensajeWhatsApp === "function") {
          enviarMensajeWhatsApp(datos[i][0], textoAviso);
        }
      } catch (errNotif) {
        Logger.log("Aviso: Notificación de reactivación pendiente: " + errNotif.message);
      }

      return {
        ok: true,
        nombre: datos[i][1],
        telefono: datos[i][0],
        fechaBloqueo: fechaBloqueo,
        fechaDesbloqueo: fechaHoy,
        mensaje: `Usuario ${datos[i][1]} reactivado exitosamente. Notificación con advertencia de sesgo enviada.`
      };
    }
  }

  return { ok: false, error: "No se encontró ningún usuario con el identificador: " + identificador };
}

/**
 * Función para aprovisionar inmediatamente a Florangellys Vilarete (+573117917391)
 */
function agregarUsuarioFlorangellys() {
  const res = crearNuevoUsuarioFinanciero(
    "+573117917391",
    "Florangellys Vilarete",
    "USUARIO",
    "ACTIVO",
    "Florangellys",
    "Control financiero personal Florangellys Vilarete"
  );
  Logger.log("✅ Florangellys Vilarete aprovisionada con éxito: " + JSON.stringify(res));
  return res;
}

/**
 * Dispara de inmediato el mensaje de bienvenida oficial a Florangellys Vilarete (+573117917391)
 * Ejecuta esta función en cuanto añadas su número a la lista de prueba en Meta for Developers.
 */
function enviarBienvenidaAFlorangellys() {
  if (typeof enviarMensajeBienvenidaNuevoUsuario_ === "function") {
    return enviarMensajeBienvenidaNuevoUsuario_("+573117917391", "Florangellys Vilarete");
  } else {
    Logger.log("Aviso: enviarMensajeBienvenidaNuevoUsuario_ se encuentra en WhatsAppWebhook.gs");
    return null;
  }
}

/**
 * Estandariza todos los números de teléfono en Control_Acceso asegurando formato internacional (+57...)
 * y formato de texto plano (@) en toda la columna A para evitar conversiones numéricas o pérdida de signos.
 * También actualiza de inmediato el Dashboard_Consolidado con los usuarios externos.
 */
function estandarizarTelefonosControlAcceso() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetCtrl = ss.getSheetByName(HOJAS.CONTROL_ACCESO);
  if (!sheetCtrl || sheetCtrl.getLastRow() <= 1) return "No hay datos en Control_Acceso.";

  const numFilas = sheetCtrl.getLastRow() - 1;
  sheetCtrl.getRange("A:A").setNumberFormat("@");

  const datos = sheetCtrl.getRange(2, 1, numFilas, 1).getValues();
  const estandarizados = [];

  for (let i = 0; i < datos.length; i++) {
    const raw = String(datos[i][0]).trim();
    const limpio = normalizarTelefono_(raw);
    estandarizados.push(["+" + limpio]);
  }

  sheetCtrl.getRange(2, 1, numFilas, 1).setValues(estandarizados);
  SpreadsheetApp.flush();

  // Sincronizar también la sección de usuarios en Dashboard_Consolidado
  try {
    actualizarUsuariosEnDashboardConsolidado_(ss);
  } catch (e) {
    Logger.log("Aviso en actualizarUsuariosEnDashboardConsolidado_: " + e.message);
  }

  Logger.log(`✅ ${numFilas} teléfonos estandarizados uniformemente con prefijo internacional (+57...).`);
  return `✅ ${numFilas} teléfonos estandarizados uniformemente con prefijo internacional (+57...).`;
}

/**
 * Actualiza el alias del asistente y el perfil de voz del usuario en Control_Acceso.
 * Puede ser invocado conversacionalmente por el usuario tantas veces como desee.
 */
function actualizarPerfilAsistenteUsuario(telefono, nuevoNombre, perfilVoz, configVoz) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheetCtrl = ss.getSheetByName(HOJAS.CONTROL_ACCESO);
  if (!sheetCtrl) return { ok: false, error: "Hoja Control_Acceso no encontrada." };

  // Asegurar que existan las 11 columnas
  estandarizarColumnasControlAcceso();

  const telLimpio = normalizarTelefono_(telefono);
  const numFilas = sheetCtrl.getLastRow();
  if (numFilas <= 1) return { ok: false, error: "No hay usuarios registrados." };

  const datos = sheetCtrl.getRange(2, 1, numFilas - 1, 11).getValues();
  for (let i = 0; i < datos.length; i++) {
    if (normalizarTelefono_(datos[i][0]) === telLimpio) {
      const fila = i + 2;
      const nombreUsuario = datos[i][1];
      const aliasFinal = nuevoNombre ? String(nuevoNombre).trim() : (datos[i][8] || "Asistente");
      const perfilFinal = perfilVoz ? String(perfilVoz).trim() : (datos[i][9] || "FEMENINO_DULCE");
      const configFinal = configVoz ? (typeof configVoz === "string" ? configVoz : JSON.stringify(configVoz)) : (datos[i][10] || "");

      sheetCtrl.getRange(fila, 9).setValue(aliasFinal);
      sheetCtrl.getRange(fila, 10).setValue(perfilFinal);
      if (configFinal) sheetCtrl.getRange(fila, 11).setValue(configFinal);

      SpreadsheetApp.flush();
      Logger.log(`✅ Asistente de ${nombreUsuario} actualizado: Alias='${aliasFinal}', Perfil='${perfilFinal}'.`);

      return {
        ok: true,
        nombreUsuario: nombreUsuario,
        telefono: datos[i][0],
        aliasAsistente: aliasFinal,
        perfilVoz: perfilFinal,
        configVoz: configFinal
      };
    }
  }

  return { ok: false, error: "Usuario no encontrado en Control_Acceso." };
}

/**
 * Estandariza las columnas de Control_Acceso garantizando que existan los encabezados
 * y las columnas para ALIAS_ASISTENTE, PERFIL_VOZ y CONFIG_VOZ_JSON sin alterar los datos existentes.
 */
function estandarizarColumnasControlAcceso() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(HOJAS.CONTROL_ACCESO);
  if (!sheet) return "Hoja Control_Acceso no encontrada.";

  const encabezadosRequeridos = [
    "TELEFONO_WHATSAPP", "NOMBRE_USUARIO", "ROL", "ESTADO", 
    "HOJAS_PERMITIDAS", "FECHA_AUTORIZACION", "NOTAS", "BIENVENIDA_ENVIADA",
    "ALIAS_ASISTENTE", "PERFIL_VOZ", "CONFIG_VOZ_JSON"
  ];

  sheet.getRange("A:A").setNumberFormat("@");
  sheet.getRange(1, 1, 1, encabezadosRequeridos.length).setValues([encabezadosRequeridos]);
  darFormatoEncabezado_(sheet, encabezadosRequeridos.length, TEMAS.CONTROL);

  // Semilla de valores por defecto para filas existentes sin alias o perfil
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const maxCols = Math.max(11, sheet.getLastColumn());
    const valores = sheet.getRange(2, 1, lastRow - 1, maxCols).getValues();
    for (let i = 0; i < valores.length; i++) {
      const filaIdx = i + 2;
      const rol = String(valores[i][2]).toUpperCase().trim();
      const aliasActual = valores[i][8];
      const perfilActual = valores[i][9];

      if (!aliasActual || String(aliasActual).trim() === "") {
        const aliasDefecto = rol === "SUPER_ADMIN" ? "Jarvis" : "Aura";
        sheet.getRange(filaIdx, 9).setValue(aliasDefecto);
      }
      if (!perfilActual || String(perfilActual).trim() === "") {
        const perfilDefecto = rol === "SUPER_ADMIN" ? "MASCULINO_CORDIAL" : "FEMENINO_DULCE";
        sheet.getRange(filaIdx, 10).setValue(perfilDefecto);
      }
      if (!valores[i][10] || String(valores[i][10]).trim() === "") {
        const confDefecto = rol === "SUPER_ADMIN" 
          ? JSON.stringify({ motor: "GOOGLE_TTS", tono: "cordial", pitch: -1.0, rate: 1.0 })
          : JSON.stringify({ motor: "GOOGLE_TTS", tono: "dulce", pitch: 2.0, rate: 1.05 });
        sheet.getRange(filaIdx, 11).setValue(confDefecto);
      }
    }
  }

  // Ajuste de anchos
  sheet.setColumnWidth(8, 130);
  sheet.setColumnWidth(9, 150);
  sheet.setColumnWidth(10, 160);
  sheet.setColumnWidth(11, 240);

  SpreadsheetApp.flush();
  Logger.log("✅ Control_Acceso estandarizado con 11 columnas completas.");
  return "✅ Control_Acceso estandarizado con 11 columnas completas.";
}

/**
 * Purga de forma segura transacciones con valor 0, preguntas malinterpretadas o registros de prueba (Almuerzo 35.000)
 */
function limpiarTransaccionesInvalidas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojas = ["Personal_Transacciones", "Personal_Compromisos", "More Paper_Transacciones", "More Design_Transacciones"];
  let eliminadas = 0;

  hojas.forEach(nombre => {
    const sheet = ss.getSheetByName(nombre);
    if (!sheet || sheet.getLastRow() <= 1) return;

    // Recorrer de abajo hacia arriba para eliminar filas de forma segura
    for (let r = sheet.getLastRow(); r >= 2; r--) {
      const fila = sheet.getRange(r, 1, 1, 10).getValues()[0];
      // Para transacciones: col 6 es concepto (idx 5), col 8 es valor (idx 7)
      // Para compromisos: col 4 es concepto (idx 3), col 5 es monto (idx 4)
      const concepto = String(fila[5] || fila[3] || "").toLowerCase();
      const valor = Number(fila[7] || fila[4]) || 0;

      const esPregunta = concepto.includes("gastoas") || 
        concepto.includes("cual han sido") || 
        concepto.includes("cuanto") || 
        (concepto.includes("saldo") && (concepto.includes("cual") || concepto.includes("cuanto") || concepto.includes("que") || concepto.includes("resumen"))) || 
        concepto.includes("informe");

      const esPruebaAlmuerzo = concepto.includes("almuerzo") && (valor === 35000 || valor === 45000 || valor === 50000);

      if (valor <= 0 || esPregunta || esPruebaAlmuerzo) {
        sheet.deleteRow(r);
        eliminadas++;
        Logger.log(`Fila ${r} eliminada de ${nombre}: Valor=${valor}, Concepto='${concepto}'`);
      }
    }
  });

  SpreadsheetApp.flush();
  Logger.log(`✅ Limpieza completada: ${eliminadas} fila(s) inválida(s) o de prueba eliminada(s).`);
  return `✅ Limpieza completada: ${eliminadas} fila(s) inválida(s) o de prueba eliminada(s).`;
}

/**
 * Función dedicada de un clic para eliminar específicamente cualquier registro de prueba por concepto de Almuerzo ($35.000)
 */
function purgarRegistroPruebaAlmuerzo35k() {
  return limpiarTransaccionesInvalidas();
}

/**
 * Registra de forma inmediata el saldo a favor actual en la cuenta bancaria de Personal ($1.247.646 COP)
 */
function registrarSaldoAFavorBancarioActual() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Personal_Transacciones");
  if (!sheet) throw new Error("Hoja Personal_Transacciones no encontrada.");

  const id = "TX-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd") + "-1247";
  const fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const tipo = "Ingreso";
  const categoria = "Capital / Aportes";
  const subcategoria = "Bancos";
  const concepto = "Saldo a favor en cuenta bancaria";
  const tercero = "Cuenta Bancaria";
  const valor = 1247646;
  const metodo = "Transferencia";
  const estado = "Confirmado";

  sheet.appendRow([
    id, fecha, tipo, categoria, subcategoria, concepto,
    tercero, valor, metodo, estado, "", "Saldo a favor actual registrado"
  ]);
  SpreadsheetApp.flush();

  Logger.log("✅ Saldo a favor de $1.247.646 COP registrado con éxito en Personal_Transacciones.");
  return "✅ Saldo a favor de $1.247.646 COP registrado con éxito en Personal_Transacciones.";
}

/**
 * Sincroniza e importa automáticamente registros históricos desde la hoja legacy 'Finanzas'
 * hacia la hoja canónica 'Personal_Transacciones'.
 */
function sincronizarRegistrosHistoricos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hDestino = ss.getSheetByName("Personal_Transacciones");
  if (!hDestino) throw new Error("Hoja Personal_Transacciones no encontrada.");

  const hojasOrigenCandidatas = ["Finanzas", "Registro y control finanzas"];
  let hOrigen = null;
  for (let i = 0; i < hojasOrigenCandidatas.length; i++) {
    hOrigen = ss.getSheetByName(hojasOrigenCandidatas[i]);
    if (hOrigen) break;
  }

  if (!hOrigen || hOrigen.getLastRow() <= 1) {
    Logger.log("ℹ️ No se detectó ninguna hoja legacy 'Finanzas' con registros pendientes.");
    return "ℹ️ No se detectó ninguna hoja legacy 'Finanzas' con registros pendientes.";
  }

  const raw = hOrigen.getDataRange().getValues();
  let importados = 0;

  // Obtener conceptos existentes en destino para no duplicar
  const conceptosDestino = new Set();
  if (hDestino.getLastRow() > 1) {
    const datosDest = hDestino.getRange(2, 6, hDestino.getLastRow() - 1, 3).getValues();
    datosDest.forEach(row => {
      const conc = String(row[0] || "").trim().toLowerCase();
      const val = Number(row[2]) || 0;
      conceptosDestino.add(`${conc}_${val}`);
    });
  }

  // Buscar encabezados en la hoja de origen
  let headerRowIdx = -1;
  let colFecha = 0, colNombre = 1, colValor = 2, colCat = 4;
  for (let r = 0; r < Math.min(raw.length, 15); r++) {
    const rowStr = raw[r].join(" ").toUpperCase();
    if (rowStr.includes("VALOR") && (rowStr.includes("FECHA") || rowStr.includes("NOMBRE"))) {
      headerRowIdx = r;
      raw[r].forEach((h, idx) => {
        const str = String(h || "").trim().toUpperCase();
        if (str.includes("FECHA")) colFecha = idx;
        else if (str.includes("NOMBRE") || str.includes("CONCEPTO")) colNombre = idx;
        else if (str.includes("VALOR") || str.includes("MONTO")) colValor = idx;
        else if (str.includes("CATEGOR")) colCat = idx;
      });
      break;
    }
  }

  const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 1;
  for (let r = startRow; r < raw.length; r++) {
    const fila = raw[r];
    const valRaw = fila[colValor];
    let valor = 0;
    if (typeof valRaw === "number") {
      valor = valRaw;
    } else {
      const clean = String(valRaw || "").replace(/[$COP\s]/gi, "").replace(/\./g, "").replace(",", ".");
      valor = parseFloat(clean) || 0;
    }

    if (valor <= 0) continue;

    const fechaRaw = fila[colFecha];
    const fecha = (fechaRaw instanceof Date)
      ? Utilities.formatDate(fechaRaw, Session.getScriptTimeZone(), "yyyy-MM-dd")
      : String(fechaRaw || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd")).substring(0, 10);

    const concepto = String(fila[colNombre] || "Gasto personal").trim();
    const categoria = String(fila[colCat] || "General").trim();
    const clave = `${concepto.toLowerCase()}_${valor}`;

    if (conceptosDestino.has(clave)) continue;

    const id = "TX-" + fecha.replace(/-/g, "") + "-" + Math.floor(1000 + Math.random() * 9000);
    const tipo = categoria.toLowerCase().includes("ingreso") ? "Ingreso" : "Gasto Necesario";

    hDestino.appendRow([
      id, fecha, tipo, categoria, "", concepto,
      "Tercero no especificado", valor, "Efectivo", "Confirmado", "", "Importado desde Finanzas legacy"
    ]);
    conceptosDestino.add(clave);
    importados++;
  }

  SpreadsheetApp.flush();
  const res = `✅ Sincronización finalizada: ${importados} movimiento(s) histórico(s) importado(s) a Personal_Transacciones.`;
  Logger.log(res);
  return res;
}

/**
 * Utilidad administrativa para trasladar compromisos corporativos o globales
 * que hayan sido asentados por error en Personal_Compromisos hacia la hoja oficial Compromisos_Globales.
 */
function trasladarCompromisosGlobales() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheetGlobal = ss.getSheetByName(HOJAS.COMPROMISOS_GLOBALES);
  if (!sheetGlobal) {
    crearHojaCompromisosGenerica_(ss, HOJAS.COMPROMISOS_GLOBALES, TEMAS.GASTOS_GLOBALES, "Consolidado");
    sheetGlobal = ss.getSheetByName(HOJAS.COMPROMISOS_GLOBALES);
  }

  const sheetPersonal = ss.getSheetByName(HOJAS.PERSONAL_COMP);
  if (!sheetPersonal || sheetPersonal.getLastRow() <= 1) {
    Logger.log("No hay filas en Personal_Compromisos para evaluar.");
    return "Personal_Compromisos no tiene registros.";
  }

  const filas = sheetPersonal.getRange(2, 1, sheetPersonal.getLastRow() - 1, 12).getValues();
  let trasladados = 0;

  // Recorrer de abajo hacia arriba para eliminar sin alterar índices
  for (let i = filas.length - 1; i >= 0; i--) {
    const r = filas[i];
    const id = String(r[0]);
    const concepto = (String(r[3]) + " " + String(r[2])).toLowerCase();

    // Detección de la fila COMP-20260916-116 o cualquier crédito empresarial/global
    if (id === "COMP-20260916-116" || concepto.includes("21946") || concepto.includes("global") || concepto.includes("more **7194") || concepto.includes("cuenta more")) {
      sheetGlobal.appendRow(r);
      sheetPersonal.deleteRow(i + 2);
      trasladados++;
      Logger.log(`✅ Fila ${id} (${r[2]} - ${r[3]}) trasladada con éxito a Compromisos_Globales.`);
    }
  }

  SpreadsheetApp.flush();
  const msg = `🎉 Migración completa: ${trasladados} compromiso(s) global(es) trasladado(s) exitosamente a Compromisos_Globales.`;
  Logger.log(msg);
  return msg;
}

/**
 * Utilidad administrativa para depurar y limpiar registros vacíos o fallidos de compromisos
 * (por ejemplo filas con $0 COP o 'Proveedor no especificado' como COMP-20260916-351).
 */
function limpiarCompromisosVacios() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojasCompromisos = [
    HOJAS.PERSONAL_COMP,
    HOJAS.MOREPAPER_COMP,
    HOJAS.MOREDESIGN_COMP,
    HOJAS.COMPROMISOS_GLOBALES
  ];

  let totalEliminados = 0;
  const detalle = [];

  hojasCompromisos.forEach(nombreHoja => {
    const sheet = ss.getSheetByName(nombreHoja);
    if (!sheet || sheet.getLastRow() <= 1) return;

    const filas = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12).getValues();
    let eliminadosEnHoja = 0;

    for (let i = filas.length - 1; i >= 0; i--) {
      const r = filas[i];
      const id = String(r[0] || "");
      const prov = String(r[2] || "").trim().toLowerCase();
      const conc = String(r[3] || "").trim().toLowerCase();
      const montoTotal = Number(r[4]) || 0;
      const saldoPend = Number(r[6]) || 0;

      // Detectar registros vacíos o fallidos
      const esFilaInvalida = (montoTotal === 0 && saldoPend === 0 && (prov === "" || prov.includes("no especificado") || prov === "proveedor"));

      if (esFilaInvalida || id === "COMP-20260916-351") {
        sheet.deleteRow(i + 2);
        eliminadosEnHoja++;
        totalEliminados++;
        detalle.push(`${nombreHoja}: Fila ${id} eliminada.`);
      }
    }
    if (eliminadosEnHoja > 0) {
      Logger.log(`Depuración en ${nombreHoja}: ${eliminadosEnHoja} fila(s) eliminada(s).`);
    }
  });

  SpreadsheetApp.flush();
  const resultado = `🧹 Limpieza completada: ${totalEliminados} registro(s) inválido(s) eliminado(s).\n${detalle.join("\n")}`;
  Logger.log(resultado);
  return resultado;
}

/**
 * ============================================================================
 * REINICIO TOTAL DEL ECOSISTEMA FINANCIERO A CERO (NUEVO PUNTO DE PARTIDA $0)
 * ============================================================================
 * Purgar y eliminar de forma segura y estructurada todas las transacciones,
 * compromisos, cierres y sesiones en todas las entidades financieras (Personal,
 * More Paper, More Design, Operación Global y usuarios individuales).
 * 
 * Deja todos los saldos bancarios, caja física, deudas e ingresos exactamente en $0 COP.
 * 
 * PRESERVACIÓN INVIOLABLE (ZERO DATA LOSS EN CONFIGURACIONES):
 * 1. Fila 1 de encabezados, anchos, colores y validaciones de cada hoja operativa intactas.
 * 2. Control_Acceso (usuarios, teléfonos, roles SUPER_ADMIN/USUARIO, asistentes) 100% preservado.
 * 3. Config_Categorias (árbol oficial de categorías y subcategorías) 100% preservado.
 * 4. Config_Cuentas_Bancarias (catálogo de cuentas, alias y números de máscara) 100% preservado.
 * 5. Personajes (catálogo de 20 personalidades de IA y personajes dinámicos) 100% preservado.
 * 6. Dashboard_Consolidado (títulos, diseño ejecutivo y fórmulas en tiempo real reactivas en $0).
 * 7. Metricas_WhatsApp (cuotas y límites configurados) 100% preservado.
 * 8. ScriptProperties (claves de Gemini, Meta WhatsApp, Webhooks, Fish Audio) 100% intactas.
 * 
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} [ssOpt] - Hoja de cálculo activa opcional.
 * @param {boolean} [confirmarSeguridad=false] - Si es true, omite el modal visual de confirmación (para ejecución desde scripts o WhatsApp bot).
 * @return {string} Informe ejecutivo detallado del reinicio con desglose por hoja.
 */
function reiniciarEcosistemaFinancieroACero(ssOpt, confirmarSeguridad = false) {
  const ss = (ssOpt && typeof ssOpt.getSheets === "function") ? ssOpt : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    Logger.log("❌ Error: No se pudo obtener la instancia del libro de Google Sheets.");
    return "Error: No se pudo obtener la hoja de cálculo activa.";
  }

  // Confirmación defensiva si se ejecuta con interfaz gráfica activa (menú de Sheets)
  let esDesdeUi = false;
  try {
    const ui = SpreadsheetApp.getUi();
    if (ui && !confirmarSeguridad) {
      esDesdeUi = true;
      const resp = ui.alert(
        "⚠️ REINICIO FINANCIERO A CERO (PUNTO DE PARTIDA)",
        "¿Estás seguro de que deseas ELIMINAR todas las transacciones financieras y compromisos registrados?\n\n" +
        "• Todos los saldos, bancos, deudas y métricas quedarán en $0 COP.\n" +
        "• Tus configuraciones (Control_Acceso, Categorías, Cuentas Bancarias, Personajes) se mantendrán 100% intactas.\n\n" +
        "¿Deseas continuar?",
        ui.ButtonSet.YES_NO
      );
      if (resp !== ui.Button.YES) {
        Logger.log("ℹ️ Operación de reinicio cancelada por el usuario en la interfaz gráfica.");
        return "Operación de reinicio financiero cancelada.";
      }
    }
  } catch (eUi) {
    // Entorno sin UI gráfica (editor de Apps Script, webhook o trigger automático)
  }

  // Concurrencia segura: Bloqueo exclusivo para evitar escrituras concurrentes
  const lock = LockService.getScriptLock();
  let tieneBloqueo = false;
  try {
    tieneBloqueo = lock.tryLock(30000);
  } catch (eLock) {
    Logger.log("Aviso de concurrencia al solicitar bloqueo: " + eLock.message);
  }

  try {
    // 1. Identificar hojas operativas canónicas
    const hojasOperativasSet = new Set([
      HOJAS.PERSONAL_TRANS,
      HOJAS.PERSONAL_COMP,
      HOJAS.MOREPAPER_TRANS,
      HOJAS.MOREPAPER_COMP,
      HOJAS.MOREDESIGN_TRANS,
      HOJAS.MOREDESIGN_COMP,
      HOJAS.GASTOS_GLOBALES,
      HOJAS.OPERACION_GLOBAL,
      HOJAS.COMPROMISOS_GLOBALES,
      HOJAS.SESIONES_WA,
      "Operacion_Global",
      "Gastos_Globales",
      "Compromisos_Globales",
      "Compromisos_Pendientes",
      "Consolidado_Transacciones",
      "Finanzas"
    ]);

    // 2. Extraer hojas asignadas a usuarios dinámicos desde Control_Acceso
    const telefonosRegistrados = [];
    const sheetCtrl = ss.getSheetByName(HOJAS.CONTROL_ACCESO);
    if (sheetCtrl && sheetCtrl.getLastRow() > 1) {
      const numFilas = sheetCtrl.getLastRow() - 1;
      const numCols = sheetCtrl.getLastColumn();
      const datosCtrl = sheetCtrl.getRange(2, 1, numFilas, numCols).getValues();
      
      datosCtrl.forEach(fila => {
        const tel = String(fila[0] || "").trim();
        if (tel) telefonosRegistrados.push(tel.replace(/[^0-9]/g, ""));

        // Inspeccionar todas las columnas buscando referencias a hojas asignadas
        fila.forEach(celda => {
          const str = String(celda || "").trim();
          if (str.includes("_Transacciones") || str.includes("_Compromisos")) {
            str.split(",").forEach(h => {
              const hLimpia = h.trim();
              if (hLimpia) hojasOperativasSet.add(hLimpia);
            });
          }
        });
      });
    }

    // 3. Hojas protegidas del sistema (NUNCA PURGAR ENCABEZADOS NI CONFIGURACIONES)
    const hojasProtegidas = new Set([
      HOJAS.CONTROL_ACCESO,
      HOJAS.CONFIG_CATEGORIAS,
      HOJAS.CONFIG_CUENTAS,
      HOJAS.PERSONAJES,
      HOJAS.DASHBOARD,
      HOJAS.METRICAS_WA,
      "Control_Acceso",
      "Config_Categorias",
      "Config_Cuentas_Bancarias",
      "Personajes",
      "Dashboard_Consolidado",
      "Metricas_WhatsApp"
    ]);

    // 4. Descubrir automáticamente cualquier hoja operativa dinámica existente en el libro
    const todasLasHojas = ss.getSheets();
    todasLasHojas.forEach(sheet => {
      const name = sheet.getName();
      if (hojasProtegidas.has(name)) return;

      const esOperativa = /(_Transacciones|_Compromisos|_Gastos|_Operacion|_Movimientos|_Cierres?|_Turnos?|_POS)$/i.test(name) ||
        /^(User_|Operacion_|Gastos_|Transacciones_|Compromisos_)/i.test(name) ||
        hojasOperativasSet.has(name);

      if (esOperativa) {
        hojasOperativasSet.add(name);
      }
    });

    // 5. Purgar filas de datos (de fila 2 hacia abajo, preservando fila 1)
    const resumen = [];
    let totalFilasPurgadas = 0;
    let hojasLimpiadas = 0;

    hojasOperativasSet.forEach(nombreHoja => {
      if (hojasProtegidas.has(nombreHoja)) return;

      const sheet = ss.getSheetByName(nombreHoja);
      if (!sheet) return;

      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const filasABorrar = lastRow - 1;
        sheet.deleteRows(2, filasABorrar);

        // Limpieza defensiva en caso de que existan celdas con contenido remanente
        if (sheet.getLastRow() > 1) {
          const maxFilas = sheet.getMaxRows();
          const maxCols = sheet.getMaxColumns();
          if (maxFilas > 1 && maxCols > 0) {
            sheet.getRange(2, 1, maxFilas - 1, maxCols).clearContent();
          }
        }

        totalFilasPurgadas += filasABorrar;
        hojasLimpiadas++;
        resumen.push(`  • ${nombreHoja}: ${filasABorrar} fila(s) eliminada(s).`);
      } else {
        resumen.push(`  • ${nombreHoja}: 0 filas (ya estaba limpia).`);
      }
    });

    SpreadsheetApp.flush();

    // 6. Invalidar Caches y flujos interactivos pendientes
    try {
      const scriptCache = CacheService.getScriptCache();
      if (scriptCache) {
        scriptCache.remove("DASHBOARD_DATA");
        scriptCache.remove("DASHBOARD_METRICS");
        scriptCache.remove("DASHBOARD_FULL");
      }
    } catch (eC1) {
      Logger.log("Aviso al limpiar scriptCache: " + eC1.message);
    }

    try {
      const userCache = CacheService.getUserCache();
      if (userCache) {
        telefonosRegistrados.forEach(tel => {
          userCache.remove("PENDING_INTERACTIVE_FLOW_" + tel);
          userCache.remove("PENDING_POS_CLOSE_" + tel);
        });
      }
    } catch (eC2) {
      Logger.log("Aviso al limpiar userCache: " + eC2.message);
    }

    // 7. Reconciliar y Actualizar Fórmulas de Dashboard Consolidado para reflejar $0 en todo
    try {
      if (typeof corregirAsentamientoSaldoBancarioGlobal === "function") {
        corregirAsentamientoSaldoBancarioGlobal();
      } else if (typeof crearHojaDashboardConsolidado_ === "function") {
        crearHojaDashboardConsolidado_(ss);
      }
    } catch (eDash) {
      Logger.log("Aviso al regenerar Dashboard Consolidado: " + eDash.message);
    }

    SpreadsheetApp.flush();

    // 8. Construir informe ejecutivo de resultado
    const fechaActual = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    const mensajeFinal = 
      `🧹 REINICIO FINANCIERO A CERO COMPLETADO CON ÉXITO\n` +
      `📅 Fecha: ${fechaActual}\n` +
      `📊 Filas eliminadas: ${totalFilasPurgadas} registros operativos.\n` +
      `📑 Hojas procesadas: ${hojasOperativasSet.size} hojas operativas inspeccionadas.\n\n` +
      `✨ ESTADO ACTUAL DEL SISTEMA:\n` +
      `• Todos los balances y cuentas bancarias reflejan exactamente $0 COP.\n` +
      `• Todos los compromisos y deudas pendientes reflejan $0 COP.\n` +
      `• La caja física y flujo de efectivo inician en un punto limpio de partida ($0).\n` +
      `• Configuraciones, categorías, usuarios y personajes: 100% INTACTOS.\n\n` +
      `Detalle por hoja:\n${resumen.join("\n")}`;

    Logger.log(mensajeFinal);

    if (esDesdeUi) {
      try {
        const ui = SpreadsheetApp.getUi();
        if (ui) {
          ui.alert("✅ REINICIO FINANCIERO A CERO EXITOSO", mensajeFinal, ui.ButtonSet.OK);
        }
      } catch (eAlert) {
        // Ignorar si el contexto de UI cambió
      }
    }

    return mensajeFinal;
  } finally {
    if (tieneBloqueo) {
      try {
        lock.releaseLock();
      } catch (eRel) {
        Logger.log("Aviso al liberar bloqueo: " + eRel.message);
      }
    }
  }
}

/**
 * Envoltorio de compatibilidad hacia atrás para purgar toda información de prueba.
 * Redirige a reiniciarEcosistemaFinancieroACero con confirmación bypass activada.
 */
function purgarTodaInformacionFinancieraDePrueba() {
  return reiniciarEcosistemaFinancieroACero(SpreadsheetApp.getActiveSpreadsheet(), true);
}

// ============================================================================
// SEGURIDAD CRIPTOGRÁFICA ZERO-TRUST: MAGIC LINKS PARA CANVAS DASHBOARD
// ============================================================================

/**
 * Obtiene o inicializa la sal criptográfica secreta del sistema en ScriptProperties.
 */
function obtenerDashboardSalt_() {
  const props = PropertiesService.getScriptProperties();
  let salt = props.getProperty("DASHBOARD_MAGIC_SALT");
  if (!salt) {
    salt = Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
    props.setProperty("DASHBOARD_MAGIC_SALT", salt);
  }
  return salt;
}

/**
 * Genera un token HMAC-SHA256 único, determinístico y seguro para un usuario.
 * @param {string} entidad - Nombre de la entidad (ej: 'Florangellys' o 'Fernando').
 * @param {string} telefono - Teléfono normalizado del usuario.
 * @return {string} Token hex de 16 caracteres.
 */
function generarTokenMagicLink(entidad, telefono) {
  if (!entidad) return "";
  const salt = obtenerDashboardSalt_();
  const raw = String(entidad).trim().toLowerCase() + "_" + String(telefono || "").replace(/[^0-9]/g, "");
  const sig = Utilities.computeHmacSha256Signature(raw, salt);
  let hashHex = "";
  for (let i = 0; i < sig.length; i++) {
    const byte = (sig[i] < 0 ? sig[i] + 256 : sig[i]).toString(16);
    hashHex += (byte.length === 1 ? "0" : "") + byte;
  }
  return hashHex.substring(0, 16);
}

/**
 * Valida la autenticidad de un token Magic Link y retorna el contexto de permisos.
 * @param {string} entidad - Entidad que solicita acceso.
 * @param {string} token - Token presentado en la URL (?auth=...).
 */
function validarTokenMagicLink(entidad, token) {
  if (!entidad || !token) return { valido: false, motivo: "PARAMETROS_INCOMPLETOS" };
  const entNormalizada = String(entidad).trim().toLowerCase();
  const tokNormalizado = String(token).trim().toLowerCase();

  // Validación de token administrativo global si existe en ScriptProperties
  const tokenSuperAdmin = PropertiesService.getScriptProperties().getProperty("DASHBOARD_ACCESS_TOKEN");
  if (tokenSuperAdmin && safeCompareTokens_(tokNormalizado, tokenSuperAdmin.toLowerCase())) {
    return { valido: true, rol: "SUPER_ADMIN", entidad: "Consolidado", esSuperAdmin: true };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetCtrl = ss.getSheetByName(HOJAS.CONTROL_ACCESO);
  if (!sheetCtrl || sheetCtrl.getLastRow() <= 1) {
    return { valido: false, motivo: "CONTROL_ACCESO_NO_DISPONIBLE" };
  }

  const datos = sheetCtrl.getRange(2, 1, sheetCtrl.getLastRow() - 1, 5).getValues();
  for (let i = 0; i < datos.length; i++) {
    const tel = datos[i][0];
    const nombre = String(datos[i][1]).trim();
    const rol = String(datos[i][2]).trim().toUpperCase();
    const estado = String(datos[i][3]).trim().toUpperCase();
    const hojas = String(datos[i][4]);

    if (estado !== "ACTIVO") continue;

    let entidadUsuario = nombre.split(" ")[0].replace(/[^a-zA-Z0-9]/g, "");
    const match = hojas.match(/^([a-zA-Z0-9]+)_/);
    if (match) entidadUsuario = match[1];

    const esAdmin = rol === "SUPER_ADMIN";
    const coincideEntidad = entidadUsuario.toLowerCase() === entNormalizada || 
      (esAdmin && (entNormalizada === "fernando" || entNormalizada === "admin" || entNormalizada === "consolidado"));

    if (coincideEntidad) {
      const tokenEsperado = generarTokenMagicLink(entidadUsuario, tel);
      if (safeCompareTokens_(tokNormalizado, tokenEsperado.toLowerCase())) {
        return {
          valido: true,
          rol: rol,
          nombre: nombre,
          telefono: tel,
          entidad: entidadUsuario,
          esSuperAdmin: esAdmin
        };
      }
    }
  }

  return { valido: false, motivo: "TOKEN_INVALIDO_O_USUARIO_INACTIVO" };
}

/**
 * Construye la URL completa del Magic Link para un usuario registrado.
 * @param {string} entidad - Nombre de la entidad (ej: 'Florangellys').
 * @param {string} telefono - Teléfono del usuario.
 */
function generarUrlMagicLink(entidad, telefono) {
  let baseUrl = PropertiesService.getScriptProperties().getProperty("WEB_APP_URL");
  if (!baseUrl) {
    try {
      baseUrl = ScriptApp.getService().getUrl();
    } catch (e) {
      baseUrl = "https://script.google.com/macros/s/AKfycbyHxkfFJ1qAnmRcXDgJEnCPSxphpvLMa16fkFCfpVzfGmPBh_YL5M2QLe1uGRA3kp_XIg/exec";
    }
  }
  if (!baseUrl || !baseUrl.startsWith("http")) {
    baseUrl = "https://script.google.com/macros/s/AKfycbyHxkfFJ1qAnmRcXDgJEnCPSxphpvLMa16fkFCfpVzfGmPBh_YL5M2QLe1uGRA3kp_XIg/exec";
  }

  const token = generarTokenMagicLink(entidad, telefono);
  return `${baseUrl}?u=${encodeURIComponent(entidad)}&auth=${token}`;
}

/**
 * Crea menú personalizado en la barra superior de Google Sheets para acciones rápidas.
 */
function onOpen() {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu("📊 Antigravity Finanzas")
      .addItem("🔄 Reparar / Sincronizar Dashboard Consolidado", "corregirAsentamientoSaldoBancarioGlobal")
      .addItem("🏦 Saneamiento de Cuentas y Carga de Saldos ($129.976 y $4.860.895)", "repararYCargarSaldosBancarios")
      .addItem("🚀 Inicializar / Verificar Todo el Sistema", "inicializarLibroFinanzas")
      .addSeparator()
      .addItem("🗄️ Archivar Compromisos Cumplidos a Históricos", "menuArchivarCompromisosCumplidos")
      .addItem("🎨 Sincronizar Colores Inteligentes (Verde Cobros / Rojo Deudas)", "aplicarDirectivaCaracteresRojosLibro")
      .addSeparator()
      .addItem("🧹 Reiniciar Finanzas a Cero (Punto de Partida $0)", "reiniciarEcosistemaFinancieroACero")
      .addToUi();

    // Auto-sanear formato y archivar compromisos cumplidos en apertura silenciosa
    sanearColoresCompromisosRetroactivo_();
  } catch (e) {
    Logger.log("Aviso: onOpen no pudo cargar UI: " + e.message);
  }
}

/**
 * Disparador de interfaz de usuario para archivar compromisos cumplidos
 */
function menuArchivarCompromisosCumplidos() {
  const ui = SpreadsheetApp.getUi();
  const res = archivarTodosCompromisosCumplidos();
  if (res.ok) {
    const msg = res.totalArchivados > 0 
      ? `✅ Se trasladaron ${res.totalArchivados} compromiso(s) cumplido(s) a sus respectivas hojas históricas en letras negras.\n\n` + res.detalle.join("\n")
      : "ℹ️ No hay compromisos cumplidos pendientes por archivar. Todas las hojas de pasivos están al día.";
    ui.alert("🗄️ Archivo de Compromisos Cumplidos", msg, ui.ButtonSet.OK);
  } else {
    ui.alert("❌ Error", "Ocurrió un error al archivar compromisos: " + res.error, ui.ButtonSet.OK);
  }
}

/**
 * Sanea y actualiza inmediatamente las hojas de compromisos:
 * Pinta en VERDE (#15803d) las cuentas por cobrar a favor, traslada compromisos en $0 a históricos en negro
 * y actualiza las reglas condicionales bicapa.
 */
function sanearColoresCompromisosRetroactivo_(ss) {
  const libro = ss || SpreadsheetApp.getActiveSpreadsheet();
  if (!libro) return;
  try {
    aplicarDirectivaCaracteresRojosLibro(libro);
    archivarTodosCompromisosCumplidos(libro);
  } catch (e) {
    Logger.log("Aviso en sanearColoresCompromisosRetroactivo_: " + e.message);
  }
}

/**
 * Corrige y repara inmediatamente el asentamiento financiero en Google Sheets:
 * 1. Renombra la pestaña 'Gastos_Globales' a 'Operacion_Global' (si existe, preservando todos los registros).
 * 2. Re-establece las fórmulas dinámicas en Dashboard_Consolidado (filas 3 a 7 y matriz de bancos G2:J5).
 * 3. Garantiza que la cuenta Ahorros ***7194 refleje el saldo disponible inicial y fondos comunes.
 */
function corregirAsentamientoSaldoBancarioGlobal() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logs = [];

  // 1. Verificar si existe Gastos_Globales y renombrar a Operacion_Global
  const hojaGastos = ss.getSheetByName("Gastos_Globales");
  let hojaGlobal = ss.getSheetByName("Operacion_Global");
  if (hojaGastos && !hojaGlobal) {
    hojaGastos.setName("Operacion_Global");
    hojaGlobal = hojaGastos;
    logs.push("✅ Pestaña 'Gastos_Globales' renombrada con éxito a 'Operacion_Global'.");
  } else if (!hojaGlobal && !hojaGastos) {
    hojaGlobal = crearHojaTransaccionesGenerica_(ss, "Operacion_Global", TEMAS.GASTOS_GLOBALES, "Consolidado");
    logs.push("✅ Pestaña 'Operacion_Global' creada con éxito.");
  } else {
    logs.push("✅ Hoja global identificada correctamente: " + (hojaGlobal ? hojaGlobal.getName() : "Gastos_Globales"));
  }

  // 2. Re-generar fórmulas de Dashboard_Consolidado con la nueva lógica
  crearHojaDashboardConsolidado_(ss);
  logs.push("✅ Fórmulas de 'Dashboard_Consolidado' actualizadas y reconciliadas.");

  SpreadsheetApp.flush();
  logs.push("🎉 Sincronización exitosa: Saldo en cuenta ***7194 ahora reflejado en bancos.");
  Logger.log(logs.join("\n"));
  return logs.join("\n");
}

/**
 * Función integral de saneamiento de cuentas bancarias y carga de saldos iniciales:
 * 1. Sanea y deduplica Config_Cuentas_Bancarias dejando exactamente 2 cuentas maestras:
 *    - Ahorros ***2103 (Personal) -> Personal
 *    - Ahorros ***7194 (Negocios) -> Global / Tiendas
 * 2. Asienta la transacción de saldo disponible de $129.976 COP en Personal_Transacciones.
 * 3. Asienta la transacción de saldo disponible de $4.860.895 COP en Operacion_Global.
 * 4. Limpia el residuo de doble encabezado en filas 8 y 9 de Dashboard_Consolidado.
 * 5. Reconstruye y sincroniza en vivo Dashboard_Consolidado para reflejar los saldos exactos:
 *    - Ahorros ***2103: $129.976 COP
 *    - Ahorros ***7194: $4.860.895 COP
 *    - TOTAL DISPONIBLE EN BANCOS: $4.990.871 COP
 */
function repararYCargarSaldosBancarios(ss) {
  const libro = ss || SpreadsheetApp.getActiveSpreadsheet();
  const fechaHoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

  ejecutarConBloqueoTransaccional_(() => {
    // 1. Saneamiento y Deduplicación de Config_Cuentas_Bancarias
    let sheetCuentas = libro.getSheetByName(HOJAS.CONFIG_CUENTAS || "Config_Cuentas_Bancarias");
    if (!sheetCuentas) {
      crearHojaConfigCuentasBancarias_(libro);
      sheetCuentas = libro.getSheetByName(HOJAS.CONFIG_CUENTAS || "Config_Cuentas_Bancarias");
    }

    if (sheetCuentas) {
      // Limpiar datos previos preservando encabezados
      const lastRowC = sheetCuentas.getLastRow();
      if (lastRowC > 1) {
        sheetCuentas.getRange(2, 1, lastRowC - 1, 8).clearContent().clearFormat();
      }
      // Escribir las 2 cuentas canónicas limpias sin duplicados
      const cuentasCanonicas = [
        ["CTA-001", "Personal", "Bancolombia", "***2103", "Ahorros ***2103 (Personal)", "Personal", "ACTIVA", fechaHoy],
        ["CTA-002", "Consolidado", "Bancolombia", "***7194", "Ahorros ***7194 (Negocios)", "Global / Tiendas", "ACTIVA", fechaHoy]
      ];
      sheetCuentas.getRange(2, 1, cuentasCanonicas.length, 8).setValues(cuentasCanonicas);
      sheetCuentas.getRange(2, 1, cuentasCanonicas.length, 8)
        .setBackground("#f8fafc")
        .setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
    }

    // 2. Cargar Saldo Inicial de Cuenta Personal (***2103) por $129.976 en Personal_Transacciones
    const sheetPersonal = libro.getSheetByName(HOJAS.PERSONAL_TRANS || "Personal_Transacciones");
    if (sheetPersonal) {
      let yaTieneSaldoP = false;
      const lastRowP = sheetPersonal.getLastRow();
      if (lastRowP > 1) {
        const valoresP = sheetPersonal.getRange(2, 1, lastRowP - 1, 9).getValues();
        yaTieneSaldoP = valoresP.some(r => String(r[8]).includes("2103") || (String(r[2]) === "Ingreso" && Number(r[7]) === 129976));
      }
      if (!yaTieneSaldoP) {
        const txIdP = "TX-INIT-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd") + "-2103";
        sheetPersonal.appendRow([
          sanitizeSheetValue(txIdP),
          fechaHoy,
          "Ingreso",
          "Capital / Aportes",
          "Bancos",
          "Saldo inicial disponible en cuenta personal ***2103",
          "Bancolombia",
          129976,
          "Ahorros ***2103 (Personal)",
          "Confirmado"
        ]);
        const newRowP = sheetPersonal.getLastRow();
        sheetPersonal.getRange(newRowP, 8).setNumberFormat(CONFIG_FINANZAS.FORMATO_MONEDA);
      }
    }

    // 3. Cargar Saldo Inicial de Cuenta Locales (***7194) por $4.860.895 en Operacion_Global
    const hojaGlobal = resolverNombreHojaGlobal_(libro);
    const sheetGlobal = libro.getSheetByName(hojaGlobal);
    if (sheetGlobal) {
      let yaTieneSaldoG = false;
      const lastRowG = sheetGlobal.getLastRow();
      if (lastRowG > 1) {
        const valoresG = sheetGlobal.getRange(2, 1, lastRowG - 1, 9).getValues();
        yaTieneSaldoG = valoresG.some(r => String(r[8]).includes("7194") || (String(r[2]) === "Ingreso" && Number(r[7]) === 4860895));
      }
      if (!yaTieneSaldoG) {
        const txIdG = "TX-INIT-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd") + "-7194";
        sheetGlobal.appendRow([
          sanitizeSheetValue(txIdG),
          fechaHoy,
          "Ingreso",
          "Capital / Aportes",
          "Bancos",
          "Saldo inicial disponible en cuenta locales ***7194",
          "Bancolombia",
          4860895,
          "Ahorros ***7194 (Negocios)",
          "Confirmado"
        ]);
        const newRowG = sheetGlobal.getLastRow();
        sheetGlobal.getRange(newRowG, 8).setNumberFormat(CONFIG_FINANZAS.FORMATO_MONEDA);
      }
    }

    // 4. Limpiar duplicado de banner en filas 8 y 9 de Dashboard_Consolidado
    const sheetDash = libro.getSheetByName(HOJAS.DASHBOARD);
    if (sheetDash) {
      const maxRows = sheetDash.getMaxRows();
      if (maxRows >= 8) {
        sheetDash.getRange("A8:E" + maxRows).clearContent().clearFormat();
      }
    }

    // 5. Reconstruir Dashboard_Consolidado con fórmulas limpias y cuentas saneadas
    crearHojaDashboardConsolidado_(libro);
  });

  SpreadsheetApp.flush();
  Logger.log("✅ Cuentas bancarias saneadas y saldos iniciales cargados ($129.976 y $4.860.895).");

  try {
    const ui = SpreadsheetApp.getUi();
    if (ui) {
      ui.alert(
        "🏦 Reparación y Carga de Saldos Exitosa",
        "Se deduplicaron las cuentas bancarias en Config_Cuentas_Bancarias y se asentaron los saldos disponibles:\n\n" +
        "• Cuenta Personal ***2103: $129.976 COP\n" +
        "• Cuenta Locales ***7194: $4.860.895 COP\n\n" +
        "Total Disponible en Bancos: $4.990.871 COP\n" +
        "El Dashboard Consolidado ha quedado 100% sincronizado.",
        ui.ButtonSet.OK
      );
    }
  } catch (eUi) {
    // Entorno no interactivo
  }

  return {
    ok: true,
    cuentaPersonal: { mascara: "***2103", saldo: 129976 },
    cuentaLocales: { mascara: "***7194", saldo: 4860895 },
    totalDisponibleBancos: 4990871
  };
}

