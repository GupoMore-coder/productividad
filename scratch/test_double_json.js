import fs from 'fs';

const html = fs.readFileSync('scratch/gas_response.html', 'utf8');

const marker = 'goog.script.init("';
const start = html.indexOf(marker);
if (start !== -1) {
  const contentStart = start + marker.length;
  const endIdx = html.indexOf('", "", undefined', contentStart);
  if (endIdx !== -1) {
    const rawJsString = html.slice(contentStart, endIdx);
    // Evaluate as a JavaScript string literal!
    // Since rawJsString is literally what was inside goog.script.init("..."),
    // evaluating it in JS decodes \x7b, \\n, \\" perfectly according to JavaScript specification!
    const jsonStr = (new Function('return "' + rawJsString + '"'))();
    console.log('jsonStr decoded successfully! Length:', jsonStr.length);
    const parsed = JSON.parse(jsonStr);
    console.log('Parsed successfully! Keys:', Object.keys(parsed));
    const userHtml = parsed.userHtml;
    console.log('userHtml extracted! Length:', userHtml.length);
    fs.writeFileSync('scratch/exact_perfect_manual.html', userHtml, 'utf8');

    // Test syntax of all scripts in exact_perfect_manual.html!
    const scripts = userHtml.match(/<script[\s\S]*?<\/script>/gi) || [];
    console.log('Total scripts:', scripts.length);
    scripts.forEach((s, i) => {
      const code = s.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
      try {
        new Function(code);
        console.log(`Script ${i} is 100% VALID!`);
      } catch (err) {
        console.log(`Script ${i} ERROR:`, err.message);
      }
    });
  }
}
