import React, { useId, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Line, G } from 'react-native-svg';
import { KinetixTheme } from '../../constants/theme';

interface CircularProgressRingProps {
  size: number;
  strokeWidth: number;
  progress: number; // 0 to 1
  color?: string;
  backgroundColor?: string;
  gradientEndColor?: string;
  showTicks?: boolean;
  children?: React.ReactNode;
}

/**
 * High-performance smooth circular progress dial built with react-native-svg.
 * Features:
 * - Fluid sub-second continuous stroke progress (no 4-quadrant jumping)
 * - Dynamic dual-tone athletic gradient arc
 * - Precision Olympic chronograph tick marks that illuminate dynamically
 * - Multi-layered glowing runner bead tracking the leading stroke tip
 * - Adaptive light/dark inner dial with micro progress bar indicator
 */
export default function CircularProgressRing({
  size,
  strokeWidth,
  progress,
  color = KinetixTheme.colors.primary,
  backgroundColor = '#E2E8F0',
  gradientEndColor,
  showTicks = true,
  children,
}: CircularProgressRingProps) {
  const rawId = useId();
  const gradId = `cpr_grad_${rawId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  const clampedProgress = Math.min(1, Math.max(0, progress));
  const center = size / 2;
  const radius = Math.max(1, (size - strokeWidth) / 2);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clampedProgress);

  // Runner bead coordinates around the perimeter (12 o'clock is -PI/2)
  const angle = clampedProgress * 2 * Math.PI - Math.PI / 2;
  const beadX = center + radius * Math.cos(angle);
  const beadY = center + radius * Math.sin(angle);

  // Resolve intelligent gradient colors for sports aesthetic
  const { startColor, endColor } = useMemo(() => {
    if (gradientEndColor) {
      return { startColor: color, endColor: gradientEndColor };
    }
    const lower = color.toLowerCase();
    if (lower.includes('10b981') || lower.includes('059669') || lower.includes('10b')) {
      return { startColor: '#34D399', endColor: '#059669' }; // Emerald recovery
    }
    if (lower.includes('0284c7') || lower.includes('0369a1') || lower.includes('38bdf8')) {
      return { startColor: '#38BDF8', endColor: '#0284C7' }; // Ocean focus
    }
    if (lower.includes('f59e0b') || lower.includes('d97706') || lower.includes('fbbf24')) {
      return { startColor: '#FBBF24', endColor: '#D97706' }; // Amber prep / warning
    }
    if (lower.includes('ef4444') || lower.includes('dc2626')) {
      return { startColor: '#F87171', endColor: '#DC2626' }; // Crimson
    }
    return { startColor: color, endColor: color };
  }, [color, gradientEndColor]);

  // Precision Chronograph Ticks (12 major intervals)
  const ticks = useMemo(() => {
    if (!showTicks || size < 120) return [];
    const list = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * 2 * Math.PI - Math.PI / 2;
      const isMajor = i % 3 === 0;
      const tickLen = isMajor ? Math.max(4, strokeWidth * 0.55) : Math.max(2.5, strokeWidth * 0.35);
      const rOuter = radius - strokeWidth / 2 - 3;
      const rInner = rOuter - tickLen;

      list.push({
        key: i,
        x1: center + rInner * Math.cos(a),
        y1: center + rInner * Math.sin(a),
        x2: center + rOuter * Math.cos(a),
        y2: center + rOuter * Math.sin(a),
        isMajor,
        tickProgress: i / count,
      });
    }
    return list;
  }, [showTicks, size, strokeWidth, radius, center]);

  // Adapt dial theme based on background container context
  const isDarkContainer =
    backgroundColor.toLowerCase().includes('1e293b') ||
    backgroundColor.toLowerCase().includes('0f172a') ||
    backgroundColor.toLowerCase().includes('#1') ||
    backgroundColor.toLowerCase().includes('#0');

  const innerDialBg = isDarkContainer ? '#0F172A' : '#FFFFFF';
  const innerDialBorder = isDarkContainer ? '#1E293B' : '#F1F5F9';
  const miniBarBg = isDarkContainer ? '#1E293B' : '#F1F5F9';
  const innerSize = Math.max(0, size - strokeWidth * 2 - (showTicks ? 14 : 8));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Precision SVG Graphics Layer */}
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={startColor} stopOpacity="1" />
            <Stop offset="100%" stopColor={endColor} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* 1. Base Track Circle (Inactive ring) */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* 2. Chronograph Tick Marks */}
        {ticks.map((t) => {
          const isPassed = clampedProgress >= t.tickProgress;
          return (
            <Line
              key={t.key}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={isPassed ? color : isDarkContainer ? '#334155' : '#CBD5E1'}
              strokeWidth={t.isMajor ? 1.75 : 1}
              strokeLinecap="round"
              opacity={isPassed ? 0.9 : 0.45}
            />
          );
        })}

        {/* 3. Smooth Continuous Progress Stroke */}
        <G rotation="-90" origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            strokeOpacity={clampedProgress > 0.005 ? 1 : 0}
            fill="none"
          />
        </G>

        {/* 4. Multi-layered Glowing Runner Bead */}
        {clampedProgress > 0.01 && clampedProgress < 0.999 && (
          <G>
            {/* Soft Ambient Glow */}
            <Circle
              cx={beadX}
              cy={beadY}
              r={strokeWidth * 0.9}
              fill={endColor}
              opacity={0.35}
            />
            {/* Crisp White Outer Rim */}
            <Circle
              cx={beadX}
              cy={beadY}
              r={strokeWidth * 0.65}
              fill="#FFFFFF"
            />
            {/* Vibrant Core Dot */}
            <Circle
              cx={beadX}
              cy={beadY}
              r={strokeWidth * 0.42}
              fill={endColor}
            />
          </G>
        )}
      </Svg>

      {/* Inner Stopwatch Dial Face */}
      <View
        pointerEvents="box-none"
        style={[
          styles.innerDial,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: innerDialBg,
            borderColor: innerDialBorder,
          },
        ]}
      >
        <View style={styles.childrenCenterWrapper}>
          {children}
        </View>

        {/* Micro progress capsule bar anchored at bottom */}
        <View style={[styles.miniBarTrack, { backgroundColor: miniBarBg }]}>
          <View
            style={[
              styles.miniBarFill,
              {
                width: `${Math.round(clampedProgress * 100)}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  innerDial: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  childrenCenterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },
  miniBarTrack: {
    position: 'absolute',
    bottom: 10,
    width: 52,
    height: 3.5,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
