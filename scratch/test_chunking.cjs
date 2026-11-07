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

// Benchmark chunking
console.time('chunking');
const CHUNK_SIZE = 75000;
const chunks = [];
let curChunk = [];
let curLen = 0;

for (let i = 0; i < compact.length; i++) {
  const row = compact[i];
  const rowLen = JSON.stringify(row).length + 1;
  if (curLen + rowLen > CHUNK_SIZE && curChunk.length > 0) {
    chunks.push(curChunk);
    curChunk = [row];
    curLen = rowLen;
  } else {
    curChunk.push(row);
    curLen += rowLen;
  }
}
if (curChunk.length > 0) chunks.push(curChunk);
console.timeEnd('chunking');

console.log('Total chunks:', chunks.length);
chunks.forEach((c, idx) => {
  console.log(`Chunk ${idx}: ${c.length} rows, ${JSON.stringify(c).length} bytes`);
});

// Benchmark reconstitution
console.time('reconstitution');
const fakeCacheMap = {};
chunks.forEach((c, idx) => {
  fakeCacheMap['INV_CHUNK_' + idx] = JSON.stringify(c);
});

const reconstituted = [];
for (let i = 0; i < chunks.length; i++) {
  const parsed = JSON.parse(fakeCacheMap['INV_CHUNK_' + i]);
  reconstituted.push(...parsed);
}
console.timeEnd('reconstitution');
console.log('Reconstituted rows:', reconstituted.length);

