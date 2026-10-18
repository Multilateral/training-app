import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KinetixTheme } from '../../constants/theme';
import {
  BuilderExercise,
  useProgramBuilderStore,
} from '../../stores/useProgramBuilderStore';

const MUSCLE_GROUPS = [
  'Lower Back / Core',
  'Knee / Quadriceps',
  'Ankle / Stabilizers',
  'Shoulder / Cuff',
  'Glutes / Hips',
  'Posterior Chain',
];

const EQUIPMENTS = ['Bodyweight', 'Resistance Band', 'Dumbbell', 'Kettlebell', 'Airex Pad', 'Barbell'];

export default function ExerciseQuickCreate() {
  const {
    isExerciseQuickCreateOpen,
    closeExerciseQuickCreate,
    attachExerciseToDraftWorksession,
  } = useProgramBuilderStore();

  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState(MUSCLE_GROUPS[0]);
  const [equipment, setEquipment] = useState(EQUIPMENTS[0]);
  const [trackingType, setTrackingType] = useState<'reps' | 'time' | 'reps_weight'>('reps');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [holdSeconds, setHoldSeconds] = useState(30);
  const [restSeconds, setRestSeconds] = useState(60);
  const [cue, setCue] = useState('');

  if (!isExerciseQuickCreateOpen) return null;

  const handleAdd = () => {
    if (!name.trim()) return;

    const newEx: BuilderExercise = {
      id: `ex-quick-${Date.now()}`,
      name: name.trim(),
      muscle_group: muscleGroup,
      equipment,
      tracking_type: trackingType,
      target_sets: sets,
      target_reps: reps,
      target_time: holdSeconds,
      target_duration_seconds: trackingType === 'time' ? holdSeconds : 45,
      target_rest_seconds: restSeconds,
      cue: cue.trim() || 'Maintain strict biomechanical form.',
      is_new: true,
    };

    attachExerciseToDraftWorksession(newEx);

    // Reset local state
    setName('');
    setCue('');
  };

  return (
    <Modal
      visible={isExerciseQuickCreateOpen}
      transparent
      animationType="slide"
      onRequestClose={closeExerciseQuickCreate}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.iconBadge}>
                <Ionicons name="barbell" size={16} color={KinetixTheme.colors.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Quick-Create Exercise</Text>
                <Text style={styles.headerSub}>Attach directly to worksession</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={closeExerciseQuickCreate}>
              <Ionicons name="close" size={20} color={KinetixTheme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Exercise Name */}
            <Text style={styles.fieldLabel}>Exercise Name *</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Spanish Squat Isometric Hold"
              placeholderTextColor={KinetixTheme.colors.textMuted}
            />

            {/* Target Area Chips */}
            <Text style={styles.fieldLabel}>Target Musculature / Joint</Text>
            <View style={styles.chipsRow}>
              {MUSCLE_GROUPS.map((mg) => (
                <TouchableOpacity
                  key={mg}
                  style={[styles.chip, muscleGroup === mg && styles.chipActive]}
                  onPress={() => setMuscleGroup(mg)}
                >
                  <Text style={[styles.chipText, muscleGroup === mg && styles.chipTextActive]}>
                    {mg}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Equipment Chips */}
            <Text style={styles.fieldLabel}>Equipment</Text>
            <View style={styles.chipsRow}>
              {EQUIPMENTS.map((eq) => (
                <TouchableOpacity
                  key={eq}
                  style={[styles.chip, equipment === eq && styles.chipActive]}
                  onPress={() => setEquipment(eq)}
                >
                  <Text style={[styles.chipText, equipment === eq && styles.chipTextActive]}>
                    {eq}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tracking Type */}
            <Text style={styles.fieldLabel}>Tracking Metric</Text>
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[styles.typeBtn, trackingType === 'reps' && styles.typeBtnActive]}
                onPress={() => setTrackingType('reps')}
              >
                <Text style={[styles.typeBtnText, trackingType === 'reps' && styles.typeBtnTextActive]}>
                  Reps Only
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, trackingType === 'time' && styles.typeBtnActive]}
                onPress={() => setTrackingType('time')}
              >
                <Text style={[styles.typeBtnText, trackingType === 'time' && styles.typeBtnTextActive]}>
                  Isometric (Time)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, trackingType === 'reps_weight' && styles.typeBtnActive]}
                onPress={() => setTrackingType('reps_weight')}
              >
                <Text style={[styles.typeBtnText, trackingType === 'reps_weight' && styles.typeBtnTextActive]}>
                  Reps + Load
                </Text>
              </TouchableOpacity>
            </View>

            {/* Prescribed Sets & Reps/Time */}
            <View style={styles.metricsRow}>
              <View style={styles.metricInputBox}>
                <Text style={styles.metricLabel}>Sets</Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setSets(Math.max(1, sets - 1))}
                  >
                    <Ionicons name="remove" size={14} color={KinetixTheme.colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.metricVal}>{sets}</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setSets(sets + 1)}
                  >
                    <Ionicons name="add" size={14} color={KinetixTheme.colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {trackingType === 'time' ? (
                <View style={styles.metricInputBox}>
                  <Text style={styles.metricLabel}>Hold Duration</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setHoldSeconds(Math.max(5, holdSeconds - 5))}
                    >
                      <Ionicons name="remove" size={14} color={KinetixTheme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.metricVal}>{holdSeconds}s</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setHoldSeconds(holdSeconds + 5)}
                    >
                      <Ionicons name="add" size={14} color={KinetixTheme.colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.metricInputBox}>
                  <Text style={styles.metricLabel}>Reps</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setReps(Math.max(1, reps - 1))}
                    >
                      <Ionicons name="remove" size={14} color={KinetixTheme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.metricVal}>{reps}</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setReps(reps + 1)}
                    >
                      <Ionicons name="add" size={14} color={KinetixTheme.colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Rest Seconds Box */}
              <View style={styles.metricInputBox}>
                <Text style={styles.metricLabel}>Rest</Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setRestSeconds(Math.max(10, restSeconds - 10))}
                  >
                    <Ionicons name="remove" size={14} color={KinetixTheme.colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.metricVal}>{restSeconds}s</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setRestSeconds(restSeconds + 10)}
                  >
                    <Ionicons name="add" size={14} color={KinetixTheme.colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Clinical Cue */}
            <Text style={styles.fieldLabel}>Execution Cue / Clinical Fix</Text>
            <TextInput
              style={[styles.textInput, { minHeight: 48 }]}
              value={cue}
              onChangeText={setCue}
              placeholder="e.g., Sit back into band, vertical shins, drive big toe into floor."
              placeholderTextColor={KinetixTheme.colors.textMuted}
              multiline
            />
          </ScrollView>

          {/* Add Exercise CTA */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.addBtn, !name.trim() && { opacity: 0.5 }]}
              onPress={handleAdd}
              disabled={!name.trim()}
              activeOpacity={0.88}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Attach Exercise to Worksession</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  headerSub: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: KinetixTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: KinetixTheme.colors.text,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: KinetixTheme.colors.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  chipTextActive: {
    color: KinetixTheme.colors.primary,
    fontWeight: '700',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 6,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: KinetixTheme.colors.primary,
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  typeBtnTextActive: {
    color: KinetixTheme.colors.primary,
    fontWeight: '800',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  metricInputBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.textSecondary,
    marginBottom: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  addBtn: {
    backgroundColor: KinetixTheme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: KinetixTheme.borderRadius.lg,
    ...KinetixTheme.shadows.primaryGlow,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
