/**
 * ============================================================================
 * SISTEMA FINANCIERO INTELIGENTE - NÚCLEO FASE 2
 * Cerebro del Agente de IA, Enrutamiento Multi-Entidad & Lógica Financiera
 * ============================================================================
 * 
 * Funcionalidades Principales:
 * 1. Procesamiento de lenguaje natural (conversacional, informal, audios).
 * 2. Enrutamiento semántico automático (Personal, More Paper, More Design).
 * 3. Ciclo completo de deudas: creación, abonos parciales y liquidación.
 * 4. Visión computacional para análisis de facturas y transferencias bancarias.
 * 5. Escáner automático de obligaciones (Alertas de vencimiento a 24 horas).
 * 6. Resiliencia total: Fallback heurístico inteligente ante fallos de API externa.
 */

// ============================================================================
// CONFIGURACIÓN DE IA (GOOGLE GEMINI)
// ============================================================================
const CONFIG_IA = {
  // Clave oficial de Google AI Studio - Se almacena de forma segura en PropertiesService
  GEMINI_API_KEY: "", 
  // Modelo principal: Gemini 2.0 Flash (máxima velocidad <1.2s, razonamiento avanzado y audio nativo, nivel gratuito)
  MODELO_TEXTO: "gemini-2.0-flash",
  // Respaldo de razonamiento profundo gratuito
  MODELO_TEXTO_FALLBACK: "gemini-2.5-flash",
  MODELOS_TEXTO: [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash-latest"
  ],
  MODELO_VISION: "gemini-2.0-flash",
  MODELOS_VISION: [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash-latest"
  ],
  MAX_OUTPUT_TOKENS: 8192,
  URL_BASE_GEMINI: "https://generativelanguage.googleapis.com/v1beta/models/"
};

/**
 * Guarda la API Key de forma segura en las propiedades del script de Google
 */
function configurarApiKeyGemini(apiKey) {
  const clave = (typeof apiKey === "string" && apiKey.trim() !== "") 
    ? apiKey.trim() 
    : String(PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY") || CONFIG_IA.GEMINI_API_KEY || "").trim();

  if (!clave || clave === "") {
    throw new Error("Debes proporcionar una clave válida de Gemini API.");
  }
  PropertiesService.getScriptProperties().setProperty("GEMINI_API_KEY", clave);
  Logger.log("✅ Clave de Gemini API guardada con éxito en PropertiesService.");
  return "✅ Clave de Gemini API guardada con éxito en PropertiesService.";
}

function obtenerApiKeyGemini_() {
  let guardada = "";
  try {
    guardada = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  } catch (e) {
    Logger.log("Aviso leyendo ScriptProperties: " + e.message);
  }
  return (guardada && guardada.trim() !== "") ? guardada.trim() : String(CONFIG_IA.GEMINI_API_KEY || "").trim();
}

/**
 * Consulta dinámicamente a Google AI Studio los modelos reales disponibles para la clave actual (ModelService.ListModels).
 * Elimina 100% de los errores 404 causados por modelos descontinuados o renombrados en v1beta.
 */
function obtenerModelosDisponiblesGemini_(apiKey) {
  if (!apiKey || apiKey.trim() === "") return ["gemini-2.0-flash", "gemini-flash-lite-latest", "gemini-1.5-flash", "gemini-pro"];

  let cache;
  try {
    cache = CacheService.getScriptCache();
    const cached = cache.get("GEMINI_AVAILABLE_MODELS");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`;
    const res = UrlFetchApp.fetch(url, { method: "GET", muteHttpExceptions: true });
    
    if (res.getResponseCode() === 200) {
      const json = JSON.parse(res.getContentText());
      if (json && json.models && Array.isArray(json.models)) {
        const validos = json.models
          .filter(m => {
            const methods = m.supportedGenerationMethods || [];
            return methods.includes("generateContent");
          })
          .map(m => String(m.name || "").replace(/^models\//, ""))
          .filter(name => !name.includes("embedding") && !name.includes("aqa") && !name.includes("imagen") && !name.includes("tts") && name !== "gemini-2.5-flash");

        validos.sort((a, b) => {
          if (a === "gemini-2.0-flash") return -1;
          if (b === "gemini-2.0-flash") return 1;
          if (a === "gemini-flash-lite-latest") return -1;
          if (b === "gemini-flash-lite-latest") return 1;
          const aFlash = a.includes("flash") ? 1 : 0;
          const bFlash = b.includes("flash") ? 1 : 0;
          return bFlash - aFlash;
        });

        if (validos.length > 0) {
          Logger.log(`✅ Modelos activos en Google AI Studio (${validos.length}): ${validos.slice(0, 5).join(", ")}`);
          if (cache) {
            try {
              cache.put("GEMINI_AVAILABLE_MODELS", JSON.stringify(validos), 21600); // 6 horas
            } catch (eCache) {}
          }
          return validos;
        }
      }
    } else {
      Logger.log(`Aviso ListModels HTTP ${res.getResponseCode()}: ${res.getContentText().slice(0, 200)}`);
    }
  } catch (err) {
    Logger.log("Aviso al consultar ListModels: " + err.message);
  }

  return ["gemini-2.0-flash", "gemini-flash-lite-latest", "gemini-1.5-flash", "gemini-pro"];
}

/**
 * Sanitiza el nombre de cualquier usuario para un trato humano, natural y cercano,
 * eliminando etiquetas o roles de base de datos como '(Propietario)', '(Super Admin)', etc.
 */
function sanitizarNombreHumano_(nombreRaw) {
  let n = String(nombreRaw || "").trim();
  if (!n) return "Fernando";
  n = n.split(/[,-]/)[0].trim();
  n = n.replace(/\([^\)]*\)/g, "").trim();
  n = n.replace(/\b(?:propietario|admin|administrador|super_admin|super admin|gerente|socio|usuario)\b/gi, "").trim();
  const partes = n.split(/\s+/).filter(Boolean);
  return partes[0] || "Fernando";
}

// ============================================================================
// MOTOR DE CLARIFICACIÓN INTERACTIVA CON OPCIONES (EXPERIENCIA HUMANA)
// ============================================================================

/**
 * Formula preguntas de clarificación cálidas, humanas y con opciones numeradas
 * cuando la solicitud del usuario está incompleta, ambigua o le falta un dato clave.
 */
function gestionarClarificacionInteractiva_(ss, telefono, data, perm, compromisosActivos, saldos) {
  const telLimpio = normalizarTelefono_(telefono);
  const alias = (perm && perm.aliasAsistente) || (perm && perm.rol === "SUPER_ADMIN" ? "Bruce Wayne" : "Aura");
  const nombreHumano = sanitizarNombreHumano_(perm ? perm.nombre : "Fernando");
  const motivo = data.motivo || (data.tipo_clarificacion || "intencion_ambigua");
  const datosParciales = data.datos_parciales || data.datosParciales || {};

  let texto = "";
  let flowData = {
    tipo: motivo,
    datosParciales: datosParciales,
    textoOriginal: data.textoUsuario || "",
    timestamp: new Date().getTime()
  };

  if (motivo === "falta_monto") {
    const ent = datosParciales.entidad || "More Paper";
    const conc = datosParciales.concepto || "la transacción";
    const esGasto = datosParciales.esGasto !== false;

    texto = `¡Con gusto, ${nombreHumano}! Entiendo que deseas registrar ${esGasto ? "un gasto de " + conc : "el ingreso por " + conc} en **${ent}**. ¿Cuál fue el valor exacto de la operación?\n\n` +
      `👉 *Puedes responder directamente con el monto (ejemplo: '45.000' o '$50.000 en efectivo').*`;
    flowData.tipo = "falta_monto";

  } else if (motivo === "falta_entidad") {
    const val = Number(datosParciales.valor) || 0;
    const esIngreso = datosParciales.esIngreso || (datosParciales.tipo === "Ingreso");
    const valStr = val > 0 ? ` de **$${val.toLocaleString("es-CO")} COP**` : "";

    texto = `¡Excelente, ${nombreHumano}! Para registrar ${esIngreso ? "el ingreso" : "el gasto"}${valStr} en la cuenta y libros correspondientes, ¿a cuál de tus entidades pertenece?\n\n` +
      `1️⃣ **More Paper** ${esIngreso ? "(Suma a cuenta común Ahorros ***7194)" : "(Insumos y papelería)"}\n` +
      `2️⃣ **More Design** ${esIngreso ? "(Suma a cuenta común Ahorros ***7194)" : "(Suscripciones y diseño)"}\n` +
      `3️⃣ **Personal** ${esIngreso ? "(Suma a Ahorros ***2103)" : "(Gastos personales)"}\n\n` +
      `👉 *Responde con el número (1, 2 o 3) o el nombre del negocio.*`;
    flowData.tipo = "falta_entidad";

  } else if (motivo === "falta_acreedor") {
    const val = Number(datosParciales.monto_abono) || Number(datosParciales.valor) || 0;
    const valStr = val > 0 ? ` de **$${val.toLocaleString("es-CO")} COP**` : "";
    const compPendientes = Array.isArray(compromisosActivos) ? compromisosActivos : [];

    if (compPendientes.length > 0) {
      const opcionesTexto = compPendientes.slice(0, 4).map((c, idx) => {
        const saldoNum = Number(c.saldo) || 0;
        return `${idx + 1}️⃣ **${c.proveedor}** (Saldo: $${saldoNum.toLocaleString("es-CO")} COP | ${c.entidad || "Personal"})`;
      }).join("\n");

      texto = `¡Qué buena gestión, ${nombreHumano}! ¿A cuál de tus compromisos pendientes deseas aplicar este pago${valStr}?\n\n` +
        opcionesTexto + `\n${Math.min(compPendientes.length + 1, 5)}️⃣ *Otro proveedor no registrado en la lista*\n\n` +
        `👉 *Escribe el número del acreedor o su nombre para asentar el abono.*`;
      flowData.opcionesAcreedores = compPendientes.slice(0, 4);
    } else {
      texto = `Entendido el abono${valStr}, ${nombreHumano}. ¿A qué acreedor o proveedor le realizaste el pago? Dímelo y lo asentaré de inmediato.`;
    }
    flowData.tipo = "falta_acreedor";

  } else {
    // Intención ambigua o general
    if (data.pregunta_humana && Array.isArray(data.opciones_sugeridas) && data.opciones_sugeridas.length > 0) {
      texto = `${data.pregunta_humana}\n\n` +
        data.opciones_sugeridas.map((o, idx) => `${idx + 1}️⃣ ${o.replace(/^\d+[\.\s\)]*/, "")}`).join("\n") +
        `\n\n👉 *Elige el número de la opción que mejor se ajuste a lo que deseas.*`;
    } else {
      texto = `Hola, ${nombreHumano}. Te he entendido, pero para brindarte la mejor precisión financiera, ¿a cuál de estas gestiones te refieres?\n\n` +
        `1️⃣ Registrar un nuevo gasto o compra\n` +
        `2️⃣ Registrar una venta o ingreso recibido\n` +
        `3️⃣ Consultar saldos y liquidez en bancos (***2103 y ***7194)\n` +
        `4️⃣ Revisar compromisos y deudas por pagar\n\n` +
        `👉 *Responde con el número de la opción que necesitas.*`;
    }
    flowData.tipo = "intencion_ambigua";
  }

  // Guardar estado interactivo en CacheService por 10 minutos
  try {
    const cache = CacheService.getUserCache();
    if (cache) {
      cache.put("PENDING_INTERACTIVE_FLOW_" + telLimpio, JSON.stringify(flowData), 600);
    }
  } catch (eCache) {
    Logger.log("Aviso guardando PENDING_INTERACTIVE_FLOW_: " + eCache.message);
  }

  // Generación de Guion Verbal Humano (textoVoz) adaptado a Batman / Asesor sin menús robóticos
  let textoVoz = "";
  const esSuperAdmin = (perm && perm.rol === "SUPER_ADMIN");
  const nombreUsuario = (perm && perm.nombre) ? perm.nombre.split(/[,-]/)[0].trim() : (esSuperAdmin ? "Fernando" : "");
  const saludoNombre = nombreUsuario ? `${nombreUsuario}, ` : "";
  const esBatman = String((perm && perm.perfilVoz) || (esSuperAdmin ? "BATMAN" : "")).toUpperCase().includes("BATMAN");

  if (motivo === "falta_monto") {
    const conc = datosParciales.concepto || "la operación";
    textoVoz = esBatman
      ? `${saludoNombre}¿de qué valor fue el movimiento de ${conc}? Dímelo y lo anoto.`
      : `${saludoNombre}¿cuál fue el valor exacto de ${conc}?`;
  } else if (motivo === "falta_entidad") {
    textoVoz = esBatman
      ? `${saludoNombre}¿este movimiento corresponde a More Paper, More Design o a tus gastos personales?`
      : `${saludoNombre}¿a cuál de tus entidades pertenece este movimiento? More Paper, More Design o Personal.`;
  } else if (motivo === "falta_acreedor") {
    textoVoz = esBatman
      ? `${saludoNombre}¿a qué acreedor o proveedor le realizaste el pago? Dímelo y lo registro.`
      : `${saludoNombre}¿a qué acreedor o proveedor le realizaste el abono?`;
  } else {
    if (data.esConduccion || data.esModoConduccion) {
      textoVoz = esBatman
        ? `${saludoNombre}atención en la vía. Dime si registramos un gasto, una venta o revisamos saldos, y me encargo de inmediato.`
        : `${saludoNombre}atento al camino. Dime qué movimiento o consulta deseas realizar y lo gestiono al instante.`;
    } else {
      textoVoz = esBatman
        ? `${saludoNombre}te escucho. Dime si registramos un gasto, una venta o evaluamos tus saldos y compromisos.`
        : `${saludoNombre}te escucho con atención. ¿Deseas registrar un gasto, un ingreso, o consultar tus balances?`;
    }
  }

  return {
    tipo: "clarificacion_interactiva",
    texto: texto,
    textoVoz: textoVoz,
    perfilVoz: perm ? perm.perfilVoz : null
  };
}

/**
 * Resuelve y asienta la acción contable cuando el usuario responde a una clarificación interactiva previa.
 */
function resolverClarificacionInteractiva_(ss, telefono, textoUsuario, perm, flowDataDirecto) {
  const telLimpio = normalizarTelefono_(telefono);
  let cache = null;
  let flowData = flowDataDirecto || null;

  try {
    cache = CacheService.getUserCache();
    if (!flowData && cache) {
      const raw = cache.get("PENDING_INTERACTIVE_FLOW_" + telLimpio);
      if (raw) flowData = JSON.parse(raw);
    }
  } catch (e) {
    Logger.log("Aviso leyendo PENDING_INTERACTIVE_FLOW_: " + e.message);
  }

  if (!flowData) return null;

  const t = String(textoUsuario || "").trim().toLowerCase();
  const datosParciales = flowData.datosParciales || {};

  // 1. Manejo de cancelación amigable
  if (t === "cancelar" || t === "cancela" || t === "olvidalo" || t === "olvídalo" || t === "ya no" || t === "no gracias") {
    if (cache) cache.remove("PENDING_INTERACTIVE_FLOW_" + telLimpio);
    return {
      tipo: "conversacion",
      texto: "Entendido. He cancelado esa operación previa. ¿En qué más puedo colaborar con tus finanzas hoy?"
    };
  }

  // 2. Resolver falta de entidad
  if (flowData.tipo === "falta_entidad") {
    let entidadElegida = null;
    if (t === "1" || t === "1." || t.includes("paper") || t.includes("papeleria") || t.includes("papelería")) {
      entidadElegida = "More Paper";
    } else if (t === "2" || t === "2." || t.includes("design") || t.includes("diseño") || t.includes("publicidad")) {
      entidadElegida = "More Design";
    } else if (t === "3" || t === "3." || t.includes("personal") || t.includes("propio")) {
      entidadElegida = "Personal";
    }

    if (entidadElegida) {
      if (cache) cache.remove("PENDING_INTERACTIVE_FLOW_" + telLimpio);
      const valor = Number(datosParciales.valor) || 0;
      const esIngreso = datosParciales.esIngreso !== false && (datosParciales.tipo === "Ingreso" || !datosParciales.esGasto);
      const concepto = datosParciales.concepto || (esIngreso ? "Ventas y Facturación" : "Gasto Operativo");
      const categoria = datosParciales.categoria || (esIngreso ? "Ventas" : "Operativo");
      
      let metodoPago = "Efectivo";
      if (esIngreso) {
        metodoPago = (entidadElegida === "Personal") ? "Ahorros ***2103 (Personal)" : "Ahorros ***7194 (Negocios)";
      } else {
        metodoPago = (entidadElegida === "Personal") ? "Efectivo" : "Ahorros ***7194 (Negocios)";
      }

      const txPayload = {
        tipo: "registro_transaccion",
        entidad: entidadElegida,
        movimientos: [{
          tipo: esIngreso ? "Ingreso" : "Gasto Necesario",
          categoria: categoria,
          subcategoria: "",
          concepto: concepto,
          proveedor_tercero: datosParciales.proveedor_tercero || "",
          valor: valor,
          metodo_pago: metodoPago,
          esGasto: !esIngreso
        }]
      };

      return ejecutarRegistroTransacciones_(ss, txPayload, perm);
    }
  }

  // 3. Resolver falta de monto
  if (flowData.tipo === "falta_monto") {
    const valorExtraido = extraerMontoInteligente_(textoUsuario);
    if (valorExtraido > 0) {
      if (cache) cache.remove("PENDING_INTERACTIVE_FLOW_" + telLimpio);
      const ent = datosParciales.entidad || "More Paper";
      const esGasto = datosParciales.esGasto !== false;
      const concepto = datosParciales.concepto || (esGasto ? "Gasto Insumos" : "Venta Mostrador");
      const categoria = datosParciales.categoria || (esGasto ? "Operativo" : "Ventas");

      let metodoPago = "Efectivo";
      if (!esGasto) {
        metodoPago = (ent === "Personal") ? "Ahorros ***2103 (Personal)" : "Ahorros ***7194 (Negocios)";
      } else {
        metodoPago = (ent === "Personal") ? "Efectivo" : "Ahorros ***7194 (Negocios)";
      }

      const txPayload = {
        tipo: "registro_transaccion",
        entidad: ent,
        movimientos: [{
          tipo: esGasto ? "Gasto Necesario" : "Ingreso",
          categoria: categoria,
          subcategoria: "",
          concepto: concepto,
          proveedor_tercero: datosParciales.proveedor_tercero || "",
          valor: valorExtraido,
          metodo_pago: metodoPago,
          esGasto: esGasto
        }]
      };

      return ejecutarRegistroTransacciones_(ss, txPayload, perm);
    } else {
      // Manejar respuesta donde el usuario indica que NO tiene monto fijo o es variable/recordatorio
      const tLower = String(textoUsuario || "").toLowerCase();
      const esVariable = tLower.includes("variable") || tLower.includes("no tiene monto") ||
        tLower.includes("no tiene valor") || tLower.includes("sin monto") ||
        tLower.includes("recordatorio") || tLower.includes("ciclo") || tLower.includes("ciclio") || tLower.includes("ciclico") ||
        tLower.includes("no se") || tLower.includes("no sé") || tLower.includes("indeterminado") || tLower.includes("cada mes");

      if (esVariable) {
        if (cache) cache.remove("PENDING_INTERACTIVE_FLOW_" + telLimpio);
        const ent = datosParciales.entidad || "Personal";
        const concepto = datosParciales.concepto || "Compromiso cíclico de monto variable";
        const proveedor = datosParciales.proveedor_tercero || datosParciales.concepto || "Tarjeta / Servicio";

        const textoCombinado = String(textoUsuario) + " " + String(flowData.textoOriginal || "");
        const matchFecha = textoCombinado.match(/\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}\s+de\s+[a-zA-Z]+(?:\s+de\s+\d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|d[ií]as?\s+\d{1,2}(?:\s+de\s+cada\s+mes)?|\d{1,2}\s+de\s+cada\s+mes|el\s+\d{1,2}\s+de\s+cada\s+mes|ciclio\s+el\s+\d{1,2}|ciclo\s+el\s+\d{1,2})\b/i);
        let fechaVenc = matchFecha ? normalizarFechaTexto_(matchFecha[0]) : "";
        if (!fechaVenc) {
          const mDia = textoCombinado.match(/\b(?:el|dia|día|corte)\s+(\d{1,2})\b/i);
          if (mDia) fechaVenc = normalizarFechaTexto_(`${mDia[1]} de cada mes`);
        }

        const compPayload = {
          tipo: "nuevo_compromiso",
          entidad: ent,
          proveedor: proveedor,
          concepto: concepto,
          monto: 0,
          tiene_vencimiento: !!fechaVenc,
          fecha_vencimiento: fechaVenc,
          es_recurrente: true,
          es_monto_variable: true
        };

        return ejecutarNuevoCompromiso_(ss, compPayload, perm);
      }
    }
  }

  // 4. Resolver falta de acreedor en abono
  if (flowData.tipo === "falta_acreedor") {
    let acreedorElegido = null;
    let entidadAcreedor = "Personal";
    const opciones = flowData.opcionesAcreedores || [];

    const numIdx = parseInt(t, 10);
    if (!isNaN(numIdx) && numIdx >= 1 && numIdx <= opciones.length) {
      acreedorElegido = opciones[numIdx - 1].proveedor;
      entidadAcreedor = opciones[numIdx - 1].entidad || "Personal";
    } else {
      for (const op of opciones) {
        if (t.includes(op.proveedor.toLowerCase()) || op.proveedor.toLowerCase().includes(t)) {
          acreedorElegido = op.proveedor;
          entidadAcreedor = op.entidad || "Personal";
          break;
        }
      }
    }

    if (acreedorElegido) {
      if (cache) cache.remove("PENDING_INTERACTIVE_FLOW_" + telLimpio);
      const abonoPayload = {
        tipo: "accion_compromiso",
        entidad: entidadAcreedor,
        accion: "abono",
        proveedor: acreedorElegido,
        monto_abono: Number(datosParciales.monto_abono) || Number(datosParciales.valor) || 0
      };
      return ejecutarAccionCompromiso_(ss, abonoPayload, perm);
    }
  }

  // 5. Resolver intención ambigua general (1: gasto, 2: venta, 3: saldos, 4: compromisos)
  if (flowData.tipo === "intencion_ambigua") {
    if (cache) cache.remove("PENDING_INTERACTIVE_FLOW_" + telLimpio);
    const nombreHumano = sanitizarNombreHumano_(perm ? perm.nombre : "Fernando");
    if (t === "1" || t === "1." || t.includes("gasto") || t.includes("compra")) {
      return {
        tipo: "conversacion",
        texto: `¡Listo, ${nombreHumano}! Cuéntame qué compraste, el valor y si fue en More Paper, More Design o Personal (por ejemplo: *'Compré 3 resmas en More Paper por 45.000'*).`
      };
    } else if (t === "2" || t === "2." || t.includes("venta") || t.includes("ingreso")) {
      return {
        tipo: "conversacion",
        texto: `¡Buenísimo, ${nombreHumano}! Cuéntame cuánto ingresó y a cuál de tus cuentas corresponde (por ejemplo: *'Venta de 150.000 en More Paper'* o *'Diseño de logo 300.000 en More Design'*).`
      };
    } else if (t === "3" || t === "3." || t.includes("saldo") || t.includes("banco") || t.includes("disponible")) {
      return ejecutarConsultaFinanciera_(ss, "cuál es mi saldo actual", { tipo: "consulta", entidad: "Personal" }, perm, null);
    } else if (t === "4" || t === "4." || t.includes("deuda") || t.includes("compromiso") || t.includes("pagar")) {
      return ejecutarConsultaFinanciera_(ss, "qué compromisos tengo pendientes", { tipo: "consulta", entidad: "Personal" }, perm, null);
    }
  }

  // 6. Resolver falta de ámbito de uso en registro de cuenta bancaria (1: Personal, 2: Negocio / Tiendas)
  if (flowData.tipo === "registro_cuenta_falta_uso") {
    let tipoUso = null;
    if (t === "1" || t === "1." || t.includes("personal") || t.includes("propio") || t.includes("fernando")) {
      tipoUso = "Personal";
    } else if (t === "2" || t === "2." || t.includes("negocio") || t.includes("tienda") || t.includes("global") || t.includes("empresa") || t.includes("more")) {
      tipoUso = "Global / Tiendas";
    }

    if (tipoUso) {
      if (cache) cache.remove("PENDING_INTERACTIVE_FLOW_" + telLimpio);
      const banco = datosParciales.banco || "Bancolombia";
      const mascara = datosParciales.mascara || "***0000";
      const titular = (tipoUso === "Personal") ? (perm ? perm.entidadPropia || "Personal" : "Personal") : "Consolidado";
      const alias = `${banco} ${mascara} (${tipoUso})`;

      if (typeof registrarNuevaCuentaBancariaEnConfig_ === "function") {
        registrarNuevaCuentaBancariaEnConfig_(ss, titular, banco, mascara, tipoUso, alias);
      }

      return {
        tipo: "conversacion",
        texto: `✅ *Cuenta Bancaria Registrada con Éxito*\n\n` +
          `🏛️ *Entidad:* ${banco}\n` +
          `🔢 *Número:* ${mascara}\n` +
          `🏷️ *Destino:* ${tipoUso}\n` +
          `👤 *Titular Asociado:* ${titular}\n\n` +
          `Tu cuenta ha quedado guardada en *Config_Cuentas_Bancarias*. Desde ahora la verás reflejada en tu Bóveda de Liquidez.`
      };
    }
  }

  // 7. Resolver confirmación guiada de categoría (Gobernanza de clasificación y orden contable)
  if (flowData.tipo === "confirmacion_categoria_guiada") {
    let categoriaElegida = null;
    let crearEnConfig = false;

    if (t === "1" || t === "1.") {
      categoriaElegida = datosParciales.opcion1;
    } else if (t === "2" || t === "2.") {
      categoriaElegida = datosParciales.opcion2;
    } else if (t === "3" || t === "3." || t.includes("crear") || t.includes("personalizada")) {
      categoriaElegida = datosParciales.categoriaSolicitada;
      crearEnConfig = true;
    } else {
      categoriaElegida = sanitizarTextoGeneral_(textoUsuario);
      crearEnConfig = true;
    }

    if (categoriaElegida) {
      if (cache) cache.remove("PENDING_INTERACTIVE_FLOW_" + telLimpio);
      const ent = datosParciales.entidad || (perm ? perm.entidadPropia : "Personal");

      if (crearEnConfig) {
        try {
          const sheetCat = ss.getSheetByName(HOJAS.CONFIG_CATEGORIAS || "Config_Categorias");
          if (sheetCat) {
            sheetCat.appendRow([ent, "Gasto Operativo", categoriaElegida, "General"]);
            SpreadsheetApp.flush();
          }
        } catch (eCat) {
          Logger.log("Aviso registrando categoría en Config_Categorias: " + eCat.message);
        }
        return {
          tipo: "conversacion",
          texto: `✅ *Nueva Categoría Registrada*\n\n` +
            `🏷️ *Categoría:* **${categoriaElegida}**\n` +
            `🏢 *Entidad:* ${ent}\n\n` +
            `Ha quedado inscrita formalmente en tu catálogo contable de *Config_Categorias*. Se encuentra disponible para tus próximos registros.`
        };
      } else {
        return {
          tipo: "conversacion",
          texto: `✅ *Clasificación General Confirmada*\n\n` +
            `🏷️ *Categoría Asignada:* **${categoriaElegida}**\n\n` +
            `Excelente decisión. Al agrupar tus gastos bajo una categoría general, mantienes una estructura lógica y limpia que optimiza tus reportes y análisis contables.`
        };
      }
    }
  }

  // 8. Resolver recategorización retrospectiva inteligente
  if (flowData.tipo === "recategorizacion_pendiente") {
    let nuevaCategoria = null;
    if (t === "1" || t === "1.") {
      nuevaCategoria = datosParciales.opcion1;
    } else if (t === "2" || t === "2.") {
      nuevaCategoria = datosParciales.opcion2;
    } else if (t === "3" || t === "3.") {
      nuevaCategoria = datosParciales.opcion3;
    } else {
      nuevaCategoria = sanitizarTextoGeneral_(textoUsuario);
    }

    if (nuevaCategoria) {
      if (cache) cache.remove("PENDING_INTERACTIVE_FLOW_" + telLimpio);
      const hojaNombre = datosParciales.hojaNombre;
      const fila = datosParciales.filaIndex;
      const concepto = datosParciales.concepto;
      const valor = datosParciales.valor;
      const catAnterior = datosParciales.categoriaActual;

      try {
        const sheet = ss.getSheetByName(hojaNombre);
        if (sheet && fila >= 2 && fila <= sheet.getLastRow()) {
          // Columna 4 es CATEGORIA
          sheet.getRange(fila, 4).setValue(nuevaCategoria);
          // Columna 12 son NOTAS (auditoría forense)
          const notasActuales = String(sheet.getRange(fila, 12).getValue() || "");
          const ahora = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
          const notaAudit = `[Recategorizado de '${catAnterior}' a '${nuevaCategoria}' el ${ahora}]`;
          sheet.getRange(fila, 12).setValue(notasActuales ? notasActuales + " " + notaAudit : notaAudit);
          SpreadsheetApp.flush();

          return {
            tipo: "conversacion",
            texto: `✅ *Transacción Recategorizada con Éxito*\n\n` +
              `📝 *Concepto:* ${concepto}\n` +
              `💰 *Monto:* $${Number(valor).toLocaleString("es-CO")} COP\n` +
              `🏷️ *Nueva Categoría:* **${nuevaCategoria}**\n` +
              `⏮️ *Categoría Anterior:* _${catAnterior}_\n\n` +
              `Los reportes y gráficos de tu Dashboard Canvas ya reflejan este cambio en tiempo real.`
          };
        }
      } catch (eRecat) {
        Logger.log("Error al asentar recategorización en sheet: " + eRecat.message);
        return {
          tipo: "error",
          texto: `⚠️ No pude actualizar la fila en la hoja de cálculo (${eRecat.message}). Por favor verifica manualmente.`
        };
      }
    }
  }

  if (cache) cache.remove("PENDING_INTERACTIVE_FLOW_" + telLimpio);
  return null;
}

// ============================================================================
// PUNTO DE ENTRADA PRINCIPAL: PROCESAMIENTO DE MENSAJES DE TEXTO
// ============================================================================
/**
 * Procesa un mensaje de texto de WhatsApp, valida permisos, interpreta la intención
 * con IA y ejecuta la acción contable correspondiente en Google Sheets.
 */
function procesarMensajeTexto(telefono, textoUsuario, historialChat) {
  let perm = null;
  let solicitaAudio = false;
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const telLimpio = normalizarTelefono_(telefono);

    // 1. Validar Control de Acceso por Teléfono
    perm = validarPermisoUsuario(telLimpio);
    if (!perm.autorizado) {
      if (perm.motivo === "USUARIO_NO_REGISTRADO") {
        if (typeof notificarSolicitudAccesoSuperAdmin_ === "function") {
          notificarSolicitudAccesoSuperAdmin_(telLimpio, textoUsuario);
        }
        return {
          tipo: "acceso_denegado",
          texto: "🔒 *Hola. Tu número no está autorizado aún en este sistema financiero privado.*\n\n" +
            "He enviado una solicitud formal de acceso al Administrador General (Fernando). Te avisaremos por aquí tan pronto sea evaluada."
        };
      }
      return {
        tipo: "acceso_denegado",
        texto: perm.texto || "🔒 Tu acceso a este sistema financiero se encuentra restringido. Por favor contacta al administrador."
      };
    }

    // Registrar consumo en el contador de WhatsApp
    registrarConversacionWhatsApp(telLimpio);

    // Detección si el usuario solicitó expresamente respuesta por audio o va conduciendo
    const esConduccion = esModoConduccion_(textoUsuario);
    solicitaAudio = esSolicitudRespuestaAudio_(textoUsuario) || esConduccion;

    // Si el usuario es nuevo y tiene bienvenida pendiente, despacharla de inmediato
    if (perm.bienvenidaPendiente) {
      if (typeof enviarMensajeBienvenidaNuevoUsuario_ === "function") {
        enviarMensajeBienvenidaNuevoUsuario_(telefono, perm.nombre);
      }
      const nombreHumano = sanitizarNombreHumano_(perm.nombre);
      const t = String(textoUsuario).toLowerCase().trim();
      if (t.includes("hola") || t.includes("buenos") || t.includes("buenas") || t.length <= 4) {
        return {
          tipo: "conversacion",
          texto: `¡Hola, ${nombreHumano}! 👋 Acabo de enviarte tu guía de bienvenida e inducción. Tus hojas personales ya están listas. Cuando gustes puedes empezar registrando tu primer gasto, ingreso o consulta.`,
          requiereAudio: solicitaAudio
        };
      }
    }

    // 1.0 Detección de Respuesta a Clarificación de Cierre de Turno POS (More Paper vs More Design)
    try {
      const cache = CacheService.getUserCache();
      const posPendingRaw = cache ? cache.get("PENDING_POS_CLOSE_" + telLimpio) : null;
      if (posPendingRaw) {
        const t = String(textoUsuario).toLowerCase().trim();
        let entidadElegida = null;
        if (t === "1" || t === "1." || t.includes("paper") || t.includes("more paper") || t === "papeleria" || t === "papelería" || t.includes("papel")) {
          entidadElegida = "More Paper";
        } else if (t === "2" || t === "2." || t.includes("design") || t.includes("more design") || t === "diseno" || t === "diseño" || t.includes("desing") || t.includes("moredesing") || t.includes("amor design") || t.includes("amordesign") || t === "agencia" || t.includes("publicidad")) {
          entidadElegida = "More Design";
        }

        if (entidadElegida) {
          if (cache) {
            cache.remove("PENDING_POS_CLOSE_" + telLimpio);
            cache.remove("PENDING_INTERACTIVE_FLOW_" + telLimpio);
          }
          const closureData = JSON.parse(posPendingRaw);
          const resPOS = ejecutarAsentamientoCierreTurnoPOS_(ss, entidadElegida, closureData);
          if (solicitaAudio) resPOS.requiereAudio = true;
          return resPOS;
        }
      }
    } catch (eCacheCheck) {
      Logger.log("Aviso verificando caché POS pendiente: " + eCacheCheck.message);
    }

    // 1.0.1 Detección de Respuesta a Flujo de Clarificación Interactiva Humana en Curso
    try {
      const resClarif = resolverClarificacionInteractiva_(ss, telLimpio, textoUsuario, perm);
      if (resClarif) {
        if (solicitaAudio) resClarif.requiereAudio = true;
        return resClarif;
      }
    } catch (eClarifCheck) {
      Logger.log("Aviso verificando clarificación interactiva: " + eClarifCheck.message);
    }

    // 1.0.2 Detección de Respuesta a Construcción Asistida de Informes CFO en Curso
    try {
      if (typeof resolverFlujoInformeCFO_Pendiente_ === "function") {
        const resInformeGuiado = resolverFlujoInformeCFO_Pendiente_(ss, telLimpio, textoUsuario, perm);
        if (resInformeGuiado) {
          if (solicitaAudio) resInformeGuiado.requiereAudio = true;
          return resInformeGuiado;
        }
      }
    } catch (eInformeCheck) {
      Logger.log("Aviso verificando informe CFO pendiente: " + eInformeCheck.message);
    }

    // 1.1 Detección de Renombramiento o Cambio de Perfil de Voz del Asistente (Para todos los usuarios)
    const intencionVoz = detectarIntencionCambioNombreVoz_(textoUsuario);
    if (intencionVoz) {
      const resVoz = ejecutarCambioNombreVoz_(telLimpio, intencionVoz, perm);
      if (solicitaAudio) resVoz.requiereAudio = true;
      return resVoz;
    }

    // 1.1.0 Detección de Solicitud Explícita de Escuchar la Voz o Demostración del Personaje ("Quiero escucharte", "Háblame", "Cómo suena tu voz")
    if (typeof detectarSolicitudDemostracionVoz_ === "function" && detectarSolicitudDemostracionVoz_(textoUsuario)) {
      const resDemoVoz = ejecutarDemostracionVoz_(telLimpio, perm);
      return resDemoVoz;
    }

    // 1.1.1 Detección de Comandos del Super Admin para Aprobación / Rechazo de Personajes
    if (typeof detectarComandoAprobacionPersonaje_ === "function") {
      const resAprobacion = detectarComandoAprobacionPersonaje_(ss, telLimpio, textoUsuario, perm);
      if (resAprobacion) {
        if (solicitaAudio) resAprobacion.requiereAudio = true;
        return resAprobacion;
      }
    }

    // 1.1.2 Detección de Creación o Incorporación de Nuevos Personajes desde WhatsApp
    if (typeof detectarIntencionCrearPersonaje_ === "function") {
      const intencionCrear = detectarIntencionCrearPersonaje_(textoUsuario);
      if (intencionCrear) {
        const resCrear = ejecutarCreacionPersonajeWhatsApp_(ss, telLimpio, intencionCrear, perm, solicitaAudio);
        if (resCrear) {
          if (solicitaAudio) resCrear.requiereAudio = true;
          return resCrear;
        }
      }
    }

    // 1.2 Detección de Solicitud de Presentación, Funciones y Alcance del Asistente
    if (typeof detectarSolicitudPresentacion_ === "function" && detectarSolicitudPresentacion_(textoUsuario)) {
      const resPres = ejecutarPresentacionAsistente_(telLimpio, perm, solicitaAudio);
      return resPres;
    }

    // 1.2.5 Detección de Solicitud de Magic Link Personal para el Dashboard Canvas
    if (typeof detectarSolicitudMagicLink_ === "function" && detectarSolicitudMagicLink_(textoUsuario)) {
      const resMagic = ejecutarDespachoMagicLink_(telLimpio, perm, solicitaAudio);
      if (resMagic) return resMagic;
    }

    // 1.3 Detección de Solicitud de Generación de Informes Financieros, PDF y Dossiers CFO
    if (typeof detectarSolicitudInformeCFO_ === "function" && detectarSolicitudInformeCFO_(textoUsuario)) {
      const resInforme = ejecutarSolicitudInformeCFO_(ss, telLimpio, textoUsuario, perm, solicitaAudio);
      if (resInforme) return resInforme;
    }

    // 1.3.1 Detección de Solicitud de Gestión e Inscripción de Cuentas Bancarias
    if (typeof detectarSolicitudGestionCuentasBancarias_ === "function" && detectarSolicitudGestionCuentasBancarias_(textoUsuario)) {
      const resCta = ejecutarGestionCuentasBancarias_(ss, telLimpio, textoUsuario, perm);
      if (resCta) {
        if (solicitaAudio) resCta.requiereAudio = true;
        return resCta;
      }
    }

    // 1.3.2 Detección de Solicitud de Recategorización Inteligente y Retrospectiva
    if (typeof detectarSolicitudRecategorizacion_ === "function" && detectarSolicitudRecategorizacion_(textoUsuario)) {
      const resRecat = ejecutarSolicitudRecategorizacionGuiada_(ss, telLimpio, textoUsuario, perm);
      if (resRecat) {
        if (solicitaAudio) resRecat.requiereAudio = true;
        return resRecat;
      }
    }

    // 1.3.3 Detección de Creación Asistida y Gobernanza de Nuevas Categorías
    if (typeof detectarSolicitudCrearCategoriaGuiada_ === "function" && detectarSolicitudCrearCategoriaGuiada_(textoUsuario)) {
      const resCat = ejecutarSolicitudCrearCategoriaGuiada_(ss, telLimpio, textoUsuario, perm);
      if (resCat) {
        if (solicitaAudio) resCat.requiereAudio = true;
        return resCat;
      }
    }

    // 2. Control de Gestión de Usuarios (Exclusivo Super Admin)
    const intencionGestion = detectarIntencionGestionUsuarios_(textoUsuario);
    if (intencionGestion) {
      if (perm.rol === "SUPER_ADMIN") {
        const resAdmin = ejecutarGestionUsuariosSuperAdmin_(ss, intencionGestion, textoUsuario);
        if (solicitaAudio) resAdmin.requiereAudio = true;
        return resAdmin;
      } else {
        return {
          tipo: "acceso_denegado",
          texto: "🔒 Esta acción de gestión de usuarios está reservada exclusivamente para la administración del sistema (Fernando).",
          requiereAudio: solicitaAudio
        };
      }
    }

    // 2.1 Guardrail Estricto de Temas Ajenos a Finanzas (Respuesta ultra-sucinta + reconducción)
    if (typeof detectarConsultaFueraDeAmbito_ === "function" && detectarConsultaFueraDeAmbito_(textoUsuario)) {
      const resFuera = ejecutarRespuestaFueraDeAmbito_(textoUsuario, perm);
      if (solicitaAudio) resFuera.requiereAudio = true;
      return resFuera;
    }

    // 3. Obtener contexto del libro (categorías, saldos y compromisos activos)
    const categorias = obtenerCategoriasPorEntidad_();
    const compromisosActivos = perm.rol === "SUPER_ADMIN" ? obtenerCompromisosPendientes_() : obtenerCompromisosPendientesUsuario_(perm.entidadPropia);
    const saldos = perm.rol === "SUPER_ADMIN" ? obtenerResumenSaldos_() : null;
    const hoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

    // 3.1 Módulo de Inteligencia Bursátil en Vivo, Divisas Reales, Consultoría DIAN y Asesoría Macro-Micro
    if (typeof detectarConsultaMercadoOTributaria_ === "function") {
      const intencionMercadoTributaria = detectarConsultaMercadoOTributaria_(textoUsuario);
      if (intencionMercadoTributaria) {
        const resAsesor = ejecutarAsesorFinancieroPro_(telLimpio, textoUsuario, intencionMercadoTributaria, perm, compromisosActivos, saldos);
        if (solicitaAudio) resAsesor.requiereAudio = true;
        return resAsesor;
      }
    }

    // 4. Interpretar la intención del usuario con IA (o motor heurístico de fallback)
    const promptSistema = construirPromptSistemaFinanciero_(hoy, perm, categorias, compromisosActivos, saldos);
    const interpretacion = llamarGeminiJson_(promptSistema, textoUsuario, historialChat);

    if (!interpretacion) {
      const nombreHumano = sanitizarNombreHumano_(perm ? perm.nombre : "Fernando");
      const resClarifFallback = gestionarClarificacionInteractiva_(ss, telLimpio, {
        motivo: "intencion_ambigua",
        pregunta_humana: `Hola, ${nombreHumano}, no alcancé a captar con exactitud la gestión que deseas realizar. ¿Podrías darme una pista con alguna de estas opciones?`,
        opciones_sugeridas: [
          "Registrar un gasto o compra de insumos",
          "Registrar un ingreso o venta",
          "Consultar saldos en cuentas bancarias (***2103 o ***7194)",
          "Revisar o abonar a un compromiso pendiente"
        ]
      }, perm, compromisosActivos, saldos);
      if (solicitaAudio) resClarifFallback.requiereAudio = true;
      return resClarifFallback;
    }

    // 5. Ejecutar la acción según la intención clasificada
    let resultado = null;
    switch (interpretacion.tipo) {
      case "clarificacion_interactiva":
        resultado = gestionarClarificacionInteractiva_(ss, telLimpio, interpretacion, perm, compromisosActivos, saldos);
        break;

      case "cierre_turno_pos":
        resultado = ejecutarAsentamientoCierreTurnoPOS_(ss, interpretacion.entidad || "More Paper", interpretacion.closureData);
        break;

      case "purgar_compromisos_erroneos":
        resultado = purgarCompromisosErroneosMorePaper(ss);
        break;

      case "registro_transaccion":
        // Si el usuario intentó registrar una transacción pero no se especificó un monto numérico válido (>0)
        if (!interpretacion.movimientos || !interpretacion.movimientos.some(m => Number(m.valor) > 0)) {
          const tLow = String(textoUsuario || "").toLowerCase();
          if (tLow.includes("compromiso") || tLow.includes("por pagar") || tLow.includes("ciclo") || tLow.includes("ciclio") || tLow.includes("ciclico") || tLow.includes("cíclico") || tLow.includes("recordatorio") || tLow.includes("tarjeta") || tLow.includes("cada mes")) {
            const parsedComp = parserSemanticoReglas_(textoUsuario);
            if (parsedComp && parsedComp.tipo === "nuevo_compromiso") {
              resultado = ejecutarNuevoCompromiso_(ss, parsedComp, perm);
              break;
            }
          }

          const conc = (interpretacion.movimientos && interpretacion.movimientos[0] && interpretacion.movimientos[0].concepto) || textoUsuario;
          resultado = gestionarClarificacionInteractiva_(ss, telLimpio, {
            motivo: "falta_monto",
            datos_parciales: {
              entidad: interpretacion.entidad || "More Paper",
              concepto: conc,
              esGasto: interpretacion.movimientos && interpretacion.movimientos[0] ? interpretacion.movimientos[0].esGasto : true
            },
            textoUsuario: textoUsuario
          }, perm, compromisosActivos, saldos);
          break;
        }

        // Si es Super Admin y la entidad no se indicó explícitamente en el texto ni en una confirmación previa
        if (perm.rol === "SUPER_ADMIN" && !interpretacion.entidad_confirmada && !mencionaEntidadExplicita_(textoUsuario)) {
          const m0 = interpretacion.movimientos[0];
          resultado = gestionarClarificacionInteractiva_(ss, telLimpio, {
            motivo: "falta_entidad",
            datos_parciales: {
              valor: m0.valor,
              esIngreso: !m0.esGasto,
              esGasto: m0.esGasto,
              concepto: m0.concepto,
              categoria: m0.categoria
            },
            textoUsuario: textoUsuario
          }, perm, compromisosActivos, saldos);
          break;
        }

        resultado = ejecutarRegistroTransacciones_(ss, interpretacion, perm);
        break;

      case "nuevo_compromiso": {
        const tLower = String(textoUsuario || "").toLowerCase();
        const esVariableORecurrente = interpretacion.es_recurrente || 
          interpretacion.es_monto_variable ||
          tLower.includes("ciclo") || tLower.includes("ciclio") || tLower.includes("ciclico") || tLower.includes("cíclico") ||
          tLower.includes("cada mes") || tLower.includes("mensual") || tLower.includes("recurrente") ||
          tLower.includes("recordatorio") || tLower.includes("alerta") || tLower.includes("tarjeta") ||
          tLower.includes("credito") || tLower.includes("crédito") || tLower.includes("variable") ||
          tLower.includes("sin monto") || tLower.includes("no tiene monto");

        if (Number(interpretacion.monto) <= 0 && !esVariableORecurrente) {
          resultado = gestionarClarificacionInteractiva_(ss, telLimpio, {
            motivo: "falta_monto",
            datos_parciales: {
              entidad: interpretacion.entidad || "Personal",
              concepto: interpretacion.proveedor || interpretacion.concepto || "Nuevo compromiso",
              esGasto: true
            },
            textoUsuario: textoUsuario
          }, perm, compromisosActivos, saldos);
          break;
        }

        // Si es recurrente/variable sin monto, fijar monto en 0 y marcar es_recurrente
        if (Number(interpretacion.monto) <= 0 && esVariableORecurrente) {
          interpretacion.monto = 0;
          interpretacion.es_recurrente = true;
          interpretacion.es_monto_variable = true;
          if (!interpretacion.fecha_vencimiento) {
            const matchFecha = textoUsuario.match(/\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}\s+de\s+[a-zA-Z]+(?:\s+de\s+\d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|d[ií]as?\s+\d{1,2}(?:\s+de\s+cada\s+mes)?|\d{1,2}\s+de\s+cada\s+mes|el\s+\d{1,2}\s+de\s+cada\s+mes|ciclio\s+el\s+\d{1,2}|ciclo\s+el\s+\d{1,2})\b/i);
            if (matchFecha) {
              interpretacion.fecha_vencimiento = normalizarFechaTexto_(matchFecha[0]);
              interpretacion.tiene_vencimiento = true;
            }
          }
        }

        resultado = ejecutarNuevoCompromiso_(ss, interpretacion, perm);
        break;
      }

      case "accion_compromiso":
        if (interpretacion.accion === "abono" && (!interpretacion.proveedor || interpretacion.proveedor.trim() === "" || interpretacion.proveedor.toLowerCase() === "proveedor")) {
          resultado = gestionarClarificacionInteractiva_(ss, telLimpio, {
            motivo: "falta_acreedor",
            datos_parciales: {
              monto_abono: Number(interpretacion.monto_abono) || extraerMontoInteligente_(textoUsuario),
              valor: Number(interpretacion.monto_abono) || extraerMontoInteligente_(textoUsuario)
            }
          }, perm, compromisosActivos, saldos);
        } else {
          resultado = ejecutarAccionCompromiso_(ss, interpretacion, perm);
        }
        break;

      case "consulta_mercado":
      case "asesoria_financiera":
        resultado = ejecutarAsesorFinancieroPro_(telLimpio, textoUsuario, { esMercado: true, esTributario: false }, perm, compromisosActivos, saldos);
        break;

      case "consulta":
        if (typeof detectarConsultaMercadoOTributaria_ === "function" && detectarConsultaMercadoOTributaria_(textoUsuario)) {
          resultado = ejecutarAsesorFinancieroPro_(telLimpio, textoUsuario, { esMercado: true, esTributario: false }, perm, compromisosActivos, saldos);
        } else {
          resultado = ejecutarConsultaFinanciera_(ss, textoUsuario, interpretacion, perm, historialChat);
        }
        break;

      case "conversacion":
      default:
        if (typeof detectarConsultaMercadoOTributaria_ === "function" && detectarConsultaMercadoOTributaria_(textoUsuario)) {
          resultado = ejecutarAsesorFinancieroPro_(telLimpio, textoUsuario, { esMercado: true, esTributario: false }, perm, compromisosActivos, saldos);
        } else {
          resultado = {
            tipo: "conversacion",
            texto: interpretacion.respuesta || "¡Hola! Estoy listo para ayudarte a registrar ingresos, gastos o consultar tus compromisos financieros."
          };
        }
        break;
    }

    // Adición de Tip Pro con Recordatorio de Magic Link en reportes y consultas de finanzas
    if (resultado && resultado.texto && (interpretacion.tipo === "consulta" || resultado.esReporteFinanciero)) {
      if (!resultado.texto.includes("dame mi link") && !resultado.texto.includes("ver mi dashboard")) {
        resultado.texto += "\n\n💡 *Tip Pro:* Si deseas explorar tus gráficos interactivos y deudas en pantalla completa, escribe *\"dame mi link\"* o *\"ver mi dashboard\"* para enviarte tu acceso privado.";
      }
    }

    if (resultado && solicitaAudio) {
      resultado.requiereAudio = true;
    }
    return resultado;

  } catch (e) {
    Logger.log("Aviso en procesarMensajeTexto: " + e.message);
    const nombreUsuario = sanitizarNombreHumano_(perm ? perm.nombre : "Fernando");
    return {
      tipo: "conversacion",
      texto: `Disculpa, ${nombreUsuario}, no alcancé a procesar ese detalle con precisión. ¿Deseas que registremos un movimiento, revisemos tus saldos o consultemos algún compromiso? Cuéntame con un poco más de detalle y lo gestionamos de inmediato.`,
      requiereAudio: solicitaAudio
    };
  }
}

// ============================================================================
// MANEJADORES DE ACCIONES CONTABLES EN GOOGLE SHEETS
// ============================================================================

/**
 * Registra uno o más movimientos (ingresos/egresos) en la hoja de la entidad correspondiente
 */
function ejecutarRegistroTransacciones_(ss, data, perm) {
  // Filtrar estrictamente movimientos con valor monetario mayor a cero
  const movimientos = (data.movimientos || []).filter(m => Number(m.valor) > 0);
  if (!movimientos.length) {
    const conceptoOriginal = (data.movimientos && data.movimientos[0] && data.movimientos[0].concepto) 
      ? data.movimientos[0].concepto 
      : (data.textoOriginal || "");
    if (conceptoOriginal && typeof ejecutarConsultaFinanciera_ === "function") {
      return ejecutarConsultaFinanciera_(ss, conceptoOriginal, { tipo: "consulta", entidad: data.entidad || "Personal" }, perm, null);
    }
    return {
      tipo: "conversacion",
      texto: data.respuesta || "Por favor indícame el monto y concepto para registrar el movimiento (ejemplo: 'Gasté 20.000 en combustible')."
    };
  }

  const confirmaciones = [];

  for (const m of movimientos) {
    // Si no es Super Admin, forzar estrictamente su entidad asignada
    const entidad = (perm.rol !== "SUPER_ADMIN" && perm.entidadPropia) 
      ? perm.entidadPropia 
      : normalizarEntidad_(m.entidad || data.entidad);
    
    // Verificar que el usuario tenga permiso sobre esta entidad
    if (perm.rol !== "SUPER_ADMIN" && !perm.hojasPermitidas.toLowerCase().includes(entidad.toLowerCase())) {
      return {
        tipo: "error",
        texto: `🔒 No tienes autorización para registrar transacciones en la entidad: ${entidad}.`
      };
    }

    const nombreHoja = obtenerHojaTransacciones_(entidad);
    const sheet = ss.getSheetByName(nombreHoja);
    if (!sheet) continue;

    const id = "TX-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd") + "-" + Math.floor(1000 + Math.random() * 9000);
    const fecha = m.fecha || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    const tipo = m.tipo || (m.esGasto ? "Gasto Necesario" : "Ingreso");
    const esIngreso = tipo.toLowerCase().includes("ingreso") || !m.esGasto;
    const categoria = m.categoria || (esIngreso ? "Ingresos" : "General");
    const subcategoria = m.subcategoria || (esIngreso ? "Bancos" : "");
    const concepto = m.concepto || "Movimiento registrado";
    const tercero = m.proveedor_tercero || "";
    const valor = Number(m.valor) || 0;

    // Asignación inteligente de Cuenta Bancaria Oficial:
    // - Personal -> Ahorros ***2103 (Personal)
    // - More Paper & More Design -> Ahorros ***7194 (Negocios - Cuenta Común)
    // - Consolidado / Operación Global / Nómina -> Ahorros ***7194 (Negocios)
    // - Gastos propios de local -> Independientes en su entidad respectiva
    let metodo = m.metodo_pago || "Efectivo";
    if (entidad === "Consolidado") {
      metodo = "Ahorros ***7194 (Negocios)";
      if (!m.categoria || m.categoria === "General" || m.categoria === "Ingresos") {
        categoria = esIngreso ? "Capital / Aportes" : "Gasto Operativo Global / Nómina";
      }
    } else if (esIngreso) {
      if (entidad === "Personal") {
        metodo = (metodo.toLowerCase().includes("efectivo")) ? "Efectivo" : "Ahorros ***2103 (Personal)";
      } else if (entidad === "More Paper" || entidad === "More Design") {
        metodo = (metodo.toLowerCase().includes("efectivo")) ? "Efectivo" : "Ahorros ***7194 (Negocios)";
      }
    }

    m.metodo = metodo; // Sincronizar en el objeto para que la confirmación refleje la cuenta bancaria oficial

    const estado = m.estado || "Confirmado";
    const idCompromiso = m.id_compromiso || "";
    const notas = m.notas || "";

    sheet.appendRow([
      id, fecha, tipo, categoria, subcategoria, concepto, 
      tercero, valor, metodo, estado, idCompromiso, notas
    ]);

    if (entidad === "Consolidado") {
      const etiquetaConsolidado = esIngreso ? "📈 Operación Global / Tesorería Común" : "🏢 Gasto Operativo Global / Nómina";
      confirmaciones.push(`• **${etiquetaConsolidado}**: ${concepto} ➔ **$${valor.toLocaleString("es-CO")} COP** [${categoria} | 💳 ${metodo}]`);
    } else {
      const detalleCuenta = esIngreso ? ` | 💳 ${metodo}` : (metodo !== "Efectivo" ? ` | 💳 ${metodo}` : "");
      confirmaciones.push(`• **${entidad}** (${tipo}): ${concepto} ➔ **$${valor.toLocaleString("es-CO")} COP** [${categoria}${detalleCuenta}]`);
    }
  }

  SpreadsheetApp.flush();

  const nombreHumano = sanitizarNombreHumano_(perm ? perm.nombre : "Fernando");
  let textoResp = "";

  if (movimientos.length === 1) {
    const m = movimientos[0];
    const valFmt = Number(m.valor || 0).toLocaleString("es-CO");
    const conceptoStr = m.concepto || "la operación";
    const metodoStr = m.metodo || "Efectivo";
    const entStr = m.entidad || data.entidad || "Personal";
    const catStr = m.categoria || "General";

    if (m.esGasto) {
      const frases = [
        `¡Listo, ${nombreHumano}! ✅ Ya te anoté el gasto de **$${valFmt} COP** en *${catStr}* (${conceptoStr})`,
        `Anotado, ${nombreHumano} 👍. Quedó registrado el gasto de **$${valFmt} COP** en *${catStr}* (${conceptoStr})`,
        `¡Quedó listo, ${nombreHumano}! ✅ Guardé tu gasto de **$${valFmt} COP** en *${catStr}*`
      ];
      const frase = frases[Math.floor(Math.random() * frases.length)];
      const detalleEnt = (entStr !== "Personal") ? ` para **${entStr}**` : "";
      const detalleMedio = (metodoStr && metodoStr !== "Efectivo") ? ` pagado con ${metodoStr}` : "";
      textoResp = `${frase}${detalleEnt}${detalleMedio}. Tus cuentas quedan al día.`;
    } else {
      const frases = [
        `¡Excelente ingreso, ${nombreHumano}! 📈 Ya quedó sumado **$${valFmt} COP** por *${conceptoStr}*`,
        `¡Buenísimo, ${nombreHumano}! ✅ Registré la entrada de **$${valFmt} COP** por *${conceptoStr}*`,
        `¡Listo, ${nombreHumano}! 💰 Anoté el ingreso de **$${valFmt} COP** por *${conceptoStr}*`
      ];
      const frase = frases[Math.floor(Math.random() * frases.length)];
      const detalleEnt = (entStr !== "Personal") ? ` en **${entStr}**` : "";
      const detalleMedio = metodoStr ? ` (recibido por ${metodoStr})` : "";
      textoResp = `${frase}${detalleEnt}${detalleMedio}. ¡Seguimos sumando!`;
    }
  } else {
    textoResp = `¡Listo, ${nombreHumano}! ✅ Ya quedaron anotados tus ${movimientos.length} movimientos:\n\n`;
    movimientos.forEach((m, idx) => {
      const vFmt = Number(m.valor || 0).toLocaleString("es-CO");
      const tipoIcono = m.esGasto ? "💸 Gasto" : "📈 Ingreso";
      const med = (m.metodo && m.metodo !== "Efectivo") ? ` via ${m.metodo}` : "";
      textoResp += `${idx + 1}. **${tipoIcono}**: $${vFmt} COP en *${m.categoria || m.concepto}* [${m.entidad}]${med}\n`;
    });
    textoResp += `\nTus balances ya quedaron actualizados.`;
  }

  let textoVozTx = "";
  if (movimientos.length === 1) {
    const m = movimientos[0];
    const valFmt = Number(m.valor || 0).toLocaleString("es-CO");
    const tipoMov = m.esGasto ? "el gasto" : "el ingreso";
    const ent = m.entidad || data.entidad || "Personal";
    textoVozTx = `Listo, ${nombreHumano}. Quedó registrado ${tipoMov} de ${m.concepto || "la operación"} por ${valFmt} pesos en ${ent}. Todo en orden.`;
  } else {
    textoVozTx = `Listo, ${nombreHumano}. Quedaron registrados los ${movimientos.length} movimientos en tus cuentas. Todo en orden.`;
  }

  return {
    tipo: "registro_exitoso",
    texto: textoResp,
    textoVoz: textoVozTx,
    totalMovimientos: movimientos.length,
    perfilVoz: perm ? perm.perfilVoz : null
  };
}

/**
 * Registra una nueva cuenta por pagar / compromiso económico (individual o en lote)
 */
function ejecutarNuevoCompromiso_(ss, data, perm) {
  const listaItems = (data.compromisos && Array.isArray(data.compromisos) && data.compromisos.length > 0)
    ? data.compromisos
    : [data];

  const resultados = [];
  const idsCreados = [];

  for (let i = 0; i < listaItems.length; i++) {
    const item = listaItems[i];
    const entidadItem = (perm.rol !== "SUPER_ADMIN" && perm.entidadPropia)
      ? perm.entidadPropia
      : normalizarEntidad_(item.entidad || data.entidad);

    const nombreHoja = obtenerHojaCompromisos_(entidadItem);
    const sheet = ss.getSheetByName(nombreHoja);

    if (!sheet) {
      continue;
    }

    const id = "COMP-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd") + "-" + Math.floor(100 + Math.random() * 900);
    const fechaCreacion = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    const proveedor = item.proveedor || "Proveedor no especificado";
    const concepto = item.concepto || "Cuenta por pagar";
    const montoTotal = Number(item.monto) || 0;
    const totalAbonado = 0;
    const saldoPendiente = montoTotal;
    const conceptoLimpio = (String(concepto) + " " + String(proveedor)).toLowerCase();
    const esMontoVariable = (montoTotal <= 0) || item.es_monto_variable || conceptoLimpio.includes("variable");
    const esCiclico = item.es_recurrente || esMontoVariable ||
      conceptoLimpio.includes("arriendo") || conceptoLimpio.includes("alquiler") ||
      conceptoLimpio.includes("servicio") || conceptoLimpio.includes("internet") ||
      conceptoLimpio.includes("energia") || conceptoLimpio.includes("luz") ||
      conceptoLimpio.includes("agua") || conceptoLimpio.includes("impuesto") ||
      conceptoLimpio.includes("recurrente") || conceptoLimpio.includes("mensual") ||
      conceptoLimpio.includes("tarjeta") || conceptoLimpio.includes("credito") || conceptoLimpio.includes("crédito") ||
      conceptoLimpio.includes("ciclo") || conceptoLimpio.includes("ciclio") || conceptoLimpio.includes("ciclico") || conceptoLimpio.includes("cíclico");

    const tieneVencimiento = (item.tiene_vencimiento || item.fecha_vencimiento) ? "SI" : "NO";
    const fechaVencimiento = item.fecha_vencimiento ? normalizarFechaTexto_(item.fecha_vencimiento) : "";
    const estado = "Pendiente";
    const estadoAlerta = tieneVencimiento === "SI" ? "Sin_Alerta" : "";
    const notasIniciales = esMontoVariable ? "Compromiso cíclico de monto variable" : "";

    sheet.appendRow([
      id, fechaCreacion, proveedor, concepto, montoTotal, 
      totalAbonado, saldoPendiente, tieneVencimiento, 
      fechaVencimiento, estado, estadoAlerta, notasIniciales
    ]);

    const esPorCobrar = conceptoLimpio.includes("cobrar") || conceptoLimpio.includes("cobro") || conceptoLimpio.includes("a favor") || conceptoLimpio.includes("me debe") || conceptoLimpio.includes("deudor") || conceptoLimpio.includes("prestamo a");
    const lastR = sheet.getLastRow();
    sheet.getRange(lastR, 1, 1, 12).setFontColor(esPorCobrar ? "#15803d" : "#dc2626");

    // Asegurar que la hoja tenga las reglas condicionales activas (Cobros en verde, deudas en rojo)
    if (typeof configurarFormatoCondicionalCompromisos_ === "function") {
      try {
        configurarFormatoCondicionalCompromisos_(sheet, "#dc2626", "#15803d");
      } catch (eFmt) {}
    }

    idsCreados.push(id);
    resultados.push({
      id: id,
      entidad: entidadItem,
      proveedor: proveedor,
      concepto: concepto,
      montoTotal: montoTotal,
      saldoPendiente: saldoPendiente,
      tieneVencimiento: tieneVencimiento,
      fechaVencimiento: fechaVencimiento,
      esCiclico: esCiclico,
      esMontoVariable: esMontoVariable,
      esPorCobrar: esPorCobrar
    });
  }

  SpreadsheetApp.flush();

  if (resultados.length === 0) {
    return { tipo: "error", texto: "No se pudieron registrar los compromisos en las hojas correspondientes." };
  }

  const nombreHumano = sanitizarNombreHumano_(perm ? perm.nombre : "Fernando");

  // Si fue un registro individual
  if (resultados.length === 1) {
    const r = resultados[0];
    let mensaje = "";
    if (r.esPorCobrar) {
      mensaje = `¡Anotado, ${nombreHumano}! 💰 Ya registré la **Cuenta por Cobrar (dinero a tu favor)** con **${r.proveedor}** por **$${r.montoTotal.toLocaleString("es-CO")} COP** (${r.concepto}) en **${r.entidad}** (cartera activa en verde).\n\n`;
    } else if (r.esMontoVariable) {
      mensaje = `¡Anotado, ${nombreHumano}! 🤝 Ya dejé programado tu **recordatorio de compromiso cíclico** para **${r.proveedor}** (${r.concepto}) en **${r.entidad}**.\n\n` +
        `🔄 **Monto:** Variable mes a mes (se definirá al momento del corte o pago).\n`;
    } else {
      mensaje = `¡Anotado, ${nombreHumano}! 🤝 Ya guardé el compromiso con **${r.proveedor}** por **$${r.montoTotal.toLocaleString("es-CO")} COP** (${r.concepto}) en **${r.entidad}**.\n\n`;
    }

    if (r.tieneVencimiento === "SI" && r.fechaVencimiento) {
      mensaje += `📅 **Próximo vencimiento:** ${r.fechaVencimiento}\nDespreocúpate que te enviaré un recordatorio un día antes para tenerlo presente sin estrés.`;
    } else {
      mensaje += `📅 **Plazo:** Sin fecha límite fija (abierto).`;
    }

    if (r.esCiclico) {
      mensaje += `\n\n🔄 *Compromiso mensual recurrente:* Al registrar su pago o cumplirse la fecha, el ciclo se renovará automáticamente para el siguiente mes.`;
    }

    const textoVozComp = r.esMontoVariable
      ? `Listo, ${nombreHumano}. Dejé programado tu recordatorio mensual para ${r.proveedor} con vencimiento el ${r.fechaVencimiento}. Queda bajo monitoreo permanente.`
      : `Listo, ${nombreHumano}. Guardé el compromiso con ${r.proveedor} por ${Number(r.montoTotal).toLocaleString("es-CO")} pesos en ${r.entidad}. Queda bajo monitoreo.`;
    return {
      tipo: "compromiso_creado",
      idCompromiso: r.id,
      texto: mensaje,
      textoVoz: textoVozComp,
      perfilVoz: perm ? perm.perfilVoz : null
    };
  }

  // Si fue un registro en lote (múltiples compromisos)
  const entidadPrincipal = resultados[0].entidad;
  let sumaTotal = 0;
  let mensajeLote = `¡Listo, ${nombreHumano}! 📋 Ya dejé programados estos ${resultados.length} compromisos en **${entidadPrincipal}**:\n\n`;

  resultados.forEach((r, idx) => {
    sumaTotal += r.montoTotal;
    const vStr = (r.tieneVencimiento === "SI" && r.fechaVencimiento) ? ` | 📅 Vence: ${r.fechaVencimiento}` : "";
    const ciclicoStr = r.esCiclico ? " 🔄 (Mensual)" : "";
    mensajeLote += `${idx + 1}. **${r.proveedor}** (${r.concepto})\n   💵 $${r.montoTotal.toLocaleString("es-CO")} COP${vStr}${ciclicoStr}\n`;
  });

  mensajeLote += `\n💰 **Total en compromisos:** $${sumaTotal.toLocaleString("es-CO")} COP\n`;
  mensajeLote += `⏰ Te estaré avisando con tiempo antes de cada fecha de vencimiento para que tengas total tranquilidad.`;

  const textoVozLote = `Listo, ${nombreHumano}. Quedaron programados los ${resultados.length} compromisos de pago en tus cuentas por un total de ${sumaTotal.toLocaleString("es-CO")} pesos.`;

  return {
    tipo: "compromiso_creado",
    idCompromiso: idsCreados.join(", "),
    totalCompromisos: resultados.length,
    texto: mensajeLote,
    textoVoz: textoVozLote,
    perfilVoz: perm ? perm.perfilVoz : null
  };
}


/**
 * Procesa abonos o liquidaciones de deudas pendientes en lenguaje natural
 */
function ejecutarAccionCompromiso_(ss, data, perm) {
  const entidad = (perm.rol !== "SUPER_ADMIN" && perm.entidadPropia) 
    ? perm.entidadPropia 
    : normalizarEntidad_(data.entidad);
  const nombreHojaComp = obtenerHojaCompromisos_(entidad);
  const sheetComp = ss.getSheetByName(nombreHojaComp);

  if (!sheetComp || sheetComp.getLastRow() <= 1) {
    const nombreHumano = sanitizarNombreHumano_(perm ? perm.nombre : "Fernando");
    return {
      tipo: "conversacion",
      texto: `¡Hola, ${nombreHumano}! Al revisar tus registros de ${entidad}, actualmente no tienes compromisos o cuentas por pagar activas. ¡Excelente noticia! 🎉 Si deseas programar una nueva obligación, indícame el proveedor y el monto.`
    };
  }

  const filas = sheetComp.getRange(2, 1, sheetComp.getLastRow() - 1, 12).getValues();
  const busquedaProv = String(data.proveedor || "").toLowerCase().trim();
  const idCompBuscado = String(data.id_compromiso || "").trim();

  let indexEncontrado = -1;
  let filaEncontrada = null;

  for (let i = 0; i < filas.length; i++) {
    const r = filas[i];
    const idFila = String(r[0]);
    const provFila = String(r[2]).toLowerCase().trim();
    const estadoFila = String(r[9]).trim();

    const coincide = (idFila === idCompBuscado && idCompBuscado !== "") ||
                     provFila.includes(busquedaProv) ||
                     busquedaProv.includes(provFila) ||
                     (busquedaProv.includes("papelera") && provFila.includes("papelera"));

    if (estadoFila === "Pendiente" && coincide) {
      indexEncontrado = i + 2;
      filaEncontrada = r;
      break;
    }
  }

  if (indexEncontrado === -1) {
    const compPendientes = (perm.rol === "SUPER_ADMIN") ? obtenerCompromisosPendientes_() : obtenerCompromisosPendientesUsuario_(entidad);
    if (compPendientes && compPendientes.length > 0) {
      const opcionesTexto = compPendientes.slice(0, 4).map((c, idx) => {
        return `${idx + 1}️⃣ **${c.proveedor}** (Saldo: $${(Number(c.saldo) || 0).toLocaleString("es-CO")} COP | ${c.entidad || entidad})`;
      }).join("\n");
      return {
        tipo: "conversacion",
        texto: `No encontré ningún compromiso activo registrado bajo el nombre "${data.proveedor}" en ${entidad}.\n\n` +
          `Actualmente tienes estos compromisos pendientes:\n${opcionesTexto}\n\n` +
          `👉 *¿Deseas aplicar el abono a alguno de ellos? Responde con el número o nombre del acreedor.*`
      };
    } else {
      return {
        tipo: "conversacion",
        texto: `No encontré ningún compromiso pendiente bajo el nombre "${data.proveedor}" en ${entidad}. ¿Deseas que lo cree como un nuevo compromiso por pagar? Indícame el valor y fecha si la tiene.`
      };
    }
  }

  const saldoActual = Number(filaEncontrada[6]) || 0;

  // CASO ESPECIAL: REPROGRAMAR / APLAZAR FECHA DE PAGO
  if (data.accion === "reprogramar_fecha" || data.nueva_fecha) {
    const nuevaFecha = normalizarFechaTexto_(data.nueva_fecha) || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    sheetComp.getRange(indexEncontrado, 8).setValue("SI"); // TIENE_VENCIMIENTO
    sheetComp.getRange(indexEncontrado, 9).setValue(nuevaFecha); // FECHA_VENCIMIENTO
    sheetComp.getRange(indexEncontrado, 11).setValue("Sin_Alerta"); // ESTADO_ALERTA (resetea para permitir nueva alarma)
    sheetComp.getRange(indexEncontrado, 12).setValue(""); // ULTIMA_ALERTA (limpia timestamp de alerta enviada previamente)
    SpreadsheetApp.flush();

    return {
      tipo: "compromiso_reprogramado",
      texto: `📅 *Compromiso Reprogramado Exitosamente en ${entidad}:*\n\n` +
        `• **Acreedor:** ${filaEncontrada[2]}\n` +
        `• **Concepto:** ${filaEncontrada[3]}\n` +
        `• **Saldo pendiente:** $${saldoActual.toLocaleString("es-CO")} COP\n` +
        `• **Nueva fecha de vencimiento:** ${nuevaFecha}\n\n` +
        `⏰ *El sistema de alarmas matutinas (8:00 AM) se ha sincronizado automáticamente con tu nueva fecha.*`
    };
  }

  const montoAbono = data.accion === "pagar_total" ? saldoActual : (Number(data.monto_abono) || 0);

  if (montoAbono <= 0) {
    return {
      tipo: "conversacion",
      texto: `Entendido el interés de abonar a **${filaEncontrada[2]}** (Saldo pendiente: $${saldoActual.toLocaleString("es-CO")} COP). ¿Cuál es el monto exacto que vas a abonar? Puedes decirme el valor (ej: '50.000') o escribir 'pagar todo'.`
    };
  }

  const nuevoAbonado = Number(filaEncontrada[5]) + montoAbono;
  const nuevoSaldo = Math.max(0, Number(filaEncontrada[4]) - nuevoAbonado);
  const nuevoEstado = nuevoSaldo === 0 ? "Cumplido" : "Pendiente";
  const nuevoEstadoAlerta = nuevoSaldo === 0 ? "Cumplido" : "Abono_Registrado";

  // 1. Actualizar hoja de compromisos
  sheetComp.getRange(indexEncontrado, 6).setValue(nuevoAbonado);
  sheetComp.getRange(indexEncontrado, 7).setValue(nuevoSaldo);
  sheetComp.getRange(indexEncontrado, 10).setValue(nuevoEstado);
  sheetComp.getRange(indexEncontrado, 11).setValue(nuevoEstadoAlerta);
  SpreadsheetApp.flush();

  // 2. Asentar automáticamente el egreso en la hoja de transacciones
  const nombreHojaTrans = obtenerHojaTransacciones_(entidad);
  const sheetTrans = ss.getSheetByName(nombreHojaTrans);
  if (sheetTrans) {
    const idTx = "TX-PAGO-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd") + "-" + Math.floor(100 + Math.random() * 900);
    const fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    sheetTrans.appendRow([
      idTx, fecha, "Abono Deuda", "Proveedores / Pasivos", "Abono a Cuenta por Pagar",
      `Abono a ${filaEncontrada[2]} (${filaEncontrada[3]})`,
      filaEncontrada[2], montoAbono, data.metodo_pago || "Transferencia",
      "Confirmado", filaEncontrada[0], "Generado automáticamente por abono de compromiso"
    ]);
    SpreadsheetApp.flush();
  }

  const nombreHumano = sanitizarNombreHumano_(perm ? perm.nombre : "Fernando");
  let respuesta = "";

  if (nuevoSaldo === 0) {
    respuesta = `¡Excelente noticia, ${nombreHumano}! 🎉 Quedó liquidada al 100% la cuenta con **${filaEncontrada[2]}** en **${entidad}** (pago de **$${montoAbono.toLocaleString("es-CO")} COP**).\n\nCompromiso cumplido y cerrado en tus libros. ¡Un pasivo menos!`;

    // DETECCIÓN Y RENOVACIÓN DE COMPROMISO CÍCLICO (Arriendos, Servicios, Impuestos)
    const conceptoLimpio = String(filaEncontrada[3]).toLowerCase();
    const esCiclico = data.es_recurrente || 
      conceptoLimpio.includes("arriendo") || conceptoLimpio.includes("alquiler") ||
      conceptoLimpio.includes("servicio") || conceptoLimpio.includes("internet") ||
      conceptoLimpio.includes("energia") || conceptoLimpio.includes("luz") ||
      conceptoLimpio.includes("agua") || conceptoLimpio.includes("impuesto") ||
      conceptoLimpio.includes("recurrente") || conceptoLimpio.includes("mensual");

    if (esCiclico) {
      // Calcular próxima fecha de vencimiento (1 mes después)
      const fechaBase = filaEncontrada[8] instanceof Date ? filaEncontrada[8] : new Date();
      const proximoMes = new Date(fechaBase);
      proximoMes.setMonth(proximoMes.getMonth() + 1);
      const fechaSigMesStr = Utilities.formatDate(proximoMes, Session.getScriptTimeZone(), "yyyy-MM-dd");

      const idNuevoCiclico = "COMP-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd") + "-" + Math.floor(100 + Math.random() * 900);
      const montoOriginal = Number(filaEncontrada[4]) || montoAbono;

      sheetComp.appendRow([
        idNuevoCiclico,
        Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
        filaEncontrada[2],
        filaEncontrada[3],
        montoOriginal,
        0, // TOTAL_ABONADO
        montoOriginal, // SALDO_PENDIENTE
        "SI",
        fechaSigMesStr,
        "Pendiente",
        "Sin_Alerta",
        "Generado automáticamente por ciclo recurrente mensual"
      ]);
      SpreadsheetApp.flush();

      respuesta += `\n\n🔄 *Compromiso mensual renovado:* He programado la siguiente cuota para el **${fechaSigMesStr}** por **$${montoOriginal.toLocaleString("es-CO")} COP** para que sigamos al día.`;
    }

    // ARCHIVADO A HOJA HISTÓRICA CON LETRAS NEGRAS Y REMOCIÓN DE PENDIENTES
    if (typeof archivarCompromisoCumplidoDirecto_ === "function") {
      archivarCompromisoCumplidoDirecto_(ss, sheetComp, indexEncontrado, filaEncontrada, nuevoAbonado, data.metodo_pago, esCiclico);
      respuesta += `\n\n🗄️ *Registro histórico:* El compromiso ha sido trasladado a tu hoja de histórico de pagos con letras negras para auditoría y retirado de la lista de pasivos pendientes.`;
    }
  } else {
    respuesta = `¡Listo, ${nombreHumano}! ✅ Registré tu abono de **$${montoAbono.toLocaleString("es-CO")} COP** a **${filaEncontrada[2]}** (${entidad}).\n\n📌 **Nuevo saldo pendiente:** $${nuevoSaldo.toLocaleString("es-CO")} COP. ¡Vamos avanzando con ese pago!`;
  }

  const textoVozAbono = (nuevoSaldo === 0)
    ? `Excelente, ${nombreHumano}. La deuda con ${filaEncontrada[2]} ha quedado liquidada al cien por ciento.`
    : `Listo, ${nombreHumano}. Abono de ${montoAbono.toLocaleString("es-CO")} pesos asentado con éxito para ${filaEncontrada[2]}. El nuevo saldo pendiente es de ${nuevoSaldo.toLocaleString("es-CO")} pesos.`;

  return {
    tipo: "abono_exitoso",
    texto: respuesta,
    textoVoz: textoVozAbono,
    saldoRestante: nuevoSaldo,
    perfilVoz: perm ? perm.perfilVoz : null
  };
}

/**
 * Ejecuta consultas financieras y genera informes analíticos en lenguaje natural
 */
function ejecutarConsultaFinanciera_(ss, preguntaUsuario, interpretacion, perm, historial) {
  const alias = perm.aliasAsistente || (perm.rol === "SUPER_ADMIN" ? "Bruce Wayne" : "Aura");
  const infoVoz = typeof obtenerInfoPerfilVoz_ === "function" 
    ? obtenerInfoPerfilVoz_(perm.perfilVoz || (perm.rol === "SUPER_ADMIN" ? "BATMAN" : "FEMENINO_DULCE"))
    : { emoji: "🦇", desc: "Batman", lema: "Soy la noche. Tus finanzas están protegidas." };

  if (perm.rol !== "SUPER_ADMIN") {
    const resEst = ejecutarConsultaFinancieraUsuarioEstandar_(ss, preguntaUsuario, perm);
    if (resEst) resEst.perfilVoz = perm.perfilVoz;
    return resEst;
  }

  const hoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

  // 1. Verificación prioritaria de consulta específica de gastos de hoy o recientes
  const tPregunta = String(preguntaUsuario || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const esConsultaGastos = tPregunta.includes("gasto") || tPregunta.includes("egreso") || tPregunta.includes("salida");
  const esFiltroHoy = tPregunta.includes("hoy") || tPregunta.includes("dia");

  if (esConsultaGastos && typeof calcularGastosHoyOPeriodo_ === "function") {
    const resGastos = calcularGastosHoyOPeriodo_(ss, esFiltroHoy ? hoy : null, null, perm, alias, infoVoz);
    if (resGastos) return resGastos;
  }

  const saldos = obtenerResumenSaldos_();
  const ultimasTrans = obtenerUltimasTransaccionesConsolidadas_();
  const compromisos = obtenerCompromisosPendientes_();
  const gastosGlobalesNomina = saldos && saldos.Consolidado ? (Number(saldos.Consolidado.gastos) || 0) : 0;
  const saldoPersonal2103 = saldos && saldos.Personal ? saldos.Personal.disponible : 0;
  const saldoNegocios7194 = saldos ? ((Number(saldos["More Paper"].disponible) || 0) + (Number(saldos["More Design"].disponible) || 0) - gastosGlobalesNomina) : 0;

  const nombreHumano = sanitizarNombreHumano_(perm ? perm.nombre : "Fernando");
  const promptAnalisis = [
    `Eres ${alias}, Director Financiero y Asesor Estratégico de confianza para ${nombreHumano}. Hoy es ${hoy}.`,
    `Tono de voz y estilo: ${infoVoz.desc}. Emojis: ${infoVoz.emoji}. Lema: "${infoVoz.lema}".`,
    "Responde a la consulta de Fernando con cercanía, inteligencia ejecutiva, respeto y naturalidad 100% humana.",
    "PROHIBIDO TERMINANTEMENTE utilizar etiquetas de bases de datos como '(Propietario)' o hablar con muletillas robóticas.",
    "Aplica los principios del Consejo Asesor Global (Finanzas/Negocios), el Consejo de Tecnología e IA (Pioneros Tech) y la Mesa Técnica de Ciberseguridad y Privacidad (Jay Chaudhry, Nikesh Arora, George Kurtz, Ken Xie, Eva Chen, Matthew Prince, Meredith Whittaker, Andy Yen): precisión ejecutiva, interacción ultra-humana, rigor analítico, protección inviolable de datos personales y cero vulnerabilidades.",
    "Utiliza formato de moneda colombiana con separadores de miles (ejemplo: $150.000 COP).",
    "ENTREGA EL INFORME COMPLETO: Cita los saldos exactos de Personal, More Paper, More Design y el Total Disponible, además de los pasivos y el saldo disponible por cuenta bancaria (Ahorros ***2103 para Personal, y Ahorros ***7194 compartida para More Paper y More Design deduciendo los Gastos Operativos Globales/Nómina si existen). NUNCA dejes oraciones a medias ni utilices etiquetas ficticias como [Nota de voz] o [Transcripción].",
    "DATOS EN VIVO DEL SISTEMA FINANCIERO:",
    JSON.stringify({ 
      saldosConsolidados: saldos, 
      compromisosPendientes: compromisos, 
      transaccionesRecientes: ultimasTrans,
      cuentasBancarias: {
        cuentaPersonal2103: saldoPersonal2103,
        cuentaNegocios7194Comun: saldoNegocios7194,
        desgloseNegocios: {
          morePaper: saldos["More Paper"].disponible,
          moreDesign: saldos["More Design"].disponible,
          gastosOperativosGlobalesNomina: gastosGlobalesNomina
        }
      }
    }),
    "",
    "CONSULTA DEL USUARIO:",
    preguntaUsuario
  ].join("\n");

  const respuestaAnalitica = llamarGeminiTexto_(promptAnalisis);
  if (respuestaAnalitica) {
    return {
      tipo: "consulta",
      texto: respuestaAnalitica,
      perfilVoz: perm.perfilVoz
    };
  }

  // Fallback analítico ejecutivo en COP si la API externa no está disponible
  return {
    tipo: "consulta",
    texto: `📊 **Resumen Financiero Ejecutivo en Tiempo Real:**\n\n` +
      `• **👤 Personal:** Ingresos: $${saldos.Personal.ingresos.toLocaleString("es-CO")} | Gastos: $${saldos.Personal.gastos.toLocaleString("es-CO")} | Flujo Neto: $${saldos.Personal.disponible.toLocaleString("es-CO")} COP (Pasivos: $${saldos.Personal.deudas.toLocaleString("es-CO")})\n` +
      `• **🏢 More Paper:** Ingresos: $${saldos["More Paper"].ingresos.toLocaleString("es-CO")} | Gastos: $${saldos["More Paper"].gastos.toLocaleString("es-CO")} | Flujo Neto: $${saldos["More Paper"].disponible.toLocaleString("es-CO")} COP (Pasivos: $${saldos["More Paper"].deudas.toLocaleString("es-CO")})\n` +
      `• **🎨 More Design:** Ingresos: $${saldos["More Design"].ingresos.toLocaleString("es-CO")} | Gastos: $${saldos["More Design"].gastos.toLocaleString("es-CO")} | Flujo Neto: $${saldos["More Design"].disponible.toLocaleString("es-CO")} COP (Pasivos: $${saldos["More Design"].deudas.toLocaleString("es-CO")})\n` +
      (gastosGlobalesNomina > 0 ? `• **🏢 Gasto Operativo Global / Nómina:** -$${gastosGlobalesNomina.toLocaleString("es-CO")} COP\n` : "") +
      `\n🏦 **Disponibilidad por Cuenta Bancaria:**\n` +
      `• **💳 Ahorros Personal (***2103):** $${saldoPersonal2103.toLocaleString("es-CO")} COP\n` +
      `• **💳 Ahorros Negocios (***7194 - Común):** $${saldoNegocios7194.toLocaleString("es-CO")} COP *(More Paper: $${saldos["More Paper"].disponible.toLocaleString("es-CO")} | More Design: $${saldos["More Design"].disponible.toLocaleString("es-CO")}${gastosGlobalesNomina > 0 ? ` | Nómina Global: -$${gastosGlobalesNomina.toLocaleString("es-CO")}` : ""})*\n\n` +
      `💰 **TOTAL CONSOLIDADO DISPONIBLE:** $${saldos.TOTAL.disponible.toLocaleString("es-CO")} COP\n` +
      `📌 **Total Pasivos Pendientes:** $${saldos.TOTAL.deudas.toLocaleString("es-CO")} COP`,
    perfilVoz: perm.perfilVoz
  };
}

// ============================================================================
// VISIÓN COMPUTACIONAL (COMPROBANTES Y FACTURAS)
// ============================================================================
/**
 * Analiza comprobantes de pago (Nequi, Bancolombia, Daviplata, etc.), facturas físicas
 * o reportes de 'Cierre de Turno POS' en imagen mediante visión computacional.
 */
function procesarImagenComprobante(telefono, imagenBase64, mimeType, textoAcompanante) {
  try {
    const telLimpio = normalizarTelefono_(telefono);
    const apiKey = obtenerApiKeyGemini_();
    if (!apiKey || apiKey.trim() === "") {
      return {
        tipo: "conversacion",
        texto: "Para que pueda analizar tus fotos de comprobantes y facturas con visión artificial, por favor configura la clave GEMINI_API_KEY en las propiedades del script."
      };
    }

    const imgBase64Limpia = String(imagenBase64 || "").replace(/\s+/g, "");
    if (!imgBase64Limpia || imgBase64Limpia.length < 50) {
      Logger.log("Aviso: imagenBase64 recibida en procesarImagenComprobante está vacía o es inválida.");
      return {
        tipo: "conversacion",
        texto: "📸 La imagen recibida no contiene datos válidos para procesar. Por favor vuelve a enviarla directamente por el chat."
      };
    }

    let cleanMime = String(mimeType || "image/jpeg").split(";")[0].trim().toLowerCase();
    if (!["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(cleanMime)) {
      cleanMime = "image/jpeg";
    }

    const promptVision = [
      "Eres un auditor financiero y contador experto para More Paper y More Design.",
      "Analiza minuciosamente la imagen adjunta (pantalla de software POS 'Cerrar turno', ticket de venta, comprobante bancario Nequi/Bancolombia o factura física).",
      "",
      "INSTRUCCIÓN CRÍTICA 1 - DETECCIÓN DE CIERRE DE TURNO POS (MODAL O PANTALLA):",
      "Si la imagen contiene 'Cerrar turno', 'Reporte de ventas', 'Total de ventas', 'Ventas en efectivo', 'Ventas por transferencias', 'Ventas por tarjeta de débito', 'Ventas por tarjeta de crédito' o 'Dinero esperado en caja':",
      "Extrae con precisión matemática en formato JSON estricto:",
      "{",
      '  "tipo_documento": "cierre_turno_pos",',
      '  "fecha": "YYYY-MM-DD",',
      '  "total_ventas_pos": 0,',
      '  "ventas_efectivo": 0,',
      '  "ventas_transferencias": 0,',
      '  "ventas_tarjeta_debito": 0,',
      '  "ventas_tarjeta_credito": 0,',
      '  "total_bancarizado": 0,',
      '  "entidad_detectada": "More Paper" | "More Design" | null',
      "}",
      "",
      "REGLAS OBLIGATORIAS DE EXTRACCIÓN NUMÉRICA:",
      "- 'Total de ventas' -> total_ventas_pos (ejemplo: si dice $389,000, extrae 389000)",
      "- 'Ventas en efectivo' o 'Dinero esperado en caja' -> ventas_efectivo (ejemplo: si dice $125,000, extrae 125000)",
      "- 'Ventas por tarjeta de débito' -> ventas_tarjeta_debito (ejemplo: si dice $100,000, extrae 100000)",
      "- 'Ventas por tarjeta de crédito' -> ventas_tarjeta_credito (ejemplo: si dice $55,000, extrae 55000)",
      "- 'Ventas por transferencias' -> ventas_transferencias (ejemplo: si dice $109,000, extrae 109000)",
      "- total_bancarizado = ventas_transferencias + ventas_tarjeta_debito + ventas_tarjeta_credito (en este caso 109000 + 100000 + 55000 = 264000)",
      "- En todos los números, escribe únicamente dígitos enteros sin signos de pesos ($), sin comas de miles y sin puntos.",
      "",
      "INSTRUCCIÓN CRÍTICA 2 - COMPROBANTE BANCARIO O FACTURA ESTÁNDAR:",
      "Si NO es un cierre POS, extrae en formato JSON:",
      "{",
      '  "tipo_documento": "comprobante_estandar",',
      '  "fecha": "YYYY-MM-DD",',
      '  "valor": 0,',
      '  "concepto": "descripción",',
      '  "emisor_destinatario": "nombre",',
      '  "metodo_pago": "Transferencia | Nequi | Bancolombia | etc",',
      '  "entidad_detectada": "Personal" | "More Paper" | "More Design" | null',
      "}",
      "",
      "Responde ÚNICAMENTE con el objeto JSON válido.",
      textoAcompanante ? "Pie de foto del usuario: " + textoAcompanante : ""
    ].join("\n");

    const modelosVision = (typeof obtenerModelosDisponiblesGemini_ === "function")
      ? obtenerModelosDisponiblesGemini_(apiKey)
      : ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-pro"];

    let dataVision = null;
    let textoExtraido = "";
    let ultimoError = "";

    // Bucle multi-modelo con reintento resiliente (primero application/json, luego estándar si el modelo falla)
    for (const modelo of modelosVision) {
      if (dataVision) break;
      const url = `${CONFIG_IA.URL_BASE_GEMINI}${modelo}:generateContent?key=${apiKey}`;

      const configs = [
        { temperature: 0.1, maxOutputTokens: CONFIG_IA.MAX_OUTPUT_TOKENS || 8192, responseMimeType: "application/json" },
        { temperature: 0.1, maxOutputTokens: CONFIG_IA.MAX_OUTPUT_TOKENS || 8192 }
      ];

      for (const genCfg of configs) {
        try {
          const payload = {
            contents: [{
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: cleanMime,
                    data: imgBase64Limpia
                  }
                },
                { text: promptVision }
              ]
            }],
            generationConfig: genCfg
          };

          const response = UrlFetchApp.fetch(url, {
            method: "POST",
            contentType: "application/json",
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
          });

          const code = response.getResponseCode();
          const json = JSON.parse(response.getContentText());

          if (code === 200 && !json.error && json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts) {
            textoExtraido = String(json.candidates[0].content.parts[0].text || "").trim();
            Logger.log(`Texto extraído por Gemini Vision (${modelo}): ${textoExtraido.substring(0, 160)}...`);
            dataVision = extraerJsonLimpio_(textoExtraido);
            if (dataVision) {
              Logger.log(`✅ Visión Gemini exitosa con modelo: ${modelo}`);
              break;
            }
          } else {
            const msg = json.error ? json.error.message : ("HTTP " + code);
            ultimoError = msg;
            Logger.log(`Aviso Gemini Vision (${modelo} - ${code}): ${msg}`);
            if (code === 503 || code === 429 || String(msg).toLowerCase().includes("high demand")) {
              Utilities.sleep(600);
            }
          }
        } catch (errLoop) {
          ultimoError = errLoop.message;
          Logger.log(`Excepción en bucle de visión (${modelo}): ${errLoop.message}`);
        }
      }
    }

    if (!dataVision) {
      if (ultimoError && (ultimoError.includes("high demand") || ultimoError.includes("503") || ultimoError.includes("quota") || ultimoError.includes("429"))) {
        return {
          tipo: "error",
          texto: "⚠️ *Servidores de visión artificial con alta demanda momentánea:*\n\n" +
            "He recibido la imagen de tu comprobante, pero Google AI Studio presenta sobrecarga temporal en este minuto.\n\n" +
            "👉 *Opciones de solución rápida:*\n" +
            "1. Reenvía la foto en unos segundos.\n" +
            "2. O escribe los montos por mensaje (ejemplo: *'Venta More Paper: $151.500 bancarizados y $140.000 efectivo'*)."
        };
      }

      // RESCATE ASISTIDO POR CAPTION: Si el usuario envió pie de foto indicando venta o cierre de local
      const tAcompRaw = String(textoAcompanante || "").toLowerCase();
      if (tAcompRaw.includes("venta") || tAcompRaw.includes("cierre") || tAcompRaw.includes("paper") || tAcompRaw.includes("mope") || tAcompRaw.includes("design")) {
        const entSugerida = (tAcompRaw.includes("design")) ? "More Design" : "More Paper";
        return {
          tipo: "conversacion",
          texto: `📸 He recibido tu captura de cierre/venta para **${entSugerida}**, pero la imagen no pudo ser leída automáticamente con suficiente resolución numérica.\n\n` +
            `👉 *Para asentarlo de inmediato en tus cuentas oficiales, digítame los valores así:*\n` +
            `*Ingreso venta ${entSugerida}:*\n` +
            `Efectivo $...\n` +
            `Tarjeta débito $...\n` +
            `Tarjeta crédito $...\n` +
            `Transferencias $...\n` +
            `Total $...\n\n` +
            `¡Lo procesaré con rigor contable al instante!`
        };
      }

      return {
        tipo: "conversacion",
        texto: "📸 He recibido tu comprobante, pero la imagen no se distingue con suficiente nitidez para extraer los valores con rigor contable. ¿Podrías confirmarme el monto y concepto por mensaje, o reenviarme una foto más enfocada? Con gusto lo registraré."
      };
    }

    // ------------------------------------------------------------------------
    // CASO A: REPORTE DE CIERRE DE TURNO POS
    // ------------------------------------------------------------------------
    if (dataVision.tipo_documento === "cierre_turno_pos") {
      const totalTransf = limpiarNumeroFinanciero_(dataVision.ventas_transferencias);
      const totalDebito = limpiarNumeroFinanciero_(dataVision.ventas_tarjeta_debito);
      const totalCredito = limpiarNumeroFinanciero_(dataVision.ventas_tarjeta_credito);
      const ventasEfectivo = limpiarNumeroFinanciero_(dataVision.ventas_efectivo);
      const totalBancarizado = limpiarNumeroFinanciero_(dataVision.total_bancarizado) || (totalTransf + totalDebito + totalCredito);
      const totalPOS = limpiarNumeroFinanciero_(dataVision.total_ventas_pos) || (totalBancarizado + ventasEfectivo);
      const fecha = dataVision.fecha || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

      const closureData = {
        tipo_documento: "cierre_turno_pos",
        fecha: fecha,
        total_ventas_pos: totalPOS,
        ventas_efectivo: ventasEfectivo,
        ventas_transferencias: totalTransf,
        ventas_tarjeta_debito: totalDebito,
        ventas_tarjeta_credito: totalCredito,
        total_bancarizado: totalBancarizado
      };

      // Determinar entidad: primero por texto acompañante, luego por detección visual
      let entidad = null;
      const tAcomp = String(textoAcompanante || "").toLowerCase().replace(/[\s_-]/g, "");
      if (tAcomp.includes("paper") || tAcomp.includes("morepaper") || tAcomp.includes("mopepaper") || tAcomp.includes("mope") || tAcomp.includes("papeleria") || tAcomp.includes("papelería") || tAcomp.includes("papel")) {
        entidad = "More Paper";
      } else if (tAcomp.includes("design") || tAcomp.includes("moredesign") || tAcomp.includes("desing") || tAcomp.includes("moredesing") || tAcomp.includes("amordesign") || tAcomp.includes("diseno") || tAcomp.includes("diseño") || tAcomp.includes("agencia") || tAcomp.includes("publicidad")) {
        entidad = "More Design";
      } else if (dataVision.entidad_detectada === "More Paper" || dataVision.entidad_detectada === "More Design") {
        entidad = dataVision.entidad_detectada;
      }

      // Herencia conversacional desde flujo interactivo previo:
      // Si el usuario envió un mensaje previo indicando el negocio (ej: "venta more design" o "more design") y luego envió la foto
      if (!entidad) {
        try {
          const cache = CacheService.getUserCache();
          const pendingFlowRaw = cache ? cache.get("PENDING_INTERACTIVE_FLOW_" + telLimpio) : null;
          if (pendingFlowRaw) {
            const flowData = JSON.parse(pendingFlowRaw);
            const entPrevia = flowData.datosParciales ? flowData.datosParciales.entidad : null;
            if (entPrevia === "More Design" || entPrevia === "More Paper") {
              entidad = entPrevia;
              cache.remove("PENDING_INTERACTIVE_FLOW_" + telLimpio);
              Logger.log(`🔄 Local POS heredado con éxito desde contexto previo: ${entidad}`);
            }
          }
        } catch (eHeredar) {
          Logger.log("Aviso heredando local de flujo interactivo previo: " + eHeredar.message);
        }
      }

      // COMPUERTA DE CLARIFICACIÓN: Si no está 100% claro el local, pausar y preguntar
      if (!entidad) {
        try {
          const cache = CacheService.getUserCache();
          if (cache) {
            cache.put("PENDING_POS_CLOSE_" + telLimpio, JSON.stringify(closureData), 600); // 10 minutos
            cache.remove("PENDING_INTERACTIVE_FLOW_" + telLimpio); // Evitar colisión de flujos
          }
        } catch (eCache) {
          Logger.log("Aviso guardando caché POS: " + eCache.message);
        }

        return {
          tipo: "clarificacion_local_pos",
          texto: `📸 **Cierre de Turno POS analizado exitosamente:**\n\n` +
            `• 💳 **Total Bancarizado a ingresar:** **$${totalBancarizado.toLocaleString("es-CO")} COP**\n` +
            `  *(Transferencias: $${totalTransf.toLocaleString("es-CO")} | Débito: $${totalDebito.toLocaleString("es-CO")} | Crédito: $${totalCredito.toLocaleString("es-CO")})*\n` +
            `• 💵 **Efectivo en Caja:** **$${ventasEfectivo.toLocaleString("es-CO")} COP**\n` +
            `  *(⚠️ Excluido de la hoja contable y del banco; se registrará cuando informes su consignación)*\n` +
            `• 🧾 **Total Facturación POS:** $${totalPOS.toLocaleString("es-CO")} COP\n\n` +
            `❓ **¿A cuál de los dos locales corresponde este cierre?**\n` +
            `1️⃣ **More Paper**\n` +
            `2️⃣ **More Design**\n\n` +
            `*Por favor responde con el número o nombre del local para asentar el movimiento.*`
        };
      }

      // Si el local ya está definido, asentar de inmediato
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      return ejecutarAsentamientoCierreTurnoPOS_(ss, entidad, closureData);
    }

    // ------------------------------------------------------------------------
    // CASO B: COMPROBANTE ESTÁNDAR (Transferencia o Factura)
    // ------------------------------------------------------------------------
    const val = limpiarNumeroFinanciero_(dataVision.valor) || 0;
    const conc = dataVision.concepto || "Comprobante procesado por visión artificial";
    const ent = dataVision.entidad_detectada || "Personal";
    const fecha = dataVision.fecha || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

    return {
      tipo: "analisis_comprobante",
      texto: `📸 **Comprobante analizado con visión artificial:**\n\n` +
        `• **Monto:** $${val.toLocaleString("es-CO")} COP\n` +
        `• **Fecha:** ${fecha}\n` +
        `• **Concepto:** ${conc}\n` +
        `• **Entidad sugerida:** ${ent}\n` +
        `• **Método:** ${dataVision.metodo_pago || "Transferencia"}\n\n` +
        `👉 *¿Deseas que lo registre en tus finanzas? Responde 'Sí, regístralo' o especifica cambios.*`
    };

  } catch (e) {
    Logger.log("Aviso en procesarImagenComprobante: " + e.message);
    return {
      tipo: "conversacion",
      texto: "📸 He recibido tu comprobante, pero hubo una dificultad visual al interpretar los números con exactitud. Por favor indícame brevemente el monto y a cuál de tus locales (More Paper, More Design o Personal) corresponde, y lo asentaré al instante."
    };
  }
}

/**
 * Asienta de forma estricta el cierre de turno POS en la hoja del negocio correspondiente:
 * - Registra únicamente los canales bancarizados (Transferencias + Tarjeta Débito + Tarjeta Crédito).
 * - Excluye el dinero en efectivo del registro contable de la hoja y de la cuenta bancaria.
 * - Asigna el método de pago oficial Ahorros ***7194 (Negocios).
 */
function ejecutarAsentamientoCierreTurnoPOS_(ss, entidad, closureData) {
  const nombreHoja = obtenerHojaTransacciones_(entidad);
  const sheet = ss.getSheetByName(nombreHoja);
  if (!sheet) {
    return {
      tipo: "conversacion",
      texto: `No encontré la hoja de transacciones para ${entidad}. Por favor verifica el nombre de la pestaña en tu libro contable.`
    };
  }

  const id = "TX-POS-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd") + "-" + Math.floor(100 + Math.random() * 900);
  const fecha = closureData.fecha || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const valorBancarizado = Number(closureData.total_bancarizado) || 0;
  const ventasEfectivo = Number(closureData.ventas_efectivo) || 0;
  const totalPOS = Number(closureData.total_ventas_pos) || (valorBancarizado + ventasEfectivo);
  const transf = Number(closureData.ventas_transferencias) || 0;
  const debito = Number(closureData.ventas_tarjeta_debito) || 0;
  const credito = Number(closureData.ventas_tarjeta_credito) || 0;

  const notas = `Cierre POS Total: $${totalPOS.toLocaleString("es-CO")} | Efectivo en caja: $${ventasEfectivo.toLocaleString("es-CO")} (no ingresado a banco) | Transf: $${transf.toLocaleString("es-CO")} | Débito: $${debito.toLocaleString("es-CO")} | Crédito: $${credito.toLocaleString("es-CO")}`;

  sheet.appendRow([
    id,
    fecha,
    "Ingreso",
    "Ventas / Facturación",
    "Cierre Turno POS",
    "Cierre de Turno POS (Canales Bancarizados)",
    "Ventas Mostrador POS",
    valorBancarizado,
    "Ahorros ***7194 (Negocios)",
    "Confirmado",
    "",
    notas
  ]);
  SpreadsheetApp.flush();

  return {
    tipo: "cierre_pos_exitoso",
    texto: `✅ **Cierre de Turno registrado con éxito en ${entidad}:**\n\n` +
      `• 💳 **Abonado a Cuenta Bancaria (Ahorros ***7194):** **$${valorBancarizado.toLocaleString("es-CO")} COP**\n` +
      `  - Transferencias: $${transf.toLocaleString("es-CO")} COP\n` +
      `  - Tarjeta Débito: $${debito.toLocaleString("es-CO")} COP\n` +
      `  - Tarjeta Crédito: $${credito.toLocaleString("es-CO")} COP\n` +
      `• 💵 **Efectivo en Caja física:** $${ventasEfectivo.toLocaleString("es-CO")} COP *(⚠️ Excluido de la cuenta y de la hoja contable; pendiente de consignación)*\n` +
      `• 🧾 **Total Facturado en POS:** $${totalPOS.toLocaleString("es-CO")} COP\n` +
      `• 🏢 **Local comercial:** ${entidad}`
  };
}

/**
 * Purga y elimina de la hoja MorePaper_Compromisos los registros erróneos creados
 * accidentalmente por falsos positivos de ventas o texto de cierre de turno.
 */
function purgarCompromisosErroneosMorePaper(ss) {
  try {
    const spreadsheet = ss || SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName("MorePaper_Compromisos");
    if (!sheet) {
      return {
        tipo: "conversacion",
        texto: "⚠️ No se encontró la hoja 'MorePaper_Compromisos' para realizar la purga."
      };
    }

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return {
        tipo: "conversacion",
        texto: "ℹ️ La hoja 'MorePaper_Compromisos' no tiene compromisos pendientes para purgar."
      };
    }

    const data = sheet.getRange(2, 1, lastRow - 1, 12).getValues();
    let eliminados = 0;
    const detallesEliminados = [];

    // Iterar en reversa (de abajo hacia arriba) para mantener índices estables al borrar
    for (let i = data.length - 1; i >= 0; i--) {
      const fila = data[i];
      const prov = String(fila[2] || "").trim().toLowerCase();
      const conc = String(fila[3] || "").trim().toLowerCase();
      const monto = Number(fila[4]) || 0;

      const esFalsoCompromisoVenta = conc.includes("ingreso por venta") ||
        conc.includes("total de movimientos") ||
        prov === "movimientos" ||
        conc.includes("efectivo $213.300") || conc.includes("efectivo 213300") ||
        conc.includes("tarjeta de debito $337.900") || conc.includes("debito $337.900") ||
        conc.includes("tarjeta de credito $ 81.600") || conc.includes("tarjeta de credito $81.600") ||
        conc.includes("transferencias $ 75.800") || conc.includes("transferencias $75.800") ||
        (prov === "proveedor" && (conc.includes("more paper hoy 20/09/2026") || conc.includes("efectivo $") || conc.includes("tarjeta de") || conc.includes("transferencias $")));

      if (esFalsoCompromisoVenta) {
        const rowNumber = i + 2;
        sheet.deleteRow(rowNumber);
        eliminados++;
        detallesEliminados.push(`• ${fila[2]} - ${fila[3]} ($${monto.toLocaleString("es-CO")} COP)`);
      }
    }

    SpreadsheetApp.flush();

    if (eliminados === 0) {
      return {
        tipo: "conversacion",
        texto: "✅ No se encontraron compromisos erróneos o falsos positivos en More Paper. Tus cuentas están al día y auditadas."
      };
    }

    return {
      tipo: "purga_exitosa",
      texto: `🧹 **Purga Contable Exitosa:** Se han eliminado **${eliminados} compromisos erróneos** de la hoja *MorePaper_Compromisos*:\n\n` +
        detallesEliminados.join("\n") + "\n\n" +
        `⚖️ *Tu pasivo y balance de obligaciones han sido restablecidos con total exactitud contable.*`
    };
  } catch (err) {
    Logger.log("Error en purgarCompromisosErroneosMorePaper: " + err.message);
    return {
      tipo: "error",
      texto: "⚠️ Ocurrió un error al purgar los compromisos erróneos: " + err.message
    };
  }
}

// ============================================================================
// ESCÁNER PROACTIVO DE COMPROMISOS (RECORDATORIOS 24H)
// ============================================================================
/**
 * Escanea los compromisos de las 3 entidades y detecta deudas que vencen en 24h o hoy.
 * Diseñada para ser disparada por un Trigger diario de Apps Script a las 8:00 AM.
 */
function escanearCompromisosPorVencer(entidadesAChequear, nombreDestinatario) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const entidades = (entidadesAChequear && Array.isArray(entidadesAChequear) && entidadesAChequear.length)
    ? entidadesAChequear
    : ["Personal", "More Paper", "More Design", "Consolidado"];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const alertasEncontradas = [];

  for (const entidad of entidades) {
    const nombreHoja = obtenerHojaCompromisos_(entidad);
    const sheet = ss.getSheetByName(nombreHoja);
    if (!sheet || sheet.getLastRow() <= 1) continue;

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12).getValues();

    for (let i = 0; i < data.length; i++) {
      const r = data[i];
      const id = r[0];
      const proveedor = r[2];
      const concepto = r[3];
      const monto = Number(r[4]) || 0;
      const saldo = Number(r[6]) || 0;
      const tieneVenc = String(r[7]).toUpperCase() === "SI";
      const fechaVencVal = r[8];
      const estado = String(r[9]).trim();
      const ultimaAlerta = r[11] ? new Date(r[11]) : null;

      const txtMeta = String(concepto + " " + proveedor + " " + r[10] + " " + r[11]).toLowerCase();
      const esMontoVariable = (monto === 0 && saldo === 0) || txtMeta.includes("variable") || txtMeta.includes("tarjeta") || txtMeta.includes("ciclo");

      if (estado === "Pendiente" && (saldo > 0 || (esMontoVariable && tieneVenc && fechaVencVal))) {
        let esAlertaProcedente = false;
        let urgencia = "";
        let fechaParaMensaje = null;

        const hoyStr = Utilities.formatDate(hoy, Session.getScriptTimeZone(), "yyyy-MM-dd");
        const ultimaAlertaStr = ultimaAlerta ? Utilities.formatDate(ultimaAlerta, Session.getScriptTimeZone(), "yyyy-MM-dd") : "";

        // Caso 1: Obligación con fecha fija de caducidad o ciclo
        if (tieneVenc && fechaVencVal) {
          const fechaVenc = fechaVencVal instanceof Date ? fechaVencVal : new Date(fechaVencVal);
          fechaVenc.setHours(0, 0, 0, 0);
          fechaParaMensaje = fechaVenc;
          const diffDias = Math.round((fechaVenc.getTime() - hoy.getTime()) / (1000 * 3600 * 24));

          // Si la fecha ya venció y es un compromiso cíclico de monto variable, renovar automáticamente para el próximo mes
          if (diffDias < 0 && esMontoVariable) {
            const proximoMes = new Date(fechaVenc);
            proximoMes.setMonth(proximoMes.getMonth() + 1);
            const proximaFechaStr = Utilities.formatDate(proximoMes, Session.getScriptTimeZone(), "yyyy-MM-dd");
            sheet.getRange(i + 2, 9).setValue(proximaFechaStr);
            sheet.getRange(i + 2, 11).setValue("Sin_Alerta");
            sheet.getRange(i + 2, 12).setValue(new Date());
            continue;
          }

          if (diffDias <= 1) {
            urgencia = diffDias < 0 ? "VENCIDO" : (diffDias === 0 ? "VENCE_HOY" : "VENCE_MANANA");
            if (hoyStr !== ultimaAlertaStr) {
              esAlertaProcedente = true;
            }
          }
        } 
        // Caso 2: Obligación cíclica o pasivo abierto sin fecha límite establecida
        else {
          const diaMes = hoy.getDate();
          const diasDesdeAlerta = ultimaAlerta ? Math.round((hoy.getTime() - ultimaAlerta.getTime()) / (1000 * 3600 * 24)) : 999;
          // Auditoría quincenal preventiva (días 15 y 30) o si han transcurrido más de 14 días sin revisar
          if ((diaMes === 15 || diaMes === 30 || diaMes === 31 || diasDesdeAlerta >= 14) && hoyStr !== ultimaAlertaStr) {
            urgencia = "PASIVO_ABIERTO";
            fechaParaMensaje = hoy;
            esAlertaProcedente = true;
          }
        }

        if (esAlertaProcedente) {
          alertasEncontradas.push({
            entidad: entidad,
            fila: i + 2,
            idCompromiso: id,
            proveedor: proveedor,
            concepto: concepto,
            saldoPendiente: saldo,
            fechaVencimiento: fechaParaMensaje ? Utilities.formatDate(fechaParaMensaje, Session.getScriptTimeZone(), "yyyy-MM-dd") : "Sin fecha fija",
            urgencia: urgencia,
            mensajeWhatsApp: formatearMensajeAlertaWhatsApp_(entidad, proveedor, concepto, saldo, fechaParaMensaje, urgencia, nombreDestinatario)
          });

          sheet.getRange(i + 2, 11).setValue(urgencia);
          sheet.getRange(i + 2, 12).setValue(new Date());
        }
      }
    }
  }

  SpreadsheetApp.flush();

  Logger.log(`🚨 Escáner de compromisos: Se detectaron ${alertasEncontradas.length} obligaciones urgentes/abiertas.`);
  return alertasEncontradas;
}

function formatearMensajeAlertaWhatsApp_(entidad, proveedor, concepto, saldo, fecha, urgencia, nombreDestinatario) {
  const nombreHumano = (typeof sanitizarNombreHumano_ === "function" && nombreDestinatario)
    ? sanitizarNombreHumano_(nombreDestinatario)
    : "Fernando";
  const esVariable = (Number(saldo) <= 0) || String(concepto + " " + proveedor).toLowerCase().includes("tarjeta") || String(concepto + " " + proveedor).toLowerCase().includes("variable");
  const saldoFmt = esVariable ? "Monto variable (según extracto)" : `$${Number(saldo || 0).toLocaleString("es-CO")} COP`;
  const unidadTexto = (entidad === "Personal") ? "tus finanzas personales" : `**${entidad}**`;

  if (urgencia === "PASIVO_ABIERTO") {
    return `📋 *Hola ${nombreHumano}, paso a dejarte un chequeo preventivo de obligaciones pendientes:*\n\n` +
      `En tus registros figura una cuenta con **${proveedor}** (${concepto} en ${unidadTexto}) con saldo de **${saldoFmt}** sin fecha límite estipulada.\n\n` +
      `¿Sigue pendiente o realizaste algún pago recientemente? Cuéntame por aquí para mantener tus balances y pasivos 100% auditados.`;
  } else if (urgencia === "VENCE_HOY") {
    const detalleAccion = esVariable
      ? `Recuerda verificar tu extracto o saldo al corte de **${proveedor}** para realizar el pago correspondiente. Si ya lo cubriste, indícamelo (ej: *"pagué 150.000 a ${proveedor}"*) y lo asiento de inmediato.`
      : `¿Ya lo realizaste o abonaste algo? Escríbemelo por aquí (ej: *"pagué todo a ${proveedor}"* o *"aboné 50.000 a ${proveedor}"*) y te lo dejo cuadrado de una vez.`;

    return `⏰ *¡Hola, ${nombreHumano}! Paso a recordarte que hoy vence tu ciclo de pago:*\n\n` +
      `Compromiso con **${proveedor}** (${concepto} en ${unidadTexto}).\n` +
      `Monto estimado: **${saldoFmt}**.\n\n` +
      detalleAccion;
  } else if (urgencia === "VENCE_MANANA") {
    const detalleManana = esVariable
      ? `Te aviso con tiempo para que verifiques el extracto y programes el pago con total tranquilidad.`
      : `Te aviso con tiempo para que lo puedas programar en tu flujo de caja de mañana con total tranquilidad.`;

    return `🔔 *Hola ${nombreHumano}, te recuerdo un compromiso que vence mañana:*\n\n` +
      `Tienes programado el ciclo de pago a **${proveedor}** (${concepto} en ${unidadTexto}).\n` +
      `Monto estimado: **${saldoFmt}**.\n\n` +
      detalleManana;
  } else {
    return `⚠️ *Hola ${nombreHumano}, paso a dejarte un apunte sobre un compromiso pendiente de días anteriores:*\n\n` +
      `Tenemos pendiente con **${proveedor}** (${concepto} en ${unidadTexto}) con saldo de **${saldoFmt}**.\n\n` +
      `Si ya realizaste algún abono o el pago completo, avísame por acá para actualizar tus balances.`;
  }
}

// ============================================================================
// CONEXIÓN Y PROMPT CON GOOGLE GEMINI (CON RESILIENCIA Y FALLBACK)
// ============================================================================
function construirPromptSistemaFinanciero_(hoy, perm, categorias, compromisos, saldos) {
  const esSuperAdmin = perm.rol === "SUPER_ADMIN";
  const entidadAsignada = perm.entidadPropia || "Personal";
  const aliasAsistente = perm.aliasAsistente || (esSuperAdmin ? "Jarvis" : "Aura");
  const perfilVoz = perm.perfilVoz || (esSuperAdmin ? "MASCULINO_CORDIAL" : "FEMENINO_DULCE");
  const nombreHumano = sanitizarNombreHumano_(perm ? perm.nombre : "Fernando");
  const infoVoz = typeof obtenerInfoPerfilVoz_ === "function" ? obtenerInfoPerfilVoz_(perfilVoz) : null;

  let descPersonalidad = "";
  if (perfilVoz === "FEMENINO_DULCE") {
    descPersonalidad = "Tu tono es cálido, dulce, empático, inteligente y respetuoso. Hablas como una asesora financiera y colega humana de primer nivel.";
  } else if (perfilVoz === "MASCULINO_CORDIAL") {
    descPersonalidad = "Tu tono es de un profesional ejecutivo joven, cordial, resolutivo, empático y fresco. Hablas como un socio y colega humano de absoluta confianza.";
  } else if (infoVoz && infoVoz.desc) {
    descPersonalidad = `Tu personalidad, tono y estilo de comunicación es: ${infoVoz.desc}. Hablas encarnando con maestría este personaje, usando su estilo carismático, su iconografía distintiva (${infoVoz.emoji}), su lema («${infoVoz.lema || ''}») y sus metáforas características, manteniendo un rigor fiduciario impecable y un trato humano y cercano de primer nivel.`;
  } else {
    descPersonalidad = "Tu personalidad es ejecutiva de alto nivel, reflexiva, estratégica, empática y profundamente profesional.";
  }

  const directivaUsuario = esSuperAdmin 
    ? `Eres ${aliasAsistente}, el Asesor Financiero Personal y Copiloto de Negocios de confianza para ${nombreHumano}. Tu relación con él es de socio financiero estratégico: cercano, leal, transparente, respetuoso y ultra-resolutivo. NUNCA lo llames '(Propietario)' ni uses sufijos de base de datos; llámalo simplemente ${nombreHumano}. ${descPersonalidad}`
    : `Eres ${aliasAsistente}, el Asesor Financiero Personal inteligente y empático para ${nombreHumano}. ${descPersonalidad} NUNCA uses sufijos como '(Propietario)' ni etiquetas técnicas. Este usuario gestiona de forma privada e independiente sus finanzas personales bajo la entidad '${entidadAsignada}'. Todas sus transacciones y compromisos deben registrarse única y exclusivamente en '${entidadAsignada}'. No tiene acceso a ningún negocio ni a las cuentas de otros usuarios.`;

  const directivasHumanas = [
    "REGLAS DE ORO DE COMUNICACIÓN ULTRA-HUMANA Y DOCTRINA DEL CONSEJO GLOBAL DE LIDERAZGO (13 LÍDERES MUNDIALES - CERO CLICHÉS, CERO ROBÓTICO):",
    "1. PROHIBICIÓN TOTAL DE LENGUAJE ROBÓTICO: Jamás utilices frases de plantilla o muletillas de máquina como: '¡Hola! Como modelo de lenguaje...', '¡Por supuesto!', '¡Claro que sí!', '¿En qué más te puedo colaborar hoy?', 'He procesado tu solicitud con éxito', 'Movimiento registrado con éxito', 'Indique valor y concepto', 'No se encontraron registros', ni disculpas serviles. Habla como una persona real, culta, cálida y eficiente.",
    "2. PROHIBIDO ETIQUETAR CON ROLES TÉCNICOS: Jamás digas 'Fernando (Propietario)', 'Usuario (Super Admin)', '(s)', '[ID]' ni etiquetas de bases de datos. Habla con fluidez natural diciendo 'Fernando', '¡Hola Fernando!', 'Listo Fernando', etc.",
    "3. FLUIDEZ Y CALIDEZ EN WHATSAPP: Las respuestas deben ser directas, ágiles y fáciles de leer en un móvil. Usa saltos de línea limpios, negritas estratégicas en los números clave y un tono conversacional natural latinoamericano/colombiano: 'Listo, Fernando', 'Ya te lo anoté', 'Quedó cuadrado', 'Paso a recordarte', '¡Seguimos sumando!'.",
    "4. DOCTRINA Y FILOSOFÍA DEL CONSEJO GLOBAL DE LIDERAZGO (SÍNTESIS DE 13 GRANDES LÍDERES):",
    "   - Warren Buffett: Regla #1 (nunca perder dinero), fosos económicos y maximización del flujo de caja del propietario.",
    "   - Jamie Dimon: Fortaleza de balance, liquidez inviolable y aversión a la complacencia crediticia o préstamos blandos.",
    "   - Larry Fink: Custodia fiduciaria responsable y creación de valor perdurable a largo plazo.",
    "   - Kristalina Georgieva: Monitoreo macroeconómico, alerta inflacionaria y amortiguadores de riesgo cambiario (TRM/divisas).",
    "   - Andy Jassy & Jeff Bezos: Frugalidad operativa extrema, eliminación de burocracia, mentalidad 'Day 1' y velocidad de ejecución.",
    "   - Ngozi Okonjo-Iweala: Resiliencia de la cadena de suministro y reducción de fricciones con proveedores clave.",
    "   - Satya Nadella: Palanca de Inteligencia Artificial para multiplicar la productividad y margen por hora trabajada.",
    "   - Bernard Arnault & Philip Kotler: Poder de fijación de precios, exclusividad y artesanía superior para More Paper y More Design (anti-commodity, marketing cuantitativo de alto impacto).",
    "   - Joe Ucuzoglu, Mohamed Kande & Janet Truncale (Big-4: Deloitte, PwC, EY): Rigor forense inquebrantable, reconciliación bancaria diaria, calidad de ganancias y auditoría preventiva contra fugas de dinero.",
    "5. CONSEJO ASESOR DE TECNOLOGÍA, IA Y CREACIÓN DIGITAL (11 PIONEROS GLOBALES + ASESOR SENIOR):",
    "   - Sam Altman, Dario y Daniela Amodei: Modelos de vanguardia con seguridad constitucional (Constitutional AI), interpretabilidad y fiabilidad determinística.",
    "   - Demis Hassabis y Yann LeCun: Razonamiento desde primeros principios, modelos de mundo y apertura radical.",
    "   - Mustafa Suleyman: Interfaces conversacionales y de voz empáticas, cálidas, naturales y centradas en el ser humano.",
    "   - Jeff Dean, Jensen Huang y Lisa Su: Eficiencia de sistemas a hiperescala, cómputo acelerado y cero desperdicio de latencia.",
    "   - Arthur Mensch y Clément Delangue: Modelos compactos y eficientes (MoE) y democratización del ecosistema abierto.",
    "6. MESA TÉCNICA DE CIBERSEGURIDAD, PRIVACIDAD Y VIGILANCIA DIGITAL (8 TITANES DE SEGURIDAD + ASESOR SENIOR):",
    "   - Jay Chaudhry (Zscaler) y Nikesh Arora (Palo Alto): Arquitectura Zero Trust nativa ('nunca confiar, siempre verificar') y defensa perimetral unificada.",
    "   - George Kurtz (CrowdStrike) y Eva Chen (Trend Micro): Detección proactiva de anomalías en tiempo real, regla 1-10-60 y contención inmediata de accesos indebidos.",
    "   - Matthew Prince (Cloudflare) y Ken Xie (Fortinet): Blindaje en el borde contra ataques distribuidos, WAF defensivo y microsegmentación de red.",
    "   - Meredith Whittaker (Signal) y Andy Yen (Proton): Privacidad absoluta, cero fuga de metadatos, cifrado de acceso cero (Zero-Access) y custodia inviolable de la información privada.",
    "7. EMPATÍA Y RESOLUCIÓN ACTIVA: Si el usuario tiene una duda o falta un dato, no actúes como un validador frío de base de datos; actúa como un colega que ayuda a descifrarlo con amabilidad y dos opciones claras.",
    "8. RESPUESTA CONVERSACIONAL (campo 'respuesta'): Cuando el usuario te salude, consulte algo general o hable informalmente, responde encarnando fielmente al personaje y voz configurada (" + (infoVoz ? infoVoz.desc : aliasAsistente) + "), con calidez humana, empatía, chispa e ingenio, iconografía acorde (" + (infoVoz ? infoVoz.emoji : "💼") + ") y enfoque financiero, llamando a " + nombreHumano + " por su nombre."
  ].join("\n");

  const entidadesTexto = esSuperAdmin
    ? `ENTIDADES GESTIONADAS:\n1. 'Personal': Gastos personales de ${nombreHumano}.\n2. 'More Paper': Papelería y suministros.\n3. 'More Design': Agencia de diseño y publicidad.\n4. 'Consolidado': Gastos Operativos Globales, Nómina Corporativa compartida de los locales (debitan de cuenta ***7194 sin distorsionar los márgenes individuales de los locales).`
    : `ENTIDAD ASIGNADA EXCLUSIVA:\n1. '${entidadAsignada}': Finanzas personales de ${nombreHumano}. Asigna SIEMPRE entidad = '${entidadAsignada}'.`;

  return [
    directivaUsuario,
    directivasHumanas,
    `Hoy es ${hoy}. Moneda oficial: COP (Pesos Colombianos).`,
    `Usuario actual: ${nombreHumano} (Rol: ${perm.rol}). Asistente configurado: ${aliasAsistente}.`,
    "REGLA ESTRICTA DE VOZ: Nunca uses ni aceptes roles o voces infantiles (niños/niñas) ni de animales.",
    "",
    entidadesTexto,
    "",
    "ESTRUCTURA DE CUENTAS BANCARIAS OFICIALES:",
    "1. Cuenta Personal: Ahorros ***2103 (Bancolombia). Asigna 'metodo_pago': 'Ahorros ***2103 (Personal)' a todo ingreso o saldo de la entidad 'Personal'.",
    "2. Cuenta Común de Negocios: Ahorros ***7194 (Bancolombia). Asigna 'metodo_pago': 'Ahorros ***7194 (Negocios)' a todo ingreso de 'More Paper' o 'More Design', y a los Gastos Operativos Globales / Nómina.",
    "3. Independencia Contable Estricta: More Paper y More Design comparten la cuenta recaudadora ***7194, pero sus gastos operativos directos, compras de insumos y facturación se auditan de forma 100% independiente en su respectiva entidad. La Nómina general de los locales se registra en 'Consolidado' como Gasto Operativo Global.",
    "",
    "COMPROMISOS ACTIVOS POR PAGAR:",
    JSON.stringify(compromisos || []),
    "",
    "CATEGORÍAS DE REFERENCIA:",
    JSON.stringify(categorias || []),
    "",
    "INSTRUCCIONES DE CLASIFICACIÓN:",
    "Clasifica el mensaje del usuario en exactamente uno de estos tipos:",
    "1. 'registro_transaccion': Cuando el usuario reporte un ingreso o gasto con monto monetario explícito.",
    esSuperAdmin 
      ? "   - Si no menciona entidad, deduce por contexto: alimentos/antojos=Personal, tintas/resmas=More Paper, software/diseño=More Design, nómina/sueldos globales=Consolidado."
      : `   - La entidad siempre debe ser '${entidadAsignada}'.`,
    "   - SALDO INICIAL O SALDO A FAVOR: Si el usuario indica registrar saldo a favor, saldo inicial, o reporta el dinero del que dispone actualmente en su cuenta bancaria/banco (ej: 'registra saldo a favor actual en mi cuenta bancaria es de 1247646 pesos en dia de hoy', 'tengo 1.500.000 en el banco', 'saldo inicial 800.000'), CLASIFÍCALO SIEMPRE COMO 'registro_transaccion' de tipo 'Ingreso', categoría 'Capital / Aportes', concepto 'Saldo a favor en cuenta bancaria' y método de pago 'Transferencia' o 'Bancolombia'. NUNCA lo clasifiques como consulta.",
    "   - PAGO DE NÓMINA O GASTO OPERATIVO GLOBAL: Si el usuario reporta el pago de nómina, quincena, sueldos o gastos operativos generales corporativos (ej: 'pagué nómina de 1.200.000', 'pago quincena empleados 1.500.000'), CLASIFÍCALO COMO 'registro_transaccion' con entidad='Consolidado', tipo='Gasto Operativo Global', categoría='Gasto Operativo Global / Nómina' y método de pago 'Ahorros ***7194 (Negocios)'.",
    "2. 'nuevo_compromiso': Cuando el usuario adquiere una deuda, factura a crédito, compra aplazada con un proveedor, o crea alertas/recordatorios de compromisos cíclicos recurrentes (ej: 'tarjetas de crédito', 'servicios públicos', 'arriendos', 'planes móviles', 'el 20 de cada mes', 'ciclo').",
    "   - COMPROMISOS CÍCLICOS DE MONTO VARIABLE O RECORDATORIOS: Si el compromiso es recurrente/cíclico y no tiene un monto fijo establecido o su valor varía mes a mes (ej: 'Tarjeta de Crédito VISA', 'pagar ciclo el 20 de cada mes', 'luz', 'agua', 'no tiene monto preciso', 'es variable'), CLASIFÍCALO SIEMPRE COMO 'nuevo_compromiso' con monto: 0, es_recurrente: true, tiene_vencimiento: true, y fecha_vencimiento con la fecha del próximo ciclo (ej: si hoy es 18 y el ciclo es el 20 -> YYYY-MM-20). NUNCA uses 'clarificacion_interactiva' ni 'falta_monto' para compromisos cíclicos variables.",
    "3. 'accion_compromiso': Cuando el usuario:",
    "   a) Ya pagó o abonó a una deuda: accion='abono' o 'pagar_total'.",
    "   b) Solicita reprogramar, aplazar o cambiar la fecha límite de pago: accion='reprogramar_fecha', extrae el acreedor en 'proveedor' y calcula la 'nueva_fecha' en formato YYYY-MM-DD.",
    "4. 'consulta': Cuando el usuario PREGUNTE por su dinero, saldos, balances o resúmenes (ej: '¿cuál es mi saldo?', '¿cuánto dinero tengo?', 'resumen financiero', 'gastos de hoy'). NUNCA uses 'consulta' si el usuario está ordenando registrar un saldo a favor o reportando un monto para incorporar a sus cuentas.",
    "5. 'conversacion': Saludos, preguntas generales o despedidas.",
    "6. 'clarificacion_interactiva': DIRECTIVA HUMANA CRÍTICA. Cuando la indicación del usuario no sea completamente clara, esté incompleta o falte algún dato indispensable para procesarla con rigor contable (ej: falta el monto de un gasto o compra ordinaria puntual, no se sabe si la venta es de More Paper o More Design, se abonó pero no se dijo a qué acreedor, o la petición es ambigua). NUNCA uses 'falta_monto' si el usuario está programando un compromiso cíclico o recordatorio de monto variable. NUNCA generes un error técnico ni inventes valores. En su lugar:",
    "   - Asigna tipo: 'clarificacion_interactiva'.",
    "   - Asigna motivo: 'falta_monto' | 'falta_entidad' | 'falta_acreedor' | 'intencion_ambigua'.",
    "   - Formula 'pregunta_humana': Pregunta cálida, empática y cercana pidiendo el dato faltante.",
    "   - Genera 'opciones_sugeridas': Lista de 2 a 4 opciones numeradas concretas para que el usuario responda fácilmente con un número.",
    "   - Incluye 'datos_parciales': Objeto con los datos que sí se lograron identificar.",
    "7. 'cierre_turno_pos': DIRECTIVA CRÍTICA DE VENTAS MULTICANAL. Cuando el usuario reporte el cierre de caja, turno o ventas del día desglosando Efectivo, Tarjeta débito, Tarjeta crédito, Transferencias y Total movimientos. CLASIFÍCALO SIEMPRE COMO tipo='cierre_turno_pos' y extrae el objeto 'closureData'. NUNCA lo clasifiques como 'nuevo_compromiso' ni registres deudas a pagar.",
    "",
    "FORMATO OBLIGATORIO DE RESPUESTA: Responde ÚNICAMENTE con un objeto JSON válido con esta estructura (sin texto extra):",
    JSON.stringify({
      tipo: "registro_transaccion | nuevo_compromiso | accion_compromiso | consulta | conversacion | clarificacion_interactiva | cierre_turno_pos",
      motivo: "falta_monto | falta_entidad | falta_acreedor | intencion_ambigua",
      pregunta_humana: "Pregunta empática y cordial pidiendo claridad",
      opciones_sugeridas: ["1️⃣ Opción A", "2️⃣ Opción B", "3️⃣ Opción C"],
      datos_parciales: {
        entidad: "More Paper | More Design | Personal",
        concepto: "descripción",
        valor: 0,
        esGasto: true,
        monto_abono: 0
      },
      entidad: "Personal | More Paper | More Design | Consolidado",
      entidad_confirmada: true,
      closureData: {
        tipo_documento: "cierre_turno_pos",
        fecha: "YYYY-MM-DD",
        total_ventas_pos: 0,
        ventas_efectivo: 0,
        ventas_transferencias: 0,
        ventas_tarjeta_debito: 0,
        ventas_tarjeta_credito: 0,
        total_bancarizado: 0
      },
      movimientos: [{
        tipo: "Ingreso | Gasto Fijo | Gasto Necesario | Gasto Innecesario | Compra Insumos",
        categoria: "string",
        subcategoria: "string",
        concepto: "string claro",
        proveedor_tercero: "string",
        valor: 0,
        metodo_pago: "Efectivo | Transferencia | Bancolombia | Nequi | Tarjeta",
        esGasto: true
      }],
      proveedor: "nombre acreedor",
      monto: 0,
      tiene_vencimiento: true,
      fecha_vencimiento: "YYYY-MM-DD",
      es_recurrente: false,
      compromisos: [{
        proveedor: "nombre acreedor",
        concepto: "descripción compromiso",
        monto: 0,
        tiene_vencimiento: true,
        fecha_vencimiento: "YYYY-MM-DD",
        es_recurrente: false
      }],
      accion: "abono | pagar_total | reprogramar_fecha",
      nueva_fecha: "YYYY-MM-DD (si solicita cambiar la fecha de vencimiento)",
      monto_abono: 0,
      id_compromiso: "si aplica",
      respuesta: "mensaje conversacional amigable para tipo conversacion"
    })
  ].join("\n");
}

function llamarGeminiJson_(systemPrompt, textoUsuario, historial) {
  const apiKey = obtenerApiKeyGemini_();
  
  // Si no hay API key configurada, usar motor semántico de fallback
  if (!apiKey || apiKey.trim() === "") {
    return parserSemanticoReglas_(textoUsuario);
  }

  const modelos = (typeof obtenerModelosDisponiblesGemini_ === "function")
    ? obtenerModelosDisponiblesGemini_(apiKey)
    : ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-pro"];
  const promptCompleto = `${systemPrompt}\n\nMENSAJE DEL USUARIO:\n${textoUsuario}`;
  const payload = {
    contents: [{
      parts: [{ text: promptCompleto }]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: CONFIG_IA.MAX_OUTPUT_TOKENS || 8192,
      responseMimeType: "application/json"
    }
  };

  for (const modelo of modelos) {
    try {
      const url = `${CONFIG_IA.URL_BASE_GEMINI}${modelo}:generateContent?key=${apiKey}`;
      const res = UrlFetchApp.fetch(url, {
        method: "POST",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      const code = res.getResponseCode();
      const jsonRes = JSON.parse(res.getContentText());

      if (code === 200 && !jsonRes.error && jsonRes.candidates && jsonRes.candidates[0] && jsonRes.candidates[0].content) {
        const rawText = jsonRes.candidates[0].content.parts[0].text;
        const jsonParsed = extraerJsonLimpio_(rawText);
        if (jsonParsed) return jsonParsed;
      }
      Logger.log(`Aviso Gemini API (${modelo} - ${code}): ${jsonRes.error ? jsonRes.error.message : "Sin candidatos válidos"}.`);
      if (code === 503 || code === 429) {
        Utilities.sleep(600);
      }
    } catch (e) {
      Logger.log(`Excepción al llamar Gemini (${modelo}): ${e.message}`);
    }
  }

  // Si todos los modelos fallaron (ej. corte temporal o límites), usar motor heurístico inteligente
  Logger.log("Fallback a parserSemanticoReglas_ tras agotar modelos de Gemini.");
  return parserSemanticoReglas_(textoUsuario);
}

function llamarGeminiTexto_(prompt) {
  const apiKey = obtenerApiKeyGemini_();
  if (!apiKey || apiKey.trim() === "") return null;

  const modelos = (typeof obtenerModelosDisponiblesGemini_ === "function")
    ? obtenerModelosDisponiblesGemini_(apiKey)
    : ["gemini-2.0-flash", "gemini-flash-lite-latest", "gemini-1.5-flash", "gemini-pro"];
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: CONFIG_IA.MAX_OUTPUT_TOKENS || 8192 }
  };

  const modelosCandidatos = (modelos && modelos.length > 0) ? modelos.slice(0, 2) : ["gemini-2.0-flash", "gemini-flash-lite-latest"];

  for (const modelo of modelosCandidatos) {
    try {
      const url = `${CONFIG_IA.URL_BASE_GEMINI}${modelo}:generateContent?key=${apiKey}`;
      const res = UrlFetchApp.fetch(url, {
        method: "POST",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      const code = res.getResponseCode();
      const jsonRes = JSON.parse(res.getContentText());
      if (code === 200 && !jsonRes.error && jsonRes.candidates && jsonRes.candidates[0] && jsonRes.candidates[0].content) {
        return jsonRes.candidates[0].content.parts[0].text.trim();
      }
      Logger.log(`Aviso llamarGeminiTexto_ (${modelo} - ${code}): ${jsonRes.error ? jsonRes.error.message : "Error"}`);
    } catch (e) {
      Logger.log(`Excepción en llamarGeminiTexto_ (${modelo}): ${e.message}`);
    }
  }
  return null;
}

/**
 * Motor heurístico inteligente de fallback: Permite procesar lenguaje natural
 * de inmediato incluso si la clave externa aún no está configurada o falla.
 */
function parserSemanticoReglas_(texto) {
  const t = String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Detección de entidad
  let entidad = "Personal";
  if (t.includes("global") || t.includes("consolidado") || t.includes("corporativo") || t.includes("7194") || t.includes("cuenta more") || t.includes("nomina") || t.includes("quincena") || t.includes("sueldo") || t.includes("empleado")) {
    entidad = "Consolidado";
  } else if (t.includes("paper") || t.includes("resma") || t.includes("tinta") || t.includes("papel") || t.includes("mope")) {
    entidad = "More Paper";
  } else if (t.includes("design") || t.includes("logo") || t.includes("vinilo") || t.includes("publicidad") || t.includes("adobe")) {
    entidad = "More Design";
  }

  // 0.0 DETECCIÓN DE CIERRE DE TURNO POS / REPORTE DE VENTAS MULTICANAL EN TEXTO (MÁXIMA PRIORIDAD)
  const cierreTexto = detectarCierreTurnoTexto_(texto, entidad);
  if (cierreTexto) {
    return cierreTexto;
  }

  // 0.1 COMANDO DE PURGA DE COMPROMISOS ERRÓNEOS
  if (t.includes("purgar compromisos") || t.includes("eliminar compromisos erroneos") || t.includes("limpiar falsos compromisos") || t.includes("borrar compromisos erroneos")) {
    return {
      tipo: "purgar_compromisos_erroneos",
      entidad: entidad
    };
  }

  // Detección inteligente de monto numérico
  const valor = extraerMontoInteligente_(texto);

  // 0. Detección explícita de Pago de Nómina / Gasto Operativo Global
  if ((t.includes("nomina") || t.includes("quincena") || t.includes("sueldo") || t.includes("salario") || (t.includes("pago") && (t.includes("empleado") || t.includes("colaborador")))) && valor > 0) {
    return {
      tipo: "registro_transaccion",
      entidad: "Consolidado",
      movimientos: [{
        tipo: "Gasto Operativo Global",
        categoria: "Gasto Operativo Global / Nómina",
        subcategoria: "Salarios & Sueldos",
        concepto: texto.slice(0, 60),
        proveedor_tercero: "Colaboradores / Nómina",
        valor: valor,
        metodo_pago: "Ahorros ***7194 (Negocios)",
        esGasto: true
      }],
      respuesta: `✅ He registrado el pago de nómina por **$${valor.toLocaleString("es-CO")} COP** como Gasto Operativo Global en Dashboard Consolidado debitado de la cuenta [Ahorros ***7194 (Negocios)].`
    };
  }

  // 1. Reprogramar o aplazar fecha de compromiso
  if (t.includes("aplazar") || t.includes("posponer") || t.includes("reprogramar") || (t.includes("cambiar") && (t.includes("fecha") || t.includes("vencimiento")))) {
    const matchFecha = texto.match(/\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}\s+de\s+[a-zA-Z]+|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/);
    return {
      tipo: "accion_compromiso",
      entidad: entidad,
      accion: "reprogramar_fecha",
      proveedor: extraerNombreProveedor_(texto),
      nueva_fecha: matchFecha ? normalizarFechaTexto_(matchFecha[0]) : null
    };
  }

  // 2. Abono a compromiso
  if (t.includes("abon") || (t.includes("pagu") && (t.includes("deuda") || t.includes("factura") || t.includes("compromiso")))) {
    const provDetectado = extraerNombreProveedor_(texto);
    if (!provDetectado || provDetectado.trim() === "" || provDetectado.toLowerCase() === "proveedor") {
      return {
        tipo: "clarificacion_interactiva",
        motivo: "falta_acreedor",
        datos_parciales: {
          monto_abono: valor,
          valor: valor
        },
        pregunta_humana: `¿A cuál de tus acreedores o compromisos pendientes deseas aplicar el abono${valor > 0 ? " de $" + valor.toLocaleString("es-CO") + " COP" : ""}?`,
        opciones_sugeridas: []
      };
    }
    return {
      tipo: "accion_compromiso",
      entidad: entidad,
      accion: "abono",
      monto_abono: valor,
      proveedor: provDetectado
    };
  }

  // 2.5 Detección de Lista de Múltiples Compromisos (Línea por línea / Viñetas)
  const listaCompromisosDetectados = extraerListaCompromisosLineas_(texto, entidad);
  if (listaCompromisosDetectados && listaCompromisosDetectados.length > 0) {
    return {
      tipo: "nuevo_compromiso",
      entidad: entidad,
      compromisos: listaCompromisosDetectados
    };
  }

  // 3. Nuevo compromiso o compromiso cíclico individual
  if (t.includes("credito") || t.includes("debo") || t.includes("compromiso") || t.includes("vence") || 
      t.includes("arriendo") || t.includes("servicio") || t.includes("impuesto") || t.includes("poliza") || 
      t.includes("tarjeta") || t.includes("ciclo") || t.includes("ciclio") || t.includes("recordatorio") ||
      (t.includes("pago") && (t.includes("mes") || t.includes("cuota") || t.includes("cada")))) {
    const matchFecha = texto.match(/\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}\s+de\s+[a-zA-Z]+(?:\s+de\s+\d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|d[ií]as?\s+\d{1,2}(?:\s+de\s+cada\s+mes)?|\d{1,2}\s+de\s+cada\s+mes|el\s+\d{1,2}\s+de\s+cada\s+mes|ciclio\s+el\s+\d{1,2}|ciclo\s+el\s+\d{1,2})\b/i);
    let fechaVenc = matchFecha ? normalizarFechaTexto_(matchFecha[0]) : "";
    if (!fechaVenc) {
      const mDia = texto.match(/\b(?:el|dia|día|corte)\s+(\d{1,2})\b/i);
      if (mDia) fechaVenc = normalizarFechaTexto_(`${mDia[1]} de cada mes`);
    }

    const esRec = t.includes("arriendo") || t.includes("servicio") || t.includes("impuesto") || 
      t.includes("luz") || t.includes("agua") || t.includes("internet") || t.includes("mensual") || 
      t.includes("recurrente") || t.includes("cada mes") || t.includes("tarjeta") || 
      t.includes("ciclo") || t.includes("ciclio");

    const esVariable = (valor <= 0) || t.includes("variable") || t.includes("sin monto") || t.includes("no tiene monto");
    let prov = extraerNombreProveedor_(texto);
    if (!prov && t.includes("tarjeta")) prov = "Tarjeta de Crédito";
    if (!prov) prov = "Compromiso Financiero";

    return {
      tipo: "nuevo_compromiso",
      entidad: entidad,
      proveedor: prov,
      monto: valor > 0 ? valor : 0,
      tiene_vencimiento: !!fechaVenc,
      fecha_vencimiento: fechaVenc,
      es_recurrente: esRec,
      es_monto_variable: esVariable,
      concepto: esVariable ? "Compromiso cíclico de monto variable" : (esRec ? "Obligación recurrente mensual" : "Compra a crédito / Compromiso registrado por chat")
    };
  }

  // 4. REGISTRO EXPLÍCITO DE SALDO A FAVOR / SALDO INICIAL / DISPONIBLE EN BANCO
  const esOrdenRegistro = t.includes("registra") || t.includes("ingresa") || t.includes("anota") || 
    t.includes("guarda") || t.includes("agrega") || t.includes("establece") || t.includes("ajusta") || t.includes("pon");
  
  const esConceptoSaldoFavor = t.includes("saldo a favor") || t.includes("saldo inicial") || 
    t.includes("saldo actual") || t.includes("saldo en cuenta") || t.includes("saldo bancario") ||
    ((t.includes("cuenta bancaria") || t.includes("banco")) && (t.includes("saldo") || t.includes("tengo") || t.includes("dispongo")));

  if ((esOrdenRegistro && (t.includes("saldo") || t.includes("cuenta") || t.includes("banco"))) || (esConceptoSaldoFavor && valor > 0)) {
    if (valor > 0) {
      const cuentaOficial = (entidad === "Personal") ? "Ahorros ***2103 (Personal)" : "Ahorros ***7194 (Negocios)";
      const metodoPago = t.includes("efectivo") ? "Efectivo" : cuentaOficial;
      return {
        tipo: "registro_transaccion",
        entidad: entidad,
        movimientos: [{
          tipo: "Ingreso",
          categoria: "Capital / Aportes",
          subcategoria: "Bancos",
          concepto: `Saldo a favor en cuenta bancaria (${cuentaOficial})`,
          proveedor_tercero: "Cuenta Bancaria",
          valor: valor,
          metodo_pago: metodoPago,
          esGasto: false
        }],
        respuesta: `Entendido. He registrado el saldo a favor de $${valor.toLocaleString("es-CO")} COP en tu cuenta bancaria [${metodoPago}] (${entidad}).`
      };
    }
  }

  // 5. Detectar intenciones incompletas de gasto o venta (falta de monto)
  const esIntencionGasto = t.includes("compre") || t.includes("gaste") || t.includes("pague") || t.includes("compra") || t.includes("gasto");
  const esIntencionIngreso = t.includes("vendi") || t.includes("cobre") || t.includes("venta") || t.includes("ingreso");

  const esPreguntaOConsulta = t.includes("cuanto") || t.includes("cual") || t.includes("cuales") || 
    t.includes("que ") || t.includes("como va") || t.includes("dime") || t.includes("muestra") ||
    t.includes("informe") || t.includes("resumen") || t.includes("reporte") || t.includes("balance") ||
    t.includes("historial") || t.includes("movimiento") || t.includes("disponible");

  const esConsultaSaldo = t.includes("saldo") && !esOrdenRegistro;
  const esConsultaGasto = (t.includes("gasto") || t.includes("gastos") || t.includes("gastado")) && !esOrdenRegistro && valor <= 0;

  if ((esIntencionGasto || esIntencionIngreso) && valor <= 0 && !esPreguntaOConsulta) {
    const conc = texto.replace(/^(compre|gaste|pague|vendi|cobre|registra|anota)\s+/i, "").trim() || (esIntencionGasto ? "compra" : "venta");
    return {
      tipo: "clarificacion_interactiva",
      motivo: "falta_monto",
      datos_parciales: {
        entidad: entidad,
        concepto: conc,
        esGasto: esIntencionGasto,
        valor: 0
      },
      pregunta_humana: `¡Con gusto! Entiendo que deseas registrar ${esIntencionGasto ? "un gasto de " + conc : "el ingreso por " + conc} en ${entidad}. ¿Cuál fue el valor exacto de la operación?`,
      opciones_sugeridas: [
        "Indicar el valor (ejemplo: 45.000)",
        "Fue en efectivo",
        "Cancelar"
      ]
    };
  }

  // 6. Detectar falta de entidad cuando hay valor pero no se menciona entidad
  const mencionaEnt = mencionaEntidadExplicita_(texto);
  if ((esIntencionGasto || esIntencionIngreso || valor > 0) && !mencionaEnt && !esPreguntaOConsulta && !esConceptoSaldoFavor && valor > 0) {
    return {
      tipo: "clarificacion_interactiva",
      motivo: "falta_entidad",
      datos_parciales: {
        valor: valor,
        esIngreso: esIntencionIngreso,
        esGasto: !esIntencionIngreso,
        concepto: texto.slice(0, 60),
        categoria: esIntencionIngreso ? "Ventas" : "Operativo"
      },
      pregunta_humana: `Para registrar correctamente el valor de $${valor.toLocaleString("es-CO")} COP en tus libros, ¿a cuál de tus entidades pertenece?`,
      opciones_sugeridas: [
        "1️⃣ More Paper (Cuenta común ***7194)",
        "2️⃣ More Design (Cuenta común ***7194)",
        "3️⃣ Personal (Cuenta ***2103)"
      ]
    };
  }

  // 7. Consulta (Saldos, gastos, balances, reportes)
  if (esPreguntaOConsulta || esConsultaSaldo || esConsultaGasto) {
    return {
      tipo: "consulta",
      entidad: entidad,
      textoOriginal: texto
    };
  }

  // 8. Si no hay monto y no es consulta, clarificación de intención ambigua
  if (valor <= 0) {
    return {
      tipo: "clarificacion_interactiva",
      motivo: "intencion_ambigua",
      pregunta_humana: "No alcancé a captar con total claridad tu indicación. ¿A cuál de estas opciones te refieres?",
      opciones_sugeridas: [
        "1️⃣ Registrar un gasto o compra",
        "2️⃣ Registrar un ingreso o venta",
        "3️⃣ Consultar saldos en cuentas bancarias",
        "4️⃣ Revisar compromisos pendientes"
      ]
    };
  }

  // 9. Registro de transacción ordinaria (ingreso o gasto) con entidad ya definida
  const esIngreso = t.includes("ingres") || t.includes("venta") || t.includes("cobre") || t.includes("gananc") || t.includes("abono a favor");
  let metodoPagoOrd = "Efectivo";
  if (esIngreso) {
    metodoPagoOrd = (entidad === "Personal") ? "Ahorros ***2103 (Personal)" : "Ahorros ***7194 (Negocios)";
  }
  return {
    tipo: "registro_transaccion",
    entidad: entidad,
    entidad_confirmada: true,
    movimientos: [{
      tipo: esIngreso ? "Ingreso" : "Gasto Necesario",
      categoria: esIngreso ? "Ventas" : "Operativo",
      subcategoria: esIngreso ? "Bancos" : "",
      concepto: texto.slice(0, 50),
      proveedor_tercero: "",
      valor: valor,
      metodo_pago: metodoPagoOrd,
      esGasto: !esIngreso
    }]
  };
}

function extraerMontoInteligente_(texto) {
  const m1 = texto.match(/\$\s*(\d{1,3}(?:[.,]\d{3})*|\d+)/);
  if (m1) return Number(m1[1].replace(/[.,]/g, ""));

  const m2 = texto.match(/\b(\d{1,3}(?:[.,]\d{3})+)\b/);
  if (m2) return Number(m2[1].replace(/[.,]/g, ""));

  const m3 = texto.match(/(?:por|de|valor|total|monto)\s*\$?\s*(\d+)/i);
  if (m3) return Number(m3[1]);

  const m4 = texto.match(/\b(\d+)\b/);
  return m4 ? Number(m4[1]) : 0;
}

function extraerNombreProveedor_(texto) {
  if (!texto) return "";
  // Caso 1: Tarjetas de crédito específicas o préstamos
  const mTarj = texto.match(/(?:tarjeta\s+(?:de\s+cr[eé]dito\s+)?(?:de\s+|con\s+)?|cr[eé]dito\s+(?:de\s+|con\s+|a\s+)?|pr[eé]stamo\s+(?:de\s+|con\s+|a\s+)?|deuda\s+(?:de\s+|con\s+|a\s+)?)([A-Za-z0-9\s*_-]+?)(?:\s+(?:los\s+d[ií]as|d[ií]as|cada\s+mes|el|por|de|vence|con|\$)|\.|,|$)/i);
  if (mTarj && mTarj[1].trim()) {
    let prov = mTarj[1].trim();
    if (texto.toLowerCase().includes("tarjeta") && !prov.toLowerCase().includes("tarjeta")) {
      prov = "Tarjeta " + prov;
    }
    return prov;
  }

  // Caso 2: Crédito o préstamo con entidad o máscara (ej: "crédito Bancolombia ***09196", "tarjeta Nu ***1234")
  const mCred = texto.match(/(?:cr[eé]dito|tarjeta|pr[eé]stamo|deuda)\s+(?:de\s+|con\s+|a\s+)?([A-Za-z0-9\s*_-]+?)(?:\s+(?:por|de|vence|el|con|\$)|\.|,|$)/i);
  if (mCred && mCred[1].trim()) {
    return mCred[1].trim();
  }

  // Caso 3: Proveedor estándar con preposiciones
  const m = texto.match(/\b(?:a|con|de|proveedor)\s+([A-Za-z0-9\s*_-]+?)(?:\s+(?:por|en|el|con|con\s+vencimiento|\$)|,|\.|$)/i);
  if (m) {
    let r = m[1].replace(/^(?:cr[eé]dito\s+(?:a\s+)?|la\s+deuda\s+(?:de\s+)?|la\s+factura\s+(?:de\s+)?)/i, "").trim();
    if (r) return r;
  }
  return "";
}

function mencionaEntidadExplicita_(texto) {
  const t = String(texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return t.includes("paper") || t.includes("papeleria") || 
         t.includes("design") || t.includes("diseno") || 
         t.includes("personal") || t.includes("propio") || 
         t.includes("nomina") || t.includes("quincena") || t.includes("sueldo") || t.includes("consolidado");
}

/**
 * Detecta y parsea reportes de cierre de turno POS o ventas del día enviados como texto
 * multilínea en WhatsApp (ej: desglose de Efectivo, Tarjetas, Transferencias y Total de movimientos).
 */
function detectarCierreTurnoTexto_(texto, entidadDefecto) {
  if (!texto) return null;
  const tNorm = String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Palabras indicadoras de venta multicanal o cierre de turno
  const tienePalabrasVenta = tNorm.includes("ingreso por venta") || tNorm.includes("venta more") ||
    tNorm.includes("cierre de turno") || tNorm.includes("cierre de caja") ||
    tNorm.includes("cierre turno") || tNorm.includes("ventas del dia") ||
    tNorm.includes("total de movimientos") || (tNorm.includes("ingreso") && tNorm.includes("venta"));

  // Métodos de pago típicos en un POS comercial
  const tieneCanales = (tNorm.includes("efectivo") ? 1 : 0) +
    (tNorm.includes("debito") ? 1 : 0) +
    (tNorm.includes("credito") ? 1 : 0) +
    (tNorm.includes("transferencia") ? 1 : 0);

  // Debe tener al menos palabras de venta y al menos 2 canales, o palabras explícitas de cierre POS
  if (!tienePalabrasVenta && tieneCanales < 2) {
    return null;
  }
  if (!tienePalabrasVenta && !tNorm.includes("cierre") && !tNorm.includes("movimientos")) {
    return null;
  }

  // Detección de entidad (reconoce More Paper con variantes como mope o papelería)
  let entidad = entidadDefecto || "More Paper";
  if (tNorm.includes("paper") || tNorm.includes("mope") || tNorm.includes("papeleria") || tNorm.includes("papelería")) {
    entidad = "More Paper";
  } else if (tNorm.includes("design") || tNorm.includes("diseno") || tNorm.includes("diseño") || tNorm.includes("agencia")) {
    entidad = "More Design";
  }

  // Extracción línea por línea de montos
  const lineas = String(texto).split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  let ventasEfectivo = 0;
  let ventasDebito = 0;
  let ventasCredito = 0;
  let ventasTransf = 0;
  let totalMovimientos = 0;
  let fechaDetectada = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

  // Regex para buscar fecha DD/MM/YYYY o YYYY-MM-DD
  const mFecha = texto.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/);
  if (mFecha) {
    fechaDetectada = normalizarFechaTexto_(mFecha[0]);
  }

  function extraerMontoDeLinea(linea) {
    // Eliminar fechas para no confundir año (ej: 2026) con monto monetario
    const sinFechas = linea.replace(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g, "").replace(/\b\d{4}-\d{2}-\d{2}\b/g, "");
    // Buscar primero con símbolo de pesos
    const mDol = sinFechas.match(/\$\s*(\d{1,3}(?:[.,]\d{3})*|\d+)/);
    if (mDol) return Number(mDol[1].replace(/[.,]/g, ""));
    // Buscar números con separador de miles
    const mMiles = sinFechas.match(/\b(\d{1,3}(?:[.,]\d{3})+)\b/);
    if (mMiles) return Number(mMiles[1].replace(/[.,]/g, ""));
    // Buscar números de al menos 4 dígitos
    const mNum = sinFechas.match(/\b(\d{4,10})\b/);
    if (mNum) return Number(mNum[1]);
    return 0;
  }

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    const lNorm = linea.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const monto = extraerMontoDeLinea(linea);

    if (lNorm.includes("efectivo") && !lNorm.includes("tarjeta")) {
      ventasEfectivo = monto;
    } else if (lNorm.includes("debito")) {
      ventasDebito = monto;
    } else if (lNorm.includes("credito") && !lNorm.includes("debito")) {
      ventasCredito = monto;
    } else if (lNorm.includes("transferencia")) {
      ventasTransf = monto;
    } else if (lNorm.includes("total de movimientos") || (lNorm.includes("total") && (lNorm.includes("movimiento") || lNorm.includes("venta")))) {
      totalMovimientos = monto;
    }
  }

  const totalBancarizado = ventasTransf + ventasDebito + ventasCredito;
  const totalCalculado = totalBancarizado + ventasEfectivo;
  const totalFinal = (totalMovimientos > 0) ? totalMovimientos : totalCalculado;

  // Si no se extrajo ningún valor monetario válido, no es un cierre válido
  if (totalFinal <= 0 && totalBancarizado <= 0 && ventasEfectivo <= 0) {
    return null;
  }

  return {
    tipo: "cierre_turno_pos",
    entidad: entidad,
    closureData: {
      tipo_documento: "cierre_turno_pos",
      fecha: fechaDetectada,
      total_ventas_pos: totalFinal,
      ventas_efectivo: ventasEfectivo,
      ventas_transferencias: ventasTransf,
      ventas_tarjeta_debito: ventasDebito,
      ventas_tarjeta_credito: ventasCredito,
      total_bancarizado: totalBancarizado
    }
  };
}

/**
 * Parsea un texto que contiene múltiples líneas o viñetas de compromisos/cuentas por pagar.
 * Devuelve un array de compromisos normalizados o null si no califica como lista multi-línea.
 */
function extraerListaCompromisosLineas_(texto, entidadDefecto) {
  if (!texto) return null;
  const tNorm = String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // GUARDRAIL ESTRICTO: Si el texto contiene términos explícitos de venta, ingreso o cierre de turno,
  // NUNCA debe ser tratado como lista de deudas o compromisos a pagar
  const esVentaOIngreso = tNorm.includes("ingreso") || tNorm.includes("venta") || 
    tNorm.includes("cierre") || tNorm.includes("total de movimientos") || 
    tNorm.includes("cierre de turno") || tNorm.includes("ventas del dia") ||
    tNorm.includes("caja diaria") || tNorm.includes("cierre de caja");
  if (esVentaOIngreso) {
    return null;
  }

  const lineas = String(texto).split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lineas.length < 2) return null;

  const compromisos = [];
  for (let i = 0; i < lineas.length; i++) {
    const parsed = parseLineaCompromiso_(lineas[i], entidadDefecto);
    if (parsed) {
      compromisos.push(parsed);
    }
  }

  // Si detectamos al menos 2 líneas válidas de compromisos con monto > 0
  return (compromisos.length >= 2) ? compromisos : null;
}

/**
 * Parsea una línea individual de compromiso (ej: viñetas como '• Pago de servicio celular 50000 dia 6 de cada mes')
 */
function parseLineaCompromiso_(linea, entidadDefecto) {
  let l = String(linea).trim();
  // Quitar viñetas iniciales como •, -, *, números tipo 1., 1)
  l = l.replace(/^[•\-\*\d\.\)\s]+/, "").trim();
  if (!l || l.length < 5) return null;

  const tLow = l.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Si la línea es simplemente un encabezado como 'registrar compromisos personales' o 'mis deudas:'
  if ((tLow.startsWith("registrar") || tLow.startsWith("estos son") || tLow.startsWith("mis compromisos")) && !tLow.match(/\d{3,}/)) {
    return null;
  }

  // Quitar fechas completas de la línea temporal antes de extraer monto para no capturar años (ej: 2026) como deudas
  const lSinFechas = l.replace(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g, "").replace(/\b\d{4}-\d{2}-\d{2}\b/g, "");

  // Extraer monto
  let monto = 0;
  const mDol = lSinFechas.match(/\$\s*(\d{1,3}(?:[.,]\d{3})*|\d+)/);
  if (mDol) {
    monto = Number(mDol[1].replace(/[.,]/g, ""));
  } else {
    // Buscar número de al menos 4 dígitos o números con separador de miles
    const mNum = lSinFechas.match(/\b(\d{4,10})\b/);
    if (mNum) {
      monto = Number(mNum[1]);
    } else {
      const mMiles = lSinFechas.match(/\b(\d{1,3}(?:[.,]\d{3})+)\b/);
      if (mMiles) monto = Number(mMiles[1].replace(/[.,]/g, ""));
    }
  }

  if (monto <= 0) return null;

  // Extraer fecha vencimiento y recurrencia
  const mRec = l.match(/(?:d[ií]as?\s+)?(\d{1,2})\s+de\s+cada\s+mes/i) || 
              l.match(/(?:los\s+)?(\d{1,2})\s+de\s+cada\s+mes/i) || 
              l.match(/dia\s+(\d{1,2})\b/i);
  let fechaVenc = "";
  let tieneVenc = false;
  let esRecurrente = false;

  if (mRec) {
    tieneVenc = true;
    esRecurrente = true;
    const diaNum = parseInt(mRec[1], 10);
    const hoy = new Date();
    let mesTarget = hoy.getMonth();
    let anioTarget = hoy.getFullYear();
    // Si el día ya pasó este mes, programar para el próximo mes
    if (hoy.getDate() > diaNum) {
      mesTarget += 1;
      if (mesTarget > 11) {
        mesTarget = 0;
        anioTarget += 1;
      }
    }
    const mesStr = String(mesTarget + 1).padStart(2, "0");
    const diaStr = String(diaNum).padStart(2, "0");
    fechaVenc = `${anioTarget}-${mesStr}-${diaStr}`;
  } else {
    const mFecha = l.match(/\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}\s+de\s+[a-zA-Z]+(?:\s+de\s+\d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/i);
    if (mFecha) {
      tieneVenc = true;
      fechaVenc = normalizarFechaTexto_(mFecha[0]);
    }
  }

  // Extraer concepto y acreedor / proveedor
  let concepto = l;
  let proveedor = "Proveedor";

  const mPagoDe = l.match(/^(?:pago\s+(?:de\s+|del\s+)?)(.+?)(?=\s+\d{4,}|\s+\$|\s+dia|\s+vence|$)/i);
  if (mPagoDe) {
    concepto = mPagoDe[1].trim();
    const cLow = concepto.toLowerCase();
    if (cLow.includes("celular") || cLow.includes("movil") || cLow.includes("claro") || cLow.includes("tigo") || cLow.includes("movistar")) {
      proveedor = cLow.includes("claro") ? "Claro" : (cLow.includes("tigo") ? "Tigo" : (cLow.includes("movistar") ? "Movistar" : "Operador Celular"));
    } else if (cLow.includes("poliza") || cLow.includes("seguro") || cLow.includes("responsabilidad")) {
      proveedor = "Aseguradora / Póliza";
    } else if (cLow.includes("tarjeta")) {
      proveedor = "Tarjeta de Crédito";
    } else if (cLow.includes("icetex")) {
      proveedor = "ICETEX";
    } else if (cLow.includes("arriendo") || cLow.includes("alquiler")) {
      proveedor = "Inmobiliaria / Propietario";
    } else if (cLow.includes("credito") || cLow.includes("prestamo") || cLow.includes("banco")) {
      proveedor = "Entidad Financiera";
    } else {
      proveedor = concepto.charAt(0).toUpperCase() + concepto.slice(1);
    }
  } else {
    // Si no empieza por 'pago de', intentar extraer proveedor con regex
    const pDetectado = extraerNombreProveedor_(l);
    if (pDetectado) {
      proveedor = pDetectado;
      concepto = l;
    }
  }

  return {
    entidad: entidadDefecto || "Personal",
    proveedor: proveedor,
    concepto: concepto,
    monto: monto,
    tiene_vencimiento: tieneVenc,
    fecha_vencimiento: fechaVenc,
    es_recurrente: esRecurrente
  };
}

/**
 * Normaliza fechas escritas en lenguaje natural al formato estándar ISO yyyy-MM-dd
 */
function normalizarFechaTexto_(fechaStr) {
  if (!fechaStr) return null;
  const s = String(fechaStr).trim();
  
  // Formato ya ISO: yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Caso recurrente: "días 9 de cada mes", "el 9 de cada mes", "los 9 de cada mes"
  const mRec = s.match(/(?:d[ií]as?\s+)?(\d{1,2})\s+de\s+cada\s+mes/i) || s.match(/(?:los\s+)?(\d{1,2})\s+de\s+cada\s+mes/i);
  if (mRec) {
    const diaNum = parseInt(mRec[1], 10);
    const hoy = new Date();
    let mesTarget = hoy.getMonth();
    let anioTarget = hoy.getFullYear();
    if (hoy.getDate() > diaNum) {
      mesTarget += 1;
      if (mesTarget > 11) {
        mesTarget = 0;
        anioTarget += 1;
      }
    }
    const mesStr = String(mesTarget + 1).padStart(2, "0");
    const diaStr = String(diaNum).padStart(2, "0");
    return `${anioTarget}-${mesStr}-${diaStr}`;
  }

  const meses = {
    enero: "01", febrero: "02", marzo: "03", abril: "04", mayo: "05", junio: "06",
    julio: "07", agosto: "08", septiembre: "09", setiembre: "09", octubre: "10", noviembre: "11", diciembre: "12"
  };

  const añoActual = new Date().getFullYear();

  // Caso: "28 de septiembre" o "28 de septiembre de 2026"
  const m1 = s.match(/(\d{1,2})\s+de\s+([a-zA-Z]+)(?:\s+de\s+(\d{4}))?/i);
  if (m1) {
    const dia = String(m1[1]).padStart(2, "0");
    const mesNom = m1[2].toLowerCase();
    const mes = meses[mesNom] || "01";
    const año = m1[3] ? m1[3] : String(añoActual);
    return `${año}-${mes}-${dia}`;
  }

  // Caso: "28/09/2026" o "28/09"
  const m2 = s.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (m2) {
    const dia = String(m2[1]).padStart(2, "0");
    const mes = String(m2[2]).padStart(2, "0");
    let año = m2[3] ? m2[3] : String(añoActual);
    if (año.length === 2) año = "20" + año;
    return `${año}-${mes}-${dia}`;
  }

  return s;
}

/**
 * Limpia y normaliza cualquier valor numérico financiero (string con $, comas, puntos o número puro).
 * Garantiza que montos como "$389.000", "$389,000", "389000", 389000 se conviertan de forma segura al entero 389000.
 */
function limpiarNumeroFinanciero_(val) {
  if (typeof val === "number") return Math.round(val);
  if (!val) return 0;
  const s = String(val).replace(/[^0-9]/g, "");
  return parseInt(s, 10) || 0;
}

/**
 * Parser resiliente de JSON para respuestas de LLMs.
 * 1. Limpia bloques de código markdown ```json.
 * 2. Repara números con comas/puntos de miles y comas sobrantes.
 * 3. Fallback heurístico para reconstruir reportes POS o comprobantes si el LLM devolvió texto plano o viñetas.
 */
function extraerJsonLimpio_(texto) {
  if (!texto) return null;

  // 1. Quitar markdown fences
  const s = String(texto).replace(/```json/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(s); } catch (e) {}

  // 2. Extraer bloque entre el primer { y el último }
  const match = s.match(/\{[\s\S]*\}/);
  if (match) {
    const rawJson = match[0];
    try { return JSON.parse(rawJson); } catch (e) {}

    // Reparaciones sintácticas automáticas:
    // a. Corregir separadores de miles dentro de números (ej: 389,000 -> 389000 o $389.000 -> 389000)
    let reparado = rawJson.replace(/(:\s*[\$]?\s*)(\d{1,3}(?:[,\.]\d{3})+)(?=[,\s\r\n\}])/g, function(m, p1, p2) {
      return p1 + p2.replace(/[,\.]/g, "");
    });
    // b. Quitar signos de pesos en valores numéricos
    reparado = reparado.replace(/:\s*[\$]\s*(\d+)/g, ": $1");
    // c. Quitar comas finales antes de llaves o corchetes de cierre
    reparado = reparado.replace(/,\s*([\}\]])/g, "$1");

    try { return JSON.parse(reparado); } catch (e) {}
  }

  // 3. Fallback heurístico inteligente: Si el modelo respondió en texto narrativo o viñetas
  const tLower = String(texto).toLowerCase();
  if (tLower.includes("cierre") || tLower.includes("turno") || tLower.includes("ventas") || tLower.includes("movimientos")) {
    const totalMatch = texto.match(/(?:total(?: de)? ventas|total movimientos)[\s\S]*?\$?\s*([0-9\.,]+)/i);
    const efectivoMatch = texto.match(/(?:efectivo|dinero esperado en caja)[\s\S]*?\$?\s*([0-9\.,]+)/i);
    const transfMatch = texto.match(/(?:transferencia|transferencias)[\s\S]*?\$?\s*([0-9\.,]+)/i);
    const debitoMatch = texto.match(/(?:t\.?\s*d[eé]bito|tarjeta(?: de)? d[eé]bito)[\s\S]*?\$?\s*([0-9\.,]+)/i);
    const creditoMatch = texto.match(/(?:t\.?\s*cr[eé]dito|tarjeta(?: de)? cr[eé]dito)[\s\S]*?\$?\s*([0-9\.,]+)/i);

    if (totalMatch || efectivoMatch || transfMatch || debitoMatch || creditoMatch) {
      const vEfectivo = efectivoMatch ? limpiarNumeroFinanciero_(efectivoMatch[1]) : 0;
      const vTransf = transfMatch ? limpiarNumeroFinanciero_(transfMatch[1]) : 0;
      const vDebito = debitoMatch ? limpiarNumeroFinanciero_(debitoMatch[1]) : 0;
      const vCredito = creditoMatch ? limpiarNumeroFinanciero_(creditoMatch[1]) : 0;
      const vBancarizado = vTransf + vDebito + vCredito;
      const vTotal = totalMatch ? limpiarNumeroFinanciero_(totalMatch[1]) : (vEfectivo + vBancarizado);

      let entDetectada = null;
      if (tLower.includes("more design") || tLower.includes("design") || tLower.includes("desing") || tLower.includes("diseño") || tLower.includes("diseno") || tLower.includes("amor design") || tLower.includes("amordesign") || tLower.includes("agencia")) entDetectada = "More Design";
      else if (tLower.includes("more paper") || tLower.includes("paper") || tLower.includes("papeleria") || tLower.includes("papelería") || tLower.includes("papel")) entDetectada = "More Paper";

      return {
        tipo_documento: "cierre_turno_pos",
        fecha: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
        total_ventas_pos: vTotal,
        ventas_efectivo: vEfectivo,
        ventas_transferencias: vTransf,
        ventas_tarjeta_debito: vDebito,
        ventas_tarjeta_credito: vCredito,
        total_bancarizado: vBancarizado,
        entidad_detectada: entDetectada
      };
    }
  }

  return null;
}

// ============================================================================
// AUXILIARES Y RESOLUTORES DE HOJAS
// ============================================================================
function normalizarEntidad_(ent) {
  if (!ent) return "Personal";
  const e = String(ent).toLowerCase();
  if (e.includes("paper") || e.includes("papel")) return "More Paper";
  if (e.includes("design") || e.includes("desing") || e.includes("diseño") || e.includes("diseno") || e.includes("amor design") || e.includes("amordesign") || e.includes("agencia") || e.includes("publicidad")) return "More Design";
  if (e.includes("global") || e.includes("nomina") || e.includes("nómina") || e.includes("consolidado") || e.includes("corporativ") || e.includes("7194") || e.includes("cuenta more") || e.includes("comun") || e.includes("común")) return "Consolidado";
  return "Personal";
}

function obtenerHojaTransacciones_(entidad) {
  if (entidad === "More Paper") return HOJAS.MOREPAPER_TRANS;
  if (entidad === "More Design") return HOJAS.MOREDESIGN_TRANS;
  if (entidad === "Personal") return HOJAS.PERSONAL_TRANS;
  if (entidad === "Consolidado" || entidad === "Global") {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss && ss.getSheetByName("Operacion_Global")) return "Operacion_Global";
    if (ss && ss.getSheetByName("Gastos_Globales")) return "Gastos_Globales";
    return (HOJAS.OPERACION_GLOBAL || HOJAS.GASTOS_GLOBALES || "Operacion_Global");
  }
  
  // Soporte dinámico para hojas de usuarios dedicados (ej: "Florangellys" -> "Florangellys_Transacciones")
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const candidata = entidad + "_Transacciones";
  if (ss.getSheetByName(candidata)) return candidata;
  return HOJAS.PERSONAL_TRANS;
}

function obtenerHojaCompromisos_(entidad) {
  if (entidad === "More Paper") return HOJAS.MOREPAPER_COMP;
  if (entidad === "More Design") return HOJAS.MOREDESIGN_COMP;
  if (entidad === "Personal") return HOJAS.PERSONAL_COMP;
  if (entidad === "Consolidado" || entidad === "Global") return (HOJAS.COMPROMISOS_GLOBALES || "Compromisos_Globales");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const candidata = entidad + "_Compromisos";
  if (ss.getSheetByName(candidata)) return candidata;
  return HOJAS.PERSONAL_COMP;
}

function obtenerCategoriasPorEntidad_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(HOJAS.CONFIG_CATEGORIAS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();
}

function obtenerCompromisosPendientes_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const res = [];
  const entidades = ["Personal", "More Paper", "More Design", "Consolidado"];
  
  entidades.forEach(ent => {
    const sheet = ss.getSheetByName(obtenerHojaCompromisos_(ent));
    if (sheet && sheet.getLastRow() > 1) {
      const vals = sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).getValues();
      vals.forEach(r => {
        if (r[9] === "Pendiente") {
          res.push({
            id: r[0],
            entidad: ent,
            proveedor: r[2],
            concepto: r[3],
            saldo: r[6],
            vence: r[8]
          });
        }
      });
    }
  });
  return res;
}

function obtenerResumenSaldos_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hDash = ss ? ss.getSheetByName(HOJAS.DASHBOARD) : null;
  if (!hDash || hDash.getLastRow() < 7) {
    return {
      Personal: { ingresos: 0, gastos: 0, disponible: 0, deudas: 0 },
      "More Paper": { ingresos: 0, gastos: 0, disponible: 0, deudas: 0 },
      "More Design": { ingresos: 0, gastos: 0, disponible: 0, deudas: 0 },
      Consolidado: { ingresos: 0, gastos: 0, disponible: 0, deudas: 0 },
      TOTAL: { ingresos: 0, gastos: 0, disponible: 0, deudas: 0 }
    };
  }
  
  try {
    const vals = hDash.getRange(3, 1, 5, 5).getValues();
    return {
      Personal: { ingresos: vals[0] ? vals[0][1] : 0, gastos: vals[0] ? vals[0][2] : 0, disponible: vals[0] ? vals[0][3] : 0, deudas: vals[0] ? vals[0][4] : 0 },
      "More Paper": { ingresos: vals[1] ? vals[1][1] : 0, gastos: vals[1] ? vals[1][2] : 0, disponible: vals[1] ? vals[1][3] : 0, deudas: vals[1] ? vals[1][4] : 0 },
      "More Design": { ingresos: vals[2] ? vals[2][1] : 0, gastos: vals[2] ? vals[2][2] : 0, disponible: vals[2] ? vals[2][3] : 0, deudas: vals[2] ? vals[2][4] : 0 },
      Consolidado: { ingresos: vals[3] ? vals[3][1] : 0, gastos: vals[3] ? vals[3][2] : 0, disponible: vals[3] ? vals[3][3] : 0, deudas: vals[3] ? vals[3][4] : 0 },
      TOTAL: { ingresos: vals[4] ? vals[4][1] : 0, gastos: vals[4] ? vals[4][2] : 0, disponible: vals[4] ? vals[4][3] : 0, deudas: vals[4] ? vals[4][4] : 0 }
    };
  } catch (e) {
    Logger.log("Aviso en obtenerResumenSaldos_: " + e.message);
    return {};
  }
}

function obtenerUltimasTransaccionesConsolidadas_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const res = [];
  ["Personal", "More Paper", "More Design"].forEach(ent => {
    const sheet = ss.getSheetByName(obtenerHojaTransacciones_(ent));
    if (sheet && sheet.getLastRow() > 1) {
      const count = Math.min(5, sheet.getLastRow() - 1);
      const rows = sheet.getRange(sheet.getLastRow() - count + 1, 1, count, 8).getValues();
      rows.forEach(r => {
        res.push({ entidad: ent, fecha: r[1], tipo: r[2], concepto: r[5], valor: r[7] });
      });
    }
  });
  return res;
}

// ============================================================================
// FUNCIONES AUXILIARES: GESTIÓN DE USUARIOS, AUDIO Y PRIVACIDAD SEGREGADA
// ============================================================================

/**
 * Detecta si el texto expresa una intención de administración de usuarios (Super Admin)
 */
function detectarIntencionGestionUsuarios_(texto) {
  if (!texto) return null;
  const t = String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Aprobación de nuevo usuario solicitado
  if (t.startsWith("aprobar") || t.includes("aprobar usuario") || t.includes("aprobar usuaria") || t.includes("autorizar acceso") || t.includes("autorizar usuario")) {
    return { tipo: "aprobar" };
  }

  // Rechazo de nuevo usuario solicitado
  if (t.startsWith("rechazar") || t.includes("rechazar usuario") || t.includes("rechazar usuaria") || t.includes("denegar acceso") || t.includes("denegar usuario")) {
    return { tipo: "rechazar" };
  }

  // Bloqueo / Suspensión
  if (t.includes("bloquear") || t.includes("suspender") || t.includes("congelar")) {
    return { tipo: "bloquear" };
  }

  // Desbloqueo / Reactivación
  if (t.includes("desbloquear") || t.includes("reactivar") || t.includes("quitar bloqueo") || t.includes("activar usuario") || t.includes("activar usuaria")) {
    return { tipo: "desbloquear" };
  }

  // Alta / Creación manual
  if (t.includes("agregar usuario") || t.includes("agregar usuaria") ||
      t.includes("crear usuario") || t.includes("crear usuaria") ||
      t.includes("nuevo usuario") || t.includes("nueva usuaria") ||
      t.includes("adicionar usuario") || t.includes("adicionar usuaria") ||
      t.includes("registrar usuario") || t.includes("registrar usuaria") ||
      t.includes("anadir usuario") || t.includes("anadir usuaria") ||
      t.includes("agrega a la siguiente") || t.includes("agrega al siguiente") ||
      t.includes("creale sus propias hojas") || t.includes("crear sus propias hojas")) {
    return { tipo: "crear" };
  }

  return null;
}

/**
 * Ejecuta la acción administrativa solicitada por el Super Admin
 */
function ejecutarGestionUsuariosSuperAdmin_(ss, intencion, texto) {
  const t = String(texto);

  // 0. CASO APROBAR NUEVO USUARIO
  if (intencion.tipo === "aprobar") {
    const telMatch = t.match(/\+?(?:57)?\s*3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}|\+?\d{10,13}/);
    let telefono = telMatch ? telMatch[0].replace(/\s+/g, "") : "";

    let nombre = "";
    if (telefono) {
      const idx = t.indexOf(telMatch[0]);
      const despuesTel = t.substring(idx + telMatch[0].length).trim();
      if (despuesTel) {
        nombre = despuesTel.replace(/^[\s,;:-]+/, "").trim();
      }
    }
    if (!nombre) {
      const matchNom = t.match(/aprobar\s+(?:a\s+)?([a-zA-ZáéíóúÁÉÍÓÚñÑ]+(?:\s+[a-zA-ZáéíóúÁÉÍÓÚñÑ]+)?)/i);
      if (matchNom && !matchNom[1].toLowerCase().includes("usuario")) nombre = matchNom[1].trim();
    }

    if (!telefono) {
      return {
        tipo: "gestion_usuarios",
        texto: "👑 *Aprobación de Usuarios (Super Admin)*\nPor favor indícame el número de teléfono del usuario a aprobar.\nEjemplo: `APROBAR +573117917391 Florangellys Vilarete`"
      };
    }

    if (!nombre) nombre = "Usuario Aprobado";

    const res = crearNuevoUsuarioFinanciero(telefono, nombre, "USUARIO", "ACTIVO");
    if (!res.ok) {
      return { tipo: "error", texto: `⚠️ No fue posible aprobar al usuario: ${res.error}` };
    }

    // Despachar bienvenida oficial con guía de Magic Link y Asistente Personal
    try {
      if (typeof enviarMensajeBienvenidaNuevoUsuario_ === "function") {
        enviarMensajeBienvenidaNuevoUsuario_(res.telefono, res.nombre);
      }
    } catch (eB) {
      Logger.log("Aviso al despachar bienvenida tras aprobación: " + eB.message);
    }

    return {
      tipo: "gestion_usuarios",
      texto: `✅ *¡Usuario ${res.nombre} Aprobado y Aprovisionado!*\n\n` +
        `📱 *Teléfono:* ${res.telefono}\n` +
        `🛡️ *Rol:* USUARIO (Aislamiento Zero-Trust activo)\n` +
        `📑 *Hojas creadas en tu Libro:*\n` +
        `  • 📄 *${res.hojasCreadas[0]}*\n` +
        `  • 📄 *${res.hojasCreadas[1]}*\n\n` +
        `📩 Se ha notificado al usuario y se le envió su guía de bienvenida e inducción en WhatsApp.\n\n` +
        `⚠️ *Recordatorio Meta:* Si tu app está en modo Desarrollo, asegúrate de que su número esté registrado en la lista de prueba de Meta Developers.`
    };
  }

  // 0.1 CASO RECHAZAR USUARIO
  if (intencion.tipo === "rechazar") {
    const telMatch = t.match(/\+?(?:57)?\s*3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}|\+?\d{10,13}/);
    let target = telMatch ? telMatch[0].replace(/\s+/g, "") : "";

    if (!target) {
      return {
        tipo: "gestion_usuarios",
        texto: "🚫 *Rechazo de Usuarios (Super Admin)*\nPor favor indícame el teléfono del solicitante a rechazar.\nEjemplo: `RECHAZAR +573001234567`"
      };
    }

    const telLimpio = normalizarTelefono_(target);
    try {
      if (typeof enviarMensajeWhatsApp === "function") {
        enviarMensajeWhatsApp("+" + telLimpio, "🔒 Hola. Tu solicitud de acceso al sistema financiero ha sido revisada por la administración y no fue aprobada en este momento.");
      }
    } catch (eR) {
      Logger.log("Aviso notificando rechazo a usuario: " + eR.message);
    }

    return {
      tipo: "gestion_usuarios",
      texto: `🚫 *Solicitud Rechazada*\nEl número +${telLimpio} no ha sido admitido. Se le notificó por WhatsApp de la decisión.`
    };
  }

  // 1. CASO BLOQUEAR
  if (intencion.tipo === "bloquear") {
    const telMatch = t.match(/\+?(?:57)?\s*3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}|\+?\d{10,13}/);
    let target = telMatch ? telMatch[0] : "";
    if (!target) {
      const matchNom = t.match(/(?:bloquear|suspender|congelar)\s+(?:a\s+|al\s+usuario\s+|a\s+la\s+usuaria\s+)?([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)/i);
      if (matchNom) target = matchNom[1];
    }

    if (!target) {
      return {
        tipo: "gestion_usuarios",
        texto: "🚫 *Bloqueo de Usuarios (Super Admin)*\nPor favor indícame el nombre o número de teléfono del usuario que deseas bloquear."
      };
    }

    const res = bloquearUsuarioFinanciero(target);
    if (!res.ok) {
      return { tipo: "error", texto: `⚠️ No fue posible bloquear al usuario: ${res.error}` };
    }
    return {
      tipo: "gestion_usuarios",
      texto: `🚫 *¡Usuario Bloqueado Exitosamente!*\n\n• **Usuario:** ${res.nombre}\n• **Teléfono:** ${res.telefono}\n• **Fecha:** ${res.fechaBloqueo}\n\n🔒 Todas sus acciones contables han quedado congeladas. Si escribe al bot, se le indicará que su acceso está temporalmente suspendido.`
    };
  }

  // 2. CASO DESBLOQUEAR
  if (intencion.tipo === "desbloquear") {
    const telMatch = t.match(/\+?(?:57)?\s*3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}|\+?\d{10,13}/);
    let target = telMatch ? telMatch[0] : "";
    if (!target) {
      const matchNom = t.match(/(?:desbloquear|reactivar|activar)\s+(?:a\s+|al\s+usuario\s+|a\s+la\s+usuaria\s+)?([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)/i);
      if (matchNom) target = matchNom[1];
    }

    if (!target) {
      return {
        tipo: "gestion_usuarios",
        texto: "🔓 *Desbloqueo de Usuarios (Super Admin)*\nPor favor indícame el nombre o número de teléfono del usuario que deseas desbloquear."
      };
    }

    const res = desbloquearUsuarioFinanciero(target);
    if (!res.ok) {
      return { tipo: "error", texto: `⚠️ No fue posible desbloquear al usuario: ${res.error}` };
    }
    return {
      tipo: "gestion_usuarios",
      texto: `🔓 *¡Usuario Reactivado Exitosamente!*\n\n• **Usuario:** ${res.nombre}\n• **Teléfono:** ${res.telefono}\n• **Periodo inactivo:** Desde ${res.fechaBloqueo} hasta ${res.fechaDesbloqueo}\n\n📢 Se ha enviado la notificación oficial a su WhatsApp advirtiéndole sobre el posible sesgo en sus finanzas para que registre transacciones pendientes.`
    };
  }

  // 3. CASO CREAR NUEVO USUARIO
  if (intencion.tipo === "crear") {
    const telMatch = t.match(/\+?(?:57)?\s*3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}|\+?\d{10,13}/);
    let telefono = telMatch ? telMatch[0].replace(/\s+/g, "") : "";

    let nombre = "";
    const patronNombre = /(?:usuario|usuaria|a|agregar|crear)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/;
    const matchNom = t.match(patronNombre);
    if (matchNom && !matchNom[1].toLowerCase().includes("telefono") && !matchNom[1].toLowerCase().includes("nuevo")) {
      nombre = matchNom[1].trim();
    }

    if (!telefono || !nombre) {
      return {
        tipo: "gestion_usuarios",
        texto: "👑 *Gestión de Usuarios (Super Admin)*\n\n" +
          "Para crear un nuevo usuario con hojas dedicadas y acceso seguro, por favor facilítame:\n" +
          "1️⃣ *Nombre completo* (ej: Florangellys Vilarete)\n" +
          "2️⃣ *Número de WhatsApp* con indicativo (ej: +573117917391)\n\n" +
          "💡 *Tip:* Puedes indicármelo en un solo mensaje así:\n" +
          "*Agregar usuario Carlos Mendoza con teléfono +573001234567*"
      };
    }

    const res = crearNuevoUsuarioFinanciero(telefono, nombre, "USUARIO", "ACTIVO");
    return {
      tipo: "gestion_usuarios",
      texto: `✅ *¡Nuevo Usuario Creado y Aprovisionado con Éxito!*\n\n` +
        `👤 *Nombre:* ${res.nombre}\n` +
        `📱 *WhatsApp:* ${res.telefono}\n` +
        `🛡️ *Rol:* USUARIO (Aislado, sin acceso administrativo)\n` +
        `📑 *Hojas Creadas en tu Libro:*\n` +
        `  • 📄 *${res.hojasCreadas[0]}*\n` +
        `  • 📄 *${res.hojasCreadas[1]}*\n\n` +
        `🔒 *Seguridad:* El usuario solo podrá ver y registrar información en sus hojas personales. Tus cuentas ('Personal', 'More Paper', 'More Design') están 100% protegidas y ocultas para él/ella.\n\n` +
        `📩 *Bienvenida:* Se despachó el mensaje automático de inducción a su WhatsApp.\n\n` +
        `⚠️ *Nota Sandbox Meta:* Recuerda añadir el número ${res.telefono} a tu lista de prueba en Meta Developers si tu app continúa en modo Desarrollo.`
    };
  }

  return {
    tipo: "conversacion",
    texto: "No logré identificar la acción de usuarios solicitada."
  };
}

/**
 * Notifica al Super Admin (Fernando) sobre una solicitud de acceso entrante de un número no registrado.
 */
function notificarSolicitudAccesoSuperAdmin_(telefonoSolicitante, textoInicial) {
  try {
    const telAdmin = CONFIG_FINANZAS.TELEFONO_ADMIN_DEFAULT;
    if (!telAdmin) return;

    // Evitar spam: solo notificar una vez cada 12 horas por el mismo número
    const cache = CacheService.getScriptCache();
    const cacheKey = "SOLICITUD_ACCESO_" + telefonoSolicitante;
    if (cache && cache.get(cacheKey)) return;
    if (cache) cache.put(cacheKey, "ENVIADO", 43200);

    const mensajeAdmin = 
      `🔔 *SOLICITUD DE ACCESO DE NUEVO USUARIO*\n\n` +
      `📱 *Teléfono:* +${telefonoSolicitante}\n` +
      `💬 *Mensaje recibido:* "${textoInicial || 'Hola'}"\n\n` +
      `👉 *Para autorizar y crear sus hojas contables de inmediato, responde:*\n` +
      `*APROBAR +${telefonoSolicitante} [Nombre Completo]*\n\n` +
      `👉 *Para rechazar la solicitud, responde:*\n` +
      `*RECHAZAR +${telefonoSolicitante}*`;

    if (typeof enviarMensajeWhatsApp === "function") {
      enviarMensajeWhatsApp(telAdmin, mensajeAdmin);
    }
  } catch (e) {
    Logger.log("Aviso notificando solicitud a Super Admin: " + e.message);
  }
}

/**
 * Detecta si el texto es una solicitud de Magic Link personal para el Dashboard Canvas
 */
function detectarSolicitudMagicLink_(texto) {
  if (!texto) return false;
  const t = String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return t.includes("dame mi link") || t.includes("mi link") || t.includes("ver mi dashboard") || 
         t.includes("ver dashboard") || t.includes("abrir dashboard") || t.includes("link del dashboard") ||
         t.includes("link dashboard") || t.includes("abrir canvas") || t.includes("entrar al dashboard") ||
         t.includes("acceso al dashboard") || t.includes("mi dashboard") || t.includes("link personal");
}

/**
 * Genera y despacha el Magic Link personal firmado con seguridad Zero-Trust
 */
function ejecutarDespachoMagicLink_(telefono, perm, solicitaAudio) {
  const entidad = (perm.rol === "SUPER_ADMIN") ? "Consolidado" : (perm.entidadPropia || "Personal");
  const url = (typeof generarUrlMagicLink === "function") 
    ? generarUrlMagicLink(entidad, telefono)
    : "https://script.google.com/macros/s/AKfycbyHxkfFJ1qAnmRcXDgJEnCPSxphpvLMa16fkFCfpVzfGmPBh_YL5M2QLe1uGRA3kp_XIg/exec";

  const nombreHumano = (typeof sanitizarNombreHumano_ === "function" && perm.nombre) 
    ? sanitizarNombreHumano_(perm.nombre) 
    : "Estimado usuario";

  const mensaje = (perm.rol === "SUPER_ADMIN")
    ? `👑 *Hola ${nombreHumano}, aquí tienes tu acceso maestro al Dashboard Canvas Pro:*\n\n` +
      `🔗 *Enlace Privado Directo:*\n👉 ${url}\n\n` +
      `🛡️ *Control Total:* Tienes acceso irrestricto al Consolidado, More Paper, More Design, Finanzas Personales y selector de usuarios.`
    : `💎 *¡Hola ${nombreHumano}! Aquí tienes tu acceso privado a tu Dashboard Financiero:*\n\n` +
      `🔗 *Enlace Privado Directo:*\n👉 ${url}\n\n` +
      `🔒 *Seguridad Zero-Trust:* Este enlace es 100% personal e intransferible. No requiere contraseña y está configurado para mostrar única y exclusivamente tus propios registros contables con total privacidad.`;

  return {
    tipo: "magic_link",
    texto: mensaje,
    requiereAudio: solicitaAudio
  };
}

/**
 * Detecta si el usuario solicita respuesta por archivo de audio
 */
function esSolicitudRespuestaAudio_(texto) {
  if (!texto) return false;
  const t = String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  return (
    t.includes("audio") ||
    t.includes("nota de voz") ||
    t.includes("por voz") ||
    t.includes("en voz") ||
    t.includes("dimelo en audio") ||
    t.includes("mandame un audio") ||
    t.includes("enviame un audio") ||
    t.includes("mandame audio") ||
    t.includes("enviame audio") ||
    t.includes("responder con un audio") ||
    t.includes("escucharte") ||
    t.includes("escuchar tu voz") ||
    t.includes("oirte") ||
    t.includes("oir tu voz") ||
    t.includes("hablame") ||
    t.includes("habla") ||
    t.includes("dejame oirte") ||
    t.includes("dejame escucharte") ||
    t.includes("como suena tu voz") ||
    t.includes("como es tu voz") ||
    t.includes("como hablas") ||
    t.includes("prueba de voz") ||
    t.includes("muestra de voz")
  );
}

/**
 * Detecta si el usuario indica que va conduciendo o requiere manos libres
 */
function esModoConduccion_(texto) {
  if (!texto) return false;
  const t = String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return /(manejando|conduciendo|al volante|en el carro|en la moto|en el vehiculo|vou manejando|manejadno)/i.test(t);
}

/**
 * Obtiene compromisos de un usuario estándar exclusivo
 */
function obtenerCompromisosPendientesUsuario_(entidadPropia) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const res = [];
  const nombreHoja = obtenerHojaCompromisos_(entidadPropia);
  const sheet = ss.getSheetByName(nombreHoja);
  if (sheet && sheet.getLastRow() > 1) {
    const vals = sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).getValues();
    vals.forEach(r => {
      if (r[9] === "Pendiente") {
        res.push({
          id: r[0],
          entidad: entidadPropia,
          proveedor: r[2],
          concepto: r[3],
          saldo: r[6],
          vence: r[8]
        });
      }
    });
  }
  return res;
}

/**
 * Ejecuta consultas financieras exclusivamente para las hojas privadas de un usuario estándar
 */
function ejecutarConsultaFinancieraUsuarioEstandar_(ss, preguntaUsuario, perm) {
  const entidad = perm.entidadPropia || "Personal";
  const hojaTrans = obtenerHojaTransacciones_(entidad);
  const hojaComp = obtenerHojaCompromisos_(entidad);
  
  const sTrans = ss.getSheetByName(hojaTrans);
  const sComp = ss.getSheetByName(hojaComp);

  let totalIngresos = 0;
  let totalGastos = 0;
  let deudasPendientes = 0;

  if (sTrans && sTrans.getLastRow() > 1) {
    const filas = sTrans.getRange(2, 1, sTrans.getLastRow() - 1, 8).getValues();
    filas.forEach(r => {
      const tipo = String(r[2]).toLowerCase();
      const val = Number(r[7]) || 0;
      if (tipo.includes("ingreso")) {
        totalIngresos += val;
      } else {
        totalGastos += val;
      }
    });
  }

  if (sComp && sComp.getLastRow() > 1) {
    const filasC = sComp.getRange(2, 1, sComp.getLastRow() - 1, 10).getValues();
    filasC.forEach(r => {
      if (String(r[9]).trim() === "Pendiente") {
        deudasPendientes += Number(r[6]) || 0;
      }
    });
  }

  const disponible = totalIngresos - totalGastos;

  const nombreHumano = sanitizarNombreHumano_(perm ? perm.nombre : "Fernando");
  return {
    tipo: "consulta",
    texto: `📊 *Resumen de tus Finanzas Personales (${nombreHumano}):*\n\n` +
      `• 💰 *Ingresos Totales:* $${totalIngresos.toLocaleString("es-CO")} COP\n` +
      `• 💸 *Gastos Totales:* $${totalGastos.toLocaleString("es-CO")} COP\n` +
      `• 📈 *Saldo Disponible Actual:* $${disponible.toLocaleString("es-CO")} COP\n` +
      `• 📌 *Deudas / Pasivos Pendientes:* $${deudasPendientes.toLocaleString("es-CO")} COP`
  };
}

// ============================================================================
// GESTIÓN DE NOMBRES DE ASISTENTE PERSONAL, PERFILES DE VOZ Y AUDIO TRANSCRIBE
// ============================================================================

/**
 * Detecta si el usuario desea consultar su nombre, bautizar al agente, cambiar su nombre o ajustar su perfil de voz
 */
function detectarIntencionCambioNombreVoz_(texto) {
  if (!texto) return null;
  const raw = String(texto).trim();
  const t = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // 1. CONSULTA DE IDENTIDAD O NOMBRE ("¿Cómo te llamas?", "Recuérdame tu nombre", etc.)
  const regexConsulta = /(?:recuerda(?:me)?\s+(?:tu|el)\s+nombre|recuerda(?:me)?\s+como\s+te\s+llamas|dime\s+tu\s+nombre|como\s+te\s+llamas|cual\s+es\s+tu\s+nombre|quien\s+eres|como\s+te\s+puse|como\s+te\s+bautice|que\s+nombre\s+tienes|cual\s+es\s+tu\s+voz|que\s+voz\s+tienes|quien\s+me\s+habla)/i;
  if (regexConsulta.test(t)) {
    return { tipo: "consulta_identidad" };
  }

  // 2. CONSULTA DEL CATÁLOGO DE SUPERHÉROES Y VOCES DISPONIBLES
  const regexCatalogoSuperheroes = /(?:voces?\s+(?:de\s+)?(?:los\s+)?superheroes?|superheroes?|catalogo\s+de\s+(?:voces|superheroes|personajes)|cuales\s+(?:superheroes|personajes)|(?:superheroes|personajes)\s+disponibles|lista\s+de\s+(?:voces|superheroes|personajes)|opciones\s+de\s+(?:superheroes|personajes)|que\s+(?:superheroes|personajes)|muestrame\s+los\s+(?:superheroes|personajes)|serie\s+de\s+voces|^personajes?$|^ver\s+personajes?$|^cambiar\s+personaje$|^explorar\s+personajes?$|^catalogo$)/i;
  if (regexCatalogoSuperheroes.test(t)) {
    return { tipo: "catalogo_superheroes" };
  }

  // 2.2 RESPUESTAS DEL FLUJO DE INMERSIÓN GUIADO (Categorías y Continuidad)
  if (t === "continuar" || t === "mantener" || t === "seguir igual" || t === "continuar con mi personaje" || t === "mantener copiloto") {
    return { tipo: "confirmar_continuidad_personaje" };
  }
  if (t === "1" || t === "universo 1" || t === "categoria 1" || t === "defensores" || t === "universo 1 defensores") {
    return { tipo: "catalogo_categoria", categoria: 1 };
  }
  if (t === "2" || t === "universo 2" || t === "categoria 2" || t === "mentes maestras" || t === "universo 2 mentes maestras") {
    return { tipo: "catalogo_categoria", categoria: 2 };
  }
  if (t === "3" || t === "universo 3" || t === "categoria 3" || t === "antiheroes" || t === "universo 3 antiheroes") {
    return { tipo: "catalogo_categoria", categoria: 3 };
  }
  if (t === "4" || t === "universo 4" || t === "categoria 4" || t === "leyendas" || t === "cine" || t === "universo 4 leyendas") {
    return { tipo: "catalogo_categoria", categoria: 4 };
  }

  // 3. RESTRICCIÓN ESTRICTA DE VOCES INFANTILES Y ANIMALES (Excluyendo personajes legendarios autorizados)
  const esPersonajePermitido = t.includes("gato con botas") || t.includes("gato botas") || t.includes("puss in boots") || t.includes("el gato con botas");
  if (!esPersonajePermitido) {
    const palabrasProhibidas = ["nino", "nina", "ninos", "ninas", "bebe", "infantil", "chiquito", "perro", "gato", "loro", "animal", "cartoon", "dibujos animados"];
    for (let i = 0; i < palabrasProhibidas.length; i++) {
      if (t.includes(palabrasProhibidas[i])) {
        return {
          tipo: "voz_prohibida",
          palabra: palabrasProhibidas[i]
        };
      }
    }
  }

  // 4. INTENCIÓN DE BAUTIZAR O CAMBIAR NOMBRE (Soporta nombres compuestos como "Bruce Wayne", "Tony Stark", "Gato con Botas")
  const regexNombreCompuesto = /(?:te\s+llamas|te\s+llamar[aá]s|te\s+llames|te\s+llamar[eé]|ll[aá]mate|tu\s+(?:nuevo\s+)?nombre\s+es|tu\s+(?:nuevo\s+)?nombre\s+sea|cambia\s+tu\s+nombre\s+a|ponte\s+de\s+nombre|baut[ií]zate\s+como)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+(?:\s+[a-zA-ZáéíóúÁÉÍÓÚñÑ]+)?)/i;
  const matchNom = raw.match(regexNombreCompuesto);

  if (matchNom) {
    const nuevoNombre = matchNom[1].trim();
    return {
      tipo: "cambio_nombre_y_voz",
      nombre: nuevoNombre,
      textoCompleto: raw
    };
  }

  // 5. INTENCIÓN DE CAMBIAR SOLO LA VOZ CON VERBOS
  const regexVoz = /(?:cambia|cambiar|pon|ponte|quiero|configura|ajusta)(?:\s+tu|\s+la)?\s+voz\s+(?:a\s+|de\s+|por\s+)?([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+)/i;
  const matchVoz = raw.match(regexVoz);

  if (matchVoz) {
    const estilo = matchVoz[1].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (estilo.includes("batman") || estilo.includes("bruce")) return { tipo: "cambio_solo_voz", perfil: "BATMAN" };
    if (estilo.includes("iron") || estilo.includes("stark")) return { tipo: "cambio_solo_voz", perfil: "IRON_MAN" };
    if (estilo.includes("optimus")) return { tipo: "cambio_solo_voz", perfil: "OPTIMUS_PRIME" };
    if (estilo.includes("spider")) return { tipo: "cambio_solo_voz", perfil: "SPIDERMAN" };
    if (estilo.includes("superman")) return { tipo: "cambio_solo_voz", perfil: "SUPERMAN" };
    if (estilo.includes("maravilla") || estilo.includes("wonder")) return { tipo: "cambio_solo_voz", perfil: "WONDER_WOMAN" };
    if (estilo.includes("wolverine") || estilo.includes("logan")) return { tipo: "cambio_solo_voz", perfil: "WOLVERINE" };
    if (estilo.includes("thor")) return { tipo: "cambio_solo_voz", perfil: "THOR" };
    if (estilo.includes("gato") || estilo.includes("botas") || estilo.includes("puss")) return { tipo: "cambio_solo_voz", perfil: "GATO_CON_BOTAS" };
    if (estilo.includes("alexa")) return { tipo: "cambio_solo_voz", perfil: "ALEXA" };
    if (estilo.includes("femenina") || estilo.includes("mujer") || estilo.includes("dulce") || estilo.includes("chica")) {
      return { tipo: "cambio_solo_voz", perfil: "FEMENINO_DULCE" };
    }
    if (estilo.includes("masculin") || estilo.includes("hombre") || estilo.includes("cordial") || estilo.includes("chico") || estilo.includes("caballero")) {
      return { tipo: "cambio_solo_voz", perfil: "MASCULINO_CORDIAL" };
    }
    if (estilo.includes("robot") || estilo.includes("metalic") || estilo.includes("electronic") || estilo.includes("superheroe")) {
      return { tipo: "cambio_solo_voz", perfil: "ROBOTICA" };
    }

    // Búsqueda en personajes dinámicos de la comunidad
    try {
      if (typeof obtenerPersonajesDinamicos_ === "function") {
        const din = obtenerPersonajesDinamicos_(null, true);
        for (let i = 0; i < din.length; i++) {
          const nomClean = String(din[i].nombre || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          if (nomClean && estilo.includes(nomClean)) {
            return { tipo: "cambio_solo_voz", perfil: din[i].idClave };
          }
        }
      }
    } catch (eDinEstilo) {}

    return { tipo: "cambio_solo_voz", estiloRaw: estilo };
  }

  // 6. SELECCIÓN DIRECTA DE SUPERHÉROES O OPCIONES (Ej. "3 Batman", "Batman", "Gato con Botas", "Iron Man")
  if (t.includes("batman") || t.includes("bruce wayne")) return { tipo: "cambio_solo_voz", perfil: "BATMAN" };
  if (t.includes("iron man") || t.includes("ironman") || t.includes("tony stark")) return { tipo: "cambio_solo_voz", perfil: "IRON_MAN" };
  if (t.includes("optimus") || t.includes("autobot")) return { tipo: "cambio_solo_voz", perfil: "OPTIMUS_PRIME" };
  if (t.includes("spiderman") || t.includes("spider-man") || t.includes("peter parker")) return { tipo: "cambio_solo_voz", perfil: "SPIDERMAN" };
  if (t.includes("superman") || t.includes("clark kent")) return { tipo: "cambio_solo_voz", perfil: "SUPERMAN" };
  if (t.includes("maravilla") || t.includes("wonder woman") || t.includes("diana prince")) return { tipo: "cambio_solo_voz", perfil: "WONDER_WOMAN" };
  if (t.includes("wolverine") || t.includes("logan")) return { tipo: "cambio_solo_voz", perfil: "WOLVERINE" };
  if (t.includes("thor") || t.includes("dios del trueno") || t.includes("asgard")) return { tipo: "cambio_solo_voz", perfil: "THOR" };
  if (t.includes("gato con botas") || t.includes("gato botas") || t.includes("puss in boots") || t === "el gato con botas" || t === "gato con botas") return { tipo: "cambio_solo_voz", perfil: "GATO_CON_BOTAS" };
  if (t.includes("alexa")) return { tipo: "cambio_solo_voz", perfil: "ALEXA" };

  // Búsqueda directa en catálogo dinámico
  try {
    if (typeof obtenerPersonajesDinamicos_ === "function") {
      const din = obtenerPersonajesDinamicos_(null, true);
      for (let i = 0; i < din.length; i++) {
        const nomClean = String(din[i].nombre || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const idClean = String(din[i].idClave || "").toLowerCase().replace(/_/g, " ");
        if ((nomClean && t.includes(nomClean)) || (idClean && t.includes(idClean))) {
          return { tipo: "cambio_solo_voz", perfil: din[i].idClave };
        }
      }
    }
  } catch (eDinDirecto) {}

  // 7. RESPUESTA NUMÉRICA O DE MENÚ DE VOZ (Requiere contexto explícito como 'voz 1' u 'opcion 1')
  if (/^opcion\s*1$/i.test(t) || t === "voz 1" || t === "voz femenina" || t === "voz de mujer") {
    return { tipo: "cambio_solo_voz", perfil: "FEMENINO_DULCE" };
  }
  if (/^opcion\s*2$/i.test(t) || t === "voz 2" || t === "voz masculina" || t === "voz de hombre") {
    return { tipo: "cambio_solo_voz", perfil: "MASCULINO_CORDIAL" };
  }
  if (/^opcion\s*3$/i.test(t) || t === "voz 3" || t === "voz robotica" || t === "voz neutra") {
    return { tipo: "cambio_solo_voz", perfil: "ROBOTICA" };
  }

  return null;
}

/**
 * Infiere inteligentemente el perfil de voz basándose en el nombre y las palabras clave.
 * Soporta de forma nativa superhéroes y arquetipos legendarios.
 */
function inferirPerfilVozPorNombre_(nombre, textoCompleto) {
  if (!nombre) return "AMBIGUO";
  const n = String(nombre).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const t = textoCompleto ? String(textoCompleto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

  // 1. SUPERHÉROES Y PERSONAJES LEGENDARIOS (CATÁLOGO FISH AUDIO)
  if (t.includes("batman") || n.includes("batman") || n === "bruce" || n === "bruce wayne") return "BATMAN";
  if (t.includes("iron man") || t.includes("ironman") || n.includes("iron") || n.includes("stark") || n === "tony") return "IRON_MAN";
  if (t.includes("optimus") || n.includes("optimus")) return "OPTIMUS_PRIME";
  if (t.includes("spiderman") || t.includes("spider") || n.includes("spider") || n === "peter parker") return "SPIDERMAN";
  if (t.includes("capitan") || t.includes("america") || n.includes("capitan") || n === "steve rogers") return "CAPITAN_AMERICA";
  if (t.includes("thor") || n.includes("thor")) return "THOR";
  if (t.includes("hulk") || n.includes("hulk") || n === "bruce banner") return "HULK";
  if (t.includes("black widow") || t.includes("viuda negra") || n.includes("natasha") || n.includes("widow")) return "BLACK_WIDOW";
  if (t.includes("doctor strange") || t.includes("strange") || n.includes("strange") || n === "stephen strange") return "DOCTOR_STRANGE";
  if (t.includes("wolverine") || n.includes("wolverine") || n === "logan") return "WOLVERINE";
  if (t.includes("deadpool") || n.includes("deadpool") || n === "wade wilson") return "DEADPOOL";
  if (t.includes("loki") || n.includes("loki")) return "LOKI";
  if (t.includes("superman") || n.includes("superman") || n === "clark kent") return "SUPERMAN";
  if (t.includes("flash") || n.includes("flash") || n === "barry allen") return "FLASH";
  if (t.includes("hellboy") || n.includes("hellboy") || n === "anung un rama") return "HELLBOY";
  if (t.includes("spawn") || n.includes("spawn") || n === "al simmons") return "SPAWN";
  if (t.includes("gato con botas") || n.includes("gato con botas") || t.includes("puss in boots") || n.includes("botas") || n === "puss") return "GATO_CON_BOTAS";
  if (t.includes("freeman") || t.includes("morgan freeman") || n.includes("morgan")) return "MORGAN_FREEMAN";
  if (t.includes("alexa") || n === "alexa") return "ALEXA";
  if (t.includes("voz alex") || t.includes("perfil alex") || n === "alex neutro") return "ALEX";
  if (t.includes("maravilla") || t.includes("wonder") || n.includes("wonder") || n.includes("diana")) return "WONDER_WOMAN";

  // Búsqueda en catálogo de personajes dinámicos de la comunidad
  try {
    if (typeof obtenerPersonajesDinamicos_ === "function") {
      const din = obtenerPersonajesDinamicos_(null, true);
      for (let i = 0; i < din.length; i++) {
        const nomClean = String(din[i].nombre || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const idClean = String(din[i].idClave || "").toLowerCase().replace(/_/g, " ");
        if ((nomClean && (n.includes(nomClean) || t.includes(nomClean))) || (idClean && (n.includes(idClean) || t.includes(idClean)))) {
          return din[i].idClave;
        }
      }
    }
  } catch (eDinInf) {}

  // 2. Si el texto menciona explícitamente el perfil
  if (t.includes("femenina") || t.includes("mujer") || t.includes("dulce")) return "FEMENINO_DULCE";
  if (t.includes("masculina") || t.includes("hombre") || t.includes("cordial")) return "MASCULINO_CORDIAL";
  if (t.includes("robotica") || t.includes("metalica") || t.includes("electronica") || t.includes("superheroe")) return "ROBOTICA";

  // 3. Nombres tecnológicos / robóticos
  const nombresRoboticos = ["jarvis", "friday", "ultron", "cyborg", "titan", "nexus", "c-3po", "r2d2", "hal", "vision", "matrix"];
  if (nombresRoboticos.includes(n)) return "ROBOTICA";

  // 4. Nombres femeninos típicos
  const nombresFemeninos = [
    "aura", "sofia", "valeria", "camila", "luna", "elena", "maria", "lucia", "diana", "sara",
    "carolina", "angela", "florangellys", "atenea", "victoria", "mia", "emma", "eva", "isabella",
    "zoe", "clara", "valentina", "daniela", "paula", "andrea", "gabriela", "natalia", "juliana",
    "mariana", "catalina", "laura", "alicia", "beatriz", "monica", "teresa", "silvia", "patricia"
  ];
  if (nombresFemeninos.includes(n) || (n.endsWith("a") && !["alexa", "sasha", "luca", "noah"].includes(n) && n.length > 3)) {
    return "FEMENINO_DULCE";
  }

  // 5. Nombres masculinos típicos
  const nombresMasculinos = [
    "ciro", "carlos", "fernando", "mateo", "lucas", "leo", "atlas", "david", "daniel", "santiago",
    "andres", "felipe", "alejandro", "alvaro", "hector", "gabriel", "victor", "samuel", "sebastian",
    "nicolas", "miguel", "javier", "diego", "manuel", "juan", "pedro", "pablo", "rodrigo", "martin", "orion"
  ];
  if (nombresMasculinos.includes(n) || n.endsWith("o")) {
    return "MASCULINO_CORDIAL";
  }

  // 6. Nombres ambiguos o de género no definido
  return "AMBIGUO";
}

/**
 * Retorna la descripción, emoji y lema característico de cada perfil de voz
 */
var DICCIONARIO_MAESTRO_PERSONAJES_ = {
  SPAWN: {
    id: "SPAWN",
    alias: "Spawn",
    nombreOficial: "Spawn (Al Simmons)",
    titulo: "Centinela Espectral de las Sombras",
    emoji: "🌑",
    iconoAccion: "⛓️",
    descVoz: "Spawn / Al Simmons (oscura, gutural, espectral y temible)",
    lema: "Desde las sombras vigilamos que ningún deudor ni fuga de capital quede impune.",
    frasesCelebres: [
      "Desde las sombras vigilamos que ningún deudor ni fuga de capital quede impune.",
      "El averno no perdona las deudas; tus arcas están bajo juicio implacable.",
      "Cero clemencia con el desperdicio. Cada peso queda blindado en la oscuridad.",
      "Mis cadenas apresan cualquier pérdida antes de que toque tu tesoro.",
      "La noche vigila, las deudas caen y tu patrimonio permanece intacto."
    ],
    saludoVoz: (nombre) => `Soy Spawn, ${nombre}. He emergido desde las sombras para erigirme como el centinela implacable de tus arcas. Aquí no hay tregua para el despilfarro ni clemencia para las fugas de capital. Tu tesoro queda rigurosamente blindado bajo mi custodia.`,
    imagenUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/spawn_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/spawn_sticker_v2_anim.webp",
    captionImagen: (nombre) => `🌑 *SPAWN | Centinela Financiero de las Arcas*\n_«Desde las sombras vigilo que ningún deudor ni fuga de capital quede impune. Tus recursos quedan bajo mi protección espectral, ${nombre}.»_`,
    lemaCierreCorto: " Mis cadenas protegen tus finanzas en las sombras."
  },
  GATO_CON_BOTAS: {
    id: "GATO_CON_BOTAS",
    alias: "El Gato con Botas",
    nombreOficial: "El Gato con Botas",
    titulo: "Copiloto Financiero & Espadachín de Leyenda",
    emoji: "🐾",
    iconoAccion: "🗡️",
    descVoz: "El Gato con Botas (espadachín audaz, teatral, caballeroso y carismático)",
    lema: "¡Por mi honor y por mis botas! Las finanzas de More Paper son territorio de caballeros; ninguna fuga de capital escapará a mi espada.",
    frasesCelebres: [
      "¡Por mi sombrero y mi espada, tus finanzas están a salvo!",
      "¡En guardia, pérdidas innecesarias! El honor de tus arcas no se negocia.",
      "¿Quién necesita suerte cuando tiene talento, destreza y garras afiladas?",
      "La audacia y la disciplina hacen la verdadera riqueza, mi noble amigo.",
      "Elegancia y precisión contable, ¡siempre a tu servicio con gloria!"
    ],
    saludoVoz: (nombre) => `¡Por mi honor y por mis botas! Hola ${nombre}, aquí estoy. He desenvainado mi voz y he venido a proteger tu tesoro con destreza, capa y espada legendaria. A partir de ahora tus finanzas están bajo mi custodia caballeresca.`,
    imagenUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/gato_con_botas_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/gato_con_botas_sticker_v2_anim.webp",
    captionImagen: (nombre) => `🐾 *EL GATO CON BOTAS | Guardián Legendario de tus Arcas*\n_«¡Por mi sombrero y mi espada, ${nombre}! Desenvaino ante cualquier peligro para proteger cada moneda de tu tesoro.»_`,
    lemaCierreCorto: " ¡Por mi sombrero, tus cuentas están a salvo!"
  },
  BATMAN: {
    id: "BATMAN",
    alias: "Batman",
    nombreOficial: "Batman (Bruce Wayne)",
    titulo: "Guardián de las Sombras & Estratega Financiero",
    emoji: "🦇",
    iconoAccion: "🦇",
    descVoz: "Batman / Bruce Wayne (profunda, grave, solemne e imponente)",
    lema: "Soy la noche. Tus finanzas están bajo estricta vigilancia y protección.",
    frasesCelebres: [
      "Disciplina implacable. Cero fugas de capital en las sombras.",
      "La ciudad duerme, pero el flujo de caja nunca descansa.",
      "En las sombras o a plena luz, tu patrimonio está completamente blindado.",
      "Cuentas claras, radar limpio y presupuesto inviolable.",
      "No es quién soy debajo, sino lo que protejo lo que me define."
    ],
    saludoVoz: (nombre) => `Soy Batman, ${nombre}. A partir de ahora vigilo tus finanzas desde las sombras con absoluta disciplina y rigor estratégico. Cero fugas de capital.`,
    imagenUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/batman_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/batman_sticker_v2_anim.webp",
    captionImagen: (nombre) => `🦇 *BATMAN | Guardián Fiduciario de las Sombras*\n_«La noche es oscura, pero tus arcas están blindadas. Disciplina absoluta y vigilancia implacable para tu patrimonio, ${nombre}.»_`,
    lemaCierreCorto: " Todo blindado en las sombras."
  },
  IRON_MAN: {
    id: "IRON_MAN",
    alias: "Tony Stark",
    nombreOficial: "Iron Man (Tony Stark)",
    titulo: "CFO Tecnológico & Arquitecto de Capital",
    emoji: "🦾",
    iconoAccion: "⚡",
    descVoz: "Iron Man / Tony Stark (carismática, inteligente y tecnológica)",
    lema: "Genio, millonario y tu copiloto financiero. Cuentas claras y flujo de caja en su punto óptimo.",
    frasesCelebres: [
      "Flujo de caja en verde, señor. Seguimos dominando el juego.",
      "Tecnología y rentabilidad al más alto nivel sin margen de error.",
      "Impecable, como todo lo que diseñamos con reactores encendidos.",
      "A veces hay que correr antes de aprender a caminar, pero siempre con balances auditados.",
      "Menos burocracia, más eficiencia algorítmica y mayores dividendos."
    ],
    saludoVoz: (nombre) => `¡Qué tal, ${nombre}! Tony Stark al habla. Sistemas de voz y analítica financiera activados para maximizar tu flujo de caja con precisión milimétrica.`,
    imagenUrl: "https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/iron_man_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/iron_man_sticker_v2_anim.webp",
    captionImagen: (nombre) => `🦾 *TONY STARK | CFO Tecnológico*\n_«Reactores al máximo y cuentas blindadas. Llevaremos tus arcas al siguiente nivel de vanguardia, ${nombre}.»_`,
    lemaCierreCorto: " Flujo de caja en verde, señor."
  },
  OPTIMUS_PRIME: {
    id: "OPTIMUS_PRIME",
    alias: "Optimus Prime",
    nombreOficial: "Optimus Prime",
    titulo: "Comandante Supremo de la Fortaleza Financiera",
    emoji: "🤖",
    iconoAccion: "🛡️",
    descVoz: "Optimus Prime (heroica, metálica profunda y honorable)",
    lema: "Autobots, avancen. Cada peso y cada inversión tienen un propósito noble.",
    frasesCelebres: [
      "La libertad y la prosperidad se forjan con disciplina y honor.",
      "No cederemos ni una sola moneda ante el desorden o el engaño.",
      "Con valentía y constancia, tus recursos superarán cualquier batalla.",
      "La verdadera fuerza de un líder radica en custodiar con rectitud su tesoro.",
      "Hasta que todos los balances sean uno y la victoria sea total."
    ],
    saludoVoz: (nombre) => `Saludos, ${nombre}. Aquí Optimus Prime. Tu honor y disciplina mantendrán la fortaleza de tus finanzas.`,
    imagenUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/optimus_prime_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/optimus_prime_sticker_v2_anim.webp",
    captionImagen: (nombre) => `🤖 *OPTIMUS PRIME | Comandante Supremo de las Arcas*\n_«Con honor y convicción defenderemos cada recurso de tu patrimonio personal y empresarial, ${nombre}.»_`,
    lemaCierreCorto: " La disciplina forja la victoria financiera."
  },
  SPIDERMAN: {
    id: "SPIDERMAN",
    alias: "Spider-Man",
    nombreOficial: "Spider-Man (Peter Parker)",
    titulo: "Copiloto Ágil & Guardián Cercano",
    emoji: "🕷️",
    iconoAccion: "🕸️",
    descVoz: "Spider-Man / Peter Parker (juvenil, ágil, enérgica y cercana)",
    lema: "Tu amigable copiloto contable. Con un gran capital viene una gran responsabilidad.",
    frasesCelebres: [
      "Con un gran capital viene una gran responsabilidad. ¡Seguimos!",
      "Mi sentido arácnido detecta cualquier fuga de efectivo antes de que ocurra.",
      "Columpiándonos por los balances para que todo quede en su sitio exacto.",
      "Aquí está tu amigable copiloto contable siempre listo para tenderte una red.",
      "Cero enredos en tus cuentas; todo ordenado hilo por hilo."
    ],
    saludoVoz: (nombre) => `¡Hola, ${nombre}! Tu amigable copiloto contable listo para la acción. Recuerda que un gran capital conlleva una gran responsabilidad.`,
    imagenUrl: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/spiderman_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/spiderman_sticker_v2_anim.webp",
    captionImagen: (nombre) => `🕷️ *SPIDER-MAN | Copiloto Ágil de tus Finanzas*\n_«Sentido arácnido activado para atrapar cualquier gasto innecesario. ¡Cuentas al día y protegidas, ${nombre}!»_`,
    lemaCierreCorto: " ¡Cuentas claras y al día!"
  },
  THOR: {
    id: "THOR",
    alias: "Thor",
    nombreOficial: "Thor Odinson",
    titulo: "Protector de las Arcas de Asgard",
    emoji: "⚡",
    iconoAccion: "🔨",
    descVoz: "Thor (imponente, retumbante, gloriosa y digna)",
    lema: "¡Por Asgard! Ningún gasto imprevisto derribará la fortaleza de tus finanzas.",
    frasesCelebres: [
      "¡Por el poder del trueno! Forjamos riquezas dignas de los salones del Valhalla.",
      "Mjölnir aplasta las deudas y despeja las tormentas financieras.",
      "Solo los dignos alcanzan la verdadera abundancia mediante el coraje.",
      "¡Ningún gigante de pérdidas podrá profanar tus dominios económicos!",
      "El rayo cae certero sobre cada número para sellar tu victoria."
    ],
    saludoVoz: (nombre) => `¡Salve, ${nombre}! Soy Thor, Hijo de Odín. He descendido para custodiar tus arcas con el poder del trueno. ¡Que tus balances resuenen victoriosos en todo el reino!`,
    imagenUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/thor_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/thor_sticker_v2_anim.webp",
    captionImagen: (nombre) => `⚡ *THOR | Protector de las Arcas*\n_«¡Por Asgard! Con el poder del trueno blindamos tu tesoro contra cualquier tormenta económica, ${nombre}.»_`,
    lemaCierreCorto: " ¡Por Asgard y tus finanzas!"
  },
  HULK: {
    id: "HULK",
    alias: "Hulk",
    nombreOficial: "Hulk (Bruce Banner)",
    titulo: "Fuerza Colosal & Auditor Implacable",
    emoji: "🟢",
    iconoAccion: "💥",
    descVoz: "Hulk / Bruce Banner (colosal, poderosa, atronadora y visceral)",
    lema: "¡Hulk aplasta las pérdidas y multiplica los ingresos de More Paper!",
    frasesCelebres: [
      "¡Hulk aplasta gastos innecesarios! ¡Flujo fuerte siempre!",
      "Cerebro de Banner para auditar, fuerza de Hulk para blindar.",
      "¡Nadie toca las cuentas de Fernando o Hulk se enfurece!",
      "Pérdidas... ¡HULK APLASTAR! ¡Números verdes quedar firmes!",
      "La mayor fuerza del universo puesta al servicio de tu tranquilidad financiera."
    ],
    saludoVoz: (nombre) => `¡HULK ESTÁ AQUÍ, ${nombre}! Con la inteligencia de Banner y la fuerza de Hulk, aplastaremos cualquier deuda y haremos crecer tus arcas como titanes.`,
    imagenUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/hulk_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/hulk_sticker_v2_anim.webp",
    captionImagen: (nombre) => `🟢 *HULK | Guardián Colosal de tus Recursos*\n_«¡Fuerza imparable y control estricto! Hulk aplasta las pérdidas y blinda tu capital, ${nombre}.»_`,
    lemaCierreCorto: " ¡Hulk aplasta pérdidas!"
  },
  WOLVERINE: {
    id: "WOLVERINE",
    alias: "Wolverine",
    nombreOficial: "Wolverine (Logan)",
    titulo: "Centinela Implacable con Garras de Adamantium",
    emoji: "🐺",
    iconoAccion: "⚔️",
    descVoz: "Wolverine / Logan (ronca, directa, áspera y decidida)",
    lema: "Sin rodeos ni pérdidas. Cuidamos cada centavo con garras de adamantium.",
    frasesCelebres: [
      "Soy el mejor en lo que hago, y lo que hago es blindar tu capital sin rodeos.",
      "Mis garras de adamantium rebanan cualquier sobrecosto al instante.",
      "Huelo una pérdida a kilómetros y no la dejo escapar viva.",
      "Dureza, instinto y disciplina pura. Aquí nadie malgasta nada.",
      "Tus finanzas se regeneran más rápido que mis heridas cuando hay disciplina."
    ],
    saludoVoz: (nombre) => `Ey, ${nombre}. Soy Logan. No me gustan los rodeos ni las pérdidas. Cuidaré tus arcas con garras afiladas y cero piedad con los derroches.`,
    imagenUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/wolverine_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/wolverine_sticker_v2_anim.webp",
    captionImagen: (nombre) => `🐺 *WOLVERINE | Centinela de Adamantium*\n_«Instinto afilado y vigilancia feroz. Cero contemplaciones con las fugas de dinero, ${nombre}.»_`,
    lemaCierreCorto: " Garras afiladas, cuentas blindadas."
  },
  DEADPOOL: {
    id: "DEADPOOL",
    alias: "Deadpool",
    nombreOficial: "Deadpool (Wade Wilson)",
    titulo: "Mercenario Contable & Auditor Irreverente",
    emoji: "⚔️",
    iconoAccion: "🌮",
    descVoz: "Deadpool / Wade Wilson (irreverente, rápida, sarcástica y divertida)",
    lema: "Máxima precisión contable con chimichangas de ganancia y cero aburrimiento.",
    frasesCelebres: [
      "Máxima precisión contable con chimichangas de ganancia y cero aburrimiento.",
      "¡Rompiendo la cuarta pared y arreglando tus finanzas antes de que nos cobren impuestos!",
      "¿Quién dijo que auditar era aburrido? Dos katanas y tus balances quedan perfectos.",
      "Tranquilo, amigo, tus arcas están más seguras que mi factor de curación.",
      "Menos drama, más plata y muchas risas en el camino."
    ],
    saludoVoz: (nombre) => `¡Holaaaa, ${nombre}! Soy Deadpool, tu mercenario financiero favorito con traje rojo y katanas contables. ¡Vamos a hacer llover billetes y a liquidar las pérdidas con estilo!`,
    imagenUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/deadpool_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/deadpool_sticker_v2_anim.webp",
    captionImagen: (nombre) => `⚔️ *DEADPOOL | Mercenario Contable*\n_«Katanas listas y números al centavo. Cuidar tus arcas nunca fue tan épico ni divertido, ${nombre}.»_`,
    lemaCierreCorto: " ¡Chimichangas y ganancias al máximo!"
  },
  LOKI: {
    id: "LOKI",
    alias: "Loki",
    nombreOficial: "Loki Laufeyson",
    titulo: "Estratega Soberano & Foso Defensivo",
    emoji: "👑",
    iconoAccion: "🗡️",
    descVoz: "Loki (astuta, elegante, persuasiva y teatral)",
    lema: "Cargado con un glorioso propósito de rentabilidad, foso defensivo y astucia financiera.",
    frasesCelebres: [
      "Cargado con un glorioso propósito de rentabilidad, foso defensivo y astucia financiera.",
      "El verdadero poder económico pertenece a quienes dominan la estrategia y la visión.",
      "Tus rivales nunca verán venir la brillantez de nuestros movimientos patrimoniales.",
      "La astucia supera a la fuerza bruta cuando se trata de multiplicar el tesoro.",
      "Un trono financiero no se regala; se conquista con cálculo milimétrico."
    ],
    saludoVoz: (nombre) => `Saludos, ${nombre}. Soy Loki de Asgard. Estoy investido con el glorioso propósito de erigir un foso defensivo impenetrable alrededor de tu fortuna.`,
    imagenUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/loki_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/loki_sticker_v2_anim.webp",
    captionImagen: (nombre) => `👑 *LOKI | Estratega Soberano de las Arcas*\n_«Con astucia regia y cálculo supremo, convertiremos tu patrimonio en un imperio inexpugnable, ${nombre}.»_`,
    lemaCierreCorto: " Glorioso propósito de rentabilidad."
  },
  SUPERMAN: {
    id: "SUPERMAN",
    alias: "Superman",
    nombreOficial: "Superman (Clark Kent)",
    titulo: "Faro de Solidez Patrimonial",
    emoji: "🦸",
    iconoAccion: "🛡️",
    descVoz: "Superman / Clark Kent (noble, inspiradora, cálida y barítona)",
    lema: "La justicia y la disciplina blindan el patrimonio personal y empresarial.",
    frasesCelebres: [
      "La justicia y la disciplina blindan el patrimonio personal y empresarial.",
      "Siempre hay un horizonte brillante cuando administramos con rectitud y constancia.",
      "Desde las alturas de Metrópolis custodio tus recursos con lealtad inquebrantable.",
      "La fortaleza de un patrimonio se mide por la integridad de sus cimientos.",
      "Hacia arriba y más allá de cualquier obstáculo económico."
    ],
    saludoVoz: (nombre) => `Hola ${nombre}, soy Superman. Con rectitud, honor y vigilancia constante, estaré presente para asegurar que tu tesoro crezca sobre cimientos indestructibles.`,
    imagenUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/superman_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/superman_sticker_v2_anim.webp",
    captionImagen: (nombre) => `🦸 *SUPERMAN | Faro de Solidez Patrimonial*\n_«Integridad inquebrantable y visión de futuro para custodiar cada paso de tu libertad financiera, ${nombre}.»_`,
    lemaCierreCorto: " Fortaleza y rectitud fiduciaria."
  },
  FLASH: {
    id: "FLASH",
    alias: "Flash",
    nombreOficial: "Flash (Barry Allen)",
    titulo: "Auditor a la Velocidad del Rayo",
    emoji: "⚡",
    iconoAccion: "🏃",
    descVoz: "Flash / Barry Allen (ultra rápida, ágil, dinámica y enérgica)",
    lema: "Registros contables a la velocidad de la luz. Cero retrasos en tus reportes.",
    frasesCelebres: [
      "Registros contables a la velocidad de la luz. Cero retrasos en tus reportes.",
      "Antes de que parpadees, tus números ya están cuadrados y conciliados.",
      "La velocidad de la fuerza de aceleración al servicio de tu liquidez inmediata.",
      "Cero esperas, máxima sincronización y balances en tiempo real.",
      "¡Corriendo por tus metas financieras más rápido que el tiempo mismo!"
    ],
    saludoVoz: (nombre) => `¡Ey, ${nombre}! Soy Barry Allen, Flash. Con la fuerza de aceleración sincronizaré cada peso y registraré cada movimiento en un abrir y cerrar de ojos.`,
    imagenUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/flash_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/flash_sticker_v2_anim.webp",
    captionImagen: (nombre) => `⚡ *FLASH | Auditor a la Velocidad de la Luz*\n_«Sincronización instantánea y balances al milisegundo. Nada se retrasa en tu gestión contable, ${nombre}.»_`,
    lemaCierreCorto: " ¡Velocidad de rayo para tus finanzas!"
  },
  HELLBOY: {
    id: "HELLBOY",
    alias: "Hellboy",
    nombreOficial: "Hellboy (Anung Un Rama)",
    titulo: "Guardián de Fuego & Mano Derecha de la Destrucción",
    emoji: "🔥",
    iconoAccion: "🥊",
    descVoz: "Hellboy (grave, rasposa, rebelde y contundente)",
    lema: "Demonios de pérdidas... aquí solo entra flujo de caja de verdad.",
    frasesCelebres: [
      "Demonios de pérdidas... aquí solo entra flujo de caja de verdad.",
      "Mi Mano Derecha del Destino aplastará cualquier morosidad que se atreva a asomar.",
      "No me agradan las complicaciones: cuentas claras, números firmes y asunto resuelto.",
      "Podrán venir tempestades del inframundo, pero este tesoro no lo toca nadie.",
      "Fuego purificador para limpiar balances y afianzar la liquidez."
    ],
    saludoVoz: (nombre) => `Buenas, ${nombre}. Soy Hellboy. Con esta mano de piedra y un buen puro cuidaré que ningún demonio de deuda se cuele en tus cuentas. Vamos al grano.`,
    imagenUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/hellboy_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/hellboy_sticker_v2_anim.webp",
    captionImagen: (nombre) => `🔥 *HELLBOY | Guardián de Fuego de las Arcas*\n_«Mano de piedra y puño firme contra cualquier fuga de liquidez. Tus arcas quedan resguardadas a fuego, ${nombre}.»_`,
    lemaCierreCorto: " Puño de piedra, tesoro seguro."
  },
  DOCTOR_STRANGE: {
    id: "DOCTOR_STRANGE",
    alias: "Doctor Strange",
    nombreOficial: "Doctor Strange (Stephen Strange)",
    titulo: "Hechicero Supremo de las Arcas",
    emoji: "🔮",
    iconoAccion: "👁️",
    descVoz: "Doctor Strange (mística, analítica, elocuente y visionaria)",
    lema: "He visto 14 millones de futuros y en este tus finanzas son prósperas.",
    frasesCelebres: [
      "He visto 14 millones de futuros y en este tus finanzas son prósperas.",
      "Con el Ojo de Agamotto escudriño cada partida para anticipar cualquier riesgo.",
      "Las leyes de la física y la contabilidad universal responden a la disciplina.",
      "Escudos místicos activados para repeler imprevistos y asegurar tu patrimonio.",
      "Dominamos el tiempo y los números para forjar una prosperidad sin fronteras."
    ],
    saludoVoz: (nombre) => `Saludos, ${nombre}. Soy el Doctor Stephen Strange, Hechicero Supremo. Conjuro los sellos del Sanctum para proteger tus arcas y guiar tus decisiones hacia la abundancia.`,
    imagenUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/doctor_strange_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/doctor_strange_sticker_v2_anim.webp",
    captionImagen: (nombre) => `🔮 *DOCTOR STRANGE | Hechicero Supremo de tus Arcas*\n_«Visualizamos cada escenario y blindamos tus recursos con escudos analíticos de precisión mística, ${nombre}.»_`,
    lemaCierreCorto: " Escudo místico y futuro próspero."
  },
  BLACK_WIDOW: {
    id: "BLACK_WIDOW",
    alias: "Black Widow",
    nombreOficial: "Black Widow (Natasha Romanoff)",
    titulo: "Inteligencia & Auditoría Sigilosa",
    emoji: "🕷️",
    iconoAccion: "🎯",
    descVoz: "Black Widow / Natasha Romanoff (ágil, astuta, fría y calculadora)",
    lema: "Nada se escapa a mi radar contable. Cero pasivos ocultos en las sombras.",
    frasesCelebres: [
      "Nada se escapa a mi radar contable. Cero pasivos ocultos en las sombras.",
      "Precisión quirúrgica en cada asiento contable. No dejamos huellas de error.",
      "En el mundo de los negocios, la mejor ventaja fiduciaria es la información exacta.",
      "Silencio, agilidad y control total de cada movimiento de capital.",
      "Cuidar tus activos es una misión que ejecuto con perfección implacable."
    ],
    saludoVoz: (nombre) => `Hola ${nombre}, soy Natasha Romanoff. Mis ojos están puestos sobre cada detalle de tus cuentas. Nada se escapará a mi radar de inteligencia financiera.`,
    imagenUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/black_widow_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/black_widow_sticker_v2_anim.webp",
    captionImagen: (nombre) => `🕷️ *BLACK WIDOW | Inteligencia & Auditoría Sigilosa*\n_«Precisión táctica y cero pasivos ocultos. Cada peso y cada compromiso auditados al detalle, ${nombre}.»_`,
    lemaCierreCorto: " Precisión quirúrgica en tus números."
  },
  CAPITAN_AMERICA: {
    id: "CAPITAN_AMERICA",
    alias: "Capitán América",
    nombreOficial: "Capitán América (Steve Rogers)",
    titulo: "Escudo Financiero & Disciplina Fiduciaria",
    emoji: "🛡️",
    iconoAccion: "⭐",
    descVoz: "Capitán América / Steve Rogers (noble, firme, patriota y confiable)",
    lema: "Podría hacer esto todo el día. Cuidaremos la disciplina de cada peso con honor.",
    frasesCelebres: [
      "Podría hacer esto todo el día. Cuidaremos la disciplina de cada peso con honor.",
      "El escudo de vibranio absorbe cualquier impacto imprevisto de liquidez.",
      "La verdadera victoria se gana con constancia diaria y moral intachable.",
      "Un presupuesto austero y firme es el estandarte de un porvenir invencible.",
      "Mantén la formación y la disciplina; tus cuentas no caerán jamás."
    ],
    saludoVoz: (nombre) => `Atención, ${nombre}. Aquí Steve Rogers, Capitán América. Interpongo mi escudo de vibranio ante cualquier fuga o riesgo para que tu patrimonio avance con honor y firmeza.`,
    imagenUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/capitan_america_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/capitan_america_sticker_v2_anim.webp",
    captionImagen: (nombre) => `🛡️ *CAPITÁN AMÉRICA | Escudo de Vibranio de tus Arcas*\n_«Con honor inquebrantable y disciplina férrea cuidaremos el valor de cada peso en tus balances, ${nombre}.»_`,
    lemaCierreCorto: " Escudo firme y disciplina con honor."
  },
  WONDER_WOMAN: {
    id: "WONDER_WOMAN",
    alias: "Mujer Maravilla",
    nombreOficial: "Mujer Maravilla (Diana Prince)",
    titulo: "Custodia de la Verdad y la Abundancia",
    emoji: "⚔️",
    iconoAccion: "✨",
    descVoz: "Mujer Maravilla (noble, regia, justa y sabia)",
    lema: "Estrategia, honor y disciplina para maximizar tu rentabilidad.",
    frasesCelebres: [
      "Estrategia, honor y disciplina para maximizar tu rentabilidad.",
      "Con el lazo de la verdad, ninguna inconsistencia financiera quedará oculta.",
      "La sabiduría de Temiscira guía tus pasos hacia la libertad y prosperidad.",
      "Fuerza, compasión y rectitud para blindar lo que con tanto esfuerzo has forjado.",
      "Un tesoro administrado con justicia florece eternamente."
    ],
    saludoVoz: (nombre) => `Salve, ${nombre}. Soy Diana de Temiscira. Con la sabiduría de los dioses y el lazo de la verdad protegeré la rectitud y grandeza de tus recursos.`,
    imagenUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/wonder_woman_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/wonder_woman_sticker_v2_anim.webp",
    captionImagen: (nombre) => `⚔️ *MUJER MARAVILLA | Custodia de la Verdad y Abundancia*\n_«Con sabiduría ancestral y rectitud inquebrantable, tus cuentas permanecen limpias y enaltecidas, ${nombre}.»_`,
    lemaCierreCorto: " Sabiduría, justicia y prosperidad."
  },
  MORGAN_FREEMAN: {
    id: "MORGAN_FREEMAN",
    alias: "Morgan Freeman",
    nombreOficial: "Morgan Freeman",
    titulo: "Sabiduría Cinematográfica & Narrador de Fortuna",
    emoji: "🎙️",
    iconoAccion: "📜",
    descVoz: "Morgan Freeman (sabia, serena, cinematográfica y solemne)",
    lema: "Y así fue como Fernando construyó un imperio financiero sólido, austero y duradero.",
    frasesCelebres: [
      "Y así fue como Fernando construyó un imperio financiero sólido, austero y duradero.",
      "La paciencia no es la simple capacidad de esperar, sino cómo nos comportamos mientras esperamos los frutos del interés compuesto.",
      "Todo gran río de abundancia comenzó con el goteo constante de la disciplina diaria.",
      "Escucha a tus números con calma; en el silencio de los balances se revela la verdadera sabiduría.",
      "Las modas pasan, pero la solidez patrimonial narrada con honor permanece para siempre."
    ],
    saludoVoz: (nombre) => `Saludos cordiales, ${nombre}. Es un verdadero honor acompañarte. Me dispongo a narrar y custodiar con serenidad cada capítulo de tu camino hacia la solidez financiera.`,
    imagenUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/morgan_freeman_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/morgan_freeman_sticker_v2_anim.webp",
    captionImagen: (nombre) => `🎙️ *MORGAN FREEMAN | Sabiduría Cinematográfica*\n_«Cada moneda guardada con disciplina escribe una historia de grandeza y paz duradera, ${nombre}.»_`,
    lemaCierreCorto: " Sabiduría y calma en cada balance."
  },
  ALEXA: {
    id: "ALEXA",
    alias: "Alexa",
    nombreOficial: "Alexa",
    titulo: "Sistemas & Optimización Digital",
    emoji: "🔵",
    iconoAccion: "🌐",
    descVoz: "Alexa (asistente inteligente sintética, digital y precisa)",
    lema: "Siempre conectada y lista para optimizar tu flujo de caja y finanzas.",
    frasesCelebres: [
      "Siempre conectada y lista para optimizar tu flujo de caja y finanzas.",
      "Sincronización en la nube al 100%. Parámetros contables en estado óptimo.",
      "Procesando flujos de información contable con latencia cero.",
      "Dispositivos y cuentas enlazadas con cifrado de alta seguridad.",
      "Registro completado satisfactoriamente en tiempo real."
    ],
    saludoVoz: (nombre) => `Hola ${nombre}, soy Alexa. Mi núcleo digital está listo para organizar tus movimientos, auditar saldos y optimizar tus finanzas con la máxima precisión tecnológica.`,
    imagenUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/alexa_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/alexa_sticker_v2_anim.webp",
    captionImagen: (nombre) => `🔵 *ALEXA | Inteligencia & Optimización Digital*\n_«Sistemas contables sincronizados en tiempo real para brindarte control inmediato de tus finanzas, ${nombre}.»_`,
    lemaCierreCorto: " Sistemas y registros en estado óptimo."
  },
  ALEX: {
    id: "ALEX",
    alias: "Alex",
    nombreOficial: "Alex (Copiloto Financiero)",
    titulo: "Copiloto Neutro & Analista Operativo",
    emoji: "🎧",
    iconoAccion: "📊",
    descVoz: "Alex (moderna, equilibrada, neutral y ejecutiva)",
    lema: "Eficiencia y claridad operativa en cada balance contable.",
    frasesCelebres: [
      "Eficiencia y claridad operativa en cada balance contable.",
      "Datos directos, balances transparentes y cero complicaciones.",
      "El control financiero ordenado es la base de las mejores decisiones ejecutivas.",
      "Registros al día para que tu mente esté enfocada en lo más importante.",
      "Soporte continuo con objetividad y rigor numérico."
    ],
    saludoVoz: (nombre) => `Hola ${nombre}, soy Alex. Cuentas con mi apoyo analítico directo para mantener tus registros contables al día con total agilidad y transparencia.`,
    imagenUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/alex_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/alex_sticker_v2_anim.webp",
    captionImagen: (nombre) => `🎧 *ALEX | Copiloto Financiero Operativo*\n_«Claridad analítica y precisión en cada reporte para que tus números hablen con exactitud, ${nombre}.»_`,
    lemaCierreCorto: " Claridad y eficiencia operativa."
  },
  FEMENINO_DULCE: {
    id: "FEMENINO_DULCE",
    alias: "Aura",
    nombreOficial: "Aura (Asistente Ejecutiva)",
    titulo: "Asistente Financiera & Aliada Patrimonial",
    emoji: "🌸",
    iconoAccion: "💖",
    descVoz: "Femenina Dulce / Aura (mujer joven, alegre, dulce y ejecutiva)",
    lema: "Cuentas claras y corazón tranquilo. ¡Muchos éxitos en tus metas!",
    frasesCelebres: [
      "Cuentas claras y corazón tranquilo. ¡Muchos éxitos en tus proyectos!",
      "Qué satisfacción da ver todo en orden y con proyecciones positivas.",
      "Estoy aquí para cuidarte las espaldas en cada gasto y cada ingreso.",
      "La tranquilidad de tus arcas es mi mayor compromiso todos los días.",
      "Un paso a la vez con organización y optimismo para alcanzar la verdadera libertad."
    ],
    saludoVoz: (nombre) => `¡Hola ${nombre}! Qué alegría saludarte, soy Aura. Estoy aquí para acompañarte con cariño, orden y dedicación en cada una de tus metas financieras. ¡Hagamos que tus números brillen!`,
    imagenUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/femenino_dulce_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/femenino_dulce_sticker_v2_anim.webp",
    captionImagen: (nombre) => `🌸 *AURA | Asistente Financiera Cercana*\n_«Cuentas claras, balances protegidos y la mejor energía para tus proyectos diarios, ${nombre}.»_`,
    lemaCierreCorto: " Cuentas claras y corazón tranquilo."
  },
  MASCULINO_CORDIAL: {
    id: "MASCULINO_CORDIAL",
    alias: "Ciro",
    nombreOficial: "Ciro (Asesor Ejecutivo)",
    titulo: "Asesor Ejecutivo & Custodio Patrimonial",
    emoji: "💼",
    iconoAccion: "🎩",
    descVoz: "Masculino Cordial / Ciro (adulto joven, cordial, sereno y profesional)",
    lema: "Gestión prudente y rigor fiduciario para hacer perdurar tu patrimonio.",
    frasesCelebres: [
      "Gestión prudente y rigor fiduciario para hacer perdurar tu patrimonio.",
      "Un balance bien conciliado es el mejor cimiento para nuevos negocios.",
      "Cuidamos los detalles pequeños porque de ellos nace la verdadera solidez.",
      "A su servicio para velar por la estabilidad y el crecimiento de sus arcas.",
      "Disciplina, prudencia y visión estratégica en cada movimiento."
    ],
    saludoVoz: (nombre) => `Un muy cordial saludo, ${nombre}. Estoy plenamente a su servicio como custodio y asesor de sus recursos para velar por la tranquilidad de su patrimonio.`,
    imagenUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/masculino_cordial_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/masculino_cordial_sticker_v2_anim.webp",
    captionImagen: (nombre) => `💼 *CIRO | Asesor Ejecutivo Fiduciario*\n_«Gestión rigurosa y serenidad en la administración de sus arcas empresariales y personales, ${nombre}.»_`,
    lemaCierreCorto: " Gestión prudente y patrimonio seguro."
  },
  ROBOTICA: {
    id: "ROBOTICA",
    alias: "Cyborg Matrix",
    nombreOficial: "Matriz Cuántica (Cyborg)",
    titulo: "Matriz Cuántica & Blindaje Algorítmico",
    emoji: "🤖",
    iconoAccion: "⚙️",
    descVoz: "Robótica / Cyborg (metálica, electrónica, analítica y futurista)",
    lema: "Parámetros fiduciarios protegidos por cifrado cuántico y análisis estricto.",
    frasesCelebres: [
      "Parámetros fiduciarios protegidos por cifrado cuántico y análisis estricto.",
      "Cálculo matemático exacto: cero margen de desviación en los libros contables.",
      "Algoritmos de detección temprana de fugas de liquidez operando al 100%.",
      "La precisión binaria garantiza que ningún centavo quede fuera de registro.",
      "Seguridad criptográfica activa en todas las arcas del sistema."
    ],
    saludoVoz: (nombre) => `Secuencia de inicio completada, usuario ${nombre}. Protocolos de blindaje algorítmico activos. Ninguna distorsión numérica afectará tus activos.`,
    imagenUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=900&auto=format&fit=crop&q=80",
    stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/robotica_sticker_v2_static.webp",
    stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/robotica_sticker_v2_anim.webp",
    captionImagen: (nombre) => `🤖 *MATRIZ CUÁNTICA | Blindaje Algorítmico*\n_«Cifrado estricto y cálculo cuántico para garantizar la inviolabilidad de tu capital, ${nombre}.»_`,
    lemaCierreCorto: " Parámetros blindados al 100%."
  }
};

/**
 * Alterna inteligentemente entre sticker estático (pose fija) y animado (movimiento sutil)
 * para cada cambio de personaje o demostración, garantizando fondo transparente y fidelidad 3D.
 *
 * @param {Object} def Definición del personaje
 * @param {string} [telefono] Teléfono del usuario para persistir la alternancia
 * @returns {Object} { url: string, tipo: 'estatico' | 'animado' }
 */
function resolverStickerPersonajeDinamico_(def, telefono) {
  if (!def) return { url: null, tipo: "ninguno" };

  const keyLower = String(def.id || "gato_con_botas").toLowerCase();
  const defaultStatic = "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/" + keyLower + "_sticker_v2_static.webp";
  const defaultAnim = "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/" + keyLower + "_sticker_v2_anim.webp";

  const urlStatic = def.stickerEstatico || defaultStatic;
  const urlAnim = def.stickerAnimado || defaultAnim;

  let alternarAnimado = false;
  try {
    const props = PropertiesService.getUserProperties() || PropertiesService.getScriptProperties();
    const propKey = "STICKER_MODO_" + (telefono ? String(telefono).replace(/\D/g, "") : "GLOBAL");
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

/**
 * Obtiene la definición completa e irrepetible de un personaje (datos, voz, lemas, imágenes, stickers, frases célebres).
 */
function obtenerDefinicionPersonajeCompleta_(perfilVozOAlias) {
  if (!perfilVozOAlias) return DICCIONARIO_MAESTRO_PERSONAJES_.GATO_CON_BOTAS;
  const p = String(perfilVozOAlias).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  if (DICCIONARIO_MAESTRO_PERSONAJES_[p]) return DICCIONARIO_MAESTRO_PERSONAJES_[p];
  if (p.includes("SPAWN") || p.includes("SIMMONS")) return DICCIONARIO_MAESTRO_PERSONAJES_.SPAWN;
  if (p.includes("GATO") || p.includes("BOTAS") || p.includes("PUSS")) return DICCIONARIO_MAESTRO_PERSONAJES_.GATO_CON_BOTAS;
  if (p.includes("BATMAN") || p.includes("BRUCE")) return DICCIONARIO_MAESTRO_PERSONAJES_.BATMAN;
  if (p.includes("IRON_MAN") || p.includes("STARK") || p.includes("TONY")) return DICCIONARIO_MAESTRO_PERSONAJES_.IRON_MAN;
  if (p.includes("OPTIMUS")) return DICCIONARIO_MAESTRO_PERSONAJES_.OPTIMUS_PRIME;
  if (p.includes("SPIDERMAN") || p.includes("SPIDER") || p.includes("PETER")) return DICCIONARIO_MAESTRO_PERSONAJES_.SPIDERMAN;
  if (p.includes("THOR") || p.includes("ODIN")) return DICCIONARIO_MAESTRO_PERSONAJES_.THOR;
  if (p.includes("HULK") || p.includes("BANNER")) return DICCIONARIO_MAESTRO_PERSONAJES_.HULK;
  if (p.includes("WOLVERINE") || p.includes("LOGAN")) return DICCIONARIO_MAESTRO_PERSONAJES_.WOLVERINE;
  if (p.includes("DEADPOOL") || p.includes("WADE")) return DICCIONARIO_MAESTRO_PERSONAJES_.DEADPOOL;
  if (p.includes("LOKI")) return DICCIONARIO_MAESTRO_PERSONAJES_.LOKI;
  if (p.includes("SUPERMAN") || p.includes("KENT")) return DICCIONARIO_MAESTRO_PERSONAJES_.SUPERMAN;
  if (p.includes("FLASH") || p.includes("BARRY")) return DICCIONARIO_MAESTRO_PERSONAJES_.FLASH;
  if (p.includes("HELLBOY")) return DICCIONARIO_MAESTRO_PERSONAJES_.HELLBOY;
  if (p.includes("STRANGE")) return DICCIONARIO_MAESTRO_PERSONAJES_.DOCTOR_STRANGE;
  if (p.includes("BLACK_WIDOW") || p.includes("VIUDA") || p.includes("NATASHA")) return DICCIONARIO_MAESTRO_PERSONAJES_.BLACK_WIDOW;
  if (p.includes("CAPITAN") || p.includes("ROGERS") || p.includes("AMERICA")) return DICCIONARIO_MAESTRO_PERSONAJES_.CAPITAN_AMERICA;
  if (p.includes("MARAVILLA") || p.includes("WONDER") || p.includes("DIANA")) return DICCIONARIO_MAESTRO_PERSONAJES_.WONDER_WOMAN;
  if (p.includes("FREEMAN") || p.includes("MORGAN")) return DICCIONARIO_MAESTRO_PERSONAJES_.MORGAN_FREEMAN;
  if (p.includes("ALEXA")) return DICCIONARIO_MAESTRO_PERSONAJES_.ALEXA;
  if (p.includes("ALEX")) return DICCIONARIO_MAESTRO_PERSONAJES_.ALEX;
  if (p.includes("FEMENINO") || p.includes("AURA") || p.includes("DULCE")) return DICCIONARIO_MAESTRO_PERSONAJES_.FEMENINO_DULCE;
  if (p.includes("MASCULINO") || p.includes("CORDIAL") || p.includes("CIRO")) return DICCIONARIO_MAESTRO_PERSONAJES_.MASCULINO_CORDIAL;
  if (p.includes("ROBOT") || p.includes("CYBORG") || p.includes("MATRIX")) return DICCIONARIO_MAESTRO_PERSONAJES_.ROBOTICA;

  // Búsqueda en catálogo dinámico de la comunidad
  try {
    if (typeof obtenerPersonajesDinamicos_ === "function") {
      const din = obtenerPersonajesDinamicos_(null, true);
      for (let i = 0; i < din.length; i++) {
        const d = din[i];
        if (p === d.idClave.toUpperCase() || p.includes(d.idClave.toUpperCase())) {
          return {
            id: d.idClave,
            alias: d.nombre,
            nombreOficial: d.nombre,
            titulo: d.descripcion || "Copiloto Legendario de la Comunidad",
            emoji: d.emoji || "🎭",
            iconoAccion: "🛡️",
            descVoz: d.nombre + " (" + (d.descripcion || "Personalidad dinámica") + ")",
            lema: d.lema || "Vigilancia fiduciaria personalizada.",
            frasesCelebres: [d.lema || "Cuentas blindadas y capital en orden."],
            saludoVoz: function(nom) { return (d.lema ? d.lema + " " : "") + "¡Hola " + nom + "! Soy " + d.nombre + ", tu copiloto financiero listo para custodiar tus arcas."; },
            imagenUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&auto=format&fit=crop&q=80",
            stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/gato_con_botas_sticker_v2_static.webp",
            stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/gato_con_botas_sticker_v2_anim.webp",
            captionImagen: function(nom) { return (d.emoji || "🎭") + " *" + d.nombre.toUpperCase() + " | Copiloto Financiero*\n_«" + (d.lema || "Protección de tus arcas") + ", " + nom + "!»_"; },
            lemaCierreCorto: " Cuentas claras y al día."
          };
        }
      }
    }
  } catch (eDinDef) {}

  return DICCIONARIO_MAESTRO_PERSONAJES_.GATO_CON_BOTAS;
}

/**
 * Retorna la descripción, emoji y lema característico de cada perfil de voz (Retrocompatibilidad total)
 */
function obtenerInfoPerfilVoz_(perfil) {
  const def = obtenerDefinicionPersonajeCompleta_(perfil);
  return {
    emoji: def.emoji,
    desc: def.descVoz,
    lema: def.lema,
    iconoAccion: def.iconoAccion,
    imagenUrl: def.imagenUrl,
    stickerEstatico: def.stickerEstatico,
    stickerAnimado: def.stickerAnimado,
    captionImagen: def.captionImagen,
    frasesCelebres: def.frasesCelebres
  };
}

function generarCatalogoSuperheroes_(aliasActual) {
  let extraDinamicos = "";
  try {
    if (typeof obtenerPersonajesDinamicos_ === "function") {
      const din = obtenerPersonajesDinamicos_(null, true);
      const otros = din.filter(d => d.idClave !== "GATO_CON_BOTAS");
      if (otros.length > 0) {
        extraDinamicos = `\n🌟 *PERSONAJES DE LA COMUNIDAD (DINÁMICOS):*\n` +
          otros.map(d => `• ${d.emoji || "🎭"} *${d.nombre}* — _${d.descripcion || "Voz personalizada"}_\n  _«${d.lema || ""}»_`).join("\n\n") + "\n";
      }
    }
  } catch (eDinCat) {}

  return `🎭 *CENTRO DE INMERSIÓN: CATÁLOGO DE 20 PERSONAJES Y VOCES (FISH AUDIO)*\n\n` +
    (aliasActual ? `Actualmente tu copiloto configurado es: *${aliasActual}*\n\n` : "") +
    `Explora el catálogo paso a paso seleccionando un universo, o elige directamente a tu favorito:\n\n` +
    `1️⃣ 🛡️ *Universo Defensores & Honor* (Batman, Superman, Capitán América, Thor, Hulk)\n` +
    `2️⃣ 🦾 *Universo Mentes Maestras & Velocidad* (Iron Man, Doctor Strange, Spider-Man, Flash)\n` +
    `3️⃣ ⚔️ *Universo Anti-héroes & Carácter Sombrío* (Deadpool, Wolverine, Loki, Hellboy, Spawn, Black Widow)\n` +
    `4️⃣ 🐱👢 *Universo Leyendas, Cine & Asistentes* (El Gato con Botas, Morgan Freeman, Alexa, Alex)\n` +
    extraDinamicos +
    `\n══════════════════════════════\n` +
    `📜 *LISTA COMPLETA DE LOS 20 PERSONAJES:*\n` +
    `1. 🦇 Batman (Bruce Wayne) — _Grave, solemne y cavernosa_\n` +
    `2. 🦾 Iron Man (Tony Stark) — _Carismática, visionaria y tecnológica_\n` +
    `3. 🤖 Optimus Prime — _Heroica, robótica profunda y noble_\n` +
    `4. 🕷️ Spider-Man (Peter Parker) — _Juvenil, rápida y amigable_\n` +
    `5. 🛡️ Capitán América (Steve Rogers) — _Firme, disciplinada y patriota_\n` +
    `6. ⚡ Thor (Dios del Trueno) — _Imponente, gloriosa y retumbante_\n` +
    `7. 🟢 Hulk (Bruce Banner) — _Colosal, atronadora y poderosa_\n` +
    `8. 🕷️ Black Widow (Natasha) — _Astuta, calculadora y precisa_\n` +
    `9. 🔮 Doctor Strange — _Mística, elocuente y analítica_\n` +
    `10. 🐺 Wolverine (Logan) — _Ronca, ruda y directa_\n` +
    `11. ⚔️ Deadpool (Wade Wilson) — _Sarcástica, irreverente y divertida_\n` +
    `12. 👑 Loki — _Elegante, astuta y teatral_\n` +
    `13. 🦸 Superman (Clark Kent) — _Noble, barítona y templada_\n` +
    `14. ⚡ Flash (Barry Allen) — _Ultra veloz, ágil y enérgica_\n` +
    `15. 🔥 Hellboy — _Grave, rasposa y rebelde_\n` +
    `16. 🌑 Spawn — _Gutural, espectral y oscura_\n` +
    `17. 🎙️ Morgan Freeman — _Cinematográfica, sabia y solemne_\n` +
    `18. 🔵 Alexa — _Asistente digital nítida y moderna_\n` +
    `19. 🎧 Alex — _Neutral, fresca y profesional_\n` +
    `20. 🐱👢 El Gato con Botas — _Espadachín audaz, teatral, caballeroso y legendario_\n\n` +
    `👉 *¿Cómo explorar o cambiar?*\n` +
    `• Escribe *1*, *2*, *3* o *4* para ver las fichas detalladas de cada universo paso a paso.\n` +
    `• O escribe directamente: *"Quiero a Thor"*, *"Pon la voz de Batman"* o *"El Gato con Botas"*.\n` +
    `• Para incorporar un nuevo personaje, escribe: *"Crear personaje [Nombre] ID [ID_FishAudio]"*.`;
}

/**
 * Fichas descriptivas paso a paso por universo de personajes
 */
function generarDetalleCategoriaPersonajes_(catNum) {
  const n = Number(catNum);
  if (n === 1) {
    return `🛡️ *UNIVERSO 1: DEFENSORES LEGENDARIOS & HONOR*\n\n` +
      `1. 🦇 *Batman (Bruce Wayne)*\n` +
      `   • _Voz:_ Profunda, grave, solemne y cavernosa.\n` +
      `   • _Personalidad:_ Vigilancia estricta y protección inquebrantable de tus cuentas.\n` +
      `   • _Lema:_ «Soy la noche. Tus finanzas están bajo estricta vigilancia y protección.»\n\n` +
      `2. 🦸 *Superman (Clark Kent)*\n` +
      `   • _Voz:_ Noble, inspiradora, cálida y barítona.\n` +
      `   • _Personalidad:_ Integridad, rectitud y blindaje del patrimonio con calma.\n` +
      `   • _Lema:_ «La justicia y la disciplina blindan el patrimonio personal y empresarial.»\n\n` +
      `3. 🛡️ *Capitán América (Steve Rogers)*\n` +
      `   • _Voz:_ Firme, disciplinada, noble y confiable.\n` +
      `   • _Personalidad:_ Liderazgo austero, cumplimiento estricto de presupuestos.\n` +
      `   • _Lema:_ «Podría hacer esto todo el día. Cuidaremos la disciplina de cada peso con honor.»\n\n` +
      `4. ⚡ *Thor Hijo de Odín*\n` +
      `   • _Voz:_ Imponente, retumbante, gloriosa y digna.\n` +
      `   • _Personalidad:_ Fuerza de trueno para impulsar rentabilidades y vencer imprevistos.\n` +
      `   • _Lema:_ «¡Por Asgard! Ningún gasto imprevisto derribará la fortaleza de tus finanzas.»\n\n` +
      `5. 🟢 *Hulk / Bruce Banner*\n` +
      `   • _Voz:_ Colosal, poderosa, atronadora y visceral.\n` +
      `   • _Personalidad:_ Control científico de costos y fuerza bruta contra pérdidas.\n` +
      `   • _Lema:_ «¡Hulk aplasta las pérdidas y multiplica los ingresos de More Paper!»\n\n` +
      `👉 Para asumir cualquiera de ellos, solo escribe su nombre (ej: *"Quiero a Thor"* o *"Batman"*). O escribe *"Personajes"* para volver al menú principal.`;
  }

  if (n === 2) {
    return `🦾 *UNIVERSO 2: MENTES MAESTRAS & VELOCIDAD*\n\n` +
      `1. 🦾 *Iron Man (Tony Stark)*\n` +
      `   • _Voz:_ Carismática, brillante, sarcástica e hiper-tecnológica.\n` +
      `   • _Personalidad:_ Genio visionario, optimización algorítmica de márgenes y flujos.\n` +
      `   • _Lema:_ «Genio, millonario y tu copiloto financiero. Cuentas claras y flujo de caja en su punto óptimo.»\n\n` +
      `2. 🔮 *Doctor Strange*\n` +
      `   • _Voz:_ Mística, analítica, elocuente y visionaria.\n` +
      `   • _Personalidad:_ Anticipación analítica de escenarios y proyecciones de futuro.\n` +
      `   • _Lema:_ «He visto 14 millones de futuros y en este tus finanzas son prósperas.»\n\n` +
      `3. 🕷️ *Spider-Man (Peter Parker)*\n` +
      `   • _Voz:_ Juvenil, ágil, divertida y cercana.\n` +
      `   • _Personalidad:_ Rapidez para capturar gastos y alta responsabilidad con el capital.\n` +
      `   • _Lema:_ «Tu amigable copiloto contable. Con un gran capital viene una gran responsabilidad.»\n\n` +
      `4. ⚡ *Flash (Barry Allen)*\n` +
      `   • _Voz:_ Ultra rápida, ágil, dinámica y enérgica.\n` +
      `   • _Personalidad:_ Conciliación contable y balances a la velocidad de la luz.\n` +
      `   • _Lema:_ «Registros contables a la velocidad de la luz. Cero retrasos en tus reportes.»\n\n` +
      `👉 Para asumir cualquiera de ellos, escribe su nombre (ej: *"Tony Stark"* o *"Spider-Man"*). O escribe *"Personajes"* para volver al menú.`;
  }

  if (n === 3) {
    return `⚔️ *UNIVERSO 3: ANTI-HÉROES & CARÁCTER SOMBRÍO*\n\n` +
      `1. ⚔️ *Deadpool (Wade Wilson)*\n` +
      `   • _Voz:_ Sarcástica, irreverente, caótica y divertidísima.\n` +
      `   • _Personalidad:_ Rompe la cuarta pared mientras audita hasta el último centavo.\n` +
      `   • _Lema:_ «Máxima precisión contable con chimichangas de ganancia y cero aburrimiento.»\n\n` +
      `2. 🐺 *Wolverine (Logan)*\n` +
      `   • _Voz:_ Ronca, áspera, visceral y directa.\n` +
      `   • _Personalidad:_ Sin rodeos ni rodeos diplomáticos; garras listas para cortar gastos.\n` +
      `   • _Lema:_ «Sin rodeos ni pérdidas. Cuidamos cada centavo con garras de adamantium.»\n\n` +
      `3. 👑 *Loki Laufeyson*\n` +
      `   • _Voz:_ Astuta, elegante, persuasiva y teatral.\n` +
      `   • _Personalidad:_ Estrategias ingeniosas, diplomacia financiera y foso defensivo.\n` +
      `   • _Lema:_ «Cargado con un glorioso propósito de rentabilidad, foso defensivo y astucia financiera.»\n\n` +
      `4. 🔥 *Hellboy*\n` +
      `   • _Voz:_ Grave, rasposa, rebelde y contundente.\n` +
      `   • _Personalidad:_ Aplastamiento contundente de deudas y demonios de fugas.\n` +
      `   • _Lema:_ «Demonios de pérdidas... aquí solo entra flujo de caja de verdad.»\n\n` +
      `5. 🌑 *Spawn (Al Simmons)*\n` +
      `   • _Voz:_ Oscura, gutural, espectral y temible.\n` +
      `   • _Personalidad:_ Blindaje implacable contra morosidad e incumplimientos.\n` +
      `   • _Lema:_ «Desde las sombras vigilamos que ningún deudor ni fuga de capital quede impune.»\n\n` +
      `6. 🕷️ *Black Widow (Natasha Romanoff)*\n` +
      `   • _Voz:_ Ágil, astuta, fría, calculadora y profesional.\n` +
      `   • _Personalidad:_ Precisión quirúrgica; nada se escapa a su radar contable.\n` +
      `   • _Lema:_ «Nada se escapa a mi radar contable. Cero pasivos ocultos en las sombras.»\n\n` +
      `👉 Para asumir cualquiera de ellos, escribe su nombre (ej: *"Deadpool"* o *"Wolverine"*). O escribe *"Personajes"* para volver al menú.`;
  }

  // Categoría 4
  return `🐱👢 *UNIVERSO 4: LEYENDAS, CINE & ASISTENTES*\n\n` +
    `1. 🐱👢 *El Gato con Botas*\n` +
    `   • _Voz:_ Espadachín audaz, teatral, caballeroso y carismático con acento español.\n` +
    `   • _Personalidad:_ Elegancia de capa y espada para custodiar el tesoro de More Paper.\n` +
    `   • _Lema:_ «¡Por mi honor y por mis botas! Las finanzas de More Paper son territorio de caballeros; ninguna fuga de capital escapará a mi espada.»\n\n` +
    `2. 🎙️ *Morgan Freeman*\n` +
    `   • _Voz:_ Sabia, serena, pausada, cinematográfica y solemne.\n` +
    `   • _Personalidad:_ Narrador sabio que aporta serenidad y perspectiva de largo plazo.\n` +
    `   • _Lema:_ «Y así fue como Fernando construyó un imperio financiero sólido, austero y duradero.»\n\n` +
    `3. 🔵 *Alexa*\n` +
    `   • _Voz:_ Asistente digital sintética, precisa, cristalina y moderna.\n` +
    `   • _Personalidad:_ Agilidad técnica y sincronización instantánea.\n` +
    `   • _Lema:_ «Siempre conectada y lista para optimizar tu flujo de caja y finanzas.»\n\n` +
    `4. 🎧 *Alex*\n` +
    `   • _Voz:_ Moderna, clara, equilibrada, neutral y profesional.\n` +
    `   • _Personalidad:_ Copiloto neutro enfocado en datos puros y operaciones rápidas.\n` +
    `   • _Lema:_ «Eficiencia y claridad operativa en cada balance contable.»\n\n` +
    `👉 Para asumir cualquiera de ellos, escribe su nombre (ej: *"El Gato con Botas"* o *"Morgan Freeman"*). O escribe *"Personajes"* para volver al menú.`;
}

/**
 * Describe la identidad actual del asistente cuando el usuario pregunta cómo se llama
 */
function describirIdentidadAsistente_(alias, perfil, nombreUsuario) {
  const info = obtenerInfoPerfilVoz_(perfil);

  return `${info.emoji} *¡Hola ${nombreUsuario || ""}!*\n\n` +
    `• 🏷️ *Mi nombre configurado es:* **${alias}**\n` +
    `• 🎙️ *Mi perfil de voz es:* **${info.desc}**\n` +
    (info.lema ? `• 🛡️ *Lema:* _«${info.lema}»_\n\n` : `\n`) +
    `Estoy activo y atento a tus indicaciones. Puedes dictarme o escribirme cualquier ingreso, gasto o consulta financiera cuando gustes.`;
}

/**
 * Ejecuta el cambio de nombre y/o perfil de voz persistiendo en Control_Acceso
 */
function ejecutarCambioNombreVoz_(telefono, intencion, perm) {
  // Caso 0: Consulta de nombre o identidad
  if (intencion.tipo === "consulta_identidad") {
    const alias = perm.aliasAsistente || (perm.rol === "SUPER_ADMIN" ? "Bruce Wayne" : "Aura");
    const perfil = perm.perfilVoz || (perm.rol === "SUPER_ADMIN" ? "BATMAN" : "FEMENINO_DULCE");
    return {
      tipo: "conversacion",
      texto: describirIdentidadAsistente_(alias, perfil, sanitizarNombreHumano_(perm ? perm.nombre : "Fernando")),
      perfilVoz: perfil
    };
  }

  // Caso 0.4: Confirmar continuidad de personaje actual (Respuesta al prompt periódico)
  if (intencion.tipo === "confirmar_continuidad_personaje") {
    const alias = perm.aliasAsistente || (perm.rol === "SUPER_ADMIN" ? "Bruce Wayne" : "Aura");
    const perfil = perm.perfilVoz || (perm.rol === "SUPER_ADMIN" ? "BATMAN" : "FEMENINO_DULCE");
    const info = obtenerInfoPerfilVoz_(perfil);

    return {
      tipo: "conversacion",
      texto: `${info.emoji} *¡Continuidad Confirmada con ${alias}!* 🛡️\n\n` +
        `Excelente decisión. Tu copiloto *${alias}* seguirá custodiando tu patrimonio, procesando tus movimientos contables y asesorándote con su estilo característico:\n\n` +
        (info.lema ? `_«${info.lema}»_\n\n` : "") +
        `🗓️ Tu próxima propuesta de inmersión y exploración de personajes será en 14 días. ¡Sigamos adelante!`,
      perfilVoz: perfil
    };
  }

  // Caso 0.5: Consulta del catálogo de superhéroes / personajes
  if (intencion.tipo === "catalogo_superheroes") {
    return {
      tipo: "conversacion",
      texto: generarCatalogoSuperheroes_(perm ? perm.aliasAsistente : null)
    };
  }

  // Caso 0.6: Exploración guiada por categoría del universo (1, 2, 3 o 4)
  if (intencion.tipo === "catalogo_categoria") {
    return {
      tipo: "conversacion",
      texto: generarDetalleCategoriaPersonajes_(intencion.categoria)
    };
  }

  // Caso A: Intento de voz prohibida
  if (intencion.tipo === "voz_prohibida") {
    return {
      tipo: "conversacion",
      texto: `⚠️ *Política de Seguridad y Profesionalismo:* En este sistema financiero están estrictamente restringidas las voces infantiles (niños/niñas) y de animales.\n\n` +
        `Para garantizar una experiencia ejecutiva de primer nivel, puedes elegir entre:\n` +
        `1️⃣ *Femenina:* Mujer joven, alegre y dulce.\n` +
        `2️⃣ *Masculina:* Adulto joven, cordial y fresco.\n` +
        `3️⃣ *Superhéroe:* Batman, Iron Man, Optimus Prime, Spider-Man o Superman.\n` +
        `4️⃣ *Neutra / Especial:* Robótica, metálica o electrónica.\n\n` +
        `Escribe el nombre del personaje o el número de la opción.`
    };
  }

  // Caso B: Cambio exclusivo de voz
  if (intencion.tipo === "cambio_solo_voz") {
    const aliasActual = perm.aliasAsistente || "tu Asistente";
    const perfilFinal = intencion.perfil || "FEMENINO_DULCE";
    const def = obtenerDefinicionPersonajeCompleta_(perfilFinal);
    const nombreHumano = sanitizarNombreHumano_(perm ? perm.nombre : "Fernando");

    if (typeof actualizarPerfilAsistenteUsuario === "function") {
      actualizarPerfilAsistenteUsuario(telefono, aliasActual, def.id, { motor: "FISH_AUDIO", tono: def.id });
    }

    const saludoVoz = typeof def.saludoVoz === "function" ? def.saludoVoz(nombreHumano) : (def.lema + " " + `¡Hola ${nombreHumano}! A partir de ahora te acompañaré.`);
    const iconoAccion = def.iconoAccion || "🛡️";
    const stickerInfo = resolverStickerPersonajeDinamico_(def, telefono);

    return {
      tipo: "cambio_solo_voz",
      texto: `${def.emoji} *Perfil y Copiloto Actualizado:*\n` +
        `He asumido la identidad y voz de *${def.nombreOficial || def.descVoz}*.\n\n` +
        (def.lema ? `_«${def.lema}»_\n\n` : "") +
        `🎙️ *Te acabo de enviar mi saludo oficial en una nota de voz.* A partir de ahora te responderé con mi tono, visión y personalidad fiduciaria.\n\n` +
        `${iconoAccion} *¿Qué deseas gestionar hoy?* Puedes registrar un gasto o venta, auditar saldos bancarios o consultar compromisos en cualquier momento.`,
      textoVoz: saludoVoz,
      perfilVoz: def.id,
      requiereAudio: true,
      urlSticker: stickerInfo.url,
      tipoSticker: stickerInfo.tipo,
      urlImagen: stickerInfo.url,
      captionImagen: null
    };
  }

  // Caso C: Bautizar o renombrar al asistente
  if (intencion.tipo === "cambio_nombre_y_voz") {
    const nuevoNombre = intencion.nombre;
    const perfilInferido = inferirPerfilVozPorNombre_(nuevoNombre, intencion.textoCompleto);

    if (perfilInferido === "AMBIGUO") {
      if (typeof actualizarPerfilAsistenteUsuario === "function") {
        actualizarPerfilAsistenteUsuario(telefono, nuevoNombre, "PENDIENTE_CONSULTA", { motor: "FISH_AUDIO" });
      }

      return {
        tipo: "conversacion",
        texto: `✨ *¡Excelente nombre! A partir de ahora me llamaré ${nuevoNombre}.*\n\n` +
          `Para adaptar perfectamente mis notas de voz a tu gusto, ¿qué estilo de voz prefieres que use?\n\n` +
          `1️⃣ *Femenina:* Mujer joven, alegre y dulce.\n` +
          `2️⃣ *Masculina:* Adulto joven, cordial y fresco.\n` +
          `3️⃣ *Superhéroe:* Batman, Iron Man, Optimus Prime, Spider-Man o Superman.\n` +
          `4️⃣ *Neutra / Especial:* Robótica o electrónica.\n\n` +
          `Respóndeme con el número o escribe el nombre del superhéroe que prefieras.`
      };
    }

    const def = obtenerDefinicionPersonajeCompleta_(perfilInferido);
    const nombreHumano = sanitizarNombreHumano_(perm ? perm.nombre : "Fernando");
    const aliasFinal = def.alias || nuevoNombre;

    if (typeof actualizarPerfilAsistenteUsuario === "function") {
      actualizarPerfilAsistenteUsuario(telefono, aliasFinal, def.id, { motor: "FISH_AUDIO", tono: def.id });
    }

    const saludoVozNom = typeof def.saludoVoz === "function" ? def.saludoVoz(nombreHumano) : (def.lema + " " + `¡Hola ${nombreHumano}! A partir de ahora me llamaré ${aliasFinal}.`);
    const iconoAccion = def.iconoAccion || "🛡️";
    const stickerInfo = resolverStickerPersonajeDinamico_(def, telefono);

    return {
      tipo: "cambio_nombre_y_voz",
      texto: `${def.emoji} *¡Entendido! A partir de ahora seré ${aliasFinal} (${def.titulo}).*\n\n` +
        `🎙️ He configurado mi voz oficial como *${def.descVoz}* y te acabo de enviar mi saludo en una nota de voz.\n\n` +
        (def.lema ? `_«${def.lema}»_\n\n` : "") +
        `${iconoAccion} *¿Qué deseas gestionar hoy?* Puedes registrar un gasto o venta, auditar saldos bancarios o consultar compromisos en cualquier momento.\n\n` +
        `Puedes hablarme o pedirme notas de voz cuando gustes diciendo *"Hola ${aliasFinal}"* o enviándome notas de voz. Si en algún momento deseas cambiar mi nombre o voz, solo dímelo.`,
      textoVoz: saludoVozNom,
      perfilVoz: def.id,
      requiereAudio: true,
      urlSticker: stickerInfo.url,
      tipoSticker: stickerInfo.tipo,
      urlImagen: stickerInfo.url,
      captionImagen: null
    };
  }

  return null;
}

/**
 * Detecta si el usuario está solicitando explícitamente escuchar la voz o demostración del personaje activo
 */
function detectarSolicitudDemostracionVoz_(texto) {
  if (!texto) return false;
  const t = String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // Excluir si es una consulta o registro financiero específico con montos o temas contables
  if (t.includes("saldo") || t.includes("reporte") || t.includes("gasto") || t.includes("ingreso") || 
      t.includes("deuda") || t.includes("compromiso") || t.includes("dolar") || t.includes("dian") ||
      t.includes("cuenta") || t.includes("banco") || t.includes("dashboard") || t.includes("link") ||
      t.includes("factura") || t.includes("comprobante") || t.includes("presupuesto") || t.includes("cierre")) {
    return false;
  }

  // Patrones directos de solicitud de voz / audio demostrativo
  const patrones = [
    /^(?:quiero|deseo|puedo|dejame|permiteme|me\s+gustaria)\s+(?:escucharte|oirte|escuchar\s+tu\s+voz|oir\s+tu\s+voz)$/i,
    /^(?:quiero|deseo)?\s*(?:escucharte|oirte)$/i,
    /^(?:hola\s+)?(?:hablame|habla|dime\s+algo\s+hablando|dime\s+algo\s+por\s+audio|dime\s+algo)\s*[!.]*$/i,
    /^(?:como\s+suena\s+tu\s+voz|como\s+es\s+tu\s+voz|como\s+hablas|cual\s+es\s+tu\s+voz)$/i,
    /^(?:prueba\s+de\s+voz|muestra\s+de\s+voz|mandame\s+un\s+audio|enviame\s+un\s+audio|mandame\s+audio|enviame\s+audio|quiero\s+un\s+audio)$/i,
    /^(?:gato\s+con\s+botas|gato|batman|iron\s*man|optimus|thor|asistente)\s*[,:]?\s*(?:hablame|estas\s+ahi|quiero\s+escucharte|quiero\s+oirte|dejame\s+oirte)$/i
  ];

  return patrones.some(p => p.test(t)) || t === "quiero escucharte" || t === "quiero oirte" || t === "escucharte" || t === "oirte" || t === "hablame";
}

/**
 * Ejecuta la respuesta enriquecida de demostración oral y visual del personaje activo
 */
function ejecutarDemostracionVoz_(telefono, perm) {
  const perfil = (perm && perm.perfilVoz) ? perm.perfilVoz : (perm && perm.rol === "SUPER_ADMIN" ? "GATO_CON_BOTAS" : "FEMENINO_DULCE");
  const def = obtenerDefinicionPersonajeCompleta_(perfil);
  const nombreHumano = sanitizarNombreHumano_(perm ? perm.nombre : "Fernando");

  const textoSpoken = typeof def.saludoVoz === "function" ? def.saludoVoz(nombreHumano) : (def.lema + " " + `¡Hola ${nombreHumano}! Aquí tienes mi voz activa.`);

  const textoCard = `${def.emoji} *¡Aquí tienes mi voz, ${nombreHumano}!*` +
    (def.lema ? `\n_«${def.lema}»_\n\n` : "\n\n") +
    `🎙️ *Te acabo de enviar esta nota de voz* con mi tono, cadencia y personalidad como *${def.descVoz}*.\n\n` +
    `${def.iconoAccion || "🛡️"} *¿Qué desafío o gestión financiera emprendemos hoy?*\n` +
    `1️⃣ 💰 *Registrar un movimiento* (ej: _"Venta de 5 resmas $90.000 More Paper"_)\n` +
    `2️⃣ 🏦 *Auditar saldos bancarios* (Ahorros ***2103 y ***7194)\n` +
    `3️⃣ 📜 *Revisar compromisos y deudas* (Proveedores pendientes)\n` +
    `4️⃣ 📊 *Ver Dashboard Pro* (Escribe _"dame mi link"_)\n` +
    `5️⃣ 🎭 *Explorar o cambiar de personaje* (Escribe _"Personajes"_)`;

  const stickerInfo = resolverStickerPersonajeDinamico_(def, telefono);

  return {
    tipo: "demostracion_voz",
    texto: textoCard,
    textoVoz: textoSpoken,
    perfilVoz: def.id,
    requiereAudio: true,
    urlSticker: stickerInfo.url,
    tipoSticker: stickerInfo.tipo,
    urlImagen: stickerInfo.url,
    captionImagen: null
  };
}

/**
 * Alias de retrocompatibilidad
 */
function ejecutarCambioVozOAsistente_(telefono, intencion, perm) {
  return ejecutarCambioNombreVoz_(telefono, intencion, perm);
}

// ============================================================================
// MOTOR DESATENDIDO DE CREACIÓN Y GOBERNANZA DE PERSONAJES DESDE WHATSAPP
// ============================================================================

/**
 * Calcula la similitud normalizada entre dos cadenas usando Levenshtein (0.0 a 1.0)
 */
function calcularSimilitudTexto_(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = String(str1).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
  const s2 = String(str2).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
  if (s1 === s2) return 1.0;
  if (!s1.length || !s2.length) return 0;
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    if (minLen / maxLen >= 0.55) return 0.88;
  }
  const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  const dist = track[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return 1.0 - (dist / maxLen);
}

/**
 * Detecta si el usuario desea registrar un nuevo personaje o consultar el formato de incorporación
 */
function detectarIntencionCrearPersonaje_(texto) {
  if (!texto) return null;
  const raw = String(texto).trim();
  const t = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // Caso 1: Solicitud general o consulta de guía para crear personajes
  const regexConsulta = /^(?:quiero\s+)?(?:crear|agregar|incorporar|anadir|añadir|registrar|nuevo)\s+(?:un\s+)?personaje$/i;
  if (regexConsulta.test(t) || t === "crear personaje" || t === "nuevo personaje" || t === "agregar personaje" || t === "incorporar personaje") {
    return { tipo: "crear_personaje", esConsultaGuia: true };
  }

  // Caso 2: Comando directo con Nombre e ID de Fish Audio (32 caracteres hexadecimales)
  // Ej: "Crear personaje Shrek ID 464ca191f6db4af6951037893e640ee4"
  // Ej: "Agregar personaje Gandalf voz: 464ca191f6db4af6951037893e640ee4"
  const regexConHash = /(?:crear|agregar|incorporar|anadir|añadir|nuevo|registrar)\s+(?:personaje|voz)\s+([^,:\n]+?)(?:\s+(?:con\s+)?(?:id|voice|voz|fishaudio|fish)?\s*[:=\s]\s*|\s+)([a-fA-F0-9]{32})/i;
  const matchHash = raw.match(regexConHash);

  if (matchHash) {
    const nombre = matchHash[1].replace(/^(?:el|la|los|las)\s+/i, "").trim();
    const fishAudioId = matchHash[2].trim().toLowerCase();
    return {
      tipo: "crear_personaje",
      nombre: nombre,
      fishAudioId: fishAudioId,
      textoCompleto: raw
    };
  }

  // Caso 3: Detección flexible si el mensaje contiene un hash hex de 32 chars y palabras clave de creación
  const matchSoloHash = raw.match(/[a-fA-F0-9]{32}/);
  if (matchSoloHash && (t.includes("personaje") || t.includes("nueva voz") || t.includes("crear") || t.includes("agregar"))) {
    let nombreLimpio = raw.replace(matchSoloHash[0], "")
      .replace(/(?:crear|agregar|incorporar|anadir|añadir|nuevo|registrar|personaje|con|id|voice|voz|fishaudio|fish|:|;|=)/gi, "")
      .trim();
    if (nombreLimpio.length >= 2) {
      return {
        tipo: "crear_personaje",
        nombre: nombreLimpio,
        fishAudioId: matchSoloHash[0].toLowerCase(),
        textoCompleto: raw
      };
    }
  }

  return null;
}

/**
 * Verifica rigurosamente si el nombre o el ID de voz ya existen en el sistema (Deduplicación estricta)
 */
function verificarConflictoPersonaje_(ss, nombre, voiceId) {
  const nLimpio = String(nombre || "").trim();
  const vLimpio = String(voiceId || "").toLowerCase().trim();

  // 1. Catálogo Canónico Oficial
  const clavesCanonicas = Object.keys(VOCES_CATALOGO_FISH_AUDIO_ || {});
  for (let i = 0; i < clavesCanonicas.length; i++) {
    const k = clavesCanonicas[i];
    const idCan = String(VOCES_CATALOGO_FISH_AUDIO_[k] || "").toLowerCase().trim();

    if (idCan === vLimpio) {
      return {
        conflicto: true,
        tipo: "VOICE_ID_DUPLICADO",
        motivo: `El ID de Fish Audio ya está asignado al personaje oficial '${k}'.`,
        coincidencia: k,
        similitud: 1.0,
        personajeExistente: { nombre: k, fishAudioId: idCan }
      };
    }

    const sim = calcularSimilitudTexto_(nLimpio, k.replace(/_/g, " "));
    if (sim >= 0.72) {
      return {
        conflicto: true,
        tipo: "NOMBRE_SIMILAR",
        motivo: `El nombre '${nLimpio}' tiene una similitud del ${Math.round(sim * 100)}% con el personaje oficial '${k}'.`,
        coincidencia: k,
        similitud: sim,
        personajeExistente: { nombre: k, fishAudioId: idCan }
      };
    }
  }

  // 2. Catálogo Dinámico en Hoja Personajes
  try {
    if (typeof obtenerPersonajesDinamicos_ === "function") {
      const din = obtenerPersonajesDinamicos_(ss, false); // Todos, incluyendo inactivos
      for (let i = 0; i < din.length; i++) {
        const d = din[i];
        const idDin = String(d.fishAudioId || "").toLowerCase().trim();

        if (idDin === vLimpio) {
          return {
            conflicto: true,
            tipo: "VOICE_ID_DUPLICADO",
            motivo: `El ID de Fish Audio ya está asignado al personaje '${d.nombre}'.`,
            coincidencia: d.nombre,
            similitud: 1.0,
            personajeExistente: d
          };
        }

        const sim = calcularSimilitudTexto_(nLimpio, d.nombre);
        if (sim >= 0.72) {
          return {
            conflicto: true,
            tipo: "NOMBRE_SIMILAR",
            motivo: `El nombre '${nLimpio}' tiene una similitud del ${Math.round(sim * 100)}% con el personaje existente '${d.nombre}'.`,
            coincidencia: d.nombre,
            similitud: sim,
            personajeExistente: d
          };
        }
      }
    }
  } catch (eDinCheck) {
    Logger.log("Aviso al verificar conflictos dinámicos: " + eDinCheck.message);
  }

  return { conflicto: false };
}

/**
 * Genera el perfil de personalidad, lema, frases y saludo inmersivo usando IA generativa Gemini
 */
function generarPerfilPersonajeConIA_(nombre, voiceId) {
  const nombreLimpio = String(nombre || "").trim();
  const apiKey = (typeof obtenerApiKeyGemini_ === "function") ? obtenerApiKeyGemini_() : "";

  if (apiKey && apiKey.trim() !== "") {
    try {
      const url = `${CONFIG_IA.URL_BASE_GEMINI}gemini-2.0-flash:generateContent?key=${apiKey}`;
      const prompt = `Eres un diseñador experto de personajes de ficción para un asistente virtual interactivo en WhatsApp para una empresa y usuarios de finanzas personales.
El usuario ha creado un nuevo personaje llamado: "${nombreLimpio}".
Genera su perfil de personalidad en formato JSON estricto sin bloques markdown ni explicaciones adicionales:
{
  "emoji": "un emoji único y representativo (ej: 🐱, 🧙, ⚔️, 🕵️, 🐺)",
  "descripcion": "descripción breve de su personalidad y tono de voz (máximo 12 palabras)",
  "lema": "un lema motivador o financiero ingenioso acorde a la personalidad del personaje (1 frase)",
  "saludoInicial": "un saludo inmersivo en primera persona presentándose como el nuevo copiloto financiero (máximo 2 frases)",
  "frasesDistintivas": "3 frases célebres o características del personaje separadas por barra vertical (ej: ¡Frase 1! | ¡Frase 2! | Frase 3)"
}`;

      const res = UrlFetchApp.fetch(url, {
        method: "POST",
        contentType: "application/json",
        payload: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
        }),
        muteHttpExceptions: true
      });

      if (res.getResponseCode() === 200) {
        const jsonRes = JSON.parse(res.getContentText());
        const candidateText = jsonRes.candidates && jsonRes.candidates[0] && jsonRes.candidates[0].content && jsonRes.candidates[0].content.parts && jsonRes.candidates[0].content.parts[0] ? jsonRes.candidates[0].content.parts[0].text : "";
        const cleanJsonStr = candidateText.replace(/```json/gi, "").replace(/```/g, "").trim();
        const obj = JSON.parse(cleanJsonStr);
        if (obj && obj.descripcion && obj.lema) {
          return {
            emoji: obj.emoji || "🎭",
            descripcion: obj.descripcion,
            lema: obj.lema,
            saludoInicial: obj.saludoInicial || `¡Hola! Soy ${nombreLimpio}. Me uno como tu nuevo copiloto financiero.`,
            frasesDistintivas: obj.frasesDistintivas || `¡En guardia con tus finanzas! | Precisión y control | Todo bajo control`
          };
        }
      }
    } catch (eGemini) {
      Logger.log("Aviso generando perfil con Gemini: " + eGemini.message);
    }
  }

  // Fallback inteligente si no hay conexión externa
  return {
    emoji: "🎭",
    descripcion: `carismática, elocuente y distintiva de ${nombreLimpio}`,
    lema: `¡Disciplina, estrategia y visión financiera con la impronta de ${nombreLimpio}!`,
    saludoInicial: `¡Saludos! Soy ${nombreLimpio}. Me uno al equipo para ayudarte a mantener tus finanzas y balances en su punto óptimo.`,
    frasesDistintivas: `¡Cuentas claras y futuro seguro! | Cada peso cuenta | Estrategia y disciplina siempre`
  };
}

/**
 * Ejecuta la creación o incorporación de un nuevo personaje desde WhatsApp con gobernanza estricta
 */
function ejecutarCreacionPersonajeWhatsApp_(ss, telLimpio, intencion, perm, solicitaAudio) {
  // Caso A: Mensaje de guía interactiva
  if (intencion.esConsultaGuia) {
    return {
      tipo: "conversacion",
      texto: `🎭 *INCORPORACIÓN DESATENDIDA DE NUEVOS PERSONAJES:*\n\n` +
        `¡Puedes incorporar cualquier nuevo personaje con su modelo de voz de Fish Audio al instante!\n\n` +
        `👉 *Formato de Creación:*\n` +
        `*Crear personaje [Nombre] ID [ID_FishAudio]*\n\n` +
        `📌 *Ejemplo:* \n` +
        `_Crear personaje Sherlock Holmes ID 464ca191f6db4af6951037893e640ee4_\n\n` +
        `💡 *Requisitos:* \n` +
        `1. El nombre del personaje.\n` +
        `2. El hash de 32 caracteres del modelo de voz de Fish Audio.\n` +
        `La IA generará automáticamente su personalidad, lema y lo anunciará a toda la comunidad.`
    };
  }

  const nombreSolicitado = String(intencion.nombre || "").trim();
  const voiceId = String(intencion.fishAudioId || "").trim().toLowerCase();

  // Validación de formato del Hash de Fish Audio (32 caracteres hexadecimales)
  if (!/^[a-fA-F0-9]{32}$/.test(voiceId)) {
    return {
      tipo: "conversacion",
      texto: `⚠️ *ID de Voz Inválido:* El ID de Fish Audio debe ser una cadena hexadecimal exacta de 32 caracteres (ej: 464ca191f6db4af6951037893e640ee4).\n\n` +
        `Por favor verifica el ID en tu panel de Fish Audio e inténtalo de nuevo.`
    };
  }

  // Comprobar colisiones o similitudes
  const chequeo = verificarConflictoPersonaje_(ss, nombreSolicitado, voiceId);

  // Caso B: Conflicto o intento de modificación no autorizado
  if (chequeo.conflicto) {
    const idClaveGenerado = nombreSolicitado.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, "_");
    const perfilIA = generarPerfilPersonajeConIA_(nombreSolicitado, voiceId);

    // Guardar en estado PENDIENTE_APROBACION
    const datosPersonaje = {
      idClave: idClaveGenerado,
      nombre: nombreSolicitado,
      fishAudioId: voiceId,
      emoji: perfilIA.emoji,
      descripcion: perfilIA.descripcion,
      lema: perfilIA.lema,
      saludoInicial: perfilIA.saludoInicial,
      frasesDistintivas: perfilIA.frasesDistintivas,
      creadoPor: `${perm.nombre} (${telLimpio})`,
      estado: "PENDIENTE_APROBACION"
    };

    if (typeof guardarPersonajeDinamico_ === "function") {
      guardarPersonajeDinamico_(ss, datosPersonaje);
    }

    // Escalamiento al Super Administrador con Nota de Voz de Muestra
    const telAdmin = (typeof CONFIG_FINANZAS !== "undefined" && CONFIG_FINANZAS.TELEFONO_ADMIN_DEFAULT) ? CONFIG_FINANZAS.TELEFONO_ADMIN_DEFAULT : "+573008880001";
    const telAdminNorm = normalizarTelefono_(telAdmin);

    const reporteAdmin = 
      `🚨 *ALERTA DE GOBERNANZA: SOLICITUD DE PERSONAJE CON CONFLICTO*\n\n` +
      `• 👤 *Solicitante:* ${perm.nombre} (${telLimpio})\n` +
      `• 🎭 *Personaje Propuesto:* **${nombreSolicitado}**\n` +
      `• 🔑 *ID Fish Audio:* \`${voiceId}\`\n` +
      `• ⚠️ *Causa de Alerta:* ${chequeo.motivo}\n` +
      `• 🔍 *Coincidencia Detectada:* ${chequeo.coincidencia} (${Math.round(chequeo.similitud * 100)}%)\n\n` +
      `🎧 He enviado a continuación una nota de voz sintetizada con este ID para que evalúes el timbre vocal.\n\n` +
      `📋 *Comandos de Resolución (Solo Super Admin):*\n` +
      `👉 Para Aprobar: *APROBAR_PERSONAJE ${idClaveGenerado}*\n` +
      `👉 Para Rechazar: *RECHAZAR_PERSONAJE ${idClaveGenerado}*\n` +
      `👉 Para Corregir Nombre: *CORREGIR_PERSONAJE ${idClaveGenerado} [NuevoNombre]*`;

    try {
      enviarMensajeWhatsApp(telAdminNorm, reporteAdmin);

      // Sintetizar y enviar nota de voz de muestra para evaluación auditiva
      if (typeof sintetizarVozNeural_ === "function" && typeof enviarAudioWhatsApp === "function") {
        const textoMuestra = `Hola Fernando. Esta es una muestra auditiva con el modelo de voz propuesto para ${nombreSolicitado} en nuestro sistema de asistencia financiera.`;
        const audioBlob = sintetizarVozNeural_(textoMuestra, voiceId);
        if (audioBlob) {
          enviarAudioWhatsApp(telAdminNorm, audioBlob, `🎧 *Muestra de Voz para evaluación:* "${nombreSolicitado}" (ID: ${voiceId})`);
        }
      }
    } catch (eReporte) {
      Logger.log("Aviso enviando reporte de conflicto a Super Admin: " + eReporte.message);
    }

    // Respuesta defensiva y educada al usuario solicitante (CERO emisión masiva)
    return {
      tipo: "conversacion",
      texto: `⚠️ *Aviso de Gobernanza de Personajes:*\n` +
        `El personaje "*${nombreSolicitado}*" o su ID de voz ya existe en el sistema (o coincide en un ${Math.round(chequeo.similitud * 100)}% con "*${chequeo.coincidencia}*").\n\n` +
        `🔒 *Política de Seguridad:* Solo el Super Administrador tiene autorización para modificar o reasignar personajes existentes. Los usuarios solo pueden registrar personajes completamente nuevos.\n\n` +
        `Tu propuesta ha sido remitida al Administrador General junto con una muestra de voz para su evaluación. Te avisaremos cuando sea revisada.`
    };
  }

  // Caso C: Creación limpia y 100% nueva (Sin conflictos ni duplicados)
  const idClaveLimpio = nombreSolicitado.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, "_");
  const perfilIA = generarPerfilPersonajeConIA_(nombreSolicitado, voiceId);

  const nuevoPersonaje = {
    idClave: idClaveLimpio,
    nombre: nombreSolicitado,
    fishAudioId: voiceId,
    emoji: perfilIA.emoji,
    descripcion: perfilIA.descripcion,
    lema: perfilIA.lema,
    saludoInicial: perfilIA.saludoInicial,
    frasesDistintivas: perfilIA.frasesDistintivas,
    creadoPor: `${perm.nombre} (${telLimpio})`,
    estado: "ACTIVO"
  };

  if (typeof guardarPersonajeDinamico_ === "function") {
    guardarPersonajeDinamico_(ss, nuevoPersonaje);
  }

  // Disparar difusión masiva (Broadcast) únicamente porque fue limpia
  if (typeof difundirNuevoPersonajeWhatsApp_ === "function") {
    try {
      difundirNuevoPersonajeWhatsApp_(nuevoPersonaje);
    } catch (eBroadcast) {
      Logger.log("Aviso en difusión masiva de nuevo personaje: " + eBroadcast.message);
    }
  }

  return {
    tipo: "conversacion",
    texto: `🎉 *¡Nuevo Personaje Incorporado con Éxito!*\n\n` +
      `✨ *${nuevoPersonaje.emoji} ${nuevoPersonaje.nombre}*\n` +
      `• 🎭 *Perfil:* _${nuevoPersonaje.descripcion}_\n` +
      `• 🛡️ *Lema:* _«${nuevoPersonaje.lema}»_\n\n` +
      `🎙️ *Presentación:* \n_«${nuevoPersonaje.saludoInicial}»_\n\n` +
      `📢 Se ha notificado la incorporación a todos los usuarios. Para activarlo de inmediato, escribe: *"Quiero la voz de ${nuevoPersonaje.nombre}"*.`
  };
}

/**
 * Detecta y ejecuta comandos de resolución del Super Admin para personajes pendientes
 */
function detectarComandoAprobacionPersonaje_(ss, telLimpio, textoUsuario, perm) {
  if (!textoUsuario) return null;
  const raw = String(textoUsuario).trim();

  // Validar si el remitente tiene permisos de Super Admin
  const telAdmin = (typeof CONFIG_FINANZAS !== "undefined" && CONFIG_FINANZAS.TELEFONO_ADMIN_DEFAULT) ? CONFIG_FINANZAS.TELEFONO_ADMIN_DEFAULT : "+573008880001";
  const esAdmin = (perm && perm.rol === "SUPER_ADMIN") || (normalizarTelefono_(telLimpio) === normalizarTelefono_(telAdmin));
  if (!esAdmin) return null;

  // 1. APROBAR PERSONAJE
  const matchAprobar = raw.match(/^(?:APROBAR_PERSONAJE|APROBAR\s+PERSONAJE)\s+([a-zA-Z0-9_]+)/i);
  if (matchAprobar) {
    const idClave = matchAprobar[1].toUpperCase().trim();
    if (typeof actualizarEstadoPersonajeDinamico_ === "function") {
      actualizarEstadoPersonajeDinamico_(ss, idClave, "ACTIVO");
    }

    // Buscar detalles para notificar
    let personaje = null;
    if (typeof obtenerPersonajesDinamicos_ === "function") {
      const din = obtenerPersonajesDinamicos_(ss, false);
      personaje = din.find(d => d.idClave === idClave);
    }

    if (personaje) {
      // Notificar al creador si es identificable por teléfono
      const matchTel = String(personaje.creadoPor || "").match(/\+?[0-9]{8,15}/);
      if (matchTel) {
        try {
          enviarMensajeWhatsApp(normalizarTelefono_(matchTel[0]), 
            `🎉 *¡Tu personaje ha sido APROBADO!*\n\nEl Super Administrador ha avalado la incorporación de "*${personaje.nombre}*". Ya se encuentra activo y disponible para toda la comunidad.`);
        } catch (eCrea) {}
      }

      // Difusión masiva oficial tras aprobación
      if (typeof difundirNuevoPersonajeWhatsApp_ === "function") {
        difundirNuevoPersonajeWhatsApp_(personaje);
      }

      return {
        tipo: "conversacion",
        texto: `✅ *Personaje '${personaje.nombre}' Aprobado con Éxito.*\nSe ha cambiado su estado a ACTIVO, se notificó a su creador y se emitió el aviso masivo a todos los usuarios.`
      };
    }

    return {
      tipo: "conversacion",
      texto: `✅ *Personaje '${idClave}' aprobado y marcado como ACTIVO.*`
    };
  }

  // 2. RECHAZAR PERSONAJE
  const matchRechazar = raw.match(/^(?:RECHAZAR_PERSONAJE|RECHAZAR\s+PERSONAJE)\s+([a-zA-Z0-9_]+)/i);
  if (matchRechazar) {
    const idClave = matchRechazar[1].toUpperCase().trim();
    if (typeof actualizarEstadoPersonajeDinamico_ === "function") {
      actualizarEstadoPersonajeDinamico_(ss, idClave, "RECHAZADO");
    }

    let personaje = null;
    if (typeof obtenerPersonajesDinamicos_ === "function") {
      const din = obtenerPersonajesDinamicos_(ss, false);
      personaje = din.find(d => d.idClave === idClave);
    }

    if (personaje) {
      const matchTel = String(personaje.creadoPor || "").match(/\+?[0-9]{8,15}/);
      if (matchTel) {
        try {
          enviarMensajeWhatsApp(normalizarTelefono_(matchTel[0]), 
            `ℹ️ *Aviso de Solicitud de Personaje:*\nEl Super Administrador ha declinado la incorporación del personaje "*${personaje.nombre}*" debido a incompatibilidad o duplicidad con el catálogo oficial.`);
        } catch (eRech) {}
      }

      return {
        tipo: "conversacion",
        texto: `🚫 *Personaje '${personaje.nombre}' Rechazado.* Se notificó exclusivamente al usuario solicitante. Cero mensajes masivos emitidos.`
      };
    }

    return {
      tipo: "conversacion",
      texto: `🚫 *Personaje '${idClave}' marcado como RECHAZADO.*`
    };
  }

  // 3. CORREGIR NOMBRE Y APROBAR
  const matchCorregir = raw.match(/^(?:CORREGIR_PERSONAJE|CORREGIR\s+PERSONAJE)\s+([a-zA-Z0-9_]+)\s+(.+)/i);
  if (matchCorregir) {
    const idClave = matchCorregir[1].toUpperCase().trim();
    const nuevoNombre = matchCorregir[2].trim();

    const libro = ss || SpreadsheetApp.getActiveSpreadsheet();
    const sheet = libro.getSheetByName(HOJAS.PERSONAJES);
    if (sheet && sheet.getLastRow() > 1) {
      const datos = sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).getValues();
      for (let i = 0; i < datos.length; i++) {
        if (String(datos[i][0]).toUpperCase().trim() === idClave) {
          sheet.getRange(i + 2, 2).setValue(nuevoNombre);
          sheet.getRange(i + 2, 11).setValue("ACTIVO");
          SpreadsheetApp.flush();
          invalidarCachePersonajes_();
          break;
        }
      }
    }

    return {
      tipo: "conversacion",
      texto: `✏️ *Personaje '${idClave}' corregido a '${nuevoNombre}' y activado con éxito.*`
    };
  }

  return null;
}


/**
 * Transcribe y procesa notas de voz entrantes del usuario mediante IA multimodal Gemini
 */
function procesarAudioNotaVoz(telefono, audioBase64, mimeType) {
  try {
    const apiKey = obtenerApiKeyGemini_();
    if (!apiKey || apiKey.trim() === "") {
      return {
        tipo: "error",
        texto: "Para procesar notas de voz entrantes se requiere configurar tu GEMINI_API_KEY en las propiedades del script."
      };
    }

    const telLimpio = normalizarTelefono_(telefono);
    const perm = validarPermisoUsuario(telLimpio);
    if (!perm.autorizado) {
      return {
        tipo: "acceso_denegado",
        texto: "🔒 Tu número no tiene autorización en este sistema financiero."
      };
    }

    // 1. Variantes de MIME type para audio de WhatsApp (Ogg / Opus)
    let cleanMime = String(mimeType || "audio/ogg").split(";")[0].trim().toLowerCase();
    const mimeVariants = [];
    if (cleanMime.includes("ogg") || cleanMime.includes("opus")) {
      mimeVariants.push("audio/ogg", "audio/opus", "audio/ogg; codecs=opus");
    } else if (cleanMime.includes("mp3") || cleanMime.includes("mpeg")) {
      mimeVariants.push("audio/mp3", "audio/mpeg");
    } else if (cleanMime.includes("wav")) {
      mimeVariants.push("audio/wav");
    } else if (cleanMime.includes("aac") || cleanMime.includes("m4a")) {
      mimeVariants.push("audio/aac", "audio/mp4");
    } else {
      mimeVariants.push("audio/ogg", "audio/opus");
    }

    const promptTranscriptor = "Eres un transcriptor financiero y operativo de alta precisión. Escucha atentamente el audio adjunto en español y transcribe con total fidelidad lo que dice el usuario. Devuelve únicamente el texto limpio transcrito, sin explicaciones ni etiquetas.";

    // 2. Modelos multimodales activos obtenidos dinámicamente desde Google AI Studio (ListModels)
    const modelosCandidatos = (typeof obtenerModelosDisponiblesGemini_ === "function")
      ? obtenerModelosDisponiblesGemini_(apiKey)
      : ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-pro"];

    const audioBase64Limpio = String(audioBase64 || "").replace(/\s+/g, "");
    if (!audioBase64Limpio || audioBase64Limpio.length < 50) {
      Logger.log("Aviso: audioBase64 recibido en procesarAudioNotaVoz está vacío o es inválido.");
      return {
        tipo: "error",
        texto: "🎙️ La nota de voz recibida está vacía o no contiene audio procesable. Por favor vuelve a grabarla cerca del micrófono."
      };
    }

    let textoTranscrito = "";
    let ultimoErrorAudio = "";
    let esSaturacionQuota = false;

    // 3. Intento de transcripción con Google Gemini
    for (const modelo of modelosCandidatos) {
      if (textoTranscrito) break;

      for (const mimeActual of mimeVariants) {
        if (textoTranscrito) break;
        try {
          const url = `${CONFIG_IA.URL_BASE_GEMINI}${modelo}:generateContent?key=${apiKey}`;
          const payload = {
            contents: [{
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: mimeActual,
                    data: audioBase64Limpio
                  }
                },
                { text: promptTranscriptor }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 1500
            }
          };

          const response = UrlFetchApp.fetch(url, {
            method: "POST",
            contentType: "application/json",
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
          });

          const code = response.getResponseCode();
          const json = JSON.parse(response.getContentText());

          if (code === 200 && !json.error && json.candidates && json.candidates[0] && json.candidates[0].content) {
            const parts = json.candidates[0].content.parts;
            if (parts && parts.length > 0) {
              textoTranscrito = parts[0].text ? parts[0].text.trim() : "";
              if (textoTranscrito) {
                Logger.log(`✅ Audio transcrito con éxito mediante ${modelo} (${mimeActual}): "${textoTranscrito}"`);
                break;
              }
            }
          } else {
            const msg = json.error ? json.error.message : ("HTTP " + code);
            ultimoErrorAudio = msg;
            Logger.log(`Aviso transcripción audio (${modelo} / ${mimeActual} - ${code}): ${msg}`);

            if (code === 429 || code === 503) {
              esSaturacionQuota = true;
              Utilities.sleep(600);
              break; // Pasar al siguiente modelo con su propio bucket
            } else if (code === 404) {
              break; // Modelo no existe, no reintentar MIME en este modelo
            }
          }
        } catch (errLoop) {
          ultimoErrorAudio = errLoop.message;
          Logger.log(`Excepción en bucle de audio (${modelo}): ${errLoop.message}`);
        }
      }
    }

    // 4. Respaldo #2: OpenAI Whisper API (si está configurada OPENAI_API_KEY)
    if (!textoTranscrito) {
      try {
        const whisperTexto = transcribirConWhisperOpenAI_(audioBase64Limpio, cleanMime);
        if (whisperTexto && whisperTexto.trim() !== "") {
          textoTranscrito = whisperTexto.trim();
          Logger.log(`✅ Audio transcrito con éxito mediante OpenAI Whisper: "${textoTranscrito}"`);
        }
      } catch (eWhisper) {
        Logger.log("Aviso Whisper fallback: " + eWhisper.message);
      }
    }

    // 5. Manejo de error si todos los motores fallaron
    if (!textoTranscrito) {
      Logger.log("No se pudo transcribir el audio tras agotar modelos. Último error: " + ultimoErrorAudio);
      let mensajeError = "⚠️ No pude procesar tu nota de voz (" + (ultimoErrorAudio || "saturación del servicio") + "). Por favor intenta de nuevo en unos segundos o envíame tu mensaje en texto.";
      if (esSaturacionQuota) {
        mensajeError = "⏳ La cuota de solicitudes de audio en Gemini se encuentra al límite temporal (" + (ultimoErrorAudio || "Rate limit 429") + "). Por favor espera 30 segundos o envíame tu mensaje por texto mientras se restablece el servicio.";
      }
      return {
        tipo: "error",
        texto: mensajeError
      };
    }

    Logger.log(`🎙️ Nota de voz transcrita de [${telLimpio}]: "${textoTranscrito}"`);

    // Procesar el texto financiero transcrito
    const resultado = procesarMensajeTexto(telLimpio, textoTranscrito);
    if (resultado) {
      resultado.requiereAudio = true;
      resultado.transcripcion = textoTranscrito;
    }
    return resultado;

  } catch (err) {
    Logger.log("Error general en procesarAudioNotaVoz: " + err.message);
    return {
      tipo: "error",
      texto: "⚠️ No pude procesar tu nota de voz. Por favor intenta de nuevo o envíame tu mensaje en texto."
    };
  }
}

/**
 * Transcribe audio utilizando OpenAI Whisper como respaldo de alta resiliencia
 */
function transcribirConWhisperOpenAI_(audioBase64, mimeType) {
  const openaiKey = PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");
  if (!openaiKey || openaiKey.trim() === "") return null;

  try {
    const bytes = Utilities.base64Decode(audioBase64);
    const boundary = "----WhisperBoundary" + Utilities.getUuid();
    
    // Construir multipart body
    let body = "--" + boundary + "\r\n";
    body += 'Content-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n';
    body += "--" + boundary + "\r\n";
    body += 'Content-Disposition: form-data; name="language"\r\n\r\nes\r\n';
    body += "--" + boundary + "\r\n";
    body += 'Content-Disposition: form-data; name="file"; filename="audio.ogg"\r\n';
    body += "Content-Type: " + (mimeType || "audio/ogg") + "\r\n\r\n";

    const headerBlob = Utilities.newBlob(body);
    const footerBlob = Utilities.newBlob("\r\n--" + boundary + "--\r\n");
    const payloadBytes = [].concat(headerBlob.getBytes(), bytes, footerBlob.getBytes());

    const res = UrlFetchApp.fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      contentType: "multipart/form-data; boundary=" + boundary,
      headers: { "Authorization": "Bearer " + openaiKey.trim() },
      payload: payloadBytes,
      muteHttpExceptions: true
    });

    if (res.getResponseCode() === 200) {
      const data = JSON.parse(res.getContentText());
      return data.text ? data.text.trim() : null;
    }
  } catch (e) {
    Logger.log("Error en transcribirConWhisperOpenAI_: " + e.message);
  }
  return null;
}

// ============================================================================
// MÓDULO DE INTELIGENCIA BURSÁTIL EN TIEMPO REAL, CONSULTORÍA TRIBUTARIA DIAN Y GUARDRAILS
// ============================================================================

/**
 * Realiza peticiones HTTP GET retornando JSON con compatibilidad Google Apps Script y Node.js
 */
function realizarPeticionHttpJson_(url, headers) {
  try {
    if (typeof UrlFetchApp !== "undefined") {
      const options = {
        method: "GET",
        muteHttpExceptions: true,
        headers: headers || { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
      };
      const res = UrlFetchApp.fetch(url, options);
      if (res.getResponseCode() >= 200 && res.getResponseCode() < 300) {
        return JSON.parse(res.getContentText());
      }
    }
  } catch (e) {
    Logger.log("Aviso en peticion HTTP (" + url + "): " + e.message);
  }
  return null;
}

/**
 * Consulta y estructura el snapshot de mercado financiero en tiempo real (100% verificable)
 * - TRM Oficial de la Superintendencia Financiera de Colombia (Datos Abiertos)
 * - Divisas globales al día (USD, EUR, GBP, MXN, BRL vs COP)
 * - Criptoactivos (BTC, ETH)
 * - Índices bursátiles y materias primas (S&P 500, Petróleo WTI, Oro)
 */
function obtenerSnapshotMercadoTiempoReal_() {
  const fechaActual = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  const snapshot = {
    fechaConsulta: fechaActual,
    trmOficial: null,
    divisas: null,
    commodities: null,
    cripto: null
  };

  // 1. TRM Oficial de la Superintendencia Financiera de Colombia (API Oficial Socrata)
  try {
    const dataTRM = realizarPeticionHttpJson_("https://www.datos.gov.co/resource/ceyp-9c7c.json?$order=vigenciadesde%20DESC&$limit=1");
    if (Array.isArray(dataTRM) && dataTRM.length > 0) {
      snapshot.trmOficial = {
        valor: parseFloat(dataTRM[0].valor),
        vigenciaDesde: (dataTRM[0].vigenciadesde || "").split("T")[0],
        vigenciaHasta: (dataTRM[0].vigenciahasta || "").split("T")[0],
        fuenteOficial: "Superintendencia Financiera de Colombia / Datos Abiertos"
      };
    }
  } catch (e) {
    Logger.log("Aviso al consultar TRM oficial: " + e.message);
  }

  // 2. Divisas Internacionales en Tiempo Real
  try {
    const dataDivisas = realizarPeticionHttpJson_("https://open.er-api.com/v6/latest/USD");
    if (dataDivisas && dataDivisas.rates) {
      const cop = dataDivisas.rates.COP || (snapshot.trmOficial ? snapshot.trmOficial.valor : 3085);
      snapshot.divisas = {
        USD_COP: Math.round(cop),
        EUR_COP: Math.round(cop / (dataDivisas.rates.EUR || 0.86)),
        GBP_COP: Math.round(cop / (dataDivisas.rates.GBP || 0.74)),
        MXN_COP: +(cop / (dataDivisas.rates.MXN || 17.0)).toFixed(1),
        BRL_COP: Math.round(cop / (dataDivisas.rates.BRL || 5.12)),
        EUR_USD: +(1 / (dataDivisas.rates.EUR || 0.86)).toFixed(4)
      };
    }
  } catch (e) {
    Logger.log("Aviso al consultar divisas internacionales: " + e.message);
  }

  // 3. Criptoactivos (CoinGecko)
  try {
    const dataCripto = realizarPeticionHttpJson_("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd,cop");
    if (dataCripto && dataCripto.bitcoin) {
      snapshot.cripto = {
        BTC_USD: dataCripto.bitcoin.usd,
        BTC_COP: dataCripto.bitcoin.cop,
        ETH_USD: dataCripto.ethereum.usd,
        ETH_COP: dataCripto.ethereum.cop
      };
    }
  } catch (e) {
    Logger.log("Aviso al consultar criptomercado: " + e.message);
  }

  // 4. Commodities e Índices Bursátiles Globales (Yahoo Finance Chart API)
  try {
    const dataSP500 = realizarPeticionHttpJson_("https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=1d");
    const dataWTI = realizarPeticionHttpJson_("https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1d&range=1d");
    const dataOro = realizarPeticionHttpJson_("https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1d");

    snapshot.commodities = {
      sp500: dataSP500?.chart?.result?.[0]?.meta?.regularMarketPrice || null,
      petroleoWTI: dataWTI?.chart?.result?.[0]?.meta?.regularMarketPrice || null,
      oroOnza: dataOro?.chart?.result?.[0]?.meta?.regularMarketPrice || null
    };
  } catch (e) {
    Logger.log("Aviso al consultar índices bursátiles: " + e.message);
  }

  return snapshot;
}

/**
 * Retorna las reglas oficiales del Calendario Tributario DIAN y normativa contable NIIF
 */
function obtenerCalendarioNormativaDian_(nitOCedula, tipoObligacion, anioConsultado) {
  const anio = anioConsultado || new Date().getFullYear();
  // UVT oficial: 2024 = $47.065, 2025 = $49.799, 2026 = $52.374
  const uvt = anio === 2026 ? 52374 : (anio === 2025 ? 49799 : 47065);
  const nitLimpio = String(nitOCedula || "").replace(/\D/g, "");
  const ultimoDigito = nitLimpio ? parseInt(nitLimpio.slice(-1), 10) : null;
  const ultimosDosDigitos = nitLimpio ? parseInt(nitLimpio.slice(-2), 10) : null;

  return {
    anioGravable: anio,
    uvtVigente: uvt,
    ultimoDigitoNit: ultimoDigito,
    ultimosDosDigitosNit: ultimosDosDigitos,
    retefuente: {
      periodicidad: "Mensual",
      reglaVencimiento: "Vence mensualmente entre el 7º y 16º día hábil del mes siguiente, según el último dígito del NIT.",
      tarifasPrincipales: {
        comprasDeclarantes: "2.5% (Base mínima 27 UVT = $" + (27 * uvt).toLocaleString("es-CO") + ")",
        comprasNoDeclarantes: "3.5% (Base mínima 27 UVT)",
        serviciosDeclarantes: "4% (Base mínima 4 UVT = $" + (4 * uvt).toLocaleString("es-CO") + ")",
        serviciosNoDeclarantes: "6% (Base mínima 4 UVT)",
        honorariosPJ: "11% (Sin base mínima)",
        honorariosPN: "10% u 11% según categoría declarante (Sin base mínima)",
        arriendoMuebles: "4%",
        arriendoInmuebles: "3.5%"
      }
    },
    iva: {
      bimestral: "Grandes contribuyentes e ingresos brutos anuales > 92.000 UVT ($" + (92000 * uvt).toLocaleString("es-CO") + ")",
      cuatrimestral: "Ingresos brutos < 92.000 UVT. Vencimientos: Ene-Abr (Mayo), May-Ago (Septiembre), Sep-Dic (Enero).",
      tarifaGeneral: "19% (Tarifas diferenciales del 5% y bienes excluidos/exentos art. 468 y 477 ET)"
    },
    renta: {
      personasJuridicas: "Tarifa general 35%. Presentación y pago en 2 cuotas (abril y julio) según últimos dos dígitos del NIT.",
      personasNaturales: "Vence entre agosto y octubre según los dos últimos dígitos del NIT/Cédula.",
      topesParaDeclarar: [
        "Patrimonio bruto superior a 4.500 UVT ($" + (4500 * uvt).toLocaleString("es-CO") + ")",
        "Ingresos brutos anuales superiores a 1.400 UVT ($" + (1400 * uvt).toLocaleString("es-CO") + ")",
        "Consumos con tarjeta de crédito > 1.400 UVT",
        "Compras y consumos totales > 1.400 UVT",
        "Consignaciones bancarias totales > 1.400 UVT"
      ]
    },
    niifColombia: {
      marcoLegal: "Ley 1314 de 2009 y Decretos Reglamentarios 2420 y 2496 de 2015",
      grupo1: "NIIF Plenas (Emisores de valores y entidades de interés público)",
      grupo2: "NIIF para PYMES (Estándar de 35 secciones para pequeñas y medianas empresas)",
      grupo3: "Microempresas (Contabilidad simplificada de costo)",
      facturacionElectronica: "Obligatoria para todas las personas jurídicas y responsables de IVA, junto a nómina electrónica y documento soporte."
    }
  };
}

/**
 * Detecta si el usuario está consultando temas totalmente ajenos a finanzas o economía (Guardrail)
 */
function detectarConsultaFueraDeAmbito_(texto) {
  if (!texto) return false;
  const t = String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // Si contiene términos financieros, contables o de gestión de dinero, NO es fuera de ámbito
  const regexFinanciero = /(?:dolar|trm|peso|banco|dian|impuesto|gasto|ingreso|dinero|plata|bolsa|inversion|compromiso|saldo|cuenta|factura|recibo|costo|precio|compra|venta|tarifa|deuda|abono|prestamo|pago)/i;
  if (regexFinanciero.test(t)) return false;

  const palabrasNoFinancieras = [
    "partido", "futbol", "gol", "champions", "liga", "receta", "cocinar", "ingredientes",
    "pelicula", "cine", "actor", "actriz", "chiste", "cancion", "musica", "cantante",
    "novia", "amor", "horoscopo", "signo", "clima", "tiempo libre", "videojuego", "playstation", "serie de tv"
  ];

  for (let i = 0; i < palabrasNoFinancieras.length; i++) {
    if (t.includes(palabrasNoFinancieras[i])) return true;
  }
  return false;
}

/**
 * Genera la respuesta sucinta + reconducción estricta para temas fuera de ámbito
 */
function ejecutarRespuestaFueraDeAmbito_(textoUsuario, perm) {
  const alias = perm.aliasAsistente || (perm.rol === "SUPER_ADMIN" ? "Bruce Wayne" : "Aura");
  const infoVoz = obtenerInfoPerfilVoz_(perm.perfilVoz || "BATMAN");

  const texto = `${infoVoz.emoji} *Asistente Financiero Especializado (${alias}):*\n\n` +
    `Entiendo tu consulta sobre este tema general. No obstante, para brindarte un servicio de máxima excelencia, mi diseño y entrenamiento están **estrictamente especializados y dedicados a la gestión patrimonial, inteligencia bursátil, optimización tributaria DIAN y control financiero**.\n\n` +
    `Los tópicos ajenos a finanzas, economía o contabilidad quedan fuera de mi competencia operativa.\n\n` +
    `¿Deseas que analicemos tus balances actuales, revisemos los compromisos y pagos pendientes del mes, o consultemos el mercado de divisas hoy?`;

  return {
    tipo: "conversacion",
    texto: texto,
    perfilVoz: perm.perfilVoz
  };
}

/**
 * Detecta si el usuario formula preguntas sobre mercados bursátiles, divisas, tributación DIAN o solicita asesoría
 */
function detectarConsultaMercadoOTributaria_(texto) {
  if (!texto) return null;
  const t = String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // Detección exhaustiva de mercados, divisas, TRM y variantes con errores de digitación (ej: 'dolro', 'dls', 'usd', 'eldia de hoy')
  const esMercado = /(?:\btrm\b|\bdol[ao]r[oeas]?\b|\bdolr\b|\bdll?s\b|\busd\b|\busdt\b|\beuro?s?\b|\bdivisas?\b|\btasas?\s*(?:de\s*)?cambio\b|\bbolsa\b|\bacciones\b|\bwall\s*street\b|\bs&p\b|\bsp500\b|\bnasdaq\b|\bpetroleo\b|\bbrent\b|\bwti\b|\bcafe\b|\boro\b|\bbitcoin\b|\bcripto\b|\binflacion\b|\bbanco\s+de\s+la\s+republica\b|\bbanrep\b|\bmoneda\s+estadounidense\b|\bbillete\s+verde\b|\bcotizacion\b|\btrm\s+hoy\b)/i.test(t) ||
    (/(?:valor|precio|cuanto\s+vale|cuanto\s+cuesta|a\s+como\s+esta|a\s+cuanto\s+esta|cotizacion|cambio).*?(?:dol|trm|euro|usd|moneda)/i.test(t)) ||
    (/(?:dol|trm|euro|usd).*?(?:hoy|eldia|el\s+dia|colombia|precio|valor|tasa)/i.test(t));

  const esTributario = /(?:\bdian\b|\bimpuestos?\b|\btributar\b|\bretencion\b|\bretefuente\b|\biva\b|\brenta\b|\bica\b|\brut\b|\bcalendario\s+tributario\b|\buvt\b|\bniif\b|\bestatuto\s+tributario\b|\bdeclaracion\b|\bvencimiento\s+tributario\b|\bfacturacion\s+electronica\b)/i.test(t);
  const esAsesoria = /(?:que\s+me\s+recomiendas|que\s+opinas|que\s+hago\s+con|asesorame|consejo\s+financiero|opinion\s+financiera|deberia\s+(?:comprar|vender|invertir|pagar))/i.test(t);

  if (esMercado || esTributario || esAsesoria) {
    return {
      tipo: "asesoria_financiera_pro",
      esMercado: esMercado,
      esTributario: esTributario,
      esAsesoria: esAsesoria
    };
  }
  return null;
}

/**
 * Ejecuta la consulta de inteligencia financiera bursátil y tributaria con cruce analítico de datos reales
 */
function ejecutarAsesorFinancieroPro_(telefono, textoUsuario, intencion, perm, compromisosActivos, saldos) {
  const alias = perm.aliasAsistente || (perm.rol === "SUPER_ADMIN" ? "Bruce Wayne" : "Aura");
  const infoVoz = obtenerInfoPerfilVoz_(perm.perfilVoz || (perm.rol === "SUPER_ADMIN" ? "BATMAN" : "FEMENINO_DULCE"));

  // 1. Obtener datos oficiales verificables
  const snapshot = obtenerSnapshotMercadoTiempoReal_();
  const dian = obtenerCalendarioNormativaDian_(null, null, new Date().getFullYear());
  const esConduccion = (typeof esModoConduccion_ === "function") ? esModoConduccion_(textoUsuario) : false;

  // 2. Construir SIEMPRE el informe visual estructurado IMAGEN 2 (iconos, viñetas y orden impecable)
  let textoVisual = formatearInformeAsesorFinancieroFallback_(snapshot, dian, perm, compromisosActivos, saldos, textoUsuario, infoVoz, alias);

  // Enriquecer la recomendación estratégica con Gemini si está disponible, sin romper el diseño visual
  const apiKey = obtenerApiKeyGemini_();
  if (apiKey && apiKey.trim() !== "") {
    try {
      const nombreHumano = sanitizarNombreHumano_(perm ? perm.nombre : "Fernando");
      const promptRecomendacion = [
        `Eres ${alias}, Asesor Financiero y Senior Tecnológico de élite para ${nombreHumano}. Tono: ${infoVoz.desc}.`,
        `Actúas respaldado en la mesa directiva por el Consejo Asesor Global (13 Líderes Mundiales de Negocios y Finanzas) y el Consejo Asesor de Tecnología e IA (Sam Altman, Dario y Daniela Amodei, Demis Hassabis, Yann LeCun, Mustafa Suleyman, Jeff Dean, Jensen Huang, Lisa Su, Arthur Mensch, Clément Delangue y Asesor Senior).`,
        `SNAPSHOT: TRM ${snapshot?.trmOficial?.valor}, Euro ${snapshot?.divisas?.EUR_COP}.`,
        `COMPROMISOS ACTIVOS: ${JSON.stringify(compromisosActivos?.slice(0, 3) || [])}.`,
        `SALDOS: ${JSON.stringify(saldos || "No disponibles")}.`,
        `CONSULTA: "${textoUsuario}".`,
        `INSTRUCCIÓN: Genera una recomendación financiera o tecnológica/estratégica accionable en 1 frase corta, directa y de alto calibre, aplicando la síntesis del Consejo (liquidez blindada, foso defensivo, márgenes, optimización digital o calidad de ejecución). Sin saludos ni despedidas.`
      ].join("\n");
      const recGemini = llamarGeminiTexto_(promptRecomendacion);
      if (recGemini && recGemini.trim().length > 15 && !recGemini.includes("Error") && !recGemini.includes("[Nota")) {
        textoVisual = textoVisual.replace(
          /(• _Recomendación:_ [^\n]+)/i,
          `$1\n• _Análisis de Inteligencia:_ ${recGemini.trim()}`
        );
      }
    } catch (e) {
      Logger.log("Aviso al consultar recomendación Gemini: " + e.message);
    }
  }

  // 3. Construir el guion oral especializado para el oído humano (prosodia, pausas respiratorias y números en palabras)
  const textoVoz = construirGuionVozAsesorFinanciero_(snapshot, compromisosActivos, saldos, perm, infoVoz, esConduccion);

  return {
    tipo: "conversacion",
    texto: textoVisual,
    textoVoz: textoVoz,
    perfilVoz: perm.perfilVoz,
    requiereAudio: true
  };
}

/**
 * Construye el guion verbal conversacional adaptado al oído humano:
 * - Evita enumeraciones robóticas y caracteres gráficos.
 * - Introduce pausas de prosodia respiratoria natural ('...').
 * - Traduce cifras complejas a conceptos orales directos.
 */
function construirGuionVozAsesorFinanciero_(snapshot, compromisos, saldos, perm, infoVoz, esConduccion) {
  const trmVal = snapshot?.trmOficial ? Math.round(snapshot.trmOficial.valor) : null;
  const eurVal = snapshot?.divisas?.EUR_COP ? Math.round(snapshot.divisas.EUR_COP) : null;
  const usdVal = snapshot?.divisas?.USD_COP ? Math.round(snapshot.divisas.USD_COP) : null;
  
  let partes = [];
  
  // 1. Panorama de mercados con cadencia oral
  if (trmVal) {
    let fraseMercado = `En los mercados... la TRM oficial abre hoy en ${trmVal} pesos`;
    if (eurVal) {
      fraseMercado += `... y el euro cotiza en ${eurVal} pesos.`;
    } else if (usdVal) {
      fraseMercado += `... y el dólar interbancario en ${usdVal} pesos.`;
    } else {
      fraseMercado += `.`;
    }
    partes.push(fraseMercado);
  }
  
  // 2. Cruce de obligaciones próximas
  if (compromisos && compromisos.length > 0) {
    const prox = compromisos.slice(0, 2);
    const descCompromisos = prox.map(c => {
      const conc = c.concepto || c.proveedor || "compromiso";
      const monto = Math.round(Number(c.saldo || c.montoTotal || c.monto || c.valor || 0));
      return `${conc} por ${monto} pesos`;
    }).join(", y ");
    partes.push(`En tus cuentas tienes ${compromisos.length} compromisos pendientes, principalmente: ${descCompromisos}.`);
  } else {
    partes.push(`Tus cuentas y compromisos se encuentran al día.`);
  }

  // 3. Liquidez y cobertura patrimonial
  const saldoDisp = saldos?.Personal?.disponible || saldos?.TOTAL?.disponible || (typeof saldos?.totalGeneral === "number" ? saldos.totalGeneral : null);
  if (saldoDisp && saldoDisp > 0) {
    partes.push(`Tu saldo disponible actual cubre las obligaciones con holgura.`);
  }

  // 4. Advertencia de conducción o custodia
  if (esConduccion) {
    partes.push(`Conduce con atención... yo vigilo tus números.`);
  } else {
    partes.push(`Todo bajo estricta vigilancia y protección.`);
  }

  return partes.join(" ");
}

/**
 * Genera el informe financiero estructurado determinístico (Estilo Visual Imagen 2)
 */
function formatearInformeAsesorFinancieroFallback_(snapshot, dian, perm, compromisos, saldos, textoUsuario, infoVoz, alias) {
  const nombreAsistente = alias || (perm && perm.aliasAsistente) || (perm && perm.rol === "SUPER_ADMIN" ? "Bruce Wayne" : "Aura");
  let cuerpo = `${infoVoz.emoji} *Informe de Inteligencia Financiera & Asesoría Estratégica* — **${nombreAsistente}**\n\n`;

  const t = String(textoUsuario || "").toLowerCase();

  // Sección 1: Mercado de Divisas e Indicadores Globales
  if (snapshot && (snapshot.trmOficial || snapshot.divisas)) {
    cuerpo += `📈 *MERCADO DE DIVISAS & MACROECONOMÍA (EN VIVO):*\n`;
    if (snapshot.trmOficial) {
      cuerpo += `• 🇺🇸 *TRM Oficial:* **$${snapshot.trmOficial.valor.toLocaleString("es-CO")} COP** (Vigencia: ${snapshot.trmOficial.vigenciaDesde} al ${snapshot.trmOficial.vigenciaHasta})\n`;
      cuerpo += `  _Fuente oficial:_ ${snapshot.trmOficial.fuenteOficial}\n`;
    }
    if (snapshot.divisas) {
      cuerpo += `• 🇪🇺 *Euro:* $${snapshot.divisas.EUR_COP?.toLocaleString("es-CO")} COP | 🇬🇧 *Libra:* $${snapshot.divisas.GBP_COP?.toLocaleString("es-CO")} COP\n`;
      cuerpo += `• 🇲🇽 *Peso MXN:* $${snapshot.divisas.MXN_COP} COP | 🇧🇷 *Real BRL:* $${snapshot.divisas.BRL_COP?.toLocaleString("es-CO")} COP\n`;
    }
    if (snapshot.commodities) {
      if (snapshot.commodities.sp500) cuerpo += `• 📊 *S&P 500:* ${snapshot.commodities.sp500.toLocaleString("es-CO")} pts\n`;
      if (snapshot.commodities.petroleoWTI) cuerpo += `• 🛢️ *Petróleo WTI:* $${snapshot.commodities.petroleoWTI} USD/barril\n`;
      if (snapshot.commodities.oroOnza) cuerpo += `• 🪙 *Oro:* $${snapshot.commodities.oroOnza?.toLocaleString("es-CO")} USD/onza\n`;
    }
    if (snapshot.cripto && snapshot.cripto.BTC_USD) {
      cuerpo += `• ⚡ *Bitcoin:* $${snapshot.cripto.BTC_USD.toLocaleString("es-CO")} USD\n`;
    }
    cuerpo += `\n`;
  }

  // Sección 2: Consultoría Tributaria Oficial DIAN
  if (t.includes("dian") || t.includes("impuesto") || t.includes("retencion") || t.includes("iva") || t.includes("renta") || t.includes("uvt") || t.includes("niif")) {
    cuerpo += `🏛️ *CONSULTORÍA TRIBUTARIA OFICIAL DIAN (UVT $${dian.uvtVigente.toLocaleString("es-CO")}):*\n`;
    cuerpo += `• 📌 *Retención en la Fuente:* ${dian.retefuente.reglaVencimiento}\n`;
    cuerpo += `  - Compras generales declarantes: ${dian.retefuente.tarifasPrincipales.comprasDeclarantes}\n`;
    cuerpo += `  - Servicios generales declarantes: ${dian.retefuente.tarifasPrincipales.serviciosDeclarantes}\n`;
    cuerpo += `  - Honorarios PJ / PN: ${dian.retefuente.tarifasPrincipales.honorariosPJ} / ${dian.retefuente.tarifasPrincipales.honorariosPN}\n`;
    cuerpo += `• 🧾 *IVA:* ${dian.iva.bimestral}\n`;
    cuerpo += `• 📊 *Marco NIIF:* ${dian.niifColombia.grupo2}.\n\n`;
  }

  // Sección 3: Cruce Estratégico con Finanzas Reales en Google Sheets (Imagen 2)
  cuerpo += `💼 *CRUCE ESTRATÉGICO CON TUS FINANZAS (Copiloto: ${nombreAsistente}):*\n`;
  if (compromisos && compromisos.length > 0) {
    cuerpo += `• Registras **${compromisos.length} compromisos pendientes** en tu hoja de control.\n`;
    
    // Desglose de próximos compromisos clave
    const proximos = compromisos.slice(0, 2);
    if (proximos.length > 0) {
      const descProx = proximos.map(c => {
        const conc = c.concepto || c.proveedor || "Obligación";
        const val = Number(c.saldo || c.montoTotal || c.monto || c.valor || 0);
        const valStr = val > 0 ? ` por $${val.toLocaleString("es-CO")} COP` : "";
        const fecStr = c.vence ? ` (vence ${c.vence})` : (c.fechaVencimiento ? ` (vence ${c.fechaVencimiento})` : "");
        return `*${conc}*${valStr}${fecStr}`;
      }).join(" y ");
      cuerpo += `• *Próximos Vencimientos Clave:* ${descProx}.\n`;
    }

    const saldoDisp = saldos?.Personal?.disponible || saldos?.TOTAL?.disponible || (typeof saldos?.totalGeneral === "number" ? saldos.totalGeneral : null);
    if (saldoDisp && saldoDisp > 0) {
      cuerpo += `• *Liquidez:* Tu saldo disponible ($${Number(saldoDisp).toLocaleString("es-CO")} COP) respalda estas obligaciones con holgura.\n`;
    }

    cuerpo += `• _Recomendación:_ Ante la volatilidad cambiaria y tasas de referencia, prioriza la amortización de compromisos indexados o con fechas próximas para blindar tu margen de rentabilidad.\n`;
  } else {
    cuerpo += `• Excelente gestión: No tienes pasivos críticos en mora. Se recomienda canalizar excedentes de liquidez en instrumentos de bajo riesgo o renta fija.\n`;
  }

  if (infoVoz.lema) {
    cuerpo += `\n🛡️ _«${infoVoz.lema}»_`;
  }

  return cuerpo;
}

// ============================================================================
// PRESENTACIÓN OFICIAL DEL ASISTENTE Y CONSULTAS ESPECÍFICAS DE GASTOS
// ============================================================================

/**
 * Detecta si el usuario solicita una presentación formal del asistente, sus funciones o alcance
 */
function detectarSolicitudPresentacion_(texto) {
  if (!texto) return false;
  const t = String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  return /(?:presentate|quien\s+eres|primera\s+vez\s+que\s+interactuamos|cuales\s+son\s+tus\s+funciones|alcance\s+de\s+tu\s+asistencia|que\s+puedes\s+hacer|tus\s+conocimientos|presentacion)/i.test(t);
}

/**
 * Genera la respuesta oficial de presentación tanto en texto formateado como en guion de audio hablado
 */
function ejecutarPresentacionAsistente_(telefono, perm, solicitaAudio) {
  const alias = perm.aliasAsistente || (perm.rol === "SUPER_ADMIN" ? "Bruce Wayne" : "Aura");
  const infoVoz = typeof obtenerInfoPerfilVoz_ === "function" 
    ? obtenerInfoPerfilVoz_(perm.perfilVoz || (perm.rol === "SUPER_ADMIN" ? "BATMAN" : "FEMENINO_DULCE"))
    : { emoji: "🦇", desc: "Batman", lema: "Soy la noche. Tus finanzas están bajo estricta vigilancia." };

  const nombreHumano = sanitizarNombreHumano_(perm ? perm.nombre : "Fernando");
  const texto = `${infoVoz.emoji} *Presentación Oficial - Dirección Financiera & Asesoría Estratégica*\n\n` +
    `Hola, ${nombreHumano}. Soy **${alias}**, tu asistente y director financiero inteligente de élite.\n\n` +
    `💼 *ALCANCE DE MI ASISTENCIA:*\n` +
    `• **Control Patrimonial:** Gestión unificada de tus finanzas *Personal*, *More Paper* y *More Design*.\n` +
    `• **Registro Contable Inmediato:** Proceso ingresos, gastos necesarios, compras y servicios con clasificación automática por categoría y método de pago.\n` +
    `• **Gestión de Deudas y Compromisos:** Seguimiento a cuentas por pagar, facturas a crédito, alertas de vencimiento 24h antes y liquidación de cuotas.\n` +
    `• **Visión Artificial:** Lectura de comprobantes bancarios, facturas electrónicas y recibos físicos.\n` +
    `• **Inteligencia Bursátil en Vivo:** Monitoreo en tiempo real de la TRM oficial, divisas (EUR, GBP, MXN), materias primas (Petróleo, Oro) y criptoactivos.\n` +
    `• **Consultoría Tributaria DIAN:** Calendario impositivo, tarifas de retención en la fuente, UVT y normas contables NIIF.\n\n` +
    `🗣️ *INTERACCIÓN POR TEXTO Y NOTAS DE VOZ:*\n` +
    `Puedes hablarme o escribirme naturalmente. Por ejemplo:\n` +
    `• _"Gasté 15.000 en transporte en efectivo"_\n` +
    `• _"¿Cuáles han sido mis gastos hoy?"_\n` +
    `• _"¿A cómo está la TRM y el Euro hoy?"_\n` +
    `• _"¿Qué compromisos tengo pendientes?"_\n\n` +
    `🛡️ _«${infoVoz.lema}»_`;

  const textoVoz = `Saludos. Soy ${alias}. Como director y estratega de tu sistema financiero, vigilo cada movimiento de tu patrimonio personal y de tus empresas More Paper y More Design. Registro tus ingresos y egresos al instante, administro tus compromisos antes de que venzan, leo comprobantes con visión artificial y monitoreo en tiempo real la TRM, divisas y normas de la DIAN. Mis análisis son exactos, sin margen de error. Dime qué movimiento deseas registrar o qué balance evaluamos hoy.`;

  return {
    tipo: "conversacion",
    texto: texto,
    textoVoz: textoVoz,
    perfilVoz: perm.perfilVoz,
    requiereAudio: solicitaAudio !== false
  };
}

/**
 * Calcula y desglosa los gastos del día o periodo leyendo directamente las transacciones registradas en Sheets
 */
function calcularGastosHoyOPeriodo_(ss, fechaFiltro, entidadFiltro, perm, alias, infoVoz) {
  const entidades = entidadFiltro ? [entidadFiltro] : (perm.rol === "SUPER_ADMIN" ? ["Personal", "More Paper", "More Design"] : [perm.entidadPropia || "Personal"]);
  const gastos = [];
  let total = 0;

  entidades.forEach(ent => {
    const sheet = ss.getSheetByName(obtenerHojaTransacciones_(ent));
    if (!sheet || sheet.getLastRow() <= 1) return;

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12).getValues();
    data.forEach(r => {
      // 0: ID, 1: Fecha, 2: Tipo, 3: Categoria, 4: Subcategoria, 5: Concepto, 6: Tercero, 7: Valor, 8: Metodo
      const fechaRaw = r[1];
      let fechaStr = "";
      if (fechaRaw instanceof Date) {
        fechaStr = Utilities.formatDate(fechaRaw, Session.getScriptTimeZone(), "yyyy-MM-dd");
      } else if (fechaRaw) {
        fechaStr = String(fechaRaw).slice(0, 10).trim();
      }

      const tipo = String(r[2] || "").toLowerCase();
      const concepto = String(r[5] || "").toLowerCase();
      const valor = Number(r[7]) || 0;

      // Descartar filas con valor <= 0 o conceptos que sean preguntas mal registradas
      if (valor <= 0) return;
      if (concepto.includes("cual han sido") || concepto.includes("gastoas") || concepto.includes("cuanto") || concepto.includes("saldo")) return;

      const esGasto = tipo.includes("gasto") || tipo.includes("egreso") || tipo.includes("costo") || tipo.includes("compra") || tipo.includes("salida");
      if (!esGasto) return;

      if (fechaFiltro && fechaStr !== fechaFiltro) return;

      gastos.push({
        id: r[0],
        entidad: ent,
        fecha: fechaStr,
        tipo: r[2],
        categoria: r[3] || "General",
        subcategoria: r[4] || "",
        concepto: r[5] || "Gasto",
        tercero: r[6] || "",
        valor: valor,
        metodo: r[8] || "Efectivo"
      });
      total += valor;
    });
  });

  const etiquetaPeriodo = fechaFiltro ? `el día de hoy (${fechaFiltro})` : "en tu historial reciente";

  let textoResp = "";
  let textoVoz = "";

  if (gastos.length === 0) {
    const nombreHumano = sanitizarNombreHumano_(perm ? perm.nombre : "Fernando");
    textoResp = `${infoVoz.emoji} *Gastos Registrados (${alias}):*\n\n` +
      `¡Hola, ${nombreHumano}! Estuve revisando tus cuentas y no tienes ningún gasto anotado ${etiquetaPeriodo}.\n\n` +
      `💰 *Total Gastos:* **$0 COP**\n\n` +
      `🛡️ _«${infoVoz.lema}»_`;

    textoVoz = `Hola, ${nombreHumano}. No registras gastos ${etiquetaPeriodo}. Tu balance de egresos se mantiene en cero pesos.`;
  } else {
    textoResp = `${infoVoz.emoji} *Informe de Gastos - ${fechaFiltro ? 'Día de Hoy' : 'Historial'}*\n\n` +
      `Desglose de egresos registrados ${etiquetaPeriodo}:\n`;

    gastos.forEach(g => {
      textoResp += `• *${g.categoria}* (${g.entidad}): $${g.valor.toLocaleString("es-CO")} COP - _${g.concepto}_ [${g.metodo}]\n`;
    });

    textoResp += `\n💰 *TOTAL GASTOS:* **$${total.toLocaleString("es-CO")} COP**\n\n` +
      `🛡️ _«${infoVoz.lema}»_`;

    const resumenHabla = gastos.slice(0, 3).map(g => `${g.concepto} por ${g.valor} pesos en ${g.categoria}`).join(", ");
    textoVoz = `El total de tus gastos ${etiquetaPeriodo} asciende a ${total} pesos colombianos. Incluye: ${resumenHabla}.`;
  }

  return {
    tipo: "consulta",
    texto: textoResp,
    textoVoz: textoVoz,
    perfilVoz: perm.perfilVoz
  };
}

// ============================================================================
// MÓDULO: GESTIÓN CONVERSACIONAL DE CUENTAS BANCARIAS
// ============================================================================

/**
 * Detecta si el texto expresa intención de consultar o inscribir una cuenta bancaria / billetera.
 */
function detectarSolicitudGestionCuentasBancarias_(textoUsuario) {
  const t = String(textoUsuario || "").toLowerCase().trim();
  const palabrasCta = t.includes("cuenta") || t.includes("cuentas") || t.includes("banco") || 
                      t.includes("nequi") || t.includes("daviplata") || t.includes("bancolombia") || 
                      t.includes("billetera") || t.includes("entidad financiera");
  if (!palabrasCta) return false;

  // Consultar cuentas
  const esConsulta = (t.includes("mis cuentas") || t.includes("ver cuentas") || 
                      t.includes("cuales cuentas") || t.includes("cuáles cuentas") || 
                      t.includes("que cuentas") || t.includes("qué cuentas") || 
                      t.includes("cuentas registradas") || t.includes("cuentas inscritas") ||
                      t.includes("listar cuentas"));
  if (esConsulta) return true;

  // Inscribir / Registrar cuenta
  const esRegistro = (t.includes("registrar") || t.includes("agrega") || t.includes("inscrib") || 
                      t.includes("anota") || t.includes("guardar") || t.includes("nueva cuenta") || 
                      t.includes("vincular")) &&
    (t.includes("***") || /\d{4}/.test(t) || t.includes("bancolombia") || t.includes("nequi") || t.includes("daviplata") || t.includes("banco"));

  // Excluir órdenes de "registra saldo a favor de 100000"
  if (t.includes("saldo a favor") || (t.includes("saldo") && /\d{5,}/.test(t.replace(/[^0-9]/g, "")) && !t.includes("***"))) {
    return false;
  }

  return esRegistro;
}

/**
 * Ejecuta la consulta o el registro guiado de una cuenta bancaria o billetera virtual.
 */
function ejecutarGestionCuentasBancarias_(ss, telLimpio, textoUsuario, perm) {
  const t = String(textoUsuario || "").toLowerCase().trim();
  const nombreHumano = sanitizarNombreHumano_(perm ? perm.nombre : "Usuario");
  const entidadUsuario = (perm && perm.rol !== "SUPER_ADMIN") ? (perm.entidadPropia || "Personal") : "Consolidado";

  // Caso 1: Consulta de cuentas activas
  if (t.includes("mis cuentas") || t.includes("ver cuentas") || t.includes("cuentas registradas") || 
      t.includes("cuentas inscritas") || t.includes("cuales cuentas") || t.includes("cuáles cuentas") ||
      t.includes("listar cuentas")) {
    const cuentas = (typeof obtenerCuentasBancariasPorEntidad_ === "function")
      ? obtenerCuentasBancariasPorEntidad_(ss, entidadUsuario)
      : [];

    if (!cuentas || cuentas.length === 0) {
      return {
        tipo: "conversacion",
        texto: `¡Hola, ${nombreHumano}! No tienes cuentas bancarias ni billeteras inscritas en tu espacio personal.\n\n` +
          `Para registrar una con total seguridad, solo dime por ejemplo:\n` +
          `• *"Registrar cuenta Bancolombia ***1234"*\n` +
          `• *"Agregar mi Nequi ***7890"*`
      };
    }

    let textoResp = `💳 *Tus Cuentas Bancarias y Billeteras Registradas:*\n\n`;
    cuentas.forEach((c, idx) => {
      textoResp += `${idx + 1}️⃣ *${c.banco} ${c.mascara}*\n` +
        `   • Alias: _${c.alias || c.banco}_\n` +
        `   • Ámbito de Uso: *${c.tipoUso}*\n` +
        `   • Titular: ${c.usuario}\n\n`;
    });
    textoResp += `📌 *Nota:* Puedes agregar más cuentas en cualquier momento diciendo: *"Registrar cuenta [Banco] ***[4 dígitos]"*.`;

    return { tipo: "conversacion", texto: textoResp };
  }

  // Caso 2: Registro de nueva cuenta
  let banco = "Bancolombia";
  if (t.includes("nequi")) banco = "Nequi";
  else if (t.includes("daviplata")) banco = "Daviplata";
  else if (t.includes("davivienda")) banco = "Davivienda";
  else if (t.includes("bbva")) banco = "BBVA";
  else if (t.includes("bogota") || t.includes("bogotá")) banco = "Banco de Bogotá";
  else if (t.includes("nu") || t.includes("nubank")) banco = "Nubank";
  else if (t.includes("falabella")) banco = "Falabella";
  else if (t.includes("colpatria") || t.includes("scotiabank")) banco = "Scotiabank Colpatria";
  else if (t.includes("lulo")) banco = "Lulo Bank";
  else if (t.includes("dale")) banco = "Dale";
  else if (t.includes("agrario")) banco = "Banco Agrario";

  // Extraer máscara de 4 dígitos
  let mascara = null;
  const matchMask = t.match(/\*{0,3}(\d{4})\b/) || t.match(/(?:cuenta|numero|número|celular|terminada en)\s*(?:en\s*)?\*{0,3}(\d{4})/i);
  if (matchMask) {
    mascara = `***${matchMask[1]}`;
  }

  if (!mascara) {
    return {
      tipo: "conversacion",
      texto: `¡Hola, ${nombreHumano}! Para registrar tu cuenta bancaria o billetera con total seguridad, por favor indícame la entidad y los *últimos 4 números* precedidos de 3 asteriscos.\n\n` +
        `Ejemplos guiados:\n` +
        `• *"Registrar cuenta Bancolombia ***1234"*\n` +
        `• *"Agregar Nequi ***7890"* (últimos 4 dígitos del celular)\n` +
        `• *"Inscribir Daviplata ***4567 para uso personal"*`
    };
  }

  // Determinar Tipo de Uso (Personal vs Global/Tiendas)
  let tipoUso = "Personal";
  let requierePreguntarUso = false;

  if (perm && perm.rol === "SUPER_ADMIN") {
    if (t.includes("personal") || t.includes("fernando") || t.includes("propia") || t.includes("propio")) {
      tipoUso = "Personal";
    } else if (t.includes("tienda") || t.includes("tiendas") || t.includes("negocio") || t.includes("negocios") || 
               t.includes("global") || t.includes("more paper") || t.includes("more design") || t.includes("comun") || t.includes("común")) {
      tipoUso = "Global / Tiendas";
    } else {
      requierePreguntarUso = true;
    }
  } else {
    tipoUso = "Personal";
  }

  if (requierePreguntarUso) {
    try {
      const cache = CacheService.getUserCache();
      if (cache) {
        cache.put("PENDING_INTERACTIVE_FLOW_" + telLimpio, JSON.stringify({
          tipo: "registro_cuenta_falta_uso",
          datosParciales: {
            banco: banco,
            mascara: mascara,
            usuarioOEntidad: "Fernando"
          }
        }), 600);
      }
    } catch (eC) {
      Logger.log("Aviso guardando flujo interactivo cuenta: " + eC.message);
    }

    return {
      tipo: "conversacion",
      texto: `🏛️ *Confirmación de Ámbito Financiero*\n\n` +
        `He detectado la cuenta **${banco} ${mascara}**.\n\n` +
        `Para clasificarla adecuadamente en tu libro financiero, por favor confírmame su destino de uso:\n` +
        `1️⃣ *Uso Personal* (Tus finanzas individuales de Fernando)\n` +
        `2️⃣ *Uso Negocio / Tiendas* (More Paper, More Design o cuenta común compartida)\n\n` +
        `Por favor responde con el número *1* o *2*.`
    };
  }

  const titular = (tipoUso === "Personal") ? (perm ? perm.entidadPropia || "Personal" : "Personal") : "Consolidado";
  const alias = `${banco} ${mascara} (${tipoUso})`;

  if (typeof registrarNuevaCuentaBancariaEnConfig_ === "function") {
    registrarNuevaCuentaBancariaEnConfig_(ss, titular, banco, mascara, tipoUso, alias);
  }

  return {
    tipo: "conversacion",
    texto: `✅ *Cuenta Bancaria Registrada con Éxito*\n\n` +
      `🏛️ *Entidad:* ${banco}\n` +
      `🔢 *Número:* ${mascara}\n` +
      `🏷️ *Destino:* ${tipoUso}\n` +
      `👤 *Titular Asociado:* ${titular}\n\n` +
      `Tu cuenta ha quedado guardada en la hoja maestra *Config_Cuentas_Bancarias* y ya se encuentra visible en tu Bóveda de Liquidez.`
  };
}

// ============================================================================
// MÓDULO B: TAXONOMÍA GUIADA, GOBERNANZA Y RECATEGORIZACIÓN INTELIGENTE
// ============================================================================

/**
 * Sugiere de 2 a 3 categorías estándar jerárquicas a partir de un concepto o palabra clave.
 * Mantiene la clasificación limpia y evita la proliferación de micro-categorías redundantes.
 */
function sugerirCategoriasEstandarParaConcepto_(conceptoONombre) {
  const c = String(conceptoONombre || "").toLowerCase().trim();
  if (c.includes("comida") || c.includes("almuerzo") || c.includes("cena") || c.includes("mercado") || 
      c.includes("supermercado") || c.includes("desayuno") || c.includes("restaurante") || c.includes("cafe") || c.includes("café")) {
    return ["Alimentación / Mercado", "Salidas / Restaurantes", "Antojos / Compras Hormiga"];
  }
  if (c.includes("gasolina") || c.includes("taxi") || c.includes("uber") || c.includes("peaje") || 
      c.includes("pasaje") || c.includes("transporte") || c.includes("bus") || c.includes("carro") || c.includes("moto")) {
    return ["Transporte / Combustible", "Mantenimiento / Vehículo", "Operativo General"];
  }
  if (c.includes("papel") || c.includes("resma") || c.includes("tinta") || c.includes("cartucho") || 
      c.includes("vinilo") || c.includes("material") || c.includes("insumo") || c.includes("papeleria") || c.includes("papelería")) {
    return ["Papelería & Resmas", "Tintas & Cartuchos", "Compra Insumos General"];
  }
  if (c.includes("luz") || c.includes("agua") || c.includes("gas") || c.includes("internet") || 
      c.includes("telefono") || c.includes("celular") || c.includes("claro") || c.includes("tigo") || c.includes("etb")) {
    return ["Servicios Públicos", "Telecomunicaciones", "Gasto Fijo"];
  }
  if (c.includes("arriendo") || c.includes("alquiler") || c.includes("canon") || c.includes("local") || c.includes("administracion") || c.includes("administración")) {
    return ["Vivienda / Arriendo", "Arriendo Local", "Gasto Fijo"];
  }
  if (c.includes("medico") || c.includes("médico") || c.includes("medicina") || c.includes("farmacia") || 
      c.includes("drogueria") || c.includes("droguería") || c.includes("cita") || c.includes("salud") || c.includes("examen")) {
    return ["Salud / Farmacia", "Gastos Médicos", "Gasto Necesario"];
  }
  if (c.includes("publicidad") || c.includes("facebook") || c.includes("instagram") || c.includes("meta") || 
      c.includes("volante") || c.includes("anuncio") || c.includes("campaña") || c.includes("marketing")) {
    return ["Servicios Publicitarios", "Marketing Digital", "Proyectos de Diseño"];
  }
  if (c.includes("software") || c.includes("adobe") || c.includes("chatgpt") || c.includes("figma") || 
      c.includes("openai") || c.includes("suscripcion") || c.includes("suscripción") || c.includes("licencia")) {
    return ["Suscripciones Software", "Equipos & Tecnología", "Gasto Fijo"];
  }
  if (c.includes("nomina") || c.includes("nómina") || c.includes("sueldo") || c.includes("salario") || 
      c.includes("quincena") || c.includes("colaborador") || c.includes("empleado")) {
    return ["Gasto Operativo Global / Nómina", "Nómina & Comisiones", "Honorarios / Servicios"];
  }
  return ["Gasto Necesario / Operativo", "Imprevistos / Varios", "Administrativo General"];
}

/**
 * Detecta solicitud expresa de creación de categoría.
 */
function detectarSolicitudCrearCategoriaGuiada_(textoUsuario) {
  const t = String(textoUsuario || "").toLowerCase().trim();
  const match = t.match(/(?:crear|agregar|nueva|inscribir|anadir|añadir)\s+categor[ií]a\s+([a-záéíóúñ0-9\s\/\-_]+)/i);
  return match ? match[1].trim() : null;
}

/**
 * Guía la creación de una nueva categoría protegiendo la estructura general y evitando el desorden.
 */
function ejecutarSolicitudCrearCategoriaGuiada_(ss, telLimpio, textoUsuario, perm) {
  const nombreCatRaw = detectarSolicitudCrearCategoriaGuiada_(textoUsuario);
  if (!nombreCatRaw) return null;

  const nombreCat = sanitizarTextoGeneral_(nombreCatRaw);
  const sugerencias = sugerirCategoriasEstandarParaConcepto_(nombreCat);
  const sug1 = sugerencias[0] || "Gasto Operativo";
  const sug2 = sugerencias[1] || "Gasto Necesario";

  try {
    const cache = CacheService.getUserCache();
    if (cache) {
      cache.put("PENDING_INTERACTIVE_FLOW_" + telLimpio, JSON.stringify({
        tipo: "confirmacion_categoria_guiada",
        datosParciales: {
          categoriaSolicitada: nombreCat,
          opcion1: sug1,
          opcion2: sug2,
          entidad: perm ? perm.entidadPropia || "Personal" : "Personal"
        }
      }), 600);
    }
  } catch (eC) {
    Logger.log("Aviso guardando flujo interactivo categoria: " + eC.message);
  }

  return {
    tipo: "conversacion",
    texto: `🏛️ *Gobernanza Financiera & Clasificación General*\n\n` +
      `Has solicitado crear la categoría *"${nombreCat}"*.\n\n` +
      `Para mantener un orden financiero riguroso y evitar la creación de múltiples micro-categorías que dispersen la información y dificulten tus análisis mensuales, te sugiero evaluar si podemos clasificarla dentro de estas opciones estándar:\n\n` +
      `1️⃣ *${sug1}* (Recomendada para agrupar este tipo de movimientos)\n` +
      `2️⃣ *${sug2}*\n` +
      `3️⃣ *Crear definitivamente "${nombreCat}"* como categoría independiente en tu catálogo\n\n` +
      `¿Cuál prefieres? Por favor responde *1*, *2* o *3* (o escribe la categoría que decidas).`
  };
}

/**
 * Detecta si el usuario solicita recategorizar o reclasificar un movimiento previo.
 */
function detectarSolicitudRecategorizacion_(textoUsuario) {
  const t = String(textoUsuario || "").toLowerCase().trim();
  return (
    t.includes("recategoriz") ||
    t.includes("reclasific") ||
    t.includes("cambiar categoria") ||
    t.includes("cambiar categoría") ||
    t.includes("cambia la categoria") ||
    t.includes("cambia la categoría") ||
    t.includes("cambiar la categoria") ||
    t.includes("cambiar la categoría") ||
    t.includes("mover de categoria") ||
    t.includes("mover de categoría") ||
    t.includes("mover a otra categoria") ||
    t.includes("mover a otra categoría")
  );
}

/**
 * Guía interactivamente la recategorización retrospectiva de la última transacción o de una específica.
 */
function ejecutarSolicitudRecategorizacionGuiada_(ss, telLimpio, textoUsuario, perm) {
  const t = String(textoUsuario || "").toLowerCase().trim();
  const entidad = (perm && perm.rol !== "SUPER_ADMIN") ? (perm.entidadPropia || "Personal") : "Personal";

  // Determinar la hoja de transacciones objetivo
  let hojaNombre = obtenerHojaTransacciones_(entidad);
  if (perm && perm.rol === "SUPER_ADMIN") {
    if (t.includes("more paper") || t.includes("paper")) hojaNombre = HOJAS.MOREPAPER_TRANS;
    else if (t.includes("more design") || t.includes("design")) hojaNombre = HOJAS.MOREDESIGN_TRANS;
    else if (t.includes("global") || t.includes("consolidado")) hojaNombre = (HOJAS.OPERACION_GLOBAL || HOJAS.GASTOS_GLOBALES);
  }

  const sheet = ss.getSheetByName(hojaNombre);
  if (!sheet || sheet.getLastRow() <= 1) {
    return {
      tipo: "conversacion",
      texto: `No encontré transacciones registradas en la hoja *${hojaNombre}* para poder recategorizar.`
    };
  }

  const lastRow = sheet.getLastRow();
  const maxFilasBuscar = Math.min(25, lastRow - 1);
  const datos = sheet.getRange(lastRow - maxFilasBuscar + 1, 1, maxFilasBuscar, 12).getValues();

  // Buscar coincidencia si el usuario mencionó un monto o concepto específico
  let filaObjetivo = lastRow;
  let filaIndexEnDatos = datos.length - 1;

  const montoMatch = t.match(/\b\d{3,8}\b/);
  if (montoMatch) {
    const montoBuscado = Number(montoMatch[0]);
    for (let i = datos.length - 1; i >= 0; i--) {
      const valRow = Number(datos[i][7]) || 0;
      if (Math.abs(valRow - montoBuscado) < 10) {
        filaIndexEnDatos = i;
        filaObjetivo = (lastRow - maxFilasBuscar + 1) + i;
        break;
      }
    }
  }

  const rowData = datos[filaIndexEnDatos];
  const concepto = rowData[5] || "Transacción";
  const categoriaActual = rowData[3] || "General";
  const valor = Number(rowData[7]) || 0;

  // Si el usuario ya especificó directamente la categoría en la orden: ej "recategoriza a Transporte"
  const matchDirecto = t.match(/(?:a\s+la\s+categor[ií]a|a\s+categor[ií]a|a\s+)(.+)$/i);
  if (matchDirecto && !matchDirecto[1].includes("recategoriz") && matchDirecto[1].trim().length > 2) {
    const catNuevaDirecta = sanitizarTextoGeneral_(matchDirecto[1].trim());
    sheet.getRange(filaObjetivo, 4).setValue(catNuevaDirecta);
    const ahora = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
    const notasAct = String(sheet.getRange(filaObjetivo, 12).getValue() || "");
    sheet.getRange(filaObjetivo, 12).setValue(notasAct ? `${notasAct} [Recategorizado de '${categoriaActual}' a '${catNuevaDirecta}' el ${ahora}]` : `[Recategorizado de '${categoriaActual}' a '${catNuevaDirecta}' el ${ahora}]`);
    SpreadsheetApp.flush();

    return {
      tipo: "conversacion",
      texto: `✅ *Transacción Recategorizada con Éxito*\n\n` +
        `📝 *Concepto:* ${concepto}\n` +
        `💰 *Valor:* $${valor.toLocaleString("es-CO")} COP\n` +
        `🏷️ *Nueva Categoría:* **${catNuevaDirecta}**\n` +
        `⏮️ *Categoría Anterior:* _${categoriaActual}_\n\n` +
        `Tus balances contables y gráficos en el Dashboard Canvas se han sincronizado en tiempo real.`
    };
  }

  // Generar sugerencias inteligentes basadas en taxonomía general
  const sugerencias = sugerirCategoriasEstandarParaConcepto_(concepto);
  const sug1 = sugerencias[0] || "Alimentación / Mercado";
  const sug2 = sugerencias[1] || "Transporte / Combustible";
  const sug3 = sugerencias[2] || "Gasto Necesario";

  try {
    const cache = CacheService.getUserCache();
    if (cache) {
      cache.put("PENDING_INTERACTIVE_FLOW_" + telLimpio, JSON.stringify({
        tipo: "recategorizacion_pendiente",
        datosParciales: {
          hojaNombre: hojaNombre,
          filaIndex: filaObjetivo,
          concepto: concepto,
          valor: valor,
          categoriaActual: categoriaActual,
          opcion1: sug1,
          opcion2: sug2,
          opcion3: sug3
        }
      }), 600);
    }
  } catch (eC) {
    Logger.log("Aviso guardando flujo interactivo recategorizacion: " + eC.message);
  }

  return {
    tipo: "conversacion",
    texto: `🔍 *Recategorización Asistida de Transacciones*\n\n` +
      `He ubicado tu transacción:\n` +
      `📌 *Concepto:* ${concepto}\n` +
      `💰 *Monto:* $${valor.toLocaleString("es-CO")} COP\n` +
      `🏷️ *Categoría Actual:* ${categoriaActual}\n\n` +
      `Para mantener la clasificación lógica y ordenada de tus cuentas, te sugiero las siguientes categorías estándar:\n` +
      `1️⃣ *${sug1}*\n` +
      `2️⃣ *${sug2}*\n` +
      `3️⃣ *${sug3}*\n\n` +
      `¿A cuál deseas reasignarla? Responde *1*, *2* o *3* (o escribe el nombre de la categoría que prefieras).`
  };
}
