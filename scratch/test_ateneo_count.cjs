const fs = require('fs');
const path = require('path');
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

const allInventoryDocs = [];
for (let i = 1; i < mockInventoryRows.length; i++) {
  const row = mockInventoryRows[i];
  allInventoryDocs.push({
    id: row[0], driveId: row[1], year: row[2], author: row[3],
    title: row[4], category: row[5], docType: row[6], aoClass: row[7], mesh: row[8]
  });
}

const ateneos = allInventoryDocs.filter(d => 
  (d.category && d.category.includes('Ateneos')) || 
  (d.docType && d.docType.includes('Ateneo')) || 
  /ateneo/i.test(d.title)
);
console.log('Total ateneos matched with category/docType check:', ateneos.length);
