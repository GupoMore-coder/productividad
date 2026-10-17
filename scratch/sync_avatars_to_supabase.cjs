const fs = require('fs');
const https = require('https');
const http = require('http');

const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyc2FlaHBtYWlocnp0dXNlaGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMTIyNzcsImV4cCI6MjA5MDU4ODI3N30.fF0L0HSu2XFs0pjVI9wY9T7NfmtZZKt4iWNQ9tC4wNI";
const SUPABASE_HOST = "grsaehpmaihrztusehkb.supabase.co";

const characterSources = {
  BATMAN: "https://upload.wikimedia.org/wikipedia/commons/b/be/Batman_%28retouched%29.jpg",
  IRON_MAN: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Cosplay_of_Iron_Man_at_GEMA_2022.jpg",
  SPIDERMAN: "https://upload.wikimedia.org/wikipedia/commons/b/be/Spider-Man_cosplay.jpg",
  CAPITAN_AMERICA: "https://upload.wikimedia.org/wikipedia/commons/5/56/Captain_America_cosplay.jpg",
  THOR: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Thor_Cosplay_Comic_Con_NYC_2009.jpg",
  WOLVERINE: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Wolverine_cosplay.jpg",
  SUPERMAN: "https://upload.wikimedia.org/wikipedia/commons/b/b5/SDCC_2014_-_Cosplay_Superman_%287737408012%29.jpg",
  WONDER_WOMAN: "https://upload.wikimedia.org/wikipedia/commons/f/fc/WonderCon_2019_-_Wonder_Woman_Cosplay_01.jpg",
  GATO_CON_BOTAS: "https://upload.wikimedia.org/wikipedia/commons/a/af/Puss_in_Boots_%28136548447%29.jpg",
  LOKI: "https://upload.wikimedia.org/wikipedia/commons/b/bd/WonderCon_2015_-_Loki_cosplay_%2816427144544%29_%28cropped%29.jpg",
  BLACK_WIDOW: "https://upload.wikimedia.org/wikipedia/commons/a/ad/SDCC_2012_-_Black_Widow_%287573744958%29.jpg",
  MORGAN_FREEMAN: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Morgan_Freeman_Deauville_2018.jpg",
  OPTIMUS_PRIME: "https://upload.wikimedia.org/wikipedia/commons/4/43/Optimus_Prime_statue_%2814334013566%29.jpg",
  HULK: "https://upload.wikimedia.org/wikipedia/commons/9/90/Hulk_sculpture.jpg",
  HELLBOY: "https://upload.wikimedia.org/wikipedia/commons/8/86/Hellboy_cosplay.jpg",
  SPAWN: "https://upload.wikimedia.org/wikipedia/commons/2/25/2015_Vermont_Comic_Con_Cosplay_of_Spawn.jpg",
  FLASH: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Cosplay_of_the_Flash_at_Cosplay_Battleground_and_Toys_2021.jpg",
  DOCTOR_STRANGE: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Doctor_Strange_Cosplay.jpg",
  ALEXA: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&fm=jpg&q=80",
  ALEX: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&fm=jpg&q=80",
  FEMENINO_DULCE: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&fm=jpg&q=80",
  MASCULINO_CORDIAL: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=900&fm=jpg&q=80",
  ROBOTICA: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=900&fm=jpg&q=80"
};

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, { headers: { "User-Agent": "AntigravityFinancialBot/1.0 (admin@grupomore.com)" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        const buf = Buffer.concat(chunks);
        resolve({
          buffer: buf,
          mimeType: res.headers["content-type"] || "image/jpeg"
        });
      });
    });
    req.on("error", reject);
  });
}

function uploadToSupabase(fileName, buffer, mimeType) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_HOST,
      port: 443,
      path: `/storage/v1/object/avatars/${fileName}`,
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_ANON}`,
        "apikey": SUPABASE_ANON,
        "Content-Type": mimeType,
        "Content-Length": buffer.length
      }
    };
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", d => body += d);
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ ok: true, status: res.statusCode, body });
        } else {
          // If already exists or error
          resolve({ ok: false, status: res.statusCode, body });
        }
      });
    });
    req.on("error", reject);
    req.write(buffer);
    req.end();
  });
}

async function run() {
  console.log("Iniciando sincronización de avatares centinelas hacia Supabase Storage...");
  for (const [key, url] of Object.entries(characterSources)) {
    const fileName = `${key.toLowerCase()}_sentinel.jpg`;
    console.log(`\n⏳ Procesando [${key}] -> ${fileName}...`);
    try {
      await sleep(1500); // 1.5s delay to be polite to host
      const img = await downloadImage(url);
      console.log(`   Descargado: ${img.buffer.length} bytes (${img.mimeType})`);
      const upload = await uploadToSupabase(fileName, img.buffer, img.mimeType);
      if (upload.ok) {
        console.log(`   ✅ Subido a Supabase: avatars/${fileName}`);
      } else {
        console.log(`   ⚠️ Respuesta Supabase (${upload.status}): ${upload.body}`);
      }
    } catch (err) {
      console.log(`   ❌ Error con [${key}]: ${err.message}`);
    }
  }
  console.log("\nSincronización completada.");
}

run();
