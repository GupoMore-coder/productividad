// migrate.cjs — Ejecuta migraciones de Supabase
// USO: DB_CONNECTION_STRING="postgresql://..." node migrate.cjs <migration-file>
// La DB_CONNECTION_STRING se obtiene de:
//   1. Variable de entorno (producción en Vercel/CI)
//   2. Archivo .env.local (desarrollo local)

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const dbUrl = process.env.DB_CONNECTION_STRING || process.env.SUPABASE_DB_URL;

  if (!dbUrl) {
    console.error('❌ ERROR: Variable DB_CONNECTION_STRING no encontrada.');
    console.error('');
    console.error('Para ejecutar migraciones:');
    console.error('  1. Obtén la connection string de: Supabase > Project Settings > Database > Connection string (URI)');
    console.error('  2. Ejecuta:');
    console.error('     $env:DB_CONNECTION_STRING="postgresql://..." node migrate.cjs <archivo>');
    console.error('');
    console.error('⚠️  NUNCA hardcodees la connection string en este archivo.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL.');

    const migrationFile = process.argv[2];
    if (!migrationFile) {
      console.log('📁 Archivos de migración disponibles:');
      const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
      files.forEach(f => console.log(`   - ${f}`));
      console.log('');
      console.log('Uso: node migrate.cjs <nombre-del-archivo.sql>');
      await client.end();
      return;
    }

    const sqlPath = path.join(__dirname, 'supabase', 'migrations', migrationFile);
    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ Archivo no encontrado: ${sqlPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`⏳ Ejecutando migración: ${migrationFile}...`);

    await client.query(sql);
    console.log(`✅ Migración ejecutada exitosamente: ${migrationFile}`);
  } catch (err) {
    console.error('❌ Error de migración:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
