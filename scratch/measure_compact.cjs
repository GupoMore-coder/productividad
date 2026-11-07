const fs = require('fs');
const lines = fs.readFileSync('bibliotecario_engine/knowledge/inventario_maestro.csv', 'utf8').split('\n');

const compact = [];
for (let i = 0; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  const parts = lines[i].split('","');
  if (parts.length >= 9) {
    compact.push([
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

const json = JSON.stringify(compact);
console.log('Total rows:', compact.length);
console.log('Total compact JSON length (bytes):', json.length);
console.log('Number of 80 KB chunks required:', Math.ceil(json.length / 80000));

