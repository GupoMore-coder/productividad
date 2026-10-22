/**
 * CLOUDFLARE WORKER V3 (EDICIÓN DEFINITIVA - ZERO EVAL)
 * Biblioteca Médica Especializada de Cirugía Ortopédica y Traumatología
 * Dirección y Custodia: Gestor de Contenido
 * 
 * Blindaje y Funcionalidades:
 * 1. Anonimato Cardinal Total: Erradica por completo el banner de Google
 *    "This application was created by a Google Apps Script user".
 * 2. Cero Pantallas en Blanco: Extrae y sirve el HTML puro directamente en el
 *    navegador sin depender de iframes de Google ni cookies de terceros.
 * 3. 100% Compatible con el motor V8 de Cloudflare Workers: No utiliza eval()
 *    ni new Function(), eliminando el bloqueo de seguridad EvalError.
 * 4. Traducción Instantánea Operativa: Preserva el diccionario i18n íntegro.
 * 5. Soporte Bidireccional: Maneja GET (Manual, Buzón) y POST (Depósito de PDFs).
 */

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
    // 1. Transforma escapes hexadecimales \xHH en escapes Unicode estándar \u00HH
    const jsonCompatible = rawJsString.replace(/\\x([0-9a-fA-F]{2})/g, '\\u00$1');
    // 2. Decodifica la envoltura literal con el motor JSON nativo (sin eval/new Function)
    const jsonStr = JSON.parse('"' + jsonCompatible + '"');
    // 3. Parsea el objeto de Apps Script y extrae el HTML puro del manual o buzón
    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.userHtml) {
      return parsed.userHtml;
    }
  } catch (err) {}
  return null;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Preflight CORS para peticiones seguras
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // 1.5. Redireccionador de Enlaces Acortados Ultrarrápidos (Edge URL Shortener)
    if (url.pathname.startsWith('/r/')) {
      const code = url.pathname.slice(3).trim();
      let destUrl = null;

      if (code.startsWith('pm_')) {
        const pmid = code.slice(3);
        destUrl = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
      } else if (code.startsWith('doi_')) {
        const rawDoi = code.slice(4).replace(/_/g, '/');
        destUrl = `https://doi.org/${rawDoi}`;
      } else if (code.startsWith('ao_')) {
        const aoCode = code.slice(3);
        destUrl = `https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/${aoCode}`;
      } else if (code.startsWith('d_')) {
        const token = code.slice(2);
        destUrl = `${url.origin}/?token=${token}`;
      } else if (code.startsWith('u_')) {
        try {
          const rawB64 = code.slice(2).replace(/-/g, '+').replace(/_/g, '/');
          const decoded = atob(rawB64);
          if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
            destUrl = decoded;
          }
        } catch (e) {}
      } else if (code === 'm' || code === 'manual') {
        destUrl = url.origin;
      } else if (code === 'b' || code === 'buzon') {
        destUrl = `${url.origin}/?mode=buzon`;
      }

      if (destUrl) {
        return Response.redirect(destUrl, 302);
      }
    }

    // 2. Destino hacia el backend de Google Apps Script
    let targetUrl;
    if (url.pathname.startsWith('/static/')) {
      targetUrl = new URL('https://script.google.com' + url.pathname + url.search);
    } else {
      targetUrl = new URL(BACKEND_URL);
      url.searchParams.forEach((val, key) => targetUrl.searchParams.set(key, val));
    }

    // 3. Peticiones POST (Subida de archivos al Buzón Digital)
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

    // 4. Peticiones GET
    const res = await fetch(targetUrl.toString(), {
      method: 'GET',
      redirect: 'follow'
    });

    const contentType = res.headers.get('content-type') || '';

    // 5. Desempaquetado e Inyección de Anonimato Absoluto
    if (contentType.includes('text/html')) {
      const rawHtml = await res.text();
      const unwrapped = unwrapUserHtml(rawHtml);

      if (unwrapped) {
        // Enmascara cualquier enlace residual de Google hacia el dominio del proxy
        let finalHtml = unwrapped.replace(new RegExp(BACKEND_URL, 'g'), url.origin);
        finalHtml = finalHtml.replace('</head>', `<script>window.CANONICAL_APP_URL = "${url.origin}";</script></head>`);

        return new Response(finalHtml, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
            'X-Frame-Options': 'ALLOWALL'
          }
        });
      }

      return new Response(rawHtml, {
        status: res.status,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 6. Entrega directa de PDFs y binarios
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
