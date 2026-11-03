const fs = require('fs');
const path = require('path');

const ROOT_DIR = 'H:\\Mi unidad\\Información Ortopedia';
const AUDIT_FILE = path.join(__dirname, 'actionable_text_audit.json');
const OUTPUT_PLAN = path.join(__dirname, 'resolved_orphans_plan.json');

function sanitizeFilename(str) {
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/[:*?"<>|\\/]/g, ' - ')
    .replace(/\s+/g, ' ')
    .replace(/\s+-\s+-+/g, ' - ')
    .trim()
    .replace(/[. ]+$/, '');
}

async function resolveAll() {
  const data = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
  const withDoi = data.filter(d => d.doi);
  console.log(`Iniciando resolución CrossRef para ${withDoi.length} artículos con DOI...`);

  const plan = [];

  for (let i = 0; i < withDoi.length; i++) {
    const item = withDoi[i];
    const cleanDoi = item.doi.trim();

    try {
      const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`, {
        headers: { 'User-Agent': 'AntigravityMedicalLibrary/1.0 (mailto:academic@library.org)' }
      });

      if (res.ok) {
        const json = await res.json();
        const m = json.message;
        
        // Determinar año
        let year = null;
        if (m.issued && m.issued['date-parts'] && m.issued['date-parts'][0][0]) {
          year = m.issued['date-parts'][0][0];
        } else if (m.created && m.created['date-parts'] && m.created['date-parts'][0][0]) {
          year = m.created['date-parts'][0][0];
        } else if (m['published-print'] && m['published-print']['date-parts']) {
          year = m['published-print']['date-parts'][0][0];
        }

        // Determinar autor
        let author = 'Anónimo';
        if (m.author && m.author.length > 0) {
          const first = m.author[0];
          author = first.family || first.name || 'Anónimo';
        }

        // Determinar título
        let rawTitle = m.title && m.title.length > 0 ? m.title[0] : 'Artículo Científico';
        let cleanTitle = sanitizeFilename(rawTitle);
        if (cleanTitle.length > 90) cleanTitle = cleanTitle.substring(0, 90).trim();

        if (year && author && cleanTitle) {
          const newFilename = `${year} - ${author} - ${cleanTitle}.pdf`;
          const oldPath = path.join(ROOT_DIR, item.folder, item.filename);
          const newPath = path.join(ROOT_DIR, item.folder, newFilename);

          if (item.filename !== newFilename) {
            plan.push({
              folder: item.folder,
              oldFilename: item.filename,
              newFilename: newFilename,
              oldPath: oldPath,
              newPath: newPath,
              doi: cleanDoi,
              confidence: 'HIGH_DOI'
            });
            console.log(`[${i+1}/${withDoi.length}] ✓ ${newFilename.substring(0, 75)}`);
          }
        }
      } else {
        console.log(`[${i+1}/${withDoi.length}] ✗ DOI no encontrado en CrossRef: ${cleanDoi}`);
      }
    } catch (err) {
      console.log(`[${i+1}/${withDoi.length}] ✗ Error con DOI ${cleanDoi}: ${err.message}`);
    }

    // Delay breve para respetar rate limit de CrossRef (100ms)
    await new Promise(r => setTimeout(r, 120));
  }

  console.log(`\n========================================`);
  console.log(`Plan completado: ${plan.length} artículos resueltos con DOI.`);
  fs.writeFileSync(OUTPUT_PLAN, JSON.stringify(plan, null, 2));
}

resolveAll().catch(console.error);

