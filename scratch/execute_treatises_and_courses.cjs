const fs = require('fs');
const path = require('path');

const ROOT_DIR = 'H:\\Mi unidad\\Información Ortopedia';

const MAPPINGS = [
  // Libros
  {
    folder: 'Libros',
    oldName: '2015 - S-A - Abordajes en Cirugia Ortopedica_booksmedicos.org.pdf',
    newName: '2015 - Hoppenfeld, Stanley - Abordajes en Cirugía Ortopédica - Anatomía Quirúrgica.pdf'
  },
  // AO Masters
  {
    folder: 'Libros\\AO MASTERS',
    oldName: 'AO casts , splintage and bandages .pdf',
    newName: '2016 - AO Foundation - Casts, Splints and Bandages.pdf'
  },
  {
    folder: 'Libros\\AO MASTERS',
    oldName: 'AO-Soft tissue_2.pdf',
    newName: '2011 - Volgas, David - AO Manual of Soft Tissue Management.pdf'
  },
  {
    folder: 'Libros\\AO MASTERS',
    oldName: 'AO_ASIF_Principles_in_Spine_Surgery_Springer_Verlag_Berlin_Heidelberg.pdf',
    newName: '2000 - Aebi, Max - AO ASIF Principles in Spine Surgery.pdf'
  },
  {
    folder: 'Libros\\AO MASTERS',
    oldName: 'AO_Management_of_Limb_Injuries_During_disasters_and_conflicts_2.pdf',
    newName: '2016 - AO Foundation - Management of Limb Injuries During Disasters and Conflicts.pdf'
  },
  {
    folder: 'Libros\\AO MASTERS',
    oldName: 'AO_Manual_of_Fracture_Management_Internal_Fixators_Concepts_and.pdf',
    newName: '2006 - Krettek, Christian - AO Manual of Fracture Management - Internal Fixators.pdf'
  },
  {
    folder: 'Libros\\AO MASTERS',
    oldName: 'AO_Osteotomies_around_the_Knee_Indications_Planning_Surgical_Techniques.pdf',
    newName: '2008 - Lobenhoffer, Philipp - AO Osteotomies Around the Knee.pdf'
  },
  {
    folder: 'Libros\\AO MASTERS',
    oldName: 'AO_Spine_Manual_Principles_And_Techniques,_Clinical_Applications.pdf',
    newName: '2007 - Aebi, Max - AO Spine Manual - Principles and Techniques.pdf'
  },
  {
    folder: 'Libros\\AO MASTERS',
    oldName: 'AO_Spine_Textbook_Comprehensive_Overview_on_Surgical_Management.pdf',
    newName: '2020 - AO Spine - Comprehensive Overview on Surgical Management.pdf'
  },
  {
    folder: 'Libros\\AO MASTERS',
    oldName: 'Fractures of the Pelvis and Acetabulum Two Volume Set 4e.pdf',
    newName: '2015 - Tile, Marvin - Fractures of the Pelvis and Acetabulum (4th Ed).pdf'
  },
  {
    folder: 'Libros\\AO MASTERS',
    oldName: 'Internal_Fixation_of_Small_Fractures_Technique_Recommended_by_the.pdf',
    newName: '1998 - Heim, Urs - Internal Fixation of Small Fractures (AO ASIF).pdf'
  },
  {
    folder: 'Libros\\AO MASTERS',
    oldName: 'Leading_a_surgical_revolution_the_AO_Foundation_social_entrepreneurs.pdf',
    newName: '2018 - Schlich, Thomas - Leading a Surgical Revolution - The AO Foundation.pdf'
  },
  {
    folder: 'Libros\\AO MASTERS',
    oldName: 'Manual_of_Internal_Fixation_Techniques_Recommended_by_the_AO_Miiller.pdf',
    newName: '1991 - Müller, Maurice E. - Manual of Internal Fixation (3rd Ed).pdf'
  },
  {
    folder: 'Libros\\AO MASTERS',
    oldName: 'Manual_of_Internal_Fixation_Technique_Recommended_by_the_AO_muller.pdf',
    newName: '1991 - Müller, Maurice E. - Manual of Internal Fixation (AO ASIF v2).pdf'
  },
  {
    folder: 'Libros\\AO MASTERS',
    oldName: 'Osteotomies for Posttraumatic Deformities 2008.pdf',
    newName: '2008 - Marti, René K. - Osteotomies for Posttraumatic Deformities.pdf'
  },
  {
    folder: 'Libros\\AO MASTERS',
    oldName: 'Osteotomy_About_the_Knee_A_Comprehensive_Guide_2020,_Springer.pdf',
    newName: '2020 - Nakamura, Norimasa - Osteotomy About the Knee - A Comprehensive Guide.pdf'
  },
  {
    folder: 'Libros\\AO MASTERS',
    oldName: 'spinal cord rehab.pdf',
    newName: '2015 - Lin, Vernon - Spinal Cord Medicine - Principles and Practice.pdf'
  },
  // Libros Columna
  {
    folder: 'Libros\\LIBROS COLUMNA',
    oldName: '@MBS_MedicalBooksStore 2014 Textbook of the Cervical.pdf',
    newName: '2014 - Shen, Francis H. - Textbook of the Cervical Spine.pdf'
  },
  {
    folder: 'Libros\\LIBROS COLUMNA',
    oldName: 'Operative Techniques Spine Surgery Expert Consult Online_nodrm.pdf',
    newName: '2011 - Vaccaro, Alexander R. - Operative Techniques - Spine Surgery.pdf'
  },
  {
    folder: 'Libros\\LIBROS COLUMNA',
    oldName: 'spinal-injury-assessment-and-initial-management-pdf-1837447790533.pdf',
    newName: '2016 - NICE Guidelines - Spinal Injury Assessment and Initial Management.pdf'
  },
  {
    folder: 'Libros\\LIBROS COLUMNA\\MIS',
    oldName: 'Anatomic Approach MIS.pdf',
    newName: '2015 - Perez-Cruet, Mick J. - Anatomic Approach to Minimally Invasive Spine Surgery.pdf'
  },
  {
    folder: 'Libros\\LIBROS COLUMNA\\MIS',
    oldName: 'Endoscopic Procedures Spine.pdf',
    newName: '2019 - Kim, Jin-Sung - Endoscopic Procedures on the Spine.pdf'
  }
];

