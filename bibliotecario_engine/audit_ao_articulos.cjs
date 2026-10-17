const fs = require('fs');
const path = require('path');
const { computeSha256, fetchCrossRef, sanitizeFileName, globalRegistry } = require('../bibliotecario_engine/frugal_engine.cjs');
const { PDFParse } = require('C:/Users/ferna/Documents/Biblioteca Premium/node_modules/pdf-parse');

const ROOT = 'H:\\Mi unidad\\Información Ortopedia';
const FOLDER = path.join(ROOT, 'AO Curso Basico', 'Articulos');

async function audit() {
  const files = fs.readdirSync(FOLDER).filter(f => f.toLowerCase().endsWith('.pdf'));
  console.log(`Encontrados ${files.length} PDFs en AO Curso Basico/Articulos`);

  const results = [];

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filePath = path.join(FOLDER, filename);
    const sizeKB = Math.round(fs.statSync(filePath).size / 1024);
    const sha256 = computeSha256(filePath);

    let text = '';
    let doi = null;

    try {
      const buf = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: buf });
      const res = await parser.getText({ first: 3 });
      text = res.text || '';
      await parser.destroy();

      const doiMatch = text.match(/\b10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+\b/);
      if (doiMatch) {
        doi = doiMatch[0].replace(/[;.,)]$/, '');
      }
    } catch (e) {
      console.error(`Error leyendo ${filename}: ${e.message}`);
    }

    let crossRefData = null;
    if (doi) {
      crossRefData = await fetchCrossRef(doi);
    }

    results.push({
      num: i + 1,
      filename,
      sizeKB,
      sha256,
      doi,
      crossRefData,
      snippet: text.replace(/\s+/g, ' ').substring(0, 300)
    });
  }

  fs.writeFileSync('C:/Users/ferna/.gemini/antigravity-ide/brain/6eb582a7-8ee8-4e38-a79d-e9db6c26c2ab/scratch/ao_articulos_audit.json', JSON.stringify(results, null, 2), 'utf-8');
  console.log('Auditoría guardada en ao_articulos_audit.json');
}

audit();
