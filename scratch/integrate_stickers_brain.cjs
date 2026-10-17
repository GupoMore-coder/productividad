const fs = require('fs');

console.log("🚀 Integrando Diccionario Maestro y Motor de Stickers 3D en fase2_ai_agent_brain.js...");

// 1. Cargar el diccionario base de test_complete_characters.cjs
const testCompleteContent = fs.readFileSync('scratch/test_complete_characters.cjs', 'utf8').replace(/\r\n/g, '\n');

// Extraer el objeto DICCIONARIO_MAESTRO_PERSONAJES_
const dictStart = testCompleteContent.indexOf('const DICCIONARIO_MAESTRO_PERSONAJES_ = {');
const dictEnd = testCompleteContent.indexOf('};\n\nfunction obtenerDefinicionPersonajeCompleta_');
if (dictStart === -1 || dictEnd === -1) {
  throw new Error(`No se pudo localizar DICCIONARIO_MAESTRO_PERSONAJES_ en test_complete_characters.cjs (start: ${dictStart}, end: ${dictEnd})`);
}

let dictBlock = testCompleteContent.slice(dictStart, dictEnd + 2);
dictBlock = dictBlock.replace('const DICCIONARIO_MAESTRO_PERSONAJES_', 'var DICCIONARIO_MAESTRO_PERSONAJES_');

// Inyectar stickerEstatico y stickerAnimado en cada personaje del bloque
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

  // Buscar bloque del personaje dentro del dictBlock
  const charIdx = dictBlock.indexOf(`  ${k}: {`);
  if (charIdx !== -1) {
    const imgIdx = dictBlock.indexOf('imagenUrl:', charIdx);
    const endLine = dictBlock.indexOf('\n', imgIdx);
    const insertion = `\n    stickerEstatico: "${staticUrl}",\n    stickerAnimado: "${animUrl}",`;
    dictBlock = dictBlock.slice(0, endLine) + insertion + dictBlock.slice(endLine);
  }
});

// Código del resolver y obtención completa
const fullHelperCode = `
${dictBlock}

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

/**
 * Obtiene la definición completa e irrepetible de un personaje (datos, voz, lemas, imágenes, stickers, frases célebres).
 */
function obtenerDefinicionPersonajeCompleta_(perfilVozOAlias) {
  if (!perfilVozOAlias) return DICCIONARIO_MAESTRO_PERSONAJES_.GATO_CON_BOTAS;
  const p = String(perfilVozOAlias).toUpperCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").trim();

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
            stickerEstatico: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/gato_con_botas_sticker_static.webp",
            stickerAnimado: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/gato_con_botas_sticker_anim.webp",
            captionImagen: function(nom) { return (d.emoji || "🎭") + " *" + d.nombre.toUpperCase() + " | Copiloto Financiero*\\n_«" + (d.lema || "Protección de tus arcas") + ", " + nom + "!»_"; },
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
`;

// 2. Modificar fase2_ai_agent_brain.js normalizando a \n
let brain = fs.readFileSync('fase2_ai_agent_brain.js', 'utf8').replace(/\r\n/g, '\n');

// Reemplazar la función anterior obtenerInfoPerfilVoz_
const targetAnchor = 'function obtenerInfoPerfilVoz_(perfil) {';
if (!brain.includes(targetAnchor)) {
  throw new Error("No se encontró obtenerInfoPerfilVoz_(perfil) en fase2_ai_agent_brain.js");
}

const beforeAnchor = brain.slice(0, brain.indexOf(targetAnchor));
const afterAnchor = brain.slice(brain.indexOf(targetAnchor));

// Encontrar el inicio de generarCatalogoSuperheroes_
const endOfInfoVoz = afterAnchor.indexOf('function generarCatalogoSuperheroes_(');
if (endOfInfoVoz === -1) {
  throw new Error("No se encontró function generarCatalogoSuperheroes_( en fase2_ai_agent_brain.js");
}

brain = beforeAnchor + fullHelperCode.trim() + '\n\n' + afterAnchor.slice(endOfInfoVoz);

