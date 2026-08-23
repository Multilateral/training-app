const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nfzuvugwamzjsxngptta.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5menV2dWd3YW16anN4bmdwdHRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTUzMjgzMywiZXhwIjoyMDk3MTA4ODMzfQ.oLlKiuNhh2Rnas1mFh_WbWytNPsjySYKINQp_jY7VlE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  const { data, error } = await supabase.from('worksession_exercises').select('*').limit(1);
  console.log('worksession_exercises columns:', data && data.length > 0 ? Object.keys(data[0]) : (error || 'No data'));
  
  // Actually, wait. Let's do an empty insert or something to see the error, or query the postgres schema if we have privileges.
  // But we have service role key, so we can query postgres schema? Probably not directly through REST API without a specific view, 
  // but we can query `worksession_exercises` with no rows if `data` is empty.
}

checkColumns();
