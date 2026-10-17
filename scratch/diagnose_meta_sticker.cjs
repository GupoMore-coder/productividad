const https = require('https');
const fs = require('fs');

const TOKEN = 'EAAT88VhyjgIBSpNapO95mWFSWSn8YIPVayqtwyq8wrWveguPb38q0sM6ZCZCeHEhQdEsUKJVt8C5W4AhgYmJwRRB7rxoyAhK3K3ZBaIfTqURwCF9NJBdBZCv3RAdxrvTM4ZCJTbj8RoCpjrmsW5TExQZC82Kms6RnyQnNAEBfUmSI5nLwcD7pz2NQwGfAxZAwZDZD';
const PHONE_ID = '1050275638171147';
const RECIPIENT = '573008880001'; // or test phone

async function testSticker() {
  console.log("🔍 Probando envío directo de sticker con link...");
  const payloadLink = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: RECIPIENT,
    type: "sticker",
    sticker: {
      link: "https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/gato_con_botas_sticker_static.webp"
    }
  };

  const res1 = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payloadLink)
  });

  const json1 = await res1.json();
  console.log("Resultado envío por LINK:", res1.status, JSON.stringify(json1, null, 2));

  console.log("\n🔍 Probando pre-carga a /media de Meta...");
  // Descargar buffer del sticker
  const stickerRes = await fetch("https://grsaehpmaihrztusehkb.supabase.co/storage/v1/object/public/avatars/gato_con_botas_sticker_static.webp");
  const arrayBuffer = await stickerRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const FormData = require('form-data');
  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('type', 'image/webp');
  form.append('file', buffer, {
    filename: 'sticker.webp',
    contentType: 'image/webp'
  });

  const resMedia = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/media`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      ...form.getHeaders()
    },
    body: form.getBuffer()
  });

  const jsonMedia = await resMedia.json();
  console.log("Resultado subida a /media:", resMedia.status, JSON.stringify(jsonMedia, null, 2));

  if (jsonMedia.id) {
    console.log("\n🔍 Probando envío de sticker con media ID...");
    const payloadId = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: RECIPIENT,
      type: "sticker",
      sticker: {
        id: jsonMedia.id
      }
    };
    const res2 = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payloadId)
    });
    const json2 = await res2.json();
    console.log("Resultado envío por MEDIA ID:", res2.status, JSON.stringify(json2, null, 2));
  }
}

testSticker().catch(console.error);
