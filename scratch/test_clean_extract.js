import fs from 'fs';

const html = fs.readFileSync('scratch/gas_response.html', 'utf8');

const startMarker = '\\x22userHtml\\x22:\\x22';
const startIdx = html.indexOf(startMarker);
if (startIdx !== -1) {
  const contentStart = startIdx + startMarker.length;
  // Look for end of string in JSON: \x22,\x22 or \x22}
  const endMatch = html.slice(contentStart).search(/\\x22(?:,|})/);
  console.log('Found userHtml at:', startIdx, 'Length:', endMatch);
  if (endMatch !== -1) {
    let rawEscaped = html.slice(contentStart, contentStart + endMatch);
    // Replace hex escapes \xHH
    let cleanHtml = rawEscaped.replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    // Unescape JSON string escapes like \\n, \\", etc.
    cleanHtml = cleanHtml.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\\//g, '/');
    fs.writeFileSync('scratch/unwrapped_clean.html', cleanHtml, 'utf8');
    console.log('Successfully unwrapped! Length:', cleanHtml.length);
    console.log('Starts with:', cleanHtml.slice(0, 150));
    console.log('Ends with:', cleanHtml.slice(-150));
  }
}
