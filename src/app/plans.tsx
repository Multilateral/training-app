import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KinetixLibrary from '../components/KinetixLibrary';
import { KinetixTheme } from '../constants/theme';

export default function PlansScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KinetixLibrary />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KinetixTheme.colors.background,
  },
});
