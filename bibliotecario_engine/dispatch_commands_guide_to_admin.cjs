/**
 * ============================================================================
 * 📤 DESPACHO EXCLUSIVO AL GESTOR DE CONTENIDO CON BOTONES INTERACTIVOS
 * Documento: Guía Maestra de Comandos y Herramientas Clínicas (10 Páginas)
 * Destinatario: Gestor de Contenido (+573008880001)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const CONFIG = {
  PHONE_NUMBER_ID: '1279591731914022',
  META_ACCESS_TOKEN: 'EAAT88VhyjgIBSpNapO95mWFSWSn8YIPVayqtwyq8wrWveguPb38q0sM6ZCZCeHEhQdEsUKJVt8C5W4AhgYmJwRRB7rxoyAhK3K3ZBaIfTqURwCF9NJBdBZCv3RAdxrvTM4ZCJTbj8RoCpjrmsW5TExQZC82Kms6RnyQnNAEBfUmSI5nLwcD7pz2NQwGfAxZAwZDZD',
  ADMIN_PHONE: '573008880001'
};

const PDF_PATH = path.join(__dirname, 'knowledge', 'Guia_Maestra_Comandos_Biblioteca_Medica.pdf');

function uploadMediaWithCurl(filePath) {
  try {
    const escapedPath = filePath.replace(/\\/g, '/');
    const cmd = `curl.exe -s -X POST "https://graph.facebook.com/v21.0/${CONFIG.PHONE_NUMBER_ID}/media" ` +
                `-H "Authorization: Bearer ${CONFIG.META_ACCESS_TOKEN}" ` +
                `-F "messaging_product=whatsapp" ` +
                `-F "type=application/pdf" ` +
                `-F "file=@${escapedPath};type=application/pdf"`;
    
    const output = execSync(cmd, { encoding: 'utf8', timeout: 30000 });
    const parsed = JSON.parse(output);
    return { status: 200, body: parsed };
  } catch (err) {
    return { status: 500, error: err.message };
  }
}

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

async function sendInteractiveButtons(toPhone, bodyText, buttons) {
  const payload = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: toPhone.replace(/[^\d]/g, ''),
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.map(b => ({
          type: 'reply',
          reply: {
            id: b.id.substring(0, 256),
            title: b.title.substring(0, 20)
          }
        }))
      }
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

async function main() {
  console.log('╔═════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║   🚀 DESPACHO EXCLUSIVO DE LA GUÍA MAESTRA AL GESTOR (+573008880001)            ║');
  console.log('║   Control de Calidad y Human-in-the-Loop Gate con Botones Interactivos          ║');
  console.log('╚═════════════════════════════════════════════════════════════════════════════════╝');

  if (!fs.existsSync(PDF_PATH)) {
    console.error('❌ El archivo PDF no existe. Genérelo primero.');
    process.exit(1);
  }
  const stat = fs.statSync(PDF_PATH);
  console.log(`📄 Archivo PDF verificado (${(stat.size / 1024).toFixed(1)} KB): ${path.basename(PDF_PATH)}`);

  // 1. Subida a Meta Media API usando curl.exe (Resiliente a desconexiones de red)
  console.log('\n⏳ Subiendo PDF a Meta WhatsApp Cloud API...');
  const uploadRes = uploadMediaWithCurl(PDF_PATH);
  console.log('Respuesta de subida:', JSON.stringify(uploadRes));

  if (!uploadRes.body || !uploadRes.body.id) {
    console.error('❌ Error al subir el documento a Meta API:', uploadRes);
    process.exit(1);
  }

  const mediaId = uploadRes.body.id;
  console.log(`✅ Media ID generado exitosamente: ${mediaId}`);

  // Guardamos el mediaId en cache local
  const mediaCachePath = path.join(__dirname, 'knowledge', 'last_commands_guide_media_id.json');
  fs.writeFileSync(mediaCachePath, JSON.stringify({ mediaId, timestamp: new Date().toISOString() }, null, 2));

  // 2. Envío del documento adjunto SOLAMENTE AL GESTOR
  console.log(`\n⏳ Enviando documento PDF adjunto al Gestor (+${CONFIG.ADMIN_PHONE})...`);
  const docCaption = 
    '📚 *DOCUMENTO OFICIAL: GUÍA MAESTRA DE COMANDOS Y HERRAMIENTAS CLÍNICAS*\n' +
    'Edición 2026 • 10 Páginas con Catálogo Exhaustivo y Múltiples Ejemplos de Quirófano y Urgencias\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '*Dirección del Proyecto* | _Iniciativa de Excelencia Académica_';

  const docRes = await sendDocumentToWhatsApp(
    CONFIG.ADMIN_PHONE,
    mediaId,
    'Guia_Maestra_Comandos_Biblioteca_Medica.pdf',
    docCaption
  );
  console.log('Respuesta envío de documento:', JSON.stringify(docRes));

  // 3. Envío de botones interactivos de decisión de la Dirección
  console.log('\n⏳ Enviando botones interactivos de acción rápida al Gestor...');
  const interactiveBody = 
    '🏛️ *CONTROL DE CALIDAD Y DIFUSIÓN DE LA DIRECCIÓN*\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    'Estimado Gestor de Contenido:\n\n' +
    'Se ha compilado el documento PDF oficial adjunto arriba con la explicación detallada, sustento técnico y múltiples ejemplos de todas las funciones del sistema.\n\n' +
    'Por favor examine el documento y elija la acción a seguir:\n\n' +
    '• *Aprobar y Difundir:* Despachará de inmediato *ÚNICAMENTE el documento PDF* a los médicos autorizados (sin duplicar el texto previo).\n' +
    '• *Solicitar Ajustes:* Cancela la difusión masiva y espera sus observaciones en este chat para generar una nueva versión.\n' +
    '• *Cancelar:* Desestima el despacho institucional.\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '💡 _Toque el botón correspondiente para accionar el sistema:_';

  const actionButtons = [
    { id: 'CMD_GUIDE_APPROVE', title: '✅ Aprobar y Difundir' },
    { id: 'CMD_GUIDE_REVISE', title: '✏️ Solicitar Ajustes' },
    { id: 'CMD_GUIDE_CANCEL', title: '❌ Cancelar' }
  ];

  const btnRes = await sendInteractiveButtons(CONFIG.ADMIN_PHONE, interactiveBody, actionButtons);
  console.log('Respuesta envío de botones:', JSON.stringify(btnRes));

  console.log('\n═════════════════════════════════════════════════════════════════════════════════════════');
  console.log('🎉 DESPACHO EXCLUSIVO AL GESTOR COMPLETADO CON ÉXITO');
  console.log(`📌 Destinatario Exclusivo: +${CONFIG.ADMIN_PHONE}`);
  console.log(`🆔 Media ID: ${mediaId}`);
  console.log('═════════════════════════════════════════════════════════════════════════════════════════\n');
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Error en despacho:', err);
    process.exit(1);
  });
}

module.exports = { uploadMediaWithCurl, sendDocumentToWhatsApp, sendInteractiveButtons };
