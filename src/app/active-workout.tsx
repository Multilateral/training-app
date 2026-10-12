import React from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ActiveWorkoutEngine from '../components/ActiveWorkoutEngine';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { sessionId, plan, worksession } = useLocalSearchParams();

  let parsedPlan = null;
  let parsedWorksession = null;
  
  try {
    if (typeof plan === 'string') parsedPlan = JSON.parse(plan);
    if (typeof worksession === 'string') parsedWorksession = JSON.parse(worksession);
  } catch(e) {
    console.error("Failed to parse params", e);
  }

  const handleFinish = (durationMins?: number) => {
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
