/**
 * ============================================================================
 * SISTEMA FINANCIERO INTELIGENTE - NÚCLEO FASE 3
 * Webhook Bidireccional de Meta WhatsApp Cloud API & Automatización Diaria
 * ============================================================================
 * 
 * Funcionalidades Principales:
 * 1. doGet: Validación oficial del handshake con Meta (hub.challenge).
 * 2. doPost: Recepción de mensajes en tiempo real desde WhatsApp.
 * 3. Enrutamiento automático hacia el Cerebro de IA (Fase 2).
 * 4. Despachador de mensajes salientes hacia la API oficial de Meta Graph.
 * 5. Disparador horario matutino (8:00 AM) para recordatorios automáticos de deudas.
 */

// ============================================================================
// CONFIGURACIÓN OFICIAL DE META WHATSAPP CLOUD API
// ============================================================================
const META_CONFIG = {
  // Token de verificación personalizado que configuras en Meta for Developers
  VERIFY_TOKEN: "antigravity_finanzas_token_2026",
  
  // Token de acceso permanente (System User) - Se almacena de forma segura en PropertiesService
  ACCESS_TOKEN: "", 
  
  // ID del número de teléfono asignado por WhatsApp Business en Meta
  PHONE_NUMBER_ID: "1050275638171147", 
  
  // Versión oficial de la API de Meta Graph
  GRAPH_VERSION: "v21.0",
  URL_BASE_GRAPH: "https://graph.facebook.com/",
  VERSION: "v21.0"
};

// ============================================================================
// CONFIGURACIÓN DE VOZ HIPERREALISTA - FISH AUDIO API (MOTOR PRINCIPAL)
// ============================================================================
const FISH_AUDIO_CONFIG = {
  // Clave API de Fish Audio activa y pre-configurada
  API_KEY: "sk-fish-YuWIPhPGRELFPNImRI3eEz_rZ7PmB_LOIoO96MoFVlc",
  URL_BASE_TTS: "https://api.fish.audio/v1/tts",
  MODELO: "s2.1-pro-free", // Modelo ultra-expresivo de alta fidelidad sin bloqueo de balance 402
  FORMATO: "mp3",
  BITRATE: 128
};

/**
 * Obtiene la API Key de Fish Audio desde ScriptProperties o desde FISH_AUDIO_CONFIG
 */
function obtenerFishAudioApiKey_() {
  const guardada = PropertiesService.getScriptProperties().getProperty("FISH_AUDIO_API_KEY");
  if (guardada && guardada.trim() !== "") return guardada.trim();
  return String(FISH_AUDIO_CONFIG.API_KEY || "").trim();
}

/**
 * Obtiene el modelo de Fish Audio a utilizar (por defecto s2.1-pro-free para acceso ilimitado a clones)
 */
function obtenerFishAudioModel_() {
  const guardado = PropertiesService.getScriptProperties().getProperty("FISH_AUDIO_MODEL");
  if (guardado && guardado.trim() !== "") return guardado.trim();
  return (typeof FISH_AUDIO_CONFIG !== "undefined" && FISH_AUDIO_CONFIG.MODELO) ? FISH_AUDIO_CONFIG.MODELO : "s2.1-pro-free";
}

/**
 * Guarda las credenciales de Meta de forma segura en las propiedades del script (Cifrado de Google)
 */
function configurarCredencialesMeta(accessToken, phoneNumberId, verifyToken) {
  const props = PropertiesService.getScriptProperties();
  if (accessToken && accessToken.trim() !== "") props.setProperty("META_ACCESS_TOKEN", accessToken.trim());
  if (phoneNumberId && phoneNumberId.trim() !== "") props.setProperty("META_PHONE_NUMBER_ID", phoneNumberId.trim());
  if (verifyToken && verifyToken.trim() !== "") props.setProperty("META_VERIFY_TOKEN", verifyToken.trim());
  Logger.log("✅ Credenciales de Meta WhatsApp guardadas con éxito en PropertiesService.");
  return "✅ Credenciales de Meta WhatsApp guardadas con éxito en PropertiesService.";
}

/**
 * Ejecuta esta función para asegurar la inicialización del token permanente en PropertiesService
 */
function aplicarTokenPermanenteMeta(token) {
  const props = PropertiesService.getScriptProperties();
  const tokenFinal = token || props.getProperty("META_ACCESS_TOKEN") || META_CONFIG.ACCESS_TOKEN;
  if (tokenFinal) {
    props.setProperty("META_ACCESS_TOKEN", tokenFinal);
    Logger.log("✅ Token permanente de Meta verificado y activo en PropertiesService.");
    return "✅ Token permanente de Meta guardado con éxito en PropertiesService.";
  }
  return "⚠️ Se requiere especificar un token de Meta válido.";
}

/**
 * Prueba la conexión directa a WhatsApp enviando un mensaje al teléfono del Administrador
 */
function probarConexionWhatsApp() {
  const telAdmin = CONFIG_FINANZAS.TELEFONO_ADMIN_DEFAULT;
  const res = enviarMensajeWhatsApp(telAdmin, "🚀 *¡Conexión Exitosa con Meta WhatsApp!* Tu token permanente está activo y funcionando al 100%.");
  Logger.log("Resultado prueba WhatsApp: " + JSON.stringify(res));
  return res;
}

function obtenerMetaToken_() {
  return PropertiesService.getScriptProperties().getProperty("META_ACCESS_TOKEN") || META_CONFIG.ACCESS_TOKEN || "";
}

function obtenerMetaPhoneId_() {
  return PropertiesService.getScriptProperties().getProperty("META_PHONE_NUMBER_ID") || META_CONFIG.PHONE_NUMBER_ID || "";
}

function obtenerMetaVerifyToken_() {
  return PropertiesService.getScriptProperties().getProperty("META_VERIFY_TOKEN") || META_CONFIG.VERIFY_TOKEN || "";
}

// ============================================================================
// 1. ENDPOINT DOGET: VALIDACIÓN DE WEBHOOK CON META (HANDSHAKE)
// ============================================================================
/**
 * Meta envía una solicitud GET con parámetros hub.mode, hub.verify_token y hub.challenge
 * para verificar que este Webhook te pertenece antes de activarlo.
 */
