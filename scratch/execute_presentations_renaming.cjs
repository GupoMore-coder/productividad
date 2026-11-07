const fs = require('fs');
const path = require('path');

const PLAN_FILE = path.join(__dirname, 'presentations_model3_master_plan.json');

function executePresentationsRenaming() {
  const plan = JSON.parse(fs.readFileSync(PLAN_FILE, 'utf8'));
  console.log(`Iniciando renombramiento de ${plan.length} presentaciones bajo MODELO 3 (Ateneo - YYYY - Título - Institución)...`);

  let success = 0;
  let skipped = 0;
  let errors = 0;

  for (const item of plan) {
    if (!fs.existsSync(item.oldPath)) {
      console.log(`[SKIP - No existe archivo origen]: ${item.oldFilename}`);
      skipped++;
      continue;
    }

    let finalNewPath = item.newPath;
    let finalNewFilename = item.newFilename;

    // Si el nombre no cambia en absoluto
    if (item.oldPath === finalNewPath) {
      skipped++;
      continue;
    }

    // Si ya existe el destino y es diferente del origen
    if (fs.existsSync(finalNewPath)) {
      const ext = path.extname(finalNewFilename);
      const base = path.basename(finalNewFilename, ext);
      let counter = 2;
      while (fs.existsSync(path.join(path.dirname(finalNewPath), `${base} (v${counter})${ext}`))) {
        counter++;
      }
      finalNewFilename = `${base} (v${counter})${ext}`;
      finalNewPath = path.join(path.dirname(finalNewPath), finalNewFilename);
    }

    try {
      fs.renameSync(item.oldPath, finalNewPath);
      console.log(`✅ [OK]: [${item.folder}] "${item.oldFilename}" -> "${finalNewFilename}"`);
      success++;
    } catch (err) {
      console.error(`❌ [ERROR]: [${item.folder}] "${item.oldFilename}": ${err.message}`);
      errors++;
    }
  }

  console.log(`\n========================================`);
  console.log(`TOTAL PRESENTACIONES PROCESADAS: ${plan.length}`);
  console.log(`✅ Exitosos: ${success}`);
  console.log(`⏭️ Omitidos: ${skipped}`);
  console.log(`❌ Errores: ${errors}`);
  console.log(`========================================`);
}

executePresentationsRenaming();

