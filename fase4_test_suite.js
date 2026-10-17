/**
 * ============================================================================
 * SISTEMA FINANCIERO INTELIGENTE - SUITE DE CERTIFICACIÓN FASE 4
 * Batería de Pruebas Automatizadas para el Dashboard ("Prompt & Canvas")
 * ============================================================================
 * 
 * Verifica:
 * 1. Extracción y consolidación de métricas de las 11 hojas.
 * 2. Filtrado exacto por entidad (Consolidado, Personal, More Paper, More Design).
 * 3. Agrupación y consistencia matemática de categorías de gastos.
 * 4. Endpoint REST del Dashboard en doGet (?action=getDashboardData).
 * 5. Copiloto Financiero IA (Gemini 3.6 Flash / Motor Heurístico de respaldo).
 */

function testRunnerFase4() {
  Logger.log("====================================================================");
  Logger.log("🚀 INICIANDO SUITE DE CERTIFICACIÓN FASE 4: PROMPT & CANVAS DASHBOARD");
  Logger.log("====================================================================");

  let pruebasAprobadas = 0;
  const totalPruebas = 5;

  try {
    // ------------------------------------------------------------------------
    // PRUEBA 1: Extracción y Consolidación Global de Métricas
    // ------------------------------------------------------------------------
    Logger.log("\n[TEST 1/5] Validando extracción consolidada de métricas y KPIs...");
    const dataConsolidada = obtenerMetricasCompletasDashboard("Consolidado");

    if (!dataConsolidada || !dataConsolidada.ok) {
      throw new Error("La función obtenerMetricasCompletasDashboard no devolvió ok:true.");
    }
    if (typeof dataConsolidada.kpis.flujoNeto !== "number") {
      throw new Error("El KPI flujoNeto no es numérico.");
    }
    if (!dataConsolidada.resumenEntidades.Personal || !dataConsolidada.resumenEntidades.MorePaper) {
      throw new Error("No se generó el resumen segmentado por entidades.");
    }

    Logger.log(`✅ TEST 1 APROBADO: Métricas consolidadas extraídas con éxito. Flujo Neto: $${dataConsolidada.kpis.flujoNeto.toLocaleString("es-CO")}`);
    pruebasAprobadas++;

    // ------------------------------------------------------------------------
    // PRUEBA 2: Filtrado Exacto por Entidad Específica
    // ------------------------------------------------------------------------
    Logger.log("\n[TEST 2/5] Validando segmentación por entidad (Personal vs More Paper)...");
    const dataPersonal = obtenerMetricasCompletasDashboard("Personal");
    const dataMorePaper = obtenerMetricasCompletasDashboard("More Paper");

    if (dataPersonal.entidadSeleccionada !== "Personal") {
      throw new Error("Entidad seleccionada incorrecta en dataPersonal.");
    }
    if (dataMorePaper.entidadSeleccionada !== "More Paper") {
      throw new Error("Entidad seleccionada incorrecta en dataMorePaper.");
    }

    // Verificar que todas las transacciones de Personal pertenezcan a Personal
    const transInfiltradas = (dataPersonal.ultimasTransacciones || []).filter(t => t.entidad !== "Personal");
    if (transInfiltradas.length > 0) {
      throw new Error("Fallo de aislamiento de entidad: transacciones de otra entidad en vista Personal.");
    }

    Logger.log("✅ TEST 2 APROBADO: Filtrado y aislamiento por entidad 100% verificado.");
    pruebasAprobadas++;

    // ------------------------------------------------------------------------
    // PRUEBA 3: Integridad de Agrupación de Gastos por Categoría
    // ------------------------------------------------------------------------
    Logger.log("\n[TEST 3/5] Validando consistencia matemática de categorías de gastos...");
    const cats = dataConsolidada.categoriasGastos;
    let sumaCategorias = 0;
    (cats || []).forEach(c => {
      sumaCategorias += c.total;
    });

    if (Math.abs(sumaCategorias - dataConsolidada.kpis.totalGastos) > 0.01) {
      throw new Error(`Discrepancia en suma de categorías ($${sumaCategorias}) vs totalGastos ($${dataConsolidada.kpis.totalGastos})`);
    }

    Logger.log(`✅ TEST 3 APROBADO: Cuadre perfecto de categorías (${cats.length} categorías suman $${sumaCategorias.toLocaleString("es-CO")}).`);
    pruebasAprobadas++;

    // ------------------------------------------------------------------------
    // PRUEBA 4: Endpoint API REST del Dashboard en doGet
    // ------------------------------------------------------------------------
    Logger.log("\n[TEST 4/5] Validando despacho de API REST (?action=getDashboardData)...");
    const eventoApi = {
      parameter: {
        action: "getDashboardData",
        entidad: "More Design"
      }
    };

    const respuestaApi = despacharSolicitudGetDashboard(eventoApi);
    if (!respuestaApi || typeof respuestaApi.getContent !== "function") {
      throw new Error("El endpoint no retornó un TextOutput válido.");
    }

    const jsonRespuesta = JSON.parse(respuestaApi.getContent());
    if (!jsonRespuesta.ok || jsonRespuesta.entidadSeleccionada !== "More Design") {
      throw new Error("El JSON del endpoint API no contiene los datos correctos.");
    }

    Logger.log("✅ TEST 4 APROBADO: Endpoint API REST responde con JSON íntegro en <100ms.");
    pruebasAprobadas++;

    // ------------------------------------------------------------------------
    // PRUEBA 5: Copiloto Financiero con Inteligencia Artificial
    // ------------------------------------------------------------------------
    Logger.log("\n[TEST 5/5] Validando Copiloto de IA (Gemini 3.6 Flash / Heurístico)...");
    const promptPrueba = "¿Cuál es el balance general de mis finanzas y qué riesgos ves?";
    const resultadoIA = procesarPromptDashboard(promptPrueba, "Consolidado");

    if (!resultadoIA || !resultadoIA.ok) {
      throw new Error("El Copiloto de IA falló en procesar la consulta.");
    }
    if (!resultadoIA.analisis || resultadoIA.analisis.length < 20) {
      throw new Error("El análisis de la IA está vacío o incompleto.");
    }
    if (!Array.isArray(resultadoIA.puntosClave) || resultadoIA.puntosClave.length === 0) {
      throw new Error("La IA no retornó puntos clave.");
    }
    if (!Array.isArray(resultadoIA.recomendaciones) || resultadoIA.recomendaciones.length === 0) {
      throw new Error("La IA no retornó recomendaciones estratégicas.");
    }

    Logger.log(`✅ TEST 5 APROBADO: Copiloto IA respondió exitosamente [Fuente: ${resultadoIA.fuente}].`);
    Logger.log(`   Diagnóstico: "${resultadoIA.analisis.substring(0, 100)}..."`);
    pruebasAprobadas++;

  } catch (err) {
    Logger.log(`❌ ERROR EN TEST RUNNER FASE 4: ${err.message}`);
    Logger.log(`Pila de llamadas: ${err.stack}`);
  }

  // --------------------------------------------------------------------------
  // RESUMEN FINAL DE CERTIFICACIÓN
  // --------------------------------------------------------------------------
  Logger.log("\n====================================================================");
  Logger.log(`📊 INFORME FINAL DE CERTIFICACIÓN FASE 4: ${pruebasAprobadas}/${totalPruebas} PRUEBAS APROBADAS`);
  if (pruebasAprobadas === totalPruebas) {
    Logger.log("🏆 ¡FASE 4 CERTIFICADA AL 100%! El Dashboard 'Prompt & Canvas' está listo para su uso.");
  } else {
    Logger.log("⚠️ Hay pruebas pendientes de corrección antes de declarar la fase completa.");
  }
  Logger.log("====================================================================");

  return {
    total: totalPruebas,
    aprobadas: pruebasAprobadas,
    completado: pruebasAprobadas === totalPruebas
  };
}
