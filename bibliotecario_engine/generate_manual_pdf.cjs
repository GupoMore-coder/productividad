/**
 * GENERADOR DE MANUAL DE USO OFICIAL EN PDF
 * Biblioteca Médica de Cirugía Ortopédica y Traumatología
 * Dirección: Gestor de Contenido
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('C:/Users/ferna/Documents/Biblioteca Premium/node_modules/pdf-lib');

const OUTPUT_PDF_PATH = path.join(__dirname, 'knowledge', 'Manual_de_Uso_Biblioteca_Ortopedica.pdf');

async function createManualPdf() {
  const pdfDoc = await PDFDocument.create();
  
  // Fuentes estándar
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Paleta de colores clínicos y elegantes
  const primaryNavy = rgb(0.04, 0.10, 0.18);    // #0a192f
  const secondaryNavy = rgb(0.09, 0.22, 0.35);
  const accentTeal = rgb(0.05, 0.58, 0.53);     // #0d9488
  const cyanColor = rgb(0.01, 0.52, 0.78);      // #0284c7
  const darkGray = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.96, 0.97, 0.98);
  const white = rgb(1, 1, 1);
  const warningRed = rgb(0.75, 0.12, 0.12);

  // Helper para nueva página
  function addPage(pageNum, totalPages = 3) {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    
    // Franja superior institucional
    page.drawRectangle({
      x: 0,
      y: height - 10,
      width: width,
      height: 10,
      color: primaryNavy
    });

    // Franja inferior con pie de página
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: 28,
      color: lightGray
    });

    page.drawText('Biblioteca Médica Especializada de Cirugía Ortopédica | Dirección Institucional: Dirección del Proyecto', {
      x: 40,
      y: 10,
      size: 7.8,
      font: fontRegular,
      color: darkGray
    });

    page.drawText(`Edición 2026.5 • Página ${pageNum} de ${totalPages}`, {
      x: width - 150,
      y: 10,
      size: 7.8,
      font: fontBold,
      color: accentTeal
    });

    return page;
  }

  // ==========================================
  // PÁGINA 1: PORTADA, ADMISIÓN Y MODALIDADES DE BÚSQUEDA
  // ==========================================
  const page1 = addPage(1);
  let y = 785;

  // Encabezado institucional
  page1.drawText('GUÍA MAESTRA DE USO, PROCEDIMIENTOS Y GOBERNANZA', {
    x: 40,
    y: y,
    size: 9.5,
    font: fontBold,
    color: accentTeal
  });

  y -= 26;
  page1.drawText('Biblioteca Médica Especializada', {
    x: 40,
    y: y,
    size: 22,
    font: fontBold,
    color: primaryNavy
  });

  y -= 20;
  page1.drawText('Cirugía Ortopédica y Traumatología', {
    x: 40,
    y: y,
    size: 15,
    font: fontBold,
    color: secondaryNavy
  });

  y -= 16;
  page1.drawLine({
    start: { x: 40, y: y },
    end: { x: 555, y: y },
    thickness: 1.5,
    color: accentTeal
  });

  y -= 22;
  // Cuadro informativo de Dirección (Nivel horizontal)
  page1.drawRectangle({
    x: 40,
    y: y - 36,
    width: 515,
    height: 44,
    color: lightGray,
    borderColor: accentTeal,
    borderWidth: 1
  });

  page1.drawText('DIRECCIÓN Y CUSTODIA INSTITUCIONAL:', {
    x: 52,
    y: y - 13,
    size: 8,
    font: fontBold,
    color: primaryNavy
  });
  page1.drawText('Gestor de Contenido • Servicio Clínico 24/7 de Apoyo Académico', {
    x: 52,
    y: y - 26,
    size: 10,
    font: fontBold,
    color: accentTeal
  });

  y -= 54;

  // SECCIÓN 1: FILOSOFÍA Y ANONIMATO
  page1.drawText('1. FILOSOFÍA ACADÉMICA Y PRINCIPIO DE ANONIMATO CARDINAL', {
    x: 40,
    y: y,
    size: 11,
    font: fontBold,
    color: primaryNavy
  });
  y -= 15;
  const p1Texts = [
    '• Apoyo Médico y Exención de Responsabilidad: Iniciativa médica independiente para fortalecer la formación continua',
    '  de residentes y cirujanos ortopedistas. La literatura, guías y monografías provistas son de carácter estrictamente pedagógico;',
    '  toda decisión diagnóstica y terapéutica corresponde en exclusiva al criterio clínico del médico tratante.',
    '• Anonimato Cardinal: El proyecto protege con celo inquebrantable la privacidad de la Dirección y de los usuarios autorizados.',
    '  Todas las solicitudes, intermediaciones y respuestas operan a través del asistente autónomo con cifrado de extremo a extremo.'
  ];
  for (const line of p1Texts) {
    page1.drawText(line, { x: 45, y: y, size: 8.4, font: fontRegular, color: darkGray });
    y -= 12.5;
  }

  y -= 10;

  // SECCIÓN 2: PROTOCOLO DE ADMISIÓN
  page1.drawText('2. PROTOCOLO DE ADMISIÓN Y CICLO DE VIDA DEL USUARIO', {
    x: 40,
    y: y,
    size: 11,
    font: fontBold,
    color: primaryNavy
  });
  y -= 15;
  const p2Texts = [
    '1. Solicitud de Acceso: El médico escribe al WhatsApp del bot indicando nombre, hospital/universidad y nivel (R1–R4, Especialista).',
    '2. Análisis Autónomo: La solicitud es analizada de forma autónoma bajo parámetros preestablecidos y lineamientos definidos,',
    '   previa verificación de la veracidad de la información suministrada en un período aproximado de 24 horas.',
    '3. Habilitación Plena Inmediata: Confirmación de bienvenida, entrega del Manual Oficial interactivo y habilitación 24/7.',
    '• Multilingüismo Ilimitado: Selección libre del idioma de comunicación (ES, EN, PT, FR, IT) sin límites de cambio.',
    '  Los artículos y tratados en PDF se descargan y preservan estrictamente en su idioma original de publicación.'
  ];
  for (const line of p2Texts) {
    page1.drawText(line, { x: 45, y: y, size: 8.4, font: fontRegular, color: darkGray });
    y -= 12.5;
  }

  y -= 10;

  // SECCIÓN 3: MODALIDADES DE BÚSQUEDA
  page1.drawText('3. MODALIDADES DE BÚSQUEDA QUIRÚRGICA EN EL CATÁLOGO ESPECIALIZADO', {
    x: 40,
    y: y,
    size: 11,
    font: fontBold,
    color: primaryNavy
  });
  y -= 15;
  const p3Texts = [
    'El sistema incorpora 9 vías de recuperación para resolver consultas intraoperatorias y académicas al instante:',
    '• Patología o Técnica Quirúrgica: Tratados y monografías (ej: "Artroplastia reversa de hombro", "Latarjet", "Infección periprotésica").',
    '• Clasificación AO/OTA & Epónimos: Trazos y principios de reducción (ej: "AO 31-A2", "Schatzker II", "Garden III", "Neer").',
    '• Vías de Abordaje Anatómico: Disección quirúrgica y planos internerviosos (ej: "Abordaje anterolateral de cadera").',
    '• Instrumental y Marcas: Guías oficiales de fabricantes (ej: "Synthes LCP", "Clavo Expert", "Stryker T2", "Zimmer Trabecular").',
    '• Código DOI, PMID o ISBN: Recuperación directa o apertura de ticket (ej: "10.1016/j.otsr.2023.103...").',
    '• Tolerancia a Errores (Fuzzy Levenshtein): Recuperación aun con errores de digitación o tildes (ej: "artroplasta de cadra").',
    '• Consultas por Audio / Voz: Transcripción de terminología quirúrgica desde notas de voz enviadas al chat.',
    '• Menú Temático de Especialidades: Despliegue del catálogo clasificado enviando la palabra "MENU".',
    '• Manual Oficial: Despacho instantáneo del visor web interactivo y PDF enviando "MANUAL" o "AYUDA".'
  ];
  for (const line of p3Texts) {
    page1.drawText(line, { x: 45, y: y, size: 8.4, font: fontRegular, color: darkGray });
    y -= 12.5;
  }

  // ==========================================
  // PÁGINA 2: EVIDENCIA, NOTEBOOKLM, APORTE Y MULTIMODAL
  // ==========================================
  const page2 = addPage(2);
  y = 785;

  // SECCIÓN 4: MOTOR DE EVIDENCIA GLOBAL
  page2.drawText('4. MOTOR DE EVIDENCIA MÉDICA GLOBAL (PUBMED & SEMANTIC SCHOLAR)', {
    x: 40,
    y: y,
    size: 11,
    font: fontBold,
    color: primaryNavy
  });
  y -= 15;
  const p4Texts = [
    '• Consulta Directa: Permite interrogar más de 35 millones de publicaciones biomédicas indexadas en lenguaje natural:',
    '  Comando: EVIDENCIA: [pregunta o patología] (ej: "EVIDENCIA: Cerclaje vs placas bloqueadas en fracturas de rótula 34-C3").',
    '• Resumen Clínico: Consenso mundial actual y análisis estructurado de los 3 estudios más recientes de alto impacto.',
    '• Ficha de Evidencia PDF: Generación de documento formal bajo reglas institucionales con tabla PICO y escala Oxford (I a V).'
  ];
  for (const line of p4Texts) {
    page2.drawText(line, { x: 45, y: y, size: 8.4, font: fontRegular, color: darkGray });
    y -= 12.5;
  }

  y -= 10;

  // SECCIÓN 5: NOTEBOOKLM
  page2.drawText('5. LECTURA CRÍTICA DE ARTÍCULOS PROPIOS (MOTOR NOTEBOOKLM CON GEMINI)', {
    x: 40,
    y: y,
    size: 11,
    font: fontBold,
    color: primaryNavy
  });
  y -= 15;
  const p5Texts = [
    '• Flujo Guiado: El usuario escribe "ANALIZAR: [preguntas o foco]", el asistente solicita adjuntar un máximo de 2 artículos en PDF.',
    '  (Se admiten artículos científicos o capítulos de libros; se omiten volúmenes masivos completos).',
    '• Incorporación Automática: Si durante el análisis se detecta que alguno de los artículos no existe en el catálogo, este será',
    '  incorporado y clasificado en el acervo de forma automática. Si ya existía, se evita la duplicación y se enfoca en el análisis.',
    '• Entregable PICO: Matriz comparativa cruzada, riesgo de sesgos, tamaño muestral y significación estadística (p-value, IC 95%).'
  ];
  for (const line of p5Texts) {
    page2.drawText(line, { x: 45, y: y, size: 8.4, font: fontRegular, color: darkGray });
    y -= 12.5;
  }

  y -= 10;

  // SECCIÓN 6: APORTE Y ENRIQUECIMIENTO
  page2.drawText('6. VÍAS DE APORTE Y ENRIQUECIMIENTO DEL ACERVO ESPECIALIZADO', {
    x: 40,
    y: y,
    size: 11,
    font: fontBold,
    color: primaryNavy
  });
  y -= 15;
  const p6Texts = [
    '• Opción A — Buzón Digital Seguro Web: Los colaboradores depositan documentos a través del portal anónimo institucional.',
    '  Enlace directo disponible en el manual interactivo: botón "Comparte tu información en el Buzón Digital".',
    '• Opción B — Ingesta Directa por WhatsApp: Los médicos pueden enviar un PDF al chat con la palabra "APORTE" o "DONAR".',
    '• Archivos de Gran Tamaño (> 45 MB hasta 2 GB): WhatsApp directo (hasta 2 GB), Subida Fraccionada por Bloques (Chunked),',
    '  Sesión Reanudable Efímera y Optimización Clínica en Navegador (reducción de hasta 70% de peso sin pérdida visual).',
    '• Atribución Privada: Los datos del donante son de estricto control interno de Dirección; nunca se revelan públicamente.'
  ];
  for (const line of p6Texts) {
    page2.drawText(line, { x: 45, y: y, size: 8.0, font: fontRegular, color: darkGray });
    y -= 11.5;
  }

  y -= 8;

  // SECCIÓN 7: POTENCIACIONES MULTIMODALES
  page2.drawText('7. POTENCIACIONES MULTIMODALES: VOZ, VISIÓN AO Y BOLETÍN DOMINICAL', {
    x: 40,
    y: y,
    size: 11,
    font: fontBold,
    color: primaryNavy
  });
  y -= 15;
  const p7Texts = [
    '• Consultas por Nota de Voz: Transcripción quirúrgica con IA multimodal para cirujanos en áreas de lavado, consulta o quirófano.',
    '• Orientación Radiográfica AO/OTA: Al adjuntar una imagen radiográfica, el motor analiza el segmento y sugiere la clasificación.',
    '• Boletín Dominical de Actualización: Resumen semanal con 3 perlas quirúrgicas y lecturas destacadas para la revista de sala.'
  ];
  for (const line of p7Texts) {
    page2.drawText(line, { x: 45, y: y, size: 8.4, font: fontRegular, color: darkGray });
    y -= 12.5;
  }

  // ==========================================
  // PÁGINA 3: CONDUCTA, CANAL CONFIDENCIAL Y GOBERNANZA
  // ==========================================
  const page3 = addPage(3);
  y = 785;

  // SECCIÓN 8: CÓDIGO DE CONDUCTA
  page3.drawText('8. CÓDIGO DE CONDUCTA Y RÉGIMEN DISCIPLINARIO INSTITUCIONAL', {
    x: 40,
    y: y,
    size: 11,
    font: fontBold,
    color: primaryNavy
  });
  y -= 15;

  page3.drawRectangle({
    x: 40,
    y: y - 92,
    width: 515,
    height: 102,
    color: rgb(0.99, 0.95, 0.95),
    borderColor: warningRed,
    borderWidth: 1
  });

  page3.drawText('ESCALA DISCIPLINARIA DE ESTATUS Y NOTIFICACIONES AUTOMÁTICAS:', {
    x: 52,
    y: y - 13,
    size: 8.3,
    font: fontBold,
    color: warningRed
  });

  const conductTexts = [
    '• ACTIVO: Habilitación plena para búsquedas, lectura crítica NotebookLM, síntesis PubMed y solicitudes de literatura.',
    '• SUSPENDIDO TEMPORAL (24h, 48h o 72h): Inhabilitación preventiva transitoria con reactivación automática al expirar el plazo.',
    '• BLOQUEADO INDEFINIDAMENTE: Inhabilitación sujeta a valoración directiva; reactivable solo por la Dirección del Proyecto.',
    '• EXPULSADO PERMANENTE: Veto definitivo e irrevocable de número y registro; bloqueo total ante nuevas solicitudes.',
    '• Notificación Directa: Todo cambio de estatus despacha de forma inmediata un mensaje oficial vía WhatsApp al usuario.'
  ];
  let cY = y - 26;
  for (const line of conductTexts) {
    page3.drawText(line, { x: 52, y: cY, size: 7.9, font: fontRegular, color: darkGray });
    cY -= 13;
  }

  y -= 112;

  // SECCIÓN 9: CANAL INTERMEDIADO CONFIDENCIAL
  page3.drawText('9. CANAL INTERMEDIADO CONFIDENCIAL CON LA DIRECCIÓN', {
    x: 40,
    y: y,
    size: 11,
    font: fontBold,
    color: primaryNavy
  });
  y -= 15;
  const p9Texts = [
    '• Envío de Consultas: Para plantear sugerencias o dudas a la Dirección sin vulnerar el anonimato bilateral, escriba en el chat:',
    '  Comando: MENSAJE A LA DIRECCION: [su consulta detallada].',
    '• Retransmisión Segura: El asistente deriva el mensaje a la consola ejecutiva de forma confidencial.',
    '• Recepción de Respuesta: Las respuestas oficiales son remitidas al chat del médico bajo el remitente institucional:',
    '  "DIRECCIÓN DEL PROYECTO: [respuesta oficial]" (preservando el orden y la privacidad bilateral).'
  ];
  for (const line of p9Texts) {
    page3.drawText(line, { x: 45, y: y, size: 8.4, font: fontRegular, color: darkGray });
    y -= 12.5;
  }

  y -= 10;

  // SECCIÓN 10: GOBERNANZA Y AUTOAPRENDIZAJE
  page3.drawText('10. GOBERNANZA DINÁMICA: COMUNICADOS INSTITUCIONALES Y AUTOAPRENDIZAJE', {
    x: 40,
    y: y,
    size: 11,
    font: fontBold,
    color: primaryNavy
  });
  y -= 15;
  const p10Texts = [
    '• Comunicados Oficiales: Ante actualizaciones normativas, incorporación de literatura o mejoras funcionales, se emitirá',
    '  un comunicado oficial masivo a todos los médicos autorizados a través del asistente de WhatsApp.',
    '• Autoaprendizaje de Sinónimos: Mapeo automático ortopédico (ej: prótesis -> artroplastia; LCA -> ligamento cruzado).',
    '• Detección de Brechas: Registro continuo de consultas sin resultados para orientar la adquisición prioritaria de nuevo material.'
  ];
  for (const line of p10Texts) {
    page3.drawText(line, { x: 45, y: y, size: 8.4, font: fontRegular, color: darkGray });
    y -= 12.5;
  }

  y -= 25;

  // Cuadro final de compromiso institucional
  page3.drawRectangle({
    x: 40,
    y: y - 42,
    width: 515,
    height: 48,
    color: primaryNavy
  });

  page3.drawText('BIBLIOTECA MÉDICA DE CIRUGÍA ORTOPÉDICA Y TRAUMATOLOGÍA', {
    x: 85,
    y: y - 18,
    size: 10,
    font: fontBold,
    color: white
  });
  page3.drawText('Compromiso ético con la excelencia académica, el rigor quirúrgico y la confidencialidad absoluta.', {
    x: 72,
    y: y - 32,
    size: 8.5,
    font: fontItalic,
    color: rgb(0.8, 0.9, 0.95)
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(OUTPUT_PDF_PATH, pdfBytes);
  console.log(`✅ Manual PDF oficial generado con éxito: ${OUTPUT_PDF_PATH} (${pdfBytes.length} bytes)`);
}

createManualPdf().catch(err => {
  console.error('Error generando manual PDF:', err);
  process.exit(1);
});
