import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  PanResponder,
  LayoutChangeEvent,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KinetixTheme } from '../constants/theme';

export interface EndOfSessionPainModalProps {
  visible: boolean;
  initialPainScore?: number;
  sessionTitle?: string;
  isSubmitting?: boolean;
  onSave: (painScore: number) => Promise<void> | void;
  onDismiss: () => void;
}

interface PainTier {
  label: string;
  description: string;
  color: string;
  bgLight: string;
  icon: keyof typeof Ionicons.glyphMap;
}

function getPainTier(score: number): PainTier {
  if (score === 0) {
    return {
      label: 'Pain-Free',
      description: 'Zero joint discomfort. Safe adaptation and optimal loading.',
      color: '#10B981',
      bgLight: '#ECFDF5',
      icon: 'shield-checkmark',
    };
  }
  if (score <= 3) {
    return {
      label: 'Mild / Safe Zone',
      description: 'Normal mechanical loading. Well within therapeutic threshold.',
      color: '#059669',
      bgLight: '#D1FAE5',
      icon: 'checkmark-circle',
    };
  }
  if (score <= 5) {
    return {
      label: 'Moderate / Caution',
      description: 'Approaching tissue threshold. Criteria gate requires < 4.0 avg.',
      color: '#F59E0B',
      bgLight: '#FEF3C7',
      icon: 'alert-circle',
    };
  }
  if (score <= 7) {
    return {
      label: 'Significant Load',
      description: 'Joint irritation detected. May trigger extra foundation days.',
      color: '#EA580C',
      bgLight: '#FFEDD5',
      icon: 'warning',
    };
  }
  return {
    label: 'Severe Discomfort',
    description: 'High joint stress. Exceeds recommended clinical adaptation limits.',
    color: '#E11D48',
    bgLight: '#FFE4E6',
    icon: 'flame',
  };
}

