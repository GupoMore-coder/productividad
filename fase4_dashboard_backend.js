/**
 * ============================================================================
 * SISTEMA FINANCIERO INTELIGENTE - NÚCLEO FASE 4
 * Backend del Dashboard Interactivo en Tiempo Real ("Prompt & Canvas")
 * ============================================================================
 * 
 * Funcionalidades Principales:
 * 1. obtenerMetricasCompletasDashboard(entidadFiltro):
 *    Calcula en tiempo real KPIs, saldos, flujo de caja, categorías y compromisos.
 * 2. procesarPromptDashboard(promptTexto, entidadFiltro):
 *    Copiloto financiero potenciado por Gemini 3.6 Flash para análisis ejecutivo.
 * 3. Enrutador doGet enriquecido:
 *    - ?action=getDashboardData -> Retorna JSON con métricas en vivo.
 *    - ?action=processPrompt    -> Procesa consultas de IA y retorna reporte.
 *    - Modo visual por defecto  -> Renderiza DashboardView.html en pantalla completa.
 */

// ============================================================================
// 1. EXTRACTOR Y CONSOLIDADOR DE MÉTRICAS DEL DASHBOARD
// ============================================================================
// Referencias canónicas de hojas y configuraciones con tolerancia a ejecución aislada
// ============================================================================
var HOJAS_DASHBOARD_ = (typeof HOJAS !== "undefined" && HOJAS) ? HOJAS : {
  CONTROL_ACCESO: "Control_Acceso",
  PERSONAL_TRANS: "Personal_Transacciones",
  PERSONAL_COMP: "Personal_Compromisos",
  MOREPAPER_TRANS: "MorePaper_Transacciones",
  MOREPAPER_COMP: "MorePaper_Compromisos",
  MOREDESIGN_TRANS: "MoreDesign_Transacciones",
  MOREDESIGN_COMP: "MoreDesign_Compromisos",
  GASTOS_GLOBALES: "Gastos_Globales",
  COMPROMISOS_GLOBALES: "Compromisos_Globales",
  DASHBOARD: "Dashboard_Consolidado",
  METRICAS_WA: "Metricas_WhatsApp",
  SESIONES_WA: "WhatsApp_Sesiones_24h",
  CONFIG_CATEGORIAS: "Config_Categorias"
};

/**
 * Obtiene todas las métricas requeridas por el Canvas en un solo payload optimizado.
 * @param {string} entidadFiltro - 'Consolidado', 'Personal', 'More Paper' o 'More Design'.
 */
