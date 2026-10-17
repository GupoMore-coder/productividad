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
const { searchClinicalLiterature, createLiteratureTicket, formatGerenteAlertMessage } = require('./ticketing_and_intermediary.cjs');
const { registerUser, approveUser, blockUser, unblockUser, deleteUser, loadUsers } = require('./governance_and_bulletin.cjs');
const { buildAnonymousDownloadUrl, LIVE_WEBAPP_URL } = require('./anonymous_proxy.cjs');

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
 * Procesa un mensaje entrante de WhatsApp y genera la respuesta adecuada
 */
async function processIncomingWhatsAppMessage({ fromPhone, senderName, messageText }) {
  const cleanPhone = fromPhone.replace(/[^\d+]/g, '');
  const text = (messageText || '').trim();
  const lower = text.toLowerCase();

  // =========================================================================
  // 1. FLUJO PRIVILEGIADO DE DIRECCIÓN: GESTOR DE CONTENIDO
  // =========================================================================
  const isAdmin = cleanPhone === ADMIN_PHONE.replace(/[^\d+]/g, '') || cleanPhone === '573008880001';

  if (isAdmin) {
    // 1.1 Comando: APROBAR +57...
    if (lower.startsWith('aprobar')) {
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
      return { recipientPhone: ADMIN_PHONE, replyText: `💡 Formato: \`APROBAR +57XXXXXXXXXX\`` };
    }

    // 1.2 Comando: BLOQUEAR +57... [motivo]
    if (lower.startsWith('bloquear')) {
      const targetPhoneMatch = text.match(/\+?\d{10,14}/);
      if (targetPhoneMatch) {
        const targetPhone = targetPhoneMatch[0];
        const reason = text.replace(/bloquear\s+\+?\d{10,14}/i, '').trim() || 'Incumplimiento del código de conducta médica';
        const res = blockUser(targetPhone, reason);
        if (res.success) {
          return {
            recipientPhone: ADMIN_PHONE,
            replyText: `⛔ *Usuario Bloqueado*\nEl acceso de ${res.user.name} (${targetPhone}) ha sido suspendido.\nMotivo: "${reason}".`,
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

    // 1.3 Comando: DESBLOQUEAR +57...
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

    // 1.5 Comando: RESPONDER +57... [mensaje] (Canal Intermediado Anónimo)
    if (lower.startsWith('responder')) {
      const targetPhoneMatch = text.match(/\+?\d{10,14}/);
      if (targetPhoneMatch) {
        const targetPhone = targetPhoneMatch[0];
        const responseBody = text.replace(/responder\s+\+?\d{10,14}/i, '').trim();
        if (responseBody.length > 0) {
          return {
            recipientPhone: ADMIN_PHONE,
            replyText: `📤 *Mensaje Despachado al Usuario (${targetPhone})* de forma 100% anónima.`,
            notifyUser: {
              phone: targetPhone,
              message: `💬 *RESPUESTA DE LA DIRECCIÓN DEL PROYECTO*\n` +
                       `*Gestor de Contenido:*\n\n` +
                       `"${responseBody}"\n\n` +
                       `_Nota: Puede responder a este mensaje directamente en este chat si requiere aclaración adicional._`
            }
          };
        }
      }
      return { recipientPhone: ADMIN_PHONE, replyText: `💡 Formato: \`RESPONDER +57XXXXXXXXXX [su mensaje aquí]\`` };
    }

    // 1.6 Comando: REPORTE / ESTADO
    if (lower.includes('estado') || lower.includes('reporte') || lower.includes('resumen')) {
      const users = loadUsers();
      const approvedCount = users.filter(u => u.status === 'APROBADO').length;
      const pendingCount = users.filter(u => u.status === 'PENDIENTE_APROBACION').length;
      const blockedCount = users.filter(u => u.status === 'BLOQUEADO').length;
      return {
        recipientPhone: ADMIN_PHONE,
        replyText: `📊 *REPORTE DE DIRECCIÓN Y GOBERNANZA*\n` +
                   `*Dirección:* Gestor de Contenido\n` +
                   `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                   `👨‍⚕️ *Médicos Autorizados:* ${approvedCount}\n` +
                   `⏳ *Solicitudes Pendientes:* ${pendingCount}\n` +
                   `⛔ *Usuarios Suspendidos:* ${blockedCount}\n` +
                   `📚 *Documentos en Catálogo:* 1.634 títulos\n` +
                   `☁️ *Servidor Cloud:* Google Apps Script 24/7 (Operativo)\n` +
                   `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                   `💡 *Comandos disponibles:*\n` +
                   `• \`APROBAR +57...\` | \`BLOQUEAR +57... [motivo]\`\n` +
                   `• \`RESPONDER +57... [msg]\` | \`ELIMINAR +57...\``
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

    // Suspender preventivamente
    blockUser(cleanPhone, 'Uso de lenguaje obsceno, vulgar o inapropiado', offenderName);

    return {
      recipientPhone: cleanPhone,
      replyText: `⛔ *ACCESO SUSPENDIDO POR VIOLACIÓN DEL CÓDIGO DE CONDUCTA*\n\n` +
                 `Se ha detectado el uso de lenguaje vulgar, sensible o inapropiado en su mensaje.\n` +
                 `De conformidad con el Código de Conducta de la Biblioteca Médica, su cuenta ha sido suspendida de forma preventiva.\n\n` +
                 `El incidente ha sido remitido a la Dirección (*Gestor de Contenido*).`,
      alertToGerente: {
        phone: ADMIN_PHONE,
        message: `🚨 *ALERTA DE INCUMPLIMIENTO DISCIPLINARIO*\n` +
                 `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                 `👤 *Usuario:* ${offenderName} (\`${cleanPhone}\`)\n` +
                 `📝 *Mensaje:* "${text}"\n` +
                 `⚖️ *Acción Aplicada:* Cuenta suspendida preventivamente.\n` +
                 `👉 Para desbloquear: \`DESBLOQUEAR ${cleanPhone}\`\n` +
                 `👉 Para eliminar: \`ELIMINAR ${cleanPhone}\``
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

  if (!existingUser && !isAdmin) {
    const hasRegistrationData = (lower.includes('residente') || lower.includes('especialista') || lower.includes('universidad') || lower.includes('hospital')) && text.length > 20;

    if (hasRegistrationData) {
      const reg = registerUser({
        phone: cleanPhone,
        fullName: senderName || 'Dr. Solicitante',
        university: extractUniversity(text) || 'Institución Hospitalaria',
        level: extractLevel(text) || 'Residente en Ortopedia'
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
      return {
        recipientPhone: cleanPhone,
        replyText: `👋 *Bienvenido(a) a la Biblioteca Médica de Cirugía Ortopédica y Traumatología.*\n\n` +
                   `Este es un proyecto libre y de apoyo académico coordinado por el *Gestor de Contenido*.\n\n` +
                   `Para solicitar acceso a la colección clínica, por favor compártanos sus datos en un solo mensaje:\n` +
                   `1. *Nombre Completo*\n` +
                   `2. *Universidad u Hospital de formación*\n` +
                   `3. *Nivel actual* (Residente R1-R4, Especialista, Egresado)\n\n` +
                   `💡 _O escriba "MANUAL" para consultar la guía oficial y directrices del servicio._`
      };
    }
  }

  // Si está PENDIENTE_APROBACION
  if (existingUser && existingUser.status === 'PENDIENTE_APROBACION' && !isAdmin) {
    return {
      recipientPhone: cleanPhone,
      replyText: `⏳ *Solicitud en Proceso de Autorización*\n\n` +
                 `Estimado(a) ${existingUser.name}: Su solicitud se encuentra a la espera de aprobación por parte de la Dirección Médica (*Gestor de Contenido*).\n\n` +
                 `Le notificaremos en cuanto su acceso sea habilitado.`
    };
  }

  // Si está BLOQUEADO
  if (existingUser && existingUser.status === 'BLOQUEADO' && !isAdmin) {
    return {
      recipientPhone: cleanPhone,
      replyText: `⛔ *Acceso Suspendido*\n\n` +
                 `Su cuenta se encuentra inhabilitada por decisión de la Dirección Médica (*Gestor de Contenido*).\n` +
                 `Motivo: ${existingUser.blockReason || 'Incumplimiento de las reglas de uso'}.`
    };
  }

  // =========================================================================
  // 5. ATENCIÓN A USUARIOS AUTORIZADOS (Y SUPERUSUARIO GESTOR DE CONTENIDO)
  // =========================================================================

  // 4.2 Canal Intermediado con el Gestor de Contenido (Zero-Contact Directo)
  if (lower.startsWith('mensaje al gestor:') || lower.startsWith('contactar gestor:') || lower.startsWith('gestor:')) {
    const userQuery = text.replace(/^(mensaje al gestor|contactar gestor|gestor)\s*:\s*/i, '').trim();
    if (userQuery.length > 5) {
      return {
        recipientPhone: cleanPhone,
        replyText: `📩 *Mensaje Transmitido a la Dirección*\n\n` +
                   `Estimado(a) ${existingUser ? existingUser.name : 'Colega'}: Su comunicación ha sido enviada al *Gestor de Contenido* de forma confidencial.\n` +
                   `Le notificaremos en este mismo chat en cuanto se emita una respuesta.`,
        alertToGerente: {
          phone: ADMIN_PHONE,
          message: `📩 *MENSAJE RECIBIDO PARA EL GESTOR DE CONTENIDO*\n` +
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
  ADMIN_PHONE
};
