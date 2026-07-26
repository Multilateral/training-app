import { Stack } from 'expo-router';
import { TrainingProvider } from '../context/TrainingContext';
import { useEffect, useState } from 'react';
import { supabase } from '../context/TrainingContext';

export default function Layout() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <TrainingProvider session={session}>
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="index" options={{ title: 'Training Dashboard' }} />
        <Stack.Screen name="plans" options={{ title: 'Workout Plans' }} />
        <Stack.Screen name="history" options={{ title: 'Workout History' }} />
        <Stack.Screen name="active-workout" options={{ title: 'Active Workout', headerShown: false }} />
      </Stack>
    </TrainingProvider>
  );
}
