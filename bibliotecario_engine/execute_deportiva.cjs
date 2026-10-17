const fs = require('fs');
const path = require('path');
const { computeSha256, globalRegistry, saveGlobalRegistry } = require('../bibliotecario_engine/frugal_engine.cjs');

const ROOT = 'H:\\Mi unidad\\Información Ortopedia';
const FOLDER = path.join(ROOT, 'Ortopedia Deportiva y artroscopia');
const MUSIC_DEST = 'C:\\Users\\ferna\\Music';

// 1. Duplicados a trasladar a Música (con copyFileSync + unlinkSync para salvar EXDEV)
const duplicatesToMove = [
  {
    oldName: 'S-F - DeLee - DeLees Ortopedia Deportiva Principios y Practica.pdf',
    backupName: '2020 - Miller, Mark D. - DeLee, Drez, and Millers Orthopaedic Sports Medicine - Ed. 5 (Copia Duplicada de Deportiva).pdf'
  }
];

// 2. Operaciones de renombramiento y copias multi-tópico
const operations = [
  {
    old: '2020 DeLee, Drez and Miller’s Orthopaedic Sports Medicine 5ed.pdf',
    new: '2020 - Miller, Mark D. - DeLee, Drez, and Millers Orthopaedic Sports Medicine Principles and Practice - Ed. 5.pdf',
    copies: ['Libros']
  },
  {
    old: '2010 Master techniques in orthopaedic surgery Sports medicine.pdf',
    new: '2010 - Fu, Freddie H. - Master Techniques in Orthopaedic Surgery Sports Medicine.pdf',
    copies: ['Libros']
  },
  {
    old: '2009 - Gartsman - Shoulder arthroscopy.pdf',
    new: '2009 - Gartsman, Gary M. - Shoulder Arthroscopy - Ed. 2.pdf',
    copies: ['Hombro', 'Libros']
  },
  {
    old: '2010 - Sargent - PEDIATRIC SPORTS INJURIES OVERUSE INJURIES & OVERTRAINING ISSUES.pdf',
    new: '2010 - Sargent, M. Cathy - Pediatric Sports Injuries Overuse Injuries and Overtraining Issues.pdf',
    copies: ['Ortopedia Pediatrica']
  },
  {
    old: '2014 - Sgaglione, Nicholas A. - Sports Injuries of the Knee Surgical Approaches.pdf',
    new: '2014 - Sgaglione, Nicholas A. - Sports Injuries of the Knee Surgical Approaches.pdf',
    copies: ['Rodilla y Tibia']
  },
  {
    old: '2015 - Aguilella - Tratamiento artroscópico de la inestabilidad del hombro. Conceptos actuales.pdf',
    new: '2015 - Aguilella, Lluís - Tratamiento artroscópico de la inestabilidad del hombro Conceptos actuales.pdf',
    copies: ['Hombro']
  },
  {
    old: '2023 - Kean - The Segond fracture A narrative review of the anatomy, biomechanics and clinical implications.pdf',
    new: '2023 - Phua, Sean Kean Ann - The Segond fracture A narrative review of anatomy, biomechanics and clinical implications.pdf',
    copies: ['Rodilla y Tibia']
  },
  {
    old: '2023 - Mehl - Dynamic Anterior Shoulder Stabilization With the Long Head of the Biceps Tendon A Biomechanical Study.pdf',
    new: '2019 - Mehl, Julian - Dynamic Anterior Shoulder Stabilization With the Long Head of the Biceps Tendon.pdf',
    copies: ['Hombro']
  },
  {
    old: 'Artroscopia Quirúrgica - McGinty.pdf',
    new: '2005 - McGinty, John B. - Artroscopia Quirúrgica Obra Completa.pdf',
    copies: ['Libros']
  },
  {
    old: 'S-F - McGinty - Artroscopia Q U IRÚ RGICA - A - i i ’ S I.pdf',
    new: '2005 - McGinty, John B. - Artroscopia Quirúrgica - Vol. 1 Principios Básicos y Hombro.pdf',
    copies: ['Hombro', 'Libros']
  },
  {
    old: 'Injection Techniques in Orthopaedics And Sports Medicine.pdf',
    new: '2012 - Saunders, Stephanie - Injection Techniques in Orthopaedic and Sports Medicine - Ed. 4.pdf',
    copies: ['Libros']
  },
  {
    old: 'Operative Techniques in Sports Medicine Surgery.pdf',
    new: '2011 - Miller, Mark D. - Operative Techniques in Sports Medicine Surgery.pdf',
    copies: ['Libros']
  },
  {
    old: 'S-F - Achalandabaso - La inestabilidad anterior de hombro La selección del tratamiento artroscópico.pdf',
    new: '1998 - Achalandabaso, José - La inestabilidad anterior de hombro Selección del tratamiento artroscópico.pdf',
    copies: ['Hombro']
  },
  {
    old: 'S-F - Insall & Scott - Surgery of the KNEE.pdf',
    new: '2018 - Scott, W. Norman - Insall and Scott Surgery of the Knee - Ed. 6.pdf',
    copies: ['Rodilla y Tibia', 'Libros']
  },
  {
    old: 'S-F - Neyret - Specific Sports-Related Injuries.pdf',
    new: '2021 - Neyret, Philippe - Specific Sports-Related Injuries.pdf',
    copies: ['Libros']
  },
  {
    old: 'S-F - Randelli - Arthroscopy.pdf',
    new: '2016 - Randelli, Pietro - Arthroscopy Basic to Advanced.pdf',
    copies: ['Libros']
  },
  {
    old: 'S-F - Rosenberg - ACL Reconstruction with the ACUFEX Director Drill Guide and ENDOBUTTON CL Fixation System.pdf',
    new: '2003 - Rosenberg, Thomas D. - ACL Reconstruction with the ACUFEX Director Drill Guide and ENDOBUTTON CL Fixation System.pdf',
    copies: ['Rodilla y Tibia', 'Materiales Osteosintesis']
  },
  {
    old: 'S-F - S-A - Revisión y categorización de la patología por sobreuso en el niño futbolista.pdf',
    new: '2005 - Bourdoncle, Fernando - Revisión y categorización de la patología por sobreuso en el niño futbolista.pdf',
    copies: ['Ortopedia Pediatrica']
  },
  {
    old: 'Starkey_Brown_Ryan_Patologia_Ortopedica_y_Lesiones_Deportivas.pdf',
    new: '2013 - Starkey, Chad - Patología Ortopédica y Lesiones Deportivas - Ed. 3.pdf',
    copies: ['Libros']
  }
];

async function execute() {
  console.log('=== INICIANDO EJECUCIÓN ORTOPEDIA DEPORTIVA Y ARTROSCOPIA ===');

  // Mover duplicados
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
      folder: 'Ortopedia Deportiva y artroscopia'
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
  console.log(`=== ORTOPEDIA DEPORTIVA FINALIZADO: ${renamed} renombrados, 1 duplicado (110MB) movido a Música, ${copied} copias multi-tópico creadas ===`);
}

execute();
