const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const { PDFParse } = require('C:/Users/ferna/Documents/Biblioteca Premium/node_modules/pdf-parse');

const DIR = 'H:\\Mi unidad\\Información Ortopedia\\Pie y Tobillo';

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

async function analyzeAll() {
  const files = fs.readdirSync(DIR).filter(f => !f.startsWith('.') && f !== 'desktop.ini');
  const results = [];

  for (const f of files) {
    const filePath = path.join(DIR, f);
    const stats = fs.statSync(filePath);
    const isStandard = /^\d{4}\s*-\s*[^-\n]+\s*-\s*.+/.test(f);

    const item = {
      filename: f,
      sizeMB: (stats.size / (1024 * 1024)).toFixed(1),
      isStandard,
      doi: null,
      cr: null,
      snippet: ''
    };

    if (!isStandard && f.toLowerCase().endsWith('.pdf')) {
      try {
        const buf = fs.readFileSync(filePath);
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
    results.push(item);
  }

  fs.writeFileSync('C:\\Users\\ferna\\.gemini\\antigravity-ide\\brain\\6eb582a7-8ee8-4e38-a79d-e9db6c26c2ab\\scratch\\pie_analysis.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('Analyzed', results.length, 'files. Saved to pie_analysis.json');
}

analyzeAll();
