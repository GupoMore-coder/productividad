const { spawnSync } = require('child_process');
const path = require('path');

const suites = [
  { name: 'Paso 1 (Fase 0): Heurísticas Quirúrgicas y Autoaprendizaje', script: 'test_surgical_heuristics.cjs' },
  { name: 'Paso 3 (Fase 2): Proxy de Descarga Anónima y Cero-Fuga', script: 'test_anonymous_proxy.cjs' },
  { name: 'Paso 4 (Fase 3): Ticketing, Intermediación y Cierre de Ciclo', script: 'test_ticketing.cjs' },
  { name: 'Paso 5 (Fase 4): Gobernanza, Onboarding y Boletín Dominical', script: 'test_governance.cjs' },
  { name: 'Fase 3 & 4 (E2E): Flujo Conversacional Completo de WhatsApp', script: 'test_whatsapp_flow.cjs' },
  { name: 'Fase 5 (Security): Batería de Ciberseguridad y Pentesting IDS', script: 'test_cybersecurity_pentest.cjs' }
];

console.log('╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║   🚀 EJECUCIÓN GLOBAL DE PRUEBAS DE INTEGRACIÓN: AGENTE BIBLIOTECARIO      ║');
console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

let totalSuites = suites.length;
let passedSuites = 0;

for (const s of suites) {
  const p = path.join(__dirname, s.script);
  console.log(`▶ Iniciando: ${s.name}...`);
  const res = spawnSync('node', [p], { stdio: 'inherit' });
  if (res.status === 0) {
    passedSuites++;
  } else {
    console.error(`❌ Falló la suite: ${s.name}`);
  }
  console.log('\n--------------------------------------------------------------------\n');
}

console.log(`🏁 RESUMEN GENERAL: ${passedSuites} de ${totalSuites} suites completadas con éxito.`);
if (passedSuites === totalSuites) {
  console.log('🌟 TODOS LOS SUBSISTEMAS OPERAN AL 100% DE EFICIENCIA Y CUMPLIMIENTO.');
  process.exit(0);
} else {
  process.exit(1);
}
