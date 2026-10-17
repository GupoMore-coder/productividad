const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const engine = require('./frugal_engine.cjs');
const { PDFParse } = require('C:/Users/ferna/Documents/Biblioteca Premium/node_modules/pdf-parse');

const DIR_ABORDAJES = 'H:\\Mi unidad\\Información Ortopedia\\Abordajes';

async function auditAbordajes() {
  const items = fs.readdirSync(DIR_ABORDAJES);
  console.log(`Analizando ${items.length} elementos en Abordajes...`);

  const results = [];
  const hashMap = {};

  for (let i = 0; i < items.length; i++) {
    const filename = items[i];
    const fullPath = path.join(DIR_ABORDAJES, filename);
    const stat = fs.statSync(fullPath);
    const ext = path.extname(filename).toLowerCase();

    console.log(`\n[${i+1}/${items.length}] Elemento: ${filename} (${Math.round(stat.size/1024)} KB)`);

    let itemReport = {
      num: i + 1,
      filename: filename,
      ext: ext,
      sizeKB: Math.round(stat.size / 1024),
      sha256: null,
      isDuplicateOf: null,
      type: 'Desconocido',
      doi: null,
      isbn: null,
      year: null,
      author: null,
      title: null,
      edition: null,
      proposedName: null,
      primaryFolder: 'Abordajes',
      secondaryFolder: null,
      notes: []
    };

    if (ext === '.pdf') {
      itemReport.type = 'PDF';
      // Nivel 0: Hash
      const hash = engine.computeSha256(fullPath);
      itemReport.sha256 = hash;
      if (hashMap[hash]) {
        itemReport.isDuplicateOf = hashMap[hash];
        itemReport.notes.push(`Duplicado binario exacto de: ${hashMap[hash]}`);
      } else {
        hashMap[hash] = filename;
      }

      // Extracción de texto
      try {
        const buffer = fs.readFileSync(fullPath);
        const parser = new PDFParse({ data: buffer });
        // Extraer hasta 15 páginas para libros
        const res = await parser.getText({ first: 15 });
        const text = res.text || '';
        await parser.destroy();

        // Buscar DOI
        const doiMatch = text.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);
        if (doiMatch) {
          itemReport.doi = doiMatch[0].replace(/[;.,)]$/, '');
        }

        // Buscar ISBN
        const isbnMatch = text.match(/(?:ISBN(?:-1[03])?:?\s*)(?=[0-9X]{10}|(?=(?:[0-9]+[-\s]){3,4})[0-9-\sX]{13,17})(?:97[89][-\s]?)?[0-9]{1,5}[-\s]?[0-9]+[-\s]?[0-9]+[-\s]?[0-9X]/i);
        if (isbnMatch) {
          itemReport.isbn = isbnMatch[0].replace(/ISBN(?:-1[03])?:?\s*/i, '').trim();
        }

        // Buscar Edición
        itemReport.edition = engine.extractEdition(text) || engine.extractEdition(filename);

        // Buscar Año
        const years = text.match(/\b(19[7-9]\d|20[0-2]\d)\b/g);
        if (years) {
          itemReport.year = parseInt(years[0]);
        }

        // Guardar muestra para análisis
        itemReport.snippet = text.substring(0, 1000).replace(/[\r\n\t]+/g, ' ').trim();
      } catch (e) {
        itemReport.notes.push(`Error al leer PDF: ${e.message}`);
      }
    } else if (ext === '.jpg' || ext === '.png' || ext === '.jpeg') {
      itemReport.type = 'IMAGEN';
      itemReport.notes.push('Formato Imagen. Requiere tratamiento especial / OCR o categorización iconográfica.');
    } else if (ext === '.pptx' || ext === '.ppt') {
      itemReport.type = 'PRESENTACION';
      itemReport.notes.push('Presentación de diapositivas (técnica quirúrgica). Evaluar si corresponde a zPresentaciones o Abordajes.');
    }

    results.push(itemReport);
  }

  fs.writeFileSync(
    'C:\\Users\\ferna\\.gemini\\antigravity-ide\\brain\\6eb582a7-8ee8-4e38-a79d-e9db6c26c2ab\\scratch\\abordajes_raw_audit.json',
    JSON.stringify(results, null, 2),
    'utf-8'
  );
  console.log("\nAuditoría en crudo completada y guardada en abordajes_raw_audit.json");
}

auditAbordajes();
