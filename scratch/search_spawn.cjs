const https = require('https');

https.get('https://www.pngmart.com/?s=spawn', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let html = '';
  res.on('data', d => html += d);
  res.on('end', () => {
    const matches = html.match(/https:\/\/www\.pngmart\.com\/files\/[^\"]+\.png/gi) || [];
    console.log('PNGMart Spawn:', [...new Set(matches)].slice(0, 5));
  });
});
