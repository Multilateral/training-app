import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KinetixProgressHub from '../components/KinetixProgressHub';
import { KinetixTheme } from '../constants/theme';

export default function HistoryScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KinetixProgressHub />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KinetixTheme.colors.background,
  },
});
