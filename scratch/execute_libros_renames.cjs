const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_DIR = 'H:\\Mi unidad\\Información Ortopedia';
const LIB_DIR = path.join(BASE_DIR, 'Libros');
const MUSIC_DIR = 'C:\\Users\\ferna\\Music';
const REG_PATH = 'bibliotecario_engine/knowledge/global_registry.json';

const reg = JSON.parse(fs.readFileSync(REG_PATH, 'utf8'));
const planned = JSON.parse(fs.readFileSync('scratch/libros_planned_renames.json', 'utf8'));

function safeMoveToMusic(srcPath, filename) {
  if (!fs.existsSync(srcPath)) return;
  const destPath = path.join(MUSIC_DIR, filename);
  try {
    fs.copyFileSync(srcPath, destPath);
    fs.unlinkSync(srcPath);
    console.log(`[DUPLICADO EVACUADO A MUSIC] ${filename}`);
  } catch (err) {
    console.log(`[ERROR EVACUANDO] ${filename}: ${err.message}`);
  }
}

let renamedCount = 0;
let movedToMusicCount = 0;

for (const p of planned) {
  const srcPath = path.join(LIB_DIR, p.src);
  if (!fs.existsSync(srcPath)) continue;

  const targetPath = path.join(LIB_DIR, p.std);

  // If target already exists
  if (fs.existsSync(targetPath) && srcPath.toLowerCase() !== targetPath.toLowerCase()) {
    console.log(`[TARGET ALREADY EXISTS] Moving duplicate ${p.src} to Music`);
    safeMoveToMusic(srcPath, p.src);
    movedToMusicCount++;
    continue;
  }

  try {
    fs.renameSync(srcPath, targetPath);
    reg.hashes[p.hash] = {
      path: targetPath,
      name: p.std,
      size: p.size,
      folder: 'Libros'
    };
    console.log(`[RENAMED] ${p.src} -> ${p.std}`);
    renamedCount++;
  } catch (err) {
    console.error(`[ERROR RENAMING] ${p.src}: ${err.message}`);
  }
}

fs.writeFileSync(REG_PATH, JSON.stringify(reg, null, 2), 'utf8');

console.log(`\n==========================================`);
console.log(`LIBROS RENAMING COMPLETED:`);
console.log(` - Standardized / Renamed: ${renamedCount}`);
console.log(` - Evacuated to Music: ${movedToMusicCount}`);
console.log(` - Total Hashes in Registry: ${Object.keys(reg.hashes).length}`);
console.log(`==========================================`);
