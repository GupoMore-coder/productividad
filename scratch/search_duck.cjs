const https = require('https');

function searchDuck(query) {
  return new Promise((resolve, reject) => {
    const url = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query);
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        const links = data.match(/href="\/l\/\?kh=-1&amp;uddg=([^"]+)"/g) || [];
        const decoded = links.map(l => {
          const m = l.match(/uddg=([^"]+)"/);
          return m ? decodeURIComponent(m[1]) : '';
        }).filter(Boolean);
        resolve(decoded);
      });
    });
    req.on('error', reject);
  });
}

async function run() {
  const res = await searchDuck('puss in boots png site:pngmart.com OR site:pngall.com OR site:freepngimg.com');
  console.log('DuckDuckGo results:', res.slice(0, 10));
}

run();
