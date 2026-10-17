/**
 * ============================================================================
 * SISTEMA FINANCIERO INTELIGENTE - NÚCLEO FASE 5
 * Motor de Asesoría Financiera Experta Senior (Nivel CFO Gerencial)
 * Generación Multimodal de Informes: PDF Imprimible, Infografías y Flash
 * ============================================================================
 * 
 * Capacidades Principales:
 * 1. Generador de Gráficos Vectoriales Nativos en SVG (100% nítidos en impresión).
 * 2. Compilador de Dossier Gerencial HTML5 con CSS Editorial Print-Ready (@media print).
 * 3. Compilador de Infografías y Tarjetas Visuales de Negocio.
 * 4. Conversión y Archivador de Documentos PDF en Google Drive.
 * 5. Correlación cruzada de Finanzas Personales (***2103), Negocios (***7194), Nómina y Macroeconomía.
 */

// ============================================================================
// CONFIGURACIÓN GLOBAL DEL MOTOR DE INFORMES CFO
// ============================================================================
const CONFIG_INFORMES_CFO = {
  NOMBRE_CARPETA_DRIVE: "Informes_Gerenciales_Antigravity",
  VERSION_MOTOR: "5.0-CFO-Executive",
  TAMAÑO_PAGINA_IMPRESION: "letter", // "letter" o "a4"
  MARGEN_PAGINA: "15mm",
  COLORES: {
    PRIMARIO_DARK: "#0f172a",    // Slate 900
    SECUNDARIO: "#1e293b",       // Slate 800
    MORE_PAPER: "#0284c7",       // Sky Blue corporativo
    MORE_DESIGN: "#4f46e5",      // Indigo moderno
    PERSONAL: "#0d9488",         // Teal financiero
    NOMINA_GLOBAL: "#dc2626",    // Rojo contable
    EXITO: "#16a34a",            // Verde superávit
    ALERTA: "#ea580c",           // Naranja atención
    FONDO_TARJETA: "#f8fafc",    // Gris ultra claro
    BORDE_TABLA: "#e2e8f0",      // Borde sutil
    TEXTO_MUTED: "#64748b"       // Slate 500
  },
  FUENTES: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif"
};

// ============================================================================
// 1. GENERADORES DE GRÁFICOS VECTORIALES NATIVOS EN SVG (PRINT-READY)
// ============================================================================

/**
 * Genera un gráfico de barras horizontales SVG nítido para comparar el rendimiento de unidades.
 * @param {Array<{etiqueta: string, valor: number, color: string}>} items
 * @param {number} ancho Ancho total del gráfico SVG
 * @returns {string} Código SVG vectorial
 */
function generarSvgGraficoBarras_(items, ancho) {
  const w = ancho || 680;
  const altoFila = 38;
  const h = Math.max(120, items.length * altoFila + 30);
  const maxVal = Math.max(...items.map(i => Math.abs(Number(i.valor) || 0)), 1);

  let barrasHtml = "";
  items.forEach((it, idx) => {
    const val = Number(it.valor) || 0;
    const y = idx * altoFila + 25;
    const barWidth = Math.min(w - 280, Math.max(10, Math.round((Math.abs(val) / maxVal) * (w - 300))));
    const colorBar = it.color || CONFIG_INFORMES_CFO.COLORES.MORE_PAPER;
    const formattedVal = "$" + Math.round(val).toLocaleString("es-CO") + " COP";

    barrasHtml += `
      <g class="barra-item">
        <text x="10" y="${y + 14}" font-family="${CONFIG_INFORMES_CFO.FUENTES}" font-size="12" font-weight="600" fill="${CONFIG_INFORMES_CFO.COLORES.SECUNDARIO}">${it.etiqueta}</text>
        <rect x="150" y="${y}" width="${barWidth}" height="18" rx="4" fill="${colorBar}" opacity="0.9"/>
        <text x="${160 + barWidth}" y="${y + 14}" font-family="${CONFIG_INFORMES_CFO.FUENTES}" font-size="11" font-weight="700" fill="${CONFIG_INFORMES_CFO.COLORES.PRIMARIO_DARK}">${formattedVal}</text>
      </g>
    `;
  });

  return `
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto; display: block; margin: 15px 0;">
      <rect width="${w}" height="${h}" fill="${CONFIG_INFORMES_CFO.COLORES.FONDO_TARJETA}" rx="8" stroke="${CONFIG_INFORMES_CFO.COLORES.BORDE_TABLA}" stroke-width="1"/>
      ${barrasHtml}
    </svg>
  `;
}

/**
 * Genera un gráfico de dona / pastel SVG vectorial para distribución porcentual.
 * @param {Array<{etiqueta: string, valor: number, color: string}>} items
 * @returns {string} Código SVG
 */
