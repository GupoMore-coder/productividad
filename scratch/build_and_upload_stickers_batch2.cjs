const sharp = require('sharp');
const https = require('https');
const http = require('http');

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
  return await sharp(sourceBuffer)
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
}

async function createAnimatedSticker(sourceBuffer) {
  const width = 512;
  const height = 512;
  const numFrames = 6;
  const frames = [];

  for (let i = 0; i < numFrames; i++) {
    const progress = (i / numFrames) * Math.PI * 2;
    const yOffset = Math.round(Math.sin(progress) * 6);
    const scaleFactor = 1 + Math.sin(progress) * 0.015;

    const targetW = Math.round(464 * scaleFactor);
    const targetH = Math.round(464 * scaleFactor);

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

const batch2 = {
  LOKI: "https://www.pngall.com/wp-content/uploads/2016/05/Loki-PNG-Clipart.png",
  DOCTOR_STRANGE: "https://www.pngarts.com/files/11/Doctor-Strange-PNG-Transparent-Image.png",
  BLACK_WIDOW: "https://www.pngarts.com/files/10/Scarlett-Johansson-Black-Widow-Transparent.png",
  FLASH: "https://www.pngarts.com/files/12/The-Flash-Zoom-Free-PNG-Image.png",
  HELLBOY: "https://www.pngarts.com/files/18/Hellboy-Download-PNG-Image.png"
};

async function runBatch2() {
  console.log("🚀 Procesando Batch 2 de stickers canónicos...");
  for (const k of Object.keys(batch2)) {
    const url = batch2[k];
    const keyLower = k.toLowerCase();
    const staticName = `${keyLower}_sticker_static.webp`;
    const animName = `${keyLower}_sticker_anim.webp`;

    console.log(`\n📦 Procesando [${k}]...`);
    try {
      const srcBuf = await downloadImageBuffer(url);
      console.log(`   Descarga completa: ${(srcBuf.length / 1024).toFixed(1)} KB`);

      const staticBuf = await createStaticSticker(srcBuf);
      console.log(`   ✅ Sticker estático: ${(staticBuf.length / 1024).toFixed(1)} KB`);

      const animBuf = await createAnimatedSticker(srcBuf);
      console.log(`   ✅ Sticker animado: ${(animBuf.length / 1024).toFixed(1)} KB`);

      await uploadToSupabase(staticName, staticBuf);
      await uploadToSupabase(animName, animBuf);
      console.log(`   ✅ Subidos a Supabase con éxito.`);
    } catch (e) {
      console.error(`   ❌ Error: ${e.message}`);
    }
  }
}

runBatch2();
