import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import WorkoutLoggerUI from '../components/WorkoutLoggerUI';

import { Link } from 'expo-router';

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.navHeader}>
          <Link href="/plans" style={styles.navLink}>Workout Plans</Link>
          <Link href="/history" style={styles.navLink}>History</Link>
        </View>
        <WorkoutLoggerUI />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  scrollContent: {
    padding: 15,
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: '#222',
    padding: 10,
    borderRadius: 10,
  },
  navLink: {
    color: '#00D09E',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
