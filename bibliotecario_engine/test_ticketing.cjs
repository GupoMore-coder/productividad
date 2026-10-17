/**
 * TEST SUITE: Protocolo de Intermediación, Ticketing y Búsqueda Clínica (Paso 4)
 */

const assert = require('assert');
const {
  searchClinicalLiterature,
  createLiteratureTicket,
  formatGerenteAlertMessage,
  resolvePendingTicketsByDocument,
  generateCategorySummary
} = require('./ticketing_and_intermediary.cjs');

console.log('================================================================');
console.log('🧪 EJECUTANDO BATERÍA DE PRUEBAS: PASO 4 - TICKETING E INTERMEDIACIÓN');
console.log('================================================================\n');

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

// 1. Posibilidad 1: Búsqueda Clínica Ultrarrápida a Costo Cero de Tokens
runTest('Prueba 1: Búsqueda clínica en catálogo ("antibiotic open fractures")', () => {
  const results = searchClinicalLiterature('antibiotic open fractures');
  assert.strictEqual(Array.isArray(results), true);
  assert.strictEqual(results.length > 0, true);
  assert.strictEqual(results[0].category, 'Infeccioso');
  assert.strictEqual(results[0].title.toLowerCase().includes('antibiotic'), true);
});

// 2. Posibilidad 2: Creación de Ticket y Formato de Alerta al Gestor de Contenido
runTest('Prueba 2: Creación de Ticket y Formato de Alerta al Gestor de Contenido', () => {
  const ticket = createLiteratureTicket({
    requestedTitle: 'Surgical management of complex pelvic ring fractures',
    doiOrIsbn: '10.1016/j.injury.2023.05.012',
    requesterPhone: '+573155554321',
    requesterName: 'Dr. Alejandro Restrepo',
    requesterUniversity: 'Universidad de Antioquia'
  });

  assert.strictEqual(ticket.id.startsWith('TCK-'), true);
  assert.strictEqual(ticket.status, 'PENDIENTE');

  const alertMsg = formatGerenteAlertMessage(ticket, {
    title: 'Surgical management of complex pelvic ring fractures',
    author: 'Smith, J.',
    journal: 'Injury',
    doi: '10.1016/j.injury.2023.05.012'
  });

  assert.strictEqual(alertMsg.includes('Dr. Alejandro Restrepo'), true);
  assert.strictEqual(alertMsg.includes('Universidad de Antioquia'), true);
  assert.strictEqual(alertMsg.includes('10.1016/j.injury.2023.05.012'), true);
  assert.strictEqual(alertMsg.includes('_BIBLIOTECARIO'), true);
});

// 3. Posibilidad 2: Cierre de Ciclo Automático al Ingresar Documento con Agradecimiento Cruzado
runTest('Prueba 3: Cierre de Ciclo Automático y Agradecimiento Cruzado', () => {
  const resolutions = resolvePendingTicketsByDocument({
    filename: '2023 - Smith, J. - Surgical management of complex pelvic ring fractures.pdf',
    docId: 'DRIVE_FILE_ID_PELVIC_2023',
    uploader: {
      name: 'Dra. Valentina Gómez',
      university: 'Universidad del Valle'
    }
  });

  assert.strictEqual(resolutions.length >= 1, true);
  const r = resolutions[0];
  assert.strictEqual(r.ticket.status, 'DISPONIBLE');
  assert.strictEqual(r.messageForRequester.includes('Dra. Valentina Gómez'), true);
  assert.strictEqual(r.messageForRequester.includes('Universidad del Valle'), true);
  assert.strictEqual(r.messageForUploader.includes('Dr. Alejandro Restrepo'), true);
  assert.strictEqual(typeof r.downloadToken, 'string');
});

// 4. Posibilidad 3: Generación de Resumen de Catálogo por Temas
runTest('Prueba 4: Resumen de Catálogo por Especialidad ("Infeccioso")', () => {
  const summary = generateCategorySummary('Infeccioso');
  assert.strictEqual(summary.totalTitles > 0, true);
  assert.strictEqual(summary.titles.length > 0, true);
  assert.strictEqual(summary.category, 'Infeccioso');
});

console.log('\n================================================================');
console.log(`📊 RESULTADOS FINALES: ${passed} / ${total} PRUEBAS EXITOSAS (${Math.round((passed/total)*100)}%)`);
console.log('================================================================\n');

if (passed === total) process.exit(0);
else process.exit(1);
