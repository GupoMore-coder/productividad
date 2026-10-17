import fs from 'fs';

const text = fs.readFileSync('scratch/live_fetch.html', 'utf8');
const marker = 'goog.script.init("';
const start = text.indexOf(marker);
const contentStart = start + marker.length;
const endIdx = text.indexOf('", "", undefined', contentStart);
const rawJsString = text.slice(contentStart, endIdx);

console.log('rawJsString length:', rawJsString.length);

// Strategy: Replace \xHH with \u00HH so JSON.parse can read it!
try {
  // 1. In JS string literal, \xHH is invalid in JSON, but \u00HH is valid in JSON!
  const jsonCompatible = rawJsString.replace(/\\x([0-9a-fA-F]{2})/g, '\\u00$1');
  console.log('Converted \\xHH to \\u00HH. Length:', jsonCompatible.length);

  // Now parse as JSON string:
  const jsonStr = JSON.parse('"' + jsonCompatible + '"');
  console.log('Step 1 (outer string unescape) SUCCESS! jsonStr length:', jsonStr.length);
  
  // Now parse inner JSON object:
  const parsed = JSON.parse(jsonStr);
  console.log('Step 2 (inner JSON parse) SUCCESS! userHtml length:', parsed.userHtml ? parsed.userHtml.length : 'none');

  // Let's test the scripts inside userHtml
  const scripts = parsed.userHtml.match(/<script[\s\S]*?<\/script>/gi) || [];
  console.log('Total scripts in userHtml:', scripts.length);
  let scriptErrors = 0;
  scripts.forEach((s, idx) => {
    const code = s.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
    try {
      new Function(code);
    } catch (e) {
      console.error(`Script ${idx} Error:`, e.message);
      scriptErrors++;
    }
  });
  console.log(`Script syntax validation: ${scripts.length - scriptErrors}/${scripts.length} passed.`);
  console.log('Contains switchManualLanguage:', parsed.userHtml.includes('switchManualLanguage'));
  console.log('Contains I18N_DICTIONARY:', parsed.userHtml.includes('I18N_DICTIONARY'));

} catch (e) {
  console.log('Strategy failed:', e.message);
}
