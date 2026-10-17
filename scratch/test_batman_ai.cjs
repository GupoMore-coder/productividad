const fs = require('fs');
const https = require('https');

const prompt = encodeURIComponent(
  'Batman Dark Knight in armored tactical bat-suit standing as a financial sentinel inside the high-tech Wayne Enterprises security vault with glowing holographic financial dashboards, stock market charts, gold bars in security cages, Gotham city skyline through floor-to-ceiling glass, cinematic lighting, masterpiece, photorealistic, hyper-detailed, 8k resolution'
);

const url = 'https://image.pollinations.ai/prompt/' + prompt + '?width=800&height=800&model=flux&nologo=true&seed=101';

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

download(url, 'scratch/batman_financial_sentinel.jpg')
  .then(() => console.log('Batman generado:', fs.statSync('scratch/batman_financial_sentinel.jpg').size))
  .catch(err => console.error(err));