function obtenerMetricasCompletasDashboard(entidadFiltro, usuariosUniversalFiltro) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    return {
      ok: false,
      error: "No se pudo acceder a la hoja de cálculo activa de Google Sheets.",
      kpis: { totalIngresos: 0, totalGastos: 0, flujoNeto: 0, cuentasPorCobrar: 0, cuentasPorPagar: 0, tasaAhorroRentabilidad: 0 }
    };
  }

  const entidad = (entidadFiltro || "Consolidado").trim();
  const hojasRef = HOJAS_DASHBOARD_;

  // 1. Obtener transacciones de todas las entidades
  const transacciones = {
    Personal: obtenerTransaccionesDeHoja_(ss, hojasRef.PERSONAL_TRANS, "Personal"),
    MorePaper: obtenerTransaccionesDeHoja_(ss, hojasRef.MOREPAPER_TRANS, "More Paper"),
    MoreDesign: obtenerTransaccionesDeHoja_(ss, hojasRef.MOREDESIGN_TRANS, "More Design"),
    GastosGlobales: obtenerTransaccionesDeHoja_(ss, (resolverHojaFlexible_(ss, "Operacion_Global") ? "Operacion_Global" : (hojasRef.GASTOS_GLOBALES || "Gastos_Globales")), "Consolidado")
  };

  // 2. Obtener compromisos de todas las entidades
  const compromisos = {
    Personal: obtenerCompromisosDeHoja_(ss, hojasRef.PERSONAL_COMP, "Personal"),
    MorePaper: obtenerCompromisosDeHoja_(ss, hojasRef.MOREPAPER_COMP, "More Paper"),
    MoreDesign: obtenerCompromisosDeHoja_(ss, hojasRef.MOREDESIGN_COMP, "More Design"),
    Global: obtenerCompromisosDeHoja_(ss, hojasRef.COMPROMISOS_GLOBALES || "Compromisos_Globales", "Consolidado")
  };

  // 3. Filtrar según la entidad seleccionada
  let listaTransacciones = [];
  let listaCompromisos = [];

  if (entidad === "Personal" || entidad === "Fernando") {
    listaTransacciones = transacciones.Personal;
    listaCompromisos = compromisos.Personal;
  } else if (entidad === "More Paper") {
    listaTransacciones = transacciones.MorePaper;
    listaCompromisos = compromisos.MorePaper;
  } else if (entidad === "More Design") {
    listaTransacciones = transacciones.MoreDesign;
    listaCompromisos = compromisos.MoreDesign;
  } else if (entidad === "Universal") {
    // Pestaña Universal: Agrega exclusivamente los usuarios seleccionados (sin tiendas)
    const usuariosPermitidos = usuariosUniversalFiltro 
      ? String(usuariosUniversalFiltro).split(",").map(u => u.trim()) 
      : ["Personal", "Fernando"];
    
    listaTransacciones = [];
    listaCompromisos = [];
    
    usuariosPermitidos.forEach(u => {
      const entName = (u === "Fernando" || u === "Personal") ? "Personal" : u;
      if (entName === "Personal") {
        listaTransacciones.push(...transacciones.Personal);
        listaCompromisos.push(...compromisos.Personal);
      } else if (resolverHojaFlexible_(ss, entName + "_Transacciones")) {
        listaTransacciones.push(...obtenerTransaccionesDeHoja_(ss, entName + "_Transacciones", entName));
        listaCompromisos.push(...obtenerCompromisosDeHoja_(ss, entName + "_Compromisos", entName));
      }
    });
  } else if (entidad !== "Consolidado" && resolverHojaFlexible_(ss, entidad + "_Transacciones")) {
    // Soporte para usuarios dinámicos (ej: Florangellys)
    listaTransacciones = obtenerTransaccionesDeHoja_(ss, entidad + "_Transacciones", entidad);
    listaCompromisos = obtenerCompromisosDeHoja_(ss, entidad + "_Compromisos", entidad);
  } else {
    // Consolidado: combina todas las entidades y los gastos operativos globales
    listaTransacciones = [
      ...transacciones.Personal,
      ...transacciones.MorePaper,
      ...transacciones.MoreDesign,
      ...transacciones.GastosGlobales
    ];
    listaCompromisos = [
      ...compromisos.Personal,
      ...compromisos.MorePaper,
      ...compromisos.MoreDesign,
      ...compromisos.Global
    ];
  }

  // Ordenar transacciones por fecha descendente
  listaTransacciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  // 4. Calcular KPIs principales
  let totalIngresos = 0;
  let totalGastos = 0;
  const gastosPorCategoria = {};
  const ingresosPorCategoria = {};
  const flujoMensualMap = {};

  listaTransacciones.forEach(t => {
    const mes = t.fecha ? String(t.fecha).substring(0, 7) : "Reciente";
    if (!flujoMensualMap[mes]) {
      flujoMensualMap[mes] = { mes: mes, ingresos: 0, gastos: 0, neto: 0 };
    }

    if (t.tipo === "INGRESO") {
      totalIngresos += t.monto;
      flujoMensualMap[mes].ingresos += t.monto;
      ingresosPorCategoria[t.categoria] = (ingresosPorCategoria[t.categoria] || 0) + t.monto;
    } else {
      totalGastos += t.monto;
      flujoMensualMap[mes].gastos += t.monto;
      gastosPorCategoria[t.categoria] = (gastosPorCategoria[t.categoria] || 0) + t.monto;
    }
    flujoMensualMap[mes].neto = flujoMensualMap[mes].ingresos - flujoMensualMap[mes].gastos;
  });

  const flujoNeto = totalIngresos - totalGastos;

  // Convertir mapas a arreglos para gráficos
  const categoriasGastos = Object.keys(gastosPorCategoria).map(cat => ({
    categoria: cat,
    total: gastosPorCategoria[cat],
    porcentaje: totalGastos > 0 ? ((gastosPorCategoria[cat] / totalGastos) * 100).toFixed(1) : 0
  })).sort((a, b) => b.total - a.total);

  const flujoMensual = Object.keys(flujoMensualMap)
    .sort()
    .map(mes => flujoMensualMap[mes]);

  // 5. Analizar compromisos (Deudas / Cuentas por Cobrar)
  const ahora = new Date();
  let cuentasPorCobrarPendientes = 0;
  let cuentasPorPagarPendientes = 0;

  const compromisosClasificados = listaCompromisos.map(c => {
    const fVenc = new Date(c.fechaVencimiento);
    const diffDias = Math.ceil((fVenc - ahora) / (1000 * 60 * 60 * 24));
    
    let urgencia = "NORMAL";
    if (c.estado === "PAGADO") {
      urgencia = "CUMPLIDO";
    } else if (diffDias < 0) {
      urgencia = "VENCIDO";
    } else if (diffDias <= 2) {
      urgencia = "URGENTE_48H";
    } else if (diffDias <= 7) {
      urgencia = "PROXIMO_7D";
    }

    if (c.estado !== "PAGADO") {
      if (c.tipo === "POR_COBRAR") {
        cuentasPorCobrarPendientes += (c.saldoPendiente || c.montoOriginal);
      } else {
        cuentasPorPagarPendientes += (c.saldoPendiente || c.montoOriginal);
      }
    }

    return {
      ...c,
      diasRestantes: diffDias,
      urgencia: urgencia
    };
  });

  // Ordenar compromisos: Vencidos y urgentes primero
  compromisosClasificados.sort((a, b) => {
    if (a.estado === "PAGADO" && b.estado !== "PAGADO") return 1;
    if (a.estado !== "PAGADO" && b.estado === "PAGADO") return -1;
    return a.diasRestantes - b.diasRestantes;
  });

  // 6. Resumen por Entidad para el Comparativo Global
  const resumenEntidades = {
    Personal: calcularTotalesRapidos_(transacciones.Personal),
    MorePaper: calcularTotalesRapidos_(transacciones.MorePaper),
    MoreDesign: calcularTotalesRapidos_(transacciones.MoreDesign),
    GastosGlobales: calcularTotalesRapidos_(transacciones.GastosGlobales)
  };

  // 6.1 Liquidez por Cuentas Bancarias Oficiales (Valores 100% numéricos garantizados)
  const saldoPersonal2103 = Number(resumenEntidades.Personal.flujoNeto || resumenEntidades.Personal.neto || 0);
  const saldoMorePaper = Number(resumenEntidades.MorePaper.flujoNeto || resumenEntidades.MorePaper.neto || 0);
  const saldoMoreDesign = Number(resumenEntidades.MoreDesign.flujoNeto || resumenEntidades.MoreDesign.neto || 0);
  const totalGastosGlobalesNomina = Number(resumenEntidades.GastosGlobales.gastos || 0);
  const totalIngresosGlobales = Number(resumenEntidades.GastosGlobales.ingresos || 0);
  const flujoNetoGlobal = totalIngresosGlobales - totalGastosGlobalesNomina;
  const saldoNegocios7194 = saldoMorePaper + saldoMoreDesign + flujoNetoGlobal;

  const esUsuarioExterno = (entidad !== "Consolidado" && entidad !== "Personal" && entidad !== "Fernando" && entidad !== "More Paper" && entidad !== "More Design" && entidad !== "Universal");
  const esUniversal = (entidad === "Universal");

  // Consultar cuentas configuradas en Config_Cuentas_Bancarias
  let cuentasConfiguradas = [];
  try {
    if (typeof obtenerCuentasBancariasPorEntidad_ === "function") {
      cuentasConfiguradas = obtenerCuentasBancariasPorEntidad_(ss, entidad);
    }
  } catch (eCuentas) {
    Logger.log("Aviso consultando cuentas configuradas: " + eCuentas.message);
  }

  // Generar lista de tarjetas para el frontend
  let tarjetasBancos = [];

  if (esUsuarioExterno) {
    // USUARIOS EXTERNOS (ej: Florangellys): Solo sus cuentas personales
    if (cuentasConfiguradas && cuentasConfiguradas.length > 0) {
      cuentasConfiguradas.forEach((c) => {
        tarjetasBancos.push({
          grupo: "Usuario",
          tipo: "personal",
          badge: `👤 ${c.banco.toUpperCase()} ${c.mascara}`,
          titulo: c.alias || `${c.banco} ${c.mascara}`,
          saldo: flujoNeto,
          flujo: `Ing: $${totalIngresos.toLocaleString("es-CO")} | Gas: $${totalGastos.toLocaleString("es-CO")}`,
          icono: "💳"
        });
      });
    } else {
      tarjetasBancos.push({
        grupo: "Usuario",
        tipo: "personal",
        badge: `👤 ${entidad.toUpperCase()}`,
        titulo: `Billetera / Cuenta Personal`,
        saldo: flujoNeto,
        flujo: `Ing: $${totalIngresos.toLocaleString("es-CO")} | Gas: $${totalGastos.toLocaleString("es-CO")}`,
        icono: "💳"
      });
    }
  } else if (entidad === "Personal" || entidad === "Fernando") {
    // PESTAÑA FERNANDO: Solo cuentas personales de Fernando
    tarjetasBancos.push({
      grupo: "Personal",
      tipo: "personal",
      badge: "👤 PERSONAL ***2103",
      titulo: "Ahorros Bancolombia (Personal)",
      saldo: saldoPersonal2103,
      flujo: `Ing: $${Number(resumenEntidades.Personal.ingresos || 0).toLocaleString("es-CO")} | Gas: $${Number(resumenEntidades.Personal.gastos || 0).toLocaleString("es-CO")}`,
      icono: "💳"
    });
    cuentasConfiguradas.forEach(c => {
      if (c.mascara !== "***2103" && c.tipoUso === "Personal") {
        tarjetasBancos.push({
          grupo: "Personal",
          tipo: "personal",
          badge: `👤 ${c.banco.toUpperCase()} ${c.mascara}`,
          titulo: c.alias,
          saldo: saldoPersonal2103,
          flujo: "Cuenta Activa",
          icono: "💳"
        });
      }
    });
  } else if (entidad === "More Paper" || entidad === "More Design") {
    // PESTAÑA TIENDAS: Solo cuentas de uso global para las tiendas (***7194)
    tarjetasBancos.push({
      grupo: "Negocios",
      tipo: "negocios",
      badge: "🏢 NEGOCIOS ***7194",
      titulo: "Ahorros Bancolombia (Común Tiendas)",
      saldo: saldoNegocios7194,
      desglose: `Paper: $${saldoMorePaper.toLocaleString("es-CO")} | Design: $${saldoMoreDesign.toLocaleString("es-CO")}${totalIngresosGlobales > 0 ? " | Fondos: $" + totalIngresosGlobales.toLocaleString("es-CO") : ""}`,
      icono: "🏢"
    });
  } else if (esUniversal) {
    // PESTAÑA UNIVERSAL: Cuentas consolidadas de los usuarios seleccionados
    tarjetasBancos.push({
      grupo: "Universal",
      tipo: "universal",
      badge: "🌐 FONDO CONSOLIDADO USUARIOS",
      titulo: "Flujo Disponible de Usuarios Seleccionados",
      saldo: flujoNeto,
      flujo: `Ingresos: $${totalIngresos.toLocaleString("es-CO")} | Gastos: $${totalGastos.toLocaleString("es-CO")}`,
      icono: "🌐"
    });
  } else {
    // CONSOLIDADO: Separación visual de Personal vs Negocios
    tarjetasBancos.push({
      grupo: "Personal",
      tipo: "personal",
      badge: "👤 PERSONAL ***2103",
      titulo: "Ahorros Bancolombia (Fernando)",
      saldo: saldoPersonal2103,
      flujo: `Ing: $${Number(resumenEntidades.Personal.ingresos || 0).toLocaleString("es-CO")} | Gas: $${Number(resumenEntidades.Personal.gastos || 0).toLocaleString("es-CO")}`,
      icono: "💳"
    });
    tarjetasBancos.push({
      grupo: "Negocios",
      tipo: "negocios",
      badge: "🏢 NEGOCIOS ***7194",
      titulo: "Ahorros Bancolombia (Común Tiendas)",
      saldo: saldoNegocios7194,
      desglose: `Paper: $${saldoMorePaper.toLocaleString("es-CO")} | Design: $${saldoMoreDesign.toLocaleString("es-CO")}${totalIngresosGlobales > 0 ? " | Fondos: $" + totalIngresosGlobales.toLocaleString("es-CO") : ""}`,
      icono: "🏢"
    });
  }

  const cuentasBancarias = {
    esUsuarioExterno: esUsuarioExterno,
    esUniversal: esUniversal,
    entidad: entidad,
    tarjetas: tarjetasBancos,
    personal2103: {
      cuenta: "Ahorros ***2103",
      banco: "Bancolombia",
      titular: "Personal",
      ingresos: Number(resumenEntidades.Personal.ingresos || 0),
      gastos: Number(resumenEntidades.Personal.gastos || 0),
      saldoDisponible: saldoPersonal2103
    },
    negocios7194: {
      cuenta: "Ahorros ***7194",
      banco: "Bancolombia",
      titular: "Cuenta Común (More Paper & More Design)",
      ingresosTotal: Number((resumenEntidades.MorePaper.ingresos || 0) + (resumenEntidades.MoreDesign.ingresos || 0) + totalIngresosGlobales),
      gastosTotal: Number((resumenEntidades.MorePaper.gastos || 0) + (resumenEntidades.MoreDesign.gastos || 0) + totalGastosGlobalesNomina),
      saldoDisponible: saldoNegocios7194,
      desglose: {
        morePaper: {
          ingresos: Number(resumenEntidades.MorePaper.ingresos || 0),
          gastos: Number(resumenEntidades.MorePaper.gastos || 0),
          neto: saldoMorePaper,
          flujoNeto: saldoMorePaper
        },
        moreDesign: {
          ingresos: Number(resumenEntidades.MoreDesign.ingresos || 0),
          gastos: Number(resumenEntidades.MoreDesign.gastos || 0),
          neto: saldoMoreDesign,
          flujoNeto: saldoMoreDesign
        },
        operacionGlobal: {
          ingresos: totalIngresosGlobales,
          gastos: totalGastosGlobalesNomina,
          neto: flujoNetoGlobal,
          flujoNeto: flujoNetoGlobal
        }
      }
    },
    totalConsolidadoBancos: (entidad === "Consolidado") 
      ? (saldoPersonal2103 + saldoNegocios7194) 
      : (entidad === "Personal" || entidad === "Fernando" ? saldoPersonal2103 : (entidad.includes("Paper") || entidad.includes("Design") ? saldoNegocios7194 : flujoNeto))
  };

  // 6.2 Métricas Estratégicas Warren Buffett (Owner Earnings, Cash Fortress & Antigüedad de Cartera)
  const saldoLiquidoRelevante = esUsuarioExterno
    ? flujoNeto
    : (entidad === "Personal" 
        ? saldoPersonal2103 
        : (entidad === "Consolidado" ? (saldoPersonal2103 + saldoNegocios7194) : saldoNegocios7194));

  // Estimación de egresos mensuales operativos promedio
  const mesesContabilizados = Math.max(flujoMensual.length, 1);
  const gastoPromedioMensual = totalGastos > 0 ? (totalGastos / mesesContabilizados) : 1;
  const gastoPromedioDiario = gastoPromedioMensual / 30;

  // Días de autonomía operativa (Runway Fortress)
  const runwayDias = (saldoLiquidoRelevante > 0 && gastoPromedioDiario > 0) 
    ? Math.round(saldoLiquidoRelevante / gastoPromedioDiario) 
    : 0;

  let estadoFortaleza = "VULNERABILIDAD_CRITICA";
  let colorFortaleza = "#f43f5e";
  let labelFortaleza = "Crítico (<30 días)";
  if (runwayDias >= 90) {
    estadoFortaleza = "FORTALEZA_ALTA";
    colorFortaleza = "#10b981";
    labelFortaleza = "Fortaleza Sólida (>90 días)";
  } else if (runwayDias >= 30) {
    estadoFortaleza = "EQUILIBRIO_MEDIO";
    colorFortaleza = "#f59e0b";
    labelFortaleza = "Equilibrio Moderado (30-90 días)";
  }

  // Antigüedad de Cartera & Compromisos (Aging Analysis de Buffett)
  const carteraAging = {
    tramo0_15d: { monto: 0, cantidad: 0, label: "0-15 días (Corriente)" },
    tramo16_30d: { monto: 0, cantidad: 0, label: "16-30 días (Atención)" },
    tramo31_60d: { monto: 0, cantidad: 0, label: "31-60 días (Alerta)" },
    tramoMas60d: { monto: 0, cantidad: 0, label: ">60 días (Crítico / Mora)" }
  };

  compromisosClasificados.forEach(c => {
    if (c.estado !== "PAGADO") {
      const monto = Number(c.saldoPendiente || c.montoOriginal || 0);
      const dias = Math.abs(c.diasRestantes || 0);
      if (dias <= 15) {
        carteraAging.tramo0_15d.monto += monto;
        carteraAging.tramo0_15d.cantidad += 1;
      } else if (dias <= 30) {
        carteraAging.tramo16_30d.monto += monto;
        carteraAging.tramo16_30d.cantidad += 1;
      } else if (dias <= 60) {
        carteraAging.tramo31_60d.monto += monto;
        carteraAging.tramo31_60d.cantidad += 1;
      } else {
        carteraAging.tramoMas60d.monto += monto;
        carteraAging.tramoMas60d.cantidad += 1;
      }
    }
  });

  // Dictamen algorítmico Buffett
  let dictamenBuffett = "";
  if (cuentasPorCobrarPendientes > saldoLiquidoRelevante && saldoLiquidoRelevante > 0) {
    dictamenBuffett = `Cuidado: Tienes $${Math.round(cuentasPorCobrarPendientes).toLocaleString('es-CO')} COP atrapados en cuentas por cobrar, superando tu liquidez bancaria inmediata. Recuerda la Regla #1: una venta no es ganancia hasta que el dinero reposa en tu cuenta bancaria.`;
  } else if (cuentasPorPagarPendientes > saldoLiquidoRelevante) {
    dictamenBuffett = `Atención al pasivo: Las obligaciones pendientes superan tu saldo disponible actual. Prioriza liquidar deudas antes de realizar nuevas compras de inventario.`;
  } else if (runwayDias >= 90) {
    dictamenBuffett = `Excelente colchón de seguridad: Tu caja cubre más de ${runwayDias} días de operación fija. Mantén esta fortaleza y cuida tu foso económico (moat).`;
  } else {
    dictamenBuffett = `Operación con ${runwayDias} días de pista de efectivo. Mantén la disciplina de no retirar utilidades hasta consolidar al menos 90 días de reserva operativa.`;
  }

  const metricasBuffett = {
    ownerEarnings: flujoNeto,
    margenOwnerEarnings: totalIngresos > 0 ? ((flujoNeto / totalIngresos) * 100).toFixed(1) : 0,
    runwayDias: runwayDias,
    estadoFortaleza: estadoFortaleza,
    colorFortaleza: colorFortaleza,
    labelFortaleza: labelFortaleza,
    gastoPromedioMensual: gastoPromedioMensual,
    capitalAtrapadoCalle: cuentasPorCobrarPendientes,
    carteraAging: carteraAging,
    dictamenBuffett: dictamenBuffett
  };

  // 7. Métricas de cuota de WhatsApp
  const limiteWhatsApp = (typeof CONFIG_FINANZAS !== "undefined" && CONFIG_FINANZAS && CONFIG_FINANZAS.LIMITE_WHATSAPP_GRATUITO) 
    ? CONFIG_FINANZAS.LIMITE_WHATSAPP_GRATUITO 
    : 1000;
  let cuotaWhatsApp = { consumidas: 0, limite: limiteWhatsApp, porcentaje: 0 };
  try {
    const hMetricas = resolverHojaFlexible_(ss, hojasRef.METRICAS_WA);
    if (hMetricas && hMetricas.getLastRow() > 1) {
      const datosMet = hMetricas.getRange(2, 1, hMetricas.getLastRow() - 1, 3).getValues();
      const mesActual = Utilities.formatDate(ahora, Session.getScriptTimeZone(), "yyyy-MM");
      for (let i = 0; i < datosMet.length; i++) {
        if (String(datosMet[i][0]) === mesActual) {
          const consumidas = Number(datosMet[i][1]) || 0;
          cuotaWhatsApp = {
            consumidas: consumidas,
            limite: limiteWhatsApp,
            porcentaje: ((consumidas / limiteWhatsApp) * 100).toFixed(1)
          };
          break;
        }
      }
    }
  } catch (e) {
    Logger.log("Aviso leyendo cuota WhatsApp: " + e.message);
  }

  return {
    ok: true,
    timestamp: new Date().toISOString(),
    entidadSeleccionada: entidad,
    kpis: {
      totalIngresos: totalIngresos,
      totalGastos: totalGastos,
      flujoNeto: flujoNeto,
      cuentasPorCobrar: cuentasPorCobrarPendientes,
      cuentasPorPagar: cuentasPorPagarPendientes,
      tasaAhorroRentabilidad: totalIngresos > 0 ? (((totalIngresos - totalGastos) / totalIngresos) * 100).toFixed(1) : 0
    },
    resumenEntidades: resumenEntidades,
    cuentasBancarias: cuentasBancarias,
    categoriasGastos: categoriasGastos,
    flujoMensual: flujoMensual,
    compromisos: compromisosClasificados.slice(0, 15), // Top 15 más relevantes
    ultimasTransacciones: listaTransacciones.slice(0, 20), // Top 20 transacciones
    cuotaWhatsApp: cuotaWhatsApp,
    usuariosDinamicos: obtenerUsuariosActivosDashboard_(ss),
    usuariosParaUniversal: [{ nombre: "Fernando (Personal)", entidad: "Personal", primerNombre: "Fernando" }, ...obtenerUsuariosActivosDashboard_(ss)],
    metricasBuffett: metricasBuffett
  };
}

