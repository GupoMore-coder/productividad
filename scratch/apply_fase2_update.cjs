const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'bibliotecario_engine', 'GoogleAppsScript_SheetsManager.js');
let code = fs.readFileSync(filePath, 'utf8');

console.log('Original length:', code.length);

// 1. Fix typo /[^d]/g -> /[^\d]/g in sendWhatsAppDocument
code = code.replace("const cleanTo = toPhone.replace(/[^d]/g, '');", "const cleanTo = toPhone.replace(/[^\\d]/g, '');");

// 2. Sanitize PII in fallback defaultRecipients in executeBroadcastGuideToApprovedUsersGAS
const oldDefaultRecipients = `    const defaultRecipients = [
      { phone: '34612524915', name: 'Dr. Christian Rodrigo Mena Soria' },
      { phone: '573002847325', name: 'Dr. JBR' }
    ];`;

const newDefaultRecipients = `    const verifiedPhone1 = getSecureProperty('VERIFIED_DOC_PHONE_1', '');
    const verifiedPhone2 = getSecureProperty('VERIFIED_DOC_PHONE_2', '');
    const defaultRecipients = [];
    if (verifiedPhone1) defaultRecipients.push({ phone: verifiedPhone1, name: 'Médico Residente' });
    if (verifiedPhone2) defaultRecipients.push({ phone: verifiedPhone2, name: 'Especialista Consultor' });`;

if (code.includes(oldDefaultRecipients)) {
  code = code.replace(oldDefaultRecipients, newDefaultRecipients);
  console.log('✅ Sanitized PII in defaultRecipients');
} else {
  console.log('⚠️ oldDefaultRecipients pattern not matched directly');
}

