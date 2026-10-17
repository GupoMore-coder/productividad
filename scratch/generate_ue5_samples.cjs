const fs = require('fs');
const https = require('https');

const samples = {
  DEADPOOL: "3D stylized character render, Unreal Engine 5, cinematic lighting, Octane render, 8k masterpiece. Deadpool in his iconic red and black suit posing with swagger as a financial sentinel, holding a golden ledger and with twin katanas on his back, standing in a high-tech modern bank vault packed with gold ingots and glowing neon green financial stock graphs, vibrant colors, extremely detailed 3D model",
  BATMAN: "3D stylized character render, Unreal Engine 5, cinematic dramatic lighting, Octane render, 8k masterpiece. Batman in high-tech armored bat-suit standing as a financial sentinel inside a massive Wayne Enterprises bank vault, glowing holographic blue financial dashboards and candlestick charts, stacks of gold bullion, dark sleek aesthetic, extremely detailed 3D model",
  GATO_CON_BOTAS: "3D stylized animation render, Unreal Engine 5, DreamWorks 3D film quality, 8k masterpiece. Cute ginger tabby cat dressed as Puss in Boots with wide black cavalier hat with yellow feather, red cape, leather boots, holding an elegant miniature rapier sword, standing heroically guarding an open antique treasure chest overflowing with shiny gold coins and financial ledger scrolls, warm rich lighting, extremely detailed fur"
};

function downloadImage(promptText, destFile) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(promptText);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=800&height=800&model=flux&nologo=true&seed=4242`;
    console.log(`Solicitando ${destFile}...`);
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadDirect(res.headers.location, destFile).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      const file = fs.createWriteStream(destFile);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Guardado ${destFile}: ${fs.statSync(destFile).size} bytes`);
        resolve();
      });
    }).on('error', reject);
  });
}

function downloadDirect(url, destFile) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      const file = fs.createWriteStream(destFile);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Guardado ${destFile}: ${fs.statSync(destFile).size} bytes`);
        resolve();
      });
    }).on('error', reject);
  });
}

async function run() {
  for (const [k, p] of Object.entries(samples)) {
    await downloadImage(p, `scratch/sample_ue5_${k.toLowerCase()}.jpg`);
  }
}

run();
