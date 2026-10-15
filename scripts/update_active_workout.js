const fs = require('fs');

const file = 'src/components/KinetixActiveWorkout.tsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = 'const STANDBY_SESSIONS: WorksessionData[] = [';
const endStr = 'export default function KinetixActiveWorkout';

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `const STANDBY_SESSIONS: WorksessionData[] = DATABASE_WORKSESSIONS.map((ws) => ({
  id: ws.id,
  name: ws.title,
  category: ws.type === 'rehab' ? 'Rehab Track' : 'Performance Track',
  focus: ws.description || ws.category || 'Targeted Protocol',
  duration: parseInt(ws.metrics.duration) || 30,
  rpe: ws.type === 'rehab' ? '5.0' : '8.0',
  exercises: ws.exercises.map((e) => ({
    name: e.name,
    cue: e.cue || 'Controlled form.',
    totalSets: e.sets || 3,
    reps: String(e.reps),
    load: e.weight || 'Standard',
    restSeconds: e.restSeconds || 60,
    trackingType: (e.tracking_type === 'time' ? 'duration' : 'weight_reps') as 'duration' | 'weight_reps',
    video_url: null,
  })),
}));

`;

  content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully updated STANDBY_SESSIONS in KinetixActiveWorkout.tsx');
} else {
  console.error('Could not find markers', { startIdx, endIdx });
}
