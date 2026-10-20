import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  LayoutChangeEvent,
} from 'react-native';
import Svg, {
  Path,
  Line,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { KinetixTheme } from '../../constants/theme';

export interface SineWaveCadenceVisualizerProps {
  /** Continuous elapsed active work time in milliseconds */
  elapsedWorkMs?: number;
  /** Normalized progress through current rep (0.0 to 1.0) */
  repProgress?: number;
  /** Current 1-based rep index */
  currentRepNumber?: number;
  /** Total target reps in set */
  totalReps?: number;
  /** Target duration for a single rep cycle in ms */
  repDurationMs?: number;
  /** Overall set seconds remaining */
  secondsRemaining?: number;
  /** Whether the player is currently paused */
  isPaused: boolean;
  /** Exercise display title */
  exerciseName?: string;
  /** Exercise tracking type (reps vs duration) */
  trackingType?: string;
  /** Active audio pacer mode */
  audioPacerMode?: 'pulse' | 'tones' | 'metronome' | 'mute';
  /** Wave mathematical profile */
  waveProfile?: 'symmetric_sine' | 'isometric_hold' | 'skewed_tempo';
  /** Hold plateau duration in ms for isometric holds (default 10,000ms) */
  holdDurationMs?: number;
  /** Reset / switch sides duration in ms for isometric holds (default 2,000ms) */
  resetDurationMs?: number;
  /** Rise / climb duration in ms (default 1,500ms) */
  riseDurationMs?: number;
}

export default function SineWaveCadenceVisualizer({
  elapsedWorkMs = 0,
  repProgress = 0,
  currentRepNumber = 1,
  totalReps = 10,
  repDurationMs = 4500,
  secondsRemaining = 0,
  isPaused = false,
  exerciseName = 'Cat-Cow Stretch',
  trackingType = 'reps',
  audioPacerMode = 'metronome',
  waveProfile,
  holdDurationMs,
  resetDurationMs,
  riseDurationMs = 1500,
}: SineWaveCadenceVisualizerProps) {
  // Container layout measurement for responsive canvas
  const [containerWidth, setContainerWidth] = useState<number>(330);
  const canvasHeight = 165;
  const paddingX = 28;
  const usableWidth = Math.max(100, containerWidth - paddingX * 2);
  const yMid = 82;
  const amplitude = 44;

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 50 && Math.abs(width - containerWidth) > 2) {
      setContainerWidth(width);
    }
  };

  // High-precision smooth continuous clock:
  // Interpolates smoothly between 50ms player state updates
  const [continuousMs, setContinuousMs] = useState<number>(elapsedWorkMs);
  const lastSyncTimeRef = useRef<number>(Date.now());
  const lastElapsedRef = useRef<number>(elapsedWorkMs);

  useEffect(() => {
    lastSyncTimeRef.current = Date.now();
    lastElapsedRef.current = elapsedWorkMs;
    setContinuousMs(elapsedWorkMs);
  }, [elapsedWorkMs]);

  useEffect(() => {
    if (isPaused) return;

    let animId: any = null;
    const tick = () => {
      const now = Date.now();
      const delta = now - lastSyncTimeRef.current;
      setContinuousMs(lastElapsedRef.current + delta);
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPaused]);

  // Wave cycle profile & timing resolution
  const nameLower = (exerciseName || '').toLowerCase();
  const isCatCow = nameLower.includes('cat-cow') || nameLower.includes('cat cow');
  const isMcGill = nameLower.includes('bird-dog') || nameLower.includes('mcgill');
  const isGenericHold =
    trackingType === 'duration' ||
    nameLower.includes('plank') ||
    nameLower.includes('wall sit') ||
    nameLower.includes('hold');

  const effectiveWaveProfile: 'symmetric_sine' | 'isometric_hold' | 'skewed_tempo' =
    waveProfile || (isMcGill ? 'isometric_hold' : 'symmetric_sine');

  // Wave cycle period in milliseconds (minimum 1500ms safety floor)
  const T = Math.max(1500, repDurationMs);
  const holdMs =
    typeof holdDurationMs === 'number' && holdDurationMs > 0
      ? holdDurationMs
      : effectiveWaveProfile === 'isometric_hold'
      ? Math.max(1000, T - (resetDurationMs || 2000))
      : T * 0.5;
  const resetMs =
    typeof resetDurationMs === 'number' && resetDurationMs > 0
      ? resetDurationMs
      : effectiveWaveProfile === 'isometric_hold'
      ? Math.max(500, T - holdMs)
      : T * 0.5;
  const riseMs = Math.min(riseDurationMs, holdMs * 0.35);

  // Crest and Trough Y coords
  const crestY = yMid - amplitude; // Top (38)
  const troughY = yMid + amplitude; // Bottom (126)

  // Continuous mathematical elevation function:
  // Evaluates screen Y for any timestamp (ms) with continuous C^1 smoothness
  const getWaveElevation = (timeValMs: number): number => {
    const tau = ((timeValMs % T) + T) % T;

    if (effectiveWaveProfile === 'isometric_hold') {
      if (tau < riseMs) {
        // Smooth quarter-cosine climb from troughY to crestY
        const alpha = tau / riseMs;
        return yMid + amplitude * Math.cos(Math.PI * alpha);
      }
      if (tau < holdMs) {
        // Flat crest plateau at peak extension
        return crestY;
      }
      // Smooth quarter-cosine descent from crestY back to troughY during switch/release
      const beta = (tau - holdMs) / Math.max(1, resetMs);
      return yMid - amplitude * Math.cos(Math.PI * Math.min(1, beta));
    }

    // Default symmetric sinusoidal wave:
    return yMid + amplitude * Math.cos((2 * Math.PI * tau) / T);
  };

  // Continuous workout phase at current time
  const t = Math.max(0, continuousMs);
  const tau = ((t % T) + T) % T;

  // Anchored horizontal focal point where the athlete's dot rides the wave:
  // Placed at 45% of usable width so athlete sees approaching crests on the right
  const focalX = paddingX + usableWidth * 0.45;

  // Spatial wavelength of the scrolling wave:
  // Covers ~72% of usable width, displaying ~1.4 full undulating waves across the screen
  const wavelength = usableWidth * 0.72;

  // Dot vertical elevation at focalX
  const dotY = getWaveElevation(t);

  // Phase and motion state detection
  let isAscending = false;
  let isHolding = false;
  let isResetting = false;

  if (effectiveWaveProfile === 'isometric_hold') {
    if (tau < riseMs) {
      isAscending = true;
    } else if (tau < holdMs) {
      isHolding = true;
    } else {
      isResetting = true;
    }
  } else {
    isAscending = Math.sin((2 * Math.PI * tau) / T) > 0;
  }

  // Dynamic context-aware phase cues and clinical instructions
  let phaseColor = '#0284C7'; // Blue for ascending/inhale/brace
  let phaseTitle = 'CAT • ARCH UP';
  let phaseAction = 'Inhale deeply & round spine upwards';

  if (effectiveWaveProfile === 'isometric_hold') {
    if (isHolding) {
      const holdSecsLeft = Math.max(0, Math.ceil((holdMs - tau) / 1000));
      phaseColor = '#0284C7';
      phaseTitle = `HOLD ISOMETRIC • ${holdSecsLeft}s`;
      phaseAction = isMcGill
        ? 'Reach long through fingertips and heel, maintain rigid core'
        : 'Maintain rigid core brace & stay locked';
    } else if (isResetting) {
      const switchSecsLeft = Math.max(0, Math.ceil((T - tau) / 1000));
      phaseColor = '#10B981';
      phaseTitle = `SWITCH SIDES • ${switchSecsLeft}s`;
      phaseAction = isMcGill
        ? 'Smooth controlled return and switch to opposite side'
        : 'Controlled release to starting base';
    } else {
      phaseColor = '#38BDF8';
      phaseTitle = 'EXTEND & ENGAGE';
      phaseAction = isMcGill
        ? 'Drive opposite arm and leg out into full alignment'
        : 'Controlled drive into hold posture';
    }
  } else if (isCatCow) {
    phaseColor = isAscending ? '#0284C7' : '#10B981';
    phaseTitle = isAscending ? 'CAT • ARCH UP' : 'COW • DIP DOWN';
    phaseAction = isAscending
      ? 'Inhale deeply & round spine upwards'
      : 'Exhale slowly & drop belly downwards';
  } else if (isGenericHold) {
    phaseColor = isAscending ? '#0284C7' : '#10B981';
    phaseTitle = isAscending ? 'INHALE & BRACE CORE' : 'EXHALE & STABILIZE';
    phaseAction = isAscending
      ? 'Inhale into ribs 360°, maintain core brace'
      : 'Slow continuous exhale over rigid core';
  } else {
    phaseColor = isAscending ? '#0284C7' : '#10B981';
    phaseTitle = isAscending ? 'DRIVE UP • EXTEND' : 'CONTROL • RETURN';
    phaseAction = isAscending
      ? 'Controlled upward drive under tension'
      : 'Smooth controlled return to start position';
  }

  // Pulse animation for the glowing dot halo
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isPaused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.35,
            duration: 850,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 850,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isPaused, pulseAnim]);

  // Continuous traveling wave paths generation:
  // Dynamically uses getWaveElevation(t) so the visual wave matches dot elevation with zero jitter!
  // Wave smoothly scrolls from right to left as continuousMs increases.
  const { elapsedPath, approachingPath } = useMemo(() => {
    const startX = paddingX;
    const endX = containerWidth - paddingX;
    const sampleSteps = 60;
    const stepDx = (endX - startX) / sampleSteps;

    const elapsedPoints: string[] = [];
    const approachingPoints: string[] = [];

    // Calculate exact focal Y to connect paths cleanly
    const focalY = getWaveElevation(continuousMs);

    // 1. Elapsed path: from startX up to focalX (left side)
    const elapsedSteps = Math.round((focalX - startX) / stepDx);
    for (let i = 0; i <= elapsedSteps; i++) {
      const x = startX + i * stepDx;
      const timeAtX = continuousMs + ((x - focalX) / wavelength) * T;
      const y = getWaveElevation(timeAtX);
      elapsedPoints.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    // Connect accurately to focal dot
    elapsedPoints.push(`L ${focalX.toFixed(1)} ${focalY.toFixed(1)}`);

    // 2. Approaching path: from focalX up to endX (right side)
    approachingPoints.push(`M ${focalX.toFixed(1)} ${focalY.toFixed(1)}`);
    const approachingSteps = Math.round((endX - focalX) / stepDx);
    for (let i = 1; i <= approachingSteps; i++) {
      const x = focalX + i * stepDx;
      const timeAtX = continuousMs + ((x - focalX) / wavelength) * T;
      const y = getWaveElevation(timeAtX);
      approachingPoints.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
    }

    return {
      elapsedPath: elapsedPoints.join(' '),
      approachingPath: approachingPoints.join(' '),
    };
  }, [
    containerWidth,
    paddingX,
    focalX,
    wavelength,
    continuousMs,
    T,
    holdMs,
    resetMs,
    riseMs,
    effectiveWaveProfile,
    yMid,
    amplitude,
  ]);

  return (
    <View style={styles.cardContainer} onLayout={handleLayout}>
      {/* SVG Continuous Traveling Wave Stage */}
      <View style={[styles.canvasStage, { height: canvasHeight }]}>
        <Svg width={containerWidth} height={canvasHeight}>
          <Defs>
            {/* Linear gradient for active elapsed stroke */}
            <LinearGradient id="travelingGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <Stop offset="0%" stopColor="#10B981" stopOpacity="0.85" />
              <Stop offset="50%" stopColor="#0284C7" stopOpacity="1" />
              <Stop offset="100%" stopColor="#38BDF8" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Crest Guideline (Top / Cat) */}
          <Line
            x1={paddingX - 12}
            y1={crestY}
            x2={containerWidth - paddingX + 12}
            y2={crestY}
            stroke="#BAE6FD"
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.8}
          />

          {/* Neutral Spine Midline */}
          <Line
            x1={paddingX - 12}
            y1={yMid}
            x2={containerWidth - paddingX + 12}
            y2={yMid}
            stroke="#E2E8F0"
            strokeWidth={1}
            strokeDasharray="2,3"
            opacity={0.7}
          />

          {/* Trough Guideline (Bottom / Cow) */}
          <Line
            x1={paddingX - 12}
            y1={troughY}
            x2={containerWidth - paddingX + 12}
            y2={troughY}
            stroke="#BBF7D0"
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.8}
          />

          {/* Vertical Focal Beacon Track */}
          <Line
            x1={focalX}
            y1={crestY - 4}
            x2={focalX}
            y2={troughY + 4}
            stroke="#94A3B8"
            strokeWidth={1}
            strokeDasharray="2,4"
            opacity={0.35}
          />

          {/* Approaching Future Wave (Right Side: Predictive Guide Track) */}
          <Path
            d={approachingPath}
            stroke="#CBD5E1"
            strokeWidth={3}
            strokeDasharray="5,4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={0.75}
          />

          {/* Elapsed Wave Glow Underlayer (Left Side: Illuminated Energy Trail) */}
          <Path
            d={elapsedPath}
            stroke={phaseColor}
            strokeWidth={10}
            strokeOpacity={0.22}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Elapsed Wave Core Line (Left Side) */}
          <Path
            d={elapsedPath}
            stroke="url(#travelingGrad)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>

        {/* Reference Labels on Canvas */}
        <View style={[styles.crestLabelContainer, { top: crestY - 19, left: paddingX }]}>
          <View style={styles.labelInstructionRow}>
            <Text style={styles.crestLabelText}>
              {effectiveWaveProfile === 'isometric_hold'
                ? '▲ EXTEND / HOLD PLATEAU'
                : isCatCow
                ? '▲ CAT (ARCH CREST)'
                : isGenericHold
                ? '▲ INHALE / BRACE CREST'
                : '▲ EXTEND / HOLD CREST'}
            </Text>
            <Text style={styles.crestInstructionText} numberOfLines={1}>
              {effectiveWaveProfile === 'isometric_hold'
                ? ` • ${Math.round(holdMs / 1000)}s isometric hold at peak extension`
                : isCatCow
                ? ' • Inhale deeply & round spine upwards'
                : isGenericHold
                ? ' • Inhale into ribs 360°, brace core'
                : ' • Reach long & hold rigid posture'}
            </Text>
          </View>
        </View>

        <View style={[styles.troughLabelContainer, { top: troughY + 5, left: paddingX }]}>
          <View style={styles.labelInstructionRow}>
            <Text style={styles.troughLabelText}>
              {effectiveWaveProfile === 'isometric_hold'
                ? '▼ RELEASE / SWITCH SIDES'
                : isCatCow
                ? '▼ COW (DIP BASE)'
                : isGenericHold
                ? '▼ EXHALE / STABILIZE BASE'
                : '▼ RETURN / RESET BASE'}
            </Text>
            <Text style={styles.troughInstructionText} numberOfLines={1}>
              {effectiveWaveProfile === 'isometric_hold'
                ? ` • ${Math.round(resetMs / 1000)}s switch sides for next rep`
                : isCatCow
                ? ' • Exhale slowly & drop belly downwards'
                : isGenericHold
                ? ' • Slow continuous exhale over core'
                : ' • Smooth controlled return to start'}
            </Text>
          </View>
        </View>

        <View style={[styles.neutralLabelContainer, { top: yMid - 8, right: paddingX - 16 }]}>
          <Text style={styles.neutralLabelText}>NEUTRAL</Text>
        </View>

        {/* Anchored Focal Dot Riding the Traveling Wave */}
        <View
          style={[
            styles.dotAnchor,
            {
              transform: [{ translateX: focalX - 20 }, { translateY: dotY - 20 }],
            },
          ]}
          pointerEvents="none"
        >
          {/* Animated Pulsing Outer Halo */}
          <Animated.View
            style={[
              styles.dotHalo,
              {
                backgroundColor: phaseColor + '28',
                borderColor: phaseColor + '55',
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />

          {/* Inner Accent Ring */}
          <View style={[styles.dotInnerRing, { borderColor: phaseColor + '99' }]}>
            {/* Center Solid Core Dot */}
            <View style={[styles.dotCore, { backgroundColor: phaseColor }]} />
          </View>
        </View>

        {/* Paused Overlay */}
        {isPaused && (
          <View style={styles.pausedOverlay}>
            <View style={styles.pausedBadge}>
              <Ionicons name="pause" size={14} color="#B91C1C" />
              <Text style={styles.pausedText}>PAUSED</Text>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Info Bar & Audio Pacing Feedback */}
      <View style={styles.bottomBar}>
        <View style={styles.repPill}>
          <Ionicons name="repeat" size={12} color="#0369A1" />
          <Text style={styles.repPillText}>
            {effectiveWaveProfile === 'isometric_hold'
              ? `Rep ${currentRepNumber} / ${totalReps} (${Math.round(holdMs / 1000)}s hold + ${Math.round(resetMs / 1000)}s switch)`
              : isGenericHold
              ? `Breath Cycle ${currentRepNumber} / ${totalReps}`
              : `Rep ${currentRepNumber} / ${totalReps}`}
          </Text>
        </View>

        {/* Pulsating Audio Indicator */}
        <View
          style={[
            styles.audioIndicatorPill,
            audioPacerMode === 'pulse' && styles.audioIndicatorPillActive,
          ]}
        >
          <Ionicons
            name={
              audioPacerMode === 'pulse'
                ? 'pulse'
                : audioPacerMode === 'mute'
                ? 'volume-mute'
                : 'musical-notes'
            }
            size={13}
            color={audioPacerMode === 'pulse' ? '#0284C7' : '#64748B'}
          />
          <Text
            style={[
              styles.audioIndicatorText,
              audioPacerMode === 'pulse' && styles.audioIndicatorTextActive,
            ]}
          >
            {audioPacerMode === 'pulse'
              ? 'Pulsing Audio Active'
              : audioPacerMode === 'tones'
              ? 'Phase Tones Active'
              : audioPacerMode === 'metronome'
              ? 'Tick Active'
              : 'Audio Muted'}
          </Text>
        </View>

        <Text style={styles.paceSubText}>
          {(T / 1000).toFixed(1)}s pace
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  canvasStage: {
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFCFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    marginVertical: 4,
  },
  crestLabelContainer: {
    position: 'absolute',
  },
  labelInstructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 290,
  },
  crestLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  crestInstructionText: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#0369A1',
    letterSpacing: 0.2,
  },
  troughLabelContainer: {
    position: 'absolute',
  },
  troughLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  troughInstructionText: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#047857',
    letterSpacing: 0.2,
  },
  neutralLabelContainer: {
    position: 'absolute',
  },
  neutralLabelText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  dotAnchor: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotHalo: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
  },
  dotInnerRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  dotCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pausedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pausedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pausedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B91C1C',
    letterSpacing: 0.6,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  repPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  repPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  audioIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  audioIndicatorPillActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  audioIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  audioIndicatorTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  paceSubText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
});
