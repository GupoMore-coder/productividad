const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_DIR = 'H:\\Mi unidad\\Información Ortopedia';
const REC_DIR = path.join(BASE_DIR, 'Reconstructiva');
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
    'S-F - Masquelet - Atlas de Flaps en Reconstrucción de Extremidades.pdf',
    '1995 - Masquelet, Alain C - An Atlas of Flaps in Limb Reconstruction.pdf',
    'Pseudoartrosis.pdf',
    'S-F - Waldemar Link - MEGASYSTEM-C Tumor and Revision System Surgical Technique.pdf',
    'S-F - Marceldekker - Ilizarov Technique for Complex Foot and Ankle Deformities.pdf',
    'S-F - S-A - External Fixators of the Foot and Ankle.pdf'
  ];
  for (const d of dupes) {
    safeMoveToMusic(path.join(REC_DIR, d), d);
  }

  console.log('--- FASE 2: RENOMBRAMIENTOS Y MULTI-TÓPICOS ---');
  const actions = [
    {
      oldName: 'S-F - Pensy - The Mangled Extremity.pdf',
      newName: '2017 - Pensy, Raymond A. - The Mangled Extremity.pdf',
      multi: ['Temas generales']
    },
    {
      oldName: 'The Art of Limb Alignment 2.pdf',
      newName: '2008 - Standard, Shawn C. - The Art of Limb Alignment - Ed. 2.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'The_art_of_limb_alignment_3ed_shawn_standard_john_herzenberg_amanda.pdf',
      newName: '2021 - Standard, Shawn C. - The Art of Limb Alignment - Ed. 3.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'The Art of Limb Alignment John E Herzenberg.pdf',
      newName: '2014 - Herzenberg, John E. - The Art of Limb Alignment Taylor Spatial Frame.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Gavriil A.Llizarov - Transosseous Osteosynthesis.pdf',
      newName: '1992 - Ilizarov, Gavriil A. - Transosseous Osteosynthesis Theoretical and Clinical Aspects.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - null - External Fixation de Hueso Fémur.pdf',
      newName: '2015 - AO Trauma - External Fixation of Femur Shaft Fractures.pdf',
      multi: ['Femur', 'Materiales Osteosintesis']
    },
    {
      oldName: 'S-F - Smith - Damage-control orthopedics or early total care.pdf',
      newName: '2008 - Pape, Hans-Christoph - Damage-Control Orthopedics or Early Total Care in Polytrauma.pdf',
      multi: ['Temas generales']
    },
    {
      oldName: 'S-F - Smith - Estudio de rodilla.pdf',
      newName: '2015 - Smith, R. Malcolm - Indications for External Fixation in Trauma.pdf',
      multi: ['Materiales Osteosintesis']
    },
    {
      oldName: 'S-F - Thompson - Complicaciones en cirugia ortopedica.pdf',
      newName: '2006 - Thompson, George H. - Complicaciones en Cirugía Ortopédica.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Bidolegui - Control del daño en ortopedia y traumatología.pdf',
      newName: '2014 - Bidolegui, Fernando - Control del Daño en Ortopedia y Traumatología.pdf',
      multi: ['Temas generales']
    },
    {
      oldName: 'S-F - S-A - Estudio de rodilla.pdf',
      newName: '2012 - Fragomen, Austin T. - External Fixation Principles and Applications.pdf',
      multi: ['Materiales Osteosintesis']
    },
    {
      oldName: 'FIJACION EXTERNA DESCARTABLE.pdf',
      newName: '2016 - S-A - Fijación Externa Descartable Manual Operativo.pdf',
      multi: ['Materiales Osteosintesis']
    },
    {
      oldName: 'S-F - Höntzsch - Principles of external fixation.pdf',
      newName: '2012 - Höntzsch, Dankward - Principles of External Fixation AO Trauma.pdf',
      multi: ['Materiales Osteosintesis']
    },
    {
      oldName: 'S-F - null - Principles of external fixation.pdf',
      newName: '2015 - Höntzsch, Dankward - Principles of External Fixation Study Guide.pdf',
      multi: ['Materiales Osteosintesis']
    },
    {
      oldName: 'S-F - Murphy - Fundamentals of Amputation Care and Prosthetics.pdf',
      newName: '2013 - Murphy, Douglas - Fundamentals of Amputation Care and Prosthetics.pdf',
      multi: ['Libros', 'AMPUTACIONES']
    },
    {
      oldName: 'S-F - S-A - Guia de practica clinica para el diagnóstico y tratamiento preoperatorio, intraoperatorio y postoperatorio de la persona amputada.pdf',
      newName: '2015 - Guía No. 55 - Diagnóstico y Tratamiento de la Persona Amputada.pdf',
      multi: ['AMPUTACIONES']
    },
    {
      oldName: 'ILIZAROV ATLAS Pin Insertions.pdf',
      newName: '2000 - Ilizarov - Atlas of Pin and Wire Insertion Techniques.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'La fasciotomia en los sindromes compartimentales agudos de causa vascular.pdf',
      newName: '2011 - S-A - La Fasciotomía en los Síndromes Compartimentales Agudos.pdf',
      multi: ['Temas generales', 'Tejidos blandos']
    },
    {
      oldName: 'S-F - Kinlay - Management of Critical Limb Ischemia.pdf',
      newName: '2016 - Kinlay, Scott - Management of Critical Limb Ischemia.pdf',
      multi: ['Temas generales']
    },
    {
      oldName: 'S-F - Parker MJ, Das A - Estudio de rodilla.pdf',
      newName: '2013 - Parker, M. J. - Extramedullary Fixation and External Fixators for Extracapsular Hip Fractures.pdf',
      multi: ['Cadera y Pelvis']
    },
    {
      oldName: 'S-F - S-A - TECNICA DE FIXACION EXTERNA LARGA AO ASIF.pdf',
      newName: '2005 - AO ASIF - Large External Fixator Technique Guide Basic Modular Frame.pdf',
      multi: ['Catálogos de Materiales ortopédicos']
    },
    {
      oldName: 'S-F - F. Schuind - Técnica de colocación de una fijación externa unilateral en las extremidades.pdf',
      newName: '2004 - Schuind, F. - Técnica de Colocación de una Fijación Externa Unilateral en las Extremidades.pdf',
      multi: ['EMC Ortopedia']
    },
    {
      oldName: 'S-F - S-A - Colgajos en cirugía reparadora.pdf',
      newName: '2009 - Masquelet, Alain C. - Colgajos en Cirugía Reparadora.pdf',
      multi: ['Libros', 'Tejidos blandos']
    },
    {
      oldName: 'Atlas of soft tissue flaps Masquelet .pdf',
      newName: '2001 - Masquelet, Alain C. - An Atlas of Flaps in Limb Reconstruction 2nd Ed.pdf',
      multi: ['Libros', 'Tejidos blandos']
    },
    {
      oldName: 'S-F - Masquelet, A C - Atlas de flaps en reconstrucción de miembros.pdf',
      newName: '1995 - Masquelet, Alain C. - An Atlas of Flaps in Limb Reconstruction.pdf',
      multi: ['Libros', 'Tejidos blandos']
    },
    {
      oldName: 'S-F - S-A - Documento_Desconocido.pdf',
      newName: '2013 - Boffeli, Troy J. - Reconstructive Surgery of the Lower Extremity.pdf',
      multi: ['Libros', 'Pie y Tobillo']
    },
    {
      oldName: 'S-F - Nikkhah - Core Techniques in Flap Reconstructive Microsurgery.pdf',
      newName: '2023 - Nikkhah, Dariush - Core Techniques in Flap Reconstructive Microsurgery.pdf',
      multi: ['Libros', 'Tejidos blandos']
    },
    {
      oldName: 'S-F - S-A - Flaps and reconstructive surgery.pdf',
      newName: '2009 - Wei, Fu-Chan - Flaps and Reconstructive Surgery.pdf',
      multi: ['Libros', 'Tejidos blandos']
    },
    {
      oldName: 'S-F - Hierner - Flaps in Hand and Upper Limb Reconstruction.pdf',
      newName: '2004 - Hierner, R. - Flaps in Hand and Upper Limb Reconstruction.pdf',
      multi: ['Libros', 'Mano']
    },
    {
      oldName: 'S-F - Berish Strauch - Atlas de Cirugia Microvascular.pdf',
      newName: '2006 - Strauch, Berish - Atlas of Microvascular Surgery - Ed. 2.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Rodriguez-Collazo Arshad A. Khan - Tecnicas quirurgicas ortoplasticas y consideraciones para flap muscular de extremo inferior perforador.pdf',
      newName: '2022 - Rodriguez-Collazo, Edgardo - Orthoplastic Techniques for Lower Extremity Muscular Perforator Flaps.pdf',
      multi: ['Tejidos blandos']
    },
    {
      oldName: 'S-F - Paley - Principles of Deformity Correction.pdf',
      newName: '2002 - Paley, Dror - Principles of Deformity Correction.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Find 6 surgical videos on MediaCenter.thieme.com.pdf',
      newName: '2018 - Berli, Martin - Lower Extremity Reconstruction Surgical Techniques.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - TECNICA DE TUMORES Y REVISIONES ORTOPEDICAS.pdf',
      newName: '2018 - Waldemar Link - MEGASYSTEM-C Tumor and Revision System Surgical Technique.pdf',
      multi: ['Catálogos de Materiales ortopédicos', 'Ortopedia Oncologica']
    },
    {
      oldName: 'S-F - S-A - Injectable Therapies for the Musculoskeletal System Orthobiologics.pdf',
      newName: '2021 - Filardo, Giuseppe - Injectable Therapies for the Musculoskeletal System Orthobiologics.pdf',
      multi: ['Materiales Osteosintesis']
    },
    {
      oldName: 'S-F - S-A - CURSO BáSICO FUNDACIÓN SECOT PSEUDOARTROSIS.pdf',
      newName: '2010 - Fundación SECOT - Curso Básico Pseudoartrosis.pdf',
      multi: ['Libros', 'Temas generales']
    },
    {
      oldName: 'S-F - S-A - Management of Upper Limb Amputations.pdf',
      newName: '2014 - Marchessault, Jeffrey A. - Management of Upper Limb Amputations.pdf',
      multi: ['Mano', 'AMPUTACIONES']
    },
    {
      oldName: 'S-F - Rincón Lozano - Planeamiento Preoperatorio en Fijación Externa.pdf',
      newName: '2019 - Rincón Lozano, Julián David - Planeamiento Preoperatorio en Fijación Externa.pdf',
      multi: []
    },
    {
      oldName: '2007 Trans-femoral amputation in elderly dysvascular patients. Reliable results with a technique of myodesis.pdf',
      newName: '2007 - Konduru, Sandeep - Trans-Femoral Amputation in Elderly Dysvascular Patients Technique of Myodesis.pdf',
      multi: ['AMPUTACIONES']
    },
    {
      oldName: 'S-F - Eduardo Vázquez Vela Sánchez - Los amputados y su rehabilitacion.pdf',
      newName: '2016 - Vázquez Vela Sánchez, Eduardo - Los Amputados y su Rehabilitación Un Reto para el Estado.pdf',
      multi: ['AMPUTACIONES', 'Libros']
    },
    {
      oldName: 'S-F - Tintle, Scott M. - Estudio de rodilla.pdf',
      newName: '2010 - Tintle, Scott M. - Traumatic and Trauma-Related Amputations Part I General Principles.pdf',
      multi: ['AMPUTACIONES']
    },
    {
      oldName: 'S-F - S-A - Diagnóstico y tratamiento de la no unificación de los huesos largos con técnicas de compresión-distorsión.pdf',
      newName: '2006 - Solomin, Leonid - Nonunion of the Long Bones Compression-Distraction Techniques.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Animesh Agarwal - Diagnosis, Evaluation y Gestón de Maluniones.pdf',
      newName: '2014 - Agarwal, Animesh - Malunions Diagnosis, Evaluation and Management.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Vázquez Vela Sánchez - Los amputados y su rehabilitación Un reto para el Estado.pdf',
      newName: '2016 - Vázquez Vela Sánchez, Eduardo - Los Amputados y su Rehabilitación - Ed. 2.pdf',
      multi: ['AMPUTACIONES', 'Libros']
    },
    {
      oldName: 'Ortesis y Prótesis - Mónica Ocello.pdf',
      newName: '2012 - Ocello, Mónica - Órtesis y Prótesis.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Smith - Tratamiento quirñrgico de la infección relacionada con fracturas.pdf',
      newName: '2023 - Gómez-Palacio, R. - Tratamiento Quirúrgico de la Infección Relacionada con Fracturas.pdf',
      multi: ['Infeccioso']
    },
    {
      oldName: 'S-F - S-A - Limpieza y reconstrucción de la rodilla.pdf',
      newName: '2006 - Rozbruch, S. Robert - Limb Lengthening and Reconstruction Surgery.pdf',
      multi: ['Libros', 'Rodilla y Tibia']
    },
    {
      oldName: '612688786_Ortesis_y_Protesis_Del_Aparato_Locomotor_3_Extremidad.pdf',
      newName: '2005 - Zambudio Periago, R. - Prótesis, Órtesis y Ayudas Técnicas Extremidad Superior.pdf',
      multi: ['Libros']
    },
    {
      oldName: '614943515_Ortesis_y_Protesis_Del_Aparato_Locomotor_Columna_Vertebral.pdf',
      newName: '2005 - Zambudio Periago, R. - Prótesis y Órtesis Columna Vertebral.pdf',
      multi: ['Libros', 'Columna']
    },
    {
      oldName: '614945757_Ortesis_y_Protesis_Del_Aparato_Locomotor_Extremidad_Inferior.pdf',
      newName: '2005 - Zambudio Periago, R. - Prótesis y Órtesis Extremidad Inferior.pdf',
      multi: ['Libros']
    },
    {
      oldName: '684312390_Toaz_info_Ortesis_y_Protesis_Del_Aparato_Locomotor_21.pdf',
      newName: '2005 - Zambudio Periago, R. - Prótesis, Órtesis y Ayudas Técnicas Generalidades.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Qin Jiancheng Zang Shaofeng Jiao Qi Pan - Deformity Correction and Function Reconstruction.pdf',
      newName: '2020 - Qin, Sihe - Deformity Correction and Function Reconstruction Lower Limb Deformities.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Rozbruch R, Hamdy R, Fragomen A, Bernstein M - Limb Lengthening and Reconstruction Surgery Case Atlas.pdf',
      newName: '2015 - Rozbruch, S. Robert - Limb Lengthening and Reconstruction Surgery Case Atlas - Ed. 2.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Limb Lengthening and Reconstruction Surgery Case Atlas Pediatric Deformity.pdf',
      newName: '2015 - Rozbruch, S. Robert - Limb Lengthening and Reconstruction Surgery Case Atlas Pediatric Deformity.pdf',
      multi: ['Libros', 'Ortopedia Pediatrica']
    },
    {
      oldName: 'S-F - S-A - Limb Lengthening and Reconstruction Surgery Case Atlas Adult Deformity.pdf',
      newName: '2015 - Rozbruch, S. Robert - Limb Lengthening and Reconstruction Surgery Case Atlas Adult Deformity.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Mullaji Gautam M. Shetty - Deformity Correction en Arthroplastia de Rodilla Total.pdf',
      newName: '2014 - Mullaji, Arun B. - Deformity Correction in Total Knee Arthroplasty.pdf',
      multi: ['Rodilla y Tibia', 'Libros']
    },
    {
      oldName: 'S-F - Çakmak - Técnicas básicas para la reconstrucción de extremidades.pdf',
      newName: '2018 - Çakmak, Mehmet - Basic Techniques for Extremity Reconstruction.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Qin Sihe - Atlas of Limb Deformity Etiological Classification.pdf',
      newName: '2020 - Qin, Sihe - Atlas of Limb Deformity Etiological Classification.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Joan E. Edelstein - Conceptos Clinicos de Protesis y Ortopedia de Miembros Inferiores.pdf',
      newName: '2011 - Edelstein, Joan E. - Lower-Limb Prosthetics and Orthotics Clinical Concepts.pdf',
      multi: ['Libros', 'AMPUTACIONES']
    },
    {
      oldName: 'S-F - Edgardo Rodriguez-Collazo Arshad A. Khan Hamid A. Khan Luis J. Sanchez-Robles Suhail B. Masadeh - Orthoplastic Surgical Techniques and Considerations for Lower Extremity Muscular Perforator Flaps.pdf',
      newName: '2022 - Rodriguez-Collazo, Edgardo - Orthoplastic Techniques for Lower Extremity Muscular Perforator Flaps 2.pdf',
      multi: ['Tejidos blandos']
    },
    {
      oldName: 'S-F - S-A - Bone and Joint Infections.pdf',
      newName: '2021 - Ruggieri, Pietro - Bone and Joint Infections.pdf',
      multi: ['Libros', 'Infeccioso']
    },
    {
      oldName: 'S-F - Guoxian Pei - Microsurgical Orthopedics.pdf',
      newName: '2019 - Pei, Guoxian - Microsurgical Orthopedics.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Principles of Deformity Correction - Exercise Workbook - Dror Paley.pdf',
      newName: '2003 - Paley, Dror - Principles of Deformity Correction Exercise Workbook.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Grabb’s Encyclopedia of Flaps, Vol. 3, 3e.pdf',
      newName: '2009 - Strauch, Berish - Grabb\'s Encyclopedia of Flaps - Vol. 3 Torso, Pelvis and Lower Extremity - Ed. 3.pdf',
      multi: ['Libros', 'Tejidos blandos']
    },
    {
      oldName: 'Grabb’s Encyclopedia of Flaps, Vol. 2, 3e.pdf',
      newName: '2009 - Strauch, Berish - Grabb\'s Encyclopedia of Flaps - Vol. 2 Upper Extremity - Ed. 3.pdf',
      multi: ['Libros', 'Tejidos blandos', 'Mano']
    },
    {
      oldName: 'Grabb’s Encyclopedia of Flaps, Vol. 1, 3e.pdf',
      newName: '2009 - Strauch, Berish - Grabb\'s Encyclopedia of Flaps - Vol. 1 Head and Neck - Ed. 3.pdf',
      multi: ['Libros', 'Tejidos blandos']
    },
    {
      oldName: 'S-F - Alt - Estudio de clasificacion de infecciones relacionadas con fracturas.pdf',
      newName: '2020 - Alt, Volker - The FRI Classification A New Classification of Fracture-Related Infections.pdf',
      multi: ['Infeccioso']
    },
    {
      oldName: 'S-F - Hou - Surgical Atlas of Perforator Flaps.pdf',
      newName: '2015 - Hou, Chunlin - Surgical Atlas of Perforator Flaps A Microsurgical Dissection Technique.pdf',
      multi: ['Libros', 'Tejidos blandos']
    },
    {
      oldName: 'S-F - Savakus - Surgical Techniques External Fixation of Lower Extremity Injuries in an Austere Environment A Technique for Safe Application Without the Use of Fluoroscopy.pdf',
      newName: '2025 - Savakus, Jonathan C. - External Fixation of Lower Extremity Injuries in an Austere Environment.pdf',
      multi: ['Materiales Osteosintesis']
    },
    {
      oldName: 'Orthotics and Prosthetics in Rehabilitation-Saunders (2020).pdf',
      newName: '2020 - Chui, Kevin K. - Orthotics and Prosthetics in Rehabilitation - Ed. 4.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - De Pablos - Deformidades Angulares de las EEII en la Edad Infantil y Adolescencia.pdf',
      newName: '2010 - de Pablos, Julio - Deformidades Angulares de las EEII en la Edad Infantil y Adolescencia.pdf',
      multi: ['Ortopedia Pediatrica']
    },
    {
      oldName: 'S-F - Julio De Pablos - Deformidades Angulares De Las Extremidades Inferiores En La Edad Infantil Y Adolescencia.pdf',
      newName: '2010 - de Pablos, Julio - Deformidades Angulares De Las Extremidades Inferiores Principios de Valoración.pdf',
      multi: ['Ortopedia Pediatrica']
    },
    {
      oldName: 'S-F - Boda1 - Estudio de infección ósea.pdf',
      newName: '2005 - Boda, R. - Diagnóstico y Tratamiento de las Infecciones Óseas y Articulares.pdf',
      multi: ['Infeccioso']
    },
    {
      oldName: 'S-F - Zgonis, Thomas - Surgical Reconstruction of the Diabetic Foot.pdf',
      newName: '2012 - Zgonis, Thomas - Surgical Reconstruction of the Diabetic Foot and Ankle.pdf',
      multi: ['Libros', 'Pie y Tobillo']
    },
    {
      oldName: 'S-F - Thomas Jo Round - Principios básicos de la corrección de deformidades de la extremidad inferior.pdf',
      newName: '2021 - Thomas, Alexander - Basic Principles of Lower Limb Deformity Correction.pdf',
      multi: []
    },
    {
      oldName: 'S-F - Pablo S. Corona - Estudio de rodilla.pdf',
      newName: '2022 - Corona, Pablo S. - Antibacterial Nail in Bone Transport Over Nail and Nail After Bone Transport.pdf',
      multi: ['Materiales Osteosintesis', 'Infeccioso']
    }
  ];

  for (const act of actions) {
    const oldPath = path.join(REC_DIR, act.oldName);
    const newPath = path.join(REC_DIR, act.newName);

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
  const items = fs.readdirSync(REC_DIR, { withFileTypes: true });
  const finalFiles = items.filter(i => i.isFile() && !i.name.startsWith('.') && i.name !== 'desktop.ini');
  let indexed = 0;

  for (const f of finalFiles) {
    const fp = path.join(REC_DIR, f.name);
    const hash = await computeStreamHash(fp);
    if (hash && !reg.hashes[hash]) {
      reg.hashes[hash] = {
        folder: 'Reconstructiva',
        canonicalName: f.name,
        path: 'Reconstructiva/' + f.name
      };
      indexed++;
    }
  }

  fs.writeFileSync(REG_PATH, JSON.stringify(reg, null, 2), 'utf8');
  console.log(`Fase 3 completada: ${indexed} nuevos hashes indexados en global_registry.json.`);
  console.log(`Total archivos finales en la raíz de Reconstructiva: ${finalFiles.length}`);
}

run();
