const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const sharp = require('sharp');
const WebP = require('node-webpmux');

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

function uploadToSupabase(fileName, buffer) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_HOST,
      port: 443,
      path: `/storage/v1/object/avatars/${fileName}`,
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_ANON}`,
        "apikey": SUPABASE_ANON,
        "Content-Type": "image/webp",
        "Content-Length": buffer.length
      }
    };
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", d => body += d);
      res.on("end", () => {
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body });
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
    .webp({ quality: 82, alphaQuality: 95 })
    .toBuffer();
}

async function createAnimatedSticker(sourceBuffer) {
  const width = 512;
  const height = 512;
  const numFrames = 6;
  const frames = [];

  for (let i = 0; i < numFrames; i++) {
    const progress = (i / numFrames) * Math.PI * 2;
    const yOffset = Math.round(Math.sin(progress) * 5); // ±5px sinusoidal breathing
    const scaleFactor = 1 + Math.sin(progress) * 0.015; // 1.5% micro-pulse

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

    const frameBuf = await sharp({
      create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    }).composite([{
      input: charBuf,
      top: Math.max(0, topPos),
      left: Math.max(0, leftPos)
    }]).webp({ quality: 75, alphaQuality: 90 }).toBuffer();

    const img = await WebP.Image.getEmptyImage();
    await img.load(frameBuf);
    frames.push({ img, duration: 200 }); // 200ms per frame = 5 FPS loop
  }

  // Compile authentic multi-frame animated WebP with node-webpmux
  const animBuffer = await WebP.Image.save(null, {
    width: 512,
    height: 512,
    frames,
    loops: 0 // 0 = infinite loop (mandatory for WhatsApp stickers)
  });

  return animBuffer;
}

// 24 Personajes con fuentes canónicas de máxima fidelidad
const characterPlan = [
  // 1. Hulk (CONFIRMADO Y PROBADO POR EL USUARIO EN IMAGEN 1)
  { id: 'HULK', type: 'local', path: 'scratch/existing_static/hulk.webp', keepStaticExact: true },

  // 2. Gato con Botas (DreamWorks Puss in Boots 3D oficial - Reemplaza gato doméstico blanco)
  { id: 'GATO_CON_BOTAS', type: 'local', path: 'scratch/candidates/puss_in_boots_official.png' },

  // 3. Batman (Arkham Knight 3D pose táctica y capa)
  { id: 'BATMAN', type: 'local', path: 'scratch/candidates/batman_35.png' },

  // 4. Iron Man (Mark VII / 85 3D con reactor Arc)
  { id: 'IRON_MAN', type: 'local', path: 'scratch/candidates/ironman_32.png' },

  // 5. Wolverine (Days of Future Past Hugh Jackman garras)
  { id: 'WOLVERINE', type: 'local', path: 'scratch/candidates/wolverine_20.png' },

  // 6. Deadpool (Ryan Reynolds 3D traje katanas)
  { id: 'DEADPOOL', type: 'local', path: 'scratch/candidates/deadpool_21.png' },

  // 7. Superman (Henry Cavill 3D DCEU con capa)
  { id: 'SUPERMAN', type: 'local', path: 'scratch/candidates/superman_65.png' },

  // 8. Wonder Woman (Gal Gadot 3D armadura amazona)
  { id: 'WONDER_WOMAN', type: 'local', path: 'scratch/candidates/wonderwoman_22.png' },

  // 9. Optimus Prime (3D Autobot líder con espada de energón)
  { id: 'OPTIMUS_PRIME', type: 'local', path: 'scratch/candidates/transformers_16.png' },

  // 10. Spider-Man (3D traje clásico balanceo)
  { id: 'SPIDERMAN', type: 'url', url: 'https://pngimg.com/uploads/spider_man/spider_man_PNG58.png' },

  // 11. Capitán América (3D MCU con escudo)
  { id: 'CAPITAN_AMERICA', type: 'url', url: 'https://pngimg.com/uploads/captain_america/captain_america_PNG26.png' },

  // 12. Thor (Chris Hemsworth con armadura y Mjolnir)
  { id: 'THOR', type: 'local', path: 'scratch/existing_static/thor.webp' },

  // 13. Loki (Tom Hiddleston con cuernos dorados)
  { id: 'LOKI', type: 'local', path: 'scratch/existing_static/loki.webp' },

  // 14. Doctor Strange (Benedict Cumberbatch con Capa de Levitación)
  { id: 'DOCTOR_STRANGE', type: 'local', path: 'scratch/existing_static/doctor_strange.webp' },

  // 15. Black Widow (Scarlett Johansson traje táctico)
  { id: 'BLACK_WIDOW', type: 'local', path: 'scratch/existing_static/black_widow.webp' },

  // 16. Flash (Barry Allen traje rojo velocista)
  { id: 'FLASH', type: 'local', path: 'scratch/existing_static/flash.webp' },

  // 17. Hellboy (Injustice 2 Mano Derecha de la Perdición)
  { id: 'HELLBOY', type: 'local', path: 'scratch/existing_static/hellboy.webp' },

  // 18. Morgan Freeman (Traje distinguido mentor)
  { id: 'MORGAN_FREEMAN', type: 'local', path: 'scratch/existing_static/morgan_freeman.webp' },

  // 19. Spawn (3D Sentinel Badge con ojos necroplásmicos y capa)
  { id: 'SPAWN', type: 'local', path: 'scratch/existing_static/spawn.webp' },

  // 20. Alexa (3D Núcleo Holográfico IA)
  { id: 'ALEXA', type: 'local', path: 'scratch/existing_static/alexa.webp' },

  // 21. Alex (3D Copiloto Ejecutivo)
  { id: 'ALEX', type: 'local', path: 'scratch/existing_static/alex.webp' },

  // 22. Femenino Dulce (3D Copiloto Ejecutiva Cálida)
  { id: 'FEMENINO_DULCE', type: 'local', path: 'scratch/existing_static/femenino_dulce.webp' },

  // 23. Masculino Cordial (3D Copiloto Ejecutivo Cordial)
  { id: 'MASCULINO_CORDIAL', type: 'local', path: 'scratch/existing_static/masculino_cordial.webp' },

  // 24. Robótica (3D Androide Cibernético)
  { id: 'ROBOTICA', type: 'local', path: 'scratch/existing_static/robotica.webp' }
];

async function main() {
  console.log("🚀 Generando y subiendo los Stickers 3D Canónicos para los 24 personajes...");
  console.log("   Estándar: 512x512 exacto, WebP, fondo transparente, animaciones multi-frame con node-webpmux.\n");

  const results = [];

  for (const c of characterPlan) {
    const keyLower = c.id.toLowerCase();
    const staticFileName = `${keyLower}_sticker_v2_static.webp`;
    const animFileName = `${keyLower}_sticker_v2_anim.webp`;

    console.log(`\n🎭 Procesando [${c.id}]...`);

    let srcBuf = null;
    if (c.type === 'local') {
      if (!fs.existsSync(c.path)) {
        console.error(`   ❌ Archivo local no encontrado: ${c.path}`);
        continue;
      }
      srcBuf = fs.readFileSync(c.path);
    } else if (c.type === 'url') {
      try {
        console.log(`   Descargando de ${c.url}...`);
        srcBuf = await downloadImageBuffer(c.url);
      } catch (errUrl) {
        console.error(`   ❌ Error descargando ${c.url}: ${errUrl.message}`);
        continue;
      }
    }

    try {
      // 1. Crear / obtener Static Buffer
      let staticBuf = null;
      if (c.keepStaticExact) {
        // En caso de Hulk que fue confirmado y probado por el usuario, mantener exactamente su static
        staticBuf = srcBuf;
        console.log(`   💎 Preservando gráfico confirmado por usuario: ${(staticBuf.length/1024).toFixed(1)} KB`);
      } else {
        staticBuf = await createStaticSticker(srcBuf);
      }

      // 2. Crear Animated Buffer con node-webpmux
      const animBuf = await createAnimatedSticker(srcBuf);

      // Metadatos de verificación
      const sMeta = await sharp(staticBuf).metadata();
      const aMeta = await sharp(animBuf).metadata();

      console.log(`   ✅ Estático: ${sMeta.width}x${sMeta.height} px | ${(staticBuf.length/1024).toFixed(1)} KB`);
      console.log(`   ✅ Animado:  ${aMeta.width}x${aMeta.height} px | ${aMeta.pages} frames | loop: ${aMeta.loop} | ${(animBuf.length/1024).toFixed(1)} KB`);

      // 3. Subir a Supabase Storage con POST
      const upStatic = await uploadToSupabase(staticFileName, staticBuf);
      const upAnim = await uploadToSupabase(animFileName, animBuf);

      console.log(`   ☁️ Supabase Estático: HTTP ${upStatic.status} (${upStatic.ok ? 'OK' : upStatic.body})`);
      console.log(`   ☁️ Supabase Animado:  HTTP ${upAnim.status} (${upAnim.ok ? 'OK' : upAnim.body})`);

      results.push({
        id: c.id,
        staticOk: upStatic.ok,
        animOk: upAnim.ok,
        staticSize: staticBuf.length,
        animSize: animBuf.length,
        pages: aMeta.pages,
        staticUrl: `https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/${staticFileName}`,
        animUrl: `https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/${animFileName}`
      });

    } catch (errProc) {
      console.error(`   ❌ Error procesando [${c.id}]: ${errProc.message}`);
    }
  }

  console.log("\n==================================================================");
  console.log("🏁 RESUMEN DE PROCESAMIENTO DE LOS 24 PERSONAJES:");
  console.log("==================================================================");
  let okCount = 0;
  for (const r of results) {
    const status = (r.staticOk && r.animOk) ? "✅ OK" : "⚠️ ERROR";
    if (r.staticOk && r.animOk) okCount++;
    console.log(`${r.id.padEnd(20)} ${status} | Static: ${(r.staticSize/1024).toFixed(1)}KB | Anim: ${(r.animSize/1024).toFixed(1)}KB (${r.pages}p)`);
  }
  console.log(`\nTotal completados con éxito: ${okCount} / ${characterPlan.length}`);
}

main().catch(console.error);
