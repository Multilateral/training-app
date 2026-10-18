import React, { useContext, useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import KinetixActiveWorkout from '../components/KinetixActiveWorkout';
import EndOfSessionPainModal from '../components/EndOfSessionPainModal';
import { TrainingContext } from '../context/TrainingContext';
import { KinetixTheme } from '../constants/theme';
import { logAndEvaluateRehabSession, getActiveUserEnrollment } from '../services/rehabProgressionService';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { logWorkout, session } = useContext(TrainingContext) || {};
  const { sessionId, plan, worksession } = useLocalSearchParams();

  const [showPainModal, setShowPainModal] = useState<boolean>(false);
  const [pendingDurationMins, setPendingDurationMins] = useState<number>(25);
  const [pendingSummary, setPendingSummary] = useState<any>(null);
  const [isSubmittingPain, setIsSubmittingPain] = useState<boolean>(false);

  let parsedPlan: any = null;
  let parsedWorksession: any = null;

  try {
    if (typeof plan === 'string') parsedPlan = JSON.parse(plan);
    if (typeof worksession === 'string') parsedWorksession = JSON.parse(worksession);
  } catch (e) {
    console.error('Failed to parse params', e);
  }

  const handleFinish = async (durationMins?: number, summary?: any) => {
    const workoutTitle = parsedWorksession?.name || summary?.worksessionName || 'Active Workout';
    const isRehab = Boolean(
      summary?.isRehab ||
      summary?.sessionType === 'rehab' ||
      parsedWorksession?.type === 'rehab' ||
      parsedWorksession?.isRehab === true ||
      parsedPlan?.type === 'rehab' ||
      workoutTitle.toLowerCase().includes('rehab') ||
      workoutTitle.toLowerCase().includes('protocol') ||
      workoutTitle.toLowerCase().includes('mcgill') ||
      workoutTitle.toLowerCase().includes('recovery')
    );

    // If rehab session, prompt for highest joint pain score via Criteria Modal
    if (isRehab) {
      setPendingDurationMins(durationMins || summary?.durationMins || 25);
      setPendingSummary(summary);
      setShowPainModal(true);
      return;
    }

    // Standard strength workout completion
    await finalizeSessionLogging(durationMins || 25, summary, null);
  };

  const finalizeSessionLogging = async (
    durationMins: number,
    summary: any,
    painScoreRecorded: number | null
  ) => {
    try {
      const workoutTitle = parsedWorksession?.name || summary?.worksessionName || 'Active Workout';
      const isRehab = Boolean(
        summary?.isRehab ||
        summary?.sessionType === 'rehab' ||
        parsedWorksession?.type === 'rehab' ||
        parsedWorksession?.isRehab === true ||
        parsedPlan?.type === 'rehab' ||
        workoutTitle.toLowerCase().includes('rehab') ||
        workoutTitle.toLowerCase().includes('protocol') ||
        workoutTitle.toLowerCase().includes('mcgill') ||
        workoutTitle.toLowerCase().includes('recovery')
      );

      // Evaluate progression gatekeeper if enrolled in a phase
      if (isRehab && painScoreRecorded !== null && session?.user?.id) {
        try {
          const activeEnrollment = await getActiveUserEnrollment(session.user.id);
          if (activeEnrollment?.current_phase_id) {
            const evalResult = await logAndEvaluateRehabSession({
              userId: session.user.id,
              programPhaseId: activeEnrollment.current_phase_id,
              painScore: painScoreRecorded,
              sessionId: typeof sessionId === 'string' ? sessionId : undefined,
              durationMinutes: durationMins,
              notes: `Completed ${workoutTitle}`,
            });

            if (evalResult.advanced) {
              Alert.alert(
                'Phase Progression Unlocked! 🎉',
                `Outstanding work! You completed your required sessions and maintained a pain average under the clinical threshold. You have advanced to ${evalResult.current_phase_title || 'the next phase'}!`,
                [{ text: 'View Progression', onPress: () => router.replace('/rehab-program') }]
              );
              return;
            } else if (evalResult.requires_more_time) {
              Alert.alert(
                'Tissue Adaptation Notice',
                "Your tissues are still adapting. Let's stay in this phase for a bit longer to build a solid foundation.",
                [{ text: 'Continue', onPress: () => router.replace('/rehab-program') }]
              );
              return;
            }
          }
        } catch (rpcErr) {
          console.warn('[ActiveWorkoutScreen] Progression gatekeeper evaluation skipped or offline:', rpcErr);
        }
      }

      if (logWorkout) {
        await logWorkout(
          workoutTitle,
          durationMins,
          'High',
          parsedPlan?.id || null,
          {
            startTime: summary?.startTime,
            endTime: summary?.endTime,
            durationSeconds: summary?.durationSecs,
            durationFormatted: summary?.durationFormatted,
            worksessionName: workoutTitle,
            sessionType: isRehab ? 'rehab' : 'workout',
            isRehab,
            category: parsedWorksession?.focus || summary?.category || (isRehab ? 'Clinical Rehab' : 'Strength & Power'),
            exercisesCompleted: summary?.exercisesCompleted,
            totalSets: summary?.totalSets,
            painScore: painScoreRecorded,
          }
        );
      }
    } catch (err) {
      console.error('Failed to log completed workout', err);
    }
    router.replace('/history');
  };

  const handleSavePainAndFinish = async (score: number) => {
    setIsSubmittingPain(true);
    try {
      setShowPainModal(false);
      await finalizeSessionLogging(pendingDurationMins, pendingSummary, score);
    } finally {
      setIsSubmittingPain(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KinetixActiveWorkout
        worksession={parsedWorksession}
        plan={parsedPlan}
        onFinish={handleFinish}
      />

      <EndOfSessionPainModal
        visible={showPainModal}
        sessionTitle={parsedWorksession?.name || 'Rehabilitation Routine'}
        isSubmitting={isSubmittingPain}
        onSave={handleSavePainAndFinish}
        onDismiss={() => {
          setShowPainModal(false);
          finalizeSessionLogging(pendingDurationMins, pendingSummary, 0);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KinetixTheme.colors.background,
  },
});

