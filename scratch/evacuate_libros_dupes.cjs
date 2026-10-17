const fs = require('fs');
const path = require('path');

const LIB_DIR = 'H:\\Mi unidad\\Información Ortopedia\\Libros';
const MUSIC_DIR = 'C:\\Users\\ferna\\Music';
const res = JSON.parse(fs.readFileSync('scratch/libros_audit_results.json', 'utf8'));

const dupesToMove = [...res.externalDupes, ...res.internalDupes];

console.log(`Starting safe evacuation of ${dupesToMove.length} confirmed duplicates from Libros to ${MUSIC_DIR}...`);

let successCount = 0;
let errorCount = 0;
let bytesReclaimed = 0;

for (const d of dupesToMove) {
  const f = d.file;
  const srcPath = path.join(LIB_DIR, f);
  if (!fs.existsSync(srcPath)) continue;

  let destPath = path.join(MUSIC_DIR, f);
  // Ensure unique name in Music if duplicate filenames exist
  let counter = 1;
  const ext = path.extname(f);
  const baseName = path.basename(f, ext);
  while (fs.existsSync(destPath)) {
    destPath = path.join(MUSIC_DIR, `${baseName}__dup${counter}${ext}`);
    counter++;
  }

  try {
    const size = fs.statSync(srcPath).size;
    fs.copyFileSync(srcPath, destPath);
    fs.unlinkSync(srcPath);
    bytesReclaimed += size;
    successCount++;
    if (successCount % 50 === 0) {
      console.log(`Evacuated ${successCount}/${dupesToMove.length}... (${(bytesReclaimed / (1024*1024*1024)).toFixed(2)} GB freed)`);
    }
  } catch (err) {
    console.error(`[ERROR EVACUATING] ${f}: ${err.message}`);
    errorCount++;
  }
}

console.log(`\n==========================================`);
console.log(`EVACUATION COMPLETED:`);
console.log(` - Successfully Evacuated to Music: ${successCount}`);
console.log(` - Net Storage Reclaimed: ${(bytesReclaimed / (1024*1024*1024)).toFixed(2)} GB`);
console.log(` - Errors: ${errorCount}`);
console.log(`==========================================`);