export default function EndOfSessionPainModal({
  visible,
  initialPainScore = 2,
  sessionTitle = 'Rehabilitation Session',
  isSubmitting = false,
  onSave,
  onDismiss,
}: EndOfSessionPainModalProps) {
  const [painScore, setPainScore] = useState<number>(initialPainScore);
  const [sliderWidth, setSliderWidth] = useState<number>(300);
  const activeTier = getPainTier(painScore);

  const animatedScale = useRef(new Animated.Value(1)).current;

  // Track layout width for precision slider dragging
  const handleLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0) {
      setSliderWidth(width);
    }
  };

  // PanResponder for smooth sliding interaction
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        Animated.spring(animatedScale, {
          toValue: 1.15,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        if (sliderWidth <= 0) return;
        const relativeX = Math.max(0, Math.min(sliderWidth, gestureState.x0 + gestureState.dx - 36));
        const fraction = relativeX / sliderWidth;
        const rawScore = Math.round(fraction * 10);
        const clampedScore = Math.max(0, Math.min(10, rawScore));
        setPainScore(clampedScore);
      },
      onPanResponderRelease: () => {
        Animated.spring(animatedScale, {
          toValue: 1.0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const handleSelectScore = (score: number) => {
    setPainScore(score);
    Animated.sequence([
      Animated.timing(animatedScale, { toValue: 1.2, duration: 90, useNativeDriver: true }),
      Animated.timing(animatedScale, { toValue: 1.0, duration: 90, useNativeDriver: true }),
    ]).start();
  };

  const handleSaveAndComplete = () => {
    onSave(painScore);
  };

  const fillPercentage = (painScore / 10) * 100;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header Badge */}
          <View style={styles.badgeRow}>
            <View style={[styles.phaseIndicator, { backgroundColor: activeTier.bgLight }]}>
              <Ionicons name={activeTier.icon} size={15} color={activeTier.color} />
              <Text style={[styles.phaseIndicatorText, { color: activeTier.color }]}>
                CRITERIA GATE CHECK
              </Text>
            </View>
          </View>

          {/* Title & Prompt */}
          <Text style={styles.title}>Session Complete!</Text>
          <Text style={styles.question}>Rate your highest joint pain during this session</Text>
          <Text style={styles.subtext}>
            Evaluated against your active phase progression threshold (Max Allowed: &lt; 4.0)
          </Text>

          {/* Large Interactive Score Display */}
          <View style={[styles.scoreHero, { backgroundColor: activeTier.bgLight, borderColor: activeTier.color }]}>
            <Animated.View style={{ transform: [{ scale: animatedScale }], flexDirection: 'row', alignItems: 'flex-end' }}>
              <Text style={[styles.scoreHeroValue, { color: activeTier.color }]}>{painScore}</Text>
              <Text style={[styles.scoreHeroMax, { color: activeTier.color }]}>/ 10</Text>
            </Animated.View>
            <View style={styles.tierInfo}>
              <Text style={[styles.tierLabel, { color: activeTier.color }]}>{activeTier.label}</Text>
              <Text style={styles.tierDesc}>{activeTier.description}</Text>
            </View>
          </View>

          {/* Continuous Interactive Slider Track */}
          <View style={styles.sliderContainer} onLayout={handleLayout} {...panResponder.panHandlers}>
            <View style={styles.sliderTrackBackground}>
              <View
                style={[
                  styles.sliderTrackFill,
                  { width: `${fillPercentage}%`, backgroundColor: activeTier.color },
                ]}
              />
            </View>
            {/* Draggable thumb */}
            <View
              style={[
                styles.sliderThumb,
                {
                  left: `${fillPercentage}%`,
                  borderColor: activeTier.color,
                },
              ]}
            >
              <View style={[styles.thumbInner, { backgroundColor: activeTier.color }]} />
            </View>
          </View>

          {/* Stepped Number Pills (0 to 10) */}
          <View style={styles.numbersRow}>
            {Array.from({ length: 11 }).map((_, i) => {
              const isSelected = painScore === i;
              const isPassing = i < 4;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.numberPill,
                    isSelected && { backgroundColor: activeTier.color, borderColor: activeTier.color },
                    !isSelected && isPassing && styles.numberPillPassing,
                  ]}
                  onPress={() => handleSelectScore(i)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.numberText,
                      isSelected && styles.numberTextSelected,
                      !isSelected && !isPassing && { color: KinetixTheme.colors.textMuted },
                    ]}
                  >
                    {i}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Scale Legend Labels */}
          <View style={styles.legendRow}>
            <Text style={styles.legendLeft}>0 (No Pain)</Text>
            <Text style={[styles.legendMid, { color: '#059669' }]}>&lt; 4 (Gate Threshold)</Text>
            <Text style={styles.legendRight}>10 (Severe)</Text>
          </View>

          {/* Clinical Tip Box */}
          <View style={styles.clinicalBox}>
            <Ionicons name="information-circle-outline" size={16} color={KinetixTheme.colors.textMuted} />
            <Text style={styles.clinicalText}>
              Tissue remodeling requires gradual mechanical tolerance. Average pain across your last 3
              sessions must stay below 4.0 to unlock the next phase.
            </Text>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: activeTier.color }]}
            onPress={handleSaveAndComplete}
            disabled={isSubmitting}
            activeOpacity={0.88}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>Save & Complete</Text>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss} disabled={isSubmitting}>
            <Text style={styles.dismissButtonText}>Return to Workout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...KinetixTheme.shadows.card,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  phaseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: KinetixTheme.borderRadius.full,
  },
  phaseIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.3,
  },
  question: {
    fontSize: 14,
    fontWeight: '700',
    color: KinetixTheme.colors.textSecondary,
    marginTop: 4,
  },
  subtext: {
    fontSize: 12,
    color: KinetixTheme.colors.textMuted,
    marginTop: 2,
    marginBottom: 16,
  },
  scoreHero: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: KinetixTheme.borderRadius.lg,
    borderWidth: 1.5,
    marginBottom: 20,
    gap: 14,
  },
  scoreHeroValue: {
    fontSize: 40,
    fontWeight: '900',
    lineHeight: 44,
  },
  scoreHeroMax: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    marginLeft: 2,
  },
  tierInfo: {
    flex: 1,
  },
  tierLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  tierDesc: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    lineHeight: 15,
  },
  sliderContainer: {
    height: 36,
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  sliderTrackBackground: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  sliderTrackFill: {
    height: '100%',
    borderRadius: 5,
  },
  sliderThumb: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    marginLeft: -13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  thumbInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  numbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  numberPill: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberPillPassing: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  numberText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
  },
  numberTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 16,
  },
  legendLeft: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700',
  },
  legendMid: {
    fontSize: 10,
    fontWeight: '700',
  },
  legendRight: {
    fontSize: 10,
    color: '#E11D48',
    fontWeight: '700',
  },
  clinicalBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: KinetixTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
  },
  clinicalText: {
    flex: 1,
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    lineHeight: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: KinetixTheme.borderRadius.lg,
    marginBottom: 8,
    ...KinetixTheme.shadows.primaryGlow,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  dismissButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
});