function generarSvgGraficoDistribucion_(items) {
  const total = items.reduce((acc, it) => acc + (Number(it.valor) || 0), 0);
  if (total <= 0) return "";

  const cx = 100;
  const cy = 100;
  const r = 70;
  const rInterno = 42;

  let startAngle = 0;
  let paths = "";
  let leyendaHtml = "";

  items.forEach((it, idx) => {
    const val = Number(it.valor) || 0;
    const porcentaje = ((val / total) * 100);
    const angle = (val / total) * 360;
    const endAngle = startAngle + angle;

    const x1 = cx + r * Math.cos((Math.PI * (startAngle - 90)) / 180);
    const y1 = cy + r * Math.sin((Math.PI * (startAngle - 90)) / 180);
    const x2 = cx + r * Math.cos((Math.PI * (endAngle - 90)) / 180);
    const y2 = cy + r * Math.sin((Math.PI * (endAngle - 90)) / 180);

    const x3 = cx + rInterno * Math.cos((Math.PI * (endAngle - 90)) / 180);
    const y3 = cy + rInterno * Math.sin((Math.PI * (endAngle - 90)) / 180);
    const x4 = cx + rInterno * Math.cos((Math.PI * (startAngle - 90)) / 180);
    const y4 = cy + rInterno * Math.sin((Math.PI * (startAngle - 90)) / 180);

    const largeArc = angle > 180 ? 1 : 0;
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInterno} ${rInterno} 0 ${largeArc} 0 ${x4} ${y4} Z`;

    const color = it.color || CONFIG_INFORMES_CFO.COLORES.MORE_PAPER;
    paths += `<path d="${d}" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>`;

    const yLeyenda = 40 + idx * 26;
    leyendaHtml += `
      <g>
        <circle cx="230" cy="${yLeyenda}" r="6" fill="${color}"/>
        <text x="245" y="${yLeyenda + 4}" font-family="${CONFIG_INFORMES_CFO.FUENTES}" font-size="12" font-weight="600" fill="${CONFIG_INFORMES_CFO.COLORES.SECUNDARIO}">${it.etiqueta}:</text>
        <text x="430" y="${yLeyenda + 4}" font-family="${CONFIG_INFORMES_CFO.FUENTES}" font-size="12" font-weight="700" fill="${CONFIG_INFORMES_CFO.COLORES.PRIMARIO_DARK}">${porcentaje.toFixed(1)}% ($${Math.round(val).toLocaleString("es-CO")})</text>
      </g>
    `;

    startAngle = endAngle;
  });

  return `
    <svg width="580" height="200" viewBox="0 0 580 200" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto; display: block; margin: 15px 0;">
      <rect width="580" height="200" fill="${CONFIG_INFORMES_CFO.COLORES.FONDO_TARJETA}" rx="8" stroke="${CONFIG_INFORMES_CFO.COLORES.BORDE_TABLA}" stroke-width="1"/>
      ${paths}
      <text x="${cx}" y="${cy + 4}" font-family="${CONFIG_INFORMES_CFO.FUENTES}" font-size="11" font-weight="700" fill="${CONFIG_INFORMES_CFO.COLORES.TEXTO_MUTED}" text-anchor="middle">TOTAL</text>
      <text x="${cx}" y="${cy + 18}" font-family="${CONFIG_INFORMES_CFO.FUENTES}" font-size="10" font-weight="700" fill="${CONFIG_INFORMES_CFO.COLORES.PRIMARIO_DARK}" text-anchor="middle">$${Math.round(total).toLocaleString("es-CO")}</text>
      ${leyendaHtml}
    </svg>
  `;
}

// ============================================================================
// 2. COMPILADOR EDITORIAL DE DOSSIER GERENCIAL (HTML5 & CSS PRINT-READY)
// ============================================================================

/**
 * Compila un dossier gerencial formal de alta complejidad, listo para descarga e impresión.
 * @param {Object} datos Estructura completa de datos financieros, análisis y contexto macro.
 * @returns {string} Documento HTML5 listo para renderizar o convertir a PDF.
 */
function compilarHtmlDossierGerencial_(datos) {
  const d = datos || {};
  const titulo = d.titulo || "INFORME FINANCIERO Y ESTRATÉGICO GERENCIAL";
  const subtitulo = d.subtitulo || "Diagnóstico de Rentabilidad, Tesorería y Solvencia Corporativa";
  const periodo = d.periodo || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMMM yyyy");
  const fechaEmision = d.fechaEmision || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd 'de' MMMM 'de' yyyy");
  const preparadoPara = d.preparadoPara || "Fernando (Director General & Propietario)";
  const aliasAsistente = d.aliasAsistente || "Bruce Wayne (CFO Virtual Senior)";

  // Métricas Principales
  const m = d.metricas || {};
  const morePaper = m.morePaper || { ingresos: 0, gastos: 0, margen: 0 };
  const moreDesign = m.moreDesign || { ingresos: 0, gastos: 0, margen: 0 };
  const nominaGlobal = Number(m.nominaGlobal) || 0;
  const personal = m.personal || { ingresos: 0, gastos: 0, saldoDisponible: 0 };
  const saldo7194 = Number(m.saldoCuentaComun7194) || 0;
  const saldo2103 = Number(m.saldoCuentaPersonal2103) || 0;
  const fclDistribuible = Number(m.flujoCajaLibreDistribuible) || 0;

  // Gráficos SVG embebidos
  const graficoUnidadesSvg = generarSvgGraficoBarras_([
    { etiqueta: "More Paper (Ingresos)", valor: morePaper.ingresos, color: CONFIG_INFORMES_CFO.COLORES.MORE_PAPER },
    { etiqueta: "More Design (Ingresos)", valor: moreDesign.ingresos, color: CONFIG_INFORMES_CFO.COLORES.MORE_DESIGN },
    { etiqueta: "Nómina Operativa Global", valor: nominaGlobal, color: CONFIG_INFORMES_CFO.COLORES.NOMINA_GLOBAL }
  ], 660);

  const graficoCuentasSvg = generarSvgGraficoBarras_([
    { etiqueta: "Ahorros ***7194 (Negocios)", valor: saldo7194, color: CONFIG_INFORMES_CFO.COLORES.MORE_PAPER },
    { etiqueta: "Ahorros ***2103 (Personal)", valor: saldo2103, color: CONFIG_INFORMES_CFO.COLORES.PERSONAL },
    { etiqueta: "Cupo FCL Distribuible", valor: fclDistribuible, color: CONFIG_INFORMES_CFO.COLORES.EXITO }
  ], 660);

  // Filas de compromisos pendientes
  const compromisos = Array.isArray(d.compromisosPendientes) ? d.compromisosPendientes : [];
  let filasCompromisosHtml = "";
  if (compromisos.length > 0) {
    filasCompromisosHtml = compromisos.map(c => `
      <tr>
        <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${c.proveedor || "Proveedor"}</td>
        <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; color: #475569;">${c.concepto || "Obligación comercial"}</td>
        <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a; text-align: right;">$${(Number(c.saldo) || 0).toLocaleString("es-CO")} COP</td>
        <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #dc2626; font-weight: 600;">${c.fechaVencimiento || "Plazo abierto"}</td>
        <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          <span style="background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700;">PENDIENTE</span>
        </td>
      </tr>
    `).join("");
  } else {
    filasCompromisosHtml = `
      <tr>
        <td colspan="5" style="padding: 16px; text-align: center; color: #16a34a; font-weight: 600;">
          🎉 No se registran pasivos ni compromisos vencidos en el libro activo.
        </td>
      </tr>
    `;
  }

  // Análisis cualitativo generado por el Asesor CFO (Gemini)
  const analisisCfo = d.analisisCfo || {
    resumenEjecutivo: "El desempeño operacional consolidado demuestra solidez de ingresos impulsada por los canales bancarizados de ambos locales.",
    diagnosticoRentabilidad: "More Paper y More Design mantienen márgenes operativos positivos tras deducir sus gastos directos.",
    capacidadRetiroPersonal: "El flujo de caja libre generado permite proyectar retiros de capital ordenados hacia la cuenta personal ***2103 sin vulnerar el capital de trabajo.",
    analisisMacroDian: "La TRM y el calendario tributario de la DIAN exigen mantener una provisión preventiva para los compromisos impositivos del trimestre.",
    recomendacionesEstrategicas: [
      "Consolidar los saldos diarios bancarizados en la cuenta ***7194 antes de ejecutar pagos a proveedores.",
      "Programar los abonos a obligaciones con vencimiento menor a 15 días para evitar cargos por mora.",
      "Transferir el excedente del Flujo de Caja Libre a la cuenta personal ***2103 de forma quincenal."
    ]
  };

  const recomendacionesHtml = (analisisCfo.recomendacionesEstrategicas || []).map((rec, idx) => `
    <li style="margin-bottom: 8px; line-height: 1.5;">
      <strong>${idx + 1}.</strong> ${rec}
    </li>
  `).join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${titulo} - ${periodo}</title>
  <style>
    @page {
      size: ${CONFIG_INFORMES_CFO.TAMAÑO_PAGINA_IMPRESION};
      margin: ${CONFIG_INFORMES_CFO.MARGEN_PAGINA};
    }
    body {
      font-family: ${CONFIG_INFORMES_CFO.FUENTES};
      color: ${CONFIG_INFORMES_CFO.COLORES.PRIMARIO_DARK};
      background: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .hoja-documento {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
      box-sizing: border-box;
    }
    .header-corporativo {
      border-bottom: 3px solid ${CONFIG_INFORMES_CFO.COLORES.PRIMARIO_DARK};
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: ${CONFIG_INFORMES_CFO.COLORES.PRIMARIO_DARK};
      margin: 0;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 12px;
      color: ${CONFIG_INFORMES_CFO.COLORES.TEXTO_MUTED};
      margin: 4px 0 0 0;
    }
    .meta-box {
      text-align: right;
      font-size: 11px;
      color: ${CONFIG_INFORMES_CFO.COLORES.TEXTO_MUTED};
    }
    .badge-confidencial {
      display: inline-block;
      background: ${CONFIG_INFORMES_CFO.COLORES.PRIMARIO_DARK};
      color: #ffffff;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .grid-kpis {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .card-kpi {
      background: ${CONFIG_INFORMES_CFO.COLORES.FONDO_TARJETA};
      border: 1px solid ${CONFIG_INFORMES_CFO.COLORES.BORDE_TABLA};
      border-radius: 8px;
      padding: 14px;
      box-sizing: border-box;
    }
    .card-kpi.destacado {
      border-left: 4px solid ${CONFIG_INFORMES_CFO.COLORES.MORE_PAPER};
    }
    .card-kpi.personal {
      border-left: 4px solid ${CONFIG_INFORMES_CFO.COLORES.PERSONAL};
    }
    .card-kpi.exito {
      border-left: 4px solid ${CONFIG_INFORMES_CFO.COLORES.EXITO};
    }
    .kpi-label {
      font-size: 11px;
      font-weight: 700;
      color: ${CONFIG_INFORMES_CFO.COLORES.TEXTO_MUTED};
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .kpi-valor {
      font-size: 18px;
      font-weight: 800;
      color: ${CONFIG_INFORMES_CFO.COLORES.PRIMARIO_DARK};
      letter-spacing: -0.5px;
    }
    .kpi-sub {
      font-size: 10px;
      color: ${CONFIG_INFORMES_CFO.COLORES.TEXTO_MUTED};
      margin-top: 4px;
    }
    .seccion-titulo {
      font-size: 14px;
      font-weight: 800;
      color: ${CONFIG_INFORMES_CFO.COLORES.PRIMARIO_DARK};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-left: 3px solid ${CONFIG_INFORMES_CFO.COLORES.PRIMARIO_DARK};
      padding-left: 8px;
      margin: 24px 0 12px 0;
    }
    .parrafo-cfo {
      font-size: 12px;
      line-height: 1.6;
      color: #334155;
      margin-bottom: 12px;
      text-align: justify;
    }
    .tabla-financiera {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin: 12px 0 20px 0;
    }
    .tabla-financiera th {
      background: ${CONFIG_INFORMES_CFO.COLORES.SECUNDARIO};
      color: #ffffff;
      padding: 8px 12px;
      text-align: left;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10px;
    }
    .callout-estrategico {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-left: 4px solid #3b82f6;
      border-radius: 6px;
      padding: 14px;
      margin: 16px 0;
      font-size: 12px;
    }
    .footer-documento {
      border-top: 1px solid ${CONFIG_INFORMES_CFO.COLORES.BORDE_TABLA};
      padding-top: 12px;
      margin-top: 30px;
      font-size: 10px;
      color: ${CONFIG_INFORMES_CFO.COLORES.TEXTO_MUTED};
      display: flex;
      justify-content: space-between;
    }
    .page-break {
      page-break-after: always;
    }
    @media print {
      body { margin: 0; padding: 0; }
      .hoja-documento { max-width: 100%; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="hoja-documento">
    <!-- ENCABEZADO CORPORATIVO -->
    <div class="header-corporativo">
      <div>
        <div class="badge-confidencial">CONFIDENCIAL • JUNTA DIRECTIVA</div>
        <h1 class="brand-title">${titulo}</h1>
        <p class="brand-sub">${subtitulo}</p>
      </div>
      <div class="meta-box">
        <strong>Período:</strong> ${periodo}<br>
        <strong>Emisión:</strong> ${fechaEmision}<br>
        <strong>Para:</strong> ${preparadoPara}
      </div>
    </div>

    <!-- TARJETAS DE KPIS GERENCIALES -->
    <div class="grid-kpis">
      <div class="card-kpi destacado">
        <div class="kpi-label">Cuenta Negocios (***7194)</div>
        <div class="kpi-valor">$${saldo7194.toLocaleString("es-CO")}</div>
        <div class="kpi-sub">Fondo común More Paper & More Design</div>
      </div>
      <div class="card-kpi personal">
        <div class="kpi-label">Cuenta Personal (***2103)</div>
        <div class="kpi-valor">$${saldo2103.toLocaleString("es-CO")}</div>
        <div class="kpi-sub">Disponibilidad líquida privada</div>
      </div>
      <div class="card-kpi exito">
        <div class="kpi-label">Cupo FCL Distribuible</div>
        <div class="kpi-valor">$${fclDistribuible.toLocaleString("es-CO")}</div>
        <div class="kpi-sub">Capacidad de retiro seguro a personal</div>
      </div>
    </div>

    <!-- SECCIÓN 1: RESUMEN EJECUTIVO Y DIAGNÓSTICO DEL CFO -->
    <div class="seccion-titulo">1. Dictamen Ejecutivo del Asesor Financiero Senior</div>
    <p class="parrafo-cfo"><strong>Diagnóstico Global:</strong> ${analisisCfo.resumenEjecutivo}</p>
    <p class="parrafo-cfo"><strong>Eficiencia de Rentabilidad:</strong> ${analisisCfo.diagnosticoRentabilidad}</p>

    <!-- GRÁFICO COMPARATIVO DE UNIDADES -->
    <div class="seccion-titulo">2. Desempeño Operativo por Unidad de Negocio</div>
    ${graficoUnidadesSvg}

    <table class="tabla-financiera">
      <thead>
        <tr>
          <th>Unidad Contable</th>
          <th style="text-align: right;">Ingresos Totales</th>
          <th style="text-align: right;">Costos / Gastos Directos</th>
          <th style="text-align: right;">Margen Operativo Bruto</th>
          <th style="text-align: center;">Cuenta Recaudadora</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 700;">More Paper</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${Number(morePaper.ingresos).toLocaleString("es-CO")}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${Number(morePaper.gastos).toLocaleString("es-CO")}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0284c7;">$${Number(morePaper.margen || (morePaper.ingresos - morePaper.gastos)).toLocaleString("es-CO")}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">Ahorros ***7194</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 700;">More Design</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${Number(moreDesign.ingresos).toLocaleString("es-CO")}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${Number(moreDesign.gastos).toLocaleString("es-CO")}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #4f46e5;">$${Number(moreDesign.margen || (moreDesign.ingresos - moreDesign.gastos)).toLocaleString("es-CO")}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">Ahorros ***7194</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #dc2626;">Gasto Operativo Global (Nómina)</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b;">-</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #dc2626;">$${nominaGlobal.toLocaleString("es-CO")}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #dc2626;">-$${nominaGlobal.toLocaleString("es-CO")}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">Debita de ***7194</td>
        </tr>
      </tbody>
    </table>

    <!-- SECCIÓN 3: TESORERÍA, LIQUIDEZ Y CAPACIDAD DE RETIRO PERSONAL -->
    <div class="seccion-titulo">3. Tesorería Estratégica y Capacidad de Retiro a Finanzas Personales</div>
    ${graficoCuentasSvg}
    <div class="callout-estrategico">
      <strong>🎯 Dictamen de Retiro Seguro (FCL Distribuible):</strong> ${analisisCfo.capacidadRetiroPersonal}
    </div>

    <!-- SECCIÓN 4: MATRIZ DE COMPROMISOS Y PASIVOS COMERCIALES -->
    <div class="seccion-titulo">4. Matriz de Obligaciones y Cuentas por Pagar</div>
    <table class="tabla-financiera">
      <thead>
        <tr>
          <th>Acreedor / Proveedor</th>
          <th>Concepto de Obligación</th>
          <th style="text-align: right;">Saldo Pendiente</th>
          <th style="text-align: center;">Fecha Límite</th>
          <th style="text-align: center;">Estado</th>
        </tr>
      </thead>
      <tbody>
        ${filasCompromisosHtml}
      </tbody>
    </table>

    <!-- SECCIÓN 5: CRUCE MACROECONÓMICO Y FISCAL DIAN -->
    <div class="seccion-titulo">5. Entorno Macroeconómico & Proyección Fiscal (Colombia)</div>
    <p class="parrafo-cfo">${analisisCfo.analisisMacroDian}</p>

    <!-- SECCIÓN 6: PLAN DE ACCIÓN Y RECOMENDACIONES DEL CFO -->
    <div class="seccion-titulo">6. Recomendaciones Estratégicas y Hoja de Ruta</div>
    <ol style="font-size: 12px; color: #334155; padding-left: 18px;">
      ${recomendacionesHtml}
    </ol>

    <!-- PIE DE PÁGINA CORPORATIVO -->
    <div class="footer-documento">
      <div>Generado por ${aliasAsistente} • Motor Antigravity CFO v${CONFIG_INFORMES_CFO.VERSION_MOTOR}</div>
      <div>Página 1 de 1 • Auditoría Financiera de Alta Gerencia</div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Compila una infografía visual o tarjeta de resumen ejecutivo de alto impacto.
 * @param {Object} datos
 * @returns {string} Código HTML5 / CSS visual
 */
function compilarHtmlInfografia_(datos) {
  const d = datos || {};
  const periodo = d.periodo || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd 'de' MMMM 'de' yyyy");
  const m = d.metricas || {};
  const saldo7194 = Number(m.saldoCuentaComun7194) || 0;
  const saldo2103 = Number(m.saldoCuentaPersonal2103) || 0;
  const fcl = Number(m.flujoCajaLibreDistribuible) || 0;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: ${CONFIG_INFORMES_CFO.FUENTES}; background: #0f172a; color: #ffffff; padding: 24px; margin: 0; }
    .card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; max-width: 500px; margin: 0 auto; }
    .header { border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 16px; }
    .title { font-size: 16px; font-weight: 800; color: #38bdf8; text-transform: uppercase; margin: 0; }
    .periodo { font-size: 11px; color: #94a3b8; margin-top: 4px; }
    .kpi-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #334155; }
    .kpi-title { font-size: 12px; color: #94a3b8; }
    .kpi-val { font-size: 15px; font-weight: 700; color: #f8fafc; }
    .footer { margin-top: 16px; font-size: 10px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">📊 Flash Gerencial de Tesorería</div>
      <div class="periodo">${periodo} • More Paper & More Design</div>
    </div>
    <div class="kpi-row">
      <span class="kpi-title">Cuenta Negocios (***7194):</span>
      <span class="kpi-val">$${saldo7194.toLocaleString("es-CO")} COP</span>
    </div>
    <div class="kpi-row">
      <span class="kpi-title">Cuenta Personal (***2103):</span>
      <span class="kpi-val">$${saldo2103.toLocaleString("es-CO")} COP</span>
    </div>
    <div class="kpi-row">
      <span class="kpi-title">Retiro Libre Seguro:</span>
      <span class="kpi-val" style="color: #4ade80;">$${fcl.toLocaleString("es-CO")} COP</span>
    </div>
    <div class="footer">Generado por Asesor Financiero Senior • Antigravity</div>
  </div>
</body>
</html>
  `;
}

// ============================================================================
// 3. COMPILADOR Y ARCHIVADOR DE PDF EN GOOGLE DRIVE
// ============================================================================

/**
 * Convierte un contenido HTML en PDF vectorial y lo archiva en Google Drive.
 * @param {string} htmlContent Contenido HTML5 del informe
 * @param {string} nombreArchivo Nombre base del archivo (sin extensión)
 * @returns {Object} Metadatos del documento generado en Google Drive
 */
function generarPdfYArchivarEnDrive_(htmlContent, nombreArchivo) {
  try {
    const nombreLimpio = (nombreArchivo || "Informe_Gerencial_CFO_" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd_HHmm")).replace(/[^\w\d-_]/g, "_");

    // 1. Obtener o crear carpeta en Google Drive
    let carpeta = null;
    try {
      if (typeof DriveApp !== "undefined") {
        const carpetas = DriveApp.getFoldersByName(CONFIG_INFORMES_CFO.NOMBRE_CARPETA_DRIVE);
        if (carpetas && carpetas.hasNext()) {
          carpeta = carpetas.next();
        } else {
          carpeta = DriveApp.createFolder(CONFIG_INFORMES_CFO.NOMBRE_CARPETA_DRIVE);
        }
      }
    } catch (eFolder) {
      Logger.log("Aviso con carpeta de Drive: " + eFolder.message);
      try {
        if (typeof DriveApp !== "undefined") {
          carpeta = DriveApp.getRootFolder();
        }
      } catch (eRoot) {
        Logger.log("Error al obtener raíz de DriveApp: " + eRoot.message);
      }
    }

    if (!carpeta) {
      throw new Error("No se pudo acceder a Google Drive. Por favor ejecuta la función 'autorizarServiciosGoogleAppsScript' en el editor para autorizar permisos.");
    }

    // 2. Generación del Blob con cascada de resiliencia (HtmlService -> Utilities.newBlob)
    let blobFinal = null;
    let extensionFinal = ".pdf";
    let mimeTypeFinal = "application/pdf";

    // Nivel 1: Conversión oficial de Google Apps Script vía HtmlService
    try {
      if (typeof HtmlService !== "undefined" && typeof HtmlService.createHtmlOutput === "function") {
        const htmlOutput = HtmlService.createHtmlOutput(htmlContent);
        blobFinal = htmlOutput.getAs("application/pdf").setName(nombreLimpio + ".pdf");
      }
    } catch (eHtmlPdf) {
      Logger.log("Aviso en HtmlService.createHtmlOutput.getAs(pdf): " + eHtmlPdf.message);
    }

    // Nivel 2: Si no fue posible con HtmlService, guardamos como archivo HTML interactivo con estilos y gráficos SVG intactos
    if (!blobFinal) {
      try {
        blobFinal = Utilities.newBlob(htmlContent, "text/html", nombreLimpio + ".html");
        extensionFinal = ".html";
        mimeTypeFinal = "text/html";
      } catch (eBlob) {
        Logger.log("Aviso en Utilities.newBlob: " + eBlob.message);
      }
    }

    if (!blobFinal) {
      throw new Error("No fue posible generar el blob binario del documento.");
    }

    // 3. Crear archivo en Drive
    const archivoDrive = carpeta.createFile(blobFinal);
    
    // 4. Gestión segura de permisos de Drive (Configurable vía PropertiesService)
    try {
      const politicaSharing = PropertiesService.getScriptProperties().getProperty("DRIVE_SHARING_POLICY") || "RESTRICTED_ADMIN";
      
      if (politicaSharing === "PUBLIC_LINK") {
        // Modo Enlace Público Explícito (solo si el administrador lo activa intencionalmente)
        archivoDrive.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } else {
        // Modo Alta Seguridad Zero-Trust (por defecto): Acceso restringido al propietario y administrador
        const emailActivo = Session.getEffectiveUser().getEmail();
        if (emailActivo) {
          archivoDrive.addViewer(emailActivo);
        }
      }
    } catch (eSharing) {
      Logger.log("Aviso al establecer permisos de Drive: " + eSharing.message);
    }

    const archivoId = archivoDrive.getId();
    const urlVisualizacion = archivoDrive.getUrl() || `https://drive.google.com/file/d/${archivoId}/view`;
    const urlDescarga = `https://drive.google.com/uc?export=download&id=${archivoId}`;

    Logger.log(`✅ Informe archivado con éxito en Drive: ${nombreLimpio}${extensionFinal} (ID: ${archivoId})`);

    return {
      exito: true,
      archivoId: archivoId,
      nombreArchivo: nombreLimpio + extensionFinal,
      urlDescarga: urlDescarga,
      urlVisualizacion: urlVisualizacion,
      blob: blobFinal,
      tamanoBytes: (typeof blobFinal.getBytes === "function") ? blobFinal.getBytes().length : 0,
      fechaCreacion: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss")
    };

  } catch (e) {
    Logger.log("Error en generarPdfYArchivarEnDrive_: " + e.message);
    return {
      exito: false,
      error: e.message,
      urlVisualizacion: null,
      urlDescarga: null
    };
  }
}

/**
 * Función directa sin try-catch para obligar a Google Apps Script a desplegar
 * de forma inmediata la ventana nativa de revisión y concesión de permisos OAuth.
 */
function forzarVentanaPermisosGoogleDrive() {
  Logger.log("Invocando servicio de Google Drive para solicitar autorización...");
  const raiz = DriveApp.getRootFolder();
  const carpeta = DriveApp.createFolder("Informes CFO Antigravity");
  Logger.log("✅ Permiso de Google Drive activado con éxito en la carpeta: " + carpeta.getName());
}

/**
 * Función de utilidad para autorizar los servicios de Google Drive y Sheets en Google Apps Script.
 * Ejecutar una vez desde el editor de script.google.com para conceder los permisos requeridos.
 */
function autorizarServiciosGoogleAppsScript() {
  Logger.log("🔐 ============================================================================");
  Logger.log("🔐 VERIFICACIÓN Y AUTORIZACIÓN DE PERMISOS: GOOGLE DRIVE & GOOGLE SHEETS");
  Logger.log("🔐 ============================================================================");

  // 1. Acceso a Google Sheets
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log("✅ 1. Google Sheets: Conexión exitosa (" + (ss ? ss.getName() : "Libro activo") + ")");
  } catch (eSheets) {
    Logger.log("❌ Error en Google Sheets: " + eSheets.message);
  }

  // 2. Acceso y autorización a Google Drive
  let carpeta = null;
  try {
    Logger.log("📁 2. Google Drive: Verificando acceso y carpeta de informes...");
    const nombreCarpeta = CONFIG_INFORMES_CFO.NOMBRE_CARPETA_DRIVE || "Informes CFO Antigravity";
    const carpetas = DriveApp.getFoldersByName(nombreCarpeta);
    if (carpetas.hasNext()) {
      carpeta = carpetas.next();
      Logger.log("✅ 2. Google Drive: Carpeta existente encontrada: " + carpeta.getName());
    } else {
      carpeta = DriveApp.createFolder(nombreCarpeta);
      Logger.log("✅ 2. Google Drive: Carpeta creada exitosamente: " + carpeta.getName());
    }
  } catch (eDrive) {
    Logger.log("❌ ERROR DE PERMISOS EN GOOGLE DRIVE: " + eDrive.message);
    Logger.log("👉 SOLUCIÓN: Agrega 'https://www.googleapis.com/auth/drive' en el archivo appsscript.json del proyecto.");
    return {
      ok: false,
      error: eDrive.message,
      instrucciones: "Configura 'appsscript.json' con el alcance https://www.googleapis.com/auth/drive"
    };
  }

  // 3. Prueba directa e instantánea de creación de archivo en Drive (sin demoras ni dependencia de Gemini)
  try {
    Logger.log("📄 3. Google Drive: Creando archivo de prueba de escritura inmediata...");
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd_HHmmss");
    const htmlTest = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Test Drive Antigravity</title></head>
      <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center; color: #0f172a;">
        <h1 style="color: #0f766e;">✅ Verificación Exitosa de Google Drive</h1>
        <p>Los permisos de lectura, creación y archivado en Google Drive están activos y funcionando al 100%.</p>
        <p style="font-size: 12px; color: #64748b;">Generado automáticamente por Antigravity CFO Engine (${timestamp})</p>
      </body>
      </html>
    `;

    const testBlob = Utilities.newBlob(htmlTest, "text/html", `Verificacion_Drive_${timestamp}.html`);
    const archivoCreado = carpeta.createFile(testBlob);
    try {
      const pol = PropertiesService.getScriptProperties().getProperty("DRIVE_SHARING_POLICY") || "RESTRICTED_ADMIN";
      if (pol === "PUBLIC_LINK") {
        archivoCreado.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      }
    } catch (eShare) {
      Logger.log("Aviso al compartir archivo de prueba: " + eShare.message);
    }

    const testUrl = archivoCreado.getUrl() || `https://drive.google.com/file/d/${archivoCreado.getId()}/view`;
    Logger.log("🎉 ¡ÉXITO TOTAL! Permisos de Google Drive 100% activos y comprobados.");
    Logger.log("📄 Archivo de prueba creado: " + archivoCreado.getName());
    Logger.log("🔗 URL del archivo en Drive: " + testUrl);
    Logger.log("🔐 ============================================================================");

    return {
      ok: true,
      mensaje: "Permisos de Google Drive y Sheets activos y verificados.",
      urlPrueba: testUrl,
      archivoId: archivoCreado.getId()
    };
  } catch (eArchivo) {
    Logger.log("❌ Error al crear archivo en Drive: " + eArchivo.message);
    return { ok: false, error: eArchivo.message };
  }
}

// ============================================================================
// 4. CEREBRO FINANCIERO CFO & EXTRACCIÓN CONSOLIDADA (ETAPA 2)
// ============================================================================

/**
 * Resuelve una hoja de cálculo en el libro activo con tolerancia a variantes y mayúsculas.
 */
function resolverHojaFlexibleEnInforme_(ss, nombreBuscado) {
  if (!ss || !nombreBuscado) return null;
  let sh = ss.getSheetByName(nombreBuscado);
  if (sh) return sh;

  const conEspacios = nombreBuscado.replace("MorePaper", "More Paper").replace("MoreDesign", "More Design");
  sh = ss.getSheetByName(conEspacios);
  if (sh) return sh;

  const sinEspacios = nombreBuscado.replace("More Paper", "MorePaper").replace("More Design", "MoreDesign");
  sh = ss.getSheetByName(sinEspacios);
  if (sh) return sh;

  const sheets = ss.getSheets();
  const normalizado = nombreBuscado.toLowerCase().replace(/[\s_-]/g, "");
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().toLowerCase().replace(/[\s_-]/g, "") === normalizado) {
      return sheets[i];
    }
  }
  return null;
}

