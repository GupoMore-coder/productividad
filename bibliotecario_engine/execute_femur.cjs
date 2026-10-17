const fs = require('fs');
const path = require('path');

const ROOT = 'H:\\Mi unidad\\Información Ortopedia';
const FEMUR = path.join(ROOT, 'Femur');
const MUSIC_DEST = 'C:\\Users\\ferna\\Music';

// 1. DUPLICADOS A TRASLADAR A MÚSICA
const dupes = [
  {
    src: path.join(FEMUR, '2018 Principios quirúrgicos y biomecánicos de los métodos de fijación actual en el tratamiento de fracturas de Hoffa.pdf'),
    destName: '2018 - Colmenares Sandoval, Oscar - Fracturas de Hoffa Métodos de Fijación Actual (Copia Duplicada).pdf'
  },
  {
    src: path.join(FEMUR, '2021 - Raja - Swashbuckler approach for distal femur fractures A systematic review.pdf'),
    destName: '2022 - Raja, Balgovind S - Swashbuckler approach for distal femur fractures (Copia Duplicada).pdf'
  }
];

// 2. RENOMBRAMIENTO Y COPIAS MULTI-TÓPICO
const renames = [
  {
    old: 'S-F - Tornetta III, MD, Michael Sean Hillegass Kain, MD, William R. Creevy, MD - Diagnosis de fracturas de cadera.pdf',
    new: '2007 - Tornetta III, Paul - Diagnosis of Femoral Neck Fractures in Patients with a Femoral Shaft Fracture Improvement with a Standard Protocol.pdf',
    copyTo: 'Cadera y Pelvis'
  },
  {
    old: '2012 - Palm - Un nuevo algoritmo para la cirugía de fracturas de cadera.pdf',
    new: '2012 - Palm, Henrik - Un nuevo algoritmo para la cirugía de fracturas de cadera.pdf',
    copyTo: 'Cadera y Pelvis'
  },
  {
    old: '2023 - Condell - UP-TO DATE REVIEW AND CASE REPORT Girdlestone resection arthroplasty of the hip a case series—outdated procedure or acceptable outcome.pdf',
    new: '2023 - Condell, Ross - Girdlestone resection arthroplasty of the hip (GRA) a case series—outdated procedure or acceptable outcome.pdf',
    copyTo: 'Cadera y Pelvis'
  },
  {
    old: '2020 - S-A - Distal locking options for short cephalomedullary nails in pertrochanteric hip fractures.pdf',
    new: '2020 - Buruian, Alexei - Distal interlocking for short trochanteric nails static, dynamic or no locking Review of the literature and decision algorithm.pdf',
    copyTo: 'Cadera y Pelvis'
  },
  {
    old: '2018 - Colmenares Sandoval - Principios quirurgicos y biomecanicos de los metodos de fijacion actual en el tratamiento de fracturas de Hoffa.pdf',
    new: '2018 - Colmenares Sandoval, Oscar - Principios quirúrgicos y biomecánicos de los métodos de fijación actual en el tratamiento de fracturas de Hoffa.pdf',
    copyTo: 'Rodilla y Tibia'
  },
  {
    old: '2020 - Aynaguano-Perez - Fractura de Hoffa en el cóndilo femoral. Reporte de caso.pdf',
    new: '2018 - Aynaguano-Perez, Edison - Fractura de Hoffa en el cóndilo femoral. Reporte de caso.pdf',
    copyTo: 'Rodilla y Tibia'
  },
  {
    old: '2022  Swashbuckler approach for distal femur fractures A systematic review.pdf',
    new: '2022 - Raja, Balgovind S - Swashbuckler approach for distal femur fractures A systematic review.pdf',
    copyTo: 'Rodilla y Tibia'
  },
  {
    old: '2024 - Babhulkar - Current Concepts in Management of Distal Femur Fractures.pdf',
    new: '2024 - Babhulkar, Sushrut - Current Concepts in Management of Distal Femur Fractures.pdf',
    copyTo: 'Rodilla y Tibia'
  },
  {
    old: '2023 - Ammari Sánchez-Villanueva - Reemplazo de fémur total como tratamiento en condiciones no neoplásicas.pdf',
    new: '2023 - Ammari Sánchez-Villanueva, Daniel - Reemplazo de fémur total como tratamiento en condiciones no neoplásicas.pdf',
    copyTo: 'Reconstructiva'
  },
  {
    old: '2013 - Pennekamp - Técnicas quirúrgicas en Ortopedia y Traumatología.pdf',
    new: '2013 - Pennekamp, Peter H. - Resección y reconstrucción en tumores de fémur proximal Técnicas quirúrgicas.pdf',
    copyTo: 'Ortopedia Oncologica'
  },
  {
    old: 'S-F - S-A - Placa de osteotomía de fémur.pdf',
    new: '2018 - aap Implantate - Placa de Osteotomía de Fémur Técnica Quirúrgica Compresión-Bloqueo.pdf',
    copyTo: 'Materiales Osteosintesis'
  },
  {
    old: '2003 - Ostrum - Retrograde femoral nailing indications and techniques.pdf',
    new: '2003 - Ostrum, Robert F. - Retrograde femoral nailing Indications and techniques.pdf'
  },
  {
    old: '2013 - Abram - Inadequate ‘three-point’ proximal fixation predicts failure of the Gamma nail.pdf',
    new: '2013 - Abram, Simon G.F. - Inadequate three-point proximal fixation predicts failure of the Gamma nail.pdf'
  },
  {
    old: '2017 - Rikli - Optimizing intraoperative imaging during proximal femoral fracture fixation.pdf',
    new: '2018 - Rikli, Daniel - Optimizing intraoperative imaging during proximal femoral fracture fixation a performance improvement program.pdf'
  },
  {
    old: '2020 - Karayiannis - The Relationship Between Canal Diameter and the Dorr Classification.pdf',
    new: '2020 - Karayiannis, P.N. - The Relationship Between Canal Diameter and the Dorr Classification.pdf'
  },
  {
    old: '2023 - Fang - Should nails be locked dynamically or statically in atypical femoral fractures.pdf',
    new: '2023 - Fang, Christian - Should nails be locked dynamically or statically in atypical femoral fractures.pdf'
  }
];

