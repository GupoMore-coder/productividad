/**
 * Generador y validador de la sección de los 5 Superpoderes y Consolidado Diario para GAS
 */
const fs = require('fs');
const path = require('path');

function cleanModuleContent(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Elimina cualquier require() de Node.js incompatible con Google Apps Script
  content = content.replace(/(?:const|let|var)\s+[\w{}, \n\r\t]+\s*=\s*require\([^)]+\);?/g, '');
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
const academicRulesCode = cleanModuleContent(path.join(__dirname, 'academic_golden_rules_engine.cjs'));

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
  const doiMatch = text.match(new RegExp('(?:https?:\\/\\/doi\\.org\\/)?(10\\.\\d{4,9}\\/[-._;()/:A-Za-z0-9]+)', 'i'));
  const genericMatch = text.match(new RegExp('adquirido:?\\s*([^\\s\\n\\r*]+)', 'i'));

  let articleId = '';
  if (doiMatch) {
    articleId = doiMatch[1].trim().replace(new RegExp('[;.,*)]$', ''), '');
  } else if (genericMatch) {
    articleId = genericMatch[1].trim().replace(new RegExp('[;.,*)]$', ''), '');
  } else {
    sendWhatsAppText(adminPhone, '💡 Formato: *ADQUIRIDO: [ID o DOI]* (ej: ADQUIRIDO: 10.1177/17531934251404821 o ADQUIRIDO: PAY_PELVIS_2024)');
    return;
  }

  const fulfillRes = handleAdminFulfillPaper(articleId);

  // Enviar mensaje automático a cada médico solicitante registrado en memoria
  for (let i = 0; i < fulfillRes.fulfilledUsers.length; i++) {
    const u = fulfillRes.fulfilledUsers[i];
    sendWhatsAppText(u.phone, u.dispatchText);
    Utilities.sleep(250);
  }

  // Actualizar la hoja Pendientes_Adquisicion y despachar a los usuarios de la hoja
  let sheetFulfilledCount = 0;
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetPend = getSheetFlexible(ss, CONFIG.SHEET_PENDIENTES || 'Pendientes_Adquisicion');
    if (sheetPend) {
      const data = sheetPend.getDataRange().getValues();
      const normTarget = articleId.toLowerCase().replace(new RegExp('^https?:\\/\\/doi\\.org\\/', 'i'), '').replace(new RegExp('^doi:\\s*', 'i'), '').trim();

      for (let r = 1; r < data.length; r++) {
        const rowId = String(data[r][1] || '').toLowerCase().trim();
        const rowDoi = String(data[r][6] || '').toLowerCase().trim();
        const rowPhone = String(data[r][2] || '').trim();
        const rowUser = String(data[r][3] || 'Colega').trim();
        const rowStatus = String(data[r][4] || '').toUpperCase().trim();
        const rowTitle = String(data[r][7] || 'Documento Científico Solicitado').trim();

        if (rowStatus === 'PENDIENTE' && (rowId.includes(normTarget) || normTarget.includes(rowId) || rowDoi.includes(normTarget) || normTarget.includes(rowDoi))) {
          sheetPend.getRange(r + 1, 5).setValue('ENTREGADO');
          sheetFulfilledCount++;

          const token = createHMACDownloadToken({
            driveId: normTarget,
            uPhone: rowPhone,
            exp: new Date().getTime() + (30 * 60 * 1000)
          });
          const shortUrl = (CONFIG.SHORT_BASE || 'https://biblioteca-medica.ortopedia.workers.dev/r/') + 'd_' + token;

          const dispatchMsg = '🎉 *¡SU ARTÍCULO SOLICITADO YA ESTÁ DISPONIBLE!*\\\\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n' +
            'Estimado(a) Dr(a). *' + rowUser + '*:\\\\n\\\\n' +
            'La Dirección del Proyecto ha gestionado e incorporado exitosamente a la Biblioteca Médica el artículo que solicitó:\\\\n\\\\n' +
            '📄 *Documento:* ' + rowTitle + '\\\\n' +
            '🔑 *Referencia:* ' + String.fromCharCode(96) + articleId + String.fromCharCode(96) + '\\\\n\\\\n' +
            '🔗 *Descarga Segura en el Repositorio (Válida por 30 min):*\\\\n' +
            shortUrl + '\\\\n\\\\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n' +
            '💡 _Gracias por enriquecer el acervo de la comunidad de Cirugía Ortopédica._';

          sendWhatsAppText(rowPhone, dispatchMsg);
          Utilities.sleep(250);
        }
      }
    }
  } catch (err) {
    Logger.log('Error actualizando Pendientes_Adquisicion: ' + err.message);
  }

  // Notificación de confirmación al Gestor de Contenido
  const totalSent = fulfillRes.fulfilledCount + sheetFulfilledCount;
  if (totalSent > 0) {
    sendWhatsAppText(adminPhone, '✅ *DOCUMENTO ENTREGADO AUTOMÁTICAMENTE*\\\\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n' +
      'El artículo ' + String.fromCharCode(96) + articleId + String.fromCharCode(96) + ' fue despachado exitosamente a ' + totalSent + ' médico(s) solicitante(s).\\\\n\\\\n' +
      '📋 La cola de solicitudes pendientes fue actualizada a estado *ENTREGADO*.');
  } else {
    sendWhatsAppText(adminPhone, 'ℹ️ *ADQUISICIÓN REGISTRADA*\\\\n' +
      'El artículo ' + String.fromCharCode(96) + articleId + String.fromCharCode(96) + ' fue marcado como disponible en el acervo institucional.');
  }
}

