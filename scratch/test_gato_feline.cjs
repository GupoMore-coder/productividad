const fs = require('fs');
const https = require('https');

const prompt = encodeURIComponent(
  'An anthropomorphic cute orange ginger tabby cat dressed as Puss in Boots, wearing a stylish wide black feathered musketeer hat, tiny red cape and soft leather boots, holding an elegant miniature rapier sword, standing proudly next to an open treasure chest overflowing with shiny gold coins and accounting books, detailed soft fur, Dreamworks animation style, cinematic warm lighting, 8k render, masterpiece'
);

const url = 'https://image.pollinations.ai/prompt/' + prompt + '?width=800&height=800&model=flux&nologo=true&seed=12345';

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

download(url, 'scratch/gato_con_botas_feline.jpg')
  .then(() => console.log('Gato felino generado:', fs.statSync('scratch/gato_con_botas_feline.jpg').size))
  .catch(err => console.error(err));
