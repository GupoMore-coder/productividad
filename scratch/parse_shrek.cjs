const https = require('https');

https.get('https://pngimg.com/images/heroes/shrek', { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const matches = d.match(/alt="([^"]+)"/g) || [];
    matches.forEach(m => console.log(m));
  });
});