// 3. Actualizar Caso B (cambio_solo_voz) en ejecutarCambioNombreVoz_
const casoBAnchor = '  // Caso B: Cambio exclusivo de voz\n  if (intencion.tipo === "cambio_solo_voz") {';
const casoCEndAnchor = '  // Caso C: Bautizar o renombrar al asistente';

const idxCasoB = brain.indexOf(casoBAnchor);
const idxCasoC = brain.indexOf(casoCEndAnchor);
if (idxCasoB === -1 || idxCasoC === -1) {
  throw new Error(`No se pudo encontrar Caso B o Caso C en ejecutarCambioNombreVoz_ (B: ${idxCasoB}, C: ${idxCasoC})`);
}

const newCasoB = `  // Caso B: Cambio exclusivo de voz
  if (intencion.tipo === "cambio_solo_voz") {
    const aliasActual = perm.aliasAsistente || "tu Asistente";
    const perfilFinal = intencion.perfil || "FEMENINO_DULCE";
    const def = obtenerDefinicionPersonajeCompleta_(perfilFinal);
    const nombreHumano = sanitizarNombreHumano_(perm ? perm.nombre : "Fernando");

    if (typeof actualizarPerfilAsistenteUsuario === "function") {
      actualizarPerfilAsistenteUsuario(telefono, aliasActual, def.id, { motor: "FISH_AUDIO", tono: def.id });
    }

    const saludoVoz = typeof def.saludoVoz === "function" ? def.saludoVoz(nombreHumano) : (def.lema + " " + \`¡Hola \${nombreHumano}! A partir de ahora te acompañaré.\`);
    const iconoAccion = def.iconoAccion || "🛡️";
    const stickerInfo = resolverStickerPersonajeDinamico_(def, telefono);

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
      urlSticker: stickerInfo.url,
      tipoSticker: stickerInfo.tipo,
      urlImagen: stickerInfo.url,
      captionImagen: null
    };
  }

`;

brain = brain.slice(0, idxCasoB) + newCasoB + brain.slice(idxCasoC);

// 4. Actualizar Caso C (cambio_nombre_y_voz) en ejecutarCambioNombreVoz_
const casoCStartAnchor = '  // Caso C: Bautizar o renombrar al asistente\n  if (intencion.tipo === "cambio_nombre_y_voz") {';
const casoCEndReal = '  return null;\n}\n\n/**\n * Detecta si el usuario está solicitando explícitamente escuchar la voz';

const idxCasoCStart = brain.indexOf(casoCStartAnchor);
const idxCasoCEnd = brain.indexOf(casoCEndReal);
if (idxCasoCStart === -1 || idxCasoCEnd === -1) {
  throw new Error(`No se pudo encontrar límites de Caso C (start: ${idxCasoCStart}, end: ${idxCasoCEnd})`);
}

const newCasoC = `  // Caso C: Bautizar o renombrar al asistente
  if (intencion.tipo === "cambio_nombre_y_voz") {
    const nuevoNombre = intencion.nombre;
    const perfilInferido = inferirPerfilVozPorNombre_(nuevoNombre, intencion.textoCompleto);

    if (perfilInferido === "AMBIGUO") {
      if (typeof actualizarPerfilAsistenteUsuario === "function") {
        actualizarPerfilAsistenteUsuario(telefono, nuevoNombre, "PENDIENTE_CONSULTA", { motor: "FISH_AUDIO" });
      }

      return {
        tipo: "conversacion",
        texto: \`✨ *¡Excelente nombre! A partir de ahora me llamaré \${nuevoNombre}.*\\n\\n\` +
          \`Para adaptar perfectamente mis notas de voz a tu gusto, ¿qué estilo de voz prefieres que use?\\n\\n\` +
          \`1️⃣ *Femenina:* Mujer joven, alegre y dulce.\\n\` +
          \`2️⃣ *Masculina:* Adulto joven, cordial y fresco.\\n\` +
          \`3️⃣ *Superhéroe:* Batman, Iron Man, Optimus Prime, Spider-Man o Superman.\\n\` +
          \`4️⃣ *Neutra / Especial:* Robótica o electrónica.\\n\\n\` +
          \`Respóndeme con el número o escribe el nombre del superhéroe que prefieras.\`
      };
    }

    const def = obtenerDefinicionPersonajeCompleta_(perfilInferido);
    const nombreHumano = sanitizarNombreHumano_(perm ? perm.nombre : "Fernando");
    const aliasFinal = def.alias || nuevoNombre;

    if (typeof actualizarPerfilAsistenteUsuario === "function") {
      actualizarPerfilAsistenteUsuario(telefono, aliasFinal, def.id, { motor: "FISH_AUDIO", tono: def.id });
    }

    const saludoVozNom = typeof def.saludoVoz === "function" ? def.saludoVoz(nombreHumano) : (def.lema + " " + \`¡Hola \${nombreHumano}! A partir de ahora me llamaré \${aliasFinal}.\`);
    const iconoAccion = def.iconoAccion || "🛡️";
    const stickerInfo = resolverStickerPersonajeDinamico_(def, telefono);

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
      urlSticker: stickerInfo.url,
      tipoSticker: stickerInfo.tipo,
      urlImagen: stickerInfo.url,
      captionImagen: null
    };
  }

`;

