const https = require('https');
const http = require('http');

const candidateUrls = {
  DEADPOOL: "https://upload.wikimedia.org/wikipedia/commons/4/49/Cosplay_of_Deadpool_at_the_2021_New_York_Comic_Con_%2851573817204%29.jpg",
  BATMAN: "https://upload.wikimedia.org/wikipedia/commons/b/be/Batman_%28retouched%29.jpg",
  IRON_MAN: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Cosplay_of_Iron_Man_at_GEMA_2022.jpg",
  SPIDERMAN: "https://upload.wikimedia.org/wikipedia/commons/b/be/Spider-Man_cosplay.jpg",
  CAPITAN_AMERICA: "https://upload.wikimedia.org/wikipedia/commons/5/56/Captain_America_cosplay.jpg",
  THOR: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Thor_Cosplay_Comic_Con_NYC_2009.jpg",
  WOLVERINE: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Wolverine_cosplay.jpg",
  SUPERMAN: "https://upload.wikimedia.org/wikipedia/commons/b/b5/SDCC_2014_-_Cosplay_Superman_%287737408012%29.jpg",
  WONDER_WOMAN: "https://upload.wikimedia.org/wikipedia/commons/f/fc/WonderCon_2019_-_Wonder_Woman_Cosplay_01.jpg",
  GATO_CON_BOTAS: "https://upload.wikimedia.org/wikipedia/commons/a/af/Puss_in_Boots_%28136548447%29.jpg",
  DOCTOR_STRANGE: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Doctor_Strange_Cosplay.jpg",
  FLASH: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Cosplay_of_the_Flash_at_Cosplay_Battleground_and_Toys_2021.jpg",
  LOKI: "https://upload.wikimedia.org/wikipedia/commons/b/bd/WonderCon_2015_-_Loki_cosplay_%2816427144544%29_%28cropped%29.jpg",
  BLACK_WIDOW: "https://upload.wikimedia.org/wikipedia/commons/a/ad/SDCC_2012_-_Black_Widow_%287573744958%29.jpg",
  HELLBOY: "https://upload.wikimedia.org/wikipedia/commons/8/86/Hellboy_cosplay.jpg",
  OPTIMUS_PRIME: "https://upload.wikimedia.org/wikipedia/commons/4/43/Optimus_Prime_statue_%2814334013566%29.jpg",
  SPAWN: "https://upload.wikimedia.org/wikipedia/commons/2/25/2015_Vermont_Comic_Con_Cosplay_of_Spawn.jpg",
  HULK: "https://upload.wikimedia.org/wikipedia/commons/9/90/Hulk_sculpture.jpg",
  MORGAN_FREEMAN: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Morgan_Freeman_Deauville_2018.jpg"
};

function checkUrl(key, url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'AntigravityFinancialBot/1.0 (admin@grupomore.com)' } }, (res) => {
      resolve({
        key,
        statusCode: res.statusCode,
        contentType: res.headers['content-type'],
        contentLength: res.headers['content-length']
      });
      res.destroy();
    });
    req.on('error', (err) => resolve({ key, error: err.message }));
  });
}

async function run() {
  console.log("Verificando URLs candidatas en Wikimedia Commons...");
  for (const [k, u] of Object.entries(candidateUrls)) {
    const res = await checkUrl(k, u);
    console.log(`${k}: status=${res.statusCode}, mime=${res.contentType}, size=${res.contentLength}`);
  }
}

run();
