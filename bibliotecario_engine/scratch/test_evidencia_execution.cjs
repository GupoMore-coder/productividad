// Test PubMed API querying in real-time
async function testPubMed() {
  const spanishQuery = 'tratamiento de lesiones radiales de meniscos';
  const englishQuery = 'treatment of radial meniscus tears';
  
  console.log('--- 1. Testing Spanish Query against PubMed ---');
  const esUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(spanishQuery)}&sort=pub_date&retmax=3&retmode=json`;
  const resEs = await fetch(esUrl);
  const dataEs = await resEs.json();
  const esIds = (dataEs.esearchresult && dataEs.esearchresult.idlist) || [];
  console.log(`Spanish IDs found (${esIds.length}):`, esIds);

  console.log('\n--- 2. Testing English Query against PubMed ---');
  const enUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(englishQuery)}&sort=pub_date&retmax=3&retmode=json`;
  const resEn = await fetch(enUrl);
  const dataEn = await resEn.json();
  const enIds = (dataEn.esearchresult && dataEn.esearchresult.idlist) || [];
  console.log(`English IDs found (${enIds.length}):`, enIds);

  if (enIds.length > 0) {
    console.log('\n--- 3. Fetching Article Summaries for English IDs ---');
    const sumUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${enIds.join(',')}&retmode=json`;
    const resSum = await fetch(sumUrl);
    const dataSum = await resSum.json();
    
    const articles = [];
    for (const id of enIds) {
      const item = dataSum.result[id];
      if (item) {
        let doi = '';
        if (item.articleids) {
          for (const aid of item.articleids) {
            if (aid.idtype === 'doi') {
              doi = aid.value;
              break;
            }
          }
        }
        const firstAuthor = (item.authors && item.authors[0]) ? item.authors[0].name : 'Grupo de Estudio';
        articles.push({
          pmid: id,
          title: item.title,
          author: firstAuthor,
          journal: item.source || 'Journal Ortopédico',
          pubdate: item.pubdate || 'Reciente',
          doi: doi,
          pubmedUrl: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
          doiUrl: doi ? `https://doi.org/${doi}` : `https://pubmed.ncbi.nlm.nih.gov/${id}/`
        });
      }
    }
    console.log('Articles retrieved:', JSON.stringify(articles, null, 2));
  }
}

testPubMed().catch(console.error);
