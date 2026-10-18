import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KinetixHeader from '../components/KinetixHeader';
import RehabProgramDashboard from '../components/RehabProgramDashboard';
import KinetixBottomNav from '../components/KinetixBottomNav';
import { KinetixTheme } from '../constants/theme';

export default function RehabProgramScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KinetixHeader subtitle="CRITERIA PROGRESSION" iconName="shield-checkmark" />
      <View style={styles.body}>
        <RehabProgramDashboard />
      </View>
      <KinetixBottomNav activeTab="workouts" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KinetixTheme.colors.background,
  },
  body: {
    flex: 1,
  },
});
