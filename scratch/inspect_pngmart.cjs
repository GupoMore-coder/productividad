const https = require('https');

function fetchPage(url) {
  return new Promise(resolve => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', () => resolve(''));
  });
}

async function findPngMart(term) {
  const html = await fetchPage(`https://www.pngmart.com/?s=${encodeURIComponent(term)}`);
  const postMatches = html.match(/href="(https:\/\/www\.pngmart\.com\/files\/[^"]+)"/gi) || [];
  const urls = [...new Set(postMatches.map(m => m.replace(/href="|"/g, '')))];
  console.log('PNGMart', term, 'found pages:', urls.slice(0, 3));
  for (const page of urls.slice(0, 2)) {
    const pageHtml = await fetchPage(page);
    const pngs = pageHtml.match(/href="([^"]+\.png)"/gi) || [];
    console.log('  -> PNGs in page:', pngs);
  }
}

async function run() {
  await findPngMart('Puss in boots');
  await findPngMart('Flash');
  await findPngMart('Optimus Prime');
  await findPngMart('Spawn');
  await findPngMart('Thor');
}

run();
