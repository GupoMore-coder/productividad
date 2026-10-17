const https = require('https');

function checkHead(url) {
  return new Promise(resolve => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      resolve({ url, status: res.statusCode, size: res.headers['content-length'] });
    }).on('error', e => resolve({ url, status: 500 }));
  });
}

async function run() {
  const list = [
    // Flash Barry Allen
    'https://www.pngmart.com/files/12/The-Flash-PNG-Transparent-Image.png',
    'https://www.pngmart.com/files/12/The-Flash-PNG-File.png',
    'https://www.pngmart.com/files/12/The-Flash-PNG-Photos.png',
    'https://www.pngmart.com/files/12/The-Flash-PNG-Image.png',
    'https://www.pngmart.com/files/12/The-Flash-PNG-HD.png',
    'https://www.pngmart.com/files/12/Barry-Allen-The-Flash-PNG.png',
    
    // Thor 3D / MCU
    'https://www.pngmart.com/files/12/Thor-Avengers-PNG-Transparent-Image.png',
    'https://www.pngmart.com/files/12/Thor-PNG-Transparent-Image.png',
    'https://www.pngmart.com/files/12/Thor-PNG-File.png',
    'https://www.pngmart.com/files/12/Thor-PNG-HD.png',

    // Loki
    'https://www.pngmart.com/files/12/Loki-PNG-Transparent-Image.png',
    'https://www.pngmart.com/files/12/Loki-PNG-File.png',
    'https://www.pngmart.com/files/12/Loki-PNG-HD.png',

    // Doctor Strange
    'https://www.pngmart.com/files/11/Doctor-Strange-PNG-Image.png',
    'https://www.pngmart.com/files/11/Doctor-Strange-PNG-File.png',
    'https://www.pngmart.com/files/11/Doctor-Strange-PNG-HD.png',
    'https://www.pngmart.com/files/11/Doctor-Strange-PNG-Photos.png',

    // Black Widow
    'https://www.pngmart.com/files/12/Black-Widow-Avengers-PNG-Transparent-Image.png',
    'https://www.pngmart.com/files/12/Black-Widow-PNG-Transparent-Image.png',
    'https://www.pngmart.com/files/12/Black-Widow-PNG-File.png',

    // Spawn
    'https://www.pngmart.com/files/13/Spawn-PNG-Transparent-Image.png',
    'https://www.pngmart.com/files/13/Spawn-PNG-File.png',
    'https://www.pngmart.com/files/13/Spawn-Mortal-Kombat-11-PNG-Image.png',
    'https://www.pngmart.com/files/13/Spawn-Mortal-Kombat-11-PNG-File.png'
  ];

  for (const u of list) {
    const res = await checkHead(u);
    if (res.status === 200) {
      console.log('OK 200:', (res.size/1024).toFixed(0) + 'KB', u);
    }
  }
}

run();