function doGet(e) {
  try {
    const params = e ? e.parameter : {};
    const mode = params["hub.mode"];
    const token = params["hub.verify_token"];
    const challenge = params["hub.challenge"];

    const tokenEsperado = obtenerMetaVerifyToken_();

    // Caso 1: Handshake de verificación oficial de Meta WhatsApp Cloud API
    if (mode === "subscribe") {
      if (token === tokenEsperado) {
        Logger.log("✅ Webhook verificado exitosamente por Meta. Challenge: " + challenge);
        return ContentService.createTextOutput(challenge).setMimeType(ContentService.MimeType.TEXT);
      }
      Logger.log("❌ Rechazo de validación: Token incorrecto o modo inválido.");
      return ContentService.createTextOutput("Acceso Denegado: Token de verificación incorrecto.")
        .setMimeType(ContentService.MimeType.TEXT);
    }

    // Caso 2: Petición del Dashboard Interactivo o API REST (Fase 4)
    if (typeof despacharSolicitudGetDashboard === "function") {
      return despacharSolicitudGetDashboard(e);
    }

    return ContentService.createTextOutput("🚀 Sistema Financiero Antigravity Activo.").setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    Logger.log("Error en doGet: " + err.message);
    return ContentService.createTextOutput("Error: " + err.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

// ============================================================================
// 2. ENDPOINT DOPOST: RECEPCIÓN DE MENSAJES EN TIEMPO REAL
// ============================================================================
/**
 * Meta envía una solicitud POST cada vez que un usuario escribe al número de WhatsApp.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput("NO_DATA").setMimeType(ContentService.MimeType.TEXT);
    }

    const payload = JSON.parse(e.postData.contents);

    // Responder 200 OK inmediatamente a Meta para evitar reintentos duplicados
    const resOutput = ContentService.createTextOutput("EVENT_RECEIVED").setMimeType(ContentService.MimeType.TEXT);

    // Validar si es una notificación válida de WhatsApp
    if (payload.object !== "whatsapp_business_account" || !payload.entry) {
      return resOutput;
    }

    // Procesar cada entrada del webhook
    payload.entry.forEach(entry => {
      (entry.changes || []).forEach(change => {
        const val = change.value;
        if (!val || !val.messages || !val.messages.length) return;

        val.messages.forEach(msg => {
          procesarEventoMensajeEntrante_(msg, val.metadata);
        });
      });
    });

    return resOutput;

  } catch (err) {
    Logger.log("Error procesando webhook doPost: " + err.message);
    return ContentService.createTextOutput("ERROR: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * Verifica si un ID de mensaje de WhatsApp ya fue procesado (Idempotencia Bicapa)
 */
function esMensajeYaProcesado_(idMensaje) {
  if (!idMensaje) return false;
  try {
    // Nivel 1: Caché en memoria de ejecución rápida
    const cache = CacheService.getScriptCache();
    if (cache && cache.get("MSG_" + idMensaje)) return true;

    // Nivel 2: Propiedades persistentes (sobrevive nuevas versiones y reinicios de Apps Script)
    const props = PropertiesService.getScriptProperties();
    const procesadosJson = props.getProperty("PROCESSED_MSG_IDS") || "[]";
    const lista = JSON.parse(procesadosJson);
    if (lista.includes(idMensaje)) return true;
  } catch (e) {
    Logger.log("Aviso en esMensajeYaProcesado_: " + e.message);
  }
  return false;
}

/**
 * Marca un ID de mensaje como procesado tanto en caché como en almacenamiento persistente
 */
function marcarMensajeComoProcesado_(idMensaje) {
  if (!idMensaje) return;
  try {
    // Guardar en caché rápida (6 horas = 21600 segundos)
    const cache = CacheService.getScriptCache();
    if (cache) cache.put("MSG_" + idMensaje, "PROCESADO", 21600);

    // Guardar en propiedades persistentes con buffer circular de los últimos 150 mensajes
    const props = PropertiesService.getScriptProperties();
    const procesadosJson = props.getProperty("PROCESSED_MSG_IDS") || "[]";
    let lista = JSON.parse(procesadosJson);
    if (!lista.includes(idMensaje)) {
      lista.push(idMensaje);
      if (lista.length > 150) lista = lista.slice(lista.length - 150);
      props.setProperty("PROCESSED_MSG_IDS", JSON.stringify(lista));
    }
  } catch (e) {
    Logger.log("Aviso en marcarMensajeComoProcesado_: " + e.message);
  }
}

/**
 * Deserializa el mensaje, extrae texto/imagen y despacha hacia el Cerebro de IA
 */
function procesarEventoMensajeEntrante_(msg, metadata) {
  const remitente = msg.from; // Número de teléfono (ej. 573008880001)
  const idMensaje = msg.id;
  const tipo = msg.type;

  // 1. Filtro estricto de obsolescencia temporal (Descartar reintentos tardíos o encolados de Meta)
  const ahoraSegundos = Math.floor(Date.now() / 1000);
  const timestampMsg = Number(msg.timestamp) || ahoraSegundos;
  if (ahoraSegundos - timestampMsg > 300) {
    Logger.log(`⏳ Mensaje obsoleto/reintento tardío de Meta descartado (Antigüedad: ${ahoraSegundos - timestampMsg}s, ID: ${idMensaje})`);
    marcarMensajeComoProcesado_(idMensaje);
    return;
  }

  // 2. Deduplicación persistente bicapa (Caché ScriptCache + PropertiesService)
  if (esMensajeYaProcesado_(idMensaje)) {
    Logger.log(`🔁 Mensaje duplicado o reintentado ignorado: ${idMensaje}`);
    return;
  }
  marcarMensajeComoProcesado_(idMensaje);

  let respuestaAgente = null;

  // Caso 1: Mensaje de Texto
  if (tipo === "text" && msg.text) {
    const textoUsuario = msg.text.body;
    Logger.log(`📩 Mensaje de [${remitente}]: "${textoUsuario}"`);
    respuestaAgente = procesarMensajeTexto(remitente, textoUsuario);
  }

  // Caso 2: Imagen (Comprobante / Factura)
  else if (tipo === "image" && msg.image) {
    Logger.log(`📷 Imagen recibida de [${remitente}]: ${msg.image.id}`);
    const token = obtenerMetaToken_();
    
    if (token) {
      const imgData = descargarMediaWhatsApp_(msg.image.id, token);
      if (imgData) {
        respuestaAgente = procesarImagenComprobante(remitente, imgData.base64, imgData.mimeType, msg.image.caption || "");
      }
    } else {
      respuestaAgente = {
        tipo: "aviso",
        texto: "📸 He recibido tu imagen de comprobante. Para procesarla automáticamente con visión artificial en producción, se requiere configurar el META_ACCESS_TOKEN."
      };
    }
  }

  // Caso 3: Nota de Voz / Audio Entrante
  else if ((tipo === "audio" || tipo === "voice") && (msg.audio || msg.voice)) {
    const audioObj = msg.audio || msg.voice;
    Logger.log(`🎙️ Nota de voz recibida de [${remitente}]: ${audioObj.id}`);
    const token = obtenerMetaToken_();
    if (token) {
      const audioData = descargarMediaWhatsApp_(audioObj.id, token);
      if (audioData && audioData.base64) {
        if (typeof procesarAudioNotaVoz === "function") {
          let cleanMime = String(audioData.mimeType || audioObj.mime_type || "audio/ogg").split(";")[0].trim().toLowerCase();
          if (cleanMime === "audio/opus" || cleanMime.includes("ogg") || cleanMime.includes("opus")) cleanMime = "audio/ogg";
          respuestaAgente = procesarAudioNotaVoz(remitente, audioData.base64, cleanMime);
        } else {
          respuestaAgente = {
            tipo: "aviso",
            texto: "🎙️ He recibido tu nota de voz, pero la función de transcripción no está disponible."
          };
        }
      }
    } else {
      respuestaAgente = {
        tipo: "aviso",
        texto: "🎙️ He recibido tu nota de voz. Para transcribirla automáticamente con IA en producción, se requiere configurar el META_ACCESS_TOKEN."
      };
    }
  }

  // Despachar la respuesta al chat de WhatsApp
  if (respuestaAgente) {
    if (respuestaAgente.yaDespachadoPorWebhook) {
      Logger.log(`ℹ️ Respuesta de tipo '${respuestaAgente.tipo}' ya despachada directamente al chat. Omitiendo mensaje de texto redundante.`);
      return;
    }

    // Verificar propuesta periódica de inmersión personalizada (cada 14 días)
    if (respuestaAgente.texto && typeof verificarYAdjuntarPropuestaInmersion_ === "function") {
      respuestaAgente.texto = verificarYAdjuntarPropuestaInmersion_(remitente, respuestaAgente.texto, respuestaAgente.tipo);
    }

    if (respuestaAgente.requiereAudio && (respuestaAgente.textoVoz || respuestaAgente.texto)) {
      enviarRespuestaVozWhatsApp(remitente, respuestaAgente.texto, respuestaAgente.perfilVoz, respuestaAgente.textoVoz);
    } else if (respuestaAgente.texto) {
      enviarMensajeWhatsApp(remitente, respuestaAgente.texto);
    }
  }
}

/**
 * Filtro de humanización universal previo al despacho a Meta WhatsApp:
 * Garantiza que jamás salgan etiquetas de bases de datos como '(Propietario)',
 * '(Super Admin)', plurales mecánicos '(s)', flechas técnicas '➔', o muletillas frías y robóticas.
 */
function sanitizarTextoParaWhatsApp_(textoRaw) {
  let t = String(textoRaw || "");
  if (!t) return t;

  // 1. Limpieza de roles de base de datos en nombres y saludos
  t = t.replace(/Fernando\s*\(\s*(?:Propietario|Super\s*Admin|Admin|Administrador|Gerente)\s*\)/gi, "Fernando");
  t = t.replace(/\(\s*(?:Propietario\s*y\s*Super\s*Admin|Propietario|Super\s*Admin|Admin|Administrador|Gerente)\s*\)/gi, "");
  t = t.replace(/([A-ZÁÉÍÓÚÑa-záéíóúñ]+)\s*\(\s*(?:Usuario|Socio|Empleado)\s*\)/gi, "$1");

  // 2. Limpieza de plurales mecánicos de bases de datos tipo "(s)"
  t = t.replace(/Movimiento\(s\)\s+registrado\(s\)\s+con\s+éxito:?/gi, "¡Listo! ✅ Movimiento registrado:");
  t = t.replace(/compromiso\(s\)/gi, "compromisos");
  t = t.replace(/movimiento\(s\)/gi, "movimientos");
  t = t.replace(/registro\(s\)/gi, "registros");
  t = t.replace(/pago\(s\)/gi, "pagos");

  // 3. Reemplazar flechas técnicas de terminal '➔'
  t = t.replace(/\s*➔\s*/g, " por ");

  // 4. Transformar cualquier mensaje heredado robótico de inactividad
  t = t.replace(/notamos que hoy no has registrado ningún movimiento financiero personal/gi, "hoy no anotamos movimientos en tus cuentas personales");
  t = t.replace(/Respóndeme por aquí indicando el valor y concepto para que tus balances queden al día antes de terminar la jornada/gi, "Si tuviste algún gasto o pago hoy, cuéntame por acá y te lo dejo cuadrado de una vez");

  return t.trim();
}

// ============================================================================
// 3. DESPACHADOR DE MENSAJES SALIENTES A META GRAPH API
// ============================================================================
/**
 * Envía un mensaje de texto formateado al usuario a través de la API oficial de Meta,
 * con soporte de fallback automático a Plantilla Oficial de Meta si la ventana de 24 horas está cerrada.
 * 
 * @param {string} telefonoDestino Número de teléfono de destino
 * @param {string} textoMensaje Texto del mensaje a enviar
 * @param {Object} [opcionesFallback] Opciones de respaldo con plantilla { nombrePlantilla: string, idioma?: string, parametros?: Array<string> }
 * @returns {Object} Resultado del despacho { enviado: boolean, idMensaje?: string, error?: string, plantilla?: string }
 */
function enviarMensajeWhatsApp(telefonoDestino, textoMensaje, opcionesFallback) {
  const telDestino = telefonoDestino || CONFIG_FINANZAS.TELEFONO_ADMIN_DEFAULT;
  const textoBruto = textoMensaje || "🧪 *Prueba de Conexión:* Tu bot del Sistema Financiero Inteligente está conectado exitosamente a Meta Cloud API.";
  const texto = sanitizarTextoParaWhatsApp_(textoBruto);

  const token = obtenerMetaToken_();
  const phoneId = obtenerMetaPhoneId_();
  const telNormalizado = normalizarTelefono_(telDestino);

  // Si aún no hay credenciales de Meta configuradas (Modo Simulación / Pruebas)
  if (!token || !phoneId) {
    Logger.log(`[SIMULACIÓN WHATSAPP] Para: ${telNormalizado} ➔ Mensaje:\n${texto}`);
    return {
      simulado: true,
      enviado: true,
      destino: telNormalizado,
      texto: texto
    };
  }

  const baseUrl = META_CONFIG.URL_BASE_GRAPH || "https://graph.facebook.com/";
  const graphVer = META_CONFIG.GRAPH_VERSION || META_CONFIG.VERSION || "v21.0";
  const url = `${baseUrl.endsWith("/") ? baseUrl : baseUrl + "/"}${graphVer}/${phoneId}/messages`;
  const payload = construirPayloadMensajeWhatsApp(telNormalizado, texto);

  try {
    const res = UrlFetchApp.fetch(url, {
      method: "POST",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + token
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const code = res.getResponseCode();
    const json = JSON.parse(res.getContentText());

    if (code === 200 || code === 201) {
      Logger.log(`✅ WhatsApp enviado con éxito a ${telNormalizado}. ID: ${json.messages ? json.messages[0].id : "OK"}`);
      return { enviado: true, idMensaje: json.messages ? json.messages[0].id : null };
    } else {
      const esVentanaCerrada = json.error && (json.error.code === 131047 || String(json.error.message).includes("24 hours"));
      
      if (esVentanaCerrada) {
        Logger.log(`⏳ [VENTANA META 24H CERRADA] Meta no permite texto libre a ${telNormalizado} por >24h de inactividad.`);

        // 🔄 FALLBACK AUTOMÁTICO A PLANTILLA META PRE-APROBADA
        let plantillaUsar = null;
        let idiomaUsar = "es";
        let paramsUsar = [];

        if (opcionesFallback && opcionesFallback.nombrePlantilla) {
          plantillaUsar = opcionesFallback.nombrePlantilla;
          idiomaUsar = opcionesFallback.idioma || "es";
          paramsUsar = opcionesFallback.parametros || [];
        } else {
          try {
            const props = PropertiesService.getScriptProperties();
            const plantillaGlobal = props.getProperty("META_TEMPLATE_FALLBACK");
            if (plantillaGlobal) {
              plantillaUsar = plantillaGlobal;
              idiomaUsar = props.getProperty("META_TEMPLATE_LANGUAGE") || "es";
            }
          } catch (eProps) {}
        }

        if (plantillaUsar) {
          Logger.log(`🔄 [DISPARANDO PLANTILLA DE RESPALDO] Intentando entregar plantilla '${plantillaUsar}' a ${telNormalizado}...`);
          return enviarPlantillaWhatsApp(telNormalizado, plantillaUsar, idiomaUsar, paramsUsar);
        } else {
          Logger.log(`ℹ️ No hay plantilla de respaldo configurada (ScriptProperties: 'META_TEMPLATE_RECORDATORIO_8AM' o 'META_TEMPLATE_FALLBACK'). Mensaje pendiente hasta que el usuario escriba.`);
        }
      } else {
        Logger.log(`❌ Error Meta API (${code}): ` + JSON.stringify(json));
      }
      return { enviado: false, error: json.error ? json.error.message : "Error desconocido", code: json.error ? json.error.code : code };
    }

  } catch (err) {
    Logger.log("Excepción al enviar WhatsApp: " + err.message);
    return { enviado: false, error: err.message };
  }
}

/**
 * Envía una Plantilla Oficial de Meta (WhatsApp Message Template) pre-aprobada.
 * Permite la entrega proactiva garantizada incluso cuando la ventana de 24 horas está cerrada por inactividad.
 * 
 * @param {string} telefonoDestino Número de teléfono del destinatario
 * @param {string} nombrePlantilla Nombre exacto de la plantilla en Meta (ej: 'recordatorio_matutino')
 * @param {string} [codigoIdioma='es'] Código de idioma (ej: 'es', 'es_CO')
 * @param {Array<string>} [parametrosCuerpo=[]] Parámetros dinámicos para las variables {{1}}, {{2}}, etc.
 * @returns {Object} Resultado del despacho { enviado: boolean, idMensaje?: string, error?: string, plantilla: string }
 */
function enviarPlantillaWhatsApp(telefonoDestino, nombrePlantilla, codigoIdioma, parametrosCuerpo) {
  const telDestino = telefonoDestino || CONFIG_FINANZAS.TELEFONO_ADMIN_DEFAULT;
  const telNormalizado = normalizarTelefono_(telDestino);
  const token = obtenerMetaToken_();
  const phoneId = obtenerMetaPhoneId_();
  const plantilla = String(nombrePlantilla || "").trim();
  const lang = String(codigoIdioma || "es").trim();

  if (!plantilla) {
    Logger.log("Aviso: nombrePlantilla no especificado en enviarPlantillaWhatsApp");
    return { enviado: false, error: "Nombre de plantilla vacío" };
  }

  // Si aún no hay credenciales de Meta configuradas (Modo Simulación / Pruebas)
  if (!token || !phoneId) {
    Logger.log(`[SIMULACIÓN PLANTILLA WHATSAPP] Para: ${telNormalizado} ➔ Plantilla: ${plantilla} (Idioma: ${lang}, Params: ${JSON.stringify(parametrosCuerpo || [])})`);
    return {
      simulado: true,
      enviado: true,
      destino: telNormalizado,
      plantilla: plantilla
    };
  }

  const baseUrl = META_CONFIG.URL_BASE_GRAPH || "https://graph.facebook.com/";
  const graphVer = META_CONFIG.GRAPH_VERSION || META_CONFIG.VERSION || "v21.0";
  const url = `${baseUrl.endsWith("/") ? baseUrl : baseUrl + "/"}${graphVer}/${phoneId}/messages`;

  const components = [];
  if (Array.isArray(parametrosCuerpo) && parametrosCuerpo.length > 0) {
    components.push({
      type: "body",
      parameters: parametrosCuerpo.map(p => ({
        type: "text",
        text: String(p || "")
      }))
    });
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: telNormalizado,
    type: "template",
    template: {
      name: plantilla,
      language: {
        code: lang
      }
    }
  };

  if (components.length > 0) {
    payload.template.components = components;
  }

  try {
    const res = UrlFetchApp.fetch(url, {
      method: "POST",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + token
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const code = res.getResponseCode();
    const json = JSON.parse(res.getContentText());

    if (code === 200 || code === 201) {
      Logger.log(`✅ [PLANTILLA ENTREGADA] Plantilla '${plantilla}' entregada a ${telNormalizado}. ID: ${json.messages ? json.messages[0].id : "OK"}`);
      return { enviado: true, idMensaje: json.messages ? json.messages[0].id : null, plantilla: plantilla };
    } else {
      // Reintento inteligente de idioma alternativo: si se envió 'es_CO' probar 'es', y viceversa
      const esErrorIdioma = json.error && (json.error.error_subcode === 2494011 || String(json.error.message).toLowerCase().includes("language") || String(json.error.message).toLowerCase().includes("does not exist"));
      const altLang = (lang === "es_CO") ? "es" : (lang === "es" ? "es_CO" : null);

      if (esErrorIdioma && altLang) {
        Logger.log(`🔄 Reintentando plantilla '${plantilla}' con idioma alternativo '${altLang}'...`);
        payload.template.language.code = altLang;
        const resRetry = UrlFetchApp.fetch(url, {
          method: "POST",
          contentType: "application/json",
          headers: { Authorization: "Bearer " + token },
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        });
        const jsonRetry = JSON.parse(resRetry.getContentText());
        if (resRetry.getResponseCode() === 200 || resRetry.getResponseCode() === 201) {
          Logger.log(`✅ [PLANTILLA ENTREGADA EN REINTENTO '${altLang}'] ID: ${jsonRetry.messages ? jsonRetry.messages[0].id : "OK"}`);
          return { enviado: true, idMensaje: jsonRetry.messages ? jsonRetry.messages[0].id : null, plantilla: plantilla };
        }
      }

      Logger.log(`❌ Error despachando Plantilla '${plantilla}' a Meta (${code}): ` + JSON.stringify(json));
      return { enviado: false, error: json.error ? json.error.message : "Error desconocido", code: json.error ? json.error.code : code, plantilla: plantilla };
    }
  } catch (err) {
    Logger.log(`Excepción al enviar plantilla '${plantilla}': ` + err.message);
    return { enviado: false, error: err.message, plantilla: plantilla };
  }
}

function construirPayloadMensajeWhatsApp(telefono, texto) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: String(telefono).replace(/\D/g, ""),
    type: "text",
    text: {
      preview_url: false,
      body: texto
    }
  };
}

/**
 * Descarga archivos multimedia (imágenes de recibos, notas de voz) desde los servidores de Meta Graph API & CDN
 */
function descargarMediaWhatsApp_(mediaId, token) {
  try {
    // 1. Obtener URL de descarga del media desde Meta Graph API
    const baseUrl = META_CONFIG.URL_BASE_GRAPH || "https://graph.facebook.com/";
    const graphVer = META_CONFIG.GRAPH_VERSION || META_CONFIG.VERSION || "v21.0";
    const urlInfo = `${baseUrl.endsWith("/") ? baseUrl : baseUrl + "/"}${graphVer}/${mediaId}`;
    
    const resInfo = UrlFetchApp.fetch(urlInfo, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
        "User-Agent": "curl/7.64.1"
      },
      muteHttpExceptions: true
    });

    const infoCode = resInfo.getResponseCode();
    if (infoCode !== 200) {
      Logger.log(`Aviso Meta Graph media info (HTTP ${infoCode}): ${resInfo.getContentText()}`);
      return null;
    }

    const infoJson = JSON.parse(resInfo.getContentText());
    if (!infoJson.url) {
      Logger.log("Aviso: Respuesta de Meta Graph no contiene URL de descarga.");
      return null;
    }

    // 2. Descargar los bytes binarios desde la URL temporal (lookaside / fbcdn)
    const resBlob = UrlFetchApp.fetch(infoJson.url, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
        "User-Agent": "curl/7.64.1"
      },
      muteHttpExceptions: true,
      followRedirects: true
    });

    const blobCode = resBlob.getResponseCode();
    if (blobCode !== 200) {
      Logger.log(`Aviso descarga binaria Meta CDN (HTTP ${blobCode})`);
      return null;
    }

    const bytes = resBlob.getContent();
    if (!bytes || bytes.length < 50) {
      Logger.log(`Aviso: Media descargado de Meta está vacío o corrupto (longitud: ${bytes ? bytes.length : 0} bytes)`);
      return null;
    }

    // Comprobar que no sea una página de error HTML devuelta por el CDN
    const bytesSlice = (bytes && typeof bytes.slice === "function") ? bytes.slice(0, 30) : bytes;
    const inicioStr = Utilities.newBlob(bytesSlice).getDataAsString();
    if (inicioStr.trim().startsWith("<") || inicioStr.toLowerCase().includes("<html")) {
      Logger.log("Aviso: Meta devolvió una página HTML en lugar del binario de imagen/audio.");
      return null;
    }

    const rawMime = infoJson.mime_type || "image/jpeg";
    const cleanMime = String(rawMime).split(";")[0].trim().toLowerCase();

    Logger.log(`✅ Media descargado exitosamente de Meta (${bytes.length} bytes, MIME: ${cleanMime})`);
    return {
      base64: Utilities.base64Encode(bytes).replace(/\s+/g, ""),
      mimeType: cleanMime
    };
  } catch (e) {
    Logger.log("Error descargando media de Meta: " + e.message);
    return null;
  }
}

// ============================================================================
// 4. DESPACHADOR DE AUDIO Y VOZ (TEXT-TO-SPEECH)
// ============================================================================
/**
 * Envía un archivo de audio o nota de voz a través de la API oficial de Meta Graph.
 * Soporta:
 * 1. audioFuente como objeto Blob (subida multipart a Meta /media -> id nativo de audio)
 * 2. audioFuente como string URL ({ link: url })
 */
function enviarAudioWhatsApp(telefonoDestino, audioFuente, textoAcompanante) {
  const token = obtenerMetaToken_();
  const phoneId = obtenerMetaPhoneId_();
  const telNormalizado = normalizarTelefono_(telefonoDestino);

  if (!token || !phoneId) {
    Logger.log(`[SIMULACIÓN AUDIO WHATSAPP] Para: ${telNormalizado} ➔ Audio despachado con éxito.`);
    if (textoAcompanante) {
      enviarMensajeWhatsApp(telefonoDestino, textoAcompanante);
    }
    return { simulado: true, enviado: true };
  }

  const baseUrl = META_CONFIG.URL_BASE_GRAPH || "https://graph.facebook.com/";
  const graphVer = META_CONFIG.GRAPH_VERSION || META_CONFIG.VERSION || "v21.0";
  const urlMensajes = `${baseUrl.endsWith("/") ? baseUrl : baseUrl + "/"}${graphVer}/${phoneId}/messages`;

  let payload = null;

  // CASO 1: Subida de archivo binario (Blob de MP3 generado por motor neural)
  if (audioFuente && typeof audioFuente === "object" && typeof audioFuente.getBytes === "function") {
    try {
      const urlMedia = `${baseUrl.endsWith("/") ? baseUrl : baseUrl + "/"}${graphVer}/${phoneId}/media`;
      const mediaPayload = {
        messaging_product: "whatsapp",
        type: "audio/mpeg",
        file: audioFuente
      };
      const resMedia = UrlFetchApp.fetch(urlMedia, {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        payload: mediaPayload,
        muteHttpExceptions: true
      });
      const mediaJson = JSON.parse(resMedia.getContentText());
      if (mediaJson && mediaJson.id) {
        payload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: telNormalizado,
          type: "audio",
          audio: { id: mediaJson.id }
        };
      } else {
        Logger.log("Aviso al subir media a Meta: " + JSON.stringify(mediaJson));
      }
    } catch (errMedia) {
      Logger.log("Excepción al subir audio a Meta Graph: " + errMedia.message);
    }
  }

  // CASO 2: Fallback a enlace HTTP si no se obtuvo ID de media
  if (!payload) {
    const linkUrl = typeof audioFuente === "string" ? audioFuente : construirAudioUrlSegunPerfil_(textoAcompanante, "FEMENINO_DULCE");
    payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: telNormalizado,
      type: "audio",
      audio: { link: linkUrl }
    };
  }

  try {
    UrlFetchApp.fetch(urlMensajes, {
      method: "POST",
      contentType: "application/json",
      headers: { Authorization: "Bearer " + token },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    Logger.log("✅ Nota de voz despachada a " + telNormalizado);
  } catch (err) {
    Logger.log("Aviso al despachar audio: " + err.message);
  }

  // Siempre enviar también el texto complementario como respaldo visual
  if (textoAcompanante) {
    enviarMensajeWhatsApp(telefonoDestino, textoAcompanante);
  }
}

/**
 * Enriquece dinámicamente el guion de audio con saludos según la hora del día,
 * empatía humana (¿cómo amaneciste?, buen descanso, tanto tiempo) y frases sello/lemas según el personaje.
 */
function enriquecerTextoVozSegunPerfilYHorario_(textoBase, perfilVoz, nombreUsuario) {
  let t = String(textoBase || "").trim();
  if (!t) return t;

  const perfil = String(perfilVoz || "BATMAN").toUpperCase();
  const nombre = sanitizarNombreParaVoz_(nombreUsuario);

  // 1. Detectar hora local
  let hora = 10;
  try {
    const tz = Session.getScriptTimeZone() || "America/Bogota";
    hora = Number(Utilities.formatDate(new Date(), tz, "HH"));
  } catch (e) {
    hora = new Date().getHours();
  }

  // Identificar franja horaria
  let franja = "tarde";
  if (hora >= 5 && hora < 12) {
    franja = "manana";
  } else if (hora >= 12 && hora < 19) {
    franja = "tarde";
  } else if (hora >= 19 && hora <= 23) {
    franja = "noche";
  } else {
    franja = "madrugada";
  }

  // 2. Verificar si el texto ya contiene un saludo para evitar duplicaciones
  const tLower = t.toLowerCase();
  const yaTieneSaludo = tLower.startsWith("buenos dias") || 
                        tLower.startsWith("buenas tardes") || 
                        tLower.startsWith("buenas noches") || 
                        tLower.startsWith("hola") || 
                        tLower.startsWith("saludos") ||
                        tLower.startsWith("¡hola") ||
                        tLower.startsWith("¡buen");

  // 3. Catálogo de saludos cordiales e intros por franja y personaje
  const introsPorPerfil = {
    BATMAN: {
      manana: [
        `Buenos días, ${nombre}. La disciplina financiera comienza desde temprano.`,
        `¿Cómo has amanecido hoy, ${nombre}? Radar activo y listo para la jornada.`,
        `Buenos días, ${nombre}. Vigilando tus recursos mientras la ciudad despierta.`
      ],
      tarde: [
        `Buenas tardes, ${nombre}. Manteniendo el control estricto del capital.`,
        `Buenas tardes, ${nombre}. Seguimos avanzando con paso firme y números blindados.`,
        `¿Cómo va tu jornada, ${nombre}? Todo bajo custodia por aquí.`
      ],
      noche: [
        `Buenas noches, ${nombre}. Cuentas claras al final del día. Que tengas un buen descanso.`,
        `Buenas noches, ${nombre}. La noche es joven, pero tu patrimonio queda asegurado.`,
        `Cerrando el día con orden y tranquilidad, ${nombre}. Nos vemos mañana.`
      ],
      madrugada: [
        `Horas silenciosas, ${nombre}. Cuida tu descanso, yo me encargo de vigilar las cuentas.`,
        `Trabajando en las sombras a deshoras, ${nombre}. Todo bajo control.`
      ]
    },
    IRON_MAN: {
      manana: [
        `¡Buenos días, ${nombre}! Café en mano y reactores financieros encendidos.`,
        `¿Cómo amaneces hoy, ${nombre}? Día perfecto para generar rentabilidad y cerrar tratos.`,
        `¡Buen día, ${nombre}! Sistemas al cien por ciento para conquistar el mercado.`
      ],
      tarde: [
        `¡Buenas tardes, ${nombre}! ¿Cómo va el ritmo del día? A seguir facturando con precisión.`,
        `Buenas tardes, ${nombre}. El flujo de caja no descansa y nosotros tampoco.`
      ],
      noche: [
        `Buenas noches, ${nombre}. Gran jornada de negocios. Que tengas un excelente descanso, nos vemos mañana.`,
        `Buenas noches, ${nombre}. Cifras consolidadas y en verde. Desconecta y descansa.`
      ],
      madrugada: [
        `Hola ${nombre}, trasnochando en el laboratorio. Todo registrado impecablemente.`
      ]
    },
    SPIDERMAN: {
      manana: [
        `¡Muy buenos días, ${nombre}! ¿Cómo has amanecido hoy? Listo para un día productivo.`,
        `¡Hola, ${nombre}! Buenos días, tu copiloto financiero listo para la acción.`
      ],
      tarde: [
        `¡Buenas tardes, ${nombre}! ¿Cómo va todo por allá? Espero que el día vaya sobre ruedas.`,
        `¡Ey, ${nombre}! Buenas tardes, seguimos atentos a cada movimiento.`
      ],
      noche: [
        `¡Buenas noches, ${nombre}! Gran trabajo hoy. Que descanses muy bien y nos vemos mañana.`,
        `Buenas noches, ${nombre}. Todo anotado para que duermas tranquilo.`
      ],
      madrugada: [
        `¡Hola, ${nombre}! Patrullando tus cuentas a estas horas. Que descanses.`
      ]
    },
    FEMENINO_DULCE: {
      manana: [
        `¡Buenos días, ${nombre}! Qué gusto saludarte, espero que hayas amanecido de maravilla.`,
        `¡Hola, ${nombre}! Muy buenos días, te deseo una jornada llena de éxitos y tranquilidad.`,
        `¿Cómo has amanecido hoy, ${nombre}? Qué alegría conversar contigo.`
      ],
      tarde: [
        `¡Buenas tardes, ${nombre}! ¿Cómo va tu día? Espero que todo marche muy bien.`,
        `¡Buenas tardes, ${nombre}! Pasaba a dejarte todo al día con mucho gusto.`
      ],
      noche: [
        `¡Buenas noches, ${nombre}! Qué satisfacción cerrar el día con todo en orden. Que tengas un lindo descanso y nos vemos mañana.`,
        `Buenas noches, ${nombre}. Todo queda perfectamente organizado para que descanses en paz.`
      ],
      madrugada: [
        `Hola, ${nombre}, qué tarde es. Dejo todo listo para que puedas descansar tranquila y cómodamente.`
      ]
    },
    ALEXA: {
      manana: [
        `Buenos días, ${nombre}. Sistemas financieros en línea para la jornada matutina.`,
        `Buenos días, ${nombre}. Monitoreo de balances y compromisos activado.`
      ],
      tarde: [
        `Buenas tardes, ${nombre}. Estado de cuentas y flujos de caja actualizado.`,
        `Buenas tardes, ${nombre}. Todos los registros sincronizados correctamente.`
      ],
      noche: [
        `Buenas noches, ${nombre}. Balances del día consolidados con éxito. Que tengas un buen descanso.`,
        `Buenas noches, ${nombre}. Registros cerrados satisfactoriamente. Hasta mañana.`
      ],
      madrugada: [
        `Sincronización nocturna completada, ${nombre}.`
      ]
    }
  };

  // 4. Catálogo de Outros / Lemas de cierre según personaje
  const outrosPorPerfil = {
    BATMAN: [
      "En las sombras o a plena luz, tu patrimonio está protegido.",
      "Disciplina implacable, cero fugas de capital.",
      "Cuentas claras y radar limpio.",
      "Todo blindado."
    ],
    IRON_MAN: [
      "Flujo de caja en verde, señor. Seguimos dominando el juego.",
      "Tecnología y rentabilidad al más alto nivel.",
      "Impecable, como todo lo que hacemos.",
      "A seguir construyendo el imperio."
    ],
    SPIDERMAN: [
      "Con un gran capital viene una gran responsabilidad. ¡Seguimos!",
      "Aquí está tu amigable copiloto contable siempre listo.",
      "¡Un abrazo y mucho ánimo con todo!"
    ],
    FEMENINO_DULCE: [
      "Qué tranquilidad da tener todo organizado. ¡A seguir con la mejor energía!",
      "Tus finanzas quedan impecables y al día. ¡Un abrazo!",
      "Cuentas claras y corazón tranquilo. ¡Muchos éxitos!"
    ],
    ALEXA: [
      "Parámetros contables en estado óptimo.",
      "Registros asegurados en tiempo real.",
      "Siempre a tu servicio."
    ]
  };

  // Determinar clave de personaje
  let clave = "BATMAN";
  if (perfil.includes("IRON_MAN") || perfil.includes("STARK")) clave = "IRON_MAN";
  else if (perfil.includes("SPIDERMAN") || perfil.includes("PETER")) clave = "SPIDERMAN";
  else if (perfil.includes("ALEXA") || perfil.includes("ROBOT")) clave = "ALEXA";
  else if (perfil.includes("FEMENINO") || perfil.includes("AURA") || perfil.includes("DULCE")) clave = "FEMENINO_DULCE";

  // Selección rotativa basada en la longitud del texto y el minuto actual
  const minuto = new Date().getMinutes();
  const seed = (t.length + minuto);

  let introElegida = "";
  if (!yaTieneSaludo && introsPorPerfil[clave] && introsPorPerfil[clave][franja]) {
    const listaIntros = introsPorPerfil[clave][franja];
    introElegida = listaIntros[seed % listaIntros.length];
  }

  let outroElegido = "";
  if (outrosPorPerfil[clave] && !t.includes("En las sombras") && !t.includes("Flujo de caja en verde") && !t.includes("blindado")) {
    const listaOutros = outrosPorPerfil[clave];
    outroElegido = listaOutros[(seed + 1) % listaOutros.length];
  }

  // Ensamblar texto enriquecido
  const partes = [];
  if (introElegida) {
    partes.push(introElegida);
    // Evitar repetir el nombre del usuario si la intro ya lo saludó cordialmente
    t = deduplicarNombreEnCuerpo_(t, nombre);
  }
  partes.push(t);
  if (outroElegido) partes.push(outroElegido);

  return partes.join(" ");
}

/**
 * Convierte texto en nota de voz neural de alta fidelidad con tono, género y personalidad según el perfil
 */
function enviarRespuestaVozWhatsApp(telefonoDestino, texto, perfilVozForzado, textoVozEspecifico) {
  let perfil = perfilVozForzado;
  let nombreUsuario = "Fernando";
  if (typeof validarPermisoUsuario === "function") {
    try {
      const perm = validarPermisoUsuario(telefonoDestino);
      if (perm && perm.perfilVoz && !perfil) perfil = perm.perfilVoz;
      if (perm && perm.nombre) nombreUsuario = perm.nombre;
    } catch (e) {
      Logger.log("Aviso al consultar perfil de voz: " + e.message);
    }
  }

  const baseTextoAudio = textoVozEspecifico || texto;
  const textoParaAudio = enriquecerTextoVozSegunPerfilYHorario_(baseTextoAudio, perfil, nombreUsuario);
  const audio = sintetizarVozNeural_(textoParaAudio, perfil);
  return enviarAudioWhatsApp(telefonoDestino, audio, texto);
}

// ============================================================================
// 4.1 DESPACHADOR DE DOCUMENTOS PDF E INFORMES GERENCIALES CFO (ETAPA 3)
// ============================================================================

/**
 * Envía un documento (PDF, Infografía) a través de la API oficial de Meta Graph.
 * Soporta:
 * 1. Subida directa de Blob a /media con tipo application/pdf
 * 2. Enlace HTTP directo si ya está alojado en Google Drive
 * 3. Fallback inteligente con envío de mensaje de texto con enlaces directos si Meta falla
 * 
 * @param {string} telefonoDestino Número de teléfono de destino
 * @param {Blob|Object|string} documentoFuente Blob del PDF o URL directa
 * @param {string} nombreArchivo Nombre visible del archivo para WhatsApp
 * @param {string} caption Mensaje descriptivo o resumen que acompaña al documento
 * @param {string} urlRespaldoDrive URL pública de Drive para descarga/visualización directa
 * @returns {Object} Resultado del despacho { enviado: boolean, idMensaje?: string, fallbackTexto?: boolean }
 */
function enviarDocumentoWhatsApp(telefonoDestino, documentoFuente, nombreArchivo, caption, urlRespaldoDrive, urlDescargaDrive) {
  const token = obtenerMetaToken_();
  const phoneId = obtenerMetaPhoneId_();
  const telNormalizado = normalizarTelefono_(telefonoDestino);
  const nombreLimpio = (nombreArchivo || "Informe_Gerencial.pdf").endsWith(".pdf") ? nombreArchivo : (nombreArchivo + ".pdf");

  // Modo Simulación o entorno de pruebas sin credenciales de Meta
  if (!token || !phoneId) {
    Logger.log(`[SIMULACIÓN DOCUMENTO WHATSAPP] Para: ${telNormalizado} ➔ Archivo: ${nombreLimpio}`);
    if (caption) {
      enviarMensajeWhatsApp(telefonoDestino, caption);
    }
    return {
      simulado: true,
      enviado: true,
      destino: telNormalizado,
      nombreArchivo: nombreLimpio,
      caption: caption,
      urlVisualizacion: urlRespaldoDrive,
      urlDescarga: urlDescargaDrive
    };
  }

  const baseUrl = META_CONFIG.URL_BASE_GRAPH || "https://graph.facebook.com/";
  const graphVer = META_CONFIG.GRAPH_VERSION || META_CONFIG.VERSION || "v21.0";
  const urlMensajes = `${baseUrl.endsWith("/") ? baseUrl : baseUrl + "/"}${graphVer}/${phoneId}/messages`;

  let payload = null;

  // CASO 1: Subida directa de Blob binario a Meta Graph /media
  if (documentoFuente && typeof documentoFuente === "object" && typeof documentoFuente.getBytes === "function") {
    try {
      const urlMedia = `${baseUrl.endsWith("/") ? baseUrl : baseUrl + "/"}${graphVer}/${phoneId}/media`;
      const mediaPayload = {
        messaging_product: "whatsapp",
        type: "application/pdf",
        file: documentoFuente
      };
      const resMedia = UrlFetchApp.fetch(urlMedia, {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        payload: mediaPayload,
        muteHttpExceptions: true
      });
      const mediaJson = JSON.parse(resMedia.getContentText());
      if (mediaJson && mediaJson.id) {
        payload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: telNormalizado,
          type: "document",
          document: {
            id: mediaJson.id,
            caption: caption || "",
            filename: nombreLimpio
          }
        };
      } else {
        Logger.log("Aviso al subir documento PDF a Meta: " + JSON.stringify(mediaJson));
      }
    } catch (errMedia) {
      Logger.log("Excepción al subir documento PDF a Meta Graph: " + errMedia.message);
    }
  }

  // CASO 2: Envío por enlace directo si no se obtuvo ID de media pero existe URL
  if (!payload && (urlRespaldoDrive || typeof documentoFuente === "string")) {
    const enlaceDoc = urlRespaldoDrive || documentoFuente;
    payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: telNormalizado,
      type: "document",
      document: {
        link: enlaceDoc,
        caption: caption || "",
        filename: nombreLimpio
      }
    };
  }

  // Despacho a WhatsApp Cloud API
  if (payload) {
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
        Logger.log(`✅ Documento PDF despachado con éxito a ${telNormalizado}. ID: ${json.messages ? json.messages[0].id : "OK"}`);
        return { enviado: true, idMensaje: json.messages ? json.messages[0].id : null, nombreArchivo: nombreLimpio };
      } else {
        Logger.log(`⚠️ Meta API rechazó documento (${code}): " + JSON.stringify(json)`);
      }
    } catch (errDoc) {
      Logger.log("Excepción al despachar documento PDF: " + errDoc.message);
    }
  }

  // CASO 3: Resilient Fallback - Mensaje de texto formateado con Link de Conexión Directa a Google Drive
  Logger.log(`⚡ Activando Fallback Resiliente de entrega para: ${telNormalizado}`);
  
  let textoFallback = "";
  if (urlRespaldoDrive) {
    // Si viene caption, extraemos las métricas financieras previas al bloque de link
    const headerMetricas = caption ? caption.replace(/🔗 \*Enlace.*$/s, "").trim() : `📊 *${nombreLimpio}*`;
    textoFallback = [
      headerMetricas,
      ``,
      `📄 *Entrega vía Enlace Directo:*`,
      `_No fue posible adjuntar el archivo físico directamente en WhatsApp por limitaciones del canal._`,
      ``,
      `🔗 *Link de Conexión Directa con el Documento (Google Drive):*`,
      `${urlRespaldoDrive}`,
      urlDescargaDrive ? `\n📥 *Descarga Directa:*\n${urlDescargaDrive}` : "",
      ``,
      `👉 *Toca el enlace de arriba para abrir, consultar o imprimir tu informe completo directamente desde este chat.*`
    ].filter(Boolean).join("\n");
  } else {
    const errorDetalle = caption && caption.includes("Error:") ? "" : (caption || "");
    textoFallback = (caption ? caption + "\n\n" : "") +
      `📄 *Entrega de Documento:* No fue posible adjuntar el archivo físico directamente.\n` +
      `⚠️ *Aviso de Almacenamiento:* No fue posible generar el enlace de Drive.\n` +
      `👉 Asegúrate de haber ejecutado la función 'autorizarServiciosGoogleAppsScript' en el editor y luego implementa una 'Nueva versión' en Administrar implementaciones.`;
  }

  const resFallback = enviarMensajeWhatsApp(telefonoDestino, textoFallback);
  return {
    enviado: resFallback.enviado,
    fallbackTexto: true,
    urlVisualizacion: urlRespaldoDrive,
    urlDescarga: urlDescargaDrive,
    nombreArchivo: nombreLimpio
  };
}

