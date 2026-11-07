const fs = require('fs');
let code = fs.readFileSync('bibliotecario_engine/GoogleAppsScript_SheetsManager.js', 'utf8');

code += `
const testText = 'Dame 3 artículos sobre fractura de húmero proximal';
console.log('isVulgarMessage test:', isVulgarMessage(testText));
const lower = testText.toLowerCase();
for (let i = 0; i < INAPPROPRIATE_TERMS.length; i++) {
  const term = INAPPROPRIATE_TERMS[i];
  const regex = new RegExp('\\\\b' + term + '\\\\b', 'i');
  if (regex.test(lower)) {
    console.log('TERM MATCHED:', term);
  }
}
`;

eval(code);

