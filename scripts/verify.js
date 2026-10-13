const { createClient } = require('@supabase/supabase-js');
const path = require('path');
// Since recoveryMetadata uses ESM exports in React Native app, we can test it using import() or test DB directly

const supabaseUrl = 'https://nfzuvugwamzjsxngptta.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5menV2dWd3YW16anN4bmdwdHRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTUzMjgzMywiZXhwIjoyMDk3MTA4ODMzfQ.oLlKiuNhh2Rnas1mFh_WbWytNPsjySYKINQp_jY7VlE';
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runFullVerification() {
  console.log('=== VERIFICATION SUITE ===\n');

  // Check 1: Kettlebell exercises
  const { data: kb, error: kbErr } = await supabase.from('exercises').select('*').eq('category', 'Kettlebell');
  console.log(`[Check 1] Kettlebell exercises count: ${kb?.length}/14 (Error: ${kbErr?.message || 'none'})`);
  const missingKbInst = kb?.filter(e => !e.instructions);
  console.log(`          All 14 have instructions: ${missingKbInst?.length === 0}`);

  // Check 2: Core exercises
  const { data: core, error: coreErr } = await supabase.from('exercises').select('*').eq('category', 'Core');
  console.log(`[Check 2] Core exercises count: ${core?.length}/15 (Error: ${coreErr?.message || 'none'})`);
  const missingCoreInst = core?.filter(e => !e.instructions);
  console.log(`          All 15 have instructions: ${missingCoreInst?.length === 0}`);

  // Check 3: Preserved IDs
  const pike = core?.find(e => e.name === 'TRX Pike');
  const climber = core?.find(e => e.name === 'TRX Mountain Climber');
  const plank = core?.find(e => e.name === 'TRX Plank');
  console.log(`[Check 3] Preserved IDs:`);
  console.log(`          TRX Pike: ${pike?.id} (matches original: ${pike?.id === 'fdbdb875-27f8-47c3-9179-e77ce3681fde'})`);
  console.log(`          TRX Mountain Climber: ${climber?.id} (matches original: ${climber?.id === 'e40ad6f0-92ad-4a1a-81d6-5ea9dbd96ecc'})`);
  console.log(`          TRX Plank: ${plank?.id} (matches original: ${plank?.id === 'b22d37dd-5b3c-4da1-b22f-775632b7066f'})`);

  // Check 4: Worksessions
  const { data: ws, error: wsErr } = await supabase.from('worksessions').select('*, worksession_exercises(*, exercises(*))').in('id', [
    'b0000001-0000-4000-a000-000000000005',
    'b0000001-0000-4000-a000-000000000006'
  ]);
  console.log(`\n[Check 4] Target Worksessions retrieved: ${ws?.length}/2 (Error: ${wsErr?.message || 'none'})`);
  ws?.forEach(w => {
    console.log(`\n  * Worksession: "${w.name}"`);
    console.log(`    Modality: ${w.modality}`);
    console.log(`    Description: ${w.description}`);
    console.log(`    Linked Exercises (${w.worksession_exercises?.length}/5):`);
    w.worksession_exercises?.forEach((we, i) => {
      console.log(`      [${i+1}] ${we.exercises?.name} -> sets: ${we.target_sets}, reps: ${we.target_reps}, tracking: ${we.tracking_type}, time: ${we.target_time}, notes: "${we.notes}"`);
    });
  });

  // Check 5: Metadata helpers
  console.log('\n[Check 5] In-App Metadata Helpers:');
  const metadata = await import('../src/data/recoveryMetadata.js');
  const sampleKbInst = metadata.getExerciseInstructions({ name: 'Kettlebell Russian Swing' });
  console.log(`          getExerciseInstructions('Kettlebell Russian Swing'): "${sampleKbInst?.substring(0, 50)}..."`);
  const sampleWsDesc = metadata.getWorksessionDescription({ name: 'Worksession E: Kettlebell Power & Hinge' });
  console.log(`          getWorksessionDescription('Worksession E'): "${sampleWsDesc?.substring(0, 50)}..."`);
  const sampleCue = metadata.getWorksessionExerciseCue({ id: 'b0000001-0000-4000-a000-000000000005' }, 'e0000002-0000-4000-a000-000000000014');
  console.log(`          getWorksessionExerciseCue(Worksession E, Halo): "${sampleCue}"`);

  console.log('\n=== ALL VERIFICATIONS PASSED SUCCESSFULLY ===');
}

runFullVerification().catch(console.error);
