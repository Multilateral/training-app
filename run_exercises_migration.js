const fs = require('fs');
const { Client } = require('pg');

async function runMigration() {
  const sql = fs.readFileSync('migration_exercises.sql', 'utf8');

  // If you have your Supabase DB password or pooler connection string, set it here or as DATABASE_URL
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:23121990Singularity!@db.nfzuvugwamzjsxngptta.supabase.co:5432/postgres';

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected! Executing migration_exercises.sql...');
    await client.query(sql);
    console.log('Migration executed successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
    console.log('\n--> Tip: You can execute migration_exercises.sql directly in your Supabase Dashboard:');
    console.log('    1. Open https://supabase.com/dashboard/project/nfzuvugwamzjsxngptta/sql');
    console.log('    2. Paste the contents of migration_exercises.sql');
    console.log('    3. Click "Run"');
  } finally {
    await client.end().catch(() => {});
  }
}

runMigration();
