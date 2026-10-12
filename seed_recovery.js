const fs = require('fs');
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nfzuvugwamzjsxngptta.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5menV2dWd3YW16anN4bmdwdHRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTUzMjgzMywiZXhwIjoyMDk3MTA4ODMzfQ.oLlKiuNhh2Rnas1mFh_WbWytNPsjySYKINQp_jY7VlE';
const supabase = createClient(supabaseUrl, serviceRoleKey);

const recoveryExercises = [
  {
    id: 'e0000001-0000-4000-a000-000000000001',
    name: 'Terminal Knee Extension (TKE)',
    category: 'Recovery',
    muscle_group: 'Knee Rehab',
    equipment: 'Resistance Band',
    difficulty: 'Beginner',
    mechanics: 'Isometric / Concentric',
    instructions: 'Anchor a resistance band at knee height behind the knee. Step back for tension. Start with knee slightly bent, then contract quad to fully lock knee straight against the band. Pause 2 seconds; return slowly.'
  },
  {
    id: 'e0000001-0000-4000-a000-000000000002',
    name: 'Spanish Squat',
    category: 'Recovery',
    muscle_group: 'Knee Rehab',
    equipment: 'Resistance Band',
    difficulty: 'Intermediate',
    mechanics: 'Isometric',
    instructions: 'Loop a heavy strap/band behind both knees anchored to a rig. Lean back keeping shins vertical. Squat to ~70-90° knee flexion. Hold position isometrically without letting knees travel forward.'
  },
  {
    id: 'e0000001-0000-4000-a000-000000000003',
    name: 'Peterson Step-Up',
    category: 'Recovery',
    muscle_group: 'Knee Rehab',
    equipment: 'Plyo Box',
    difficulty: 'Intermediate',
    mechanics: 'Concentric',
    instructions: 'Stand on a small elevation on the ball of the active foot with heel lifted. Slowly lower the trailing heel straight down to lightly touch floor, then drive through the active midfoot/forefoot to return.'
  },
  {
    id: 'e0000001-0000-4000-a000-000000000004',
    name: 'Glute Bridge',
    category: 'Recovery',
    muscle_group: 'Knee Rehab',
    equipment: 'Floor Mat',
    difficulty: 'Beginner',
    mechanics: 'Concentric',
    instructions: 'Lie on back, knees bent at 90°, feet flat. Drive through heels to lift hips until thighs and torso align. Squeeze glutes for 2 seconds at the peak without overarching lower back.'
  },
  {
    id: 'e0000001-0000-4000-a000-000000000005',
    name: 'Nordic Hamstring Curl',
    category: 'Recovery',
    muscle_group: 'Knee Rehab',
    equipment: 'Bodyweight',
    difficulty: 'Advanced',
    mechanics: 'Eccentric',
    instructions: 'Kneel tall with feet anchored securely. Keep hips extended in line with torso. Lower chest toward the floor as slowly as possible using hamstrings to brake; catch with hands and push back up.'
  },
  {
    id: 'e0000001-0000-4000-a000-000000000006',
    name: 'McGill Curl-up',
    category: 'Recovery',
    muscle_group: 'Lower Back Pain',
    equipment: 'Floor Mat',
    difficulty: 'Beginner',
    mechanics: 'Isometric',
    instructions: 'Lie face up with hands under lumbar spine to preserve natural curve. One knee bent, one leg straight. Elevate only head and upper shoulders slightly off floor without flexing neck. Hold 10 seconds.'
  },
  {
    id: 'e0000001-0000-4000-a000-000000000007',
    name: 'Bird-Dog',
    category: 'Recovery',
    muscle_group: 'Lower Back Pain',
    equipment: 'Floor Mat',
    difficulty: 'Beginner',
    mechanics: 'Core Stability',
    instructions: 'On all fours, spine neutral. Simultaneously extend opposite arm forward and leg straight back until parallel to floor. Hold 10 seconds without rotating hips or arching back; return with control.'
  },
  {
    id: 'e0000001-0000-4000-a000-000000000008',
    name: 'Side Plank',
    category: 'Recovery',
    muscle_group: 'Lower Back Pain',
    equipment: 'Floor Mat',
    difficulty: 'Intermediate',
    mechanics: 'Isometric',
    instructions: 'Lie on side resting on forearm elbow directly below shoulder. Stack feet and elevate hips until body forms a straight line from ankles to ears. Hold steady without sagging.'
  },
  {
    id: 'e0000001-0000-4000-a000-000000000009',
    name: 'Cat-Cow Stretch',
    category: 'Recovery',
    muscle_group: 'Lower Back Pain',
    equipment: 'Floor Mat',
    difficulty: 'Beginner',
    mechanics: 'Mobility',
    instructions: 'On all fours, alternate smoothly between extending spine (belly down, chest forward) and flexing spine (tucking pelvis, rounding upper back toward ceiling). Move slowly within pain-free range.'
  },
  {
    id: 'e0000001-0000-4000-a000-000000000010',
    name: 'Pallof Press',
    category: 'Recovery',
    muscle_group: 'Lower Back Pain',
    equipment: 'Resistance Band',
    difficulty: 'Intermediate',
    mechanics: 'Isometric',
    instructions: 'Stand perpendicular to cable or resistance band anchored at chest level. Hold handle at sternum with both hands, press straight forward resisting torso rotation, hold 2 seconds, and return to chest.'
  },
  {
    id: 'e0000001-0000-4000-a000-000000000011',
    name: 'Scapular Wall Slides',
    category: 'Recovery',
    muscle_group: 'Shoulder Rehab',
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    mechanics: 'Mobility',
    instructions: 'Stand with back, head, and elbows/wrists flush against a wall in a goalpost position. Slide forearms upward while maintaining constant contact with wall and ribcage pulled down.'
  },
  {
    id: 'e0000001-0000-4000-a000-000000000012',
    name: 'Banded External Rotation',
    category: 'Recovery',
    muscle_group: 'Shoulder Rehab',
    equipment: 'Resistance Band',
    difficulty: 'Beginner',
    mechanics: 'Concentric / Eccentric',
    instructions: 'Keep working elbow pinned at 90° against side (use towel roll if helpful). Hold band across torso and rotate forearm outward away from abdomen. Control the eccentric return.'
  },
  {
    id: 'e0000001-0000-4000-a000-000000000013',
    name: 'Face Pulls',
    category: 'Recovery',
    muscle_group: 'Shoulder Rehab',
    equipment: 'Resistance Band',
    difficulty: 'Intermediate',
    mechanics: 'Concentric',
    instructions: 'Set cable/band at eye level. Pull rope attachment toward bridge of nose while externally rotating hands so thumbs point backward. Squeeze shoulder blades together for 2 seconds.'
  },
  {
    id: 'e0000001-0000-4000-a000-000000000014',
    name: 'Thread the Needle',
    category: 'Recovery',
    muscle_group: 'Shoulder Rehab',
    equipment: 'Floor Mat',
    difficulty: 'Beginner',
    mechanics: 'Mobility',
    instructions: 'From hands and knees, reach one arm under torso across body, resting shoulder and temple lightly on mat while rotating upper spine. Hold or flow rhythmically for mobility.'
  },
  {
    id: 'e0000001-0000-4000-a000-000000000015',
    name: 'Y-T-W Raises',
    category: 'Recovery',
    muscle_group: 'Shoulder Rehab',
    equipment: 'Floor Mat',
    difficulty: 'Intermediate',
    mechanics: 'Isotonic',
    instructions: 'Prone on an incline bench or floor. Thumbs pointing up. Raise arms into a "Y" position (10 reps), then straight out to sides into a "T" (10 reps), then bend elbows into a "W" pulling shoulder blades back (10 reps).'
  },
  {
    id: 'e0000001-0000-4000-a000-000000000016',
    name: 'Eccentric Heel Drops',
    category: 'Recovery',
    muscle_group: 'Ankle & Achilles',
    equipment: 'Plyo Box',
    difficulty: 'Beginner',
    mechanics: 'Eccentric',
    instructions: 'Stand with balls of feet on edge of a step. Rise up on both feet, shift all weight onto target leg, and slowly lower heel below step level over a 3-5 second count. Step back up using both legs.'
  },
  {
    id: 'e0000001-0000-4000-a000-000000000017',
    name: 'Tibialis Wall Raises',
    category: 'Recovery',
    muscle_group: 'Ankle & Achilles',
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    mechanics: 'Concentric',
    instructions: 'Lean upper back against a wall with feet placed 1-2 feet in front. Keeping knees straight and heels planted, pull toes and forefoot up toward shins as high as possible. Pause and lower slowly.'
  },
  {
    id: 'e0000001-0000-4000-a000-000000000018',
    name: 'Single-Leg Balance (Pad)',
    category: 'Recovery',
    muscle_group: 'Ankle & Achilles',
    equipment: 'Floor Mat',
    difficulty: 'Intermediate',
    mechanics: 'Isometric',
    instructions: 'Stand on one leg on an unstable balance pad or folded towel with a slight micro-bend in knee. Keep hips level and fix gaze on a point ahead. Progress by closing eyes.'
  },
  {
    id: 'e0000001-0000-4000-a000-000000000019',
    name: 'Ankle Alphabet',
    category: 'Recovery',
    muscle_group: 'Ankle & Achilles',
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    mechanics: 'Mobility',
    instructions: 'Seated with leg elevated, trace capital letters from A to Z in the air using only the big toe and ankle joint, moving through maximum active range of motion.'
  }
];

