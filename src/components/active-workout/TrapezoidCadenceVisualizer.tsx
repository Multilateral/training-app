import React, { useRef, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line } from 'react-native-svg';

export interface TrapezoidCadenceVisualizerProps {
  /** Continuous elapsed active work time in milliseconds */
  elapsedWorkMs?: number;
  /** Current rep progress between 0 and 1 */
  repProgress?: number;
  /** 1-based rep index */
  currentRepNumber?: number;
  /** Total target reps */
  totalReps?: number;
  /** Cycle period per rep in ms */
  repDurationMs?: number;
  /** Global set countdown seconds left */
  secondsRemaining?: number;
  /** Pause status */
  isPaused?: boolean;
  /** Exercise display name */
  exerciseName?: string;
  /** Tracking type */
  trackingType?: string;
  /** Audio pacer mode */
  audioPacerMode?: 'pulse' | 'tones' | 'metronome' | 'mute';

  // Universal Trapezoid Geometry Durations
  lowDurationMs?: number;
  rampUpDurationMs?: number;
  highDurationMs?: number;
  rampDownDurationMs?: number;

  // Semantic Phase Names & Flags
  highPhaseName?: string;
  lowPhaseName?: string;
  isUnilateral?: boolean;

  // Backward compatibility aliases
  waveProfile?: string;
  holdDurationMs?: number;
  resetDurationMs?: number;
  riseDurationMs?: number;
}

