const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../bibliotecario_engine/GoogleAppsScript_SheetsManager.js');
let content = fs.readFileSync(targetFile, 'utf8');

const startMarker = "    // 4.6 Búsqueda Clínica Inteligente en el Catálogo Especializado (Multi-Paso)";
const endMarker = "      recordTelemetry(cleanPhone, text, doc.category, 'EXITO_DOCUMENTO', doc.title);\n    } else {";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('ERROR: markers not found!', { startIndex, endIndex });
  process.exit(1);
}

const replacement = `    // 4.6 Búsqueda Clínica Inteligente en el Catálogo Especializado (NLU + Scoring Ponderado)
    const nlu = parseQueryNLU(text);

    // Si es un término sombrilla genérico (ej. "Ateneo", "Cadera", "Columna"): Guianza Interactiva
    if (nlu.isUmbrella && nlu.umbrellaInfo) {
      if (nlu.umbrellaInfo.type === 'ateneo') {
        sendWhatsAppText(cleanPhone, 
          '🎓 *COLECCIÓN DE ATENEOS CLÍNICOS (285 Presentaciones)*\\\\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n' +
          'He localizado 285 presentaciones de ateneos y conferencias en el acervo.\\\\n\\\\n' +
          'Para entregarte la literatura precisa, indícame la subespecialidad o tema que deseas consultar:\\\\n\\\\n' +
          '1️⃣ *Cadera y Pelvis* (ej. \`ateneo cadera\`)\\\\n' +
          '2️⃣ *Columna Vertebral* (ej. \`ateneo columna\`)\\\\n' +
          '3️⃣ *Rodilla y Meniscos* (ej. \`ateneo rodilla\`)\\\\n' +
          '4️⃣ *Hombro y Codo* (ej. \`ateneo hombro\`)\\\\n' +
          '5️⃣ *Trauma y Politrauma* (ej. \`ateneo politrauma\`)\\\\n' +
          '6️⃣ *Ortopedia Oncológica e Infantil* (ej. \`ateneo tumores\`)\\\\n\\\\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n' +
          '💡 *O escribe:* \`Dame 3 ateneos de cadera\` para ver los más destacados.'
        );
        recordTelemetry(cleanPhone, text, 'DESAMBIGUACION_ATENEO', 'GUIA_DESPLEGADA', '285_DISPONIBLES');
        return;
      } else if (nlu.umbrellaInfo.type === 'area') {
        sendWhatsAppText(cleanPhone, 
          '📂 *ÁREA CLÍNICA: ' + nlu.umbrellaInfo.label.toUpperCase() + '*\\\\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n' +
          'El acervo contiene decenas de libros, tratados y artículos de *' + nlu.umbrellaInfo.label + '*.\\\\n\\\\n' +
          'Para afinar tu consulta, formula una búsqueda específica como:\\\\n' +
          '👉 *Fractura de ' + nlu.cleanQuery + '*\\\\n' +
          '👉 *Artroplastia de ' + nlu.cleanQuery + '*\\\\n' +
          '👉 *Abordajes de ' + nlu.cleanQuery + '*\\\\n\\\\n' +
          '💡 O solicita: \`Dame 3 artículos de ' + nlu.cleanQuery + '\`.'
        );
        recordTelemetry(cleanPhone, text, nlu.umbrellaInfo.category, 'GUIA_AREA_DESPLEGADA', 'N/A');
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
      // Determinar cantidad a entregar: si pidió N (ej. 3), entregamos N (máximo 3 en mensaje directo)
      const countToDeliver = nlu.requestedCount ? Math.min(nlu.requestedCount, 3) : 1;
      const docsToDeliver = scoredResults.slice(0, countToDeliver);

      if (docsToDeliver.length === 1) {
        const doc = docsToDeliver[0];
        const link = generateAnonymousDownloadLink(doc.driveId, cleanPhone);
        const extraCount = scoredResults.length - 1;

        let msg = '📖 *LITERATURA ENCONTRADA EN EL CATÁLOGO*\\\\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n' +
          '📌 *Título:* ' + doc.title + '\\\\n' +
          '✍️ *Autor:* ' + doc.author + ' (' + doc.year + ')\\\\n' +
          '📁 *Especialidad:* ' + doc.category + '\\\\n' +
          (doc.aoClass && doc.aoClass !== 'N/A' ? '🎯 *Clasificación AO:* ' + doc.aoClass + '\\\\n' : '') +
          (doc.docType ? '📊 *Tipo:* ' + doc.docType + '\\\\n' : '') +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n\\\\n' +
          '🔗 *Descarga Segura y Efímera (Válida por 30 min):*\\\\n' + link;

        if (extraCount > 0) {
          msg += '\\\\n\\\\n━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n' +
            '📚 *Acervo adicional:* Hay **' + extraCount + ' documentos más** sobre este tema.\\\\n' +
            '👉 Escribe \`Dame 3 sobre ' + nlu.cleanQuery + '\` para ver los más destacados.';
        }

        sendWhatsAppText(cleanPhone, msg);
        recordTelemetry(cleanPhone, text, doc.category, 'EXITO_DOCUMENTO_SCORED', doc.title);
      } else {
        // Entrega múltiple estructurada (2 o 3 documentos)
        let msg = '📖 *LITERATURA RECOMENDADA (' + docsToDeliver.length + ' Documentos Encontrados)*\\\\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n';

        for (let i = 0; i < docsToDeliver.length; i++) {
          const d = docsToDeliver[i];
          const link = generateAnonymousDownloadLink(d.driveId, cleanPhone);
          msg += '\\\\n🔹 *[' + (i + 1) + '] ' + d.title + '*\\\\n' +
            '✍️ ' + d.author + ' (' + d.year + ') | ' + d.category + '\\\\n' +
            (d.aoClass && d.aoClass !== 'N/A' ? '🎯 *AO:* ' + d.aoClass + '\\\\n' : '') +
            '🔗 *Descarga:* ' + link + '\\\\n';
        }

        const remaining = scoredResults.length - docsToDeliver.length;
        if (remaining > 0) {
          msg += '\\\\n━━━━━━━━━━━━━━━━━━━━━━━━━━\\\\n' +
            '💡 Hay **' + remaining + ' documentos adicionales** relacionados en el acervo.';
        }

        sendWhatsAppText(cleanPhone, msg);
        recordTelemetry(cleanPhone, text, docsToDeliver[0].category, 'EXITO_MULTIPLE_SCORED', docsToDeliver.map(function(d) { return d.title; }).join(' | '));
      }
    } else {`;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex + endMarker.length);
fs.writeFileSync(targetFile, content, 'utf8');
console.log('✅ Successfully applied Fase 1 update to GoogleAppsScript_SheetsManager.js');

// Sync to gas_dist
fs.copyFileSync(targetFile, path.join(__dirname, '../gas_dist/GoogleAppsScript_SheetsManager.js'));
console.log('✅ Synced to gas_dist/GoogleAppsScript_SheetsManager.js');
