import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KinetixTheme } from '../../constants/theme';

interface ProgressionGateSettingsProps {
  requiredSessions: number;
  maxPainScore: number;
  onUpdate: (updates: { required_sessions_to_pass?: number; max_allowed_pain_score?: number }) => void;
}

const SESSION_PRESETS = [4, 6, 8, 10, 12];
const PAIN_PRESETS = [2.5, 3.0, 3.5, 4.0, 4.5];

export default function ProgressionGateSettings({
  requiredSessions,
  maxPainScore,
  onUpdate,
}: ProgressionGateSettingsProps) {
  const handleSessionsStep = (delta: number) => {
    const nextVal = Math.max(1, Math.min(30, requiredSessions + delta));
    onUpdate({ required_sessions_to_pass: nextVal });
  };

  const handlePainStep = (delta: number) => {
    const nextVal = Math.max(1.0, Math.min(8.0, Number((maxPainScore + delta).toFixed(1))));
    onUpdate({ max_allowed_pain_score: nextVal });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <Ionicons name="git-branch-outline" size={15} color="#059669" />
          <Text style={styles.headerTitle}>Phase Progression Gates</Text>
        </View>
        <View style={styles.gatePill}>
          <Text style={styles.gatePillText}>CRITERIA GATE</Text>
        </View>
      </View>

      <Text style={styles.helperText}>
        Athletes cannot advance based on calendar days alone. They must satisfy both criteria below:
      </Text>

      {/* Grid of 2 Gate Parameters */}
      <View style={styles.grid}>
        {/* Gate 1: Session Quota */}
        <View style={styles.paramCard}>
          <View style={styles.paramTopRow}>
            <Text style={styles.paramLabel}>Session Quota</Text>
            <Ionicons name="barbell-outline" size={14} color={KinetixTheme.colors.textMuted} />
          </View>

          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => handleSessionsStep(-1)}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={16} color={KinetixTheme.colors.text} />
            </TouchableOpacity>

            <View style={styles.valueDisplay}>
              <Text style={styles.valueNumber}>{requiredSessions}</Text>
              <Text style={styles.valueUnit}>sessions</Text>
            </View>

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => handleSessionsStep(1)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color={KinetixTheme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Quick Presets */}
          <View style={styles.presetsRow}>
            {SESSION_PRESETS.map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.presetChip, requiredSessions === val && styles.presetChipActive]}
                onPress={() => onUpdate({ required_sessions_to_pass: val })}
              >
                <Text
                  style={[styles.presetText, requiredSessions === val && styles.presetTextActive]}
                >
                  {val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Gate 2: Maximum Allowed Pain Threshold */}
        <View style={styles.paramCard}>
          <View style={styles.paramTopRow}>
            <Text style={styles.paramLabel}>Max Pain Threshold</Text>
            <Ionicons name="shield-half-outline" size={14} color="#EA580C" />
          </View>

          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => handlePainStep(-0.5)}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={16} color={KinetixTheme.colors.text} />
            </TouchableOpacity>

            <View style={styles.valueDisplay}>
              <Text style={[styles.valueNumber, { color: '#EA580C' }]}>&lt; {maxPainScore.toFixed(1)}</Text>
              <Text style={styles.valueUnit}>avg (last 3)</Text>
            </View>

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => handlePainStep(0.5)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color={KinetixTheme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Quick Presets */}
          <View style={styles.presetsRow}>
            {PAIN_PRESETS.map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.presetChip, maxPainScore === val && styles.presetChipActive]}
                onPress={() => onUpdate({ max_allowed_pain_score: val })}
              >
                <Text
                  style={[styles.presetText, maxPainScore === val && styles.presetTextActive]}
                >
                  {val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: KinetixTheme.borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  gatePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gatePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.4,
  },
  helperText: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    lineHeight: 15,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  paramCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paramTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  paramLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.textSecondary,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueDisplay: {
    alignItems: 'center',
  },
  valueNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  valueUnit: {
    fontSize: 9,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 2,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: '#059669',
  },
  presetText: {
    fontSize: 9,
    fontWeight: '700',
    color: KinetixTheme.colors.textMuted,
  },
  presetTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
