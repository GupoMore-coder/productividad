/**
 * Intento de despacho del archivo PDF compilado directamente como documento de WhatsApp
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CONFIG = {
  ADMIN_PHONE: '573008880001',
  PHONE_NUMBER_ID: '1279591731914022',
  META_ACCESS_TOKEN: 'EAAT88VhyjgIBSpNapO95mWFSWSn8YIPVayqtwyq8wrWveguPb38q0sM6ZCZCeHEhQdEsUKJVt8C5W4AhgYmJwRRB7rxoyAhK3K3ZBaIfTqURwCF9NJBdBZCv3RAdxrvTM4ZCJTbj8RoCpjrmsW5TExQZC82Kms6RnyQnNAEBfUmSI5nLwcD7pz2NQwGfAxZAwZDZD'
};

async function uploadMedia(filePath) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2);
  const fileData = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  const preFile = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="messaging_product"\r\n\r\nwhatsapp\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="type"\r\n\r\napplication/pdf\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
    `Content-Type: application/pdf\r\n\r\n`
  );

  const postFile = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([preFile, fileData, postFile]);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v21.0/${CONFIG.PHONE_NUMBER_ID}/media`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.META_ACCESS_TOKEN}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
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
    req.write(body);
    req.end();
  });
}

async function sendDocumentMessage(mediaId, fileName) {
  const payload = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: CONFIG.ADMIN_PHONE,
    type: 'document',
    document: {
      id: mediaId,
      filename: fileName,
      caption: '📄 Ejemplar Oficial: Manual de Uso y Gobernanza Institucional (Edición 2026.5)'
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

async function run() {
  const pdfPath = path.join(__dirname, 'knowledge', 'Manual_de_Uso_Biblioteca_Ortopedica.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error('No se encontró el PDF compilado');
    return;
  }

  console.log('📤 Subiendo documento PDF a Meta Graph API Media Container...');
  const uploadRes = await uploadMedia(pdfPath);
  console.log('Respuesta upload:', uploadRes);

  if (uploadRes.status === 200 && uploadRes.body && uploadRes.body.id) {
    const mediaId = uploadRes.body.id;
    console.log(`✅ Media subida exitosamente con ID: ${mediaId}`);
    console.log('📲 Despachando documento PDF a WhatsApp...');
    const docRes = await sendDocumentMessage(mediaId, 'Manual_de_Uso_Biblioteca_Ortopedica.pdf');
    console.log('Respuesta envío documento:', docRes);
    if (docRes.status === 200) {
      console.log('🎉 Documento PDF entregado exitosamente al chat de WhatsApp!');
    }
  } else {
    console.warn('No se pudo subir la media binaria:', uploadRes);
  }
}

run();
