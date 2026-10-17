const fs = require('fs');

console.log("🚀 Aplicando arquitectura de Stickers 3D Transparentes...");

// 1. ACTUALIZAR FASE 2: DICCIONARIO Y RESOLVER DE STICKERS
let brain = fs.readFileSync('fase2_ai_agent_brain.js', 'utf8');

// A. Inyectar stickerEstatico y stickerAnimado en cada personaje de DICCIONARIO_MAESTRO_PERSONAJES_
const characters = [
  'SPAWN', 'GATO_CON_BOTAS', 'BATMAN', 'IRON_MAN', 'OPTIMUS_PRIME', 'SPIDERMAN',
  'THOR', 'HULK', 'WOLVERINE', 'DEADPOOL', 'LOKI', 'SUPERMAN',
  'FLASH', 'HELLBOY', 'DOCTOR_STRANGE', 'BLACK_WIDOW', 'CAPITAN_AMERICA', 'WONDER_WOMAN',
  'MORGAN_FREEMAN', 'ALEXA', 'ALEX', 'FEMENINO_DULCE', 'MASCULINO_CORDIAL', 'ROBOTICA'
];

characters.forEach(k => {
  const keyLower = k.toLowerCase();
  const staticUrl = `https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/${keyLower}_sticker_static.webp`;
  const animUrl = `https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/${keyLower}_sticker_anim.webp`;

  const regex = new RegExp(`(${k}:\\s*\\{[\\s\\S]*?imagenUrl:[^\\n]+)`, 'g');
  brain = brain.replace(regex, (match) => {
    if (match.includes('stickerEstatico:')) return match;
    return `${match}\n    stickerEstatico: "${staticUrl}",\n    stickerAnimado: "${animUrl}",`;
  });
});

// B. Agregar resolverStickerPersonajeDinamico_
const resolverCode = `
/**
 * Alterna inteligentemente entre sticker estático y animado con movimientos sutiles
 * para cada cambio de personaje o demostración, garantizando fondo transparente y fidelidad 3D.
 *
 * @param {Object} def Definición del personaje
 * @param {string} [telefono] Teléfono del usuario para persistir la alternancia
 * @returns {Object} { url: string, tipo: 'estatico' | 'animado' }
 */
function resolverStickerPersonajeDinamico_(def, telefono) {
  if (!def) return { url: null, tipo: "ninguno" };

  const keyLower = String(def.id || "gato_con_botas").toLowerCase();
  const defaultStatic = "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/" + keyLower + "_sticker_static.webp";
  const defaultAnim = "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/" + keyLower + "_sticker_anim.webp";

  const urlStatic = def.stickerEstatico || defaultStatic;
  const urlAnim = def.stickerAnimado || defaultAnim;

  let alternarAnimado = false;
  try {
    const props = PropertiesService.getUserProperties() || PropertiesService.getScriptProperties();
    const propKey = "STICKER_MODO_" + (telefono ? String(telefono).replace(/\\D/g, "") : "GLOBAL");
    const ultimoModo = props.getProperty(propKey) || "estatico";
    alternarAnimado = (ultimoModo === "estatico");
    props.setProperty(propKey, alternarAnimado ? "animado" : "estatico");
  } catch (e) {
    alternarAnimado = Math.random() < 0.5;
  }

  if (alternarAnimado && urlAnim) {
    return { url: urlAnim, tipo: "animado" };
  }
  return { url: urlStatic, tipo: "estatico" };
}
`;

if (!brain.includes('function resolverStickerPersonajeDinamico_')) {
  brain = brain.replace('function obtenerDefinicionPersonajeCompleta_', resolverCode + '\nfunction obtenerDefinicionPersonajeCompleta_');
}

