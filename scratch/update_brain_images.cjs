const fs = require('fs');

const filePath = 'fase2_ai_agent_brain.js';
let content = fs.readFileSync(filePath, 'utf8');

const keys = [
  'SPAWN', 'GATO_CON_BOTAS', 'BATMAN', 'IRON_MAN', 'OPTIMUS_PRIME',
  'SPIDERMAN', 'THOR', 'HULK', 'WOLVERINE', 'DEADPOOL', 'LOKI',
  'SUPERMAN', 'FLASH', 'HELLBOY', 'DOCTOR_STRANGE', 'BLACK_WIDOW',
  'CAPITAN_AMERICA', 'WONDER_WOMAN', 'MORGAN_FREEMAN', 'ALEXA', 'ALEX',
  'FEMENINO_DULCE', 'MASCULINO_CORDIAL', 'ROBOTICA'
];

let updatedCount = 0;

for (const key of keys) {
  const newUrl = `https://grsaehpmaihrztusehkb.supabase.co/storage/v1/render/image/public/avatars/${key.toLowerCase()}_sentinel.jpg?width=700&quality=85`;
  
  // Find the block for this key
  const keyRegex = new RegExp(`(${key}:\\s*\\{[\\s\\S]*?imagenUrl:\\s*")[^"]+(")`);
  if (keyRegex.test(content)) {
    content = content.replace(keyRegex, `$1${newUrl}$2`);
    updatedCount++;
    console.log(`✅ Actualizado [${key}] -> ${newUrl}`);
  } else {
    console.log(`❌ No encontrado [${key}]`);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`\nTotal actualizados: ${updatedCount}/${keys.length}`);
