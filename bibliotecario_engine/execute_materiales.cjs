const fs = require('fs');
const path = require('path');
const { computeSha256, globalRegistry, saveGlobalRegistry } = require('../bibliotecario_engine/frugal_engine.cjs');

const ROOT = 'H:\\Mi unidad\\Información Ortopedia';
const FOLDER = path.join(ROOT, 'Materiales Osteosintesis');

const operations = [
  {
    old: '2010 - Cronier - Orthopaedics & Traumatology.pdf',
    new: '2010 - Cronier, P. - The concept of locking plates.pdf'
  },
  {
    old: '2011 - Ballester Alfaro - Regeneración ósea. Biomateriales, sustitutos óseos y sustitutos del injerto óseo.pdf',
    new: '2011 - Ballester Alfaro, Juan José - Regeneración ósea. Biomateriales, sustitutos óseos y sustitutos del injerto óseo.pdf'
  },
  {
    old: '2018 - S-A - Plating of Fractures.pdf',
    new: '2018 - MacLeod, Alisdair R. - Pre-operative planning for fracture fixation using locking plates device configuration and other considerations.pdf'
  },
  {
    old: '2020 - Monaco, Edoardo - Patellar Fracture Fixation Using Suture Tape Cerclage.pdf',
    new: '2020 - Monaco, Edoardo - Patellar Fracture Fixation Using Suture Tape Cerclage.pdf',
    copyTo: 'Rodilla y Tibia'
  },
  {
    old: '2020 - S-A - Distal locking options for short cephalomedullary nails in pertrochanteric hip fractures.pdf',
    new: '2020 - Buruian, Alexei - Distal interlocking for short trochanteric nails static dynamic or no locking Review of the literature and decision algorithm.pdf',
    copyTo: 'Cadera y Pelvis'
  },
  {
    old: '2020 - S-A - Sindrome de implantacion de cemento osteo.pdf',
    new: '2020 - Rueda, Guillermo - Síndrome Postcementación Ósea Serie de Casos.pdf'
  },
  {
    old: 'Orthobiologics & Metabolomics.pdf',
    new: '2018 - S-A - Orthobiologics and Metabolomics.pdf',
    copyTo: 'Metabolismo Óseo'
  },
  {
    old: 'S-F - Cirstoiu - Orthopedic Biomaterials - From Materials Science to Clinical Applications.pdf',
    new: '2017 - Antoniac, Iulian - Orthopedic Biomaterials From Materials Science to Clinical Applications.pdf',
    copyTo: 'Libros'
  },
  {
    old: 'S-F - null - Estudio de rodilla.pdf',
    new: '2014 - de Froidmont, Sébastien - Postmortem Findings in Bone Cement Implantation Syndrome–Related Deaths.pdf'
  },
  {
    old: 'S-F - S-A - ORTHOPAEDIC BIOMATERIALS IN RESEARCH AND PRACTICE.pdf',
    new: '2014 - Ong, Kevin L. - Orthopaedic Biomaterials in Research and Practice - Ed. 2.pdf',
    copyTo: 'Libros'
  },
  {
    old: 'S-F - S-A - Practice of Intramedullary Locked Nails New Developments in Techniques and Applications.pdf',
    new: '2006 - Leung, Kwok-Sui - Practice of Intramedullary Locked Nails New Developments in Techniques and Applications.pdf',
    copyTo: 'Libros'
  }
];

async function execute() {
  console.log('=== INICIANDO EJECUCIÓN MATERIALES OSTEOSINTESIS ===');
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
      }
      continue;
    }

    if (srcPath !== destPath) {
      fs.renameSync(srcPath, destPath);
      console.log(`[RENOMBRADO] ${op.old} -> ${op.new}`);
      renamed++;
    }

    const hash = computeSha256(destPath);
    globalRegistry.hashes[hash] = {
      path: path.relative(ROOT, destPath),
      canonicalName: op.new,
      folder: 'Materiales Osteosintesis'
    };

    if (op.copyTo) {
      const targetDir = path.join(ROOT, op.copyTo);
      if (fs.existsSync(targetDir)) {
        const copyPath = path.join(targetDir, op.new);
        if (!fs.existsSync(copyPath)) {
          fs.copyFileSync(destPath, copyPath);
          console.log(`  -> [COPIA MULTI-TÓPICO] Creada en ${op.copyTo}/${op.new}`);
          copied++;
        } else {
          console.log(`  -> [COPIA MULTI-TÓPICO YA EXISTE] en ${op.copyTo}`);
        }
      } else {
        console.warn(`  -> [ALERTA] Carpeta destino ${op.copyTo} no existe`);
      }
    }
  }

  saveGlobalRegistry(globalRegistry);
  console.log(`=== MATERIALES OSTEOSINTESIS FINALIZADO: ${renamed} renombrados, ${copied} copias multi-tópico ===`);
}

execute();
