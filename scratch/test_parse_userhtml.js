import fs from 'fs';

const html = fs.readFileSync('scratch/gas_response.html', 'utf8');

// Let's find where userHtml is defined
const marker = '\\x22userHtml\\x22:\\x22';
const idx = html.indexOf(marker);
if (idx !== -1) {
  // Unescape all \xHH in the whole goog.script.init block first!
  const blockStart = html.indexOf('goog.script.init(');
  const blockEnd = html.indexOf('</script>', blockStart);
  const block = html.slice(blockStart, blockEnd);
  
  // Replace all \xHH in block
  const unescapedBlock = block.replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  
  // Now inside unescapedBlock, find "userHtml":"
  const uMarker = '"userHtml":"';
  const uStart = unescapedBlock.indexOf(uMarker);
  console.log('uStart:', uStart);
  if (uStart !== -1) {
    // Let's extract the string until the next unescaped quote followed by ,"ncc" or similar key
    const rest = unescapedBlock.slice(uStart + uMarker.length);
    // Find the ending quote of userHtml: quote followed by ," or }
    const endMatch = rest.match(/(?<!\\)("(?:,\s*"|}))/);
    console.log('End match index:', endMatch ? endMatch.index : -1);
    if (endMatch) {
      const rawUserHtml = rest.slice(0, endMatch.index);
      // Now parse JSON string
      const fullJsonStr = '"' + rawUserHtml + '"';
      try {
        const finalHtml = JSON.parse(fullJsonStr);
        fs.writeFileSync('scratch/perfect_manual.html', finalHtml, 'utf8');
        console.log('PERFECT EXTRACTION SUCCESS! Length:', finalHtml.length);
        console.log('Snippet of extracted HTML:');
        console.log(finalHtml.slice(0, 300));
      } catch (err) {
        console.log('JSON parse error:', err.message);
        // Manual unescape
        const manualUnescaped = rawUserHtml
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
          .replace(/\\\//g, '/');
        fs.writeFileSync('scratch/perfect_manual.html', manualUnescaped, 'utf8');
        console.log('MANUAL UNESCAPE SUCCESS! Length:', manualUnescaped.length);
        console.log(manualUnescaped.slice(0, 300));
      }
    }
  }
}
