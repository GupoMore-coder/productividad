const fs = require('fs');

// Verify evidence processing functions
const script = fs.readFileSync('GoogleAppsScript_SheetsManager.js', 'utf8');

global.Logger = { log: (msg) => console.log('[LOGGER]:', msg) };
global.PropertiesService = {
  getScriptProperties: () => ({
    getProperty: () => null,
    setProperty: () => {}
  })
};

global.LanguageApp = {
  translate: (text, from, to) => 'treatment of radial meniscus tears'
};

global.Utilities = {
  base64Encode: (bytes) => Buffer.from(bytes).toString('base64'),
  base64EncodeWebSafe: (str) => Buffer.from(str).toString('base64url'),
  computeHmacSha256Signature: (val, key) => [1, 2, 3, 4],
  DigestAlgorithm: { SHA_256: 'SHA_256' },
  MacAlgorithm: { HMAC_SHA_256: 'HMAC_SHA_256' },
  newBlob: (str) => ({ getBytes: () => Buffer.from(str || '') })
};

global.sendWhatsAppText = (phone, text) => {
  console.log(`\n[WHATSAPP TO ${phone}]:\n${text}\n`);
};

global.recordTelemetry = (phone, q, cat, status, title) => {
  console.log(`[TELEMETRY]: ${status} - ${title}`);
};

global.callGeminiClinicalEngine = (prompt, role) => {
  return '1. Consenso Clínico: Las reparaciones meniscales dentro de la zona vascular (rojo-rojo o rojo-blanco) muestran tasas de cicatrización superiores a la meniscectomía parcial.\n\n2. Comparativa: Cohen et al. destacan el rol de la fijación anatómica por sobre la resección en pacientes jóvenes activos.\n\n3. Recomendación: Se prioriza la preservación meniscal mediante sutura todo-adentro (all-inside) o dentro-afuera (inside-out) según la localización (Nivel de Evidencia II).';
};

global.generateEvidenceTokenLink = (query, articles, synthesis, phone) => {
  return 'https://script.google.com/macros/s/.../exec?mode=evidence&token=TEST_TOKEN_123';
};

global.CONFIG = {
  PUBMED_API_BASE: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/'
};

global.UrlFetchApp = {
  fetch: (url) => {
    console.log('[MOCK FETCH]:', url);
    if (url.includes('esearch.fcgi')) {
      return {
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify({
          esearchresult: { idlist: ['42600745', '42562328', '42365573'] }
        })
      };
    }
    if (url.includes('esummary.fcgi')) {
      return {
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify({
          result: {
            '42600745': {
              title: 'Meniscal root tears: A state of the art.',
              authors: [{ name: 'Cohen D' }],
              source: 'J ISAKOS',
              pubdate: '2026 Oct',
              articleids: [{ idtype: 'doi', value: '10.1016/j.jisako.2026.101202' }]
            },
            '42562328': {
              title: 'Exploring the rotational instability spectrum of anterior cruciate ligament deficiency...',
              authors: [{ name: 'Rivarola H' }],
              source: 'J ISAKOS',
              pubdate: '2026 Oct',
              articleids: [{ idtype: 'doi', value: '10.1016/j.jisako.2026.101195' }]
            },
            '42365573': {
              title: 'Diagnostic accuracy of MRI for meniscal tear patterns in ACL-deficient knees...',
              authors: [{ name: 'Boonrod A' }],
              source: 'Skeletal Radiol',
              pubdate: '2026 Oct',
              articleids: [{ idtype: 'doi', value: '10.1007/s00256-026-05288-y' }]
            }
          }
        })
      };
    }
    return { getResponseCode: () => 200, getContentText: () => '{}' };
  }
};

eval(script);

console.log('================================================================');
console.log('TEST 1: "requiero evidencia para el tratamiento de lesiones radiales de meniscos"');
console.log('================================================================');
const text1 = 'requiero evidencia para el tratamiento de lesiones radiales de meniscos';
console.log('isEvidenceSearchIntent:', isEvidenceSearchIntent(text1));
const q1 = extractEvidenceQuery(text1);
console.log('Clean Query extracted:', q1);
handleEvidenceSearch('573001234567', '573001234567', q1);

console.log('================================================================');
console.log('TEST 2: "EVIDENCIA: requiero evidencia para el tratamiento de lesiones radiales de meniscos"');
console.log('================================================================');
const text2 = 'EVIDENCIA: requiero evidencia para el tratamiento de lesiones radiales de meniscos';
console.log('isEvidenceSearchIntent:', isEvidenceSearchIntent(text2));
const q2 = extractEvidenceQuery(text2);
console.log('Clean Query extracted:', q2);
handleEvidenceSearch('573001234567', '573001234567', q2);
