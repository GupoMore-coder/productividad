const fs = require('fs');
const path = require('path');
const { PDFParse } = require('C:/Users/ferna/Documents/Biblioteca Premium/node_modules/pdf-parse');

const DIR = 'H:\\Mi unidad\\Información Ortopedia\\Cadera y Pelvis';

async function fastAudit() {
  const items = fs.readdirSync(DIR, { withFileTypes: true });
  const rootFiles = items.filter(i => i.isFile() && !i.name.startsWith('.') && i.name !== 'desktop.ini');
  console.log(`Direct root files in Cadera y Pelvis: ${rootFiles.length}`);

  const results = [];
  for (const rf of rootFiles) {
    const f = rf.name;
    const fp = path.join(DIR, f);
    const isStd = /^\d{4}\s*-\s*[^-\n]+\s*-\s*.+/.test(f);
    let sizeMB = 0;
    try { sizeMB = (fs.statSync(fp).size / 1024 / 1024).toFixed(1); } catch (e) {}

    const item = {
      filename: f,
      sizeMB,
      isStd,
      snippet: ''
    };

    if (!isStd && f.toLowerCase().endsWith('.pdf') && parseFloat(sizeMB) < 200) {
      try {
        const buf = fs.readFileSync(fp);
        const parser = new PDFParse({ data: buf });
        const res = await parser.getText({ first: 2 });
        item.snippet = (res.text || '').replace(/\s+/g, ' ').substring(0, 300);
        await parser.destroy();
      } catch (e) {
        item.snippet = 'ERROR: ' + e.message;
      }
    }
    results.push(item);
  }

  const outPath = 'C:\\Users\\ferna\\.gemini\\antigravity-ide\\brain\\6eb582a7-8ee8-4e38-a79d-e9db6c26c2ab\\scratch\\cadera_fast.json';
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log('Fast audit finished. Total items:', results.length);
}

fastAudit();
