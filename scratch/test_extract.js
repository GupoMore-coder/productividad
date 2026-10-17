import fs from 'fs';

const html = fs.readFileSync('scratch/gas_response.html', 'utf8');

const initMatch = html.match(/goog\.script\.init\("((?:[^"\\]|\\.)*)"\)/);
if (initMatch) {
  // Unescape \xHH
  const rawStr = initMatch[1].replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  const parsed = JSON.parse(rawStr);
  console.log('Keys in parsed:', Object.keys(parsed));
  if (parsed.userHtml) {
    fs.writeFileSync('scratch/unwrapped_manual.html', parsed.userHtml, 'utf8');
    console.log('Unwrapped manual saved, length:', parsed.userHtml.length);
  }
} else {
  console.log('Could not find goog.script.init');
}
