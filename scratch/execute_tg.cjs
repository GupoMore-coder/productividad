const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_DIR = 'H:\\Mi unidad\\Información Ortopedia';
const TG_DIR = path.join(BASE_DIR, 'Temas generales');
const MUSIC_DIR = 'C:\\Users\\ferna\\Music';
const REG_PATH = 'bibliotecario_engine/knowledge/global_registry.json';

const reg = JSON.parse(fs.readFileSync(REG_PATH, 'utf8'));
const mappings = JSON.parse(fs.readFileSync('scratch/tg_planned_renames.json', 'utf8'));

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

function safeCopy(src, targetFolder, targetName) {
  const destDir = path.join(BASE_DIR, targetFolder);
  if (!fs.existsSync(destDir)) return;
  const destPath = path.join(destDir, targetName);
  if (!fs.existsSync(destPath)) {
    try {
      fs.copyFileSync(src, destPath);
      console.log(`[MULTI-TOPIC COPIA CREADA] -> ${targetFolder}/${targetName}`);
    } catch (e) {
      console.log(`[ERROR COPIANDO MULTI-TOPIC] ${targetName}: ${e.message}`);
    }
  }
}

let renamedCount = 0;
let movedToMusicCount = 0;

for (const m of mappings) {
  const srcPath = path.join(TG_DIR, m.src);
  if (!fs.existsSync(srcPath)) continue;

  const targetPath = path.join(TG_DIR, m.std);

  // If target already exists and is different file
  if (fs.existsSync(targetPath) && srcPath.toLowerCase() !== targetPath.toLowerCase()) {
    console.log(`[TARGET ALREADY EXISTS] Moving duplicate ${m.src} to Music`);
    safeMoveToMusic(srcPath, m.src);
    movedToMusicCount++;
    continue;
  }

  try {
    fs.renameSync(srcPath, targetPath);
    reg.hashes[m.hash] = {
      path: targetPath,
      name: m.std,
      size: m.size,
      folder: 'Temas generales'
    };
    console.log(`[RENAMED] ${m.src} -> ${m.std}`);
    renamedCount++;

    // Multi-topic bifurcations
    if (m.std.includes('Otsuka') || m.std.toLowerCase().includes('pediatr')) {
      safeCopy(targetPath, 'Ortopedia Pediatrica', m.std);
    }
    if (m.std.includes('tálus') || m.std.includes('Tobillo')) {
      safeCopy(targetPath, 'Pie y Tobillo', m.std);
    }
    if (m.std.includes('Antibioticos Profiliticos')) {
      safeCopy(targetPath, 'Infeccioso', m.std);
    }
  } catch (err) {
    console.error(`[ERROR RENAMING] ${m.src}: ${err.message}`);
  }
}

fs.writeFileSync(REG_PATH, JSON.stringify(reg, null, 2), 'utf8');

console.log(`\n==========================================`);
console.log(`TEMAS GENERALES PROCESSING COMPLETED:`);
console.log(` - Standardized / Renamed: ${renamedCount}`);
console.log(` - Evacuated to Music: ${movedToMusicCount}`);
console.log(` - Total Hashes in Registry: ${Object.keys(reg.hashes).length}`);
console.log(`==========================================`);
