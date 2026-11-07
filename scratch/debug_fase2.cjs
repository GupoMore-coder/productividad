const fs = require('fs');
const path = require('path');

let gasCode = fs.readFileSync(path.join(__dirname, '..', 'bibliotecario_engine', 'GoogleAppsScript_SheetsManager.js'), 'utf8');

// Trace checkpoints
gasCode = gasCode.replace('const adminPhone = getSecureProperty', 'console.log("CP 1"); const adminPhone = getSecureProperty');
gasCode = gasCode.replace('if (!isAdmin) {', 'console.log("CP 2"); if (!isAdmin) {');
gasCode = gasCode.replace('if (docs.length > 0) {', 'console.log("CP 3"); if (docs.length > 0) {');
gasCode = gasCode.replace('if (isAdmin) {', 'console.log("CP 4"); if (isAdmin) {');
gasCode = gasCode.replace('if (isVulgarMessage(text)', 'console.log("CP 5"); if (isVulgarMessage(text)');
gasCode = gasCode.replace('if (isManualQuery || isLinkQuery) {', 'console.log("CP 6, isManualQuery=", isManualQuery, "isLinkQuery=", isLinkQuery); if (isManualQuery || isLinkQuery) {');
gasCode = gasCode.replace('const sheetUsr = getSheetFlexible(ss, CONFIG.SHEET_USUARIOS);', 'console.log("CP 7"); const sheetUsr = getSheetFlexible(ss, CONFIG.SHEET_USUARIOS);');
gasCode = gasCode.replace('if (!userRow) {', 'console.log("CP 8, userRow=", userRow); if (!userRow) {');
gasCode = gasCode.replace('if (userRow[4] === \'APROBADO\' || userRow[4] === \'ACTIVO\') {', 'console.log("CP 9, status=", userRow ? userRow[4] : null); if (userRow[4] === \'APROBADO\' || userRow[4] === \'ACTIVO\') {');

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

const mockSpreadsheet = {
  getSheetByName: (name) => mockSheetUsr,
  getSheets: () => [mockSheetUsr]
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
    getProperty: () => null,
    setProperty: () => {}
  })
};

global.Logger = {
  log: (msg) => console.log('LOGGER:', msg)
};

global.UrlFetchApp = {
  fetch: (url, opts) => {
    console.log('TRACE: UrlFetchApp.fetch called with:', opts.payload);
    return {
      getResponseCode: () => 200,
      getContentText: () => JSON.stringify({ ok: true })
    };
  }
};

eval(gasCode);

global.getCachedInventory = function() {
  return [
    {
      id: 'DOC-01', driveId: 'DRIVE_1', year: '2023', author: 'Foruria, A.M.',
      title: 'Tratamiento de fracturas de humero proximal en adultos', category: 'Hombro y Codo',
      docType: 'Artículo Original', aoClass: 'AO 11'
    },
    {
      id: 'DOC-02', driveId: 'DRIVE_2', year: '2023', author: 'Brodke, D.J.',
      title: 'Manejo quirurgico de fracturas complejas de humero proximal', category: 'Hombro y Codo',
      docType: 'Artículo Original', aoClass: 'AO 11'
    },
    {
      id: 'DOC-03', driveId: 'DRIVE_3', year: '2022', author: 'Servicio Ortopedia',
      title: 'Fractura De Humero Proximal', category: 'Ateneos y Conferencias',
      docType: 'Ateneos y Conferencias', aoClass: 'AO 11'
    }
  ];
};
global.checkRateLimit = () => true;
global.recordTelemetry = () => {};
global.detectIntrusionAttempt = () => ({ detected: false });
global.isOffTopic = () => false;

console.log('Starting trace...');
handleIncomingMessage(TEST_PHONE, 'Dr. Residente', 'Dame 3 artículos sobre fractura de húmero proximal');
