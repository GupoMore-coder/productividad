const fs = require('fs');
const path = require('path');
const { PDFParse } = require('C:/Users/ferna/Documents/Biblioteca Premium/node_modules/pdf-parse');
const { CANONICAL_BOOKS, sanitizeFileName } = require('./renaming_master_v2.cjs');

const ROOT_DIR = 'H:\\Mi unidad\\Información Ortopedia';
const rep = JSON.parse(fs.readFileSync('scratch/ortho_audit_report.json', 'utf8'));

// Cargar todos los pendientes
const failed = rep.failedInventory;
console.log(`Analizando ${failed.length} archivos pendientes...`);

async function planRenames() {
  const plans = [];
  let count = 0;

  for (const item of failed) {
    count++;
    const fullPath = path.join(ROOT_DIR, item.folder === '(Raíz)' ? '' : item.folder, item.filename);
    if (!fs.existsSync(fullPath)) continue;

    const ext = item.ext.toLowerCase();
    const oldName = item.filename;
    let newName = null;

    // 1. Archivos en Ortopedia Pediatrica\Roosvelt
    if (item.folder.includes('Roosvelt')) {
      if (!oldName.startsWith('Roosevelt - ')) {
        let clean = oldName.replace(/Instituto\s*Roosevelt/i, '')
                           .replace(/Roosvelt/i, '')
                           .replace(/\.(docx|xlsx)\.pdf$/i, '.pdf')
                           .replace(/GHMA-0005-v\d+/i, 'Manual Bioseguridad')
                           .trim();
        clean = sanitizeFileName(clean);
        newName = `Roosevelt - ${clean}`;
        if (!newName.endsWith(ext)) newName += ext;
      }
    }
    // 2. Archivos en zDescripciones Quirurgicas
    else if (item.folder.startsWith('zDescripciones Quirurgicas')) {
      if (!oldName.startsWith('NQ - ') && !oldName.startsWith('Nota Quirúrgica - ')) {
        let clean = oldName.replace(/^descripcion\s*de\s*/i, '')
                           .replace(/^descripcion\s*quirurgica\s*/i, '')
                           .trim();
        clean = sanitizeFileName(clean);
        newName = `Nota Quirúrgica - ${clean}`;
        if (!newName.endsWith(ext)) newName += ext;
      }
    }
    // 3. Libros\LIBROS COLUMNA
    else if (item.folder === 'Libros\\LIBROS COLUMNA' && ext === '.pdf') {
      const lower = oldName.toLowerCase();
      if (lower.includes('vaccaro') || lower.includes('pocket atlas of spine surgery')) {
        newName = '2012 - Singh, Kern & Vaccaro, Alexander R. - Pocket Atlas of Spine Surgery.pdf';
      } else if (lower.includes('aging spine')) {
        newName = '2019 - Shen, Francis H. - The Comprehensive Treatment of the Aging Spine.pdf';
      } else if (lower.includes('cervical.spine.shen')) {
        newName = '2015 - Shen, Francis H. - Textbook of the Cervical Spine.pdf';
      } else if (lower.includes('neurosurgical operative atlas')) {
        newName = '2006 - Wolfla, Christopher E. - Neurosurgical Operative Atlas: Spine and Peripheral Nerves - Ed. 2.pdf';
      } else if (lower.includes('manchikanti')) {
        newName = '2007 - Manchikanti, Laxmaiah - Interventional Fluoro Chronic Spinal Pain.pdf';
      } else if (lower.includes('craniovertebraljunc')) {
        newName = '2019 - Bambakidis, Nicholas C. - New Trends in Craniovertebral Junction Surgery.pdf';
      } else if (lower.includes('ross')) {
        newName = '2015 - Ross, Jeffrey S. - Diagnostic Imaging: Spine - Ed. 3.pdf';
      }
    }
    // 4. PDFs con cadenas corruptas ("null" / "undefined")
    else if (ext === '.pdf' && (oldName.includes('null') || oldName.includes('undefined'))) {
      if (oldName.includes('Thakur')) {
        newName = '2012 - Thakur, Anand J. - Tapping the Power of PowerPoint para Presentaciones Médicas.pdf';
      } else if (oldName.includes('Estudio de rodilla')) {
        newName = '2023 - SECOT - Estudio Clínico y Artroplastia de Rodilla.pdf';
      } else if (oldName.includes('Paz Archila')) {
        newName = '2015 - Paz Archila, Fernando Estuardo - Incidencia Acumulada de Neuropraxia Radial por Abordaje Quirúrgico.pdf';
      }
    }
    // 5. PDFs con S-A / S - A en colecciones médicas
    else if (ext === '.pdf' && /\bS\s*-\s*A\b|S-A\b/i.test(oldName)) {
      // Probar si coincide con libros canónicos en el nombre
      for (const b of CANONICAL_BOOKS) {
        if (b.regex.test(oldName)) {
          newName = `${b.defaultYear} - ${b.author} - ${b.title}.pdf`;
          break;
        }
      }

      // Si no coincide en el nombre, limpiar el nombre existente quitando el prefijo "YYYY - S-A - "
      if (!newName) {
        const rawMatch = oldName.match(/^((?:19|20)\d{2})\s*-\s*S\s*-\s*A\s*-\s*(.+)\.pdf$/i);
        if (rawMatch) {
          const yr = rawMatch[1];
          let cleanTitle = rawMatch[2].trim();
          // Detectar autores en cleanTitle o inferir autor
          if (/A Question Bank of MCQ/i.test(cleanTitle)) {
            newName = `2005 - Shetty, Sripathi - A Question Bank of MCQ in Orthopaedics and Trauma.pdf`;
          } else if (/AOTrauma Statistics/i.test(cleanTitle)) {
            newName = `${yr} - AO Trauma - Statistics and Data Management in Orthopaedic Research.pdf`;
          } else if (/MANAGEMENT OF LIMB INJURIES/i.test(cleanTitle)) {
            newName = `2016 - ICRC - Management of Limb Injuries During Disasters and Armed Conflicts.pdf`;
          } else if (/Manual de Exploracion Fisica del Aparato Locomotor/i.test(cleanTitle)) {
            newName = `2015 - Jurado Bueno, Antonio - Manual de Exploración Física del Aparato Locomotor.pdf`;
          } else if (/Who'?s Who in Orthopedics/i.test(cleanTitle)) {
            newName = `2005 - Mostofi, Seyed Behrooz - Who's Who in Orthopedics.pdf`;
          } else if (/Guidelines for Medical Personnel/i.test(cleanTitle)) {
            newName = `${yr} - ICRC - Guidelines for Medical Personnel in Conflict Zones.pdf`;
          } else if (/Fracturas de pelvis/i.test(cleanTitle)) {
            newName = `${yr} - SECOT - Fracturas del Anillo Pélvico y Acetábulo.pdf`;
          } else if (/Abordajes Percutáneos/i.test(cleanTitle)) {
            newName = `${yr} - AO Spine - Abordajes Percutáneos en Cirugía de Columna.pdf`;
          } else if (/Abordaje Anterior a la Columna Cervical/i.test(cleanTitle)) {
            newName = `${yr} - AO Spine - Abordaje Anterior a la Columna Cervical.pdf`;
          } else if (/Posterior Thoracolumbar Arthrodesis/i.test(cleanTitle)) {
            newName = `${yr} - AO Spine - Posterior Thoracolumbar Arthrodesis Técnica Quirúrgica.pdf`;
          } else if (/Abordajes Quirúrgicos de Hombro/i.test(cleanTitle)) {
            newName = `${yr} - SECOT - Abordajes Quirúrgicos del Hombro y Cintura Escapular.pdf`;
          } else if (/Damage control resuscitation/i.test(cleanTitle)) {
            newName = `${yr} - Duchesne, Juan C. - Damage Control Resuscitation for Severely Hemorrhagic Patients.pdf`;
          } else if (/Early Appropriate Care Definitive Stabilization/i.test(cleanTitle)) {
            newName = `${yr} - Vallier, Heather A. - Early Appropriate Care Definitive Stabilization of Femoral Fractures.pdf`;
          } else if (/Clasificación de Weber y Cech/i.test(cleanTitle)) {
            newName = `${yr} - Weber, B.G. & Cech, O. - Clasificación y Tratamiento de las Pseudoartrosis.pdf`;
          } else if (/Manual Physical Therapy.*Ankle Sprain/i.test(cleanTitle)) {
            newName = `2013 - Cleland, Joshua A. - Manual Physical Therapy and Exercise for Inversion Ankle Sprain.pdf`;
          } else {
            // General clean: Reemplazar "S - A" por "Monografía Clínica" o "Guía Ortopédica"
            cleanTitle = sanitizeFileName(cleanTitle);
            newName = `${yr} - Revisión Clínica - ${cleanTitle}.pdf`;
          }
        }
      }
    }

    if (newName && newName !== oldName) {
      plans.push({
        folder: item.folder,
        oldName,
        newName,
        fullOld: fullPath,
        fullNew: path.join(path.dirname(fullPath), newName)
      });
    }

    if (count % 500 === 0) {
      console.log(`Evaluados ${count}/${failed.length}...`);
    }
  }

  console.log(`\n=== PLAN DE RENOMBRAMIENTO CONSTRUIDO ===`);
  console.log(`Total acciones planificadas: ${plans.length}`);
  fs.writeFileSync('scratch/bulk_renames_planned.json', JSON.stringify(plans, null, 2), 'utf8');

  // Muestra de planes
  console.log('\nMuestra de 15 planes de renombrado:');
  plans.slice(0, 15).forEach(p => {
    console.log(`• [${p.folder}] "${p.oldName}" -> "${p.newName}"`);
  });
}

planRenames();

