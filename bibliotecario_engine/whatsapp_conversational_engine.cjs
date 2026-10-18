/**
 * MOTOR CONVERSACIONAL DE WHATSAPP - AGENTE BIBLIOTECARIO CLÍNICO
 * Dirección / Gestor de Contenido (+573008880001)
 * 
 * Principios Inmutables:
 * 1. ANONIMATO ABSOLUTO: La identidad del propietario se representa exclusivamente como Gestor de Contenido.
 * 2. CERO CONTACTO DIRECTO: Los usuarios solo interactúan a través del bot como relé intermediario.
 * 3. CONTROL DISCIPLINARIO TOTAL: El Gestor de Contenido tiene potestad para bloquear, desbloquear, responder o eliminar usuarios.
 * 4. CÓDIGO DE CONDUCTA: Filtro de moderación activa (cero contenido obsceno, sexual, vulgar o ajeno a la especialidad).
 * 5. MANUAL DE USO PERMANENTE: Entrega de manual en PDF mediante el comando "MANUAL" o al ser aprobado.
 */

const fs = require('fs');
const path = require('path');
const {
  registerUser,
  updateUserProfile,
  updateUserLanguage,
  resolveCountryAndLanguage,
  COUNTRY_DIAL_MAP,
  translateAnnouncement,
  approveUser,
  rejectUser,
  blockUser,
  unblockUser,
  suspendUser,
  expelUser,
  deleteUser,
  loadUsers
} = require('./governance_and_bulletin.cjs');
const { buildAnonymousDownloadUrl, LIVE_WEBAPP_URL } = require('./anonymous_proxy.cjs');
const { searchClinicalLiterature, createLiteratureTicket, formatGerenteAlertMessage } = require('./ticketing_and_intermediary.cjs');

const ADMIN_PHONE = '+573008880001';
const MANUAL_DRIVE_ID = 'MANUAL_DE_USO_BIBLIOTECA_PDF'; // Token para descarga del manual oficial

// Palabras clave de contenido inapropiado, vulgar u obsceno (Tolerancia Cero)
// Nota: Se excluyen términos anatómicos legítimos de trauma pélvico o epidemiología médica
const INAPPROPRIATE_TERMS = [
  'porn', 'porno', 'xxx', 'desnudo', 'desnuda', 'puta', 'puto', 'mierda',
  'hijueputa', 'gonorrea', 'malparido', 'culo', 'culos', 'tetas', 'verga', 'pendejo'
];

// Palabras ajenas al ámbito médico/ortopédico
const OFF_TOPIC_TERMS = [
  'receta', 'cocina', 'politica', 'presidente', 'elecciones', 'cripto',
  'bitcoin', 'futbol', 'partido', 'apuesta', 'casino', 'musica'
];

/**
 * ============================================================================
 * 🛡️ SISTEMA DE VIGILANCIA PERPETUA DE RENDIMIENTO Y ESCALABILIDAD (CENTINELA)
 * DIRECTRIZ INMUTABLE HEREDADA: Si este código o proyecto se migra a otra
 * plataforma (Node, Fastify, Cloudflare D1/R2, Supabase, Go, Python, etc.),
 * este módulo de auditoría de latencia, semáforo operativo y sugerencia de
 * escalabilidad DEBE ser portado obligatoriamente según .agents/rules/performance-sentinel-governance.md
 * ============================================================================
 */
const SENTINEL_CONFIG = {
  SAMPLE_WINDOW: 50,
  THRESHOLD_GREEN_MAX: 2500,
  THRESHOLD_YELLOW_MIN: 3500,
  THRESHOLD_YELLOW_P90: 5000,
  THRESHOLD_RED_MIN: 6000,
  ALERT_THROTTLE_SEC: 1800
};

const sentinelMetrics = [];

function recordSentinelMetric(operationType, durationMs) {
  sentinelMetrics.push({
    t: Date.now(),
    op: operationType || 'REQ',
    ms: Math.round(durationMs)
  });
  if (sentinelMetrics.length > SENTINEL_CONFIG.SAMPLE_WINDOW) {
    sentinelMetrics.shift();
  }
}

function computeSentinelStats() {
  if (sentinelMetrics.length === 0) {
    return {
      count: 0,
      avgMs: 0,
      p90Ms: 0,
      minMs: 0,
      maxMs: 0,
      status: 'VERDE',
      trafficLight: '🟢',
      verdict: 'Excelente fluidez operativa (Google Apps Script Nominal)'
    };
  }

  const times = sentinelMetrics.map(s => s.ms).sort((a, b) => a - b);
  const sum = times.reduce((acc, val) => acc + val, 0);
  const avg = Math.round(sum / times.length);
  const p90Index = Math.min(times.length - 1, Math.floor(times.length * 0.9));
  const p90 = times[p90Index];
  const min = times[0];
  const max = times[times.length - 1];

  let status = 'VERDE';
  let trafficLight = '🟢';
  let verdict = 'Excelente fluidez operativa (Google Apps Script Nominal)';

  if (avg > SENTINEL_CONFIG.THRESHOLD_RED_MIN || p90 > 7500) {
    status = 'ROJO';
    trafficLight = '🔴';
    verdict = 'Saturación Crítica detectada. Recomendada migración inmediata a Cloudflare D1/R2.';
  } else if (avg > SENTINEL_CONFIG.THRESHOLD_YELLOW_MIN || p90 > SENTINEL_CONFIG.THRESHOLD_YELLOW_P90) {
    status = 'AMARILLO';
    trafficLight = '🟡';
    verdict = 'Congestión moderada por alta demanda. Evaluar optimización de caché o desacoplamiento.';
  }

  return {
    count: times.length,
    avgMs: avg,
    p90Ms: p90,
    minMs: min,
    maxMs: max,
    status,
    trafficLight,
    verdict
  };
}