function TrapezoidCadenceVisualizer({
  elapsedWorkMs = 0,
  repProgress = 0,
  currentRepNumber = 1,
  totalReps = 10,
  repDurationMs = 4000,
  secondsRemaining = 0,
  isPaused = false,
  exerciseName = '',
  trackingType = 'reps',
  audioPacerMode = 'metronome',
  lowDurationMs,
  rampUpDurationMs,
  highDurationMs,
  rampDownDurationMs,
  highPhaseName,
  lowPhaseName,
  isUnilateral,
  holdDurationMs,
  resetDurationMs,
  riseDurationMs,
}: TrapezoidCadenceVisualizerProps) {
  // Container layout measurement for responsive canvas
  const windowWidth = Dimensions.get('window').width;
  const [containerWidth, setContainerWidth] = useState<number>(Math.max(300, windowWidth - 32));

  const handleLayout = (e: any) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - containerWidth) > 2) {
      setContainerWidth(w);
    }
  };

  // Canvas visual boundaries
  const canvasHeight = 164;
  const paddingX = 14;
  const usableWidth = Math.max(100, containerWidth - paddingX * 2);
  const yMid = canvasHeight / 2; // 82
  const amplitude = 42;

  // Crest (Top) and Trough (Bottom) Y coords
  const crestY = yMid - amplitude; // 40
  const troughY = yMid + amplitude; // 124
  const H = troughY - crestY; // 84

  // Resolve Trapezoidal Durations with safe fallbacks
  const nameLower = (exerciseName || '').toLowerCase();
  const isCatCow = nameLower.includes('cat-cow') || nameLower.includes('cat cow');
  const isMcGill = nameLower.includes('mcgill') || nameLower.includes('bird-dog');
  const isPsoas = nameLower.includes('psoas') || nameLower.includes('march');

  const resolvedRampUpMs =
    typeof rampUpDurationMs === 'number' && rampUpDurationMs > 0
      ? rampUpDurationMs
      : typeof riseDurationMs === 'number' && riseDurationMs > 0
      ? riseDurationMs
      : isCatCow
      ? 500
      : 1000;

  const resolvedRampDownMs =
    typeof rampDownDurationMs === 'number' && rampDownDurationMs > 0
      ? rampDownDurationMs
      : isCatCow
      ? 500
      : 1000;

  const resolvedHighMs =
    typeof highDurationMs === 'number' && highDurationMs > 0
      ? highDurationMs
      : typeof holdDurationMs === 'number' && holdDurationMs > 0
      ? holdDurationMs
      : isPsoas
      ? 1500
      : isCatCow && typeof repDurationMs === 'number' && repDurationMs > 0
      ? Math.round(Math.max(1000, repDurationMs - resolvedRampUpMs - resolvedRampDownMs) / 2)
      : isCatCow
      ? 2000
      : Math.max(1000, repDurationMs - resolvedRampUpMs - resolvedRampDownMs - 2000);

  const resolvedLowMs =
    typeof lowDurationMs === 'number' && lowDurationMs > 0
      ? lowDurationMs
      : typeof resetDurationMs === 'number' && resetDurationMs > 0
      ? resetDurationMs
      : isPsoas
      ? 500
      : isCatCow && typeof repDurationMs === 'number' && repDurationMs > 0
      ? Math.max(500, repDurationMs - resolvedRampUpMs - resolvedRampDownMs - resolvedHighMs)
      : isCatCow
      ? 2000
      : Math.max(500, repDurationMs - resolvedRampUpMs - resolvedRampDownMs - resolvedHighMs);

  // Total cycle period T per rep
  const T = Math.max(1500, resolvedRampUpMs + resolvedHighMs + resolvedRampDownMs + resolvedLowMs);

  // Total duration of all reps in the set
  const resolvedTotalReps = Math.max(1, totalReps || 10);
  const totalDurationMs = resolvedTotalReps * T;

  // Semantic Labels
  const resolvedHighLabel =
    highPhaseName ||
    (isCatCow
      ? 'Cat (Arch Up)'
      : isMcGill
      ? 'Tensioned Core Hold'
      : isPsoas
      ? 'Knee Lift & Core Brace'
      : 'Peak Contraction / Hold');

  const resolvedLowLabel =
    lowPhaseName ||
    (isCatCow
      ? 'Cow (Dip Down)'
      : isMcGill
      ? 'Release / Switch Sides'
      : isPsoas
      ? 'Switch Sides / Reset'
      : 'Base / Switch Sides');

  // Focal position on screen where the athlete's dot rides the wave:
  // Placed at 38% of usable width so athlete sees completed work on left and approaching wave on right
  const focalX = paddingX + usableWidth * 0.38;

  // Spatial wavelength of 1 repetition cycle:
  const wavelength = usableWidth * 0.65;

  // Key vertex offsets within one cycle
  const t1 = resolvedRampUpMs;
  const t2 = resolvedHighMs;
  const t3 = resolvedRampDownMs;
  const t4 = resolvedLowMs;
  const V1 = t1;
  const V2 = V1 + t2;
  const V3 = V2 + t3;

  // Corner rounding parameters in time (rt) and slopes (mu, md)
  const rt = Math.min(
    t1 * 0.28,
    t2 * 0.28,
    t3 * 0.28,
    t4 * 0.28,
    300
  );
  const mu = H / Math.max(1, t1 - rt);
  const md = H / Math.max(1, t3 - rt);

  /**
   * Continuous elevation function Y(t) with true smooth C1 fillet corners.
   * - Flat troughY before set (t <= 0)
   * - Repetition wave with rounded corners during set (0 < t < totalDurationMs)
   * - Flat troughY after set ends (t >= totalDurationMs) -> cleanly stays on lower side without repeating!
   */
  const getElevationAtTime = (t: number): number => {
    if (t <= 0) return troughY;
    if (t >= totalDurationMs) return troughY;

    const repIdx = Math.floor(t / T);
    const tau = t - repIdx * T;

    // Corner 1: Base to Ramp Up fillet
    if (tau < rt) {
      const u = tau / rt;
      return troughY - 0.5 * mu * rt * u * u;
    }

    // Stage 1: Linear Ramp Up
    if (tau < V1 - rt) {
      return troughY - 0.5 * mu * rt - mu * (tau - rt);
    }

    // Corner 2: Ramp Up into Crest fillet
    if (tau < V1) {
      const w = (V1 - tau) / rt;
      return crestY + 0.5 * mu * rt * w * w;
    }

    // Stage 2: Flat High Crest Plateau
    if (tau < V2) {
      return crestY;
    }

    // Corner 3: Crest into Ramp Down fillet
    if (tau < V2 + rt) {
      const u = (tau - V2) / rt;
      return crestY + 0.5 * md * rt * u * u;
    }

    // Stage 3: Linear Ramp Down
    if (tau < V3 - rt) {
      return crestY + 0.5 * md * rt + md * (tau - (V2 + rt));
    }

    // Corner 4: Ramp Down into Base fillet
    if (tau < V3) {
      const w = (V3 - tau) / rt;
      return troughY - 0.5 * md * rt * w * w;
    }

    // Stage 4: Flat Low Base Plateau
    return troughY;
  };

  // Current active work timestamp
  const currentElapsed = Math.max(0, elapsedWorkMs);

  // Exact vertical elevation for athlete focus dot riding at focalX
  const dotY = getElevationAtTime(currentElapsed);

  // Unified single accent color for the path hatch, stroke, and athlete focus dot
  const themeColor = '#0284C7';

  // Construct the Continuous Path Segments without ClipPath:
  // 1. Elapsed Path: strictly from x = 0 to x = focalX (solid vibrant gradient)
  // 2. Area Path: filled polygon strictly under elapsed path
  // 3. Approaching Path: strictly from x = focalX to x = containerWidth (dashed future line)
  const { elapsedPath, areaPath, approachingPath } = useMemo(() => {
    const step = 3; // 3px step size gives silky-smooth sub-pixel curve fidelity

    // Map screen x to set time: t(x) = currentElapsed + (x - focalX) * (T / wavelength)
    const timeScale = T / wavelength;

    // --- 1. Elapsed Path (0 to focalX) ---
    const elapsedPoints: string[] = [];
    for (let x = 0; x < focalX; x += step) {
      const t = currentElapsed + (x - focalX) * timeScale;
      elapsedPoints.push(`${x.toFixed(1)} ${getElevationAtTime(t).toFixed(1)}`);
    }
    // Anchor exactly at the focal dot
    elapsedPoints.push(`${focalX.toFixed(1)} ${dotY.toFixed(1)}`);
    const elapsedD = `M ${elapsedPoints.join(' L ')}`;

    // Area path under elapsed curve
    const areaD = `${elapsedD} L ${focalX.toFixed(1)} ${(canvasHeight + 10).toFixed(1)} L 0.0 ${(canvasHeight + 10).toFixed(1)} Z`;

    // --- 2. Approaching Path (focalX to containerWidth) ---
    const approachingPoints: string[] = [`${focalX.toFixed(1)} ${dotY.toFixed(1)}`];
    for (let x = focalX + step; x < containerWidth; x += step) {
      const t = currentElapsed + (x - focalX) * timeScale;
      approachingPoints.push(`${x.toFixed(1)} ${getElevationAtTime(t).toFixed(1)}`);
    }
    // Anchor exactly at the right container boundary
    const tEnd = currentElapsed + (containerWidth - focalX) * timeScale;
    approachingPoints.push(`${containerWidth.toFixed(1)} ${getElevationAtTime(tEnd).toFixed(1)}`);
    const approachingD = `M ${approachingPoints.join(' L ')}`;

    return { elapsedPath: elapsedD, areaPath: areaD, approachingPath: approachingD };
  }, [
    currentElapsed,
    focalX,
    containerWidth,
    wavelength,
    T,
    dotY,
    totalDurationMs,
    rt,
    mu,
    md,
    V1,
    V2,
    V3,
    crestY,
    troughY,
    canvasHeight,
  ]);

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

  return (
    <View style={styles.cardContainer} onLayout={handleLayout}>
      {/* SVG Continuous Traveling Rounded-Trapezoid Stage */}
      <View style={[styles.canvasStage, { height: canvasHeight }]}>
        <Svg width={containerWidth} height={canvasHeight}>
          <Defs>
            {/* Linear gradient for active elapsed stroke - cohesive cyan/blue */}
            <LinearGradient id="trapezoidGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <Stop offset="0%" stopColor="#0284C7" stopOpacity="0.85" />
              <Stop offset="50%" stopColor="#0EA5E9" stopOpacity="1" />
              <Stop offset="100%" stopColor="#38BDF8" stopOpacity="1" />
            </LinearGradient>

            {/* Soft area gradient under elapsed wave - single unified blue hatch */}
            <LinearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={themeColor} stopOpacity="0.22" />
              <Stop offset="60%" stopColor={themeColor} stopOpacity="0.06" />
              <Stop offset="100%" stopColor={themeColor} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* High Plateau Guideline (Top / Tension / Cat) */}
          <Line
            x1={0}
            y1={crestY}
            x2={containerWidth}
            y2={crestY}
            stroke="#BAE6FD"
            strokeWidth={1}
            strokeDasharray="4,4"
          />

          {/* Low Plateau Guideline (Bottom / Base / Cow / Switch) */}
          <Line
            x1={0}
            y1={troughY}
            x2={containerWidth}
            y2={troughY}
            stroke="#D1FAE5"
            strokeWidth={1}
            strokeDasharray="4,4"
          />

          {/* Midline Guidance */}
          <Line
            x1={0}
            y1={yMid}
            x2={containerWidth}
            y2={yMid}
            stroke="#F8FAFC"
            strokeWidth={1}
          />

          {/* Active filled gradient under elapsed wave */}
          <Path d={areaPath} fill="url(#areaGrad)" />

          {/* Approaching future wave trajectory (Right of dot: dashed, muted slate, extends to screen edge) */}
          <Path
            d={approachingPath}
            fill="none"
            stroke="#CBD5E1"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4,4"
          />

          {/* Elapsed completed wave trajectory (Left of dot: solid vibrant gradient, connects to dot) */}
          <Path
            d={elapsedPath}
            fill="none"
            stroke="url(#trapezoidGrad)"
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Vertical Focal Guideline through the athlete position */}
          <Line
            x1={focalX}
            y1={crestY - 10}
            x2={focalX}
            y2={troughY + 10}
            stroke="#E2E8F0"
            strokeWidth={1}
            strokeDasharray="2,2"
          />

          {/* Static outer glow circle at focal dot position */}
          <Circle cx={focalX} cy={dotY} r={14} fill={themeColor} fillOpacity={0.2} />

          {/* Athlete Focus Dot */}
          <Circle
            cx={focalX}
            cy={dotY}
            r={8}
            fill="#FFFFFF"
            stroke={themeColor}
            strokeWidth={3.5}
          />

          {/* Core center micro-dot */}
          <Circle cx={focalX} cy={dotY} r={3} fill={themeColor} />
        </Svg>

        {/* Animated pulsing outer halo ring overlaid via Absolute View */}
        <Animated.View
          style={[
            styles.animatedHalo,
            {
              left: focalX - 18,
              top: dotY - 18,
              borderColor: themeColor,
              transform: [{ scale: pulseAnim }],
            },
          ]}
          pointerEvents="none"
        />

        {/* Crest Label Row */}
        <View style={[styles.crestLabelRow, { top: crestY - 26 }]}>
          <View style={styles.labelInstructionRow}>
            <Text style={styles.crestLabelText}>{resolvedHighLabel.toUpperCase()}</Text>
            <Text style={styles.crestInstructionText} numberOfLines={1}>
              {Math.round(resolvedHighMs / 1000)}s hold plateau
            </Text>
          </View>
          <View style={styles.plateauTagContainer}>
            <Text style={styles.plateauTagText}>PEAK</Text>
          </View>
        </View>

        {/* Trough Label Row */}
        <View style={[styles.troughLabelRow, { top: troughY + 8 }]}>
          <View style={styles.labelInstructionRow}>
            <Text style={styles.troughLabelText}>{resolvedLowLabel.toUpperCase()}</Text>
            <Text style={styles.troughInstructionText} numberOfLines={1}>
              {Math.round(resolvedLowMs / 1000)}s base reset
            </Text>
          </View>
          <View style={[styles.plateauTagContainer, { backgroundColor: '#ECFDF5' }]}>
            <Text style={[styles.plateauTagText, { color: '#059669' }]}>BASE</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    width: '100%',
    alignSelf: 'center',
    marginVertical: 4,
  },
  canvasStage: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
  },
  animatedHalo: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    opacity: 0.45,
  },
  crestLabelRow: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  troughLabelRow: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  labelInstructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  crestLabelText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  crestInstructionText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
    flexShrink: 1,
  },
  troughLabelText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  troughInstructionText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
    flexShrink: 1,
  },
  plateauTagContainer: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  plateauTagText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.4,
  },
});

export default React.memo(TrapezoidCadenceVisualizer);
