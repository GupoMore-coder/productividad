const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'bibliotecario_engine', 'GoogleAppsScript_SheetsManager.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Make searchCatalogScored accept both 2D array and array of objects
const oldSearchStart = `  for (let i = 1; i < dataRows.length; i++) {
    const row = dataRows[i];
    const id = row[0];
    const driveId = row[1];
    const year = parseInt(row[2], 10) || 2020;
    const author = String(row[3] || '');
    const title = String(row[4] || '');
    const category = String(row[5] || '');
    const docType = String(row[6] || '');
    const aoClass = String(row[7] || '');
    const mesh = String(row[8] || '');`;

const newSearchStart = `  const startRow = Array.isArray(dataRows[0]) ? 1 : 0;
  for (let i = startRow; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row) continue;
    const isArr = Array.isArray(row);
    const id = isArr ? row[0] : row.id;
    const driveId = isArr ? row[1] : row.driveId;
    const year = parseInt(isArr ? row[2] : row.year, 10) || 2020;
    const author = String((isArr ? row[3] : row.author) || '');
    const title = String((isArr ? row[4] : row.title) || '');
    const category = String((isArr ? row[5] : row.category) || '');
    const docType = String((isArr ? row[6] : row.docType) || '');
    const aoClass = String((isArr ? row[7] : row.aoClass) || '');
    const mesh = String((isArr ? row[8] : row.mesh) || '');`;

if (code.includes(oldSearchStart)) {
  code = code.replace(oldSearchStart, newSearchStart);
  console.log('✅ Updated searchCatalogScored to support both Array and Object rows');
} else {
  console.log('⚠️ Could not find oldSearchStart');
}

// 2. Make DOC_ and DOSSIER handlers in handleIncomingMessage support both row formats
const oldDocHandler = `    // Acciones de Descarga Directa por Botón Interactivo (DOC_...)
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
      const link = generateAnonymousDownloadLink(targetDriveId, cleanPhone);`;

const newDocHandler = `    // Acciones de Descarga Directa por Botón Interactivo (DOC_...)
    if (text.startsWith('DOC_')) {
      const targetDriveId = text.substring(4).trim();
      const inventoryData = getCachedInventory();
      let matchedDoc = null;
      const startIdx = (inventoryData.length > 0 && Array.isArray(inventoryData[0])) ? 1 : 0;
      for (let i = startIdx; i < inventoryData.length; i++) {
        const row = inventoryData[i];
        const isArr = Array.isArray(row);
        const rDriveId = isArr ? row[1] : row.driveId;
        if (rDriveId === targetDriveId) {
          matchedDoc = isArr ? {
            id: row[0], driveId: row[1], year: row[2], author: row[3],
            title: row[4], category: row[5], docType: row[6], aoClass: row[7]
          } : row;
          break;
        }
      }
      const link = generateAnonymousDownloadLink(targetDriveId, cleanPhone);`;

if (code.includes(oldDocHandler)) {
  code = code.replace(oldDocHandler, newDocHandler);
  console.log('✅ Updated DOC_ handler to support both Array and Object rows');
} else {
  console.log('⚠️ Could not find oldDocHandler');
}

// 3. Make DOSSIER handler support both row formats
const oldDossierHandler = `    // Solicitud explícita de Compendio o Dossier Bibliográfico (sin límite de documentos)
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
      }`;

const newDossierHandler = `    // Solicitud explícita de Compendio o Dossier Bibliográfico (sin límite de documentos)
    if (lower.startsWith('dossier') || lower.startsWith('catalogo completo') || lower.startsWith('catálogo completo') || lower === 'catalogo' || lower === 'catálogo') {
      const inventoryData = getCachedInventory();
      const allInventoryDocs = [];
      const startIdx = (inventoryData.length > 0 && Array.isArray(inventoryData[0])) ? 1 : 0;
      for (let i = startIdx; i < inventoryData.length; i++) {
        const row = inventoryData[i];
        if (!row) continue;
        const isArr = Array.isArray(row);
        allInventoryDocs.push(isArr ? {
          id: row[0], driveId: row[1], year: row[2], author: row[3],
          title: row[4], category: row[5], docType: row[6], aoClass: row[7], mesh: row[8]
        } : row);
      }

      let docsForDossier = [];
      let dossierTitle = 'Catálogo General';

      if (lower.includes('ateneo')) {
        dossierTitle = 'Colección de 285 Ateneos';
        docsForDossier = allInventoryDocs.filter(function(d) {
          return (d.docType === 'Ateneos y Conferencias') || /ateneo/i.test(d.title);
        });
      } else if (lower.includes('cadera')) {
        dossierTitle = 'Cadera y Pelvis';
        docsForDossier = allInventoryDocs.filter(function(d) {
          return d.category === 'Cadera y Pelvis' || /cadera|pelvis|femur/i.test(d.title);
        });
      } else if (lower.includes('columna')) {
        dossierTitle = 'Columna Vertebral';
        docsForDossier = allInventoryDocs.filter(function(d) {
          return d.category === 'Columna Vertebral' || /columna|cervical|lumbar|raquis/i.test(d.title);
        });
      } else if (lower.includes('rodilla')) {
        dossierTitle = 'Rodilla y Meniscos';
        docsForDossier = allInventoryDocs.filter(function(d) {
          return d.category === 'Rodilla y Meniscos' || /rodilla|menisco|lca/i.test(d.title);
        });
      } else if (lower.includes('hombro')) {
        dossierTitle = 'Hombro y Codo';
        docsForDossier = allInventoryDocs.filter(function(d) {
          return d.category === 'Hombro y Codo' || /hombro|codo|manguito/i.test(d.title);
        });
      } else {
        dossierTitle = 'Acervo Institucional Completo';
        docsForDossier = allInventoryDocs;
      }`;

if (code.includes(oldDossierHandler)) {
  code = code.replace(oldDossierHandler, newDossierHandler);
  console.log('✅ Updated DOSSIER handler to support both Array and Object rows');
} else {
  console.log('⚠️ Could not find oldDossierHandler');
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('File successfully updated.');

