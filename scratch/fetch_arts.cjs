const https = require('https');

function getPage(id) {
  return new Promise((resolve) => {
    https.get(`https://www.pngarts.com/explore/${id}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let html = '';
      res.on('data', d => html += d);
      res.on('end', () => {
        const matches = html.match(/https:\/\/www\.pngarts\.com\/files\/[^"']+\.png/gi) || [];
        resolve({ id, count: matches.length, samples: [...new Set(matches)].slice(0, 3) });
      });
    }).on('error', err => resolve({ id, error: err.message }));
  });
}

async function run() {
  const flash = await getPage('263577');
  const hellboy = await getPage('309937');
  console.log('Flash:', flash);
  console.log('Hellboy:', hellboy);
}

run();
