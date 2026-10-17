const fs = require('fs');
const path = require('path');
const { computeSha256, globalRegistry, saveGlobalRegistry } = require('../bibliotecario_engine/frugal_engine.cjs');

const ROOT = 'H:\\Mi unidad\\Información Ortopedia';
const CODO = path.join(ROOT, 'Codo');

const operations = [
  {
    old: 'S-F - Álvarez S. - ABORDAJES QUIRÑRGICOS DEL CODO.pdf',
    new: 'S-F - Álvarez, Roselyn C. - Abordajes Quirúrgicos del Codo.pdf',
    copyTo: 'Abordajes'
  },
  {
    old: 'S-F - S-A - Estudio de rodilla.pdf',
    new: 'S-F - Vicente Quílez, María - Fracturas y fracturas-luxaciones del codo en el adulto.pdf'
  },
  {
    old: 'S-F - García Portabella - Inestabilidad compleja aguda de codo.pdf',
    new: '2010 - García Portabella, M. - Inestabilidad compleja aguda de codo etiopatogenia, diagnóstico y estrategia quirúrgica razonada.pdf'
  },
  {
    old: '2023 - S-A - La luxacion del codo.pdf',
    new: '2000 - Antuña, Samuel A. - Inestabilidad del codo Etiología, diagnóstico y tratamiento.pdf'
  },
  {
    old: 'S-F - JOSÉ M. VARAONA y JUAN P. SIMONE - Inestabilidad del codo.pdf',
    new: '2006 - Varaona, José M. - Inestabilidad del codo.pdf'
  },
  {
    old: 'S-F - S-A - Reconstrucción del ligamento lateral del codo con injerto tendinoso en pacientes con inestabilidad posterolateral crónica.pdf',
    new: '2016 - Gallucci, Gerardo Luis - Inestabilidad posterolateral crónica de codo Reconstrucción ligamentaria.pdf'
  },
  {
    old: '2014 - AAOS - Comprehensive Orthopaedic Review.pdf',
    new: '2014 - AAOS - Comprehensive Orthopaedic Review Codo.pdf'
  },
  {
    old: 'S-F - Mehta - Surgical approaches to the elbow.pdf',
    new: '2004 - Mehta, Janak A. - Surgical approaches to the elbow.pdf',
    copyTo: 'Abordajes'
  },
  {
    old: '2024 - Mansat - Prótesis total de codo primaria.pdf',
    new: '2024 - Mansat, Pierre - Prótesis total de codo primaria EMC.pdf',
    copyTo: 'Reconstructiva'
  },
  {
    old: 'operative technique in shoulder and elbow surgery .pdf',
    new: '2022 - Wiesel, Sam W. - Operative Techniques in Shoulder and Elbow Surgery - Ed. 3.pdf',
    copyTo: 'Hombro'
  },
  {
    old: '2023 - Acosta Batlle - Revisión de la anatomía y la patología del complejo del ligamento colateral común en la muñeca mediante RM.pdf',
    new: '2019 - Acosta Batlle, José - The elbow review of anatomy and common collateral ligament complex pathology using MRI.pdf',
    copyTo: 'Mano'
  },
  {
    old: 'S-F - Dines - Guia para el Diagnostico y Tratamiento de la Lesion del Ligamento Collateral Ulnar del Codo.pdf',
    new: '2021 - Dines, Joshua S. - Elbow Ulnar Collateral Ligament Injury Diagnosis and Management.pdf'
  },
  {
    old: '2008 - Jeon - Osborne-Cotterill Lesion An Osseous Defect of the Capitellum Associated with Instability of the Elbow.pdf',
    new: '2008 - Jeon, In-Ho - Osborne-Cotterill Lesion An Osseous Defect of the Capitellum Associated with Instability of the Elbow.pdf'
  },
  {
    old: '2004 - McKee - Standard Surgical Protocol to Treat Elbow Dislocations with Radial Head and Coronoid Fractures Surgical Technique.pdf',
    new: '2005 - McKee, Michael D. - Standard Surgical Protocol to Treat Elbow Dislocations with Radial Head and Coronoid Fractures.pdf',
    copyTo: 'Abordajes'
  },
  {
    old: '2023 - Karjalainen - Is it time to reconsider the indications for surgery in patients with tennis elbow.pdf',
    new: '2023 - Karjalainen, Ville - Is it time to reconsider the indications for surgery in patients with tennis elbow.pdf'
  },
  {
    old: '1995 - Morrey - Clasificacion de las fracturas del olecranon.pdf',
    new: 'S-F - S-A - Clasificación de las Fracturas del Olécranon y Cúbito Proximal.pdf'
  },
  {
    old: 'S-F - S-A - Fracturas complejas de codo.pdf',
    new: '2006 - Sánchez Martín, M.M. - Fracturas complejas del codo en el adulto.pdf'
  },
  {
    old: '2007 - del Río Mangada - Chirurgie de lxe9paule et du coude.pdf',
    new: '2007 - del Río Mangada, M. - Chirurgie de lépaule et du coude EMC.pdf',
    copyTo: 'Hombro'
  },
  {
    old: 'S-F - S-A - Traumatismos del codo del antebrazo.pdf',
    new: 'S-F - S-A - Traumatismos del Codo y del Antebrazo.pdf'
  },
  {
    old: '2016 - Latouche - Semiologia de Codo.pdf',
    new: '2016 - Latouche, Roy - Semiología de Codo.pdf'
  },
  {
    old: '2003 - Von Schroeder y Sckeker - Estudio sobre la compresión del nervio cubital en la extremidad superior.pdf',
    new: '2006 - Salvá Coll, G. - Neuropatía compresiva del nervio cubital en el codo diagnóstico y tratamiento.pdf',
    copyTo: 'Mano'
  },
  {
    old: 'S-F - María Jiménez Fernández - Fracturas del codo.pdf',
    new: 'S-F - Jiménez Fernández, María - Abordajes y Fracturas del Codo.pdf',
    copyTo: 'Abordajes'
  },
  {
    old: 'S-F - Quiroz Gurrea - Abordajes Quirurgicos de Codo.pdf',
    new: 'S-F - Quiroz Gurrea, R. - Abordajes Quirúrgicos de Codo.pdf',
    copyTo: 'Abordajes'
  },
  {
    old: 'S-F - Hoppenfeld - Hoppenfeld.pdf',
    new: 'S-F - Oroño, Yarmey - Vías de Abordaje del Codo según Hoppenfeld.pdf',
    copyTo: 'Abordajes'
  },
  {
    old: '2022 - Carroll - Posterior approach to terrible triad injuries.pdf',
    new: '2022 - Carroll, Patrick J. - Posterior (Boyd) approach to terrible triad injuries.pdf',
    copyTo: 'Abordajes'
  },
  {
    old: '2021 - Ohl - Surgical treatment of terrible triad of the elbow.pdf',
    new: '2021 - Ohl, Xavier - Surgical treatment of terrible triad of the elbow.pdf'
  }
];

