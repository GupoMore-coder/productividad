// Automated Verification Test for Surgical Adjustment, Correction, and Deletion of Financial Movements
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
  setValue(val) {
    const rowIdx = this.startRow - 1;
    const colIdx = this.startCol - 1;
    if (this.sheet.rows[rowIdx]) {
      this.sheet.rows[rowIdx][colIdx] = val;
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
    return new MockRange(this, startRow, startCol, numRows || 1, numCols || 1);
  }
  deleteRow(rowIdx) {
    this.rows.splice(rowIdx - 1, 1);
  }
}

class MockSpreadsheet {
  constructor(sheetsMap) {
    this.sheets = sheetsMap;
  }
  getSheetByName(name) { return this.sheets[name] || null; }
  getSheets() { return Object.values(this.sheets); }
}

let userCacheStorage = {};
const mockUserCache = {
  get(k) { return userCacheStorage[k] || null; },
  put(k, v, ttl) { userCacheStorage[k] = v; },
  remove(k) { delete userCacheStorage[k]; }
};

global.CacheService = {
  getUserCache: () => mockUserCache,
  getScriptCache: () => mockUserCache
};
global.LockService = {
  getScriptLock: () => ({
    tryLock: () => true,
    releaseLock: () => {}
  })
};
global.SpreadsheetApp = {
  getActiveSpreadsheet: () => global.__activeSs,
  flush: () => {}
};
global.Utilities = {
  formatDate: (d, tz, fmt) => {
    if (d instanceof Date) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    return "2026-10-14";
  }
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
  DASHBOARD: "Dashboard_Consolidado"
};

global.sanitizarNombreHumano_ = (n) => n || "Fernando";
global.sanitizeSheetValue_ = (v) => v;
global.ejecutarConBloqueoTransaccional_ = (cb) => cb();

// 2. Define the improved functions
function detectarSolicitudAjusteOCorreccionMovimientos_(texto) {
  if (!texto) return false;
  const t = String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // Descartar si es reinicio TOTAL del sistema a cero (ej: "reiniciar todo a cero", "borrar todas las finanzas")
  if ((t.includes("toda la informacion") || t.includes("todas las finanzas") || t.includes("todo el sistema") || t.includes("todos los datos")) && 
      (t.includes("cero") || t.includes("punto de partida") || t.includes("limpio") || t.includes("reset"))) {
    return false;
  }

  // 1. Patrones de Eliminación o Borrado Quirúrgico (verbos conjugados e infinitivos)
  const esBorrado = /(?:borra|borrar|elimina|eliminar|quita|quitar|anula|anular|purga|purgar|cancela|cancelar)\s+(?:toda\s+)?(?:la\s+informacion\s+(?:financiera\s+)?)?(?:relacionad[ao]\s+(?:al?|con)|del?\s+registro\s+de|el\s+registro\s+de|los\s+registros\s+de|el\s+movimiento|la\s+transaccion|el\s+gasto|el\s+ingreso|el\s+pago|la\s+factura|la\s+deuda|el\s+compromiso)/i.test(t) ||
    /(?:borra|borrar|elimina|eliminar|quita|quitar)\s+(?:el\s+registro|los\s+registros|la\s+informacion)\s+(?:financiera\s+)?(?:de|del?)\s+([a-zA-Z0-9\s]+)/i.test(t) ||
    /(?:borra|borrar|elimina|eliminar|quita|quitar|anula|anular)\s+(?:gasto|pago|ingreso|movimiento|transaccion)\s+(?:de|del|por|con)\s+([a-zA-Z0-9\s]+)/i.test(t) ||
    /(?:identifica|busca|encuentra).*(?:y\s+)?(?:borra|borrar|elimina|eliminar|quita|quitar|anula|anular)/i.test(t);

  // 2. Patrones de Corrección / Modificación / Ajuste
  const esAjuste = /(?:corrige|corregir|modifica|modificar|cambia|cambiar|ajusta|ajustar|edita|editar)\s+(?:el\s+movimiento|la\s+transaccion|el\s+gasto|el\s+ingreso|el\s+pago|el\s+registro|el\s+valor|la\s+fecha|la\s+categoria|el\s+monto)/i.test(t) ||
    /(?:corrige|corregir|modifica|modificar|cambia|cambiar|ajusta|ajustar|edita|editar)\s+(?:el\s+registro\s+de|la\s+informacion\s+de)\s+([a-zA-Z0-9\s]+)/i.test(t);

  // 3. Patrones de Búsqueda Forense
  const esBusqueda = /(?:busca|buscar|consulta|consultar|ver|muestra|mostrar|localiza|localizar|audita|auditar|identifica|identificar)\s+(?:todos?\s+)?(?:los\s+|las\s+)?(?:movimientos?|transaccion(?:es)?|gastos?|pagos?|ingresos?|registros?)\s+(?:de|por|para|del|con|asociad[ao]s?\s+a|relacionad[ao]s?\s+a|hoy|ayer)\b/i.test(t);

  return esBorrado || esAjuste || esBusqueda;
}

