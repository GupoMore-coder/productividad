const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const dbUrl = 'postgresql://postgres.grsaehpmaihrztusehkb:Jota72345510*@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
  
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Postgres.');

    const sql = fs.readFileSync('supabase/migrations/20260417_add_multiple_images_tasks.sql', 'utf8');
    console.log('⏳ Executing migration...');
    
    await client.query(sql);
    console.log('✅ Migration executed effectively!');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  } finally {
    await client.end();
  }
}

run();
