const fs = require('fs');
const https = require('https');

const prompt = encodeURIComponent(
  'Deadpool superhero in classic red and black suit posing as a financial sentinel and ruthless auditor, holding a gleaming katana and a luxury golden financial ledger book, standing inside a high-tech modern bank vault with gold bars, holographic stock charts and money stacks, cinematic lighting, photorealistic, hyper-detailed, 8k, comic-book realism'
);

const url = 'https://image.pollinations.ai/prompt/' + prompt + '?width=768&height=768&model=flux&nologo=true&seed=42';

console.log('Solicitando imagen a Pollinations (FLUX.1):');
console.log(url);

function download(targetUrl, destFile) {
  return new Promise((resolve, reject) => {
    https.get(targetUrl, (res) => {
      console.log('Status:', res.statusCode, res.headers['content-type']);
      if (res.statusCode === 301 || res.statusCode === 302) {
        console.log('Siguiendo redirección a:', res.headers.location);
        return download(res.headers.location, destFile).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error('HTTP ' + res.statusCode));
      }
      const file = fs.createWriteStream(destFile);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Descarga finalizada:', fs.statSync(destFile).size, 'bytes');
        resolve();
      });
    }).on('error', reject);
  });
}

download(url, 'scratch/deadpool_ai_flux.jpg')
  .then(() => console.log('¡Éxito generando imagen con IA!'))
  .catch(err => console.error('Error:', err.message));
