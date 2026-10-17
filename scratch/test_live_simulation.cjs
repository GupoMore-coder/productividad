// Mock minimal GAS runtime environment
global.Logger = { log: console.log };
global.Session = { getScriptTimeZone: () => "America/Bogota" };
global.Utilities = {
  formatDate: (d, tz, f) => "2026-10-15",
  sleep: (ms) => {}
};
global.actualizarPerfilAsistenteUsuario = (tel, alias, perfil, config) => {
  console.log(`[DB MOCK] Actualizado: Tel=${tel}, Alias=${alias}, Perfil=${perfil}`);
};

// Read and evaluate relevant functions from fase2 and fase3
const fs = require("fs");
const fase2 = fs.readFileSync("fase2_ai_agent_brain.js", "utf8");
const fase3 = fs.readFileSync("fase3_whatsapp_webhook.js", "utf8");

// Eval fase2 and fase3 in current context
eval(fase2);
eval(fase3);

console.log("=== INICIANDO SIMULACIÓN DE CASO DE USUARIO ===");

const mensajeUsuario = "de ahora en adelante serás SPAWN";
console.log("Mensaje entrante:", mensajeUsuario);

// 1. Detección de intención
const intencion = detectarIntencionCambioNombreVoz_(mensajeUsuario);
console.log("\n1. Intención detectada:", intencion);
if (intencion.tipo !== "cambio_nombre_y_voz" || intencion.nombre.toUpperCase() !== "SPAWN") {
  throw new Error("Fallo en detección de intención para Spawn: " + JSON.stringify(intencion));
}

// 2. Ejecución del cambio de personaje
const permUsuario = {
  nombre: "Fernando",
  aliasAsistente: "El Gato con Botas",
  perfilVoz: "GATO_CON_BOTAS",
  rol: "SUPER_ADMIN"
};
const respuesta = ejecutarCambioNombreVoz_("573104547965", intencion, permUsuario);
console.log("\n2. Respuesta generada por el agente:");
console.log("- Tipo:", respuesta.tipo);
console.log("- Perfil de Voz:", respuesta.perfilVoz);
console.log("- URL Imagen:", respuesta.urlImagen);
console.log("- Caption Imagen:", respuesta.captionImagen);
console.log("- Texto Voz (Guion para Fish Audio):\n ", respuesta.textoVoz);
console.log("- Texto Card WhatsApp:\n" + respuesta.texto);

// Validaciones estrictas
if (respuesta.perfilVoz !== "SPAWN") throw new Error("Perfil de voz incorrecto: " + respuesta.perfilVoz);
if (!respuesta.texto.includes("🌑")) throw new Error("Emoji de Spawn ausente");
if (!respuesta.texto.includes("⛓️")) throw new Error("Icono de acción de Spawn ausente");
if (respuesta.texto.includes("🗡️")) throw new Error("Icono de espada del Gato con Botas presente erróneamente");
if (!respuesta.urlImagen || !respuesta.urlImagen.startsWith("https://")) throw new Error("Falta URL de imagen");

// 3. Formateo de tarjeta visual para un movimiento financiero bajo Spawn
const tarjetaVisual = formatearTarjetaVisualAcompanante_("Movimiento registrado con éxito:\n• Tipo: Egreso\n• Monto: $85.000\n• Concepto: Almuerzo empresarial", "SPAWN", "Fernando");
console.log("\n3. Tarjeta Visual generada para Spawn tras registrar gasto:");
console.log(tarjetaVisual);

if (!tarjetaVisual.includes("🌑 *SPAWN* | _Centinela Espectral de las Sombras_")) {
  throw new Error("Banner de Spawn incorrecto o ausente");
}
if (tarjetaVisual.includes("GATO CON BOTAS")) {
  throw new Error("El Gato con Botas se filtró en la tarjeta de Spawn");
}
if (tarjetaVisual.includes("sombrero y mi espada")) {
  throw new Error("Frase del Gato con Botas se filtró en la tarjeta de Spawn");
}

// 4. Probar 6 personajes más para verificar aislamiento total
const personajesPrueba = ["THOR", "HULK", "BATMAN", "IRON_MAN", "DEADPOOL", "MORGAN_FREEMAN"];
console.log("\n4. Verificando aislamiento para otros personajes:");
personajesPrueba.forEach(p => {
  const card = formatearTarjetaVisualAcompanante_("Consulta de saldo: $12.450.000", p, "Fernando");
  const def = obtenerDefinicionPersonajeCompleta_(p);
  console.log(`- ${p}: ${def.emoji} ${def.alias} | ${def.titulo} -> Icono: ${def.iconoAccion} | Foto OK`);
  if (!card.includes(def.alias.toUpperCase())) throw new Error(`Tarjeta no contiene alias de ${p}`);
});

console.log("\n>>> SIMULACIÓN COMPLETA Y APROBADA AL 100% <<<");
