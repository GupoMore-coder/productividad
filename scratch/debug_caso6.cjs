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

const csvContent = fs.readFileSync(path.join(__dirname, '..', 'bibliotecario_engine', 'knowledge', 'inventario_maestro_expandido.csv'), 'utf8');
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

global.SpreadsheetApp = { getActiveSpreadsheet: () => mockSpreadsheet };
global.CacheService = { getScriptCache: () => ({ get: () => null, put: () => {} }) };
global.Utilities = {
  base64Encode: () => '',
  newBlob: (c, m, n) => ({ getName: () => n, getAs: () => ({ getName: () => n, setName: function() { return this; } }) }),
  computeHmacSha256Signature: () => Buffer.from('sig'),
  formatDate: () => '04/11/2026'
};
global.DriveApp = {
  createFile: () => ({ getId: () => 'DRV_1', getDownloadUrl: () => 'https://drv/1', setSharing: () => true }),
  getFoldersByName: () => ({ hasNext: () => true, next: () => ({ createFile: () => ({ getId: () => 'DRV_1', getDownloadUrl: () => 'https://drv/1', setSharing: () => true }) }) })
};
global.PropertiesService = { getScriptProperties: () => ({ getProperty: () => 'token' }) };
global.UrlFetchApp = {
  fetch: (u, o) => {
    console.log('FETCH in Caso 6:', o.payload);
    return { getResponseCode: () => 200, getContentText: () => '{}' };
  }
};
global.Logger = { log: (m) => console.log('LOG:', m) };

eval(gasCode);

global.checkRateLimit = () => true;
global.recordTelemetry = () => {};
global.detectIntrusionAttempt = () => ({ detected: false });
global.isOffTopic = () => false;

console.log('Testing handleIncomingMessage for "Dossier Ateneos"...');
handleIncomingMessage(TEST_PHONE, 'Dr. Residente', 'Dossier Ateneos');

