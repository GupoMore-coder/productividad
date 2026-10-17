const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

const outDir = path.join(__dirname, 'candidates');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('Status ' + res.statusCode));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    });
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

const list = [
  // Batman
  ['batman_18.png', 'https://pngimg.com/uploads/batman/batman_PNG18.png'],
  ['batman_24.png', 'https://pngimg.com/uploads/batman/batman_PNG24.png'],
  ['batman_35.png', 'https://pngimg.com/uploads/batman/batman_PNG35.png'],
  ['batman_47.png', 'https://pngimg.com/uploads/batman/batman_PNG47.png'],

  // Iron Man
  ['ironman_18.png', 'https://pngimg.com/uploads/ironman/ironman_PNG18.png'],
  ['ironman_24.png', 'https://pngimg.com/uploads/ironman/ironman_PNG24.png'],
  ['ironman_32.png', 'https://pngimg.com/uploads/ironman/ironman_PNG32.png'],
  ['ironman_37.png', 'https://pngimg.com/uploads/ironman/ironman_PNG37.png'],

  // Hulk
  ['hulk_12.png', 'https://pngimg.com/uploads/hulk/hulk_PNG12.png'],
  ['hulk_20.png', 'https://pngimg.com/uploads/hulk/hulk_PNG20.png'],
  ['hulk_24.png', 'https://pngimg.com/uploads/hulk/hulk_PNG24.png'],

  // Transformers
  ['transformers_2.png', 'https://pngimg.com/uploads/transformers/transformers_PNG2.png'],
  ['transformers_28.png', 'https://pngimg.com/uploads/transformers/transformers_PNG28.png'],

  // Superman
  ['superman_15.png', 'https://pngimg.com/uploads/superman/superman_PNG15.png'],
  ['superman_20.png', 'https://pngimg.com/uploads/superman/superman_PNG20.png'],
  ['superman_65.png', 'https://pngimg.com/uploads/superman/superman_PNG65.png'],

  // Wolverine
  ['wolverine_19.png', 'https://pngimg.com/uploads/wolverine/wolverine_PNG19.png'],
  ['wolverine_20.png', 'https://pngimg.com/uploads/wolverine/wolverine_PNG20.png'],

  // Deadpool
  ['deadpool_7.png', 'https://pngimg.com/uploads/deadpool/deadpool_PNG7.png'],
  ['deadpool_21.png', 'https://pngimg.com/uploads/deadpool/deadpool_PNG21.png'],

  // Wonder Woman
  ['wonderwoman_20.png', 'https://pngimg.com/uploads/wonder_woman/wonder_woman_PNG20.png'],
  ['wonderwoman_22.png', 'https://pngimg.com/uploads/wonder_woman/wonder_woman_PNG22.png']
];

async function run() {
  for (const [name, url] of list) {
    const dest = path.join(outDir, name);
    try {
      await downloadFile(url, dest);
      console.log('Downloaded:', name);
    } catch (e) {
      console.log('Error downloading', name, e.message);
    }
  }
}

run();