// C. Inyectar urlSticker y tipoSticker en ejecutarCambioVozOAsistente_ y ejecutarDemostracionVoz_
// Reemplazar caso cambio_solo_voz
brain = brain.replace(
  /return\s*\{\s*tipo:\s*"cambio_solo_voz"[\s\S]*?urlImagen:\s*def\.imagenUrl\s*\|\|\s*null,[\s\S]*?captionImagen:[^\n]+\n\s*\};/g,
  `const stickerInfoSoloVoz = resolverStickerPersonajeDinamico_(def, telefono);
    return {
      tipo: "cambio_solo_voz",
      texto: \`\${def.emoji} *Perfil y Copiloto Actualizado:*\\n\` +
        \`He asumido la identidad y voz de *\${def.nombreOficial || def.descVoz}*.\\n\\n\` +
        (def.lema ? \`_«\${def.lema}»_\\n\\n\` : "") +
        \`🎙️ *Te acabo de enviar mi saludo oficial en una nota de voz.* A partir de ahora te responderé con mi tono, visión y personalidad fiduciaria.\\n\\n\` +
        \`\${iconoAccion} *¿Qué deseas gestionar hoy?* Puedes registrar un gasto o venta, auditar saldos bancarios o consultar compromisos en cualquier momento.\`,
      textoVoz: saludoVoz,
      perfilVoz: def.id,
      requiereAudio: true,
      urlSticker: stickerInfoSoloVoz.url,
      tipoSticker: stickerInfoSoloVoz.tipo,
      urlImagen: stickerInfoSoloVoz.url,
      captionImagen: null
    };`
);

// Reemplazar caso cambio_nombre_y_voz
brain = brain.replace(
  /return\s*\{\s*tipo:\s*"cambio_nombre_y_voz"[\s\S]*?urlImagen:\s*def\.imagenUrl\s*\|\|\s*null,[\s\S]*?captionImagen:[^\n]+\n\s*\};/g,
  `const stickerInfoNombreVoz = resolverStickerPersonajeDinamico_(def, telefono);
    return {
      tipo: "cambio_nombre_y_voz",
      texto: \`\${def.emoji} *¡Entendido! A partir de ahora seré \${aliasFinal} (\${def.titulo}).*\\n\\n\` +
        \`🎙️ He configurado mi voz oficial como *\${def.descVoz}* y te acabo de enviar mi saludo en una nota de voz.\\n\\n\` +
        (def.lema ? \`_«\${def.lema}»_\\n\\n\` : "") +
        \`\${iconoAccion} *¿Qué deseas gestionar hoy?* Puedes registrar un gasto o venta, auditar saldos bancarios o consultar compromisos en cualquier momento.\\n\\n\` +
        \`Puedes hablarme o pedirme notas de voz cuando gustes diciendo *"Hola \${aliasFinal}"* o enviándome notas de voz. Si en algún momento deseas cambiar mi nombre o voz, solo dímelo.\`,
      textoVoz: saludoVozNom,
      perfilVoz: def.id,
      requiereAudio: true,
      urlSticker: stickerInfoNombreVoz.url,
      tipoSticker: stickerInfoNombreVoz.tipo,
      urlImagen: stickerInfoNombreVoz.url,
      captionImagen: null
    };`
);

// Reemplazar caso demostracion_voz
brain = brain.replace(
  /return\s*\{\s*tipo:\s*"demostracion_voz"[\s\S]*?urlImagen:\s*def\.imagenUrl\s*\|\|\s*null,[\s\S]*?captionImagen:[^\n]+\n\s*\};/g,
  `const stickerInfoDemo = resolverStickerPersonajeDinamico_(def, telefono);
  return {
    tipo: "demostracion_voz",
    texto: textoCard,
    textoVoz: textoSpoken,
    perfilVoz: def.id,
    requiereAudio: true,
    urlSticker: stickerInfoDemo.url,
    tipoSticker: stickerInfoDemo.tipo,
    urlImagen: stickerInfoDemo.url,
    captionImagen: null
  };`
);

fs.writeFileSync('fase2_ai_agent_brain.js', brain, 'utf8');
console.log("✅ fase2_ai_agent_brain.js actualizado con soporte de Stickers 3D.");

// 2. ACTUALIZAR FASE 3: WEBHOOK DESPACHO 3 BURBUJAS Y FUNCIÓN enviarStickerWhatsApp
let webhook = fs.readFileSync('fase3_whatsapp_webhook.js', 'utf8');

