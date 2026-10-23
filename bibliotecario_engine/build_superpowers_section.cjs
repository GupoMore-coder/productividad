/**
 * Generador y validador de la sección de los 5 Superpoderes y Consolidado Diario para GAS
 */
const fs = require('fs');
const path = require('path');

function cleanModuleContent(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Elimina module.exports
  content = content.replace(/module\.exports\s*=\s*\{[\s\S]*?\};?/g, '');
  // Evita re-declaraciones de const SHORT_BASE si ya existe
  content = content.replace(/const\s+SHORT_BASE\s*=\s*['"][^'"]+['"];?/g, '// SHORT_BASE provisto globalmente');
  return content.trim();
}

const calcCode = cleanModuleContent(path.join(__dirname, 'orthopedic_clinical_calculators.cjs'));
const preopCode = cleanModuleContent(path.join(__dirname, 'preoperative_copilot.cjs'));
const implantCode = cleanModuleContent(path.join(__dirname, 'implant_technical_engine.cjs'));
const consultCode = cleanModuleContent(path.join(__dirname, 'clinical_emergency_consult_engine.cjs'));
const openAccessCode = cleanModuleContent(path.join(__dirname, 'open_access_tracker_engine.cjs'));

const gasSpecificHelpers = `
/**
 * ============================================================================
 * 🌟 ADAPTADORES GOOGLE APPS SCRIPT: 5 SUPERPODERES & CONSOLIDADO 18:00
 * ============================================================================
 */

/**
 * Registra una donación o aporte en la pestaña Aportes_Diarios sin alertar de inmediato
 */
function registrarAporteDiarioGAS(donorPhone, donorName, fileName, size) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = CONFIG.SHEET_APORTES_DIARIOS || 'Aportes_Diarios';
    let sheetAportes = getSheetFlexible(ss, sheetName);
    if (!sheetAportes) {
      sheetAportes = getOrCreateSheet(ss, sheetName, [
        'Fecha_Hora', 'Telefono', 'Nombre_Aportante', 'Nombre_Archivo', 'Tamano_Canal', 'Fecha_ISO'
      ]);
    }
    const now = new Date();
    const dateIso = Utilities.formatDate(now, 'GMT-5', 'yyyy-MM-dd');
    const timeFormatted = Utilities.formatDate(now, 'GMT-5', 'yyyy-MM-dd HH:mm:ss');
    sheetAportes.appendRow([
      timeFormatted,
      sanitizeSheetValue(donorPhone || 'N/A'),
      sanitizeSheetValue(donorName || 'Colega Ortopedista'),
      sanitizeSheetValue(fileName || 'Documento.pdf'),
      sanitizeSheetValue(size || 'N/A'),
      dateIso
    ]);
    Logger.log('Aporte registrado para consolidado diario: ' + fileName + ' por ' + donorName);
  } catch (err) {
    Logger.log('Error en registrarAporteDiarioGAS: ' + err.message);
  }
}

/**
 * Genera y despacha el reporte ejecutivo consolidado de aportes a las 18:00
 */
function generarInformeDiarioAportes18h() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = CONFIG.SHEET_APORTES_DIARIOS || 'Aportes_Diarios';
    const sheetAportes = getSheetFlexible(ss, sheetName);
    const adminPhone = getSecureProperty('ADMIN_PHONE', CONFIG.ADMIN_PHONE);
    const todayIso = Utilities.formatDate(new Date(), 'GMT-5', 'yyyy-MM-dd');

    if (!sheetAportes || sheetAportes.getLastRow() <= 1) {
      sendWhatsAppText(adminPhone, 
        '📊 *CONSOLIDADO DIARIO DE APORTES (18:00)*\\\\n' +
        '*Dirección:* Gestor de Contenido\\\\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n' +
        'ℹ️ No se registraron nuevos aportes de documentos en el repositorio durante la jornada de hoy.\\\\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n' +
        '🔒 El repositorio institucional permanece actualizado y protegido.'
      );
      return;
    }

    const data = sheetAportes.getDataRange().getValues();
    const aportesHoy = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowIso = String(row[5] || '').trim();
      if (rowIso === todayIso) {
        aportesHoy.push({
          time: row[0],
          phone: String(row[1]),
          name: String(row[2]),
          fileName: String(row[3]),
          size: String(row[4])
        });
      }
    }

    if (aportesHoy.length === 0) {
      sendWhatsAppText(adminPhone, 
        '📊 *CONSOLIDADO DIARIO DE APORTES (18:00)*\\\\n' +
        '*Dirección:* Gestor de Contenido\\\\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n' +
        'ℹ️ No se registraron nuevos aportes de documentos en el repositorio durante la jornada de hoy.\\\\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n' +
        '🔒 El repositorio institucional permanece actualizado y protegido.'
      );
      return;
    }

    // Agrupación por aportante
    const userMap = {};
    for (let i = 0; i < aportesHoy.length; i++) {
      const a = aportesHoy[i];
      const key = a.phone + '|' + a.name;
      if (!userMap[key]) {
        userMap[key] = { phone: a.phone, name: a.name, files: [] };
      }
      userMap[key].files.push(a.fileName + (a.size ? ' (' + a.size + ')' : ''));
    }

    let reportBullets = '';
    const userKeys = Object.keys(userMap);
    for (let u = 0; u < userKeys.length; u++) {
      const userObj = userMap[userKeys[u]];
      reportBullets += '👤 *' + userObj.name + '* (' + userObj.phone + '):\\\\n';
      for (let f = 0; f < userObj.files.length; f++) {
        reportBullets += '  • ' + userObj.files[f] + '\\\\n';
      }
      reportBullets += '\\\\n';
    }

    const reportMsg = 
      '📊 *CONSOLIDADO DIARIO DE APORTES (18:00)*\\\\n' +
      '*Dirección:* Gestor de Contenido\\\\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n' +
      'Hoy se incorporaron *' + aportesHoy.length + ' documento(s)* al acervo institucional por parte de ' + userKeys.length + ' usuario(s):\\\\n\\\\n' +
      reportBullets +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n' +
      '🔒 Todos los documentos han sido resguardados en el Inventario Maestro con sellado criptográfico en reposo.';

    sendWhatsAppText(adminPhone, reportMsg);
    Logger.log('Consolidado de aportes de las 18:00 despachado con éxito.');
  } catch (err) {
    Logger.log('Error en generarInformeDiarioAportes18h: ' + err.message);
  }
}

/**
 * Configura el disparador automático diario a las 18:00
 */
function configurarTriggerInformeDiario18h() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'generarInformeDiarioAportes18h') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('generarInformeDiarioAportes18h')
    .timeBased()
    .everyDays(1)
    .atHour(18)
    .create();
  Logger.log('✅ Trigger de Consolidado Diario a las 18:00 configurado.');
}

/**
 * Registra una solicitud de artículo de pago en la hoja Pendientes_Adquisicion
 */
function handleUserRequestPaperGAS(userPhone, userName, articleId) {
  const res = handleUserRequestPaper(userPhone, userName, articleId);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetPend = getOrCreateSheet(ss, CONFIG.SHEET_PENDIENTES, [
      'ID_Ticket', 'Titulo_Solicitado', 'Telefono_Usuario', 'Nombre_Usuario', 'Estado', 'Fecha_Registro', 'DOI_PMID', 'Notas'
    ]);
    const ticketId = 'REQ-' + ('0000' + sheetPend.getLastRow()).slice(-4);
    sheetPend.appendRow([
      ticketId,
      sanitizeSheetValue(articleId),
      sanitizeSheetValue(userPhone),
      sanitizeSheetValue(userName),
      'PENDIENTE',
      Utilities.formatDate(new Date(), 'GMT-5', 'yyyy-MM-dd HH:mm:ss'),
      sanitizeSheetValue(articleId),
      'Solicitud externa generada por WhatsApp'
    ]);
  } catch (err) {
    Logger.log('Error guardando en Pendientes_Adquisicion: ' + err.message);
  }
  return res;
}

/**
 * Procesa la incorporación de un artículo por el Gestor de Contenido (ADQUIRIDO: <ID>)
 * Despacha automáticamente a cada usuario que lo solicitó y actualiza la hoja.
 */
function cumplirSolicitudAdquisicionGAS(adminPhone, text) {
  const match = text.match(/^adquirido:?\\s*([A-Za-z0-9_.-]+)/i);
  if (!match) {
    sendWhatsAppText(adminPhone, '💡 Formato: *ADQUIRIDO: [ID_ARTICULO]* (ej: ADQUIRIDO: PAY_PELVIS_2024)');
    return;
  }
  const articleId = match[1].trim();
  const fulfillRes = handleAdminFulfillPaper(articleId);

  // Enviar mensaje automático a cada médico solicitante
  for (let i = 0; i < fulfillRes.fulfilledUsers.length; i++) {
    const u = fulfillRes.fulfilledUsers[i];
    sendWhatsAppText(u.phone, u.dispatchText);
    Utilities.sleep(250);
  }

  // Actualizar la hoja Pendientes_Adquisicion
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetPend = getSheetFlexible(ss, CONFIG.SHEET_PENDIENTES);
    if (sheetPend) {
      const data = sheetPend.getDataRange().getValues();
      for (let r = 1; r < data.length; r++) {
        if (String(data[r][1]).trim() === articleId || String(data[r][6]).trim() === articleId) {
          if (data[r][4] === 'PENDIENTE') {
            sheetPend.getRange(r + 1, 5).setValue('ENTREGADO');
          }
        }
      }
    }
  } catch (err) {
    Logger.log('Error actualizando Pendientes_Adquisicion: ' + err.message);
  }

  // Enviar confirmación al Gestor de Contenido
  sendWhatsAppText(adminPhone, fulfillRes.adminConfirmationText);
}
`;

