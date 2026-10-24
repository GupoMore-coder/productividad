/**
 * ============================================================================
 * 📚 GENERADOR AUTÓNOMO DEL DOCUMENTO PDF: GUÍA MAESTRA DE COMANDOS Y ACCIONES
 * Biblioteca Médica de Cirugía Ortopédica y Traumatología
 * Custodia y Gobernanza: Dirección del Proyecto / Gestor de Contenido
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const OUTPUT_PDF_PATH = path.join(__dirname, 'knowledge', 'Guia_Maestra_Comandos_Biblioteca_Medica.pdf');

function buildPdf() {
  return new Promise((resolve, reject) => {
    // Dimensiones A4 estándar en puntos: 595.28 x 841.89
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 45, bottom: 45, left: 45, right: 45 },
      bufferPages: true,
      autoFirstPage: true
    });

    const writeStream = fs.createWriteStream(OUTPUT_PDF_PATH);
    doc.pipe(writeStream);

    const colors = {
      navy: '#0A2540',
      teal: '#0D9488',
      darkTeal: '#0F766E',
      lightTeal: '#CCFBF1',
      darkSlate: '#0F172A',
      charcoal: '#1E293B',
      bodyText: '#334155',
      mutedText: '#64748B',
      lightBg: '#F8FAFC',
      cardBg: '#F1F5F9',
      border: '#E2E8F0',
      accentAmber: '#D97706',
      accentBlue: '#0284C7',
      accentGreen: '#059669',
      white: '#FFFFFF'
    };

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const contentWidth = pageWidth - 90; // 505.28 pt

    // Helper: Dibuja barra decorativa superior en páginas internas
    function drawHeader(title) {
      doc.save();
      doc.fillColor(colors.navy).rect(45, 20, contentWidth, 2).fill();
      doc.font('Helvetica-Bold').fontSize(8).fillColor(colors.teal)
         .text('BIBLIOTECA MÉDICA DE CIRUGÍA ORTOPÉDICA', 45, 26, { continued: true })
         .font('Helvetica').fillColor(colors.mutedText)
         .text(`   |   ${title.toUpperCase()}`, { align: 'left' });
      doc.restore();
    }

    // Helper: Cuadro de llamada clínica (Callout Box)
    function drawCallout(title, text, type = 'info', yOffset = null) {
      if (yOffset) doc.y = yOffset;
      const startY = doc.y;
      const boxColor = type === 'warning' ? '#FEF3C7' : type === 'success' ? '#DCFCE7' : '#F0F9FF';
      const borderColor = type === 'warning' ? colors.accentAmber : type === 'success' ? colors.accentGreen : colors.accentBlue;
      const icon = type === 'warning' ? '⚠️' : type === 'success' ? '✅' : '💡';

      doc.font('Helvetica-Bold').fontSize(9.5);
      const titleHeight = doc.heightOfString(`${icon} ${title}`, { width: contentWidth - 24 });
      doc.font('Helvetica').fontSize(8.5);
      const textHeight = doc.heightOfString(text, { width: contentWidth - 24 });
      const totalH = titleHeight + textHeight + 16;

      if (startY + totalH > pageHeight - 55) {
        doc.addPage();
        drawHeader('GUÍA MAESTRA DE COMANDOS');
      }

      const curY = doc.y;
      doc.save();
      doc.roundedRect(45, curY, contentWidth, totalH, 4).fillAndStroke(boxColor, borderColor);
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(colors.charcoal)
         .text(`${icon} ${title}`, 57, curY + 8, { width: contentWidth - 24 });
      doc.font('Helvetica').fontSize(8.5).fillColor(colors.bodyText)
         .text(text, 57, curY + 8 + titleHeight + 3, { width: contentWidth - 24, lineGap: 2 });
      doc.restore();

      doc.y = curY + totalH + 10;
    }

    // Helper: Tarjeta de Comando con Ejemplo
    function drawCommandCard(commandName, syntax, description, examples = [], badgeColor = colors.teal) {
      if (doc.y > pageHeight - 160) {
        doc.addPage();
        drawHeader('GUÍA MAESTRA DE COMANDOS');
      }

      const cardStartY = doc.y;
      doc.save();
      // Cabecera del comando
      doc.roundedRect(45, cardStartY, contentWidth, 24, 3).fill(colors.navy);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.white)
         .text(commandName, 55, cardStartY + 6, { continued: true })
         .font('Helvetica').fontSize(8.5).fillColor('#94A3B8')
         .text(`   [ Sintaxis: ${syntax} ]`, { align: 'left' });

      doc.y = cardStartY + 30;

      // Descripción
      doc.font('Helvetica').fontSize(9).fillColor(colors.bodyText)
         .text(description, 50, doc.y, { width: contentWidth - 10, lineGap: 2.5 });
      doc.moveDown(0.4);

      // Ejemplos
      if (examples && examples.length > 0) {
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(colors.darkTeal)
           .text('📌 Casos de Uso y Ejemplos Prácticos:', 50, doc.y);
        doc.moveDown(0.2);

        examples.forEach((ex, idx) => {
          doc.save();
          const exY = doc.y;
          doc.roundedRect(50, exY, contentWidth - 10, 16 + (ex.response ? 14 : 0), 2).fill(colors.cardBg);
          doc.font('Helvetica-Bold').fontSize(8.5).fillColor(colors.charcoal)
             .text(`👉 Entrada: `, 56, exY + 4, { continued: true })
             .font('Courier-Bold').fillColor(colors.accentBlue)
             .text(ex.input);
          if (ex.response) {
            doc.font('Helvetica-Oblique').fontSize(8).fillColor(colors.mutedText)
               .text(`↳ Resultado: ${ex.response}`, 56, exY + 16, { width: contentWidth - 25 });
            doc.y = exY + 34;
          } else {
            doc.y = exY + 20;
          }
          doc.restore();
          doc.moveDown(0.2);
        });
      }
      doc.restore();
      doc.moveDown(0.6);
    }

    // Helper: Título de Sección
    function drawSectionHeader(number, title, subtitle = '') {
      if (doc.y > pageHeight - 120) {
        doc.addPage();
        drawHeader('GUÍA MAESTRA DE COMANDOS');
      }

      const y = doc.y;
      doc.save();
      doc.rect(45, y, 6, 26).fill(colors.teal);
      doc.font('Helvetica-Bold').fontSize(14).fillColor(colors.navy)
         .text(`${number}. ${title}`, 58, y + 2);
      if (subtitle) {
        doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(colors.mutedText)
           .text(subtitle, 58, y + 16);
      }
      doc.restore();
      doc.y = y + 34;
    }

    // ========================================================================
    // PÁGINA 1: PORTADA INSTITUCIONAL DE MÁXIMO PRESTIGIO
    // ========================================================================
    // Marco exterior sutil
    doc.save();
    doc.rect(30, 30, pageWidth - 60, pageHeight - 60).lineWidth(1.5).stroke(colors.navy);
    doc.rect(33, 33, pageWidth - 66, pageHeight - 66).lineWidth(0.5).stroke(colors.teal);

    // Bloque superior de color
    doc.rect(34, 34, pageWidth - 68, 140).fill(colors.navy);

    // Isotipo / Símbolo institucional
    doc.font('Helvetica-Bold').fontSize(36).fillColor(colors.teal).text('✚', 60, 52);
    doc.font('Helvetica-Bold').fontSize(18).fillColor(colors.white)
       .text('BIBLIOTECA MÉDICA DE CIRUGÍA ORTOPÉDICA', 105, 54);
    doc.font('Helvetica').fontSize(10.5).fillColor('#94A3B8')
       .text('Traumatología, Artroplastia, Columna y Cirugía Reconstructiva de Alta Complejidad', 105, 78);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(colors.teal)
       .text('REPOSITORIO ACADÉMICO Y ASISTENTE CLÍNICO TRANSACCIONAL 24/7', 105, 96);

    doc.rect(60, 125, contentWidth - 30, 1.5).fill(colors.teal);

    // Título Principal de la Portada
    doc.y = 210;
    doc.font('Helvetica-Bold').fontSize(26).fillColor(colors.navy)
       .text('GUÍA MAESTRA DE COMANDOS', 60, doc.y, { align: 'center' });
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(15).fillColor(colors.darkTeal)
       .text('MANUAL OPERATIVO Y CLÍNICO DE REFERENCIA', { align: 'center' });
    doc.moveDown(0.2);
    doc.font('Helvetica-Oblique').fontSize(10.5).fillColor(colors.mutedText)
       .text('Catálogo Integral de Funciones, Superpoderes Quirúrgicos y Múltiples Ejemplos de Uso', { align: 'center' });

    // Cuadro de Presentación Institucional
    doc.y = 330;
    doc.save();
    doc.roundedRect(60, doc.y, contentWidth - 30, 230, 6).fillAndStroke(colors.lightBg, colors.border);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.navy)
       .text('🏛️ PRESENTACIÓN OFICIAL DE LA DIRECCIÓN', 80, doc.y + 16);
    doc.rect(80, doc.y + 32, contentWidth - 70, 1).fill(colors.teal);

    const introText = 
      'La presente Guía Maestra ha sido concebida como el instrumento de navegación fundamental para ' +
      'médicos especialistas y residentes de Cirugía Ortopédica y Traumatología. El sistema integra en una ' +
      'única interfaz conversacional (WhatsApp) capacidades avanzadas de búsqueda bibliográfica, calculadoras ' +
      'de riesgo quirúrgico, copiloto preoperatorio, fichas técnicas de instrumentación e interconsultas ' +
      'automatizadas de urgencias.\n\n' +
      'Este documento ofrece una explicación exhaustiva de cada comando habilitado, su sustento técnico-clínico ' +
      'y múltiples ejemplos de consulta real. Su estructura se actualiza de manera permanente y autónoma conforme ' +
      'la Dirección del Proyecto incorpora nuevas competencias tecnológicas y académicas al servicio del equipo.';

    doc.font('Helvetica').fontSize(9.5).fillColor(colors.bodyText)
       .text(introText, 80, doc.y + 42, { width: contentWidth - 70, lineGap: 3.5, align: 'justify' });
    doc.restore();

    // Metadatos de Publicación al Pie de la Portada
    const metaY = 640;
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(colors.navy).text('INFORMACIÓN DE EDICIÓN Y GOBERNANZA:', 60, metaY);
    doc.font('Helvetica').fontSize(8.5).fillColor(colors.bodyText);
    doc.text('• Custodia y Dirección: ', 60, metaY + 16, { continued: true }).font('Helvetica-Bold').text('Gestor de Contenido (Dirección del Proyecto)');
    doc.font('Helvetica').text('• Vigencia y Versión: ', 60, metaY + 30, { continued: true }).font('Helvetica-Bold').text('Edición 2026 — Despliegue v46 (V8 Air-Gapped)');
    doc.font('Helvetica').text('• Protocolo de Seguridad: ', 60, metaY + 44, { continued: true }).font('Helvetica-Bold').text('HMAC-SHA256 Token Binding & Zero Cloud Trace');
    doc.font('Helvetica').text('• Canales de Activación: ', 60, metaY + 58, { continued: true }).font('Helvetica-Bold').text('Canal Institucional de WhatsApp / Portal Web Seguro');

    // Sello de Confidencialidad
    doc.save();
    doc.roundedRect(60, 730, contentWidth - 30, 36, 4).fillAndStroke('#ECFDF5', colors.accentGreen);
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(colors.accentGreen)
       .text('🔒 GARANTÍA INVIOLABLE DE CONFIDENCIALIDAD Y ANONIMATO CARDINAL', 72, 738);
    doc.font('Helvetica').fontSize(7.5).fillColor('#065F46')
       .text('Cero exposición de datos personales del equipo médico y de la Dirección. Despachos atómicos e individualizados.', 72, 750);
    doc.restore();

    // ========================================================================
    // PÁGINA 2: ARQUITECTURA DEL SISTEMA Y TOLERANCIA TIPOGRÁFICA
    // ========================================================================
    doc.addPage();
    drawHeader('ARQUITECTURA Y TOLERANCIA TIPOGRÁFICA');

    drawSectionHeader('1', 'FILOSOFÍA DEL ASISTENTE Y REGLAS DE ACCESO', 'Estructura operativa, tolerancia a fallos tipográficos y confidencialidad');

    doc.font('Helvetica').fontSize(9.2).fillColor(colors.bodyText)
       .text(
         'El Asistente Inteligente de la Biblioteca Médica está diseñado para asistir al cirujano tanto en el ' +
         'entorno de alta presión del servicio de urgencias como durante la planificación previa al ingreso a quirófano. ' +
         'A diferencia de interfaces rígidas tradicionales, el motor conversacional incorpora tolerancia tipográfica, ' +
         'reconocimiento de intención semántica y respuestas clínicas estructuradas.',
         45, doc.y, { width: contentWidth, lineGap: 3, align: 'justify' }
       );
    doc.moveDown(0.6);

    drawCallout(
      'Activación Instantánea y Tolerancia Tipográfica',
      'Puede solicitar la carta completa de herramientas en cualquier momento enviando las palabras:\n' +
      '• COMANDOS   • COMANDO   • comados   • funciones   • menu   • ayuda\n' +
      'El sistema corrige automáticamente errores de tipeo accidentales cometidos desde dispositivos móviles en el hospital.',
      'info'
    );

    drawCommandCard(
      'SOLICITUD DE COMANDOS GENERALES',
      'COMANDO | COMANDOS | FUNCIONES',
      'Despliega el catálogo de herramientas y funciones clínicas disponibles en el asistente.',
      [
        { input: 'COMANDOS', response: 'Entrega el resumen interactivo estructurado y adjunta este documento PDF oficial.' },
        { input: 'comados', response: 'Tolerancia activa: identifica la intención y despacha la carta completa de comandos.' },
        { input: 'funciones', response: 'Reconoce el sinónimo institucional y despliega el menú operativo completo.' }
      ]
    );

    drawSectionHeader('1.2', 'REGLAS DE SEGURIDAD Y ONBOARDING MÉDICO');
    doc.font('Helvetica').fontSize(9).fillColor(colors.bodyText)
       .text(
         'El acceso a la Biblioteca Médica está reservado a personal médico y residentes de ortopedia ' +
         'debidamente autorizados por la Dirección. Cuando un nuevo usuario ingresa al canal:',
         45, doc.y, { width: contentWidth, lineGap: 2.5 }
       );
    doc.moveDown(0.4);

    doc.save();
    doc.rect(50, doc.y, contentWidth - 10, 68).fill(colors.cardBg);
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(colors.navy)
       .text('Ciclo de Aprobación Institucional en 3 Pasos:', 58, doc.y + 6);
    doc.font('Helvetica').fontSize(8).fillColor(colors.bodyText)
       .text('1. Registro Inicial: El usuario envía Nombre, Hospital/Universidad y Correo Institucional.', 58, doc.y + 18)
       .text('2. Notificación a la Dirección: El Gestor de Contenido recibe una alerta con botones de acción inmediata.', 58, doc.y + 30)
       .text('3. Activación y Bienvenida: Una vez aprobado, el médico recibe bienvenida y el enlace al Manual Oficial.', 58, doc.y + 42)
       .text('🔒 Todo intento de acceso no registrado es neutralizado y puesto en cola preventiva de evaluación.', 58, doc.y + 54);
    doc.restore();
    doc.y = doc.y + 78;

    // ========================================================================
    // PÁGINA 3: BÚSQUEDA QUIRÚRGICA Y RECUPERACIÓN MUNDIAL
    // ========================================================================
    doc.addPage();
    drawHeader('BÚSQUEDA QUIRÚRGICA Y BIBLIOGRÁFICA');

    drawSectionHeader('2', 'BÚSQUEDA EN EL ACERVO Y LITERATURA MUNDIAL', 'Recuperación de monografías, técnicas AO, consensos y prospección PubMed');

    doc.font('Helvetica').fontSize(9.2).fillColor(colors.bodyText)
       .text(
         'El acervo local alberga monografías, tratados clásicos (Campbell, Rockwood, Hoppenfeld) y guías ' +
         'quirúrgicas oficiales de osteosíntesis. La búsqueda opera por coincidencia semántica y palabras clave ' +
         'sin necesidad de comandos especiales: basta con escribir la patología o técnica deseada.',
         45, doc.y, { width: contentWidth, lineGap: 2.5, align: 'justify' }
       );
    doc.moveDown(0.5);

    drawCommandCard(
      'BÚSQUEDA DIRECTA EN EL ACERVO LOCAL',
      '[Término de Búsqueda Libre]',
      'Busca en la colección de PDFs técnicos. Retorna título oficial, clasificación, tamaño y enlace de descarga firmado.',
      [
        { input: 'fractura de pelvis', response: 'Retorna técnica quirúrgica de abordaje ilioinguinal y fijación percutánea.' },
        { input: 'clavo trocanterico', response: 'Retorna manual de técnica AO - Clavo PFNA y manejo de fracturas 31-A.' },
        { input: 'hoppenfeld cadera', response: 'Retorna fichas del Atlas de Abordajes Quirúrgicos en Cadera y Pelvis.' },
        { input: 'infeccion periprotesica', response: 'Retorna directrices de diagnóstico y tratamiento en 2 tiempos (ICM).' }
      ]
    );

    drawCommandCard(
      'RECUPERACIÓN MUNDIAL EN PUBMED (EVIDENCIA MUNDIAL)',
      'EVIDENCIA: [término] | Recuperación Proactiva Automática',
      'Si un documento no figura en el repositorio local, el motor consulta automáticamente la literatura mundial en PubMed/MeSH ' +
      'y recupera los 3 estudios más recientes de alto impacto con síntesis clínica y PMIDs verificados.',
      [
        { input: 'EVIDENCIA: fractura de calcaneo seno del tarso', response: 'Recupera los 3 últimos ensayos clínicos con enlace directo a PubMed y DOI.' },
        { input: 'tang flexor tendon repair', response: 'Identifica y extrae el consenso mundial IFSSH 2026 de reparación de tendones flexores.' }
      ],
      colors.accentBlue
    );

    drawCommandCard(
      'SOLICITUD FORMAL DE ADQUISICIÓN DE LITERATURA',
      'DOI: [identificador] | ISBN: [código]',
      'Abre un ticket de adquisición automática ante la Dirección del Proyecto para documentos no disponibles.',
      [
        { input: 'DOI: 10.1177/17531934251404821', response: 'Genera Ticket #MED-2026 y notifica a la Dirección para adquisición inmediata.' }
      ],
      colors.accentAmber
    );

    drawCallout(
      'Garantía de Enlaces Firmados (Token Binding de 30 Días)',
      'Todos los documentos se entregan mediante enlaces web con token criptográfico HMAC-SHA256 ' +
      'asociado exclusivamente al número del médico solicitante con expiración a 30 días. ' +
      'Se eliminan URLs desnudas de almacenamiento en la nube para máxima confidencialidad institucional.',
      'success'
    );

    // ========================================================================
    // PÁGINA 4: SUPERPODER 1 — CALCULADORAS Y SCORES QUIRÚRGICOS
    // ========================================================================
    doc.addPage();
    drawHeader('SUPERPODER 1: CALCULADORAS Y SCORES CLÍNICOS');

    drawSectionHeader('3', 'SUPERPODER 1: SCORES Y CALCULADORAS QUIRÚRGICAS', 'Soporte en la toma de decisiones clínicas y estratificación de riesgo objetivo');

    doc.font('Helvetica').fontSize(9.2).fillColor(colors.bodyText)
       .text(
         'Las calculadoras quirúrgicas del sistema automatizan la estratificación de escalas validadas internacionalmente ' +
         'en ortopedia y traumatología, entregando no solo el puntaje numérico, sino la conducta terapéutica sugerida ' +
         'y el esquema farmacológico o quirúrgico recomendado.',
         45, doc.y, { width: contentWidth, lineGap: 2.5, align: 'justify' }
       );
    doc.moveDown(0.5);

    drawCommandCard(
      'SCORE DE CAPRINI (TROMBOEMBOLISMO VENOSO)',
      'SCORE CAPRINI | CAPRINI',
      'Calcula el riesgo de Trombosis Venosa Profunda (TVP) y Tromboembolismo Pulmonar (TEP) en cirugía ortopédica mayor. ' +
      'Indica duración y dosificación de Enoxaparina (HBPM) vs anticoagulantes orales directos (DOACs).',
      [
        { input: 'SCORE CAPRINI', response: 'Inicia cuestionario interactivo de factores mayores (artroplastia, inmovilización, fractura).' },
        { input: 'CAPRINI 8 puntos', response: 'Estratificación: Riesgo Muy Alto (>5). Profilaxis recomendada: HBPM 40 mg SC c/24h por 35 días.' }
      ]
    );

    drawCommandCard(
      'CLASIFICACIÓN DE GUSTILO-ANDERSON (FRACTURAS ABIERTAS)',
      'SCORE GUSTILO | GUSTILO',
      'Estratifica fracturas expuestas (Grados I, II, IIIA, IIIB, IIIC) y emite de inmediato el esquema antibiótico de urgencia ' +
      'con tiempos máximos para lavado quirúrgico y desbridamiento en pabellón.',
      [
        { input: 'SCORE GUSTILO', response: 'Despliega criterios de herida, contaminación y cobertura de partes blandas.' },
        { input: 'GUSTILO IIIB tibia', response: 'Antibiótico: Cefazolina 2g IV + Gentamicina 5 mg/kg/día. Lavado urgente y fijación externa.' }
      ]
    );

    drawCommandCard(
      'SCORE MESS (MANGLED EXTREMITY SEVERITY SCORE)',
      'SCORE MESS | MESS',
      'Evalúa la viabilidad de extremidades gravemente traumatizadas para orientar el salvamento vs amputación primaria. ' +
      'Parámetros: Lesión esquelética/partes blandas, isquemia de extremidad, shock persistente y edad.',
      [
        { input: 'SCORE MESS', response: 'Despliega matriz de los 4 factores pronósticos.' },
        { input: 'MESS puntaje 8', response: 'Umbral crítico superado (≥7): Elevada probabilidad de requerir amputación primaria.' }
      ]
    );

    drawCommandCard(
      'SCORE GARDEN (FRACTURAS DE CUELLO DE FÉMUR)',
      'SCORE GARDEN | GARDEN',
      'Clasifica fracturas intracapsulares de cadera (Grados I a IV) para definir indicación de osteosíntesis con tornillos ' +
      'canulados vs hemiartroplastia o artroplastia total de cadera según edad biológica.',
      [
        { input: 'SCORE GARDEN', response: 'Detalle de Grados I (valgo impactada), II (no desplazada), III y IV (desplazadas).' }
      ]
    );

    drawCommandCard(
      'SCORE TLICS (TRAUMA TORACOLUMBAR)',
      'SCORE TLICS | TLICS',
      'Estratifica la gravedad del traumatismo de columna toracolumbar basándose en: Morfología de la fractura, ' +
      'integridad del Complejo Ligamentario Posterior (CLP) y estado neurológico.',
      [
        { input: 'SCORE TLICS', response: 'Puntuación: ≤3 No quirúrgico | 4 Elección del cirujano | ≥5 Tratamiento quirúrgico imperativo.' }
      ]
    );

    // ========================================================================
    // PÁGINA 5: SUPERPODER 2 — COPILOTO PRE-OPERATORIO
    // ========================================================================
    doc.addPage();
    drawHeader('SUPERPODER 2: COPILOTO PRE-OPERATORIO');

    drawSectionHeader('4', 'SUPERPODER 2: COPILOTO PRE-OPERATORIO', 'Briefing quirúrgico, abordajes anatómicos, perlas de reducción y literatura local');

    doc.font('Helvetica').fontSize(9.2).fillColor(colors.bodyText)
       .text(
         'El Copiloto Pre-Operatorio funciona como un asistente quirúrgico de guardia. Ante la presentación ' +
         'de un caso clínico o la mención de una vía de abordaje, el motor estructura de inmediato los objetivos ' +
         'quirúrgicos primarios, los riesgos anatómicos específicos, perlas de reducción y los enlaces exactos ' +
         'al atlas o técnica de osteosíntesis del repositorio.',
         45, doc.y, { width: contentWidth, lineGap: 2.5, align: 'justify' }
       );
    doc.moveDown(0.5);

    drawCommandCard(
      'PLANIFICACIÓN DE CASO QUIRÚRGICO',
      'CASO: [patología, clasificación AO o edad del paciente]',
      'Genera un plan quirúrgico preoperatorio completo con clasificación, posición del paciente, perlas técnicas y lectura recomendada.',
      [
        {
          input: 'CASO: Fractura subtrocanterica AO 31-A3 en paciente de 72 años',
          response: 'Indica Clavo céfalo-medular largo, mesa de tracción, perla de pincho de reducción en fragmento proximal y PDF de técnica AO.'
        },
        {
          input: 'CASO: Fractura de platillos tibiales AO 41-C3 bicondilea',
          response: 'Estrategia en 2 etapas: Fijador externo temporal de rodilla, TAC 3D de control, abordaje doble (Luo posterior + anterolateral).'
        },
        {
          input: 'CASO: Fractura de humero proximal en 3 partes en paciente de 58 años',
          response: 'Abordaje deltopectoral, placa PHILOS, suturas de tracción en manguito rotador y tornillos de calcar medial.'
        }
      ]
    );

    drawCommandCard(
      'VÍAS DE ABORDAJE QUIRÚRGICO Y RIESGOS ANATÓMICOS',
      'ABORDAJE: [nombre de la vía anatómica]',
      'Describe la incisión cutánea, el plano internervioso, las estructuras vasculonerviosas en riesgo y las perlas de cierre.',
      [
        {
          input: 'ABORDAJE: Kocher-Langenbeck para fractura acetabular',
          response: 'Posición decúbito prono, flexión de rodilla a 90° para relajar el nervio ciático, preservación de vasos glúteos superiores.'
        },
        {
          input: 'ABORDAJE: Watson-Jones anterolateral de cadera',
          response: 'Plano internervioso entre TFL (nervio glúteo superior) y Glúteo Medio. Indicado para prótesis y fracturas de cuello.'
        },
        {
          input: 'ABORDAJE: Abordaje posterior de Luo para tibia',
          response: 'Abordaje posteromedial invertido para meseta tibial posterior con placa de sostén sin lesionar paquete poplíteo.'
        }
      ],
      colors.darkTeal
    );

    drawCallout(
      'Doble Capa de Respaldo Bibliográfico',
      'Cada respuesta del Copiloto Pre-Operatorio distingue nítidamente dos niveles de evidencia:\n' +
      '1. Documentos Técnicos Disponibles en el Acervo Local (con enlace de descarga directa en 1 clic).\n' +
      '2. Referencias Internacionales Indexadas en PubMed (con PMIDs oficiales y resúmenes estructurados).',
      'info'
    );

    // ========================================================================
    // PÁGINA 6: SUPERPODER 3 — FICHA TÉCNICA DE IMPLANTES
    // ========================================================================
    doc.addPage();
    drawHeader('SUPERPODER 3: FICHAS TÉCNICAS DE IMPLANTES');

    drawSectionHeader('5', 'SUPERPODER 3: FICHAS TÉCNICAS DE IMPLANTES', 'Especificaciones de instrumentación, brocas, machuelos, guías y torque de ajuste');

    doc.font('Helvetica').fontSize(9.2).fillColor(colors.bodyText)
       .text(
         'Diseñado para evitar errores de instrumentación en el quirófano y facilitar la coordinación con ' +
         'el instrumentador quirúrgico y la casa comercial. Provee las especificaciones métricas exactas ' +
         'de tornillos, brocas, fresas y torquímetros.',
         45, doc.y, { width: contentWidth, lineGap: 2.5, align: 'justify' }
       );
    doc.moveDown(0.5);

    drawCommandCard(
      'FICHA TÉCNICA DE IMPLANTE O SISTEMA DE OSTEOSÍNTESIS',
      'IMPLANTE: [nombre del sistema o placa]',
      'Entrega la instrumentación requerida: brocas calibradas, machuelos, tornillos autorroscantes vs bloqueados y torque límite en Nm.',
      [
        {
          input: 'IMPLANTE: Placa PHILOS para humero proximal',
          response: 'Broca 2.8 mm para tornillos 3.5 mm | Machuelo 3.5 mm opcional | Guía de calcar | Torque máx: 1.5 Nm | Enlace a técnica oficial.'
        },
        {
          input: 'IMPLANTE: Clavo PFNA intramedular',
          response: 'Broca iniciadora 11.0 mm | Hoja helicoidal / tornillo cefálico | Fresado diafisario +1.5 mm | Bloqueo distal 4.9 mm estático/dinámico.'
        },
        {
          input: 'IMPLANTE: Tornillos canulados 7.3 mm',
          response: 'Alambres guía roscados 2.8 mm | Broca canulada 5.0 mm | Medidor de profundidad canulado | Configuración triangular invertida.'
        },
        {
          input: 'IMPLANTE: Placa TomoFix para osteotomia tibial',
          response: 'Placa en T anatómica medial | Tornillos bloqueados 5.0 mm | Broca 4.3 mm con casquillo roscado | Torque de seguridad 4.0 Nm.'
        }
      ]
    );

    drawSectionHeader('5.2', 'TABLA RÁPIDA DE INSTRUMENTACIÓN QUIRÚRGICA FRECUENTE');

    // Tabla de instrumentación
    const tableTop = doc.y;
    const colWidths = [120, 95, 95, 95, 100];
    const headers = ['Sistema de Implante', 'Tornillo', 'Broca Requerida', 'Torque (Nm)', 'Observación Clave'];

    doc.save();
    doc.rect(45, tableTop, contentWidth, 18).fill(colors.navy);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(colors.white);
    let x = 50;
    headers.forEach((h, i) => {
      doc.text(h, x, tableTop + 5, { width: colWidths[i] - 5 });
      x += colWidths[i];
    });

    const rows = [
      ['Placa PHILOS (Húmero)', '3.5 mm Bloqueado', 'Broca 2.8 mm', '1.5 Nm', 'Usar tornillos de calcar'],
      ['Clavo PFNA (Fémur)', 'Hoja Cefálica', 'Broca Cefálica 11.0', 'Impactación', 'Bloqueo distal dinámico'],
      ['Tornillo Canulado Cadera', '7.3 mm Parcial', 'Broca Canulada 5.0', 'Manual firme', 'Alambre guía 2.8 mm'],
      ['Placa LCP Distal de Radio', '2.4 / 2.7 mm', 'Broca 1.8 / 2.0 mm', '0.8 Nm', 'Cuidado con tendón EPL'],
      ['Placa LCP Fémur Distal', '4.5 / 5.0 mm', 'Broca 4.3 mm', '4.0 Nm', 'Tornillos paralelos a línea articular']
    ];

    let rowY = tableTop + 18;
    rows.forEach((r, idx) => {
      const bg = idx % 2 === 0 ? colors.lightBg : colors.white;
      doc.rect(45, rowY, contentWidth, 16).fill(bg);
      doc.font('Helvetica').fontSize(7.5).fillColor(colors.charcoal);
      let rx = 50;
      r.forEach((cell, ci) => {
        doc.text(cell, rx, rowY + 4, { width: colWidths[ci] - 5 });
        rx += colWidths[ci];
      });
      rowY += 16;
    });
    doc.restore();
    doc.y = rowY + 12;

    // ========================================================================
    // PÁGINA 7: SUPERPODER 4 — INTERCONSULTA / SUPERPODER 5 — OPEN ACCESS
    // ========================================================================
    doc.addPage();
    drawHeader('SUPERPODERES 4 Y 5: INTERCONSULTAS Y OPEN ACCESS');

    drawSectionHeader('6', 'SUPERPODER 4: ASISTENTE DE INTERCONSULTAS', 'Estructuración rápida de reportes ATLS/AO y manejo farmacológico inicial');

    doc.font('Helvetica').fontSize(9.2).fillColor(colors.bodyText)
       .text(
         'Permite al residente o especialista generar un informe clínico formal para notas hospitalarias ' +
         'o entrega de guardia en menos de 5 segundos. Estructura el mecanismo lesional, hallazgos vasculonerviosos, ' +
         'antibioticoterapia profiláctica o terapéutica y plan de tratamiento.',
         45, doc.y, { width: contentWidth, lineGap: 2.5, align: 'justify' }
       );
    doc.moveDown(0.5);

    drawCommandCard(
      'ESTRUCTURACIÓN DE INTERCONSULTA DE URGENCIAS',
      'INTERCONSULTA: [datos breves del paciente y la lesión]',
      'Genera una nota clínica completa bajo estándar AO/ATLS lista para copiar en la historia clínica o ficha quirúrgica.',
      [
        {
          input: 'INTERCONSULTA: Masculino de 28 años, accidente moto, fractura expuesta tibia III-B con herida 8cm',
          response: 'Entrega nota con: Diagnóstico AO, Gustilo IIIB, analgesia multimodal, Cefazolina + Gentamicina, y programación a lavado.'
        },
        {
          input: 'INTERCONSULTA: Femenina 82 años caída propia altura, acortamiento y rotación externa MID, Garden IV',
          response: 'Estructura indicación de Hemiartroplastia bipolar vs ATC, analgesia perioperatoria y solicitud de valoración cardiológica.'
        }
      ]
    );

    drawSectionHeader('7', 'SUPERPODER 5: OPEN ACCESS Y GESTIÓN BIBLIOGRÁFICA', 'Descarga libre de literatura indexada y circuito de tickets');

    drawCommandCard(
      'CONSULTA DE ARTÍCULOS OPEN ACCESS',
      'OPEN ACCESS: [patología] | ARTICULOS ABIERTOS',
      'Recupera literatura científica con licencia abierta disponible para descarga inmediata y sin barreras de pago.',
      [
        { input: 'OPEN ACCESS artroplastia cadera', response: 'Entrega 3 revisiones sistemáticas recientes con enlace PDF directo de libre acceso.' },
        { input: 'ARTICULOS ABIERTOS fracturas tobillo', response: 'Recupera guías de manejo de fracturas bimaleolares y sindesmosis.' }
      ],
      colors.accentGreen
    );

    drawCallout(
      'Consolidado Diario de Aportes a las 18:00',
      'Para preservar el descanso del equipo médico y evitar notificaciones intrusivas durante cirugías, ' +
      'los aportes de literatura realizados por la comunidad médica se acumulan y se transmiten ' +
      'en un único consolidado diario a las 18:00 horas.',
      'info'
    );

    // ========================================================================
    // PÁGINA 8: MULTIMEDIA, MESA TÉCNICA Y BUZÓN DIGITAL
    // ========================================================================
    doc.addPage();
    drawHeader('MULTIMEDIA, EXPERTOS Y BUZÓN DIGITAL');

    drawSectionHeader('8', 'MULTIMEDIA QUIRÚRGICA Y MESA DE EXPERTOS', 'Videotécnicas en 1 clic y consulta de los 15 líderes mundiales');

    drawCommandCard(
      'VIDEOTÉCNICAS QUIRÚRGICAS EN 1 CLIC',
      'VIDEOS: [técnica o abordaje] | VIDEO: [patología]',
      'Conecta con fuentes audiovisuales médicas validadas: VuMedi, OrthoMedia, AO Surgery Reference y canales académicos certificados.',
      [
        { input: 'VIDEOS: artroplastia reversa de hombro', response: 'Entrega videos de liberación subescapular, fresado glenoideo y metaglene.' },
        { input: 'VIDEOS: reduccion fractura de calcaneo seno del tarso', response: 'Enlace a abordaje mínimamente invasivo con tornillos canulados.' },
        { input: 'VIDEOS: osteotomia valguizante rodilla', response: 'Video demostrativo de cuña de apertura medial con placa TomoFix.' }
      ]
    );

    drawCommandCard(
      'MESA TÉCNICA CONSULTIVA (15 PRODIGIOS QUIRÚRGICOS)',
      'MESA TECNICA | EXPERTOS',
      'Despliega el directorio y áreas de dominio de los 15 líderes mundiales de la especialidad (AO, Campbell, Rockwood, Judet, Schatzker, Letournel, etc.).',
      [
        { input: 'MESA TECNICA', response: 'Muestra lista de expertos mundiales clasificados por subespecialidad (Pelvis, Rodilla, Cadera, Hombro, Columna).' },
        { input: 'EXPERTOS pelvis', response: 'Orienta hacia las doctrinas de Judet y Letournel para reconstrucción del anillo pélvico y acetábulo.' }
      ],
      colors.navy
    );

    drawSectionHeader('9', 'BUZÓN DIGITAL Y COMUNICACIÓN CON LA DIRECCIÓN');

    drawCommandCard(
      'BUZÓN DIGITAL Y APORTE DE LITERATURA',
      'BUZON | APORTE [Adjuntar PDF]',
      'Acceso al canal confidencial para enriquecer el acervo médico colectivo. Soporta documentos hasta 2 GB con fragmentación inteligente.',
      [
        { input: 'BUZON', response: 'Entrega enlace con credencial efímera al buzón web seguro con subida segmentada.' },
        { input: 'APORTE (con archivo adjunto)', response: 'Registra el aporte en el acervo y lo cataloga para el consolidado diario de las 18:00.' }
      ]
    );

    drawCommandCard(
      'CANAL CONFIDENCIAL CON LA DIRECCIÓN DEL PROYECTO',
      'MENSAJE A LA DIRECCION: [texto de la solicitud]',
      'Relé confidencial que transmite consultas, solicitudes especiales o sugerencias directamente al Gestor de Contenido.',
      [
        { input: 'MENSAJE A LA DIRECCION: Solicito incluir el tratado de fracturas de Rockwood 9na edición', response: 'Transmisión cifrada al Gestor de Contenido preservando la privacidad del médico.' }
      ],
      colors.darkTeal
    );

    // ========================================================================
    // PÁGINA 9: FUNCIONES EXCLUSIVAS DEL GESTOR DE CONTENIDO
    // ========================================================================
    doc.addPage();
    drawHeader('MÓDULO DE GOBERNANZA (DIRECCIÓN DEL PROYECTO)');

    drawSectionHeader('10', 'FUNCIONES DEL GESTOR DE CONTENIDO', 'Gobernanza de usuarios, difusión institucional y despacho de invitaciones');

    doc.font('Helvetica').fontSize(9.2).fillColor(colors.bodyText)
       .text(
         'Módulo restringido estrictamente al número telefónico de la Dirección (+573008880001). ' +
         'Cualquier intento de invocación por usuarios no autorizados es neutralizado y registrado silenciosamente ' +
         'por el sistema IDS de telemetría forense.',
         45, doc.y, { width: contentWidth, lineGap: 2.5, align: 'justify' }
       );
    doc.moveDown(0.5);

    drawCommandCard(
      'INVITACIONES TRANSACCIONALES 1-A-1 (FLEXIBILIDAD TOTAL)',
      'INVITAR: correo@ejemplo.com | Pegar correo en el chat',
      'Invita formal e individualmente a nuevos médicos al acervo. Opera con dos modalidades flexibles:',
      [
        {
          input: 'INVITAR: jmamani41@gmail.com',
          response: 'Despacho directo e inmediato de la invitación 1-a-1. Reporte transaccional entregado al Gestor.'
        },
        {
          input: 'jmamani41@gmail.com (Pegar correo)',
          response: 'Detección inteligente: Despliega botones interactivos [ ✉️ Enviar Invitación ] y [ ❌ Cancelar ].'
        },
        {
          input: 'INVITAR: colega1@med.com, colega2@med.com',
          response: 'Despacho atómico secuencial individualizado para múltiples destinatarios.'
        }
      ],
      colors.accentGreen
    );

    drawCommandCard(
      'GOBERNANZA Y ADMINISTRACIÓN DE ACCESOS',
      'APROBAR | RECHAZAR | SUSPENDER | ACTIVAR',
      'Control del padrón de residentes y especialistas autorizados.',
      [
        { input: 'APROBAR +57311...', response: 'Habilita al residente y despacha mensaje de bienvenida con enlace al Manual Oficial.' },
        { input: 'SUSPENDER +57311... 48', response: 'Bloqueo temporal por 48 horas ante faltas disciplinarias con reactivación automática.' },
        { input: 'ACTIVAR +57311...', response: 'Restablece el acceso inmediato a un usuario suspendido.' },
        { input: 'BLOQUEAR +57311...', response: 'Expulsión definitiva del sistema por vulneración de normas éticas.' }
      ]
    );

    drawCommandCard(
      'COMUNICADOS MASIVOS Y MONITOREO SRE',
      'COMUNICADO: [texto] | ESTADO | RENDIMIENTO',
      'Difusión oficial a la comunidad médica y auditoría en tiempo real del Centinela SRE.',
      [
        { input: 'COMUNICADO: Mañana Ateneo Clínico a las 07:00 en Sala de Traumatología', response: 'Difusión atómica multilingüe (traduce al idioma del médico: ES/EN/PT).' },
        { input: 'ESTADO o RENDIMIENTO', response: 'Auditoría del Centinela SRE: latencias, salud de cuotas de Meta/Drive y memoria.' }
      ],
      colors.navy
    );

    // ========================================================================
    // PÁGINA 10: CHEAT SHEET MNEMOTÉCNICO QUIRÚRGICO DE REFERENCIA RÁPIDA
    // ========================================================================
    doc.addPage();
    drawHeader('HOJA DE REFERENCIA RÁPIDA (CHEAT SHEET)');

    drawSectionHeader('11', 'HOJA MNEMOTÉCNICA DE REFERENCIA RÁPIDA', 'Resumen sintético para tener a mano en quirófano y salas de urgencias');

    const cheatTableTop = doc.y;
    const cheatCols = [105, 120, 140, 140];
    const cheatHeaders = ['Comando', 'Sintaxis', 'Ejemplo Práctico', 'Resultado Inmediato'];

    doc.save();
    doc.rect(45, cheatTableTop, contentWidth, 18).fill(colors.navy);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(colors.white);
    let cx = 50;
    cheatHeaders.forEach((h, i) => {
      doc.text(h, cx, cheatTableTop + 5, { width: cheatCols[i] - 5 });
      cx += cheatCols[i];
    });

    const cheatRows = [
      ['Catálogo Comandos', 'COMANDOS / COMANDO', 'COMANDOS', 'Resumen y entrega de este PDF'],
      ['Búsqueda Libre', '[Palabras clave]', 'fractura de pelvis', 'Ficha técnica y PDF firmado (30 días)'],
      ['Evidencia PubMed', 'EVIDENCIA: [tema]', 'EVIDENCIA: fractura calcaneo', '3 estudios recientes con PMIDs'],
      ['Score Caprini', 'SCORE CAPRINI', 'SCORE CAPRINI', 'Riesgo TVP y pauta HBPM/DOAC'],
      ['Score Gustilo', 'SCORE GUSTILO', 'SCORE GUSTILO', 'Estratificación I-IIIC y antibióticos'],
      ['Score MESS', 'SCORE MESS', 'SCORE MESS', 'Índice de salvamento vs amputación'],
      ['Score Garden', 'SCORE GARDEN', 'SCORE GARDEN', 'Fractura cuello femoral (I a IV)'],
      ['Score TLICS', 'SCORE TLICS', 'SCORE TLICS', 'Trauma toracolumbar y estabilidad'],
      ['Copiloto Caso', 'CASO: [patología]', 'CASO: fractura subtrocanterica', 'Plan, reducción y técnica AO'],
      ['Copiloto Abordaje', 'ABORDAJE: [nombre]', 'ABORDAJE: Kocher-Langenbeck', 'Plano internervioso y riesgos'],
      ['Ficha Implante', 'IMPLANTE: [sistema]', 'IMPLANTE: Placa PHILOS', 'Brocas, machuelos, torque (Nm)'],
      ['Interconsulta', 'INTERCONSULTA: [datos]', 'INTERCONSULTA: fx expuesta tibia', 'Nota clínica ATLS/AO y antibiótico'],
      ['Open Access', 'OPEN ACCESS: [tema]', 'OPEN ACCESS artroplastia', 'Artículos abiertos de descarga libre'],
      ['Videos Quirúrgicos', 'VIDEOS: [técnica]', 'VIDEOS: artroplastia hombro', 'Enlaces en 1 clic a VuMedi/AO'],
      ['Mesa de Expertos', 'MESA TECNICA / EXPERTOS', 'MESA TECNICA', '15 líderes mundiales y doctrinas'],
      ['Buzón Digital', 'BUZON / APORTE', 'BUZON', 'Enlace seguro de subida hasta 2 GB'],
      ['Manual Oficial', 'MANUAL', 'MANUAL', 'Visor web interactivo y PDF'],
      ['Canal Dirección', 'MENSAJE A LA DIRECCION:', 'MENSAJE A LA DIRECCION: hola', 'Relé confidencial anónimo'],
      ['Invitar Colega (Gestor)', 'INVITAR: correo@med.com', 'INVITAR: dr@hospital.com', 'Invitación individual 1-a-1'],
      ['Pegar Correo (Gestor)', '[Solo pegar correo]', 'dr@hospital.com', 'Botones: Enviar Invitación / Cancelar']
    ];

    let crY = cheatTableTop + 18;
    cheatRows.forEach((r, idx) => {
      const bg = idx % 2 === 0 ? colors.lightBg : colors.white;
      doc.rect(45, crY, contentWidth, 14.5).fill(bg);
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(colors.charcoal);
      doc.text(r[0], 50, crY + 3.5, { width: cheatCols[0] - 5 });
      doc.font('Courier').fontSize(7).fillColor(colors.darkTeal);
      doc.text(r[1], 50 + cheatCols[0], crY + 4, { width: cheatCols[1] - 5 });
      doc.font('Helvetica-Oblique').fontSize(7.2).fillColor(colors.bodyText);
      doc.text(r[2], 50 + cheatCols[0] + cheatCols[1], crY + 3.5, { width: cheatCols[2] - 5 });
      doc.font('Helvetica').fontSize(7.2).fillColor(colors.mutedText);
      doc.text(r[3], 50 + cheatCols[0] + cheatCols[1] + cheatCols[2], crY + 3.5, { width: cheatCols[3] - 5 });
      crY += 14.5;
    });
    doc.restore();

    // Bloque Final de Cierre Institucional
    doc.y = crY + 14;
    doc.save();
    doc.rect(45, doc.y, contentWidth, 48).fill(colors.navy);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.teal)
       .text('DIRECCIÓN DEL PROYECTO — BIBLIOTECA MÉDICA DE CIRUGÍA ORTOPÉDICA', 55, doc.y + 10);
    doc.font('Helvetica').fontSize(8).fillColor(colors.white)
       .text('Iniciativa de Excelencia Académica, Investigación Traslacional y Soporte Continuo al Cirujano.', 55, doc.y + 24);
    doc.font('Helvetica-Oblique').fontSize(7.5).fillColor('#94A3B8')
       .text('Este documento se actualiza automáticamente con cada nueva versión y funcionalidad desplegada en el sistema.', 55, doc.y + 36);
    doc.restore();

    // ========================================================================
    // NUMERACIÓN DE PÁGINAS Y PIE DE PÁGINA (Paginación Dinámica)
    // ========================================================================
    const range = doc.bufferedPageRange();
    const totalPages = range.count;

    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);

      // En la portada omitimos el pie de página numerado
      if (i > 0) {
        doc.save();
        doc.fillColor(colors.border).rect(45, pageHeight - 32, contentWidth, 1).fill();
        doc.font('Helvetica').fontSize(7.5).fillColor(colors.mutedText)
           .text(
             'Biblioteca Médica de Cirugía Ortopédica y Traumatología  •  Guía Maestra de Comandos',
             45, pageHeight - 24, { width: contentWidth / 2, align: 'left' }
           );
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(colors.teal)
           .text(
             `Página ${i + 1} de ${totalPages}  |  Dirección del Proyecto`,
             45 + (contentWidth / 2), pageHeight - 24, { width: contentWidth / 2, align: 'right' }
           );
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
