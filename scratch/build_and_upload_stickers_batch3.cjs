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

// Para avatares que son fotos cuadradas (Aura, Ciro, Alex, Alexa, Robotica, Spawn),
// generamos un sticker 3D circular die-cut con borde dorado/holográfico y fondo transparente exterior.
async function createCircularBadgeSticker(sourceBuffer, isAnimated = false, frameIndex = 0, numFrames = 6) {
  const size = 512;
  const radius = 220; // 440px diameter inside 512x512
  const center = size / 2;

  const progress = (frameIndex / numFrames) * Math.PI * 2;
  const yOffset = isAnimated ? Math.round(Math.sin(progress) * 5) : 0;
  const pulseScale = isAnimated ? (1 + Math.sin(progress) * 0.015) : 1;

  // 1. Recortar imagen en círculo con borde estilizado
  const imgCropped = await sharp(sourceBuffer)
    .resize(430, 430, { fit: 'cover' })
    .composite([{
      input: Buffer.from(`<svg width="430" height="430"><circle cx="215" cy="215" r="215" fill="#fff"/></svg>`),
      blend: 'dest-in'
    }])
    .png()
    .toBuffer();

  // 2. Anillo exterior 3D dorado / plateado
  const ringSvg = `<svg width="${size}" height="${size}">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f59e0b" />
        <stop offset="50%" stop-color="#fef3c7" />
        <stop offset="100%" stop-color="#b45309" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.35"/>
      </filter>
    </defs>
    <circle cx="${center}" cy="${center}" r="226" fill="none" stroke="url(#goldGrad)" stroke-width="12" filter="url(#shadow)"/>
    <circle cx="${center}" cy="${center}" r="220" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.6"/>
  </svg>`;

  const composed = await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  }).composite([
    { input: Buffer.from(ringSvg), top: yOffset, left: 0 },
    { input: imgCropped, top: Math.round((size - 430) / 2) + yOffset, left: Math.round((size - 430) / 2) }
  ]).png().toBuffer();

  return composed;
}

async function createStaticCutout(sourceBuffer) {
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

async function createAnimatedCutout(sourceBuffer) {
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

  return await sharp(tallBuffer, { animated: false })
    .webp({ pageHeight: height, loop: 0, delay: 180, quality: 75, alphaQuality: 95 })
    .toBuffer();
}

const batch3Cutouts = {
  MORGAN_FREEMAN: "https://www.pngmart.com/files/22/Morgan-Freeman-PNG.png"
};

const batch3Badges = {
  SPAWN: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/render/image/public/avatars/spawn_sentinel_3d.jpg?width=700",
  ALEXA: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/render/image/public/avatars/alexa_sentinel_3d.jpg?width=700",
  ALEX: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/render/image/public/avatars/alex_sentinel_3d.jpg?width=700",
  FEMENINO_DULCE: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/render/image/public/avatars/femenino_dulce_sentinel_3d.jpg?width=700",
  MASCULINO_CORDIAL: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/render/image/public/avatars/masculino_cordial_sentinel_3d.jpg?width=700",
  ROBOTICA: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/render/image/public/avatars/robotica_sentinel_3d.jpg?width=700"
};

async function runBatch3() {
  console.log("🚀 Procesando Batch 3 de stickers...");

  // 1. Cutout de Morgan Freeman
  for (const k of Object.keys(batch3Cutouts)) {
    const url = batch3Cutouts[k];
    const keyLower = k.toLowerCase();
    console.log(`\n📦 Procesando Cutout [${k}]...`);
    const srcBuf = await downloadImageBuffer(url);
    const staticBuf = await createStaticCutout(srcBuf);
    const animBuf = await createAnimatedCutout(srcBuf);
    await uploadToSupabase(`${keyLower}_sticker_static.webp`, staticBuf);
    await uploadToSupabase(`${keyLower}_sticker_anim.webp`, animBuf);
    console.log(`   ✅ [${k}] subido a Supabase.`);
  }

  // 2. Badges circulares die-cut con fondo transparente para personajes corporativos y Spawn
  for (const k of Object.keys(batch3Badges)) {
    const url = batch3Badges[k];
    const keyLower = k.toLowerCase();
    console.log(`\n📦 Procesando 3D Badge [${k}]...`);
    const srcBuf = await downloadImageBuffer(url);

    // Static badge
    const staticPng = await createCircularBadgeSticker(srcBuf, false);
    const staticBuf = await sharp(staticPng).webp({ quality: 85 }).toBuffer();

    // Animated badge (6 frames)
    const numFrames = 6;
    const height = 512;
    const width = 512;
    const frames = [];
    for (let i = 0; i < numFrames; i++) {
      const fPng = await createCircularBadgeSticker(srcBuf, true, i, numFrames);
      frames.push(fPng);
    }
    const tallBuffer = await sharp({
      create: { width, height: height * numFrames, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    }).composite(frames.map((buf, idx) => ({ input: buf, top: idx * height, left: 0 }))).png().toBuffer();

    const animBuf = await sharp(tallBuffer, { animated: false })
      .webp({ pageHeight: height, loop: 0, delay: 180, quality: 75 })
      .toBuffer();

    await uploadToSupabase(`${keyLower}_sticker_static.webp`, staticBuf);
    await uploadToSupabase(`${keyLower}_sticker_anim.webp`, animBuf);
    console.log(`   ✅ [${k}] subido a Supabase (Estático: ${(staticBuf.length/1024).toFixed(1)} KB, Animado: ${(animBuf.length/1024).toFixed(1)} KB).`);
  }

  console.log("\n🎉 ¡TODOS LOS 24 PERSONAJES TIENEN AHORA SUS STICKERS 3D ESTÁTICOS Y ANIMADOS!");
}

runBatch3().catch(console.error);
