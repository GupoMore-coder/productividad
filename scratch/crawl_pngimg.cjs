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

async function findInPngImg() {
  const home = await fetchPage('https://pngimg.com/');
  const allHrefs = home.match(/href="\/images\/[^"]+"/g) || [];
  const cleanHrefs = [...new Set(allHrefs.map(h => h.replace(/href="|"/g, '')))];
  console.log('Total root categories on pngimg:', cleanHrefs.length);

  for (const cat of cleanHrefs) {
    const page = await fetchPage('https://pngimg.com' + cat);
    const subLinks = page.match(/href="\/images\/[^"]+"/g) || [];
    for (const sub of subLinks) {
      const s = sub.replace(/href="|"/g, '').toLowerCase();
      if (s.includes('thor') || s.includes('flash') || s.includes('loki') || s.includes('strange') || s.includes('widow') || s.includes('spawn') || s.includes('freeman') || s.includes('robot')) {
        console.log('FOUND CATEGORY:', s);
      }
    }
  }
}

findInPngImg();
