const https = require('https');

const keys = [
  'DEADPOOL', 'BATMAN', 'IRON_MAN', 'SPIDERMAN', 'CAPITAN_AMERICA', 
  'THOR', 'WOLVERINE', 'SUPERMAN', 'WONDER_WOMAN', 'GATO_CON_BOTAS', 
  'LOKI', 'BLACK_WIDOW', 'MORGAN_FREEMAN', 'OPTIMUS_PRIME', 'HULK', 
  'HELLBOY', 'SPAWN', 'FLASH', 'DOCTOR_STRANGE', 'ALEXA', 'ALEX', 
  'FEMENINO_DULCE', 'MASCULINO_CORDIAL', 'ROBOTICA'
];

async function check() {
  console.log("Comprobando URLs de Supabase Image CDN para los 24 centinelas:");
  let ok = 0;
  for (const k of keys) {
    const url = "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/render/image/public/avatars/" + k.toLowerCase() + "_sentinel.jpg?width=700&quality=85";
    await new Promise(r => {
      https.get(url, res => {
        console.log(`${k.padEnd(20)}: ${res.statusCode} | ${res.headers['content-type']} | ${res.headers['content-length']} bytes`);
        if (res.statusCode === 200) ok++;
        res.destroy();
        r();
      });
    });
  }
  console.log(`\nResultado final: ${ok}/${keys.length} imágenes verificadas al 100%.`);
}

check();
