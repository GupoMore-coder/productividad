const https = require('https');
const fs = require('fs');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function findPussFandom() {
  try {
    const html = await fetchUrl('https://shrek.fandom.com/wiki/Puss_in_Boots');
    const matches = html.match(/https:\/\/static\.wikia\.nocookie\.net\/shrek\/images\/[^\/]+\/[^\/]+\/[^\"'\s]+\.(?:png|webp)/gi) || [];
    console.log('Found Wikia matches:', matches.length);
    const unique = [...new Set(matches)];
    console.log(unique.slice(0, 10));
  } catch(e) {
    console.error('Err:', e.message);
  }
}

findPussFandom();
