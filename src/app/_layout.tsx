import { Stack, router, useSegments } from 'expo-router';
import { TrainingProvider } from '../context/TrainingContext';
import { useEffect, useState } from 'react';
import { supabase } from '../context/TrainingContext';
import { View, ActivityIndicator } from 'react-native';

export default function Layout() {
  const [session, setSession] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsReady(true);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!session && !inAuthGroup) {
      router.replace('/auth');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }
  }, [session, isReady, segments]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00D09E" />
      </View>
    );
  }

  return (
    <TrainingProvider session={session}>
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="index" options={{ title: 'Training Dashboard' }} />
        <Stack.Screen name="plans" options={{ title: 'Workout Plans' }} />
        <Stack.Screen name="history" options={{ title: 'Workout History' }} />
        <Stack.Screen name="active-workout" options={{ title: 'Active Workout', headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="auth" options={{ headerShown: false, animation: 'none' }} />
      </Stack>
    </TrainingProvider>
  );
}