const stickerFunctions = `
/**
 * Despacha un Sticker 3D oficial con fondo transparente (WebP 512x512, estático o animado)
 * a través de la API oficial de Meta WhatsApp Cloud.
 * Soporta precarga obligatoria como Blob nativo a Meta /media (MIME: image/webp) y fallback a link.
 * 
 * @param {string} telefonoDestino Número de teléfono de destino
 * @param {string} urlSticker URL directa HTTPS del archivo .webp
 * @returns {Object} Resultado del despacho { enviado: boolean, idMensaje?: string, error?: string }
 */
function enviarStickerWhatsApp(telefonoDestino, urlSticker) {
  const telDestino = telefonoDestino || CONFIG_FINANZAS.TELEFONO_ADMIN_DEFAULT;
  const telNormalizado = normalizarTelefono_(telDestino);
  const token = obtenerMetaToken_();
  const phoneId = obtenerMetaPhoneId_();
  const linkUrl = String(urlSticker || "").trim();

  if (!linkUrl) {
    Logger.log("Aviso: URL de sticker vacía en enviarStickerWhatsApp");
    return { enviado: false, error: "URL de sticker vacía" };
  }

  if (!token || !phoneId) {
    Logger.log("[SIMULACIÓN STICKER WHATSAPP] Para: " + telNormalizado + " -> URL: " + linkUrl);
    return { simulado: true, enviado: true, destino: telNormalizado };
  }

  const baseUrl = META_CONFIG.URL_BASE_GRAPH || "https://graph.facebook.com/";
  const graphVer = META_CONFIG.GRAPH_VERSION || META_CONFIG.VERSION || "v21.0";
  const urlMensajes = (baseUrl.endsWith("/") ? baseUrl : baseUrl + "/") + graphVer + "/" + phoneId + "/messages";
  const urlMedia = (baseUrl.endsWith("/") ? baseUrl : baseUrl + "/") + graphVer + "/" + phoneId + "/media";

  let mediaId = null;
  try {
    const resSticker = UrlFetchApp.fetch(linkUrl, {
      method: "GET",
      muteHttpExceptions: true,
      headers: {
        "User-Agent": "AntigravityFinancialBot/1.0 (admin@grupomore.com)"
      }
    });
    const code = resSticker.getResponseCode();
    if (code === 200) {
      const blob = resSticker.getBlob();
      blob.setContentType("image/webp");

      const mediaPayload = {
        messaging_product: "whatsapp",
        type: "image/webp",
        file: blob
      };
      const resMedia = UrlFetchApp.fetch(urlMedia, {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        payload: mediaPayload,
        muteHttpExceptions: true
      });
      const mediaJson = JSON.parse(resMedia.getContentText());
      if (mediaJson && mediaJson.id) {
        mediaId = mediaJson.id;
        Logger.log("✅ Sticker 3D precargado en Meta /media (ID: " + mediaId + ")");
      }
    }
  } catch (errBlob) {
    Logger.log("Excepción al precargar sticker en Meta: " + errBlob.message);
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: telNormalizado,
    type: "sticker",
    sticker: mediaId ? { id: mediaId } : { link: linkUrl }
  };

  try {
    const res = UrlFetchApp.fetch(urlMensajes, {
      method: "POST",
      contentType: "application/json",
      headers: { Authorization: "Bearer " + token },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    const code = res.getResponseCode();
    const json = JSON.parse(res.getContentText());
    if (code === 200 || code === 201) {
      Logger.log("✅ Sticker 3D despachado con éxito a " + telNormalizado + ". ID: " + (json.messages ? json.messages[0].id : "OK"));
      return { enviado: true, idMensaje: json.messages ? json.messages[0].id : null };
    } else {
      Logger.log("Aviso al despachar sticker (" + code + "): " + JSON.stringify(json));
      return { enviado: false, error: json };
    }
  } catch (err) {
    Logger.log("Excepción al enviar sticker WhatsApp: " + err.message);
    return { enviado: false, error: err.message };
  }
}

/**
 * Despacha exclusivamente la nota de voz neural de Fish Audio al usuario
 * sin enviar mensajes de texto acompañantes redundantes.
 */
function despacharSoloAudioWhatsApp_(telefonoDestino, textoAudio, perfilVoz) {
  let perfil = perfilVoz;
  let nombreUsuario = "Fernando";
  if (typeof validarPermisoUsuario === "function") {
    try {
      const perm = validarPermisoUsuario(telefonoDestino);
      if (perm && perm.perfilVoz && !perfil) perfil = perm.perfilVoz;
      if (perm && perm.nombre) nombreUsuario = perm.nombre;
    } catch (e) {}
  }
  const baseTexto = textoAudio || "Saludo oficial del copiloto financiero.";
  const textoParaAudio = enriquecerTextoVozSegunPerfilYHorario_(baseTexto, perfil, nombreUsuario);
  const textoParaAudioCorto = podarTextoParaVozCorta_(textoParaAudio, perfil, 46);
  const audio = sintetizarVozNeural_(textoParaAudioCorto, perfil);
  return enviarAudioWhatsApp(telefonoDestino, audio, null);
}
`;