function executeFemur() {
  console.log("=== INICIANDO EJECUCIÓN FÍSICA EN FEMUR ===");
  if (!fs.existsSync(MUSIC_DEST)) fs.mkdirSync(MUSIC_DEST, { recursive: true });

  // 1. Trasladar duplicados
  for (const d of dupes) {
    if (fs.existsSync(d.src)) {
      const dest = path.join(MUSIC_DEST, d.destName);
      fs.copyFileSync(d.src, dest);
      fs.unlinkSync(d.src);
      console.log(`  [Música] Duplicado trasladado: ${d.destName}`);
    } else {
      console.log(`  [Aviso] Duplicado no encontrado: ${d.src}`);
    }
  }

  // 2. Renombrar y copiar
  for (const r of renames) {
    const oldP = path.join(FEMUR, r.old);
    const newP = path.join(FEMUR, r.new);

    if (fs.existsSync(oldP)) {
      fs.renameSync(oldP, newP);
      console.log(`  [Femur] Renombrado: ${r.new}`);

      if (r.copyTo) {
        const destDir = path.join(ROOT, r.copyTo);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        const copyP = path.join(destDir, r.new);
        fs.copyFileSync(newP, copyP);
        console.log(`    -> Copia Multi-tópico enviada a [${r.copyTo}]`);
      }
    } else {
      console.log(`  [Aviso] Archivo no encontrado: ${r.old}`);
    }
  }

  console.log("=== EJECUCIÓN EN FEMUR COMPLETADA CON ÉXITO ===");
}

executeFemur();