async function execute() {
  console.log('=== INICIANDO EJECUCIÓN CODO ===');
  let renamed = 0;
  let copied = 0;

  for (const op of operations) {
    const srcPath = path.join(CODO, op.old);
    const destPath = path.join(CODO, op.new);

    if (!fs.existsSync(srcPath)) {
      if (fs.existsSync(destPath)) {
        console.log(`[YA RENOMBRADO] ${op.new}`);
      } else {
        console.error(`[NO ENCONTRADO] ${op.old}`);
      }
      continue;
    }

    // Renombrar
    if (srcPath !== destPath) {
      fs.renameSync(srcPath, destPath);
      console.log(`[RENOMBRADO] ${op.old} -> ${op.new}`);
      renamed++;
    }

    // Hash y registro
    const hash = computeSha256(destPath);
    globalRegistry.hashes[hash] = {
      path: path.relative(ROOT, destPath),
      canonicalName: op.new,
      folder: 'Codo'
    };

    // Copia multi-tópico
    if (op.copyTo) {
      const targetDir = path.join(ROOT, op.copyTo);
      if (fs.existsSync(targetDir)) {
        const copyPath = path.join(targetDir, op.new);
        if (!fs.existsSync(copyPath)) {
          fs.copyFileSync(destPath, copyPath);
          console.log(`  -> [COPIA MULTI-TÓPICO] Creada en ${op.copyTo}/${op.new}`);
          copied++;
        } else {
          console.log(`  -> [COPIA MULTI-TÓPICO EXISTENTE] en ${op.copyTo}/${op.new}`);
        }
      } else {
        console.warn(`  -> [ALERTA] Carpeta destino ${op.copyTo} no existe`);
      }
    }
  }

  saveGlobalRegistry(globalRegistry);
  console.log(`=== CODO FINALIZADO: ${renamed} renombrados, ${copied} copias multi-tópico, registro actualizado ===`);
}

execute();
