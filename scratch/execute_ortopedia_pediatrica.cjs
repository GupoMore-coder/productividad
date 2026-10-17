const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_DIR = 'H:\\Mi unidad\\Información Ortopedia';
const PED_DIR = path.join(BASE_DIR, 'Ortopedia Pediatrica');
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
    'S-F - Lightcap - Cuidado del yeso en espiga.pdf',
    '2016 - Dror Paley - Surgical reconstruction for fibular hemimelia.pdf',
    'S-F - Abzug, M. J. H. K. - Guia clinica del manejo de la fractura de codo pediatrico.pdf'
  ];
  for (const d of dupes) {
    safeMoveToMusic(path.join(PED_DIR, d), d);
  }

  console.log('--- FASE 2: PROTEGER EXÁMENES Y CLASES EN SUBDIRECTORIO ---');
  const evalDir = path.join(PED_DIR, 'Evaluaciones y Clases');
  if (!fs.existsSync(evalDir)) fs.mkdirSync(evalDir, { recursive: true });

  const evalFiles = [
    'Img Pre y PostQx.docx',
    'MEDICIÓN PERFIL TORSIONAL Y CONTRACTURAS MUSC.pptx',
    'Primer examen EF, def ang y rota, infecciones.docx',
    '4 examen.docx',
    '4TO EXAMEN.docx',
    'PARCIAL NOSE.docx',
    'PARCIAL ROOSEVELT NOSSA.docx',
    'INFECCIONES EN COLUMNA PEDIATRICA.pptx',
    'Examen escrito residentes 2 (1).docx',
    'Examen escrito residentes 2.docx'
  ];
  for (const ef of evalFiles) {
    const src = path.join(PED_DIR, ef);
    const dst = path.join(evalDir, ef);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst);
      fs.unlinkSync(src);
      console.log(`[PROTEGIDO EN EVALUACIONES] ${ef}`);
    }
  }

  console.log('--- FASE 3: RENOMBRAMIENTOS Y MULTI-TÓPICO ---');
  const actions = [
    {
      oldName: 'S-F - S-A - Estudio de rodilla.pdf',
      newName: '2004 - von Laer, Lutz - Pediatric Fractures and Dislocations.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Baara - Problemas rotacionales de las extremidades inferiores en niños y adolescentes.pdf',
      newName: '2021 - Baar, Alejandro - Problemas Rotacionales de las Extremidades Inferiores en Niños y Adolescentes.pdf',
      multi: []
    },
    {
      oldName: 'S-F - S-A - Handbook of Pediatric Orthopedics Second Edition.pdf',
      newName: '2008 - Staheli, Lynn T. - Handbook of Pediatric Orthopedics - Ed. 2.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Guia del examen de FRCS (Trauma y Ortopedia) para candidatos de posgrado en Pediatr¬rica.pdf',
      newName: '2020 - Alshryda, Sattar - Postgraduate Paediatric Orthopaedics The Candidates Guide to the FRCS - Ed. 2.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Rockwood and Wilkins\' Fractures in Children 10th Edition.pdf',
      newName: '2024 - Waters, Peter M. - Rockwood and Wilkins Fractures in Children - Ed. 10.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Herring, John A. - Tachdjian’s Pediatric Orthopaedics.pdf',
      newName: '2014 - Herring, John A. - Tachdjian\'s Pediatric Orthopaedics From the Texas Scottish Rite Hospital - Ed. 5.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Tachdjian - Procedimientos en Ortopedia Pediátrica de Tachdjian.pdf',
      newName: '2008 - Herring, John A. - Procedimientos en Ortopedia Pediátrica de Tachdjian.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Lynn T. Staheli, MD - Estudio de rodilla.pdf',
      newName: '2003 - Staheli, Lynn T. - Ortopedia Pediátrica.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Abzug - Guia Clinica de Manejo de Fracturas de Codo Pediatrico.pdf',
      newName: '2015 - Abzug, Joshua M. - Pediatric Elbow Fractures A Clinical Guide to Management.pdf',
      multi: ['Libros', 'Codo']
    },
    {
      oldName: 'S-F - S-A - PA E D I AT R I C O R T H O PA E D I C S.pdf',
      newName: '2015 - Joseph, Benjamin - Paediatric Orthopaedics A System of Decision-Making - Ed. 2.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Mininder Kocher - Pediatric Musculoskeletal Physical Diagnosis.pdf',
      newName: '2008 - Noonan, Kenneth - Pediatric Musculoskeletal Physical Diagnosis A Video-Enhanced Guide.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Pediatric Orthopaedics.pdf',
      newName: '2020 - Weinstein, Stuart L. - Lovell and Winter\'s Pediatric Orthopaedics - Ed. 8.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Lovell_and_Winter’s_Pediatric_Orthopaedics,_Level_1_and_2_by_Stuart.pdf',
      newName: '2014 - Weinstein, Stuart L. - Lovell and Winter\'s Pediatric Orthopaedics - Ed. 7.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Operative_Techniques_in_Orthopaedic_Pediatric_Surgery_John_Flynn.pdf',
      newName: '2016 - Flynn, John M. - Operative Techniques in Orthopaedic Pediatric Surgery - Ed. 2.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Childrens Orthopaedics and Fractures.pdf',
      newName: '2010 - Benson, Michael - Children\'s Orthopaedics and Fractures - Ed. 3.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Clohisy, MD, Barrett, MD, Gordon, MD, Delgado, MD, Schoenecker, MD - Estudio de rodilla Bernese periacetabular osteotomy en el tratamiento de la displasia acetabular severa.pdf',
      newName: '2006 - Clohisy, John C. - Periacetabular Osteotomy in the Treatment of Severe Acetabular Dysplasia.pdf',
      multi: ['Cadera y Pelvis', 'Abordajes']
    },
    {
      oldName: 'Ortopedia Infantil Rosselli Duplat (Roosevelito) .pdf',
      newName: '2012 - Rosselli Cock, Pablo - Ortopedia Infantil Roosevelito.pdf',
      multi: ['Libros']
    },
    {
      oldName: '1989 New Measurement of Patellar Height in the Knees of Children Using the Epiphyseal Line Midpoint.pdf',
      newName: '1989 - Koshino, T. - New Measurement of Patellar Height in the Knees of Children.pdf',
      multi: ['Rodilla y Tibia']
    },
    {
      oldName: 'S-F - Uribe Prada - La enfermedad de Legg Calvé Perthes.pdf',
      newName: '2014 - Uribe Prada, Iván Carlos - La Enfermedad de Legg-Calvé-Perthes.pdf',
      multi: ['Cadera y Pelvis']
    },
    {
      oldName: 'S-F - J. de Pablos - TRASTORNOS ANGULARES CONSTITUCIONALES.pdf',
      newName: '2010 - de Pablos, Julio - Trastornos Angulares Constitucionales de Miembros Inferiores.pdf',
      multi: []
    },
    {
      oldName: 'Rockwood - Fracturas en el niño Tomo 1.pdf',
      newName: '2003 - Beaty, James H. - Rockwood Fracturas en el Niño - Tomo 1.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Rockwood - Fracturas en el niño Tomo 2.pdf',
      newName: '2003 - Beaty, James H. - Rockwood Fracturas en el Niño - Tomo 2.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Ortopedia Pediatrica TACHDJIAN 1.pdf',
      newName: '2008 - Herring, John A. - Tachdjian Ortopedia Pediátrica - Tomo 1.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Ortopedia Pediatrica TACHDJIAN 2.pdf',
      newName: '2008 - Herring, John A. - Tachdjian Ortopedia Pediátrica - Tomo 2.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Ortopedia Pediatrica TACHDJIAN 3.pdf',
      newName: '2008 - Herring, John A. - Tachdjian Ortopedia Pediátrica - Tomo 3.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Ortopedia Pediatrica TACHDJIAN 4.pdf',
      newName: '2008 - Herring, John A. - Tachdjian Ortopedia Pediátrica - Tomo 4.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Miscione - Como Lo Hago En Ortopedia Y Traumatologia Pediatrica.pdf',
      newName: '2014 - Miscione, Horacio - Cómo Lo Hago en Ortopedia y Traumatología Pediátrica.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - null - Dismetría ossea.pdf',
      newName: '2012 - Isart Torruella, Anna - Dismetrías Óseas.pdf',
      multi: []
    },
    {
      oldName: 'S-F - Abdelgawad - Pediatric Orthopedics A Handbook for Primary Care Physicians.pdf',
      newName: '2014 - Abdelgawad, Amr - Pediatric Orthopedics A Handbook for Primary Care Physicians.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Gregorio Benito - Traumatologia infantil.pdf',
      newName: '2011 - Benito, Gregorio - Traumatología Infantil.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Ortopedia Pediátrica.pdf',
      newName: '2006 - Staheli, Lynn T. - Ortopedia Pediátrica Principios Básicos.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Ortopedia Infantil. Conceptos Básicos - M. Luz Couce Pico.pdf',
      newName: '2010 - Couce Pico, M. Luz - Ortopedia Infantil Conceptos Básicos.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Guia Familiar para Cirugia Ortopedica Pediatrica.pdf',
      newName: '2016 - S-A - Guía Familiar para Cirugía Ortopédica Pediátrica.pdf',
      multi: []
    },
    {
      oldName: 'S-F - Mencio - Greenu2019s Skeletal Trauma in Children.pdf',
      newName: '2015 - Mencio, Gregory A. - Green\'s Skeletal Trauma in Children - Ed. 5.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Julio de Pablos Pedro Gónzález Herranz - FRACTURAS INFANTILES CONCEPTOS Y PRINCIPIOS.pdf',
      newName: '2000 - de Pablos, Julio - Fracturas Infantiles Conceptos y Principios.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Reservados todos los derechos.pdf',
      newName: '2006 - Minguella, Joan - Conceptos Básicos de Ortopedia Infantil - Ed. 2.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Sepúlveda O. - Compendio de Diagnos y Manejo de Traumatologia en Pediatría.pdf',
      newName: '2018 - Sepúlveda O., Matías - Paediatrics Traumatology A Comprehensive Guide.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - ORTOPEDIA INFANTIL para RESIDENTES.pdf',
      newName: '2015 - de Pablos, Julio - Ortopedia Infantil para Residentes.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Martinez Caballero - Ortopedia y Traumatologia Infantil.pdf',
      newName: '2016 - Martínez Caballero, Ignacio - Ortopedia y Traumatología Infantil.pdf',
      multi: []
    },
    {
      oldName: 'AAOS-Problemas-de-cadera-ortopedia-infantil-pdf.pdf',
      newName: '2005 - AAOS-SECOT - Problemas de Cadera en Ortopedia Infantil.pdf',
      multi: ['Cadera y Pelvis', 'Libros']
    },
    {
      oldName: 'Joan Minguella-Conceptos-Basicos-de-Ortopedia-Infantil.pdf',
      newName: '2006 - Minguella, Joan - Conceptos Básicos de Ortopedia Infantil.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Casos clñnicos en ortopedia infantil para pediatras.pdf',
      newName: '2017 - González Herranz, Pedro - Casos Clínicos en Ortopedia Infantil para Pediatras.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Skeletal Injury in the Child Third Edition.pdf',
      newName: '2000 - Ogden, John A. - Skeletal Injury in the Child - Ed. 3.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - DePuy Synthes - Expert ALFN Adolescent Lateral Entry Femoral Nail Surgical Technique.pdf',
      newName: '2016 - DePuy Synthes - Expert ALFN Adolescent Lateral Entry Femoral Nail Surgical Technique.pdf',
      multi: ['Catálogos de Materiales ortopédicos', 'Femur']
    },
    {
      oldName: 'S-F - S-A - Problemas de cadera en ortopedia infantil.pdf',
      newName: '2005 - Monografías AAOS-SECOT - Problemas de Cadera en Ortopedia Infantil Monografía.pdf',
      multi: ['Cadera y Pelvis', 'Libros']
    },
    {
      oldName: 'S-F - Martinez Martín - Osteotomia desrotadora de tibia distal.pdf',
      newName: '2015 - Martínez Martín, J. - Osteotomía Desrotadora de Tibia Distal en Niños.pdf',
      multi: ['Rodilla y Tibia', 'Abordajes']
    }
  ];

  for (const act of actions) {
    const oldPath = path.join(PED_DIR, act.oldName);
    const newPath = path.join(PED_DIR, act.newName);

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

  console.log('--- FASE 4: INDEXACIÓN CRIPTOGRÁFICA EN GLOBAL REGISTRY ---');
  const items = fs.readdirSync(PED_DIR, { withFileTypes: true });
  const finalFiles = items.filter(i => i.isFile() && !i.name.startsWith('.') && i.name !== 'desktop.ini');
  let indexed = 0;

  for (const f of finalFiles) {
    const fp = path.join(PED_DIR, f.name);
    const hash = await computeStreamHash(fp);
    if (hash && !reg.hashes[hash]) {
      reg.hashes[hash] = {
        folder: 'Ortopedia Pediatrica',
        canonicalName: f.name,
        path: 'Ortopedia Pediatrica/' + f.name
      };
      indexed++;
    }
  }

  fs.writeFileSync(REG_PATH, JSON.stringify(reg, null, 2), 'utf8');
  console.log(`Fase 4 completada: ${indexed} nuevos hashes indexados en global_registry.json.`);
  console.log(`Archivos finales en la raíz de Ortopedia Pediatrica: ${finalFiles.length}`);
}

run();
