import fs from 'fs';

const html = fs.readFileSync('scratch/gas_response.html', 'utf8');

function unwrapUserHtml(responseHtml) {
  const marker = '\\x22userHtml\\x22:\\x22';
  const startIdx = responseHtml.indexOf(marker);
  if (startIdx === -1) return null;
  
  const fromStart = responseHtml.slice(startIdx + marker.length);
  const endMatch = fromStart.match(/\\x22,\s*\\x22|\\x22\s*}/);
  if (!endMatch) return null;
  
  let raw = fromStart.slice(0, endMatch.index);
  
  // 1. Replace hex escapes \xHH
  raw = raw.replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  
  // In raw, double-escaped characters exist: \\n, \\", \\/, \\\\
  // Let's replace \\n with \n, \\r with \r, \\t with \t, \\" with ", \\/ with /
  let clean = raw
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\\\r/g, '\r')
    .replace(/\\r/g, '\r')
    .replace(/\\\\t/g, '\t')
    .replace(/\\t/g, '\t')
    .replace(/\\\\"/g, '"')
    .replace(/\\"/g, '"')
    .replace(/\\\\\//g, '/')
    .replace(/\\\//g, '/')
    .replace(/\\\\/g, '\\')
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, u) => String.fromCharCode(parseInt(u, 16)));
    
  return clean;
}

const clean = unwrapUserHtml(html);
console.log('Result clean length:', clean ? clean.length : 0);
if (clean) {
  fs.writeFileSync('scratch/clean_unwrapped_final.html', clean, 'utf8');
  console.log('Clean starts with:');
  console.log(clean.slice(0, 200));
  console.log('Clean ends with:');
  console.log(clean.slice(-200));
  console.log('Contains DOCTYPE:', clean.includes('<!DOCTYPE html>'));
  console.log('Contains closing html:', clean.includes('</html>'));
  console.log('Contains i18n dictionary:', clean.includes('I18N_DICTIONARY'));
}
