const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { PDFParse } = require('C:/Users/ferna/Documents/Biblioteca Premium/node_modules/pdf-parse');

const DIR = 'H:\\Mi unidad\\Información Ortopedia\\Ortopedia Pediatrica';
const REG_PATH = 'C:\\Users\\ferna\\Documents\\Antigravity Project\\bibliotecario_engine\\knowledge\\global_registry.json';
const REG = JSON.parse(fs.readFileSync(REG_PATH, 'utf8'));

function computeStreamHash(filePath) {
  return new Promise((resolve) => {
    try {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (err) => {
        console.log(`Stream error on ${filePath}: ${err.message}`);
        resolve(null);
      });
    } catch (e) {
      resolve(null);
    }
  });
}

function fetchCrossRef(doi) {
  return new Promise((resolve) => {
    if (!doi) return resolve(null);
    const cleanDoi = doi.trim().replace(/^https?:\/\/doi\.org\//i, '').replace(/[;.,)]$/, '');
    const url = `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`;
    const req = https.get(url, {
      headers: { 'User-Agent': 'AntigravityBibliotecarioWatcher/2.0' },
      timeout: 8000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'ok') {
            const item = json.message;
            const title = item.title && item.title.length > 0 ? item.title[0] : null;
            const year = item['published-print']?.['date-parts']?.[0]?.[0] || 
                         item['published-online']?.['date-parts']?.[0]?.[0] || 
                         item['issued']?.['date-parts']?.[0]?.[0] || null;
            let author = null;
            if (item.author && item.author.length > 0) {
              const a = item.author[0];
              author = a.family ? (a.given ? `${a.family}, ${a.given}` : a.family) : (a.name || null);
            }
            resolve({ success: true, title, year, author });
          } else { resolve(null); }
        } catch (e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

async function auditOrtopediaPediatrica() {
  const files = fs.readdirSync(DIR).filter(f => !f.startsWith('.') && f !== 'desktop.ini');
  console.log(`Total files to audit: ${files.length}`);

  const items = [];
  const hashes = {};
  const internalDupes = [];

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const fp = path.join(DIR, f);
    let sizeMB = 0;
    try { sizeMB = (fs.statSync(fp).size / (1024 * 1024)).toFixed(1); } catch (e) {}

    const sha256 = await computeStreamHash(fp);
    const isStd = /^\d{4}\s*-\s*[^-\n]+\s*-\s*.+/.test(f);

    if (sha256) {
      if (hashes[sha256]) {
        internalDupes.push({ file: f, original: hashes[sha256], sizeMB });
      } else {
        hashes[sha256] = f;
      }
    }

    const item = {
      index: i + 1,
      filename: f,
      sizeMB,
      sha256,
      isStd,
      doi: null,
      cr: null,
      snippet: ''
    };

    if (!isStd && f.toLowerCase().endsWith('.pdf') && parseFloat(sizeMB) < 250) {
      try {
        const buf = fs.readFileSync(fp);
        const parser = new PDFParse({ data: buf });
        const res = await parser.getText({ first: 2 });
        const text = res.text || '';
        item.snippet = text.replace(/\s+/g, ' ').substring(0, 400);
        const doiMatch = text.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);
        if (doiMatch) {
          item.doi = doiMatch[0];
          item.cr = await fetchCrossRef(doiMatch[0]);
        }
        await parser.destroy();
      } catch (e) {
        item.snippet = 'ERROR: ' + e.message;
      }
    }

    items.push(item);
  }

  const outPath = 'C:\\Users\\ferna\\.gemini\\antigravity-ide\\brain\\6eb582a7-8ee8-4e38-a79d-e9db6c26c2ab\\scratch\\pediatria_audit.json';
  fs.writeFileSync(outPath, JSON.stringify({ items, internalDupes }, null, 2), 'utf8');
  console.log(`Audit finished. Processed ${items.length} files. Internal duplicates: ${internalDupes.length}`);
}

auditOrtopediaPediatrica();
