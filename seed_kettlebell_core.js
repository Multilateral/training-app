const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nfzuvugwamzjsxngptta.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5menV2dWd3YW16anN4bmdwdHRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTUzMjgzMywiZXhwIjoyMDk3MTA4ODMzfQ.oLlKiuNhh2Rnas1mFh_WbWytNPsjySYKINQp_jY7VlE';
const supabase = createClient(supabaseUrl, serviceRoleKey);

const kettlebellExercises = [
  {
    id: 'e0000002-0000-4000-a000-000000000001',
    name: 'Kettlebell Russian Swing',
    category: 'Kettlebell',
    muscle_group: 'Posterior Chain / Glutes & Hips',
    equipment: 'Kettlebell',
    difficulty: 'Beginner',
    mechanics: 'Ballistic / Hip Hinge',
    instructions: 'Stand feet shoulder-width. Hinge at hips, hike bell between legs, then snap hips forward explosively to swing bell to chest height. Squeeze glutes at top.'
  },
  {
    id: 'e0000002-0000-4000-a000-000000000002',
    name: 'Single-Arm Kettlebell Swing',
    category: 'Kettlebell',
    muscle_group: 'Posterior Chain / Anti-Rotation',
    equipment: 'Kettlebell',
    difficulty: 'Intermediate',
    mechanics: 'Ballistic / Dynamic',
    instructions: 'Perform a standard swing using one arm. Keep shoulders square and resist trunk rotation as the bell swings back through legs.'
  },
  {
    id: 'e0000002-0000-4000-a000-000000000003',
    name: 'Kettlebell Goblet Squat',
    category: 'Kettlebell',
    muscle_group: 'Quadriceps / Glutes / Core',
    equipment: 'Kettlebell',
    difficulty: 'Beginner',
    mechanics: 'Knee-Dominant',
    instructions: 'Hold bell by the horns tight against chest. Squat down between knees keeping chest tall and elbows inside knees. Drive through midfoot to stand.'
  },
  {
    id: 'e0000002-0000-4000-a000-000000000004',
    name: 'Kettlebell Clean',
    category: 'Kettlebell',
    muscle_group: 'Hips / Lats / Forearms',
    equipment: 'Kettlebell',
    difficulty: 'Intermediate',
    mechanics: 'Triple Extension',
    instructions: 'Hinge and hike bell back. Explosively drive hips forward, pull elbow back, and rotate hand under bell to catch softly in rack position against chest.'
  },
  {
    id: 'e0000002-0000-4000-a000-000000000005',
    name: 'Kettlebell Overhead Press',
    category: 'Kettlebell',
    muscle_group: 'Shoulders / Triceps / Core',
    equipment: 'Kettlebell',
    difficulty: 'Intermediate',
    mechanics: 'Vertical Push',
    instructions: 'From rack position, brace core and glutes. Press bell vertically overhead in a slight arc until arm locks out beside ear. Lower under control.'
  },
  {
    id: 'e0000002-0000-4000-a000-000000000006',
    name: 'Kettlebell Push Press',
    category: 'Kettlebell',
    muscle_group: 'Full Body / Shoulders / Legs',
    equipment: 'Kettlebell',
    difficulty: 'Intermediate',
    mechanics: 'Explosive Push',
    instructions: 'From rack position, dip knees 2-3 inches, then aggressively drive legs straight to propel bell overhead, finishing with locked-out arm.'
  },
  {
    id: 'e0000002-0000-4000-a000-000000000007',
    name: 'Kettlebell Turkish Get-Up',
    category: 'Kettlebell',
    muscle_group: 'Full Body / Shoulder Stability / Core',
    equipment: 'Kettlebell',
    difficulty: 'Advanced',
    mechanics: 'Multi-Planar Mobility',
    instructions: 'Lie supine, press bell overhead. Roll to elbow, then hand, bridge hips, sweep leg into half-kneeling, and stand tall. Reverse steps with bell overhead.'
  },
  {
    id: 'e0000002-0000-4000-a000-000000000008',
    name: 'Kettlebell Snatch',
    category: 'Kettlebell',
    muscle_group: 'Hips / Back / Shoulder Stabilizers',
    equipment: 'Kettlebell',
    difficulty: 'Advanced',
    mechanics: 'Power / Ballistic',
    instructions: 'Swing bell between legs, drive hips forward explosively, high-pull with elbow, and punch hand through at top to lock bell overhead without banging wrist.'
  },
  {
    id: 'e0000002-0000-4000-a000-000000000009',
    name: 'Kettlebell Romanian Deadlift (RDL)',
    category: 'Kettlebell',
    muscle_group: 'Hamstrings / Glutes',
    equipment: 'Kettlebell',
    difficulty: 'Beginner',
    mechanics: 'Hip Hinge',
    instructions: 'Stand tall holding bell(s). Soften knees, push hips back keeping back flat until hamstrings stretch; return by driving hips forward.'
  },
  {
    id: 'e0000002-0000-4000-a000-000000000010',
    name: 'Kettlebell Gorilla Row',
    category: 'Kettlebell',
    muscle_group: 'Lats / Rhomboids / Core',
    equipment: 'Kettlebell',
    difficulty: 'Intermediate',
    mechanics: 'Horizontal Pull',
    instructions: 'Hinge over two bells on floor. Keep torso parallel to ground and row one bell to hip while pushing other bell firmly into floor; alternate sides.'
  },
  {
    id: 'e0000002-0000-4000-a000-000000000011',
    name: 'Kettlebell Windmill',
    category: 'Kettlebell',
    muscle_group: 'Obliques / Hamstrings / Shoulder',
    equipment: 'Kettlebell',
    difficulty: 'Intermediate',
    mechanics: 'Lateral Flexion / Mobility',
    instructions: 'Press bell overhead with feet turned 45° away. Hinge hip back and slide opposite hand down inner leg toward floor while looking up at bell.'
  },
  {
    id: 'e0000002-0000-4000-a000-000000000012',
    name: "Kettlebell Farmer's Carry",
    category: 'Kettlebell',
    muscle_group: 'Forearms / Traps / Core Stability',
    equipment: 'Kettlebell',
    difficulty: 'Beginner',
    mechanics: 'Loaded Carry',
    instructions: 'Hold a heavy kettlebell in each hand at sides. Walk forward in a straight line with upright posture, packed shoulders, and tight core.'
  },
  {
    id: 'e0000002-0000-4000-a000-000000000013',
    name: 'Kettlebell Suitcase Carry',
    category: 'Kettlebell',
    muscle_group: 'Obliques / Quadratus Lumborum',
    equipment: 'Kettlebell',
    difficulty: 'Intermediate',
    mechanics: 'Loaded Carry / Anti-Lateral',
    instructions: 'Hold a single heavy kettlebell in one hand. Walk with upright, level shoulders, actively resisting leaning sideways toward the weight.'
  },
  {
    id: 'e0000002-0000-4000-a000-000000000014',
    name: 'Kettlebell Halo',
    category: 'Kettlebell',
    muscle_group: 'Shoulders / Scapula / Core',
    equipment: 'Kettlebell',
    difficulty: 'Beginner',
    mechanics: 'Rotational Mobility',
    instructions: 'Hold bell upside down by horns at chest. Circle the bell smoothly around head, keeping ribs down and neck relaxed without moving torso.'
  }
];

