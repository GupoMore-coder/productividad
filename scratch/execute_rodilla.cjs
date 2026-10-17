const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_DIR = 'H:\\Mi unidad\\Información Ortopedia';
const ROD_DIR = path.join(BASE_DIR, 'Rodilla y Tibia');
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
    'Calipered_Kinematically_aligned_Total_Knee_Arthroplasty_Theory,.pdf',
    '2010 - Díaz Ferreiro - Técnicas operativas Reemplazo total de rodilla.pdf',
    'S-F - S-A - Posterolateral Knee Injuries Anatomy, Evaluation, and Treatment.pdf',
    'S-F - S-A - Arthroplastia total de rodilla.pdf',
    'S-F - Kumar Nishikant - Estudio de interpretacion de rayos X postoperatorios tras arthroplastia de rodilla total.pdf',
    'S-F - Smith - ACL reconstruction con el ACUFEX· Director Drill Guide y ENDOBUTTON CL Fixation System.pdf',
    'S-F - Schottel - Predictive Radiographic Markers for Concomitant Ipsilateral Ankle Injuries in Tibial Shaft Fractures.pdf'
  ];
  for (const d of dupes) {
    safeMoveToMusic(path.join(ROD_DIR, d), d);
  }

  console.log('--- FASE 2: RENOMBRAMIENTOS Y MULTI-TÓPICOS ---');
  const actions = [
    {
      oldName: 'INSAL- RODILLA TOMO 1.pdf',
      newName: '2012 - Scott, W. Norman - Insall and Scott Surgery of the Knee Tomo 1 - Ed. 5.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Scott, W. Norman - Estudio de rodilla.pdf',
      newName: '2012 - Scott, W. Norman - Insall and Scott Surgery of the Knee Tomo 2 - Ed. 5.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - NOYES - Surgery, Rehabilitation, Clinical Outcomes NOYES KNEEDISORDERS.pdf',
      newName: '2009 - Noyes, Frank R. - Noyes Knee Disorders Surgery, Rehabilitation, Clinical Outcomes.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Jackson - Reconstructive Knee Surgery.pdf',
      newName: '2008 - Jackson, Douglas W. - Reconstructive Knee Surgery Master Techniques - Ed. 3.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Miller, S. Ward Casscells - Operative Techniques Knee Surgery Second Edition.pdf',
      newName: '2018 - Miller, Mark D. - Operative Techniques Knee Surgery - Ed. 2.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - TOTAL KNEE ARTHROPLASTY.pdf',
      newName: '2013 - Malhotra, Rajesh - Mastering Orthopedic Techniques Total Knee Arthroplasty.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Dominio de Técnicas Ortopédicas. Artroplastía Total de Rodilla - Rajesh Malhotra.pdf',
      newName: '2013 - Malhotra, Rajesh - Dominio de Técnicas Ortopédicas Artroplastía Total de Rodilla.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Artroplastia Total de Rodilla.pdf',
      newName: '2013 - Malhotra, Rajesh - Artroplastia Total de Rodilla Técnicas Quirúrgicas.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Mastering_techniques_in_orthopedic_surgery_knee_arthroplasty_4th.pdf',
      newName: '2019 - Lotke, Paul A. - Master Techniques in Orthopaedic Surgery Knee Arthroplasty - Ed. 4.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Master_Techniques_in_Orthopaedic_Surgery_Knee_Arthroplasty_4ed_2019.pdf',
      newName: '2019 - Lotke, Paul A. - Master Techniques in Orthopaedic Surgery Knee Arthroplasty 4th Ed.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Master Techniques in Orthopaedic Surgery Sports medicine Segunda Edicion.pdf',
      newName: '2010 - Fu, Freddie H. - Master Techniques in Orthopaedic Surgery Sports Medicine - Ed. 2.pdf',
      multi: ['Libros', 'Ortopedia Deportiva y artroscopia']
    },
    {
      oldName: 'S-F - Eugenio Díaz Ferreiro - Estudio de rodilla.pdf',
      newName: '2010 - Vince, Kelly G. - Operative Techniques Total Knee Replacement Edición en Español.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Hirschmann - The Unhappy Total Knee Replacement.pdf',
      newName: '2015 - Hirschmann, Michael T. - The Unhappy Total Knee Replacement.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Knee Arthroplasty.pdf',
      newName: '2022 - Sharma, Mrinal - Knee Arthroplasty New and Future Directions.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Hansen, E. - Essentials of Cemented Knee Arthroplasty.pdf',
      newName: '2022 - Hansen, Erik - Essentials of Cemented Knee Arthroplasty.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Arthroplastia de rodilla parcial.pdf',
      newName: '2020 - Berend, Keith R. - Partial Knee Arthroplasty Techniques for Optimal Outcomes.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Zarins - Surgical Anatomy and Exposures of the Knee.pdf',
      newName: '2022 - Zarins, Bertram - Surgical Anatomy and Exposures of the Knee.pdf',
      multi: ['Libros', 'Abordajes']
    },
    {
      oldName: 'Calipered Kinematically aligned Total Knee Arthroplasty Theory.pdf',
      newName: '2022 - Howell, Stephen M. - Calipered Kinematically Aligned Total Knee Arthroplasty Theory.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'Patellar_Instability_Management_Principles_and_Operative_Techniques.pdf',
      newName: '2019 - Shubin Stein, Beth E. - Patellar Instability Management Principles and Operative Techniques.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - A Practical Operative Guide for Total Knee and Hip Replacement.pdf',
      newName: '2017 - Oppy, Andrew - A Practical Operative Guide for Total Knee and Hip Replacement.pdf',
      multi: ['Libros', 'Cadera y Pelvis']
    },
    {
      oldName: 'S-F - Mont - Knowledge Update Orthopaedic Hip and Knee Reconstruction.pdf',
      newName: '2017 - Mont, Michael A. - Orthopaedic Knowledge Update Hip and Knee Reconstruction 5.pdf',
      multi: ['Libros', 'Cadera y Pelvis']
    },
    {
      oldName: 'S-F - Ryu, R. K. N., Abrams, J. S. - Advanced Arthroscopic Surgical Techniques.pdf',
      newName: '2016 - Ryu, Richard K. N. - AANA Advanced Arthroscopic Surgical Techniques The Knee.pdf',
      multi: ['Libros', 'Ortopedia Deportiva y artroscopia']
    },
    {
      oldName: 'S-F - Cho - Knee Joint Arthroplasty.pdf',
      newName: '2014 - Cho, Wooshin - Knee Joint Arthroplasty.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Lobenhoffer Ronald J van Heerwaarden Alex E Staubli Roland P - Osteotomies around the Knee Indications—Planning—Surgical techniques using plate fixators.pdf',
      newName: '2008 - Lobenhoffer, Philipp - Osteotomies around the Knee Indications, Planning, Surgical Techniques AO.pdf',
      multi: ['Libros', 'Abordajes']
    },
    {
      oldName: 'S-F - van Raaij - Tratamiento de la osteoartritis varus sintomática de la rodilla.pdf',
      newName: '2009 - van Raaij, T. M. - Treatment of Symptomatic Varus Osteoarthritis of the Knee.pdf',
      multi: []
    },
    {
      oldName: 'S-F - S-A - Basics in HIP AND KNEE ARTHROPLASTY.pdf',
      newName: '2014 - Lobo, C. - Basics in Hip and Knee Arthroplasty.pdf',
      multi: ['Cadera y Pelvis', 'Libros']
    },
    {
      oldName: 'S-F - Koh - A Case-Based Approach The Patellofemoral Joint.pdf',
      newName: '2014 - Koh, Jason L. - The Patellofemoral Joint A Case-Based Approach.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Hanschen, Biberthaler, Waddell - Strategies in Fracture Treatments.pdf',
      newName: '2018 - Hanschen, Marc - Strategies in Fracture Treatments Knee Fractures.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Ligament Balancing In Total Knee Arthroplasty An Instrudional Manual.pdf',
      newName: '2003 - Leo, A. - Ligament Balancing in Total Knee Arthroplasty An Instructional Manual.pdf',
      multi: []
    },
    {
      oldName: 'deformity correction of total knee arthroplasty.pdf',
      newName: '2014 - Mullaji, Arun B. - Deformity Correction in Total Knee Arthroplasty.pdf',
      multi: ['Libros', 'Reconstructiva']
    },
    {
      oldName: 'S-F - Mullaji - Deformity Correction in Total Knee Arthroplasty.pdf',
      newName: '2014 - Mullaji, Arun B. - Deformity Correction in Total Knee Arthroplasty 2.pdf',
      multi: ['Libros', 'Reconstructiva']
    },
    {
      oldName: 'S-F - S-A - Dolor y inestabilidad de la rodilla.pdf',
      newName: '2006 - Sanchis-Alfonso, Vicente - Anterior Knee Pain and Patellar Instability.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Osteotomy About the Knee.pdf',
      newName: '2020 - Oussedik, Sam - Osteotomy About the Knee A Comprehensive Guide.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - Pablos - La Rodilla Infantil.pdf',
      newName: '2003 - de Pablos, Julio - La Rodilla Infantil.pdf',
      multi: ['Libros', 'Ortopedia Pediatrica']
    },
    {
      oldName: 'S-F - S-A - Osteotomía tibial.pdf',
      newName: '2009 - Hernigou, P. - Osteotomías de la Tibia Proximal.pdf',
      multi: ['EMC Ortopedia']
    },
    {
      oldName: 'S-F - Baldini - Perioperative Medical Management for Total Joint Arthroplasty.pdf',
      newName: '2014 - Baldini, Andrea - Perioperative Medical Management for Total Joint Arthroplasty.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Lesiones posterolaterales de rodilla anatomía, evaluación y tratamiento.pdf',
      newName: '2006 - Laprade, Robert F. - Posterolateral Knee Injuries Anatomy, Evaluation, and Treatment.pdf',
      multi: ['Libros']
    },
    {
      oldName: 'S-F - S-A - Knee Arthroplasty Handbook.pdf',
      newName: '2012 - Scuderi, Giles R. - Knee Arthroplasty Handbook.pdf',
      multi: []
    },
    {
      oldName: 'S-F - S-A - Fracturas periprotésicas de la cadera y de la rodilla.pdf',
      newName: '2011 - Féron, J. M. - Fracturas Periprotésicas de la Cadera y de la Rodilla.pdf',
      multi: ['EMC Ortopedia', 'Cadera y Pelvis']
    },
    {
      oldName: 'S-F - San Pedro Biomédica - Sistema Affinity Tibia Proximal Técnica Quirúrgica.pdf',
      newName: '2018 - San Pedro Biomédica - Sistema Affinity Tibia Proximal Técnica Quirúrgica.pdf',
      multi: ['Catálogos de Materiales ortopédicos']
    },
    {
      oldName: 'S-F - DePuy Synthes - PFC Sigma Knee Systems Cruciate Retaining and Substituting Surgical Technique.pdf',
      newName: '2016 - DePuy Synthes - PFC Sigma Knee Systems Cruciate Retaining and Substituting Surgical Technique.pdf',
      multi: ['Catálogos de Materiales ortopédicos']
    },
    {
      oldName: 'S-F - Smith and Nephew - Genesis II Total Knee System Surgical Technique Distal Cut First.pdf',
      newName: '2015 - Smith and Nephew - Genesis II Total Knee System Surgical Technique.pdf',
      multi: ['Catálogos de Materiales ortopédicos']
    },
    {
      oldName: 'S-F - Groupe Lépine - Prótesis Total de Rodilla Móvil New Wave Técnica Quirúrgica.pdf',
      newName: '2017 - Groupe Lépine - Prótesis Total de Rodilla Móvil New Wave Técnica Quirúrgica.pdf',
      multi: ['Catálogos de Materiales ortopédicos']
    },
    {
      oldName: 'S-F - Stryker - Sistema de Rodilla Triathlon TS Técnica Quirúrgica.pdf',
      newName: '2018 - Stryker - Sistema de Rodilla Triathlon TS Técnica Quirúrgica.pdf',
      multi: ['Catálogos de Materiales ortopédicos']
    },
    {
      oldName: 'S-F - DePuy Synthes - Expert Nailing System Clavo Tibial Técnica Quirúrgica.pdf',
      newName: '2017 - DePuy Synthes - Expert Nailing System Clavo Tibial Técnica Quirúrgica.pdf',
      multi: ['Catálogos de Materiales ortopédicos']
    },
    {
      oldName: 'S-F - Biomet - Vanguard Complete Knee System Instrumental y Técnica Quirúrgica.pdf',
      newName: '2016 - Biomet - Vanguard Complete Knee System Instrumental y Técnica Quirúrgica.pdf',
      multi: ['Catálogos de Materiales ortopédicos']
    },
    {
      oldName: 'S-F - Boluda-Mengod et al. - Estudio de rodilla.pdf',
      newName: '2024 - Boluda-Mengod, J. - Modified Oblique Osteotomy for Distal Femur Varus Deformities.pdf',
      multi: ['Abordajes', 'Femur']
    },
    {
      oldName: 'S-F - S-A - Posteromedial Intergastrocnemius Approach to the Tibial Plateau.pdf',
      newName: '2019 - S-A - Posteromedial Intergastrocnemius Approach to the Tibial Plateau.pdf',
      multi: ['Abordajes']
    },
    {
      oldName: 'S-F - S-A - Abordaje quirurgico de la pata la.pdf',
      newName: '2018 - S-A - Abordaje Quirúrgico de la Patela y Aparato Extensor.pdf',
      multi: ['Abordajes']
    },
    {
      oldName: 'S-F - Dr. Alberto Queipo de Llano Giménez - Tratamiento rehabilitador Síndrome Patelefemoral.pdf',
      newName: '2015 - Queipo de Llano Giménez, Alberto - Tratamiento Rehabilitador Síndrome Patelofemoral.pdf',
      multi: []
    },
    {
      oldName: 'Patella dislocation an overview.pdf',
      newName: '2018 - Grawe, Brian - Patella Dislocation An Overview.pdf',
      multi: []
    },
    {
      oldName: 'S-F - null - Estudio de rodilla.pdf',
      newName: '2025 - EFORT - Posterolateral Tibia Plateau Fractures Pros and Cons of Approaches.pdf',
      multi: ['Abordajes']
    },
    {
      oldName: 'S-F - Kumar, Chandrashekhar Yadav, Rishi Raj, Sumit Anand - Estudio de rodilla.pdf',
      newName: '2016 - Kumar, Nishikant - How to Interpret Postoperative X-rays after Total Knee Arthroplasty.pdf',
      multi: []
    },
    {
      oldName: 'S-F - Pineda Villaseñor - Evaluación de la osteoartritis mediante diferentes métodos de imagen.pdf',
      newName: '2011 - Pineda Villaseñor, Carlos - Evaluación de la Osteoartritis Mediante Métodos de Imagen.pdf',
      multi: []
    },
    {
      oldName: 'S-F - Weil, Yoram A. - Tecnico de reduccion y fijacion posteromedial supino para fracturas del plato tibial medial y bicondilar.pdf',
      newName: '2014 - Weil, Yoram A. - Posteromedial Supine Approach for Reduction of Medial and Bicondylar Tibial Plateau Fractures.pdf',
      multi: ['Abordajes']
    },
    {
      oldName: 'S-F - Zhang - Estudio de rodilla.pdf',
      newName: '2022 - Zhang, Zhi-Jun - Predictors of Graft Failure After Primary Medial Patellofemoral Ligament Reconstruction.pdf',
      multi: ['Ortopedia Deportiva y artroscopia']
    },
    {
      oldName: 'S-F - S-A - Estudio de rodilla.pdf',
      newName: '2004 - SEMERGEN - Manejo de la Patología de Rodilla en Atención Primaria.pdf',
      multi: []
    },
    {
      oldName: 'S-F - Wang - Surgical Technique of Anterolateral Approach for Tibial Plateau Fracture.pdf',
      newName: '2021 - Wang, Peng-cheng - Surgical Technique of Anterolateral Approach for Tibial Plateau Fracture.pdf',
      multi: ['Abordajes']
    },
    {
      oldName: 'S-F - null - ABORDAJE POSTEROLATERAL SIN OSTEOTOMIA DE PERONé PARA EL TRATAMIENTO DE FRACTURAS DE LA ESQUINA POSTEROLATERAL DE LA MESETA TIBIAL.pdf',
      newName: '2019 - S-A - Abordaje Posterolateral sin Osteotomía de Peroné en Fracturas de Meseta Tibial.pdf',
      multi: ['Abordajes']
    },
    {
      oldName: 'S-F - Smith - Estudio de rodilla.pdf',
      newName: '2019 - Gómez-Palacio, R. - Actualización en Infecciones Periprotésicas de Rodilla.pdf',
      multi: ['Infeccioso']
    },
    {
      oldName: 'S-F - null - Dejour Classification of Trochlear Dysplasia.pdf',
      newName: '2019 - Lippacher, Sabine - Classifications in Brief The Dejour Classification of Trochlear Dysplasia.pdf',
      multi: []
    },
    {
      oldName: 'Transarticular Approach and Retrograde Plate Osteosynthesis (TARPO) An Alternative Surgical Approach for Complex Distal Intra-Articular Femur Fractures.pdf',
      newName: '2020 - S-A - Transarticular Approach and Retrograde Plate Osteosynthesis (TARPO) for Distal Femur Fractures.pdf',
      multi: ['Abordajes', 'Femur']
    },
    {
      oldName: 'S-F - S-A - PATOLOGÍA DEL APARATO EXTENSOR DE LA RODILLA.pdf',
      newName: '2016 - S-A - Patología del Aparato Extensor de la Rodilla.pdf',
      multi: []
    },
    {
      oldName: 'S-F - Kulshrestha - Early Outcomes of Medial Pivot Total Knee Arthroplasty Compared to Posterior-Stabilized Design.pdf',
      newName: '2020 - Kulshrestha, Vivek - Early Outcomes of Medial Pivot Total Knee Arthroplasty.pdf',
      multi: []
    }
  ];

  for (const act of actions) {
    const oldPath = path.join(ROD_DIR, act.oldName);
    const newPath = path.join(ROD_DIR, act.newName);

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
  const items = fs.readdirSync(ROD_DIR, { withFileTypes: true });
  const finalFiles = items.filter(i => i.isFile() && !i.name.startsWith('.') && i.name !== 'desktop.ini');
  let indexed = 0;

  for (const f of finalFiles) {
    const fp = path.join(ROD_DIR, f.name);
    const hash = await computeStreamHash(fp);
    if (hash && !reg.hashes[hash]) {
      reg.hashes[hash] = {
        folder: 'Rodilla y Tibia',
        canonicalName: f.name,
        path: 'Rodilla y Tibia/' + f.name
      };
      indexed++;
    }
  }

  fs.writeFileSync(REG_PATH, JSON.stringify(reg, null, 2), 'utf8');
  console.log(`Fase 3 completada: ${indexed} nuevos hashes indexados en global_registry.json.`);
  console.log(`Total archivos finales en la raíz de Rodilla y Tibia: ${finalFiles.length}`);
}

run();