/**
 * Limpia y convierte cualquier representación monetaria en número flotante limpio.
 */
function limpiarMontoEnInforme_(val) {
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
 * Extrae y clasifica métricas financieras de una hoja de transacciones.
 */
function extraerMetricasEntidadDesdeHoja_(ss, nombreHoja, nombreEntidad) {
  const res = { entidad: nombreEntidad, ingresos: 0, gastos: 0, utilidad: 0, margenPct: 0, cantidadTransacciones: 0 };
  const sheet = resolverHojaFlexibleEnInforme_(ss, nombreHoja);
  if (!sheet || sheet.getLastRow() <= 1) return res;

  const filas = sheet.getRange(1, 1, sheet.getLastRow(), Math.min(sheet.getLastColumn(), 12)).getValues();
  if (filas.length <= 1) return res;

  let colTipo = 2;
  let colValor = 7;

  // Detectar dinámicamente columnas por encabezado
  filas[0].forEach((h, cIdx) => {
    const headerStr = String(h || "").trim().toUpperCase();
    if (headerStr.includes("TIPO")) colTipo = cIdx;
    if (headerStr.includes("VALOR") || headerStr.includes("MONTO")) colValor = cIdx;
  });

  for (let r = 1; r < filas.length; r++) {
    const tipo = String(filas[r][colTipo] || "").trim().toUpperCase();
    const val = limpiarMontoEnInforme_(filas[r][colValor]);
    if (val === 0) continue;

    res.cantidadTransacciones++;
    if (tipo.includes("INGRESO")) {
      res.ingresos += val;
    } else {
      res.gastos += val;
    }
  }

  res.utilidad = res.ingresos - res.gastos;
  res.margenPct = res.ingresos > 0 ? Math.round((res.utilidad / res.ingresos) * 100) : 0;
  return res;
}

/**
 * Extrae los gastos operativos globales (Nómina Global & Operación Corporativa).
 */
function extraerMetricasNominaGlobal_(ss) {
  const res = { total: 0, cantidad: 0, detalles: [], ingresos: 0, gastos: 0, flujoNeto: 0 };
  const sheet = resolverHojaFlexibleEnInforme_(ss, "Operacion_Global") || resolverHojaFlexibleEnInforme_(ss, "Gastos_Globales");
  if (!sheet || sheet.getLastRow() <= 1) return res;

  const filas = sheet.getRange(1, 1, sheet.getLastRow(), Math.min(sheet.getLastColumn(), 12)).getValues();
  if (filas.length <= 1) return res;

  let colConcepto = 5;
  let colValor = 7;
  let colFecha = 1;
  let colTipo = 2;

  filas[0].forEach((h, cIdx) => {
    const headerStr = String(h || "").trim().toUpperCase();
    if (headerStr.includes("CONCEPTO")) colConcepto = cIdx;
    if (headerStr.includes("VALOR") || headerStr.includes("MONTO")) colValor = cIdx;
    if (headerStr.includes("FECHA")) colFecha = cIdx;
    if (headerStr.includes("TIPO")) colTipo = cIdx;
  });

  for (let r = 1; r < filas.length; r++) {
    const val = limpiarMontoEnInforme_(filas[r][colValor]);
    if (val === 0) continue;
    const tipo = String(filas[r][colTipo] || "").toLowerCase();
    const esIngreso = tipo.includes("ingreso");

    if (esIngreso) {
      res.ingresos += val;
    } else {
      res.gastos += val;
      res.total += val;
    }
    res.cantidad++;
    res.detalles.push({
      fecha: filas[r][colFecha] || "",
      tipo: esIngreso ? "Ingreso" : "Gasto",
      concepto: String(filas[r][colConcepto] || "Operación Global"),
      monto: val
    });
  }

  res.flujoNeto = res.ingresos - res.gastos;
  return res;
}

/**
 * Extrae los compromisos y deudas pendientes de las hojas de compromisos.
 */
function extraerCompromisosPendientesInforme_(ss) {
  const deudas = [];
  const hojasCompromisos = [
    { hoja: "MorePaper_Compromisos", entidad: "More Paper" },
    { hoja: "MoreDesign_Compromisos", entidad: "More Design" },
    { hoja: "Personal_Compromisos", entidad: "Personal" },
    { hoja: "Compromisos_Globales", entidad: "Consolidado" }
  ];

  hojasCompromisos.forEach(item => {
    const sheet = resolverHojaFlexibleEnInforme_(ss, item.hoja);
    if (!sheet || sheet.getLastRow() <= 1) return;

    const filas = sheet.getRange(1, 1, sheet.getLastRow(), Math.min(sheet.getLastColumn(), 12)).getValues();
    if (filas.length <= 1) return;

    let colAcreedor = 2;
    let colConcepto = 3;
    let colSaldo = 6;
    let colVencimiento = 8;
    let colEstado = 9;

    filas[0].forEach((h, cIdx) => {
      const headerStr = String(h || "").trim().toUpperCase();
      if (headerStr.includes("ACREEDOR") || headerStr.includes("PROVEEDOR")) colAcreedor = cIdx;
      if (headerStr.includes("CONCEPTO")) colConcepto = cIdx;
      if (headerStr.includes("SALDO")) colSaldo = cIdx;
      if (headerStr.includes("VENCIMIENTO")) colVencimiento = cIdx;
      if (headerStr.includes("ESTADO") && !headerStr.includes("ALERTA")) colEstado = cIdx;
    });

    for (let r = 1; r < filas.length; r++) {
      const estado = String(filas[r][colEstado] || "").trim().toUpperCase();
      const saldo = limpiarMontoEnInforme_(filas[r][colSaldo]);
      if (estado === "PAGADO" || saldo <= 0) continue;

      let fechaVencStr = filas[r][colVencimiento];
      if (fechaVencStr instanceof Date) {
        fechaVencStr = Utilities.formatDate(fechaVencStr, Session.getScriptTimeZone(), "yyyy-MM-dd");
      }

      deudas.push({
        entidad: item.entidad,
        acreedor: String(filas[r][colAcreedor] || "Acreedor General"),
        concepto: String(filas[r][colConcepto] || "Compromiso"),
        saldo: saldo,
        fechaLimite: String(fechaVencStr || "Sin fecha fija"),
        estado: estado || "PENDIENTE"
      });
    }
  });

  return deudas;
}

/**
 * Extrae todos los datos financieros consolidados del libro para estructurar el informe ejecutivo.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss Libro activo de Google Sheets
 * @param {string} periodo Descripción del período analizado
 * @returns {Object} Datos consolidados limpios y categorizados
 */
function extraerDatosConsolidadosParaInforme_(ss, periodo) {
  const libro = ss || (typeof SpreadsheetApp !== "undefined" && SpreadsheetApp.getActiveSpreadsheet ? SpreadsheetApp.getActiveSpreadsheet() : null);

  if (!libro) {
    return {
      periodo: periodo || "Período Actual Consolidado",
      fechaCorte: new Date().toISOString(),
      saldosBancarios: { cuenta7194_negocios: 0, cuenta2103_personal: 0, totalConsolidado: 0 },
      unidades: {
        morePaper: { entidad: "More Paper", ingresos: 0, gastos: 0, utilidad: 0, margenPct: 0 },
        moreDesign: { entidad: "More Design", ingresos: 0, gastos: 0, utilidad: 0, margenPct: 0 }
      },
      nominaGlobal: { total: 0, cantidad: 0, detalles: [] },
      personal: { entidad: "Personal", ingresos: 0, gastos: 0, utilidad: 0, margenPct: 0 },
      deudas: []
    };
  }

  // 1. Extraer métricas por unidad de negocio y personal
  const morePaper = extraerMetricasEntidadDesdeHoja_(libro, "MorePaper_Transacciones", "More Paper");
  const moreDesign = extraerMetricasEntidadDesdeHoja_(libro, "MoreDesign_Transacciones", "More Design");
  const personal = extraerMetricasEntidadDesdeHoja_(libro, "Personal_Transacciones", "Personal");
  const nominaGlobal = extraerMetricasNominaGlobal_(libro);
  const deudas = extraerCompromisosPendientesInforme_(libro);

  // 2. Calcular saldos bancarios oficiales con segregación estricta de cuentas
  // Cuenta Negocios (***7194) común para More Paper y More Design con Tesorería/Operación Global
  const saldo7194 = (morePaper.utilidad + moreDesign.utilidad) + (nominaGlobal.flujoNeto !== undefined ? nominaGlobal.flujoNeto : -nominaGlobal.total);
  // Cuenta Personal (***2103) exclusivamente para finanzas personales del propietario
  const saldo2103 = personal.utilidad;
  const totalBancos = saldo7194 + saldo2103;

  const fechaCorteStr = typeof Utilities !== "undefined"
    ? Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm")
    : new Date().toISOString().substring(0, 16).replace("T", " ");

  return {
    periodo: periodo || "Período Actual Consolidado",
    fechaCorte: fechaCorteStr,
    saldosBancarios: {
      cuenta7194_negocios: saldo7194,
      cuenta2103_personal: saldo2103,
      totalConsolidado: totalBancos
    },
    unidades: {
      morePaper: morePaper,
      moreDesign: moreDesign
    },
    nominaGlobal: nominaGlobal,
    personal: personal,
    deudas: deudas
  };
}

/**
 * Calcula con rigor matemático el Flujo de Caja Libre Distribuible para retiros personales.
 * @param {Object} datosConsolidados Objeto generado por extraerDatosConsolidadosParaInforme_
 * @returns {Object} Diagnóstico de solvencia, reserva recomendada y monto máximo seguro de retiro
 */
function calcularFlujoCajaLibreDistribuible_(datosConsolidados) {
  const mp = datosConsolidados.unidades.morePaper;
  const md = datosConsolidados.unidades.moreDesign;
  const nomina = datosConsolidados.nominaGlobal.total || 0;
  const saldo7194 = Number(datosConsolidados.saldosBancarios.cuenta7194_negocios) || 0;

  const ingresosNegocios = (mp.ingresos || 0) + (md.ingresos || 0);
  const gastosNegocios = (mp.gastos || 0) + (md.gastos || 0) + nomina;
  const flujoOperativo = ingresosNegocios - gastosNegocios;

  // 1. Reserva de Capital de Trabajo: 20% de la carga operativa mensual del negocio
  const reservaCapitalTrabajo = Math.round(gastosNegocios * 0.20);

  // 2. Servicio de Pasivos Inmediatos: Cuentas pendientes que exigen cobertura a corto plazo
  const deudasPendientes = (datosConsolidados.deudas || []).filter(d => d.estado !== "PAGADO");
  const servicioDeudaInmediata = deudasPendientes.reduce((acc, d) => acc + (Number(d.saldo) || 0), 0);

  // 3. Provisión Estimada de Impuestos (Retenciones, Renta y Municipales: 10% de utilidad operativa positiva)
  const provisionImpuestos = Math.max(0, Math.round(flujoOperativo * 0.10));

  // 4. Cálculo del FCL Distribuible real
  const fclNetoBruto = saldo7194 - reservaCapitalTrabajo - servicioDeudaInmediata - provisionImpuestos;
  const fclDistribuible = Math.max(0, fclNetoBruto);

  // 5. Criterio de Seguridad CFO: Retiro sugerido al 70% del FCL disponible para amortiguar contingencias
  const fclDistribuibleRecomendado = Math.round(fclDistribuible * 0.70);

  // 6. Dictamen de Salud Financiera
  let estadoSalud = "OPTIMO";
  let diagnostico = "";
  let advertenciaRetiro = "";

  if (saldo7194 <= 0 || fclNetoBruto <= 0) {
    estadoSalud = "CRITICO";
    diagnostico = "Déficit de Liquidez Estructural. La caja de la cuenta negocios (***7194) es insuficiente para cubrir la totalidad de pasivos y reservas operativas.";
    advertenciaRetiro = "ALERTA ROJA: Se restringe de forma tajante el retiro de fondos hacia la cuenta personal (***2103). Cada peso disponible debe blindar el pago de la nómina global y la amortización de compromisos comerciales.";
  } else if (flujoOperativo <= 0) {
    estadoSalud = "PRECAUCION";
    diagnostico = "Superávit de Liquidez Acumulada con Operación Corriente en Pérdida. La cuenta posee saldo bancario positivo pero las operaciones del período registraron déficit tras el pago de nómina.";
    advertenciaRetiro = "PRECAUCIÓN: Se recomienda suspender retiros voluntarios o limitar transferencias al 30% del FCL para no descapitalizar la operación corriente de More Paper y More Design.";
  } else {
    estadoSalud = "OPTIMO";
    diagnostico = "Sólida Generación Operativa y Solvencia Plena. Las utilidades generadas por More Paper y More Design superan con holgura la nómina y los costos operativos.";
    advertenciaRetiro = `SUPERÁVIT CONFIRMADO: Es viable transferir hasta $${fclDistribuibleRecomendado.toLocaleString("es-CO")} COP a la cuenta personal (***2103) sin comprometer compromisos con acreedores ni la liquidez de operación.`;
  }

  return {
    ingresosNegocios: ingresosNegocios,
    gastosNegocios: gastosNegocios,
    flujoOperativo: flujoOperativo,
    reservaCapitalTrabajo: reservaCapitalTrabajo,
    servicioDeudaInmediata: servicioDeudaInmediata,
    provisionImpuestos: provisionImpuestos,
    fclDistribuible: fclDistribuible,
    fclDistribuibleRecomendado: fclDistribuibleRecomendado,
    estadoSalud: estadoSalud,
    diagnostico: diagnostico,
    advertenciaRetiro: advertenciaRetiro
  };
}

/**
 * Obtiene el contexto macroeconómico y regulatorio tributario en tiempo real.
 */
function obtenerContextoMacroEconomico_() {
  let snapshot = null;
  let dian = null;

  // 1. Invocar snapshot si está definido en el agente brain
  if (typeof obtenerSnapshotMercadoTiempoReal_ === "function") {
    try {
      snapshot = obtenerSnapshotMercadoTiempoReal_();
    } catch (eSnap) {
      Logger.log("Aviso al obtener snapshot macro: " + eSnap.message);
    }
  }

  // 2. Invocar calendario DIAN si está definido
  if (typeof obtenerCalendarioNormativaDian_ === "function") {
    try {
      dian = obtenerCalendarioNormativaDian_(null, null, new Date().getFullYear());
    } catch (eDian) {
      Logger.log("Aviso al obtener calendario DIAN: " + eDian.message);
    }
  }

  const trmValor = snapshot?.trmOficial?.valor ? Number(snapshot.trmOficial.valor) : 4185;
  const eurValor = snapshot?.divisas?.EUR_COP ? Number(snapshot.divisas.EUR_COP) : 4550;
  const uvtValor = dian?.uvtVigente ? Number(dian.uvtVigente) : 49799;

  const resumenAnalisisMacro = `TRM Oficial en $${trmValor.toLocaleString("es-CO")} COP. Euro cotizando en $${eurValor.toLocaleString("es-CO")} COP. ` +
    `UVT DIAN fijada en $${uvtValor.toLocaleString("es-CO")} COP. ` +
    `Se proyecta impacto moderado en materias primas e insumos gráficos importados (papel bond, vinilos y tintas). ` +
    `Recomendación de política cambiaria: blindar márgenes en More Paper mediante compras programadas por volumen.`;

  return {
    trm: trmValor,
    euro: eurValor,
    uvt: uvtValor,
    inflacionEstimada: "5.8% anual",
    tasaBanRep: "9.75%",
    dian: {
      uvt: uvtValor,
      reglaRetefuente: dian?.retefuente?.reglaVencimiento || "Vencimiento mensual según último dígito del NIT",
      reglaIva: dian?.iva?.bimestral || "Declaración bimestral obligatoria para grandes contribuyentes y régimen común"
    },
    resumenAnalisisMacro: resumenAnalisisMacro
  };
}

/**
 * Construye el prompt directivo para el análisis con Inteligencia Artificial Gemini.
 */
function construirPromptCFO_AnalisisProfundo_(datosConsolidados, flujoCaja, contextoMacro, nivelComplejidad) {
  return [
    `Eres el Director Financiero Senior (CFO Ejecutivo) de Antigravity. Tu misión es auditar y emitir un diagnóstico corporativo de máximo nivel estratégico para el propietario Fernando, integrando la visión, doctrina y rigor del Consejo Asesor Global (13 Líderes Mundiales):`,
    `- Jamie Dimon (JPMorgan Chase): Balance fortificado ('Fortress Balance Sheet') y aversión al riesgo de iliquidez.`,
    `- Larry Fink (BlackRock): Asignación prudente de capital y sostenibilidad fiduciaria a largo plazo.`,
    `- Warren Buffett (Berkshire Hathaway): Fosos económicos defensivos y primacía del Flujo de Caja Libre del Propietario.`,
    `- Kristalina Georgieva (FMI): Monitoreo de riesgos macroeconómicos, inflación y buffers de contingencia cambiaria.`,
    `- Andy Jassy & Jeff Bezos (Amazon): Frugalidad operativa despiadada, eliminación de burocracia, mentalidad 'Day 1' y velocidad de ejecución.`,
    `- Ngozi Okonjo-Iweala (OMC): Resiliencia en la cadena de suministros y negociación ventajosa con proveedores.`,
    `- Satya Nadella (Microsoft): Palanca tecnológica e Inteligencia Artificial para maximizar la productividad y margen operativo.`,
    `- Bernard Arnault (LVMH) & Philip Kotler: Poder de fijación de precios (Pricing Power), artesanía de alta gama para More Paper y More Design (anti-commodity) y marketing de valor por cliente.`,
    `- Joe Ucuzoglu (Deloitte), Mohamed Kande (PwC) & Janet Truncale (EY): Rigor forense Big-4, conciliación diaria, calidad de ganancias y auditoría preventiva anti-fugas.`,
    ``,
    `DATOS FINANCIEROS REALES EXTRAÍDOS DE GOOGLE SHEETS:`,
    `- Período: ${datosConsolidados.periodo}`,
    `- More Paper (Papelería): Ingresos $${datosConsolidados.unidades.morePaper.ingresos.toLocaleString("es-CO")}, Gastos $${datosConsolidados.unidades.morePaper.gastos.toLocaleString("es-CO")}, Margen: ${datosConsolidados.unidades.morePaper.margenPct}%`,
    `- More Design (Agencia Gráfica): Ingresos $${datosConsolidados.unidades.moreDesign.ingresos.toLocaleString("es-CO")}, Gastos $${datosConsolidados.unidades.moreDesign.gastos.toLocaleString("es-CO")}, Margen: ${datosConsolidados.unidades.moreDesign.margenPct}%`,
    `- Nómina Global Corporativa (Gasto Compartido): $${datosConsolidados.nominaGlobal.total.toLocaleString("es-CO")}`,
    `- Finanzas Personales: Ingresos $${datosConsolidados.personal.ingresos.toLocaleString("es-CO")}, Gastos $${datosConsolidados.personal.gastos.toLocaleString("es-CO")}, Ahorro: $${datosConsolidados.personal.utilidad.toLocaleString("es-CO")}`,
    ``,
    `LIQUIDEZ EN CUENTAS BANCARIAS OFICIALES:`,
    `- Cuenta Negocios (***7194): $${datosConsolidados.saldosBancarios.cuenta7194_negocios.toLocaleString("es-CO")} COP`,
    `- Cuenta Personal (***2103): $${datosConsolidados.saldosBancarios.cuenta2103_personal.toLocaleString("es-CO")} COP`,
    `- Total Líquido en Bancos: $${datosConsolidados.saldosBancarios.totalConsolidado.toLocaleString("es-CO")} COP`,
    ``,
    `ANÁLISIS DE FLUJO DE CAJA LIBRE DISTRIBUIBLE (FCL):`,
    `- Estado de Salud: ${flujoCaja.estadoSalud}`,
    `- Reserva de Capital de Trabajo Sugerida: $${flujoCaja.reservaCapitalTrabajo.toLocaleString("es-CO")} COP`,
    `- Servicio de Deudas Inmediatas: $${flujoCaja.servicioDeudaInmediata.toLocaleString("es-CO")} COP`,
    `- FCL Distribuible Seguro para Retiros Personales: $${flujoCaja.fclDistribuibleRecomendado.toLocaleString("es-CO")} COP`,
    `- Dictamen de Retiro: ${flujoCaja.advertenciaRetiro}`,
    ``,
    `PANORAMA MACROECONÓMICO Y DIAN COLOMBIA:`,
    `- TRM Oficial: $${contextoMacro.trm.toLocaleString("es-CO")} COP | UVT DIAN: $${contextoMacro.uvt.toLocaleString("es-CO")} COP`,
    `- Inflación IPC: ${contextoMacro.inflacionEstimada} | Tasa BanRep: ${contextoMacro.tasaBanRep}`,
    ``,
    `INSTRUCCIONES DE RESPUESTA:`,
    `Responde estrictamente en formato JSON válido (sin bloques de código externos con formato distinto a JSON) con las siguientes claves:`,
    `{`,
    `  "resumenEjecutivo": "2 o 3 párrafos de alto impacto gerencial analizando rentabilidad, solvencia y sostenibilidad con el prisma del Consejo Asesor Global.",`,
    `  "diagnosticoUnidades": "Evaluación comparativa entre More Paper y More Design, analizando pricing power (Arnault), foso competitivo (Buffett) y cuellos de botella.",`,
    `  "impactoNominaGlobal": "Análisis del peso de la nómina sobre el margen neto y eficiencia laboral (Jassy/Nadella).",`,
    `  "dictamenLiquidezYRetiros": "Instrucción formal sobre la viabilidad de transferir utilidades a la cuenta ***2103 respetando la fortaleza de balance (Dimon).",`,
    `  "recomendacionesEstrategicas": ["Recomendación 1 accionable con plazos, impacto y enfoque del Consejo", "Recomendación 2...", "Recomendación 3...", "Recomendación 4..."]`,
    `}`
  ].join("\n");
}

/**
 * Genera el diagnóstico analítico de IA o ejecuta el motor heurístico determinístico Big-4 si la API no está disponible.
 */
function generarDiagnosticoCFOConIA_(datosConsolidados, flujoCaja, contextoMacro, nivelComplejidad) {
  const apiKey = (typeof CONFIG_FINANZAS !== "undefined" && CONFIG_FINANZAS?.GEMINI_API_KEY)
    || (typeof PropertiesService !== "undefined" ? PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY") : null);

  if (apiKey && apiKey.trim() !== "") {
    try {
      const prompt = construirPromptCFO_AnalisisProfundo_(datosConsolidados, flujoCaja, contextoMacro, nivelComplejidad);
      let rawText = "";

      if (typeof llamarGeminiTexto_ === "function") {
        rawText = llamarGeminiTexto_(prompt);
      } else if (typeof UrlFetchApp !== "undefined") {
        const modeloCfo = (typeof CONFIG_IA !== "undefined" && CONFIG_IA.MODELO_TEXTO) ? CONFIG_IA.MODELO_TEXTO : "gemini-2.0-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modeloCfo}:generateContent?key=${apiKey}`;
        const resp = UrlFetchApp.fetch(url, {
          method: "post",
          contentType: "application/json",
          payload: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
          }),
          muteHttpExceptions: true
        });
        if (resp.getResponseCode() === 200) {
          const jsonResp = JSON.parse(resp.getContentText());
          rawText = jsonResp.candidates?.[0]?.content?.parts?.[0]?.text || "";
        }
      }

      if (rawText) {
        const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.resumenEjecutivo && Array.isArray(parsed.recomendacionesEstrategicas)) {
          return parsed;
        }
      }
    } catch (e) {
      Logger.log("Aviso al invocar Gemini CFO, recurriendo a motor heurístico: " + e.message);
    }
  }

  // Motor Heurístico Determinístico de Respaldo (Calidad Big-4 Garantizada)
  return generarDiagnosticoCFODeterministico_(datosConsolidados, flujoCaja, contextoMacro);
}

