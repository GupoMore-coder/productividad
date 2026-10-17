/**
 * Despacho Automático del Nuevo Manual Oficial vía Meta Graph API (WhatsApp)
 * Destinatario: Gestor de Contenido (+57 300 888 0001)
 */

const https = require('https');
const path = require('path');
const fs = require('fs');

const CONFIG = {
  ADMIN_PHONE: '573008880001',
  PHONE_NUMBER_ID: '1279591731914022',
  META_ACCESS_TOKEN: 'EAAT88VhyjgIBSpNapO95mWFSWSn8YIPVayqtwyq8wrWveguPb38q0sM6ZCZCeHEhQdEsUKJVt8C5W4AhgYmJwRRB7rxoyAhK3K3ZBaIfTqURwCF9NJBdBZCv3RAdxrvTM4ZCJTbj8RoCpjrmsW5TExQZC82Kms6RnyQnNAEBfUmSI5nLwcD7pz2NQwGfAxZAwZDZD',
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbxvKxFuTtTpcXXo3XgdAo1WAiIl4WhYlgd2ldPA2ePfC7Mmlo7VDu03BOhL9ybWL_Nv/exec'
};

async function sendWhatsAppMessage(toPhone, messageBody) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'text',
      text: { body: messageBody }
    });

    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v21.0/${CONFIG.PHONE_NUMBER_ID}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('🚀 Iniciando despacho automático del Nuevo Manual Oficial vía WhatsApp...');
  console.log(`📱 Destinatario (Gestor de Contenido): +57 300 888 0001 (${CONFIG.ADMIN_PHONE})`);

  const buzonUrl = `${CONFIG.WEB_APP_URL}?mode=buzon`;
  const manualUrl = CONFIG.WEB_APP_URL;

  const msg = 
`📖 *NUEVO MANUAL OFICIAL DE USO Y GOBERNANZA (EDICIÓN 2026.5)*
*Dirección:* Gestor de Contenido
━━━━━━━━━━━━━━━━━━━━━━━━━━
Estimado Gestor de Contenido:

Se ha completado satisfactoriamente la elaboración y despliegue del *Manual Oficial de Uso y Gobernanza Institucional*, incorporando la totalidad de las directrices y mejoras solicitadas:

1️⃣ *Enmascaramiento Ciego & Buzón Web Digital:*
• Desplegado el Buzón Web Anónimo Embebido (?mode=buzon).
• Se eliminaron por completo las URLs sin procesar de Google Drive.
• Integrado el botón interactivo estilizado:
  «Comparte tu información en el Buzón Digital».
• Enlace directo al Buzón:
  ${buzonUrl}

2️⃣ *Política de Cero Delación de Infraestructura:*
• Erradicación absoluta de términos reveladores (Cloud, Drive, Nube, Servidor, Raspberry, etc.) en todo el manual y mensajes públicos.
• Sustitución de menciones de identidad individual por "Dirección del Proyecto" en el ámbito público y comunicados a usuarios.
• El panel directivo "Dirección & Custodia: Gestor de Contenido" se mantiene posicionado en el encabezado.

3️⃣ *Contenido y Excelencia Editorial Suiza:*
• Registro exhaustivo de las 9 Modalidades Quirúrgicas de Búsqueda con ejemplos e iconografía.
• Motor de Lectura Crítica (NotebookLM): Límite estricto de 2 PDFs, resumen PICO, matriz comparativa cruzada e incorporación automática/anti-duplicación.
• Marca de agua ortopédica aleatoria (vectorial SVG rotativa de 4 arquetipos: Rodilla/Fémur, Placa LCP, Columna, Fijador Externo).
• Código Disciplinario y Gobernanza con escala progresiva automatizada.
• Canal Intermediado Confidencial: MENSAJE A LA DIRECCION:.

━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 *Acceso al Manual Interactivo & Descarga PDF:*
${manualUrl}

Quedamos atentos a sus observaciones para la validación definitiva del ejemplar.`;

  try {
    const res = await sendWhatsAppMessage(CONFIG.ADMIN_PHONE, msg);
    console.log('📡 Respuesta de Meta Graph API:');
    console.log(JSON.stringify(res, null, 2));

    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Mensaje despachado exitosamente al WhatsApp del Gestor de Contenido.');
    } else {
      console.warn('⚠️ Meta API devolvió código no-200. Compruebe respuesta.');
    }
  } catch (err) {
    console.error('❌ Error al enviar mensaje vía WhatsApp:', err.message);
  }
}

main();