/**
 * Despacha de forma inteligente cualquier tipo de informe generado por el Motor CFO.
 * @param {string} telefonoDestino Teléfono WhatsApp del usuario
 * @param {Object} resultadoInforme Objeto retornado por generarInformeCFOCompleto_
 * @returns {Object} Resultado de la entrega
 */
function enviarInformeCFOWhatsApp(telefonoDestino, resultadoInforme) {
  if (!resultadoInforme || !resultadoInforme.ok) {
    const errorMsg = "⚠️ No fue posible generar el informe financiero solicitado: " + (resultadoInforme?.error || "Error desconocido");
    return enviarMensajeWhatsApp(telefonoDestino, errorMsg);
  }

  // 1. Despacho de Informe FLASH (Resumen de WhatsApp en Markdown)
  if (resultadoInforme.tipo === "FLASH") {
    return enviarMensajeWhatsApp(telefonoDestino, resultadoInforme.textoFlash);
  }

  // 2. Despacho de PDF DOSSIER o INFOGRAFÍA
  const esInfografia = resultadoInforme.tipo === "INFOGRAFIA";
  const tituloHeader = esInfografia ? "Infografía Financiera" : "Dossier Gerencial CFO";
  const nombreDoc = resultadoInforme.archivo?.nombreArchivo || (esInfografia ? "Infografia_Antigravity.pdf" : "Dossier_CFO_Antigravity.pdf");
  const urlVis = resultadoInforme.archivo?.urlVisualizacion;
  const urlDesc = resultadoInforme.archivo?.urlDescarga;
  const errorArchivo = resultadoInforme.archivo?.error;

  const caption = [
    `📊 *${tituloHeader} - Antigravity*`,
    `🗓️ *Período:* ${resultadoInforme.periodo}`,
    `⚖️ *Salud Financiera:* ${resultadoInforme.flujoCaja?.estadoSalud || "EVALUADO"}`,
    `💰 *Retiro Libre Seguro (FCL):* $${(resultadoInforme.flujoCaja?.fclDistribuibleRecomendado || 0).toLocaleString("es-CO")} COP`,
    ``,
    urlVis ? `🔗 *Enlace de Conexión Directa en Drive (Imprimible):*\n${urlVis}` : `🔗 *Drive:* ${errorArchivo ? `(Aviso: ${errorArchivo})` : `(Pendiente de autorización en Apps Script)`}`
  ].join("\n");

  return enviarDocumentoWhatsApp(
    telefonoDestino,
    resultadoInforme.archivo?.blob,
    nombreDoc,
    caption,
    urlVis,
    urlDesc
  );
}

