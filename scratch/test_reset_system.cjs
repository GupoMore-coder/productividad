// Automated Verification Test for Financial Reset to Zero
const assert = require('assert');

// 1. Mock Google Apps Script environment
class MockRange {
  constructor(sheet, startRow, startCol, numRows, numCols) {
    this.sheet = sheet;
    this.startRow = startRow;
    this.startCol = startCol;
    this.numRows = numRows;
    this.numCols = numCols;
  }
  getValues() {
    const res = [];
    for (let r = 0; r < this.numRows; r++) {
      const rowIdx = this.startRow - 1 + r;
      const row = this.sheet.rows[rowIdx] || [];
      const rowSlice = [];
      for (let c = 0; c < this.numCols; c++) {
        const colIdx = this.startCol - 1 + c;
        rowSlice.push(row[colIdx] !== undefined ? row[colIdx] : "");
      }
      res.push(rowSlice);
    }
    return res;
  }
  clearContent() {
    for (let r = 0; r < this.numRows; r++) {
      const rowIdx = this.startRow - 1 + r;
      if (this.sheet.rows[rowIdx]) {
        for (let c = 0; c < this.numCols; c++) {
          const colIdx = this.startCol - 1 + c;
          this.sheet.rows[rowIdx][colIdx] = "";
        }
      }
    }
  }
}

class MockSheet {
  constructor(name, rows) {
    this.name = name;
    this.rows = rows || [];
  }
  getName() { return this.name; }
  getLastRow() {
    for (let i = this.rows.length - 1; i >= 0; i--) {
      const hasContent = this.rows[i].some(c => c !== "" && c !== null && c !== undefined);
      if (hasContent) return i + 1;
    }
    return this.rows.length > 0 ? 1 : 0;
  }
  getMaxRows() { return Math.max(this.rows.length, 100); }
  getMaxColumns() { return this.rows[0] ? this.rows[0].length : 12; }
  getLastColumn() { return this.getMaxColumns(); }
  getRange(startRow, startCol, numRows, numCols) {
    return new MockRange(this, startRow, startCol, numRows, numCols);
  }
  deleteRows(startRow, numRows) {
    this.rows.splice(startRow - 1, numRows);
  }
}

class MockSpreadsheet {
  constructor(sheetsMap) {
    this.sheets = sheetsMap;
  }
  getSheetByName(name) { return this.sheets[name] || null; }
  getSheets() { return Object.values(this.sheets); }
}

const mockScriptCache = {
  removed: [],
  remove(k) { this.removed.push(k); }
};
const mockUserCache = {
  removed: [],
  remove(k) { this.removed.push(k); }
};

global.CacheService = {
  getScriptCache: () => mockScriptCache,
  getUserCache: () => mockUserCache
};
global.LockService = {
  getScriptLock: () => ({
    tryLock: () => true,
    releaseLock: () => {}
  })
};
global.SpreadsheetApp = {
  getUi: () => null,
  flush: () => {}
};
global.Utilities = {
  formatDate: () => "2026-10-12 13:00:00"
};
global.Session = {
  getScriptTimeZone: () => "America/Bogota"
};
global.Logger = {
  log: (msg) => console.log("[AppsScript Log]", msg)
};

global.HOJAS = {
  CONTROL_ACCESO: "Control_Acceso",
  PERSONAL_TRANS: "Personal_Transacciones",
  PERSONAL_COMP: "Personal_Compromisos",
  MOREPAPER_TRANS: "MorePaper_Transacciones",
  MOREPAPER_COMP: "MorePaper_Compromisos",
  MOREDESIGN_TRANS: "MoreDesign_Transacciones",
  MOREDESIGN_COMP: "MoreDesign_Compromisos",
  GASTOS_GLOBALES: "Gastos_Globales",
  OPERACION_GLOBAL: "Operacion_Global",
  COMPROMISOS_GLOBALES: "Compromisos_Globales",
  DASHBOARD: "Dashboard_Consolidado",
  METRICAS_WA: "Metricas_WhatsApp",
  SESIONES_WA: "WhatsApp_Sesiones_24h",
  CONFIG_CATEGORIAS: "Config_Categorias",
  CONFIG_CUENTAS: "Config_Cuentas_Bancarias",
  PERSONAJES: "Personajes"
};

