import React from 'react';
import { View, StyleSheet } from 'react-native';
import { KinetixTheme } from '../../constants/theme';

interface CircularProgressRingProps {
  size: number;
  strokeWidth: number;
  progress: number; // 0 to 1
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

export default function CircularProgressRing({
  size,
  strokeWidth,
  progress,
  color = KinetixTheme.colors.primary,
  backgroundColor = '#E2E8F0',
  children,
}: CircularProgressRingProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const beadSize = strokeWidth + 4;

  // Calculate runner bead position around the circular perimeter (12 o'clock is -90 deg / -PI/2)
  const angle = clampedProgress * 2 * Math.PI - Math.PI / 2;
  const beadX = size / 2 + radius * Math.cos(angle) - beadSize / 2;
  const beadY = size / 2 + radius * Math.sin(angle) - beadSize / 2;

  // Progressive arc quadrants around the dial
  const topActive = clampedProgress > 0.02;
  const rightActive = clampedProgress >= 0.25;
  const bottomActive = clampedProgress >= 0.5;
  const leftActive = clampedProgress >= 0.75;

  const innerSize = Math.max(0, size - strokeWidth * 2 - 4);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Base Track Ring (Background circle) */}
      <View
        style={[
          styles.trackCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: backgroundColor,
          },
        ]}
      />

      {/* Dynamic Quadrant Progress Arcs */}
      <View
        style={[
          styles.quadrantRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: 'transparent',
            borderTopColor: topActive ? color : 'transparent',
            borderRightColor: rightActive ? color : 'transparent',
            borderBottomColor: bottomActive ? color : 'transparent',
            borderLeftColor: leftActive ? color : 'transparent',
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />

      {/* Real-time Moving Runner Bead on Circle Circumference */}
      {clampedProgress > 0 && clampedProgress < 1 && (
        <View
          style={[
            styles.runnerBead,
            {
              width: beadSize,
              height: beadSize,
              borderRadius: beadSize / 2,
              backgroundColor: color,
              left: beadX,
              top: beadY,
              shadowColor: color,
            },
          ]}
        />
      )}

      {/* Inner Stopwatch Face with Countdown Digits */}
      <View
        style={[
          styles.innerDial,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          },
        ]}
      >
        <View style={styles.childrenCenterWrapper}>
          {children}
        </View>

        {/* Micro progress capsule bar anchored at bottom */}
        <View style={styles.miniBarTrack}>
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
  trackCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  quadrantRing: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  runnerBead: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  innerDial: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
    width: 54,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
