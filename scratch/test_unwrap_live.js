import fetch from 'node-fetch';

const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbxvKxFuTtTpcXXo3XgdAo1WAiIl4WhYlgd2ldPA2ePfC7Mmlo7VDu03BOhL9ybWL_Nv/exec';

function unwrapUserHtml(gasHtml) {
  const marker = 'goog.script.init("';
  const start = gasHtml.indexOf(marker);
  if (start === -1) return null;

  const contentStart = start + marker.length;
  const endIdx = gasHtml.indexOf('", "", undefined', contentStart);
  if (endIdx === -1) return null;

  try {
    const rawJsString = gasHtml.slice(contentStart, endIdx);
    // Convert JS hex escapes \xHH to JSON unicode escapes \u00HH
    const jsonCompatible = rawJsString.replace(/\\x([0-9a-fA-F]{2})/g, '\\u00$1');
    // Step 1: Decode outer string literal via pure JSON.parse (NO eval, NO new Function)
    const jsonStr = JSON.parse('"' + jsonCompatible + '"');
    // Step 2: Parse inner JSON payload
    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.userHtml) {
      return parsed.userHtml;
    }
  } catch (err) {
    console.error('unwrap error:', err.message);
  }
  return null;
}

async function run() {
  console.log('Testing Buzón Unwrapping...');
  const resBuzon = await fetch(BACKEND_URL + '?mode=buzon', { redirect: 'follow' });
  const htmlBuzon = await resBuzon.text();
  const unwrappedBuzon = unwrapUserHtml(htmlBuzon);
  console.log('Buzon unwrapped?', unwrappedBuzon !== null);
  console.log('Buzon length:', unwrappedBuzon ? unwrappedBuzon.length : 0);
  console.log('Contains dropArea:', unwrappedBuzon ? unwrappedBuzon.includes('dropArea') : false);
  console.log('Contains Google banner:', unwrappedBuzon ? unwrappedBuzon.includes('This application was created') : false);

  console.log('\nTesting Manual Unwrapping...');
  const resManual = await fetch(BACKEND_URL, { redirect: 'follow' });
  const htmlManual = await resManual.text();
  const unwrappedManual = unwrapUserHtml(htmlManual);
  console.log('Manual unwrapped?', unwrappedManual !== null);
  console.log('Manual length:', unwrappedManual ? unwrappedManual.length : 0);
  console.log('Contains switchManualLanguage:', unwrappedManual ? unwrappedManual.includes('switchManualLanguage') : false);
  console.log('Contains Google banner:', unwrappedManual ? unwrappedManual.includes('This application was created') : false);
}

run();
