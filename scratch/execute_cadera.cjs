const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_DIR = 'H:\\Mi unidad\\Información Ortopedia';
const CAD_DIR = path.join(BASE_DIR, 'Cadera y Pelvis');
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
    'Planificación Preoperatoria Digital en el reemplazo de cadera.pdf',
    '2019 - S-A - Comparison of Baumgaertner and Chang Reduction Quality Criteria for the Assessment of Trochanteric Fractures.pdf',
    '2007 - Tornetta III, Paul - Diagnosis of Femoral Neck Fractures in Patients with a Femoral Shaft Fracture Improvement with a Standard Protocol.pdf',
    '2012 - Palm, Henrik - Un nuevo algoritmo para la cirugía de fracturas de cadera.pdf',
    '2020 - Buruian, Alexei - Distal interlocking for short trochanteric nails static dynamic or no locking Review of the literature and decision algorithm.pdf',
    '2018 - Mauffrey, Cyril - Radiographic Evaluation of Acetabular Fractures Review and Update on Methodology.pdf',
    '2010 - Naranje, Sameer - Digastric trochanteric flip osteotomy and surgical dislocation of hip in the management of acetabular fra.pdf',
    '2021 - Allepuz, R. - Planificación Preoperatoria Digital en Artroplastia Total de Cadera.pdf',
    'S-F - S-A - A Practical Operative Guide for Total Knee and Hip Replacement.pdf',
    'S-F - Mont - Knowledge Update Orthopaedic Hip and Knee Reconstruction.pdf',
    'S-F - S-A - Basics in HIP AND KNEE ARTHROPLASTY.pdf',
    '2011 - Féron, J. M. - Fracturas Periprotésicas de la Cadera y de la Rodilla.pdf'
  ];
  for (const d of dupes) {
    safeMoveToMusic(path.join(CAD_DIR, d), d);
  }

  console.log('--- FASE 2: RENOMBRAMIENTOS Y MULTI-TÓPICOS ---');
  const actions = [
    {
      oldName: 'S-F - S-A - Estudio de rodilla.pdf',
      newName: '2016 - Callaghan, John J. - The Adult Hip - Ed. 3.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Cirugia para artrosis de cadera tecnicas quirurgicas paso a paso.pdf',
      newName: '2011 - Villar, Richard - Cirugía para Artrosis de Cadera Técnicas Quirúrgicas Paso a Paso.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Cirugía para artrosis de cadera.pdf',
      newName: '2011 - Villar, Richard - Cirugía para Artrosis de Cadera Técnicas Quirúrgicas.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Matta - Anterior Hip Replacement.pdf',
      newName: '2020 - Matta, Joel M. - Anterior Hip Replacement From Origin to Current Advanced Techniques.pdf',
      multi: ['Libros', 'Abordajes']
    },
    {
      oldName: 'S-F - S-A - Fracturas de la Fémur Proximal Mejorando Resultados.pdf',
      newName: '2014 - Hak, David J. - Fractures of the Proximal Femur Improving Outcomes.pdf',
      multi: ['Libros', 'Femur']
    },
    {
      oldName: 'The Hip Joint (K. Mohan Iyer) (Z-Library).pdf',
      newName: '2014 - Iyer, K. Mohan - The Hip Joint.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Mastering Orthopedic Techniques TOTAL HIP ARTHROPLASTY.pdf',
      newName: '2013 - Malhotra, Rajesh - Mastering Orthopedic Techniques Total Hip Arthroplasty.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Fundamentals of Revision Hip Arthroplasty.pdf',
      newName: '2012 - Malchau, Henrik - Fundamentals of Revision Hip Arthroplasty.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Biomechanical consideration of total hip arthroplasty following failed fixation of femoral intertrochanteric fractures –A finite element analysis.pdf',
      newName: '2013 - Chen, Dave W. - Biomechanical Consideration of THA Following Failed Fixation of Intertrochanteric Fractures.pdf',
      multi: ['Femur']
    },
    {
      oldName: 'Biomechanics of the hip as spplied to osteoarthritis and related conditions with a forward by William H Hams.pdf',
      newName: '1981 - Bombelli, Renato - Osteoarthritis of the Hip Classification and Pathogenesis.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Bambelli - Estructura y Funcion en Rodilla y Cadera.pdf',
      newName: '1993 - Bombelli, Renato - Structure and Function in Normal and Abnormal Hips - Ed. 3.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Fracturas del Anillo Pélvico.pdf',
      newName: '2021 - Gänsslen, Axel - Pelvic Ring Fractures.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Rivière - Personalized Hip and Knee Joint Replacement.pdf',
      newName: '2020 - Rivière, Charles - Personalized Hip and Knee Joint Replacement.pdf',
      multi: ['Libros', 'Rodilla y Tibia']
    },
    {
      oldName: 'S-F - Giannoudis - Fracture Reduction and Fixation Techniques.pdf',
      newName: '2020 - Giannoudis, Peter V. - Fracture Reduction and Fixation Techniques Spine, Pelvis and Lower Extremity.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Diagnostic Imaging.pdf',
      newName: '2006 - Baert, A. L. - Imaging of the Hip Joint.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Essentials_in_Total_Hip_Arthroplasty_Slack_Incorporated_2014.pdf',
      newName: '2014 - Bono, James V. - Essentials in Total Hip Arthroplasty.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Gayoso Rey, Óscar - ABORDAJE ANTERIOR DE CADERA. Técnica Quirñrgica.pdf',
      newName: '2019 - Gayoso Rey, Óscar - Abordaje Anterior de Cadera Técnica Quirúrgica.pdf',
      multi: ['Abordajes']
    },
    {
      oldName: 'S-F - S-A - Abordaje lateral Indirecto Modificado para la artroplastia de cadera.pdf',
      newName: '2015 - S-A - Abordaje Lateral Indirecto Modificado para Artroplastia de Cadera.pdf',
      multi: ['Abordajes']
    },
    {
      oldName: 'S-F - Chen - Accurate Placement of Cannulated Screws in Femoral Neck Fractures Screw and Guide Wire Combined Technique.pdf',
      newName: '2020 - Chen, Yu-feng - Accurate Placement of Cannulated Screws in Femoral Neck Fractures.pdf',
      multi: ['Femur']
    },
    {
      oldName: 'S-F - S-A - Patología de cadera.pdf',
      newName: '2018 - S-A - Patología de Cadera Generalidades y Manejo.pdf',
      multi: []
    },
    {
      oldName: 'Afecta la fractura de la pared lateral al grado de colapso y al grado de deslizamiento de la lámina cefálica, en fracturas pertrocantéreas tratadas mediante enclavado intramedular.pdf',
      newName: '2021 - SERCOT - Fractura de Pared Lateral y Colapso en Fracturas Pertrocantéreas.pdf',
      multi: ['Femur']
    },
    {
      oldName: '2020 Afecta la fractura de la pared lateral al grado de colapso y al grado de deslizamiento de la lámina cefálica, en fracturas pertrocantéreas tratadas mediante enclavado intramedular. Estudio radiológico y revisión de la l.pdf',
      newName: '2020 - SERCOT - Fractura de la Pared Lateral en Fracturas Pertrocantéreas Estudio Radiológico.pdf',
      multi: ['Femur']
    },
    {
      oldName: 'S-F - S-A - Coxartrosis.pdf',
      newName: '2016 - S-A - Coxartrosis Diagnóstico y Tratamiento.pdf',
      multi: []
    },
    {
      oldName: 'S-F - Hodgson, Felipe - Dolor de cadera en adolescentes estudio y tratamiento.pdf',
      newName: '2021 - Hodgson, Felipe - Dolor de Cadera en Adolescentes Estudio y Tratamiento.pdf',
      multi: ['Ortopedia Pediatrica']
    },
    {
      oldName: 'S-F - Mendoza Lemus - Las fracturas del cuello del fémur han representado un reto para el cirujano ortopédico y permanece en muchos aspectos todavía como la fractura sin resolver en cuanto al tratamiento y los resultados.pdf',
      newName: '2016 - Mejía García, Saúl - Fracturas del Cuello del Fémur Estado del Arte.pdf',
      multi: ['Femur']
    },
    {
      oldName: 'Recomendaciones para pacientes de cirugía reemplazo a rticular de cadera.docx',
      newName: '2019 - S-A - Recomendaciones para Pacientes de Reemplazo Articular de Cadera.docx',
      multi: []
    },
    {
      oldName: 'Recomendaciones POP de cirugía reemplazo a rticular de cadera.docx',
      newName: '2019 - S-A - Recomendaciones POP de Reemplazo Articular de Cadera.docx',
      multi: []
    },
    {
      oldName: 'TAD.pptx',
      newName: '2018 - S-A - Tip-Apex Distance en Fracturas de Cadera.pptx',
      multi: ['Femur']
    },
    {
      oldName: 'S-F - Naveiras Calvo - Valoracion radiografica de la protesis de cadera tipos, parámetros radiográficos de colocación y complicaciones.pdf',
      newName: '2020 - Naveiras Calvo, Aldara - Valoración Radiográfica de la Prótesis de Cadera.pdf',
      multi: []
    },
    {
      oldName: 'S-F - Phelps - SacralPelvic Fixation New Tools and Techniques.pdf',
      newName: '2019 - Phelps, Brian M. - Sacral and Pelvic Fixation New Tools and Techniques.pdf',
      multi: ['Columna']
    },
    {
      oldName: 'S-F - S-A - Hip Vascularity A Review of the Anatomy and Clinical Implications.pdf',
      newName: '2015 - Gautier, Emanuel - Hip Vascularity Anatomy and Clinical Implications.pdf',
      multi: []
    },
    {
      oldName: 'S-F - Sáenz - Vascularización de la cabeza y cuello femorales y artroscopia de cadera.pdf',
      newName: '2014 - Sáenz, I. - Vascularización de Cabeza y Cuello Femorales y Artroscopia.pdf',
      multi: ['Ortopedia Deportiva y artroscopia']
    },
    {
      oldName: 'S-F - S-A - Sistema DHSDCS.pdf',
      newName: '2014 - DePuy Synthes - Sistema DHS-DCS Técnica Quirúrgica.pdf',
      multi: ['Catálogos de Materiales ortopédicos', 'Femur']
    },
    {
      oldName: '2020  Distal interlocking for short trochanteric nails. static, dynamic or no locking Review of the literature and decision algorithm.pdf',
      newName: '2020 - Buruian, Alexei - Distal Interlocking for Short Trochanteric Nails Literature Review.pdf',
      multi: ['Femur']
    },
    {
      oldName: 'S-F - Khattak - Surgical management of metastatic lesions of proximal femur and the hip.pdf',
      newName: '2021 - Khattak, M. J. - Surgical Management of Metastatic Lesions of Proximal Femur and Hip.pdf',
      multi: ['Ortopedia Oncologica', 'Femur']
    },
    {
      oldName: 'Comparison of the Reliability of Three Scoring Systems Used to Decide Whether to Apply Cement in Hip Arthroplasty Among Fracture Patients and the Effect of Surgical Experience The Spotorno, Dorr, and Canal Flare Indi.pdf',
      newName: '2022 - S-A - Reliability of Spotorno, Dorr and Canal Flare Indices in Hip Arthroplasty.pdf',
      multi: []
    },
    {
      oldName: 'S-F - S-A - Hip Templating for Total Hip Arthroplasty.pdf',
      newName: '2017 - S-A - Hip Templating for Total Hip Arthroplasty.pdf',
      multi: []
    },
    {
      oldName: 'S-F - Lum - Restoration of center of rotation and balance of THR.pdf',
      newName: '2020 - Lum, Zachary C. - Restoration of Center of Rotation and Balance in Total Hip Arthroplasty.pdf',
      multi: []
    },
    {
      oldName: 'S-F - DePuy Synthes - Corail Hip System Documentación del Producto.pdf',
      newName: '2017 - DePuy Synthes - Corail Hip System Documentación del Producto.pdf',
      multi: ['Catálogos de Materiales ortopédicos']
    },
    {
      oldName: 'S-F - DePuy Synthes - Corail Hip System Surgical Technique.pdf',
      newName: '2018 - DePuy Synthes - Corail Hip System Surgical Technique.pdf',
      multi: ['Catálogos de Materiales ortopédicos']
    },
    {
      oldName: 'S-F - Stryker - Trident Acetabular System PSL Surgical Protocol.pdf',
      newName: '2016 - Stryker - Trident Acetabular System PSL Surgical Protocol.pdf',
      multi: ['Catálogos de Materiales ortopédicos']
    },
    {
      oldName: 'S-F - Stryker - Accolade II Femoral Hip Stem Design Rationale.pdf',
      newName: '2017 - Stryker - Accolade II Femoral Hip Stem Design Rationale.pdf',
      multi: ['Catálogos de Materiales ortopédicos']
    },
    {
      oldName: 'S-F - Stryker - Accolade II Femoral Hip System Surgical Protocol.pdf',
      newName: '2018 - Stryker - Accolade II Femoral Hip System Surgical Protocol.pdf',
      multi: ['Catálogos de Materiales ortopédicos']
    },
    {
      oldName: 'S-F - Merete - BioBall Sistema Modular de Cuello Femoral.pdf',
      newName: '2017 - Merete - BioBall Sistema Modular de Cuello Femoral.pdf',
      multi: ['Catálogos de Materiales ortopédicos']
    },
    {
      oldName: 'S-F - DePuy Synthes - Sistema TFN Clavo Trocantéreo de Titanio Técnica Quirúrgica.pdf',
      newName: '2015 - DePuy Synthes - Sistema TFN Clavo Trocantéreo de Titanio Técnica Quirúrgica.pdf',
      multi: ['Catálogos de Materiales ortopédicos', 'Femur']
    },
    {
      oldName: 'S-F - DePuy Synthes - Sistema DHS-DCS y Placas LCP Técnica Quirúrgica.pdf',
      newName: '2016 - DePuy Synthes - Sistema DHS-DCS y Placas LCP Técnica Quirúrgica.pdf',
      multi: ['Catálogos de Materiales ortopédicos', 'Femur']
    },
    {
      oldName: 'S-F - DePuy Synthes - FNS Sistema para Fracturas de Cuello Femoral Técnica Quirúrgica.pdf',
      newName: '2019 - DePuy Synthes - FNS Sistema para Fracturas de Cuello Femoral Técnica Quirúrgica.pdf',
      multi: ['Catálogos de Materiales ortopédicos', 'Femur']
    },
    {
      oldName: 'S-F - DePuy Synthes - FNS Femoral Neck System Surgical Technique.pdf',
      newName: '2019 - DePuy Synthes - FNS Femoral Neck System Surgical Technique.pdf',
      multi: ['Catálogos de Materiales ortopédicos', 'Femur']
    },
    {
      oldName: 'S-F - ITS GmbH - Pelvic Reconstruction System PHOENIX Surgical Technique 56p.pdf',
      newName: '2018 - ITS GmbH - Pelvic Reconstruction System PHOENIX Surgical Technique 56p.pdf',
      multi: ['Catálogos de Materiales ortopédicos']
    },
    {
      oldName: 'S-F - Stryker - Pelvis and Acetabulum System Matta Plates Operative Technique.pdf',
      newName: '2017 - Stryker - Pelvis and Acetabulum System Matta Plates Operative Technique.pdf',
      multi: ['Catálogos de Materiales ortopédicos']
    },
    {
      oldName: 'S-F - ITS GmbH - Pelvic Reconstruction System PHOENIX Surgical Technique 72p.pdf',
      newName: '2019 - ITS GmbH - Pelvic Reconstruction System PHOENIX Surgical Technique 72p.pdf',
      multi: ['Catálogos de Materiales ortopédicos']
    },
    {
      oldName: 'S-F - DePuy Synthes - Sistema DHS-DCS Guía Rápida de Técnica Quirúrgica.pdf',
      newName: '2016 - DePuy Synthes - Sistema DHS-DCS Guía Rápida de Técnica Quirúrgica.pdf',
      multi: ['Catálogos de Materiales ortopédicos', 'Femur']
    },
    {
      oldName: 'S-F - JRI Orthopaedics - Sistema Total de Cadera Furlong HAC Técnica Quirúrgica.pdf',
      newName: '2017 - JRI Orthopaedics - Sistema Total de Cadera Furlong HAC Técnica Quirúrgica.pdf',
      multi: ['Catálogos de Materiales ortopédicos']
    },
    {
      oldName: 'S-F - Bioadvance - Prótesis Total de Cadera MP-TP MF ACP AC-II Técnica Quirúrgica.pdf',
      newName: '2018 - Bioadvance - Prótesis Total de Cadera MP-TP Técnica Quirúrgica.pdf',
      multi: ['Catálogos de Materiales ortopédicos']
    },
    {
      oldName: 'S-F - Groupe Lépine - Copa Bipolar Universal UHL Técnica Quirúrgica.pdf',
      newName: '2017 - Groupe Lépine - Copa Bipolar Universal UHL Técnica Quirúrgica.pdf',
      multi: ['Catálogos de Materiales ortopédicos']
    },
    {
      oldName: 'S-F - Groupe Lépine - Vástago Femoral PAVI Documentación de Implantes.pdf',
      newName: '2017 - Groupe Lépine - Vástago Femoral PAVI Documentación de Implantes.pdf',
      multi: ['Catálogos de Materiales ortopédicos']
    },
    {
      oldName: 'S-F - Groupe Lépine - Vástago Femoral PAVI HAP y Cementado Técnica Quirúrgica.pdf',
      newName: '2017 - Groupe Lépine - Vástago Femoral PAVI HAP y Cementado Técnica Quirúrgica.pdf',
      multi: ['Catálogos de Materiales ortopédicos']
    }
  ];

  for (const act of actions) {
    const oldPath = path.join(CAD_DIR, act.oldName);
    const newPath = path.join(CAD_DIR, act.newName);

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
  const items = fs.readdirSync(CAD_DIR, { withFileTypes: true });
  const finalFiles = items.filter(i => i.isFile() && !i.name.startsWith('.') && i.name !== 'desktop.ini');
  let indexed = 0;

  for (const f of finalFiles) {
    const fp = path.join(CAD_DIR, f.name);
    const hash = await computeStreamHash(fp);
    if (hash && !reg.hashes[hash]) {
      reg.hashes[hash] = {
        folder: 'Cadera y Pelvis',
        canonicalName: f.name,
        path: 'Cadera y Pelvis/' + f.name
      };
      indexed++;
    }
  }

  fs.writeFileSync(REG_PATH, JSON.stringify(reg, null, 2), 'utf8');
  console.log(`Fase 3 completada: ${indexed} nuevos hashes indexados en global_registry.json.`);
  console.log(`Total archivos finales en Cadera y Pelvis: ${finalFiles.length}`);
}

run();