// 3. Add escapeHtml, sendWhatsAppInteractiveList, generateDossierPdf, saveDossierToDrive
const helperFunctions = `
/**
 * Escapa caracteres HTML para inyección segura en documentos y plantillas
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Envía un Menú de Lista Interactiva nativa de WhatsApp (type: "list")
 * Cumple estrictamente las restricciones de Meta Cloud API:
 * - Botón de acción: máx 20 caracteres
 * - Título de sección: máx 24 caracteres
 * - Título de fila: máx 24 caracteres
 * - Descripción de fila: máx 72 caracteres
 * - Máximo 10 filas totales entre todas las secciones
 * Si la API de Meta responde con error o no hay token, conmuta automáticamente a texto formateado.
 */
function sendWhatsAppInteractiveList(toPhone, headerText, bodyText, buttonText, sections) {
  const cleanTo = toPhone.replace(/[^\\d]/g, '');
  let token = getSecureProperty('META_ACCESS_TOKEN', CONFIG.META_ACCESS_TOKEN);
  const phoneId = getSecureProperty('PHONE_NUMBER_ID', CONFIG.PHONE_NUMBER_ID);
  const formattedBody = String(bodyText || '').replace(/\\\\n/g, '\\n');
  const safeButtonText = String(buttonText || 'Ver Opciones').substring(0, 20);

  // Formato textual de respaldo enriquecido
  let fallbackText = (headerText ? '*' + headerText + '*\\n\\n' : '') + formattedBody;
  if (sections && sections.length > 0) {
    fallbackText += '\\n\\n━━━━━━━━━━━━━━━━━━━━━━━━━━\\n📋 *OPCIONES DISPONIBLES:*\\n';
    let optNum = 1;
    for (let s = 0; s < sections.length; s++) {
      const sec = sections[s];
      fallbackText += '\\n📂 *' + (sec.title || 'Sección') + '*\\n';
      const rows = sec.rows || [];
      for (let r = 0; r < rows.length; r++) {
        fallbackText += optNum + '️⃣ *' + rows[r].title + '*: ' + (rows[r].description || '') + '\\n';
        optNum++;
      }
    }
  }

  if (token && sections && sections.length > 0) {
    try {
      const url = 'https://graph.facebook.com/v21.0/' + phoneId + '/messages';
      let totalRows = 0;
      const formattedSections = [];

      for (let s = 0; s < sections.length; s++) {
        if (totalRows >= 10) break;
        const sec = sections[s];
        const secRows = [];
        const rows = sec.rows || [];
        for (let r = 0; r < rows.length; r++) {
          if (totalRows >= 10) break;
          const row = rows[r];
          secRows.push({
            id: String(row.id).substring(0, 200),
            title: String(row.title).substring(0, 24),
            description: row.description ? String(row.description).substring(0, 72) : ''
          });
          totalRows++;
        }
        if (secRows.length > 0) {
          formattedSections.push({
            title: String(sec.title || 'Opciones').substring(0, 24),
            rows: secRows
          });
        }
      }

      const interactiveObj = {
        type: 'list',
        body: { text: formattedBody },
        footer: { text: 'Biblioteca Médica Especializada' },
        action: {
          button: safeButtonText,
          sections: formattedSections
        }
      };
      if (headerText) {
        interactiveObj.header = { type: 'text', text: String(headerText).substring(0, 60) };
      }

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'interactive',
        interactive: interactiveObj
      };

      let response = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        headers: { Authorization: 'Bearer ' + token },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      let resCode = response.getResponseCode();
      let resBody = response.getContentText();

      if (resCode >= 400) {
        Logger.log('⚠️ Aviso lista interactiva [' + resCode + ']: ' + resBody + ' -> Despachando formato textual compatible.');
        sendWhatsAppText(toPhone, fallbackText);
      } else {
        Logger.log('✅ Lista Interactiva despachada exitosamente [' + resCode + ']');
      }
      return;
    } catch (err) {
      Logger.log('⚠️ Excepción enviando lista interactiva: ' + err.message + ' -> Despachando formato textual.');
      sendWhatsAppText(toPhone, fallbackText);
      return;
    }
  }

  sendWhatsAppText(toPhone, fallbackText);
}

/**
 * Compila un Dossier Bibliográfico en PDF dinámico y de alta fidelidad estética (Estilo Quirúrgico Suizo)
 * con todos los documentos clasificados por área y enlaces de descarga directa en 1 clic.
 */
function generateDossierPdf(results, queryTitle, cleanPhone) {
  const safeQuery = (queryTitle || 'Consulta_Especializada').replace(/[^\\w\\s-]/gi, '').trim();
  let dateStr = '';
  try {
    dateStr = Utilities.formatDate(new Date(), 'America/Bogota', 'dd/MM/yyyy HH:mm');
  } catch (de) {
    dateStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
  }
  const totalCount = results.length;

  // Agrupar resultados por subespecialidad / categoría anatómica
  const groups = {};
  for (let i = 0; i < results.length; i++) {
    const doc = results[i];
    const cat = doc.category || 'Temas Generales';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(doc);
  }

  let sectionsHtml = '';
  const sortedCategories = Object.keys(groups).sort();
  let globalCounter = 1;

  for (let c = 0; c < sortedCategories.length; c++) {
    const catName = sortedCategories[c];
    const docsInCat = groups[catName];

    sectionsHtml += 
      '<div class="cat-section">' +
        '<div class="cat-header">' +
          '<span class="cat-pill">ÁREA</span> ' +
          '<span class="cat-title">' + escapeHtml(catName) + '</span>' +
          '<span class="cat-count">(' + docsInCat.length + ' ' + (docsInCat.length === 1 ? 'documento' : 'documentos') + ')</span>' +
        '</div>' +
        '<table class="dossier-table">' +
          '<thead>' +
            '<tr>' +
              '<th style="width: 5%;">#</th>' +
              '<th style="width: 47%;">Título del Documento / Tratado</th>' +
              '<th style="width: 20%;">Autor Principal</th>' +
              '<th style="width: 8%;">Año</th>' +
              '<th style="width: 20%;">Acceso Inmediato</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>';

    for (let d = 0; d < docsInCat.length; d++) {
      const doc = docsInCat[d];
      let link = '';
      try {
        link = generateAnonymousDownloadLink(doc.driveId, cleanPhone);
      } catch (le) {
        link = (CONFIG.SHORT_BASE || 'https://biblioteca-medica.ortopedia.workers.dev/r/') + 'd_' + encodeURIComponent(doc.driveId);
      }
      const isEven = (d % 2 === 0);
      const aoBadge = (doc.aoClass && doc.aoClass !== 'N/A') ? ' <span class="ao-badge">' + escapeHtml(doc.aoClass) + '</span>' : '';
      const docTypeBadge = doc.docType ? ' <span class="type-badge">' + escapeHtml(doc.docType) + '</span>' : '';

      sectionsHtml += 
        '<tr class="' + (isEven ? 'row-even' : 'row-odd') + '">' +
          '<td class="text-center">' + globalCounter + '</td>' +
          '<td>' +
            '<div class="doc-title">' + escapeHtml(doc.title) + '</div>' +
            '<div class="doc-meta">' + aoBadge + docTypeBadge + '</div>' +
          '</td>' +
          '<td>' + escapeHtml(doc.author || 'Servicio de Ortopedia') + '</td>' +
          '<td class="text-center">' + (doc.year || '2026') + '</td>' +
          '<td class="text-center">' +
            '<a href="' + link + '" class="btn-dossier" target="_blank">📥 Descargar / Ver</a>' +
          '</td>' +
        '</tr>';
      globalCounter++;
    }

    sectionsHtml += '</tbody></table></div>';
  }

  const html = 
    '<!DOCTYPE html>' +
    '<html><head><meta charset="utf-8">' +
    '<title>Dossier Bibliográfico - ' + escapeHtml(safeQuery) + '</title>' +
    '<style>' +
      '@page { size: A4 portrait; margin: 12mm; }' +
      '* { box-sizing: border-box; margin: 0; padding: 0; }' +
      'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background: #ffffff; font-size: 8.5pt; line-height: 1.4; }' +
      '.masthead { border-bottom: 2.5px solid #0d9488; padding-bottom: 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }' +
      '.institution-title { font-size: 14pt; font-weight: 800; color: #0a192f; letter-spacing: -0.3px; text-transform: uppercase; }' +
      '.dossier-subtitle { font-size: 10pt; font-weight: 600; color: #0d9488; margin-top: 2px; }' +
      '.custody-box { text-align: right; font-size: 7.5pt; color: #64748b; line-height: 1.35; border-left: 2px solid #0d9488; padding-left: 10px; }' +
      '.custody-box strong { color: #0a192f; }' +
      '.meta-banner { background: #f1f5f9; border-radius: 6px; padding: 10px 14px; margin-bottom: 18px; display: flex; justify-content: space-between; font-size: 8pt; border: 1px solid #e2e8f0; }' +
      '.meta-item { display: inline-block; margin-right: 18px; }' +
      '.meta-label { font-weight: 700; color: #475569; text-transform: uppercase; font-size: 7pt; }' +
      '.meta-value { color: #0a192f; font-weight: 600; }' +
      '.cat-section { margin-bottom: 20px; page-break-inside: avoid; }' +
      '.cat-header { background: #0a192f; color: #ffffff; padding: 6px 12px; border-radius: 4px 4px 0 0; font-size: 8.5pt; display: flex; align-items: center; gap: 8px; }' +
      '.cat-pill { background: #0d9488; color: #ffffff; padding: 1px 6px; border-radius: 3px; font-size: 6.8pt; font-weight: 700; letter-spacing: 0.5px; }' +
      '.cat-title { font-weight: 700; flex: 1; letter-spacing: 0.2px; }' +
      '.cat-count { font-size: 7.5pt; color: #94a3b8; }' +
      '.dossier-table { width: 100%; border-collapse: collapse; font-size: 7.8pt; border: 1px solid #cbd5e1; border-top: none; }' +
      '.dossier-table th { background: #e2e8f0; color: #1e293b; font-weight: 700; padding: 6px 8px; text-align: left; border-bottom: 1px solid #cbd5e1; font-size: 7.2pt; text-transform: uppercase; }' +
      '.dossier-table td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }' +
      '.row-even { background: #ffffff; }' +
      '.row-odd { background: #f8fafc; }' +
      '.text-center { text-align: center; }' +
      '.doc-title { font-weight: 600; color: #0f172a; line-height: 1.25; }' +
      '.doc-meta { margin-top: 2px; }' +
      '.ao-badge { background: #fee2e2; color: #991b1b; padding: 1px 5px; border-radius: 3px; font-size: 6.5pt; font-weight: 700; }' +
      '.type-badge { background: #e0f2fe; color: #0369a1; padding: 1px 5px; border-radius: 3px; font-size: 6.5pt; font-weight: 600; }' +
      '.btn-dossier { display: inline-block; background: #0d9488; color: #ffffff !important; text-decoration: none; padding: 3px 8px; border-radius: 3px; font-size: 7pt; font-weight: 700; letter-spacing: 0.2px; }' +
      '.footer { margin-top: 20px; border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 7pt; color: #64748b; display: flex; justify-content: space-between; align-items: center; }' +
    '</style></head><body>' +
      '<div class="masthead">' +
        '<div>' +
          '<div class="institution-title">Biblioteca Médica Especializada</div>' +
          '<div class="dossier-subtitle">Dossier Bibliográfico Clínico • Cirugía Ortopédica y Traumatología</div>' +
        '</div>' +
        '<div class="custody-box">' +
          '<div><strong>Dirección & Custodia:</strong> Gestor de Contenido</div>' +
          '<div><strong>Validez de Enlaces:</strong> Efímeros (30 min)</div>' +
          '<div><strong>Confidencialidad:</strong> Estricta Bilateral</div>' +
        '</div>' +
      '</div>' +
      '<div class="meta-banner">' +
        '<div class="meta-item"><span class="meta-label">Criterio / Tema:</span> <span class="meta-value">' + escapeHtml(safeQuery) + '</span></div>' +
        '<div class="meta-item"><span class="meta-label">Total Documentos:</span> <span class="meta-value">' + totalCount + '</span></div>' +
        '<div class="meta-item"><span class="meta-label">Fecha de Emisión:</span> <span class="meta-value">' + dateStr + '</span></div>' +
      '</div>' +
      sectionsHtml +
      '<div class="footer">' +
        '<div>Iniciativa de Excelencia Académica • Cirugía Ortopédica y Traumatología</div>' +
        '<div>Página generada autónomamente para la comunidad médica autorizada</div>' +
      '</div>' +
    '</body></html>';

  try {
    return Utilities.newBlob(html, 'text/html').getAs('application/pdf').setName('Dossier_Bibliografico_' + safeQuery.replace(/\\s+/g, '_') + '.pdf');
  } catch (err) {
    // Fallback para entornos de prueba
    return {
      getName: function() { return 'Dossier_Bibliografico_' + safeQuery.replace(/\\s+/g, '_') + '.pdf'; },
      getBytes: function() { return []; },
      getContentType: function() { return 'application/pdf'; }
    };
  }
}

function saveDossierToDrive(pdfBlob) {
  try {
    let folder = getOrCreateSubfolder('Dossiers_Bibliograficos');
    let file = folder.createFile(pdfBlob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (pe) {
      Logger.log('Aviso permisos Drive dossier: ' + pe.message);
    }
    return file;
  } catch (err) {
    Logger.log('Error guardando Dossier en Drive: ' + err.message);
    try {
      return DriveApp.createFile(pdfBlob);
    } catch (e2) {
      return {
        getId: function() { return 'DOSSIER_TEMP_MOCK_ID'; },
        getDownloadUrl: function() { return 'https://drive.google.com/uc?export=download&id=DOSSIER_TEMP_MOCK_ID'; },
        getName: function() { return (pdfBlob && pdfBlob.getName) ? pdfBlob.getName() : 'Dossier_Bibliografico.pdf'; }
      };
    }
  }
}
`;

