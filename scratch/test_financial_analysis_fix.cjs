// Test standalone of the CFO intent detection and formatting
function detectarSolicitudInformeCFO_(texto) {
  if (!texto) return false;
  const t = String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // Descartar si solo está reportando una transacción puntual (ej: "reporté venta", "reportar gasto", "reporto pago")
  if (/(?:reportar|reporto|reporte)\s+(?:de\s+)?(?:gasto|compra|venta|ingreso|pago)/i.test(t) && !/(?:pdf|dossier|completo|gerencial|imprimible)/i.test(t)) {
    return false;
  }

  const palabrasClave = /(?:\binformes?\b|\breportes?\b|\bdossiers?\b|\binfograf[ií]as?\b|\bpdfs?\b|\bbalance(?:\s+imprimible|\s+general)?\b|\bestados?\s+financieros?\b|\banalisis\b|\bdiagnosticos?\s+financieros?\b|\bsituacion\s+financiera\b|\bestado\s+de\s+resultados\b|\bestado\s+(?:de\s+)?cuenta\b|\bflujo\s+de\s+caja\b|\bp&l\b|\bresumen\s+ejecutivo\b|\bgenerar\s+documento\b|\bdescargar\s+informe\b|\bimprimir\s+informe\b|\bgenerar\s+informe\b|\bdam[ee]\s+(?:un\s+)?(?:informe|reporte|analisis|balance|diagnostico|resumen)\b|\bquiero\s+(?:un\s+)?(?:informe|reporte|analisis|balance|diagnostico|resumen)\b|\bhazme\s+(?:un\s+)?(?:informe|reporte|analisis|balance|diagnostico|resumen)\b|\bnecesito\s+(?:el|un)\s+(?:informe|reporte|dossier|analisis|balance|diagnostico|resumen)\b)/i;
  return palabrasClave.test(t);
}

function formatearInformeFlashConPersonaje_(informe, perm, periodo) {
  const perfil = perm?.perfilVoz || (perm?.rol === "SUPER_ADMIN" ? "DEADPOOL" : "FEMENINO_DULCE");
  const def = {
    alias: "Deadpool",
    nombreOficial: "Deadpool (Wade Wilson)",
    titulo: "Mercenario Contable & Auditor Irreverente",
    emoji: "⚔️",
    iconoAccion: "🌮",
    lema: "Máxima precisión contable con chimichangas de ganancia y cero aburrimiento."
  };

  const nombre = perm?.nombre || "Fernando";
  const datos = informe.datosConsolidados;
  const fcl = informe.flujoCaja;
  const diag = informe.diagnostico;

  let saludoPersonaje = `⚔️ ¡Hola, ${nombre}! Wade Wilson reportándose. Katanas enfundadas y números afilados al centavo. Aquí tienes tu análisis financiero en tiempo real, sin dramas ni aburrimiento:`;

  const cuerpo = [
    `${def.emoji} *ANÁLISIS FINANCIERO EJECUTIVO | ${def.nombreOficial.toUpperCase()}*`,
    `🗓️ _Corte: ${datos?.periodo || periodo}_`,
    ``,
    saludoPersonaje,
    ``,
    `🏦 *DISPONIBILIDAD BANCARIA (BANCOLOMBIA):*`,
    `• 💳 *Negocios (***7194 - Común):* *$${(datos?.saldosBancarios?.cuenta7194_negocios || 0).toLocaleString("es-CO")} COP*`,
    `   └ More Paper: $${(datos?.unidades?.morePaper?.disponible || 0).toLocaleString("es-CO")} | More Design: $${(datos?.unidades?.moreDesign?.disponible || 0).toLocaleString("es-CO")}`,
    `• 💳 *Personal (***2103):* *$${(datos?.saldosBancarios?.cuenta2103_personal || 0).toLocaleString("es-CO")} COP*`,
    `• 💰 *Total Disponible en Bóveda:* *$${(datos?.saldosBancarios?.totalConsolidado || 0).toLocaleString("es-CO")} COP*`,
    ``,
    `📈 *DESEMPEÑO Y RENTABILIDAD POR LOCAL:*`,
    `• 🏢 *More Paper:* Ingresos: $${(datos?.unidades?.morePaper?.ingresos || 0).toLocaleString("es-CO")} | Margen: *${datos?.unidades?.morePaper?.margenPct || 0}%*`,
    `• 🎨 *More Design:* Ingresos: $${(datos?.unidades?.moreDesign?.ingresos || 0).toLocaleString("es-CO")} | Margen: *${datos?.unidades?.moreDesign?.margenPct || 0}%*`,
    (datos?.nominaGlobal?.total > 0 ? `• 👥 *Nómina Global Centralizada:* -$${datos.nominaGlobal.total.toLocaleString("es-CO")} COP\n` : ""),
    `⚖️ *DIAGNÓSTICO CFO & FLUJO LIBRE:*`,
    `• Estado de Salud: *${fcl?.estadoSalud || "ÓPTIMO"}*`,
    `• Retiro Seguro hacia Personal (***2103): *$${(fcl?.fclDistribuibleRecomendado || 0).toLocaleString("es-CO")} COP*`,
    `• _Dictamen:_ ${fcl?.advertenciaRetiro || "Liquidez sólida para retiros patrimoniales."}`,
    ``,
    `🎯 *RECOMENDACIONES CLAVE:*`,
    ...(diag?.recomendacionesEstrategicas || []).slice(0, 3).map((r, i) => `${i + 1}. ${r}`),
    ``,
    `_${def.iconoAccion} «${def.lema}»_`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━`,
    `📥 *¿Deseas descargar el documento oficial o la tarjeta gráfica?*`,
    `• Responde *PDF* para compilar el **Dossier Gerencial en PDF** (listo para imprimir).`,
    `• Responde *INFOGRAFÍA* para generar la **Ficha Visual en Alta Resolución**.`
  ].filter(Boolean).join("\n");

  return cuerpo;
}

const fakeInforme = {
  datosConsolidados: {
    periodo: "Mes en curso (Octubre 2026)",
    saldosBancarios: {
      cuenta7194_negocios: 15420000,
      cuenta2103_personal: 4850000,
      totalConsolidado: 20270000
    },
    unidades: {
      morePaper: { ingresos: 12500000, disponible: 8200000, margenPct: 42 },
      moreDesign: { ingresos: 9800000, disponible: 7220000, margenPct: 48 }
    },
    nominaGlobal: { total: 3500000 }
  },
  flujoCaja: {
    estadoSalud: "ÓPTIMO",
    fclDistribuibleRecomendado: 4200000,
    advertenciaRetiro: "Caja común robusta. Puedes transferir hasta $4.200.000 COP a tu cuenta personal con total seguridad."
  },
  diagnostico: {
    recomendacionesEstrategicas: [
      "Preservar reserva de capital de trabajo en cuenta 7194 para compras anticipadas.",
      "Aprovechar descuentos de insumos de papelería al por mayor.",
      "Programar pagos de retención en la fuente DIAN."
    ]
  }
};

const userPrompt = "quiero un analisis de la información financiera";
const match = detectarSolicitudInformeCFO_(userPrompt);
console.log("Matched prompt:", match);
if (match) {
  const resultText = formatearInformeFlashConPersonaje_(fakeInforme, { perfilVoz: "DEADPOOL", nombre: "Fernando", rol: "SUPER_ADMIN" }, "Mes en curso");
  console.log("--- RESULT TEXT ---");
  console.log(resultText);
}
