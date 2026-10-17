const https = require('https');

function searchCleanPng(term) {
  return new Promise(resolve => {
    https.get(`https://www.cleanpng.com/free/${encodeURIComponent(term)}.html`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const matches = d.match(/https:\/\/(?:img2|banner2|toppng)\.cleanpng\.com\/[^\"]+\.png/gi) || [];
        resolve([...new Set(matches)]);
      });
    }).on('error', () => resolve([]));
  });
}

async function run() {
  console.log('CleanPNG Flash:', await searchCleanPng('the-flash'));
  console.log('CleanPNG Thor:', await searchCleanPng('thor'));
  console.log('CleanPNG Loki:', await searchCleanPng('loki'));
  console.log('CleanPNG Doctor Strange:', await searchCleanPng('doctor-strange'));
  console.log('CleanPNG Spawn:', await searchCleanPng('spawn'));
}

run();
