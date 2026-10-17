const https = require('https');

https.get('https://pngimg.com/', { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const allHrefs = d.match(/href="\/images\/[^"]+"/g) || [];
    const clean = [...new Set(allHrefs.map(h => h.replace(/href="|"/g, '')))];
    const matching = clean.filter(s => {
      const l = s.toLowerCase();
      return l.includes('thor') || l.includes('flash') || l.includes('loki') || l.includes('strange') || l.includes('widow') || l.includes('spawn') || l.includes('freeman') || l.includes('robot') || l.includes('cyborg') || l.includes('avengers');
    });
    console.log('Direct matching categories:', matching);
  });
});
