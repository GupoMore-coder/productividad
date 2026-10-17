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

// Cloudflare Worker handler implementation
const worker = {
  async fetch(request) {
    const url = new URL(request.url);

    // Preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    let targetUrl;
    if (url.pathname.startsWith('/static/')) {
      targetUrl = new URL('https://script.google.com' + url.pathname + url.search);
    } else {
      targetUrl = new URL(BACKEND_URL);
      url.searchParams.forEach((val, key) => targetUrl.searchParams.set(key, val));
    }

    if (request.method === 'POST') {
      const bodyText = await request.text();
      const gasRes = await fetch(targetUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyText,
        redirect: 'follow'
      });
      const resText = await gasRes.text();
      return new Response(resText, {
        status: gasRes.status,
        headers: {
          'Content-Type': gasRes.headers.get('content-type') || 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // GET requests
    const res = await fetch(targetUrl.toString(), {
      method: 'GET',
      redirect: 'follow'
    });

    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
      const rawHtml = await res.text();
      const unwrapped = unwrapUserHtml(rawHtml);

      if (unwrapped) {
        let finalHtml = unwrapped.replace(new RegExp(BACKEND_URL, 'g'), url.origin);
        finalHtml = finalHtml.replace('</head>', `<script>window.CANONICAL_APP_URL = "${url.origin}";</script></head>`);

        return new Response(finalHtml, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      return new Response(rawHtml, {
        status: res.status,
        headers: { 'Content-Type': contentType }
      });
    }

    // Binary / non-HTML assets (PDF download, icons, etc.)
    return new Response(res.body, {
      status: res.status,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': res.headers.get('content-disposition') || '',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

async function testWorker() {
  console.log('Testing Worker with Manual URL...');
  const req1 = {
    url: 'https://biblioteca-medica.ortopedia.workers.dev/',
    method: 'GET',
    text: async () => ''
  };
  const res1 = await worker.fetch(req1);
  const text1 = await res1.text();
  console.log('Manual Status:', res1.status, 'HTML length:', text1.length);
  console.log('Contains switchManualLanguage:', text1.includes('switchManualLanguage'));
  console.log('Contains I18N_DICTIONARY:', text1.includes('I18N_DICTIONARY'));

  // Test script syntax in unwrapped HTML
  const scripts = text1.match(/<script[\s\S]*?<\/script>/gi) || [];
  let scriptErrors = 0;
  scripts.forEach((s, idx) => {
    const code = s.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
    try {
      new Function(code);
    } catch (e) {
      console.error(`Script ${idx} Error:`, e.message);
      scriptErrors++;
    }
  });
  console.log(`Script syntax validation: ${scripts.length - scriptErrors}/${scripts.length} passed.`);

  console.log('\nTesting Worker with Buzon URL (?mode=buzon)...');
  const req2 = {
    url: 'https://biblioteca-medica.ortopedia.workers.dev/?mode=buzon',
    method: 'GET',
    text: async () => ''
  };
  const res2 = await worker.fetch(req2);
  const text2 = await res2.text();
  console.log('Buzon Status:', res2.status, 'HTML length:', text2.length);
  console.log('Contains dropArea:', text2.includes('id="dropArea"'));
  console.log('Dropzone is LABEL:', text2.includes('<label class="dropzone" id="dropArea" for="fileInput">'));
  console.log('FileInput exists:', text2.includes('id="fileInput"'));
}

testWorker().catch(console.error);
