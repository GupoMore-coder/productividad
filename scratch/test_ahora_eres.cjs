const fs = require('fs');
const vm = require('vm');

global.Logger = { log: console.log };
global.PropertiesService = {
  _store: {},
  getUserProperties: function() {
    return {
      getProperty: (k) => global.PropertiesService._store[k] || null,
      setProperty: (k, v) => { global.PropertiesService._store[k] = v; }
    };
  },
  getScriptProperties: function() { return this.getUserProperties(); }
};
global.CacheService = {
  getScriptCache: () => ({ get: () => null, put: () => {} })
};
global.Session = { getScriptTimeZone: () => "America/Bogota" };
global.Utilities = {
  sleep: (ms) => {},
  formatDate: (d, tz, f) => "2026-10-15"
};
global.HOJAS = { CONTROL_ACCESO: "Control_Acceso" };
global.SpreadsheetApp = {
  getActiveSpreadsheet: () => ({
    getSheetByName: () => ({
      getLastRow: () => 1,
      getRange: () => ({ getValues: () => [] })
    })
  })
};

// Mock verificarPermisosUsuario_
global.verificarPermisosUsuario_ = function(tel) {
  return {
    autorizado: true,
    nombre: "Fernando",
    rol: "SUPER_ADMIN",
    telefono: tel,
    aliasAsistente: "El Gato con Botas",
    perfilVoz: "GATO_CON_BOTAS"
  };
};

global.validarPermisoUsuario = global.verificarPermisosUsuario_;

// Load fase2_ai_agent_brain.js
vm.runInThisContext(fs.readFileSync('fase2_ai_agent_brain.js', 'utf8'));

console.log("Testing procesarMensajeTexto('Ahora eres el gato con botas')...");
const res = global.procesarMensajeTexto("573001234567", "Ahora eres el gato con botas");
console.log("Resultado de procesarMensajeTexto:", JSON.stringify(res, null, 2));