const coreExercises = [
  {
    id: 'e0000003-0000-4000-a000-000000000001',
    name: 'TRX Pike',
    category: 'Core',
    muscle_group: 'Lower Abs / Hip Flexors / Shoulders',
    equipment: 'TRX',
    difficulty: 'Intermediate',
    mechanics: 'Flexion / Anti-Extension',
    instructions: "Start in a high push-up plank with feet in TRX cradles. Keeping legs straight, lift hips up toward ceiling while drawing toes toward chest until forming an inverted 'V'. Lower slowly."
  },
  {
    id: 'e0000003-0000-4000-a000-000000000002',
    name: 'TRX Mountain Climber',
    category: 'Core',
    muscle_group: 'Rectus Abdominis / Hip Flexors',
    equipment: 'TRX',
    difficulty: 'Beginner',
    mechanics: 'Dynamic Alternating',
    instructions: 'Set up in a high plank with feet in TRX cradles. Drive one knee smoothly toward chest while keeping hips level, then return and drive opposite knee.'
  },
  {
    id: 'e0000003-0000-4000-a000-000000000003',
    name: 'TRX Plank',
    category: 'Core',
    muscle_group: 'Transverse Abdominis / Core',
    equipment: 'TRX',
    difficulty: 'Beginner',
    mechanics: 'Isometric',
    instructions: 'Place feet into TRX cradles and hold a forearm or hand plank. Brace core, engage glutes, and keep head to heels in a rigid straight line without sagging.'
  },
  {
    id: 'e0000003-0000-4000-a000-000000000004',
    name: 'Hollow Body Hold',
    category: 'Core',
    muscle_group: 'Rectus Abdominis / Transverse Abdominis',
    equipment: 'Floor Mat',
    difficulty: 'Intermediate',
    mechanics: 'Anti-Extension',
    instructions: 'Lie supine, press lower back flat into floor. Extend legs and arms out long, elevating shoulders and feet 6-8 inches off floor. Hold tight hollow shape.'
  },
  {
    id: 'e0000003-0000-4000-a000-000000000005',
    name: 'Ab Wheel Rollout',
    category: 'Core',
    muscle_group: 'Rectus Abdominis / Lats',
    equipment: 'Ab Wheel',
    difficulty: 'Advanced',
    mechanics: 'Eccentric Anti-Extension',
    instructions: 'Kneel on floor with wheel below chest. Slowly roll wheel forward, extending body as low as possible without letting lumbar spine sag; pull back with abs.'
  },
  {
    id: 'e0000003-0000-4000-a000-000000000006',
    name: 'Deadbug',
    category: 'Core',
    muscle_group: 'Deep Core / Hip Flexors',
    equipment: 'Floor Mat',
    difficulty: 'Beginner',
    mechanics: 'Motor Control',
    instructions: 'Lie on back, knees at 90°, arms up. Slowly extend opposite arm and leg toward floor while keeping lower back glued to mat. Return and switch.'
  },
  {
    id: 'e0000003-0000-4000-a000-000000000007',
    name: 'TRX Body Saw',
    category: 'Core',
    muscle_group: 'Rectus Abdominis / Serratus',
    equipment: 'TRX',
    difficulty: 'Intermediate',
    mechanics: 'Dynamic Anti-Extension',
    instructions: 'Feet in TRX straps, assume forearm plank. Rock body forward and backward from elbows, keeping core locked without dipping hips.'
  },
  {
    id: 'e0000003-0000-4000-a000-000000000008',
    name: 'TRX Side Plank (Feet in Straps)',
    category: 'Core',
    muscle_group: 'Obliques / Abductors',
    equipment: 'TRX',
    difficulty: 'Intermediate',
    mechanics: 'Isometric Lateral Stability',
    instructions: 'Place both feet into TRX loops, turn sideways onto bottom forearm. Elevate hips until body forms a straight diagonal line. Hold steady.'
  },
  {
    id: 'e0000003-0000-4000-a000-000000000009',
    name: 'Hanging Knee / Leg Raise',
    category: 'Core',
    muscle_group: 'Lower Abs / Hip Flexors',
    equipment: 'Pull-up Bar',
    difficulty: 'Intermediate',
    mechanics: 'Hip Flexion',
    instructions: 'Hang from pull-up bar. Without swinging, curl pelvis up and lift legs/knees toward chest. Lower under control without overarching.'
  },
  {
    id: 'e0000003-0000-4000-a000-000000000010',
    name: 'Russian Twist',
    category: 'Core',
    muscle_group: 'Obliques / Transverse Abdominis',
    equipment: 'Floor Mat',
    difficulty: 'Beginner',
    mechanics: 'Rotational Dynamic',
    instructions: 'Sit on floor with knees bent, torso reclined at 45°. Rotate torso side to side, tapping floor beside hip while keeping pelvis stable.'
  },
  {
    id: 'e0000003-0000-4000-a000-000000000011',
    name: 'Side Plank Dip',
    category: 'Core',
    muscle_group: 'Obliques / Quadratus Lumborum',
    equipment: 'Floor Mat',
    difficulty: 'Intermediate',
    mechanics: 'Dynamic Lateral Flexion',
    instructions: 'Set up in a side plank on elbow. Lower bottom hip until it lightly touches floor, then contract obliques to elevate hip slightly above neutral line.'
  },
  {
    id: 'e0000003-0000-4000-a000-000000000012',
    name: 'TRX Torso Rotation',
    category: 'Core',
    muscle_group: 'Obliques / Transverse Abdominis',
    equipment: 'TRX',
    difficulty: 'Intermediate',
    mechanics: 'Anti-Rotation / Rotational',
    instructions: 'Stand facing anchor holding TRX handles at chest with straight arms. Lean back, rotate arms and torso diagonally to one side, pull back up using core.'
  },
  {
    id: 'e0000003-0000-4000-a000-000000000013',
    name: 'Bicycle Crunch',
    category: 'Core',
    muscle_group: 'Rectus Abdominis / Obliques',
    equipment: 'Floor Mat',
    difficulty: 'Beginner',
    mechanics: 'Dynamic Alternating Flexion',
    instructions: 'Lie on back, hands behind ears. Bring opposite elbow toward opposite knee while extending other leg long. Alternate smoothly without pulling neck.'
  },
  {
    id: 'e0000003-0000-4000-a000-000000000014',
    name: 'V-Up',
    category: 'Core',
    muscle_group: 'Full Abdominal Wall',
    equipment: 'Floor Mat',
    difficulty: 'Intermediate',
    mechanics: 'Dynamic Flexion',
    instructions: 'Lie flat on back with arms overhead. Simultaneously hinge at hips to raise straight legs and torso, reaching fingers toward toes at top. Lower slowly.'
  },
  {
    id: 'e0000003-0000-4000-a000-000000000015',
    name: 'TRX Knee Tuck (Crunch)',
    category: 'Core',
    muscle_group: 'Rectus Abdominis / Hip Flexors',
    equipment: 'TRX',
    difficulty: 'Beginner',
    mechanics: 'Dynamic Concentric',
    instructions: 'Feet in TRX straps in high push-up plank. Drive both knees together straight toward chest, rounding lower back slightly at end, then extend legs back.'
  }
];

