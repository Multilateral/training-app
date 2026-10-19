const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres.nfzuvugwamzjsxngptta:Multilateral19901223!@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';

async function executeSql(sqlOrFile) {
  let sql = sqlOrFile;
  if (fs.existsSync(sqlOrFile)) {
    sql = fs.readFileSync(sqlOrFile, 'utf8');
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    const result = await client.query(sql);
    await client.end();
    return result;
  } catch (err) {
    if (client) await client.end().catch(() => {});
    throw err;
  }
}

if (require.main === module) {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: node scripts/run_sql.js "<SQL_QUERY>" or path/to/file.sql');
    process.exit(1);
  }

  executeSql(arg)
    .then((res) => {
      if (Array.isArray(res)) {
        res.forEach((r, idx) => console.log(`Result ${idx + 1}:`, r.rows || r.command));
      } else {
        console.log('Result:', res.rows || res.command);
      }
    })
    .catch((err) => {
      console.error('SQL Execution Error:', err.message);
      process.exit(1);
    });
}

module.exports = { executeSql };
