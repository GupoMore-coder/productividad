const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_DIR = 'H:\\Mi unidad\\Información Ortopedia';
const EMC_DIR = path.join(BASE_DIR, 'EMC Ortopedia');
const PIE_DIR = path.join(BASE_DIR, 'Pie y Tobillo');
const MUSIC_DIR = 'C:\\Users\\ferna\\Music';
const REG_PATH = 'bibliotecario_engine/knowledge/global_registry.json';

const reg = JSON.parse(fs.readFileSync(REG_PATH, 'utf8'));
const res = JSON.parse(fs.readFileSync('scratch/emc_audit_results.json', 'utf8'));

function decodeHtml(str) {
  return str
    .replace(/&oacute;/g, 'ó')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&Ntilde;/g, 'Ñ');
}

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

let movedToMusicCount = 0;
let renamedCount = 0;

for (const item of res) {
  const f = item.file;
  const srcPath = path.join(EMC_DIR, f);
  if (!fs.existsSync(srcPath)) continue;

  const buf = fs.readFileSync(srcPath);
  const hash = crypto.createHash('sha256').update(buf).digest('hex');

  if (reg.hashes[hash]) {
    console.log(`[DUPLICATE DETECTED] ${f} already exists in registry as: ${reg.hashes[hash].name}`);
    safeMoveToMusic(srcPath, f);
    movedToMusicCount++;
    continue;
  }

  // Handle special cases
  if (f === 'Monografía FRACTURAS DE TOBILLO.pdf') {
    const dest = path.join(PIE_DIR, '2015 - SECOT - Monografía Fracturas de Tobillo.pdf');
    fs.copyFileSync(srcPath, dest);
    fs.unlinkSync(srcPath);
    reg.hashes[hash] = { path: dest, name: '2015 - SECOT - Monografía Fracturas de Tobillo.pdf', size: buf.length };
    console.log(`[SPECIAL -> PIE Y TOBILLO] Monografía FRACTURAS DE TOBILLO.pdf`);
    renamedCount++;
    continue;
  }

  if (f === 'An evaluation of the Herscovici classification for fractures of the medial malleolus.pdf') {
    const dest = path.join(PIE_DIR, '2017 - Herscovici, D. - An Evaluation of the Herscovici Classification for Fractures of the Medial Malleolus.pdf');
    fs.copyFileSync(srcPath, dest);
    fs.unlinkSync(srcPath);
    reg.hashes[hash] = { path: dest, name: '2017 - Herscovici, D. - An Evaluation of the Herscovici Classification for Fractures of the Medial Malleolus.pdf', size: buf.length };
    console.log(`[SPECIAL -> PIE Y TOBILLO] Herscovici classification`);
    renamedCount++;
    continue;
  }

  if (f.startsWith('Anatomía aplicada a la cirugía de los tendones flexores')) {
    const dest = path.join(EMC_DIR, '2018 - EMC - Anatomía aplicada a la cirugía de los tendones flexores.pdf');
    fs.renameSync(srcPath, dest);
    reg.hashes[hash] = { path: dest, name: '2018 - EMC - Anatomía aplicada a la cirugía de los tendones flexores.pdf', size: buf.length };
    console.log(`[RENAMED EMC] Anatomía aplicada a la cirugía de los tendones flexores`);
    renamedCount++;
    continue;
  }

  let year = item.year || '2015';
  let author = 'EMC';
  let title = f.replace(/\.pdf$/i, '');

  const m = f.match(/^(?:S-F\s*-\s*)?(?:null\s*-\s*)?(?:S-A\s*-\s*)?([^-]+)\s*-\s*(.+)\.pdf$/i);
  if (m) {
    author = m[1].trim();
    title = m[2].trim();
  } else {
    title = f.replace(/\.pdf$/i, '').replace(/^(?:S-F\s*-\s*)/i, '').trim();
  }

  if (author.toLowerCase() === 's-a' || author.toLowerCase() === 'null') author = 'EMC';
  title = decodeHtml(title);
  author = decodeHtml(author);

  let stdName = `${year} - ${author} - ${title}.pdf`;
  stdName = stdName.replace(/[/\\:*?"<>|]/g, '').replace(/\s+/g, ' ');

  const targetPath = path.join(EMC_DIR, stdName);
  try {
    fs.renameSync(srcPath, targetPath);
    reg.hashes[hash] = {
      path: targetPath,
      name: stdName,
      size: buf.length
    };
    console.log(`[RENAMED] ${f} -> ${stdName}`);
    renamedCount++;
  } catch (err) {
    console.error(`[ERROR RENAMING] ${f} -> ${stdName}: ${err.message}`);
  }
}

fs.writeFileSync(REG_PATH, JSON.stringify(reg, null, 2), 'utf8');

console.log(`\n==========================================`);
console.log(`EMC ORTOPEDIA PROCESSING COMPLETED:`);
console.log(` - Renamed / Standardized: ${renamedCount}`);
console.log(` - Duplicates Moved to Music: ${movedToMusicCount}`);
console.log(` - Total Hashes in Registry: ${Object.keys(reg.hashes).length}`);
console.log(`==========================================`);
