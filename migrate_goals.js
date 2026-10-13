const { Client } = require('pg');
const fs = require('fs');
const dns = require('dns');

dns.setDefaultResultOrder('ipv6first');

const connectionString = 'postgresql://postgres:23121990Singularity!@db.nfzuvugwamzjsxngptta.supabase.co:5432/postgres';

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL database.');
    const sql = fs.readFileSync(__dirname + '/migration_goals.sql', 'utf8');
    await client.query(sql);
    console.log('Successfully applied user_goals migration!');
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    await client.end();
  }
}

run();