if (!webhook.includes('function enviarStickerWhatsApp')) {
  webhook = webhook.replace('function enviarImagenWhatsApp', stickerFunctions + '\nfunction enviarImagenWhatsApp');
}

// B. Actualizar el bloque de despacho en despacharRespuestaWhatsApp_ (3 Burbujas estrictas)
const oldDispatchBlock = `    // Si la respuesta incluye imagen de presentación o cambio del centinela financiero
    if (respuestaAgente.urlImagen) {
      try {
        enviarImagenWhatsApp(remitente, respuestaAgente.urlImagen, respuestaAgente.captionImagen || "");
        Utilities.sleep(1200); // Pausa estratégica para garantizar orden secuencial en WhatsApp
      } catch (eImg) {
        Logger.log("Aviso al enviar imagen de bienvenida de personaje: " + eImg.message);
      }
    }

    if (respuestaAgente.requiereAudio && (respuestaAgente.textoVoz || respuestaAgente.texto)) {
      enviarRespuestaVozWhatsApp(remitente, respuestaAgente.texto, respuestaAgente.perfilVoz, respuestaAgente.textoVoz);
    } else if (respuestaAgente.texto) {
      enviarMensajeWhatsApp(remitente, respuestaAgente.texto);
    }`;

const newDispatchBlock = `    // SOLUCIÓN DE FLUJO EXCLUSIVO DE CAMBIO DE PERSONAJE / STICKER 3D:
    // Burbuja 1: El Sticker 3D (alternando entre pose fija y sticker animado con movimiento sutil) con fondo transparente.
    // Burbuja 2: El texto de confirmación con la personalidad del personaje.
    // Burbuja 3: La nota de voz oficial generada por Fish Audio.
    if (respuestaAgente.urlSticker || respuestaAgente.urlImagen) {
      const urlStickerTarget = respuestaAgente.urlSticker || respuestaAgente.urlImagen;
      try {
        if (typeof enviarStickerWhatsApp === "function" && (respuestaAgente.urlSticker || urlStickerTarget.includes(".webp"))) {
          enviarStickerWhatsApp(remitente, urlStickerTarget);
        } else if (typeof enviarImagenWhatsApp === "function") {
          enviarImagenWhatsApp(remitente, urlStickerTarget, respuestaAgente.captionImagen || "");
        }
        Utilities.sleep(1000); // Pausa estratégica: Garantiza que Burbuja 1 (Sticker 3D) llegue primero
      } catch (eSticker) {
        Logger.log("Aviso al despachar sticker 3D de personaje: " + eSticker.message);
      }

      // Burbuja 2: Texto de confirmación con la personalidad del personaje
      if (respuestaAgente.texto) {
        enviarMensajeWhatsApp(remitente, respuestaAgente.texto);
        Utilities.sleep(800); // Pausa estratégica: Garantiza que Burbuja 2 llegue en segundo lugar
      }

      // Burbuja 3: Nota de voz oficial generada por Fish Audio
      if (respuestaAgente.requiereAudio && (respuestaAgente.textoVoz || respuestaAgente.texto)) {
        if (typeof despacharSoloAudioWhatsApp_ === "function") {
          despacharSoloAudioWhatsApp_(remitente, respuestaAgente.textoVoz || respuestaAgente.texto, respuestaAgente.perfilVoz);
        } else {
          enviarRespuestaVozWhatsApp(remitente, null, respuestaAgente.perfilVoz, respuestaAgente.textoVoz || respuestaAgente.texto);
        }
      }
      return;
    }

    if (respuestaAgente.requiereAudio && (respuestaAgente.textoVoz || respuestaAgente.texto)) {
      enviarRespuestaVozWhatsApp(remitente, respuestaAgente.texto, respuestaAgente.perfilVoz, respuestaAgente.textoVoz);
    } else if (respuestaAgente.texto) {
      enviarMensajeWhatsApp(remitente, respuestaAgente.texto);
    }`;

webhook = webhook.replace(oldDispatchBlock, newDispatchBlock);

fs.writeFileSync('fase3_whatsapp_webhook.js', webhook, 'utf8');
console.log("✅ fase3_whatsapp_webhook.js actualizado con flujo de 3 Burbujas y enviarStickerWhatsApp.");
