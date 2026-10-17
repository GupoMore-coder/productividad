const https = require('https');
const http = require('http');

function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const client = u.protocol === 'https:' ? https : http;
      const req = client.request(u, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }, (res) => {
        resolve({
          url,
          status: res.statusCode,
          contentType: res.headers['content-type'],
          contentLength: res.headers['content-length']
        });
      });
      req.setTimeout(5000, () => {
        req.destroy();
        resolve({ url, status: 408 });
      });
      req.on('error', (err) => resolve({ url, status: 500, error: err.message }));
      req.end();
    } catch (e) {
      resolve({ url, status: 400, error: e.message });
    }
  });
}

async function testCandidates() {
  const candidates = [
    // Puss in Boots
    "https://pngimg.com/uploads/shrek/shrek_PNG1.png",
    "https://www.stickpng.com/assets/images/580b571cd9996e24bc43c325.png",
    "https://freepngimg.com/thumb/puss_in_boots/2-2-puss-in-boots-png-file.png",
    // Iron Man
    "https://pngimg.com/uploads/ironman/ironman_PNG45.png",
    "https://pngimg.com/uploads/ironman/ironman_PNG18.png",
    // Batman
    "https://pngimg.com/uploads/batman/batman_PNG3.png",
    "https://pngimg.com/uploads/batman/batman_PNG41.png",
    // Spider-Man
    "https://pngimg.com/uploads/spider_man/spider_man_PNG18.png",
    "https://pngimg.com/uploads/spider_man/spider_man_PNG58.png",
    // Wolverine
    "https://pngimg.com/uploads/wolverine/wolverine_PNG1.png",
    "https://pngimg.com/uploads/wolverine/wolverine_PNG35.png",
    // Captain America
    "https://pngimg.com/uploads/captain_america/captain_america_PNG1.png",
    "https://pngimg.com/uploads/captain_america/captain_america_PNG26.png",
    // Hulk
    "https://pngimg.com/uploads/hulk/hulk_PNG1.png",
    // Deadpool
    "https://pngimg.com/uploads/deadpool/deadpool_PNG1.png",
    "https://pngimg.com/uploads/deadpool/deadpool_PNG11.png",
    // Superman
    "https://pngimg.com/uploads/superman/superman_PNG1.png",
    "https://pngimg.com/uploads/superman/superman_PNG75.png",
    // Wonder Woman
    "https://pngimg.com/uploads/wonder_woman/wonder_woman_PNG1.png",
    // Transformers / Optimus Prime
    "https://pngimg.com/uploads/transformers/transformers_PNG1.png",
    "https://pngimg.com/uploads/transformers/transformers_PNG28.png"
  ];

  for (const c of candidates) {
    const res = await checkUrl(c);
    console.log(`${res.status} | ${res.contentType || 'unknown'} | ${res.contentLength || '?'} bytes | ${c}`);
  }
}

testCandidates();