const allExercises = [...kettlebellExercises, ...coreExercises];

const worksessionsData = [
  {
    id: 'b0000001-0000-4000-a000-000000000005',
    name: 'Worksession E: Kettlebell Power & Hinge',
    modality: 'Kettlebell',
    description: 'Focuses on explosive hip hinge power, posterior chain strengthening, and foundational loaded carrying.',
    exercises: [
      {
        exerciseName: 'Kettlebell Halo',
        target_sets: 2,
        target_reps: 10,
        tracking_type: 'reps',
        target_time: null,
        notes: '10 reps each direction'
      },
      {
        exerciseName: 'Kettlebell Russian Swing',
        target_sets: 4,
        target_reps: 15,
        tracking_type: 'reps',
        target_time: null,
        notes: 'Explosive hip snap'
      },
      {
        exerciseName: 'Kettlebell Goblet Squat',
        target_sets: 3,
        target_reps: 10,
        tracking_type: 'reps',
        target_time: null,
        notes: 'Chest tall, elbows inside knees'
      },
      {
        exerciseName: 'Kettlebell Gorilla Row',
        target_sets: 3,
        target_reps: 8,
        tracking_type: 'reps',
        target_time: null,
        notes: '8 reps/arm'
      },
      {
        exerciseName: "Kettlebell Farmer's Carry",
        target_sets: 3,
        target_reps: 40,
        tracking_type: 'reps',
        target_time: null,
        notes: '3 sets x 40m'
      }
    ]
  },
  {
    id: 'b0000001-0000-4000-a000-000000000006',
    name: 'Worksession F: 360° Core & Anti-Rotation',
    modality: 'Core',
    description: 'Delivers comprehensive midsection conditioning across sagittal, frontal, and transverse planes blending TRX and loaded carries.',
    exercises: [
      {
        exerciseName: 'Deadbug',
        target_sets: 3,
        target_reps: 10,
        tracking_type: 'reps',
        target_time: null,
        notes: '10 reps/side'
      },
      {
        exerciseName: 'TRX Pike',
        target_sets: 3,
        target_reps: 10,
        tracking_type: 'reps',
        target_time: null,
        notes: 'Controlled inverted V'
      },
      {
        exerciseName: 'Russian Twist',
        target_sets: 3,
        target_reps: 20,
        tracking_type: 'reps',
        target_time: null,
        notes: '20 total reps'
      },
      {
        exerciseName: 'Kettlebell Suitcase Carry',
        target_sets: 3,
        target_reps: 30,
        tracking_type: 'reps',
        target_time: null,
        notes: '30m/side'
      },
      {
        exerciseName: 'Hollow Body Hold',
        target_sets: 3,
        target_reps: null,
        tracking_type: 'time',
        target_time: 40,
        notes: '30–45s hold'
      }
    ]
  }
];

