import React, { useContext, useState, useMemo, useCallback } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import KinetixActiveWorkout from '../components/KinetixActiveWorkout';
import EndOfSessionPainModal from '../components/EndOfSessionPainModal';
import RehabPhaseRetentionModal from '../components/RehabPhaseRetentionModal';
import { TrainingContext } from '../context/TrainingContext';
import { KinetixTheme } from '../constants/theme';
import {
  logAndEvaluateRehabSession,
  getActiveUserEnrollment,
  advanceToNextRehabPhase,
  keepPracticingCurrentRehabPhase,
  GatekeeperEvaluationResult,
} from '../services/rehabProgressionService';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { logWorkout, session, activeSessionMetadata } = useContext(TrainingContext) || {};
  const { sessionId, plan, worksession } = useLocalSearchParams();

  const [showPainModal, setShowPainModal] = useState<boolean>(false);
  const [pendingDurationMins, setPendingDurationMins] = useState<number>(25);
  const [pendingSummary, setPendingSummary] = useState<any>(null);
  const [isSubmittingPain, setIsSubmittingPain] = useState<boolean>(false);

  // Phase Retention / Progression Decision Modal state
  const [retentionEvalData, setRetentionEvalData] =
    useState<GatekeeperEvaluationResult | null>(null);
  const [activeEnrollmentId, setActiveEnrollmentId] = useState<string | undefined>(
    undefined
  );

  // Memoize parsed route parameters so object references remain completely stable across re-renders
  const parsedPlan = useMemo(() => {
    if (typeof plan === 'string') {
      try {
        return JSON.parse(plan);
      } catch (e) {
        console.error('Failed to parse plan param', e);
      }
    }
    return activeSessionMetadata?.plan || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  const parsedWorksession = useMemo(() => {
    if (typeof worksession === 'string') {
      try {
        return JSON.parse(worksession);
      } catch (e) {
        console.error('Failed to parse worksession param', e);
      }
    }
    return activeSessionMetadata?.worksession || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worksession]);

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

    if (isRehab) {
      setPendingDurationMins(durationMins || summary?.durationMins || 25);
      setPendingSummary(summary);
      setShowPainModal(true);
      return;
    }

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

      // 1. Always log the completed workout into history & cloud first
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
            category:
              parsedWorksession?.focus ||
              summary?.category ||
              (isRehab ? 'Clinical Rehab' : 'Strength & Power'),
            exercisesCompleted: summary?.exercisesCompleted,
            totalSets: summary?.totalSets,
            painScore: painScoreRecorded,
          }
        );
      }

      // 2. Evaluate progression gatekeeper if enrolled in a rehab phase
      if (isRehab && painScoreRecorded !== null && session?.user?.id) {
        try {
          const activeEnrollment = await getActiveUserEnrollment(session.user.id);
          if (activeEnrollment?.current_phase_id) {
            setActiveEnrollmentId(activeEnrollment.id);
            const evalResult = await logAndEvaluateRehabSession({
              userId: session.user.id,
              programPhaseId: activeEnrollment.current_phase_id,
              painScore: painScoreRecorded,
              sessionId: typeof sessionId === 'string' ? sessionId : undefined,
              durationMinutes: durationMins,
              notes: `Completed ${workoutTitle}`,
              autoAdvance: false,
            });

            if (evalResult.eligible_to_advance || evalResult.advanced) {
              // Prompt user with the Phase Progression vs Keep Practicing Modal!
              setRetentionEvalData(evalResult);
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
          console.warn(
            '[ActiveWorkoutScreen] Progression gatekeeper evaluation skipped or offline:',
            rpcErr
          );
        }
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

      <RehabPhaseRetentionModal
        visible={Boolean(retentionEvalData)}
        programTitle={retentionEvalData?.program_title || 'Rehabilitation Protocol'}
        currentPhaseOrder={retentionEvalData?.current_phase_order || 1}
        currentPhaseTitle={retentionEvalData?.current_phase_title || 'Current Phase'}
        nextPhaseOrder={retentionEvalData?.next_phase_order || null}
        nextPhaseTitle={retentionEvalData?.next_phase_title || null}
        sessionsCompleted={retentionEvalData?.sessions_completed || 8}
        requiredSessions={retentionEvalData?.required_sessions || 8}
        avgPainScore={retentionEvalData?.avg_pain_score || 2.5}
        maxAllowedPainScore={retentionEvalData?.max_allowed_pain_score || 4.0}
        isPhaseExtended={retentionEvalData?.is_phase_extended}
        extendedSessionsCount={retentionEvalData?.extended_sessions_count}
        onClose={() => {
          setRetentionEvalData(null);
          router.replace('/history');
        }}
        onAdvanceToNextPhase={async () => {
          await advanceToNextRehabPhase(session?.user?.id, activeEnrollmentId);
          setRetentionEvalData(null);
          router.replace('/rehab-program');
        }}
        onKeepPracticingCurrentPhase={async (extraSessions) => {
          await keepPracticingCurrentRehabPhase(
            session?.user?.id,
            activeEnrollmentId,
            extraSessions
          );
          setRetentionEvalData(null);
          router.replace('/history');
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
