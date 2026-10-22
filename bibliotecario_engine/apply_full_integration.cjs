/**
 * Script de Integración de los 5 Superpoderes y Consolidado Diario a build_full_manager.cjs
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Iniciando integración en build_full_manager.cjs...');

// 1. Asegurar que superpowers_gas_bundle.js esté actualizado
execSync('node build_superpowers_section.cjs', { cwd: __dirname, stdio: 'inherit' });

let buildContent = fs.readFileSync(path.join(__dirname, 'build_full_manager.cjs'), 'utf8');

// 2. Cargar el bundle al inicio de build_full_manager.cjs si no está ya
if (!buildContent.includes("const superpowersBundlePath = path.join(__dirname, 'superpowers_gas_bundle.js');")) {
  const insertMarker = "const cleanHtmlEscaped = JSON.stringify(templateHtml);";
  const bundleLoaderCode = `const cleanHtmlEscaped = JSON.stringify(templateHtml);
const superpowersBundlePath = path.join(__dirname, 'superpowers_gas_bundle.js');
let superpowersBundleCode = '';
if (fs.existsSync(superpowersBundlePath)) {
  superpowersBundleCode = fs.readFileSync(superpowersBundlePath, 'utf8');
}`;
  buildContent = buildContent.replace(insertMarker, bundleLoaderCode);
}

// 3. Agregar claves a CONFIG
if (!buildContent.includes("SHORT_BASE: 'https://biblioteca-medica.ortopedia.workers.dev/r/',")) {
  buildContent = buildContent.replace(
    "  PUBLIC_PORTAL_URL: 'https://biblioteca-medica.ortopedia.workers.dev',",
    `  PUBLIC_PORTAL_URL: 'https://biblioteca-medica.ortopedia.workers.dev',
  SHORT_BASE: 'https://biblioteca-medica.ortopedia.workers.dev/r/',
  SHEET_APORTES_DIARIOS: 'Aportes_Diarios',`
  );
}

// 4. Acortador en generateAnonymousDownloadLink
buildContent = buildContent.replace(
  "return getPublicPortalBaseUrl() + '?token=' + token;",
  "return (CONFIG.SHORT_BASE || 'https://biblioteca-medica.ortopedia.workers.dev/r/') + 'd_' + token;"
);

// 5. Sustituir alertas inmediatas de donación por registrarAporteDiarioGAS
// En handleWhatsAppPdfDonation:
const waOldAlert = `    const adminPhone = getSecureProperty('ADMIN_PHONE', CONFIG.ADMIN_PHONE);
    sendWhatsAppText(adminPhone, 
      '📥 *NUEVO APORTE DE LITERATURA POR WHATSAPP*\\\\n' +
      '👤 Médico (Registro Privado): ' + senderName + ' (' + cleanPhone + ')\\\\n' +
      '📄 Archivo: "' + docName + '"\\\\n' +
      '🆔 ID Registro: ' + docId + '\\\\n' +
      '👉 Catalogado en Inventario Maestro bajo estricto control interno de Dirección.'
    );`;

const waNewAlert = `    // Registro silencioso para el informe consolidado de las 18:00 (Cero alertas instantáneas al Gestor)
    registrarAporteDiarioGAS(cleanPhone, senderName, docName, 'WhatsApp Doc');`;

if (buildContent.includes(waOldAlert)) {
  buildContent = buildContent.replace(waOldAlert, waNewAlert);
}

// En uploadBuzonFile:
const buzonOldAlert = `    const adminPhone = getSecureProperty('ADMIN_PHONE', CONFIG.ADMIN_PHONE);
    sendWhatsAppText(adminPhone, 
      '📥 *NUEVO DOCUMENTO DEPOSITADO EN EL BUZÓN DIGITAL*\\\\n' +
      '*Dirección:* Gestor de Contenido\\\\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n' +
      '📄 *Archivo:* ' + cleanName + '\\\\n' +
      '📦 *Tamaño:* ' + Math.round(blob.getBytes().length / 1024) + ' KB\\\\n' +
      '👤 *Aportante (Control Interno Privado):* ' + donorRecord + '\\\\n' +
      '🆔 *ID Registro:* ' + docId + '\\\\n' +
      '🕒 *Fecha:* ' + new Date().toLocaleString('es-CO') + '\\\\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n' +
      'Registrado confidencialmente en el catálogo maestro.'
    );`;

const buzonNewAlert = `    // Registro silencioso para el informe consolidado de las 18:00 (Cero alertas instantáneas al Gestor)
    registrarAporteDiarioGAS(donorPhone || 'Buzón Digital', donorRecord, cleanName, Math.round(blob.getBytes().length / 1024) + ' KB');`;

if (buildContent.includes(buzonOldAlert)) {
  buildContent = buildContent.replace(buzonOldAlert, buzonNewAlert);
}

// En uploadBuzonChunk:
const chunkOldAlert = `      const adminPhone = getSecureProperty('ADMIN_PHONE', CONFIG.ADMIN_PHONE);
      sendWhatsAppText(adminPhone,
        '📥 *NUEVO ARCHIVO DE GRAN TAMAÑO ENSAMBLADO EN EL BUZÓN DIGITAL*\\\\n' +
        '*Dirección:* Gestor de Contenido\\\\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n' +
        '📄 *Archivo:* ' + cleanName + '\\\\n' +
        '📦 *Tamaño Ensamblado:* ' + Math.round(combinedBytes.length / (1024 * 1024)) + ' MB (' + totalChunks + ' bloques)\\\\n' +
        '👤 *Aportante (Control Interno Privado):* ' + donorRecord + '\\\\n' +
        '🆔 *ID Registro:* ' + docId + '\\\\n' +
        '🕒 *Fecha:* ' + new Date().toLocaleString('es-CO') + '\\\\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n' +
        'El archivo ha sido resguardado confidencialmente en el buzón institucional.'
      );`;

const chunkNewAlert = `      // Registro silencioso para el informe consolidado de las 18:00 (Cero alertas instantáneas al Gestor)
      registrarAporteDiarioGAS(donorPhone || 'Buzón Chunk', donorRecord, cleanName, Math.round(combinedBytes.length / (1024 * 1024)) + ' MB (' + totalChunks + ' bloques)');`;

if (buildContent.includes(chunkOldAlert)) {
  buildContent = buildContent.replace(chunkOldAlert, chunkNewAlert);
}

// 6. Agregar comandos administrativos ADQUIRIDO y CONSOLIDADO_APORTES en handleIncomingMessage
if (!buildContent.includes("lower.startsWith('adquirido:')")) {
  const adminMarker = "    // 1.55 RENDIMIENTO / CENTINELA / METRICAS";
  const adminNewCommands = `    // 1.53 CUMPLIMIENTO DE ADQUISICIÓN DE LITERATURA FALTANTE (SUPERPODER 5)
    if (lower.startsWith('adquirido:') || lower.startsWith('adquirido ')) {
      cumplirSolicitudAdquisicionGAS(adminPhone, text);
      return;
    }

    // 1.54 CONSOLIDADO DIARIO DE APORTES (ACCIÓN ADICIONAL 18:00)
    if (lower === 'consolidado_aportes' || lower === 'aportes_hoy' || lower === 'aportes') {
      generarInformeDiarioAportes18h();
      return;
    }

    // 1.55 RENDIMIENTO / CENTINELA / METRICAS`;
  buildContent = buildContent.replace(adminMarker, adminNewCommands);
}

// 7. Agregar enrutamiento de los 5 Superpoderes para usuarios aprobados
if (!buildContent.includes("lower.startsWith('score:')")) {
  const userMarker = "    // 4.3 Consulta de Evidencia Científica Global (PubMed & Semantic Scholar)";
  const userSuperpowersRouting = `    // =========================================================================
    // 🌟 SUPERPODERES CLÍNICOS ORTOPÉDICOS (100% CIENTÍFICOS & VERIFICADOS)
    // =========================================================================

    // Superpoder 1: Calculadora de Scores y Escalas Quirúrgicas al Instante
    if (lower.startsWith('score:') || lower.startsWith('score ') || lower.startsWith('calcular:') || lower.startsWith('calcular ') || lower.startsWith('escala:') || lower.startsWith('escala ')) {
      const calcRes = handleCalculatorRequest(text);
      if (calcRes && calcRes.handled) {
        sendWhatsAppText(cleanPhone, calcRes.replyText);
        return;
      }
    }

    // Superpoder 2: Copiloto Pre-Operatorio ("Briefing Quirúrgico de la Noche Anterior")
    if (lower.startsWith('caso:') || lower.startsWith('caso ') || lower.startsWith('preop:') || lower.startsWith('preop ') || lower.startsWith('abordaje:') || lower.startsWith('abordaje ')) {
      const preopRes = handlePreopCopilotRequest(text);
      if (preopRes && preopRes.handled) {
        sendWhatsAppText(cleanPhone, preopRes.replyText);
        return;
      }
    }

    // Superpoder 3: Ficha Técnica Rápida de Implantes e Instrumentación
    if (lower.startsWith('implante:') || lower.startsWith('implante ') || lower.startsWith('ficha:') || lower.startsWith('ficha ') || lower.startsWith('instrumental:') || lower.startsWith('instrumental ')) {
      const impRes = handleImplantRequest(text);
      if (impRes && impRes.handled) {
        sendWhatsAppText(cleanPhone, impRes.replyText);
        return;
      }
    }

    // Superpoder 4: Interconsulta de Urgencias Estructurada (Voz o Texto)
    if (lower.startsWith('interconsulta:') || lower.startsWith('interconsulta ') || lower.startsWith('urgencia:') || lower.startsWith('urgencia ') || lower.startsWith('caso urgencia:') || lower.startsWith('esquema:')) {
      const consultRes = handleEmergencyConsultRequest(text);
      if (consultRes && consultRes.handled) {
        sendWhatsAppText(cleanPhone, consultRes.replyText);
        return;
      }
    }

    // Superpoder 5: Solicitud de Artículos de Pago (Circuito de Solicitud/Adquisición)
    if (lower.startsWith('solicitar:') || lower.startsWith('solicitar ')) {
      const artId = text.replace(/^solicitar:?\\s*/i, '').trim();
      const reqRes = handleUserRequestPaperGAS(cleanPhone, userRow[1] || senderName, artId);
      sendWhatsAppText(cleanPhone, reqRes.userReplyText);
      if (reqRes.adminNotificationText) {
        sendWhatsAppText(adminPhone, reqRes.adminNotificationText);
      }
      return;
    }

    if (lower.startsWith('descartar:') || lower.startsWith('descartar ')) {
      sendWhatsAppText(cleanPhone, 'ℹ️ *Entendido.* El artículo ha sido descartado y no se ha añadido a su lista de solicitudes bibliográficas.');
      return;
    }

    // Superpoder 5: Búsqueda Open Access Directa
    if (lower.startsWith('buscar_web:') || lower.startsWith('openaccess:') || lower.startsWith('open access:')) {
      const q = text.replace(/^(buscar_web|openaccess|open access):?\\s*/i, '').trim();
      const items = searchOpenAccessLiterature(q);
      sendWhatsAppText(cleanPhone, formatLiteratureSearchOutput(items, q));
      return;
    }

    // 4.3 Consulta de Evidencia Científica Global (PubMed & Semantic Scholar)`;
  buildContent = buildContent.replace(userMarker, userSuperpowersRouting);
}

// 8. Inyectar el código bundle de los superpoderes al final de scriptContent
if (!buildContent.includes('// BUNDLE DE SUPERPODERES INCRUSTADO DINAMICAMENTE')) {
  const scriptContentEndMarker = `/**
 * PRUEBAS DIRECTAS Y SINCRONIZACIÓN EN GOOGLE APPS SCRIPT
 */`;
  const bundleInjection = `
// ============================================================================
// 🌟 BUNDLE DE SUPERPODERES INCRUSTADO DINAMICAMENTE
// ============================================================================
\${superpowersBundleCode}

/**
 * PRUEBAS DIRECTAS Y SINCRONIZACIÓN EN GOOGLE APPS SCRIPT
 */`;
  buildContent = buildContent.replace(scriptContentEndMarker, bundleInjection);
}

fs.writeFileSync(path.join(__dirname, 'build_full_manager.cjs'), buildContent, 'utf8');
console.log('build_full_manager.cjs actualizado exitosamente.');
