const https = require('https');

function getCategoryImages(category) {
  return new Promise((resolve) => {
    https.get(`https://freepngimg.com/category/${category}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let html = '';
      res.on('data', d => html += d);
      res.on('end', () => {
        const matches = html.match(/https?:\/\/[^"'\s]+\.png/gi) || [];
        const thumbs = matches.filter(m => m.includes('/thumb/'));
        resolve({ category, count: thumbs.length, samples: thumbs.slice(0, 3) });
      });
    }).on('error', err => resolve({ category, error: err.message }));
  });
}

async function run() {
  const cats = ['black_widow', 'doctor_strange', 'the_flash', 'loki', 'spawn', 'hellboy'];
  for (const c of cats) {
    const res = await getCategoryImages(c);
    console.log(res);
  }
}

run();
