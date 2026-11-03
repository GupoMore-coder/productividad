const fs = require('fs');
const path = require('path');

const PLAN_FILE = path.join(__dirname, 'resolved_orphans_plan.json');

function executeRenames() {
  const plan = JSON.parse(fs.readFileSync(PLAN_FILE, 'utf8'));
  console.log(`Ejecutando renombramiento de ${plan.length} artículos resueltos con CrossRef DOI...`);

  let success = 0;
  let skipped = 0;
  let errors = 0;

  for (const item of plan) {
    if (!fs.existsSync(item.oldPath)) {
      console.log(`[SKIP - No existe origen]: ${item.oldFilename}`);
      skipped++;
      continue;
    }

    let finalNewPath = item.newPath;
    let finalNewFilename = item.newFilename;

    if (fs.existsSync(finalNewPath) && item.oldPath !== finalNewPath) {
      // Si ya existe un archivo con ese nombre, agregamos un diferenciador numérico
      const ext = path.extname(finalNewFilename);
      const base = path.basename(finalNewFilename, ext);
      let counter = 2;
      while (fs.existsSync(path.join(item.folder ? path.dirname(finalNewPath) : '', `${base} (v${counter})${ext}`))) {
        counter++;
      }
      finalNewFilename = `${base} (v${counter})${ext}`;
      finalNewPath = path.join(path.dirname(finalNewPath), finalNewFilename);
    }

    try {
      fs.renameSync(item.oldPath, finalNewPath);
      console.log(`✅ [RENOMBRADO]: "${item.oldFilename}" -> "${finalNewFilename}"`);
      success++;
    } catch (err) {
      console.error(`❌ [ERROR]: "${item.oldFilename}": ${err.message}`);
      errors++;
    }
  }

  console.log(`\n========================================`);
  console.log(`TOTAL PROCESADOS: ${plan.length}`);
  console.log(`✅ Exitosos: ${success}`);
  console.log(`⏭️ Omitidos: ${skipped}`);
  console.log(`❌ Errores: ${errors}`);
  console.log(`========================================`);
}

executeRenames();