// 2. Load and evaluate the reset logic
const fs = require('fs');
const coreCode = fs.readFileSync('fase1_google_sheets_core.js', 'utf8');

const fnCode = coreCode.substring(
  coreCode.indexOf("function reiniciarEcosistemaFinancieroACero"),
  coreCode.indexOf("function purgarTodaInformacionFinancieraDePrueba")
);
eval(fnCode);

console.log("🔍 Running test suite for reiniciarEcosistemaFinancieroACero...");

// Setup mock spreadsheet
const sheets = {
  "Control_Acceso": new MockSheet("Control_Acceso", [
    ["TELEFONO", "NOMBRE", "ROL", "ESTADO", "ENTIDAD", "ALIAS", "HOJAS_ASIGNADAS"],
    ["+573008880001", "Fernando", "SUPER_ADMIN", "ACTIVO", "Consolidado", "Bruce Wayne", "Personal_Transacciones,Personal_Compromisos"],
    ["+573007654321", "Florangellys", "USUARIO", "ACTIVO", "Florangellys", "Aura", "Florangellys_Transacciones,Florangellys_Compromisos"]
  ]),
  "Config_Categorias": new MockSheet("Config_Categorias", [
    ["ENTIDAD", "TIPO", "CATEGORIA", "SUBCATEGORIA"],
    ["Personal", "Ingreso", "Salario", "Nómina"]
  ]),
  "Config_Cuentas_Bancarias": new MockSheet("Config_Cuentas_Bancarias", [
    ["ALIAS", "BANCO", "TIPO", "MASCARA"],
    ["Ahorros ***2103", "Bancolombia", "Ahorros", "***2103"]
  ]),
  "Personajes": new MockSheet("Personajes", [
    ["ID", "NOMBRE", "ESTILO"],
    ["P01", "El Gato con Botas", "Aventurero"]
  ]),
  "Dashboard_Consolidado": new MockSheet("Dashboard_Consolidado", [
    ["RESUMEN FINANCIERO"],
    ["ENTIDAD", "INGRESOS", "GASTOS", "FLUJO", "PASIVOS"],
    ["Personal", 1000, 500, 500, 0]
  ]),
  "Metricas_WhatsApp": new MockSheet("Metricas_WhatsApp", [
    ["METRICA", "VALOR"],
    ["Conversaciones", 12]
  ]),
  "Personal_Transacciones": new MockSheet("Personal_Transacciones", [
    ["ID", "FECHA", "TIPO", "CATEGORIA", "SUBCAT", "CONCEPTO", "TERCERO", "VALOR", "METODO", "ESTADO", "NOTAS", "LOG"],
    ["TX1", "2026-10-10", "Ingreso", "Ventas", "", "Venta papeleria", "Cliente", 50000, "Efectivo", "Confirmado", "", ""],
    ["TX2", "2026-10-11", "Gasto", "Insumos", "", "Compra papel", "Proveedor", 25000, "Efectivo", "Confirmado", "", ""]
  ]),
  "Personal_Compromisos": new MockSheet("Personal_Compromisos", [
    ["ID", "FECHA", "TERCERO", "CONCEPTO", "VALOR", "ABONOS", "SALDO", "VENCIMIENTO", "METODO", "ESTADO", "NOTAS", "LOG"],
    ["CMP1", "2026-10-10", "Proveedor X", "Deuda papel", 100000, 0, 100000, "2026-10-30", "Efectivo", "Pendiente", "", ""]
  ]),
  "MorePaper_Transacciones": new MockSheet("MorePaper_Transacciones", [
    ["ID", "FECHA", "TIPO", "CATEGORIA", "SUBCAT", "CONCEPTO", "TERCERO", "VALOR", "METODO", "ESTADO", "NOTAS", "LOG"],
    ["TX3", "2026-10-10", "Ingreso", "Ventas", "", "Venta cuadernos", "Cliente", 80000, "Efectivo", "Confirmado", "", ""]
  ]),
  "Florangellys_Transacciones": new MockSheet("Florangellys_Transacciones", [
    ["ID", "FECHA", "TIPO", "CATEGORIA", "SUBCAT", "CONCEPTO", "TERCERO", "VALOR", "METODO", "ESTADO", "NOTAS", "LOG"],
    ["TX4", "2026-10-10", "Gasto", "Transporte", "", "Pasaje bus", "Transmilenio", 6000, "Efectivo", "Confirmado", "", ""]
  ]),
  "Operacion_Global": new MockSheet("Operacion_Global", [
    ["ID", "FECHA", "TIPO", "CATEGORIA", "SUBCAT", "CONCEPTO", "TERCERO", "VALOR", "METODO", "ESTADO", "NOTAS", "LOG"],
    ["TX5", "2026-10-10", "Gasto", "Nómina", "", "Pago quincena", "Empleado", 500000, "Transferencia", "Confirmado", "", ""]
  ])
};

