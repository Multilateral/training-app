import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KinetixTheme } from '../constants/theme';

export interface SportQuickLogModalProps {
  visible: boolean;
  sportTitle: string;
  exerciseId?: string | null;
  defaultDurationMinutes?: number;
  defaultIntensity?: string;
  targetDateLabel?: string;
  onClose: () => void;
  onSaveLog: (logData: {
    sportTitle: string;
    durationMinutes: number;
    hoursPlayed: number;
    intensity: string;
    rpe: number;
    notes: string;
    exerciseId?: string | null;
  }) => Promise<void> | void;
}

const HOUR_PRESETS = [1.0, 1.5, 2.0, 2.5, 3.0];

const RPE_OPTIONS = [
  { label: 'Light Drill', rpe: 5, intensity: 'Light', color: '#10B981' },
  { label: 'Moderate Practice', rpe: 7, intensity: 'Moderate', color: '#2563EB' },
  { label: 'High Practice', rpe: 8, intensity: 'High', color: '#F59E0B' },
  { label: 'Max Match Play', rpe: 9, intensity: 'Max', color: '#EF4444' },
];

export default function SportQuickLogModal({
  visible,
  sportTitle,
  exerciseId,
  defaultDurationMinutes = 120,
  targetDateLabel,
  onClose,
  onSaveLog,
}: SportQuickLogModalProps) {
  const [hoursInput, setHoursInput] = useState<string>('2.0');
  const [selectedRpe, setSelectedRpe] = useState<number>(8);
  const [selectedIntensity, setSelectedIntensity] = useState<string>('High');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      const initialHours = Number((defaultDurationMinutes / 60).toFixed(1));
      setHoursInput(String(initialHours > 0 ? initialHours : 2.0));
      setSelectedRpe(8);
      setSelectedIntensity('High');
      setNotes('');
    }
  }, [visible, defaultDurationMinutes, sportTitle]);

  const parsedHours = Math.max(0.25, Math.min(8, parseFloat(hoursInput) || 2.0));
  const computedMinutes = Math.round(parsedHours * 60);

  const handleStepHours = (delta: number) => {
    const next = Math.max(0.5, Math.min(6.0, Number((parsedHours + delta).toFixed(1))));
    setHoursInput(String(next));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await onSaveLog({
        sportTitle: sportTitle || 'Sport Practice',
        durationMinutes: computedMinutes,
        hoursPlayed: parsedHours,
        intensity: selectedIntensity,
        rpe: selectedRpe,
        notes: notes.trim(),
        exerciseId,
      });
      onClose();
    } finally {
      setIsSaving(false);
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
          {/* Header */}
          <View style={styles.topRow}>
            <View style={styles.headerLeft}>
              <View style={styles.sportIconBadge}>
                <Ionicons name="trophy" size={18} color="#D97706" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Log {sportTitle}</Text>
                <Text style={styles.headerSubtitle}>
                  {targetDateLabel ? `Logging for ${targetDateLabel}` : 'Manual Collective Sport Log'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={KinetixTheme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Hours Played Stepper & Presets */}
            <Text style={styles.sectionLabel}>HOURS PLAYED</Text>
            <View style={styles.hoursStepperRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => handleStepHours(-0.5)}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={18} color={KinetixTheme.colors.text} />
              </TouchableOpacity>

              <View style={styles.hoursDisplayBox}>
                <TextInput
                  style={styles.hoursInputText}
                  keyboardType="decimal-pad"
                  value={hoursInput}
                  onChangeText={setHoursInput}
                />
                <Text style={styles.hoursUnitText}>
                  hours ({computedMinutes} mins)
                </Text>
              </View>

              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => handleStepHours(0.5)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color={KinetixTheme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Quick Hour Chips */}
            <View style={styles.presetRow}>
              {HOUR_PRESETS.map((hr) => {
                const isSelected = Math.abs(parsedHours - hr) < 0.05;
                return (
                  <TouchableOpacity
                    key={hr}
                    style={[styles.presetChip, isSelected && styles.presetChipActive]}
                    onPress={() => setHoursInput(hr.toFixed(1))}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        isSelected && styles.presetChipTextActive,
                      ]}
                    >
                      {hr.toFixed(1)}h
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Session Intensity / RPE */}
            <Text style={styles.sectionLabel}>INTENSITY & EFFORT (RPE)</Text>
            <View style={styles.rpeGrid}>
              {RPE_OPTIONS.map((opt) => {
                const isSelected = selectedRpe === opt.rpe;
                return (
                  <TouchableOpacity
                    key={opt.rpe}
                    style={[
                      styles.rpeOptionCard,
                      isSelected && {
                        borderColor: opt.color,
                        backgroundColor: `${opt.color}12`,
                      },
                    ]}
                    onPress={() => {
                      setSelectedRpe(opt.rpe);
                      setSelectedIntensity(opt.intensity);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.rpeOptionHeader}>
                      <Text
                        style={[
                          styles.rpeScoreBadge,
                          { color: isSelected ? opt.color : KinetixTheme.colors.text },
                        ]}
                      >
                        RPE {opt.rpe}/10
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={15} color={opt.color} />
                      )}
                    </View>
                    <Text style={styles.rpeOptionLabel}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Optional Notes */}
            <Text style={styles.sectionLabel}>PRACTICE / MATCH NOTES (OPTIONAL)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g. Scrimmage, jump serve practice, felt good on lower back..."
              placeholderTextColor="#94A3B8"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </ScrollView>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSubmit}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-done-circle" size={18} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>
              {isSaving
                ? 'Logging Practice...'
                : `Log ${parsedHours}h ${sportTitle} Session`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 20,
    ...KinetixTheme.shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sportIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: KinetixTheme.colors.textMuted,
    fontWeight: '600',
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
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: KinetixTheme.colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },
  hoursStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  stepBtn: {
    width: 42,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoursDisplayBox: {
    flex: 1,
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  hoursInputText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#B45309',
    textAlign: 'center',
    padding: 0,
  },
  hoursUnitText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
    marginTop: 1,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.textSecondary,
  },
  presetChipTextActive: {
    color: '#B45309',
    fontWeight: '800',
  },
  rpeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  rpeOptionCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  rpeOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  rpeScoreBadge: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  rpeOptionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.textSecondary,
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: KinetixTheme.colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D97706',
    paddingVertical: 13,
    borderRadius: 12,
  },
  saveBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
