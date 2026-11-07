const fs = require('fs');
const path = require('path');
const gasCode = fs.readFileSync(path.join(__dirname, '..', 'bibliotecario_engine', 'GoogleAppsScript_SheetsManager.js'), 'utf8');

eval(gasCode);

// Cargar inventario
const csvPath = path.join(__dirname, '..', 'bibliotecario_engine', 'knowledge', 'inventario_maestro_expandido.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.trim().split('\n');
const mockInventory = [];
for (let i = 1; i < lines.length; i++) {
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
  if (parts.length >= 6) {
    mockInventory.push({
      id: parts[0],
      driveId: parts[1],
      year: parts[2],
      author: parts[3],
      title: parts[4],
      category: parts[5],
      docType: parts[6] || 'Artículo Original',
      aoClass: parts[7] || 'N/A'
    });
  }
}

const nlu = parseQueryNLU('Dame 3 artículos sobre fractura de húmero proximal');
console.log('NLU parsed:', nlu);
const res = searchCatalogScored(nlu, mockInventory);
console.log('searchCatalogScored returned:', res.length, 'results');
if (res.length > 0) {
  console.log('Top match:', res[0].title, 'Score:', res[0].score);
}

