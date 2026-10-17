const https = require('https');

https.get('https://pngimg.com/', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const matches = d.match(/href="([^"]+)"/gi) || [];
    const filtered = matches.filter(m => {
      const lower = m.toLowerCase();
      return lower.includes('hero') || lower.includes('marvel') || lower.includes('comic') || lower.includes('movie') || lower.includes('character');
    });
    console.log([...new Set(filtered)]);
  });
});
