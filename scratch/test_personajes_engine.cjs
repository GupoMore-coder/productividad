// Test Runner para el Motor de Personajes, Onboarding y Seguridad
const fs = require('fs');

// Mock Google Apps Script environment
global.Logger = { log: console.log };
global.PropertiesService = {
  getScriptProperties: () => ({
    getProperty: (k) => null,
    setProperty: (k, v) => {}
  })
};
global.CacheService = {
  getScriptCache: () => ({
    get: (k) => null,
    put: (k, v, ttl) => {},
    remove: (k) => {}
  }),
  getUserCache: () => ({
    get: (k) => null,
    put: (k, v, ttl) => {},
    remove: (k) => {}
  })
};
global.SpreadsheetApp = {
  getActiveSpreadsheet: () => ({
    getSheetByName: (name) => null
  }),
  flush: () => {}
};
global.CONFIG_FINANZAS = {
  TELEFONO_ADMIN_DEFAULT: "+573008880001",
  FORMATO_MONEDA: "$#,##0"
};
global.CONFIG_IA = {
  URL_BASE_GEMINI: "https://generativelanguage.googleapis.com/v1beta/models/",
  MAX_OUTPUT_TOKENS: 8192
};
global.Session = {
  getScriptTimeZone: () => "America/Bogota"
};
global.Utilities = {
  formatDate: (d, tz, f) => d.toISOString().slice(0, 19).replace('T', ' ')
};

// Cargar fase1, fase2 y fase3
const code1 = fs.readFileSync('fase1_google_sheets_core.js', 'utf8');
const code2 = fs.readFileSync('fase2_ai_agent_brain.js', 'utf8');
const code3 = fs.readFileSync('fase3_whatsapp_webhook.js', 'utf8');

eval(code1);
eval(code3);
eval(code2);

console.log("=== INICIANDO VALIDACIÓN DE PRUEBAS 11, 13, 14, 18, 19 Y REQUERIMIENTOS ===");

// --------------------------------------------------------------------------
// PRUEBA 11: Inferencia de Perfiles de Voz y Consulta en Nombres Ambiguos
// --------------------------------------------------------------------------
const pFem = inferirPerfilVozPorNombre_("Sofía");
const pMasc = inferirPerfilVozPorNombre_("Ciro");
const pRob = inferirPerfilVozPorNombre_("Jarvis");
const pBat = inferirPerfilVozPorNombre_("Batman");
const pAmb = inferirPerfilVozPorNombre_("Alex");
const test11Ok = pFem === "FEMENINO_DULCE" && pMasc === "MASCULINO_CORDIAL" && pRob === "ROBOTICA" && pBat === "BATMAN" && pAmb === "AMBIGUO";
console.log(`Prueba 11: ${test11Ok ? "✅ APROBADA" : "❌ FALLIDA"} (pFem=${pFem}, pMasc=${pMasc}, pRob=${pRob}, pBat=${pBat}, pAmb=${pAmb})`);

// --------------------------------------------------------------------------
// PRUEBA 13: Construcción Acústica de TTS con Parámetros por Perfil
// --------------------------------------------------------------------------
const urlFem = construirAudioUrlSegunPerfil_("Hola Fernando", "FEMENINO_DULCE");
const urlMasc = construirAudioUrlSegunPerfil_("Hola Fernando", "MASCULINO_CORDIAL");
const urlRob = construirAudioUrlSegunPerfil_("Hola Fernando", "ROBOTICA");

const femOk = urlFem.includes("es-CO") && urlFem.includes("ttsspeed=1.05");
const mascOk = urlMasc.includes("es-MX") && urlMasc.includes("ttsspeed=0.92");
const robOk = urlRob.includes("es-ES") && urlRob.includes("ttsspeed=0.85");
const test13Ok = femOk && mascOk && robOk;
console.log(`Prueba 13: ${test13Ok ? "✅ APROBADA" : "❌ FALLIDA"} (femOk=${femOk}, mascOk=${mascOk}, robOk=${robOk})`);

// --------------------------------------------------------------------------
// PRUEBA 14: Catálogo de Superhéroes y Modulación de Audio Específica
// --------------------------------------------------------------------------
const cat = detectarIntencionCambioNombreVoz_("¿Cuáles voces de superhéroes tienes?");
const heroBat = detectarIntencionCambioNombreVoz_("3 Batman");
const urlBat = construirAudioUrlSegunPerfil_("Soy la noche", "BATMAN");

