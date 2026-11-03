const fs = require('fs');
const path = require('path');

const ROOT_DIR = 'H:\\Mi unidad\\Información Ortopedia';
const REPORT_PATH = path.join(__dirname, 'ortho_audit_report.json');

function runDeepAnalysis() {
  const data = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
  const failed = data.failedInventory;

  const inventory = {
    totalScanned: data.summary.totalAnalyzed,
    totalStandard: data.summary.totalStandard,
    totalNonStandard: failed.length,
    excludedCategories: {
      pptxPresentations: { count: 0, folders: {} },
      audioTracksAndCd: { count: 0, folders: {} },
      intraopPhotosAndRx: { count: 0, folders: {} },
      surgicalVideos: { count: 0, folders: {} },
      minorClinicalNotesDocx: { count: 0, folders: {} },
      webShortcutsAndSpreadsheets: { count: 0, folders: {} }
    },
    actionablePdfs: {
      total: 0,
      byFolder: {},
      byRootCause: {
        scannedNoOcr: { count: 0, items: [] },
        orphanNoDoi: { count: 0, items: [] },
        localSlidesOrThesisPdf: { count: 0, items: [] },
        clinicalPlanningAndProtocols: { count: 0, items: [] },
        otherUnresolved: { count: 0, items: [] }
      }
    }
  };

  for (const item of failed) {
    const folder = item.folder || 'Raíz';
    const filename = item.filename;
    const ext = (item.ext || path.extname(filename)).toLowerCase();
    const fullRel = path.join(folder, filename);

    // 1. Clasificación de Exclusiones
    if (ext === '.pptx' || ext === '.ppt' || folder.includes('zPresentaciones')) {
      inventory.excludedCategories.pptxPresentations.count++;
      inventory.excludedCategories.pptxPresentations.folders[folder] = (inventory.excludedCategories.pptxPresentations.folders[folder] || 0) + 1;
    } else if (fullRel.includes('AOUK MED-CD') || ext === '.mp3' || (ext === '.txt' && fullRel.includes('AO 2018'))) {
      inventory.excludedCategories.audioTracksAndCd.count++;
      inventory.excludedCategories.audioTracksAndCd.folders[folder] = (inventory.excludedCategories.audioTracksAndCd.folders[folder] || 0) + 1;
    } else if (['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'].includes(ext)) {
      inventory.excludedCategories.intraopPhotosAndRx.count++;
      inventory.excludedCategories.intraopPhotosAndRx.folders[folder] = (inventory.excludedCategories.intraopPhotosAndRx.folders[folder] || 0) + 1;
    } else if (['.mp4', '.wmv', '.avi', '.mov', '.mkv'].includes(ext)) {
      inventory.excludedCategories.surgicalVideos.count++;
      inventory.excludedCategories.surgicalVideos.folders[folder] = (inventory.excludedCategories.surgicalVideos.folders[folder] || 0) + 1;
    } else if (['.docx', '.doc', '.odt', '.rtf'].includes(ext)) {
      inventory.excludedCategories.minorClinicalNotesDocx.count++;
      inventory.excludedCategories.minorClinicalNotesDocx.folders[folder] = (inventory.excludedCategories.minorClinicalNotesDocx.folders[folder] || 0) + 1;
    } else if (['.url', '.xlsx', '.xls', '.csv', '.gsheet'].includes(ext)) {
      inventory.excludedCategories.webShortcutsAndSpreadsheets.count++;
      inventory.excludedCategories.webShortcutsAndSpreadsheets.folders[folder] = (inventory.excludedCategories.webShortcutsAndSpreadsheets.folders[folder] || 0) + 1;
    } else if (ext === '.pdf') {
      // 2. Clasificación de PDFs Académicos Pendientes
      inventory.actionablePdfs.total++;
      inventory.actionablePdfs.byFolder[folder] = (inventory.actionablePdfs.byFolder[folder] || 0) + 1;

      // Diagnóstico de Causa Raíz
      if (folder.includes('Tareas CdN') || /sesion|seminario|clase|reunion|ateneo/i.test(filename)) {
        inventory.actionablePdfs.byRootCause.localSlidesOrThesisPdf.count++;
        inventory.actionablePdfs.byRootCause.localSlidesOrThesisPdf.items.push({ folder, filename });
      } else if (folder.includes('zPlaneamientos') || /planeamiento|protocolo|guia|consenso/i.test(filename)) {
        inventory.actionablePdfs.byRootCause.clinicalPlanningAndProtocols.count++;
        inventory.actionablePdfs.byRootCause.clinicalPlanningAndProtocols.items.push({ folder, filename });
      } else if (item.sizeBytes && item.sizeBytes > 10000000 && !/\d{4}/.test(filename)) {
        // Archivo grande sin año probablemente escaneado
        inventory.actionablePdfs.byRootCause.scannedNoOcr.count++;
        inventory.actionablePdfs.byRootCause.scannedNoOcr.items.push({ folder, filename });
      } else if (/^[A-Za-z0-9_-]+$/.test(path.basename(filename, '.pdf')) || /^(s1|pii|doi|art)/i.test(filename)) {
        inventory.actionablePdfs.byRootCause.orphanNoDoi.count++;
        inventory.actionablePdfs.byRootCause.orphanNoDoi.items.push({ folder, filename });
      } else {
        inventory.actionablePdfs.byRootCause.otherUnresolved.count++;
        inventory.actionablePdfs.byRootCause.otherUnresolved.items.push({ folder, filename });
      }
    }
  }

  fs.writeFileSync(path.join(__dirname, 'detailed_inventory_breakdown.json'), JSON.stringify(inventory, null, 2));

  console.log('=== RESUMEN EJECUTIVO DE BARRIDO ===');
  console.log(`Total Analizados: ${inventory.totalScanned}`);
  console.log(`Total Estandarizados (Estándar): ${inventory.totalStandard} (${((inventory.totalStandard / inventory.totalScanned) * 100).toFixed(2)}%)`);
  console.log(`Total No Estandarizados: ${inventory.totalNonStandard}`);
  console.log('\n--- EXCLUSIONES OPERATIVAS DIRECTIVAS ---');
  console.log(`Presentaciones (.pptx/.ppt): ${inventory.excludedCategories.pptxPresentations.count}`);
  console.log(`Audio & Transcripciones CD: ${inventory.excludedCategories.audioTracksAndCd.count}`);
  console.log(`Fotografías e Imágenes Rx: ${inventory.excludedCategories.intraopPhotosAndRx.count}`);
  console.log(`Videos Quirúrgicos: ${inventory.excludedCategories.surgicalVideos.count}`);
  console.log(`Notas Quirúrgicas Menores (.docx): ${inventory.excludedCategories.minorClinicalNotesDocx.count}`);
  console.log(`Accesos Directos Web y Tablas: ${inventory.excludedCategories.webShortcutsAndSpreadsheets.count}`);
  const totalExc = inventory.excludedCategories.pptxPresentations.count +
                   inventory.excludedCategories.audioTracksAndCd.count +
                   inventory.excludedCategories.intraopPhotosAndRx.count +
                   inventory.excludedCategories.surgicalVideos.count +
                   inventory.excludedCategories.minorClinicalNotesDocx.count +
                   inventory.excludedCategories.webShortcutsAndSpreadsheets.count;
  console.log(`TOTAL EXCLUIDOS: ${totalExc}`);
  console.log('\n--- DOCUMENTOS ACADÉMICOS ACCIONABLES PENDIENTES ---');
  console.log(`Total PDFs pendientes: ${inventory.actionablePdfs.total}`);
  console.log('Por causa raíz:');
  console.log(` - Diapositivas / Tareas Residentes exportadas a PDF: ${inventory.actionablePdfs.byRootCause.localSlidesOrThesisPdf.count}`);
  console.log(` - Planeamientos y Protocolos Clínicos: ${inventory.actionablePdfs.byRootCause.clinicalPlanningAndProtocols.count}`);
  console.log(` - PDFs Escaneados Pesados sin OCR: ${inventory.actionablePdfs.byRootCause.scannedNoOcr.count}`);
  console.log(` - Artículos Huérfanos sin DOI o Código Editorial: ${inventory.actionablePdfs.byRootCause.orphanNoDoi.count}`);
  console.log(` - Artículos con Título pero sin Autor Extraído: ${inventory.actionablePdfs.byRootCause.otherUnresolved.count}`);
}

runDeepAnalysis();