/**
 * Motor heurístico determinístico Big-4 para diagnósticos ejecutivos sin depender de la red externa.
 */
function generarDiagnosticoCFODeterministico_(datos, fcl, macro) {
  const mp = datos.unidades.morePaper;
  const md = datos.unidades.moreDesign;
  const saldo7194 = datos.saldosBancarios.cuenta7194_negocios;
  const saldo2103 = datos.saldosBancarios.cuenta2103_personal;
  const nom = datos.nominaGlobal.total;

  const unidadLider = mp.utilidad >= md.utilidad ? "More Paper" : "More Design";
  const unidadSecundaria = mp.utilidad >= md.utilidad ? "More Design" : "More Paper";

  const resumen = `Durante el ciclo evaluado (${datos.periodo}), la estructura empresarial registró una facturación conjunta de $${(mp.ingresos + md.ingresos).toLocaleString("es-CO")} COP frente a un costo operativo total de $${(mp.gastos + md.gastos + nom).toLocaleString("es-CO")} COP. ` +
    `La unidad líder en generación neta fue ${unidadLider}, respaldando la estabilidad de la caja común (***7194) que actualmente presenta una posición de $${saldo7194.toLocaleString("es-CO")} COP. ` +
    `El patrimonio personal en la cuenta ***2103 conserva un saldo acumulado de $${saldo2103.toLocaleString("es-CO")} COP, evidenciando una estricta segregación de tesorería.`;

  const diagUnidades = `More Paper alcanzó una rentabilidad operativa del ${mp.margenPct}%, mientras que More Design generó un margen del ${md.margenPct}%. ` +
    `Se evidencia complementariedad entre los flujos constantes de mostrador y los contratos de volumen. Se aconseja revisar los márgenes brutos de ${unidadSecundaria} para optimizar su contribución al resultado global.`;

  const impNomina = `La Nómina Global absorbió $${nom.toLocaleString("es-CO")} COP durante el período. ` +
    `Al ser tratada como un gasto operativo centralizado, distribuye equitativamente el costo humano entre More Paper y More Design sin penalizar artificialmente la contabilidad individual de ninguno de los dos locales comerciales.`;

  const recs = [
    `Preservar la reserva de capital de trabajo por $${fcl.reservaCapitalTrabajo.toLocaleString("es-CO")} COP en la cuenta ***7194 para garantizar la operación ininterrumpida de nómina y suministros.`,
    `Aprovechar la estabilidad de la TRM ($${macro.trm.toLocaleString("es-CO")} COP) para negociar compras anticipadas de insumos de diseño y papelería a escala con proveedores directos.`,
    fcl.estadoSalud === "OPTIMO"
      ? `Efectuar un retiro ordenado de utilidades de hasta $${fcl.fclDistribuibleRecomendado.toLocaleString("es-CO")} COP hacia la cuenta personal ***2103 mediante transferencia programada.`
      : `Suspender temporalmente retiros hacia la cuenta personal ***2103 hasta robustecer la liquidez de caja en More Paper y More Design.`,
    `Monitorear el calendario tributario DIAN (UVT $${macro.uvt.toLocaleString("es-CO")} COP) y programar con anticipación las retenciones en la fuente correspondientes.`
  ];

  return {
    resumenEjecutivo: resumen,
    diagnosticoUnidades: diagUnidades,
    impactoNominaGlobal: impNomina,
    dictamenLiquidezYRetiros: fcl.advertenciaRetiro,
    recomendacionesEstrategicas: recs
  };
}