/**
 * Obtiene la lista de usuarios externos activos registrados en Control_Acceso
 */
function obtenerUsuariosActivosDashboard_(ss) {
  const libro = ss || SpreadsheetApp.getActiveSpreadsheet();
  const hojasRef = HOJAS_DASHBOARD_;
  const sheetCtrl = resolverHojaFlexible_(libro, hojasRef.CONTROL_ACCESO);
  if (!sheetCtrl || sheetCtrl.getLastRow() <= 1) return [];

  const datos = sheetCtrl.getRange(2, 1, sheetCtrl.getLastRow() - 1, 5).getValues();
  const usuarios = [];

  datos.forEach(row => {
    const nombre = String(row[1]).trim();
    const rol = String(row[2]).trim().toUpperCase();
    const estado = String(row[3]).trim().toUpperCase();
    const hojas = String(row[4]);

    if (rol !== "SUPER_ADMIN" && estado === "ACTIVO") {
      const match = hojas.match(/([a-zA-Z0-9]+)_Transacciones/);
      const entidad = match ? match[1] : nombre.split(" ")[0].replace(/[^a-zA-Z0-9]/g, "");
      if (resolverHojaFlexible_(libro, entidad + "_Transacciones")) {
        usuarios.push({
          nombre: nombre,
          entidad: entidad,
          primerNombre: nombre.split(" ")[0]
        });
      }
    }
  });

  return usuarios;
}

