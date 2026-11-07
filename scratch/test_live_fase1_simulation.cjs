const fs = require('fs');
const path = require('path');

// Mock Google Apps Script environment
const sentMessages = [];
global.sendWhatsAppText = (phone, text) => {
  sentMessages.push({ phone, text });
};
global.recordTelemetry = () => {};
global.generateAnonymousDownloadLink = (driveId) => `https://biblioteca-medica.ortopedia.workers.dev/r/d_mock_${driveId}`;

// Load catalog
const catalogPath = path.join(__dirname, '../bibliotecario_engine/knowledge/inventario_maestro.csv');
const lines = fs.readFileSync(catalogPath, 'utf8').split('\n');
const mockData = [];
for (let i = 0; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  const parts = lines[i].split('","');
  if (parts.length >= 9) {
    mockData.push([
      parts[0].replace(/^"/, ''),
      parts[1],
      parts[2],
      parts[3],
      parts[4],
      parts[5],
      parts[6],
      parts[7],
      parts[8]
    ]);
  }
}

global.getCachedInventory = () => mockData;

// Read functions from GoogleAppsScript_SheetsManager.js
const code = fs.readFileSync(path.join(__dirname, '../bibliotecario_engine/GoogleAppsScript_SheetsManager.js'), 'utf8');

// Evaluate the needed functions in sandbox
const fnSandbox = new Function(`
  ${code.substring(code.indexOf('const SEARCH_STOPWORDS'), code.indexOf('function recordTelemetry'))}
  return { stripAccents, parseQueryNLU, searchCatalogScored, searchCatalog };
`)();

console.log('--- TEST 1: "Ateneo" ---');
const nlu1 = fnSandbox.parseQueryNLU('Ateneo');
console.log('Is Umbrella:', nlu1.isUmbrella, 'Umbrella Info:', nlu1.umbrellaInfo);

console.log('\n--- TEST 2: "Fractura de cadera" ---');
const nlu2 = fnSandbox.parseQueryNLU('Fractura de cadera');
const res2 = fnSandbox.searchCatalogScored(nlu2, mockData);
console.log('Total matches:', res2.length);
console.log('Top match:', res2[0].title, `(${res2[0].author}, ${res2[0].year}) - Score: ${res2[0].score}`);

console.log('\n--- TEST 3: "Dame 3 artículos sobre fractura de húmero proximal" ---');
const nlu3 = fnSandbox.parseQueryNLU('Dame 3 artículos sobre fractura de húmero proximal');
console.log('Clean Query:', nlu3.cleanQuery, '| Requested Count:', nlu3.requestedCount);
const res3 = fnSandbox.searchCatalogScored(nlu3, mockData);
console.log('Total matches:', res3.length);
console.log('Top 3 delivered:');
res3.slice(0, nlu3.requestedCount).forEach((r, i) => {
  console.log(` #${i+1} [Score: ${r.score}] [${r.year}] ${r.title} (${r.author})`);
});

