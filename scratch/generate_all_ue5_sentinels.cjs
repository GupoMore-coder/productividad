const fs = require('fs');
const https = require('https');
const http = require('http');

const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyc2FlaHBtYWlocnp0dXNlaGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMTIyNzcsImV4cCI6MjA5MDU4ODI3N30.fF0L0HSu2XFs0pjVI9wY9T7NfmtZZKt4iWNQ9tC4wNI";
const SUPABASE_HOST = "grsaehpmaihrztusehkb.supabase.co";

const characters = {
  DEADPOOL: "3D character render, Unreal Engine 5, Octane render, 8k resolution. Deadpool in his classic red and black suit posing with irreverent attitude as a financial sentinel, holding a golden calculator and an open accounting ledger, twin katanas on his back, inside a high-tech modern bank vault packed with gold bullion ingots and glowing neon green financial stock graphs, vibrant colors, cinematic lighting, masterpiece",
  BATMAN: "3D character render, Unreal Engine 5, Octane render, 8k resolution. Batman Dark Knight in sleek armored tactical bat-suit standing as a financial sentinel inside a massive Wayne Enterprises bank vault, glowing holographic blue candlestick charts and financial metrics, stacks of gold bars, dark moody cinematic lighting, masterpiece",
  GATO_CON_BOTAS: "3D stylized character render, Unreal Engine 5, DreamWorks 3D film quality, 8k resolution. An anthropomorphic ginger tabby cat hero dressed as Puss in Boots, wearing a wide black feathered cavalier hat, red cape, and leather musketeer boots, holding an elegant miniature rapier sword, standing proudly on an open antique treasure chest overflowing with shiny gold coins and royal accounting ledgers, warm golden lighting, detailed fur, masterpiece",
  IRON_MAN: "3D character render, Unreal Engine 5, Octane render, 8k resolution. Iron Man Tony Stark in gleaming metallic red and gold armor with glowing chest arc reactor, standing as CFO financial sentinel surrounded by floating 3D holographic financial dashboards, stock market candlestick charts, inside a futuristic corporate bank penthouse, cinematic volumetric lighting, masterpiece",
  SPIDERMAN: "3D character render, Unreal Engine 5, Octane render, 8k resolution. Spider-Man in classic red and blue textured suit, crouching heroically as an agile financial sentinel on top of a massive steel bank safe, web strands securing stacks of cash and gold bars, glowing neon financial tickers in background, cinematic lighting, masterpiece",
  THOR: "3D character render, Unreal Engine 5, Octane render, 8k resolution. Thor God of Thunder in ornate Asgardian armor, holding glowing Mjolnir crackling with blue lightning, standing sentinel guarding the golden Asgardian royal treasury with stacks of gold, ancient runic ledgers, and golden chalices, epic cinematic lighting, masterpiece",
  HULK: "3D stylized character render, Unreal Engine 5, Octane render, 8k resolution. Incredible Hulk massive green muscular superhero wearing tactical executive vest and glasses, standing inside a reinforced steel bank vault flexing muscular arms guarding huge pallets of gold bullion, smashing red financial loss charts, vibrant green lighting, masterpiece",
  WOLVERINE: "3D character render, Unreal Engine 5, Octane render, 8k resolution. Wolverine Logan in yellow and blue armored suit, unsheathed razor-sharp adamantium claws slicing through a red ledger of debt and inflation, standing in a heavy bank vault guarding stacks of cash and gold, intense ferocious expression, cinematic lighting, masterpiece",
  SUPERMAN: "3D character render, Unreal Engine 5, Octane render, 8k resolution. Superman in classic suit with flowing red cape and S-shield, hovering majestically as a pillar of financial solvency inside a crystalline vault with glowing crystalline financial charts and golden ingots, bright heroic lighting, masterpiece",
  LOKI: "3D character render, Unreal Engine 5, Octane render, 8k resolution. Loki with magnificent curved golden horned helmet and emerald royal cape, holding glowing scepter, standing regally in front of an imperial treasury filled with golden treasures, sovereign asset scrolls, and defensive magical barriers, cinematic green and gold lighting, masterpiece",
  FLASH: "3D character render, Unreal Engine 5, Octane render, 8k resolution. The Flash Barry Allen in aerodynamic red suit with gold accents, speed-force golden lightning trailing around him as he audits financial books and sorts bank ledgers at light speed inside a modern financial center, dynamic motion blur, masterpiece",
  DOCTOR_STRANGE: "3D character render, Unreal Engine 5, Octane render, 8k resolution. Doctor Strange in blue sorcerer robes and Cloak of Levitation, Eye of Agamotto glowing on chest, casting intricate orange Taoist mystical mandala magic shields protecting a vault of gold bars and accounting scrolls, cosmic cinematic lighting, masterpiece",
  BLACK_WIDOW: "3D character render, Unreal Engine 5, Octane render, 8k resolution. Black Widow Natasha Romanoff in tactical black stealth armor with glowing blue electric batons, standing in a high-tech audit operations control room with multiple holographic radar screens detecting hidden financial leaks, sleek cinematic lighting, masterpiece",
  CAPITAN_AMERICA: "3D character render, Unreal Engine 5, Octane render, 8k resolution. Captain America Steve Rogers in armored patriotic suit, raising his round vibranium shield defensively in front of stacks of gold bullion and accounting books, resolute stoic expression, dramatic cinematic lighting, masterpiece",
  WONDER_WOMAN: "3D character render, Unreal Engine 5, Octane render, 8k resolution. Wonder Woman Diana Prince in golden armored eagle corslet, tiara, and glowing golden Lasso of Truth, standing as guardian of fiduciary integrity inside a grand marble temple treasury filled with gold shields and treasures, radiant sunlight, masterpiece",
  HELLBOY: "3D stylized character render, Unreal Engine 5, Octane render, 8k resolution. Hellboy red demon superhero with filed horns and glowing yellow eyes, heavy trench coat, massive stone Right Hand of Doom resting on an iron bank safe guarding treasure from debt demons, cigar smoke, dramatic gothic lighting, masterpiece",
  SPAWN: "3D character render, Unreal Engine 5, Octane render, 8k resolution. Spawn Al Simmons with glowing spectral green eyes and colossal billowing spiked crimson cape, spiked chains wrapping securely around an ancient iron bank vault guarding wealth from the shadows, dark atmospheric volumetric lighting, masterpiece",
  OPTIMUS_PRIME: "3D character render, Unreal Engine 5, Octane render, 8k resolution. Optimus Prime towering Autobot leader in gleaming blue and red metallic armor, standing heroically at the gates of a Cybertronian golden financial fortress, glowing blue chest matrix, dramatic scale and cinematic lighting, masterpiece",
  MORGAN_FREEMAN: "3D stylized character render, Unreal Engine 5, Octane render, 8k resolution. Distinguished wise African-American elder mentor resembling Morgan Freeman in a tailored luxury charcoal suit, sitting in an executive mahogany boardroom with leather armchairs, golden scales of justice and financial wealth documents, warm elegant lighting, masterpiece",
  ALEXA: "3D character render, Unreal Engine 5, Octane render, 8k resolution. Futuristic beautiful female cybernetic AI android with glowing cyan neon data circuits, floating digital holographic data cubes and financial reconciliation charts, sleek white and silver chassis, high-tech clean lighting, masterpiece",
  ALEX: "3D stylized character render, Unreal Engine 5, Octane render, 8k resolution. Handsome modern executive financial analyst in a tailored navy blue Italian suit and smart glasses, standing confidently in front of a curved wall of multi-monitor financial trading terminals and candlestick charts, modern corporate lighting, masterpiece",
  FEMENINO_DULCE: "3D stylized character render, Unreal Engine 5, Octane render, 8k resolution. Warm, elegant female executive financial advisor (Aura) with kind welcoming smile, tailored ivory blazer, standing in a sunlit modern wealth management office with architectural plants and golden award trophies, soft bright cinematic lighting, masterpiece",
  MASCULINO_CORDIAL: "3D stylized character render, Unreal Engine 5, Octane render, 8k resolution. Friendly, empathetic male executive financial advisor (Ciro) with a warm genuine smile, stylish textured navy blazer and white crisp shirt, standing in a contemporary financial lounge with warm wood and ambient lights, inviting professional lighting, masterpiece",
  ROBOTICA: "3D character render, Unreal Engine 5, Octane render, 8k resolution. Sleek futuristic robotic sentinel with polished chrome and matte black armor, glowing amber numeric visor and cryptographic core, guarding a digital blockchain vault with glowing data blocks, high-tech sci-fi lighting, masterpiece"
};

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function checkIfExistsInSupabase(fileName) {
  return new Promise(resolve => {
    const url = `https://${SUPABASE_HOST}/storage/v1/render/image/public/avatars/${fileName}?width=100`;
    https.get(url, res => {
      res.resume();
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

function fetchImageBuffer(url, maxRedirects = 4, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error("Too many redirects"));
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        let loc = res.headers.location;
        if (loc.startsWith("/")) {
          const u = new URL(url);
          loc = u.origin + loc;
        }
        res.resume();
        return fetchImageBuffer(loc, maxRedirects - 1, timeoutMs).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        resolve({
          buffer: Buffer.concat(chunks),
          mimeType: res.headers["content-type"] || "image/jpeg"
        });
      });
    });
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error("Timeout de conexión"));
    });
    req.on("error", reject);
  });
}

