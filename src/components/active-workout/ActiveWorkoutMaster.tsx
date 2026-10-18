import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { KinetixTheme } from '../../constants/theme';
import { useWorkoutPlayer, PlayerExercise, SetResultLog } from '../../hooks/useWorkoutPlayer';
import ActiveWorkoutListView, { SetRowData } from './ActiveWorkoutListView';
import ActiveWorkoutFocusView from './ActiveWorkoutFocusView';
import ExerciseVideoModal from '../ExerciseVideoModal';
import { DATABASE_WORKSESSIONS } from '../../data/databaseLibraryData';

export interface WorkoutFinishSummary {
  durationMins: number;
  durationSecs: number;
  startTime: number;
  endTime: number;
  startTimeFormatted: string;
  endTimeFormatted: string;
  durationFormatted: string;
  worksessionName: string;
  exercisesCompleted: number;
  totalSets: number;
  sessionType?: 'rehab' | 'workout';
  isRehab?: boolean;
  category?: string;
  logs?: SetResultLog[];
}

interface ActiveWorkoutMasterProps {
  worksession?: any;
  plan?: any;
  onFinish?: (durationMins?: number, summary?: WorkoutFinishSummary) => void;
}

export default function ActiveWorkoutMaster({
  worksession,
  plan,
  onFinish,
}: ActiveWorkoutMasterProps) {
  const router = useRouter();

  // Dual-Mode view state: 'list' (Static Mode) vs 'focus' (Guided Mode)
  const [isFocusViewOpen, setIsFocusViewOpen] = useState<boolean>(false);

  // Video preview modal
  const [videoModal, setVideoModal] = useState<{ url: string; title: string } | null>(null);

  // Completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [completionSummary, setCompletionSummary] = useState<WorkoutFinishSummary | null>(null);

  // Normalize exercises from worksession or fallback
  const initialExercises: PlayerExercise[] = useMemo(() => {
    if (worksession?.exercises && worksession.exercises.length > 0) {
      return worksession.exercises.map((e: any, idx: number) => ({
        id: e.id || `ex-${idx}`,
        name: e.name || 'Exercise',
        cue: e.cue || '',
        totalSets: e.totalSets || e.sets || 3,
        reps: e.reps || 10,
        target_reps: parseInt(String(e.reps)) || 10,
        target_weight: parseInt(String(e.weight || e.load)) || 0,
        weight: e.weight || e.load || '0kg',
        load: e.load || e.weight || '0kg',
        target_rest_seconds: e.target_rest_seconds || e.restSeconds || 60,
        target_duration_seconds: e.target_duration_seconds || e.target_time || 45,
        tracking_type: e.tracking_type || (e.trackingType === 'duration' ? 'time' : 'reps'),
        equipment: e.equipment,
        muscle_group: e.muscle_group,
      }));
    }

    if (worksession?.worksession_exercises && worksession.worksession_exercises.length > 0) {
      return worksession.worksession_exercises.map((we: any, idx: number) => {
        const ex = we.exercises || {};
        const isTime = we.tracking_type === 'time' || (we.target_time && we.target_time > 0);
        return {
          id: we.id || `ex-${idx}`,
          name: ex.name || 'Exercise',
          cue: we.notes || ex.instructions || 'Maintain strict form.',
          totalSets: we.target_sets || 3,
          reps: isTime ? `${we.target_time || 45}s` : `${we.target_reps || 10}`,
          target_reps: we.target_reps || 10,
          target_weight: 0,
          weight: 'Standard',
          load: 'Standard',
          target_rest_seconds: we.target_rest_seconds || 60,
          target_duration_seconds: we.target_duration_seconds || we.target_time || 45,
          tracking_type: isTime ? 'time' : we.tracking_type || 'reps',
          equipment: ex.equipment,
          muscle_group: ex.muscle_group,
        };
      });
    }

    // Standby database session fallback
    const standby = DATABASE_WORKSESSIONS[0];
    return standby.exercises.map((e, idx) => ({
      id: `ex-${standby.id}-${idx}`,
      name: e.name,
      cue: e.cue || 'Controlled execution.',
      totalSets: e.sets || 3,
      reps: e.reps || 10,
      target_reps: parseInt(String(e.reps)) || 10,
      target_weight: parseInt(String(e.weight)) || 0,
      weight: e.weight || 'Standard',
      load: e.weight || 'Standard',
      target_rest_seconds: e.restSeconds || 60,
      target_duration_seconds: e.tracking_type === 'time' ? (parseInt(String(e.reps)) || 45) : 45,
      tracking_type: e.tracking_type || 'reps',
      equipment: e.equipment,
      muscle_group: e.muscle_group,
    }));
  }, [worksession]);

  const [exercisesList] = useState<PlayerExercise[]>(initialExercises);

  // Initialize List View Set Rows per exercise
  const [exerciseSets, setExerciseSets] = useState<{ [exerciseIndex: number]: SetRowData[] }>(() => {
    const map: { [exerciseIndex: number]: SetRowData[] } = {};
    initialExercises.forEach((ex, exIdx) => {
      const count = ex.totalSets || ex.sets || 3;
      const parsedReps = parseInt(String(ex.reps)) || 10;
      const parsedWeight = parseInt(String(ex.weight || ex.load)) || 0;
      const rows: SetRowData[] = [];
      for (let s = 1; s <= count; s++) {
        rows.push({
          setNumber: s,
          prevText: `${parsedWeight > 0 ? `${parsedWeight}kg × ` : ''}${parsedReps}`,
          weight: parsedWeight,
          reps: parsedReps,
          isCompleted: false,
        });
      }
      map[exIdx] = rows;
    });
    return map;
  });

  // Floating Rest Timer State for List View
  const [isListResting, setIsListResting] = useState<boolean>(false);
  const [listRestSecondsLeft, setListRestSecondsLeft] = useState<number>(0);
  const listRestIntervalRef = useRef<any>(null);

  const startListRestTimer = useCallback((durationSeconds: number) => {
    if (listRestIntervalRef.current) clearInterval(listRestIntervalRef.current);
    setListRestSecondsLeft(durationSeconds);
    setIsListResting(true);

    const endTime = Date.now() + durationSeconds * 1000;

    listRestIntervalRef.current = setInterval(() => {
      const remainingMs = Math.max(0, endTime - Date.now());
      const remainingSec = Math.ceil(remainingMs / 1000);
      setListRestSecondsLeft(remainingSec);

      if (remainingMs <= 0) {
        clearInterval(listRestIntervalRef.current);
        listRestIntervalRef.current = null;
        setIsListResting(false);
      }
    }, 500);
  }, []);

  const handleAddListRestTime = useCallback((extraSeconds: number) => {
    setListRestSecondsLeft((prev) => Math.max(0, prev + extraSeconds));
  }, []);

  const handleSkipListRest = useCallback(() => {
    if (listRestIntervalRef.current) clearInterval(listRestIntervalRef.current);
    listRestIntervalRef.current = null;
    setIsListResting(false);
    setListRestSecondsLeft(0);
  }, []);

  // Set Row updates in List View
  const handleUpdateSet = useCallback(
    (exerciseIndex: number, setIndex: number, updates: Partial<SetRowData>) => {
      setExerciseSets((prev) => {
        const rows = [...(prev[exerciseIndex] || [])];
        if (rows[setIndex]) {
          rows[setIndex] = { ...rows[setIndex], ...updates };
        }
        return { ...prev, [exerciseIndex]: rows };
      });
    },
    []
  );

  const handleToggleCompleteSet = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      setExerciseSets((prev) => {
        const rows = [...(prev[exerciseIndex] || [])];
        const row = rows[setIndex];
        if (!row) return prev;

        const nextCompletedState = !row.isCompleted;
        rows[setIndex] = { ...row, isCompleted: nextCompletedState };

        // If newly completed, trigger the non-intrusive floating rest timer!
        if (nextCompletedState) {
          const ex = exercisesList[exerciseIndex];
          const restDuration = ex?.target_rest_seconds || ex?.restSeconds || 60;
          startListRestTimer(restDuration);
        }

        return { ...prev, [exerciseIndex]: rows };
      });
    },
    [exercisesList, startListRestTimer]
  );

  const handleAddSet = useCallback((exerciseIndex: number) => {
    setExerciseSets((prev) => {
      const rows = [...(prev[exerciseIndex] || [])];
      const nextNum = rows.length + 1;
      const lastRow = rows[rows.length - 1];
      rows.push({
        setNumber: nextNum,
        prevText: lastRow ? `${lastRow.weight > 0 ? `${lastRow.weight}kg × ` : ''}${lastRow.reps}` : '—',
        weight: lastRow ? lastRow.weight : 0,
        reps: lastRow ? lastRow.reps : 10,
        isCompleted: false,
      });
      return { ...prev, [exerciseIndex]: rows };
    });
  }, []);

  // Guided Workout State Machine Hook
  const player = useWorkoutPlayer({
    exercises: exercisesList,
    leadInDurationSeconds: 5,
    onSetCompleted: (log) => {
      // Synchronize with List View table
      handleUpdateSet(log.exerciseIndex, log.setNumber - 1, {
        isCompleted: true,
        reps: log.reps,
        weight: log.weight,
      });
    },
    onWorkoutCompleted: (allLogs, totalDuration) => {
      handleFinalizeWorkout(totalDuration, allLogs);
    },
  });

  const handleFinalizeWorkout = useCallback(
    (durationSecs?: number, logs?: SetResultLog[]) => {
      const totalSecs = durationSecs || player.workoutElapsedSeconds || 60;
      const totalMins = Math.max(1, Math.round(totalSecs / 60));
      const now = Date.now();
      const startTime = now - totalSecs * 1000;

      const sessionTitle = worksession?.name || 'Active Workout Routine';
      const isRehab = Boolean(
        worksession?.type === 'rehab' ||
        worksession?.isRehab === true ||
        plan?.type === 'rehab' ||
        sessionTitle.toLowerCase().includes('rehab') ||
        sessionTitle.toLowerCase().includes('protocol') ||
        sessionTitle.toLowerCase().includes('recovery')
      );

      const summary: WorkoutFinishSummary = {
        durationMins: totalMins,
        durationSecs: totalSecs,
        startTime,
        endTime: now,
        startTimeFormatted: new Date(startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        endTimeFormatted: new Date(now).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        durationFormatted: `${Math.floor(totalSecs / 60)}m ${totalSecs % 60}s`,
        worksessionName: sessionTitle,
        sessionType: isRehab ? 'rehab' : 'workout',
        isRehab,
        category: worksession?.focus || (isRehab ? 'Clinical Rehab' : 'Strength & Power'),
        exercisesCompleted: exercisesList.length,
        totalSets: Object.values(exerciseSets).reduce(
          (sum, rows) => sum + rows.filter((r) => r.isCompleted).length,
          0
        ),
        logs,
      };

      setCompletionSummary(summary);
      setShowCompletionModal(true);
    },
    [player.workoutElapsedSeconds, worksession, plan, exercisesList.length, exerciseSets]
  );

  const handleConfirmFinish = () => {
    setShowCompletionModal(false);
    setIsFocusViewOpen(false);

    if (onFinish && completionSummary) {
      onFinish(completionSummary.durationMins, completionSummary);
    } else {
      router.replace('/history');
    }
  };

  // Launch Guided Focus Mode
  const handleLaunchGuidedMode = (exerciseIndex?: number) => {
    if (typeof exerciseIndex === 'number' && exerciseIndex !== player.currentExerciseIndex) {
      // Jump to chosen exercise if requested
      if (player.state === 'READY') {
        player.startWorkout();
      }
    } else if (player.state === 'READY') {
      player.startWorkout();
    }
    setIsFocusViewOpen(true);
  };

  return (
    <View style={styles.masterContainer}>
      {/* Top Header Bar */}
      <View style={styles.masterHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.headerPulseIcon}>
            <Ionicons name="barbell" size={18} color={KinetixTheme.colors.primary} />
          </View>
          <View>
            <Text style={styles.sessionTitle} numberOfLines={1}>
              {worksession?.name || 'Active Workout'}
            </Text>
            <Text style={styles.sessionSub}>
              {exercisesList.length} Exercises Prescribed
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Quick Guided Mode Trigger */}
          <TouchableOpacity
            style={styles.guidedPlayHeaderBtn}
            onPress={() => handleLaunchGuidedMode()}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={15} color="#FFFFFF" />
            <Text style={styles.guidedPlayHeaderText}>Guided</Text>
          </TouchableOpacity>

          {/* Finish Button */}
          <TouchableOpacity
            style={styles.finishHeaderBtn}
            onPress={() => handleFinalizeWorkout()}
            activeOpacity={0.8}
          >
            <Text style={styles.finishHeaderText}>Finish</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode 1: Static Mode (List View) */}
      <ActiveWorkoutListView
        exercises={exercisesList}
        exerciseSets={exerciseSets}
        onUpdateSet={handleUpdateSet}
        onToggleCompleteSet={handleToggleCompleteSet}
        onAddSet={handleAddSet}
        onLaunchGuidedMode={handleLaunchGuidedMode}
        isResting={isListResting || player.isResting}
        restSecondsLeft={isListResting ? listRestSecondsLeft : player.secondsRemaining}
        onAddRestTime={(extra) => {
          if (isListResting) handleAddListRestTime(extra);
          else player.addRestSeconds(extra);
        }}
        onSkipRest={() => {
          if (isListResting) handleSkipListRest();
          else player.skipRest();
        }}
        onFinishWorkout={() => handleFinalizeWorkout()}
        onOpenVideo={(url, name) => setVideoModal({ url, title: name })}
      />

      {/* Mode 2: Guided Mode (Focus View Modal / Overlay) */}
      <ActiveWorkoutFocusView
        visible={isFocusViewOpen}
        onMinimize={() => setIsFocusViewOpen(false)}
        player={player}
        onFinishWorkout={() => {
          setIsFocusViewOpen(false);
          handleFinalizeWorkout();
        }}
      />

      {/* Video Modal */}
      {videoModal && (
        <ExerciseVideoModal
          visible={Boolean(videoModal)}
          exercise={videoModal}
          onClose={() => setVideoModal(null)}
        />
      )}

      {/* Completion Modal */}
      <Modal
        visible={showCompletionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.completionCard}>
            <View style={styles.trophyCircle}>
              <Ionicons name="trophy" size={36} color="#F59E0B" />
            </View>

            <Text style={styles.completionHeading}>Workout Finished!</Text>
            <Text style={styles.completionSub}>
              Here is your recorded session summary:
            </Text>

            <View style={styles.summaryTable}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Routine</Text>
                <Text style={styles.summaryVal}>{completionSummary?.worksessionName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration</Text>
                <Text style={styles.summaryVal}>{completionSummary?.durationFormatted}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sets Logged</Text>
                <Text style={styles.summaryVal}>{completionSummary?.totalSets} Completed</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.confirmSaveBtn}
              onPress={handleConfirmFinish}
              activeOpacity={0.88}
            >
              <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
              <Text style={styles.confirmSaveBtnText}>Save & Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  masterContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  masterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  headerPulseIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  sessionSub: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guidedPlayHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: KinetixTheme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    ...KinetixTheme.shadows.primaryGlow,
  },
  guidedPlayHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  finishHeaderBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  finishHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  completionCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...KinetixTheme.shadows.card,
  },
  trophyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  completionHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: KinetixTheme.colors.text,
  },
  completionSub: {
    fontSize: 12,
    color: KinetixTheme.colors.textMuted,
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  summaryTable: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: KinetixTheme.colors.textMuted,
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  confirmSaveBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: KinetixTheme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    ...KinetixTheme.shadows.primaryGlow,
  },
  confirmSaveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
