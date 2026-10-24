const fs = require('fs');
const path = require('path');
const https = require('https');

// Helper para hacer GET https con promesa
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'AntigravityAudit/1.0 (mailto:audit@biblioteca-ortopedia.org)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: e.message, raw: data });
        }
      });
    }).on('error', err => reject(err));
  });
}

async function auditPmids() {
  const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js') || f.endsWith('.cjs'));
  const pmidSet = new Set();
  const fileRefs = {};

  for (const f of files) {
    const content = fs.readFileSync(path.join(__dirname, f), 'utf8');
    const matches = [...content.matchAll(/pm_(\d+)/g), ...content.matchAll(/pmid:\s*['"](\d+)['"]/gi)];
    for (const m of matches) {
      const pmid = m[1];
      pmidSet.add(pmid);
      if (!fileRefs[pmid]) fileRefs[pmid] = new Set();
      fileRefs[pmid].add(f);
    }
  }

  const pmidList = Array.from(pmidSet);
  console.log(`Verificando ${pmidList.length} PMIDs en la API oficial de PubMed (NCBI)...`);

  // Dividimos en batches de 20 para e-utilities
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmidList.join(',')}&retmode=json`;
  const result = await fetchJson(url);

  if (!result.result) {
    console.error('Error consultando NCBI:', result);
    return;
  }

  console.log('\n================================================================================');
  console.log('RESULTADOS DE AUDITORÍA PUBMED (NCBI E-UTILITIES):');
  console.log('================================================================================\n');

  for (const pmid of pmidList) {
    const item = result.result[pmid];
    const filesUsing = Array.from(fileRefs[pmid] || []).join(', ');
    if (item && item.title) {
      console.log(`PMID: ${pmid}`);
      console.log(`  Archivos: [${filesUsing}]`);
      console.log(`  Título Real NCBI: "${item.title}"`);
      console.log(`  Revista: ${item.source} (${item.pubdate})`);
      console.log(`  URL Real: https://pubmed.ncbi.nlm.nih.gov/${pmid}/\n`);
    } else {
      console.log(`❌ PMID: ${pmid} NO ENCONTRADO EN PUBMED! Archivos: [${filesUsing}]\n`);
    }
  }
}

auditPmids().catch(console.error);
