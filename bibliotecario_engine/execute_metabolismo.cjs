const fs = require('fs');
const path = require('path');
const { computeSha256, globalRegistry, saveGlobalRegistry } = require('../bibliotecario_engine/frugal_engine.cjs');

const ROOT = 'H:\\Mi unidad\\Información Ortopedia';
const FOLDER = path.join(ROOT, 'Metabolismo Óseo');
const MUSIC_DEST = 'C:\\Users\\ferna\\Music';

// 1. Duplicados a trasladar a Música
const duplicatesToMove = [
  {
    oldName: 'El_hueso_en_las_enfermedades_endocrinas.pdf',
    backupName: '2014 - Gómez Sáez, José Manuel - El hueso en las enfermedades endocrinas (Copia Duplicada de Metabolismo).pdf'
  }
];

// 2. Operaciones de renombramiento y copias multi-tópico
const operations = [
  {
    old: 'S-F - Gómez Sáez - El hueso en las enfermedades endocrinas y nutricionales.pdf',
    new: '2014 - Gómez Sáez, José Manuel - El hueso en las enfermedades endocrinas y nutricionales.pdf',
    copies: ['Libros']
  },
  {
    old: 'S-F - Vargas - Estudio de rodilla.pdf',
    new: '2020 - Vargas, Javiera - Fragilidad en busca de herramientas de evaluación preoperatoria.pdf'
  },
  {
    old: 'S-F - S-A - Estudio de rodilla.pdf',
    new: '2018 - Bustamante, Jorge Luis - Atlas de Osteología Humana por Tomografía Computada Tridimensional.pdf',
    copies: ['Libros']
  },
  {
    old: '2022 - S-A - Sociedad Española de Cirugía Ortopédica y Traumatología, SECOT.pdf',
    new: '2022 - Baixauli García, Francisco - Guía SECOT-SEGG de Osteoporosis y Fractura por Fragilidad - Ed. 2.pdf'
  },
  {
    old: 'S-F - Dr. Francisco Toquero de la Torre, Dra. Cristina Carbonell Abella, Dr. Juan Antonio Martín Jiménez, Dra. Carmen Valdés y Llorca - Guía de Buena Práctica Clínica en Osteoporosis.pdf',
    new: '2004 - Toquero de la Torre, Francisco - Guía de Buena Práctica Clínica en Osteoporosis.pdf'
  },
  {
    old: 'Osteoporosis - Robert Marcus   (4° Edition).pdf',
    new: '2013 - Marcus, Robert - Osteoporosis - Ed. 4.pdf',
    copies: ['Libros']
  },
  {
    old: 'S-F - Bartl - Osteoporosis in Clinical Practice.pdf',
    new: '2009 - Bartl, Reiner - Osteoporosis in Clinical Practice.pdf',
    copies: ['Libros']
  },
  {
    old: 'S-F - Shimada - Osteoporosis in Orthopedics.pdf',
    new: '2015 - Shimada, Yoichi - Osteoporosis in Orthopedics.pdf',
    copies: ['Libros']
  },
  {
    old: '2015 - Aguirre - SOCIEDAD ECUATORIANA DE METABOLISMO MINERAL OSTEOPOROSIS.pdf',
    new: '2015 - Aguirre, W. - Osteoporosis Guías de Práctica Clínica SEMMO.pdf'
  },
  {
    old: 'S-F - S-A - Guia de Practica Clinica sobre Osteoporosis y Prevencion de Fracturas por Fragilidad.pdf',
    new: '2010 - Guías SNS - Guía de Práctica Clínica sobre Osteoporosis y Prevención de Fracturas por Fragilidad.pdf'
  },
  {
    old: '2010 - S-A - Guía de pr¬ctica clínica osteoporosis.pdf',
    new: '2010 - SECOT - Guía de Práctica Clínica Osteoporosis.pdf'
  },
  {
    old: 'S-F - M.a ElEna MartínEz - Manual de osteoporosis.pdf',
    new: '2013 - Martínez, M.ª Elena - Manual de osteoporosis.pdf'
  },
  {
    old: 'S-F - Riancho Moral - Manual Práctico de Osteoporosis y Enfermedades del Metabolismo Mineral.pdf',
    new: '2004 - Riancho Moral, José A. - Manual Práctico de Osteoporosis y Enfermedades del Metabolismo Mineral.pdf',
    copies: ['Libros']
  },
  {
    old: 'Manual de Osteología - Zaíd Lagunas Rodríguez.pdf',
    new: '2000 - Lagunas Rodríguez, Zaíd - Manual de osteología antropológica.pdf',
    copies: ['Libros']
  },
  {
    old: 'Tratado de Osteopatía - Ricard _ Sallé (3° Edición).pdf',
    new: '2003 - Ricard, François - Tratado de Osteopatía - Ed. 3.pdf',
    copies: ['Libros']
  },
  {
    old: 'S-F - Curtil Philippe - Tratado Práctico de Osteopatía Estructural.pdf',
    new: '2002 - Curtil, Philippe - Tratado Práctico de Osteopatía Estructural Pelvis-columna vertebral.pdf',
    copies: ['Libros']
  },
  {
    old: 'S-F - S-A - Principios de osteopatia.pdf',
    new: '2000 - Medina Ortega, Pedro - Tratado de Osteopatía Pelvis y Extremidades Inferiores.pdf',
    copies: ['Libros']
  },
  {
    old: '2021 - Anam, MD - Osteoporosis Screening and Management.pdf',
    new: '2021 - Anam, Anika K. - Update on Osteoporosis Screening and Management.pdf'
  },
  {
    old: '2023 - Vielma-Guevara - Tratamiento de la osteoporosis.pdf',
    new: '2023 - Vielma-Guevara, J.R. - Tratamiento de la osteoporosis.pdf'
  },
  {
    old: '2026 - Iglesias-Gamarra, Antonio - Enfermedades Metabolicas Oseas.pdf',
    new: '2026 - Iglesias-Gamarra, Antonio - Enfermedades Metabolicas Oseas.pdf',
    copies: ['Libros']
  }
];

async function execute() {
  console.log('=== INICIANDO EJECUCIÓN METABOLISMO ÓSEO ===');

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
      folder: 'Metabolismo Óseo'
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
  console.log(`=== METABOLISMO ÓSEO FINALIZADO: ${renamed} renombrados, 1 duplicado (15MB) movido a Música, ${copied} copias multi-tópico creadas ===`);
}

execute();
