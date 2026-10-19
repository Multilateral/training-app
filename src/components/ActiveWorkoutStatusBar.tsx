import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { KinetixTheme } from '../constants/theme';
import { TrainingContext } from '../context/TrainingContext';

export default function ActiveWorkoutStatusBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeSessionMetadata } = useContext(TrainingContext) || {};

  // Pulse animation for the live recording indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  // Live elapsed duration stopwatch
  const startTime = activeSessionMetadata?.startTime || null;
  const [elapsedSecs, setElapsedSecs] = useState<number>(() => {
    if (!startTime || typeof startTime !== 'number') return 0;
    return Math.max(0, Math.floor((Date.now() - startTime) / 1000));
  });

  useEffect(() => {
    if (!startTime || typeof startTime !== 'number') return;
    const interval = setInterval(() => {
      setElapsedSecs(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Rest and Paused states
  const isResting = Boolean(
    activeSessionMetadata?.guidedPlayerState === 'RESTING' ||
    activeSessionMetadata?.manualIsResting
  );
  const isPaused = Boolean(
    activeSessionMetadata?.guidedPlayerState === 'PAUSED' ||
    activeSessionMetadata?.wasAutoPaused ||
    activeSessionMetadata?.isPaused
  );
  const restEndTime = activeSessionMetadata?.guidedEndTime || activeSessionMetadata?.manualRestEndTime || null;

  const [restSecsRemaining, setRestSecsRemaining] = useState<number>(() => {
    if (restEndTime && restEndTime > Date.now()) {
      return Math.ceil((restEndTime - Date.now()) / 1000);
    }
    return activeSessionMetadata?.guidedSecondsRemaining || activeSessionMetadata?.manualRestSecondsLeft || 0;
  });

  useEffect(() => {
    if (!isResting || !restEndTime) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((restEndTime - Date.now()) / 1000));
      setRestSecsRemaining(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [isResting, restEndTime]);

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't render if there's no active session or if already on the active workout screen
  if (!activeSessionMetadata?.isActive || pathname.includes('active-workout')) {
    return null;
  }

  const exerciseName = activeSessionMetadata.currentExerciseName || 'Active Exercise';
  const currentSet = activeSessionMetadata.currentSet || 1;
  const totalSets = activeSessionMetadata.totalSets || 4;
  const worksessionName = activeSessionMetadata.worksessionName || 'Workout Routine';

  return (
    <View style={styles.outerWrapper}>
      <TouchableOpacity
        style={[
          styles.statusBarCard,
          isPaused && styles.statusBarCardPaused,
          isResting && styles.statusBarCardResting,
        ]}
        onPress={() => router.push('/active-workout')}
        activeOpacity={0.92}
      >
        {/* Left: Animated Live Pulsing Indicator & Details */}
        <View style={styles.leftCol}>
          <View style={styles.indicatorWrapper}>
            <Animated.View
              style={[
                styles.pulseCircle,
                { opacity: isPaused ? 0.3 : pulseAnim },
                isPaused && styles.pulseCirclePaused,
                isResting && styles.pulseCircleResting,
              ]}
            />
            <View
              style={[
                styles.coreDot,
                isPaused && styles.coreDotPaused,
                isResting && styles.coreDotResting,
              ]}
            />
          </View>

          <View style={styles.textContainer}>
            <View style={styles.statusBadgeRow}>
              <Text
                style={[
                  styles.statusBadgeText,
                  isPaused && styles.statusBadgeTextPaused,
                  isResting && styles.statusBadgeTextResting,
                ]}
              >
                {isResting
                  ? 'RECOVERY REST'
                  : isPaused
                  ? 'WORKOUT PAUSED'
                  : 'WORKOUT IN PROGRESS'}
              </Text>
              <Text style={styles.worksessionTitle} numberOfLines={1}>
                • {worksessionName}
              </Text>
            </View>
            <Text style={styles.exerciseDetailText} numberOfLines={1}>
              {exerciseName}{' '}
              <Text style={styles.setHighlight}>
                (Set {currentSet}/{totalSets})
              </Text>
            </Text>
          </View>
        </View>

        {/* Right: Live Rest / Elapsed Duration & Resume Pill */}
        <View style={styles.rightCol}>
          {isResting ? (
            <View style={styles.restPill}>
              <Ionicons name="battery-charging" size={12} color="#10B981" style={{ marginRight: 3 }} />
              <Text style={styles.restPillText}>{formatDuration(restSecsRemaining)}</Text>
            </View>
          ) : (
            <View style={styles.elapsedPill}>
              <Ionicons name="time-outline" size={12} color={isPaused ? '#F59E0B' : '#00D09E'} style={{ marginRight: 3 }} />
              <Text style={[styles.elapsedText, isPaused && { color: '#F59E0B' }]}>
                {formatDuration(elapsedSecs)}
              </Text>
            </View>
          )}

          <View style={[styles.resumeBtn, isPaused && styles.resumeBtnAmber]}>
            <Ionicons name={isPaused ? 'play' : 'enter-outline'} size={13} color="#FFFFFF" style={{ marginRight: 3 }} />
            <Text style={styles.resumeBtnText}>{isPaused ? 'Resume' : 'Active'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    paddingHorizontal: 12,
    paddingBottom: 6,
    backgroundColor: 'transparent',
  },
  statusBarCard: {
    backgroundColor: '#0F172A', // Sleek deep athletic slate
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  statusBarCardPaused: {
    borderColor: '#78350F',
    backgroundColor: '#1E1710',
    shadowColor: '#F59E0B',
  },
  statusBarCardResting: {
    borderColor: '#064E3B',
    backgroundColor: '#061C14',
    shadowColor: '#10B981',
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
    gap: 10,
  },
  indicatorWrapper: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(16, 185, 129, 0.35)', // Emerald pulse
  },
  pulseCirclePaused: {
    backgroundColor: 'rgba(245, 158, 11, 0.35)',
  },
  pulseCircleResting: {
    backgroundColor: 'rgba(16, 185, 129, 0.45)',
  },
  coreDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: KinetixTheme.colors.secondary, // Emerald solid core
  },
  coreDotPaused: {
    backgroundColor: '#F59E0B',
  },
  coreDotResting: {
    backgroundColor: '#10B981',
  },
  textContainer: {
    flex: 1,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399', // Emerald 400
    letterSpacing: 0.8,
  },
  statusBadgeTextPaused: {
    color: '#FBBF24', // Amber 400
  },
  statusBadgeTextResting: {
    color: '#34D399', // Emerald 400
  },
  worksessionTitle: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
    flex: 1,
  },
  exerciseDetailText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1,
  },
  setHighlight: {
    color: '#60A5FA', // Light blue
    fontWeight: '600',
    fontSize: 12,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  elapsedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
  },
  elapsedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34D399',
    fontVariant: ['tabular-nums'],
  },
  restPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
  },
  restPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34D399',
    fontVariant: ['tabular-nums'],
  },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KinetixTheme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  resumeBtnAmber: {
    backgroundColor: '#D97706',
    shadowColor: '#D97706',
  },
  resumeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
