const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_DIR = 'H:\\Mi unidad\\Información Ortopedia';
const TG_DIR = path.join(BASE_DIR, 'Temas generales');
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

function computeStreamHash(filePath) {
  return new Promise((resolve) => {
    try {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', () => resolve(null));
    } catch (e) {
      resolve(null);
    }
  });
}

async function run() {
  console.log('--- FASE 1: EVACUAR DUPLICADOS CONFIRMADOS ---');
  const dupes = [
    'S-F - S-A - Documento_Desconocido.pdf',
    'Atlas_de_mediciones_radiográficas.pdf',
    'Pruebas en Ortopedia.pdf',
    'Cirugía Ortopédica de Bolsillo.pdf',
    'injection_techniques_in_musculoskeletal_medicine_a_practical_manual.pdf',
    '2006 - Barón Zárate-Kalfópulos, B. - Injertos Óseos en Cirugía Ortopédica.pdf'
  ];
  for (const d of dupes) {
    safeMoveToMusic(path.join(TG_DIR, d), d);
  }

  console.log('--- FASE 2: RENOMBRAMIENTOS Y MULTI-TÓPICOS ---');
  const actions = [
    {
      oldName: 'S-F - Marecek - Comprehensive Orthopaedic Review.pdf',
      newName: '2020 - Marecek, Geoffrey S. - AAOS Comprehensive Orthopaedic Review 3.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'AAOS Comprehensive Orthopaedic Review.pdf',
      newName: '2014 - Lieberman, Jay R. - AAOS Comprehensive Orthopaedic Review 2.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Rehabilitación Ortopédica Clínica - S. Brent Brotzman (2° Edición).pdf',
      newName: '2005 - Brotzman, S. Brent - Rehabilitación Ortopédica Clínica - Ed. 2.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Rehabilitación Ortopédica Clínica - S. Brent. Brotzman (3° Edición).pdf',
      newName: '2012 - Brotzman, S. Brent - Rehabilitación Ortopédica Clínica - Ed. 3.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Clinical Orthopaedic Rehabilitation, 4e.pdf',
      newName: '2018 - Giangarra, Charles E. - Clinical Orthopaedic Rehabilitation A Team Approach - Ed. 4.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Roiger - Anatomy, Physiology, & Disease Foundations for the Health Professions.pdf',
      newName: '2019 - Roiger, Deborah - Anatomy, Physiology, and Disease - Ed. 2.pdf',
      multi: ['Libros']
    },
    {
      oldName: '2004 - Gross - Revisión de arthroplastia del fémur con restauración de la masa ósea.pdf',
      newName: '2004 - Gross, Allan E. - Revisión de Artroplastia del Fémur con Restauración de Masa Ósea.pdf',
      multi: ['Libros', 'Femur', 'Cadera y Pelvis']
    },
    {
      oldName: 'Ortopedia_y_Traumatología_2ED_Silberman,_Fernando_S_Varaona,_Oscar.pdf',
      newName: '2003 - Silberman, Fernando S. - Ortopedia y Traumatología - Ed. 2.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'ROUVIERE TOMO 3- Anatomía.pdf',
      newName: '2005 - Rouvière, Henri - Anatomía Humana Descriptiva, Topográfica y Funcional Tomo 3 - Ed. 11.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Fracturas.  Tratamiento y Rehabilitación - Hoppenfeld _ Murthy.pdf',
      newName: '2001 - Hoppenfeld, Stanley - Fracturas Tratamiento y Rehabilitación.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'PRINCIPIOS DE LA AO EN EL TRATAMIENTO DE LAS FRACTURAS.pdf',
      newName: '2003 - Rüedi, Thomas P. - Principios de la AO en el Tratamiento de las Fracturas.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Stannard - Surgical Treatment of Orthopaedic Trauma.pdf',
      newName: '2007 - Stannard, James P. - Surgical Treatment of Orthopaedic Trauma.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Bontragers TEXTBOOK of RADIOGRAPHIC POSITIONING and RELATED ANATOMY.pdf',
      newName: '2018 - Lampignano, John - Bontragers Textbook of Radiographic Positioning and Related Anatomy - Ed. 9.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Marti - Concepts and Cases in Nonunion Treatment.pdf',
      newName: '2011 - Marti, René K. - Concepts and Cases in Nonunion Treatment AO.pdf',
      multi: ['Libros', 'Reconstructiva']
    },
    {
      oldName: 'Atlas_en_mano_de_diseccion_anatomoquirurgica_Garcia_Elias_2007.pdf',
      newName: '2007 - García-Elías, Marc - Atlas de Disección Anatomoquirúrgica de la Mano.pdf',
      multi: ['Libros', 'Mano', 'Abordajes']
    },
    {
      oldName: 'Kapandji FisiologiaArticular T2.pdf',
      newName: '2006 - Kapandji, A. I. - Fisiología Articular Tomo 2 Miembro Inferior - Ed. 6.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Smith - Fisologia Articular.pdf',
      newName: '2006 - Kapandji, A. I. - Fisiología Articular Tomo 1 Miembro Superior - Ed. 6.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Fisiología Articular Tronco y Raquis.pdf',
      newName: '2006 - Kapandji, A. I. - Fisiología Articular Tomo 3 Tronco y Raquis - Ed. 6.pdf',
      multi: ['Libros', 'Columna']
    },
    {
      oldName: 'Operative_Techniques_in_Joint_Reconstruction_Surgery_3ed_2022.pdf',
      newName: '2022 - Wiesel, Sam W. - Operative Techniques in Joint Reconstruction Surgery - Ed. 3.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Schemitsch - Operative Techniques Orthopaedic Trauma Surgery.pdf',
      newName: '2020 - Schemitsch, Emil H. - Operative Techniques Orthopaedic Trauma Surgery - Ed. 2.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'AO_Casts,_Splints,_and_Support_Bandages_Nonoperative_Treatment_and.pdf',
      newName: '2015 - AO Foundation - Casts, Splints, and Support Bandages Nonoperative Treatment and Temporary Splinting.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Anatomía Humana by J. García Porrero (z-lib.org).pdf',
      newName: '2005 - García-Porrero, J. A. - Anatomía Humana.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Aproxaciones al hombro.pdf',
      newName: '2017 - AO Trauma - Abordajes Quirúrgicos al Hombro.pdf',
      multi: ['Abordajes', 'Hombro']
    },
    {
      oldName: 'S-F - S-A - Enfoques para el hueso humeral.pdf',
      newName: '2017 - AO Trauma - Abordajes Quirúrgicos al Húmero.pdf',
      multi: ['Abordajes', 'Humero']
    },
    {
      oldName: 'S-F - S-A - Todos los enfoques a los huesos de la muíeca Enfoque palmar al escáfoido.pdf',
      newName: '2017 - AO Trauma - Abordajes Quirúrgicos a la Muñeca y Mano.pdf',
      multi: ['Abordajes', 'Mano']
    },
    {
      oldName: 'S-F - S-A - Enfoques para la rodilla.pdf',
      newName: '2017 - AO Trauma - Abordajes Quirúrgicos a la Rodilla.pdf',
      multi: ['Abordajes', 'Rodilla y Tibia']
    },
    {
      oldName: 'S-F - S-A - Enfoques para la tibia proximal.pdf',
      newName: '2017 - AO Trauma - Abordajes Quirúrgicos a la Tibia Proximal.pdf',
      multi: ['Abordajes', 'Rodilla y Tibia']
    },
    {
      oldName: 'S-F - S-A - Enfoques para el calcáneo y talus.pdf',
      newName: '2017 - AO Trauma - Abordajes Quirúrgicos al Calcáneo y Talus.pdf',
      multi: ['Abordajes', 'Pie y Tobillo']
    },
    {
      oldName: 'K-WIRING (C-REX).pdf',
      newName: '2018 - C-REX - K-Wiring Surgical Technique and Principles.pdf',
      multi: ['Materiales Osteosintesis']
    },
    {
      oldName: 'Prótesis,Órtesis y Ayudas Técnicas - Ramón Zambudio Periago.pdf',
      newName: '2009 - Zambudio Periago, Ramón - Prótesis, Órtesis y Ayudas Técnicas.pdf',
      multi: ['Libros', 'Reconstructiva']
    },
    {
      oldName: 'S-F - S-A - Traumatologia y Ortopedia para el Grado en Medicina.pdf',
      newName: '2015 - SECOT - Traumatología y Ortopedia para el Grado en Medicina.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Rapid Orthopedic Diagnosis.pdf',
      newName: '2009 - S-A - Rapid Orthopedic Diagnosis.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Atlas de Mediciones Radiograficas en Ortopedia y Traumatologia.pdf',
      newName: '2011 - S-A - Atlas de Mediciones Radiográficas en Ortopedia y Traumatología.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - ATLAS DE MEDICIONES RADIOGRÁFICAS EN ORTOPEDIA Y TRAUMATOLOGÍA.pdf',
      newName: '2011 - S-A - Atlas de Mediciones Radiográficas en Ortopedia y Traumatología Tomo 2.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Tips and Tricks in Orthopedic Surgery.pdf',
      newName: '2013 - S-A - Tips and Tricks in Orthopedic Surgery.pdf',
      multi: ['Libros']
    },
    {
      oldName: '2019 - García García - Traumatología y Ortopedia Temas básicos para el estudiante de medicina.pdf',
      newName: '2019 - García García, Jorge - Traumatología y Ortopedia Temas Básicos.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Manual de bolsillo de bolsillo cirugía ortopédica.pdf',
      newName: '2018 - S-A - Cirugía Ortopédica de Bolsillo.pdf',
      multi: []
    },
    {
      oldName: 'S-F - S-A - Musculoskeletal Injection Techniques Trainer.pdf',
      newName: '2018 - S-A - Injection Techniques in Musculoskeletal Medicine.pdf',
      multi: []
    }
  ];

  for (const act of actions) {
    const oldPath = path.join(TG_DIR, act.oldName);
    const newPath = path.join(TG_DIR, act.newName);

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

  console.log('--- FASE 3: INDEXACIÓN EN GLOBAL REGISTRY ---');
  const items = fs.readdirSync(TG_DIR, { withFileTypes: true });
  const finalFiles = items.filter(i => i.isFile() && !i.name.startsWith('.') && i.name !== 'desktop.ini');
  let indexed = 0;

  for (const f of finalFiles) {
    const fp = path.join(TG_DIR, f.name);
    const hash = await computeStreamHash(fp);
    if (hash && !reg.hashes[hash]) {
      reg.hashes[hash] = {
        folder: 'Temas generales',
        canonicalName: f.name,
        path: 'Temas generales/' + f.name
      };
      indexed++;
    }
  }

  fs.writeFileSync(REG_PATH, JSON.stringify(reg, null, 2), 'utf8');
  console.log(`Fase 3 completada: ${indexed} nuevos hashes indexados en global_registry.json.`);
  console.log(`Total archivos finales en Temas generales: ${finalFiles.length}`);
}

run();
