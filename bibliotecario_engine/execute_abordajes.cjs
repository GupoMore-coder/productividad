const fs = require('fs');
const path = require('path');
const engine = require('./frugal_engine.cjs');

const ROOT = 'H:\\Mi unidad\\Información Ortopedia';
const ABORDAJES = path.join(ROOT, 'Abordajes');
const MUSIC_DEST = 'C:\\Users\\ferna\\Music';

const resolvedData = JSON.parse(
  fs.readFileSync('C:\\Users\\ferna\\.gemini\\antigravity-ide\\brain\\6eb582a7-8ee8-4e38-a79d-e9db6c26c2ab\\scratch\\abordajes_resolved.json', 'utf-8')
);

function executeAbordajes() {
  console.log("=== INICIANDO EJECUCIÓN FÍSICA EN ABORDAJES ===");
  if (!fs.existsSync(MUSIC_DEST)) fs.mkdirSync(MUSIC_DEST, { recursive: true });

  // 1. Manejar duplicados a Música
  // - S-F - S-A - ORTHOPAEDIC SURGICAL APPROACHES.pdf (duplicado idéntico de Miller 2015)
  // - S-F - S-A - Atlas of Orthopaedic Surgical Exposures.pdf (duplicado de baja calidad de Mirzabeigi 2000)
  const dupes = [
    {
      src: path.join(ABORDAJES, 'S-F - S-A - ORTHOPAEDIC SURGICAL APPROACHES.pdf'),
      targetName: '2015 - Miller, Mark D. - Orthopaedic Surgical Approaches - Ed. 2 (Copia Duplicada).pdf'
    },
    {
      src: path.join(ABORDAJES, 'S-F - S-A - Atlas of Orthopaedic Surgical Exposures.pdf'),
      targetName: '2000 - Jordan, Christopher - Atlas of Orthopaedic Surgical Exposures (Copia Baja Calidad).pdf'
    }
  ];

  for (const d of dupes) {
    if (fs.existsSync(d.src)) {
      const dest = path.join(MUSIC_DEST, d.targetName);
      fs.copyFileSync(d.src, dest);
      fs.unlinkSync(d.src);
      console.log(`  [Música] Duplicado trasladado: ${d.targetName}`);
    } else {
      console.log(`  [Aviso] Duplicado no encontrado: ${d.src}`);
    }
  }

  // 2. Renombrar archivos restantes en Abordajes y crear copias multi-tópico
  const renames = [
    {
      old: '2008 - Morrey - Master Techniques in Orthopaedic Surgery Relevant Surgical Exposures.pdf',
      new: '2008 - Morrey, Bernard F. - Master Techniques in Orthopaedic Surgery Relevant Surgical Exposures - Ed. 2.pdf'
    },
    {
      old: '2015 - Wiesel - Operative Techniques in Orthopaedic Surgery.pdf',
      new: '2015 - Wiesel, Sam W. - Operative Techniques in Orthopaedic Surgery - Ed. 2.pdf'
    },
    {
      old: '2010 - Hoppenfeld - Vias De Abordaje En Cirugia Ortopedica Un Enfoque Anatomico.pdf',
      new: '2010 - Hoppenfeld, Stanley - Vias De Abordaje En Cirugia Ortopedica Un Enfoque Anatomico - Ed. 4.pdf'
    },
    {
      old: 'S-F - Jordan Edwin Mirzabeigi I - Atlas of Orthopaedic Surgical Exposures.pdf',
      new: '2000 - Jordan, Christopher - Atlas of Orthopaedic Surgical Exposures.pdf'
    },
    {
      old: '1987 - Bauer - Operative Approaches in Orthopedic Surgery and Traumatology.pdf',
      new: '1987 - Bauer, Rudolf - Operative Approaches in Orthopedic Surgery and Traumatology - Ed. 1.pdf'
    },
    {
      old: 'Operative_Approaches_in_Orthopedic_Surgery_and_Traumatology_2ED.pdf',
      new: '1997 - Bauer, Rudolf - Operative Approaches in Orthopedic Surgery and Traumatology - Ed. 2.pdf'
    },
    {
      old: '2008 - Miller - Orthopaedic Surgical Approaches.pdf',
      new: '2008 - Miller, Mark D. - Orthopaedic Surgical Approaches - Ed. 1.pdf'
    },
    {
      old: 'Orthopaedic Surgical Approaches, 2E (2015).pdf',
      new: '2015 - Miller, Mark D. - Orthopaedic Surgical Approaches - Ed. 2.pdf'
    },
    {
      old: '2018 - Miller - Operative Techniques Knee Surgery 2 Ed.pdf',
      new: '2018 - Miller, Mark D. - Operative Techniques Knee Surgery - Ed. 2.pdf',
      copyTo: 'Rodilla y Tibia'
    },
    {
      old: 'S-F - Lee - Operative Techniques Shoulder and Elbow Surgery.pdf',
      new: '2018 - Lee, Donald H. - Operative Techniques Shoulder and Elbow Surgery.pdf',
      copyTo: 'Hombro'
    },
    {
      old: 'S-F - Malawer - Estudio de Oncologia Ortopedica.pdf',
      new: '2001 - Malawer, Martin M. - Musculoskeletal Cancer Surgery Treatment of Sarcomas and Allied Diseases.pdf',
      copyTo: 'Ortopedia Oncologica'
    },
    {
      old: 'S-F - Ballis - Atlas of Orthopaedic Surgical Approaches to the Lower Limbs.pdf',
      new: '2014 - Ballis, Rino - Atlas of Orthopaedic Surgical Approaches to the Lower Limbs.pdf',
      copyTo: 'Rodilla y Tibia'
    },
    {
      old: 'S-F - S-A - Sports Injuries of the Knee Surgical Approaches.pdf',
      new: '2014 - Sgaglione, Nicholas A. - Sports Injuries of the Knee Surgical Approaches.pdf',
      copyTo: 'Ortopedia Deportiva y artroscopia'
    },
    {
      old: '2025 - Cory - Refined Techniques in Tibial Nailing.pdf',
      new: '2025 - Cory, J.W. - Refined Techniques in Tibial Nailing.pdf',
      copyTo: 'Rodilla y Tibia'
    },
    {
      old: '2021 - Boluda-Mengod - A proposal of a new algorithm for decision-making approaches in open reduction and internal fixation of complex tibial plateau fractures - SOTA algorithm.pdf',
      new: '2021 - Boluda-Mengod, J. - Decision-Making Approaches in Open Reduction and Internal Fixation of Complex Tibial Plateau Fractures.pdf',
      copyTo: 'Rodilla y Tibia'
    },
    {
      old: 'ANATOMIA APLICADA AL ABORDAJE DE LUO.jpg',
      new: '2010 - Luo, Cong-Feng - Anatomia Aplicada al Abordaje de Luo para Fracturas de Platillos Tibiales.jpg',
      copyTo: 'Rodilla y Tibia'
    },
    {
      old: 'Tecnica quirurgica DHS .pptx',
      new: '2020 - Tecnica Quirurgica - Tornillo Deslizante de Cadera DHS.pptx',
      copyTo: 'Cadera y Pelvis'
    }
  ];

  for (const r of renames) {
    const oldP = path.join(ABORDAJES, r.old);
    const newP = path.join(ABORDAJES, r.new);

    if (fs.existsSync(oldP)) {
      fs.renameSync(oldP, newP);
      console.log(`  [Abordajes] Renombrado: ${r.new}`);

      // Copia multi-tópico
      if (r.copyTo) {
        const targetDir = path.join(ROOT, r.copyTo);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        const targetFile = path.join(targetDir, r.new);
        fs.copyFileSync(newP, targetFile);
        console.log(`    -> Copia Multi-tópico enviada a [${r.copyTo}]`);
      }
    } else {
      console.log(`  [Aviso] Archivo original no encontrado: ${r.old}`);
    }
  }

  console.log("=== EJECUCIÓN EN ABORDAJES COMPLETADA CON ÉXITO ===");
}

executeAbordajes();
