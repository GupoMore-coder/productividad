const https = require('https');

https.get('https://pngimg.com/images/heroes', (res) => {
  let html = '';
  res.on('data', d => html += d);
  res.on('end', () => {
    const matches = html.match(/href="([^"]+)"/g) || [];
    const hrefs = matches.map(m => m.replace(/href="|"/g, ''));
    const heroPages = [...new Set(hrefs.filter(h => h.includes('/uploads/') || h.includes('/images/')))];
    console.log('Hero pages/uploads count:', heroPages.length);
    console.log(heroPages.filter(h => !h.includes('.css') && !h.includes('.js')));
  });
});
