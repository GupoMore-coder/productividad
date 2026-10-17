const fs = require('fs');
const https = require('https');
const http = require('http');
const sharp = require('sharp');

const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyc2FlaHBtYWlocnp0dXNlaGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMTIyNzcsImV4cCI6MjA5MDU4ODI3N30.fF0L0HSu2XFs0pjVI9wY9T7NfmtZZKt4iWNQ9tC4wNI";
const SUPABASE_HOST = "grsaehpmaihrztusehkb.supabase.co";

function downloadImageBuffer(url, maxRedirects = 4) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error("Too many redirects: " + url));
    const u = new URL(url);
    const client = u.protocol === 'https:' ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        let loc = res.headers.location;
        if (loc.startsWith('/')) {
          loc = u.origin + loc;
        }
        res.resume();
        return downloadImageBuffer(loc, maxRedirects - 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error("Timeout")));
  });
}

function uploadToSupabase(fileName, buffer, mimeType = "image/webp") {
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
          resolve({ ok: true, status: res.statusCode });
        } else {
          resolve({ ok: false, status: res.statusCode, body });
        }
      });
    });
    req.on("error", reject);
    req.write(buffer);
    req.end();
  });
}

async function createStaticSticker(sourceBuffer) {
  // Fit cleanly inside 512x512 with transparent background padding (leave 24px safety margin for sticker border)
  const resized = await sharp(sourceBuffer)
    .resize(464, 464, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .extend({
      top: 24, bottom: 24, left: 24, right: 24,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .webp({ quality: 85, alphaQuality: 100 })
    .toBuffer();

  return resized;
}

async function createAnimatedSticker(sourceBuffer) {
  const width = 512;
  const height = 512;
  const numFrames = 6;
  const frames = [];

  // Generate subtle breathing / floating animation (vertical offset +/- 6px, micro-scale)
  for (let i = 0; i < numFrames; i++) {
    const progress = (i / numFrames) * Math.PI * 2;
    const yOffset = Math.round(Math.sin(progress) * 6);
    const scaleFactor = 1 + Math.sin(progress) * 0.015; // 1.5% micro-pulse

    const targetW = Math.round(464 * scaleFactor);
    const targetH = Math.round(464 * scaleFactor);

    // Resize character
    const charBuf = await sharp(sourceBuffer)
      .resize(targetW, targetH, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();

    const topPos = Math.round((height - targetH) / 2) + yOffset;
    const leftPos = Math.round((width - targetW) / 2);

    const frame = await sharp({
      create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    }).composite([{
      input: charBuf,
      top: Math.max(0, topPos),
      left: Math.max(0, leftPos)
    }]).png().toBuffer();

    frames.push(frame);
  }

  // Join all frames vertically into a tall buffer
  const tallBuffer = await sharp({
    create: { width, height: height * numFrames, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  }).composite(frames.map((buf, idx) => ({ input: buf, top: idx * height, left: 0 }))).png().toBuffer();

  const animWebp = await sharp(tallBuffer, { animated: false })
    .webp({
      pageHeight: height,
      loop: 0,
      delay: 180,
      quality: 75,
      alphaQuality: 95
    })
    .toBuffer();

  return animWebp;
}

// Catálogo de fuentes canónicas oficiales en alta resolución con fondo transparente
const fuentesCanonicas = {
  GATO_CON_BOTAS: "https://pngimg.com/uploads/cat/cat_PNG50549.png", // Puss in Boots oficial DreamWorks con espada y sombrero
  IRON_MAN: "https://pngimg.com/uploads/ironman/ironman_PNG45.png", // Iron Man Mark 85 con reactor Arc encendido
  BATMAN: "https://pngimg.com/uploads/batman/batman_PNG41.png", // Batman Arkham Knight pose táctica
  WOLVERINE: "https://pngimg.com/uploads/wolverine/wolverine_PNG35.png", // Wolverine con garras de adamantium
  DEADPOOL: "https://pngimg.com/uploads/deadpool/deadpool_PNG11.png", // Deadpool con katanas
  SPIDERMAN: "https://pngimg.com/uploads/spider_man/spider_man_PNG58.png", // Spider-Man traje clásico
  CAPITAN_AMERICA: "https://pngimg.com/uploads/captain_america/captain_america_PNG26.png", // Capitán América con escudo
  HULK: "https://pngimg.com/uploads/hulk/hulk_PNG1.png", // Hulk colosal
  SUPERMAN: "https://pngimg.com/uploads/superman/superman_PNG75.png", // Superman con capa y escudo S
  WONDER_WOMAN: "https://pngimg.com/uploads/wonder_woman/wonder_woman_PNG1.png", // Mujer Maravilla con tiara
  OPTIMUS_PRIME: "https://pngimg.com/uploads/transformers/transformers_PNG1.png", // Optimus Prime Autobot 3D
  THOR: "https://freepngimg.com/thumb/thor/3-2-thor-transparent.png" // Thor con armadura y Mjolnir
};

async function processHeroStickers() {
  console.log("🚀 Iniciando procesamiento y generación de Stickers 3D Transparentes...");

  const keys = Object.keys(fuentesCanonicas);
  for (const k of keys) {
    const url = fuentesCanonicas[k];
    const keyLower = k.toLowerCase();
    const staticName = `${keyLower}_sticker_static.webp`;
    const animName = `${keyLower}_sticker_anim.webp`;

    console.log(`\n📦 Procesando [${k}]...`);
    try {
      console.log(`   Descargando fuente canónica: ${url}...`);
      const srcBuf = await downloadImageBuffer(url);
      console.log(`   Descarga completa: ${(srcBuf.length / 1024).toFixed(1)} KB`);

      console.log(`   Generando sticker estático 512x512...`);
      const staticBuf = await createStaticSticker(srcBuf);
      console.log(`   ✅ Sticker estático listo: ${(staticBuf.length / 1024).toFixed(1)} KB (Límite Meta: 100 KB)`);

      console.log(`   Generando sticker animado con movimiento sutil (6 frames)...`);
      const animBuf = await createAnimatedSticker(srcBuf);
      console.log(`   ✅ Sticker animado listo: ${(animBuf.length / 1024).toFixed(1)} KB (Límite Meta: 500 KB)`);

      // Subir a Supabase
      console.log(`   Subiendo a Supabase Storage: avatars/${staticName}...`);
      const upStatic = await uploadToSupabase(staticName, staticBuf);
      console.log(`   Resultado estático: ${upStatic.status}`);

      console.log(`   Subiendo a Supabase Storage: avatars/${animName}...`);
      const upAnim = await uploadToSupabase(animName, animBuf);
      console.log(`   Resultado animado: ${upAnim.status}`);

    } catch (err) {
      console.error(`   ❌ Error en [${k}]: ${err.message}`);
    }
  }

  console.log("\n🏁 Procesamiento finalizado.");
}

processHeroStickers();
