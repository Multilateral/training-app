import React, { useContext } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import KinetixActiveWorkout from '../components/KinetixActiveWorkout';
import { TrainingContext } from '../context/TrainingContext';
import { KinetixTheme } from '../constants/theme';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { logWorkout } = useContext(TrainingContext) || {};
  const { sessionId, plan, worksession } = useLocalSearchParams();

  let parsedPlan: any = null;
  let parsedWorksession: any = null;

  try {
    if (typeof plan === 'string') parsedPlan = JSON.parse(plan);
    if (typeof worksession === 'string') parsedWorksession = JSON.parse(worksession);
  } catch (e) {
    console.error('Failed to parse params', e);
  }

  const handleFinish = async (durationMins?: number, summary?: any) => {
    try {
      const workoutTitle = parsedWorksession?.name || summary?.worksessionName || 'Active Workout';
      const isRehab = Boolean(
        summary?.isRehab ||
        summary?.sessionType === 'rehab' ||
        parsedWorksession?.type === 'rehab' ||
        parsedWorksession?.isRehab === true ||
        parsedPlan?.type === 'rehab' ||
        workoutTitle.toLowerCase().includes('rehab') ||
        workoutTitle.toLowerCase().includes('protocol') ||
        workoutTitle.toLowerCase().includes('mcgill') ||
        workoutTitle.toLowerCase().includes('recovery')
      );

      if (logWorkout) {
        await logWorkout(
          workoutTitle,
          durationMins || summary?.durationMins || 25,
          'High',
          parsedPlan?.id || null,
          {
            startTime: summary?.startTime,
            endTime: summary?.endTime,
            durationSeconds: summary?.durationSecs,
            durationFormatted: summary?.durationFormatted,
            worksessionName: workoutTitle,
            sessionType: isRehab ? 'rehab' : 'workout',
            isRehab,
            category: parsedWorksession?.focus || summary?.category || (isRehab ? 'Clinical Rehab' : 'Strength & Power'),
            exercisesCompleted: summary?.exercisesCompleted,
            totalSets: summary?.totalSets,
          }
        );
      }
    } catch (err) {
      console.error('Failed to auto-log completed active workout', err);
    }
    router.replace('/history');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KinetixActiveWorkout
        worksession={parsedWorksession}
        plan={parsedPlan}
        onFinish={handleFinish}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KinetixTheme.colors.background,
  },
});
