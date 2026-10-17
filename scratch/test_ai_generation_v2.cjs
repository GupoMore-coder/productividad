const fs = require('fs');
const https = require('https');

const prompt = encodeURIComponent(
  'A cinematic masterpiece of Deadpool wearing his iconic red suit with a smart executive tie, standing proudly inside a massive modern bank vault filled with stacks of cash, gold bullion bars, and glowing neon holographic financial growth charts and stock graphs. He is holding a golden calculator and has katanas on his back. Hyper-detailed, photorealistic, 8k resolution, dramatic studio lighting, Unreal Engine 5 render.'
);

const url = 'https://image.pollinations.ai/prompt/' + prompt + '?width=800&height=800&model=flux&nologo=true&seed=999';

function download(targetUrl, destFile) {
  return new Promise((resolve, reject) => {
    https.get(targetUrl, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, destFile).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error('HTTP ' + res.statusCode));
      }
      const file = fs.createWriteStream(destFile);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

download(url, 'scratch/deadpool_financial_sentinel_v2.jpg')
  .then(() => console.log('Descarga v2 completada:', fs.statSync('scratch/deadpool_financial_sentinel_v2.jpg').size))
  .catch(err => console.error(err));
