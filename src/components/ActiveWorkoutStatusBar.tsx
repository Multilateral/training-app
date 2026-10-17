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
  const { activeSessionMetadata, setActiveSessionMetadata } = useContext(TrainingContext) || {};

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

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't render if there's no active session or if already on the active workout screen
  if (!activeSessionMetadata?.isActive || pathname.includes('active-workout')) {
    return null;
  }

  const exerciseName = activeSessionMetadata.currentExerciseName || 'Spanish Squat Hold';
  const currentSet = activeSessionMetadata.currentSet || 3;
  const totalSets = activeSessionMetadata.totalSets || 4;
  const worksessionName = activeSessionMetadata.worksessionName || 'Strength & Recovery Sequence';

  return (
    <View style={styles.outerWrapper}>
      <TouchableOpacity
        style={styles.statusBarCard}
        onPress={() => router.push('/active-workout')}
        activeOpacity={0.92}
      >
        {/* Left: Animated Live Pulsing Indicator & Details */}
        <View style={styles.leftCol}>
          <View style={styles.indicatorWrapper}>
            <Animated.View style={[styles.pulseCircle, { opacity: pulseAnim }]} />
            <View style={styles.coreDot} />
          </View>

          <View style={styles.textContainer}>
            <View style={styles.statusBadgeRow}>
              <Text style={styles.statusBadgeText}>WORKOUT IN PROGRESS</Text>
              <Text style={styles.worksessionTitle} numberOfLines={1}>
                • {worksessionName}
              </Text>
            </View>
            <Text style={styles.exerciseDetailText} numberOfLines={1}>
              {exerciseName} <Text style={styles.setHighlight}>(Set {currentSet}/{totalSets})</Text>
            </Text>
          </View>
        </View>

        {/* Right: Live Elapsed Duration & Resume Pill */}
        <View style={styles.rightCol}>
          <View style={styles.elapsedPill}>
            <Ionicons name="time-outline" size={12} color="#00D09E" style={{ marginRight: 3 }} />
            <Text style={styles.elapsedText}>{formatDuration(elapsedSecs)}</Text>
          </View>

          <View style={styles.resumeBtn}>
            <Ionicons name="play" size={13} color="#FFFFFF" style={{ marginRight: 3 }} />
            <Text style={styles.resumeBtnText}>Resume</Text>
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
  coreDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: KinetixTheme.colors.secondary, // Emerald solid core
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
  resumeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
