import fs from 'fs';

const html = fs.readFileSync('scratch/gas_response.html', 'utf8');

const idx = html.indexOf('userHtml');
console.log('Index of userHtml:', idx);
if (idx !== -1) {
  console.log('Snippet around userHtml:');
  console.log(html.slice(idx - 20, idx + 200));
}
