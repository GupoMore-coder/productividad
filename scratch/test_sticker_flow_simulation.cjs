const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log("🧪 INICIANDO TEST RUNNER: FLUJO DE 3 BURBUJAS Y STICKERS 3D TRANSPARENTES");

// 1. Mock de Google Apps Script Environment
global.Logger = { log: (msg) => console.log("   [Logger]", msg) };
global.Utilities = { sleep: (ms) => console.log(`   [Sleep] ${ms}ms pause`) };
global.PropertiesService = {
  _store: {},
  getUserProperties: function() {
    return {
      getProperty: (k) => global.PropertiesService._store[k] || null,
      setProperty: (k, v) => { global.PropertiesService._store[k] = v; }
    };
  },
  getScriptProperties: function() {
    return this.getUserProperties();
  }
};

// Mock de configuración financiera
global.CONFIG_FINANZAS = {
  TELEFONO_ADMIN_DEFAULT: "573001234567"
};

// Cargar fase2_ai_agent_brain.js en global context
vm.runInThisContext(fs.readFileSync('fase2_ai_agent_brain.js', 'utf8'));

// PRUEBA 1: Verificar que los 24 personajes tienen stickerEstatico y stickerAnimado válidos
const personajesEsperados = [
  'SPAWN', 'GATO_CON_BOTAS', 'BATMAN', 'IRON_MAN', 'OPTIMUS_PRIME', 'SPIDERMAN',
  'THOR', 'HULK', 'WOLVERINE', 'DEADPOOL', 'LOKI', 'SUPERMAN',
  'FLASH', 'HELLBOY', 'DOCTOR_STRANGE', 'BLACK_WIDOW', 'CAPITAN_AMERICA', 'WONDER_WOMAN',
  'MORGAN_FREEMAN', 'ALEXA', 'ALEX', 'FEMENINO_DULCE', 'MASCULINO_CORDIAL', 'ROBOTICA'
];

console.log("\n--- PRUEBA 1: Verificación de Catálogo de Stickers 3D ---");
personajesEsperados.forEach(k => {
  const def = global.DICCIONARIO_MAESTRO_PERSONAJES_[k];
  assert(def, `Personaje ${k} debe existir en el diccionario`);
  assert(def.stickerEstatico && def.stickerEstatico.endsWith('.webp'), `${k} debe tener stickerEstatico .webp válido`);
  assert(def.stickerAnimado && def.stickerAnimado.endsWith('.webp'), `${k} debe tener stickerAnimado .webp válido`);
});
console.log(`✅ Aprobada: Los ${personajesEsperados.length} personajes cuentan con stickers estáticos y animados WebP válidos.`);

// PRUEBA 2: Alternancia entre Sticker Estático y Animado
console.log("\n--- PRUEBA 2: Alternancia Dinámica entre Pose Fija y Movimiento Sutil ---");
const defBatman = global.DICCIONARIO_MAESTRO_PERSONAJES_.BATMAN;
const telPrueba = "573001234567";

const st1 = global.resolverStickerPersonajeDinamico_(defBatman, telPrueba);
console.log(`Paso 1 (Invocación 1):`, st1.tipo, st1.url);

const st2 = global.resolverStickerPersonajeDinamico_(defBatman, telPrueba);
console.log(`Paso 2 (Invocación 2):`, st2.tipo, st2.url);

const st3 = global.resolverStickerPersonajeDinamico_(defBatman, telPrueba);
console.log(`Paso 3 (Invocación 3):`, st3.tipo, st3.url);

assert.notStrictEqual(st1.tipo, st2.tipo, "El tipo de sticker debe alternar entre estático y animado en invocaciones sucesivas");
assert.strictEqual(st1.tipo, st3.tipo, "La alternancia debe regresar al tipo inicial en ciclo continuo");
console.log("✅ Aprobada: La alternancia inteligente entre sticker fijo y animado funciona a la perfección.");

// PRUEBA 3: Simulación de Cambio de Personaje
console.log("\n--- PRUEBA 3: Despacho de Cambio de Personaje (Retorno estructurado) ---");
const intencion = {
  tipo: "cambio_nombre_y_voz",
  nombre: "Batman",
  perfil: "BATMAN",
  textoCompleto: "serás batman"
};
const respuestaCambio = global.ejecutarCambioVozOAsistente_(telPrueba, intencion, { rol: "SUPER_ADMIN", nombre: "Fernando" });

assert(respuestaCambio.urlSticker, "La respuesta debe incluir urlSticker");
assert(respuestaCambio.tipoSticker, "La respuesta debe indicar tipoSticker (estático o animado)");
assert(respuestaCambio.texto, "La respuesta debe incluir texto de confirmación");
assert(respuestaCambio.requiereAudio, "La respuesta debe requerir audio");
assert(respuestaCambio.textoVoz, "La respuesta debe incluir guion para Fish Audio");
console.log(`✅ Aprobada: Retorno estructurado de cambio de personaje verificado.`);
console.log(`   - Sticker: ${respuestaCambio.urlSticker} (${respuestaCambio.tipoSticker})`);
console.log(`   - Texto Confirmación: ${respuestaCambio.texto.substring(0, 60)}...`);
console.log(`   - Guion Voz: ${respuestaCambio.textoVoz.substring(0, 60)}...`);

// Cargar fase3_whatsapp_webhook.js en global context
vm.runInThisContext(fs.readFileSync('fase3_whatsapp_webhook.js', 'utf8'));

// PRUEBA 4: Simulación del Flujo de 3 Burbujas de fase3_whatsapp_webhook.js
console.log("\n--- PRUEBA 4: Flujo Estricto de 3 Burbujas en WhatsApp Webhook ---");
const burbujasDespachadas = [];

global.enviarStickerWhatsApp = function(tel, url) {
  burbujasDespachadas.push({ burbuja: 1, tipo: "sticker", url });
  console.log(`   [BURBUJA 1] 🎭 Sticker 3D enviado: ${url}`);
};

global.enviarMensajeWhatsApp = function(tel, texto) {
  burbujasDespachadas.push({ burbuja: 2, tipo: "texto", texto });
  console.log(`   [BURBUJA 2] 💬 Texto de confirmación enviado (${texto.length} chars)`);
};

global.despacharSoloAudioWhatsApp_ = function(tel, guion, perfil) {
  burbujasDespachadas.push({ burbuja: 3, tipo: "audio", perfil, guion });
  console.log(`   [BURBUJA 3] 🎙️ Nota de voz oficial Fish Audio despachada (${perfil})`);
};

// Simular llamada a despacharRespuestaWhatsApp_
global.despacharRespuestaWhatsApp_(telPrueba, respuestaCambio);

assert.strictEqual(burbujasDespachadas.length, 3, "Deben haberse despachado exactamente 3 burbujas");
assert.strictEqual(burbujasDespachadas[0].burbuja, 1, "La primera burbuja debe ser el Sticker");
assert.strictEqual(burbujasDespachadas[1].burbuja, 2, "La segunda burbuja debe ser el Texto");
assert.strictEqual(burbujasDespachadas[2].burbuja, 3, "La tercera burbuja debe ser la Nota de Voz");

console.log("\n🎉 TODAS LAS 4 PRUEBAS DE CERTIFICACIÓN FUERON APROBADAS AL 100%.");
