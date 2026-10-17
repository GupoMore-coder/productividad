const https = require('https');

https.get('https://www.bing.com/images/search?q=' + encodeURIComponent('the flash barry allen transparent png'), {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
  }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    // Find all https://...png URLs
    const matches = d.match(/https?:\/\/[^"'\s\\]+\.png/gi) || [];
    const clean = [...new Set(matches.filter(m => !m.includes('bing.com') && !m.includes('microsoft.com')))];
    console.log('Found PNGs:', clean.slice(0, 10));
  });
});
