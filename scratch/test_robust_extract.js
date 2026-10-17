import fs from 'fs';

const html = fs.readFileSync('scratch/gas_response.html', 'utf8');

function extractUserHtml(gasHtml) {
  const marker = '\\x22userHtml\\x22:\\x22';
  const start = gasHtml.indexOf(marker);
  if (start === -1) return null;
  
  const fromStart = gasHtml.slice(start + marker.length);
  // Find the closing unescaped quote before the next JSON key or object end
  // In GAS it is followed by \x22,\x22 or \x22}
  // Let's find index where string terminates: \x22,\x22 or \x22}
  const endMatch = fromStart.search(/\\x22,\s*\\x22|\\x22\s*}/);
  if (endMatch === -1) return null;
  
  let raw = fromStart.slice(0, endMatch);
  // Replace hex escapes
  raw = raw.replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  // Unescape JSON escapes
  try {
    return JSON.parse('"' + raw + '"');
  } catch (e) {
    // Fallback unescape
    return raw.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\\//g, '/');
  }
}

const extracted = extractUserHtml(html);
if (extracted) {
  console.log('Extracted length:', extracted.length);
  console.log('First 100 chars:', extracted.slice(0, 100));
  console.log('Last 100 chars:', extracted.slice(-100));
  fs.writeFileSync('scratch/clean_manual_extracted.html', extracted, 'utf8');
} else {
  console.log('Extraction returned null');
}
