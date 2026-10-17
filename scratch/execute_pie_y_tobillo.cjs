const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_DIR = 'H:\\Mi unidad\\Información Ortopedia';
const PIE_DIR = path.join(BASE_DIR, 'Pie y Tobillo');
const MUSIC_DIR = 'C:\\Users\\ferna\\Music';
const REG_PATH = 'C:\\Users\\ferna\\Documents\\Antigravity Project\\bibliotecario_engine\\knowledge\\global_registry.json';

let reg = { hashes: {} };
if (fs.existsSync(REG_PATH)) {
  try { reg = JSON.parse(fs.readFileSync(REG_PATH, 'utf8')); } catch (e) {}
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

function safeCopy(src, targetFolder, targetName) {
  const destDir = path.join(BASE_DIR, targetFolder);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const destPath = path.join(destDir, targetName);
  if (fs.existsSync(src) && !fs.existsSync(destPath)) {
    try {
      fs.copyFileSync(src, destPath);
      console.log(`  [MULTI-TÓPICO] Copiado a "${targetFolder}/${targetName}"`);
    } catch (e) {
      console.log(`  [ERROR COPIA MULTI] ${e.message}`);
    }
  }
}

function computeHash(p) {
  const buf = fs.readFileSync(p);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

// 1. Evacuar duplicados internos confirmados y archivos corruptos a Music
const toEvacuate = [
  'Surgical Exposures Foot Ankle 2023.pdf', // 0 bytes corrupt
  '2021 - Joannas - Quadrimalleolar Fractures of the Ankle Think 360—A Step-by-step Guide on Evaluation and Fixation.pdf', // dupe of Rammelt
  'S-F - Smeeing D.P.J. - Weight-Bearing and Mobilization in the Postoperative Care of Ankle Fractures.pdf', // dupe of 2015 Smeeing
  'S-F - S-A - Syndesmosis TightRope XP Implant System.pdf', // dupe of Arthrex Tightrope
  'Ilizarov_Technique_for_Complex_Foot_and_Ankle_Deformities_Alexander.pdf', // dupe of Kirienko
  'S-F - Thermann, Christoph Becher Michael R. Carmont Jón Karlsson Nicola Maffulli Calder C. Niek van Dijk - Atlas de procedimientos quirúrgicos.pdf', // dupe of other Thermann
  'S-F - Lau - Understanding Radiographic Measurements Used in Foot and Ankle Surgery.pdf', // dupe of Lau Brian C
  'S-F - S-A - Cirugía de uñas.pdf', // dupe of Refkalefsky-Loureiro in Mano
  'External Fixators of the Foot and Ankle. 2013 Paul S. Cooper.pdf' // dupe of 82MB Cooper book
];

console.log('--- FASE 1: EVACUACIÓN DE DUPLICADOS INTERNOS ---');
for (const f of toEvacuate) {
  safeMoveToMusic(path.join(PIE_DIR, f), f);
}

// 2. Renombramientos y multi-tópicos
const actions = [
  {
    oldName: 'S-F - S-A - Pie y Tobillo.pdf',
    newName: '2004 - Rodríguez-Merchán, E. Carlos - Monografías AAOS-SECOT Pie y Tobillo.pdf',
    multi: ['Libros']
  },
  {
    oldName: 'S-F - S-A - Estudio de rodilla.pdf',
    newName: '2014 - AAOS - Comprehensive Orthopaedic Review Fracturas por Rotación del Tobillo.pdf',
    multi: []
  },
  {
    oldName: 'S-F - Yan Chen - Estudio de rodilla.pdf',
    newName: '2020 - Chen, Yan - Proximal Tibial Cortex Transverse Distraction in Diabetic Foot Ulcers.pdf',
    multi: ['Reconstructiva']
  },
  {
    oldName: 'Abordaje 360 grados para Pilón Tibial (720p with 25fps).mp4',
    newName: '2021 - S-A - Abordaje 360 Grados para Pilón Tibial.mp4',
    multi: ['Abordajes', 'Videos Academicos']
  },
  {
    oldName: 'S-F - S-A - Clasificacion de las fracturas de tobillo.pdf',
    newName: '2011 - Navarro Navarro, R. - Clasificación de las Fracturas de Tobillo.pdf',
    multi: []
  },
  {
    oldName: 'S-F - S-A - Compresiones nerviosas del pie y del tobillo.pdf',
    newName: '2008 - Fabre, T. - Compresiones Nerviosas del Tobillo y del Pie.pdf',
    multi: ['EMC Ortopedia']
  },
  {
    oldName: 'S-F - Codina Santolaria - Fracturas y fractura-luxación del calcáneo.pdf',
    newName: '2012 - Codina Santolaria, Jordi - Fracturas y Fractura-Luxación del Calcáneo.pdf',
    multi: []
  },
  {
    oldName: 'S-F - S-A - FX DE TOBILLO CLASIFICACIóN DE LAUGE HANSEN A.pdf',
    newName: '2015 - Alcalá-Galiano, Andrea - Fracturas de Tobillo Clasificación de Lauge-Hansen.pdf',
    multi: []
  },
  {
    oldName: 'S-F - null - Estudio de rodilla.pdf',
    newName: '2012 - Peláez, Libardo - Luxofracturas del Tobillo.pdf',
    multi: []
  },
  {
    oldName: 'S-F - Alejandro Zúñiga Gutiérrez - Tratamiento Quirórgico VS No quirúrgico en Fracturas del Calcáneo.pdf',
    newName: '2018 - Zúñiga Gutiérrez, Alejandro - Tratamiento Quirúrgico vs No Quirúrgico en Fracturas del Calcáneo.pdf',
    multi: []
  },
  {
    oldName: 'S-F - Lau, B. C. - Understanding Radiographic Measurements Used in Foot and Ankle Surgery.pdf',
    newName: '2022 - Lau, Brian C. - Understanding Radiographic Measurements Used in Foot and Ankle Surgery.pdf',
    multi: []
  },
  {
    oldName: 'S-F - S-A - Achilles Tendon.pdf',
    newName: '2017 - Thermann, Hajo - The Achilles Tendon An Atlas of Surgical Procedures.pdf',
    multi: ['Libros']
  },
  {
    oldName: 'S-F - Thermann Christoph Becher Michael R. Carmont Jón Karlsson Nicola Maffulli James Calder C. Niek van Dijk - Atlas de procedimientos quirúrgicos.pdf',
    newName: '2017 - Thermann, Hajo - Atlas de Procedimientos Quirúrgicos en Tendón de Aquiles.pdf',
    multi: ['Libros']
  },
  {
    oldName: 'S-F - S-A - Fracturas del Calcáneo.pdf',
    newName: '2013 - Kumar, M. - Fractures of the Calcaneus.pdf',
    multi: ['Libros']
  },
  {
    oldName: 'S-F - Čretnik - Achilles Tendon.pdf',
    newName: '2012 - Čretnik, Andrej - Achilles Tendon.pdf',
    multi: ['Libros']
  },
  {
    oldName: 'S-F - Reyes - FRACTURA DE JONES.pdf',
    newName: '2012 - Cintado Reyes, Raquel - Fractura de Jones Tratamiento Conservador o Quirúrgico.pdf',
    multi: []
  },
  {
    oldName: 'S-F - S-A - Forefoot Reconstruction.pdf',
    newName: '2012 - Barouk, Louis Samuel - Forefoot Reconstruction 2nd Ed.pdf',
    multi: ['Libros']
  },
  {
    oldName: 'Fracturas de maléolo posterior indicaciones de fijación y vías de abordaje.pdf',
    newName: '2023 - Fernández-Rojas, E. - Fracturas de Maléolo Posterior Indicaciones de Fijación y Vías de Abordaje.pdf',
    multi: ['Abordajes']
  },
  {
    oldName: 'S-F - Smith - Estudio de rodilla.pdf',
    newName: '2016 - Schottel, Patrick C. - Predictive Radiographic Markers for Concomitant Ankle Injuries in Tibial Shaft Fractures.pdf',
    multi: ['Rodilla y Tibia']
  },
  {
    oldName: 'S-F - S-A - Tecnicas quirurgicas minimamente invasivas en el pie.pdf',
    newName: '2009 - Roukis, Thomas S. - Minimally Invasive Foot Surgery Surgical Techniques.pdf',
    multi: ['Libros']
  },
  {
    oldName: 'S-F - Ryu, R. K. N. - AANA Advanced Arthroscopic Surgical Techniques Series.pdf',
    newName: '2016 - Stone, James W. - AANA Advanced Arthroscopic Surgical Techniques Foot and Ankle.pdf',
    multi: ['Libros', 'Ortopedia Deportiva y artroscopia']
  },
  {
    oldName: 'S-F - S-A - External Fixators of the Foot and Ankle.pdf',
    newName: '2013 - Cooper, Paul S. - External Fixators of the Foot and Ankle.pdf',
    multi: ['Libros', 'Reconstructiva']
  },
  {
    oldName: 'S-F - Hajo Thermann - New Techniques in Foot and Ankle Surgery.pdf',
    newName: '2004 - Thermann, Hajo - New Techniques in Foot and Ankle Surgery.pdf',
    multi: ['Libros']
  },
  {
    oldName: 'S-F - Kirienko - Ilizarov Technique for Complex Foot and Ankle Deformities.pdf',
    newName: '2004 - Kirienko, Alexander - Ilizarov Technique for Complex Foot and Ankle Deformities.pdf',
    multi: ['Libros', 'Reconstructiva']
  },
  {
    oldName: 'S-F - S-A - Anatomia radiologica del pie.pdf',
    newName: '2007 - Baron-Sarrabère, M. P. - Exploración Radiográfica Normal del Pie.pdf',
    multi: ['EMC Ortopedia']
  },
  {
    oldName: 'S-F - Zaragoza-Velasco - Anatomía y lesiones mñs frecuentes en ligamentos y tendones del tobillo por medio de resonancia magnética.pdf',
    newName: '2013 - Zaragoza-Velasco, Karla - Ligamentos y Tendones del Tobillo Anatomía y Afecciones por RM.pdf',
    multi: []
  },
  {
    oldName: 'S-F - Gallart Ortega, José - SISTEMA AQUILEO-CALCA-NEO-PLANTAR.pdf',
    newName: '2014 - Gallart Ortega, José - Sistema Aquileo-Calcáneo-Plantar.pdf',
    multi: []
  },
  {
    oldName: 'Watkins\'_Manual_of_Foot_and_Ankle_Medicine_and_Surgery_2023_Zaky.epub',
    newName: '2023 - Zaky, Leon - Watkins Manual of Foot and Ankle Medicine and Surgery 5th Ed.epub',
    multi: ['Libros']
  },
  {
    oldName: 'S-F - S-A - Diagnostic Imaging.pdf',
    newName: '2015 - Szeimies, Ulrike - Diagnostic Imaging of the Foot and Ankle 2nd Ed.pdf',
    multi: ['Libros']
  },
  {
    oldName: 'S-F - Wiilker - Atlas de Cirugia del Pie y Tobillo.pdf',
    newName: '2005 - Wülker, Nikolaus - Atlas of Foot and Ankle Surgery 2nd Ed.pdf',
    multi: ['Libros']
  },
  {
    oldName: 'Diagnostic Imaging of The Foot And Ankle - Ulrike Szeimies.pdf',
    newName: '2015 - Szeimies, Ulrike - Diagnostic Imaging of the Foot and Ankle.pdf',
    multi: ['Libros']
  },
  {
    oldName: 'S-F - Mariano Núñez-Samper Pizarroso - Técnicas quirúrgicas en cirugía del pie.pdf',
    newName: '2003 - Núñez-Samper Pizarroso, Mariano - Técnicas Quirúrgicas en Cirugía del Pie.pdf',
    multi: ['Libros']
  },
  {
    oldName: 'S-F - S-A - Clasificacion de Weber y Cech la divide en dos grupos.pdf',
    newName: '2015 - S-A - Clasificación de Weber y Cech de las Pseudoartrosis.pdf',
    multi: []
  },
  {
    oldName: 'S-F - Ponseti - Método de rodilla.pdf',
    newName: '2003 - Ponseti, Ignacio - Pie Zambo El Método de Ponseti.pdf',
    multi: ['Ortopedia Pediatrica']
  },
  {
    oldName: 'S-F - S-A - Guía para mejorar la funcionalidad del tobillo.pdf',
    newName: '2018 - IMSS - Guía para Mejorar la Funcionalidad del Tobillo.pdf',
    multi: []
  },
  {
    oldName: 'Esguinces y distensiones de pie.doc',
    newName: '2018 - S-A - Guía Clínica Esguinces y Distensiones de Pie.doc',
    multi: []
  },
  {
    oldName: 'Esguinces y distensiones de tobillo.doc',
    newName: '2018 - S-A - Guía Clínica Esguinces y Distensiones de Tobillo.doc',
    multi: []
  },
  {
    oldName: 'Esguinces y distensiones.doc',
    newName: '2018 - S-A - Guía Clínica Esguinces y Distensiones.doc',
    multi: []
  },
  {
    oldName: 'S-F - S-A - PROGRAMAS DE EJERCICIOS para Tobillo - Pie Isométrico.pdf',
    newName: '2016 - S-A - Programas de Ejercicios para Tobillo y Pie Isométrico.pdf',
    multi: []
  },
  {
    oldName: 'S-F - S-A - Diagnóstico y Manejo del Esguince de Tobillo En la Fase aguda para el Primer Nivel.pdf',
    newName: '2010 - IMSS - Diagnóstico y Manejo del Esguince de Tobillo en la Fase Aguda.pdf',
    multi: []
  },
  {
    oldName: 'AAOS -Secot monografia-2014-Parte-2 Facturas de tobillo.pdf',
    newName: '2014 - AAOS-SECOT - Monografía Fracturas de Tobillo Parte 2.pdf',
    multi: []
  },
  {
    oldName: 'S-F - Wagner Hitschfeld - Foot and Ankle Disorders A Comprehensive Approach in Pediatric and Adult Populations.pdf',
    newName: '2022 - Wagner Hitschfeld, Emilio - Foot and Ankle Disorders Comprehensive Approach.pdf',
    multi: ['Libros', 'Ortopedia Pediatrica']
  },
  {
    oldName: 'CHANG PIE Y TOBILLO.pdf',
    newName: '2005 - Chang, Thomas J. - Master Techniques in Podiatric Surgery The Foot and Ankle.pdf',
    multi: ['Libros']
  },
  {
    oldName: 'The_Diabetic_Charcot_Foot_and_Ankle_A_Multidisciplinary_Team_Approach.pdf',
    newName: '2010 - Frykberg, Robert G. - The Diabetic Charcot Foot and Ankle A Multidisciplinary Team Approach.pdf',
    multi: ['Libros']
  },
  {
    oldName: '2024 - Técnica quirúrgica del manejo de las fracturas de calcáneo a través de un abordaje del seno del tarso.pdf',
    newName: '2025 - Mingo-Robinet, J. - Técnica Quirúrgica de Fracturas de Calcáneo por Abordaje Seno del Tarso.pdf',
    multi: ['Abordajes']
  },
  {
    oldName: 'S-F - DePuy Synthes - Expert HAN Clavo para Artrodesis Posterior del Pie Técnica Quirúrgica.pdf',
    newName: '2018 - DePuy Synthes - Clavo Expert HAN para Artrodesis Posterior del Pie Técnica Quirúrgica.pdf',
    multi: ['Catálogos de Materiales ortopédicos']
  },
  {
    oldName: 'S-F - Arthrex - SpeedBridge para el Tendón de Aquiles Técnica Quirúrgica.pdf',
    newName: '2019 - Arthrex - SpeedBridge para el Tendón de Aquiles Técnica Quirúrgica.pdf',
    multi: ['Catálogos de Materiales ortopédicos']
  },
  {
    oldName: 'S-F - Arthrex - Syndesmosis TightRope XP Implant System Surgical Technique.pdf',
    newName: '2020 - Arthrex - Syndesmosis TightRope XP Implant System Surgical Technique.pdf',
    multi: ['Catálogos de Materiales ortopédicos']
  }
];

console.log('--- FASE 2: RENOMBRAMIENTO Y MULTI-TÓPICO ---');
for (const act of actions) {
  const oldPath = path.join(PIE_DIR, act.oldName);
  const newPath = path.join(PIE_DIR, act.newName);

  if (fs.existsSync(oldPath)) {
    if (oldPath !== newPath) {
      fs.renameSync(oldPath, newPath);
      console.log(`[RENOMBRADO] "${act.oldName}" -> "${act.newName}"`);
    }
    for (const m of act.multi) {
      safeCopy(newPath, m, act.newName);
    }
  } else if (fs.existsSync(newPath)) {
    console.log(`[YA RENOMBRADO] "${act.newName}"`);
    for (const m of act.multi) {
      safeCopy(newPath, m, act.newName);
    }
  } else {
    console.log(`[NO ENCONTRADO] "${act.oldName}"`);
  }
}

// 3. Indexar todo Pie y Tobillo en global_registry.json
console.log('--- FASE 3: INDEXACIÓN EN GLOBAL REGISTRY ---');
const currentFiles = fs.readdirSync(PIE_DIR).filter(f => !f.startsWith('.') && f !== 'desktop.ini');
let indexedCount = 0;
for (const f of currentFiles) {
  const fp = path.join(PIE_DIR, f);
  try {
    const hash = computeHash(fp);
    if (!reg.hashes[hash]) {
      reg.hashes[hash] = {
        folder: 'Pie y Tobillo',
        canonicalName: f,
        path: 'Pie y Tobillo/' + f
      };
      indexedCount++;
    }
  } catch (e) {
    console.log(`Error hashing ${f}: ${e.message}`);
  }
}

fs.writeFileSync(REG_PATH, JSON.stringify(reg, null, 2), 'utf8');
console.log(`Fase 3 completada: ${indexedCount} nuevos hashes indexados en global_registry.json.`);
console.log(`Total archivos finales en Pie y Tobillo: ${currentFiles.length}`);
