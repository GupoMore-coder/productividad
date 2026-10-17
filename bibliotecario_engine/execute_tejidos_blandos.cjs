const fs = require('fs');
const path = require('path');
const { computeSha256, globalRegistry, saveGlobalRegistry } = require('../bibliotecario_engine/frugal_engine.cjs');

const ROOT = 'H:\\Mi unidad\\Información Ortopedia';
const FOLDER = path.join(ROOT, 'Tejidos blandos');
const MUSIC_DEST = 'C:\\Users\\ferna\\Music';

// 1. Duplicados a trasladar a Música
const duplicatesToMove = [
  {
    oldName: '2016 - S-A - Infecciones del sistema musculoesquelético.pdf',
    backupName: '2016 - Swiss Orthopaedics - Infections of the Musculoskeletal System (Copia Duplicada de Tejidos blandos).pdf'
  },
  {
    oldName: 'S-F - Meani - Infection and Local Treatment in Orthopedic Surgery.pdf',
    backupName: '2007 - Meani, Enzo - Infection and Local Treatment in Orthopedic Surgery (Copia Duplicada de Tejidos blandos).pdf'
  }
];

// 2. Renombramientos y copias multi-tópico
const operations = [
  {
    old: '2018 - Alejandra PELÁEZ FLORES - Cierre de heridas y fasciotomias.pdf',
    new: '2018 - Peláez Flores, Alejandra - Cierre de heridas y fasciotomías Técnica cuerda de arco.pdf'
  },
  {
    old: '2020 - S-A - Diluted Povidone-Iodine Lavage in Total Hip and Knee Replacement A Retrospective Comparative study.pdf',
    new: '2022 - Tillet, Fernando - Lavado con povidona yodada diluida en reemplazo de cadera y rodilla.pdf',
    copies: ['Infeccioso', 'Cadera y Pelvis', 'Rodilla y Tibia']
  },
  {
    old: '2024 - Appelbaum RD - Antibiotic prophylaxis in injury.pdf',
    new: '2024 - Appelbaum, Rachel D. - Antibiotic prophylaxis in injury AAST critical care consensus.pdf',
    copies: ['Infeccioso']
  },
  {
    old: 'S-F - Hoyos - Terapia de presion negativa para manejo de incisiones quirurgicas Estado del arte y evidencia actual.pdf',
    new: '2017 - Gómez-Ortega, Viviana - Terapia de presión negativa para manejo de incisiones quirúrgicas Estado del arte y evidencia actual.pdf',
    copies: ['Infeccioso']
  },
  {
    old: 'S-F - S-A - Find 6 surgical videos on MediaCenter.thieme.com.pdf',
    new: '2016 - Kates, Stephen L. - Principles of Orthopedic Infection Management.pdf',
    copies: ['Infeccioso', 'Libros']
  },
  {
    old: '2022 - Gaviria-Pinzón JA. - Colgajos rómbicos.pdf',
    new: '2022 - Gaviria-Pinzón, J.A. - Colgajos rómbicos Reseña histórica, técnica quirúrgica y aplicaciones.pdf'
  },
  {
    old: '2023 - S-A - Fractura blisters.pdf',
    new: '2020 - Tosounidis, Theodoros H. - Fracture blisters pathophysiology and management.pdf'
  },
  {
    old: 'S-F - S-A - Estudio de rodilla.pdf',
    new: '2021 - Chen, Antonia F. - Management of Orthopaedic Infections A Practical Guide.pdf',
    copies: ['Infeccioso', 'Libros']
  },
  {
    old: 'S-F - S-A - Managing skin and soft tissue infections expert panel recommendations on key decision points.pdf',
    new: '2003 - Eron, L.J. - Managing skin and soft tissue infections expert panel recommendations.pdf',
    copies: ['Infeccioso']
  },
  {
    old: 'S-F - Smith - Estudio de Necrotizing Fasciitis.pdf',
    new: '2010 - Shimizu, Taro - Necrotizing Fasciitis.pdf',
    copies: ['Infeccioso']
  },
  {
    old: 'S-F - S-A - Practical Guide for Imaging of Soft Tissue Tumours.pdf',
    new: '2023 - Gupta, Harun - Practical Guide for Imaging of Soft Tissue Tumours.pdf',
    copies: ['Ortopedia Oncologica', 'Libros']
  },
  {
    old: '2021 - Juerg Hodler - Diagnostic Imaging.pdf',
    new: '2021 - Hodler, Juerg - Musculoskeletal Diseases 2021-2024 Diagnostic Imaging - IDKD Book.pdf',
    copies: ['Libros']
  },
  {
    old: '2025 - Tang, Jin Bo - Extensor Tendon Repairs Consensus Current Guidelines and Recommendations.pdf',
    new: '2025 - Tang, Jin Bo - Extensor Tendon Repairs Consensus Current Guidelines and Recommendations.pdf',
    copies: ['Mano']
  }
];

async function execute() {
  console.log('=== INICIANDO EJECUCIÓN TEJIDOS BLANDOS ===');

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
      folder: 'Tejidos blandos'
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
  console.log(`=== TEJIDOS BLANDOS FINALIZADO: ${renamed} renombrados, 2 duplicados movidos, ${copied} copias multi-tópico creadas ===`);
}

execute();
