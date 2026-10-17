import fs from 'fs';

function unwrapUserHtml(gasHtml) {
  const marker = 'goog.script.init("';
  const start = gasHtml.indexOf(marker);
  if (start === -1) return null;

  const contentStart = start + marker.length;
  const endIdx = gasHtml.indexOf('", "", undefined', contentStart);
  if (endIdx === -1) return null;

  try {
    const rawJsString = gasHtml.slice(contentStart, endIdx);
    const jsonStr = (new Function('return "' + rawJsString + '"'))();
    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.userHtml) {
      return parsed.userHtml;
    }
  } catch (err) {
    console.error('unwrap error:', err);
  }
  return null;
}

const gasHtml = fs.readFileSync('scratch/gas_response.html', 'utf8');
const result = unwrapUserHtml(gasHtml);
console.log('Unwrapped successfully:', result !== null);
console.log('Length:', result.length);

// Test all scripts
const scripts = result.match(/<script[\s\S]*?<\/script>/gi) || [];
console.log('Total scripts in unwrapped manual:', scripts.length);
scripts.forEach((s, i) => {
  const code = s.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
  try {
    new Function(code);
    console.log(`Script ${i} PASS syntax!`);
  } catch (e) {
    console.log(`Script ${i} FAIL syntax:`, e.message);
  }
});

// Verify switchManualLanguage exists and works in sandbox
const switchMatch = result.includes('function switchManualLanguage(') || result.includes('switchManualLanguage =');
console.log('Contains switchManualLanguage definition:', switchMatch);
console.log('Contains I18N_DICTIONARY with 5 languages:', result.includes('"ES"') && result.includes('"EN"') && result.includes('"PT"') && result.includes('"FR"') && result.includes('"IT"'));