const catOk = cat && cat.tipo === "catalogo_superheroes";
const heroOk = heroBat && heroBat.perfil === "BATMAN";
const urlBatOk = urlBat.includes("es-ES") && urlBat.includes("ttsspeed=0.78");
const test14Ok = catOk && heroOk && urlBatOk;
console.log(`Prueba 14: ${test14Ok ? "✅ APROBADA" : "❌ FALLIDA"} (catOk=${catOk}, heroOk=${heroOk}, urlBatOk=${urlBatOk})`);

// --------------------------------------------------------------------------
// PRUEBA 18: Cruce Analítico Macro-Micro y Respuesta del Asesor Pro
// --------------------------------------------------------------------------
const permMock = { nombre: "Fernando", aliasAsistente: "Bruce Wayne", perfilVoz: "BATMAN", rol: "SUPER_ADMIN" };
const compromisosMock = [{ concepto: "Proveedor Tintas", valor: 1200000, fechaVencimiento: "2026-09-20" }];
const resAsesor = ejecutarAsesorFinancieroPro_("+573008880001", "¿Qué me recomiendas hacer con mis compromisos y el dólar?", { tipo: "asesoria_financiera_pro", esMercado: true, esAsesoria: true }, permMock, compromisosMock, null);

const texto = resAsesor ? resAsesor.texto : "";
const tieneBruce = texto.includes("Bruce Wayne");
const tieneCompromisos = texto.includes("compromisos");
const tieneVolatilidad = texto.includes("volatilidad");
const test18Ok = tieneBruce && tieneCompromisos && tieneVolatilidad;
console.log(`Prueba 18: ${test18Ok ? "✅ APROBADA" : "❌ FALLIDA"} (bruce=${tieneBruce}, compromisos=${tieneCompromisos}, volatilidad=${tieneVolatilidad})`);

// --------------------------------------------------------------------------
// PRUEBA 19: Integración del Gato con Botas y Motor Desatendido de Personajes
// --------------------------------------------------------------------------
const pGato = inferirPerfilVozPorNombre_("El Gato con Botas");
const intGato = detectarIntencionCambioNombreVoz_("Quiero la voz del Gato con Botas");
const intNoBloqueado = detectarIntencionCambioNombreVoz_("Ponme la voz del Gato con Botas");
const gatoInfo = obtenerInfoPerfilVoz_("GATO_CON_BOTAS");
const idFishGato = VOCES_CATALOGO_FISH_AUDIO_.GATO_CON_BOTAS;

const gatoOk = pGato === "GATO_CON_BOTAS" &&
  intGato && intGato.perfil === "GATO_CON_BOTAS" &&
  intNoBloqueado && intNoBloqueado.tipo !== "voz_prohibida" &&
  gatoInfo && gatoInfo.desc.includes("Gato con Botas") &&
  idFishGato === "464ca191f6db4af6951037893e640ee4";

const intCrear = detectarIntencionCrearPersonaje_("Crear personaje Gandalf ID 1234567890abcdef1234567890abcdef");
const crearOk = intCrear && intCrear.nombre.toLowerCase().includes("gandalf") && intCrear.fishAudioId === "1234567890abcdef1234567890abcdef";

const confVoice = verificarConflictoPersonaje_(null, "Nuevo Personaje", "464ca191f6db4af6951037893e640ee4");
const confNombre = verificarConflictoPersonaje_(null, "El Gato con Bota", "abcdef0123456789abcdef0123456789");
const confLimpio = verificarConflictoPersonaje_(null, "Legolas Hojaverde", "abcdef0123456789abcdef0123456789");

const confOk = confVoice.conflicto === true && confVoice.tipo === "VOICE_ID_DUPLICADO" &&
  confNombre.conflicto === true && confNombre.tipo === "NOMBRE_SIMILAR" &&
  confLimpio.conflicto === false;

const test19Ok = gatoOk && crearOk && confOk;
console.log(`Prueba 19: ${test19Ok ? "✅ APROBADA" : "❌ FALLIDA"} (gatoOk=${gatoOk}, crearOk=${crearOk}, confOk=${confOk})`);

// --------------------------------------------------------------------------
// REQUERIMIENTO 2: Catálogo Canónico Completo de 20 Personajes
// --------------------------------------------------------------------------
const canonicos = obtenerCatalogoCanonico20Personajes_();
const req2Ok = Array.isArray(canonicos) && canonicos.length === 20;
console.log(`\nRequerimiento 2: ${req2Ok ? "✅ APROBADA" : "❌ FALLIDA"} (${canonicos.length} personajes canónicos registrados)`);

