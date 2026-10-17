const https = require('https');
const fs = require('fs');

https.get('https://pngimg.com/images/heroes/shrek', { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const matches = d.match(/\/uploads\/shrek\/[^"'\s>]+\.png/gi) || [];
    const full = [...new Set(matches.filter(m => !m.includes('/small/')))];
    console.log(`Found ${full.length} images in shrek category:`);
    console.log(full);
  });
});