const fullBundle = `
// ============================================================================
// 🌟 BASE DE ENLACES ACORTADOS DEL EDGE
// ============================================================================
const SHORT_BASE = 'https://biblioteca-medica.ortopedia.workers.dev/r/';

// ============================================================================
// 🧮 SUPERPODER 1: CALCULADORAS Y SCORES QUIRÚRGICOS
// ============================================================================
${calcCode}

// ============================================================================
// 🔪 SUPERPODER 2: COPILOTO PRE-OPERATORIO (BRIEFING NOCHE ANTERIOR)
// ============================================================================
${preopCode}

// ============================================================================
// 🔩 SUPERPODER 3: FICHA TÉCNICA DE IMPLANTES E INSTRUMENTACIÓN
// ============================================================================
${implantCode}

// ============================================================================
// 🎙️ SUPERPODER 4: INTERCONSULTA DE URGENCIAS ESTRUCTURADA
// ============================================================================
${consultCode}

// ============================================================================
// 🌐 SUPERPODER 5: RASTREADOR OPEN ACCESS Y CIRCUITO DE ADQUISICIÓN
// ============================================================================
${openAccessCode}

${gasSpecificHelpers}
`;

fs.writeFileSync(path.join(__dirname, 'superpowers_gas_bundle.js'), fullBundle, 'utf8');
console.log('superpowers_gas_bundle.js creado exitosamente. Tamaño:', fullBundle.length, 'bytes.');
