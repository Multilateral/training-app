const fs = require('fs');

const file = 'src/components/KinetixDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add import if not present
if (!content.includes("DATABASE_WORKSESSIONS")) {
  content = content.replace(
    "import KinetixBottomNav from './KinetixBottomNav';",
    "import KinetixBottomNav from './KinetixBottomNav';\nimport { DATABASE_WORKSESSIONS } from '../data/databaseLibraryData';"
  );
}

// Update startTodaySession to use real database worksessions
const startMarker = 'const startTodaySession = (track?: \'performance\' | \'rehab\' | \'full\') => {';
const endMarker = 'return (\n    <View style={styles.screen}>';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `const performanceWs = DATABASE_WORKSESSIONS.find((w) => w.id === 'b0000001-0000-4000-a000-000000000005') || DATABASE_WORKSESSIONS.find((w) => w.type === 'workout') || DATABASE_WORKSESSIONS[0];
  const rehabWs = DATABASE_WORKSESSIONS.find((w) => w.id === 'b0000001-0000-4000-a000-000000000002') || DATABASE_WORKSESSIONS.find((w) => w.type === 'rehab') || DATABASE_WORKSESSIONS[1];

  const startTodaySession = (track?: 'performance' | 'rehab' | 'full') => {
    const selected = track === 'rehab' ? rehabWs : performanceWs;
    const worksessionData = {
      name: selected.title,
      focus: selected.category,
      estimatedDuration: parseInt(selected.metrics.duration) || 30,
      exercises: selected.exercises.map((e) => ({
        name: e.name,
        cue: e.cue || 'Maintain strict form.',
        sets: e.sets || 3,
        reps: e.reps || 10,
        weight: e.weight || 'Standard',
        restSeconds: e.restSeconds || 60,
        tracking_type: e.tracking_type || 'reps_weight',
      })),
    };

    if (setActiveSessionMetadata) {
      setActiveSessionMetadata({
        isActive: true,
        worksessionName: selected.title,
        currentExerciseName: selected.exercises[0]?.name || 'Exercise 1',
        currentExerciseIndex: 0,
        totalExercises: selected.exercises.length,
        currentSet: 1,
        totalSets: selected.exercises[0]?.sets || 3,
        startTime: Date.now(),
      });
    }

    router.push({
      pathname: '/active-workout',
      params: {
        worksession: JSON.stringify(worksessionData),
        plan: JSON.stringify({ id: selected.id, name: selected.title }),
      },
    });
  };

  `;

  content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully updated startTodaySession in KinetixDashboard.tsx');
} else {
  console.error('Could not find startTodaySession bounds', { startIdx, endIdx });
}
