import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KinetixTheme } from '../../constants/theme';
import CircularProgressRing from './CircularProgressRing';
import { WorkoutState, ExerciseTrackingType, PlayerExercise } from '../../hooks/useWorkoutPlayer';

interface GuidedCounterCardProps {
  state: WorkoutState;
  isPaused: boolean;
  currentExercise?: PlayerExercise;
  currentSet: number;
  totalSets: number;
  currentExerciseIndex: number;
  totalExercises: number;
  trackingType: ExerciseTrackingType;
  secondsRemaining: number;
  progress: number;
  targetReps: number;
  targetWeight: number;
  targetDurationSeconds: number;
  targetRestSeconds: number;
  actualReps: number;
  setActualReps: (reps: number) => void;
  actualWeight: number;
  setActualWeight: (weight: number) => void;
  isAudioMuted: boolean;
  setIsAudioMuted: React.Dispatch<React.SetStateAction<boolean>>;
  startGuidedSet: () => void;
  pause: () => void;
  resume: () => void;
  skipLeadIn: () => void;
  completeWorkSet: (reps?: number, weight?: number) => void;
  skipRest: () => void;
  addRestSeconds: (seconds: number) => void;
  onOpenTargetModal?: () => void;
}

export default function GuidedCounterCard({
  state,
  isPaused,
  currentExercise,
  currentSet,
  totalSets,
  currentExerciseIndex,
  totalExercises,
  trackingType,
  secondsRemaining,
  progress,
  targetReps,
  targetWeight,
  targetDurationSeconds,
  targetRestSeconds,
  actualReps,
  setActualReps,
  actualWeight,
  setActualWeight,
  isAudioMuted,
  setIsAudioMuted,
  startGuidedSet,
  pause,
  resume,
  skipLeadIn,
  completeWorkSet,
  skipRest,
  addRestSeconds,
  onOpenTargetModal,
}: GuidedCounterCardProps) {
  // Format MM:SS helper
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Cadence / Tempo pulse animation for active reps
  const [cadenceAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (state === 'ACTIVE_WORK' && trackingType !== 'duration' && !isPaused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(cadenceAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(cadenceAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      cadenceAnim.stopAnimation();
      cadenceAnim.setValue(0);
    }
  }, [state, trackingType, isPaused, cadenceAnim]);

  const cadenceScale = cadenceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.05],
  });

  return (
    <View style={styles.cardContainer}>
      {/* Top Meta Bar */}
      <View style={styles.topMetaBar}>
        <View style={styles.metaBadgeGroup}>
          <View
            style={[
              styles.statePill,
              state === 'READY' && styles.statePillReady,
              state === 'LEAD_IN' && styles.statePillLeadIn,
              state === 'ACTIVE_WORK' && styles.statePillWork,
              state === 'RESTING' && styles.statePillRest,
              state === 'PAUSED' && styles.statePillPaused,
            ]}
          >
            <View
              style={[
                styles.stateDot,
                state === 'READY' && { backgroundColor: '#64748B' },
                state === 'LEAD_IN' && { backgroundColor: '#F59E0B' },
                state === 'ACTIVE_WORK' && { backgroundColor: '#0284C7' },
                state === 'RESTING' && { backgroundColor: '#10B981' },
                state === 'PAUSED' && { backgroundColor: '#EF4444' },
              ]}
            />
            <Text
              style={[
                styles.statePillText,
                state === 'READY' && { color: '#475569' },
                state === 'LEAD_IN' && { color: '#D97706' },
                state === 'ACTIVE_WORK' && { color: '#0369A1' },
                state === 'RESTING' && { color: '#047857' },
                state === 'PAUSED' && { color: '#B91C1C' },
              ]}
            >
              {state === 'READY' && 'GUIDED READY'}
              {state === 'LEAD_IN' && 'GETTING READY'}
              {state === 'ACTIVE_WORK' && (trackingType === 'duration' ? 'HOLD ACTIVE' : 'ACTIVE SET')}
              {state === 'RESTING' && 'REST & RECOVER'}
              {state === 'PAUSED' && 'PAUSED'}
            </Text>
          </View>

          <Text style={styles.setCounterText}>
            Set {currentSet} of {totalSets}
          </Text>
        </View>

        {/* Right audio mute toggle */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setIsAudioMuted((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isAudioMuted ? 'volume-mute' : 'volume-high'}
            size={18}
            color={isAudioMuted ? '#94A3B8' : KinetixTheme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Dynamic Content Body */}
      {/* 1. STATE: READY */}
      {state === 'READY' && (
        <View style={styles.readyContent}>
          <View style={styles.readyInfoBox}>
            <Text style={styles.readyExerciseName}>{currentExercise?.name}</Text>
            <View style={styles.readyTargetRow}>
              <View style={styles.targetPill}>
                <Ionicons
                  name={trackingType === 'duration' ? 'timer-outline' : 'repeat-outline'}
                  size={14}
                  color={KinetixTheme.colors.primary}
                />
                <Text style={styles.targetPillText}>
                  {trackingType === 'duration'
                    ? `Target: ${targetDurationSeconds}s Hold`
                    : `Target: ${targetReps} reps${trackingType === 'weight_reps' && targetWeight > 0 ? ` @ ${targetWeight}kg` : ''}`}
                </Text>
              </View>

              <View style={[styles.targetPill, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                <Ionicons name="battery-charging-outline" size={14} color="#16A34A" />
                <Text style={[styles.targetPillText, { color: '#15803D' }]}>
                  {targetRestSeconds <= 0 ? 'Rest: 0s (Continuous)' : `Rest: ${targetRestSeconds}s`}
                </Text>
              </View>
            </View>

            {Boolean(currentExercise?.cue) && (
              <View style={styles.cueBox}>
                <Ionicons name="bulb-outline" size={14} color="#D97706" style={{ marginTop: 1 }} />
                <Text style={styles.cueText}>{currentExercise?.cue}</Text>
              </View>
            )}
          </View>

          {/* Start Guided Set Button */}
          <TouchableOpacity
            style={styles.startGuidedBtn}
            onPress={startGuidedSet}
            activeOpacity={0.88}
          >
            <Ionicons name="play" size={20} color="#FFFFFF" />
            <Text style={styles.startGuidedBtnText}>Start Guided Set</Text>
          </TouchableOpacity>

          {onOpenTargetModal && (
            <TouchableOpacity style={styles.adjustLink} onPress={onOpenTargetModal}>
              <Ionicons name="pencil" size={12} color={KinetixTheme.colors.primary} />
              <Text style={styles.adjustLinkText}>Adjust Target Parameters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 2. STATE: LEAD_IN (5s Countdown) */}
      {state === 'LEAD_IN' && (
        <View style={styles.leadInContent}>
          <CircularProgressRing
            size={160}
            strokeWidth={10}
            progress={1 - secondsRemaining / 5}
            color="#F59E0B"
            backgroundColor="#FEF3C7"
          >
            <View style={styles.leadInRingContent}>
              <View style={styles.timerRow}>
                <Text style={styles.leadInNumber} numberOfLines={1}>
                  {secondsRemaining}
                </Text>
              </View>
              <Text style={styles.leadInSub}>GET READY</Text>
            </View>
          </CircularProgressRing>

          <Text style={styles.leadInExerciseTitle}>{currentExercise?.name}</Text>
          <Text style={styles.leadInInstruction}>
            Assume starting position. Workout begins in {secondsRemaining}s...
          </Text>

          <TouchableOpacity style={styles.skipActionBtn} onPress={skipLeadIn} activeOpacity={0.7}>
            <Text style={styles.skipActionText}>Start Set Now</Text>
            <Ionicons name="arrow-forward" size={15} color={KinetixTheme.colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* 3. STATE: ACTIVE_WORK */}
      {state === 'ACTIVE_WORK' && (
        <View style={styles.activeWorkContent}>
          {trackingType === 'duration' ? (
            /* Duration Circular Countdown */
            <View style={styles.durationWorkView}>
              <CircularProgressRing
                size={180}
                strokeWidth={12}
                progress={progress}
                color={KinetixTheme.colors.primary}
                backgroundColor="#E2E8F0"
              >
                <View style={styles.durationRingCenter}>
                  <View style={styles.timerRow}>
                    <Text style={styles.durationDigits} numberOfLines={1}>
                      {formatTimer(secondsRemaining)}
                    </Text>
                  </View>
                  <Text style={styles.durationRingLabel}>HOLD TIME</Text>
                  <Text style={styles.durationTargetSmall}>
                    {currentExercise?.hold_seconds_per_rep ||
                    (currentExercise?.name || '').toLowerCase().includes('mcgill') ||
                    (currentExercise?.name || '').toLowerCase().includes('bird-dog')
                      ? `${targetReps} reps × ${currentExercise?.hold_seconds_per_rep || 10}s (${targetDurationSeconds}s)`
                      : `Target: ${targetDurationSeconds}s`}
                  </Text>
                </View>
              </CircularProgressRing>

              {Boolean(currentExercise?.cue) && (
                <View style={styles.cueBoxWork}>
                  <Text style={styles.cueTextWork}>{currentExercise?.cue}</Text>
                </View>
              )}

              {/* Action Buttons for Duration */}
              <View style={styles.workActionRow}>
                <TouchableOpacity
                  style={styles.workSecondaryBtn}
                  onPress={isPaused ? resume : pause}
                  activeOpacity={0.7}
                >
                  <Ionicons name={isPaused ? 'play' : 'pause'} size={18} color="#475569" />
                  <Text style={styles.workSecondaryBtnText}>{isPaused ? 'Resume' : 'Pause'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.workPrimaryBtn}
                  onPress={() => completeWorkSet(actualReps, actualWeight)}
                  activeOpacity={0.88}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.workPrimaryBtnText}>Finish Set & Rest</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Reps & Load Interactive Guided View */
            <View style={styles.repsWorkView}>
              {/* Cadence Tempo Pulse Banner */}
              <Animated.View style={[styles.cadencePill, { transform: [{ scale: cadenceScale }] }]}>
                <Ionicons name="pulse" size={16} color={KinetixTheme.colors.primary} />
                <Text style={styles.cadencePillText}>
                  Paced Tempo: Steady & Controlled Form
                </Text>
              </Animated.View>

              {/* Reps and Load Selectors */}
              <View style={styles.stepperContainer}>
                {/* Reps Stepper */}
                <View style={styles.stepperBox}>
                  <Text style={styles.stepperLabel}>REPS</Text>
                  <View style={styles.stepperControlRow}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setActualReps(Math.max(1, actualReps - 1))}
                    >
                      <Ionicons name="remove" size={18} color={KinetixTheme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.stepperBigValue}>{actualReps}</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setActualReps(actualReps + 1)}
                    >
                      <Ionicons name="add" size={18} color={KinetixTheme.colors.text} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.stepperTargetSub}>Target: {targetReps} reps</Text>
                </View>

                {/* Weight Stepper (if weight_reps) */}
                {trackingType === 'weight_reps' && (
                  <View style={styles.stepperBox}>
                    <Text style={styles.stepperLabel}>LOAD (KG)</Text>
                    <View style={styles.stepperControlRow}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => setActualWeight(Math.max(0, actualWeight - 2.5))}
                      >
                        <Text style={styles.stepperSmallOp}>-2.5</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperBigValue}>{actualWeight}</Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => setActualWeight(actualWeight + 2.5)}
                      >
                        <Text style={styles.stepperSmallOp}>+2.5</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.stepperTargetSub}>
                      Target: {targetWeight > 0 ? `${targetWeight}kg` : 'Bodyweight'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Big "Finish Set & Rest" Button */}
              <TouchableOpacity
                style={styles.logAndRestBtn}
                onPress={() => completeWorkSet(actualReps, actualWeight)}
                activeOpacity={0.88}
              >
                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                <Text style={styles.logAndRestBtnText}>
                  {targetRestSeconds <= 0
                    ? 'Finish Set & Continue (0s Rest)'
                    : `Finish Set & Start Rest (${targetRestSeconds}s)`}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* 4. STATE: RESTING */}
      {state === 'RESTING' && (
        <View style={styles.restingContent}>
          <CircularProgressRing
            size={180}
            strokeWidth={12}
            progress={progress}
            color="#10B981"
            backgroundColor="#D1FAE5"
          >
            <View style={styles.restRingCenter}>
              <View style={styles.timerRow}>
                <Text style={styles.restDigits} numberOfLines={1}>
                  {formatTimer(secondsRemaining)}
                </Text>
              </View>
              <Text style={styles.restRingLabel}>RECOVERY REST</Text>
              <Text style={styles.restTotalTarget}>Target: {targetRestSeconds}s</Text>
            </View>
          </CircularProgressRing>

          {/* Option A Auto-Advance Pill */}
          <View style={styles.autoAdvanceBanner}>
            <Ionicons name="flash" size={14} color="#059669" />
            <Text style={styles.autoAdvanceText}>
              Auto-advancing to Next Set in {secondsRemaining}s
            </Text>
          </View>

          {/* Rest Controls */}
          <View style={styles.restControlsRow}>
            <TouchableOpacity
              style={styles.restAdjustBtn}
              onPress={() => addRestSeconds(30)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color={KinetixTheme.colors.text} />
              <Text style={styles.restAdjustBtnText}>+30s Rest</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipRestBtn}
              onPress={skipRest}
              activeOpacity={0.88}
            >
              <Text style={styles.skipRestBtnText}>Skip Rest</Text>
              <Ionicons name="play-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 5. STATE: PAUSED OVERLAY BANNER */}
      {isPaused && (
        <View style={styles.pausedBanner}>
          <Ionicons name="pause-circle" size={18} color="#B91C1C" />
          <Text style={styles.pausedBannerText}>Guided Trainer Paused</Text>
          <TouchableOpacity style={styles.resumeBannerBtn} onPress={resume}>
            <Text style={styles.resumeBannerBtnText}>Resume</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    ...KinetixTheme.shadows.card,
  },
  topMetaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  metaBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  statePillReady: {
    backgroundColor: '#F1F5F9',
  },
  statePillLeadIn: {
    backgroundColor: '#FEF3C7',
  },
  statePillWork: {
    backgroundColor: '#E0F2FE',
  },
  statePillRest: {
    backgroundColor: '#ECFDF5',
  },
  statePillPaused: {
    backgroundColor: '#FEE2E2',
  },
  stateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  setCounterText: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.textSecondary,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Ready State Styles
  readyContent: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  readyInfoBox: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 14,
  },
  readyExerciseName: {
    fontSize: 20,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  readyTargetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  targetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  targetPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  cueBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    width: '100%',
  },
  cueText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
  },
  startGuidedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: KinetixTheme.colors.primary,
    width: '100%',
    paddingVertical: 14,
    borderRadius: KinetixTheme.borderRadius.lg,
    gap: 8,
    ...KinetixTheme.shadows.primaryGlow,
  },
  startGuidedBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  adjustLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  adjustLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: KinetixTheme.colors.primary,
  },

  // Lead-in Styles
  leadInContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  leadInRingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  leadInNumber: {
    fontSize: 50,
    fontWeight: '900',
    color: '#D97706',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    includeFontPadding: false,
    letterSpacing: 0,
    lineHeight: 56,
  },
  leadInSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 2,
  },
  leadInExerciseTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    marginTop: 14,
    textAlign: 'center',
  },
  leadInInstruction: {
    fontSize: 12,
    color: KinetixTheme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  skipActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  skipActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: KinetixTheme.colors.primary,
  },

  // Active Work Styles
  activeWorkContent: {
    alignItems: 'center',
    width: '100%',
  },
  durationWorkView: {
    alignItems: 'center',
    width: '100%',
  },
  durationRingCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  durationDigits: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    includeFontPadding: false,
    letterSpacing: 0.5,
    lineHeight: 40,
  },
  durationRingLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.5,
    marginTop: 3,
    textAlign: 'center',
  },
  durationTargetSmall: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  cueBoxWork: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
  },
  cueTextWork: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    fontWeight: '500',
  },
  workActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 14,
  },
  workSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: KinetixTheme.borderRadius.md,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  workSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  workPrimaryBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: KinetixTheme.colors.primary,
    paddingVertical: 12,
    borderRadius: KinetixTheme.borderRadius.md,
    gap: 6,
    ...KinetixTheme.shadows.primaryGlow,
  },
  workPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Reps Work View
  repsWorkView: {
    width: '100%',
    alignItems: 'center',
  },
  cadencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  cadencePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  stepperContainer: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 14,
  },
  stepperBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: KinetixTheme.borderRadius.md,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  stepperControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 6,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSmallOp: {
    fontSize: 11,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  stepperBigValue: {
    fontSize: 24,
    fontWeight: '900',
    color: KinetixTheme.colors.text,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    minWidth: 40,
  },
  stepperTargetSub: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  logAndRestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: KinetixTheme.colors.primary,
    width: '100%',
    paddingVertical: 14,
    borderRadius: KinetixTheme.borderRadius.lg,
    gap: 8,
    ...KinetixTheme.shadows.primaryGlow,
  },
  logAndRestBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Resting View
  restingContent: {
    alignItems: 'center',
    width: '100%',
  },
  restRingCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  restDigits: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    includeFontPadding: false,
    letterSpacing: 0.5,
    lineHeight: 40,
  },
  restRingLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 1.5,
    marginTop: 3,
    textAlign: 'center',
  },
  restTotalTarget: {
    fontSize: 11,
    color: '#6EE7B7',
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  autoAdvanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  autoAdvanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  restControlsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 14,
  },
  restAdjustBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: KinetixTheme.borderRadius.md,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  restAdjustBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  skipRestBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: KinetixTheme.borderRadius.md,
    gap: 6,
    ...KinetixTheme.shadows.primaryGlow,
  },
  skipRestBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Paused Banner
  pausedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
  },
  pausedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
  },
  resumeBannerBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  resumeBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
