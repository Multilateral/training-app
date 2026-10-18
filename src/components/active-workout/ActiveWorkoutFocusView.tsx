import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';
import { KinetixTheme } from '../../constants/theme';
import CircularProgressRing from './CircularProgressRing';
import { useWorkoutPlayer, PlayerExercise } from '../../hooks/useWorkoutPlayer';

interface ActiveWorkoutFocusViewProps {
  visible: boolean;
  onMinimize: () => void;
  player: ReturnType<typeof useWorkoutPlayer>;
  onFinishWorkout: () => void;
}

export default function ActiveWorkoutFocusView({
  visible,
  onMinimize,
  player,
  onFinishWorkout,
}: ActiveWorkoutFocusViewProps) {
  // Prevent screen sleep while Focus View is active
  useKeepAwake();

  if (!visible) return null;

  const {
    state,
    isPaused,
    isWork,
    isResting,
    isLeadIn,
    isCompleted,
    currentExercise,
    currentExerciseIndex,
    totalExercises,
    currentSet,
    totalSets,
    trackingType,
    secondsRemaining,
    progress,
    workoutElapsedSeconds,
    actualReps,
    setActualReps,
    actualWeight,
    setActualWeight,
    isAudioMuted,
    setIsAudioMuted,
    startWorkout,
    pause,
    resume,
    skipLeadIn,
    completeWorkSet,
    skipRest,
    addRestSeconds,
  } = player;

  // Format seconds to mm:ss
  const formatTimerDigits = (totalSecs: number) => {
    const mins = Math.floor(Math.max(0, totalSecs) / 60);
    const secs = Math.max(0, totalSecs) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const nextExerciseName =
    currentSet < totalSets
      ? `${currentExercise?.name} (Set ${currentSet + 1})`
      : 'Next Routine';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onMinimize}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <SafeAreaView style={styles.safeArea}>
        {/* Top Floating Control Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.minimizeBtn}
            onPress={onMinimize}
            activeOpacity={0.7}
            accessibilityLabel="Minimize to List View"
          >
            <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
            <Text style={styles.minimizeText}>List View</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.exCounterBadge}>
              <Text style={styles.exCounterText}>
                EXERCISE {currentExerciseIndex + 1} OF {totalExercises}
              </Text>
            </View>
            <Text style={styles.stopwatchText}>
              ⏱ {formatTimerDigits(workoutElapsedSeconds)}
            </Text>
          </View>

          <View style={styles.topRightActions}>
            <TouchableOpacity
              style={styles.iconCircleBtn}
              onPress={() => setIsAudioMuted(!isAudioMuted)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isAudioMuted ? 'volume-mute-outline' : 'volume-high-outline'}
                size={18}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconCircleBtn, styles.closeWorkoutBtn]}
              onPress={onFinishWorkout}
              activeOpacity={0.7}
            >
              <Ionicons name="flag-outline" size={17} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Exercise Info Card */}
          <View style={styles.exerciseCard}>
            <View style={styles.setRowIndicator}>
              <View style={styles.setTagBadge}>
                <Text style={styles.setTagBadgeText}>
                  SET {currentSet} OF {totalSets}
                </Text>
              </View>
              <Text style={styles.modalityTagText}>
                {currentExercise?.muscle_group || currentExercise?.equipment || 'Standard'}
              </Text>
            </View>

            <Text style={styles.exerciseTitle}>{currentExercise?.name || 'Exercise'}</Text>
            {currentExercise?.cue ? (
              <Text style={styles.exerciseCue} numberOfLines={2}>
                🎯 {currentExercise.cue}
              </Text>
            ) : null}
          </View>

          {/* MAIN STAGE CONTENT BASED ON STATE MACHINE */}
          {/* ================================================================= */}

          {/* 1. READY STATE */}
          {state === 'READY' && (
            <View style={styles.stageBox}>
              <View style={styles.readyHeroCircle}>
                <Ionicons name="play" size={54} color={KinetixTheme.colors.primary} />
              </View>
              <Text style={styles.readyTitle}>Ready to begin?</Text>
              <Text style={styles.readySubtitle}>
                Guided mode will count down intervals, play audio signals, and log your progress.
              </Text>
              <TouchableOpacity
                style={styles.massivePrimaryBtn}
                onPress={startWorkout}
                activeOpacity={0.88}
              >
                <Ionicons name="play" size={24} color="#FFFFFF" />
                <Text style={styles.massivePrimaryBtnText}>START WORKOUT</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 2. LEAD_IN STATE */}
          {state === 'LEAD_IN' && (
            <View style={styles.stageBox}>
              <View style={styles.stateNoticeBadge}>
                <Ionicons name="flash" size={14} color="#F59E0B" />
                <Text style={styles.stateNoticeText}>GET READY</Text>
              </View>

              <CircularProgressRing
                size={230}
                strokeWidth={14}
                progress={progress}
                color="#F59E0B"
                backgroundColor="#1E293B"
              >
                <Text style={styles.leadInNumber}>{secondsRemaining}</Text>
                <Text style={styles.leadInSubLabel}>SECONDS</Text>
              </CircularProgressRing>

              <Text style={styles.leadInTargetReminder}>
                {trackingType === 'duration'
                  ? `Target: ${currentExercise?.target_duration_seconds || 45}s Hold`
                  : `Target: ${actualReps} Reps · ${actualWeight}kg`}
              </Text>

              <TouchableOpacity
                style={styles.skipBtn}
                onPress={skipLeadIn}
                activeOpacity={0.7}
              >
                <Text style={styles.skipBtnText}>Skip Countdown</Text>
                <Ionicons name="play-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          )}

          {/* 3. ACTIVE_WORK: DURATION MODE */}
          {isWork && trackingType === 'duration' && (
            <View style={styles.stageBox}>
              <View style={[styles.stateNoticeBadge, styles.workNoticeBadge]}>
                <Ionicons name="time" size={14} color="#10B981" />
                <Text style={[styles.stateNoticeText, { color: '#10B981' }]}>
                  {isPaused ? 'PAUSED' : 'HOLD & BREATHE'}
                </Text>
              </View>

              <CircularProgressRing
                size={250}
                strokeWidth={16}
                progress={progress}
                color="#10B981"
                backgroundColor="#1E293B"
              >
                <Text style={styles.workTimerDigits}>
                  {formatTimerDigits(secondsRemaining)}
                </Text>
                <Text style={styles.workTimerLabel}>REMAINING</Text>
              </CircularProgressRing>

              {/* Work Controls */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.secondaryCircleBtn}
                  onPress={isPaused ? resume : pause}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isPaused ? 'play' : 'pause'}
                    size={22}
                    color="#FFFFFF"
                  />
                  <Text style={styles.actionBtnLabel}>{isPaused ? 'Resume' : 'Pause'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.massivePrimaryBtn, { flex: 1, backgroundColor: '#10B981' }]}
                  onPress={() => completeWorkSet()}
                  activeOpacity={0.88}
                >
                  <Ionicons name="checkmark-done" size={22} color="#FFFFFF" />
                  <Text style={styles.massivePrimaryBtnText}>COMPLETE SET</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 4. ACTIVE_WORK: WEIGHT & REPS MODE */}
          {isWork && trackingType !== 'duration' && (
            <View style={styles.stageBox}>
              <View style={[styles.stateNoticeBadge, styles.workNoticeBadge]}>
                <Ionicons name="barbell" size={14} color={KinetixTheme.colors.primary} />
                <Text style={[styles.stateNoticeText, { color: KinetixTheme.colors.primary }]}>
                  {isPaused ? 'PAUSED' : 'PERFORM WORKING SET'}
                </Text>
              </View>

              {/* Large Numeric Steppers */}
              <View style={styles.stepperContainer}>
                {/* Weight Stepper */}
                <View style={styles.stepperCol}>
                  <Text style={styles.stepperColLabel}>LOAD (KG)</Text>
                  <View style={styles.stepperValueBox}>
                    <Text style={styles.stepperBigValue}>{actualWeight}</Text>
                    <Text style={styles.stepperUnit}>kg</Text>
                  </View>

                  <View style={styles.stepperButtonsRow}>
                    <TouchableOpacity
                      style={styles.stepBtnSmall}
                      onPress={() => setActualWeight(Math.max(0, actualWeight - 5))}
                    >
                      <Text style={styles.stepBtnSmallText}>-5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stepBtnSmall}
                      onPress={() => setActualWeight(Math.max(0, actualWeight - 2.5))}
                    >
                      <Text style={styles.stepBtnSmallText}>-2.5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stepBtnSmall}
                      onPress={() => setActualWeight(actualWeight + 2.5)}
                    >
                      <Text style={styles.stepBtnSmallText}>+2.5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stepBtnSmall}
                      onPress={() => setActualWeight(actualWeight + 5)}
                    >
                      <Text style={styles.stepBtnSmallText}>+5</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Reps Stepper */}
                <View style={styles.stepperCol}>
                  <Text style={styles.stepperColLabel}>REPS</Text>
                  <View style={styles.stepperValueBox}>
                    <Text style={styles.stepperBigValue}>{actualReps}</Text>
                    <Text style={styles.stepperUnit}>reps</Text>
                  </View>

                  <View style={styles.stepperButtonsRow}>
                    <TouchableOpacity
                      style={styles.stepBtnSmall}
                      onPress={() => setActualReps(Math.max(1, actualReps - 2))}
                    >
                      <Text style={styles.stepBtnSmallText}>-2</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stepBtnSmall}
                      onPress={() => setActualReps(Math.max(1, actualReps - 1))}
                    >
                      <Text style={styles.stepBtnSmallText}>-1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stepBtnSmall}
                      onPress={() => setActualReps(actualReps + 1)}
                    >
                      <Text style={styles.stepBtnSmallText}>+1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stepBtnSmall}
                      onPress={() => setActualReps(actualReps + 2)}
                    >
                      <Text style={styles.stepBtnSmallText}>+2</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Massive "Log & Rest" CTA */}
              <TouchableOpacity
                style={[styles.massivePrimaryBtn, { backgroundColor: KinetixTheme.colors.primary }]}
                onPress={() => completeWorkSet(actualReps, actualWeight)}
                activeOpacity={0.88}
              >
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                <Text style={styles.massivePrimaryBtnText}>LOG SET & REST</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 5. RESTING STATE */}
          {isResting && (
            <View style={styles.stageBox}>
              <View style={[styles.stateNoticeBadge, styles.restNoticeBadge]}>
                <Ionicons name="battery-charging" size={14} color="#38BDF8" />
                <Text style={[styles.stateNoticeText, { color: '#38BDF8' }]}>
                  REST & RECHARGE
                </Text>
              </View>

              <CircularProgressRing
                size={240}
                strokeWidth={16}
                progress={progress}
                color="#38BDF8"
                backgroundColor="#1E293B"
              >
                <Text style={styles.restTimerDigits}>
                  {formatTimerDigits(secondsRemaining)}
                </Text>
                <Text style={styles.restTimerLabel}>REST REMAINING</Text>
              </CircularProgressRing>

              {/* Up Next Preview Card */}
              <View style={styles.upNextCard}>
                <Ionicons name="arrow-forward-circle" size={18} color="#94A3B8" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.upNextLabel}>UP NEXT</Text>
                  <Text style={styles.upNextTitle} numberOfLines={1}>
                    {nextExerciseName}
                  </Text>
                </View>
              </View>

              {/* Rest Action Controls */}
              <View style={styles.restActionRow}>
                <TouchableOpacity
                  style={styles.restControlBtn}
                  onPress={() => addRestSeconds(30)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.restControlBtnText}>+30s Rest</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.restControlBtn, styles.skipRestBtn]}
                  onPress={skipRest}
                  activeOpacity={0.7}
                >
                  <Ionicons name="play-skip-forward" size={16} color="#38BDF8" />
                  <Text style={[styles.restControlBtnText, { color: '#38BDF8' }]}>
                    Skip Rest
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 6. COMPLETED STATE */}
          {isCompleted && (
            <View style={styles.stageBox}>
              <View style={styles.trophyCircle}>
                <Ionicons name="trophy" size={50} color="#F59E0B" />
              </View>

              <Text style={styles.completedTitle}>Workout Complete!</Text>
              <Text style={styles.completedSubtitle}>
                Fantastic discipline! You crushed all prescribed sets and protocols.
              </Text>

              <TouchableOpacity
                style={styles.massivePrimaryBtn}
                onPress={onFinishWorkout}
                activeOpacity={0.88}
              >
                <Ionicons name="checkmark-done" size={24} color="#FFFFFF" />
                <Text style={styles.massivePrimaryBtnText}>SAVE & VIEW SUMMARY</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A', // Sleek dark athletic stage
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  minimizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  minimizeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerCenter: {
    alignItems: 'center',
  },
  exCounterBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  exCounterText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  stopwatchText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
    marginTop: 2,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeWorkoutBtn: {
    backgroundColor: '#451A1A',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  exerciseCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  setRowIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  setTagBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  setTagBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.4,
  },
  modalityTagText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  exerciseCue: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 16,
  },
  stageBox: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  stateNoticeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2A2312',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  workNoticeBadge: {
    backgroundColor: '#132E22',
    borderColor: '#10B981',
  },
  restNoticeBadge: {
    backgroundColor: '#0C2B3C',
    borderColor: '#38BDF8',
  },
  stateNoticeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 0.8,
  },
  leadInNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: '#F59E0B',
  },
  leadInSubLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  leadInTargetReminder: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
    marginTop: 20,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E293B',
  },
  skipBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  workTimerDigits: {
    fontSize: 52,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: -1,
  },
  workTimerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginTop: 32,
  },
  secondaryCircleBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  massivePrimaryBtn: {
    width: '100%',
    backgroundColor: KinetixTheme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    ...KinetixTheme.shadows.primaryGlow,
  },
  massivePrimaryBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  stepperContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  stepperCol: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  stepperColLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  stepperValueBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 12,
  },
  stepperBigValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  stepperUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  stepperButtonsRow: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
    justifyContent: 'center',
  },
  stepBtnSmall: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnSmallText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  restTimerDigits: {
    fontSize: 48,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: -1,
  },
  restTimerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  upNextCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  upNextLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  upNextTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1,
  },
  restActionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  restControlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 12,
  },
  skipRestBtn: {
    backgroundColor: '#0C2B3C',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  restControlBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  readyHeroCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: KinetixTheme.colors.primary,
  },
  readyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  readySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
    marginBottom: 28,
  },
  trophyCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2A2312',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  completedSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
    marginBottom: 28,
  },
});
