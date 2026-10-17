const tests = [
  'requiero evidencia para el tratamiento de lesiones radiales de meniscos',
  'EVIDENCIA: requiero evidencia para el tratamiento de lesiones radiales de meniscos',
  'EVIDENCIA: tratamiento de lesiones de menisco',
  'necesito evidencia sobre manguito rotador',
  'evidencia en artroscopia de rodilla',
  '¿cuál es la evidencia de reemplazo total de cadera?',
  'pubmed: anterior cruciate ligament reconstruction',
  'evidencia: fractura de radio distal',
  'evidencia para manguito rotador'
];

function extractEvidenceQuery(text) {
  let lower = text.toLowerCase();
  const isEvidenceIntent = 
    /^(?:evidencia|pubmed)\b/i.test(lower) || 
    /\b(?:requiero|necesito|buscar|dame|muestra|consultar|ver|hay|cuál es la|cual es la|existe)?\s*evidencia\s*(?:de|para|sobre|en)?\b/i.test(lower) ||
    lower.includes('evidencia') ||
    lower.includes('pubmed');

  if (!isEvidenceIntent) return null;

  let query = text.replace(/^[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+/, '').trim();
  let prev;
  do {
    prev = query;
    query = query
      .replace(/^(?:evidencia|pubmed)\s*:?\s*/i, '')
      .replace(/^(?:requiero|necesito|buscar|dame|muestra|consultar|ver|hay|cuál es la|cual es la|existe)\s+(?:evidencia|pubmed)?\s*:?\s*/i, '')
      .replace(/^(?:de|para|sobre|en)\s+/i, '')
      .replace(/^(?:el|la|los|las|un|una)\s+/i, '')
      .replace(/[?¿!¡]+$/, '')
      .trim();
  } while (query !== prev);

  return query;
}

tests.forEach(t => {
  const q = extractEvidenceQuery(t);
  console.log(`INPUT: "${t}"\n -> EXTRACTED: "${q}"\n`);
});
