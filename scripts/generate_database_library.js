const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://nfzuvugwamzjsxngptta.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5menV2dWd3YW16anN4bmdwdHRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTUzMjgzMywiZXhwIjoyMDk3MTA4ODMzfQ.oLlKiuNhh2Rnas1mFh_WbWytNPsjySYKINQp_jY7VlE'
);

function inferTypeAndCategory(ws) {
  const n = (ws.name || '').toLowerCase();
  const m = (ws.modality || '').toLowerCase();
  const d = (ws.description || '').toLowerCase();

  const isRehab =
    n.includes('rehab') ||
    n.includes('protocol') ||
    n.includes('relief') ||
    n.includes('mcgill') ||
    n.includes('tendinopathy') ||
    n.includes('achilles') ||
    n.includes('shoulder protocol') ||
    n.includes('back pain') ||
    n.includes('recovery');

  let filterTag = 'core';
  if (n.includes('knee') || n.includes('leg') || n.includes('achilles') || n.includes('squat')) {
    filterTag = 'knee';
  } else if (n.includes('shoulder') || n.includes('rotator')) {
    filterTag = 'shoulder';
  } else if (
    n.includes('chest') ||
    n.includes('bicep') ||
    n.includes('upper') ||
    n.includes('calisthenic') ||
    n.includes('pull') ||
    n.includes('dip')
  ) {
    filterTag = 'upper';
  } else if (
    n.includes('core') ||
    n.includes('anti-rotation') ||
    n.includes('power') ||
    n.includes('plyo') ||
    n.includes('hinge') ||
    n.includes('kettlebell')
  ) {
    filterTag = 'core';
  }

  let load = 'Moderate';
  if (isRehab) {
    load = n.includes('mcgill') || n.includes('shoulder') ? 'Light' : 'Tendon Load';
  } else if (n.includes('chest') || n.includes('power') || n.includes('plyo')) {
    load = 'Heavy';
  } else if (n.includes('calisthenic') || n.includes('yoga')) {
    load = 'Body';
  }

  const category = ws.modality || (isRehab ? 'Clinical Rehab' : 'Strength & Power');

  return {
    type: isRehab ? 'rehab' : 'workout',
    category,
    filterTag,
    load,
  };
}

async function buildDatabaseLibrary() {
  const { data: wsData } = await supabase
    .from('worksessions')
    .select(
      'id, name, modality, description, created_at, worksession_exercises(id, target_sets, target_reps, tracking_type, target_time, notes, exercises(id, name, category, equipment, muscle_group, instructions, difficulty, mechanics))'
    )
    .order('created_at', { ascending: false });

  const { data: plansData } = await supabase
    .from('training_plans')
    .select(
      'id, name, schedule_type, goal_category, description, is_standard_template, plan_worksessions(id, day_name, order_index, worksessions(id, name, modality, description, worksession_exercises(id, target_sets, target_reps, tracking_type, target_time, notes, exercises(id, name, category, equipment, muscle_group, instructions, difficulty, mechanics))))'
    )
    .order('created_at', { ascending: false });

  const formattedWorksessions = (wsData || []).map((ws) => {
    const meta = inferTypeAndCategory(ws);
    const exercises = (ws.worksession_exercises || []).map((we) => {
      const ex = we.exercises || {};
      const isHold = we.tracking_type === 'time' || (we.target_time && we.target_time > 0);
      return {
        name: ex.name || 'Exercise',
        cue: we.notes || ex.instructions || 'Maintain controlled form and posture.',
        sets: we.target_sets || 3,
        reps: isHold
          ? we.target_time
            ? `${we.target_time}s`
            : '45s'
          : we.target_reps
          ? String(we.target_reps)
          : '10-12',
        weight:
          ex.equipment === 'Bodyweight' || ex.equipment === 'Floor Mat'
            ? 'Bodyweight'
            : ex.equipment === 'Kettlebell'
            ? '24kg'
            : 'Moderate',
        restSeconds: isHold ? 45 : 60,
        tracking_type: we.tracking_type || (isHold ? 'time' : 'reps_weight'),
        equipment: ex.equipment || 'Bodyweight',
        muscle_group: ex.muscle_group || ex.category || 'General',
        difficulty: ex.difficulty || 'Intermediate',
        mechanics: ex.mechanics || 'Compound',
      };
    });

    const totalSets = exercises.reduce((acc, e) => acc + (e.sets || 3), 0);
    const durationMin = Math.max(
      15,
      Math.min(60, exercises.length * 8 + (totalSets > 10 ? 10 : 0))
    );

    return {
      id: ws.id,
      type: meta.type,
      category: meta.category,
      title: ws.name,
      filterTag: meta.filterTag,
      description: ws.description || '',
      metrics: {
        duration: `${durationMin} min`,
        sets: `${totalSets || exercises.length * 3} Sets`,
        reps: exercises[0] ? String(exercises[0].reps) : '8-12',
        load: meta.load,
      },
      exercises,
    };
  });

  const formattedPlans = (plansData || []).map((plan) => {
    const sessions = (plan.plan_worksessions || [])
      .map((pw) => {
        const ws = pw.worksessions;
        if (!ws) return null;
        const found = formattedWorksessions.find((f) => f.id === ws.id);
        return {
          dayName: pw.day_name || `Day ${pw.order_index || 1}`,
          worksessionId: ws.id,
          worksessionName: ws.name,
          modality: ws.modality,
          exerciseCount: ws.worksession_exercises?.length || 0,
          worksession: found || null,
        };
      })
      .filter(Boolean);

    return {
      id: plan.id,
      name: plan.name,
      schedule_type: plan.schedule_type || 'floating',
      goal_category: plan.goal_category || 'General',
      description: plan.description || '',
      is_standard_template: !!plan.is_standard_template,
      worksessions: sessions,
    };
  });

  const outputTs = `// Auto-generated from Supabase Database (training_plans & worksessions)

export interface DatabaseWorksessionCard {
  id: string;
  type: 'workout' | 'rehab';
  category: string;
  title: string;
  filterTag: 'knee' | 'shoulder' | 'upper' | 'core';
  description?: string;
  metrics: {
    duration: string;
    sets: string;
    reps: string;
    load: string;
    loadColor?: string;
  };
  exercises: {
    name: string;
    cue?: string;
    sets: number;
    reps: string | number;
    weight: string;
    restSeconds: number;
    tracking_type?: string;
    equipment?: string;
    muscle_group?: string;
    difficulty?: string;
    mechanics?: string;
  }[];
}

export interface DatabasePlan {
  id: string;
  name: string;
  schedule_type: string;
  goal_category: string;
  description?: string;
  is_standard_template: boolean;
  worksessions: {
    dayName: string;
    worksessionId: string;
    worksessionName: string;
    modality?: string;
    exerciseCount: number;
    worksession?: DatabaseWorksessionCard | null;
  }[];
}

export const DATABASE_WORKSESSIONS: DatabaseWorksessionCard[] = ${JSON.stringify(
    formattedWorksessions,
    null,
    2
  )};

export const DATABASE_PLANS: DatabasePlan[] = ${JSON.stringify(
    formattedPlans,
    null,
    2
  )};
`;

  fs.writeFileSync('src/data/databaseLibraryData.ts', outputTs, 'utf8');
  console.log('Successfully wrote src/data/databaseLibraryData.ts!');
}

buildDatabaseLibrary();
