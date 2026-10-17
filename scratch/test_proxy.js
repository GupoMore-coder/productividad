import fs from 'fs';

async function test() {
  const res = await fetch('https://biblioteca-medica.ortopedia.workers.dev');
  const html = await res.text();
  fs.writeFileSync('scratch/gas_response.html', html, 'utf8');
  console.log('Saved to scratch/gas_response.html, length:', html.length);
  const iframes = html.match(/<iframe[^>]+>/gi) || [];
  console.log('Iframes found:', iframes.length);
  iframes.forEach(f => console.log('IFRAME:', f));
}

test().catch(console.error);