async function seed() {
  console.log('--- STARTING KETTLEBELL & CORE SEED ---');

  // 1. Fetch all existing exercises to preserve IDs and avoid duplicates
  const { data: existingExercises, error: fetchErr } = await supabase.from('exercises').select('*');
  if (fetchErr) {
    throw new Error('Failed to fetch existing exercises: ' + fetchErr.message);
  }
  console.log(`Found ${existingExercises.length} existing exercises in database.`);

  const existingMap = new Map();
  existingExercises.forEach(ex => {
    existingMap.set(ex.name.toLowerCase().trim(), ex);
  });

  // Track resolved exercise IDs for worksession linking
  const resolvedExerciseIds = new Map();

  // 2. Insert or update all 29 exercises
  console.log(`\nSeeding ${allExercises.length} Kettlebell & Core exercises...`);
  for (const ex of allExercises) {
    const key = ex.name.toLowerCase().trim();
    const existing = existingMap.get(key);

    const payload = {
      name: ex.name,
      category: ex.category,
      muscle_group: ex.muscle_group,
      equipment: ex.equipment,
      difficulty: ex.difficulty,
      mechanics: ex.mechanics,
      instructions: ex.instructions,
      is_default: true,
      user_id: null
    };

    if (existing) {
      // Preserve existing ID
      payload.id = existing.id;
      const { data, error } = await supabase.from('exercises').update(payload).eq('id', existing.id).select();
      if (error) {
        console.error(`  ✕ Error updating "${ex.name}" (${existing.id}):`, error.message);
      } else {
        resolvedExerciseIds.set(key, existing.id);
        console.log(`  ✓ Updated existing: "${ex.name}" [ID: ${existing.id}]`);
      }
    } else {
      // Insert with deterministic ID
      payload.id = ex.id;
      const { data, error } = await supabase.from('exercises').insert([payload]).select();
      if (error) {
        console.error(`  ✕ Error inserting "${ex.name}":`, error.message);
      } else {
        resolvedExerciseIds.set(key, ex.id);
        console.log(`  ✓ Inserted new: "${ex.name}" [ID: ${ex.id}]`);
      }
    }
  }

  // 3. Retrieve primary user for worksession ownership fallback
  const { data: users } = await supabase.from('user_profiles').select('id');
  const primaryUserId = users && users.length > 0 ? users[0].id : null;
  console.log(`\nPrimary user ID for worksession ownership fallback: ${primaryUserId || 'none'}`);

  // 4. Seed Worksessions & Relational Links
  console.log(`\nSeeding ${worksessionsData.length} Worksessions and relational links...`);
  for (const ws of worksessionsData) {
    const wsPayload = {
      id: ws.id,
      name: ws.name,
      modality: ws.modality,
      description: ws.description,
      user_id: null
    };

    let wsRes = await supabase.from('worksessions').upsert(wsPayload, { onConflict: 'id' });
    if (wsRes.error && wsRes.error.message.includes('violates not-null constraint')) {
      wsPayload.user_id = primaryUserId;
      wsRes = await supabase.from('worksessions').upsert(wsPayload, { onConflict: 'id' });
    }

    if (wsRes.error) {
      console.error(`✕ Failed to upsert worksession "${ws.name}":`, wsRes.error.message);
      continue;
    }
    console.log(`✓ Worksession: ${ws.name} (${ws.modality})`);

    // Delete existing links for this worksession to cleanly rebuild
    await supabase.from('worksession_exercises').delete().eq('worksession_id', ws.id);

    // Insert relational exercise links
    const linkPayloads = [];
    for (const we of ws.exercises) {
      const exKey = we.exerciseName.toLowerCase().trim();
      const exerciseId = resolvedExerciseIds.get(exKey);

      if (!exerciseId) {
        console.error(`  ✕ Could not resolve exercise ID for "${we.exerciseName}"`);
        continue;
      }

      linkPayloads.push({
        worksession_id: ws.id,
        exercise_id: exerciseId,
        target_sets: we.target_sets,
        target_reps: we.target_reps,
        tracking_type: we.tracking_type,
        target_time: we.target_time,
        notes: we.notes
      });
    }

    if (linkPayloads.length > 0) {
      const { data: insertedLinks, error: linkErr } = await supabase.from('worksession_exercises').insert(linkPayloads).select();
      if (linkErr) {
        console.error(`  ✕ Failed to link exercises for "${ws.name}":`, linkErr.message);
      } else {
        console.log(`  -> Linked ${insertedLinks.length} exercises to "${ws.name}"`);
        insertedLinks.forEach((link, idx) => {
          const exName = ws.exercises[idx]?.exerciseName;
          const display = link.tracking_type === 'time' ? `${link.target_time}s hold` : `${link.target_sets} sets x ${link.target_reps} reps`;
          console.log(`     [${idx + 1}] ${exName} (${display} | ${link.notes || 'standard'})`);
        });
      }
    }
  }

  console.log('\n--- SEED EXECUTION COMPLETE ---');
}

seed().catch(err => {
  console.error('Fatal error during seed execution:', err);
  process.exit(1);
});
