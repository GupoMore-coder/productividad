const fs = require('fs');
const path = require('path');
const { computeSha256, globalRegistry, saveGlobalRegistry } = require('../bibliotecario_engine/frugal_engine.cjs');

const ROOT = 'H:\\Mi unidad\\Información Ortopedia';
const FOLDER = path.join(ROOT, 'Videos Academicos');

const operations = [
  {
    old: 'AO TRAUMA FEMUR PROXIMAL FRACTURES. INTRAMEDULLARY FIXATION USING THE TFN.ADVANCE TFNA PROXIMAL FEMORAL MAILING SYSTEM.mp4',
    new: 'AO Trauma - Proximal Femur Fractures Intramedullary Fixation Using TFNA System.mp4'
  },
  {
    old: 'AO___Internal_Fixation_with_Screws_and_Plates_Prov.mp4',
    new: 'AO Trauma - Internal Fixation with Screws and Plates.mp4'
  },
  {
    old: 'AO_Direct_and_indirect_reduction_techniques_mp4.mp4',
    new: 'AO Trauma - Direct and Indirect Reduction Techniques.mp4'
  },
  {
    old: 'AO_distal_radius_intraarticular_fracture_fixation_.mp4',
    new: 'AO Trauma - Distal Radius Intraarticular Fracture Fixation.mp4'
  },
  {
    old: 'AO_humerus_proximal_fixation_with_PHILOS_plate_mp4.mp4',
    new: 'AO Trauma - Proximal Humerus Fixation with PHILOS Plate.mp4'
  },
  {
    old: 'AO_Tibia___Fracture___Intramedullary_Nailing_with_.mp4',
    new: 'AO Trauma - Tibia Fracture Intramedullary Nailing with Expert Tibial Nail.mp4'
  },
  {
    old: 'AO_trauma_Distal_radius_fracture_reverse_Barton__p.mp4',
    new: 'AO Trauma - Distal Radius Fracture Reverse Barton Fixation.mp4'
  },
  {
    old: 'AO_Trauma_Pediatric_Femur_Proximal_Sub_trochanteri.mp4',
    new: 'AO Trauma - Pediatric Proximal Femur Subtrochanteric Fracture.mp4'
  },
  {
    old: 'AO_Trauma_Tibia__Distal_Triplane_Fracture_Fixation.mp4',
    new: 'AO Trauma - Pediatric Distal Tibia Triplane Fracture Fixation.mp4'
  },
  {
    old: 'AO_workshop_in_ESIN_in_pediatric_mp4.mp4',
    new: 'AO Trauma - Workshop in ESIN in Pediatric Fractures.mp4'
  },
  {
    old: 'AOTrauma____Tibia__Distal_Pilon_Fracture_type_43_C.mp4',
    new: 'AO Trauma - Distal Tibia Pilon Fracture Type 43-C Fixation.mp4'
  },
  {
    old: 'Arthroscopic_Anatomy_of_the_Shoulder___Orthopaedic.mp4',
    new: 'Arthroscopic Anatomy of the Shoulder.mp4'
  },
  {
    old: 'Calcaneus___Comminuted_Fractures___Open_Reduction_.mp4',
    new: 'AO Trauma - Calcaneus Comminuted Fractures Open Reduction and Fixation.mp4'
  },
  {
    old: 'Constanza Moreno - Abordajes de radio distal.mp4',
    new: 'Moreno, Constanza - Abordajes de Radio Distal.mp4'
  },
  {
    old: 'Dr Alberto Rojas- Abordaje de humero proximal.mp4',
    new: 'Rojas, Alberto - Abordaje de Húmero Proximal.mp4'
  },
  {
    old: 'Dr Alvaro Caicedo - Abordajes Quirúrgicos en Codo.mp4',
    new: 'Caicedo, Álvaro - Abordajes Quirúrgicos en Codo.mp4'
  },
  {
    old: 'Dr Carlos Torres - Principios quirurgico en colgajos.mp4',
    new: 'Torres, Carlos - Principios Quirúrgicos en Colgajos.mp4'
  },
  {
    old: 'Dr Ezequiel Zaidenberg - Colgajos de Mano.mp4',
    new: 'Zaidenberg, Ezequiel - Colgajos de Mano.mp4'
  },
  {
    old: 'Dr Hugo Rojas - Abordajes MIPO en el Miembro Superior.mp4',
    new: 'Rojas, Hugo - Abordajes MIPO en el Miembro Superior.mp4'
  },
  {
    old: 'Fixation_Using_the_LCP_Pediatric_Hip_Plate_130__mp.mp4',
    new: 'AO Trauma - Fixation Using the LCP Pediatric Hip Plate 130.mp4'
  },
  {
    old: 'Humerus__Distal___Fracture_13C3___Fixation_with_VA.mp4',
    new: 'AO Trauma - Distal Humerus Fracture 13C3 Fixation with VA-LCP.mp4'
  },
  {
    old: 'Knee___Articular_Fracture___Large_External_Fixator.mp4',
    new: 'AO Trauma - Knee Articular Fracture Large External Fixator.mp4'
  },
  {
    old: 'Minimally_Invasive_Plantar_Fasciitis__Heel_Spur_Su.mp4',
    new: 'Minimally Invasive Plantar Fasciitis and Heel Spur Surgery.mp4'
  },
  {
    old: 'Pelvis___Pelvic_Ring_Instability___Large_External_.mp4',
    new: 'AO Trauma - Pelvic Ring Instability Large External Fixator.mp4'
  },
  {
    old: 'Pelvis___Sacroiliac_Joint_and_Pubic_Symphysis_Disr.mp4',
    new: 'AO Trauma - Pelvis Sacroiliac Joint and Pubic Symphysis Disruption Fixation.mp4'
  },
  {
    old: 'Planeamiento con Bonesetter.mp4',
    new: 'Planeamiento Quirúrgico con Bonesetter.mp4'
  },
  {
    old: 'Radius__Distal___Intraarticular_Fracture_Fixation_.mp4',
    new: 'AO Trauma - Distal Radius Intraarticular Fracture Fixation with LCP.mp4'
  },
  {
    old: 'Radius_and_Ulna_Short_Oblique_Shaft_Fractures__Inc.mp4',
    new: 'AO Trauma - Radius and Ulna Shaft Fractures Fixation.mp4'
  },
  {
    old: 'Systematic_Interpretation_of_Shoulder_MRI__How_I_d.mp4',
    new: 'Systematic Interpretation of Shoulder MRI.mp4'
  },
  {
    old: 'The_Basics_of_Shoulder_Arthroscopy_mp4.mp4',
    new: 'The Basics of Shoulder Arthroscopy.mp4'
  },
  {
    old: 'TOTAL KNEE REPLACEMENT. LIVE SURGERY.mp4',
    new: 'Total Knee Replacement Live Surgery.mp4'
  }
];

// PDF en subdirectorio de Curso IA
const subOperations = [
  {
    subDir: 'Curso IA aplicada a la ortopedia y traumatologia',
    old: '26_000_SCHOT_M1_webinar.pdf',
    new: '2024 - SCHOT - Inteligencia Artificial Aplicada a la Ortopedia y Traumatología Módulo 1.pdf'
  }
];

async function execute() {
  console.log('=== INICIANDO EJECUCIÓN VIDEOS ACADEMICOS ===');
  let renamed = 0;

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
      folder: 'Videos Academicos'
    };
  }

  for (const sub of subOperations) {
    const srcPath = path.join(FOLDER, sub.subDir, sub.old);
    const destPath = path.join(FOLDER, sub.subDir, sub.new);
    if (fs.existsSync(srcPath)) {
      fs.renameSync(srcPath, destPath);
      console.log(`[RENOMBRADO SUBDIR] ${sub.old} -> ${sub.new}`);
      renamed++;
    }
  }

  saveGlobalRegistry(globalRegistry);
  console.log(`=== VIDEOS ACADÉMICOS FINALIZADO: ${renamed} renombrados y registrados ===`);
}

execute();