/**
 * Directorio Institucional de Comandos y Acciones para WhatsApp
 */
function getInteractiveCommandsDirectoryText() {
  return '📋 *CARTA MAESTRA DE COMANDOS Y ACCIONES*\\\\n' +
    '*Biblioteca Médica de Cirugía Ortopédica*\\\\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n\\\\n' +
    '🔍 *1. Búsqueda de Literatura y Acervo:*\\\\n' +
    '• Escriba directamente el tema, técnica o patología:\\\\n' +
    '  👉 Ej: "fractura de pelvis" o "clavo trocanterico"\\\\n' +
    '• Ingrese un DOI o enlace web para apertura automática:\\\\n' +
    '  👉 Ej: "10.1177/17531934251404821"\\\\n\\\\n' +
    '🧮 *2. Calculadoras Quirúrgicas y Scores (Superpoder 1):*\\\\n' +
    '• *SCORE CAPRINI* (Tromboprofilaxis ACCP/AAOS)\\\\n' +
    '• *SCORE GUSTILO* (Fracturas abiertas y antibióticos)\\\\n' +
    '• *SCORE MESS* / *CALCULAR MESS: 3 2 1 1*\\\\n' +
    '• *SCORE GARDEN* / *SCORE TLICS* / *SCORE SCHATZKER*\\\\n\\\\n' +
    '🩺 *3. Copiloto Pre-Operatorio (Superpoder 2):*\\\\n' +
    '• *CASO: [cirugía]* (Briefing de la noche anterior, pearls)\\\\n' +
    '  👉 Ej: "CASO: Clavo trocanterico" o "CASO: Protesis rodilla"\\\\n' +
    '• *ABORDAJE: [nombre]* (Vías quirúrgicas y riesgos anatómicos)\\\\n' +
    '  👉 Ej: "ABORDAJE: Kocher-Langenbeck"\\\\n\\\\n' +
    '🔩 *4. Ficha Técnica de Implantes (Superpoder 3):*\\\\n' +
    '• *IMPLANTE: [sistema]* (Brocas, machuelos, fresado y torque)\\\\n' +
    '  👉 Ej: "IMPLANTE: Placa PHILOS" o "FICHA: Clavo T2"\\\\n\\\\n' +
    '📋 *5. Interconsulta Quirúrgica ATLS/AO (Superpoder 4):*\\\\n' +
    '• *INTERCONSULTA: [datos del paciente y lesión]*\\\\n\\\\n' +
    '🎥 *6. Videos Quirúrgicos en 1 Clic:*\\\\n' +
    '• *VIDEOS: [técnica]* (VuMedi, OrthoMedia, YouTube Académico)\\\\n' +
    '  👉 Ej: "VIDEOS: Reemplazo total de cadera"\\\\n\\\\n' +
    '🏛️ *7. Mesa Técnica de 15 Referentes Mundiales:*\\\\n' +
    '• Escriba *MESA TECNICA* o *EXPERTOS*\\\\n\\\\n' +
    '📖 *8. Utilidades Generales y Gobernanza:*\\\\n' +
    '• *MANUAL* (Descarga del Manual Oficial de Uso en PDF)\\\\n' +
    '• *BUZON* (Buzón Digital de Aportes o adjunte PDF con "APORTE")\\\\n' +
    '• *ACTUALIZAR DATOS* (Actualizar correo, grado o hospital)\\\\n' +
    '• *IDIOMA: [ES/EN/PT]* (Cambio instantáneo de idioma)\\\\n' +
    '• *MENSAJE A LA DIRECCION: [texto]* (Canal confidencial)\\\\n\\\\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n' +
    '💡 _Este listado se actualiza de forma automática en tiempo real. Escriba "COMANDOS" en cualquier momento para consultarlo._';
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

// ============================================================================
// 🏛️ REGLAS DE ORO ACADÉMICAS, MESA TÉCNICA (15 PRODIGIOS) Y VIDEOS QUIRÚRGICOS
// ============================================================================
${academicRulesCode}

${gasSpecificHelpers}
`;

fs.writeFileSync(path.join(__dirname, 'superpowers_gas_bundle.js'), fullBundle, 'utf8');
console.log('superpowers_gas_bundle.js creado exitosamente. Tamaño:', fullBundle.length, 'bytes.');