const ss = new MockSpreadsheet(sheets);

// Run the reset function
const resultado = reiniciarEcosistemaFinancieroACero(ss, true);

// Assertions:
// 1. Operational sheets must only have row 1 (headers) left!
assert.strictEqual(sheets["Personal_Transacciones"].getLastRow(), 1, "Personal_Transacciones should have exactly 1 row (header)");
assert.strictEqual(sheets["Personal_Compromisos"].getLastRow(), 1, "Personal_Compromisos should have exactly 1 row (header)");
assert.strictEqual(sheets["MorePaper_Transacciones"].getLastRow(), 1, "MorePaper_Transacciones should have exactly 1 row (header)");
assert.strictEqual(sheets["Florangellys_Transacciones"].getLastRow(), 1, "Florangellys_Transacciones should have exactly 1 row (header)");
assert.strictEqual(sheets["Operacion_Global"].getLastRow(), 1, "Operacion_Global should have exactly 1 row (header)");

// 2. Protected sheets must NOT have had their rows deleted!
assert.strictEqual(sheets["Control_Acceso"].getLastRow(), 3, "Control_Acceso must preserve all 3 rows (headers + 2 users)");
assert.strictEqual(sheets["Config_Categorias"].getLastRow(), 2, "Config_Categorias must preserve all 2 rows");
assert.strictEqual(sheets["Config_Cuentas_Bancarias"].getLastRow(), 2, "Config_Cuentas_Bancarias must preserve all 2 rows");
assert.strictEqual(sheets["Personajes"].getLastRow(), 2, "Personajes must preserve all 2 rows");
assert.strictEqual(sheets["Metricas_WhatsApp"].getLastRow(), 2, "Metricas_WhatsApp must preserve all 2 rows");

// 3. Cache keys removed
assert(mockScriptCache.removed.includes("DASHBOARD_DATA"), "DASHBOARD_DATA should be cleared from cache");
assert(mockUserCache.removed.some(k => k.includes("573008880001")), "User flow cache should be cleared");

console.log("✅ Unit Test 1 PASSED: Spreadsheet row purging and configuration preservation certified!");

// 4. Test Intent Detection in fase2
const brainCode = fs.readFileSync('fase2_ai_agent_brain.js', 'utf8');
eval(brainCode.substring(brainCode.indexOf("function detectarIntencionReinicioFinanciero_"), brainCode.length));

const testPrompts = [
  "Quiero que se ejecute una funcion donde se borre toda informacion financiera, y todos los valores queden en 0 para iniciar desde un nuevo punto de partida.",
  "reiniciar finanzas a cero",
  "purgar toda informacion financiera",
  "borrar todos los datos financieros",
  "resetear el sistema a cero",
  "confirmar reinicio cero",
  "iniciar desde un nuevo punto de partida limpio"
];

testPrompts.forEach(p => {
  const detected = detectarIntencionReinicioFinanciero_(p);
  assert.strictEqual(detected, true, `Prompt should be detected: "${p}"`);
});

// Non-matching prompts
const nonMatching = [
  "Registrar gasto de 50000 en insumos de more paper",
  "Cual es mi saldo disponible en Bancolombia?",
  "purgar compromisos erroneos de More Paper",
  "Crear un nuevo usuario llamado Carlos"
];

nonMatching.forEach(p => {
  const detected = detectarIntencionReinicioFinanciero_(p);
  assert.strictEqual(detected, false, `Prompt should NOT be detected: "${p}"`);
});

console.log("✅ Unit Test 2 PASSED: Intent detection pattern matching certified!");
console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
