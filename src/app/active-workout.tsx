import React, { useContext } from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ActiveWorkoutEngine from '../components/ActiveWorkoutEngine';
import { TrainingContext } from '../context/TrainingContext';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { logWorkout } = useContext(TrainingContext);
  const { sessionId, plan, worksession } = useLocalSearchParams();

  let parsedPlan: any = null;
  let parsedWorksession: any = null;
  
  try {
    if (typeof plan === 'string') parsedPlan = JSON.parse(plan);
    if (typeof worksession === 'string') parsedWorksession = JSON.parse(worksession);
  } catch(e) {
    console.error("Failed to parse params", e);
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
    } catch(err) {
      console.error("Failed to auto-log completed active workout", err);
    }
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ActiveWorkoutEngine 
        sessionId={sessionId}
        plan={parsedPlan}
        worksession={parsedWorksession}
        onFinish={handleFinish}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  }
});
