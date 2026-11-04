/**
 * TEST SUITE: Fase 2 - Modelo de Entrega Dual y Menús Interactivos de WhatsApp
 * Dirección y Custodia: Gestor de Contenido
 * 
 * Verificaciones:
 * 1. Término sombrilla "Ateneo" -> Menú Interactivo Nativo (Meta List Message)
 * 2. Término sombrilla de Área "Cadera" -> Menú Interactivo con opciones clínicas
 * 3. Entrega de 1 a 3 documentos -> Fichas individuales + botones interactivos de acción rápida
 * 4. Entrega de > 3 documentos -> Top 3 preview + Compilación y entrega dinámica de Dossier PDF
 * 5. Clic en botón interactivo DOC_<driveId> -> Ficha individual y descarga directa inmediata
 * 6. Solicitud directa de Dossier ("Dossier Ateneos") -> Compilación y despacho del PDF con 1 clic
 * 7. Anonimato Cardinal Estricto y Cero PII
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('🧪 BATERÍA DE PRUEBAS: FASE 2 - ENTREGA DUAL Y LISTAS INTERACTIVAS');
console.log('================================================================\n');

const gasCode = fs.readFileSync(path.join(__dirname, 'GoogleAppsScript_SheetsManager.js'), 'utf8');

const mockCache = {};
const sentWhatsAppMessages = [];
const sentWhatsAppDocuments = [];
const sentWhatsAppLists = [];
const sentWhatsAppButtons = [];

const TEST_PHONE = '+573109998888';

const mockSheetUsr = {
  getName: () => 'Directorio_Usuarios',
  getDataRange: () => ({
    getValues: () => [
      ['Telefono', 'Nombre', 'Institucion', 'Nivel', 'Estado', 'FechaRegistro', 'Cuota', 'UltimaConsulta', 'FinSusp', 'Motivo', 'Correo', 'Historial', 'Bandera', 'Pais', 'Idioma'],
      [TEST_PHONE, 'Dr. Residente', 'Hospital Universitario', 'Residente R3', 'APROBADO', new Date(), 50, new Date(), '', '', '', '[]', '🇨🇴', 'Colombia', 'ES']
    ]
  }),
  appendRow: () => {}
};

const csvPath = path.join(__dirname, 'knowledge', 'inventario_maestro_expandido.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.trim().split('\n');
const mockInventoryRows = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  const parts = [];
  let inQuotes = false;
  let cur = '';
  for (let c = 0; c < line.length; c++) {
    const char = line[c];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
      parts.push(cur.replace(/^"|"$/g, ''));
      cur = '';
    } else {
      cur += char;
    }
  }
  parts.push(cur.replace(/^"|"$/g, ''));
  mockInventoryRows.push(parts);
}

const mockSheetInv = {
  getName: () => 'Inventario_Maestro',
  getDataRange: () => ({
    getValues: () => mockInventoryRows
  })
};

const mockSpreadsheet = {
  getSheetByName: (name) => {
    if (name === 'Inventario_Maestro') return mockSheetInv;
    return mockSheetUsr;
  },
  getSheets: () => [mockSheetInv, mockSheetUsr]
};

global.SpreadsheetApp = {
  getActiveSpreadsheet: () => mockSpreadsheet
};

global.CacheService = {
  getScriptCache: () => ({
    get: (key) => mockCache[key] || null,
    put: (key, val, ttl) => { mockCache[key] = val; },
    remove: (key) => { delete mockCache[key]; },
    getAll: (keys) => {
      const res = {};
      for (const k of keys) {
        if (mockCache[k]) res[k] = mockCache[k];
      }
      return res;
    },
    putAll: (obj, ttl) => {
      for (const k in obj) mockCache[k] = obj[k];
    },
    removeAll: (keys) => {
      for (const k of keys) delete mockCache[k];
    }
  })
};

global.Utilities = {
  base64Encode: (bytes) => Buffer.from(bytes).toString('base64'),
  base64Decode: (str) => Buffer.from(str, 'base64'),
  newBlob: (content, mimeType, name) => ({
    getBytes: () => Buffer.from(content || ''),
    getDataAsString: () => String(content || ''),
    getName: () => name || 'document.pdf',
    getContentType: () => mimeType || 'application/octet-stream',
    getAs: (targetMime) => ({
      getBytes: () => Buffer.from(content || ''),
      getName: () => (name ? name.replace(/\.\w+$/, '.pdf') : 'Dossier_Bibliografico.pdf'),
      getContentType: () => targetMime,
      setName: function(n) { this._name = n; return this; }
    })
  }),
  computeHmacSha256Signature: (data, salt) => {
    const crypto = require('crypto');
    return crypto.createHmac('sha256', salt).update(data).digest();
  },
  formatDate: (date, tz, fmt) => '04/11/2026 18:30'
};

global.DriveApp = {
  createFile: (blob) => ({
    getId: () => '1_DRIVE_MOCK_FILE_ID_' + Math.random().toString(36).substring(7),
    getName: () => (blob && blob.getName ? blob.getName() : 'archivo.pdf'),
    getDownloadUrl: () => 'https://drive.google.com/uc?export=download&id=1_DRIVE_MOCK_FILE_ID',
    setSharing: (access, perm) => true
  }),
  getFoldersByName: (name) => ({
    hasNext: () => true,
    next: () => ({
      createFile: (blob) => ({
        getId: () => '1_DOSSIER_MOCK_DRIVE_ID_987654321',
        getName: () => (blob && blob.getName ? blob.getName() : 'Dossier_Bibliografico.pdf'),
        getDownloadUrl: () => 'https://drive.google.com/uc?export=download&id=1_DOSSIER_MOCK_DRIVE_ID_987654321',
        setSharing: (access, perm) => true
      })
    })
  }),
  createFolder: (name) => ({
    createFile: (blob) => ({
      getId: () => '1_DOSSIER_MOCK_DRIVE_ID_987654321',
      getName: () => (blob && blob.getName ? blob.getName() : 'Dossier_Bibliografico.pdf'),
      getDownloadUrl: () => 'https://drive.google.com/uc?export=download&id=1_DOSSIER_MOCK_DRIVE_ID_987654321',
      setSharing: (access, perm) => true
    })
  }),
  Access: { ANYONE_WITH_LINK: 'ANYONE_WITH_LINK' },
  Permission: { VIEW: 'VIEW' }
};

global.PropertiesService = {
  getScriptProperties: () => ({
    getProperty: (k) => {
      if (k === 'META_ACCESS_TOKEN') return 'EAAT88VhyjgIBSpNapO95mWFSWSn...';
      if (k === 'PHONE_NUMBER_ID') return '101010101010';
      return null;
    },
    setProperty: () => {}
  })
};

global.UrlFetchApp = {
  fetch: (url, opts) => {
    const payload = JSON.parse(opts.payload || '{}');
    if (payload.type === 'interactive') {
      if (payload.interactive.type === 'list') {
        sentWhatsAppLists.push(payload);
      } else if (payload.interactive.type === 'button') {
        sentWhatsAppButtons.push(payload);
      }
    } else if (payload.type === 'document') {
      sentWhatsAppDocuments.push(payload);
    } else if (payload.type === 'text') {
      sentWhatsAppMessages.push(payload);
    }
    return {
      getResponseCode: () => 200,
      getContentText: () => JSON.stringify({ messages: [{ id: 'wamid.HBg...' }] })
    };
  }
};

global.Logger = { log: (msg) => {} };

eval(gasCode);

global.checkRateLimit = () => true;
global.recordTelemetry = () => {};
global.detectIntrusionAttempt = () => ({ detected: false });
global.isOffTopic = () => false;

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
  }
}

// CASO 1: Ateneo sombrilla
runTest('Caso 1: Consulta genérica "Ateneo" -> Menú Interactivo Nativo (Meta list)', () => {
  sentWhatsAppLists.length = 0;
  handleIncomingMessage(TEST_PHONE, 'Dr. Residente', 'Ateneo');
  assert.strictEqual(sentWhatsAppLists.length, 1);
  const listMsg = sentWhatsAppLists[0].interactive;
  assert.strictEqual(listMsg.type, 'list');
  assert.strictEqual(listMsg.action.button, 'Ver Opciones');
  assert.strictEqual(listMsg.action.sections.length, 2);
});

// CASO 2: Área sombrilla
runTest('Caso 2: Consulta genérica "Cadera" -> Menú Interactivo con opciones clínicas', () => {
  sentWhatsAppLists.length = 0;
  handleIncomingMessage(TEST_PHONE, 'Dr. Residente', 'Cadera');
  assert.strictEqual(sentWhatsAppLists.length, 1);
  const listMsg = sentWhatsAppLists[0].interactive;
  assert.strictEqual(listMsg.action.button, 'Filtrar Literatura');
  assert.strictEqual(listMsg.action.sections.length, 2);
});

// CASO 3: Búsqueda 1 a 3 documentos
runTest('Caso 3: Búsqueda específica ("Dame 3 artículos sobre fractura de húmero proximal") -> 3 botones interactivos', () => {
  sentWhatsAppButtons.length = 0;
  handleIncomingMessage(TEST_PHONE, 'Dr. Residente', 'Dame 3 artículos sobre fractura de húmero proximal');
  assert.strictEqual(sentWhatsAppButtons.length, 1);
  const btnMsg = sentWhatsAppButtons[0].interactive;
  assert.strictEqual(btnMsg.action.buttons.length, 3);
  assert(btnMsg.body.text.includes('[1]'));
  assert(btnMsg.body.text.includes('[2]'));
  assert(btnMsg.body.text.includes('[3]'));
});

// CASO 4: Búsqueda > 3 documentos
runTest('Caso 4: Búsqueda amplia (>3 documentos, "Osteosintesis de cadera") -> Top 3 Preview + Compilación y entrega Dossier PDF', () => {
  sentWhatsAppButtons.length = 0;
  sentWhatsAppDocuments.length = 0;
  handleIncomingMessage(TEST_PHONE, 'Dr. Residente', 'Osteosintesis de cadera');
  assert.strictEqual(sentWhatsAppButtons.length, 1);
  assert.strictEqual(sentWhatsAppDocuments.length, 1);
  assert(sentWhatsAppButtons[0].interactive.body.text.includes('Anticipo de las 3 obras principales'));
  assert(sentWhatsAppDocuments[0].document.caption.includes('Dossier Bibliográfico'));
});

// CASO 5: Clic en botón interactivo DOC_
runTest('Caso 5: Clic en botón interactivo DOC_<driveId> -> Despacha ficha individual y enlace inmediato', () => {
  sentWhatsAppMessages.length = 0;
  const targetDriveId = mockInventoryRows[1][1];
  const targetTitle = mockInventoryRows[1][4];
  handleIncomingMessage(TEST_PHONE, 'Dr. Residente', 'DOC_' + targetDriveId);
  assert.strictEqual(sentWhatsAppMessages.length, 1);
  assert(sentWhatsAppMessages[0].text.body.includes(targetTitle));
  assert(sentWhatsAppMessages[0].text.body.includes('Descarga Inmediata'));
});

// CASO 6: Solicitud directa de Dossier Ateneos
runTest('Caso 6: Solicitud "Dossier Ateneos" -> Compila dinámicamente el PDF de presentaciones', () => {
  sentWhatsAppMessages.length = 0;
  sentWhatsAppDocuments.length = 0;
  handleIncomingMessage(TEST_PHONE, 'Dr. Residente', 'Dossier Ateneos');
  assert(sentWhatsAppMessages.length >= 2);
  assert(sentWhatsAppMessages[1].text.body.includes('DOSSIER BIBLIOGRÁFICO GENERADO EXITOSAMENTE'));
  assert.strictEqual(sentWhatsAppDocuments.length, 1);
  assert(sentWhatsAppDocuments[0].document.caption.includes('Gestor de Contenido'));
});

// CASO 7: Cero PII
runTest('Caso 7: Blindaje Cero-PII y Anonimato Cardinal Estricto', () => {
  const allOutputs = [
    ...sentWhatsAppMessages.map(m => m.text.body),
    ...sentWhatsAppButtons.map(b => b.interactive.body.text),
    ...sentWhatsAppLists.map(l => l.interactive.body.text),
    ...sentWhatsAppDocuments.map(d => d.document.caption)
  ].join('\n');
  assert(!allOutputs.includes('Christian Rodrigo Mena Soria'));
  assert(!allOutputs.includes('34612524915'));
  assert(allOutputs.includes('Gestor de Contenido'));
});

console.log('\n================================================================');
console.log(`📊 RESULTADOS FASE 2: ${passed} / ${total} PRUEBAS EXITOSAS (${Math.round(passed / total * 100)}%)`);
console.log('================================================================\n');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}

