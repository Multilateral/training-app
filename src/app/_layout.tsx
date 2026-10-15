import { Stack, router, useSegments } from 'expo-router';
import { TrainingProvider } from '../context/TrainingContext';
import { useEffect, useState } from 'react';
import { supabase } from '../context/TrainingContext';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
    <SafeAreaProvider>
      <TrainingProvider session={session}>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="index" options={{ title: 'Today' }} />
          <Stack.Screen name="plans" options={{ title: 'Workouts' }} />
          <Stack.Screen name="history" options={{ title: 'Progress' }} />
          <Stack.Screen name="active-workout" options={{ title: 'Active Workout' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings', headerShown: true }} />
          <Stack.Screen name="auth" options={{ headerShown: false, animation: 'none' }} />
        </Stack>
      </TrainingProvider>
    </SafeAreaProvider>
  );
}