// Generar para Videos Academicos Curso IA
for (let c = 1; c <= 9; c++) {
  const cPad = String(c).padStart(2, '0');
  const fPath = `Videos Academicos\\Curso IA aplicada a la ortopedia y traumatologia\\Clase ${cPad}`;
  const diskFolder = path.join(ROOT_DIR, fPath);
  if (fs.existsSync(diskFolder)) {
    const files = fs.readdirSync(diskFolder).filter(f => f.endsWith('.pdf'));
    files.forEach(f => {
      MAPPINGS.push({
        folder: fPath,
        oldName: f,
        newName: `2024 - Curso IA - IA Aplicada a la Ortopedia y Traumatología - Clase ${cPad}.pdf`
      });
    });
  }
}

// Generar para AO Curso Basico
['Bienvenida e introducción', 'Ejercicio Planeamiento Qx'].forEach(sub => {
  const fPath = `AO Curso Basico\\${sub}`;
  const diskFolder = path.join(ROOT_DIR, fPath);
  if (fs.existsSync(diskFolder)) {
    const files = fs.readdirSync(diskFolder).filter(f => f.endsWith('.pdf') && !f.startsWith('2018 -'));
    files.forEach((f, idx) => {
      MAPPINGS.push({
        folder: fPath,
        oldName: f,
        newName: `2018 - AO Foundation - Curso Básico - ${sub} (${idx + 1}).pdf`
      });
    });
  }
});

// Generar para zPlaneamientos Quirurgicos
const planFolder = path.join(ROOT_DIR, 'zPlaneamientos Quirurgicos');
if (fs.existsSync(planFolder)) {
  const files = fs.readdirSync(planFolder).filter(f => f.endsWith('.pdf') && !f.startsWith('Nota Quirúrgica') && !f.startsWith('Planeamiento'));
  files.forEach((f, idx) => {
    const clean = f.replace(/\.pdf$/i, '').replace(/[:*?"<>|\\/]/g, ' - ').trim();
    MAPPINGS.push({
      folder: 'zPlaneamientos Quirurgicos',
      oldName: f,
      newName: `Planeamiento Quirúrgico - ${clean}.pdf`
    });
  });
}

// Generar para Reconstructiva\Principios Fijacion externa Plano Oblicuo
const fijFolder = path.join(ROOT_DIR, 'Reconstructiva\\Principios Fijacion externa Plano Oblicuo');
if (fs.existsSync(fijFolder)) {
  const files = fs.readdirSync(fijFolder).filter(f => f.endsWith('.pdf') && !f.startsWith('2018 -'));
  files.forEach((f, idx) => {
    const clean = f.replace(/\.pdf$/i, '').replace(/[:*?"<>|\\/]/g, ' - ').trim();
    MAPPINGS.push({
      folder: 'Reconstructiva\\Principios Fijacion externa Plano Oblicuo',
      oldName: f,
      newName: `2018 - De la Huerta, F. - Fijación Externa Plano Oblicuo - ${clean.substring(0, 50)}.pdf`
    });
  });
}

function runTreatises() {
  console.log(`Iniciando estandarización de tratados, cursos y planeamientos (${MAPPINGS.length} planeados)...`);
  let success = 0;
  let errors = 0;
  let skipped = 0;

  for (const m of MAPPINGS) {
    const oldP = path.join(ROOT_DIR, m.folder, m.oldName);
    const newP = path.join(ROOT_DIR, m.folder, m.newName);

    if (!fs.existsSync(oldP)) {
      skipped++;
      continue;
    }
    if (m.oldName === m.newName) {
      skipped++;
      continue;
    }

    try {
      fs.renameSync(oldP, newP);
      console.log(`✅ [OK]: [${m.folder}] "${m.oldName}" -> "${m.newName}"`);
      success++;
    } catch (e) {
      console.error(`❌ [FAIL]: [${m.folder}] "${m.oldName}": ${e.message}`);
      errors++;
    }
  }

  console.log(`\n========================================`);
  console.log(`TOTAL TRATADOS/CURSOS PROCESADOS: ${MAPPINGS.length}`);
  console.log(`✅ Exitosos: ${success}`);
  console.log(`⏭️ Omitidos: ${skipped}`);
  console.log(`❌ Errores: ${errors}`);
  console.log(`========================================`);
}

runTreatises();

