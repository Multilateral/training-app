const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nfzuvugwamzjsxngptta.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5menV2dWd3YW16anN4bmdwdHRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTUzMjgzMywiZXhwIjoyMDk3MTA4ODMzfQ.oLlKiuNhh2Rnas1mFh_WbWytNPsjySYKINQp_jY7VlE';

const supabase = createClient(supabaseUrl, serviceRoleKey);

function getInferredEquipment(name, category) {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();
  if (n.includes('trx')) return 'TRX';
  if (n.includes('pull-up') || n.includes('muscle-up')) return 'Pull-up Bar';
  if (n.includes('dip')) return 'Dip Station';
  if (n.includes('barbell') || n.includes('dumbbell') || n.includes('bench press') || n.includes('deadlift') || n.includes('overhead press') || n.includes('curl')) return 'Dumbbell / Barbell';
  if (n.includes('box jump')) return 'Plyo Box';
  if (n.includes('jump rope')) return 'Cardio Equipment';
  if (n.includes('treadmill') || n.includes('cycl') || n.includes('rowing') || n.includes('stair')) return 'Cardio Equipment';
  if (c === 'yoga' || n.includes('dog') || n.includes('pose') || n.includes('chaturanga') || n.includes('plank') || n.includes('push-up')) return 'Floor Mat';
  if (c === 'collective sports' || n.includes('ball') || n.includes('tennis') || n.includes('hockey') || n.includes('cricket') || n.includes('badminton') || n.includes('rugby')) return 'Sports Equipment';
  return 'Bodyweight';
}

function getInferredMuscleGroup(name, category) {
  const c = category || '';
  const n = (name || '').toLowerCase();
  if (['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Shoulders', 'Full Body'].includes(c)) return c;
  if (n.includes('chest') || n.includes('bench press') || n.includes('push-up')) return 'Chest';
  if (n.includes('row') || n.includes('pull-up') || n.includes('deadlift') || n.includes('y-fly') || n.includes('t-fly') || n.includes('alligator')) return 'Back';
  if (n.includes('squat') || n.includes('lunge') || n.includes('hamstring') || n.includes('box jump')) return 'Legs';
  if (n.includes('curl') || n.includes('tricep') || n.includes('dip') || n.includes('muscle-up')) return 'Arms';
  if (n.includes('overhead press')) return 'Shoulders';
  if (n.includes('plank') || n.includes('pike') || n.includes('climber') || n.includes('core')) return 'Core';
  if (c === 'Cardio' || n.includes('running') || n.includes('cycling') || n.includes('treadmill') || n.includes('rowing') || n.includes('jump rope')) return 'Cardio';
  if (c === 'Yoga' || n.includes('dog') || n.includes('pose')) return 'Yoga';
  if (c === 'Collective Sports') return 'Sports';
  return c || 'Full Body';
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || '--list';

  if (command === '--list') {
    const { data, error } = await supabase.from('exercises').select('*').order('name');
    if (error) {
      console.error('Error fetching exercises:', error.message);
      return;
    }
    console.log(`\nFound ${data.length} total exercises in database:\n`);
    
    // Group by equipment
    const byEquipment = {};
    data.forEach(e => {
      const eq = e.equipment || getInferredEquipment(e.name, e.category);
      if (!byEquipment[eq]) byEquipment[eq] = [];
      byEquipment[eq].push(e);
    });

    console.log('=== GROUPED BY EQUIPMENT ===');
    Object.keys(byEquipment).sort().forEach(eq => {
      console.log(`\n⚙️  ${eq} (${byEquipment[eq].length} exercises):`);
      byEquipment[eq].forEach(e => {
        const mg = e.muscle_group || getInferredMuscleGroup(e.name, e.category);
        const tag = (e.is_default || !e.user_id) ? '[Default]' : '[Custom] ';
        console.log(`   ${tag} ${e.name} (Muscle: ${mg})`);
      });
    });

    console.log('\nUsage:');
    console.log('  node manage_exercises.js --list');
    console.log('  node manage_exercises.js --promote "Exercise Name"');
    console.log('  node manage_exercises.js --promote-all-custom');
    return;
  }

  if (command === '--promote' && args[1]) {
    const targetName = args.slice(1).join(' ').trim();
    console.log(`Promoting exercise "${targetName}" to default library...`);
    const { data, error } = await supabase
      .from('exercises')
      .update({ is_default: true, user_id: null })
      .ilike('name', targetName)
      .select();

    if (error) {
      console.error('Failed to promote:', error.message);
    } else if (!data || data.length === 0) {
      console.log(`No exercise found matching "${targetName}".`);
    } else {
      console.log(`Successfully promoted ${data.length} exercise(s) to default:`);
      data.forEach(e => console.log(` -> ${e.name} (${e.category})`));
    }
    return;
  }

  if (command === '--promote-all-custom') {
    console.log('Promoting ALL custom exercises to default library...');
    const { data, error } = await supabase
      .from('exercises')
      .update({ is_default: true, user_id: null })
      .not('user_id', 'is', null)
      .select();

    if (error) {
      console.error('Failed:', error.message);
    } else {
      console.log(`Successfully promoted ${data?.length || 0} exercises to default!`);
    }
    return;
  }

  if (command === '--set-video') {
    const targetName = args[1];
    const videoUrl = args[2];
    const thumbUrl = args[3] || null;
    if (!targetName || !videoUrl) {
      console.log('Usage: node manage_exercises.js --set-video "Exercise Name" "https://vz-xxxx.b-cdn.net/VIDEO_ID/playlist.m3u8" [thumbnailUrl]');
      return;
    }
    const { data, error } = await supabase
      .from('exercises')
      .update({ video_url: videoUrl, video_thumbnail_url: thumbUrl })
      .ilike('name', targetName)
      .select();

    if (error) {
      console.error('Failed to set video:', error.message);
    } else if (!data || data.length === 0) {
      console.log(`No exercise found matching "${targetName}".`);
    } else {
      console.log(`Successfully linked video to ${data.length} exercise(s):`);
      data.forEach(e => console.log(` -> ${e.name} => ${videoUrl}`));
    }
    return;
  }

  if (command === '--videos') {
    const { data, error } = await supabase.from('exercises').select('id, name, category, equipment, video_url').order('name');
    if (error) {
      console.error('Error fetching exercises:', error.message);
      return;
    }
    const withVideo = data.filter(e => !!e.video_url);
    const withoutVideo = data.filter(e => !e.video_url);
    console.log(`\n=== EXERCISE DEMO VIDEOS STATUS ===`);
    console.log(`Total Exercises: ${data.length}`);
    console.log(`With Demo Video: ${withVideo.length}`);
    console.log(`Pending Video:   ${withoutVideo.length}\n`);

    if (withVideo.length > 0) {
      console.log('--- Exercises With Videos ---');
      withVideo.forEach(e => console.log(`[VIDEO] ${e.name} (${e.equipment}): ${e.video_url}`));
    }
    return;
  }

  console.log('Unknown command. Available commands:');
  console.log('  node manage_exercises.js --list');
  console.log('  node manage_exercises.js --videos');
  console.log('  node manage_exercises.js --set-video "Exercise Name" "https://...url"');
  console.log('  node manage_exercises.js --promote "Exercise Name"');
  console.log('  node manage_exercises.js --promote-all-custom');
}

main();
