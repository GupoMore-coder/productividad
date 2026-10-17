const fs = require('fs');
const path = require('path');
const { PDFParse } = require('C:/Users/ferna/Documents/Biblioteca Premium/node_modules/pdf-parse');

const LIB_DIR = 'H:\\Mi unidad\\Información Ortopedia\\Libros';
const res = JSON.parse(fs.readFileSync('scratch/libros_audit_results.json', 'utf8'));

console.log(`Inspecting ${res.needsFix.length} files in needsFix...`);

async function run() {
  const analyzed = [];
  let count = 0;
  for (const item of res.needsFix) {
    count++;
    const full = path.join(LIB_DIR, item.file);
    let snippet = '';
    let year = null;
    try {
      const buf = fs.readFileSync(full);
      const parser = new PDFParse({ data: buf });
      const r = await parser.getText({ first: 3 });
      snippet = (r.text || '').replace(/\s+/g, ' ').slice(0, 400);
      await parser.destroy();

      const yearMatch = snippet.match(/(?:©|\bcopyright\b|published|edición|edition)[\s\S]{0,30}\b(19\d{2}|20\d{2})\b/i) ||
                        snippet.match(/\b(198\d|199\d|200\d|201\d|202\d)\b/);
      if (yearMatch) year = yearMatch[1];
    } catch (e) {
      snippet = 'ERR: ' + e.message;
    }
    analyzed.push({
      file: item.file,
      hash: item.hash,
      size: item.size,
      year,
      snippet
    });
    if (count % 30 === 0) console.log(`Inspected ${count}/${res.needsFix.length}...`);
  }

  fs.writeFileSync('scratch/libros_analyzed.json', JSON.stringify(analyzed, null, 2));
  console.log('Finished inspecting Libros needsFix.');
}

run();
