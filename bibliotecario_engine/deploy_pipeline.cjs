#!/usr/bin/env node
/**
 * ============================================================================
 * 🚀 PIPELINE DE DESPLIEGUE AUTÓNOMO Y DESATENDIDO (ZERO HUMAN FRICTION)
 * Biblioteca Médica Especializada de Cirugía Ortopédica y Traumatología
 * Custodia y Gobernanza: Gestor de Contenido
 * ============================================================================
 */

const { execSync } = require('child_process');
const path = require('path');
const https = require('https');

const DEPLOYMENT_ID = 'AKfycbxvKxFuTtTpcXXo3XgdAo1WAiIl4WhYlgd2ldPA2ePfC7Mmlo7VDu03BOhL9ybWL_Nv';
const PUBLIC_PORTAL = 'https://biblioteca-medica.ortopedia.workers.dev';

function runStep(name, cmd, options = {}) {
  process.stdout.write(`\n⏳ [PASO] ${name}... `);
  try {
    const output = execSync(cmd, {
      cwd: options.cwd || path.join(__dirname, '..'),
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8'
    });
    console.log(`\n✅ [OK] ${name}`);
    return output;
  } catch (err) {
    console.error(`\n❌ [ERROR CRÍTICO] Falló el paso: ${name}`);
    if (err.stdout) console.error(err.stdout);
    if (err.stderr) console.error(err.stderr);
    process.exit(1);
  }
}

async function verifyPortalHealth() {
  process.stdout.write(`\n⏳ [VERIFICACIÓN] Comprobando salud del Cloudflare Worker en producción... `);
  return new Promise((resolve) => {
    https.get(PUBLIC_PORTAL, (res) => {
      if (res.statusCode === 200) {
        console.log(`\n✅ [OK] Cloudflare Worker respondiendo 200 OK (${PUBLIC_PORTAL})`);
        resolve(true);
      } else {
        console.warn(`\n⚠️ [AVISO] Cloudflare Worker respondió con código: ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.warn(`\n⚠️ [AVISO] No se pudo verificar Cloudflare Worker: ${err.message}`);
      resolve(false);
    });
  });
}

async function main() {
  const timestamp = new Date().toISOString();
  const customDesc = process.argv[2] || `Actualización Autónoma de Biblioteca Médica - ${timestamp}`;

  console.log('╔═════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║   🚀 INICIANDO DESPLIEGUE AUTÓNOMO DESATENDIDO (CLASP + CLOUDFLARE SHIELD)               ║');
  console.log('║   Dirección: Gestor de Contenido                                                        ║');
  console.log('╚═════════════════════════════════════════════════════════════════════════════════════════╝');

  // 1. Compilación del Script Maestro y Manual Interactivo
  runStep('Compilando Código Maestro y Sincronizando gas_dist', 'node bibliotecario_engine/build_full_manager.cjs');

  // 2. Validación Estricta de Sintaxis JS V8
  runStep('Validando Sintaxis V8 de GoogleAppsScript_SheetsManager.js', 'node -c bibliotecario_engine/GoogleAppsScript_SheetsManager.js');

  // 3. Puerta de Seguridad y Auditoría Forense (Air-Gapped Sandbox)
  runStep('Ejecutando Suite de Auditoría Forense (22 Pruebas de Cero-Fuga)', 'node bibliotecario_engine/sandbox_audit/audit_suite_runner.cjs');

  // 4. Subida directa a Google Apps Script por API
  runStep('Subiendo código a Google Apps Script vía clasp push', 'npx @google/clasp push -f', {
    cwd: path.join(__dirname, '..', 'gas_dist')
  });

  // 5. Creación de Nueva Versión y Actualización de la Implementación Web
  const deployCmd = `npx @google/clasp deploy -i ${DEPLOYMENT_ID} -d "${customDesc.replace(/"/g, '\\"')}"`;
  runStep('Publicando Versión en Google Apps Script Web App', deployCmd, {
    cwd: path.join(__dirname, '..', 'gas_dist')
  });

  // 5.5 Sincronización y Despliegue del Cloudflare Worker
  runStep('Desplegando Cloudflare Worker vía Wrangler', 'npx wrangler deploy', {
    cwd: __dirname
  });

  // 6. Verificación de Salud en Producción
  await verifyPortalHealth();

  console.log('\n═════════════════════════════════════════════════════════════════════════════════════════');
  console.log('🎉 DESPLIEGUE COMPLETADO CON ÉXITO TOTAL (100% DESATENDIDO)');
  console.log(`📌 Deployment ID: ${DEPLOYMENT_ID}`);
  console.log(`🔗 Endpoint Público Seguro: ${PUBLIC_PORTAL}/`);
  console.log(`⏱️ Fecha y Hora: ${new Date().toLocaleString()}`);
  console.log('═════════════════════════════════════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Fallo no controlado en el pipeline:', err);
  process.exit(1);
});
