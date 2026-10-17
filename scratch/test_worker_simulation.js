import fs from 'fs';
import { buildAnonymousDownloadUrl } from '../bibliotecario_engine/anonymous_proxy.cjs';

const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbxvKxFuTtTpcXXo3XgdAo1WAiIl4WhYlgd2ldPA2ePfC7Mmlo7VDu03BOhL9ybWL_Nv/exec';

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
  
  // 2. Unescape JSON string
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

async function testWorkerFlow(incomingUrl) {
  const url = new URL(incomingUrl);
  let targetUrl;

  if (url.pathname.startsWith('/static/')) {
    targetUrl = new URL('https://script.google.com' + url.pathname + url.search);
  } else {
    targetUrl = new URL(BACKEND_URL);
    url.searchParams.forEach((val, key) => targetUrl.searchParams.set(key, val));
  }

  const res = await fetch(targetUrl.toString(), { redirect: 'follow' });
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('text/html')) {
    const rawText = await res.text();
    const unwrapped = unwrapUserHtml(rawText);
    if (unwrapped) {
      const finalHtml = unwrapped.replace(new RegExp(BACKEND_URL, 'g'), url.origin);
      return { status: 200, contentType: 'text/html; charset=utf-8', body: finalHtml };
    }
    return { status: res.status, contentType, body: rawText };
  }

  return { status: res.status, contentType, body: await res.text() };
}

async function run() {
  const tokenUrl = buildAnonymousDownloadUrl({ driveId: 'MANUAL_DE_USO_BIBLIOTECA_PDF', userPhone: '+573001234567', baseUrl: 'https://biblioteca-medica.ortopedia.workers.dev' });
  console.log('Testing Token URL:', tokenUrl);
  const t3 = await testWorkerFlow(tokenUrl);
  console.log('T3 Status:', t3.status, 'ContentType:', t3.contentType, 'Body Length:', t3.body.length);
  console.log('Snippet:', t3.body.slice(0, 200));
}

run().catch(console.error);
