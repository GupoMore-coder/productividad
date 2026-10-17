const fs = require('fs');
const content = fs.readFileSync('fase1_google_sheets_core.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('=SUMIF') || l.includes('=SUM(') || l.includes('=IFERROR(SUM')) {
    console.log((idx + 1) + ': ' + l.trim());
  }
});
