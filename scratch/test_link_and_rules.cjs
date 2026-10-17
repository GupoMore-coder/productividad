const fs = require('fs');

global.Logger = { log: console.log };
global.Session = { getScriptTimeZone: () => 'America/Bogota' };
global.Utilities = { 
  formatDate: (d, tz, f) => '2026-10-15',
  computeHmacSha256Signature: () => [1,2,3],
  base64EncodeWebSafe: () => 'test_token'
};
global.PropertiesService = { 
  getScriptProperties: () => ({ 
    getProperty: (k) => {
      if (k === 'WEB_APP_URL') return 'https://script.google.com/macros/s/AKfycbyHxkfFJ1qAnmRcXDgJEnCPSxphpvLMa16fkFCfpVzfGmPBh_YL5M2QLe1uGRA3kp_XIg/exec';
      return 'test';
    }
  }) 
};
global.SpreadsheetApp = { getActiveSpreadsheet: () => null, flush: () => {} };

eval(fs.readFileSync('fase1_google_sheets_core.js', 'utf8'));
eval(fs.readFileSync('fase2_ai_agent_brain.js', 'utf8'));

console.log('=== TEST DETECCIÓN DE ENLACES AL DASHBOARD ===');
const inputs = [
  'enviame el link',
  'dashboard',
  'link',
  'el link',
  'dame mi link',
  'ver mi dashboard',
  'mandame el link',
  'abrir canvas',
  'el tablero',
  'hola que tal'
];

inputs.forEach(i => {
  console.log(`"${i}" =>`, detectarSolicitudMagicLink_(i));
});

console.log('\n=== TEST DESPACHO MAGIC LINK (BATMAN) ===');
// Simular que el usuario tiene activo a Batman
const perm = { rol: 'SUPER_ADMIN', nombre: 'Fernando', perfilVoz: 'BATMAN', aliasAsistente: 'Batman' };
// Mock de obtenerDefinicionPersonajeActual_
const res = ejecutarDespachoMagicLink_('573104547965', perm, false);
console.log(res.texto);
