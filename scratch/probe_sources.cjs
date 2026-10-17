const https = require('https');
const http = require('http');

function checkHead(url) {
  return new Promise(resolve => {
    try {
      const u = new URL(url);
      const lib = u.protocol === 'https:' ? https : http;
      const req = lib.request(u, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      }, res => {
        resolve({ url, status: res.statusCode, size: res.headers['content-length'] });
      });
      req.setTimeout(5000, () => { req.destroy(); resolve({ url, status: 408 }); });
      req.on('error', e => resolve({ url, status: 500, error: e.message }));
      req.end();
    } catch(e) {
      resolve({ url, status: 400 });
    }
  });
}

async function probe() {
  const candidates = [
    // Puss in boots
    'https://freepngimg.com/thumb/puss_in_boots/2-2-puss-in-boots-png-file.png',
    'https://freepngimg.com/thumb/puss_in_boots/1-2-puss-in-boots-png-image.png',
    'https://freepngimg.com/thumb/puss_in_boots/3-2-puss-in-boots-png-clipart.png',
    'https://freepngimg.com/thumb/puss_in_boots/4-2-puss-in-boots-png.png',
    'https://freepngimg.com/download/puss_in_boots/2-2-puss-in-boots-png-file.png',

    // Optimus Prime
    'https://pngimg.com/uploads/transformers/transformers_PNG4.png',
    'https://pngimg.com/uploads/transformers/transformers_PNG5.png',
    'https://pngimg.com/uploads/transformers/transformers_PNG7.png',
    'https://pngimg.com/uploads/transformers/transformers_PNG8.png',
    'https://pngimg.com/uploads/transformers/transformers_PNG11.png',
    'https://pngimg.com/uploads/transformers/transformers_PNG13.png',
    'https://pngimg.com/uploads/transformers/transformers_PNG16.png',
    'https://pngimg.com/uploads/transformers/transformers_PNG19.png',
    'https://pngimg.com/uploads/transformers/transformers_PNG24.png',
    'https://pngimg.com/uploads/transformers/transformers_PNG29.png',

    // Flash (Barry Allen)
    'https://pngimg.com/uploads/flash/flash_PNG14.png',
    'https://pngimg.com/uploads/flash/flash_PNG15.png',
    'https://pngimg.com/uploads/flash/flash_PNG26.png',
    'https://pngimg.com/uploads/flash/flash_PNG27.png',
    'https://pngimg.com/uploads/flash/flash_PNG31.png',
    'https://freepngimg.com/thumb/the_flash/6-2-the-flash-png-clipart.png',
    'https://freepngimg.com/thumb/the_flash/1-2-the-flash-png-image.png',
    'https://freepngimg.com/thumb/the_flash/3-2-the-flash-png-picture.png',

    // Thor MCU
    'https://pngimg.com/uploads/thor/thor_PNG22.png',
    'https://pngimg.com/uploads/thor/thor_PNG27.png',
    'https://pngimg.com/uploads/thor/thor_PNG34.png',
    'https://pngimg.com/uploads/thor/thor_PNG35.png',
    'https://pngimg.com/uploads/thor/thor_PNG38.png',

    // Loki
    'https://pngimg.com/uploads/thor/thor_PNG18.png',
    'https://freepngimg.com/thumb/loki/2-2-loki-png-image.png',
    'https://freepngimg.com/thumb/loki/4-2-loki-png-file.png',
    'https://freepngimg.com/thumb/loki/1-2-loki-free-png-image.png',

    // Doctor Strange
    'https://freepngimg.com/thumb/doctor_strange/1-2-doctor-strange-png-picture.png',
    'https://freepngimg.com/thumb/doctor_strange/2-2-doctor-strange-png-image.png',
    'https://freepngimg.com/thumb/doctor_strange/3-2-doctor-strange-png-file.png',

    // Spawn
    'https://freepngimg.com/thumb/spawn/1-2-spawn-free-download-png.png',
    'https://freepngimg.com/thumb/spawn/2-2-spawn-png-image.png',
    'https://freepngimg.com/thumb/spawn/3-2-spawn-png-file.png',
    'https://www.pngmart.com/files/13/Spawn-Mortal-Kombat-11-PNG-Image.png',
    'https://www.pngmart.com/files/13/Spawn-Mortal-Kombat-11-PNG-File.png',
    'https://www.pngmart.com/files/13/Spawn-PNG-Transparent-Image.png',

    // Black Widow
    'https://freepngimg.com/thumb/black_widow/1-2-black-widow-png-picture.png',
    'https://freepngimg.com/thumb/black_widow/2-2-black-widow-png-image.png',
    'https://freepngimg.com/thumb/black_widow/3-2-black-widow-png-file.png',

    // Spider-Man
    'https://pngimg.com/uploads/spider_man/spider_man_PNG18.png',
    'https://pngimg.com/uploads/spider_man/spider_man_PNG21.png',
    'https://pngimg.com/uploads/spider_man/spider_man_PNG40.png',
    'https://pngimg.com/uploads/spider_man/spider_man_PNG58.png'
  ];

  for (const c of candidates) {
    const res = await checkHead(c);
    if (res.status === 200 || res.status === 301 || res.status === 302) {
      console.log('FOUND:', res.status, (res.size ? (res.size/1024).toFixed(0) + 'KB' : ''), c);
    }
  }
}

probe();
