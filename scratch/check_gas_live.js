import fetch from 'node-fetch';
import fs from 'fs';

async function check() {
  const url = 'https://script.google.com/macros/s/AKfycbxvKxFuTtTpcXXo3XgdAo1WAiIl4WhYlgd2ldPA2ePfC7Mmlo7VDu03BOhL9ybWL_Nv/exec';
  const res = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Length:', text.length);
  console.log('Includes goog.script.init:', text.includes('goog.script.init('));
  console.log('Includes This application was created:', text.includes('This application was created'));
  
  fs.writeFileSync('scratch/live_fetch.html', text, 'utf8');

  // Let's test the unwrap
  const marker = 'goog.script.init("';
  const start = text.indexOf(marker);
  console.log('start index:', start);
  if (start !== -1) {
    const contentStart = start + marker.length;
    const endIdx = text.indexOf('", "", undefined', contentStart);
    console.log('end index:', endIdx);
    if (endIdx !== -1) {
      try {
        const rawJsString = text.slice(contentStart, endIdx);
        console.log('rawJsString length:', rawJsString.length);
        const jsonStr = (new Function('return "' + rawJsString + '"'))();
        console.log('jsonStr length:', jsonStr.length);
        const parsed = JSON.parse(jsonStr);
        console.log('Parsed ok? userHtml length:', parsed.userHtml ? parsed.userHtml.length : 'none');
      } catch (e) {
        console.log('Unwrap Error:', e);
      }
    }
  }
}

check();
