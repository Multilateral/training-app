import React, { useContext } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import PlanBuilder from '../components/PlanBuilder';
import { TrainingContext } from '../context/TrainingContext';

export default function PlansScreen() {
  const { workspaces, updateWorkspaces } = useContext(TrainingContext);
  
  const handleSetDefaultPlan = (planId: string) => {
    updateWorkspaces({ ...workspaces, defaultPlanId: planId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <PlanBuilder 
        onSetDefaultPlan={handleSetDefaultPlan} 
        defaultPlanId={workspaces?.defaultPlanId} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  }
});
