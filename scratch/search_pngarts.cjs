const https = require('https');

function searchPngArts(term) {
  return new Promise(resolve => {
    https.get(`https://www.pngarts.com/?s=${encodeURIComponent(term)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const matches = d.match(/https:\/\/www\.pngarts\.com\/files\/\d+\/[^"']+\.png/gi) || [];
        resolve([...new Set(matches)]);
      });
    }).on('error', () => resolve([]));
  });
}

async function run() {
  const terms = ['The Flash', 'Thor', 'Loki', 'Doctor Strange', 'Black Widow', 'Spawn', 'Morgan Freeman'];
  for (const t of terms) {
    const res = await searchPngArts(t);
    console.log(`pngarts [${t}]: ${res.length} images found`);
    console.log(res.slice(0, 5));
  }
}

run();
