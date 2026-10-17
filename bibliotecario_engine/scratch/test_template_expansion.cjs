const template = `
function extractEvidenceQuery(text) {
  if (!text) return '';
  let query = String(text).replace(/^[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+/, '').trim();
  let prev;
  do {
    prev = query;
    query = query
      .replace(/^(?:evidencia|pubmed)\\s*:?\\s*/i, '')
      .replace(/^(?:requiero|necesito|buscar|dame|muestra|consultar|ver|hay|cuál es la|cual es la|existe)\\s+(?:evidencia|pubmed)?\\s*:?\\s*/i, '')
      .replace(/^(?:de|para|sobre|en)\\s+/i, '')
      .replace(/^(?:el|la|los|las|un|una)\\s+/i, '')
      .replace(/[?¿!¡]+$/, '')
      .trim();
  } while (query !== prev);
  return query;
}
`;
console.log(template);
