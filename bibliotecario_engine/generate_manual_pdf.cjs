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
  const primaryNavy = rgb(0.12, 0.24, 0.35);    // #1e3d59
  const accentTeal = rgb(0.09, 0.50, 0.45);     // #178073
  const darkGray = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.95, 0.96, 0.98);
  const white = rgb(1, 1, 1);
  const warningRed = rgb(0.75, 0.15, 0.15);

  // Helper para nueva página
  function addPage() {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 (puntos)
    const { width, height } = page.getSize();
    
    // Franja decorativa superior
    page.drawRectangle({
      x: 0,
      y: height - 12,
      width: width,
      height: 12,
      color: primaryNavy
    });

    // Franja inferior con pie de página
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: 30,
      color: lightGray
    });

    page.drawText('Biblioteca Médica de Cirugía Ortopédica | Dirección: Gestor de Contenido', {
      x: 40,
      y: 11,
      size: 8,
      font: fontRegular,
      color: darkGray
    });

    page.drawText('Uso Confidencial & Académico', {
      x: width - 165,
      y: 11,
      size: 8,
      font: fontBold,
      color: accentTeal
    });

    return page;
  }

  // ==========================================
  // PÁGINA 1: PORTADA & FILOSOFÍA DEL PROYECTO
  // ==========================================
  const page1 = addPage();
  let y = 780;

  // Encabezado institucional
  page1.drawText('GUÍA OFICIAL DEL USUARIO Y CÓDIGO DE GOBERNANZA', {
    x: 40,
    y: y,
    size: 10,
    font: fontBold,
    color: accentTeal
  });

  y -= 30;
  page1.drawText('Biblioteca Médica Especializada', {
    x: 40,
    y: y,
    size: 24,
    font: fontBold,
    color: primaryNavy
  });

  y -= 25;
  page1.drawText('Cirugía Ortopédica y Traumatología', {
    x: 40,
    y: y,
    size: 18,
    font: fontBold,
    color: accentTeal
  });

  y -= 20;
  page1.drawLine({
    start: { x: 40, y: y },
    end: { x: 555, y: y },
    thickness: 1.5,
    color: primaryNavy
  });

  y -= 30;
  // Cuadro informativo de Dirección
  page1.drawRectangle({
    x: 40,
    y: y - 45,
    width: 515,
    height: 55,
    color: lightGray,
    borderColor: accentTeal,
    borderWidth: 1
  });

  page1.drawText('DIRECCIÓN Y CUSTODIA DEL PROYECTO:', {
    x: 55,
    y: y - 15,
    size: 9,
    font: fontBold,
    color: primaryNavy
  });
  page1.drawText('Gestor de Contenido (Propietario de la Información)', {
    x: 55,
    y: y - 30,
    size: 11,
    font: fontBold,
    color: accentTeal
  });
  page1.drawText('Proyecto de apoyo académico médico independiente y de acceso restringido.', {
    x: 55,
    y: y - 42,
    size: 8.5,
    font: fontItalic,
    color: darkGray
  });

  y -= 75;

  // CAPÍTULO 1
  page1.drawText('1. FILOSOFÍA, NATURALEZA Y EXENCIÓN DE RESPONSABILIDAD', {
    x: 40,
    y: y,
    size: 12,
    font: fontBold,
    color: primaryNavy
  });
  y -= 18;
  const p1Texts = [
    '• Proyecto Libre y de Apoyo Académico: La biblioteca constituye un esfuerzo personal y colaborativo',
    '  para fortalecer la formación médica y quirúrgica continua de residentes y cirujanos ortopedistas.',
    '• Sistema en Evolución Activa: El sistema funciona bajo un entorno de inteligencia artificial y nube',
    '  experimental, por lo que es susceptible de intermitencias, actualizaciones y ajustes periódicos.',
    '• Exención Médica: La literatura científica, guías de práctica y catálogos quirúrgicos provistos tienen',
    '  un fin exclusivamente pedagógico. Toda decisión diagnóstica y terapéutica corresponde en exclusiva',
    '  al criterio y responsabilidad del médico tratante con su paciente.',
    '• Anonimato Cardinal: El respeto a la privacidad del Gestor de Contenido y de los usuarios es la regla',
    '  suprema de operación. Todas las interacciones se gestionan a través del asistente autónomo.'
  ];
  for (const line of p1Texts) {
    page1.drawText(line, { x: 45, y: y, size: 9, font: fontRegular, color: darkGray });
    y -= 14;
  }

  y -= 15;

  // CAPÍTULO 2
  page1.drawText('2. PROTOCOLOS DE BÚSQUEDA Y RECUPERACIÓN CLÍNICA', {
    x: 40,
    y: y,
    size: 12,
    font: fontBold,
    color: primaryNavy
  });
  y -= 18;
  const p2Texts = [
    'El agente bibliotecario analiza consultas en lenguaje natural en milisegundos con cero consumo innecesario:',
    'A) Búsqueda por Patología o Técnica Quirúrgica:',
    '   Ejemplo: "Artroplastia reversa de hombro", "Latarjet", "Infección periprotésica de cadera".',
    'B) Búsqueda por Clasificación Ortopédica Específica:',
    '   Ejemplo: "AO 31-A2", "Gustilo fractura expuesta tibia", "Schatzker platillos tibiales", "Neer humero".',
    'C) Búsqueda por Fabricante y Catálogos Comerciales:',
    '   Ejemplo: "Synthes TomoFix", "Clavo Expert artrodesis", "Stryker Hoffman 3", "Zimmer Trabecular".',
    'D) Búsqueda Directa por DOI o ISBN:',
    '   Envíe simplemente el código DOI (ej: 10.1016/j.injury.2023.05.012) para localización inmediata.'
  ];
  for (const line of p2Texts) {
    page1.drawText(line, { x: 45, y: y, size: 9, font: fontRegular, color: darkGray });
    y -= 14;
  }

  y -= 15;

  // CAPÍTULO 3
  page1.drawText('3. ENLACES SEGUROS DE DESCARGA (POLÍTICA ZERO-TRUST)', {
    x: 40,
    y: y,
    size: 12,
    font: fontBold,
    color: primaryNavy
  });
  y -= 18;
  const p3Texts = [
    '• Enlaces Efímeros con Caducidad (TTL 30 Minutos): Los enlaces generados tienen una validez temporal.',
    '  Transcurrido ese tiempo, el token se invalida automáticamente por motivos de seguridad.',
    '• Vinculación al Dispositivo del Solicitante: Cada enlace está firmado criptográficamente para el número',
    '  de WhatsApp que realizó la consulta. Si el enlace se reenvía a un colega, NO le funcionará al tercero.',
    '• Cero Conocimiento de Almacenamiento: Las direcciones nativas de la nube se encuentran enmascaradas.'
  ];
  for (const line of p3Texts) {
    page1.drawText(line, { x: 45, y: y, size: 9, font: fontRegular, color: darkGray });
    y -= 14;
  }

  // ==========================================
  // PÁGINA 2: TICKETING, CÓDIGO DE CONDUCTA Y CONTACTO
  // ==========================================
  const page2 = addPage();
  y = 780;

  // CAPÍTULO 4
  page2.drawText('4. LITERATURA NO DISPONIBLE Y APORTE COLABORATIVO', {
    x: 40,
    y: y,
    size: 12,
    font: fontBold,
    color: primaryNavy
  });
  y -= 18;
  const p4Texts = [
    'Si un documento solicitado no se encuentra en la base actual de 1.634 títulos:',
    '1. El sistema le pedirá el DOI, ISBN o título exacto.',
    '2. Se generará un Ticket Oficial de Adquisición (TCK-XXXX) que alerta al Gestor de Contenido.',
    '3. En cuanto el documento sea adquirido y depositado en el buzón _BIBLIOTECARIO, el agente le enviará',
    '   el enlace de descarga automáticamente a su chat sin necesidad de que usted vuelva a consultar.',
    '4. Programa de Aporte Colaborativo: Si dispone de artículos o libros en PDF, puede compartirlos en la',
    '   carpeta comunitaria. El sistema verificará que no exista duplicidad y priorizará sus solicitudes futuras.'
  ];
  for (const line of p4Texts) {
    page2.drawText(line, { x: 45, y: y, size: 9, font: fontRegular, color: darkGray });
    y -= 14;
  }

  y -= 25;

  // CAPÍTULO 5: CÓDIGO DE CONDUCTA
  page2.drawText('5. CÓDIGO DE CONDUCTA Y REGLAS DE USO APROPIADO', {
    x: 40,
    y: y,
    size: 12,
    font: fontBold,
    color: primaryNavy
  });
  y -= 18;

  // Caja de advertencia
  page2.drawRectangle({
    x: 40,
    y: y - 135,
    width: 515,
    height: 145,
    color: rgb(0.99, 0.95, 0.95),
    borderColor: warningRed,
    borderWidth: 1
  });

  page2.drawText('REGLAS DISCIPLINARIAS ESTRICTAS:', {
    x: 55,
    y: y - 15,
    size: 9.5,
    font: fontBold,
    color: warningRed
  });

  const conductTexts = [
    '1. Ámbito Quirúrgico Exclusivo: Solo se admiten temas de Ortopedia, Traumatología y Ciencias Afines.',
    '   (Consultas de temas ajenos a la especialidad serán descartadas).',
    '2. Tolerancia Cero a Contenido Sensible: Estrictamente prohibido el envío de palabras soeces, insultos,',
    '   contenido sexual explícito, pornografía o violencia no académica.',
    '   -> Infracción provoca BLOQUEO INMEDIATO y permanente del usuario sin previo aviso.',
    '3. Uso No Comercial: Queda prohibida la redistribución masiva o explotación comercial de la información.',
    '4. Anti-Saturación: No realice peticiones automatizadas continuas (máximo 5 consultas por minuto).',
    '5. Potestad Sancionatoria: El Gestor de Contenido tiene la facultad discrecional de suspender, bloquear o',
    '   eliminar el acceso a cualquier usuario que haga uso indebido del proyecto.'
  ];
  let conductY = y - 30;
  for (const line of conductTexts) {
    page2.drawText(line, { x: 55, y: conductY, size: 8.5, font: fontRegular, color: darkGray });
    conductY -= 13;
  }

  y -= 160;

  // CAPÍTULO 6
  page2.drawText('6. CANAL DE COMUNICACIÓN INTERMEDIADO CON EL GESTOR', {
    x: 40,
    y: y,
    size: 12,
    font: fontBold,
    color: primaryNavy
  });
  y -= 18;
  const p6Texts = [
    'Para mantener el anonimato y preservar el tiempo quirúrgico del Administrador, el contacto se realiza',
    'exclusivamente a través del bot como intermediario confidencial:',
    '• Para enviar una duda o sugerencia: Escriba "MENSAJE AL GESTOR: [su consulta]".',
    '• El bot notificará al Gestor de Contenido, y cuando este responda, usted recibirá el mensaje en su chat.',
    '• Para volver a consultar este manual en cualquier momento: Envíe la palabra "MANUAL" o "AYUDA".',
    '• Para ver la lista de temas: Envíe la palabra "MENU" o "CATEGORIAS".'
  ];
  for (const line of p6Texts) {
    page2.drawText(line, { x: 45, y: y, size: 9, font: fontRegular, color: darkGray });
    y -= 14;
  }

  y -= 30;

  // Cuadro final de compromiso
  page2.drawRectangle({
    x: 40,
    y: y - 40,
    width: 515,
    height: 45,
    color: primaryNavy
  });

  page2.drawText('BIBLIOTECA MÉDICA DE CIRUGÍA ORTOPÉDICA Y TRAUMATOLOGÍA', {
    x: 85,
    y: y - 18,
    size: 10,
    font: fontBold,
    color: white
  });
  page2.drawText('Compromiso ético con la excelencia académica, el rigor quirúrgico y la privacidad absoluta.', {
    x: 75,
    y: y - 32,
    size: 8.5,
    font: fontItalic,
    color: white
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(OUTPUT_PDF_PATH, pdfBytes);
  console.log(`✅ Manual PDF oficial generado con éxito: ${OUTPUT_PDF_PATH} (${pdfBytes.length} bytes)`);
}

createManualPdf().catch(err => {
  console.error('Error generando manual PDF:', err);
  process.exit(1);
});