function getSentinelReport() {
  const stats = computeSentinelStats();
  return `🛡️ *REPORTE DEL CENTINELA DE RENDIMIENTO Y ESCALABILIDAD*\n` +
         `*Dirección:* Gestor de Contenido\n` +
         `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
         `${stats.trafficLight} *Estado Operativo:* NIVEL ${stats.status}\n` +
         `⏱️ *Latencia Media:* ${(stats.avgMs / 1000).toFixed(2)} segundos\n` +
         `📈 *Percentil 90 (P90):* ${(stats.p90Ms / 1000).toFixed(2)} segundos\n` +
         `⚡ *Rango Mín / Máx:* ${(stats.minMs / 1000).toFixed(2)}s / ${(stats.maxMs / 1000).toFixed(2)}s\n` +
         `📦 *Muestras en Ventana:* ${stats.count} / ${SENTINEL_CONFIG.SAMPLE_WINDOW} transacciones\n` +
         `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
         `📋 *Dictamen de Escalabilidad:*\n` +
         `${stats.verdict}\n` +
         `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
         `🌐 *Infraestructura Actual:* Google Apps Script + Cloudflare Edge Proxy (Anonimato Cardinal Activo)`;
}

/**
 * Procesa un mensaje entrante de WhatsApp y genera la respuesta adecuada
 */
async function processIncomingWhatsAppMessage(params) {
  const sentinelStart = Date.now();
  try {
    return await handleProcessIncomingWhatsAppMessage(params);
  } finally {
    recordSentinelMetric('WA_MSG', Date.now() - sentinelStart);
  }
}

async function handleProcessIncomingWhatsAppMessage({ fromPhone, senderName, messageText }) {
  const cleanPhone = fromPhone.replace(/[^\d+]/g, '');
  const text = (messageText || '').trim();
  const lower = text.toLowerCase();

  // =========================================================================
  // 1. FLUJO PRIVILEGIADO DE DIRECCIÓN: GESTOR DE CONTENIDO
  // =========================================================================
  const isAdmin = cleanPhone === ADMIN_PHONE.replace(/[^\d+]/g, '') || cleanPhone === '573008880001';

  if (isAdmin) {
    // 1.1 Comando: APROBAR / ACTIVAR / ACT_...
    if (lower.startsWith('aprobar') || lower.startsWith('activar') || lower.startsWith('act_')) {
      const targetPhoneMatch = text.match(/\+?\d{10,14}/);
      if (targetPhoneMatch) {
        const targetPhone = targetPhoneMatch[0];
        const res = approveUser(targetPhone);
        if (res.success) {
          const manualLink = buildAnonymousDownloadUrl({ driveId: MANUAL_DRIVE_ID, userPhone: targetPhone });
          return {
            recipientPhone: ADMIN_PHONE,
            replyText: `✅ *Usuario Autorizado con Éxito*\nEl Dr.(a) ${res.user.name} (${res.user.university} - ${res.user.level}) ha sido habilitado.\nSe le despachó la bienvenida oficial y el enlace al Manual de Uso.`,
            notifyUser: {
              phone: targetPhone,
              message: `${res.messageForUser}\n\n📥 *Descargar Manual de Uso Oficial (PDF):*\n${manualLink}`
            }
          };
        } else {
          return { recipientPhone: ADMIN_PHONE, replyText: `⚠️ *Aviso:* No se encontró ningún registro con el número ${targetPhone}.` };
        }
      }
      return { recipientPhone: ADMIN_PHONE, replyText: `💡 Formato: \`ACTIVAR +57XXXXXXXXXX\`` };
    }

    // 1.1b Comando: RECHAZAR / REJ_...
    if (lower.startsWith('rechazar') || lower.startsWith('rej_')) {
      const targetPhoneMatch = text.match(/\+?\d{10,14}/);
      if (targetPhoneMatch) {
        const targetPhone = targetPhoneMatch[0];
        const reason = text.replace(/^(rej_|\+?rechazar)\s*(\+?\d{10,14})?/i, '').trim() || 'No cumple con los criterios de admisión para el acervo institucional en esta oportunidad.';
        const res = rejectUser(targetPhone, reason);
        if (res.success) {
          return {
            recipientPhone: ADMIN_PHONE,
            replyText: `❌ *Solicitud de Acceso Rechazada*\nEl registro de ${res.user.name} (${targetPhone}) ha sido rechazado.\nMotivo: "${reason}".\nNotificación enviada al solicitante.`,
            notifyUser: {
              phone: targetPhone,
              message: res.messageForUser
            }
          };
        }
        return { recipientPhone: ADMIN_PHONE, replyText: `⚠️ No se encontró registro con el número ${targetPhone}.` };
      }
      return { recipientPhone: ADMIN_PHONE, replyText: `💡 Formato: \`RECHAZAR +57XXXXXXXXXX [motivo opcional]\`` };
    }

    // 1.2 Comando: SUSPENDER +57... [24h|48h|72h] [motivo]
    if (lower.startsWith('suspender')) {
      const targetPhoneMatch = text.match(/\+?\d{10,14}/);
      if (targetPhoneMatch) {
        const targetPhone = targetPhoneMatch[0];
        let hours = 24;
        if (lower.includes('48h')) hours = 48;
        else if (lower.includes('72h')) hours = 72;
        else if (lower.includes('24h')) hours = 24;
        const reason = text.replace(/suspender\s+\+?\d{10,14}(\s+(24h|48h|72h))?/i, '').trim() || 'Suspensión preventiva de conducta';
        const res = suspendUser(targetPhone, hours, reason);
        if (res.success) {
          return {
            recipientPhone: ADMIN_PHONE,
            replyText: `⏳ *Usuario Suspendido (${hours}h)*\nEl acceso de ${res.user.name} (${targetPhone}) ha sido suspendido por ${hours} horas.\nMotivo: "${reason}".\nNotificación enviada al usuario.`,
            notifyUser: {
              phone: targetPhone,
              message: res.messageForUser
            }
          };
        }
        return { recipientPhone: ADMIN_PHONE, replyText: `⚠️ No se encontró usuario con el número ${targetPhone}.` };
      }
      return { recipientPhone: ADMIN_PHONE, replyText: `💡 Formato: \`SUSPENDER +57XXXXXXXXXX 24h|48h|72h [motivo]\`` };
    }

    // 1.3 Comando: BLOQUEAR +57... [motivo]
    if (lower.startsWith('bloquear')) {
      const targetPhoneMatch = text.match(/\+?\d{10,14}/);
      if (targetPhoneMatch) {
        const targetPhone = targetPhoneMatch[0];
        const reason = text.replace(/bloquear\s+\+?\d{10,14}/i, '').trim() || 'Incumplimiento del código de conducta médica';
        const res = blockUser(targetPhone, reason);
        if (res.success) {
          return {
            recipientPhone: ADMIN_PHONE,
            replyText: `⛔ *Usuario Bloqueado (Indefinido)*\nEl acceso de ${res.user.name} (${targetPhone}) ha sido suspendido.\nMotivo: "${reason}".`,
            notifyUser: {
              phone: targetPhone,
              message: res.messageForUser
            }
          };
        }
        return { recipientPhone: ADMIN_PHONE, replyText: `⚠️ No se encontró usuario con el número ${targetPhone}.` };
      }
      return { recipientPhone: ADMIN_PHONE, replyText: `💡 Formato: \`BLOQUEAR +57XXXXXXXXXX [motivo opcional]\`` };
    }

    // 1.4 Comando: EXPULSAR +57... [motivo]
    if (lower.startsWith('expulsar')) {
      const targetPhoneMatch = text.match(/\+?\d{10,14}/);
      if (targetPhoneMatch) {
        const targetPhone = targetPhoneMatch[0];
        const reason = text.replace(/expulsar\s+\+?\d{10,14}/i, '').trim() || 'Expulsión definitiva e irrevocable';
        const res = expelUser(targetPhone, reason);
        if (res.success) {
          return {
            recipientPhone: ADMIN_PHONE,
            replyText: `🚫 *Usuario Expulsado Permanentemente*\nEl registro de ${res.user.name} (${targetPhone}) ha sido inhabilitado de por vida.\nMotivo: "${reason}".`,
            notifyUser: {
              phone: targetPhone,
              message: res.messageForUser
            }
          };
        }
        return { recipientPhone: ADMIN_PHONE, replyText: `⚠️ No se encontró usuario con el número ${targetPhone}.` };
      }
      return { recipientPhone: ADMIN_PHONE, replyText: `💡 Formato: \`EXPULSAR +57XXXXXXXXXX [motivo]\`` };
    }

    // 1.5 Comando: DESBLOQUEAR +57...
    if (lower.startsWith('desbloquear')) {
      const targetPhoneMatch = text.match(/\+?\d{10,14}/);
      if (targetPhoneMatch) {
        const targetPhone = targetPhoneMatch[0];
        const res = unblockUser(targetPhone);
        if (res.success) {
          return {
            recipientPhone: ADMIN_PHONE,
            replyText: `✅ *Usuario Desbloqueado*\nEl acceso de ${res.user.name} (${targetPhone}) ha sido restablecido.`,
            notifyUser: {
              phone: targetPhone,
              message: res.messageForUser
            }
          };
        }
        return { recipientPhone: ADMIN_PHONE, replyText: `⚠️ No se encontró usuario con el número ${targetPhone}.` };
      }
      return { recipientPhone: ADMIN_PHONE, replyText: `💡 Formato: \`DESBLOQUEAR +57XXXXXXXXXX\`` };
    }

    // 1.4 Comando: ELIMINAR +57...
    if (lower.startsWith('eliminar') || lower.startsWith('borrar')) {
      const targetPhoneMatch = text.match(/\+?\d{10,14}/);
      if (targetPhoneMatch) {
        const targetPhone = targetPhoneMatch[0];
        const res = deleteUser(targetPhone);
        return {
          recipientPhone: ADMIN_PHONE,
          replyText: res.success 
            ? `🗑️ *Usuario Eliminado:* El registro ${targetPhone} ha sido purgado del directorio.` 
            : `⚠️ No se encontró usuario con el número ${targetPhone}.`
        };
      }
      return { recipientPhone: ADMIN_PHONE, replyText: `💡 Formato: \`ELIMINAR +57XXXXXXXXXX\`` };
    }

    // 1.5 Comando: MENSAJE / RESPONDER / MSG_... [mensaje] (Canal Intermediado Anónimo)
    if (lower.startsWith('responder') || lower.startsWith('mensaje') || lower.startsWith('msg_')) {
      const targetPhoneMatch = text.match(/\+?\d{10,14}/);
      if (targetPhoneMatch) {
        const targetPhone = targetPhoneMatch[0];
        let responseBody = '';
        if (lower.startsWith('msg_')) {
          responseBody = '';
        } else {
          responseBody = text.replace(/^(responder|mensaje)\s+\+?\d{10,14}\s*/i, '').trim();
        }

        if (responseBody.length > 0) {
          return {
            recipientPhone: ADMIN_PHONE,
            replyText: `📤 *Mensaje Despachado al Usuario (${targetPhone})* de forma 100% anónima.`,
            notifyUser: {
              phone: targetPhone,
              message: `💬 *DIRECCIÓN DEL PROYECTO:*\n\n` +
                       `"${responseBody}"\n\n` +
                       `_Nota: Puede responder a este mensaje directamente en este chat si requiere aclaración adicional._`
            }
          };
        } else {
          return {
            recipientPhone: ADMIN_PHONE,
            replyText: `💬 *Redactar Mensaje para ${targetPhone}:*\nEscriba: \`MENSAJE ${targetPhone} [escriba aquí su mensaje]\`\nSu mensaje será entregado al solicitante preservando su anonimato absoluto.`
          };
        }
      }
      return { recipientPhone: ADMIN_PHONE, replyText: `💡 Formato: \`MENSAJE +57XXXXXXXXXX [su mensaje aquí]\`` };
    }

    // 1.55 Comando: RENDIMIENTO / CENTINELA / METRICAS (Vigilancia Perpetua)
    if (lower === 'rendimiento' || lower === 'centinela' || lower === 'metricas') {
      return {
        recipientPhone: ADMIN_PHONE,
        replyText: getSentinelReport()
      };
    }

    // 1.6 Comando: REPORTE / ESTADO
    if (lower.includes('estado') || lower.includes('reporte') || lower.includes('resumen')) {
      const users = loadUsers();
      const approvedCount = users.filter(u => u.status === 'APROBADO' || u.status === 'ACTIVO').length;
      const pendingCount = users.filter(u => u.status === 'PENDIENTE_APROBACION').length;
      const blockedCount = users.filter(u => u.status === 'BLOQUEADO').length;
      const sentinelStats = computeSentinelStats();
      return {
        recipientPhone: ADMIN_PHONE,
        replyText: `📊 *REPORTE DE DIRECCIÓN Y GOBERNANZA*\n` +
                   `*Dirección:* Gestor de Contenido\n` +
                   `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                   `👨‍⚕️ *Médicos Autorizados:* ${approvedCount}\n` +
                   `⏳ *Solicitudes Pendientes:* ${pendingCount}\n` +
                   `⛔ *Usuarios Suspendidos:* ${blockedCount}\n` +
                   `⚡ *Centinela Rendimiento:* ${sentinelStats.trafficLight} ${sentinelStats.status} (${(sentinelStats.avgMs/1000).toFixed(2)}s avg, P90 ${(sentinelStats.p90Ms/1000).toFixed(2)}s)\n` +
                   `📚 *Documentos en Catálogo:* 1.634 títulos\n` +
                   `☁️ *Servidor Cloud:* Google Apps Script 24/7 (Operativo)\n` +
                   `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                   `💡 *Comandos disponibles:*\n` +
                   `• \`APROBAR +57...\` | \`BLOQUEAR +57... [motivo]\`\n` +
                   `• \`RESPONDER +57... [msg]\` | \`RENDIMIENTO\` | \`COMUNICADO: [mensaje]\``
      };
    }

    // 1.7 Comando: COMUNICADO / COMUNICADO_POLITICAS (Despacho multilingüe)
    if (lower.startsWith('comunicado:') || lower.startsWith('comunicado_politicas:') || lower === 'comunicado_politicas') {
      const msgBody = text.replace(/^comunicado(?:_politicas)?\s*:\s*/i, '').trim();
      const users = loadUsers();
      const approvedUsers = users.filter(u => (u.status === 'APROBADO' || u.status === 'ACTIVO') && u.phone !== ADMIN_PHONE);
      const recipientDispatches = [];

      for (const u of approvedUsers) {
        const uLang = u.preferredLanguage || 'ES';
        const localized = translateAnnouncement(msgBody, uLang);
        recipientDispatches.push({
          phone: u.phone,
          language: uLang,
          message: localized
        });
      }

      return {
        recipientPhone: ADMIN_PHONE,
        replyText: `📢 *COMUNICADO MASIVO DESPACHADO*\n\nSu mensaje fue transmitido exitosamente a ${approvedUsers.length} médico(s) autorizados en sus respectivos idiomas preferidos.`,
        broadcastDispatches: recipientDispatches
      };
    }
  }

  // =========================================================================
  // 2. FILTRO DE MODERACIÓN ACTIVA (TOLERANCIA CERO A CONTENIDO SENSIBLE)
  // =========================================================================
  const containsInappropriate = INAPPROPRIATE_TERMS.some(term => {
    const rx = new RegExp('(^|[^a-záéíóúüñ])' + term + '([^a-záéíóúüñ]|$)', 'i');
    return rx.test(lower);
  });
  if (containsInappropriate && !isAdmin) {
    // Alerta disciplinaria inmediata al Gestor de Contenido
    const users = loadUsers();
    const offendingUser = users.find(u => u.phone === cleanPhone);
    const offenderName = offendingUser ? offendingUser.name : (senderName || 'Usuario Desconocido');

    // Suspender temporalmente por 24 horas
    suspendUser(cleanPhone, 24, 'Uso de lenguaje obsceno, vulgar o inapropiado');

    return {
      recipientPhone: cleanPhone,
      replyText: `⛔ *ACCESO SUSPENDIDO POR VIOLACIÓN DEL CÓDIGO DE CONDUCTA*\n\n` +
                 `Se ha detectado el uso de lenguaje vulgar, sensible o inapropiado en su mensaje.\n` +
                 `De conformidad con el Código de Conducta de la Biblioteca Médica, su cuenta ha sido suspendida de forma preventiva por 24 horas.\n\n` +
                 `El incidente ha sido remitido a la Dirección (*Gestor de Contenido*).`,
      alertToGerente: {
        phone: ADMIN_PHONE,
        message: `🚨 *ALERTA DE INCUMPLIMIENTO DISCIPLINARIO*\n` +
                 `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                 `👤 *Usuario:* ${offenderName} (\`${cleanPhone}\`)\n` +
                 `📝 *Mensaje:* "${text}"\n` +
                 `⚖️ *Acción Aplicada:* Cuenta suspendida preventivamente (24 horas).\n` +
                 `👉 Para desbloquear: \`DESBLOQUEAR ${cleanPhone}\`\n` +
                 `👉 Para expulsar: \`EXPULSAR ${cleanPhone}\``
      }
    };
  }

  const hasDoiOrIsbn = /\b10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+\b/i.test(text) || /\b(?:isbn(?:: ?| ))?[0-9-]{10,17}\b/i.test(text);
  if (!hasDoiOrIsbn && /\b(manual|guia|guía|ayuda|instructivo|reglas)\b/i.test(lower)) {
    const manualLink = buildAnonymousDownloadUrl({ driveId: MANUAL_DRIVE_ID, userPhone: cleanPhone });
    return {
      recipientPhone: cleanPhone,
      replyText: `📖 *MANUAL DE USO Y GOBERNANZA DEL PROYECTO*\n` +
                 `*Dirección:* Gestor de Contenido\n` +
                 `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                 `Este documento contiene las directrices completas para:\n` +
                 `• Búsquedas quirúrgicas efectivas (patología, clasificación AO, técnicas de fabricantes).\n` +
                 `• Funcionamiento de los enlaces efímeros de 30 minutos.\n` +
                 `• Protocolo de solicitud de literatura ausente (Tickets DOI/ISBN).\n` +
                 `• Código de Conducta y Reglas Disciplinarias.\n` +
                 `• Canal de contacto anónimo con la Dirección.\n` +
                 `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                 `📥 *Descargar Manual Oficial en PDF:*\n${manualLink}`
    };
  }

  // =========================================================================
  // 4. CONTROL DE ACCESO Y ONBOARDING PARA USUARIOS EXTERNOS
  // =========================================================================
  const users = loadUsers();
  const existingUser = users.find(u => u.phone === cleanPhone);

  // Verificación de expulsión definitiva previa
  const expelledUser = users.find(u => u.phone === cleanPhone && u.status === 'EXPULSADO');
  if (expelledUser && !isAdmin) {
    return {
      recipientPhone: cleanPhone,
      replyText: `🚫 *ACCESO REVOCADO PERMANENTEMENTE*\n\nSu cuenta y número telefónico han sido expulsados de forma definitiva del proyecto por decisión de la Dirección.\nMotivo: ${expelledUser.blockReason || 'Violación grave o reiterada de normativas'}.\nNo se admiten nuevas solicitudes de registro.`
    };
  }

  if (!existingUser && !isAdmin) {
    const countryInfo = resolveCountryAndLanguage(cleanPhone);
    const hasRegistrationData = (lower.includes('residente') || lower.includes('especialista') || lower.includes('universidad') || lower.includes('hospital') || text.includes('@')) && text.length > 20;

    if (hasRegistrationData) {
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const email = emailMatch ? emailMatch[0] : '';

      const langMatch = text.match(/\b(?:idioma|language|lang)\s*:\s*([a-zA-Z]{2})\b/i) || text.match(/\b(portugu[eê]s|ingl[eé]s|english|fran[cç][aá]is|espa[nñ]ol)\b/i);
      let detectedLang = countryInfo.defaultLang;
      if (langMatch) {
        const val = (langMatch[1] || '').toLowerCase();
        if (val.includes('port') || val === 'pt') detectedLang = 'PT';
        else if (val.includes('ing') || val.includes('eng') || val === 'en') detectedLang = 'EN';
        else if (val.includes('fra') || val === 'fr') detectedLang = 'FR';
        else if (val.includes('esp') || val === 'es') detectedLang = 'ES';
      }

      const reg = registerUser({
        phone: cleanPhone,
        fullName: senderName || 'Dr. Solicitante',
        email: email,
        university: extractUniversity(text) || 'Institución Hospitalaria',
        level: extractLevel(text) || 'Residente en Ortopedia',
        preferredLanguage: detectedLang
      });

      return {
        recipientPhone: cleanPhone,
        replyText: reg.welcomeForUser,
        alertToGerente: {
          phone: ADMIN_PHONE,
          message: reg.alertForGerente
        }
      };
    } else {
      let welcomeGreeting = '';
      if (countryInfo.defaultLang === 'PT') {
        welcomeGreeting = `👋 *Bem-vindo(a) à Biblioteca Médica de Cirurgia Ortopédica e Traumatologia!*\n\n` +
                          `🇧🇷 ${countryInfo.greeting}\n\n` +
                          `Iniciativa independente de apoio acadêmico e pesquisa clínica.\n\n` +
                          `Para solicitar acesso ao acervo clínico, envie seus dados em uma única mensagem:\n` +
                          `1. *Nome Completo*\n` +
                          `2. *E-mail* (pessoal ou institucional)\n` +
                          `3. *Universidade ou Hospital de formação*\n` +
                          `4. *Nível atual* (Residente R1-R4, Especialista, Egressado)\n` +
                          `5. *Idioma de preferência* (PT, ES, EN, FR) [Opcional - padrão: Português]\n\n` +
                          `🌐 *Seleção de Idioma:* Você pode escolher o idioma de comunicação enviando *"IDIOMA: PT"*, *"IDIOMA: ES"*, *"LANGUAGE: EN"* ou *"IDIOMA: FR"* sem limites de alteração.\n\n` +
                          `💡 _Ou digite "MANUAL" para consultar o guia oficial e as diretrizes do serviço._`;
      } else if (countryInfo.defaultLang === 'EN') {
        welcomeGreeting = `👋 *Welcome to the Orthopaedic Surgery & Traumatology Medical Library!*\n\n` +
                          `🌐 ${countryInfo.greeting}\n\n` +
                          `Independent initiative for academic support and clinical research.\n\n` +
                          `To request access to the clinical collection, please share your details in a single message:\n` +
                          `1. *Full Name*\n` +
                          `2. *Email address* (personal or institutional)\n` +
                          `3. *University or Training Hospital*\n` +
                          `4. *Current Level* (Resident R1-R4, Specialist, Fellow)\n` +
                          `5. *Preferred Language* (EN, ES, PT, FR) [Optional - default: English]\n\n` +
                          `🌐 *Language Selection:* You can set your preferred language at any time by typing *"LANGUAGE: EN"*, *"LANGUAGE: ES"*, *"LANGUAGE: PT"*, or *"LANGUAGE: FR"* with unlimited updates.\n\n` +
                          `💡 _Or type "MANUAL" to review the official guide and service guidelines._`;
      } else if (countryInfo.defaultLang === 'FR') {
        welcomeGreeting = `👋 *Bienvenue à la Bibliothèque Médicale de Chirurgie Orthopédique et Traumatologie!*\n\n` +
                          `🌐 ${countryInfo.greeting}\n\n` +
                          `Pour demander l'accès à la collection clinique, veuillez partager vos coordonnées dans un seul message:\n` +
                          `1. *Nom Complet*\n` +
                          `2. *E-mail* (personnel ou institutionnel)\n` +
                          `3. *Université ou Hôpital de formation*\n` +
                          `4. *Niveau actuel* (Résident R1-R4, Spécialiste)\n` +
                          `5. *Langue préférée* (FR, ES, EN, PT) [Optionnel]\n\n` +
                          `🌐 *Choix de Langue:* Tapez *"IDIOMA: FR"*, *"IDIOMA: ES"*, *"LANGUAGE: EN"* pour changer de langue à tout moment sans limite.\n\n` +
                          `💡 _Ou écrivez "MANUAL" pour consulter le guide officiel._`;
      } else {
        welcomeGreeting = `👋 *Bienvenido(a) a la Biblioteca Médica de Cirugía Ortopédica y Traumatología.*\n\n` +
                          `${countryInfo.flag} ${countryInfo.greeting}\n\n` +
                          `Iniciativa independiente de apoyo académico e investigación clínica.\n\n` +
                          `Para solicitar acceso a la colección clínica, por favor compártanos sus datos en un solo mensaje:\n` +
                          `1. *Nombre Completo*\n` +
                          `2. *Correo electrónico* (personal o institucional)\n` +
                          `3. *Universidad u Hospital de formación*\n` +
                          `4. *Nivel actual* (Residente R1-R4, Especialista, Egresado)\n` +
                          `5. *Idioma preferido* (ES, EN, PT, FR) [Opcional - predeterminado: Español]\n\n` +
                          `🌐 *Selección de Idioma:* Puede elegir su idioma preferido en cualquier momento enviando *"IDIOMA: ES"*, *"LANGUAGE: EN"*, *"IDIOMA: PT"* o *"IDIOMA: FR"* sin límites de cambio.\n\n` +
                          `💡 _O escriba "MANUAL" para consultar la guía oficial y directrices del servicio._`;
      }

      return {
        recipientPhone: cleanPhone,
        replyText: welcomeGreeting
      };
    }
  }

  // Si está SUSPENDIDO (24h, 48h, 72h)
  if (existingUser && existingUser.status && existingUser.status.startsWith('SUSPENDIDO') && !isAdmin) {
    const finSusp = existingUser.suspensionEnd ? new Date(existingUser.suspensionEnd).getTime() : 0;
    const now = Date.now();
    if (finSusp > 0 && now >= finSusp) {
      // Suspensión cumplida -> Reactivación autónoma
      existingUser.status = 'APROBADO';
      existingUser.unblockedAt = new Date().toISOString();
      const usersList = loadUsers();
      const uIdx = usersList.findIndex(u => u.phone === cleanPhone);
      if (uIdx !== -1) {
        usersList[uIdx].status = 'APROBADO';
        const { saveUsers } = require('./governance_and_bulletin.cjs');
        saveUsers(usersList);
      }
    } else {
      const diffMs = finSusp - now;
      const diffHrs = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
      return {
        recipientPhone: cleanPhone,
        replyText: `⏳ *ACCESO TEMPORALMENTE SUSPENDIDO*\n\n` +
                   `Su cuenta se encuentra suspendida de forma preventiva.\n` +
                   `⏱️ *Tiempo restante aproximado:* ${diffHrs} hora(s).\n` +
                   `📋 *Motivo:* ${existingUser.blockReason || 'Revisión disciplinaria.'}\n\n` +
                   `Su servicio se reactivará automáticamente al finalizar este término.`
      };
    }
  }

  // Si está PENDIENTE_APROBACION
  if (existingUser && existingUser.status === 'PENDIENTE_APROBACION' && !isAdmin) {
    return {
      recipientPhone: cleanPhone,
      replyText: `📩 *Información Recibida por la Dirección*\n\nHemos recibido su mensaje:\n"${text}"\n\nLa Dirección del Proyecto está revisando los detalles para resolver su habilitación de acceso.`,
      alertToGerente: {
        phone: ADMIN_PHONE,
        message: `📩 *RESPUESTA / MENSAJE DE POSTULANTE PENDIENTE*\n` +
                 `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                 `👤 *Médico:* ${existingUser.name}\n` +
                 `📱 *WhatsApp:* ${cleanPhone}\n` +
                 `💬 *Mensaje recibido:*\n"${text}"\n` +
                 `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                 `⚡ *Acciones Rápidas:*\n` +
                 `1️⃣ *ACTIVAR ${cleanPhone}*\n` +
                 `2️⃣ *RECHAZAR ${cleanPhone}*\n` +
                 `3️⃣ *MENSAJE ${cleanPhone} [respuesta]*`
      }
    };
  }

  // Si está RECHAZADO
  if (existingUser && existingUser.status === 'RECHAZADO' && !isAdmin) {
    return {
      recipientPhone: cleanPhone,
      replyText: `📋 *SOLICITUD PREVIA NO ADMITIDA*\n\n` +
                 `Su solicitud previa de acceso no fue admitida por la Dirección.\n` +
                 `📋 *Motivo:* ${existingUser.rejectionReason || 'No cumple con los requisitos institucionales.'}\n\n` +
                 `Si desea presentar nuevas credenciales institucionales o aclarar su caso, puede enviar sus datos a este chat para reconsideración.`
    };
  }

  // Si está BLOQUEADO
  if (existingUser && existingUser.status === 'BLOQUEADO' && !isAdmin) {
    return {
      recipientPhone: cleanPhone,
      replyText: `⛔ *Acceso Suspendido*\n\n` +
                 `Su cuenta se encuentra inhabilitada por decisión de la Dirección Médica.\n` +
                 `Motivo: ${existingUser.blockReason || 'Incumplimiento de las reglas de uso'}.`
    };
  }

  // =========================================================================
  // 5. ATENCIÓN A USUARIOS AUTORIZADOS (Y SUPERUSUARIO GESTOR DE CONTENIDO)
  // =========================================================================

  // 4.1.4 Cambio Inmediato de Idioma de Comunicación (Sin Límite de Frecuencia)
  if (lower.startsWith('idioma:') || lower.startsWith('language:') || lower.startsWith('lang:') || lower === 'idioma' || lower === 'language') {
    const isPromptOnly = lower === 'idioma' || lower === 'language';
    const currentLang = existingUser ? (existingUser.preferredLanguage || 'ES') : 'ES';

    if (isPromptOnly) {
      return {
        recipientPhone: cleanPhone,
        replyText: `🌐 *PREFERENCIA DE IDIOMA / LANGUAGE SETTING*\n` +
                   `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                   `Idioma actual de comunicación: *${currentLang}*\n\n` +
                   `Puede cambiar su idioma de comunicación en cualquier momento sin límites de actualización enviando:\n\n` +
                   `• *IDIOMA: ES* (Español)\n` +
                   `• *LANGUAGE: EN* (English)\n` +
                   `• *IDIOMA: PT* (Português)\n` +
                   `• *IDIOMA: FR* (Français)\n\n` +
                   `ℹ️ *Preservación de Literatura Médica:* Los artículos y libros científicos en PDF se descargan siempre en su idioma original de publicación para mantener la fidelidad quirúrgica y científica.\n` +
                   `━━━━━━━━━━━━━━━━━━━━━━━━━━`
      };
    }

    const cleanLangCode = text.replace(/^(?:idioma|language|lang)\s*:\s*/i, '').trim();
    const langRes = updateUserLanguage(cleanPhone, cleanLangCode);

    if (!langRes.success) {
      return {
        recipientPhone: cleanPhone,
        replyText: `⚠️ No se encontró registro para actualizar el idioma de comunicación.`
      };
    }

    const nL = langRes.newLanguage;
    let confirmMsg = '';
    if (nL === 'EN') {
      confirmMsg = `🌐 *LANGUAGE SUCCESSFULLY UPDATED*\n` +
                   `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                   `Your preferred communication language has been set to: *English (EN)*.\n\n` +
                   `All future responses, search digests, evidence summaries, and administrative announcements will be sent to you in English.\n\n` +
                   `📚 *Medical Literature Notice:* Original scientific PDF articles and textbooks are preserved and downloaded in their authentic language of publication.\n` +
                   `━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    } else if (nL === 'PT') {
      confirmMsg = `🌐 *IDIOMA ATUALIZADO COM SUCESSO*\n` +
                   `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                   `Seu idioma de comunicação preferido agora é: *Português (PT)*.\n\n` +
                   `Todas as respostas futuras, sínteses de evidências, resumos de busca e comunicados administrativos serão enviados em português.\n\n` +
                   `📚 *Aviso sobre Literatura Médica:* Livros e artigos científicos em PDF originais são mantidos e baixados em seu idioma de publicação autêntico.\n` +
                   `━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    } else if (nL === 'FR') {
      confirmMsg = `🌐 *LANGUE MISE À JOUR AVEC SUCCÈS*\n` +
                   `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                   `Votre langue de communication préférée est maintenant: *Français (FR)*.\n\n` +
                   `Toutes les futures réponses, synthèses d'évidences et annonces seront envoyées en français.\n` +
                   `━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    } else {
      confirmMsg = `🌐 *IDIOMA DE COMUNICACIÓN ACTUALIZADO*\n` +
                   `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                   `Su idioma de comunicación ha sido configurado en: *Español (ES)*.\n\n` +
                   `Todas las respuestas futuras, síntesis de evidencia clínica, fichas y comunicados de la Dirección le serán entregados en español.\n\n` +
                   `📚 *Nota de Literatura Médica:* Los artículos y libros científicos en PDF conservan su idioma original de publicación para salvaguardar la fidelidad diagnóstica y quirúrgica.\n` +
                   `━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    }

    return {
      recipientPhone: cleanPhone,
      replyText: confirmMsg
    };
  }

  // 4.1.5 Actualización de Datos Personales
  if (lower.startsWith('actualizar:') || lower.startsWith('actualizar datos:') || lower === 'actualizar datos' || lower === 'actualizar perfil' || lower === 'actualizar correo' || lower === 'actualizar mi perfil') {
    const isPromptOnly = lower === 'actualizar datos' || lower === 'actualizar perfil' || lower === 'actualizar correo' || lower === 'actualizar mi perfil';
    if (isPromptOnly) {
      return {
        recipientPhone: cleanPhone,
        replyText: `📝 *ACTUALIZACIÓN DE DATOS PERSONALES*\n` +
                   `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                   `Estimado(a) ${existingUser ? existingUser.name : 'Colega'}:\n\n` +
                   `Puede actualizar sus datos personales en cualquier momento enviando un mensaje con la estructura:\n\n` +
                   `👉 *ACTUALIZAR: [Nombre], [Correo], [Hospital/Universidad], [Nivel]*\n\n` +
                   `_Ejemplo:_\n` +
                   `\`ACTUALIZAR: Dr. Carlos Pérez, carlos.perez@hospital.edu.co, Hospital San José, Especialista\`\n\n` +
                   `ℹ️ *Política de Seguridad y Frecuencia Máxima:*\n` +
                   `Para preservar la trazabilidad institucional y prevenir suplantaciones de identidad:\n` +
                   `• Máximo *3 actualizaciones en 6 meses* (180 días).\n` +
                   `• Máximo *6 actualizaciones en 12 meses* (365 días).\n` +
                   `━━━━━━━━━━━━━━━━━━━━━━━━━━`
      };
    }

    const cleanPayload = text.replace(/^actualizar(\s+datos)?\s*:\s*/i, '').trim();
    const parts = cleanPayload.split(',').map(s => s.trim()).filter(Boolean);
    let newName = '', newEmail = '', newInst = '', newLevel = '';

    const emailMatch = cleanPayload.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) newEmail = emailMatch[0];

    if (parts.length >= 2) {
      if (parts[0] && !parts[0].includes('@')) newName = parts[0];
      for (let p = 1; p < parts.length; p++) {
        const part = parts[p];
        if (part.includes('@')) newEmail = part;
        else if (/\b(residente|especialista|egresado|r[1-4]|fellow)\b/i.test(part)) newLevel = part;
        else if (!newInst) newInst = part;
      }
    } else {
      if (/\b(residente|especialista|egresado|r[1-4])\b/i.test(cleanPayload)) {
        const lm = cleanPayload.match(/\b(residente(?:\s+r[1-4])?|especialista|egresado|fellow)\b/i);
        if (lm) newLevel = lm[0];
      }
      if (newEmail) {
        const withoutEmail = cleanPayload.replace(newEmail, '').trim();
        if (withoutEmail.length > 3) newInst = withoutEmail;
      }
    }

    const updateRes = updateUserProfile(cleanPhone, {
      name: newName,
      email: newEmail,
      university: newInst,
      level: newLevel
    });

    if (!updateRes.success) {
      if (updateRes.error === 'LIMIT_6M_EXCEEDED') {
        return {
          recipientPhone: cleanPhone,
          replyText: `⚠️ *LÍMITE DE ACTUALIZACIÓN ALCANZADO*\n` +
                     `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                     `Estimado(a) Colega:\n` +
                     `Ha alcanzado el límite institucional de *3 actualizaciones en un periodo de 6 meses*.\n\n` +
                     `Para modificaciones excepcionales o de fuerza mayor, puede enviar un mensaje directo a la Dirección:\n` +
                     `👉 *MENSAJE A LA DIRECCIÓN: [su solicitud]*`
        };
      }
      if (updateRes.error === 'LIMIT_12M_EXCEEDED') {
        return {
          recipientPhone: cleanPhone,
          replyText: `⚠️ *LÍMITE DE ACTUALIZACIÓN ALCANZADO*\n` +
                     `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                     `Estimado(a) Colega:\n` +
                     `Ha alcanzado el límite institucional de *6 actualizaciones en un periodo de 12 meses*.\n\n` +
                     `Para situaciones especiales, puede comunicarse directamente con la Dirección:\n` +
                     `👉 *MENSAJE A LA DIRECCIÓN: [su solicitud]*`
        };
      }
    }

    const u = updateRes.user;
    return {
      recipientPhone: cleanPhone,
      replyText: `✅ *DATOS PERSONALES ACTUALIZADOS CON ÉXITO*\n` +
                 `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                 `Estimado(a) *${u.name}*:\n` +
                 `Su información personal ha sido actualizada satisfactoriamente en el Directorio Institucional.\n\n` +
                 `📋 *Ficha Actualizada:*\n` +
                 `• 👤 *Nombre:* ${u.name}\n` +
                 `• 📧 *Correo:* ${u.email || 'No registrado'}\n` +
                 `• 🏥 *Institución:* ${u.university}\n` +
                 `• 🎓 *Nivel:* ${u.level}\n\n` +
                 `📊 *Control de Frecuencia:*\n` +
                 `Ha utilizado *${updateRes.count6m} de 3* actualizaciones permitidas en 6 meses (*${updateRes.count12m} de 6* anuales).\n` +
                 `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      alertToGerente: {
        phone: ADMIN_PHONE,
        message: `📝 *ACTUALIZACIÓN DE DATOS DE USUARIO*\n` +
                 `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                 `👤 *Médico:* ${u.name}\n` +
                 `📱 *WhatsApp:* \`${cleanPhone}\`\n` +
                 `📧 *Correo:* ${u.email || 'N/A'}\n` +
                 `🏥 *Institución:* ${u.university}\n` +
                 `🎓 *Nivel:* ${u.level}\n` +
                 `📊 *Frecuencia:* ${updateRes.count6m}/3 en 6m (${updateRes.count12m}/6 en 12m)\n` +
                 `👉 Registrado confidencialmente en el Directorio de Usuarios.`
      }
    };
  }

  // 4.2 Canal Intermediado con la Dirección
  if (lower.startsWith('mensaje a la direccion:') || lower.startsWith('mensaje a la dirección:') || lower.startsWith('mensaje al gestor:') || lower.startsWith('contactar gestor:') || lower.startsWith('gestor:') || lower.startsWith('direccion:') || lower.startsWith('dirección:')) {
    const userQuery = text.replace(/^(mensaje a la direcci[oó]n|mensaje al gestor|contactar gestor|gestor|direcci[oó]n)\s*:\s*/i, '').trim();
    if (userQuery.length > 5) {
      return {
        recipientPhone: cleanPhone,
        replyText: `📩 *Mensaje Transmitido a la Dirección*\n\n` +
                   `Estimado(a) ${existingUser ? existingUser.name : 'Colega'}: Su comunicación ha sido enviada a la *Dirección del Proyecto* de forma confidencial.\n` +
                   `Le notificaremos en este mismo chat en cuanto se emita una respuesta institucional.`,
        alertToGerente: {
          phone: ADMIN_PHONE,
          message: `📩 *MENSAJE RECIBIDO PARA LA DIRECCIÓN DEL PROYECTO*\n` +
                   `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                   `👤 *Médico:* ${existingUser ? existingUser.name : 'Usuario'} (${existingUser ? existingUser.university : 'N/A'})\n` +
                   `📱 *WhatsApp:* \`${cleanPhone}\`\n` +
                   `📝 *Contenido:* "${userQuery}"\n` +
                   `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                   `👉 *Para responder de forma anónima:* \`RESPONDER ${cleanPhone} [su respuesta aquí]\``
        }
      };
    }
  }

  // 4.3 Menú de Especialidades Ortopédicas
  if (lower.startsWith('categorias') || lower.startsWith('especialidades') || lower === 'temas' || lower === 'menu') {
    return {
      recipientPhone: cleanPhone,
      replyText: `📚 *ESPECIALIDADES DISPONIBLES EN LA BIBLIOTECA:*\n\n` +
                 `1. *Infeccioso* (Artritis séptica, osteomielitis, fracturas abiertas)\n` +
                 `2. *Cadera y Pelvis* (Artroplastia, fracturas acetabulares, osteotomías)\n` +
                 `3. *Rodilla y Tibia* (Platillos tibiales, LCA, meniscos, osteotomías)\n` +
                 `4. *Pie y Tobillo* (Pilón tibial, fracturas maleolares, calcáneo, Lisfranc)\n` +
                 `5. *Hombro y Codo* (Manguito rotador, Latarjet, prótesis reversa)\n` +
                 `6. *Columna* (Trauma raquimedular, deformidades, cervical/lumbar)\n` +
                 `7. *Ortopedia Pediátrica* (Displasia de cadera, pie equinovaro)\n` +
                 `8. *Catálogos de Materiales* (Técnicas de fabricantes Synthes, Stryker, Zimmer)\n\n` +
                 `💡 *Para consultar:* Escriba directamente el tema o patología que busca.`
    };
  }

  // 4.4 Filtro de Pertinencia Temática (Duda Clínica)
  const isOffTopic = OFF_TOPIC_TERMS.some(term => lower.includes(term));
  if (isOffTopic && !isAdmin) {
    return {
      recipientPhone: cleanPhone,
      replyText: `⚠️ *Consulta Fuera del Ámbito de la Biblioteca*\n\n` +
                 `Le recordamos que este proyecto está dedicado exclusivamente a la *Cirugía Ortopédica y Traumatología*.\n\n` +
                 `Si considera que su consulta guarda relación directa con patologías musculoesqueléticas, puede enviar una aclaración escribiendo:\n` +
                 `\`MENSAJE AL GESTOR: [Detalle de pertinencia clínica]\`\n\n` +
                 `Consulte las reglas de uso escribiendo *"MANUAL"*.`
    };
  }

  // 4.5 Detección Prioritaria de DOI / Identificador
  const doiMatch = text.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);
  if (doiMatch) {
    const rawDoi = doiMatch[0].toLowerCase();
    const catalogPath = path.join(__dirname, 'knowledge', 'master_catalog.json');
    let catalog = [];
    if (fs.existsSync(catalogPath)) {
      try { catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8')); } catch(e){}
    }

    const topDoc = catalog.find(d => 
      (d.doi && d.doi.toLowerCase().includes(rawDoi)) ||
      (d.filename && d.filename.toLowerCase().includes(rawDoi)) ||
      (d.title && d.title.toLowerCase().includes(rawDoi))
    );

    if (topDoc) {
      const downloadUrl = buildAnonymousDownloadUrl({ driveId: topDoc.driveId, userPhone: cleanPhone });
      return {
        recipientPhone: cleanPhone,
        replyText: `📖 *LITERATURA ENCONTRADA POR DOI*\n` +
                   `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                   `📌 *Título:* ${topDoc.title}\n` +
                   `✍️ *Autor:* ${topDoc.author} (${topDoc.year})\n` +
                   `📁 *Especialidad:* ${topDoc.category}\n` +
                   `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                   `🔗 *Descarga Segura en la Nube (Válida por 30 min):*\n${downloadUrl}`
      };
    }

    // Ticketing ante DOI no disponible
    const ticket = createLiteratureTicket({
      requestedTitle: text,
      doiOrIsbn: rawDoi,
      requesterPhone: cleanPhone,
      requesterName: existingUser ? existingUser.name : senderName,
      requesterUniversity: existingUser ? existingUser.university : 'N/A'
    });

    const alertMsg = formatGerenteAlertMessage(ticket);

    return {
      recipientPhone: cleanPhone,
      replyText: `📋 *Solicitud de Adquisición Registrada*\n\n` +
                 `Estimado(a) ${existingUser ? existingUser.name : 'Colega'}: Hemos creado el ticket de solicitud *\`${ticket.id}\`* para el artículo:\n` +
                 `\`${ticket.doiOrIsbn}\`\n\n` +
                 `Se ha emitido una alerta a la Dirección (*Gestor de Contenido*). Tan pronto el documento sea incorporado, se le enviará el enlace de descarga de forma automática.`,
      alertToGerente: {
        phone: ADMIN_PHONE,
        message: alertMsg
      }
    };
  }

  // 4.6 Búsqueda Clínica por Términos / Palabras Clave
  const results = searchClinicalLiterature(text);

  if (results && results.length > 0) {
    const topDoc = results[0];
    const downloadUrl = buildAnonymousDownloadUrl({ driveId: topDoc.driveId, userPhone: cleanPhone });

    let reply = `📖 *LITERATURA ENCONTRADA*\n`;
    reply += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    reply += `📌 *Título:* ${topDoc.title}\n`;
    reply += `✍️ *Autor:* ${topDoc.author} (${topDoc.year})\n`;
    reply += `📁 *Especialidad:* ${topDoc.category}\n`;
    if (topDoc.aoClass && topDoc.aoClass !== 'N/A') {
      reply += `🎯 *Clasificación AO:* ${topDoc.aoClass}\n`;
    }
    reply += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    reply += `🔗 *Descarga Segura en la Nube (Válida por 30 min):*\n${downloadUrl}\n\n`;

    if (results.length > 1) {
      reply += `📚 *Otras referencias relacionadas encontradas:*\n`;
      for (let i = 1; i < Math.min(results.length, 3); i++) {
        reply += `• ${results[i].year} | ${results[i].author} — _"${results[i].title.slice(0, 70)}..."_\n`;
      }
    }

    return {
      recipientPhone: cleanPhone,
      replyText: reply
    };
  }

  // 4.7 No Encontrado
  return {
    recipientPhone: cleanPhone,
    replyText: `🔍 *Documento no disponible en la colección actual.*\n\n` +
               `No encontramos resultados exactos para: _"${text}"_.\n\n` +
               `👉 *¿Desea que gestionemos su búsqueda e ingreso?*\n` +
               `Por favor responda compartiendo el *DOI*, *ISBN* o el título exacto en inglés/español con el año.\n\n` +
               `💡 *Aporte Colaborativo:* Si usted dispone del PDF, puede subirlo a la carpeta comunitaria \`_BIBLIOTECARIO\`. El agente verificará que no esté duplicado y priorizará sus futuras peticiones.\n\n` +
               `📖 Escriba *"MANUAL"* para consultar las instrucciones completas.`
  };
}

function extractUniversity(text) {
  const match = text.match(/(universidad\s+[^-\n,]+|hospital\s+[^-\n,]+|clinica\s+[^-\n,]+)/i);
  return match ? match[0].trim() : null;
}

function extractLevel(text) {
  const match = text.match(/(residente\s*r[1-4]|residente|especialista|fellow|egresado)/i);
  return match ? match[0].trim() : null;
}

module.exports = {
  processIncomingWhatsAppMessage,
  ADMIN_PHONE,
  recordSentinelMetric,
  computeSentinelStats,
  getSentinelReport
};
