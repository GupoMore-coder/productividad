const https = require('https');

function getCategoryImages(category) {
  return new Promise(resolve => {
    https.get(`https://pngimg.com/images/heroes/${category}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const matches = d.match(/\/uploads\/[^\/]+\/[^\"]+\.png/gi) || [];
        resolve([...new Set(matches.map(m => 'https://pngimg.com' + m))]);
      });
    }).on('error', () => resolve([]));
  });
}

async function testCats() {
  const cats = ['thor', 'flash', 'loki', 'doctor_strange', 'black_widow', 'spawn', 'cat', 'shrek'];
  for (const c of cats) {
    const imgs = await getCategoryImages(c);
    console.log(`pngimg category [${c}]: ${imgs.length} images`);
    if (imgs.length > 0) {
      console.log(`  Sample:`, imgs.slice(0, 3));
    }
  }
}

testCats();
