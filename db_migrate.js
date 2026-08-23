const { Client } = require('pg');
const dns = require('dns');

// Force Node.js to use IPv6 if possible
dns.setDefaultResultOrder('ipv6first');

const connectionString = 'postgresql://postgres:23121990Singularity!@db.nfzuvugwamzjsxngptta.supabase.co:5432/postgres';

async function runMigration() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    console.log('Connected to DB. Adding columns...');
    
    // Add tracking_type and target_time
    await client.query(`
      ALTER TABLE worksession_exercises 
      ADD COLUMN IF NOT EXISTS tracking_type text DEFAULT 'reps',
      ADD COLUMN IF NOT EXISTS target_time integer;
    `);
    
    console.log('Successfully added columns!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

runMigration();
