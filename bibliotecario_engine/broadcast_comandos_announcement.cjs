/**
 * TRANSMISIÓN DEL COMUNICADO INSTITUCIONAL DE COMANDOS
 * Envía el comunicado oficial a todos los usuarios activos y al número personal del Gestor para su revisión
 */

const https = require('https');

const CONFIG = {
  PHONE_NUMBER_ID: '1279591731914022',
  META_ACCESS_TOKEN: 'EAAT88VhyjgIBSpNapO95mWFSWSn8YIPVayqtwyq8wrWveguPb38q0sM6ZCZCeHEhQdEsUKJVt8C5W4AhgYmJwRRB7rxoyAhK3K3ZBaIfTqURwCF9NJBdBZCv3RAdxrvTM4ZCJTbj8RoCpjrmsW5TExQZC82Kms6RnyQnNAEBfUmSI5nLwcD7pz2NQwGfAxZAwZDZD'
};

const RECIPIENTS = [
  { phone: '573008880001', role: 'Gestor de Contenido (Revisión de Dirección)', name: 'Dirección del Proyecto' },
  { phone: '34612524915', role: 'Médico Autorizado', name: 'Dr. Christian Rodrigo Mena Soria' },
  { phone: '573002847325', role: 'Médico Autorizado', name: 'Dr. JBR' }
];

const BROADCAST_MESSAGE = 
  '📢 *COMUNICADO OFICIAL DE LA DIRECCIÓN*\n' +
  '*Biblioteca Médica de Cirugía Ortopédica y Traumatología*\n' +
  '━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
  'Estimados(as) Médicos y Residentes:\n\n' +
  'Nos complace informarles que a partir de este momento se encuentra habilitada la *Guía Maestra Interactiva de Comandos y Acciones Institucionales*.\n\n' +
  'A través de esta funcionalidad, tienen a su disposición un conjunto integral de herramientas clínicas y bibliográficas:\n\n' +
  '🔍 *1. Búsqueda Quirúrgica en el Acervo:*\n' +
  'Escriba directamente patologías, técnicas o implantes (ej: _"fractura de pelvis"_, _"clavo trocanterico"_).\n\n' +
  '🧮 *2. Calculadoras y Scores (Superpoder 1):*\n' +
  'Escriba *SCORE CAPRINI*, *SCORE GUSTILO*, *SCORE MESS*, *SCORE GARDEN*, *SCORE TLICS* o *SCORE SCHATZKER*.\n\n' +
  '🩺 *3. Copiloto Pre-Operatorio (Superpoder 2):*\n' +
  'Escriba *CASO: [cirugía]* o *ABORDAJE: [nombre]* para briefing quirúrgico, vías anatómicas de riesgo y tips técnicos.\n\n' +
  '🔩 *4. Ficha Técnica de Implantes (Superpoder 3):*\n' +
  'Escriba *IMPLANTE: [sistema]* (ej: _"IMPLANTE: Placa PHILOS"_) para instrumental, machuelos, brocas y torque.\n\n' +
  '📋 *5. Interconsulta de Urgencias (Superpoder 4):*\n' +
  'Escriba *INTERCONSULTA: [datos del caso]* para estructurar el reporte ATLS/AO con esquemas antimicrobianos.\n\n' +
  '🎥 *6. Video-Técnicas en 1 Clic:*\n' +
  'Escriba *VIDEOS: [técnica]* para consultar videos verificados en VuMedi, OrthoMedia y canales académicos.\n\n' +
  '🏛️ *7. Mesa Técnica Consultiva:*\n' +
  'Escriba *MESA TECNICA* o *EXPERTOS* para consultar los 15 líderes mundiales de la especialidad.\n\n' +
  '📖 *8. Manual Oficial y Buzón Digital:*\n' +
  'Escriba *MANUAL* para el PDF interactivo o *BUZON* para aportar literatura al acervo.\n\n' +
  '━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
  '⚡ *Activación Instantánea:*\n' +
  'Para consultar esta carta de herramientas en cualquier momento, solo escriba en este chat la palabra:\n' +
  '👉 *COMANDO* o *COMANDOS*\n\n' +
  '_(El sistema cuenta con tolerancia tipográfica automática ante digitaciones involuntarias como "comados" o "funciones")._\n\n' +
  '━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
  '*Dirección del Proyecto*\n' +
  '_Iniciativa de Excelencia Académica y Soporte Clínico Continuo_';

async function sendWhatsAppText(toPhone, messageText) {
  const payload = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: toPhone.replace(/[^\d]/g, ''),
    type: 'text',
    text: { body: messageText }
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v21.0/${CONFIG.PHONE_NUMBER_ID}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let respData = '';
      res.on('data', c => { respData += c; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(respData) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: respData });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('╔═════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║   📢 TRANSMISIÓN GENERAL: GUÍA MAESTRA DE COMANDOS Y ACCIONES                    ║');
  console.log('╚═════════════════════════════════════════════════════════════════════════════════╝');

  for (const r of RECIPIENTS) {
    console.log(`\n⏳ Enviando a ${r.name} (${r.phone} - ${r.role})...`);
    const res = await sendWhatsAppText(r.phone, BROADCAST_MESSAGE);
    console.log(`Respuesta (${r.phone}):`, JSON.stringify(res));
    await new Promise(res => setTimeout(res, 350));
  }

  console.log('\n🎉 ¡TRANSMISIÓN DE COMUNICADO FINALIZADA CON ÉXITO TOTAL!');
}

main().catch(err => {
  console.error('Error en broadcast_comandos_announcement:', err);
  process.exit(1);
});
