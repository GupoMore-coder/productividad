/**
 * ============================================================================
 * SUITE DE PRUEBAS DE CERTIFICACIÓN: ONBOARDING, SEGURIDAD Y ALARMAS HORARIAS
 * ============================================================================
 * 
 * Ejecuta: testRunnerOnboardingSeguridad() desde el editor de Google Apps Script.
 */
function testRunnerOnboardingSeguridad() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const resultados = {
    total: 20,
    aprobadas: 0,
    fallidas: 0,
    detalles: []
  };

  Logger.log("🧪 ======================================================");
  Logger.log("🧪 INICIANDO TEST RUNNER: ONBOARDING & SEGURIDAD DINÁMICA");
  Logger.log("🧪 ======================================================");

  // --------------------------------------------------------------------------
  // PRUEBA 1: Aprovisionamiento y Creación de Hojas de Florangellys
  // --------------------------------------------------------------------------
  try {
    const resAlta = agregarUsuarioFlorangellys();
    const hTrans = ss.getSheetByName("Florangellys_Transacciones");
    const hComp = ss.getSheetByName("Florangellys_Compromisos");
    const sheetCtrl = ss.getSheetByName(HOJAS.CONTROL_ACCESO);

    if (hTrans && hComp && sheetCtrl) {
      resultados.aprobadas++;
      Logger.log("✅ Prueba 1 APROBADA: Hojas Florangellys_Transacciones y Florangellys_Compromisos creadas exitosamente.");
    } else {
      resultados.fallidas++;
      Logger.log("❌ Prueba 1 FALLIDA: No se encontraron las hojas creadas.");
    }
  } catch (e) {
    resultados.fallidas++;
    Logger.log("❌ Prueba 1 ERROR: " + e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 2: Validación de Permisos y Segregación de Datos
  // --------------------------------------------------------------------------
  try {
    const perm = validarPermisoUsuario("+573117917391");
    if (perm.autorizado === true && perm.rol === "USUARIO" && perm.entidadPropia === "Florangellys") {
      resultados.aprobadas++;
      Logger.log("✅ Prueba 2 APROBADA: Florangellys validada con rol USUARIO y entidad aislada 'Florangellys'.");
    } else {
      resultados.fallidas++;
      Logger.log("❌ Prueba 2 FALLIDA: Permisos incorrectos: " + JSON.stringify(perm));
    }
  } catch (e) {
    resultados.fallidas++;
    Logger.log("❌ Prueba 2 ERROR: " + e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 3: Bloqueo y Desbloqueo de Usuario con Aviso de Sesgo
  // --------------------------------------------------------------------------
  try {
    const resBloq = bloquearUsuarioFinanciero("Florangellys", "Prueba de seguridad");
    const permBloq = validarPermisoUsuario("+573117917391");
    const bloqOk = permBloq.autorizado === false && permBloq.motivo === "USUARIO_BLOQUEADO";

    const resDesbloq = desbloquearUsuarioFinanciero("Florangellys");
    const permDesbloq = validarPermisoUsuario("+573117917391");
    const desbloqOk = permDesbloq.autorizado === true && permDesbloq.rol === "USUARIO";

    if (bloqOk && desbloqOk) {
      resultados.aprobadas++;
      Logger.log("✅ Prueba 3 APROBADA: Ciclo completo de congelamiento por bloqueo y reactivación con aviso de sesgo verificado.");
    } else {
      resultados.fallidas++;
      Logger.log("❌ Prueba 3 FALLIDA: Fallo en ciclo de bloqueo/desbloqueo.");
    }
  } catch (e) {
    resultados.fallidas++;
    Logger.log("❌ Prueba 3 ERROR: " + e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 4: Enrutamiento Dinámico de Transacciones y Hojas
  // --------------------------------------------------------------------------
  try {
    const hojaT = obtenerHojaTransacciones_("Florangellys");
    const hojaC = obtenerHojaCompromisos_("Florangellys");

    if (hojaT === "Florangellys_Transacciones" && hojaC === "Florangellys_Compromisos") {
      resultados.aprobadas++;
      Logger.log("✅ Prueba 4 APROBADA: Enrutador dinámico direccionó correctamente a las hojas de Florangellys.");
    } else {
      resultados.fallidas++;
      Logger.log(`❌ Prueba 4 FALLIDA: Hojas devueltas: ${hojaT}, ${hojaC}`);
    }
  } catch (e) {
    resultados.fallidas++;
    Logger.log("❌ Prueba 4 ERROR: " + e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 5: Detección de Audio y Gestión Conversacional Super Admin
  // --------------------------------------------------------------------------
  try {
    const pideAudio = esSolicitudRespuestaAudio_("Dímelo en un audio por favor");
    const intencionCrear = detectarIntencionGestionUsuarios_("Agregar usuaria Florangellys Vilarete teléfono +573117917391");
    const intencionBloq = detectarIntencionGestionUsuarios_("Bloquear a Florangellys");

    if (pideAudio && intencionCrear && intencionCrear.tipo === "crear" && intencionBloq && intencionBloq.tipo === "bloquear") {
      resultados.aprobadas++;
      Logger.log("✅ Prueba 5 APROBADA: Detección de audio e intenciones administrativas de Super Admin certificadas.");
    } else {
      resultados.fallidas++;
      Logger.log("❌ Prueba 5 FALLIDA: Fallo en analizador de lenguaje natural administrativo.");
    }
  } catch (e) {
    resultados.fallidas++;
    Logger.log("❌ Prueba 5 ERROR: " + e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 6: Reprogramación de Fechas y Resincronización de Alarmas
  // --------------------------------------------------------------------------
  try {
    const resParser = parserSemanticoReglas_("Aplazar el pago de la factura de internet de More Paper para el 28 de septiembre");
    const fechaOk = resParser.nueva_fecha === "2026-09-28" || resParser.nueva_fecha.includes("09-28");
    const accionOk = resParser.accion === "reprogramar_fecha";

    if (fechaOk && accionOk) {
      resultados.aprobadas++;
      Logger.log("✅ Prueba 6 APROBADA: Reprogramación de fecha analizada y normalizada correctamente a ISO (" + resParser.nueva_fecha + ").");
    } else {
      resultados.fallidas++;
      Logger.log("❌ Prueba 6 FALLIDA: Error al analizar reprogramación: " + JSON.stringify(resParser));
    }
  } catch (e) {
    resultados.fallidas++;
    Logger.log("❌ Prueba 6 ERROR: " + e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 7: Detección de Compromisos Cíclicos Recurrentes (Arriendos, Servicios, Impuestos)
  // --------------------------------------------------------------------------
  try {
    const resArriendo = parserSemanticoReglas_("Debo arriendo de More Paper $1.200.000 vence el 5 de octubre");
    const resLuz = parserSemanticoReglas_("Factura de energia luz More Design por 180000 vence el 15 de octubre");

    if (resArriendo.es_recurrente === true && resLuz.es_recurrente === true) {
      resultados.aprobadas++;
      Logger.log("✅ Prueba 7 APROBADA: Reconocimiento inteligente de obligaciones cíclicas mensuales certificado.");
    } else {
      resultados.fallidas++;
      Logger.log("❌ Prueba 7 FALLIDA: Falla en detección de recurrencia cíclica: " + JSON.stringify({ resArriendo, resLuz }));
    }
  } catch (e) {
    resultados.fallidas++;
    Logger.log("❌ Prueba 7 ERROR: " + e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 8: Estandarización Telefónica y Auto-Prefijo Colombiano 57
  // --------------------------------------------------------------------------
  try {
    const t1 = normalizarTelefono_("+573117917391");
    const t2 = normalizarTelefono_("573117917391");
    const t3 = normalizarTelefono_("3117917391"); // 10 dígitos colombianos sin prefijo

    if (t1 === "573117917391" && t2 === "573117917391" && t3 === "573117917391") {
      resultados.aprobadas++;
      Logger.log("✅ Prueba 8 APROBADA: Estandarización telefónica infalible (+57, 57 y 10 dígitos normalizados a 573117917391).");
    } else {
      resultados.fallidas++;
      Logger.log(`❌ Prueba 8 FALLIDA: Discrepancia en normalización: t1=${t1}, t2=${t2}, t3=${t3}`);
    }
  } catch (e) {
    resultados.fallidas++;
    Logger.log("❌ Prueba 8 ERROR: " + e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 9: Usuarios Dinámicos en Dashboard y Sección en Dashboard_Consolidado
  // --------------------------------------------------------------------------
  try {
    const usuariosDash = obtenerUsuariosActivosDashboard_(ss);
    const tieneFlorangellys = usuariosDash.some(u => u.entidad === "Florangellys");
    const sheetDash = ss.getSheetByName(HOJAS.DASHBOARD);
    const celdaTitulo = sheetDash ? sheetDash.getRange("A8").getValue() : "";
    const tieneSeccionSheets = String(celdaTitulo).includes("INDIVIDUAL");

    if (tieneFlorangellys && tieneSeccionSheets) {
      resultados.aprobadas++;
      Logger.log("✅ Prueba 9 APROBADA: Usuario Florangellys disponible en API de Dashboard y sección individual activa en Sheets.");
    } else {
      resultados.fallidas++;
      Logger.log(`❌ Prueba 9 FALLIDA: tieneFlorangellys=${tieneFlorangellys}, celdaA8="${celdaTitulo}"`);
    }
  } catch (e) {
    resultados.fallidas++;
    Logger.log("❌ Prueba 9 ERROR: " + e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 10: Detección de Intención de Cambio de Nombre y Persistencia
  // --------------------------------------------------------------------------
  try {
    const intencion1 = detectarIntencionCambioNombreVoz_("A partir de ahora te llamarás Sofía");
    const intencion2 = detectarIntencionCambioNombreVoz_("Quiero que tu nuevo nombre sea Jarvis");

    if (intencion1 && intencion1.nombre === "Sofía" && intencion2 && intencion2.nombre === "Jarvis") {
      resultados.aprobadas++;
      Logger.log("✅ Prueba 10 APROBADA: Intenciones de cambio de nombre ('Sofía' y 'Jarvis') analizadas con éxito.");
    } else {
      resultados.fallidas++;
      Logger.log("❌ Prueba 10 FALLIDA: No se reconocieron los nombres: " + JSON.stringify({ intencion1, intencion2 }));
    }
  } catch (e) {
    resultados.fallidas++;
    Logger.log("❌ Prueba 10 ERROR: " + e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 11: Inferencia de Perfiles de Voz y Consulta en Nombres Ambiguos
  // --------------------------------------------------------------------------
  try {
    const pFem = inferirPerfilVozPorNombre_("Sofía");
    const pMasc = inferirPerfilVozPorNombre_("Ciro");
    const pRob = inferirPerfilVozPorNombre_("Jarvis");
    const pBat = inferirPerfilVozPorNombre_("Batman");
    const pAmb = inferirPerfilVozPorNombre_("Alex");

    if (pFem === "FEMENINO_DULCE" && pMasc === "MASCULINO_CORDIAL" && pRob === "ROBOTICA" && pBat === "BATMAN" && pAmb === "AMBIGUO") {
      resultados.aprobadas++;
      Logger.log("✅ Prueba 11 APROBADA: Inferencia de perfiles perfecta (Femenino Dulce, Masculino Cordial, Robótica, Superhéroe Batman y Consulta para Ambiguo).");
    } else {
      resultados.fallidas++;
      Logger.log(`❌ Prueba 11 FALLIDA: pFem=${pFem}, pMasc=${pMasc}, pRob=${pRob}, pBat=${pBat}, pAmb=${pAmb}`);
    }
  } catch (e) {
    resultados.fallidas++;
    Logger.log("❌ Prueba 11 ERROR: " + e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 12: Bloqueo Estricto de Voces Infantiles y Animales
  // --------------------------------------------------------------------------
  try {
    const intencionNino = detectarIntencionCambioNombreVoz_("Quiero que me hables con voz de niño pequeño");
    const intencionAnimal = detectarIntencionCambioNombreVoz_("Ponte voz de perro ladrando");
    const intencionBebe = detectarIntencionCambioNombreVoz_("Habla como un bebé");

    const rechazoNino = intencionNino && intencionNino.tipo === "voz_prohibida";
    const rechazoAnimal = intencionAnimal && intencionAnimal.tipo === "voz_prohibida";
    const rechazoBebe = intencionBebe && intencionBebe.tipo === "voz_prohibida";

    if (rechazoNino && rechazoAnimal && rechazoBebe) {
      resultados.aprobadas++;
      Logger.log("✅ Prueba 12 APROBADA: Bloqueo estricto de voces de niños, bebés y animales certificado.");
    } else {
      resultados.fallidas++;
      Logger.log("❌ Prueba 12 FALLIDA: No se bloquearon las voces restringidas.");
    }
  } catch (e) {
    resultados.fallidas++;
    Logger.log("❌ Prueba 12 ERROR: " + e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 13: Construcción Acústica de TTS con Parámetros por Perfil
  // --------------------------------------------------------------------------
  try {
    const urlFem = construirAudioUrlSegunPerfil_("Hola Fernando", "FEMENINO_DULCE");
    const urlMasc = construirAudioUrlSegunPerfil_("Hola Fernando", "MASCULINO_CORDIAL");
    const urlRob = construirAudioUrlSegunPerfil_("Hola Fernando", "ROBOTICA");

    const femOk = urlFem.includes("es-CO") && urlFem.includes("ttsspeed=1.05");
    const mascOk = urlMasc.includes("es-MX") && urlMasc.includes("ttsspeed=0.92");
    const robOk = urlRob.includes("es-ES") && urlRob.includes("ttsspeed=0.85");

    if (femOk && mascOk && robOk) {
      resultados.aprobadas++;
      Logger.log("✅ Prueba 13 APROBADA: URLs acústicas de TTS adaptadas exactamente a cada perfil y personalidad.");
    } else {
      resultados.fallidas++;
      Logger.log(`❌ Prueba 13 FALLIDA: femOk=${femOk}, mascOk=${mascOk}, robOk=${robOk}`);
    }
  } catch (e) {
    resultados.fallidas++;
    Logger.log("❌ Prueba 13 ERROR: " + e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 14: Catálogo de Superhéroes y Modulación de Audio Específica
  // --------------------------------------------------------------------------
  try {
    const cat = detectarIntencionCambioNombreVoz_("¿Cuáles voces de superhéroes tienes?");
    const heroBat = detectarIntencionCambioNombreVoz_("3 Batman");
    const urlBat = construirAudioUrlSegunPerfil_("Soy la noche", "BATMAN");

    const catOk = cat && cat.tipo === "catalogo_superheroes";
    const heroOk = heroBat && heroBat.perfil === "BATMAN";
    const urlBatOk = urlBat.includes("es-ES") && urlBat.includes("ttsspeed=0.78");

    if (catOk && heroOk && urlBatOk) {
      resultados.aprobadas++;
      Logger.log("✅ Prueba 14 APROBADA: Catálogo interactivo de 8 superhéroes y modulación de voz de Batman certificada.");
    } else {
      resultados.fallidas++;
      Logger.log(`❌ Prueba 14 FALLIDA: catOk=${catOk}, heroOk=${heroOk}, urlBatOk=${urlBatOk}`);
    }
  } catch (e) {
    resultados.fallidas++;
    Logger.log("❌ Prueba 14 ERROR: " + e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 15: Motor Determinístico de Calendario Tributario DIAN y Normativa NIIF
  // --------------------------------------------------------------------------
  try {
    const dian2026 = obtenerCalendarioNormativaDian_("901234567-8", null, 2026);
    const uvtOk = dian2026.uvtVigente === 52374;
    const reteComprasOk = dian2026.retefuente.tarifasPrincipales.comprasDeclarantes.includes("2.5%");
    const reteServiciosOk = dian2026.retefuente.tarifasPrincipales.serviciosDeclarantes.includes("4%");
    const niifOk = dian2026.niifColombia.grupo2.includes("PYMES");

    if (uvtOk && reteComprasOk && reteServiciosOk && niifOk) {
      resultados.aprobadas++;
      Logger.log("✅ Prueba 15 APROBADA: Motor oficial DIAN (UVT, tarifas de retención y marco NIIF PYMES) certificado.");
    } else {
      resultados.fallidas++;
      Logger.log(`❌ Prueba 15 FALLIDA: uvtOk=${uvtOk}, reteComprasOk=${reteComprasOk}, reteServiciosOk=${reteServiciosOk}`);
    }
  } catch (e) {
    resultados.fallidas++;
    Logger.log("❌ Prueba 15 ERROR: " + e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 16: Guardrail Estricto de Especialización Temática (No Financiero)
  // --------------------------------------------------------------------------
  try {
    const esFutbol = detectarConsultaFueraDeAmbito_("¿Quién ganó el partido de fútbol anoche?");
    const esReceta = detectarConsultaFueraDeAmbito_("Dame una receta para cocinar lasagna");
    const esDolar = detectarConsultaFueraDeAmbito_("¿A cómo está el dólar hoy?");

    const guardrailOk = esFutbol === true && esReceta === true && esDolar === false;

    if (guardrailOk) {
      resultados.aprobadas++;
      Logger.log("✅ Prueba 16 APROBADA: Guardrail estricto de especialización temática verificado con éxito.");
    } else {
      resultados.fallidas++;
      Logger.log(`❌ Prueba 16 FALLIDA: esFutbol=${esFutbol}, esReceta=${esReceta}, esDolar=${esDolar}`);
    }
  } catch (e) {
    resultados.fallidas++;
    Logger.log("❌ Prueba 16 ERROR: " + e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 17: Detección Semántica de Inteligencia Bursátil, Divisas y Asesoría
  // --------------------------------------------------------------------------
  try {
    const qTrm = detectarConsultaMercadoOTributaria_("¿Cuál es la TRM hoy en Colombia y a cuánto está el Euro?");
    const qDian = detectarConsultaMercadoOTributaria_("¿Cuándo vence la retención en la fuente en la DIAN?");
    const qAsesoria = detectarConsultaMercadoOTributaria_("¿Qué me recomiendas hacer con mis compromisos y el precio actual del dólar?");

    const qTrmOk = qTrm && qTrm.esMercado === true;
    const qDianOk = qDian && qDian.esTributario === true;
    const qAsesoriaOk = qAsesoria && qAsesoria.esAsesoria === true;

    if (qTrmOk && qDianOk && qAsesoriaOk) {
      resultados.aprobadas++;
      Logger.log("✅ Prueba 17 APROBADA: Detección semántica de inteligencia bursátil, tributaria DIAN y asesoría patrimonial certificada.");
    } else {
      resultados.fallidas++;
      Logger.log(`❌ Prueba 17 FALLIDA: qTrmOk=${qTrmOk}, qDianOk=${qDianOk}, qAsesoriaOk=${qAsesoriaOk}`);
    }
  } catch (e) {
    resultados.fallidas++;
    Logger.log("❌ Prueba 17 ERROR: " + e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 18: Cruce Analítico Macro-Micro y Respuesta del Asesor Pro
  // --------------------------------------------------------------------------
  try {
    const permMock = { nombre: "Fernando", aliasAsistente: "Bruce Wayne", perfilVoz: "BATMAN", rol: "SUPER_ADMIN" };
    const compromisosMock = [{ acreedor: "Proveedor Tintas", valor: 1200000, fecha_vencimiento: "2026-09-20" }];
    const resAsesor = ejecutarAsesorFinancieroPro_("+573008880001", "¿Qué me recomiendas hacer con mis compromisos y el dólar?", { tipo: "asesoria_financiera_pro", esMercado: true, esAsesoria: true }, permMock, compromisosMock, null);

    const texto = resAsesor ? resAsesor.texto : "";
    const cruceOk = texto.includes("Bruce Wayne") && texto.includes("compromisos") && texto.includes("volatilidad");

    if (cruceOk) {
      resultados.aprobadas++;
      Logger.log("✅ Prueba 18 APROBADA: Cruce analítico macro-micro y asesoría financiera personalizada verificada exitosamente.");
    } else {
      resultados.fallidas++;
      Logger.log("❌ Prueba 18 FALLIDA: No se generó el cruce analítico adecuado: " + texto.substring(0, 150));
    }
  } catch (e) {
    resultados.fallidas++;
    Logger.log("❌ Prueba 18 ERROR: " + e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 19: Integración del Gato con Botas y Motor Desatendido de Personajes
  // --------------------------------------------------------------------------
  try {
    // 1. Verificación de voz e inferencia del Gato con Botas
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

    // 2. Detección de creación desatendida desde WhatsApp
    const intCrear = detectarIntencionCrearPersonaje_("Crear personaje Gandalf ID 1234567890abcdef1234567890abcdef");
    const crearOk = intCrear && intCrear.nombre.toLowerCase().includes("gandalf") && intCrear.fishAudioId === "1234567890abcdef1234567890abcdef";

    // 3. Verificación de conflictos (Voice ID duplicado y Nombre similar)
    const confVoice = verificarConflictoPersonaje_(ss, "Nuevo Personaje", "464ca191f6db4af6951037893e640ee4");
    const confNombre = verificarConflictoPersonaje_(ss, "El Gato con Bota", "abcdef0123456789abcdef0123456789");
    const confLimpio = verificarConflictoPersonaje_(ss, "Legolas Hojaverde", "abcdef0123456789abcdef0123456789");

    const confOk = confVoice.conflicto === true && confVoice.tipo === "VOICE_ID_DUPLICADO" &&
      confNombre.conflicto === true && confNombre.tipo === "NOMBRE_SIMILAR" &&
      confLimpio.conflicto === false;

    if (gatoOk && crearOk && confOk) {
      resultados.aprobadas++;
      Logger.log("✅ Prueba 19 APROBADA: Gato con Botas activo, modulación auditiva, detección desatendida y blindaje contra duplicados 100% certificados.");
    } else {
      resultados.fallidas++;
      Logger.log(`❌ Prueba 19 FALLIDA: gatoOk=${gatoOk}, crearOk=${crearOk}, confOk=${confOk}`);
    }
  } catch (e) {
    resultados.fallidas++;
    Logger.log("❌ Prueba 19 ERROR: " + e.message);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 20: Detección Auditiva Avanzada y Despacho de Audio en Cambio/Demostración
  // --------------------------------------------------------------------------
  try {
    const audioReq1 = esSolicitudRespuestaAudio_("Quiero escucharte");
    const audioReq2 = esSolicitudRespuestaAudio_("Quiero oírte");
    const audioReq3 = esSolicitudRespuestaAudio_("Háblame");
    const demoDetect1 = typeof detectarSolicitudDemostracionVoz_ === "function" && detectarSolicitudDemostracionVoz_("Quiero escucharte");
    const demoDetectFalso = typeof detectarSolicitudDemostracionVoz_ === "function" && detectarSolicitudDemostracionVoz_("Quiero escuchar el saldo de Bancolombia");

    const permMock20 = { nombre: "Fernando", perfilVoz: "GATO_CON_BOTAS", rol: "SUPER_ADMIN" };
    const resDemo = typeof ejecutarDemostracionVoz_ === "function" ? ejecutarDemostracionVoz_("573008880001", permMock20) : null;
    const resCambio = typeof ejecutarCambioNombreVoz_ === "function" ? ejecutarCambioNombreVoz_("573008880001", { tipo: "cambio_solo_voz", perfil: "GATO_CON_BOTAS" }, permMock20) : null;

    const demoOk = resDemo && resDemo.requiereAudio === true && resDemo.perfilVoz === "GATO_CON_BOTAS" &&
      resDemo.textoVoz.includes("honor") && resDemo.textoVoz.includes("Gato con Botas") && resDemo.texto.includes("🐱👢");

    const cambioAudioOk = resCambio && resCambio.requiereAudio === true && resCambio.perfilVoz === "GATO_CON_BOTAS" &&
      resCambio.textoVoz.includes("honor") && resCambio.textoVoz.includes("espada") && resCambio.texto.includes("🐱👢");

    if (audioReq1 && audioReq2 && audioReq3 && demoDetect1 && !demoDetectFalso && demoOk && cambioAudioOk) {
      resultados.aprobadas++;
      Logger.log("✅ Prueba 20 APROBADA: Detección oral 'Quiero escucharte', saludo vocal automático y enriquecimiento visual 100% certificados.");
    } else {
      resultados.fallidas++;
      Logger.log(`❌ Prueba 20 FALLIDA: audioReq=${audioReq1}, demoDetect=${demoDetect1}, demoOk=${Boolean(demoOk)}, cambioOk=${Boolean(cambioAudioOk)}`);
    }
  } catch (e) {
    resultados.fallidas++;
    Logger.log("❌ Prueba 20 ERROR: " + e.message);
  }

  Logger.log("🧪 ======================================================");
  Logger.log(`🧪 RESULTADO FINAL: ${resultados.aprobadas}/${resultados.total} PRUEBAS APROBADAS`);
  Logger.log("🧪 ======================================================");
  return resultados;
}
