const https = require('https');

function check(cat) {
  return new Promise(resolve => {
    https.get('https://pngimg.com/images/' + cat, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const matches = d.match(/\/uploads\/[^"'\s>]+\.png/gi) || [];
        const full = [...new Set(matches.filter(m => !m.includes('/small/')))];
        console.log(cat, '->', full.slice(0, 6));
        resolve();
      });
    });
  });
}

async function run() {
  await check('fantasy/cyborg');
  await check('electronics/robot');
}

run();
