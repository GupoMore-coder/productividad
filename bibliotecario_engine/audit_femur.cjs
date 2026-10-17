const fs = require('fs');
const path = require('path');
const engine = require('./frugal_engine.cjs');
const { PDFParse } = require('C:/Users/ferna/Documents/Biblioteca Premium/node_modules/pdf-parse');

const DIR_FEMUR = 'H:\\Mi unidad\\Información Ortopedia\\Femur';

async function auditAndResolveFemur() {
  const items = fs.readdirSync(DIR_FEMUR).filter(f => f.toLowerCase().endsWith('.pdf'));
  console.log(`Analizando ${items.length} archivos en Femur...`);

  const results = [];
  const hashMap = {};

  for (let i = 0; i < items.length; i++) {
    const filename = items[i];
    const fullPath = path.join(DIR_FEMUR, filename);
    const stat = fs.statSync(fullPath);

    const hash = engine.computeSha256(fullPath);
    let isDupe = false;
    let dupeOf = null;

    if (hashMap[hash]) {
      isDupe = true;
      dupeOf = hashMap[hash];
    } else {
      hashMap[hash] = filename;
    }

    let itemReport = {
      num: i + 1,
      filename: filename,
      sizeKB: Math.round(stat.size / 1024),
      sha256: hash,
      isDuplicate: isDupe,
      duplicateOf: dupeOf,
      doi: null,
      year: null,
      author: null,
      title: null,
      edition: null,
      proposedName: null,
      primaryFolder: 'Femur',
      secondaryFolder: null
    };

    // Leer texto de primeras 3 páginas
    try {
      const buffer = fs.readFileSync(fullPath);
      const parser = new PDFParse({ data: buffer });
      const res = await parser.getText({ first: 3 });
      const text = res.text || '';
      await parser.destroy();

      // DOI
      const doiMatch = text.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);
      if (doiMatch) {
        itemReport.doi = doiMatch[0].replace(/[;.,)]$/, '');
      }

      // Si hay DOI, consultar CrossRef
      if (itemReport.doi) {
        const meta = await engine.fetchCrossRef(itemReport.doi);
        if (meta) {
          itemReport.year = meta.year || itemReport.year;
          itemReport.author = meta.author;
          itemReport.title = meta.title;
          itemReport.journal = meta.journal;
        }
      }

      // Heurísticas específicas reconocidas si falta autor o título
      const fn = filename.toLowerCase();

      // Caso canónico Tornetta III
      if (fn.includes('tornetta')) {
        itemReport.year = 2007;
        itemReport.author = 'Tornetta III, Paul';
        itemReport.title = 'Diagnosis of Femoral Neck Fractures in Patients with a Femoral Shaft Fracture Improvement with a Standard Protocol';
        itemReport.secondaryFolder = 'Cadera y Pelvis';
      } else if (fn.includes('hoffa') || fn.includes('colmenares')) {
        itemReport.year = 2018;
        itemReport.author = itemReport.author || 'Colmenares-Sandoval, K.';
        itemReport.title = itemReport.title || 'Principios quirúrgicos y biomecánicos de los métodos de fijación actual en el tratamiento de fracturas de Hoffa';
        itemReport.secondaryFolder = 'Rodilla y Tibia';
      } else if (fn.includes('swashbuckler') || fn.includes('raja')) {
        itemReport.year = itemReport.year || 2021;
        itemReport.author = itemReport.author || 'Raja, S.';
        itemReport.title = itemReport.title || 'Swashbuckler approach for distal femur fractures A systematic review';
        itemReport.secondaryFolder = 'Rodilla y Tibia';
      } else if (fn.includes('palm')) {
        itemReport.year = 2012;
        itemReport.author = 'Palm, Henrik';
        itemReport.title = 'Un nuevo algoritmo para la cirugía de fracturas de cadera';
        itemReport.secondaryFolder = 'Cadera y Pelvis';
      } else if (fn.includes('girdlestone') || fn.includes('condell')) {
        itemReport.secondaryFolder = 'Cadera y Pelvis';
      } else if (fn.includes('distal femur') || fn.includes('babhulkar')) {
        itemReport.secondaryFolder = 'Rodilla y Tibia';
      }

      // Si el autor o título aún son nulos, limpiar nombre original
      if (!itemReport.title) {
        itemReport.title = engine.sanitizeFileName(filename.replace(/^(?:\d{4}|S-F)\s*-\s*[^-]+-\s*/, '').replace(/\.pdf$/i, ''));
      }
      if (!itemReport.author) {
        const aM = filename.match(/^(?:\d{4}|S-F)\s*-\s*([^-]+)\s*-\s*/);
        itemReport.author = aM && aM[1].trim() !== 'S-A' ? engine.sanitizeFileName(aM[1].trim()) : 'S-A';
      }
      if (!itemReport.year) {
        const yM = filename.match(/\b(19\d\d|20\d\d)\b/);
        itemReport.year = yM ? parseInt(yM[0]) : 'S-F';
      }

    } catch (e) {
      console.error(`Error leyendo ${filename}:`, e.message);
    }

    const edStr = itemReport.edition ? ` - ${itemReport.edition}` : '';
    itemReport.proposedName = `${itemReport.year || 'S-F'} - ${engine.sanitizeFileName(itemReport.author || 'S-A')} - ${engine.sanitizeFileName(itemReport.title)}${edStr}.pdf`;

    results.push(itemReport);
  }

  fs.writeFileSync(
    'C:\\Users\\ferna\\.gemini\\antigravity-ide\\brain\\6eb582a7-8ee8-4e38-a79d-e9db6c26c2ab\\scratch\\femur_resolved.json',
    JSON.stringify(results, null, 2),
    'utf-8'
  );
  console.log("Resolución de Femur guardada en femur_resolved.json");
}

auditAndResolveFemur();