const worksessionsData = [
  {
    id: 'b0000001-0000-4000-a000-000000000001',
    name: "The Overhead Athlete's Shoulder Protocol",
    modality: 'Calisthenics',
    description: 'Restores scapular kinematics, thoracic mobility, and rotator cuff integrity following repetitive overhead striking or pressing.',
    exercises: [
      { exercise_id: 'e0000001-0000-4000-a000-000000000014', target_sets: 2, target_reps: 10, tracking_type: 'reps', target_time: null, notes: 'Warm-up' },
      { exercise_id: 'e0000001-0000-4000-a000-000000000011', target_sets: 3, target_reps: 12, tracking_type: 'reps', target_time: null, notes: 'Activation' },
      { exercise_id: 'e0000001-0000-4000-a000-000000000012', target_sets: 3, target_reps: 15, tracking_type: 'reps', target_time: null, notes: 'Strength' },
      { exercise_id: 'e0000001-0000-4000-a000-000000000015', target_sets: 3, target_reps: 10, tracking_type: 'reps', target_time: null, notes: 'Stability' },
      { exercise_id: 'e0000001-0000-4000-a000-000000000013', target_sets: 3, target_reps: 15, tracking_type: 'reps', target_time: 2, notes: 'Finisher' }
    ]
  },
  {
    id: 'b0000001-0000-4000-a000-000000000002',
    name: "Jumper's Knee (Patellar Tendinopathy) Relief",
    modality: 'Plyometrics',
    description: 'Uses isometric loading for tendon analgesia followed by slow eccentrics and posterior chain engagement to restore jump landing tolerance.',
    exercises: [
      { exercise_id: 'e0000001-0000-4000-a000-000000000004', target_sets: 2, target_reps: 15, tracking_type: 'reps', target_time: null, notes: 'Warm-up' },
      { exercise_id: 'e0000001-0000-4000-a000-000000000002', target_sets: 4, target_reps: 1, tracking_type: 'time', target_time: 45, notes: 'Tendon Analgesia' },
      { exercise_id: 'e0000001-0000-4000-a000-000000000001', target_sets: 3, target_reps: 15, tracking_type: 'reps', target_time: null, notes: 'Tracking' },
      { exercise_id: 'e0000001-0000-4000-a000-000000000003', target_sets: 3, target_reps: 10, tracking_type: 'reps', target_time: null, notes: 'Eccentric Load' },
      { exercise_id: 'e0000001-0000-4000-a000-000000000005', target_sets: 3, target_reps: 5, tracking_type: 'reps', target_time: null, notes: 'Posterior Chain' }
    ]
  },
  {
    id: 'b0000001-0000-4000-a000-000000000003',
    name: 'Acute Lower Back McGill Protocol',
    modality: 'Yoga',
    description: "Stabilizes the lumbar spine using Dr. Stuart McGill's proven endurance trio without creating destructive spinal flexion or shear forces.",
    exercises: [
      { exercise_id: 'e0000001-0000-4000-a000-000000000009', target_sets: 2, target_reps: 10, tracking_type: 'reps', target_time: null, notes: 'Mobility' },
      { exercise_id: 'e0000001-0000-4000-a000-000000000006', target_sets: 3, target_reps: 5, tracking_type: 'time', target_time: 10, notes: 'Anterior Core' },
      { exercise_id: 'e0000001-0000-4000-a000-000000000007', target_sets: 3, target_reps: 5, tracking_type: 'time', target_time: 10, notes: 'Posterior Core' },
      { exercise_id: 'e0000001-0000-4000-a000-000000000008', target_sets: 3, target_reps: 3, tracking_type: 'time', target_time: 10, notes: 'Lateral Core' },
      { exercise_id: 'e0000001-0000-4000-a000-000000000010', target_sets: 3, target_reps: 12, tracking_type: 'reps', target_time: null, notes: 'Anti-rotation' }
    ]
  },
  {
    id: 'b0000001-0000-4000-a000-000000000004',
    name: 'Lower Leg & Achilles Resilience',
    modality: 'Plyometrics',
    description: 'Strengthens the calf-achilles complex, reinforces the anterior compartment, and trains ankle proprioception for dynamic stability.',
    exercises: [
      { exercise_id: 'e0000001-0000-4000-a000-000000000019', target_sets: 1, target_reps: 26, tracking_type: 'reps', target_time: null, notes: 'Mobility' },
      { exercise_id: 'e0000001-0000-4000-a000-000000000016', target_sets: 3, target_reps: 15, tracking_type: 'reps', target_time: null, notes: 'Tendon Load' },
      { exercise_id: 'e0000001-0000-4000-a000-000000000017', target_sets: 3, target_reps: 20, tracking_type: 'reps', target_time: null, notes: 'Deceleration Prep' },
      { exercise_id: 'e0000001-0000-4000-a000-000000000018', target_sets: 3, target_reps: 1, tracking_type: 'time', target_time: 45, notes: 'Proprioception' }
    ]
  }
];

