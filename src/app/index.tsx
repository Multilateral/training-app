import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import WorkoutLoggerUI from '../components/WorkoutLoggerUI';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Sleek Top Quick-Nav Bar */}
      <View style={styles.navHeader}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => router.push('/plans')}
          activeOpacity={0.7}
        >
          <Ionicons name="barbell-outline" size={15} color="#00D09E" />
          <Text style={[styles.navLink, { color: '#00D09E' }]}>Workout Plans</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => router.push('/history')}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={15} color="#60A5FA" />
          <Text style={[styles.navLink, { color: '#60A5FA' }]}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => router.push('/settings')}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={15} color="#C084FC" />
          <Text style={[styles.navLink, { color: '#C084FC' }]}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Main Interactive Daily Training Command Center */}
      <WorkoutLoggerUI />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111'
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#16161F',
    borderBottomWidth: 1,
    borderBottomColor: '#262634',
    gap: 8
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#20202B',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2F2F3F'
  },
  navLink: {
    fontWeight: '700',
    fontSize: 12
  }
});
