const fs = require('fs');
const path = require('path');
const { computeSha256, globalRegistry, saveGlobalRegistry } = require('../bibliotecario_engine/frugal_engine.cjs');

const ROOT = 'H:\\Mi unidad\\Información Ortopedia';
const FOLDER = path.join(ROOT, 'AO 2018');
const MUSIC_DEST = 'C:\\Users\\ferna\\Music';

// 1. Duplicados redundantes a mover a Música (123 MB salvados)
const duplicatesToMove = [
  {
    oldName: 'S-F - S-A - Find 6 surgical videos on MediaCenter.thieme.com.pdf',
    backupName: '2016 - Kates, Stephen L. - Principles of Orthopedic Infection Management (Copia Duplicada 1 de AO 2018).pdf'
  },
  {
    oldName: 'S-F - S-A - Surgical videos.pdf',
    backupName: '2016 - Kates, Stephen L. - Principles of Orthopedic Infection Management (Copia Duplicada 2 de AO 2018).pdf'
  }
];

// 2. Renombramientos y copias multi-tópico
const operations = [
  {
    old: '2018 - S-A - FRACTURE AND DISLOCATION CLASSIFICATION COMPENDIUM.pdf',
    new: '2018 - Meinberg, EG - Fracture and Dislocation Classification Compendium AO-OTA.pdf',
    copies: ['Libros']
  },
  {
    old: '2018 - Kellam - Fracture and Dislocation Classification Compendium.pdf',
    new: '2018 - Meinberg, EG - AO-OTA Compendium 2018 Introduction and Principles.pdf'
  },
  {
    old: '2018 - S-A - Acetabulum Bone Pelvis 6 Location Pelvis, acetabulum 62 Types Pelvis, acetabulum, partial articular, isolated column andor wall fracture.pdf',
    new: '2018 - AO-OTA - Classification 62 Pelvis Acetabulum.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: '2018 - S-A - Guidelines for Classifying Fractures.pdf',
    new: '2018 - AO-OTA - Classification Guidelines and Appendix.pdf'
  },
  {
    old: '2018 - S-A - Clavicle.pdf',
    new: '2018 - AO-OTA - Classification 15 Clavicle.pdf',
    copies: ['Hombro']
  },
  {
    old: '2018 - S-A - Diagnostic and coding process Algorithm for morphologic classification Spine Bone.pdf',
    new: '2018 - AO-OTA - Classification 5 Spine.pdf',
    copies: ['Columna']
  },
  {
    old: '2018 - S-A - Scapula Bone.pdf',
    new: '2018 - AO-OTA - Classification 14 Scapula.pdf',
    copies: ['Hombro']
  },
  {
    old: '2018 - S-A - Femur, proximal end segment, trochanteric region fracture.pdf',
    new: '2018 - AO-OTA - Classification 31-33 Femur.pdf',
    copies: ['Femur']
  },
  {
    old: '2018 - S-A - Humerus.pdf',
    new: '2018 - AO-OTA - Classification 11-13 Humerus.pdf',
    copies: ['Humero']
  },
  {
    old: '2018 - S-A - Dislocations.pdf',
    new: '2018 - AO-OTA - Classification Dislocations.pdf'
  },
  {
    old: '2018 - S-A - Malleolar segment.pdf',
    new: '2018 - AO-OTA - Classification 44 Malleolar Segment.pdf',
    copies: ['Pie y Tobillo']
  },
  {
    old: '2018 - S-A - Hand and carpus Anatomical region.pdf',
    new: '2018 - AO-OTA - Classification 7 Hand and Carpus.pdf',
    copies: ['Mano']
  },
  {
    old: '2018 - S-A - Patella Bone.pdf',
    new: '2018 - AO-OTA - Classification 34 Patella.pdf',
    copies: ['Rodilla y Tibia']
  },
  {
    old: '2018 - S-A - Pelvic ring.pdf',
    new: '2018 - AO-OTA - Classification 61 Pelvic Ring.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: '2018 - S-A - J Orthop Trauma Volume 32 Number 1 Supplement.pdf',
    new: '2018 - AO-OTA - Classification 4 Fibula.pdf',
    copies: ['Rodilla y Tibia']
  },
  {
    old: '2018 - S-A - J Orthop Trauma Volume 32 Number 1 Supplement January.pdf',
    new: '2018 - AO-OTA - Classification 8 Foot.pdf',
    copies: ['Pie y Tobillo']
  },
  {
    old: '2018 - S-A - Radius and Ulna Bone.pdf',
    new: '2018 - AO-OTA - Classification 2 Radius and Ulna.pdf',
    copies: ['Mano', 'Codo']
  },
  {
    old: '2018 - S-A - Tibia.pdf',
    new: '2018 - AO-OTA - Classification 41-43 Tibia.pdf',
    copies: ['Rodilla y Tibia']
  },
  {
    old: 'AO Torax 2018.pdf',
    new: '2018 - AO-OTA - Classification 16 Thorax Ribs and Sternum.pdf'
  },
  {
    old: '2007 - S-A - AO Pediatric Comprehensive Classification of Long Bone Fractures.pdf',
    new: '2007 - Slongo, Audwin - AO Pediatric Comprehensive Classification of Long Bone Fractures PCCF.pdf',
    copies: ['Ortopedia Pediatrica']
  },
  {
    old: 'S-F - S-A - Unified Classification System for Periprosthetic Fractures.pdf',
    new: '2018 - Duncan, Clive P. - Unified Classification System for Periprosthetic Fractures UCPF.pdf',
    copies: ['Reconstructiva']
  },
  {
    old: 'AO UCS.pdf',
    new: '2014 - Duncan, Clive P. - Unified Classification System UCS Periprosthetic Fractures Guide.pdf',
    copies: ['Reconstructiva']
  },
  {
    old: 'AOOTA_Classification_2018_Info_Booklet_T12_18011901.pdf',
    new: '2018 - AO-OTA - Classification Compendium 2018 Revisions Info Booklet.pdf'
  },
  {
    old: 'LUXACIONES AO 2018.docx',
    new: '2018 - AO-OTA - Resumen de Clasificación de Luxaciones.docx'
  },
  {
    old: 'S-F - Campbell - AOTrauma Principles Course Preoperative planning.pdf',
    new: '2018 - Campbell, John - AOTrauma Principles Course Preoperative Planning.pdf'
  },
  {
    old: 'S-F - Emanuel Gautier - Manual del Participante Editor Científico para cirujanos de trauma ortopédico.pdf',
    new: '2015 - Gautier, Emanuel - Manual del Participante Laboratorio de Habilidades AO.pdf'
  },
  {
    old: 'S-F - Südkamp - Evaluation de la lesión de tejidos blandos y su influencia en la gestión de fracturas.pdf',
    new: '2018 - Südkamp, Norbert P. - Evaluación de la lesión de tejidos blandos y su influencia en la gestión de fracturas.pdf',
    copies: ['Tejidos blandos']
  },
  {
    old: 'Atlas AO MI1.pdf',
    new: 'Atlas de Osteosíntesis AO - Miembro Inferior - Vol. 1.pdf',
    copies: ['Libros']
  },
  {
    old: 'Atlas AO MI2.pdf',
    new: 'Atlas de Osteosíntesis AO - Miembro Inferior - Vol. 2.pdf',
    copies: ['Libros']
  },
  {
    old: 'PRINCIPIOS DE LA AO Español.pdf',
    new: '2003 - Rüedi, Thomas P. - Principios de la AO en el tratamiento de las fracturas.pdf',
    copies: ['Libros']
  }
];

