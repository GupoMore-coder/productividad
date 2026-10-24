/**
 * ============================================================================
 * 📚 DIFUSIÓN DEL DOCUMENTO PDF DE LA GUÍA MAESTRA A MÉDICOS AUTORIZADOS
 * Se ejecuta tras la aprobación expresa del Gestor de Contenido
 * Entrega ÚNICAMENTE el documento PDF adjunto (sin duplicar texto previo)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CONFIG = {
  PHONE_NUMBER_ID: '1279591731914022',
  META_ACCESS_TOKEN: 'EAAT88VhyjgIBSpNapO95mWFSWSn8YIPVayqtwyq8wrWveguPb38q0sM6ZCZCeHEhQdEsUKJVt8C5W4AhgYmJwRRB7rxoyAhK3K3ZBaIfTqURwCF9NJBdBZCv3RAdxrvTM4ZCJTbj8RoCpjrmsW5TExQZC82Kms6RnyQnNAEBfUmSI5nLwcD7pz2NQwGfAxZAwZDZD',
  ADMIN_PHONE: '573008880001',
  DEFAULT_MEDIA_ID: '941275908800338'
};

const DOCTORS_RECIPIENTS = [
  { phone: '34612524915', name: 'Dr. Christian Rodrigo Mena Soria', role: 'Médico Autorizado' },
  { phone: '573002847325', name: 'Dr. JBR', role: 'Médico Autorizado' }
];

async function sendDocumentToWhatsApp(toPhone, mediaId, fileName, caption) {
  const payload = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: toPhone.replace(/[^\d]/g, ''),
    type: 'document',
    document: {
      id: mediaId,
      filename: fileName,
      caption: caption
    }
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

async function executeBroadcastApprovedGuide() {
  console.log('╔═════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║   📢 DIFUSIÓN DE GUÍA MAESTRA (SOLO DOCUMENTO PDF ADJUNTO A MÉDICOS)            ║');
  console.log('║   Custodia y Aprobación: Gestor de Contenido                                    ║');
  console.log('╚═════════════════════════════════════════════════════════════════════════════════╝');

  let mediaId = CONFIG.DEFAULT_MEDIA_ID;
  const mediaCachePath = path.join(__dirname, 'knowledge', 'last_commands_guide_media_id.json');
  if (fs.existsSync(mediaCachePath)) {
    try {
      const cached = JSON.parse(fs.readFileSync(mediaCachePath, 'utf8'));
      if (cached.mediaId) mediaId = cached.mediaId;
    } catch(e) {}
  }
  console.log(`🆔 Media ID a transmitir: ${mediaId}`);

  const results = [];
  const caption = 
    '📚 *DOCUMENTO OFICIAL ADJUNTO: GUÍA MAESTRA DE COMANDOS Y HERRAMIENTAS CLÍNICAS*\n' +
    'Edición Oficial 2026 • Cirugía Ortopédica y Traumatología\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '*Dirección del Proyecto* | _Iniciativa de Excelencia Académica_';

  for (const doc of DOCTORS_RECIPIENTS) {
    console.log(`\n⏳ Despachando documento PDF a ${doc.name} (+${doc.phone})...`);
    try {
      const res = await sendDocumentToWhatsApp(
        doc.phone,
        mediaId,
        'Guia_Maestra_Comandos_Biblioteca_Medica.pdf',
        caption
      );
      console.log(`Resultado (+${doc.phone}):`, JSON.stringify(res));
      results.push({ phone: doc.phone, name: doc.name, success: res.status === 200, res });
    } catch (err) {
      console.error(`❌ Error enviando a +${doc.phone}:`, err.message);
      results.push({ phone: doc.phone, name: doc.name, success: false, error: err.message });
    }
  }

  // Notificación de reporte atómico a la Dirección
  const successCount = results.filter(r => r.success).length;
  const bulletReport = results.map(r => `• ${r.name} (+${r.phone}): ${r.success ? '✅ Entregado' : '❌ Falló'}`).join('\n');

  const adminReport = 
    '📢 *REPORTE DE DIFUSIÓN DE GUÍA MAESTRA (1-a-1)*\n' +
    '*Dirección:* Gestor de Contenido\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    `✅ Despachos Exitosos: ${successCount} de ${results.length} médicos autorizados\n\n` +
    bulletReport + '\n\n' +
    '📌 *Modalidad de Entrega:* ÚNICAMENTE documento PDF adjunto (sin duplicar el texto previo).\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '🔒 *Garantía de Confidencialidad:* Cada mensaje fue transmitido de forma atómica e individualizada. Ningún destinatario conoce quién más recibió el ejemplar.';

  console.log('\n⏳ Transmitiendo reporte de confirmación al Gestor...');
  const repRes = await sendWhatsAppText(CONFIG.ADMIN_PHONE, adminReport);
  console.log('Respuesta Reporte Gestor:', JSON.stringify(repRes));

  console.log('\n🎉 Proceso de difusión completado satisfactoriamente.');
  return { successCount, total: results.length, results };
}

if (require.main === module) {
  executeBroadcastApprovedGuide().catch(err => {
    console.error('❌ Error en difusión:', err);
    process.exit(1);
  });
}

module.exports = { executeBroadcastApprovedGuide };
