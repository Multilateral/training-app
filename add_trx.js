const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nfzuvugwamzjsxngptta.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5menV2dWd3YW16anN4bmdwdHRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTUzMjgzMywiZXhwIjoyMDk3MTA4ODMzfQ.oLlKiuNhh2Rnas1mFh_WbWytNPsjySYKINQp_jY7VlE';

const supabase = createClient(supabaseUrl, supabaseKey);

const trxExercises = [
  { name: 'TRX Row', category: 'Back' },
  { name: 'TRX Chest Press', category: 'Chest' },
  { name: 'TRX Squat', category: 'Legs' },
  { name: 'TRX Pistol Squat', category: 'Legs' },
  { name: 'TRX Lunge', category: 'Legs' },
  { name: 'TRX Y-Fly', category: 'Back' },
  { name: 'TRX T-Fly', category: 'Back' },
  { name: 'TRX Bicep Curl', category: 'Arms' },
  { name: 'TRX Tricep Press', category: 'Arms' },
  { name: 'TRX Hamstring Curl', category: 'Legs' },
  { name: 'TRX Plank', category: 'Core' },
  { name: 'TRX Pike', category: 'Core' },
  { name: 'TRX Mountain Climber', category: 'Core' },
  { name: 'TRX Atomic Push-up', category: 'Chest' },
  { name: 'TRX Inverted Row', category: 'Back' },
  { name: 'TRX Power Pull', category: 'Back' },
  { name: 'TRX Suspended Lunge', category: 'Legs' },
  { name: 'TRX Alligator', category: 'Back' },
];

async function addTRXExercises() {
  // Get existing exercises
  const { data: existing } = await supabase.from('exercises').select('name');
  const existingNames = new Set(existing?.map(e => e.name.toLowerCase()) || []);

  const toInsert = trxExercises.filter(ex => !existingNames.has(ex.name.toLowerCase())).map(ex => ({
    name: ex.name,
    category: ex.category,
    // assuming default exercises have no user_id (null) or we use the service role
    // we don't set user_id if we want it to be global (depending on how RLS is set)
  }));

  if (toInsert.length === 0) {
    console.log('All TRX exercises already exist in the database.');
    return;
  }

  const { data, error } = await supabase.from('exercises').insert(toInsert);
  
  if (error) {
    console.error('Error inserting TRX exercises:', error);
  } else {
    console.log(`Successfully added ${toInsert.length} TRX exercises!`);
  }
}

addTRXExercises();
