import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KinetixTheme } from '../constants/theme';

export interface RehabPhaseRetentionModalProps {
  visible: boolean;
  programTitle?: string;
  currentPhaseOrder?: number;
  currentPhaseTitle?: string;
  nextPhaseOrder?: number | null;
  nextPhaseTitle?: string | null;
  sessionsCompleted?: number;
  requiredSessions?: number;
  avgPainScore?: number;
  maxAllowedPainScore?: number;
  scheduledRehabDaysPerWeek?: number;
  isPhaseExtended?: boolean;
  extendedSessionsCount?: number;
  onClose: () => void;
  onAdvanceToNextPhase: () => Promise<void> | void;
  onKeepPracticingCurrentPhase: (additionalSessions: number) => Promise<void> | void;
}

const RETENTION_PRESETS = [
  { sessions: 2, label: '+2 Sessions', desc: '~0.5–1 extra week' },
  { sessions: 3, label: '+3 Sessions', desc: '+1 extra week in phase' },
  { sessions: 6, label: '+6 Sessions', desc: '+2 extra weeks in phase' },
];

export default function RehabPhaseRetentionModal({
  visible,
  programTitle = 'Lower Back Resilience',
  currentPhaseOrder = 1,
  currentPhaseTitle = 'Phase 1: Acute Decompression & McGill Big 3',
  nextPhaseOrder = 2,
  nextPhaseTitle = 'Phase 2: Loaded Motor Control & Anti-Extension',
  sessionsCompleted = 8,
  requiredSessions = 8,
  avgPainScore = 2.8,
  maxAllowedPainScore = 4.0,
  scheduledRehabDaysPerWeek = 3,
  isPhaseExtended = false,
  extendedSessionsCount = 0,
  onClose,
  onAdvanceToNextPhase,
  onKeepPracticingCurrentPhase,
}: RehabPhaseRetentionModalProps) {
  const [selectedExtraSessions, setSelectedExtraSessions] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isCriteriaMet =
    sessionsCompleted >= requiredSessions && avgPainScore <= maxAllowedPainScore;

  const extraWeeksAdded = Math.max(
    1,
    Math.ceil(selectedExtraSessions / Math.max(1, scheduledRehabDaysPerWeek))
  );

  const handleAdvance = async () => {
    setIsSubmitting(true);
    try {
      await onAdvanceToNextPhase();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeepPracticing = async () => {
    setIsSubmitting(true);
    try {
      await onKeepPracticingCurrentPhase(selectedExtraSessions);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Top Header */}
          <View style={styles.topRow}>
            <View style={styles.headerLeft}>
              <View style={styles.badgeIconBox}>
                <Ionicons name="shield-checkmark" size={20} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.programLabel}>{programTitle.toUpperCase()}</Text>
                <Text style={styles.modalTitle}>
                  {isCriteriaMet
                    ? 'Phase Progression & Readiness Check'
                    : 'Rehab Phase Pacing & Retention'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={KinetixTheme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Current Phase Status Box */}
          <View style={styles.statusBox}>
            <View style={styles.statusHeaderRow}>
              <Text style={styles.phaseTitleText}>{currentPhaseTitle}</Text>
              {isPhaseExtended && (
                <View style={styles.extendedBadge}>
                  <Text style={styles.extendedBadgeText}>
                    Extended (+{extendedSessionsCount} sessions)
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricPill}>
                <Ionicons
                  name={sessionsCompleted >= requiredSessions ? 'checkmark-circle' : 'time-outline'}
                  size={14}
                  color={sessionsCompleted >= requiredSessions ? '#059669' : '#2563EB'}
                />
                <Text style={styles.metricPillText}>
                  {sessionsCompleted}/{requiredSessions} Sessions Done
                </Text>
              </View>
              <View style={styles.metricPill}>
                <Ionicons
                  name={avgPainScore <= maxAllowedPainScore ? 'checkmark-circle' : 'alert-circle'}
                  size={14}
                  color={avgPainScore <= maxAllowedPainScore ? '#059669' : '#D97706'}
                />
                <Text style={styles.metricPillText}>
                  Pain Avg: {avgPainScore}/10 (Limit ≤ {maxAllowedPainScore})
                </Text>
              </View>
            </View>
          </View>

          {/* Guidance Message */}
          <Text style={styles.guidanceText}>
            {isCriteriaMet
              ? `You have met the clinical criteria to unlock ${
                  nextPhaseTitle || `Phase ${currentPhaseOrder + 1}`
                }! However, if you feel your joint or tissues aren't 100% ready yet, you can stay in Phase ${currentPhaseOrder} to keep practicing—your weekly schedule and total completion timeline will automatically adjust.`
              : `Feel like you need extra practice in Phase ${currentPhaseOrder} before moving on? You can extend your current phase duration at any time, or advance when you feel confident.`}
          </Text>

          {/* Option 1: Keep Practicing Current Phase */}
          <View style={styles.retentionBox}>
            <View style={styles.retentionTitleRow}>
              <Ionicons name="repeat" size={16} color="#D97706" />
              <Text style={styles.retentionTitle}>
                Keep Practicing Phase {currentPhaseOrder} (Extend Duration)
              </Text>
            </View>
            <Text style={styles.retentionSub}>
              Select how many extra sessions you want to practice in this phase. Your scheduled rehab days will continue serving Phase {currentPhaseOrder} and extend your program forecast by ~{extraWeeksAdded} {extraWeeksAdded === 1 ? 'week' : 'weeks'}:
            </Text>

            <View style={styles.presetRow}>
              {RETENTION_PRESETS.map((p) => {
                const isSelected = selectedExtraSessions === p.sessions;
                return (
                  <TouchableOpacity
                    key={p.sessions}
                    style={[
                      styles.presetCard,
                      isSelected && styles.presetCardActive,
                    ]}
                    onPress={() => setSelectedExtraSessions(p.sessions)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.presetLabel,
                        isSelected && styles.presetLabelActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                    <Text style={styles.presetDesc}>{p.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.keepPracticingBtn}
              onPress={handleKeepPracticing}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <Ionicons name="shield-half" size={17} color="#B45309" />
              <Text style={styles.keepPracticingBtnText}>
                Stay in Phase {currentPhaseOrder} & Practice (+{selectedExtraSessions} Sessions)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Option 2: Advance to Next Phase */}
          {nextPhaseTitle ? (
            <TouchableOpacity
              style={styles.advanceBtn}
              onPress={handleAdvance}
              disabled={isSubmitting}
              activeOpacity={0.88}
            >
              <View style={styles.advanceBtnLeft}>
                <Ionicons name="rocket-outline" size={18} color="#FFFFFF" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.advanceBtnTitle}>
                    I Feel Ready — Advance to Phase {nextPhaseOrder || currentPhaseOrder + 1}
                  </Text>
                  <Text style={styles.advanceBtnSub} numberOfLines={1}>
                    Unlocks {nextPhaseTitle} across your weekly schedule
                  </Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.advanceBtn}
              onPress={handleAdvance}
              disabled={isSubmitting}
              activeOpacity={0.88}
            >
              <View style={styles.advanceBtnLeft}>
                <Ionicons name="trophy-outline" size={18} color="#FFFFFF" />
                <Text style={styles.advanceBtnTitle}>
                  Complete Rehabilitation Program
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 20,
    ...KinetixTheme.shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  badgeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  programLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.6,
  },
  modalTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    color: KinetixTheme.colors.text,
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  phaseTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    flex: 1,
  },
  extendedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  extendedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.textSecondary,
  },
  guidanceText: {
    fontSize: 12,
    color: KinetixTheme.colors.textSecondary,
    lineHeight: 17,
    marginBottom: 14,
  },
  retentionBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    marginBottom: 12,
  },
  retentionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  retentionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  retentionSub: {
    fontSize: 11,
    color: '#B45309',
    lineHeight: 15,
    marginBottom: 10,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  presetCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
  },
  presetCardActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
    borderWidth: 1.5,
  },
  presetLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#92400E',
  },
  presetLabelActive: {
    color: '#78350F',
  },
  presetDesc: {
    fontSize: 9.5,
    color: '#B45309',
    textAlign: 'center',
    marginTop: 2,
  },
  keepPracticingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FDE68A',
    paddingVertical: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  keepPracticingBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  advanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 11,
  },
  advanceBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  advanceBtnTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  advanceBtnSub: {
    fontSize: 10.5,
    color: '#D1FAE5',
    marginTop: 1,
  },
});
