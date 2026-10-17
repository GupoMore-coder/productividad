const fs = require('fs');
const res = JSON.parse(fs.readFileSync('scratch/emc_audit_results.json', 'utf8'));

const planned = [];
for (const item of res) {
  let f = item.file;
  let year = item.year || '2015'; // default fallback if unparseable
  
  let author = 'EMC';
  let title = f.replace(/\.pdf$/i, '');
  
  const m = f.match(/^(?:S-F\s*-\s*)?(?:null\s*-\s*)?(?:S-A\s*-\s*)?([^-]+)\s*-\s*(.+)\.pdf$/i);
  if (m) {
    author = m[1].trim();
    title = m[2].trim();
  } else {
    title = f.replace(/\.pdf$/i, '').replace(/^(?:S-F\s*-\s*)/i, '').trim();
  }
  
  if (author.toLowerCase() === 's-a' || author.toLowerCase() === 'null') author = 'EMC';
  if (title.toLowerCase().startsWith('estudio de rodilla')) {
    // If generic title, look at snippet
    title = 'Tratamiento y patologia articular en ortopedia';
  }
  
  let std = `${year} - ${author} - ${title}.pdf`;
  // Sanitize illegal characters
  std = std.replace(/[/\\:*?"<>|]/g, '').replace(/\s+/g, ' ');
  planned.push({ original: f, planned: std, year, code: item.code });
}

console.log('Total planned for EMC:', planned.length);
planned.slice(0, 15).forEach(p => console.log(' - ' + p.original + ' \n   -> ' + p.planned));
fs.writeFileSync('scratch/emc_planned_renames.json', JSON.stringify(planned, null, 2));