brain = brain.slice(0, idxCasoCStart) + newCasoC + brain.slice(idxCasoCEnd);

// 5. Actualizar ejecutarDemostracionVoz_
const demoAnchor = 'function ejecutarDemostracionVoz_(telefono, perm) {';
const demoEndAnchor = '// ============================================================================\n// MOTOR DESATENDIDO DE CREACIÓN Y GOBERNANZA DE PERSONAJES DESDE WHATSAPP';

const idxDemo = brain.indexOf(demoAnchor);
const idxDemoEnd = brain.indexOf(demoEndAnchor);
if (idxDemo === -1 || idxDemoEnd === -1) {
  throw new Error(`No se pudo encontrar límites de ejecutarDemostracionVoz_ (start: ${idxDemo}, end: ${idxDemoEnd})`);
}

const newDemo = `function ejecutarDemostracionVoz_(telefono, perm) {
  const perfil = (perm && perm.perfilVoz) ? perm.perfilVoz : (perm && perm.rol === "SUPER_ADMIN" ? "GATO_CON_BOTAS" : "FEMENINO_DULCE");
  const def = obtenerDefinicionPersonajeCompleta_(perfil);
  const nombreHumano = sanitizarNombreHumano_(perm ? perm.nombre : "Fernando");

  const textoSpoken = typeof def.saludoVoz === "function" ? def.saludoVoz(nombreHumano) : (def.lema + " " + \`¡Hola \${nombreHumano}! Aquí tienes mi voz activa.\`);

  const textoCard = \`\${def.emoji} *¡Aquí tienes mi voz, \${nombreHumano}!*\` +
    (def.lema ? \`\\n_«\${def.lema}»_\\n\\n\` : "\\n\\n") +
    \`🎙️ *Te acabo de enviar esta nota de voz* con mi tono, cadencia y personalidad como *\${def.descVoz}*.\\n\\n\` +
    \`\${def.iconoAccion || "🛡️"} *¿Qué desafío o gestión financiera emprendemos hoy?*\\n\` +
    \`1️⃣ 💰 *Registrar un movimiento* (ej: _"Venta de 5 resmas $90.000 More Paper"_)\\n\` +
    \`2️⃣ 🏦 *Auditar saldos bancarios* (Ahorros ***2103 y ***7194)\\n\` +
    \`3️⃣ 📜 *Revisar compromisos y deudas* (Proveedores pendientes)\\n\` +
    \`4️⃣ 📊 *Ver Dashboard Pro* (Escribe _"dame mi link"_)\\n\` +
    \`5️⃣ 🎭 *Explorar o cambiar de personaje* (Escribe _"Personajes"_)\`;

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

`;

brain = brain.slice(0, idxDemo) + newDemo + brain.slice(idxDemoEnd);

fs.writeFileSync('fase2_ai_agent_brain.js', brain, 'utf8');
console.log("✅ fase2_ai_agent_brain.js integrado y guardado con éxito.");
