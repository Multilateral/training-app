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

  const handleFinish = async (durationMins?: number) => {
    try {
      if (parsedWorksession?.name && logWorkout) {
        await logWorkout(
          parsedWorksession.name,
          durationMins || 25,
          'High',
          parsedPlan?.id || null
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
