const https = require('https');

https.get('https://www.pngmart.com/image/tag/morgan-freeman', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let html = '';
  res.on('data', d => html += d);
  res.on('end', () => {
    const matches = html.match(/https?:\/\/[^"'\s]+\.png/gi) || [];
    console.log('PNGMart Freeman PNGs:', [...new Set(matches)].slice(0, 5));
  });
});
