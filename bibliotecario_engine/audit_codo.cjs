const fs = require('fs');
const path = require('path');
const engine = require('./frugal_engine.cjs');
const { PDFParse } = require('C:/Users/ferna/Documents/Biblioteca Premium/node_modules/pdf-parse');

const DIR_CODO = 'H:\\Mi unidad\\Información Ortopedia\\Codo';

async function auditAndResolveCodo() {
  const items = fs.readdirSync(DIR_CODO).filter(f => f.toLowerCase().endsWith('.pdf'));
  console.log(`Analizando ${items.length} archivos en Codo...`);

  const results = [];
  const hashMap = {};

  for (let i = 0; i < items.length; i++) {
    const filename = items[i];
    const fullPath = path.join(DIR_CODO, filename);
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
      primaryFolder: 'Codo',
      secondaryFolder: null,
      hadBugTitle: filename.includes('Estudio de rodilla') || filename.includes('QUIRÑRGICOS')
    };

    try {
      const buffer = fs.readFileSync(fullPath);
      const parser = new PDFParse({ data: buffer });
      const res = await parser.getText({ first: 4 });
      const text = res.text || '';
      await parser.destroy();

      // DOI
      const doiMatch = text.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);
      if (doiMatch) {
        itemReport.doi = doiMatch[0].replace(/[;.,)]$/, '');
      }

      if (itemReport.doi) {
        const meta = await engine.fetchCrossRef(itemReport.doi);
        if (meta) {
          itemReport.year = meta.year || itemReport.year;
          itemReport.author = meta.author;
          itemReport.title = meta.title;
          itemReport.journal = meta.journal;
        }
      }

      // Buscar año en texto si falta
      if (!itemReport.year) {
        const years = text.match(/\b(19[7-9]\d|20[0-2]\d)\b/g);
        if (years) itemReport.year = parseInt(years[0]);
      }

      // Buscar snippets y resolver heurísticas de títulos corruptos
      itemReport.snippet = text.substring(0, 800).replace(/[\r\n\t]+/g, ' ').trim();

      // Heurísticas específicas de los archivos de Codo
      const fn = filename.toLowerCase();

      if (fn.includes('estudio de rodilla')) {
        // Extraer el título real del texto
        itemReport.title = 'Inestabilidad y Tratamiento de Fracturas Luxaciones de Codo';
      } else if (fn.includes('chirurgie de lxe9paule') || fn.includes('del río')) {
        itemReport.year = 2007;
        itemReport.author = 'del Río Mangada, M.';
        itemReport.title = 'Chirurgie de lépaule et du coude EMC';
        itemReport.secondaryFolder = 'Hombro';
      } else if (fn.includes('mansat') && fn.includes('prótesis total de codo')) {
        itemReport.year = 2024;
        itemReport.author = 'Mansat, Pierre';
        itemReport.title = 'Prótesis total de codo primaria EMC';
        itemReport.secondaryFolder = 'Reconstructiva';
      } else if (fn.includes('muñeca') || fn.includes('acosta batlle')) {
        itemReport.secondaryFolder = 'Mano';
      } else if (fn.includes('abordaje') || fn.includes('approach') || fn.includes('surgical protocol')) {
        itemReport.secondaryFolder = 'Abordajes';
      } else if (fn.includes('shoulder and elbow') || fn.includes('operative technique in shoulder')) {
        itemReport.secondaryFolder = 'Hombro';
      }

      if (!itemReport.title) {
        let clean = filename.replace(/^(?:\d{4}|S-F)\s*-\s*[^-]+-\s*/, '').replace(/\.pdf$/i, '');
        itemReport.title = engine.sanitizeFileName(clean);
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
    'C:\\Users\\ferna\\.gemini\\antigravity-ide\\brain\\6eb582a7-8ee8-4e38-a79d-e9db6c26c2ab\\scratch\\codo_resolved.json',
    JSON.stringify(results, null, 2),
    'utf-8'
  );
  console.log("Resolución de Codo guardada en codo_resolved.json");
}

auditAndResolveCodo();
