import fs from 'fs';

let html = fs.readFileSync('scratch/simulated_manual.html', 'utf8');

// Replace alert(\' with alert(&quot;
html = html.replace(/onclick="alert\(\\\\'([^)]*)\\\\'\); return false;"/g, 'onclick="alert(&quot;$1&quot;); return false;"');

const scripts = html.match(/<script[\s\S]*?<\/script>/gi) || [];
console.log('Total scripts:', scripts.length);

scripts.forEach((s, i) => {
  const code = s.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
  try {
    new Function(code);
    console.log(`Script ${i} is 100% VALID!`);
  } catch (e) {
    console.log(`Script ${i} error:`, e.message);
  }
});