async function fetchWithRetry(url, maxRetries = 6, backoffMs = 15000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetchImageBuffer(url);
      return res;
    } catch (err) {
      const isRetryable = err.message.includes("402") || 
                          err.message.includes("500") || 
                          err.message.includes("502") || 
                          err.message.includes("503") || 
                          err.message.includes("Timeout");
      if (isRetryable && attempt < maxRetries) {
        console.log(`   ⏳ Pausando ${backoffMs / 1000}s para recargar token (${err.message}) (intento ${attempt}/${maxRetries})...`);
        await sleep(backoffMs);
        backoffMs += 3000;
      } else {
        throw err;
      }
    }
  }
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

async function processCharacter(key, prompt, seed) {
  const fileName = `${key.toLowerCase()}_sentinel_3d.jpg`;

  // 1. Verificar si ya existe en Supabase
  const exists = await checkIfExistsInSupabase(fileName);
  if (exists) {
    console.log(`⏩ [${key}] ya existe en Supabase (${fileName}). Omitiendo.`);
    return { ok: true, skipped: true };
  }

  // 2. Verificar si está en caché local scratch/
  const localPath = `scratch/ue5_${fileName}`;
  let imgBuffer = null;
  let mimeType = "image/jpeg";

  if (fs.existsSync(localPath)) {
    console.log(`📂 [${key}] encontrado en scratch local. Subiendo a Supabase...`);
    imgBuffer = fs.readFileSync(localPath);
  } else {
    // Generar con Pollinations AI
    const encoded = encodeURIComponent(prompt);
    const genUrl = `https://image.pollinations.ai/prompt/${encoded}?width=800&height=800&model=turbo&nologo=true&seed=${seed}`;
    console.log(`\n🎨 Generando con IA 3D: [${key}]...`);

    try {
      const imgData = await fetchWithRetry(genUrl, 6, 15000);
      imgBuffer = imgData.buffer;
      mimeType = imgData.mimeType;
      console.log(`   ✨ Generado con éxito: ${imgBuffer.length} bytes (${mimeType})`);

      // Guardar respaldo local
      fs.writeFileSync(localPath, imgBuffer);
    } catch (err) {
      console.log(`   ❌ Error generando [${key}]: ${err.message}`);
      return { ok: false, skipped: false };
    }
  }

  // 3. Subir a Supabase Storage
  try {
    const uploadRes = await uploadToSupabase(fileName, imgBuffer, mimeType);
    if (uploadRes.ok) {
      console.log(`   🚀 Subido a Supabase: avatars/${fileName} (Status ${uploadRes.status})`);
      return { ok: true, skipped: false };
    } else {
      console.log(`   ⚠️ Error subiendo a Supabase (${uploadRes.status}): ${uploadRes.body}`);
      return { ok: false, skipped: false };
    }
  } catch (err) {
    console.log(`   ⚠️ Error de red subiendo a Supabase: ${err.message}`);
    return { ok: false, skipped: false };
  }
}

async function runAll() {
  console.log("=================================================================");
  console.log("GENERADOR DE GALERÍA DE CENTINELAS FINANCIEROS (UNREAL ENGINE 5)");
  console.log("=================================================================");

  let successCount = 0;
  let seed = 1001;

  for (const [key, prompt] of Object.entries(characters)) {
    const res = await processCharacter(key, prompt, seed);
    if (res && res.ok) successCount++;
    seed += 37;
    if (res && !res.skipped) {
      // Pausa preventiva de 14 segundos sólo cuando se generó una imagen nueva
      await sleep(14000);
    }
  }

  console.log(`\n=================================================================`);
  console.log(`Finalizado: ${successCount}/${Object.keys(characters).length} personajes listos en Supabase.`);
  console.log("=================================================================");
}

runAll();