/**
 * Sanitiza el nombre del usuario para uso oral natural,
 * eliminando roles de base de datos (propietario, admin, gerente), notas entre paréntesis o apellidos compuestos.
 */
function sanitizarNombreParaVoz_(nombreRaw) {
  let n = String(nombreRaw || "").trim();
  if (!n) return "Fernando";
  n = n.split(/[,-]/)[0].trim();
  n = n.replace(/\([^\)]*\)/g, "").trim();
  n = n.replace(/\b(?:propietario|admin|administrador|gerente|super_admin|socio|usuario)\b/gi, "").trim();
  const partes = n.split(/\s+/).filter(Boolean);
  return partes[0] || "Fernando";
}

/**
 * Deduplica el llamado inicial del nombre si la intro ya saludó al usuario,
 * evitando patrones repetitivos como: "Buenos días, Fernando... Fernando, reporte..."
 */
function deduplicarNombreEnCuerpo_(cuerpo, nombre) {
  let t = String(cuerpo || "").trim();
  if (!nombre) return t;

  // 1. Quitar si empieza directamente con el nombre: "Fernando, reporte..." -> "Reporte..."
  const regNombre = new RegExp("^" + nombre + "[,\\s:]+", "i");
  if (regNombre.test(t)) {
    t = t.replace(regNombre, "").trim();
    if (t.length > 0) t = t.charAt(0).toUpperCase() + t.slice(1);
  }

  // 2. Quitar si empieza con "Listo, Fernando. Quedó..." -> "Listo. Quedó..."
  const regListo = new RegExp("^Listo,\\s*" + nombre + "[,\\.\\s]*", "i");
  if (regListo.test(t)) {
    t = t.replace(regListo, "Listo. ").trim();
  }

  return t;
}

/**
 * Convierte números enteros a su representación ortográfica completa en español.
 * Garantiza que 3193 sea 'tres mil ciento noventa y tres' y nunca 'tres punto uno nueve tres'.
 */