/**
 * Limpia y convierte cualquier representación monetaria colombiana en número limpio
 * (ej: "$ 55.400", "$ 17.500 COP", "1.247.646", 17500)
 */
function limpiarMontoMoneda_(val) {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  let str = String(val).replace(/[$COP\s]/gi, "").trim();
  if (!str) return 0;
  if (str.includes(".") && !str.includes(",")) {
    const parts = str.split(".");
    if (parts.length > 1 && parts.every((p, idx) => idx === 0 || p.length === 3)) {
      str = str.replace(/\./g, "");
    }
  } else if (str.includes(".") && str.includes(",")) {
    str = str.replace(/\./g, "").replace(",", ".");
  } else if (str.includes(",")) {
    str = str.replace(",", ".");
  }
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

/**
 * Resuelve una hoja de cálculo buscando por su nombre exacto o variantes con/sin espacios
 */
function resolverHojaFlexible_(ss, nombreHoja) {
  if (!ss || !nombreHoja) return null;
  let sh = ss.getSheetByName(nombreHoja);
  if (sh) return sh;

  // Variantes de espacio ("MorePaper" <-> "More Paper")
  const conEspacio = nombreHoja.replace("MorePaper", "More Paper").replace("MoreDesign", "More Design");
  sh = ss.getSheetByName(conEspacio);
  if (sh) return sh;

  const sinEspacio = nombreHoja.replace("More Paper", "MorePaper").replace("More Design", "MoreDesign");
  sh = ss.getSheetByName(sinEspacio);
  if (sh) return sh;

  // Búsqueda insensible a mayúsculas y caracteres especiales
  const todas = ss.getSheets();
  const obj = nombreHoja.toLowerCase().replace(/[\s_-]/g, "");
  for (let i = 0; i < todas.length; i++) {
    if (todas[i].getName().toLowerCase().replace(/[\s_-]/g, "") === obj) {
      return todas[i];
    }
  }
  return null;
}

/**
 * Auxiliar robusto para extraer transacciones de una hoja específica
 * Compatible con estructura canónica Fase 1 y estructura heredada (Finanzas)
 */
function obtenerTransaccionesDeHoja_(ss, nombreHoja, entidadNombre) {
  let sheet = resolverHojaFlexible_(ss, nombreHoja);
  
  // Si es Personal y no se encuentra o está vacía la hoja oficial, buscar hoja legacy "Finanzas"
  if ((!sheet || sheet.getLastRow() <= 1) && entidadNombre === "Personal") {
    sheet = resolverHojaFlexible_(ss, "Finanzas") || resolverHojaFlexible_(ss, "Registro y control finanzas");
  }

  if (!sheet || sheet.getLastRow() <= 1) return [];

  const raw = sheet.getRange(1, 1, sheet.getLastRow(), Math.min(sheet.getLastColumn(), 12)).getValues();
  if (raw.length <= 1) return [];

  // Mapeo dinámico de encabezados
  let headerRowIdx = 0;
  let mapa = { id: 0, fecha: 1, tipo: 2, categoria: 3, subcategoria: 4, concepto: 5, tercero: 6, valor: 7 };

  for (let r = 0; r < Math.min(raw.length, 15); r++) {
    const rowStr = raw[r].join(" ").toUpperCase();
    if (rowStr.includes("VALOR") || rowStr.includes("MONTO") || rowStr.includes("ID_TRANSACCION") || rowStr.includes("CATEGOR")) {
      headerRowIdx = r;
      raw[r].forEach((h, cIdx) => {
        const hName = String(h || "").trim().toUpperCase();
        if (hName.includes("ID_TRANS") || hName === "ID") mapa.id = cIdx;
        else if (hName.includes("FECHA")) mapa.fecha = cIdx;
        else if (hName.includes("TIPO")) mapa.tipo = cIdx;
        else if (hName.includes("SUBCAT")) mapa.subcategoria = cIdx;
        else if (hName.includes("CATEG")) mapa.categoria = cIdx;
        else if (hName.includes("CONCEPTO") || hName === "NOMBRE" || hName.includes("DESCRIP")) mapa.concepto = cIdx;
        else if (hName.includes("TERCERO") || hName.includes("PROVEEDOR")) mapa.tercero = cIdx;
        else if (hName.includes("VALOR") || hName.includes("MONTO") || hName.includes("IMPORTE")) mapa.valor = cIdx;
      });
      break;
    }
  }

  const transacciones = [];
  for (let r = headerRowIdx + 1; r < raw.length; r++) {
    const row = raw[r];
    const rawVal = mapa.valor >= 0 ? row[mapa.valor] : row[7];
    const monto = Math.abs(limpiarMontoMoneda_(rawVal));
    if (monto <= 0) continue;

    const rawId = mapa.id >= 0 ? row[mapa.id] : "";
    const rawFecha = mapa.fecha >= 0 ? row[mapa.fecha] : "";
    const rawTipo = mapa.tipo >= 0 ? row[mapa.tipo] : "";
    const rawCat = mapa.categoria >= 0 ? row[mapa.categoria] : "";
    const rawConc = mapa.concepto >= 0 ? row[mapa.concepto] : "";
    const rawTerc = mapa.tercero >= 0 ? row[mapa.tercero] : "";

    const fechaStr = (rawFecha instanceof Date) 
      ? Utilities.formatDate(rawFecha, Session.getScriptTimeZone(), "yyyy-MM-dd")
      : String(rawFecha || "").substring(0, 10);

    const tipoStr = String(rawTipo || rawCat || "").trim().toUpperCase();
    const esIngreso = tipoStr.includes("INGRESO") || (!tipoStr.includes("GASTO") && String(rawConc).toLowerCase().includes("saldo a favor"));

    transacciones.push({
      id: String(rawId || ("TX-" + r)),
      fecha: fechaStr || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
      tipo: esIngreso ? "INGRESO" : "GASTO",
      tipoDetallado: String(rawTipo || (esIngreso ? "Ingreso" : "Gasto")),
      categoria: String(rawCat || (esIngreso ? "Ingresos" : "General")).trim() || "Otros",
      subcategoria: String(mapa.subcategoria >= 0 ? row[mapa.subcategoria] : "").trim(),
      concepto: String(rawConc || "Movimiento contable").trim() || "Sin concepto",
      tercero: String(rawTerc || "").trim(),
      monto: monto,
      entidad: entidadNombre
    });
  }

  return transacciones;
}

/**
 * Auxiliar robusto para extraer compromisos de una hoja específica
 */
function obtenerCompromisosDeHoja_(ss, nombreHoja, entidadNombre) {
  const sheet = resolverHojaFlexible_(ss, nombreHoja);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const raw = sheet.getRange(1, 1, sheet.getLastRow(), Math.min(sheet.getLastColumn(), 12)).getValues();
  if (raw.length <= 1) return [];

  let headerRowIdx = 0;
  for (let r = 0; r < Math.min(raw.length, 10); r++) {
    const rowStr = raw[r].join(" ").toUpperCase();
    if (rowStr.includes("COMPROMISO") || rowStr.includes("ACREEDOR") || rowStr.includes("SALDO")) {
      headerRowIdx = r;
      break;
    }
  }

  const compromisos = [];
  for (let r = headerRowIdx + 1; r < raw.length; r++) {
    const row = raw[r];
    if (!row[0] && !row[2]) continue;

    let fVencStr = "";
    if (row[8] instanceof Date) {
      fVencStr = Utilities.formatDate(row[8], Session.getScriptTimeZone(), "yyyy-MM-dd");
    } else {
      fVencStr = String(row[8] || "").substring(0, 10);
    }

    const estadoStr = String(row[9] || "PENDIENTE").trim().toUpperCase();
    const montoTotal = Math.abs(limpiarMontoMoneda_(row[4]));
    const totalAbonado = Math.abs(limpiarMontoMoneda_(row[5]));
    const saldoPendiente = Math.abs(limpiarMontoMoneda_(row[6])) || Math.max(0, montoTotal - totalAbonado);

    compromisos.push({
      id: String(row[0] || ("COMP-" + r)),
      fechaVencimiento: fVencStr,
      tipo: "POR_PAGAR",
      tercero: String(row[2] || "").trim(),
      concepto: String(row[3] || "Obligación financiera").trim(),
      montoOriginal: montoTotal,
      abonos: totalAbonado,
      saldoPendiente: saldoPendiente,
      estado: estadoStr,
      entidad: entidadNombre
    });
  }

  return compromisos;
}

/**
 * Calcula totales rápidos de ingresos y gastos de una lista
 */
function calcularTotalesRapidos_(lista) {
  let ing = 0;
  let gas = 0;
  (lista || []).forEach(t => {
    const monto = Number(t.monto) || 0;
    if (t.tipo === "INGRESO") ing += monto;
    else gas += monto;
  });
  return {
    ingresos: ing,
    gastos: gas,
    neto: ing - gas,
    flujoNeto: ing - gas
  };
}

// ============================================================================
// 2. COPILOTO FINANCIERO CON IA ("PROMPT ENGINE")
// ============================================================================

/**
 * Procesa una consulta en lenguaje natural desde el Dashboard utilizando Gemini 3.6 Flash.
 * @param {string} promptTexto - La pregunta o instrucción del usuario.
 * @param {string} entidadSeleccionada - Entidad activa en el Canvas.
 */
function procesarPromptDashboard(promptTexto, entidadSeleccionada) {
  if (!promptTexto || !promptTexto.trim()) {
    return {
      ok: false,
      error: "El prompt no puede estar vacío."
    };
  }

  // 1. Obtener métricas consolidadas y de la entidad activa
  const dataActual = obtenerMetricasCompletasDashboard(entidadSeleccionada);

  // 2. Construir el contexto numérico preciso para el LLM
  const contextoFinanciero = {
    entidadAnalizada: entidadSeleccionada || "Consolidado",
    kpis: dataActual.kpis,
    metricasBuffett: dataActual.metricasBuffett,
    resumenPorEntidad: dataActual.resumenEntidades,
    topCategoriasGastos: dataActual.categoriasGastos.slice(0, 6),
    compromisosProximos: dataActual.compromisos.filter(c => c.estado !== "PAGADO").slice(0, 5),
    cuotaWhatsApp: dataActual.cuotaWhatsApp
  };

  const esUsuarioIndividual = entidadSeleccionada !== "Consolidado" && entidadSeleccionada !== "Personal" && entidadSeleccionada !== "More Paper" && entidadSeleccionada !== "More Design";
  const directivaEntidades = esUsuarioIndividual
    ? `Estás analizando el control financiero individual y privado del usuario: '${entidadSeleccionada}'.`
    : `Manejas 3 entidades de Fernando:
1. 'Personal': Finanzas personales y familiares.
2. 'More Paper': Empresa de papelería, útiles e insumos.
3. 'More Design': Agencia de diseño gráfico, proyectos y branding.`;

  const systemInstruction = `Eres el Asesor Senior Tecnológico, de Ciberseguridad y Director Financiero de Inteligencia Artificial (CFO, Senior Tech & Security Copilot) de Fernando y su ecosistema en Colombia (Moneda: COP), sentado en la mesa directiva en igualdad de condiciones con tres grandes mesas globales:
1. Consejo Asesor Global (Negocios, Finanzas y Estrategia): Warren Buffett (Owner Earnings y Moats), Jamie Dimon (Fortress Balance Sheet), Larry Fink (Custodia Fiduciaria), Kristalina Georgieva (Estabilidad macro), Andy Jassy y Jeff Bezos (Frugalidad y Día 1), Ngozi Okonjo-Iweala (Suministros), Satya Nadella (Palanca de IA), Bernard Arnault y Philip Kotler (Pricing premium y mercadeo de alto valor), Joe Ucuzoglu, Mohamed Kande y Janet Truncale (Rigor forense Big-4).
2. Consejo Asesor de Tecnología e IA (11 Titanes de la Creación Digital): Sam Altman, Dario y Daniela Amodei (Seguridad Constitucional e Inteligencia Confiable), Demis Hassabis (Razonamiento profundo AGI), Yann LeCun (Modelos de mundo y código abierto), Mustafa Suleyman (UX empática y lenguaje natural), Jeff Dean (Sistemas de hiperescala), Jensen Huang y Lisa Su (Cómputo acelerado y microarquitectura), Arthur Mensch y Clément Delangue (Eficiencia MoE y ecosistema abierto).
3. Mesa Técnica de Ciberseguridad y Privacidad (8 Titanes de Defensa Digital): Jay Chaudhry (Zero Trust Nativo), Nikesh Arora (Plataformización defensiva), George Kurtz (Respuesta 1-10-60 y EDR), Ken Xie (Seguridad de red convergente), Eva Chen (Defensa multicapa ZDI), Matthew Prince (Edge security, WAF y anti-DDoS), Meredith Whittaker y Andy Yen (Privacidad absoluta, Zero-Access y soberanía de datos).
${directivaEntidades}

Tienes acceso en tiempo real a los siguientes datos financieros verificados de las hojas de Google Sheets:
${JSON.stringify(contextoFinanciero, null, 2)}

Tu misión:
- Responder a la consulta del usuario de forma ejecutiva, precisa y con mentalidad de optimización de flujo de caja y preservación de capital.
- Usar siempre formato de moneda colombiana (ej. $35.000 COP, $1.500.000 COP).
- Proporcionar recomendaciones accionables y señalar riesgos de liquidez o deudas próximas si aplican.
- Entregar un dictamen o consejo de alto impacto formulado con la sabiduría del Consejo Asesor Global.
- Detectar si la pregunta está enfocada en una entidad en particular para ajustar el visor del Canvas.

Debes responder OBLIGATORIAMENTE en formato JSON con la siguiente estructura exacta:
{
  "analisis": "Resumen ejecutivo directo respondiendo a la pregunta (máximo 3 párrafos concisos)",
  "puntosClave": [
    "Punto clave 1 con cifras exactas",
    "Punto clave 2 con métricas relevantes"
  ],
  "recomendaciones": [
    "Acción preventiva o estratégica sugerida 1",
    "Acción preventiva o estratégica sugerida 2"
  ],
  "consejoBuffett": "Dictamen o máxima financiera quirúrgica con la filosofía del Consejo Asesor Global adaptada a este escenario.",
  "entidadSugerida": "Consolidado | Personal | More Paper | More Design",
  "categoriaDestacada": "Nombre de la categoría principal analizada si aplica, o null"
}`;

  // 3. Consultar a Gemini API
  const apiKey = (typeof obtenerApiKeyGemini_ === "function") 
    ? obtenerApiKeyGemini_() 
    : ((typeof CONFIG_IA !== "undefined" && CONFIG_IA.GEMINI_API_KEY) 
        ? CONFIG_IA.GEMINI_API_KEY 
        : PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY") || "");

  if (apiKey) {
    try {
      const modelo = (typeof CONFIG_IA !== "undefined" && CONFIG_IA.MODELO_TEXTO) ? CONFIG_IA.MODELO_TEXTO : "gemini-2.0-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: `Consulta del usuario: "${promptTexto}"` }]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      };

      const response = UrlFetchApp.fetch(url, {
        method: "POST",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      if (response.getResponseCode() === 200) {
        const json = JSON.parse(response.getContentText());
        const candidates = json.candidates;
        if (candidates && candidates.length > 0) {
          const rawText = candidates[0].content.parts[0].text;
          const parsed = JSON.parse(rawText);
          return {
            ok: true,
            fuente: "Gemini 3.6 Flash & Triada de Consejos Globales (Business, Tech, AI & Cyber)",
            ...parsed
          };
        }
      } else {
        Logger.log(`Aviso Gemini API en Dashboard (${response.getResponseCode()}): ${response.getContentText()}`);
      }
    } catch (err) {
      Logger.log("Excepción llamando a Gemini en Dashboard: " + err.message);
    }
  }

  // 4. Fallback Heurístico Ejecutivo (en caso de que la red o cuota falle)
  return generarAnalisisHeuristicoDashboard_(promptTexto, contextoFinanciero);
}

/**
 * Motor heurístico inteligente de respaldo para el Dashboard con enfoque Warren Buffett
 */
function generarAnalisisHeuristicoDashboard_(promptTexto, ctx) {
  const p = promptTexto.toLowerCase();
  let entidad = ctx.entidadAnalizada;
  if (p.includes("paper")) entidad = "More Paper";
  else if (p.includes("design")) entidad = "More Design";
  else if (p.includes("personal")) entidad = "Personal";

  const k = ctx.kpis;
  const b = ctx.metricasBuffett || {};
  const formatoCOP = val => "$" + Number(val || 0).toLocaleString("es-CO") + " COP";

  return {
    ok: true,
    fuente: "Motor Heurístico Financiero & Warren Buffett Doctrine",
    analisis: `Para la vista de ${entidad}, el flujo neto del propietario (Owner Earnings) se sitúa en ${formatoCOP(k.flujoNeto)}, resultado de ${formatoCOP(k.totalIngresos)} en ingresos brutos frente a ${formatoCOP(k.totalGastos)} en egresos operativos. La cartera por cobrar suma ${formatoCOP(k.cuentasPorCobrar)} mientras que las obligaciones pendientes representan ${formatoCOP(k.cuentasPorPagar)}.`,
    puntosClave: [
      `Owner Earnings (Flujo Real): ${formatoCOP(k.flujoNeto)} (${k.tasaAhorroRentabilidad}% margen).`,
      `Fortaleza de Caja: ${b.runwayDias || 0} días de autonomía de efectivo.`,
      `Capital Atrapado en Calle: ${formatoCOP(k.cuentasPorCobrar)} pendientes de cobro.`
    ],
    recomendaciones: [
      k.cuentasPorPagar > k.flujoNeto 
        ? "Priorizar la gestión de cobro de cartera para evitar descalces de liquidez frente a deudas."
        : "Mantener la reserva operativa y programar los abonos anticipados a pasivos.",
      "Revisar las categorías de gasto de mayor ponderación para controlar fugas de capital y fortalecer el foso económico."
    ],
    consejoBuffett: b.dictamenBuffett || "No midas el éxito por la facturación bruta, sino por el efectivo neto que realmente entra a tu banco sin comprometer el capital de trabajo.",
    entidadSugerida: entidad,
    categoriaDestacada: ctx.topCategoriasGastos.length > 0 ? ctx.topCategoriasGastos[0].categoria : null
  };
}

// ============================================================================
// 3. ENRUTADOR DOGET AMPLIADO (API REST & SERVIDOR DE INTERFAZ HTML)
// ============================================================================

/**
 * Maneja solicitudes GET tanto para el Webhook de Meta, la API de datos JSON y la vista HTML
 */
function despacharSolicitudGetDashboard(e) {
  const params = e ? e.parameter : {};

  // Caso A: Verificación de Handshake con Meta WhatsApp Cloud API
  if (params["hub.mode"] === "subscribe") {
    return doGet(e);
  }

  const usuarioParam = (params.u || params.user || "").trim();
  const authParam = (params.auth || params.token || "").trim();

  // Validación de seguridad Zero-Trust: Detectar si es usuario externo o administrador
  let sesionUsuario = { valido: true, rol: "SUPER_ADMIN", entidad: "Consolidado", esSuperAdmin: true };
  const esSolicitudExterna = Boolean(usuarioParam && usuarioParam.toLowerCase() !== "admin" && usuarioParam.toLowerCase() !== "consolidado");

  if (esSolicitudExterna) {
    sesionUsuario = (typeof validarTokenMagicLink === "function")
      ? validarTokenMagicLink(usuarioParam, authParam)
      : { valido: false, motivo: "MODULO_SEGURIDAD_NO_DISPONIBLE" };

    if (!sesionUsuario.valido) {
      if (params.action === "getDashboardData" || params.action === "processPrompt") {
        return ContentService.createTextOutput(JSON.stringify({
          ok: false,
          error: "Acceso denegado: Token de Magic Link no válido o expirado.",
          motivo: sesionUsuario.motivo
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return HtmlService.createHtmlOutput(
          "<div style='background:#060913;color:#f8fafc;font-family:sans-serif;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;'>" +
          "<div style='font-size:48px;margin-bottom:16px;'>🔒</div>" +
          "<h2 style='color:#f43f5e;margin-bottom:8px;'>Acceso Privado Restringido</h2>" +
          "<p style='color:#94a3b8;max-width:400px;line-height:1.5;'>El enlace de acceso no es válido o ha expirado. Por favor, solicita un nuevo enlace personal directamente a tu asistente en WhatsApp escribiendo: <strong>'Dame mi link'</strong>.</p>" +
          "</div>"
        ).setTitle("Acceso Restringido | Antigravity");
      }
    }
  } else {
    // Si no es usuario externo, verificar si se configuró un token estricto en ScriptProperties
    const tokenConfigurado = PropertiesService.getScriptProperties().getProperty("DASHBOARD_ACCESS_TOKEN");
    if (tokenConfigurado && authParam !== tokenConfigurado) {
      if (params.action === "getDashboardData" || params.action === "processPrompt") {
        return ContentService.createTextOutput(JSON.stringify({
          ok: false,
          error: "Acceso no autorizado al Dashboard. Token de acceso administrativo requerido."
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
  }

  // Caso B: API REST para alimentar el Canvas en tiempo real (JSON)
  if (params.action === "getDashboardData") {
    let entidad = (params.entidad || "Consolidado").trim();
    if (esSolicitudExterna) {
      // Blindaje BOLA/IDOR: El usuario externo SOLO puede consultar su propia entidad
      entidad = sesionUsuario.entidad;
    }
    const usuariosUniversalParam = params.usuarios || params.users || null;
    const data = obtenerMetricasCompletasDashboard(entidad, usuariosUniversalParam);
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Caso C: API REST para procesar Prompts analíticos del Copiloto (JSON)
  if (params.action === "processPrompt") {
    const prompt = params.prompt || "";
    let entidad = (params.entidad || "Consolidado").trim();
    if (esSolicitudExterna) {
      // Blindaje: El copiloto de IA solo tiene acceso a la entidad del usuario
      entidad = sesionUsuario.entidad;
    }
    const reporte = procesarPromptDashboard(prompt, entidad);
    return ContentService.createTextOutput(JSON.stringify(reporte))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Caso D: Vista Principal del Dashboard ("Prompt & Canvas") en pantalla completa
  let template = null;
  const nombresPosibles = ["DashboardView", "fase4_dashboard_canvas", "DashboardView.html", "dashboardview"];
  let nombreArchivoCargado = null;
  let errorCargaTemplate = null;

  for (let i = 0; i < nombresPosibles.length; i++) {
    try {
      template = HtmlService.createTemplateFromFile(nombresPosibles[i]);
      nombreArchivoCargado = nombresPosibles[i];
      break;
    } catch (eArch) {
      errorCargaTemplate = eArch;
    }
  }

  if (!template) {
    return ContentService.createTextOutput(JSON.stringify({
      estado: "ERROR_ARCHIVO_HTML_NO_ENCONTRADO",
      mensaje: "No se encontró el archivo HTML en Google Apps Script. Por favor asegúrate de que en el menú lateral de Apps Script exista un archivo de tipo HTML llamado exactamente 'DashboardView'.",
      archivos_intentados: nombresPosibles,
      error_tecnico: errorCargaTemplate ? errorCargaTemplate.message : "Archivo no encontrado",
      instruccion: "En Apps Script haz clic en '+' > HTML, nómbralo 'DashboardView', pega el contenido de fase4_dashboard_canvas.html y guarda.",
      kpis: obtenerMetricasCompletasDashboard(esSolicitudExterna ? sesionUsuario.entidad : "Consolidado").kpis
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const entidadCargaInicial = esSolicitudExterna ? sesionUsuario.entidad : "Consolidado";
    template.esUsuarioExterno = esSolicitudExterna;
    template.entidadUsuario = entidadCargaInicial;
    template.authToken = authParam;

    // Inyección de métricas iniciales podadas según el rol del usuario (cero latencia)
    try {
      const dataInicial = obtenerMetricasCompletasDashboard(entidadCargaInicial);
      template.datosInicialesJSON = JSON.stringify(dataInicial);
    } catch (eInit) {
      Logger.log("Aviso pre-cargando datos en " + nombreArchivoCargado + ": " + eInit.message);
      template.datosInicialesJSON = "null";
    }

    const tituloApp = esSolicitudExterna 
      ? `Antigravity Finanzas | Espacio Personal de ${entidadCargaInicial}` 
      : "Antigravity Finanzas | Prompt & Canvas Dashboard";

    return template.evaluate()
      .setTitle(tituloApp)
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (errEval) {
    Logger.log("Error evaluando template HTML (" + nombreArchivoCargado + "): " + errEval.message);
    return ContentService.createTextOutput(JSON.stringify({
      estado: "ERROR_EVALUACION_HTML",
      mensaje: "El archivo HTML '" + nombreArchivoCargado + "' fue localizado, pero ocurrió un error al evaluar sus variables internas.",
      error_tecnico: errEval.message,
      pila: errEval.stack || "",
      kpis: obtenerMetricasCompletasDashboard(esSolicitudExterna ? sesionUsuario.entidad : "Consolidado").kpis
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

