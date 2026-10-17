const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_DIR = 'H:\\Mi unidad\\Información Ortopedia';
const REG_PATH = 'bibliotecario_engine/knowledge/global_registry.json';
const reg = JSON.parse(fs.readFileSync(REG_PATH, 'utf8'));

const targetFolders = [
  'Catálogos de Materiales ortopédicos',
  'Materiales Osteosintesis',
  'Femur',
  'Codo',
  'Abordajes',
  'Ortopedia Deportiva y artroscopia'
];

let totalRenamed = 0;

targetFolders.forEach(folder => {
  const dirPath = path.join(BASE_DIR, folder);
  if (!fs.existsSync(dirPath)) return;

  const files = fs.readdirSync(dirPath);
  files.forEach(f => {
    if (f.startsWith('S-F - ')) {
      const srcPath = path.join(dirPath, f);
      let targetName = f.replace(/^S-F\s*-\s*/, '2018 - ');
      targetName = targetName.replace(/[/\\:*?"<>|]/g, '').replace(/\s+/g, ' ');
      const targetPath = path.join(dirPath, targetName);

      if (!fs.existsSync(targetPath)) {
        try {
          fs.renameSync(srcPath, targetPath);
          console.log(`[${folder}] Renamed: ${f} -> ${targetName}`);
          totalRenamed++;
        } catch(e) {
          console.log(`[ERROR] ${f}: ${e.message}`);
        }
      }
    }
  });
});

fs.writeFileSync(REG_PATH, JSON.stringify(reg, null, 2), 'utf8');
console.log(`Finished converting S-F catalog files. Total renamed: ${totalRenamed}`);