const masterPlan = {
  id: 'c0000001-0000-4000-a000-000000000001',
  name: 'Rehabilitation & Recovery Protocol',
  is_standard_template: true,
  schedule_type: 'floating',
  goal_category: 'Rehab & Recovery',
  intensity: 'Intermediate',
  sessions_per_week: 4,
  description: "Comprehensive clinical recovery protocols targeting shoulder impingement, jumper's knee (patellar tendon), lower back resilience (McGill Big 3), and Achilles/ankle stability.",
  user_id: null
};

async function tryDirectMigration() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return false;

  console.log('Attempting direct SQL execution via DATABASE_URL...');
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const sql = fs.readFileSync('migration_recovery.sql', 'utf8');
    await client.query(sql);
    console.log('Direct migration executed successfully via Postgres!');
    await client.end();
    return true;
  } catch (err) {
    console.log('Direct postgres execution failed:', err.message);
    await client.end().catch(() => {});
    return false;
  }
}

async function seed() {
  console.log('--- STARTING RECOVERY SEED SCRIPT ---');

  // 1. Try direct Postgres migration if credentials exist
  await tryDirectMigration();

  // 2. Check column availability in Supabase PostgREST
  console.log('Checking database column availability in Supabase...');
  let hasInstructionsColumn = false;
  let hasDescriptionColumn = false;
  let hasNotesColumn = false;

  const testEx = await supabase.from('exercises').select('instructions, difficulty, mechanics').limit(1);
  if (!testEx.error) {
    hasInstructionsColumn = true;
    console.log('-> Column "instructions" detected in exercises table!');
  } else {
    console.log('-> Note: Column "instructions" not yet migrated in exercises table.');
  }

  const testWs = await supabase.from('worksessions').select('description').limit(1);
  if (!testWs.error) {
    hasDescriptionColumn = true;
    console.log('-> Column "description" detected in worksessions table!');
  } else {
    console.log('-> Note: Column "description" not yet migrated in worksessions table.');
  }

  const testWe = await supabase.from('worksession_exercises').select('notes').limit(1);
  if (!testWe.error) {
    hasNotesColumn = true;
    console.log('-> Column "notes" detected in worksession_exercises table!');
  }

  // 3. Seed Exercises
  console.log(`\nSeeding ${recoveryExercises.length} rehabilitation & recovery exercises...`);
  for (const ex of recoveryExercises) {
    const payload = {
      id: ex.id,
      name: ex.name,
      category: ex.category,
      muscle_group: ex.muscle_group,
      equipment: ex.equipment,
      is_default: true,
      user_id: null
    };

    if (hasInstructionsColumn) {
      payload.instructions = ex.instructions;
      payload.difficulty = ex.difficulty;
      payload.mechanics = ex.mechanics;
    }

    const { error } = await supabase.from('exercises').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error(`Failed to upsert exercise "${ex.name}":`, error.message);
    } else {
      console.log(`✓ Exercise: ${ex.name} (${ex.muscle_group} | ${ex.equipment})`);
    }
  }

  // 4. Retrieve primary user for worksession ownership fallback
  const { data: users } = await supabase.from('user_profiles').select('id');
  const primaryUserId = users && users.length > 0 ? users[0].id : null;
  console.log(`\nPrimary user ID for worksession ownership: ${primaryUserId || 'global'}`);

  // 5. Seed Worksessions
  console.log(`\nSeeding ${worksessionsData.length} rehabilitation worksessions...`);
  for (const ws of worksessionsData) {
    // Try null user_id first, fallback to primaryUserId if not-null constraint is active
    let wsPayload = {
      id: ws.id,
      name: ws.name,
      modality: ws.modality,
      user_id: null
    };
    if (hasDescriptionColumn) wsPayload.description = ws.description;

    let wsRes = await supabase.from('worksessions').upsert(wsPayload, { onConflict: 'id' });
    if (wsRes.error && wsRes.error.message.includes('violates not-null constraint')) {
      wsPayload.user_id = primaryUserId;
      wsRes = await supabase.from('worksessions').upsert(wsPayload, { onConflict: 'id' });
    }

    if (wsRes.error) {
      console.error(`Failed to upsert worksession "${ws.name}":`, wsRes.error.message);
      continue;
    }
    console.log(`✓ Worksession: ${ws.name} (${ws.modality})`);

    // Clean existing links and insert new links
    await supabase.from('worksession_exercises').delete().eq('worksession_id', ws.id);

    for (const we of ws.exercises) {
      const linkPayload = {
        worksession_id: ws.id,
        exercise_id: we.exercise_id,
        target_sets: we.target_sets,
        target_reps: we.target_reps,
        tracking_type: we.tracking_type,
        target_time: we.target_time
      };
      if (hasNotesColumn) linkPayload.notes = we.notes;

      const { error: linkErr } = await supabase.from('worksession_exercises').insert([linkPayload]);
      if (linkErr) {
        console.error(`  - Failed to link exercise ${we.exercise_id}:`, linkErr.message);
      }
    }
    console.log(`  -> Linked ${ws.exercises.length} exercises to "${ws.name}"`);
  }

  // 6. Seed Master Training Plan
  console.log(`\nSeeding Master Standard Plan: "${masterPlan.name}"...`);
  const planPayload = {
    id: masterPlan.id,
    name: masterPlan.name,
    is_standard_template: masterPlan.is_standard_template,
    schedule_type: masterPlan.schedule_type,
    goal_category: masterPlan.goal_category,
    intensity: masterPlan.intensity,
    sessions_per_week: masterPlan.sessions_per_week,
    description: masterPlan.description,
    user_id: null
  };

  const { error: planErr } = await supabase.from('training_plans').upsert(planPayload, { onConflict: 'id' });
  if (planErr) {
    console.error('Failed to upsert master plan:', planErr.message);
  } else {
    console.log(`✓ Master Plan created: ${masterPlan.name}`);

    // Link worksessions to plan
    await supabase.from('plan_worksessions').delete().eq('plan_id', masterPlan.id);
    const planWsLinks = [
      { plan_id: masterPlan.id, worksession_id: 'b0000001-0000-4000-a000-000000000001', order_index: 1, day_name: 'Day 1 - Shoulder Rehab' },
      { plan_id: masterPlan.id, worksession_id: 'b0000001-0000-4000-a000-000000000002', order_index: 2, day_name: "Day 2 - Jumper's Knee" },
      { plan_id: masterPlan.id, worksession_id: 'b0000001-0000-4000-a000-000000000003', order_index: 3, day_name: 'Day 3 - Lower Back McGill' },
      { plan_id: masterPlan.id, worksession_id: 'b0000001-0000-4000-a000-000000000004', order_index: 4, day_name: 'Day 4 - Lower Leg & Achilles' }
    ];
    const { error: pWsErr } = await supabase.from('plan_worksessions').insert(planWsLinks);
    if (pWsErr) {
      console.error('Failed to link worksessions to master plan:', pWsErr.message);
    } else {
      console.log(`  -> Linked 4 worksessions to Master Plan.`);
    }
  }

  console.log('\n--- SEED COMPLETE! ---');
  if (!hasInstructionsColumn) {
    console.log('\n💡 IMPORTANT STEP: To enable the new instructions, difficulty, and description fields in your database:');
    console.log('1. Open your Supabase SQL Editor: https://supabase.com/dashboard/project/nfzuvugwamzjsxngptta/sql');
    console.log('2. Copy and paste the contents of "migration_recovery.sql"');
    console.log('3. Click "Run". All columns, descriptions, and cues will be activated permanently!');
  }
}

seed().catch(console.error);