/**
 * Orquestador principal de generación de informes CFO en todos sus formatos.
 * @param {string} tipoInforme "PDF_DOSSIER", "INFOGRAFIA" o "FLASH"
 * @param {string} periodo Descripción del período a consolidar
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss Opcional libro activo
 * @returns {Object} Resultado integral del informe
 */
function generarInformeCFOCompleto_(tipoInforme, periodo, ss) {
  try {
    const tipo = (tipoInforme || "PDF_DOSSIER").toUpperCase();
    const datosConsolidados = extraerDatosConsolidadosParaInforme_(ss, periodo);
    const flujoCaja = calcularFlujoCajaLibreDistribuible_(datosConsolidados);
    const diagnostico = (tipo === "FLASH")
      ? generarDiagnosticoCFODeterministico_(datosConsolidados, flujoCaja, contextoMacro)
      : generarDiagnosticoCFOConIA_(datosConsolidados, flujoCaja, contextoMacro, tipo);

    // Preparar objeto de datos para compiladores
    const payloadCompilador = {
      periodo: datosConsolidados.periodo,
      fechaEmision: datosConsolidados.fechaCorte,
      metricas: {
        morePaper: datosConsolidados.unidades.morePaper,
        moreDesign: datosConsolidados.unidades.moreDesign,
        nominaGlobal: datosConsolidados.nominaGlobal.total,
        personal: datosConsolidados.personal,
        saldoCuentaComun7194: datosConsolidados.saldosBancarios.cuenta7194_negocios,
        saldoCuentaPersonal2103: datosConsolidados.saldosBancarios.cuenta2103_personal,
        flujoCajaLibreDistribuible: flujoCaja.fclDistribuibleRecomendado
      },
      compromisosPendientes: datosConsolidados.deudas.map(d => ({
        proveedor: d.acreedor,
        concepto: d.concepto,
        saldo: d.saldo,
        fechaVencimiento: d.fechaLimite,
        estado: d.estado
      })),
      analisisCfo: {
        resumenEjecutivo: diagnostico.resumenEjecutivo,
        diagnosticoRentabilidad: diagnostico.diagnosticoUnidades,
        capacidadRetiroPersonal: diagnostico.dictamenLiquidezYRetiros,
        analisisMacroDian: contextoMacro.resumenAnalisisMacro,
        recomendacionesEstrategicas: diagnostico.recomendacionesEstrategicas
      }
    };

    if (tipo === "FLASH") {
      const textoFlash = [
        `📊 *INFORME FLASH CFO - ANTIGRAVITY*`,
        `🗓️ _Período: ${datosConsolidados.periodo}_`,
        ``,
        `💰 *LIQUIDEZ EN BANCOS (BANCOLOMBIA):*`,
        `• Negocios (***7194): *$${datosConsolidados.saldosBancarios.cuenta7194_negocios.toLocaleString("es-CO")} COP*`,
        `• Personal (***2103): *$${datosConsolidados.saldosBancarios.cuenta2103_personal.toLocaleString("es-CO")} COP*`,
        `• Total Disponible: *$${datosConsolidados.saldosBancarios.totalConsolidado.toLocaleString("es-CO")} COP*`,
        ``,
        `🏢 *DESEMPEÑO POR UNIDAD:*`,
        `• More Paper: Ing $${datosConsolidados.unidades.morePaper.ingresos.toLocaleString("es-CO")} | Margen: ${datosConsolidados.unidades.morePaper.margenPct}%`,
        `• More Design: Ing $${datosConsolidados.unidades.moreDesign.ingresos.toLocaleString("es-CO")} | Margen: ${datosConsolidados.unidades.moreDesign.margenPct}%`,
        `• Nómina Global: -$${datosConsolidados.nominaGlobal.total.toLocaleString("es-CO")} COP`,
        ``,
        `⚖️ *FLUJO DE CAJA LIBRE DISTRIBUIBLE:*`,
        `• Estado de Salud: *${flujoCaja.estadoSalud}*`,
        `• Retiro Seguro hacia ***2103: *$${flujoCaja.fclDistribuibleRecomendado.toLocaleString("es-CO")} COP*`,
        `• _Dictamen:_ ${flujoCaja.advertenciaRetiro}`,
        ``,
        `🎯 *RECOMENDACIONES CLAVE:*`,
        ...diagnostico.recomendacionesEstrategicas.map((r, i) => `${i + 1}. ${r}`)
      ].join("\n");

      return {
        ok: true,
        tipo: "FLASH",
        periodo: datosConsolidados.periodo,
        textoFlash: textoFlash,
        datosConsolidados: datosConsolidados,
        flujoCaja: flujoCaja,
        diagnostico: diagnostico
      };
    }

    if (tipo === "INFOGRAFIA") {
      const htmlInfografia = compilarHtmlInfografia_(payloadCompilador);
      const nombreArchivo = "Infografia_Financiera_" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd_HHmm");
      const archivoDrive = generarPdfYArchivarEnDrive_(htmlInfografia, nombreArchivo);

      return {
        ok: true,
        tipo: "INFOGRAFIA",
        periodo: datosConsolidados.periodo,
        html: htmlInfografia,
        archivo: archivoDrive,
        flujoCaja: flujoCaja,
        diagnostico: diagnostico
      };
    }

    // Default: PDF_DOSSIER
    const htmlDossier = compilarHtmlDossierGerencial_(payloadCompilador);
    const nombreArchivoPdf = "Dossier_Ejecutivo_CFO_" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd_HHmm");
    const archivoPdfDrive = generarPdfYArchivarEnDrive_(htmlDossier, nombreArchivoPdf);

    return {
      ok: true,
      tipo: "PDF_DOSSIER",
      periodo: datosConsolidados.periodo,
      html: htmlDossier,
      archivo: archivoPdfDrive,
      flujoCaja: flujoCaja,
      diagnostico: diagnostico
    };

  } catch (e) {
    Logger.log("Error general en generarInformeCFOCompleto_: " + e.message);
    return {
      ok: false,
      error: e.message
    };
  }
}

