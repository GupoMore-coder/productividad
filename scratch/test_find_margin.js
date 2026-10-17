import fs from 'fs';

let html = fs.readFileSync('scratch/simulated_manual.html', 'utf8');

const scripts = html.match(/<script[\s\S]*?<\/script>/gi) || [];
const code = scripts[2].replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
const idx = code.indexOf('margin');
console.log('Index of margin:', idx);
if (idx !== -1) {
  console.log(code.slice(idx - 100, idx + 100));
}
