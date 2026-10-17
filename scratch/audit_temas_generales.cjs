const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PDFParse } = require('C:/Users/ferna/Documents/Biblioteca Premium/node_modules/pdf-parse');

const TG_DIR = 'H:\\Mi unidad\\Información Ortopedia\\Temas generales';
const REG_PATH = 'bibliotecario_engine/knowledge/global_registry.json';
const reg = JSON.parse(fs.readFileSync(REG_PATH, 'utf8'));

function streamHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', err => reject(err));
  });
}

async function audit() {
  const allFiles = fs.readdirSync(TG_DIR).filter(f => f !== 'desktop.ini');
  const nonStd = allFiles.filter(f => !/^\d{4}\s*-\s*/.test(f) || f.startsWith('S-F -') || f.includes('null'));
  console.log(`Auditing ${nonStd.length} non-standard files in Temas generales...`);

  const results = [];
  for (const f of nonStd) {
    const full = path.join(TG_DIR, f);
    let stat;
    try { stat = fs.statSync(full); } catch(e) { continue; }
    if (stat.isDirectory()) continue;

    let hash = '';
    try { hash = await streamHash(full); } catch(e) { hash = 'ERR'; }

    let isDupe = false;
    let dupeOf = null;
    if (reg.hashes[hash]) {
      isDupe = true;
      dupeOf = reg.hashes[hash].name;
    }

    let snippet = '';
    let year = null;
    if (f.endsWith('.pdf')) {
      try {
        const buf = fs.readFileSync(full);
        const parser = new PDFParse({ data: buf });
        const res = await parser.getText({ first: 2 });
        snippet = (res.text || '').replace(/\s+/g, ' ').slice(0, 300);
        await parser.destroy();

        const yearMatch = snippet.match(/(?:©|\bcopyright\b|published|edición|edition)[\s\S]{0,30}\b(19\d{2}|20\d{2})\b/i) ||
                          snippet.match(/\b(198\d|199\d|200\d|201\d|202\d)\b/);
        if (yearMatch) year = yearMatch[1];
      } catch(e) {
        snippet = 'ERR: ' + e.message;
      }
    }

    results.push({
      file: f,
      hash,
      size: stat.size,
      isDupe,
      dupeOf,
      year,
      snippet
    });
  }

  fs.writeFileSync('scratch/temas_generales_audit_results.json', JSON.stringify(results, null, 2));
  console.log(`Finished auditing Temas generales. Dupes: ${results.filter(r => r.isDupe).length}, Unique to fix: ${results.filter(r => !r.isDupe).length}`);
}

audit();