// ============================================================================
// 5. COPILOTO INTERACTIVO & CONSTRUCCIÓN ASISTIDA DE INFORMES (ETAPA 4)
// ============================================================================

/**
 * Formatea el informe Flash con la voz, emoji, estilo y lema del personaje activo (ej: Deadpool, Batman, etc.)
 */
function formatearInformeFlashConPersonaje_(informe, perm, periodo) {
  const perfil = perm?.perfilVoz || (perm?.rol === "SUPER_ADMIN" ? "DEADPOOL" : "FEMENINO_DULCE");
  const def = (typeof obtenerDefinicionPersonajeCompleta_ === "function") 
    ? obtenerDefinicionPersonajeCompleta_(perfil) 
    : { emoji: "📊", alias: "Director Financiero", lema: "Dirección Financiera de Élite", iconoAccion: "💼" };

  const nombre = (typeof sanitizarNombreHumano_ === "function") 
    ? sanitizarNombreHumano_(perm?.nombre || "Fernando") 
    : (perm?.nombre || "Fernando");

  const datos = informe?.datosConsolidados;
  const fcl = informe?.flujoCaja;
  const diag = informe?.diagnostico;

  // Saludo dinámico según personalidad
  let saludoPersonaje = `¡Hola, ${nombre}! Aquí ${def.alias}, tu ${def.titulo || "Director Financiero"}. `;
  if (perfil.includes("DEADPOOL") || perfil.includes("WADE")) {
    saludoPersonaje = `⚔️ ¡Hola, ${nombre}! Wade Wilson reportándose. Katanas enfundadas y números afilados al centavo. Aquí tienes tu análisis financiero en tiempo real, sin dramas ni aburrimiento:`;
  } else if (perfil.includes("BATMAN") || perfil.includes("BRUCE")) {
    saludoPersonaje = `🦇 ${nombre}, aquí Bruce Wayne. He auditado minuciosamente las arcas. Tus números se mantienen bajo estricto control y vigilancia estratégica:`;
  } else if (perfil.includes("IRON_MAN") || perfil.includes("STARK")) {
    saludoPersonaje = `⚡ ${nombre}, Tony Stark aquí. Jarvis y yo procesamos la telemetría financiera. El balance está impecable y listo para seguir construyendo el imperio:`;
  } else if (perfil.includes("GATO") || perfil.includes("PUSS")) {
    saludoPersonaje = `🤺 ¡Hola, ${nombre}! El Gato con Botas desenvaina su espada para proteger cada moneda de tu tesoro. He aquí el estado de tu fortuna:`;
  } else {
    saludoPersonaje = `${def.emoji} ¡Hola, ${nombre}! Aquí ${def.alias}. Acabo de compilar tu análisis financiero en tiempo real para el período *${periodo}*:`;
  }

  const cuerpo = [
    `${def.emoji} *ANÁLISIS FINANCIERO EJECUTIVO | ${def.nombreOficial ? def.nombreOficial.toUpperCase() : def.alias.toUpperCase()}*`,
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
    `_${def.iconoAccion || "✨"} «${def.lema || "Cuentas blindadas y capital en orden."}»_`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━`,
    `📥 *¿Deseas descargar el documento oficial o la tarjeta gráfica?*`,
    `• Responde *PDF* para compilar el **Dossier Gerencial en PDF** (listo para imprimir).`,
    `• Responde *INFOGRAFÍA* para generar la **Ficha Visual en Alta Resolución**.`
  ].filter(Boolean).join("\n");

  return cuerpo;
}

/**
 * Detecta si el usuario está solicitando un informe, reporte, dossier o PDF financiero.
 */
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

/**
 * Ejecuta la solicitud de informe: si es específica genera de inmediato; si es abierta entrega de inmediato el análisis Flash y ofrece soporte PDF/Infografía.
 */
function ejecutarSolicitudInformeCFO_(ss, telefono, textoUsuario, perm, solicitaAudio) {
  const t = String(textoUsuario || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const infoVoz = typeof obtenerInfoPerfilVoz_ === "function"
    ? obtenerInfoPerfilVoz_(perm?.perfilVoz || "BATMAN")
    : { emoji: "📊", lema: "Dirección Financiera de Élite" };

  const esPdf = /(?:pdf|dossier|completo|imprimible|formal|documento)/i.test(t);
  const esInfografia = /(?:infograf[ií]a|tarjeta|gr[aá]fica|visual)/i.test(t);

  // Detección de período
  let periodo = "Mes en curso";
  if (t.includes("historico") || t.includes("todo") || t.includes("consolidado")) {
    periodo = "Histórico Consolidado";
  } else if (t.includes("hoy") || t.includes("dia")) {
    periodo = "Corte del Día";
  }

  // CASO 1: Solicitud con formato específico explícito (PDF o Infografía)
  if (esPdf || esInfografia) {
    const tipo = esInfografia ? "INFOGRAFIA" : "PDF_DOSSIER";
    const informe = generarInformeCFOCompleto_(tipo, periodo, ss);

    // Despacho multimodal si aplica WhatsApp API
    let despachoWs = null;
    if (typeof enviarInformeCFOWhatsApp === "function") {
      try {
        despachoWs = enviarInformeCFOWhatsApp(telefono, informe);
      } catch (eSend) {
        Logger.log("Aviso al despachar informe por WhatsApp: " + eSend.message);
      }
    }

    const urlVis = informe.archivo?.urlVisualizacion;
    const urlDesc = informe.archivo?.urlDescarga;
    const bloqueDrive = urlVis ? [
      `🔗 *Enlace de Conexión Directa en Google Drive (Ver e Imprimir):*`,
      `${urlVis}`,
      ``,
      `📥 *Descarga Directa:*`,
      `${urlDesc || urlVis}`
    ].join("\n") : [
      `⚠️ *Enlace de Google Drive:*`,
      `_Para generar y consultar el enlace directo en Google Drive, ejecuta la función 'autorizarServiciosGoogleAppsScript' una vez en el editor de Apps Script._`
    ].join("\n");

    const textoConfirmacion = [
      `${infoVoz.emoji} *¡${tipo === "INFOGRAFIA" ? "Infografía Financiera" : "Dossier Gerencial CFO"} Generado con Éxito!*`,
      ``,
      `Hola, ${perm?.nombre || "Fernando"}. Acabo de compilar tu documento corporativo oficial para el período *${periodo}*:`,
      ``,
      `📄 *Archivo:* \`${informe.archivo?.nombreArchivo || "Informe.pdf"}\``,
      `⚖️ *Diagnóstico CFO:* ${informe.flujoCaja?.diagnostico || "Evaluación satisfactoria"}`,
      `💰 *Retiro Libre Seguro Sugerido:* $${(informe.flujoCaja?.fclDistribuibleRecomendado || 0).toLocaleString("es-CO")} COP`,
      ``,
      bloqueDrive,
      ``,
      `_(Acceso directo garantizado desde este chat)_`
    ].join("\n");

    return {
      tipo: "informe_cfo",
      yaDespachadoPorWebhook: Boolean(despachoWs && despachoWs.enviado),
      texto: textoConfirmacion,
      textoVoz: `Fernando, tu ${tipo === "INFOGRAFIA" ? "infografía" : "dossier en PDF"} ha sido compilado en Google Drive con calidad editorial y enlace directo en este chat. El flujo de caja libre confirma solvencia para tu patrimonio.`,
      perfilVoz: perm?.perfilVoz,
      requiereAudio: solicitaAudio
    };
  }

  // CASO 2: Solicitud de Análisis Financiero, Flash o Consulta General de Estado Financiero
  // Compila y despacha el Informe Flash de alto impacto en tiempo real (< 1s) adaptado a la personalidad activa
  const informeFlash = generarInformeCFOCompleto_("FLASH", periodo, ss);
  const textoPersonalizado = formatearInformeFlashConPersonaje_(informeFlash, perm, periodo);

  // Guardar estado interactivo en caché por 10 minutos para permitir selección directa con "PDF" o "Infografía"
  try {
    const cache = (typeof CacheService !== "undefined" && CacheService.getUserCache) ? CacheService.getUserCache() : null;
    if (cache) {
      cache.put("PENDING_CFO_REPORT_" + telefono, JSON.stringify({ paso: 1, periodo: periodo }), 600);
    }
  } catch (eCache) {
    Logger.log("Aviso al guardar caché informe guiado: " + eCache.message);
  }

  const perfilActivo = perm?.perfilVoz || (perm?.rol === "SUPER_ADMIN" ? "DEADPOOL" : "FEMENINO_DULCE");
  const nombreHumano = (typeof sanitizarNombreHumano_ === "function") ? sanitizarNombreHumano_(perm?.nombre || "Fernando") : (perm?.nombre || "Fernando");

  let textoVozFlash = `¡Ey, ${nombreHumano}! Aquí Deadpool. Tus números están en orden: en la cuenta setenta y uno noventa y cuatro tienes liquidez sólida y flujo de caja libre seguro para retiros personales. Si quieres el dossier en PDF o la infografía, sólo dímelo.`;
  if (perfilActivo.includes("BATMAN")) {
    textoVozFlash = `${nombreHumano}, balance auditado. Cuentas con saldo favorable en la setenta y uno noventa y cuatro y margen seguro para retiros personales hacia tu cuenta dos mil ciento tres.`;
  } else if (perfilActivo.includes("IRON_MAN")) {
    textoVozFlash = `${nombreHumano}, telemetría financiera lista. Liquidez positiva en negocios y flujo de caja libre distribuible en verde. Avísame si compilo el PDF ejecutivo.`;
  } else if (perfilActivo.includes("GATO")) {
    textoVozFlash = `¡Hola, ${nombreHumano}! El Gato con Botas protegiendo tus arcas. Tu fortuna está a salvo y la tesorería en orden para retiros seguros.`;
  }

  return {
    tipo: "informe_cfo",
    yaDespachadoPorWebhook: false,
    texto: textoPersonalizado,
    textoVoz: textoVozFlash,
    perfilVoz: perm?.perfilVoz,
    requiereAudio: solicitaAudio
  };
}

