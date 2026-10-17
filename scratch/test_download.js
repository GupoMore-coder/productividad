import fs from 'fs';
import { buildAnonymousDownloadUrl } from '../bibliotecario_engine/anonymous_proxy.cjs';

async function test() {
  const url = buildAnonymousDownloadUrl({ driveId: 'MANUAL_DE_USO_BIBLIOTECA_PDF', userPhone: '+573001234567' });
  console.log('Fetching:', url);
  const res = await fetch(url);
  const text = await res.text();
  console.log('Status:', res.status, 'Type:', res.headers.get('content-type'), 'Length:', text.length);
  fs.writeFileSync('scratch/download_token_resp.html', text, 'utf8');
}

test().catch(console.error);
