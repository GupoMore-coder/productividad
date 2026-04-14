const { Client } = require('pg');

async function run() {
  const dbUrl = 'postgresql://postgres.grsaehpmaihrztusehkb:Jota72345510*@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log('✅ Connected to Postgres.');
    
    const res = await client.query("UPDATE tasks SET is_shared = false WHERE title ILIKE '%ICETEX%'");
    console.log(`✅ Fixed ${res.rowCount} task(s).`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
