/**
 * ============================================================================
 * 📚 GENERADOR AUTÓNOMO DEL DOCUMENTO PDF: GUÍA MAESTRA DE COMANDOS Y ACCIONES
 * Edición Médica de Alta Gama • 5 Páginas de Máxima Densidad Visual y Cero Blancos
 * 100% Enfocado en las Herramientas Clínicas del Médico Usuario
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const OUTPUT_PDF_PATH = path.join(__dirname, 'knowledge', 'Guia_Maestra_Comandos_Biblioteca_Medica.pdf');
const CREST_IMG = path.join(__dirname, 'knowledge', 'assets', 'crest.jpg');
const INFOGRAM_IMG = path.join(__dirname, 'knowledge', 'assets', 'infogram.jpg');

function buildPdf() {
  return new Promise((resolve, reject) => {
    // Dimensiones Letter estándar: 612 x 792 pt
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 32, bottom: 32, left: 36, right: 36 },
      bufferPages: true,
      autoFirstPage: true
    });

    const writeStream = fs.createWriteStream(OUTPUT_PDF_PATH);
    doc.pipe(writeStream);

    // Paleta de Colores Premium Institucional Cálida y Quirúrgica
    const colors = {
      navy: '#0A192F',        // Azul Marino Institucional Profundo
      navyLight: '#1E293B',   // Slate Oscuro de Alto Contraste
      teal: '#0D9488',        // Verde Quirúrgico Moderno (Warm Teal)
      tealDark: '#0F766E',    // Teal Oscuro
      tealLight: '#F0FDFA',   // Fondo Menta Sutil
      gold: '#D97706',        // Oro / Ámbar Cálido de Excelencia
      goldDark: '#B45309',    // Ámbar Profundo
      goldLight: '#FEF3C7',   // Fondo Dorado Cálido
      slateBg: '#F8FAFC',     // Fondo Gris Quirúrgico Nítido
      cardBg: '#FFFFFF',      // Blanco Puro para Tarjetas
      border: '#CBD5E1',      // Borde Suave
      borderStrong: '#94A3B8',// Borde Pronunciado
      textDark: '#0F172A',    // Texto Principal
      textBody: '#334155',    // Texto de Lectura
      textMuted: '#64748B',   // Metadatos y Secundario
      alertRed: '#DC2626',    // Alertas Críticas
      alertRedLight: '#FEF2F2',
      alertBlue: '#0284C7',
      alertBlueLight: '#F0F9FF',
      white: '#FFFFFF'
    };

    const pageWidth = 612;
    const pageHeight = 792;
    const contentWidth = 540; // 612 - 72

    // Helper: Insignia / Pill Badge dibujada vectorialmente
    function drawBadge(x, y, text, bgColor, textColor, fontSize = 7.5, padX = 6, padY = 2.5) {
      doc.save();
      doc.font('Helvetica-Bold').fontSize(fontSize);
      const textW = doc.widthOfString(text);
      const bW = textW + padX * 2;
      const bH = fontSize + padY * 2;
      doc.roundedRect(x, y, bW, bH, 3).fill(bgColor);
      doc.fillColor(textColor).text(text, x + padX, y + padY - 0.5, { lineBreak: false });
      doc.restore();
      return bW;
    }

    // Helper: Encabezado institucional superior para páginas internas
    function drawPageHeader(title, sectionCode) {
      doc.save();
      // Barra superior con gradiente de color
      doc.rect(36, 22, contentWidth, 3).fill(colors.navy);
      doc.rect(36, 25, 120, 2).fill(colors.gold);

      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(colors.tealDark)
         .text('BIBLIOTECA MÉDICA DE CIRUGÍA ORTOPÉDICA', 36, 29, { continued: true })
         .font('Helvetica').fillColor(colors.textMuted)
         .text(`   |   ${sectionCode} — ${title.toUpperCase()}`, { align: 'left' });

      doc.rect(36, 40, contentWidth, 0.75).fill(colors.border);
      doc.restore();
    }

    // ========================================================================
    // PÁGINA 1: PORTADA EDITORIAL & ARQUITECTURA DE USO EN QUIRÓFANO
    // ========================================================================
    // Fondo de tarjeta institucional en portada
    doc.save();
    doc.rect(36, 30, contentWidth, 730).fill(colors.slateBg);
    doc.rect(36, 30, contentWidth, 730).lineWidth(1.2).stroke(colors.navy);
    doc.rect(39, 33, contentWidth - 6, 724).lineWidth(0.6).stroke(colors.gold);

    // Banner Superior Navy con acento Dorado
    doc.rect(40, 34, contentWidth - 8, 120).fill(colors.navy);
    doc.rect(40, 154, contentWidth - 8, 3.5).fill(colors.gold);

    // Emblema Institucional
    if (fs.existsSync(CREST_IMG)) {
      doc.image(CREST_IMG, 54, 42, { width: 104, height: 104 });
    }

    // Textos del Banner Superior
    doc.font('Helvetica-Bold').fontSize(16).fillColor(colors.white)
       .text('BIBLIOTECA MÉDICA DE CIRUGÍA ORTOPÉDICA', 170, 52);
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(colors.goldLight)
       .text('REPOSITORIO ACADÉMICO Y ASISTENCIA QUIRÚRGICA 24/7', 170, 72);
    doc.font('Helvetica').fontSize(8.5).fillColor('#CBD5E1')
       .text('Traumatología de Alta Energía • Reconstrucción Ósea • Artroplastia • Columna', 170, 86, { width: 320 });
    doc.font('Helvetica-Bold').fontSize(8).fillColor(colors.tealLight)
       .text('CANAL PERMANENTE DE CONSULTA CLÍNICA EN TIEMPO REAL', 170, 102);

    // Insignias en el banner
    drawBadge(170, 120, 'EDICIÓN OFICIAL 2026', colors.gold, colors.navy, 7.5, 6, 2);
    drawBadge(280, 120, 'ESTÁNDAR AO TRAUMA / PUBMED', colors.teal, colors.white, 7.5, 6, 2);
    drawBadge(440, 120, 'V8 PRODUCTION', colors.navyLight, colors.white, 7.5, 6, 2);
    doc.restore();

    // Título Principal de la Guía
    doc.y = 175;
    doc.font('Helvetica-Bold').fontSize(22).fillColor(colors.navy)
       .text('GUÍA MAESTRA DE HERRAMIENTAS Y COMANDOS', 45, doc.y, { align: 'center', width: contentWidth - 18 });
    doc.font('Helvetica-Bold').fontSize(12).fillColor(colors.tealDark)
       .text('CATÁLOGO CLÍNICO OPERATIVO PARA MÉDICOS ESPECIALISTAS Y RESIDENTES', { align: 'center' });
    doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(colors.textMuted)
       .text('Manual condensado de activación inmediata en quirófano, hospitalización y urgencias', { align: 'center' });

    // Cuadro 1: Filosofía Operativa y Tolerancia Tipográfica (INFOGRAMA TEXTUAL)
    const card1Y = 240;
    doc.save();
    doc.roundedRect(48, card1Y, contentWidth - 24, 130, 5).fillAndStroke(colors.white, colors.border);
    doc.rect(48, card1Y, 5, 130).fill(colors.teal);

    drawBadge(62, card1Y + 10, 'ACCESO INMEDIATO Y TOLERANCIA A DIGITACIÓN EN URGENCIAS', colors.navy, colors.white, 8.5, 8, 3);

    doc.font('Helvetica').fontSize(9).fillColor(colors.textBody)
       .text(
         'El asistente ha sido diseñado para la exigencia real del cirujano en urgencias o en lavado quirúrgico. ' +
         'No requiere memorizar comandos rígidos: el motor semántico reconoce abreviaturas, sinónimos y faltas de tipeo.',
         62, card1Y + 34, { width: contentWidth - 52, align: 'justify', lineGap: 2.5 }
       );

    // Sub-cuadros de activación
    const subW = (contentWidth - 62) / 3;
    // Caja A
    doc.roundedRect(62, card1Y + 68, subW, 50, 4).fillAndStroke(colors.slateBg, colors.border);
    drawBadge(68, card1Y + 73, 'COMANDO EXACTO', colors.tealLight, colors.tealDark, 7);
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(colors.navy).text('COMANDOS / COMANDO', 68, card1Y + 90);
    doc.font('Helvetica').fontSize(7.5).fillColor(colors.textMuted).text('Despliega catálogo completo.', 68, card1Y + 102);

    // Caja B
    doc.roundedRect(62 + subW + 6, card1Y + 68, subW, 50, 4).fillAndStroke(colors.slateBg, colors.border);
    drawBadge(68 + subW + 6, card1Y + 73, 'TOLERANCIA A ERRORES', colors.goldLight, colors.goldDark, 7);
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(colors.navy).text('comados / funciones', 68 + subW + 6, card1Y + 90);
    doc.font('Helvetica').fontSize(7.5).fillColor(colors.textMuted).text('Reconoce la intención al 100%.', 68 + subW + 6, card1Y + 102);

    // Caja C
    doc.roundedRect(62 + (subW + 6) * 2, card1Y + 68, subW, 50, 4).fillAndStroke(colors.slateBg, colors.border);
    drawBadge(68 + (subW + 6) * 2, card1Y + 73, 'ACCESO DIRECTO', colors.alertBlueLight, colors.alertBlue, 7);
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(colors.navy).text('menu / ayuda', 68 + (subW + 6) * 2, card1Y + 90);
    doc.font('Helvetica').fontSize(7.5).fillColor(colors.textMuted).text('Entrega guía y PDF adjunto.', 68 + (subW + 6) * 2, card1Y + 102);
    doc.restore();

    // Cuadro 2: Mapa Conceptual de los 4 Superpoderes Quirúrgicos
    const card2Y = 385;
    doc.save();
    doc.roundedRect(48, card2Y, contentWidth - 24, 305, 5).fillAndStroke(colors.white, colors.border);
    doc.rect(48, card2Y, 5, 305).fill(colors.gold);

    drawBadge(62, card2Y + 10, 'MAPA ESTRUCTURAL DE CAPACIDADES CLÍNICAS (4 MÓDULOS DE ACCIÓN)', colors.navy, colors.white, 8.5, 8, 3);

    const modW = (contentWidth - 60) / 2;
    const modH = 120;

    // Módulo 1: Búsqueda y Literatura
    doc.roundedRect(60, card2Y + 36, modW, modH, 4).fillAndStroke(colors.tealLight, colors.teal);
    drawBadge(68, card2Y + 44, 'MÓDULO 1: BÚSQUEDA Y LITERATURA', colors.teal, colors.white, 7.5);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(colors.navy).text('Recuperación Documental Inmediata', 68, card2Y + 64);
    doc.font('Helvetica').fontSize(8).fillColor(colors.textBody)
       .text('• Acervo Local: Acceso a miles de artículos indexados con enlace firmado de descarga directa (30 días).', 68, card2Y + 78, { width: modW - 16 })
       .text('• PubMed Live: Búsqueda por palabras clave con entrega de 3 citas recientes y PMIDs reales verificados.', 68, card2Y + 104, { width: modW - 16 });

    // Módulo 2: Calculadoras Clínicas
    doc.roundedRect(68 + modW, card2Y + 36, modW, modH, 4).fillAndStroke(colors.goldLight, colors.gold);
    drawBadge(76 + modW, card2Y + 44, 'MÓDULO 2: SCORES Y CALCULADORAS', colors.goldDark, colors.white, 7.5);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(colors.navy).text('Estratificación Quirúrgica Validada', 76 + modW, card2Y + 64);
    doc.font('Helvetica').fontSize(8).fillColor(colors.textBody)
       .text('• Caprini (TVP/TEP), Gustilo-Anderson (Fx Abierta), MESS (Salvamento vs Amputación), Garden y TLICS.', 76 + modW, card2Y + 78, { width: modW - 16 })
       .text('• Pautas de tromboprofilaxis, antibióticos y conducta quirúrgica con citas bibliográficas primarias.', 76 + modW, card2Y + 104, { width: modW - 16 });

    // Módulo 3: Copiloto Preoperatorio
    doc.roundedRect(60, card2Y + 166, modW, modH, 4).fillAndStroke(colors.slateBg, colors.borderStrong);
    drawBadge(68, card2Y + 174, 'MÓDULO 3: COPILOTO PRE-OPERATORIO', colors.navy, colors.white, 7.5);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(colors.navy).text('Planificación y Vías de Abordaje', 68, card2Y + 194);
    doc.font('Helvetica').fontSize(8).fillColor(colors.textBody)
       .text('• CASO: Plan quirúrgico paso a paso, posición del paciente, reducción provisional e implante.', 68, card2Y + 208, { width: modW - 16 })
       .text('• ABORDAJE: Planos anatómicos de Hoppenfeld, estructuras nobles en riesgo y perlas de disección.', 68, card2Y + 234, { width: modW - 16 });

    // Módulo 4: Instrumentación y Videos
    doc.roundedRect(68 + modW, card2Y + 166, modW, modH, 4).fillAndStroke(colors.alertBlueLight, colors.alertBlue);
    drawBadge(76 + modW, card2Y + 174, 'MÓDULO 4: QUIRÓFANO Y MULTIMEDIA', colors.alertBlue, colors.white, 7.5);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(colors.navy).text('Instrumentación y Procedimientos', 76 + modW, card2Y + 194);
    doc.font('Helvetica').fontSize(8).fillColor(colors.textBody)
       .text('• Fichas técnicas de implantes (brocas, machuelos, torques) de fabricantes oficiales (Synthes/Stryker).', 76 + modW, card2Y + 208, { width: modW - 16 })
       .text('• Videos quirúrgicos en 1 clic (VuMedi, OrthoMedia, AO Surgery Reference) para repaso intraoperatorio.', 76 + modW, card2Y + 234, { width: modW - 16 });

    doc.restore();

    // Pie de Portada
    doc.save();
    doc.rect(48, 705, contentWidth - 24, 42).fill(colors.navy);
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(colors.gold)
       .text('ESTRICTAMENTE CONFIDENCIAL • ACCESO EXCLUSIVO PARA MÉDICOS AUTORIZADOS', 56, 714, { align: 'center', width: contentWidth - 40 });
    doc.font('Helvetica').fontSize(7.5).fillColor('#CBD5E1')
       .text('Biblioteca Médica de Cirugía Ortopédica y Traumatología • Sistema Integral de Asistencia Quirúrgica 24/7', 56, 728, { align: 'center', width: contentWidth - 40 });
    doc.restore();

    // ========================================================================
    // PÁGINA 2: BÚSQUEDA DE LITERATURA, PUBMED Y TABLA DE INSTRUMENTACIÓN
    // ========================================================================
    doc.addPage();
    drawPageHeader('Búsqueda Bibliográfica y Fichas de Implantes', 'SECCIÓN 1 & 2');

    // 1. Tarjetas de Búsqueda
    const p2TopY = 50;
    const colW = (contentWidth - 12) / 2;

    // Tarjeta Izquierda: Búsqueda Local
    doc.save();
    doc.roundedRect(36, p2TopY, colW, 115, 5).fillAndStroke(colors.white, colors.border);
    doc.rect(36, p2TopY, 4, 115).fill(colors.teal);
    drawBadge(46, p2TopY + 8, 'BÚSQUEDA DIRECTA EN ACERVO LOCAL', colors.teal, colors.white, 7.5);

    doc.font('Helvetica').fontSize(8).fillColor(colors.textBody)
       .text('Escriba palabras clave del cuadro clínico o implante para recibir la ficha técnica y token de descarga:', 46, p2TopY + 28, { width: colW - 20 });

    doc.roundedRect(46, p2TopY + 54, colW - 20, 24, 3).fill(colors.slateBg);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(colors.navy).text('Sintaxis:', 52, p2TopY + 61);
    doc.font('Helvetica').fontSize(8).fillColor(colors.tealDark).text(' [Tema]   (ej: fractura de pelvis / hoppenfeld)', 92, p2TopY + 61);

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(colors.goldDark).text('Resultado Inmediato:', 46, p2TopY + 84);
    doc.font('Helvetica').fontSize(7.5).fillColor(colors.textBody)
       .text('Ficha bibliográfica + Token de descarga seguro cifrado válido por 30 días.', 46, p2TopY + 95, { width: colW - 20 });
    doc.restore();

    // Tarjeta Derecha: Evidencia PubMed
    doc.save();
    doc.roundedRect(36 + colW + 12, p2TopY, colW, 115, 5).fillAndStroke(colors.white, colors.border);
    doc.rect(36 + colW + 12, p2TopY, 4, 115).fill(colors.alertBlue);
    drawBadge(46 + colW + 12, p2TopY + 8, 'EVIDENCIA PUBMED EN TIEMPO REAL', colors.alertBlue, colors.white, 7.5);

    doc.font('Helvetica').fontSize(8).fillColor(colors.textBody)
       .text('Consulta en vivo la base de datos de la Biblioteca Nacional de Medicina (NLM):', 46 + colW + 12, p2TopY + 28, { width: colW - 20 });

    doc.roundedRect(46 + colW + 12, p2TopY + 54, colW - 20, 24, 3).fill(colors.slateBg);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(colors.navy).text('Sintaxis:', 52 + colW + 12, p2TopY + 61);
    doc.font('Helvetica').fontSize(8).fillColor(colors.alertBlue).text(' EVIDENCIA: [patología]', 92 + colW + 12, p2TopY + 61);

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(colors.alertBlue).text('Resultado Inmediato:', 46 + colW + 12, p2TopY + 84);
    doc.font('Helvetica').fontSize(7.5).fillColor(colors.textBody)
       .text('3 estudios recientes con título, autores, revista indexada y enlaces PMID directos.', 46 + colW + 12, p2TopY + 95, { width: colW - 20 });
    doc.restore();

    // 2. Ficha Técnica de Implantes (Superpoder 3)
    const impY = 175;
    doc.save();
    doc.roundedRect(36, impY, contentWidth, 75, 5).fillAndStroke(colors.white, colors.border);
    doc.rect(36, impY, 4, 75).fill(colors.gold);

    drawBadge(46, impY + 8, 'SUPERPODER: FICHA TÉCNICA DE IMPLANTES E INSTRUMENTACIÓN', colors.navy, colors.white, 8);
    drawBadge(380, impY + 8, 'SINTAXIS: IMPLANTE: [sistema]', colors.goldLight, colors.goldDark, 7.5);

    doc.font('Helvetica').fontSize(8.2).fillColor(colors.textBody)
       .text(
         'Entrega instantánea de medidas exactas de brocas, machuelos, tornillos bloqueados vs corticales, ' +
         'torques calibrados (Nm) y precauciones críticas del fabricante para evitar catástrofes mecánicas o pérdida de fijación.',
         46, impY + 28, { width: contentWidth - 20, lineGap: 2 }
       );

    doc.font('Helvetica-Bold').fontSize(8).fillColor(colors.tealDark)
       .text('Ejemplos de consulta: ', 46, impY + 56, { continued: true })
       .font('Helvetica').fillColor(colors.navy)
       .text('IMPLANTE: Placa PHILOS   •   IMPLANTE: Clavo PFNA   •   IMPLANTE: Tornillo canulado cadera');
    doc.restore();

    // 3. TABLA RÁPIDA DE INSTRUMENTACIÓN QUIRÚRGICA CON RESPALDO BIBLIOGRÁFICO
    const tblY = 260;
    doc.save();
    doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.navy)
       .text('TABLA MAESTRA DE INSTRUMENTACIÓN QUIRÚRGICA Y OBSERVACIONES CLAVES', 36, tblY);
    doc.font('Helvetica-Oblique').fontSize(8).fillColor(colors.textMuted)
       .text('Parámetros mecánicos de fabricante, pautas de osteosíntesis AO Trauma y perlas quirúrgicas verificadas', 36, tblY + 14);

    // Cabecera de la Tabla
    const headY = tblY + 30;
    doc.rect(36, headY, contentWidth, 22).fill(colors.navy);
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(colors.white);
    doc.text('SISTEMA / IMPLANTE', 42, headY + 7);
    doc.text('TORNILLOS', 150, headY + 7);
    doc.text('BROCA', 230, headY + 7);
    doc.text('TORQUE', 290, headY + 7);
    doc.text('OBSERVACIÓN CLAVE Y SUSTENTO BIBLIOGRÁFICO', 345, headY + 7);

    // Filas de la tabla
    const rows = [
      {
        name: 'Placa PHILOS\n(Húmero Proximal)',
        screws: '3.5 mm Bloqueado\ny Cortical',
        drill: 'Broca 2.8 mm\n(Verde AO)',
        torque: '1.5 Nm\n(Dinamométrica)',
        obs: 'Colocación obligatoria de tornillos de calcar medial (fila inferior oblicua) para prevenir colapso en varo. Respaldo: AO Foundation Trauma Guidelines / Charité Berlin.',
        bg: colors.white
      },
      {
        name: 'Clavo PFNA / TFN\n(Fémur Proximal)',
        screws: 'Hoja Cefálica\ny Bloqueo 5.0 mm',
        drill: 'Broca Cefálica\n11.0 mm (Canulada)',
        torque: 'Impactación manual\n(Sin torque)',
        obs: 'Punta de la hoja a 5-10 mm del hueso subcondral en AP y Lateral (TAD < 20 mm para prevenir cut-out). Respaldo: Baumgaertner MR, JBJS Am. PMID: 7673677.',
        bg: colors.slateBg
      },
      {
        name: 'Tornillo Canulado 7.3\n(Cuello Femoral)',
        screws: '7.3 mm Rosca\nParcial (16/32 mm)',
        drill: 'Broca Canulada\n5.0 mm',
        torque: 'Apriete manual\n(Bicortical firme)',
        obs: 'Configuración en triángulo invertido (1 inferior calcar, 2 superiores anterior/posterior). Alambre guía 2.8 mm. Respaldo: Garden RS, JBJS Br. Campbell\'s 14th ed.',
        bg: colors.white
      },
      {
        name: 'LCP Radio Distal\n(Volar / 2.4 mm)',
        screws: '2.4 / 2.7 mm\nBloqueado / Cortical',
        drill: 'Broca 1.8 mm (2.4)\nBroca 2.0 mm (2.7)',
        torque: '0.8 Nm\n(Calibrado)',
        obs: 'No sobrepasar línea watershed para evitar fricción o rotura del tendón flexor largo del pulgar (FPL). Cuidado dorsal con tendón EPL. Respaldo: Orbay JL, Hand Clin. PMID: 16186001.',
        bg: colors.slateBg
      },
      {
        name: 'LCP Fémur Distal\n(Condílea / 4.5-5.0)',
        screws: '4.5 mm Cortical\n5.0 mm Bloqueado',
        drill: 'Broca 4.3 mm (5.0)\nBroca 3.2 mm (4.5)',
        torque: '4.0 Nm\n(Fijación rígida)',
        obs: 'Tornillos condíleos paralelos a la superficie articular distal con inclinación anterior de 10° según anatomía del cóndilo lateral. Respaldo: Schütz M, J Orthop Trauma. PMID: 11468501.',
        bg: colors.white
      },
      {
        name: 'Placa LCP Clavícula\n(Superior / 3.5 mm)',
        screws: '3.5 mm Bloqueado\ny Cortical',
        drill: 'Broca 2.8 mm\nTope de longitud',
        torque: '1.5 Nm\n(Controlado)',
        obs: 'Perforación estrictamente con protector de broca orientado anterior-posterior para proteger el paquete vascular subclavio y pleura apical. Respaldo: Rockwood & Green 9th ed.',
        bg: colors.slateBg
      },
      {
        name: 'Tornillos Herbert\n(Escafoides / Canulado)',
        screws: 'Tornillo Compresión\nSin cabeza 2.5/3.0 mm',
        drill: 'Broca Escalonada\nCanulada',
        torque: 'Manual hasta\nhundimiento total',
        obs: 'El extremo proximal debe quedar completamente sumergido en el cartílago articular para prevenir pinzamiento radiocarpiano. Respaldo: Herbert TJ, Fisher WE. J Bone Joint Surg Br.',
        bg: colors.white
      }
    ];

    let rowY = headY + 22;
    rows.forEach(r => {
      const rH = 50;
      doc.rect(36, rowY, contentWidth, rH).fillAndStroke(r.bg, colors.border);
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(colors.navy).text(r.name, 42, rowY + 6, { width: 102 });
      doc.font('Helvetica').fontSize(7.5).fillColor(colors.textDark).text(r.screws, 150, rowY + 6, { width: 75 });
      doc.font('Helvetica').fontSize(7.5).fillColor(colors.textDark).text(r.drill, 230, rowY + 6, { width: 55 });
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(colors.goldDark).text(r.torque, 290, rowY + 6, { width: 50 });
      doc.font('Helvetica').fontSize(7.2).fillColor(colors.textBody).text(r.obs, 345, rowY + 5, { width: 195, lineGap: 1.5 });
      rowY += rH;
    });

    // Cuadro de Resumen y Recomendación al Pie de Tabla
    doc.roundedRect(36, rowY + 8, contentWidth, 38, 4).fillAndStroke(colors.goldLight, colors.gold);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(colors.goldDark)
       .text('REGLA DE SEGURIDAD EN QUIRÓFANO (CERO FALLAS MECÁNICAS):', 46, rowY + 14);
    doc.font('Helvetica').fontSize(7.5).fillColor(colors.navy)
       .text('Siempre verifique el acople dinamométrico antes del apriete final de tornillos de titanio bloqueados. El exceso de torque desgasta la rosca cónica y genera soldadura en frío irreparable.', 46, rowY + 26, { width: contentWidth - 20 });
    doc.restore();

    // ========================================================================
    // PÁGINA 3: CALCULADORAS CLÍNICAS Y SCORES QUIRÚRGICOS DE URGENCIAS
    // ========================================================================
    doc.addPage();
    drawPageHeader('Calculadoras de Riesgo y Scores Quirúrgicos', 'SECCIÓN 3');

    doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.navy)
       .text('ESTRATIFICACIÓN QUIRÚRGICA VALIDADAS (SUPERPODER 1)', 36, 48);
    doc.font('Helvetica-Oblique').fontSize(8).fillColor(colors.textMuted)
       .text('Cálculo objetivo, puntos de corte, toma de conducta y respaldo bibliográfico indexado', 36, 61);

    // Grid de los 5 Scores Médicos
    const scores = [
      {
        title: 'SCORE CAPRINI (Trombosis Venosa Profunda / TEP)',
        cmd: 'SCORE CAPRINI',
        color: colors.alertRed,
        lightBg: colors.alertRedLight,
        points: 'Estratifica riesgo de TVP/TEP en cirugía ortopédica mayor (Artroplastia, Trauma Pelvis/Fémur).',
        scale: '0-1 Pts: Riesgo Muy Bajo • 2 Pts: Riesgo Bajo • 3-4 Pts: Riesgo Moderado • ≥5 Pts: Riesgo Muy Alto.',
        conduct: 'En pacientes ortopédicos con Caprini ≥ 5: Tromboprofilaxis obligatoria con HBPM (Enoxaparina 40 mg/día) o DOACs (Rivaroxabán / Apixabán) iniciada 12h pre o postoperatorio y mantenida por 14 a 35 días según procedimiento.',
        ref: 'Caprini JA. Thrombosis risk assessment as a guide to quality patient care. Dis Mon. 2010;56(10):576-601. PMID: 20159341.'
      },
      {
        title: 'SCORE GUSTILO-ANDERSON (Fracturas Abiertas)',
        cmd: 'SCORE GUSTILO',
        color: colors.goldDark,
        lightBg: colors.goldLight,
        points: 'Clasificación universal de exposición ósea y daño a partes blandas en huesos largos.',
        scale: 'Grado I: Herida < 1 cm, limpia • Grado II: Herida 1-10 cm, sin daño extenso • Grado III: > 10 cm con daño perióstico masivo (IIIA: cobertura ósea adecuada, IIIB: despegamiento perióstico masivo/requiere colgajo, IIIC: lesión arterial que requiere reparación).',
        conduct: 'Grados I y II: Cefazolina 2g IV c/8h. Grados IIIA-IIIC: Cefazolina 2g + Gentamicina 5 mg/kg/día IV (+ Penicilina G Cristalina si hay sospecha de contaminación con heces o tierra/Clostridium). Desbridamiento quirúrgico precoz.',
        ref: 'Gustilo RB, Anderson JT. Prevention of infection in the treatment of open fractures. J Bone Joint Surg Am. 1984;66(9):1342-6. PMID: 6736236.'
      },
      {
        title: 'SCORE MESS (Mangled Extremity Severity Score)',
        cmd: 'SCORE MESS',
        color: colors.tealDark,
        lightBg: colors.tealLight,
        points: 'Predicción objetiva entre salvamento de extremidad gravemente traumatizada vs amputación primaria.',
        scale: 'Evalúa 4 variables: 1. Energía esquelética/tejidos blandos (1-4 pts) • 2. Isquemia del miembro (1-3 pts, duplicado si >6h) • 3. Choque sistémico (0-2 pts) • 4. Edad del paciente (0-2 pts).',
        conduct: 'Puntuación total < 7: Intento de salvamento y reconstrucción quirúrgica. Puntuación ≥ 7: Alta probabilidad de fallo de revascularización y sepsis sistémica; predice necesidad de amputación primaria con >99% de especificidad.',
        ref: 'Johansen K, et al. Objective criteria accurately predict amputation following lower extremity trauma. J Trauma. 1990;30(5):568-72. PMID: 2213399.'
      },
      {
        title: 'SCORE GARDEN (Fracturas de Cuello Femoral)',
        cmd: 'SCORE GARDEN',
        color: colors.alertBlue,
        lightBg: colors.alertBlueLight,
        points: 'Estratificación del desplazamiento en fracturas intracapsulares de cadera en el adulto mayor.',
        scale: 'Tipo I: Fractura incompleta impactada en valgo • Tipo II: Completa no desplazada • Tipo III: Completa parcialmente desplazada con rotación trabecular • Tipo IV: Completa totalmente desplazada con pérdida de alineación trabecular.',
        conduct: 'Tipos I y II (No desplazadas): Osteosíntesis con 3 tornillos canulados 7.3 mm o placa tornillo deslizante (DHS). Tipos III y IV (Desplazadas) en mayores de 65 años: Artroplastia (Hemiartroplastia bipolar o Artroplastia Total) para evitar necrosis avascular.',
        ref: 'Garden RS. Low-angle fixation in fractures of the femoral neck. J Bone Joint Surg Br. 1961;43-B(4):647-63.'
      },
      {
        title: 'SCORE TLICS (Traumatismo Toracolumbar)',
        cmd: 'SCORE TLICS',
        color: colors.navy,
        lightBg: colors.slateBg,
        points: 'Algoritmo de decisión terapéutica para fracturas de columna toracolumbar.',
        scale: 'Tres pilares: 1. Morfología de la fractura (Compresión 1pt, Estallido 2pts, Traslación/Rotación 3pts, Distracción 4pts) • 2. Complejo Ligamentario Posterior (Intacto 0pts, Sospechoso 2pts, Roto 3pts) • 3. Estado Neurológico (Intacto 0pts, Raíz 2pts, Completo 2pts, Incompleto 3pts, Cauda Equina 3pts).',
        conduct: 'Puntaje ≤ 3: Manejo no quirúrgico (órtesis TLSO y movilización). Puntaje = 4: Criterio del cirujano (conservador vs quirúrgico). Puntaje ≥ 5: Indicación quirúrgica obligatoria de descompresión y estabilización instrumentada.',
        ref: 'Vaccaro AR, et al. The Thoracolumbar Injury Classification and Severity Score. Spine. 2005;30(20):2325-33. PMID: 16227897.'
      }
    ];

    let scY = 78;
    scores.forEach(s => {
      const cardH = 126;
      doc.save();
      doc.roundedRect(36, scY, contentWidth, cardH, 5).fillAndStroke(colors.white, colors.border);
      doc.rect(36, scY, 4, cardH).fill(s.color);

      // Título del Score y Badge de Comando
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(colors.navy).text(s.title, 46, scY + 8);
      drawBadge(contentWidth - 75, scY + 6, s.cmd, s.lightBg, s.color, 7.5, 6, 2);

      // Descripción y Escala
      doc.font('Helvetica').fontSize(7.5).fillColor(colors.textBody).text(s.points, 46, scY + 23, { width: contentWidth - 20 });
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(colors.navy).text('Estratificación: ', 46, scY + 36, { continued: true })
         .font('Helvetica').fillColor(colors.textDark).text(s.scale, { width: contentWidth - 20 });

      // Conducta Clínica Recomendada
      doc.roundedRect(46, scY + 54, contentWidth - 20, 42, 3).fill(s.lightBg);
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(s.color).text('Conducta y Pauta Quirúrgica:', 52, scY + 59);
      doc.font('Helvetica').fontSize(7.2).fillColor(colors.textDark).text(s.conduct, 52, scY + 70, { width: contentWidth - 32, lineGap: 1.2 });

      // Cita Bibliográfica Rigurosa
      doc.font('Helvetica-Bold').fontSize(6.8).fillColor(colors.goldDark).text('Cita Primaria: ', 46, scY + 104, { continued: true })
         .font('Helvetica-Oblique').fillColor(colors.textMuted).text(s.ref, { width: contentWidth - 20 });

      doc.restore();
      scY += cardH + 7;
    });

    // ========================================================================
    // PÁGINA 4: COPILOTO PRE-OPERATORIO, ABORDAJES E INTERCONSULTAS
    // ========================================================================
    doc.addPage();
    drawPageHeader('Copiloto Pre-Operatorio e Interconsultas', 'SECCIÓN 4');

    doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.navy)
       .text('PLANIFICACIÓN QUIRÚRGICA AVANZADA (SUPERPODERES 2 Y 4)', 36, 48);
    doc.font('Helvetica-Oblique').fontSize(8).fillColor(colors.textMuted)
       .text('Asistencia cognitiva en tiempo real para preparación de casos, vías anatómicas e interconsultas', 36, 61);

    // Infograma Gráfico Quirúrgico Incrustado
    const infoY = 76;
    if (fs.existsSync(INFOGRAM_IMG)) {
      doc.save();
      doc.roundedRect(36, infoY, contentWidth, 195, 5).lineWidth(0.8).stroke(colors.teal);
      doc.image(INFOGRAM_IMG, 37, infoY + 1, { width: contentWidth - 2, height: 193 });
      doc.restore();
    }

    // Tarjeta 1: Copiloto de Caso Complejo (CASO:)
    const cpY = 280;
    doc.save();
    doc.roundedRect(36, cpY, colW, 190, 5).fillAndStroke(colors.white, colors.border);
    doc.rect(36, cpY, 4, 190).fill(colors.teal);
    drawBadge(46, cpY + 8, 'COPILOTO DE CASOS COMPLEJOS', colors.teal, colors.white, 7.5);
    drawBadge(180, cpY + 8, 'CASO: [patología]', colors.tealLight, colors.tealDark, 7);

    doc.font('Helvetica').fontSize(7.8).fillColor(colors.textBody)
       .text('Genera un plan de abordaje integral antes de entrar a quirófano:', 46, cpY + 28, { width: colW - 20 });

    const caseSteps = [
      '1. Posición y Mesa: Tracción vs radiotransparente.',
      '2. Vía Quirúrgica: Abordaje óptimo y ventanas.',
      '3. Reducción Provisional: Clavos Schanz, pinzas de reducción.',
      '4. Implante y Fijación: Placa anatómica vs clavo cefalomedular.',
      '5. Checklist Intraoperatorio: Radioscopia AP/Lateral y axiales.'
    ];
    let csY = cpY + 44;
    caseSteps.forEach(st => {
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(colors.navy).text(st.split(':')[0] + ':', 46, csY);
      doc.font('Helvetica').fontSize(7.2).fillColor(colors.textBody).text(st.split(':')[1] || '', 46, csY + 10, { width: colW - 20 });
      csY += 22;
    });

    doc.roundedRect(46, cpY + 156, colW - 20, 24, 3).fill(colors.tealLight);
    doc.font('Helvetica-Bold').fontSize(7.2).fillColor(colors.tealDark).text('Ejemplo de activación:', 52, cpY + 160);
    doc.font('Helvetica').fontSize(7.2).fillColor(colors.navy).text('CASO: fractura subtrocanterica Seinsheimer V', 52, cpY + 169);
    doc.restore();

    // Tarjeta 2: Abordajes Anatómicos de Hoppenfeld (ABORDAJE:)
    doc.save();
    doc.roundedRect(36 + colW + 12, cpY, colW, 190, 5).fillAndStroke(colors.white, colors.border);
    doc.rect(36 + colW + 12, cpY, 4, 190).fill(colors.gold);
    drawBadge(46 + colW + 12, cpY + 8, 'VÍAS DE ABORDAJE QUIRÚRGICO', colors.goldDark, colors.white, 7.5);
    drawBadge(180 + colW + 12, cpY + 8, 'ABORDAJE: [nombre]', colors.goldLight, colors.goldDark, 7);

    doc.font('Helvetica').fontSize(7.8).fillColor(colors.textBody)
       .text('Detalla la anatomía quirúrgica de Hoppenfeld y estructuras nobles:', 46 + colW + 12, cpY + 28, { width: colW - 20 });

    const abSteps = [
      '1. Plano Internervioso: Músculos inervados por pares distintos.',
      '2. Intervalo de Disección: Planos superficial y profundo.',
      '3. Estructuras en Peligro: Nervios y vasos en riesgo lesional.',
      '4. Ampliación de Vía: Proximal o distal si se complica la reducción.',
      '5. Cierre Anatómico: Suturas por planos y drenajes.'
    ];
    let asY = cpY + 44;
    abSteps.forEach(st => {
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(colors.navy).text(st.split(':')[0] + ':', 46 + colW + 12, asY);
      doc.font('Helvetica').fontSize(7.2).fillColor(colors.textBody).text(st.split(':')[1] || '', 46 + colW + 12, asY + 10, { width: colW - 20 });
      asY += 22;
    });

    doc.roundedRect(46 + colW + 12, cpY + 156, colW - 20, 24, 3).fill(colors.goldLight);
    doc.font('Helvetica-Bold').fontSize(7.2).fillColor(colors.goldDark).text('Ejemplo de activación:', 52 + colW + 12, cpY + 160);
    doc.font('Helvetica').fontSize(7.2).fillColor(colors.navy).text('ABORDAJE: Kocher-Langenbeck cadera', 52 + colW + 12, cpY + 169);
    doc.restore();

    // Tarjeta 3: Redactor Automatizado de Interconsultas (INTERCONSULTA:)
    const intY = 480;
    doc.save();
    doc.roundedRect(36, intY, contentWidth, 245, 5).fillAndStroke(colors.white, colors.border);
    doc.rect(36, intY, 5, 245).fill(colors.navy);

    drawBadge(46, intY + 10, 'REDACTOR AUTOMATIZADO DE INTERCONSULTAS DE URGENCIAS (SUPERPODER 4)', colors.navy, colors.white, 8);
    drawBadge(410, intY + 10, 'INTERCONSULTA: [datos]', colors.alertBlueLight, colors.alertBlue, 7.5);

    doc.font('Helvetica').fontSize(8.2).fillColor(colors.textBody)
       .text(
         'Redacta en segundos la nota de respuesta formal de interconsulta ortopédica con rigor médico-legal, ' +
         'siguiendo la estructura ATLS / AO Trauma lista para transcribir a la historia clínica del hospital.',
         46, intY + 30, { width: contentWidth - 20, lineGap: 1.5 }
       );

    // Comparativa: Entrada rápida vs Salida Formal
    const boxW = (contentWidth - 30) / 2;
    // Caja Entrada
    doc.roundedRect(46, intY + 56, boxW, 140, 4).fillAndStroke(colors.slateBg, colors.border);
    drawBadge(54, intY + 62, 'MENSAJE RÁPIDO DESDE WHATSAPP', colors.goldLight, colors.goldDark, 7);
    doc.font('Helvetica-Bold').fontSize(7.8).fillColor(colors.navy).text('Sintaxis compacta en una sola línea:', 54, intY + 80);
    doc.font('Helvetica-Oblique').fontSize(7.5).fillColor(colors.textDark)
       .text(
         'INTERCONSULTA: Masculino 28 años, accidente moto alta energía, deformidad tercio medio pierna derecha, herida anterior de 4 cm con sangrado activo, pulsos distales presentes pedio y tibial posterior, sensibilidad conservada.',
         54, intY + 94, { width: boxW - 16, lineGap: 2.2 }
       );

    // Caja Salida
    doc.roundedRect(46 + boxW + 10, intY + 56, boxW, 140, 4).fillAndStroke(colors.tealLight, colors.teal);
    drawBadge(54 + boxW + 10, intY + 62, 'RESPUESTA ESTRUCTURADA INMEDIATA', colors.teal, colors.white, 7);
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(colors.navy).text('Estructura generada:', 54 + boxW + 10, intY + 80);
    doc.font('Helvetica').fontSize(7.2).fillColor(colors.textDark)
       .text('• Impresión Diagnóstica: Fx diafisaria tibia/peroné Gustilo-Anderson II.', 54 + boxW + 10, intY + 92, { width: boxW - 16 })
       .text('• Pauta Antibiótica: Cefazolina 2g IV c/8h + Toxoide Tetánico.', 54 + boxW + 10, intY + 106, { width: boxW - 16 })
       .text('• Inmovilización: Férula inguinopédica posterior en flexión de 15° rodilla.', 54 + boxW + 10, intY + 120, { width: boxW - 16 })
       .text('• Plan Quirúrgico: Lavado mecánico urgente y osteosíntesis definitiva (Clavo intramedular fresado).', 54 + boxW + 10, intY + 134, { width: boxW - 16 });

    // Cuadro de Respaldo Bibliográfico
    doc.roundedRect(46, intY + 204, contentWidth - 20, 32, 3).fill(colors.slateBg);
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(colors.navy)
       .text('Sustento Médico-Legal: ', 54, intY + 210, { continued: true })
       .font('Helvetica').fillColor(colors.textBody)
       .text('Estructuración bajo los lineamientos de la American Academy of Orthopaedic Surgeons (AAOS) y el Advanced Trauma Life Support (ATLS 10th Edition). Cero omisiones en examen neurovascular distal.');
    doc.restore();

    // ========================================================================
    // PÁGINA 5: MULTIMEDIA, BUZÓN Y HOJA MNEMOTÉCNICA EXCLUSIVA DEL USUARIO
    // ========================================================================
    doc.addPage();
    drawPageHeader('Recursos Complementarios y Hoja de Bolsillo', 'SECCIÓN 5');

    // 1. Tres Tarjetas Superiores Compactas
    const p5Y = 48;
    const miniW = (contentWidth - 16) / 3;

    // Mini 1: Videos Quirúrgicos
    doc.save();
    doc.roundedRect(36, p5Y, miniW, 85, 4).fillAndStroke(colors.white, colors.border);
    doc.rect(36, p5Y, 3, 85).fill(colors.alertRed);
    drawBadge(44, p5Y + 6, 'VIDEOS EN 1 CLIC', colors.alertRedLight, colors.alertRed, 7);
    doc.font('Helvetica-Bold').fontSize(7.8).fillColor(colors.navy).text('VIDEOS: [técnica]', 44, p5Y + 23);
    doc.font('Helvetica').fontSize(7.2).fillColor(colors.textBody)
       .text('Enlaces directos a demostraciones de cirujanos máster en VuMedi, OrthoMedia y AO Surgery Reference.', 44, p5Y + 35, { width: miniW - 14, lineGap: 1.5 });
    doc.font('Helvetica-Oblique').fontSize(6.8).fillColor(colors.textMuted).text('Ej: VIDEOS: manguito rotador', 44, p5Y + 70);
    doc.restore();

    // Mini 2: Buzón Digital
    doc.save();
    doc.roundedRect(36 + miniW + 8, p5Y, miniW, 85, 4).fillAndStroke(colors.white, colors.border);
    doc.rect(36 + miniW + 8, p5Y, 3, 85).fill(colors.teal);
    drawBadge(44 + miniW + 8, p5Y + 6, 'BUZÓN Y APORTES', colors.tealLight, colors.tealDark, 7);
    doc.font('Helvetica-Bold').fontSize(7.8).fillColor(colors.navy).text('BUZON / APORTE', 44 + miniW + 8, p5Y + 23);
    doc.font('Helvetica').fontSize(7.2).fillColor(colors.textBody)
       .text('Depósito confidencial de artículos y libros en PDF (hasta 2 GB con fragmentación inteligente).', 44 + miniW + 8, p5Y + 35, { width: miniW - 14, lineGap: 1.5 });
    doc.font('Helvetica-Oblique').fontSize(6.8).fillColor(colors.textMuted).text('Enlace cifrado en 1 toque.', 44 + miniW + 8, p5Y + 70);
    doc.restore();

    // Mini 3: Canal Confidencial
    doc.save();
    doc.roundedRect(36 + (miniW + 8) * 2, p5Y, miniW, 85, 4).fillAndStroke(colors.white, colors.border);
    doc.rect(36 + (miniW + 8) * 2, p5Y, 3, 85).fill(colors.gold);
    drawBadge(44 + (miniW + 8) * 2, p5Y + 6, 'CANAL DIRECCIÓN', colors.goldLight, colors.goldDark, 7);
    doc.font('Helvetica-Bold').fontSize(7.8).fillColor(colors.navy).text('MENSAJE A LA DIRECCION:', 44 + (miniW + 8) * 2, p5Y + 23);
    doc.font('Helvetica').fontSize(7.2).fillColor(colors.textBody)
       .text('Relé directo y anónimo hacia la Dirección para dudas docentes, solicitudes o mejoras del acervo.', 44 + (miniW + 8) * 2, p5Y + 35, { width: miniW - 14, lineGap: 1.5 });
    doc.font('Helvetica-Oblique').fontSize(6.8).fillColor(colors.textMuted).text('Identidad 100% blindada.', 44 + (miniW + 8) * 2, p5Y + 70);
    doc.restore();

    // 2. HOJA MNEMOTÉCNICA DE REFERENCIA RÁPIDA (SOLO COMANDOS DEL USUARIO)
    const chY = 145;
    doc.save();
    doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.navy)
       .text('HOJA MNEMOTÉCNICA DE BOLSILLO (CHEAT SHEET PARA EL CIRUJANO)', 36, chY);
    doc.font('Helvetica-Oblique').fontSize(8).fillColor(colors.textMuted)
       .text('Todas las funciones operativas del usuario médico condensadas para tener a mano en quirófano o urgencias', 36, chY + 13);

    // Cabecera Tabla Cheat Sheet
    const csHeadY = chY + 27;
    doc.rect(36, csHeadY, contentWidth, 20).fill(colors.navy);
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(colors.white);
    doc.text('FUNCIÓN / COMANDO', 42, csHeadY + 6);
    doc.text('SINTAXIS', 150, csHeadY + 6);
    doc.text('EJEMPLO REAL', 260, csHeadY + 6);
    doc.text('RESULTADO CLÍNICO ENTREGADO', 380, csHeadY + 6);

    // Filas exclusivas para el usuario médico
    const cheatRows = [
      {
        cmd: 'Catálogo de Comandos',
        syntax: 'COMANDOS / COMANDO',
        eg: 'COMANDOS',
        res: 'Despliega la carta interactiva y adjunta este documento PDF oficial.',
        bg: colors.white
      },
      {
        cmd: 'Tolerancia Tipográfica',
        syntax: 'comados / funciones / menu',
        eg: 'comados',
        res: 'Identifica la intención y entrega la ayuda completa sin error de tipeo.',
        bg: colors.slateBg
      },
      {
        cmd: 'Búsqueda Acervo Local',
        syntax: '[Palabras clave de la patología]',
        eg: 'fractura de pelvis',
        res: 'Ficha técnica del artículo y enlace de descarga firmado (30 días).',
        bg: colors.white
      },
      {
        cmd: 'Evidencia PubMed Live',
        syntax: 'EVIDENCIA: [patología]',
        eg: 'EVIDENCIA: fractura calcaneo',
        res: '3 artículos recientes indexados con autores, revista y PMIDs reales.',
        bg: colors.slateBg
      },
      {
        cmd: 'Score Caprini (TVP/TEP)',
        syntax: 'SCORE CAPRINI',
        eg: 'SCORE CAPRINI',
        res: 'Estratificación de riesgo tromboembólico y pauta profiláctica HBPM.',
        bg: colors.white
      },
      {
        cmd: 'Score Gustilo (Fx Abierta)',
        syntax: 'SCORE GUSTILO',
        eg: 'SCORE GUSTILO',
        res: 'Clasificación de herida (I-IIIC), esquema de antibióticos y desbridamiento.',
        bg: colors.slateBg
      },
      {
        cmd: 'Score MESS (Salvamento)',
        syntax: 'SCORE MESS',
        eg: 'SCORE MESS',
        res: 'Puntaje de corte (≥7 amputación) en trauma de alta energía de miembro.',
        bg: colors.white
      },
      {
        cmd: 'Score Garden (Cadera)',
        syntax: 'SCORE GARDEN',
        eg: 'SCORE GARDEN',
        res: 'Desplazamiento intracapsular y decisión: Osteosíntesis vs Artroplastia.',
        bg: colors.slateBg
      },
      {
        cmd: 'Score TLICS (Columna)',
        syntax: 'SCORE TLICS',
        eg: 'SCORE TLICS',
        res: 'Evaluación morfológica, PLC y neurología (≤3 ortesis vs ≥5 cirugía).',
        bg: colors.white
      },
      {
        cmd: 'Copiloto Pre-Operatorio',
        syntax: 'CASO: [patología/fractura]',
        eg: 'CASO: fractura subtrocanterica',
        res: 'Plan prequirúrgico: posición, reducción, instrumental y checklist C-Arm.',
        bg: colors.slateBg
      },
      {
        cmd: 'Vías de Abordaje',
        syntax: 'ABORDAJE: [nombre vía]',
        eg: 'ABORDAJE: Kocher-Langenbeck',
        res: 'Plano internervioso, intervalo anatómico, estructuras en peligro y perlas.',
        bg: colors.white
      },
      {
        cmd: 'Ficha de Implantes',
        syntax: 'IMPLANTE: [sistema]',
        eg: 'IMPLANTE: Placa PHILOS',
        res: 'Medidas exactas de brocas, machuelos, tornillos y torque de apriete (Nm).',
        bg: colors.slateBg
      },
      {
        cmd: 'Redactor Interconsulta',
        syntax: 'INTERCONSULTA: [datos]',
        eg: 'INTERCONSULTA: fx expuesta tibia',
        res: 'Nota formal completa médico-legal ATLS/AO lista para historia clínica.',
        bg: colors.white
      },
      {
        cmd: 'Literatura Open Access',
        syntax: 'OPEN ACCESS: [tema]',
        eg: 'OPEN ACCESS: artroplastia',
        res: 'Búsqueda y entrega directa de artículos científicos de libre acceso.',
        bg: colors.slateBg
      },
      {
        cmd: 'Videos Quirúrgicos',
        syntax: 'VIDEOS: [técnica]',
        eg: 'VIDEOS: artroplastia hombro',
        res: 'Enlaces en 1 solo clic a cirugías reales en VuMedi, OrthoMedia y AO.',
        bg: colors.white
      },
      {
        cmd: 'Depósito en Buzón Web',
        syntax: 'BUZON',
        eg: 'BUZON',
        res: 'Enlace efímero con credencial segura al buzón web (archivos hasta 2 GB).',
        bg: colors.slateBg
      },
      {
        cmd: 'Aporte en Chat WhatsApp',
        syntax: 'APORTE (Adjuntando PDF)',
        eg: '[Adjuntar archivo PDF en chat]',
        res: 'Recepción automática y catalogación para enriquecimiento del acervo.',
        bg: colors.white
      },
      {
        cmd: 'Manual Interactivo Web',
        syntax: 'MANUAL',
        eg: 'MANUAL',
        res: 'Entrega enlace con visor enriquecido y resumen de gobernanza.',
        bg: colors.slateBg
      },
      {
        cmd: 'Canal a la Dirección',
        syntax: 'MENSAJE A LA DIRECCION: [texto]',
        eg: 'MENSAJE A LA DIRECCION: consulta',
        res: 'Comunicación confidencial y bidireccional anónima con la Dirección.',
        bg: colors.white
      }
    ];

    let crY = csHeadY + 20;
    cheatRows.forEach(cr => {
      const crH = 25.5;
      doc.rect(36, crY, contentWidth, crH).fillAndStroke(cr.bg, colors.border);
      doc.font('Helvetica-Bold').fontSize(7.2).fillColor(colors.navy).text(cr.cmd, 42, crY + 7, { width: 104 });
      doc.font('Helvetica').fontSize(7.2).fillColor(colors.tealDark).text(cr.syntax, 150, crY + 7, { width: 105 });
      doc.font('Helvetica-Oblique').fontSize(7.2).fillColor(colors.goldDark).text(cr.eg, 260, crY + 7, { width: 115 });
      doc.font('Helvetica').fontSize(6.9).fillColor(colors.textDark).text(cr.res, 380, crY + 4, { width: 190, lineGap: 1.1 });
      crY += crH;
    });

    // Cuadro Final de Cierre y Garantía Institucional
    doc.roundedRect(36, crY + 6, contentWidth, 44, 4).fillAndStroke(colors.navy, colors.gold);
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(colors.gold)
       .text('BIBLIOTECA MÉDICA DE CIRUGÍA ORTOPÉDICA Y TRAUMATOLOGÍA', 46, crY + 12, { align: 'center', width: contentWidth - 20 });
    doc.font('Helvetica').fontSize(7.5).fillColor(colors.white)
       .text('Sistema Hospitalario de Asistencia Clínica Continua • Respaldado por Evidencia Científica Indexada • Servicio Activo 24/7', 46, crY + 26, { align: 'center', width: contentWidth - 20 });
     doc.restore();

    // ========================================================================
    // NUMERACIÓN DE PÁGINAS Y PIE DE PÁGINA DINÁMICO
    // ========================================================================
    const range = doc.bufferedPageRange();
    const totalPages = range.count;

    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc.page.margins.bottom = 0;
      // En la portada no sobreescribimos pie
      if (i > 0) {
        doc.save();
        doc.fillColor(colors.border).rect(36, pageHeight - 24, contentWidth, 0.75).fill();
        doc.font('Helvetica').fontSize(7.2).fillColor(colors.textMuted)
           .text('Biblioteca Médica de Cirugía Ortopédica y Traumatología  •  Guía Maestra de Comandos', 36, pageHeight - 18, { width: contentWidth / 2, align: 'left', lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(7.2).fillColor(colors.tealDark)
           .text(`Página ${i + 1} de ${totalPages}  |  Uso Clínico Exclusivo`, 36 + (contentWidth / 2), pageHeight - 18, { width: contentWidth / 2, align: 'right', lineBreak: false });
        doc.restore();
      }
    }

    doc.end();

    writeStream.on('finish', () => {
      const stats = fs.statSync(OUTPUT_PDF_PATH);
      console.log(`✅ PDF generado exitosamente: ${OUTPUT_PDF_PATH}`);
      console.log(`📊 Total páginas: ${totalPages} | Tamaño: ${(stats.size / 1024).toFixed(1)} KB`);
      resolve({ path: OUTPUT_PDF_PATH, size: stats.size, pages: totalPages });
    });

    writeStream.on('error', reject);
  });
}

if (require.main === module) {
  buildPdf().catch(err => {
    console.error('❌ Error generando PDF:', err);
    process.exit(1);
  });
}

module.exports = { buildPdf, OUTPUT_PDF_PATH };