async function execute() {
  console.log('=== INICIANDO EJECUCIÓN AO 2018 ===');

  // Mover duplicados a Música
  for (const dup of duplicatesToMove) {
    const srcPath = path.join(FOLDER, dup.oldName);
    const destPath = path.join(MUSIC_DEST, dup.backupName);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      fs.unlinkSync(srcPath);
      console.log(`[DUPLICADO MOVIDO A MÚSICA] ${dup.oldName} -> ${destPath}`);
    } else {
      console.log(`[DUPLICADO YA MOVIDO/NO ENCONTRADO] ${dup.oldName}`);
    }
  }

  let renamed = 0;
  let copied = 0;

  for (const op of operations) {
    const srcPath = path.join(FOLDER, op.old);
    const destPath = path.join(FOLDER, op.new);

    if (!fs.existsSync(srcPath)) {
      if (fs.existsSync(destPath)) {
        console.log(`[YA RENOMBRADO] ${op.new}`);
      } else {
        console.error(`[NO ENCONTRADO] ${op.old}`);
        continue;
      }
    } else {
      if (srcPath !== destPath) {
        fs.renameSync(srcPath, destPath);
        console.log(`[RENOMBRADO] ${op.old} -> ${op.new}`);
        renamed++;
      }
    }

    const hash = computeSha256(destPath);
    globalRegistry.hashes[hash] = {
      path: path.relative(ROOT, destPath),
      canonicalName: op.new,
      folder: 'AO 2018'
    };

    if (op.copies && op.copies.length > 0) {
      for (const targetFolder of op.copies) {
        const targetDir = path.join(ROOT, targetFolder);
        if (fs.existsSync(targetDir)) {
          const copyPath = path.join(targetDir, op.new);
          if (!fs.existsSync(copyPath)) {
            fs.copyFileSync(destPath, copyPath);
            console.log(`  -> [COPIA MULTI-TÓPICO] Creada en ${targetFolder}/${op.new}`);
            copied++;
          } else {
            console.log(`  -> [COPIA MULTI-TÓPICO YA EXISTE] en ${targetFolder}`);
          }
        } else {
          console.warn(`  -> [ALERTA] Carpeta destino ${targetFolder} no existe`);
        }
      }
    }
  }

  saveGlobalRegistry(globalRegistry);
  console.log(`=== AO 2018 FINALIZADO: ${renamed} renombrados, 2 duplicados (123MB) movidos a Música, ${copied} copias multi-tópico creadas ===`);
}

execute();
