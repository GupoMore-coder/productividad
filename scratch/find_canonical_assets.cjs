const https = require('https');
const fs = require('fs');

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function findPuss() {
  try {
    const html = await fetchText('https://www.pngmart.com/?s=puss+in+boots');
    const links = html.match(/href="([^"]+puss-in-boots[^"]*)"/gi) || [];
    console.log('PNGMart links:', links.slice(0, 5));
    for (const l of links.slice(0, 3)) {
      const pageUrl = l.replace(/href="|"/g, '');
      const pageHtml = await fetchText(pageUrl);
      const imgMatch = pageHtml.match(/src="([^"]+\.png)"/gi) || [];
      console.log('PNG in page:', imgMatch.filter(m => m.includes('puss')));
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

findPuss();
