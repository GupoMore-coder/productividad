const fs = require('fs');
const path = require('path');

// Load catalog
const catalogPath = path.join(__dirname, '../bibliotecario_engine/knowledge/inventario_maestro.csv');
const lines = fs.readFileSync(catalogPath, 'utf8').split('\n');

const data = [];
for (let i = 0; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  const parts = lines[i].split('","');
  if (parts.length >= 9) {
    data.push([
      parts[0].replace(/^"/, ''),
      parts[1],
      parts[2],
      parts[3],
      parts[4],
      parts[5],
      parts[6],
      parts[7],
      parts[8]
    ]);
  }
}

console.log(`Loaded ${data.length - 1} records from catalog.`);

// 1. NLU PARSER
const NUMBER_WORDS = {
  'un': 1, 'una': 1, 'uno': 1,
  'dos': 2,
  'tres': 3,
  'cuatro': 4,
  'cinco': 5,
  'seis': 6,
  'siete': 7,
  'ocho': 8,
  'nueve': 9,
  'diez': 10
};

const UMBRELLA_TERMS = new Map([
  ['ateneo', { label: 'Ateneos y Conferencias Clínicas', type: 'ateneo', count: 285 }],
  ['ateneos', { label: 'Ateneos y Conferencias Clínicas', type: 'ateneo', count: 285 }],
  ['presentacion', { label: 'Presentaciones Clínicas', type: 'ateneo', count: 285 }],
  ['presentaciones', { label: 'Presentaciones Clínicas', type: 'ateneo', count: 285 }],
  ['cadera', { label: 'Cadera y Pelvis', type: 'area', category: 'Cadera y Pelvis' }],
  ['pelvis', { label: 'Pelvis y Acetábulo', type: 'area', category: 'Cadera y Pelvis' }],
  ['columna', { label: 'Columna Vertebral', type: 'area', category: 'Columna' }],
  ['rodilla', { label: 'Rodilla y Tibia', type: 'area', category: 'Rodilla y Tibia' }],
  ['hombro', { label: 'Hombro y Codo', type: 'area', category: 'Hombro' }],
  ['codo', { label: 'Codo', type: 'area', category: 'Codo' }],
  ['mano', { label: 'Mano y Muñeca', type: 'area', category: 'Mano' }],
  ['pie', { label: 'Pie y Tobillo', type: 'area', category: 'Pie y Tobillo' }],
  ['tobillo', { label: 'Tobillo', type: 'area', category: 'Pie y Tobillo' }],
  ['trauma', { label: 'Trauma y Fracturas', type: 'area', category: 'Temas generales' }],
  ['infeccion', { label: 'Infecciones y Osteomielitis', type: 'area', category: 'Infeccioso' }],
  ['infecciones', { label: 'Infecciones y Osteomielitis', type: 'area', category: 'Infeccioso' }]
]);

function stripAccents(str) {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function parseQueryNLU(rawText) {
  let text = (rawText || '').trim();
  let textNorm = stripAccents(text).toLowerCase();
  
  // A. Detect quantity
  let requestedCount = null;
  const numDigitMatch = textNorm.match(/\b(?:dame|quiero|necesito|ver|buscar|mostrar|pasa|pasame|enviar|envia)\s+(\d+)\b/i) ||
                        textNorm.match(/^(\d+)\s+(?:articulos|libros|documentos|presentaciones|ateneos|guias)\b/i);
  if (numDigitMatch) {
    requestedCount = parseInt(numDigitMatch[1], 10);
  } else {
    for (const [w, n] of Object.entries(NUMBER_WORDS)) {
      const wMatch = textNorm.match(new RegExp(`\\b(?:dame|quiero|necesito|ver|buscar|mostrar|pasa|pasame|enviar|envia)\\s+${w}\\b`, 'i')) ||
                     textNorm.match(new RegExp(`^${w}\\s+(?:articulos|libros|documentos|presentaciones|ateneos|guias)\\b`, 'i'));
      if (wMatch) {
        requestedCount = n;
        break;
      }
    }
  }

  // B. Detect docType preference
  let docTypePref = null;
  if (/\b(ateneo|ateneos|presentacion|presentaciones|conferencia|conferencias|diapositiva|diapositivas)\b/i.test(textNorm)) {
    docTypePref = 'Presentación de Ateneo Clínico';
  } else if (/\b(libro|libros|tratado|tratados|atlas|manual|manuales)\b/i.test(textNorm)) {
    docTypePref = 'Tratado / Atlas Quirúrgico';
  } else if (/\b(guia|guias|protocolo|protocolos|consenso|consensos|tecnica|tecnicas)\b/i.test(textNorm)) {
    docTypePref = 'Guía de Práctica Clínica / Protocolo';
  } else if (/\b(articulo|articulos|paper|papers|estudio|estudios|revision|revisiones)\b/i.test(textNorm)) {
    docTypePref = 'Artículo Original';
  }

  // C. Sanitize core clinical query
  let clean = textNorm;
  // Remove conversational greetings and verbs
  clean = clean.replace(/^(?:hola|buenas|buenos dias|buenas tardes|por favor|porfa|saludos|deme|dame|pasa|pasame|paseme|pase|envia|enviar|mandame|mande|quiero|necesito|buscar|busca|quisiera|mostrar|muestrame)\s+/i, '');
  // Remove quantity + noun prefix ("3 articulos sobre", "un libro de")
  clean = clean.replace(/^(?:\d+|uno|una|un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(?:articulos?|libros?|documentos?|presentaciones|ateneos?|guias?|papers?|estudios?)?\s*(?:sobre|de|para|con|en)?\s*/i, '');
  // Remove generic lead words ("articulos sobre", "libros de")
  clean = clean.replace(/^(?:articulos?|libros?|documentos?|presentaciones|ateneos?|guias?)\s+(?:sobre|de|para|con|en)\s+/i, '');
  clean = clean.trim();

  // D. Check if it is an umbrella query
  const isUmbrella = UMBRELLA_TERMS.has(clean) || (clean.split(/\s+/).length === 1 && UMBRELLA_TERMS.has(clean));
  const umbrellaInfo = isUmbrella ? UMBRELLA_TERMS.get(clean) : null;

  return {
    rawText,
    cleanQuery: clean,
    requestedCount,
    docTypePref,
    isUmbrella,
    umbrellaInfo
  };
}

// 2. CLINICAL SCORING ENGINE
function searchCatalogScored(nlu, dataRows) {
  const q = nlu.cleanQuery.toLowerCase();
  const tokens = q.split(/\s+/).filter(t => t.length >= 3);
  if (tokens.length === 0 && q.length < 3) return [];

  const scoredResults = [];

  for (let i = 1; i < dataRows.length; i++) {
    const row = dataRows[i];
    const id = row[0];
    const driveId = row[1];
    const year = parseInt(row[2], 10) || 2020;
    const author = String(row[3] || '');
    const title = String(row[4] || '');
    const category = String(row[5] || '');
    const docType = String(row[6] || '');
    const aoClass = String(row[7] || '');
    const mesh = String(row[8] || '');

    const fullTitleLower = title.toLowerCase();
    const fullTextLower = (row[2] + ' ' + author + ' ' + title + ' ' + category + ' ' + aoClass + ' ' + mesh).toLowerCase();

    // Check basic inclusion
    let matches = false;
    let matchCount = 0;
    for (const t of tokens) {
      if (fullTextLower.includes(t)) {
        matchCount++;
      }
    }
    if (tokens.length === 1 && matchCount === 1) matches = true;
    else if (tokens.length > 1 && matchCount >= Math.ceil(tokens.length * 0.6)) matches = true;
    if (fullTitleLower.includes(q)) matches = true;

    if (!matches) continue;

    let score = 0;

    // A. Title Matches
    if (fullTitleLower === q) {
      score += 80;
    } else if (fullTitleLower.includes(q)) {
      score += 60;
    } else {
      score += (matchCount / tokens.length) * 40;
    }

    // B. Title starts with search query
    if (fullTitleLower.startsWith(q)) {
      score += 15;
    }

    // C. Document Type Authority
    if (nlu.docTypePref) {
      if (docType.toLowerCase().includes(nlu.docTypePref.toLowerCase())) {
        score += 50;
      }
    } else {
      // General authority weighting
      if (/campbell|rockwood|green|insall|ao foundation|ao principles|hoppenfeld|tachdjian/i.test(author + ' ' + title)) {
        score += 35; // Major textbook
      } else if (docType.includes('Guía') || docType.includes('Protocolo') || /consensus|guideline/i.test(title)) {
        score += 30; // Guidelines
      } else if (docType.includes('Tratado') || docType.includes('Atlas')) {
        score += 25; // Book/Atlas
      } else if (docType.includes('Ateneo')) {
        score += 20; // Presentation
      } else if (/systematic review|meta-analysis|revisi[oó]n sistem[aá]tica/i.test(title)) {
        score += 18; // Systematic review
      } else {
        score += 10; // Original article
      }
    }

    // D. Category / AO Match
    if (aoClass && aoClass !== 'N/A' && (fullTextLower.includes(q) || tokens.some(t => aoClass.toLowerCase().includes(t)))) {
      score += 20;
    }
    if (tokens.some(t => category.toLowerCase().includes(t))) {
      score += 15;
    }

    // E. Recency Bonus (up to +8 pts)
    if (year >= 2024) score += 8;
    else if (year >= 2020) score += 5;
    else if (year >= 2015) score += 3;

    // F. Negative Penalty for Tangential / Narrow Comorbidities when looking for general topic
    // E.g., searching for "fractura de cadera" should not favor Plavix or rare drug studies over core treatment
    if (/plavix|clopidogrel|warfarin|heparina|anticoagula|cost-effectiveness|prehospital|analgesia en ancianos/i.test(title)) {
      if (!/plavix|anticoagul|farmaco|medicamento|analgesia/i.test(q)) {
        score -= 25; // De-prioritize narrow pharmacological sub-studies
      }
    }

    scoredResults.push({
      id,
      driveId,
      year,
      author,
      title,
      category,
      docType,
      aoClass,
      mesh,
      score: Math.round(score)
    });
  }

  // Sort descending by score
  scoredResults.sort((a, b) => b.score - a.score);
  return scoredResults;
}

// TEST CASES
console.log('\n================ TEST CASES ================');

// Case 1: "Ateneo"
console.log('\n--- CASO 1: "Ateneo" ---');
const nlu1 = parseQueryNLU("Ateneo");
console.log('NLU Output:', nlu1);
if (nlu1.isUmbrella) {
  console.log('✅ ACTIVÓ GUIA DE DESAMBIGUACIÓN INTERACTIVA (No entregó 1 archivo ciego)');
}

// Case 2: "Fractura de cadera"
console.log('\n--- CASO 2: "Fractura de cadera" ---');
const nlu2 = parseQueryNLU("Fractura de cadera");
const res2 = searchCatalogScored(nlu2, data);
console.log(`Total encontrados: ${res2.length}`);
console.log('Top 3 calificados con nuevo Scoring:');
res2.slice(0, 3).forEach((r, idx) => {
  console.log(` #${idx+1} [Score: ${r.score}] [${r.year}] ${r.title} (${r.author}) - ${r.docType}`);
});

// Case 3: "Dame 3 artículos sobre fractura de húmero proximal"
console.log('\n--- CASO 3: "Dame 3 artículos sobre fractura de húmero proximal" ---');
const nlu3 = parseQueryNLU("Dame 3 artículos sobre fractura de húmero proximal");
console.log('NLU Output:', {
  cleanQuery: nlu3.cleanQuery,
  requestedCount: nlu3.requestedCount,
  docTypePref: nlu3.docTypePref
});
const res3 = searchCatalogScored(nlu3, data);
console.log(`Total encontrados: ${res3.length}`);
const countToDeliver = nlu3.requestedCount || 1;
console.log(`Entregando exactamente los mejores ${countToDeliver} documentos solicitados:`);
res3.slice(0, countToDeliver).forEach((r, idx) => {
  console.log(` #${idx+1} [Score: ${r.score}] [${r.year}] ${r.title} (${r.author}) - ${r.docType}`);
});
