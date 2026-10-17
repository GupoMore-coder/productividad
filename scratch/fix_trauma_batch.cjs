const fs = require('fs');
const path = require('path');
const BASE = 'H:\\Mi unidad\\Información Ortopedia';
const REG = 'C:\\Users\\ferna\\Documents\\Antigravity Project\\bibliotecario_engine\\knowledge\\global_registry.json';
let reg = JSON.parse(fs.readFileSync(REG, 'utf8'));

const fixes = [
  {
    fromFolder: 'Rodilla y Tibia',
    fromName: '2026 - S-A - Early Appropriate Care Definitive Stabilization of Femoral Fractures Within 24 Hours of Injury Is Safe in Most Patien.pdf',
    toFolder: 'Femur',
    toName: '2013 - Vallier, Heather A. - Early Appropriate Care Definitive Stabilization of Femoral Fractures Within 24 Hours of Injury.pdf',
    multi: ['Temas generales']
  },
  {
    fromFolder: 'Columna',
    fromName: '2026 - S-A - Injury scoring Then now and into the 21st century.pdf',
    toFolder: 'Temas generales',
    toName: '2001 - Baker, Susan P. - Injury Scoring Then Now and Into the 21st Century.pdf',
    multi: []
  },
  {
    fromFolder: 'Pie y Tobillo',
    fromName: '2026 - S-A - Pathophysiology of polytrauma.pdf',
    toFolder: 'Temas generales',
    toName: '2005 - Keel, Marius - Pathophysiology of Polytrauma.pdf',
    multi: []
  },
  {
    fromFolder: 'Mano',
    fromName: '2017 - Burlew, Clay Cothren - Preperitoneal pelvic packing for exsanguinating pelvic fractures.pdf',
    toFolder: 'Cadera y Pelvis',
    toName: '2017 - Burlew, Clay Cothren - Preperitoneal Pelvic Packing for Exsanguinating Pelvic Fractures.pdf',
    multi: ['Temas generales', 'Abordajes']
  },
  {
    fromFolder: 'Rodilla y Tibia',
    fromName: '2017 - Zalavras, Charalampos G. - Prevention of Infection in Open Fractures.pdf',
    toFolder: 'Infeccioso',
    toName: '2017 - Zalavras, Charalampos G. - Prevention of Infection in Open Fractures.pdf',
    multi: ['Temas generales']
  },
  {
    fromFolder: 'Pie y Tobillo',
    fromName: '2015 - Schirò, Giuseppe Rosario - Primary amputation vs limb salvage in mangled extremity a systematic review of the current scori.pdf',
    toFolder: 'Reconstructiva',
    toName: '2015 - Schirò, Giuseppe Rosario - Primary Amputation vs Limb Salvage in Mangled Extremity A Systematic Review.pdf',
    multi: ['Temas generales']
  },
  {
    fromFolder: 'Mano',
    fromName: '2015 - Pape, H.C. - Safe definitive orthopaedic surgery (SDS) Repeated assessment for tapered application of Early Definitive Care.pdf',
    toFolder: 'Temas generales',
    toName: '2015 - Pape, H. C. - Safe Definitive Orthopaedic Surgery Repeated Assessment for Application of Early Definitive Care.pdf',
    multi: []
  },
  {
    fromFolder: 'Mano',
    fromName: '2014 - Pape, Hans-Christoph - The definition of polytrauma revisited.pdf',
    toFolder: 'Temas generales',
    toName: '2014 - Pape, Hans-Christoph - The Definition of Polytrauma Revisited The New Berlin Definition.pdf',
    multi: []
  }
];

// Clean secondary wrong copies created in Abordajes if any
const wrongAbordajes = [
  '2017 - Burlew, Clay Cothren - Preperitoneal pelvic packing for exsanguinating pelvic fractures.pdf',
  '2015 - Pape, H.C. - Safe definitive orthopaedic surgery (SDS) Repeated assessment for tapered application of Early Definitive Care.pdf',
  '2014 - Pape, Hans-Christoph - The definition of polytrauma revisited.pdf'
];
for (const wa of wrongAbordajes) {
  const p = path.join(BASE, 'Abordajes', wa);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

for (const fix of fixes) {
  const src = path.join(BASE, fix.fromFolder, fix.fromName);
  const destDir = path.join(BASE, fix.toFolder);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, fix.toName);

  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    fs.unlinkSync(src);
    console.log('Relocated: ' + fix.fromName + ' -> ' + fix.toFolder + '/' + fix.toName);
  } else {
    console.log('Src not found: ' + src);
  }

  for (const m of fix.multi) {
    const mDir = path.join(BASE, m);
    if (!fs.existsSync(mDir)) fs.mkdirSync(mDir, { recursive: true });
    const mPath = path.join(mDir, fix.toName);
    if (fs.existsSync(dest) && !fs.existsSync(mPath)) {
      fs.copyFileSync(dest, mPath);
      console.log('  Multi-copy created in ' + m + '/' + fix.toName);
    }
  }

  // Update registry
  for (const [hash, entry] of Object.entries(reg.hashes)) {
    if (entry.canonicalName === fix.fromName) {
      entry.folder = fix.toFolder;
      entry.canonicalName = fix.toName;
      entry.path = fix.toFolder + '/' + fix.toName;
    }
  }
}

fs.writeFileSync(REG, JSON.stringify(reg, null, 2), 'utf8');
console.log('All trauma batch files rectified and indexed accurately.');
