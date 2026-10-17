const https = require('https');

function searchPngall(term) {
  return new Promise((resolve) => {
    https.get(`https://www.pngall.com/?s=${encodeURIComponent(term)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }, (res) => {
      let html = '';
      res.on('data', d => html += d);
      res.on('end', () => {
        const matches = html.match(/https:\/\/www\.pngall\.com\/wp-content\/uploads\/[^\"]+\.png/gi) || [];
        resolve({ term, found: [...new Set(matches)].slice(0, 5) });
      });
    }).on('error', err => resolve({ term, error: err.message }));
  });
}

async function run() {
  const terms = ['Puss in Boots', 'Thor', 'Loki', 'The Flash', 'Spawn', 'Optimus Prime', 'Black Widow', 'Doctor Strange', 'Morgan Freeman'];
  for (const t of terms) {
    const res = await searchPngall(t);
    console.log(t, '->', res.found);
  }
}

run();
