const fs = require('fs');
const path = require('path');

const gasCode = fs.readFileSync(path.join(__dirname, '..', 'bibliotecario_engine', 'GoogleAppsScript_SheetsManager.js'), 'utf8');

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

// Cargar catálogo expandido como filas de hoja de cálculo
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
    get: () => null,
    put: () => {},
    remove: () => {},
    getAll: () => ({}),
    putAll: () => {},
    removeAll: () => {}
  })
};

global.Utilities = {
  base64Encode: (bytes) => Buffer.from(bytes).toString('base64'),
  base64Decode: (str) => Buffer.from(str, 'base64'),
  newBlob: (content, mimeType, name) => ({
    getBytes: () => Buffer.from(content || ''),
    getDataAsString: () => String(content || ''),
    getName: () => name || 'doc.pdf',
    getContentType: () => mimeType,
    getAs: (targetMime) => ({
      getBytes: () => Buffer.from(content || ''),
      getName: () => (name ? name.replace(/\.\w+$/, '.pdf') : 'Dossier_Bibliografico.pdf'),
      setName: function(n) { return this; }
    })
  }),
  computeHmacSha256Signature: (data, salt) => {
    const crypto = require('crypto');
    return crypto.createHmac('sha256', salt).update(data).digest();
  },
  formatDate: () => '04/11/2026 18:30'
};

global.DriveApp = {
  createFile: () => ({
    getId: () => 'DRIVE_ID_123',
    getName: () => 'doc.pdf',
    getDownloadUrl: () => 'https://drive.google.com/uc?export=download&id=DRIVE_ID_123',
    setSharing: () => true
  }),
  getFoldersByName: () => ({
    hasNext: () => true,
    next: () => ({
      createFile: () => ({
        getId: () => 'DRIVE_ID_123',
        getName: () => 'doc.pdf',
        getDownloadUrl: () => 'https://drive.google.com/uc?export=download&id=DRIVE_ID_123',
        setSharing: () => true
      })
    })
  })
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
    console.log('FETCH CALLED:', opts.payload);
    return {
      getResponseCode: () => 200,
      getContentText: () => JSON.stringify({ ok: true })
    };
  }
};

global.Logger = {
  log: (msg) => console.log('LOGGER:', msg)
};

eval(gasCode);

global.checkRateLimit = () => true;
global.recordTelemetry = () => {};
global.detectIntrusionAttempt = () => ({ detected: false });
global.isOffTopic = () => false;

console.log('Testing Caso 3 with mockSheetInv...');
handleIncomingMessage(TEST_PHONE, 'Dr. Residente', 'Dame 3 artículos sobre fractura de húmero proximal');
