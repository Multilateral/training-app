import React from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import WorkoutHistory from '../components/WorkoutHistory';

export default function HistoryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <WorkoutHistory />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  }
});