// --------------------------------------------------------------------------
// REQUERIMIENTO 3: Flujo de Inmersión, Propuesta Periódica y Navegación Guiada
// --------------------------------------------------------------------------
const intCat1 = detectarIntencionCambioNombreVoz_("1");
const intCat2 = detectarIntencionCambioNombreVoz_("universo 2");
const intCat3 = detectarIntencionCambioNombreVoz_("antiheroes");
const intCat4 = detectarIntencionCambioNombreVoz_("leyendas");
const intCont = detectarIntencionCambioNombreVoz_("continuar");

const det1 = generarDetalleCategoriaPersonajes_(1);
const det2 = generarDetalleCategoriaPersonajes_(2);
const det3 = generarDetalleCategoriaPersonajes_(3);
const det4 = generarDetalleCategoriaPersonajes_(4);

const req3Ok = intCat1.tipo === "catalogo_categoria" && intCat1.categoria === 1 &&
  intCat2.tipo === "catalogo_categoria" && intCat2.categoria === 2 &&
  intCat3.tipo === "catalogo_categoria" && intCat3.categoria === 3 &&
  intCat4.tipo === "catalogo_categoria" && intCat4.categoria === 4 &&
  intCont.tipo === "confirmar_continuidad_personaje" &&
  det1.includes("Batman") && det2.includes("Iron Man") && det3.includes("Deadpool") && det4.includes("El Gato con Botas");

console.log(`Requerimiento 3: ${req3Ok ? "✅ APROBADA" : "❌ FALLIDA"} (Inmersión, Universos y Continuidad certificados)`);

// --------------------------------------------------------------------------
// PRUEBA 20: Detección Auditiva Avanzada y Despacho de Audio en Cambio/Demostración
// --------------------------------------------------------------------------
const audioReq1 = esSolicitudRespuestaAudio_("Quiero escucharte");
const audioReq2 = esSolicitudRespuestaAudio_("Quiero oírte");
const audioReq3 = esSolicitudRespuestaAudio_("Háblame");
const audioReq4 = esSolicitudRespuestaAudio_("Cómo suena tu voz");

const demoDetect1 = detectarSolicitudDemostracionVoz_("Quiero escucharte");
const demoDetect2 = detectarSolicitudDemostracionVoz_("Quiero oírte");
const demoDetect3 = detectarSolicitudDemostracionVoz_("Háblame");
const demoDetect4 = detectarSolicitudDemostracionVoz_("Gato con botas háblame");
const demoDetectFalso = detectarSolicitudDemostracionVoz_("Quiero escuchar el saldo de Bancolombia");

const permMock20 = { nombre: "Fernando", perfilVoz: "GATO_CON_BOTAS", rol: "SUPER_ADMIN" };
const resDemo = ejecutarDemostracionVoz_("573008880001", permMock20);
const resCambio = ejecutarCambioNombreVoz_("573008880001", { tipo: "cambio_solo_voz", perfil: "GATO_CON_BOTAS" }, permMock20);

const demoOk = resDemo && resDemo.requiereAudio === true && resDemo.perfilVoz === "GATO_CON_BOTAS" &&
  resDemo.textoVoz.includes("honor") && resDemo.textoVoz.includes("Gato con Botas") && resDemo.texto.includes("🐱👢");

const cambioAudioOk = resCambio && resCambio.requiereAudio === true && resCambio.perfilVoz === "GATO_CON_BOTAS" &&
  resCambio.textoVoz.includes("honor") && resCambio.textoVoz.includes("espada") && resCambio.texto.includes("🐱👢");

const test20Ok = audioReq1 && audioReq2 && audioReq3 && audioReq4 &&
  demoDetect1 && demoDetect2 && demoDetect3 && demoDetect4 && !demoDetectFalso &&
  demoOk && cambioAudioOk;

console.log(`Prueba 20: ${test20Ok ? "✅ APROBADA" : "❌ FALLIDA"} (audioReq=${audioReq1}, demoDetect=${demoDetect1}, demoAudio=${resDemo.requiereAudio}, cambioAudio=${resCambio.requiereAudio})`);

const todosOk = test11Ok && test13Ok && test14Ok && test18Ok && test19Ok && req2Ok && req3Ok && test20Ok;
console.log(`\n======================================================`);
console.log(todosOk ? "🚀 ¡TODO EL SISTEMA ESTÁ 100% OPERATIVO Y CERTIFICADO!" : "⚠️ DETECTADAS FALLAS");
console.log(`======================================================`);