function numeroAPalabrasEsp_(num) {
  const n = Math.round(Number(num));
  if (isNaN(n) || n === 0) return "cero";
  if (n < 0) return "menos " + numeroAPalabrasEsp_(Math.abs(n));

  const unidades = ["", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
  const especiales = {
    10: "diez", 11: "once", 12: "doce", 13: "trece", 14: "catorce", 15: "quince",
    16: "dieciséis", 17: "diecisiete", 18: "dieciocho", 19: "diecinueve",
    20: "veinte", 21: "veintiuno", 22: "veintidós", 23: "veintitrés", 24: "veinticuatro",
    25: "veinticinco", 26: "veintiséis", 27: "veintisiete", 28: "veintiocho", 29: "veintinueve"
  };
  const decenas = ["", "diez", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
  const centenas = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

  function convertirMenorMil(val) {
    if (val === 0) return "";
    if (val === 100) return "cien";
    let res = "";
    const c = Math.floor(val / 100);
    const resto = val % 100;
    if (c > 0) res += centenas[c] + " ";
    if (resto > 0) {
      if (especiales[resto]) {
        res += especiales[resto];
      } else {
        const d = Math.floor(resto / 10);
        const u = resto % 10;
        if (d > 0) {
          res += decenas[d];
          if (u > 0) res += " y " + unidades[u];
        } else if (u > 0) {
          res += unidades[u];
        }
      }
    }
    return res.trim();
  }

  if (n < 1000) return convertirMenorMil(n);

  if (n < 1000000) {
    const miles = Math.floor(n / 1000);
    const resto = n % 1000;
    let milesTxt = miles === 1 ? "mil" : convertirMenorMil(miles) + " mil";
    milesTxt = milesTxt.replace(/veintiuno mil/g, "veintiún mil");
    const restoTxt = resto > 0 ? " " + convertirMenorMil(resto) : "";
    return (milesTxt + restoTxt).trim();
  }

  if (n < 1000000000000) {
    const millones = Math.floor(n / 1000000);
    const resto = n % 1000000;
    let millTxt = millones === 1 ? "un millón" : numeroAPalabrasEsp_(millones) + " millones";
    millTxt = millTxt.replace(/veintiuno millones/g, "veintiún millones");
    const restoTxt = resto > 0 ? " " + numeroAPalabrasEsp_(resto) : "";
    return (millTxt + restoTxt).trim();
  }

  return String(n);
}

/**
 * Normaliza una cifra numérica con separadores de miles (punto) o coma decimal
 */
function normalizarCifraNumerica_(str) {
  let limpio = String(str || "").replace(/\./g, "").replace(",", ".");
  return Number(limpio);
}

/**
 * Limpia y optimiza el texto para el sintetizador de voz:
 * - Elimina markdown, corchetes, links, encabezados, viñetas y emojis.
 * - Elimina roles de base de datos pegados a nombres.
 * - Transforma cifras monetarias y números a palabras fonéticas completas en español.
 * - Modula siglas financieras (TRM, FCL, COP, USD, EUR).
 */
function limpiarTextoParaVozHabla_(texto) {
  let t = String(texto || "");

  // 1. Quitar metadatos, tags y encabezados entre corchetes o paréntesis
  t = t.replace(/\[(?:Nota de voz|Transcripci[oó]n|Transmisi[oó]n|Audio|Resumen)[^\]]*\]/gi, "");
  t = t.replace(/\([^\)]*(?:profunda|grave|solemne|imponente|dulce|calida|acento)[^\)]*\)/gi, "");
  t = t.replace(/^.*(?:Informe de Inteligencia|Presentación Oficial|Resumen Financiero).*$/gim, "");
  t = t.replace(/https?:\/\/\S+/g, "");

  // 2. Quitar emojis de teclas numéricas (ej: 1️⃣, 2️⃣, 3️⃣, 4️⃣)
  t = t.replace(/[0-9#*]\uFE0F?\u20E3/g, "");

  // 3. Quitar todos los emojis Unicode y símbolos gráficos
  t = t.replace(/[\u{1F300}-\u{1FAFF}]/gu, ""); 
  t = t.replace(/[\u{1F600}-\u{1F64F}]/gu, ""); 
  t = t.replace(/[\u{1F680}-\u{1F6FF}]/gu, ""); 
  t = t.replace(/[\u{2600}-\u{27BF}]/gu, "");  
  t = t.replace(/[\u{2300}-\u{23FF}]/gu, "");  
  t = t.replace(/[\u{2B50}-\u{2B55}]/gu, "");  
  t = t.replace(/[\u{200D}\u{FE0E}\u{FE0F}]/gu, "");

  // 4. Limpiar viñetas, barras y formato markdown
  t = t.replace(/^[•\-\*]\s+/gm, "");
  t = t.replace(/[*_~`#•«»|\\]/g, " ");

  // 5. Eliminar roles de base de datos pegados a nombres de usuario
  t = t.replace(/,\s*(?:propietario|administrador|admin|gerente|super_admin)\b/gi, "");

  // 6. Adecuar expresiones monetarias y numéricas a palabras fonéticas en español
  // 6.0 Moneda con centavos: ej $3.192,92 COP o $3.128,00 COP
  t = t.replace(/\$\s*([0-9\.]+),([0-9]{1,2})\s*(?:COP|pesos)?/gi, (match, p1, p2) => {
    const num = normalizarCifraNumerica_(p1);
    const cent = Number(p2);
    const numPalabras = isNaN(num) ? p1 : numeroAPalabrasEsp_(num);
    if (cent === 0) return numPalabras + " pesos ";
    return numPalabras + " pesos con " + numeroAPalabrasEsp_(cent) + " centavos ";
  });

  // 6.1 Moneda con signo $ o sufijo COP/pesos entera
  t = t.replace(/\$\s*([0-9\.]+)\s*(?:COP|pesos)?/gi, (match, p1) => {
    const num = normalizarCifraNumerica_(p1);
    return isNaN(num) ? match : numeroAPalabrasEsp_(num) + " pesos ";
  });

  // 6.2 Cifras seguidas de "pesos" o "COP"
  t = t.replace(/\b([0-9\.,]+)\s+(?:pesos|COP)\b/gi, (match, p1) => {
    const num = normalizarCifraNumerica_(p1);
    return isNaN(num) ? match : numeroAPalabrasEsp_(num) + " pesos ";
  });

  // 6.3 Números con separador de miles con punto (ej: 3.193, 150.000, 1.250.000, 5.745.131)
  t = t.replace(/\b(\d{1,3}(?:\.\d{3})+)\b/g, (match, p1) => {
    const num = normalizarCifraNumerica_(p1);
    return isNaN(num) ? match : numeroAPalabrasEsp_(num) + " ";
  });

  // 6.4 Porcentajes
  t = t.replace(/(\d+(?:[\.,]\d+)?)\s*%/g, (match, p1) => {
    const num = normalizarCifraNumerica_(p1);
    return isNaN(num) ? match : numeroAPalabrasEsp_(num) + " por ciento ";
  });

  // 6.5 Números enteros sueltos (de 1 a 6 cifras, excepto años corrientes 1990-2099)
  t = t.replace(/\b(\d{1,6})\b/g, (match, p1) => {
    const num = Number(p1);
    if (isNaN(num) || (num >= 1990 && num <= 2099)) return match;
    return numeroAPalabrasEsp_(num) + " ";
  });

  // 6.6 Reglas fonéticas para moneda y siglas
  t = t.replace(/\b([a-záéíóú]+ millón(?:es)?)\s+pesos\b/gi, "$1 de pesos");
  t = t.replace(/\bveintiuno pesos\b/gi, "veintiún pesos");
  t = t.replace(/\bun pesos\b/gi, "un peso");
  t = t.replace(/\bFCL\b/g, "flujo de caja libre");
  t = t.replace(/\bCOP\b/g, "pesos");
  t = t.replace(/\bUSD\b/g, "dólares");
  t = t.replace(/\bEUR\b/g, "euros");
  t = t.replace(/\bTRM\b/g, "la T R M");
  t = t.replace(/\bla la T R M\b/gi, "la T R M");

  // 7. Colapsar espacios y puntuación repetida, preservando puntos suspensivos para pausas respiratorias
  t = t.replace(/\s+/g, " ");
  t = t.replace(/\.{4,}/g, "...");
  t = t.replace(/\s+([.,;:?!])/g, "$1");
  t = t.replace(/([,;:?!])\1+/g, "$1");
  return t.trim();
}

/**
 * Sintetiza voz neural de alta fidelidad adaptada a cada personaje y perfil.
 * Cascada de resiliencia:
 * 1. Microsoft Edge Neural TTS (Voz barítona grave con acento latino para Batman - pitch: -35Hz, rate: -12%)
 * 2. ElevenLabs API (si existe ELEVENLABS_API_KEY en ScriptProperties)
 * 3. OpenAI TTS API (si existe OPENAI_API_KEY en ScriptProperties)
 * 4. TikTok Neural Free Engine (Sin API Key)
 * 5. Fallback URL Google Translate TTS con modulación acústica
 */
function sintetizarVozNeural_(texto, perfilVoz) {
  const perfil = String(perfilVoz || "FEMENINO_DULCE").toUpperCase();
  let textoLimpio = limpiarTextoParaVozHabla_(texto);

  if (textoLimpio.length > 700) {
    textoLimpio = textoLimpio.substring(0, 695) + "...";
  }

  if (!textoLimpio) {
    textoLimpio = "He actualizado tu información financiera satisfactoriamente.";
  }

  // 1. Fish Audio API (PRIORIDAD #1: Ultra-expresivo, orgánico y zero-shot cloning)
  try {
    const fishKey = obtenerFishAudioApiKey_();
    if (fishKey && fishKey.trim() !== "") {
      const voiceIdFish = mapearVozFishAudio_(perfil);
      const urlFish = (typeof FISH_AUDIO_CONFIG !== "undefined" && FISH_AUDIO_CONFIG.URL_BASE_TTS) ? FISH_AUDIO_CONFIG.URL_BASE_TTS : "https://api.fish.audio/v1/tts";
      const modeloFish = (typeof obtenerFishAudioModel_ === "function") ? obtenerFishAudioModel_() : "s2.1-pro-free";

      // Modulación de prosodia y dramatismo según el personaje (humano, orgánico, cinematográfico)
      const pUpper = perfil.toUpperCase();
      let speedVal = 1.0;
      let tempVal = 0.75;

      if (pUpper.includes("BATMAN") || pUpper.includes("BRUCE")) {
        speedVal = 0.94; // Batman: cadencia pausada, imponente, grave y cinematográfica
        tempVal = 0.78;  // Rango dinámico y raspado vocal expresivo
      } else if (pUpper.includes("OPTIMUS") || pUpper.includes("WOLVERINE") || pUpper.includes("HELLBOY") || pUpper.includes("SPAWN")) {
        speedVal = 0.95;
        tempVal = 0.75;
      } else if (pUpper.includes("THOR")) {
        speedVal = 0.93;
        tempVal = 0.75;
      } else if (pUpper.includes("FREEMAN")) {
        speedVal = 0.90;
        tempVal = 0.72;
      } else if (pUpper.includes("FLASH") || pUpper.includes("SPIDERMAN") || pUpper.includes("DEADPOOL")) {
        speedVal = 1.04;
        tempVal = 0.78;
      } else if (pUpper.includes("GATO") || pUpper.includes("BOTAS") || pUpper.includes("PUSS")) {
        speedVal = 1.02; // Gato con Botas: cadencia teatral, ágil, apasionada y caballeresca
        tempVal = 0.78;
      }

      const payloadFish = {
        text: textoLimpio,
        format: "mp3",
        mp3_bitrate: 128,
        latency: "normal",
        temperature: tempVal,
        prosody: {
          speed: speedVal,
          volume: 0
        }
      };
      if (voiceIdFish && voiceIdFish.trim() !== "") {
        payloadFish.reference_id = voiceIdFish.trim();
      }

      // Despacho primario con el modelo configurado (s2.1-pro-free para máxima fidelidad y disponibilidad garantizada)
      let resFish = UrlFetchApp.fetch(urlFish, {
        method: "POST",
        contentType: "application/json",
        headers: { 
          "Authorization": "Bearer " + fishKey.trim(),
          "model": modeloFish
        },
        payload: JSON.stringify(payloadFish),
        muteHttpExceptions: true
      });

      // Si por alguna razón el modelo diera 402 (balance de API agotado), reintentar de inmediato con s2.1-pro-free
      if (resFish.getResponseCode() === 402 && modeloFish !== "s2.1-pro-free") {
        Logger.log("Aviso: Balance de API insuficiente para modelo de pago, reintentando con s2.1-pro-free...");
        resFish = UrlFetchApp.fetch(urlFish, {
          method: "POST",
          contentType: "application/json",
          headers: { 
            "Authorization": "Bearer " + fishKey.trim(),
            "model": "s2.1-pro-free"
          },
          payload: JSON.stringify(payloadFish),
          muteHttpExceptions: true
        });
      }

      if (resFish.getResponseCode() === 200) {
        const blob = resFish.getBlob();
        if (blob && blob.getBytes().length > 1000) {
          Logger.log(`✅ Voz Fish Audio generada con éxito para ${perfil} (${voiceIdFish})`);
          return blob.setName("voz_fishaudio.mp3");
        }
      } else {
        Logger.log(`Aviso Fish Audio HTTP ${resFish.getResponseCode()}: ${resFish.getContentText().slice(0, 200)}`);
      }
    }
  } catch (eFish) {
    Logger.log("Aviso Fish Audio TTS: " + eFish.message);
  }

  // 2. ElevenLabs API (PRIORIDAD #2: Respaldo cinematográfico Hollywood)
  try {
    const elevenKey = PropertiesService.getScriptProperties().getProperty("ELEVENLABS_API_KEY");
    if (elevenKey && elevenKey.trim() !== "") {
      const voiceId = mapearVozElevenLabs_(perfil);
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
      const esBatman = perfil.includes("BATMAN") || perfil.includes("BRUCE");
      
      const payload = {
        text: textoLimpio,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: esBatman ? 0.32 : 0.50,
          similarity_boost: esBatman ? 0.88 : 0.80,
          style: esBatman ? 0.35 : 0.05,
          use_speaker_boost: true
        }
      };
      
      const res = UrlFetchApp.fetch(url, {
        method: "POST",
        contentType: "application/json",
        headers: { "xi-api-key": elevenKey.trim() },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      
      if (res.getResponseCode() === 200) {
        const blob = res.getBlob();
        if (blob && blob.getBytes().length > 1000) {
          Logger.log(`✅ Voz ElevenLabs (The Dark Knight) generada con éxito para ${perfil}`);
          return blob.setName("voz_elevenlabs.mp3");
        }
      } else {
        Logger.log(`Aviso ElevenLabs HTTP ${res.getResponseCode()}: ${res.getContentText().slice(0, 150)}`);
      }
    }
  } catch (e11) {
    Logger.log("Aviso ElevenLabs TTS: " + e11.message);
  }

  // 3. Microsoft Edge Neural TTS (Fallback ultra-rápido de alta definición)
  try {
    const configEdge = mapearVozEdgeNeural_(perfil);
    const urlEdge = `https://edge-tts.vercel.app/api/tts?voice=${encodeURIComponent(configEdge.voice)}&pitch=${encodeURIComponent(configEdge.pitch)}&rate=${encodeURIComponent(configEdge.rate)}&text=${encodeURIComponent(textoLimpio)}`;
    const resEdge = UrlFetchApp.fetch(urlEdge, {
      method: "GET",
      muteHttpExceptions: true
    });
    if (resEdge.getResponseCode() === 200) {
      const blob = resEdge.getBlob();
      if (blob && blob.getBytes().length > 1000) {
        return blob.setName("voz_edge_neural.mp3");
      }
    }
  } catch (eEdge) {
    Logger.log("Aviso Edge Neural TTS: " + eEdge.message);
  }

  // 3. OpenAI TTS API (Voces neurales realistas)
  try {
    const openaiKey = PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");
    if (openaiKey && openaiKey.trim() !== "") {
      const voiceName = mapearVozOpenAI_(perfil);
      const url = "https://api.openai.com/v1/audio/speech";
      const payload = {
        model: "tts-1",
        input: textoLimpio,
        voice: voiceName
      };
      const res = UrlFetchApp.fetch(url, {
        method: "POST",
        contentType: "application/json",
        headers: { Authorization: "Bearer " + openaiKey.trim() },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      if (res.getResponseCode() === 200) {
        return res.getBlob().setName("voz_openai.mp3");
      }
    }
  } catch (eOai) {
    Logger.log("Aviso OpenAI TTS: " + eOai.message);
  }

  // 4. Motor Neural Gratuito TikTok TTS
  try {
    const vozTikTok = mapearVozTikTok_(perfil);
    const url = "https://tiktok-tts.weilnet.workers.dev/api/generation";
    const payload = {
      text: textoLimpio,
      voice: vozTikTok
    };
    const res = UrlFetchApp.fetch(url, {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    if (res.getResponseCode() === 200) {
      const json = JSON.parse(res.getContentText());
      if (json && json.success && json.data) {
        const decoded = Utilities.base64Decode(json.data);
        return Utilities.newBlob(decoded, "audio/mpeg", "voz_neural.mp3");
      }
    }
  } catch (eTT) {
    Logger.log("Aviso TikTok TTS: " + eTT.message);
  }

  // 5. Fallback a URL con parámetros acústicos
  return construirAudioUrlSegunPerfil_(textoLimpio, perfil);
}

/**
 * Mapeo de perfiles a voces de Microsoft Edge Neural TTS con modulación acústica de tono y velocidad
 */
function mapearVozEdgeNeural_(perfil) {
  const p = String(perfil || "").toUpperCase();

  // Batman / Bruce Wayne: Barítono cinematográfico The Dark Knight (resonancia grave, solemne y pausada)
  if (p.includes("BATMAN") || p.includes("BRUCE")) {
    return { voice: "es-ES-AlvaroNeural", pitch: "-15Hz", rate: "-8%" };
  }

  // Optimus Prime / Wolverine: Grave, autoritario y sobrio
  if (p.includes("OPTIMUS") || p.includes("WOLVERINE")) {
    return { voice: "es-US-AlonsoNeural", pitch: "+0Hz", rate: "-5%" };
  }

  // Thor: Grave, noble, resonante
  if (p.includes("THOR")) {
    return { voice: "es-US-AlonsoNeural", pitch: "+0Hz", rate: "-2%" };
  }

  // Iron Man / Tony Stark: Ejecutivo, inteligente, elocuente
  if (p.includes("IRON_MAN") || p.includes("STARK")) {
    return { voice: "es-MX-JorgeNeural", pitch: "+0Hz", rate: "+3%" };
  }

  // Superman / Clark Kent: Cálido, inspirador, protector (Voz colombiana masculina)
  if (p.includes("SUPERMAN") || p.includes("CLARK")) {
    return { voice: "es-CO-GonzaloNeural", pitch: "+0Hz", rate: "+0%" };
  }

  // Spiderman / Peter Parker: Joven, ágil, fresco
  if (p.includes("SPIDERMAN") || p.includes("SPIDER") || p.includes("PETER")) {
    return { voice: "es-MX-CecilioNeural", pitch: "+0Hz", rate: "+5%" };
  }

  // Alexa / Robot: Asistente digital neutro, sintético, nítido
  if (p.includes("ALEXA") || p.includes("ROBOT")) {
    return { voice: "es-US-PalomaNeural", pitch: "+0Hz", rate: "+0%" };
  }

  // Wonder Woman: Solemne, regia, heroica
  if (p.includes("WONDER_WOMAN") || p.includes("MARAVILLA")) {
    return { voice: "es-MX-DaliaNeural", pitch: "+0Hz", rate: "-2%" };
  }

  // Femenino Dulce / Aura / More FVG: Cálida, dulce, profesional (Voz colombiana femenina)
  return { voice: "es-CO-SalomeNeural", pitch: "+0Hz", rate: "+0%" };
}

/**
 * Mapeo de voces para el motor neural gratuito TikTok TTS
 * Prohibición total de voces infantiles o de animales.
 */
function mapearVozTikTok_(perfil) {
  const p = String(perfil || "").toUpperCase();

  // Voces masculinas profundas, graves y solemnes (Superhéroes y guardianes)
  if (p.includes("BATMAN") || p.includes("BRUCE") || p.includes("OPTIMUS") || p.includes("WOLVERINE") || p.includes("THOR")) {
    return "es_002"; // Voz masculina en español, tono grave y solemne
  }

  // Voces masculinas naturales, carismáticas y ejecutivas
  if (p.includes("IRON_MAN") || p.includes("STARK") || p.includes("SUPERMAN") || p.includes("CLARK") || p.includes("MASCULINO")) {
    return "es_mx_002"; // Voz masculina mexicana natural, fluida y profesional
  }

  // Voz masculina juvenil y ágil
  if (p.includes("SPIDERMAN") || p.includes("SPIDER") || p.includes("PETER")) {
    return "es_male_m3"; // Voz masculina española ágil y dinámica
  }

  // Asistente inteligente sintética o superheroína regia
  if (p.includes("ALEXA") || p.includes("WONDER_WOMAN") || p.includes("MARAVILLA") || p.includes("ROBOT")) {
    return "es_female_f6"; // Voz femenina digital, nítida y articulada
  }

  // Voz femenina joven alegre y dulce por defecto
  return "es_mx_female_supermom"; // Voz femenina cálida, dulce y expresiva
}

/**
 * Catálogo Canónico de Model IDs de Fish Audio (Superhéroes y Personajes de Cine)
 */
var VOCES_CATALOGO_FISH_AUDIO_ = {
  BATMAN: "9fe0f074e28b424185383ed287629c7b",
  IRON_MAN: "42003ba43cf34859ad1e7313ee3fea50",
  OPTIMUS_PRIME: "a643c69dbe314687a6cfeac8993d5600",
  SPIDERMAN: "20bda44c174d457d9dfd131cdd5c2858",
  CAPITAN_AMERICA: "57105c5b8a0b4d16853f6e08916b746d",
  THOR: "eebe207782a348a3aa906ae4cc1a110e",
  HULK: "0d3fec4e3ff346ea91a83028bdfa4f11",
  BLACK_WIDOW: "8b7dc2a3c9f24b2a8d87b8541ed9eda4",
  DOCTOR_STRANGE: "4953ae6b3cee4e6782fa0ac49c71dc45",
  WOLVERINE: "23b2d4398a0447daa324a14748ccbd56",
  DEADPOOL: "98c69ae189b54c6394e15a2440b74a60",
  LOKI: "2b2dbc6598634a5aa868735273d261a8",
  SUPERMAN: "0c35f64b00d54497a05e948cf5c3adf5",
  FLASH: "691035c69e704686bb3337be74b5cb92",
  HELLBOY: "9c4b0a63007e440a857bfa304707116b",
  SPAWN: "29adeffc2d924009be1e5afff0587af8",
  GATO_CON_BOTAS: "464ca191f6db4af6951037893e640ee4",
  ALEXA: "7c8ce560602b4102b758f62549cf8de7",
  ALEX: "1aa34db005974034b4bf42ac06eedc1e",
  MORGAN_FREEMAN: "7c76e349434d4f1e97078d924acea65f"
};

/**
 * Mapeo de perfiles a IDs de modelos de Fish Audio (reference_id)
 */
function mapearVozFishAudio_(perfil) {
  const p = String(perfil || "").toUpperCase();
  const props = PropertiesService.getScriptProperties();

  // 1. Overrides específicos configurados en ScriptProperties (ej: FISH_AUDIO_VOICE_ID_BATMAN)
  const propDirecta = props.getProperty("FISH_AUDIO_VOICE_ID_" + p);
  if (propDirecta && propDirecta.trim() !== "") return propDirecta.trim();

  // 2. Mapeo fonético contra el Catálogo Canónico
  if (p.includes("BATMAN") || p.includes("BRUCE")) return VOCES_CATALOGO_FISH_AUDIO_.BATMAN;
  if (p.includes("IRON_MAN") || p.includes("STARK") || p.includes("JARVIS")) return VOCES_CATALOGO_FISH_AUDIO_.IRON_MAN;
  if (p.includes("OPTIMUS")) return VOCES_CATALOGO_FISH_AUDIO_.OPTIMUS_PRIME;
  if (p.includes("SPIDERMAN") || p.includes("SPIDER") || p.includes("PETER")) return VOCES_CATALOGO_FISH_AUDIO_.SPIDERMAN;
  if (p.includes("CAPITAN") || p.includes("AMERICA") || p.includes("STEVE")) return VOCES_CATALOGO_FISH_AUDIO_.CAPITAN_AMERICA;
  if (p.includes("THOR")) return VOCES_CATALOGO_FISH_AUDIO_.THOR;
  if (p.includes("HULK") || p.includes("BANNER")) return VOCES_CATALOGO_FISH_AUDIO_.HULK;
  if (p.includes("BLACK_WIDOW") || p.includes("VIUDA") || p.includes("NATASHA")) return VOCES_CATALOGO_FISH_AUDIO_.BLACK_WIDOW;
  if (p.includes("STRANGE") || p.includes("DOCTOR_STRANGE")) return VOCES_CATALOGO_FISH_AUDIO_.DOCTOR_STRANGE;
  if (p.includes("WOLVERINE") || p.includes("LOGAN")) return VOCES_CATALOGO_FISH_AUDIO_.WOLVERINE;
  if (p.includes("DEADPOOL") || p.includes("WADE")) return VOCES_CATALOGO_FISH_AUDIO_.DEADPOOL;
  if (p.includes("LOKI")) return VOCES_CATALOGO_FISH_AUDIO_.LOKI;
  if (p.includes("SUPERMAN") || p.includes("CLARK")) return VOCES_CATALOGO_FISH_AUDIO_.SUPERMAN;
  if (p.includes("FLASH") || p.includes("BARRY")) return VOCES_CATALOGO_FISH_AUDIO_.FLASH;
  if (p.includes("HELLBOY")) return VOCES_CATALOGO_FISH_AUDIO_.HELLBOY;
  if (p.includes("SPAWN")) return VOCES_CATALOGO_FISH_AUDIO_.SPAWN;
  if (p.includes("GATO") || p.includes("BOTAS") || p.includes("PUSS")) return VOCES_CATALOGO_FISH_AUDIO_.GATO_CON_BOTAS;
  if (p.includes("FREEMAN") || p.includes("MORGAN")) return VOCES_CATALOGO_FISH_AUDIO_.MORGAN_FREEMAN;
  if (p.includes("ALEXA") || p.includes("FEMENINO") || p.includes("DULCE") || p.includes("WONDER")) return VOCES_CATALOGO_FISH_AUDIO_.ALEXA;
  if (p.includes("ALEX") || p.includes("MASCULINO") || p.includes("CORDIAL") || p.includes("AMBIGUO")) return VOCES_CATALOGO_FISH_AUDIO_.ALEX;

  // 2.5 Búsqueda en Catálogo de Personajes Dinámicos (Hoja Personajes)
  try {
    if (typeof obtenerPersonajesDinamicos_ === "function") {
      const dinamicos = obtenerPersonajesDinamicos_(null, true);
      for (let i = 0; i < dinamicos.length; i++) {
        const d = dinamicos[i];
        const k = String(d.idClave || "").toUpperCase();
        const nom = String(d.nombre || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (p === k || p.includes(k) || (nom && p.includes(nom))) {
          if (d.fishAudioId && d.fishAudioId.trim() !== "") {
            return d.fishAudioId.trim();
          }
        }
      }
    }
  } catch (eDin) {
    Logger.log("Aviso buscando en personajes dinámicos: " + eDin.message);
  }

  // 3. Fallback: Si hay una voz por defecto o Batman
  const customDefault = props.getProperty("FISH_AUDIO_DEFAULT_VOICE_ID");
  if (customDefault && customDefault.trim() !== "") return customDefault.trim();

  return VOCES_CATALOGO_FISH_AUDIO_.BATMAN;
}

/**
 * Mapeo de perfiles a IDs de voces de ElevenLabs
 */
function mapearVozElevenLabs_(perfil) {
  const p = String(perfil || "").toUpperCase();
  // Soporte para Voice ID clonado personalizado de Batman en ElevenLabs
  if (p.includes("BATMAN") || p.includes("BRUCE")) {
    const customBatmanId = PropertiesService.getScriptProperties().getProperty("ELEVENLABS_VOICE_ID_BATMAN");
    if (customBatmanId && customBatmanId.trim() !== "") {
      return customBatmanId.trim();
    }
    return "onwK4e9ZLuTAKqWW03F9"; // Marcus (Voz profunda de acción por defecto)
  }
  if (p.includes("THOR")) return "onwK4e9ZLuTAKqWW03F9"; // Marcus (Grave)
  if (p.includes("IRON_MAN") || p.includes("STARK")) return "ErXwobaYiN019PkySvjV"; // Antoni
  if (p.includes("OPTIMUS") || p.includes("WOLVERINE")) return "N2lVS1w4EtoT3dr4eOWO"; // Callum
  if (p.includes("SPIDERMAN")) return "TxGEqnHWrfWFTfGW9XjX"; // Josh
  if (p.includes("SUPERMAN")) return "VR6AewLTigWG4xSOukaG"; // Arnold
  if (p.includes("ALEXA")) return "21m00Tcm4TlvDq8ikWAM"; // Rachel
  if (p.includes("WONDER_WOMAN")) return "EXAVITQu4vr4xnSDxMaL"; // Bella
  if (p.includes("MASCULINO")) return "pNInz6obpgDQGcFmaJgB"; // Adam
  return "EXAVITQu4vr4xnSDxMaL"; // Bella (Femenino Dulce)
}

/**
 * Mapeo de perfiles a voces de OpenAI TTS
 */
function mapearVozOpenAI_(perfil) {
  const p = String(perfil || "").toUpperCase();
  if (p.includes("BATMAN") || p.includes("BRUCE") || p.includes("OPTIMUS") || p.includes("WOLVERINE") || p.includes("THOR")) {
    return "onyx"; // Masculina grave y barítona
  }
  if (p.includes("IRON_MAN") || p.includes("SUPERMAN") || p.includes("MASCULINO")) {
    return "echo"; // Masculina resonante y cordial
  }
  if (p.includes("SPIDERMAN")) {
    return "fable"; // Masculina expresiva y dinámica
  }
  if (p.includes("ALEXA")) {
    return "alloy"; // Neutra digital precisa
  }
  return "nova"; // Femenina cálida y dulce
}

/**
 * Fallback a URL pública de Google Translate TTS adaptando parámetros acústicos
 */
function construirAudioUrlSegunPerfil_(textoLimpio, perfilVoz) {
  const enc = encodeURIComponent(String(textoLimpio).substring(0, 200));
  const perfil = String(perfilVoz || "FEMENINO_DULCE").toUpperCase();

  if (perfil.includes("BATMAN")) {
    return `https://translate.google.com/translate_tts?ie=UTF-8&tl=es-ES&client=tw-ob&ttsspeed=0.78&q=${enc}`;
  }
  if (perfil.includes("ROBOT")) {
    return `https://translate.google.com/translate_tts?ie=UTF-8&tl=es-ES&client=tw-ob&ttsspeed=0.85&q=${enc}`;
  }
  if (perfil.includes("MASCULINO")) {
    return `https://translate.google.com/translate_tts?ie=UTF-8&tl=es-MX&client=tw-ob&ttsspeed=0.92&q=${enc}`;
  }
  if (perfil.includes("OPTIMUS") || perfil.includes("WOLVERINE") || perfil.includes("THOR")) {
    return `https://translate.google.com/translate_tts?ie=UTF-8&tl=es-ES&client=tw-ob&ttsspeed=0.95&q=${enc}`;
  }
  if (perfil.includes("IRON_MAN") || perfil.includes("SUPERMAN")) {
    return `https://translate.google.com/translate_tts?ie=UTF-8&tl=es-MX&client=tw-ob&ttsspeed=0.95&q=${enc}`;
  }
  if (perfil.includes("SPIDERMAN") || perfil.includes("GATO") || perfil.includes("BOTAS")) {
    return `https://translate.google.com/translate_tts?ie=UTF-8&tl=es-CO&client=tw-ob&ttsspeed=1.12&q=${enc}`;
  }
  if (perfil.includes("ALEXA") || perfil.includes("WONDER_WOMAN")) {
    return `https://translate.google.com/translate_tts?ie=UTF-8&tl=es-US&client=tw-ob&ttsspeed=1.02&q=${enc}`;
  }
  return `https://translate.google.com/translate_tts?ie=UTF-8&tl=es-CO&client=tw-ob&ttsspeed=1.05&q=${enc}`;
}

// ============================================================================
// 4.5 MOTOR DE PROPUESTA PERIÓDICA DE INMERSIÓN Y ROTACIÓN DE PERSONAJES
// ============================================================================
/**
 * Evalúa si han transcurrido 14 días desde la última propuesta o cambio de personaje,
 * y en tal caso adjunta discretamente la invitación a explorar nuevos personajes al final del mensaje.
 */
function verificarYAdjuntarPropuestaInmersion_(telefono, textoRespuesta, tipoRespuesta) {
  // No adjuntar si la respuesta ya era sobre cambiar o explorar personajes
  if (tipoRespuesta === "catalogo_superheroes" || tipoRespuesta === "catalogo_categoria" || tipoRespuesta === "confirmar_continuidad_personaje" || tipoRespuesta === "cambio_solo_voz" || tipoRespuesta === "cambio_nombre_y_voz") {
    return textoRespuesta;
  }

  try {
    const perm = typeof verificarPermisosUsuario_ === "function" ? verificarPermisosUsuario_(telefono) : null;
    if (!perm || !perm.autorizado) return textoRespuesta;

    // Leer configVoz
    let conf = {};
    try {
      conf = typeof perm.configVoz === "string" ? JSON.parse(perm.configVoz) : (perm.configVoz || {});
    } catch(e) {}

    const ahora = new Date();
    const hoyStr = Utilities.formatDate(ahora, Session.getScriptTimeZone(), "yyyy-MM-dd");

    // Si ya se propuso hace menos de 14 días, no insistir
    if (conf.ultimaPropuestaRotacion) {
      const fechaUltima = new Date(conf.ultimaPropuestaRotacion);
      const diffDias = Math.floor((ahora.getTime() - fechaUltima.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDias < 14) return textoRespuesta;
    } else {
      // Si nunca se ha propuesto, comprobar si lleva al menos 14 días registrado
      if (perm.fechaAutorizacion) {
        const fechaAuto = new Date(perm.fechaAutorizacion);
        const diffDias = Math.floor((ahora.getTime() - fechaAuto.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDias < 14) return textoRespuesta;
      }
    }

    // Registrar fecha de propuesta para no volver a insistir en 14 días
    conf.ultimaPropuestaRotacion = hoyStr;
    const aliasActual = perm.aliasAsistente || (perm.rol === "SUPER_ADMIN" ? "Bruce Wayne" : "tu copiloto");
    if (typeof actualizarPerfilAsistenteUsuario === "function") {
      actualizarPerfilAsistenteUsuario(telefono, perm.aliasAsistente, perm.perfilVoz, conf);
    }

    const bannerInmersion = `\n\n` +
      `──────────────────────────────\n` +
      `🎭 *Propuesta de Inmersión Antigravity (14 días):*\n` +
      `Llevas varias semanas colaborando con *${aliasActual}*. ¿Deseas mantenerlo o te gustaría explorar nuevos personajes y voces para renovar tu experiencia?\n` +
      `• Escribe *PERSONAJES* para explorar las 4 categorías disponibles paso a paso.\n` +
      `• Escribe *CONTINUAR* para mantener a tu copiloto actual por otros 14 días.`;

    return textoRespuesta + bannerInmersion;
  } catch (errInm) {
    Logger.log("Aviso en propuesta periódica de inmersión: " + errInm.message);
    return textoRespuesta;
  }
}

/**
 * Actualiza la fecha de última propuesta al confirmar continuidad
 */
function actualizarFechaPropuestaInmersion_(telefono) {
  try {
    const perm = typeof verificarPermisosUsuario_ === "function" ? verificarPermisosUsuario_(telefono) : null;
    if (!perm) return;
    let conf = {};
    try {
      conf = typeof perm.configVoz === "string" ? JSON.parse(perm.configVoz) : (perm.configVoz || {});
    } catch(e) {}
    conf.ultimaPropuestaRotacion = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    if (typeof actualizarPerfilAsistenteUsuario === "function") {
      actualizarPerfilAsistenteUsuario(telefono, perm.aliasAsistente, perm.perfilVoz, conf);
    }
  } catch(e) {
    Logger.log("Aviso en actualizarFechaPropuestaInmersion_: " + e.message);
  }
}

// ============================================================================
// 5. INDUCCIÓN Y BIENVENIDA OFICIAL (PRIMERA Y ÚNICA VEZ)
// ============================================================================
/**
 * Envía el mensaje de bienvenida e inducción por primera y única vez al usuario.
 */
function enviarMensajeBienvenidaNuevoUsuario_(telefono, nombre) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetCtrl = ss.getSheetByName(HOJAS.CONTROL_ACCESO);
  if (!sheetCtrl || sheetCtrl.getLastRow() <= 1) return;

  const telLimpio = normalizarTelefono_(telefono);
  const datos = sheetCtrl.getRange(2, 1, sheetCtrl.getLastRow() - 1, 8).getValues();

  let filaUsuario = -1;
  for (let i = 0; i < datos.length; i++) {
    if (normalizarTelefono_(datos[i][0]) === telLimpio) {
      if (String(datos[i][7]).toUpperCase() === "SI") {
        Logger.log(`Bienvenida ya fue enviada previamente a ${nombre} (${telefono}).`);
        return;
      }
      filaUsuario = i + 2;
      break;
    }
  }

  const nombreLimpio = typeof sanitizarNombreParaVoz_ === "function" ? sanitizarNombreParaVoz_(nombre) : "Estimado usuario";
  const mensajeBienvenida = 
    `🌟 *¡Hola, ${nombreLimpio}! Te doy la bienvenida a tu Asistente Financiero Personal en WhatsApp.*\n\n` +
    `Estoy aquí para ayudarte a llevar el control claro, tranquilo y profesional de tu dinero. Todo lo que registres aquí se guardará directamente en tus propias hojas privadas dentro del libro contable con protección Zero-Trust.\n\n` +
    `📌 *¿CÓMO PODEMOS TRABAJAR JUNTOS?*\n\n` +
    `1️⃣ 💬 *Mensajes Naturales (Gastos e Ingresos):*\n` +
    `Escríbeme con total naturalidad:\n` +
    `• *"Gasté 45000 en mercado con tarjeta débito"*\n` +
    `• *"Me pagaron 850000 por honorarios"*\n` +
    `• *"Pagué 32000 en almuerzo en efectivo"*\n\n` +
    `2️⃣ 📸 *Fotos de Recibos y Comprobantes (Visión Artificial):*\n` +
    `• Envíame fotos de facturas físicas o capturas de transferencias (Nequi, Daviplata, Bancolombia).\n` +
    `• Extraeré automáticamente el valor, destinatario y concepto para registrarlo.\n\n` +
    `3️⃣ 🎙️ *Notas de Voz y Respuestas en Audio:*\n` +
    `• Puedes enviarme notas de voz contándome tus compras o cobros del día.\n` +
    `• Si quieres que te responda con una nota de voz, solo dímelo: *"Respóndeme por audio"*.\n\n` +
    `4️⃣ 🤝 *Cuentas por Pagar y Deudas:*\n` +
    `• *"Le debo 120000 a la droguería para pagar el 25 de este mes"*\n` +
    `• *"Aboné 50000 a la droguería"*\n\n` +
    `5️⃣ 📊 *Consultas de Saldo e Informes en Vivo:*\n` +
    `• *"¿Cuánto dinero me queda disponible?"*\n` +
    `• *"¿Cuánto he gastado este mes?"*\n` +
    `• *"¿Qué deudas tengo pendientes?"*\n\n` +
    `6️⃣ 💎 *Tu Dashboard Visual Privado (Magic Link Zero-Trust):*\n` +
    `• Cada vez que consultes tus saldos o me escribas *"Dame mi link"* o *"Ver mi dashboard"*, te generaré tu enlace web personal para que explores tus gráficos y flujo de caja en pantalla completa desde tu celular o computador, sin contraseñas pero 100% aislado.\n\n` +
    `7️⃣ 🎭 *Asistente 100% Configurable a tu Medida:*\n` +
    `• Este asistente es tuyo y puedes personalizarlo las veces que quieras. Puedes cambiarle el nombre, el tono y la voz cuando gustes:\n` +
    `• *"Quiero cambiar el nombre de mi asistente a Aura"* (o Sofía, Jarvis, Atenea...)\n` +
    `• *"Quiero que hables con tono más formal"* o *"Sé más amigable y cercano"*\n` +
    `• *"Cambia tu voz a femenina dulce"* o *"Voz masculina cordial"*\n\n` +
    `8️⃣ 💳 *Inscripción de tus Cuentas Bancarias / Billeteras:*\n` +
    `• Para que tus saldos y bóveda de liquidez estén siempre al día, regístrame tus entidades financieras:\n` +
    `• Aporta la *Entidad bancaria* y los *últimos 4 dígitos* precedidos de 3 asteriscos (ej: *"Bancolombia ***1234"* o *"Nequi ***7890"*).\n` +
    `• Puedes inscribir nuevas cuentas en cualquier momento diciendo: *"Registrar mi cuenta Bancolombia ***1234"* o *"Agregar cuenta Nequi ***7890"*.\n\n` +
    `🔒 *100% Privado y Seguro:* Tu información solo es accesible en tus hojas dedicadas y nadie más puede ver tus finanzas personales.\n\n` +
    `¡Empieza ahora mismo enviándome tu primer movimiento, saldo o inscribiendo tu cuenta bancaria!`;

  enviarMensajeWhatsApp(telefono, mensajeBienvenida);

  if (filaUsuario !== -1) {
    sheetCtrl.getRange(filaUsuario, 8).setValue("SI");
    SpreadsheetApp.flush();
    Logger.log(`✅ Mensaje de inducción y bienvenida enriquecido enviado exitosamente a ${nombre}.`);
  }
}

/**
 * 5.1 DIFUSIÓN MASIVA (BROADCAST) DE NUEVO PERSONAJE DISPONIBLE
 * Notifica a todos los usuarios activos registrados en Control_Acceso
 * con el saludo inicial característico y frases distintivas.
 */
function difundirNuevoPersonajeWhatsApp_(personaje) {
  if (!personaje) return { ok: false, error: "Datos de personaje vacíos" };
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetCtrl = ss.getSheetByName(HOJAS.CONTROL_ACCESO);
  if (!sheetCtrl || sheetCtrl.getLastRow() <= 1) return { ok: false, error: "Sin usuarios en Control_Acceso" };

  const datos = sheetCtrl.getRange(2, 1, sheetCtrl.getLastRow() - 1, 4).getValues();
  const usuariosNotificados = [];

  const nombrePersonaje = personaje.nombre || "Nuevo Personaje";
  const emoji = personaje.emoji || "🎭";
  const desc = personaje.descripcion || "Personalidad legendaria";
  const lema = personaje.lema ? `• 🛡️ *Lema:* _«${personaje.lema}»_\n` : "";
  const saludo = personaje.saludoInicial ? `🎙️ *Mensaje de Presentación:* \n_«${personaje.saludoInicial}»_\n\n` : "";
  
  let frasesStr = "";
  if (personaje.frasesDistintivas && String(personaje.frasesDistintivas).trim() !== "") {
    const arr = String(personaje.frasesDistintivas).split("|").map(f => f.trim()).filter(f => f.length > 0);
    if (arr.length > 0) {
      frasesStr = `⚔️ *Frases Célebres:* \n` + arr.map(f => `• _"${f}"_`).join("\n") + "\n\n";
    }
  }

  const mensajeBroadcast = 
    `🌟 *¡NUEVO PERSONAJE DISPONIBLE EN TU ASISTENTE!* ${emoji}\n\n` +
    `Nos alegra anunciar la incorporación de una nueva personalidad legendaria a nuestro sistema:\n\n` +
    `✨ *${nombrePersonaje}*\n` +
    `• 🎭 *Perfil:* _${desc}_\n` +
    lema + "\n" +
    saludo +
    frasesStr +
    `👉 *¿Cómo activarlo?*\n` +
    `Solo escríbeme: *"Quiero la voz de ${nombrePersonaje}"* o *"Ponte la voz de ${nombrePersonaje}"* y empezaré a hablarte con su voz y personalidad al instante.`;

  for (let i = 0; i < datos.length; i++) {
    const tel = datos[i][0];
    const estado = String(datos[i][3] || "").toUpperCase().trim();
    if (tel && estado === "ACTIVO") {
      const telNorm = normalizarTelefono_(tel);
      try {
        enviarMensajeWhatsApp(telNorm, mensajeBroadcast);
        usuariosNotificados.push(telNorm);
      } catch (eEnvio) {
        Logger.log(`Aviso enviando broadcast a ${telNorm}: ` + eEnvio.message);
      }
    }
  }

  Logger.log(`📢 Difusión de nuevo personaje '${nombrePersonaje}' enviada a ${usuariosNotificados.length} usuarios.`);
  return {
    ok: true,
    totalNotificados: usuariosNotificados.length,
    usuarios: usuariosNotificados
  };
}

// ============================================================================
// 6. AUTOMATIZACIÓN DE RECORDATORIOS: 8:00 PM Y CONTROL ESTRICTO 8:00 AM
// ============================================================================

/**
 * Escaneo diario a las 8:00 PM:
 * Si un usuario activo no registró ningún movimiento en todo el día, le envía un recordatorio.
 */
function ejecutarEscaneoInactividad8PM() {
  Logger.log("🌙 Ejecutando escaneo de inactividad financiera (8:00 PM)...");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetCtrl = ss.getSheetByName(HOJAS.CONTROL_ACCESO);
  if (!sheetCtrl || sheetCtrl.getLastRow() <= 1) return;

  const usuarios = sheetCtrl.getRange(2, 1, sheetCtrl.getLastRow() - 1, 5).getValues();
  const hoyStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

  usuarios.forEach(u => {
    const telefono = u[0];
    const nombre = u[1];
    const estado = String(u[3]).trim().toUpperCase();
    const hojas = String(u[4]);

    if (estado !== "ACTIVO") return;

    let hojaTrans = HOJAS.PERSONAL_TRANS;
    if (u[2] !== "SUPER_ADMIN") {
      const match = hojas.match(/([a-zA-Z0-9]+_Transacciones)/);
      if (match) hojaTrans = match[1];
    }

    const sheetTrans = ss.getSheetByName(hojaTrans);
    let movimientosHoy = 0;

    if (sheetTrans && sheetTrans.getLastRow() > 1) {
      const filas = sheetTrans.getRange(2, 2, sheetTrans.getLastRow() - 1, 1).getValues();
      filas.forEach(f => {
        const fechaFila = f[0] instanceof Date 
          ? Utilities.formatDate(f[0], Session.getScriptTimeZone(), "yyyy-MM-dd")
          : String(f[0]).substring(0, 10);
        if (fechaFila === hoyStr) {
          movimientosHoy++;
        }
      });
    }

    // Solo si no registró NINGÚN movimiento en todo el día
    if (movimientosHoy === 0) {
      const nombreLimpio = typeof sanitizarNombreParaVoz_ === "function" ? sanitizarNombreParaVoz_(nombre) : "Fernando";
      const mensajes8PM = [
        `🌙 *Buenas noches, ${nombreLimpio}.* ¿Cómo estuvo tu día?\n\n` +
        `Estuve revisando tus cuentas y hoy no anotamos ningún movimiento en tus finanzas personales. Si tuviste alguna compra, pago o entrada de dinero que se te haya pasado, cuéntame por aquí y te lo dejo organizado de una vez para que descanses tranquilo.`,

        `🌙 *Hola ${nombreLimpio}, espero que hayas tenido un excelente día.*\n\n` +
        `Paso a saludarte antes de cerrar la jornada: hoy tus registros personales quedaron en blanco. Si hiciste algún gasto o recibiste algún pago hoy, déjamelo por aquí y lo dejamos cuadrado en un minuto.`,

        `🌙 *Buenas noches, ${nombreLimpio}.*\n\n` +
        `Cerrando el día, veo que no registramos movimientos en tus finanzas personales hoy. Si hubo algún cafecito, almuerzo, compra o ingreso que quieras asentar, solo dime el valor y concepto y me encargo. ¡Un abrazo y feliz descanso!`
      ];
      const mensaje8PM = mensajes8PM[Math.floor(Math.random() * mensajes8PM.length)];
      
      enviarMensajeWhatsApp(telefono, mensaje8PM);
      Logger.log(`🌙 Recordatorio de inactividad 8:00 PM enviado a ${nombreLimpio} (${telefono}).`);
    }
  });
}

/**
 * Control Diario Matutino a las 8:00 AM:
 * Saludo humano y proactivo para validar si quedaron registros pendientes de anoche o la madrugada.
 */
function ejecutarControlEstricto8AM() {
  Logger.log("☀️ Ejecutando Control Matutino Humano (8:00 AM)...");
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    try {
      const propId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
      if (propId) ss = SpreadsheetApp.openById(propId);
    } catch(eOpen) {
      Logger.log("Aviso abriendo libro por ID en 8AM: " + eOpen.message);
    }
  }

  if (!ss) {
    Logger.log("❌ Error crítico en 8:00 AM: No se pudo obtener acceso a la hoja de cálculo.");
    return;
  }

  // 1. Escanear compromisos urgentes para el Super Admin
  try {
    ejecutarDisparoDiarioAlertas();
  } catch (err) {
    Logger.log("Aviso en alertas de deudas matutinas: " + err.message);
  }

  // 2. Verificación de Registro de Transacciones para TODOS los usuarios activos
  const sheetCtrl = ss.getSheetByName(HOJAS.CONTROL_ACCESO);
  if (!sheetCtrl || sheetCtrl.getLastRow() <= 1) {
    Logger.log("ℹ️ Hoja Control_Acceso vacía o inexistente.");
    return;
  }

  const usuarios = sheetCtrl.getRange(2, 1, sheetCtrl.getLastRow() - 1, 5).getValues();
  
  const ayerDate = new Date();
  ayerDate.setDate(ayerDate.getDate() - 1);
  const ayerStr = Utilities.formatDate(ayerDate, Session.getScriptTimeZone(), "yyyy-MM-dd");

  usuarios.forEach((u, idx) => {
    try {
      const telefono = u[0];
      const nombre = u[1];
      const estado = String(u[3]).trim().toUpperCase();
      const hojas = String(u[4]);

      if (estado !== "ACTIVO" || !telefono) return;

      let hojaTrans = HOJAS.PERSONAL_TRANS;
      if (u[2] !== "SUPER_ADMIN") {
        const match = hojas.match(/([a-zA-Z0-9]+_Transacciones)/);
        if (match) hojaTrans = match[1];
      }

      const sheetTrans = ss.getSheetByName(hojaTrans);
      let movimientosAyer = 0;

      if (sheetTrans && sheetTrans.getLastRow() > 1) {
        const filas = sheetTrans.getRange(2, 2, sheetTrans.getLastRow() - 1, 1).getValues();
        filas.forEach(f => {
          const fechaFila = f[0] instanceof Date 
            ? Utilities.formatDate(f[0], Session.getScriptTimeZone(), "yyyy-MM-dd")
            : String(f[0]).substring(0, 10);
          if (fechaFila === ayerStr) {
            movimientosAyer++;
          }
        });
      }

      const nombreLimpio = typeof sanitizarNombreParaVoz_ === "function" ? sanitizarNombreParaVoz_(nombre) : "Fernando";
      let mensaje8AM = "";
      if (movimientosAyer > 0) {
        const opcionesConMov = [
          `☀️ *¡Buenos días, ${nombreLimpio}!* Espero que hayas descansado muy bien.\n\n` +
          `Ayer dejamos varios movimientos organizados en tus cuentas. ¿Te quedó de pronto algún pago de anoche o compra de primera hora por anotar? Si es así, me avisas y lo dejamos al día. ¡Muchos éxitos en la jornada de hoy!`,

          `☀️ *¡Feliz mañana, ${nombreLimpio}!* Arrancamos un nuevo día con las cuentas en orden.\n\n` +
          `Tus números de ayer quedaron muy bien registrados. Si hiciste algún pago adicional anoche o esta madrugada, dímelo por acá y lo sumamos de una vez. ¡A darle con toda!`
        ];
        mensaje8AM = opcionesConMov[Math.floor(Math.random() * opcionesConMov.length)];
      } else {
        const opcionesSinMov = [
          `☀️ *¡Buenos días, ${nombreLimpio}!* Espero que hayas tenido una excelente noche.\n\n` +
          `Arrancamos hoy con tus cuentas listas. Quería preguntarte si de pronto te quedó algún gasto o ingreso de ayer pendiente por anotar, o si la jornada estuvo completamente tranquila. Me cuentas y lo dejamos listo. ¡Que tengas un gran día!`,

          `☀️ *¡Hola ${nombreLimpio}, feliz día!*\n\n` +
          `Paso a saludarte al iniciar el día. Veo que ayer no tuvimos movimientos registrados; si se te quedó algo en el tintero de anoche o de esta mañana, solo escríbemelo o envíame un audio y lo asiento de inmediato. ¡Éxitos hoy!`
        ];
        mensaje8AM = opcionesSinMov[Math.floor(Math.random() * opcionesSinMov.length)];
      }

      // Soporte para Fallback a Plantilla Meta de Utilidad si la ventana de 24h está cerrada
      let plantilla8AM = "recordatorio_matutino";
      let idiomaPlantilla = "es_CO";
      try {
        const props = PropertiesService.getScriptProperties();
        plantilla8AM = props.getProperty("META_TEMPLATE_RECORDATORIO_8AM") || "recordatorio_matutino";
        idiomaPlantilla = props.getProperty("META_TEMPLATE_LANGUAGE") || "es_CO";
      } catch (eProps8AM) {}

      const resEnvio = enviarMensajeWhatsApp(telefono, mensaje8AM, {
        nombrePlantilla: plantilla8AM,
        idioma: idiomaPlantilla,
        parametros: [nombreLimpio]
      });

      if (resEnvio && resEnvio.enviado) {
        if (resEnvio.plantilla) {
          Logger.log(`☀️ [8:00 AM OK VÍA PLANTILLA '${resEnvio.plantilla}'] Entregado proactivamente fuera de ventana 24h a ${nombreLimpio} (${telefono}).`);
        } else {
          Logger.log(`☀️ [8:00 AM OK - TEXTO LIBRE] Despachado a ${nombreLimpio} (${telefono}).`);
        }
      } else {
        Logger.log(`⚠️ [8:00 AM AVISO] No entregado a ${nombreLimpio} (${telefono}): ${resEnvio ? resEnvio.error : 'Sin respuesta'}`);
      }
    } catch(errUser) {
      Logger.log(`❌ Error procesando control 8:00 AM para usuario #${idx + 1}: ${errUser.message}`);
    }
  });
}

/**
 * Función de prueba manual para verificar inmediatamente el despacho del recordatorio de las 8:00 AM
 * y revisar diagnósticos detallados en el registro de Apps Script.
 */
function probarDespachoControl8AM() {
  Logger.log("🧪 Iniciando prueba manual de ejecutarControlEstricto8AM()...");
  ejecutarControlEstricto8AM();
  Logger.log("🧪 Prueba manual finalizada. Revisa el registro de ejecuciones arriba.");
}

/**
 * Instala automáticamente ambos disparadores de Apps Script (8:00 AM y 8:00 PM)
 */
function instalarDisparadoresHorariosCompletos() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    const fn = t.getHandlerFunction();
    if (fn === "ejecutarControlEstricto8AM" || fn === "ejecutarEscaneoInactividad8PM" || fn === "ejecutarDisparoDiarioAlertas") {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Disparador 8:00 AM
  const t8AM = ScriptApp.newTrigger("ejecutarControlEstricto8AM")
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();

  // Disparador 8:00 PM
  const t8PM = ScriptApp.newTrigger("ejecutarEscaneoInactividad8PM")
    .timeBased()
    .everyDays(1)
    .atHour(20)
    .create();

  Logger.log("⏰ Disparadores instalados con éxito: 8:00 AM (Control Estricto) y 8:00 PM (Verificación Inactividad).");
  return {
    ok: true,
    t8AM: t8AM.getUniqueId(),
    t8PM: t8PM.getUniqueId(),
    mensaje: "Disparadores de 8:00 AM y 8:00 PM programados con éxito."
  };
}

function instalarDisparadorAlertasDiarias() {
  return instalarDisparadoresHorariosCompletos();
}

/**
 * Elimina cualquier disparador automático huérfano, residual o de pruebas instalado en el proyecto
 */
function purgarTodosLosDisparadoresHuerfanos() {
  const triggers = ScriptApp.getProjectTriggers();
  let eliminados = 0;
  triggers.forEach(t => {
    const fn = t.getHandlerFunction();
    const esPermitido = fn === "ejecutarControlEstricto8AM" || fn === "ejecutarEscaneoInactividad8PM";
    if (!esPermitido) {
      ScriptApp.deleteTrigger(t);
      eliminados++;
      Logger.log(`Disparador huérfano/de prueba eliminado: ${fn}`);
    }
  });
  Logger.log(`✅ Disparadores huérfanos eliminados: ${eliminados}`);
  return `✅ Se eliminaron ${eliminados} disparadores huérfanos o no autorizados.`;
}

/**
 * Función de compatibilidad para escáner matutino de deudas
 */
function ejecutarDisparoDiarioAlertas() {
  Logger.log("🌅 Ejecutando escáner matutino de compromisos financieros (8:00 AM)...");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let totalAlertas = 0;
  let enviadas = 0;

  // 1. Escanear obligaciones urgentes de Fernando / Super Admin (Personal, More Paper, More Design, Consolidado)
  const alertasAdmin = typeof escanearCompromisosPorVencer === "function" 
    ? escanearCompromisosPorVencer(["Personal", "More Paper", "More Design", "Consolidado"]) 
    : [];
  
  const telAdmin = CONFIG_FINANZAS.TELEFONO_ADMIN_DEFAULT;
  if (alertasAdmin && alertasAdmin.length) {
    totalAlertas += alertasAdmin.length;
    alertasAdmin.forEach(alerta => {
      const resultado = enviarMensajeWhatsApp(telAdmin, alerta.mensajeWhatsApp);
      if (resultado && resultado.enviado) enviadas++;
    });
  }

  // 2. Escanear obligaciones privadas de usuarios estándar activos (ej: Florangellys_Compromisos)
  const sheetCtrl = ss.getSheetByName(HOJAS.CONTROL_ACCESO);
  if (sheetCtrl && sheetCtrl.getLastRow() > 1) {
    const usuarios = sheetCtrl.getRange(2, 1, sheetCtrl.getLastRow() - 1, 5).getValues();
    usuarios.forEach(u => {
      const telUsuario = u[0];
      const rol = String(u[2]).trim().toUpperCase();
      const estado = String(u[3]).trim().toUpperCase();
      const hojas = String(u[4]);

      if (rol !== "SUPER_ADMIN" && estado === "ACTIVO") {
        const match = hojas.match(/([a-zA-Z0-9]+)_Compromisos/);
        if (match) {
          const entidadUsuario = match[1];
          const alertasUser = typeof escanearCompromisosPorVencer === "function"
            ? escanearCompromisosPorVencer([entidadUsuario])
            : [];
          if (alertasUser && alertasUser.length) {
            totalAlertas += alertasUser.length;
            alertasUser.forEach(alerta => {
              const resUser = enviarMensajeWhatsApp(telUsuario, alerta.mensajeWhatsApp);
              if (resUser && resUser.enviado) enviadas++;
            });
          }
        }
      }
    });
  }

  Logger.log(`🌅 Escáner matutino finalizado: ${totalAlertas} alertas detectadas, ${enviadas} despachadas.`);
  return { totalAlertas: totalAlertas, alertasEnviadas: enviadas };
}
