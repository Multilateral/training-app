import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KinetixTheme } from '../constants/theme';
import { DatabaseExercise } from './KinetixLibrary';

export interface ExerciseEditorModalProps {
  visible: boolean;
  onClose: () => void;
  exercise: DatabaseExercise | null; // null = create new, non-null = edit
  onSave: (exerciseData: Partial<DatabaseExercise>) => Promise<boolean>;
  onDelete?: (exercise: DatabaseExercise) => Promise<boolean>;
  isAdmin?: boolean;
}

const CATEGORIES = [
  'Recovery',
  'Strength',
  'Calisthenics',
  'Plyometrics',
  'Weightlifting',
  'Cardio',
  'Yoga',
  'Sports',
];

const SUGGESTED_MUSCLES = [
  'Core',
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Hamstrings',
  'Quadriceps',
  'Ankle / Peroneals',
  'Knee / Patellar',
  'Hip / Glutes',
  'Full Body',
];

const SUGGESTED_EQUIPMENT = [
  'Bodyweight',
  'Resistance Band',
  'Dumbbell',
  'Barbell',
  'Kettlebell',
  'Airex Pad',
  'Cable',
  'TRX',
  'Floor Mat',
  'Machine',
];

export default function ExerciseEditorModal({
  visible,
  onClose,
  exercise,
  onSave,
  onDelete,
  isAdmin = false,
}: ExerciseEditorModalProps) {
  const isEditing = Boolean(exercise);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Strength');
  const [muscleGroup, setMuscleGroup] = useState('General');
  const [equipment, setEquipment] = useState('Bodyweight');
  const [trackingType, setTrackingType] = useState<'reps' | 'time' | 'weight_reps'>('reps');
  const [secondsPerRep, setSecondsPerRep] = useState<string>('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [mechanics, setMechanics] = useState('Compound');
  const [instructions, setInstructions] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (exercise) {
      setName(exercise.name || '');
      setCategory(exercise.category || 'Strength');
      setMuscleGroup(exercise.muscle_group || 'General');
      setEquipment(exercise.equipment || 'Bodyweight');
      setTrackingType(
        exercise.tracking_type === 'time'
          ? 'time'
          : exercise.tracking_type === 'weight_reps'
          ? 'weight_reps'
          : 'reps'
      );
      setSecondsPerRep(
        typeof (exercise as any).seconds_per_rep === 'number' && (exercise as any).seconds_per_rep > 0
          ? String((exercise as any).seconds_per_rep)
          : ''
      );
      setDifficulty(exercise.difficulty || 'Intermediate');
      setMechanics(exercise.mechanics || 'Compound');
      setInstructions(exercise.instructions || '');
      setDescription(exercise.description || '');
    } else {
      // Default initial values for new exercise
      setName('');
      setCategory('Strength');
      setMuscleGroup('General');
      setEquipment('Bodyweight');
      setTrackingType('reps');
      setSecondsPerRep('');
      setDifficulty('Intermediate');
      setMechanics('Compound');
      setInstructions('');
      setDescription('');
    }
  }, [exercise, visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter an exercise name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedSec = parseFloat(secondsPerRep);
      const payload: Partial<DatabaseExercise> = {
        name: name.trim(),
        category,
        muscle_group: muscleGroup.trim() || category,
        equipment: equipment.trim() || 'Bodyweight',
        tracking_type: trackingType,
        seconds_per_rep: !isNaN(parsedSec) && parsedSec > 0 ? parsedSec : undefined,
        difficulty,
        mechanics,
        instructions: instructions.trim(),
        description: description.trim(),
      };

      if (exercise?.id) {
        payload.id = exercise.id;
      }

      const success = await onSave(payload);
      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!exercise || !onDelete) return;

    if (exercise.is_default && !isAdmin) {
      Alert.alert(
        'Protected Exercise',
        'Standard library exercises are protected and cannot be deleted. You can create your own custom exercises.'
      );
      return;
    }

    Alert.alert(
      'Delete Exercise',
      `Are you sure you want to permanently delete "${exercise.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const success = await onDelete(exercise);
              if (success) {
                onClose();
              }
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconCircle}>
                <Ionicons
                  name={isEditing ? 'create-outline' : 'add-circle-outline'}
                  size={20}
                  color={KinetixTheme.colors.primary}
                />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {isEditing ? 'Edit Exercise' : 'Create New Exercise'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {isEditing
                    ? 'Update exercise parameters, tracking, or cues'
                    : 'Add a custom movement without creating a full plan'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={KinetixTheme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Form Scroll Area */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Exercise Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Exercise Name <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Seated Banded Eversion"
                placeholderTextColor={KinetixTheme.colors.textMuted}
              />
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Tracking Metric Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tracking Metric</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    trackingType === 'reps' && styles.toggleBtnActive,
                  ]}
                  onPress={() => setTrackingType('reps')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="repeat-outline"
                    size={16}
                    color={trackingType === 'reps' ? '#059669' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.toggleBtnText,
                      trackingType === 'reps' && { color: '#059669', fontWeight: '800' },
                    ]}
                  >
                    Reps Only
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    trackingType === 'time' && styles.toggleBtnActive,
                  ]}
                  onPress={() => setTrackingType('time')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="timer-outline"
                    size={16}
                    color={trackingType === 'time' ? '#2563EB' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.toggleBtnText,
                      trackingType === 'time' && { color: '#2563EB', fontWeight: '800' },
                    ]}
                  >
                    Time / Iso Hold
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    trackingType === 'weight_reps' && styles.toggleBtnActive,
                  ]}
                  onPress={() => setTrackingType('weight_reps')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="barbell-outline"
                    size={16}
                    color={trackingType === 'weight_reps' ? '#7C3AED' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.toggleBtnText,
                      trackingType === 'weight_reps' && { color: '#7C3AED', fontWeight: '800' },
                    ]}
                  >
                    Weight + Reps
                  </Text>
                </TouchableOpacity>
              </View>

              {trackingType === 'reps' && (
                <View style={{ marginTop: 10 }}>
                  <Text style={[styles.label, { fontSize: 13, color: '#059669' }]}>
                    Tempo: Seconds per Repetition (Optional)
                  </Text>
                  <TextInput
                    style={[styles.textInput, { marginTop: 4 }]}
                    value={secondsPerRep}
                    onChangeText={setSecondsPerRep}
                    placeholder="e.g. 4.5 for Cat-Cow, 10 for McGill / Bird-Dog"
                    placeholderTextColor={KinetixTheme.colors.textMuted}
                    keyboardType="numeric"
                  />
                  <Text style={{ fontSize: 11, color: KinetixTheme.colors.textMuted, marginTop: 4 }}>
                    Guided pacer and sine wave will run at this cadence per rep.
                  </Text>
                </View>
              )}
            </View>

            {/* Muscle Group / Target Joint */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Muscle Group or Joint</Text>
              <TextInput
                style={styles.textInput}
                value={muscleGroup}
                onChangeText={setMuscleGroup}
                placeholder="e.g., Ankle Stabilizers / Peroneals"
                placeholderTextColor={KinetixTheme.colors.textMuted}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.chipsRow, { marginTop: 6 }]}
              >
                {SUGGESTED_MUSCLES.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={styles.miniChip}
                    onPress={() => setMuscleGroup(m)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.miniChipText}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Equipment */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Equipment Needed</Text>
              <TextInput
                style={styles.textInput}
                value={equipment}
                onChangeText={setEquipment}
                placeholder="e.g., Resistance Band or Bodyweight"
                placeholderTextColor={KinetixTheme.colors.textMuted}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.chipsRow, { marginTop: 6 }]}
              >
                {SUGGESTED_EQUIPMENT.map((eq) => (
                  <TouchableOpacity
                    key={eq}
                    style={styles.miniChip}
                    onPress={() => setEquipment(eq)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.miniChipText}>{eq}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Difficulty & Mechanics Row */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Difficulty</Text>
                <View style={styles.pillSelectorRow}>
                  {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => {
                    const isSelected = difficulty === lvl;
                    return (
                      <TouchableOpacity
                        key={lvl}
                        style={[styles.pillBtn, isSelected && styles.pillBtnActive]}
                        onPress={() => setDifficulty(lvl)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.pillBtnText,
                            isSelected && styles.pillBtnTextActive,
                          ]}
                        >
                          {lvl.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Mechanics</Text>
                <View style={styles.pillSelectorRow}>
                  {['Compound', 'Isolation', 'Isometric'].map((m) => {
                    const isSelected = mechanics === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[styles.pillBtn, isSelected && styles.pillBtnActive]}
                        onPress={() => setMechanics(m)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.pillBtnText,
                            isSelected && styles.pillBtnTextActive,
                          ]}
                        >
                          {m.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Coaching Cues & Instructions */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Coaching Cues & Biomechanical Execution</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={instructions}
                onChangeText={setInstructions}
                placeholder="e.g., Swipe your pinky toe away from your body. Control eccentric 3s count. Keep kneecap pointed straight."
                placeholderTextColor={KinetixTheme.colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Clinical Protocol / Clinical Purpose */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Clinical Protocol / Purpose (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="e.g., Isolates peroneal muscles on the outside of the lower leg to prevent lateral ankle sprain recurrence."
                placeholderTextColor={KinetixTheme.colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            {isEditing && onDelete && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDelete}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={17} color="#EF4444" />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, isSubmitting && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.88}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>
                    {isEditing ? 'Save Changes' : 'Create Exercise'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...KinetixTheme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
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
  headerSubtitle: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: KinetixTheme.colors.text,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
  miniChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  miniChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#93C5FD',
    ...KinetixTheme.shadows.card,
  },
  toggleBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  pillSelectorRow: {
    flexDirection: 'row',
    gap: 4,
  },
  pillBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  pillBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  pillBtnTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    ...KinetixTheme.shadows.card,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
