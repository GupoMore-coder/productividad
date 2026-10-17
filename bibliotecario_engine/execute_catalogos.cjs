const fs = require('fs');
const path = require('path');
const { computeSha256, globalRegistry, saveGlobalRegistry } = require('../bibliotecario_engine/frugal_engine.cjs');

const ROOT = 'H:\\Mi unidad\\Información Ortopedia';
const FOLDER = path.join(ROOT, 'Catálogos de Materiales ortopédicos');
const MUSIC_DEST = 'C:\\Users\\ferna\\Music';

// 1. Duplicados a trasladar a Música
const duplicatesToMove = [
  {
    oldName: 'S-F - S-A - DOCUMENTACIÓN DEL PRODUCTO.pdf',
    backupName: 'S-F - DePuy Synthes - Corail Hip System Documentacion (Copia Duplicada de Catalogos).pdf'
  },
  {
    oldName: 'S-F - S-A - MEGASYSTEM C Tumor and Revision System Surgical Technique.pdf',
    backupName: 'S-F - Waldemar Link - MEGASYSTEM-C Tumor and Revision System (Copia Duplicada de Catalogos).pdf'
  }
];

// 2. Operaciones de renombramiento y copias multi-tópico
const operations = [
  {
    old: '2023 - S-A - Innovations.pdf',
    new: '2023 - DePuy Synthes - Innovations AO Technical Commission Approved.pdf',
    copies: ['Materiales Osteosintesis']
  },
  {
    old: 'S-F - S-A - Cannulated Screw System Surgical Technique.pdf',
    new: 'S-F - DePuy Synthes - Cannulated Screw System 6.5-8.0 mm Surgical Technique.pdf',
    copies: ['Materiales Osteosintesis']
  },
  {
    old: 'S-F - AO Technical Commission - Sistema de Clavos Retrógrado Femoral.pdf',
    new: 'S-F - DePuy Synthes - RFN-Advanced Sistema de Clavos Retrógrado Femoral Técnica Quirúrgica.pdf',
    copies: ['Femur', 'Materiales Osteosintesis']
  },
  {
    old: 'S-F - Vidalain - Corail.pdf',
    new: 'S-F - DePuy Synthes - Corail Hip System Documentación del Producto.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'S-F - S-A - Catalogo Osteomedical.pdf',
    new: 'S-F - OsteoMedical - Catálogo General de Implantes de Ortopedia.pdf',
    copies: ['Materiales Osteosintesis']
  },
  {
    old: 'S-F - Caillouette - Surgical Technique Corail Hip System.pdf',
    new: 'S-F - DePuy Synthes - Corail Hip System Surgical Technique.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'S-F - Ranawat - Primary Cruciate-Retaining & Cruciate-Substituting Procedure P.F.C. Sigma Knee Systems Surgical Technique.pdf',
    new: 'S-F - DePuy Synthes - PFC Sigma Knee Systems Cruciate Retaining and Substituting Surgical Technique.pdf',
    copies: ['Rodilla y Tibia']
  },
  {
    old: 'S-F - Bourne - Surgical Technique Distal Cut First.pdf',
    new: 'S-F - Smith and Nephew - Genesis II Total Knee System Surgical Technique Distal Cut First.pdf',
    copies: ['Rodilla y Tibia']
  },
  {
    old: 'S-F - S-A - Protesis Total de Rodilla Movil.pdf',
    new: 'S-F - Groupe Lépine - Prótesis Total de Rodilla Móvil New Wave Técnica Quirúrgica.pdf',
    copies: ['Rodilla y Tibia']
  },
  {
    old: 'S-F - S-A - Sistema de Rodilla Triathlon TS.pdf',
    new: 'S-F - Stryker - Sistema de Rodilla Triathlon TS Técnica Quirúrgica.pdf',
    copies: ['Rodilla y Tibia']
  },
  {
    old: 'S-F - S-A - Trident Acetabular System PSL Surgical Protocol.pdf',
    new: 'S-F - Stryker - Trident Acetabular System PSL Surgical Protocol.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'S-F - S-A - Design rationale Accolade II Femoral Hip Stem.pdf',
    new: 'S-F - Stryker - Accolade II Femoral Hip Stem Design Rationale.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'S-F - S-A - Accolade II Femoral Hip System Surgical protocol.pdf',
    new: 'S-F - Stryker - Accolade II Femoral Hip System Surgical Protocol.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'S-F - Expert - Técnica quirúrgica Expert RAFN Clavo femoral retrógradoanterógrado.pdf',
    new: 'S-F - DePuy Synthes - Expert RAFN Clavo Femoral Retrógrado y Anterógrado Técnica Quirúrgica.pdf',
    copies: ['Femur']
  },
  {
    old: 'S-F - S-A - Sistema modular de cuello femoral.pdf',
    new: 'S-F - Merete - BioBall Sistema Modular de Cuello Femoral.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'S-F - S-A - Distal Biceps Repair using the BicepsButton and Tension-Slide Technique.pdf',
    new: 'S-F - Arthrex - Distal Biceps Repair using BicepsButton and Tension-Slide Technique.pdf',
    copies: ['Codo', 'Ortopedia Deportiva y artroscopia']
  },
  {
    old: 'S-F - S-A - Clavo Expert para artrodesis de la parte posterior del pie.pdf',
    new: 'S-F - DePuy Synthes - Expert HAN Clavo para Artrodesis Posterior del Pie Técnica Quirúrgica.pdf',
    copies: ['Pie y Tobillo']
  },
  {
    old: '2020 - f.marín - ExtremiLock APS y Fusión Sistema de Placas de Tobillo.pdf',
    new: '2020 - OsteoMed - ExtremiLock Ankle Plating System APS y Fusión Técnica Quirúrgica.pdf',
    copies: ['Pie y Tobillo']
  },
  {
    old: 'S-F - S-A - MEGASYSTEM-C Tumor and Revision System Surgical Technique.pdf',
    new: 'S-F - Waldemar Link - MEGASYSTEM-C Tumor and Revision System Surgical Technique.pdf',
    copies: ['Ortopedia Oncologica', 'Reconstructiva']
  },
  {
    old: 'NX Professional Femoral Nail Surgical Tech (1).pdf',
    new: 'S-F - Stryker - T2 Recon and NX Professional Femoral Nail Surgical Technique.pdf',
    copies: ['Femur']
  },
  {
    old: 'S-F - S-A - Estudio de rodilla.pdf',
    new: 'S-F - DePuy Synthes - Sistema TFN Clavo Trocantéreo de Titanio Técnica Quirúrgica.pdf',
    copies: ['Femur', 'Cadera y Pelvis']
  },
  {
    old: 'S-F - S-A - Técnica Quirúrgica Sistema De Banda De Cerclaje.pdf',
    new: 'S-F - aap Implantate - Sistema de Banda de Cerclaje Técnica Quirúrgica.pdf',
    copies: ['Materiales Osteosintesis']
  },
  {
    old: 'S-F - S-A - Sistema DHS DCS.pdf',
    new: 'S-F - DePuy Synthes - Sistema DHS-DCS y Placas LCP Técnica Quirúrgica.pdf',
    copies: ['Femur', 'Cadera y Pelvis']
  },
  {
    old: 'S-F - S-A - Integra TITAN Reverse Prótesis Inversa Tecnica Quirurgica.pdf',
    new: 'S-F - Integra LifeSciences - TITAN Reverse Prótesis Inversa de Hombro Técnica Quirúrgica.pdf',
    copies: ['Hombro']
  },
  {
    old: 'S-F - S-A - Sistema para fracturas de cuello femoral.pdf',
    new: 'S-F - DePuy Synthes - FNS Sistema para Fracturas de Cuello Femoral Técnica Quirúrgica.pdf',
    copies: ['Femur', 'Cadera y Pelvis']
  },
  {
    old: 'S-F - Smith - SpeedBridge para el tendón de Aquiles.pdf',
    new: 'S-F - Arthrex - SpeedBridge para el Tendón de Aquiles Técnica Quirúrgica.pdf',
    copies: ['Pie y Tobillo', 'Ortopedia Deportiva y artroscopia']
  },
  {
    old: 'S-F - S-A - Syndesmosis TightRope XP Implant System.pdf',
    new: 'S-F - Arthrex - Syndesmosis TightRope XP Implant System Surgical Technique.pdf',
    copies: ['Pie y Tobillo']
  },
  {
    old: 'S-F - S-A - Expert Nailing System With Radiolucent Instrumentation Titanium Cannulated Adolescent Lateral Entry Femoral Nail Surgical Technique.pdf',
    new: 'S-F - DePuy Synthes - Expert ALFN Adolescent Lateral Entry Femoral Nail Surgical Technique.pdf',
    copies: ['Ortopedia Pediatrica', 'Femur']
  },
  {
    old: 'S-F - S-A - Femoral Neck System Surgical Technique.pdf',
    new: 'S-F - DePuy Synthes - FNS Femoral Neck System Surgical Technique.pdf',
    copies: ['Femur', 'Cadera y Pelvis']
  },
  {
    old: 'S-F - I.T.S. GmbH - Pelvic Reconstruction System.pdf',
    new: 'S-F - ITS GmbH - Pelvic Reconstruction System PHOENIX Surgical Technique 56p.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'S-F - S-A - Evolving Possibilities.pdf',
    new: 'S-F - DePuy Synthes - VA-LCP Variable Angle Mini Fragmentation System Evolving Possibilities.pdf',
    copies: ['Materiales Osteosintesis']
  },
  {
    old: 'S-F - Nailing - Expert Nailing System Clavo tibial.pdf',
    new: 'S-F - DePuy Synthes - Expert Nailing System Clavo Tibial Técnica Quirúrgica.pdf',
    copies: ['Rodilla y Tibia']
  },
  {
    old: 'S-F - S-A - Pelvis and Acetabulum System Operative technique.pdf',
    new: 'S-F - Stryker - Pelvis and Acetabulum System Matta Plates Operative Technique.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'S-F - S-A - Pelvic Reconstruction System PHOENIX Surgical Technique Implants for Trauma Surgery.pdf',
    new: 'S-F - ITS GmbH - Pelvic Reconstruction System PHOENIX Surgical Technique 72p.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'S-F - S-A - TÉCNICA QUIRÚRGICA Sistema DHS DCS.pdf',
    new: 'S-F - DePuy Synthes - Sistema DHS-DCS Guía Rápida de Técnica Quirúrgica.pdf',
    copies: ['Femur', 'Cadera y Pelvis']
  },
  {
    old: 'S-F - S-A - Protesis de Rodilla Instrumental Tecnica Quirurgica.pdf',
    new: 'S-F - Biomet - Vanguard Complete Knee System Instrumental y Técnica Quirúrgica.pdf',
    copies: ['Rodilla y Tibia']
  },
  {
    old: 'Brochure Sistema Affinity Tibia Proxinal SAN PEDRO.pdf',
    new: 'S-F - San Pedro Biomédica - Sistema Affinity Tibia Proximal Técnica Quirúrgica.pdf',
    copies: ['Rodilla y Tibia']
  },
  {
    old: 'TECNICA QUIRURGICA PROTESIS TOTAL DE CADERA.pdf',
    new: 'S-F - JRI Orthopaedics - Sistema Total de Cadera Furlong HAC Técnica Quirúrgica.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'Tecnica-Quirurgica-PROTESIS TOTAL DE CADERA BIOADVANCE.pdf',
    new: 'S-F - Bioadvance - Prótesis Total de Cadera MP-TP MF ACP AC-II Técnica Quirúrgica.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'Brochure COPA BIPOLAR UHL- LÉPINE COLOMBIA.pdf',
    new: 'S-F - Groupe Lépine - Copa Bipolar Universal UHL Técnica Quirúrgica.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'VASTAGO PAVI.pdf',
    new: 'S-F - Groupe Lépine - Vástago Femoral PAVI Documentación de Implantes.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'Técnica Quirúrgica Pavi.pdf',
    new: 'S-F - Groupe Lépine - Vástago Femoral PAVI HAP y Cementado Técnica Quirúrgica.pdf',
    copies: ['Cadera y Pelvis']
  }
];

async function execute() {
  console.log('=== INICIANDO EJECUCIÓN CATÁLOGOS DE MATERIALES ORTOPÉDICOS ===');

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
      folder: 'Catálogos de Materiales ortopédicos'
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
  console.log(`=== CATÁLOGOS FINALIZADO: ${renamed} renombrados, 2 duplicados (14.2MB) movidos a Música, ${copied} copias multi-tópico creadas ===`);
}

execute();
