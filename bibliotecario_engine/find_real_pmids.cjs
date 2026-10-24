const https = require('https');

function searchPubmed(term) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(term);
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encoded}&retmode=json&retmax=5`;
    https.get(url, { headers: { 'User-Agent': 'AntigravityVerifier/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.esearchresult?.idlist || []);
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', reject);
  });
}

function getSummary(id) {
  return new Promise((resolve, reject) => {
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${id}&retmode=json`;
    https.get(url, { headers: { 'User-Agent': 'AntigravityVerifier/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.result?.[id] || null);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

const targetCitations = [
  // Superpoder 1: Scores
  { key: 'MESS', query: 'Johansen K Objective criteria accurately predict amputation following lower extremity trauma' },
  { key: 'GUSTILO', query: 'Gustilo RB Anderson JT Prevention of infection in the treatment of one thousand and twenty-five open fractures' },
  { key: 'EAST_OPEN_FRACTURES', query: 'Hoff WS Practice management guidelines for the management of open fractures' },
  { key: 'CAPRINI', query: 'Caprini JA Thrombosis risk assessment as a guide to quality patient care' },
  { key: 'AAOS_VTE_GUIDELINE', query: 'Preventing Venous Thromboembolic Disease in Patients Undergoing Elective Hip and Knee Arthroplasty AAOS guideline' },
  { key: 'GARDEN_1961', query: 'Garden RS Low-angle fixation in fractures of the femoral neck 1961' },
  { key: 'PAUWELS_1935', query: 'Pauwels F Der Schenkelhalsbruch ein mechanisches Problem' },
  { key: 'TLICS_VACCARO', query: 'Vaccaro AR A new classification of thoracolumbar injuries importance of injury morphology' },
  { key: 'GARTLAND_1959', query: 'Gartland JJ Management of supracondylar fractures of the humerus in children' },
  { key: 'SCHATZKER_1979', query: 'Schatzker J The tibial plateau fracture Clin Orthop Relat Res 1979' },

  // Superpoder 2: Preop Copilot
  { key: 'TIP_APEX_DISTANCE', query: 'Baumgaertner MR The value of the tip-apex distance in predicting failure of fixation of peritrochanteric fractures' },
  { key: 'KATES_HIP_FRACTURE', query: 'Kates SL A guide to improving the care of patients with fragility fractures' },
  { key: 'ROBERTS_REVERSE_OBLIQUITY', query: 'Roberts JW Cephalomedullary Nailing for Reverse Obliquity Fractures' },
  { key: 'LUO_THREE_COLUMN', query: 'Luo CF Three-column fixation for complex tibial plateau fractures' },
  { key: 'EGOL_BICONDYLAR', query: 'Egol KA Staged management of high-energy bicondylar tibial plateau fractures' },
  { key: 'PRAT_FABREGAT_TIBIAL_PLATEAU', query: 'Prat-Fabregat S Treatment strategy for tibial plateau fractures open review' },
  { key: 'OWSLEY_PROXIMAL_HUMERUS', query: 'Owsley KC Failure of locked plate fixation of the proximal humerus' },
  { key: 'THANASAS_PROXIMAL_HUMERUS', query: 'Thanasas C Treatment of proximal humerus fractures with locking plates meta-analysis' },
  { key: 'KRAPPINGER_PROXIMAL_HUMERUS', query: 'Krappinger D Predicting failure after surgical fixation of proximal humerus fractures' },

  // Superpoder 3: Implantes
  { key: 'DCS_AO', query: 'AO dynamic condylar screw distal femur fractures' },
  { key: 'PHILOS_AO', query: 'PHILOS plate proximal humerus fracture fixation' },

  // Superpoder 5: Open Access Real Papers
  { key: 'OA_PELVIS_2024', query: 'pelvic ring fracture surgical treatment open access 2023 2024' },
  { key: 'OA_TIBIA_PLATEAU', query: 'tibial plateau fracture fixation dual plating open access' }
];

async function run() {
  console.log(`Buscando las ${targetCitations.length} citas reales en PubMed...\n`);
  for (const item of targetCitations) {
    const ids = await searchPubmed(item.query);
    if (ids.length > 0) {
      const bestId = ids[0];
      const sum = await getSummary(bestId);
      console.log(`✅ [${item.key}] -> PMID: ${bestId}`);
      console.log(`   Título: "${sum?.title}"`);
      console.log(`   Autores: ${sum?.sortfirstauthor}`);
      console.log(`   Fuente: ${sum?.source} (${sum?.pubdate})`);
      console.log(`   DOI: ${sum?.articleids?.find(x => x.idtype === 'doi')?.value || 'N/A'}\n`);
    } else {
      console.log(`⚠️ [${item.key}] -> No se encontraron resultados para query: "${item.query}"\n`);
    }
  }
}

run().catch(console.error);
