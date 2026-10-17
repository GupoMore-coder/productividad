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

async function simulateWorker(reqUrl, options = {}) {
  const url = new URL(reqUrl);
  let targetUrl;

  if (url.pathname.startsWith('/static/')) {
    targetUrl = new URL('https://script.google.com' + url.pathname + url.search);
  } else {
    targetUrl = new URL(BACKEND_URL);
    url.searchParams.forEach((val, key) => targetUrl.searchParams.set(key, val));
  }

  const fetchOptions = {
    method: options.method || 'GET',
    redirect: 'follow'
  };
  if (options.body) {
    fetchOptions.body = options.body;
    fetchOptions.headers = { 'Content-Type': 'application/json' };
  }

  const res = await fetch(targetUrl.toString(), fetchOptions);
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
  console.log('Testing Cloudflare Worker V3 on live backend...');
  const res = await simulateWorker('https://biblioteca-medica.ortopedia.workers.dev/?mode=buzon');
  console.log('Buzon Status:', res.status, 'Length:', res.body.length);
  console.log('Contains dropArea:', res.body.includes('dropArea'));
  console.log('Snippet:', res.body.slice(0, 300));
}

run().catch(console.error);
