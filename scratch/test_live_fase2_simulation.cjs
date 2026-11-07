/**
 * SIMULADOR EN VIVO - CERTIFICACIÓN DE LA FASE 2
 * Dual Delivery Model + Interactive WhatsApp Native List + Dynamic Dossier Bibliográfico PDF
 * Dirección y Custodia: Gestor de Contenido
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('🧪 EJECUTANDO CERTIFICACIÓN EN VIVO: FASE 2 (DUAL DELIVERY & LISTAS)');
console.log('================================================================\n');

// 1. Cargar archivo maestro de Apps Script
const gasCode = fs.readFileSync(path.join(__dirname, '..', 'bibliotecario_engine', 'GoogleAppsScript_SheetsManager.js'), 'utf8');

// 2. Mock Runtime de Google Apps Script
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

// Cargar catálogo expandido real de 4077 filas
const csvPath = path.join(__dirname, '..', 'bibliotecario_engine', 'knowledge', 'inventario_maestro_expandido.csv');
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
      for (const k in obj) {
        mockCache[k] = obj[k];
      }
    },
    removeAll: (keys) => {
      for (const k of keys) {
        delete mockCache[k];
      }
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

global.Logger = {
  log: (msg) => {}
};

// Ejecutar código en contexto global
eval(gasCode);

// Sobrescribir checkRateLimit y telemetría
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

// -------------------------------------------------------------
// PRUEBA 1: Término sombrilla genérico "Ateneo"
// -------------------------------------------------------------
runTest('Caso 1: Consulta genérica "Ateneo" -> Despliega Lista Interactiva Nativa (Meta list)', () => {
  sentWhatsAppLists.length = 0;
  sentWhatsAppMessages.length = 0;

  handleIncomingMessage(TEST_PHONE, 'Dr. Residente', 'Ateneo');

  assert.strictEqual(sentWhatsAppLists.length, 1, 'Debe despachar 1 lista interactiva');
  const listMsg = sentWhatsAppLists[0].interactive;
  assert.strictEqual(listMsg.type, 'list');
  assert.strictEqual(listMsg.action.button, 'Ver Opciones');
  assert.strictEqual(listMsg.action.sections.length, 2, 'Debe incluir 2 secciones');
  assert.strictEqual(listMsg.action.sections[0].title, 'Subespecialidades');
  assert.strictEqual(listMsg.action.sections[1].title, 'Dossiers en PDF');
  
  // Validar límites de Meta en todas las filas
  let totalRows = 0;
  listMsg.action.sections.forEach(sec => {
    assert(sec.title.length <= 24, 'Título de sección debe ser <= 24 caracteres');
    sec.rows.forEach(r => {
      totalRows++;
      assert(r.title.length <= 24, `Título de fila "${r.title}" debe ser <= 24 caracteres`);
      assert(r.description.length <= 72, `Descripción de fila "${r.description}" debe ser <= 72 caracteres`);
    });
  });
  assert(totalRows <= 10, 'Total de filas debe ser <= 10');
});

// -------------------------------------------------------------
// PRUEBA 2: Término sombrilla de Área "Cadera"
// -------------------------------------------------------------
runTest('Caso 2: Consulta genérica "Cadera" -> Despliega Lista Interactiva con enfoques clínicos', () => {
  sentWhatsAppLists.length = 0;

  handleIncomingMessage(TEST_PHONE, 'Dr. Residente', 'Cadera');

  assert.strictEqual(sentWhatsAppLists.length, 1, 'Debe despachar 1 lista interactiva');
  const listMsg = sentWhatsAppLists[0].interactive;
  assert.strictEqual(listMsg.action.button, 'Filtrar Literatura');
  assert.strictEqual(listMsg.action.sections.length, 2);
  assert.strictEqual(listMsg.action.sections[0].title, 'Enfoques Clínicos');
  assert.strictEqual(listMsg.action.sections[1].title, 'Dossiers en PDF');
});

// -------------------------------------------------------------
// PRUEBA 3: Entrega específica ("Dame 3 artículos sobre fractura de húmero proximal")
// -------------------------------------------------------------
runTest('Caso 3: Búsqueda específica de 3 docs -> Despacha 3 fichas + 3 botones interactivos de WhatsApp', () => {
  sentWhatsAppButtons.length = 0;
  sentWhatsAppDocuments.length = 0;

  handleIncomingMessage(TEST_PHONE, 'Dr. Residente', 'Dame 3 artículos sobre fractura de húmero proximal');

  assert.strictEqual(sentWhatsAppButtons.length, 1, 'Debe enviar 1 mensaje con botones interactivos');
  const btnMsg = sentWhatsAppButtons[0].interactive;
  assert.strictEqual(btnMsg.type, 'button');
  assert.strictEqual(btnMsg.action.buttons.length, 3, 'Debe incluir exactamente 3 botones');
  assert.strictEqual(btnMsg.action.buttons[0].reply.title, '📥 Descargar 1');
  assert.strictEqual(btnMsg.action.buttons[1].reply.title, '📥 Descargar 2');
  assert.strictEqual(btnMsg.action.buttons[2].reply.title, '📥 Descargar 3');

  // En el cuerpo del mensaje deben estar los 3 enlaces y detalles
  const bodyText = btnMsg.body.text;
  assert(bodyText.includes('[1]'), 'Debe contener el doc 1');
  assert(bodyText.includes('[2]'), 'Debe contener el doc 2');
  assert(bodyText.includes('[3]'), 'Debe contener el doc 3');
  assert(bodyText.includes('biblioteca-medica.ortopedia.workers.dev/r/d_'), 'Debe contener enlaces seguros');
});

// -------------------------------------------------------------
// PRUEBA 4: Entrega de > 3 documentos ("Fractura de cadera" con 15+ resultados)
// -------------------------------------------------------------
runTest('Caso 4: Búsqueda amplia (>3 docs) -> Top 3 Preview + Compilación y Entrega de Dossier Bibliográfico PDF', () => {
  sentWhatsAppButtons.length = 0;
  sentWhatsAppDocuments.length = 0;

  handleIncomingMessage(TEST_PHONE, 'Dr. Residente', 'Fractura de cadera');

  // 1. Mensaje con botones interactivos para el Top 3 y aviso de Dossier
  assert.strictEqual(sentWhatsAppButtons.length, 1, 'Debe despachar mensaje con botones de acción rápida');
  const btnMsg = sentWhatsAppButtons[0].interactive;
  assert(btnMsg.action.buttons.length <= 3, 'Meta permite máx 3 botones');
  assert(btnMsg.body.text.includes('DOSSIER BIBLIOGRÁFICO EN PDF ADJUNTO'), 'Debe anunciar el Dossier');
  assert(btnMsg.body.text.includes('Enlace de Consulta y Descarga del Dossier:'), 'Debe incluir enlace directo al visor del Dossier');

  // 2. Archivo PDF adjunto compilado dinámicamente y enviado por WhatsApp
  assert.strictEqual(sentWhatsAppDocuments.length, 1, 'Debe despachar el documento PDF adjunto por WhatsApp');
  const docPayload = sentWhatsAppDocuments[0].document;
  assert(docPayload.filename.includes('Dossier'), 'El nombre del archivo debe ser Dossier...');
  assert(docPayload.caption.includes('Dossier Bibliográfico'), 'La leyenda debe confirmar el dossier');
  assert(docPayload.caption.includes('Gestor de Contenido'), 'Debe certificar la custodia institucional');
});

// -------------------------------------------------------------
// PRUEBA 5: Acción interactiva de botón (Click en "DOC_<driveId>")
// -------------------------------------------------------------
runTest('Caso 5: Clic en botón interactivo DOC_<driveId> -> Despacha ficha individual y descarga directa', () => {
  sentWhatsAppMessages.length = 0;
  sentWhatsAppDocuments.length = 0;

  const targetDriveId = mockInventoryRows[1][1];
  const targetTitle = mockInventoryRows[1][4];
  const buttonId = 'DOC_' + targetDriveId;

  handleIncomingMessage(TEST_PHONE, 'Dr. Residente', buttonId);

  assert.strictEqual(sentWhatsAppMessages.length, 1, 'Debe responder con la ficha individual');
  const reply = sentWhatsAppMessages[0].text.body;
  assert(reply.includes(targetTitle), 'Debe incluir el título del documento');
  assert(reply.includes('Descarga Inmediata'), 'Debe incluir enlace de descarga');
  assert(reply.includes('biblioteca-medica.ortopedia.workers.dev/r/d_'), 'Debe ser enlace firmado');
});

// -------------------------------------------------------------
// PRUEBA 6: Solicitud de Dossier Completo de Ateneos ("DOSSIER_ATENEOS_TODOS" o "Dossier Ateneos")
// -------------------------------------------------------------
runTest('Caso 6: Solicitud "Dossier Ateneos" -> Compila dinámicamente el PDF con todas las presentaciones de ateneos', () => {
  sentWhatsAppMessages.length = 0;
  sentWhatsAppDocuments.length = 0;

  handleIncomingMessage(TEST_PHONE, 'Dr. Residente', 'Dossier Ateneos');

  // Verificamos aviso de compilación y confirmación
  assert(sentWhatsAppMessages.length >= 2, 'Debe enviar aviso de progreso y mensaje de entrega');
  const finalMsg = sentWhatsAppMessages[1].text.body;
  console.log('TRACE FINAL MSG CASO 6:', finalMsg);
  assert(finalMsg.includes('DOSSIER BIBLIOGRÁFICO GENERADO EXITOSAMENTE'), 'Debe confirmar generación');
  assert(finalMsg.includes('Colección:'), 'Debe titular la colección');

  // Verificamos despacho del documento PDF adjunto
  assert.strictEqual(sentWhatsAppDocuments.length, 1, 'Debe adjuntar el archivo PDF');
  const docPayload = sentWhatsAppDocuments[0].document;
  assert(docPayload.caption.includes('Dossier Oficial'), 'Debe certificar el dossier en la leyenda');
  assert(docPayload.caption.includes('Gestor de Contenido'), 'Debe certificar la custodia de la Dirección');
});

// -------------------------------------------------------------
// PRUEBA 7: Blindaje Cero-PII y Anonimato Cardinal
// -------------------------------------------------------------
runTest('Caso 7: Blindaje Cero-PII -> Verificación de cero nombres reales o datos personales en salidas', () => {
  const allOutputs = [
    ...sentWhatsAppMessages.map(m => m.text.body),
    ...sentWhatsAppButtons.map(b => b.interactive.body.text),
    ...sentWhatsAppLists.map(l => l.interactive.body.text),
    ...sentWhatsAppDocuments.map(d => d.document.caption)
  ].join('\n');

  // Prohibido nombres reales de residentes o médicos o teléfonos personales en respuestas
  assert(!allOutputs.includes('Christian Rodrigo Mena Soria'), 'Cero filtración de nombre personal');
  assert(!allOutputs.includes('34612524915'), 'Cero filtración de teléfono personal');
  assert(allOutputs.includes('Gestor de Contenido'), 'Debe identificarse exclusivamente como Gestor de Contenido');
});

console.log('\n================================================================');
console.log(`📊 RESULTADOS FASE 2: ${passed} / ${total} PRUEBAS EXITOSAS (${Math.round(passed / total * 100)}%)`);
console.log('================================================================\n');

if (passed === total) {
  console.log('🌟 FASE 2 CERTIFICADA Y ENSAMBLADA AL 100%.');
  process.exit(0);
} else {
  process.exit(1);
}
