import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KinetixHeader from '../components/KinetixHeader';
import BuilderCanvas from '../components/program-builder/BuilderCanvas';
import { TrainingContext } from '../context/TrainingContext';
import { KinetixTheme } from '../constants/theme';

export default function ProgramBuilderScreen() {
  const { session } = useContext(TrainingContext) || {};
  const userId = session?.user?.id;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KinetixHeader subtitle="PROGRAM BUILDER" iconName="construct" />
      <View style={styles.canvasWrapper}>
        <BuilderCanvas userId={userId} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KinetixTheme.colors.background,
  },
  canvasWrapper: {
    flex: 1,
  },
});
