const fs = require('fs');
const path = require('path');

const plans = JSON.parse(fs.readFileSync('scratch/bulk_renames_planned.json', 'utf8'));
console.log(`=== INICIANDO EJECUCIÓN FÍSICA DE ${plans.length} RENOMBRAMIENTOS ===`);

let successCount = 0;
let skippedCount = 0;
let errorCount = 0;

for (const p of plans) {
  if (!fs.existsSync(p.fullOld)) {
    skippedCount++;
    continue;
  }

  // Si el destino ya existe y no es el mismo archivo
  if (fs.existsSync(p.fullNew) && p.fullOld.toLowerCase() !== p.fullNew.toLowerCase()) {
    console.log(`⚠️ Destino ya existe: "${p.newName}". Omitiendo.`);
    skippedCount++;
    continue;
  }

  try {
    fs.renameSync(p.fullOld, p.fullNew);
    successCount++;
  } catch (err) {
    console.error(`❌ Error renombrando "${p.oldName}": ${err.message}`);
    errorCount++;
  }
}

console.log(`\n==========================================`);
console.log(`EJECUCIÓN COMPLETADA:`);
console.log(`✅ Renombrados exitosamente: ${successCount}`);
console.log(`⚠️ Omitidos (ya existían o no encontrados): ${skippedCount}`);
console.log(`❌ Errores: ${errorCount}`);
console.log(`==========================================`);

