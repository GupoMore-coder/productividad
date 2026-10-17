const fs = require('fs');
const path = require('path');
const { computeSha256, fetchCrossRef, fetchGoogleBooksByISBN, sanitizeFileName, extractEdition, globalRegistry } = require('../bibliotecario_engine/frugal_engine.cjs');
const { PDFParse } = require('C:/Users/ferna/Documents/Biblioteca Premium/node_modules/pdf-parse');

const ROOT = 'H:\\Mi unidad\\Información Ortopedia';
const FOLDER = path.join(ROOT, 'Metabolismo Óseo');

async function audit() {
  const files = fs.readdirSync(FOLDER).filter(f => f.toLowerCase().endsWith('.pdf'));
  console.log(`Encontrados ${files.length} PDFs en Metabolismo Óseo`);

  const results = [];

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filePath = path.join(FOLDER, filename);
    const sizeKB = Math.round(fs.statSync(filePath).size / 1024);
    const sha256 = computeSha256(filePath);

    const existing = globalRegistry.hashes[sha256];
    let isDuplicate = false;
    let duplicateOf = null;
    if (existing && existing.path !== path.relative(ROOT, filePath)) {
      isDuplicate = true;
      duplicateOf = existing;
    }

    let text = '';
    let doi = null;
    let isbn = null;

    try {
      const buf = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: buf });
      const res = await parser.getText({ first: 5 });
      text = res.text || '';
      await parser.destroy();

      const doiMatch = text.match(/\b10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+\b/);
      if (doiMatch) {
        doi = doiMatch[0].replace(/[;.,)]$/, '');
      }

      const isbnMatch = text.match(/(?:ISBN(?:-1[03])?:?\s*)(?=[0-9X]{10}|(?=(?:[0-9]+[-\s]){3})[-0-9X]{13}|97[89][0-9]{10}|(?=(?:[0-9]+[-\s]){4})[-0-9]{17})([0-9]{1,5}[-\s]?[0-9]+[-\s]?[0-9]+[-\s]?[0-9]*[-\s]?[0-9X])/i);
      if (isbnMatch) {
        isbn = isbnMatch[1].replace(/[-\s]/g, '');
      }
    } catch (e) {
      console.error(`Error leyendo ${filename}: ${e.message}`);
    }

    let crossRefData = null;
    if (doi) {
      crossRefData = await fetchCrossRef(doi);
    }

    let bookData = null;
    if (isbn && !crossRefData) {
      bookData = await fetchGoogleBooksByISBN(isbn);
    }

    results.push({
      num: i + 1,
      filename,
      sizeKB,
      sha256,
      isDuplicate,
      duplicateOf,
      doi,
      isbn,
      crossRefData,
      bookData,
      snippet: text.replace(/\s+/g, ' ').substring(0, 500)
    });
  }

  fs.writeFileSync('C:/Users/ferna/.gemini/antigravity-ide/brain/6eb582a7-8ee8-4e38-a79d-e9db6c26c2ab/scratch/metabolismo_audit.json', JSON.stringify(results, null, 2), 'utf-8');
  console.log('Auditoría guardada en metabolismo_audit.json');
}

audit();
