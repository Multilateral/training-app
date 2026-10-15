import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KinetixDashboard from '../components/KinetixDashboard';
import { KinetixTheme } from '../constants/theme';

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KinetixDashboard />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KinetixTheme.colors.background,
  },
});
