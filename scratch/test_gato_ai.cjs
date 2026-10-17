const fs = require('fs');
const https = require('https');

const prompt = encodeURIComponent(
  'Puss in Boots ginger cat hero in dashing cavalier outfit with a stylish feathered musketeer hat and leather boots, holding an elegant rapier sword guarding a massive open treasure chest overflowing with shiny gold coins and royal financial accounting ledgers, warm golden library lighting, dramatic heroic pose, 3D animated film render, masterpiece, ultra-detailed, 8k resolution'
);

const url = 'https://image.pollinations.ai/prompt/' + prompt + '?width=800&height=800&model=flux&nologo=true&seed=777';

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

download(url, 'scratch/gato_con_botas_sentinel.jpg')
  .then(() => console.log('Gato con Botas generado:', fs.statSync('scratch/gato_con_botas_sentinel.jpg').size))
  .catch(err => console.error(err));
