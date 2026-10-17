const https = require('https');

function searchPngall(term) {
  return new Promise((resolve) => {
    https.get(`https://www.pngall.com/?s=${encodeURIComponent(term)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
      let html = '';
      res.on('data', d => html += d);
      res.on('end', () => {
        const matches = html.match(/https:\/\/www\.pngall\.com\/wp-content\/uploads\/[^\"]+\.png/gi) || [];
        resolve({ term, found: [...new Set(matches)].slice(0, 3) });
      });
    }).on('error', err => resolve({ term, error: err.message }));
  });
}

async function run() {
  const terms = ['Doctor Strange', 'Black Widow', 'Flash', 'Hellboy', 'Spawn'];
  for (const t of terms) {
    const res = await searchPngall(t);
    console.log(t, '->', res.found);
  }
}

run();
