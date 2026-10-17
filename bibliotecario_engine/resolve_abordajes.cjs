const fs = require('fs');
const path = require('path');
const engine = require('./frugal_engine.cjs');

const raw = JSON.parse(
  fs.readFileSync('C:\\Users\\ferna\\.gemini\\antigravity-ide\\brain\\6eb582a7-8ee8-4e38-a79d-e9db6c26c2ab\\scratch\\abordajes_raw_audit.json', 'utf-8')
);

async function resolve() {
  console.log("Resolviendo metadatos de Abordajes...");
  const processed = [];

  for (const item of raw) {
    if (item.filename === 'desktop.ini') continue; // Excluido explícitamente por Regla 12

    let result = {
      num: item.num,
      originalName: item.filename,
      type: item.type,
      sizeMB: (item.sizeKB / 1024).toFixed(1),
      doi: item.doi,
      isbn: item.isbn,
      year: item.year,
      author: null,
      title: null,
      edition: item.edition,
      proposedName: null,
      primaryFolder: 'Abordajes',
      secondaryFolder: null,
      isDuplicate: !!item.isDuplicateOf,
      duplicateTarget: item.isDuplicateOf,
      notes: [...item.notes]
    };

    // Caso 1: Artículos científicos con DOI
    if (item.doi) {
      const meta = await engine.fetchCrossRef(item.doi);
      if (meta) {
        result.year = meta.year || result.year;
        result.author = meta.author;
        result.title = meta.title;
        result.journal = meta.journal;
      }
    }

    // Caso 2: Libros con ISBN
    if (item.isbn && !result.title) {
      const bookMeta = await engine.fetchGoogleBooksByISBN(item.isbn);
      if (bookMeta) {
        result.year = bookMeta.year || result.year;
        result.author = bookMeta.author;
        result.title = bookMeta.title;
        result.publisher = bookMeta.publisher;
      }
    }

    // Heurísticas específicas reconocidas para los tratados clásicos de Abordajes:
    const fn = item.filename;

    if (fn.includes('Bauer') && fn.includes('1987')) {
      result.year = 1987;
      result.author = 'Bauer, Rudolf';
      result.title = 'Operative Approaches in Orthopedic Surgery and Traumatology';
      result.edition = 'Ed. 1';
    } else if (fn.includes('Bauer') || fn.includes('Operative_Approaches') && fn.includes('2ED')) {
      result.year = 1997; // 2nd Edition of Bauer
      result.author = 'Bauer, Rudolf';
      result.title = 'Operative Approaches in Orthopedic Surgery and Traumatology';
      result.edition = 'Ed. 2';
    } else if (fn.includes('Hoppenfeld')) {
      result.year = 2010;
      result.author = 'Hoppenfeld, Stanley';
      result.title = 'Vias De Abordaje En Cirugia Ortopedica Un Enfoque Anatomico';
      result.edition = 'Ed. 4'; // 4ta edición clásica de Marbán/Wolters Kluwer
    } else if (fn.includes('Morrey') && fn.includes('Relevant Surgical Exposures')) {
      result.year = 2008;
      result.author = 'Morrey, Bernard F.';
      result.title = 'Master Techniques in Orthopaedic Surgery Relevant Surgical Exposures';
      result.edition = 'Ed. 2';
    } else if (fn.includes('Wiesel') && fn.includes('Operative Techniques')) {
      result.year = 2015;
      result.author = 'Wiesel, Sam W.';
      result.title = 'Operative Techniques in Orthopaedic Surgery';
      result.edition = 'Ed. 2';
    } else if (fn.includes('Miller') && fn.includes('Knee Surgery')) {
      result.year = 2018;
      result.author = 'Miller, Mark D.';
      result.title = 'Operative Techniques Knee Surgery';
      result.edition = 'Ed. 2';
      result.secondaryFolder = 'Rodilla y Tibia';
    } else if (fn.includes('Miller') && fn.includes('Orthopaedic Surgical Approaches')) {
      if (fn.includes('2E') || fn.includes('2015') || fn.includes('S-A - ORTHOPAEDIC SURGICAL APPROACHES')) {
        result.year = 2015;
        result.author = 'Miller, Mark D.';
        result.title = 'Orthopaedic Surgical Approaches';
        result.edition = 'Ed. 2';
      } else {
        result.year = 2008;
        result.author = 'Miller, Mark D.';
        result.title = 'Orthopaedic Surgical Approaches';
        result.edition = 'Ed. 1';
      }
    } else if (fn.includes('Mirzabeigi') || fn.includes('Atlas of Orthopaedic Surgical Exposures')) {
      result.year = 2000;
      result.author = 'Mirzabeigi, Edwin';
      result.title = 'Atlas of Orthopaedic Surgical Exposures';
    } else if (fn.includes('Ballis') && fn.includes('Lower Limbs')) {
      result.year = 2014;
      result.author = 'Ballis, Rino';
      result.title = 'Atlas of Orthopaedic Surgical Approaches to the Lower Limbs';
      result.secondaryFolder = 'Rodilla y Tibia';
    } else if (fn.includes('Lee') && fn.includes('Shoulder and Elbow')) {
      result.year = 2018;
      result.author = 'Lee, Donald H.';
      result.title = 'Operative Techniques Shoulder and Elbow Surgery';
      result.secondaryFolder = 'Hombro';
    } else if (fn.includes('Malawer')) {
      result.year = 2001;
      result.author = 'Malawer, Martin M.';
      result.title = 'Musculoskeletal Cancer Surgery Treatment of Sarcomas and Allied Diseases';
      result.secondaryFolder = 'Ortopedia Oncologica';
    } else if (fn.includes('Sports Injuries of the Knee')) {
      result.year = 2014;
      result.author = 'Sgaglione, Nicholas A.';
      result.title = 'Sports Injuries of the Knee Surgical Approaches';
      result.secondaryFolder = 'Ortopedia Deportiva y artroscopia';
    } else if (fn.includes('Cory') && fn.includes('Tibial Nailing')) {
      result.year = 2025;
      result.author = 'Cory, J.W.';
      result.title = 'Refined Techniques in Tibial Nailing';
      result.secondaryFolder = 'Rodilla y Tibia';
    } else if (fn.includes('Boluda-Mengod')) {
      result.year = 2021;
      result.author = 'Boluda-Mengod, J.';
      result.title = 'A proposal of a new algorithm for decision-making approaches in open reduction and internal fixation of complex tibial plateau fractures SOTA algorithm';
      result.secondaryFolder = 'Rodilla y Tibia';
    } else if (fn.includes('LUO.jpg')) {
      result.type = 'IMAGEN';
      result.author = 'Luo, Cong-Feng';
      result.year = 2010;
      result.title = 'Anatomia Aplicada al Abordaje de Luo para Fracturas de Platillos Tibiales';
      result.secondaryFolder = 'Rodilla y Tibia';
    } else if (fn.includes('DHS .pptx')) {
      result.type = 'PRESENTACION';
      result.author = 'Técnica Quirúrgica';
      result.year = 2020;
      result.title = 'Tecnica Quirurgica Tornillo Deslizante de Cadera DHS';
      result.secondaryFolder = 'Cadera y Pelvis';
    }

    // Armar nombre propuesto
    const edStr = result.edition ? ` - ${result.edition}` : '';
    const cleanAuth = engine.sanitizeFileName(result.author || 'S-A');
    const cleanTitle = engine.sanitizeFileName(result.title || fn.replace(/\.[^.]+$/, ''));
    const finalExt = path.extname(fn);
    result.proposedName = `${result.year || 'S-F'} - ${cleanAuth} - ${cleanTitle}${edStr}${finalExt}`;

    processed.push(result);
  }

  fs.writeFileSync(
    'C:\\Users\\ferna\\.gemini\\antigravity-ide\\brain\\6eb582a7-8ee8-4e38-a79d-e9db6c26c2ab\\scratch\\abordajes_resolved.json',
    JSON.stringify(processed, null, 2),
    'utf-8'
  );
  console.log("Resolución de Abordajes guardada en abordajes_resolved.json");
}

resolve();
