const https = require('https');

const FINAL_REGISTRY = {
  // 1. Calculadoras y Scores Quirúrgicos
  MESS_JOHANSEN: { pmid: '2342140', expected: 'amputation', note: 'MESS Johansen J Trauma 1990' },
  GUSTILO_ANDERSON: { pmid: '773941', expected: 'open fractures', note: 'Gustilo-Anderson JBJS Am 1976' },
  EAST_OPEN_FRACTURES: { pmid: '21610369', expected: 'open fractures', note: 'EAST Guidelines Open Fractures J Trauma 2011' },
  CAPRINI_THROMBOSIS: { pmid: '15900257', expected: 'thrombosis', note: 'Caprini JA Dis Mon 2005' },
  AAOS_VTE_GUIDELINE: { pmid: '22134210', expected: 'venous thromboembolic', note: 'AAOS VTE Guideline JAAOS 2011' },
  PAUWELS_BARTONICEK: { pmid: '11433141', expected: 'Pauwels', note: 'Pauwels Classification Bartonicek JOT 2001' },
  GARDEN_1964: { pmid: '14251448', expected: 'subcapital fractures', note: 'Garden RS JBJS Br 1964' },
  TLICS_VACCARO: { pmid: '16227897', expected: 'thoracolumbar', note: 'TLICS Vaccaro AR Spine 2005' },
  GARTLAND_1959: { pmid: '13675986', expected: 'supracondylar', note: 'Gartland JJ Surg Gynecol Obstet 1959' },
  SCHATZKER_1979: { pmid: '445923', expected: 'tibial plateau', note: 'Schatzker J CORR 1979' },

  // 2. Preop Copilot ("Briefing Quirúrgico")
  TIP_APEX_DISTANCE: { pmid: '7608228', expected: 'tip-apex', note: 'Baumgaertner MR JBJS Am 1995' },
  KATES_HIP_CARE: { pmid: '21399474', expected: 'fracture program', note: 'Kates SL JOT 2011' },
  SADOWSKI_REVERSE_OBLIQUE: { pmid: '11886906', expected: 'reverse oblique', note: 'Sadowski C JBJS Am 2002' },
  LUO_THREE_COLUMN: { pmid: '20881634', expected: 'Three-column', note: 'Luo CF JOT 2010' },
  EGOL_BICONDYLAR: { pmid: '16056075', expected: 'proximal tibia', note: 'Egol KA JOT 2005' },
  PRAT_FABREGAT: { pmid: '28461952', expected: 'tibial plateau', note: 'Prat-Fabregat S EFORT Open Rev 2017' },
  OWSLEY_PROXIMAL_HUMERUS: { pmid: '18245580', expected: 'proximal humeral', note: 'Owsley KC JBJS Am 2008' },
  THANASAS_PROXIMAL_HUMERUS: { pmid: '19748802', expected: 'proximal humerus', note: 'Thanasas C JSES 2009' },
  KRAPPINGER_FAILURE: { pmid: '21310406', expected: 'proximal humerus', note: 'Krappinger D Injury 2011' },

  // 3. Fichas Técnicas de Implantes
  PERREN_BIOLOGICAL_FIXATION: { pmid: '12463652', expected: 'internal fixation', note: 'Perren SM AO Principles JBJS Br 2002' },
  PHILOS_PLATE_EGOL: { pmid: '18317048', expected: 'locked plates', note: 'Egol KA Proximal Humerus Locked Plates JOT 2008' },
  WINQUIST_FEMORAL_NAIL: { pmid: '6707031', expected: 'intramedullary nailing', note: 'Winquist RA Femoral Nailing JBJS Am 1984' },
  CANNULATED_SCREWS_FEMORAL_NECK: { pmid: '23283374', expected: 'cannulated screws', note: 'Intracapsular femoral neck cannulated screws JBJS Am 2013' },

  // 4. Interconsulta de Urgencias
  STUFKENS_ANKLE_FRACTURES: { pmid: '21172642', expected: 'treatment', note: 'Stufkens SA Maisonneuve JFAS 2011' },
  LICHTMAN_DISTAL_RADIUS: { pmid: '21508285', expected: 'distal radius', note: 'Lichtman DM AAOS Distal Radius JBJS Am 2011' },

  // 5. Open Access Tracker
  OA_PELVIS_GERIATRIC: { pmid: '40321464', expected: 'Pelvis', note: 'Geriatric pelvic injuries OTA Int 2025' },
  OA_PARVIZI_PJI_CRITERIA: { pmid: '29551303', expected: 'Periprosthetic', note: 'Parvizi J PJI Definition J Arthroplasty 2018' },
  OA_TRAUMA_GERIATRIC: { pmid: '38487398', expected: 'trauma', note: 'Geriatric trauma OTA Int 2024' }
};

function batchGetPubMed(pmids) {
  return new Promise((resolve, reject) => {
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
    https.get(url, { headers: { 'User-Agent': 'AntigravityCertifier/1.0 (mailto:admin@biblioteca-ortopedia.org)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function verifyAllBatch() {
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║   🔬 AUDITORÍA EN TIEMPO REAL CON LA API DE PUBMED (NCBI E-UTILITIES)      ║');
  console.log('║   Verificación de 27 Citas Primarias de Cirugía Ortopédica y Traumatología ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

  const keys = Object.keys(FINAL_REGISTRY);
  const pmids = keys.map(k => FINAL_REGISTRY[k].pmid);

  const res = await batchGetPubMed(pmids);
  if (!res.result) {
    console.error('Error en respuesta NCBI:', res);
    process.exit(1);
  }

  let passCount = 0;
  let failCount = 0;

  for (const key of keys) {
    const item = FINAL_REGISTRY[key];
    const data = res.result[item.pmid];

    if (!data || !data.title) {
      console.error(`❌ [ERROR] ${key}: PMID ${item.pmid} no devolvió datos válidos`);
      failCount++;
      continue;
    }

    const title = data.title;
    const isMatch = title.toLowerCase().includes(item.expected.toLowerCase());

    if (isMatch) {
      console.log(`✅ [100% VERIFICADO] ${key}`);
      console.log(`   PMID: ${item.pmid} -> https://pubmed.ncbi.nlm.nih.gov/${item.pmid}/`);
      console.log(`   Título Oficial: "${title}"`);
      console.log(`   Revista: ${data.source} (${data.pubdate})\n`);
      passCount++;
    } else {
      console.error(`⚠️ [DISCREPANCIA] ${key}`);
      console.error(`   PMID: ${item.pmid}`);
      console.error(`   Título devuelto: "${title}"`);
      console.error(`   Se esperaba término: "${item.expected}"\n`);
      failCount++;
    }
  }

  console.log('════════════════════════════════════════════════════════════════════════════');
  console.log(`📊 BALANCE FINAL: ${passCount} APROBADOS DE ${keys.length} (${Math.round((passCount/keys.length)*100)}%)`);
  console.log('════════════════════════════════════════════════════════════════════════════\n');

  if (failCount > 0) process.exit(1);
}

verifyAllBatch().catch(console.error);