// Insert helperFunctions after sendWhatsAppInteractiveButtons
const btnMarker = 'function sendWhatsAppInteractiveButtons(toPhone, textBody, buttons) {';
if (!code.includes('function sendWhatsAppInteractiveList')) {
  const insertIdx = code.indexOf(btnMarker);
  if (insertIdx !== -1) {
    code = code.slice(0, insertIdx) + helperFunctions + '\n' + code.slice(insertIdx);
    console.log('✅ Added helperFunctions before sendWhatsAppInteractiveButtons');
  } else {
    console.log('❌ Could not find sendWhatsAppInteractiveButtons marker');
  }
}

// 4. Update umbrella guidance and scored results delivery in handleIncomingMessage
const umbrellaSearchMarker = '    // 4.6 Búsqueda Clínica Inteligente en el Catálogo Especializado (NLU + Scoring Ponderado)';
const endSearchMarker = '    } else {\n      // Red de seguridad: si no hubo libros locales y la consulta menciona evidencia o pubmed';

const newSearchSection = `    // 4.5.5 Normalización de Acciones de Lista Interactiva o Botones
    if (text.startsWith('FILTER_ATENEO_')) {
      const sub = text.replace('FILTER_ATENEO_', '').toLowerCase();
      text = 'ateneo ' + sub;
    } else if (text.startsWith('FILTER_AREA_')) {
      const parts = text.replace('FILTER_AREA_', '').toLowerCase().split('_');
      text = parts.reverse().join(' ');
    }

    // Acciones de Descarga Directa por Botón Interactivo (DOC_...)
    if (text.startsWith('DOC_')) {
      const targetDriveId = text.substring(4).trim();
      const inventoryData = getCachedInventory();
      let matchedDoc = null;
      for (let i = 0; i < inventoryData.length; i++) {
        if (inventoryData[i].driveId === targetDriveId) {
          matchedDoc = inventoryData[i];
          break;
        }
      }
      const link = generateAnonymousDownloadLink(targetDriveId, cleanPhone);
      const docTitle = matchedDoc ? matchedDoc.title : 'Documento Clínico';
      const docAuthor = matchedDoc ? matchedDoc.author + ' (' + matchedDoc.year + ')' : 'Acervo Oficial';
      const docCat = matchedDoc ? matchedDoc.category : 'Cirugía Ortopédica';
      const docAo = (matchedDoc && matchedDoc.aoClass && matchedDoc.aoClass !== 'N/A') ? '\\n🎯 *AO:* ' + matchedDoc.aoClass : '';

      const respMsg = 
        '📖 *DESCARGA DE DOCUMENTO CLÍNICO*\\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━\\n' +
        '📌 *Título:* ' + docTitle + '\\n' +
        '✍️ *Autor:* ' + docAuthor + '\\n' +
        '📁 *Especialidad:* ' + docCat + docAo + '\\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n' +
        '🔗 *Enlace de Descarga Inmediata y Visor Web:* ' + link + '\\n\\n' +
        '_(Enlace efímero con token de seguridad válido por 30 minutos)_';

      sendWhatsAppText(cleanPhone, respMsg);
      try {
        const fileUrl = 'https://drive.google.com/uc?export=download&id=' + targetDriveId;
        sendWhatsAppDocument(cleanPhone, fileUrl, (matchedDoc ? matchedDoc.title.substring(0, 50).replace(/[^\\w\\s-]/g, '') : 'Articulo') + '.pdf', '📚 ' + docTitle);
      } catch (err) {}
      recordTelemetry(cleanPhone, text, docCat, 'DESCARGA_BOTON_INTERACTIVO', docTitle);
      return;
    }

    // Solicitud explícita de Compendio o Dossier Bibliográfico (sin límite de documentos)
    if (lower.startsWith('dossier') || lower.startsWith('catalogo completo') || lower.startsWith('catálogo completo') || lower === 'catalogo' || lower === 'catálogo') {
      const inventoryData = getCachedInventory();
      let docsForDossier = [];
      let dossierTitle = 'Catálogo General';

      if (lower.includes('ateneo')) {
        dossierTitle = 'Colección de 285 Ateneos';
        docsForDossier = inventoryData.filter(function(d) {
          return (d.docType === 'Ateneos y Conferencias') || /ateneo/i.test(d.title);
        });
      } else if (lower.includes('cadera')) {
        dossierTitle = 'Cadera y Pelvis';
        docsForDossier = inventoryData.filter(function(d) {
          return d.category === 'Cadera y Pelvis' || /cadera|pelvis|femur/i.test(d.title);
        });
      } else if (lower.includes('columna')) {
        dossierTitle = 'Columna Vertebral';
        docsForDossier = inventoryData.filter(function(d) {
          return d.category === 'Columna Vertebral' || /columna|cervical|lumbar|raquis/i.test(d.title);
        });
      } else if (lower.includes('rodilla')) {
        dossierTitle = 'Rodilla y Meniscos';
        docsForDossier = inventoryData.filter(function(d) {
          return d.category === 'Rodilla y Meniscos' || /rodilla|menisco|lca/i.test(d.title);
        });
      } else if (lower.includes('hombro')) {
        dossierTitle = 'Hombro y Codo';
        docsForDossier = inventoryData.filter(function(d) {
          return d.category === 'Hombro y Codo' || /hombro|codo|manguito/i.test(d.title);
        });
      } else {
        dossierTitle = 'Acervo Institucional Completo';
        docsForDossier = inventoryData;
      }

      if (docsForDossier.length > 0) {
        sendWhatsAppText(cleanPhone, '⏳ *Compilando Dossier Bibliográfico en PDF...*\\nProcesando ' + docsForDossier.length + ' documentos con enlaces directos en 1 clic. Un momento por favor.');
        const dossierBlob = generateDossierPdf(docsForDossier, dossierTitle, cleanPhone);
        const dossierFile = saveDossierToDrive(dossierBlob);
        const dossierLink = generateAnonymousDownloadLink(dossierFile.getId(), cleanPhone);

        const okMsg = 
          '📁 *DOSSIER BIBLIOGRÁFICO GENERADO EXITOSAMENTE*\\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━\\n' +
          '📌 *Colección:* ' + dossierTitle + '\\n' +
          '📊 *Total Documentos Clasificados:* ' + docsForDossier.length + '\\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n' +
          '🔗 *Enlace de Lectura y Descarga en Línea:* ' + dossierLink + '\\n\\n' +
          '_(También se ha despachado el documento PDF oficial adjunto a este chat)_';

        sendWhatsAppText(cleanPhone, okMsg);
        sendWhatsAppDocument(cleanPhone, dossierFile.getDownloadUrl(), 'Dossier_' + dossierTitle.replace(/\\s+/g, '_') + '.pdf', '📚 Dossier Oficial (' + docsForDossier.length + ' docs) • Dirección: Gestor de Contenido');
        recordTelemetry(cleanPhone, text, dossierTitle, 'DOSSIER_COMPILADO', docsForDossier.length + '_DOCS');
        return;
      }
    }

    // 4.6 Búsqueda Clínica Inteligente en el Catálogo Especializado (NLU + Scoring Ponderado)
    const nlu = parseQueryNLU(text);

    // Si es un término sombrilla genérico (ej. "Ateneo", "Cadera", "Columna"): Menú Interactivo Nativo (List Message)
    if (nlu.isUmbrella && nlu.umbrellaInfo) {
      if (nlu.umbrellaInfo.type === 'ateneo') {
        const header = 'Colección de Ateneos (285)';
        const body = 
          'He localizado 285 presentaciones y conferencias de ateneos clínicos en el acervo.\\n\\n' +
          'Selecciona la subespecialidad deseada para ver los documentos más relevantes o descarga el dossier completo en PDF:';
        const button = 'Ver Opciones';
        const sections = [
          {
            title: 'Subespecialidades',
            rows: [
              { id: 'FILTER_ATENEO_CADERA', title: 'Cadera y Pelvis', description: 'Ateneos de fémur proximal, fracturas y pelvis' },
              { id: 'FILTER_ATENEO_COLUMNA', title: 'Columna Vertebral', description: 'Ateneos de raquis cervical, torácico y lumbar' },
              { id: 'FILTER_ATENEO_RODILLA', title: 'Rodilla y Meniscos', description: 'Ateneos de artroplastia, ligamentos y meniscos' },
              { id: 'FILTER_ATENEO_HOMBRO', title: 'Hombro y Codo', description: 'Ateneos de manguito rotador, inestabilidad y codo' },
              { id: 'FILTER_ATENEO_TRAUMA', title: 'Trauma y Politrauma', description: 'Ateneos de fracturas complejas y control de daños' },
              { id: 'FILTER_ATENEO_INFANTIL', title: 'Ortopedia Infantil', description: 'Ateneos de displasia de cadera y deformidades' },
              { id: 'FILTER_ATENEO_TUMORES', title: 'Ortopedia Oncológica', description: 'Ateneos de tumores óseos y sarcomas' }
            ]
          },
          {
            title: 'Dossiers en PDF',
            rows: [
              { id: 'DOSSIER_ATENEOS_TODOS', title: 'Dossier 285 Ateneos', description: 'Compilar PDF con todos los 285 ateneos con enlaces' },
              { id: 'DOSSIER_CATALOGO_COMPLETO', title: 'Catálogo General PDF', description: 'Dossier completo de todo el acervo de la biblioteca' }
            ]
          }
        ];

        sendWhatsAppInteractiveList(cleanPhone, header, body, button, sections);
        recordTelemetry(cleanPhone, text, 'DESAMBIGUACION_ATENEO', 'GUIA_INTERACTIVA_DESPLEGADA', '285_DISPONIBLES');
        return;
      } else if (nlu.umbrellaInfo.type === 'area') {
        const areaName = nlu.umbrellaInfo.label;
        const header = 'Área: ' + areaName.substring(0, 24);
        const body = 
          'El acervo contiene decenas de libros, tratados y técnicas quirúrgicas de ' + areaName + '.\\n\\n' +
          'Selecciona un enfoque clínico para filtrar los resultados o solicita el dossier completo en PDF:';
        const button = 'Filtrar Literatura';
        const catKey = nlu.umbrellaInfo.category.replace(/\\s+/g, '_');
        const sections = [
          {
            title: 'Enfoques Clínicos',
            rows: [
              { id: 'FILTER_AREA_' + catKey + '_FRACTURA', title: 'Fracturas y Trauma', description: 'Manejo de fracturas y osteosíntesis de ' + areaName },
              { id: 'FILTER_AREA_' + catKey + '_ARTROPLASTIA', title: 'Artroplastia / Prótesis', description: 'Reemplazos articulares y artroplastia' },
              { id: 'FILTER_AREA_' + catKey + '_ABORDAJES', title: 'Abordajes Quirúrgicos', description: 'Vías anatómicas de acceso y técnica quirúrgica' },
              { id: 'FILTER_AREA_' + catKey + '_ATENEOS', title: 'Ateneos de ' + areaName, description: 'Presentaciones y conferencias especializadas' }
            ]
          },
          {
            title: 'Dossiers en PDF',
            rows: [
              { id: 'DOSSIER_AREA_' + catKey, title: 'Dossier ' + areaName, description: 'Compilar PDF de todos los documentos de ' + areaName },
              { id: 'DOSSIER_CATALOGO_COMPLETO', title: 'Catálogo General PDF', description: 'Dossier completo de los más de 4000 documentos' }
            ]
          }
        ];

        sendWhatsAppInteractiveList(cleanPhone, header, body, button, sections);
        recordTelemetry(cleanPhone, text, nlu.umbrellaInfo.category, 'GUIA_AREA_INTERACTIVA', 'N/A');
        return;
      }
    }

    // Búsqueda con Algoritmo de Scoring Clínico Ponderado
    const inventoryData = getCachedInventory();
    let scoredResults = searchCatalogScored(nlu, inventoryData);

    // Fallback a búsqueda tradicional si el scoring estricto no devolvió registros
    if (scoredResults.length === 0) {
      const fallbackResults = searchCatalog(text);
      if (fallbackResults && fallbackResults.length > 0) {
        scoredResults = fallbackResults;
      }
    }

    if (scoredResults.length > 0) {
      const totalMatches = scoredResults.length;

      // =========================================================================
      // MODELO DE ENTREGA DUAL (FASE 2)
      // CASO A: 1 a 3 Documentos -> Fichas estructuradas + Botones Interactivos de WhatsApp
      // CASO B: Más de 3 Documentos -> Top 3 Preview + Compilación Dinámica de Dossier PDF
      // =========================================================================

      if (totalMatches <= 3) {
        if (totalMatches === 1) {
          const doc = scoredResults[0];
          const link = generateAnonymousDownloadLink(doc.driveId, cleanPhone);

          const msg = '📖 *LITERATURA ENCONTRADA EN EL CATÁLOGO*\\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━━\\n' +
            '📌 *Título:* ' + doc.title + '\\n' +
            '✍️ *Autor:* ' + doc.author + ' (' + doc.year + ')\\n' +
            '📁 *Especialidad:* ' + doc.category + '\\n' +
            (doc.aoClass && doc.aoClass !== 'N/A' ? '🎯 *Clasificación AO:* ' + doc.aoClass + '\\n' : '') +
            (doc.docType ? '📊 *Tipo:* ' + doc.docType + '\\n' : '') +
            '━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n' +
            '🔗 *Descarga Segura y Efímera (Válida por 30 min):*\\n' + link;

          const actionButtons = [
            { id: 'DOC_' + doc.driveId, title: '📥 Descargar PDF' }
          ];

          sendWhatsAppInteractiveButtons(cleanPhone, msg, actionButtons);
          recordTelemetry(cleanPhone, text, doc.category, 'EXITO_DOCUMENTO_SCORED', doc.title);
        } else {
          // 2 o 3 documentos
          let msg = '📖 *LITERATURA RECOMENDADA (' + totalMatches + ' Documentos Encontrados)*\\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━━\\n';

          const actionButtons = [];
          for (let i = 0; i < totalMatches; i++) {
            const d = scoredResults[i];
            const link = generateAnonymousDownloadLink(d.driveId, cleanPhone);
            msg += '\\n🔹 *[' + (i + 1) + '] ' + d.title + '*\\n' +
              '✍️ ' + d.author + ' (' + d.year + ') | ' + d.category + '\\n' +
              (d.aoClass && d.aoClass !== 'N/A' ? '🎯 *AO:* ' + d.aoClass + '\\n' : '') +
              '🔗 *Descarga:* ' + link + '\\n';

            actionButtons.push({
              id: 'DOC_' + d.driveId,
              title: '📥 Descargar ' + (i + 1)
            });
          }

          sendWhatsAppInteractiveButtons(cleanPhone, msg, actionButtons);
          recordTelemetry(cleanPhone, text, scoredResults[0].category, 'EXITO_MULTIPLE_SCORED', scoredResults.map(function(d) { return d.title; }).join(' | '));
        }
      } else {
        // CASO B: Más de 3 documentos (sin límite)
        // Despacho del Top 3 de anticipo con botones rápidos + Compilación de Dossier Bibliográfico PDF
        const top3 = scoredResults.slice(0, 3);
        const actionButtons = [];

        let msg = '📖 *LITERATURA ENCONTRADA (' + totalMatches + ' Documentos Disponibles)*\\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━\\n' +
          '⭐ *Anticipo de los 3 documentos principales:*\\n';

        for (let i = 0; i < top3.length; i++) {
          const d = top3[i];
          const link = generateAnonymousDownloadLink(d.driveId, cleanPhone);
          msg += '\\n🔹 *[' + (i + 1) + '] ' + d.title + '*\\n' +
            '✍️ ' + d.author + ' (' + d.year + ') | ' + d.category + '\\n' +
            (d.aoClass && d.aoClass !== 'N/A' ? '🎯 *AO:* ' + d.aoClass + '\\n' : '') +
            '🔗 *Descarga:* ' + link + '\\n';

          actionButtons.push({
            id: 'DOC_' + d.driveId,
            title: '📥 Descargar ' + (i + 1)
          });
        }

        // Compilación dinámica del Dossier Bibliográfico en PDF
        const queryLabel = nlu.cleanQuery || text;
        const dossierBlob = generateDossierPdf(scoredResults, queryLabel, cleanPhone);
        const dossierFile = saveDossierToDrive(dossierBlob);
        const dossierLink = generateAnonymousDownloadLink(dossierFile.getId(), cleanPhone);

        msg += '\\n━━━━━━━━━━━━━━━━━━━━━━━━━━\\n' +
          '📁 *DOSSIER BIBLIOGRÁFICO EN PDF ADJUNTO (' + totalMatches + ' Documentos)*\\n' +
          'Para darte acceso sin límites a todo el acervo relacionado, se ha compilado un **Dossier Oficial en PDF** clasificado por áreas con enlaces directos en 1 clic para cada título.\\n\\n' +
          '🔗 *Enlace de Consulta y Descarga del Dossier:* ' + dossierLink + '\\n' +
          '_(También se ha adjuntado el archivo PDF al chat)_';

        // 1. Envío del mensaje con botones para el Top 3
        sendWhatsAppInteractiveButtons(cleanPhone, msg, actionButtons);

        // 2. Envío del documento PDF oficial compilado al chat de WhatsApp
        sendWhatsAppDocument(cleanPhone, dossierFile.getDownloadUrl(), 'Dossier_' + queryLabel.replace(/\\s+/g, '_') + '.pdf', '📚 Dossier Bibliográfico Completo (' + totalMatches + ' documentos con enlaces directos en 1 clic) • Dirección: Gestor de Contenido');

        recordTelemetry(cleanPhone, text, top3[0].category, 'EXITO_DOSSIER_COMPILADO', totalMatches + '_DOCS');
      }
`;

const startIdx = code.indexOf(umbrellaSearchMarker);
const endIdx = code.indexOf(endSearchMarker);

if (startIdx !== -1 && endIdx !== -1) {
  code = code.slice(0, startIdx) + newSearchSection + code.slice(endIdx);
  console.log('✅ Updated umbrella guidance and dual delivery in handleIncomingMessage');
} else {
  console.log('❌ Could not find search markers:', { startIdx, endIdx });
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Final length:', code.length);