function extraerParametrosAjusteMovimientos_(textoUsuario) {
  const t = String(textoUsuario || "").trim();
  const tNorm = t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  let accion = "buscar";
  if (/(?:borra|borrar|elimina|eliminar|quita|quitar|anula|anular|purga|purgar|cancela|cancelar)/i.test(tNorm)) {
    accion = "eliminar";
  } else if (/(?:corrige|corregir|modifica|modificar|cambia|cambiar|ajusta|ajustar|edita|editar)/i.test(tNorm)) {
    accion = "corregir";
  }

  // Extraer montos monetarios mencionados
  let monto = null;
  const matchMonto = t.match(/\$?\s*(\d{1,3}(?:\.\d{3})+|\d+)(?:\s*(?:mil|pesos|cop))?/i);
  if (matchMonto) {
    const rawNum = matchMonto[1].replace(/\./g, "");
    let valNum = Number(rawNum) || 0;
    if (t.toLowerCase().includes("mil") && valNum < 1000) valNum *= 1000;
    if (valNum > 0) monto = valNum;
  }

  // Extraer fechas relativas o explícitas
  let fecha = null;
  let esFechaRelativa = false;
  const hoyDate = new Date();
  if (/\bhoy\b/i.test(tNorm)) {
    fecha = Utilities.formatDate(hoyDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
    esFechaRelativa = true;
  } else if (/\bayer\b/i.test(tNorm)) {
    const ayerDate = new Date(hoyDate.getTime() - 24 * 60 * 60 * 1000);
    fecha = Utilities.formatDate(ayerDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
    esFechaRelativa = true;
  } else {
    const matchFecha = t.match(/(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/);
    if (matchFecha) {
      fecha = matchFecha[1].replace(/[/.]/g, "-");
    } else {
      const matchDiaMes = tNorm.match(/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)/);
      if (matchDiaMes) {
        const dia = matchDiaMes[1].padStart(2, "0");
        const meses = { enero: "01", febrero: "02", marzo: "03", abril: "04", mayo: "05", junio: "06", julio: "07", agosto: "08", septiembre: "09", setiembre: "09", octubre: "10", noviembre: "11", diciembre: "12" };
        const mes = meses[matchDiaMes[2]];
        const anio = hoyDate.getFullYear();
        fecha = `${anio}-${mes}-${dia}`;
      }
    }
  }

  // Limpieza estructurada del término de búsqueda
  let tLimpio = tNorm;

  // 1. Quitar cláusulas de acción finales (ej: ", y borra la informacion relacionada a esta", "y eliminar todo")
  tLimpio = tLimpio.replace(/(?:,\s*)?(?:y\s+)?(?:borra(?:r)?|elimina(?:r)?|quita(?:r)?|anula(?:r)?|purga(?:r)?|cancela(?:r)?|corrige|corregi(?:r)?|modifica(?:r)?|cambia(?:r)?|ajusta(?:r)?)\s+(?:toda\s+)?(?:la\s+informacion\s+(?:financiera\s+)?)?(?:relacionad[ao]\s+(?:a|con)\s+esta|de\s+esta|de\s+este|asociad[ao]\s+(?:a|con)\s+esta|todo)?/gi, "");

  // 2. Quitar verbos y comandos iniciales (ej: "identifica los registros asociados a", "busca las transacciones de")
  tLimpio = tLimpio.replace(/^(?:solo\s+)?(?:identifica(?:r)?|busca(?:r)?|encuentra|muestra|mostra(?:r)?|mira|consulta(?:r)?|ver|audita(?:r)?|borra(?:r)?|elimina(?:r)?|quita(?:r)?|anula(?:r)?|purga(?:r)?|cancela(?:r)?|corrige|corregi(?:r)?|modifica(?:r)?|cambia(?:r)?|ajusta(?:r)?|edita(?:r)?)\s+(?:todos?\s+)?(?:los\s+|las\s+)?(?:registros?|movimientos?|datos?|informacion\s+(?:financiera\s+)?|transaccion(?:es)?|gastos?|ingresos?|pagos?|facturas?|deudas?|compromisos?)\s*(?:asociad[ao]s?\s+a|relacionad[ao]s?\s+a|de|del?|con|por)?\s*/gi, "");

  // 3. Quitar conectores adicionales de búsqueda / acción
  tLimpio = tLimpio
    .replace(/\b(?:solo|solamente|por\s+favor|favor|quiero|necesito|deseo)\b/gi, "")
    .replace(/(?:identifica(?:r)?|busca(?:r)?|consulta(?:r)?|ver|muestra|mostra(?:r)?|audita(?:r)?|borra(?:r)?|elimina(?:r)?|quita(?:r)?|anula(?:r)?|purga(?:r)?|cancela(?:r)?|corrige|corregi(?:r)?|modifica(?:r)?|cambia(?:r)?|ajusta(?:r)?|edita(?:r)?)\s+/gi, "")
    .replace(/(?:el\s+valor\s+de|la\s+fecha\s+de|la\s+categoria\s+de|el\s+monto\s+de|el\s+concepto\s+de)/gi, "")
    .replace(/(?:la\s+informacion\s+(?:financiera\s+)?)?(?:relacionad[ao]\s+(?:al?|con)\s+)?(?:(?:del?|al?)\s+)?(?:registros?\s+de|movimientos?\s+de|transaccion(?:es)?\s+de|gastos?\s+de|ingresos?\s+de|pagos?\s+de|pagos?\s+a)/gi, "")
    .replace(/(?:registros?|movimientos?|transaccion(?:es)?|gastos?|ingresos?|pagos?)/gi, "")
    .replace(/(?:asociad[ao]s?\s+a|relacionad[ao]s?\s+a|vinculad[ao]s?\s+a)/gi, "")
    .replace(/(?:de\s+las\s+finanzas|de\s+las\s+transacciones|de\s+los\s+registros|en\s+el\s+sistema)/gi, "");

  // 4. Si se extrajo fecha relativa ("hoy", "ayer"), removerla del término textual
  if (esFechaRelativa) {
    tLimpio = tLimpio.replace(/\b(?:hoy|ayer|del\s+dia|de\s+hoy|de\s+ayer)\b/gi, "");
  }

  // 5. Manejo de cambio de valor
  let nuevoValor = null;
  const matchCambioValor = t.match(/(?:a|por|en)\s+\$?\s*(\d{1,3}(?:\.\d{3})+|\d+)/i);
  if (accion === "corregir" && matchCambioValor) {
    nuevoValor = Number(matchCambioValor[1].replace(/\./g, "")) || null;
    tLimpio = tLimpio.replace(/(?:a|por|en)\s+\$?\s*(\d{1,3}(?:\.\d{3})+|\d+).*/i, "").trim();
  }

  // 6. Quitar artículos, preposiciones y conectores sobrantes
  tLimpio = tLimpio.replace(/^(?:el|la|los|las|un|una|unos|unas|de|del|a|en|para|con)\s+/i, "").trim();
  tLimpio = tLimpio.replace(/^(?:el|la|los|las|un|una|unos|unas|de|del|a|en|para|con)\s+/i, "").trim();
  tLimpio = tLimpio.replace(/\s+(?:de\s+esta|de\s+este|relacionad[ao]\s+a\s+esta)$/i, "").trim();
  tLimpio = tLimpio.replace(/\s+/g, " ").trim();

  return {
    accion: accion,
    criterioBusqueda: {
      textoTermino: tLimpio,
      monto: monto,
      fecha: fecha
    },
    cambios: {
      nuevoValor: nuevoValor
    }
  };
}

function buscarMovimientosEnLibroFinanciero_(ss, parametros) {
  const libro = ss || SpreadsheetApp.getActiveSpreadsheet();
  if (!libro) return [];

  const crit = parametros.criterioBusqueda || {};
  const terminoNorm = String(crit.textoTermino || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const palabrasClave = terminoNorm.split(/\s+/).filter(p => p.length >= 3);
  
  // Stop words contables y comunes para tokens distintivos (nombres propios)
  const stopWords = new Set(["more", "paper", "design", "gasto", "ingreso", "pago", "compra", "venta", "para", "este", "esta", "todos", "todo", "registro", "registros", "movimiento", "movimientos", "transaccion", "transacciones"]);
  const palabrasDistintivas = palabrasClave.filter(p => !stopWords.has(p) && p.length >= 4);

  const fechaFiltro = crit.fecha || null;
  const montoFiltro = Number(crit.monto) || null;

  const resultados = [];
  const hojas = libro.getSheets();

  hojas.forEach(sheet => {
    const sheetName = sheet.getName();
    const nameClean = sheetName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f\s_]/g, "");

    const esHojaTrans = nameClean.includes("transaccion") || sheetName.endsWith("_Transacciones");
    const esHojaComp = nameClean.includes("compromiso") || sheetName.endsWith("_Compromisos");
    const esControlAcceso = nameClean.includes("controlacceso");

    // Verificar si el nombre de la hoja coincide con la entidad o persona buscada (ej: "Maidi_Transacciones")
    const hojaCoincideConTermino = (terminoNorm.length >= 3 && nameClean.includes(terminoNorm)) ||
      (palabrasDistintivas.length > 0 && palabrasDistintivas.some(pd => nameClean.includes(pd)));

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return;

    if (esHojaTrans) {
      const lastCol = Math.max(12, sheet.getLastColumn());
      const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

      data.forEach((fila, idx) => {
        const idTx = String(fila[0] || "");
        const fechaVal = fila[1];
        let fechaStr = (fechaVal instanceof Date)
          ? Utilities.formatDate(fechaVal, Session.getScriptTimeZone(), "yyyy-MM-dd")
          : String(fechaVal || "").substring(0, 10);

        const tipo = String(fila[2] || "Gasto");
        const categoria = String(fila[3] || "");
        const subcategoria = String(fila[4] || "");
        const concepto = String(fila[5] || "");
        const tercero = String(fila[6] || "");
        const valor = Number(fila[7]) || 0;
        const metodo = String(fila[8] || "");
        const estado = String(fila[9] || "Confirmado");
        const idCompromiso = String(fila[10] || "");
        const notas = String(fila[11] || "");

        const textoFila = `${tercero} ${concepto} ${categoria} ${subcategoria} ${notas} ${sheetName}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        let coincide = false;
        if (terminoNorm && terminoNorm.length > 0) {
          if (textoFila.includes(terminoNorm) || hojaCoincideConTermino) {
            coincide = true;
          } else if (palabrasClave.length > 0 && palabrasClave.every(pal => textoFila.includes(pal))) {
            coincide = true;
          } else if (palabrasDistintivas.length > 0 && palabrasDistintivas.some(pd => textoFila.includes(pd))) {
            coincide = true;
          }
        }

        if (montoFiltro !== null && Math.abs(valor - montoFiltro) < 1) {
          coincide = coincide || (!terminoNorm && !fechaFiltro);
        }
        if (fechaFiltro && fechaStr === fechaFiltro) {
          coincide = coincide || (!terminoNorm && montoFiltro === null);
        }

        if (coincide) {
          let entNombre = sheetName.replace(/[_]/g, " ").replace("Transacciones", "").trim();
          if (entNombre === "MorePaper") entNombre = "More Paper";
          if (entNombre === "MoreDesign") entNombre = "More Design";

          resultados.push({
            tipoRegistro: "transaccion",
            nombreHoja: sheetName,
            entidad: entNombre || "General",
            filaIndex: idx + 2,
            id: idTx,
            fecha: fechaStr,
            tipo: tipo,
            categoria: categoria,
            subcategoria: subcategoria,
            concepto: concepto,
            tercero: tercero,
            valor: valor,
            metodoPago: metodo,
            estado: estado,
            idCompromiso: idCompromiso,
            notas: notas
          });
        }
      });
    } else if (esHojaComp) {
      const lastCol = Math.max(12, sheet.getLastColumn());
      const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

      data.forEach((fila, idx) => {
        const idComp = String(fila[0] || "");
        const fechaVal = fila[1];
        let fechaStr = (fechaVal instanceof Date)
          ? Utilities.formatDate(fechaVal, Session.getScriptTimeZone(), "yyyy-MM-dd")
          : String(fechaVal || "").substring(0, 10);
        const acreedor = String(fila[2] || "");
        const concepto = String(fila[3] || "");
        const montoTotal = Number(fila[4]) || 0;
        const totalAbonado = Number(fila[5]) || 0;
        const saldoPendiente = Number(fila[6]) || 0;
        const estado = String(fila[9] || "Pendiente");

        const textoFila = `${acreedor} ${concepto} ${sheetName}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        let coincide = false;
        if (terminoNorm && (textoFila.includes(terminoNorm) || hojaCoincideConTermino || (palabrasClave.length > 0 && palabrasClave.every(pal => textoFila.includes(pal))) || (palabrasDistintivas.length > 0 && palabrasDistintivas.some(pd => textoFila.includes(pd))))) {
          coincide = true;
        }
        if (montoFiltro !== null && Math.abs(montoTotal - montoFiltro) < 1) {
          coincide = coincide || (!terminoNorm && !fechaFiltro);
        }
        if (fechaFiltro && fechaStr === fechaFiltro) {
          coincide = coincide || (!terminoNorm && montoFiltro === null);
        }

        if (coincide) {
          let entNombre = sheetName.replace(/[_]/g, " ").replace("Compromisos", "").trim();
          if (entNombre === "MorePaper") entNombre = "More Paper";
          if (entNombre === "MoreDesign") entNombre = "More Design";

          resultados.push({
            tipoRegistro: "compromiso",
            nombreHoja: sheetName,
            entidad: entNombre || "General",
            filaIndex: idx + 2,
            id: idComp,
            fecha: fechaStr,
            tipo: "Compromiso",
            categoria: "Cuentas por Pagar",
            concepto: concepto,
            tercero: acreedor,
            valor: saldoPendiente,
            montoTotal: montoTotal,
            totalAbonado: totalAbonado,
            estado: estado
          });
        }
      });
    } else if (esControlAcceso) {
      const lastCol = Math.min(11, Math.max(4, sheet.getLastColumn()));
      const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
      data.forEach((fila, idx) => {
        const telefono = String(fila[0] || "");
        const nombre = String(fila[1] || "");
        const rol = String(fila[2] || "");
        const hojasPerm = String(fila[4] || "");
        const notas = String(fila[6] || "");
        const textoFila = `${telefono} ${nombre} ${rol} ${hojasPerm} ${notas}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        let coincide = false;
        if (terminoNorm && rol !== "SUPER_ADMIN") {
          if (textoFila.includes(terminoNorm)) {
            coincide = true;
          } else if (palabrasClave.length > 0 && palabrasClave.every(pal => textoFila.includes(pal))) {
            coincide = true;
          } else if (palabrasDistintivas.length > 0 && palabrasDistintivas.some(pd => textoFila.includes(pd))) {
            coincide = true;
          }
        }

        if (coincide) {
          resultados.push({
            tipoRegistro: "control_acceso",
            nombreHoja: sheetName,
            entidad: "Control de Acceso",
            filaIndex: idx + 2,
            id: telefono || String(fila[0] || ""),
            fecha: "",
            tipo: "Usuario / Personal",
            categoria: "Control de Acceso",
            concepto: `Usuario registrado: ${nombre} (${rol})`,
            tercero: nombre,
            valor: 0
          });
        }
      });
    }
  });

  return resultados;
}

function ejecutarSolicitudAjusteOCorreccionMovimientos_(ss, telLimpio, textoUsuario, perm, solicitaAudio) {
  const nombreHumano = sanitizarNombreHumano_(perm ? perm.nombre : "Fernando");
  const infoVoz = { emoji: "🐱👢", desc: "Gato con Botas" };

  const params = extraerParametrosAjusteMovimientos_(textoUsuario);
  const termino = params.criterioBusqueda.textoTermino || "";
  const hallazgos = buscarMovimientosEnLibroFinanciero_(ss, params);

  if (!hallazgos || hallazgos.length === 0) {
    return {
      tipo: "conversacion",
      texto: `No encontré registros activos asociados a "${termino}".`,
      hallazgosCount: 0
    };
  }

  const cache = CacheService.getUserCache();
  if (cache) {
    cache.put("PENDING_INTERACTIVE_FLOW_" + telLimpio, JSON.stringify({
      tipo: "confirmacion_ajuste_movimientos",
      accion: params.accion,
      criterio: termino || textoUsuario,
      cambios: params.cambios,
      movimientos: hallazgos,
      timestamp: Date.now()
    }), 600);
  }

  return {
    tipo: "confirmacion_seguridad",
    texto: `Aviso de seguridad generado para ${hallazgos.length} registros.`,
    hallazgosCount: hallazgos.length
  };
}

function resolverConfirmacionAjusteSeguridad_(ss, telLimpio, textoUsuario, perm, flowData, cache) {
  const t = String(textoUsuario || "").trim().toLowerCase();
  const nombreHumano = sanitizarNombreHumano_(perm ? perm.nombre : "Fernando");

  if (t === "cancelar" || t === "cancela" || t === "no") {
    if (cache) cache.remove("PENDING_INTERACTIVE_FLOW_" + telLimpio);
    return {
      tipo: "conversacion",
      texto: "Operación de ajuste cancelada."
    };
  }

  const esConfirmacion = t.includes("confirmar") || t.includes("si") || t.includes("borrar") || t === "1";
  if (!esConfirmacion) {
    return {
      tipo: "confirmacion_seguridad",
      texto: "Confirmación pendiente."
    };
  }

  let itemsAProcesar = flowData.movimientos || [];
  if (itemsAProcesar.length > 1 && !t.includes("todo") && !t.includes("todos")) {
    const matchIdx = t.match(/\b(\d+)\b/);
    if (matchIdx) {
      const targetIdx = parseInt(matchIdx[1], 10) - 1;
      if (targetIdx >= 0 && targetIdx < itemsAProcesar.length) {
        itemsAProcesar = [itemsAProcesar[targetIdx]];
      }
    }
  }
  const libro = ss || SpreadsheetApp.getActiveSpreadsheet();
  const accion = flowData.accion || "eliminar";
  const reporteAcciones = [];

  ejecutarConBloqueoTransaccional_(() => {
    const porHoja = {};
    itemsAProcesar.forEach(item => {
      if (!porHoja[item.nombreHoja]) porHoja[item.nombreHoja] = [];
      porHoja[item.nombreHoja].push(item);
    });

    Object.keys(porHoja).forEach(nombreHoja => {
      const sheet = libro.getSheetByName(nombreHoja);
      if (!sheet) return;

      const itemsHoja = porHoja[nombreHoja];
      itemsHoja.sort((a, b) => b.filaIndex - a.filaIndex);

      itemsHoja.forEach(it => {
        if (accion === "eliminar") {
          sheet.deleteRow(it.filaIndex);
          reporteAcciones.push(`Eliminado de ${it.entidad}: ${it.concepto}`);
        } else if (accion === "corregir") {
          if (flowData.cambios && flowData.cambios.nuevoValor !== null) {
            sheet.getRange(it.filaIndex, 8).setValue(flowData.cambios.nuevoValor);
            reporteAcciones.push(`Modificado en ${it.entidad}: Nuevo valor $${flowData.cambios.nuevoValor}`);
          }
        }
      });
    });
  });

  if (cache) cache.remove("PENDING_INTERACTIVE_FLOW_" + telLimpio);

  return {
    tipo: "ajuste_exitoso",
    texto: `Ajuste completado con éxito. Se eliminaron/modificaron ${reporteAcciones.length} registros.`,
    eliminados: reporteAcciones.length
  };
}

// 3. RUN ASSERTIONS
console.log("🔍 Running tests for Surgical Adjustment & Deletion...");

// Test A: Detection
const t1 = "solo borrar la informacion relacionada al registro de maidi moreno";
assert.strictEqual(detectarSolicitudAjusteOCorreccionMovimientos_(t1), true, "Should detect t1 as adjustment/delete");

const t2 = "borrar la informacion financiera relacionada al registro de maidi moreno";
assert.strictEqual(detectarSolicitudAjusteOCorreccionMovimientos_(t2), true, "Should detect t2 as adjustment/delete");

const t3 = "eliminar el gasto de maidi moreno";
assert.strictEqual(detectarSolicitudAjusteOCorreccionMovimientos_(t3), true, "Should detect t3 as adjustment/delete");

const t4 = "corregir el valor del almuerzo a 30000";
assert.strictEqual(detectarSolicitudAjusteOCorreccionMovimientos_(t4), true, "Should detect t4 as adjustment");

const t5 = "buscar movimientos de maidi moreno";
assert.strictEqual(detectarSolicitudAjusteOCorreccionMovimientos_(t5), true, "Should detect t5 as search");

const tReset = "reiniciar el sistema a cero";
assert.strictEqual(detectarSolicitudAjusteOCorreccionMovimientos_(tReset), false, "Should NOT detect general reset as surgical adjustment");

console.log("✅ Detection tests passed!");

// Test B: Extraction
const params1 = extraerParametrosAjusteMovimientos_(t1);
assert.strictEqual(params1.accion, "eliminar");
assert.strictEqual(params1.criterioBusqueda.textoTermino, "maidi moreno");

const params4 = extraerParametrosAjusteMovimientos_(t4);
assert.strictEqual(params4.accion, "corregir");
assert.strictEqual(params4.cambios.nuevoValor, 30000);

console.log("✅ Parameter extraction tests passed!");

// Test C: Search and 2-Step Confirmation Flow
const mockPaperTrans = new MockSheet("MorePaper_Transacciones", [
  ["ID", "FECHA", "TIPO", "CATEGORIA", "SUBCAT", "CONCEPTO", "TERCERO", "VALOR", "METODO", "ESTADO", "ID_COMP", "NOTAS"],
  ["TX-1", "2026-10-14", "Gasto", "Nómina", "Personal", "Pago Nómina Maidi Moreno", "Maidi Moreno", 150000, "Efectivo", "Confirmado", "", ""],
  ["TX-2", "2026-10-14", "Gasto", "Suministros", "", "Compra resmas", "Papelería Andina", 80000, "Ahorros ***7194", "Confirmado", "", ""]
]);
const mockCtrlAcceso = new MockSheet("Control_Acceso", [
  ["TEL", "NOMBRE", "ROL", "ESTADO"],
  ["+573008880001", "Fernando", "SUPER_ADMIN", "ACTIVO"],
  ["+573009998877", "Maidi Moreno", "EMPLEADO", "ACTIVO"]
]);
const mockSs = new MockSpreadsheet({
  "MorePaper_Transacciones": mockPaperTrans,
  "Control_Acceso": mockCtrlAcceso
});
global.__activeSs = mockSs;

const resAviso = ejecutarSolicitudAjusteOCorreccionMovimientos_(mockSs, "+573008880001", t1, { rol: "SUPER_ADMIN", nombre: "Fernando" }, false);
assert.strictEqual(resAviso.tipo, "confirmacion_seguridad");
assert.strictEqual(resAviso.hallazgosCount, 2, "Should find 1 tx and 1 user in Control_Acceso");

// Verify cached pending flow
const pendingFlow = JSON.parse(mockUserCache.get("PENDING_INTERACTIVE_FLOW_+573008880001"));
assert.strictEqual(pendingFlow.tipo, "confirmacion_ajuste_movimientos");
assert.strictEqual(pendingFlow.movimientos.length, 2);

// Test D: Confirmation and Selective Execution
assert.strictEqual(mockPaperTrans.getLastRow(), 3, "Row count before delete is 3 (header + 2 rows)");
assert.strictEqual(mockCtrlAcceso.getLastRow(), 3, "Row count before delete is 3 (header + 2 rows)");

// Test D1: Cancel Flow
const resCancel = resolverConfirmacionAjusteSeguridad_(mockSs, "+573008880001", "cancelar", { rol: "SUPER_ADMIN", nombre: "Fernando" }, pendingFlow, mockUserCache);
assert.strictEqual(resCancel.tipo, "conversacion");
assert.strictEqual(mockUserCache.get("PENDING_INTERACTIVE_FLOW_+573008880001"), null, "Cache must be cleared on cancellation");
assert.strictEqual(mockPaperTrans.getLastRow(), 3, "Row count should remain 3 after cancel");

// Re-generate pending flow
ejecutarSolicitudAjusteOCorreccionMovimientos_(mockSs, "+573008880001", t1, { rol: "SUPER_ADMIN", nombre: "Fernando" }, false);
const pendingFlow2 = JSON.parse(mockUserCache.get("PENDING_INTERACTIVE_FLOW_+573008880001"));

// Test D2: Confirm selective deletion (item 1 only - the transaction)
const resConfirm1 = resolverConfirmacionAjusteSeguridad_(mockSs, "+573008880001", "CONFIRMAR BORRADO 1", { rol: "SUPER_ADMIN", nombre: "Fernando" }, pendingFlow2, mockUserCache);
assert.strictEqual(resConfirm1.tipo, "ajuste_exitoso");
assert.strictEqual(resConfirm1.eliminados, 1);

assert.strictEqual(mockPaperTrans.getLastRow(), 2, "Row count in MorePaper_Transacciones should be 2 (1 deleted)");
assert.strictEqual(mockCtrlAcceso.getLastRow(), 3, "Control_Acceso was item 2, so it should still have 3 rows");
assert.strictEqual(mockPaperTrans.rows[1][5], "Compra resmas", "The remaining transaction must be Compra resmas");

// Test E: Value Adjustment Flow
const resAvisoMod = ejecutarSolicitudAjusteOCorreccionMovimientos_(mockSs, "+573008880001", t4, { rol: "SUPER_ADMIN", nombre: "Fernando" }, false);
// t4 was "corregir el valor del almuerzo a 30000", but let's test with "resmas"
const resAvisoResmas = ejecutarSolicitudAjusteOCorreccionMovimientos_(mockSs, "+573008880001", "corregir el valor de resmas a 95000", { rol: "SUPER_ADMIN", nombre: "Fernando" }, false);
assert.strictEqual(resAvisoResmas.tipo, "confirmacion_seguridad");
const pendingMod = JSON.parse(mockUserCache.get("PENDING_INTERACTIVE_FLOW_+573008880001"));
assert.strictEqual(pendingMod.cambios.nuevoValor, 95000);

const resConfirmMod = resolverConfirmacionAjusteSeguridad_(mockSs, "+573008880001", "CONFIRMAR AJUSTE", { rol: "SUPER_ADMIN", nombre: "Fernando" }, pendingMod, mockUserCache);
assert.strictEqual(resConfirmMod.tipo, "ajuste_exitoso");
assert.strictEqual(mockPaperTrans.rows[1][7], 95000, "Valor should be updated to 95000");

// Test F: The 3 Real-World WhatsApp Scenarios from User
console.log("🔍 Running tests for the 3 WhatsApp user scenarios...");

// Scenario 1: Compound sentence: 'identifica los registros asociados a maidi moreno, y borra la informacion relacionada a esta'
const userText1 = "identifica los registros asociados a maidi moreno, y borra la informacion relacionada a esta";
assert.strictEqual(detectarSolicitudAjusteOCorreccionMovimientos_(userText1), true, "Scenario 1 must be detected");
const p1 = extraerParametrosAjusteMovimientos_(userText1);
assert.strictEqual(p1.accion, "eliminar", "Scenario 1 action must be eliminar");
assert.strictEqual(p1.criterioBusqueda.textoTermino, "maidi moreno", "Scenario 1 term must be 'maidi moreno'");
const search1 = buscarMovimientosEnLibroFinanciero_(mockSs, p1);
assert.strictEqual(search1.length >= 1, true, "Scenario 1 should find at least 1 record");

// Scenario 2: Resilient matching for 'maidi moreno' even if name is 'Maidi Sarmiento' or sheet is 'Maidi_Transacciones'
const mockMaidiSheet = new MockSheet("Maidi_Transacciones", [
  ["ID", "FECHA", "TIPO", "CATEGORIA", "SUBCAT", "CONCEPTO", "TERCERO", "VALOR", "METODO", "ESTADO", "ID_COMP", "NOTAS"],
  ["TX-M1", "2026-10-14", "Gasto", "Operativo", "", "Impresiones", "Cliente X", 50000, "Efectivo", "Confirmado", "", ""]
]);
const mockSsWithMaidi = new MockSpreadsheet({
  "MorePaper_Transacciones": mockPaperTrans,
  "Maidi_Transacciones": mockMaidiSheet,
  "Control_Acceso": mockCtrlAcceso
});
const p2 = extraerParametrosAjusteMovimientos_("maidi moreno");
const search2 = buscarMovimientosEnLibroFinanciero_(mockSsWithMaidi, p2);
assert.strictEqual(search2.some(r => r.nombreHoja === "Maidi_Transacciones"), true, "Must match records in Maidi_Transacciones via distinctive token");

// Scenario 3: 'buscar movimientos de hoy'
const userText3 = "buscar movimientos de hoy";
assert.strictEqual(detectarSolicitudAjusteOCorreccionMovimientos_(userText3), true, "Scenario 3 must be detected");
const p3 = extraerParametrosAjusteMovimientos_(userText3);
assert.strictEqual(p3.criterioBusqueda.textoTermino, "", "Scenario 3 term must be empty (not literal 'hoy')");
assert.strictEqual(p3.criterioBusqueda.fecha !== null, true, "Scenario 3 must have extracted a valid date");

// Add a transaction for today to mockPaperTrans
mockPaperTrans.rows.push(["TX-3", p3.criterioBusqueda.fecha, "Gasto", "Suministros", "", "Tintas", "Proveedor Y", 45000, "Efectivo", "Confirmado", "", ""]);

const search3 = buscarMovimientosEnLibroFinanciero_(mockSs, p3);
assert.strictEqual(search3.length >= 1, true, "Scenario 3 must find today's movements without filtering them out with 'hoy'");
assert.strictEqual(search3[0].fecha, p3.criterioBusqueda.fecha, "Found record date must match today's date");

console.log("✅ All 3 WhatsApp scenarios successfully verified and passing!");
console.log("✅ All tests executed and passed successfully! 100% Verified.");