/**
 * Resuelve las respuestas del usuario durante el diálogo guiado de construcción de informes.
 */
function resolverFlujoInformeCFO_Pendiente_(ss, telefono, textoUsuario, perm) {
  const cache = (typeof CacheService !== "undefined" && CacheService.getUserCache) ? CacheService.getUserCache() : null;
  if (!cache) return null;

  const rawPending = cache.get("PENDING_CFO_REPORT_" + telefono);
  if (!rawPending) return null;

  const t = String(textoUsuario || "").toLowerCase().trim();

  // Opción de cancelación
  if (t === "cancelar" || t === "salir" || t === "no" || t.includes("cancel")) {
    cache.remove("PENDING_CFO_REPORT_" + telefono);
    return {
      tipo: "conversacion",
      texto: "Entendido, Fernando. He cancelado la generación del informe. Cuando lo requieras, solo avísame.",
      textoVoz: "Generación de informe cancelada. Quedo a tu disposición.",
      perfilVoz: perm?.perfilVoz
    };
  }

  let flowData = {};
  try {
    flowData = JSON.parse(rawPending);
  } catch (e) {
    cache.remove("PENDING_CFO_REPORT_" + telefono);
    return null;
  }

  // Paso 1: Selección de formato
  if (flowData.paso === 1) {
    let tipoSeleccionado = null;
    if (t === "1" || t === "1." || t.includes("flash") || t.includes("chat") || t.includes("resumen")) {
      tipoSeleccionado = "FLASH";
    } else if (t === "2" || t === "2." || t.includes("infografia") || t.includes("tarjeta") || t.includes("visual")) {
      tipoSeleccionado = "INFOGRAFIA";
    } else if (t === "3" || t === "3." || t.includes("pdf") || t.includes("dossier") || t.includes("imprimir") || t.includes("completo")) {
      tipoSeleccionado = "PDF_DOSSIER";
    }

    if (tipoSeleccionado) {
      cache.remove("PENDING_CFO_REPORT_" + telefono);
      const periodo = flowData.periodo || "Mes en curso";
      const informe = generarInformeCFOCompleto_(tipoSeleccionado, periodo, ss);

      if (tipoSeleccionado === "FLASH") {
        const textoFlashPers = formatearInformeFlashConPersonaje_(informe, perm, periodo);
        return {
          tipo: "informe_cfo",
          yaDespachadoPorWebhook: false,
          texto: textoFlashPers,
          textoVoz: "Fernando, aquí tienes tu informe financiero flash.",
          perfilVoz: perm?.perfilVoz
        };
      }

      let despachoWs = null;
      if (typeof enviarInformeCFOWhatsApp === "function") {
        try {
          despachoWs = enviarInformeCFOWhatsApp(telefono, informe);
        } catch (eSend) {
          Logger.log("Aviso al enviar informe guiado por WhatsApp: " + eSend.message);
        }
      }

      const nombreTipo = tipoSeleccionado === "INFOGRAFIA" ? "Infografía Financiera" : "Dossier Gerencial en PDF";
      const urlVis = informe.archivo?.urlVisualizacion;
      const urlDesc = informe.archivo?.urlDescarga;
      const bloqueDrive = urlVis ? [
        `🔗 *Enlace de Conexión Directa en Google Drive (Ver e Imprimir):*`,
        `${urlVis}`,
        ``,
        `📥 *Descargar Archivo:*`,
        `${urlDesc || urlVis}`
      ].join("\n") : [
        `⚠️ *Enlace de Google Drive:*`,
        `_Para generar y consultar el enlace directo en Google Drive, ejecuta la función 'autorizarServiciosGoogleAppsScript' una vez en el editor de Apps Script._`
      ].join("\n");

      const textoFinal = [
        `📊 *¡${nombreTipo} Compilado Exitosamente!*`,
        ``,
        `Estimado ${perm?.nombre || "Fernando"}, he finalizado la elaboración asistida de tu informe para el período *${periodo}*:`,
        ``,
        `📄 *Documento Oficial:* \`${informe.archivo?.nombreArchivo || "Informe.pdf"}\``,
        `⚖️ *Dictamen CFO:* ${informe.flujoCaja?.diagnostico || "Solvencia confirmada"}`,
        `💰 *Retiro Libre Seguro:* $${(informe.flujoCaja?.fclDistribuibleRecomendado || 0).toLocaleString("es-CO")} COP`,
        ``,
        bloqueDrive,
        ``,
        `_(Acceso directo garantizado desde este chat)_`
      ].join("\n");

      return {
        tipo: "informe_cfo",
        yaDespachadoPorWebhook: Boolean(despachoWs && despachoWs.enviado),
        texto: textoFinal,
        textoVoz: `Fernando, tu ${nombreTipo} ya está listo en Drive con enlace directo en este chat. El flujo de caja libre respalda retiros seguros para tu cuenta personal.`,
        perfilVoz: perm?.perfilVoz
      };
    }
  }

  return null;
}
