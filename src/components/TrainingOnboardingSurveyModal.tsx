import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../context/TrainingContext';

export interface TrainingOnboardingSurveyModalProps {
  visible: boolean;
  onClose: () => void;
  initialProfile?: any;
  workspaces?: any;
  updateWorkspaces?: (workspaces: any) => Promise<void> | void;
  userId?: string;
  isEditMode?: boolean;
}

export const TRAINING_GOALS = [
  {
    id: 'hypertrophy',
    title: 'Muscle Growth & Hypertrophy',
    icon: 'barbell-outline',
    subtitle: 'Maximize lean muscle mass, compound lifting strength, and volume.',
    recommendedPlanName: 'Foundation muscle growth',
    defaultSessions: 4,
  },
  {
    id: 'athletic',
    title: 'Athletic Power & Explosiveness',
    icon: 'flash-outline',
    subtitle: 'Increase vertical jump, agility, calisthenics control, and fast-twitch power.',
    recommendedPlanName: 'Plyometrics & Calisthenics Plan',
    defaultSessions: 4,
  },
  {
    id: 'rehab',
    title: 'Joint, Spine & Postural Rehab',
    icon: 'shield-checkmark-outline',
    subtitle: 'Alleviate back/knee discomfort, restore spinal stiffness, and injury-proof joints.',
    recommendedPlanName: 'Lower Back & Lumbar Spine Resilience (Postural Syndrome)',
    defaultSessions: 3,
  },
  {
    id: 'endurance',
    title: 'Conditioning & Stamina',
    icon: 'flame-outline',
    subtitle: 'Elevate VO2 max, functional stamina, and athletic work capacity.',
    recommendedPlanName: 'Foundation muscle growth',
    defaultSessions: 3,
  },
];

export const EXPERIENCE_LEVELS = [
  { id: 'beginner', title: 'Beginner', desc: 'New to structured programs or rebuilding consistency' },
  { id: 'intermediate', title: 'Intermediate', desc: 'Solid foundation with barbells, bodyweight, and tempo' },
  { id: 'advanced', title: 'Advanced', desc: 'Years of athletic training targeting peak power output' },
];

export const EQUIPMENT_OPTIONS = [
  { id: 'full_gym', title: 'Commercial Gym', desc: 'Full access to barbells, racks, cables & machines' },
  { id: 'home_gym', title: 'Home / Dumbbells & Bands', desc: 'Dumbbells, kettlebells, bands & pull-up bar' },
  { id: 'bodyweight', title: 'Bodyweight & Calisthenics', desc: 'Mat, floor space & bodyweight resistance' },
];

export const JOINT_CARE_AREAS = [
  { id: 'lower_back', label: 'Lower Back & Lumbar' },
  { id: 'knees', label: 'Knees & Patellar' },
  { id: 'shoulders', label: 'Shoulders & Scapulae' },
  { id: 'ankles', label: 'Ankles & Achilles' },
];

export default function TrainingOnboardingSurveyModal({
  visible,
  onClose,
  initialProfile = {},
  workspaces = {},
  updateWorkspaces,
  userId,
  isEditMode = false,
}: TrainingOnboardingSurveyModalProps) {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [selectedGoal, setSelectedGoal] = useState<string>(() => workspaces?.training_goal || 'hypertrophy');
  const [weeklySessions, setWeeklySessions] = useState<number>(() => workspaces?.weekly_target_sessions || 4);
  const [experienceLevel, setExperienceLevel] = useState<string>(() => workspaces?.fitness_level || 'intermediate');
  const [equipment, setEquipment] = useState<string>(() => workspaces?.equipment_access || 'full_gym');
  const [selectedJoints, setSelectedJoints] = useState<string[]>(() => workspaces?.joint_focus || ['lower_back']);

  // Biometrics
  const weightUnit = initialProfile?.weightUnit || workspaces?.weightUnit || 'kg';
  const heightUnit = initialProfile?.heightUnit || workspaces?.heightUnit || 'cm';
  const [currentWeight, setCurrentWeight] = useState<string>(() => {
    const w = initialProfile?.currentWeight ?? workspaces?.currentWeight ?? workspaces?.latest_weight;
    return w ? String(w) : '102.4';
  });
  const [targetWeight, setTargetWeight] = useState<string>(() => {
    const tw = initialProfile?.targetWeight ?? workspaces?.targetWeight ?? workspaces?.target_weight;
    return tw ? String(tw) : '95.0';
  });
  const [height, setHeight] = useState<string>(() => {
    const h = initialProfile?.height ?? workspaces?.height;
    return h ? String(h) : '180';
  });
  const [age, setAge] = useState<string>(() => {
    const a = initialProfile?.age ?? workspaces?.age;
    return a ? String(a) : '35';
  });

  // Keep state updated when initialProfile or workspaces change
  useEffect(() => {
    if (workspaces?.training_goal) setSelectedGoal(workspaces.training_goal);
    if (workspaces?.weekly_target_sessions) setWeeklySessions(workspaces.weekly_target_sessions);
    if (workspaces?.fitness_level) setExperienceLevel(workspaces.fitness_level);
    if (workspaces?.equipment_access) setEquipment(workspaces.equipment_access);
    if (workspaces?.joint_focus) setSelectedJoints(workspaces.joint_focus);

    const w = initialProfile?.currentWeight ?? workspaces?.currentWeight ?? workspaces?.latest_weight;
    if (w) setCurrentWeight(String(w));
    const tw = initialProfile?.targetWeight ?? workspaces?.targetWeight ?? workspaces?.target_weight;
    if (tw) setTargetWeight(String(tw));
    const h = initialProfile?.height ?? workspaces?.height;
    if (h) setHeight(String(h));
    const a = initialProfile?.age ?? workspaces?.age;
    if (a) setAge(String(a));
  }, [initialProfile, workspaces]);

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
  };

  const handleNext = () => {
    triggerHaptic();
    if (step < 5) {
      setStep(step + 1);
    } else {
      handleCompleteSurvey();
    }
  };

  const handleBack = () => {
    triggerHaptic();
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleJointCare = (id: string) => {
    triggerHaptic();
    setSelectedJoints(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectedGoalMeta = useMemo(() => {
    return TRAINING_GOALS.find(g => g.id === selectedGoal) || TRAINING_GOALS[0];
  }, [selectedGoal]);

  const handleCompleteSurvey = async () => {
    setIsSaving(true);
    triggerHaptic();

    try {
      const numWeight = parseFloat(currentWeight) || 102.4;
      const numTargetWeight = parseFloat(targetWeight) || 95.0;
      const numHeight = parseFloat(height) || 180;
      const numAge = parseInt(age, 10) || 35;

      // Construct dynamic goal objects for the progress tracker
      const updatedGoals = [
        {
          id: 'goal-weekly-freq',
          title: 'Weekly Training Consistency',
          type: 'weekly_frequency',
          target_value: weeklySessions,
          current_value: 0,
          unit: 'sessions',
          timeframe: 'weekly',
        },
        {
          id: 'goal-rehab-target',
          title: 'Rehab & Mobility Protocols',
          type: 'recovery_target',
          target_value: selectedJoints.length > 0 ? 2 : 1,
          current_value: 0,
          unit: 'protocols',
          timeframe: 'weekly',
        },
        {
          id: 'goal-active-volume',
          title: 'Weekly Training Volume',
          type: 'volume',
          target_value: weeklySessions * 40,
          current_value: 0,
          unit: 'mins',
          timeframe: 'weekly',
        },
      ];

      const mergedWorkspaces = {
        ...(workspaces || {}),
        training_onboarding_completed: true,
        training_goal: selectedGoal,
        training_goal_title: selectedGoalMeta.title,
        weekly_target_sessions: weeklySessions,
        fitness_level: experienceLevel,
        equipment_access: equipment,
        joint_focus: selectedJoints,
        goals: updatedGoals,
        currentWeight: numWeight,
        latest_weight: numWeight,
        targetWeight: numTargetWeight,
        target_weight: numTargetWeight,
        height: numHeight,
        age: numAge,
        weightUnit,
        heightUnit,
      };

      if (updateWorkspaces) {
        await updateWorkspaces(mergedWorkspaces);
      }

      // If userId exists, set local AsyncStorage marker
      if (userId) {
        await AsyncStorage.setItem(`@training_onboarding_completed_${userId}`, 'true');
      }

      // Direct cloud sync to user_profiles table
      const resolvedUid = userId || (await supabase.auth.getUser()).data.user?.id;
      if (resolvedUid) {
        await supabase.from('user_profiles').upsert({
          id: resolvedUid,
          current_weight: numWeight,
          target_weight: numTargetWeight,
          height: numHeight,
          age: numAge,
          weight_unit: weightUnit,
          height_unit: heightUnit,
          workspaces_data: mergedWorkspaces,
          updated_at: new Date().toISOString(),
        });
      }

      setIsSaving(false);
      Alert.alert(
        isEditMode ? 'Goals Updated' : 'Training Blueprint Activated!',
        isEditMode
          ? 'Your training targets have been successfully updated.'
          : 'Your personalized training roadmap has been generated and synced with your account.'
      );
      onClose();
    } catch (err: any) {
      console.error('Failed to complete training onboarding:', err);
      setIsSaving(false);
      Alert.alert('Error', err?.message || 'Could not save your survey. Please try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {step > 1 && (
                <TouchableOpacity onPress={handleBack} style={styles.iconBtn}>
                  <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
              )}
              <View>
                <Text style={styles.headerTitle}>
                  {isEditMode ? 'Modify Training Goals' : 'Training Diagnostic'}
                </Text>
                <Text style={styles.stepBadge}>Step {step} of 5</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${(step / 5) * 100}%` }]} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {/* ================= STEP 1: PRIMARY GOAL ================= */}
            {step === 1 && (
              <View style={styles.stepContainer}>
                <Text style={styles.sectionHeading}>What is your primary training focus?</Text>
                <Text style={styles.sectionSubtitle}>
                  We will calibrate your weekly routines, volume targets, and active plans accordingly.
                </Text>

                <View style={{ gap: 12, marginTop: 15 }}>
                  {TRAINING_GOALS.map(item => {
                    const isSelected = selectedGoal === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.cardOption, isSelected && styles.cardOptionSelected]}
                        onPress={() => {
                          triggerHaptic();
                          setSelectedGoal(item.id);
                          setWeeklySessions(item.defaultSessions);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.cardIconBox, isSelected && styles.cardIconBoxSelected]}>
                          <Ionicons
                            name={item.icon as any}
                            size={24}
                            color={isSelected ? '#111' : '#00D09E'}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.cardTitle, isSelected && { color: '#00D09E' }]}>
                            {item.title}
                          </Text>
                          <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={24} color="#00D09E" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ================= STEP 2: COMMITMENT & LEVEL ================= */}
            {step === 2 && (
              <View style={styles.stepContainer}>
                <Text style={styles.sectionHeading}>Weekly Commitment & Experience</Text>
                <Text style={styles.sectionSubtitle}>
                  How many days per week can you consistently commit to training?
                </Text>

                {/* Frequency Selector */}
                <Text style={styles.inputGroupLabel}>TARGET SESSIONS PER WEEK</Text>
                <View style={styles.pillsRow}>
                  {[2, 3, 4, 5, 6].map(num => {
                    const isSelected = weeklySessions === num;
                    return (
                      <TouchableOpacity
                        key={num}
                        style={[styles.pillBtn, isSelected && styles.pillBtnSelected]}
                        onPress={() => {
                          triggerHaptic();
                          setWeeklySessions(num);
                        }}
                      >
                        <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                          {num} Days{num === 4 ? ' ★' : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Experience Level */}
                <Text style={[styles.inputGroupLabel, { marginTop: 28 }]}>FITNESS & ATHLETIC LEVEL</Text>
                <View style={{ gap: 12 }}>
                  {EXPERIENCE_LEVELS.map(lvl => {
                    const isSelected = experienceLevel === lvl.id;
                    return (
                      <TouchableOpacity
                        key={lvl.id}
                        style={[styles.cardOption, isSelected && styles.cardOptionSelected]}
                        onPress={() => {
                          triggerHaptic();
                          setExperienceLevel(lvl.id);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.cardTitle, isSelected && { color: '#00D09E' }]}>
                            {lvl.title}
                          </Text>
                          <Text style={styles.cardSubtitle}>{lvl.desc}</Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={22} color="#00D09E" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ================= STEP 3: EQUIPMENT & JOINT CARE ================= */}
            {step === 3 && (
              <View style={styles.stepContainer}>
                <Text style={styles.sectionHeading}>Equipment & Joint Care</Text>
                <Text style={styles.sectionSubtitle}>
                  Select your available equipment setup and any physical areas that need recovery focus.
                </Text>

                {/* Equipment */}
                <Text style={styles.inputGroupLabel}>PRIMARY EQUIPMENT SETUP</Text>
                <View style={{ gap: 10 }}>
                  {EQUIPMENT_OPTIONS.map(eq => {
                    const isSelected = equipment === eq.id;
                    return (
                      <TouchableOpacity
                        key={eq.id}
                        style={[styles.cardOption, isSelected && styles.cardOptionSelected]}
                        onPress={() => {
                          triggerHaptic();
                          setEquipment(eq.id);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.cardTitle, isSelected && { color: '#00D09E' }]}>
                            {eq.title}
                          </Text>
                          <Text style={styles.cardSubtitle}>{eq.desc}</Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={22} color="#00D09E" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Joint Resilience Focus */}
                <Text style={[styles.inputGroupLabel, { marginTop: 28 }]}>
                  AREAS NEEDING RESILIENCE / REHAB (OPTIONAL)
                </Text>
                <View style={styles.chipGrid}>
                  {JOINT_CARE_AREAS.map(joint => {
                    const isSelected = selectedJoints.includes(joint.id);
                    return (
                      <TouchableOpacity
                        key={joint.id}
                        style={[styles.chipBtn, isSelected && styles.chipBtnSelected]}
                        onPress={() => toggleJointCare(joint.id)}
                      >
                        <Ionicons
                          name={isSelected ? 'shield-checkmark' : 'shield-outline'}
                          size={16}
                          color={isSelected ? '#111' : '#00D09E'}
                        />
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {joint.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ================= STEP 4: BODY BIOMETRICS ================= */}
            {step === 4 && (
              <View style={styles.stepContainer}>
                <Text style={styles.sectionHeading}>Body Biometrics</Text>
                <Text style={styles.sectionSubtitle}>
                  Confirm your body parameters. These stay synchronized in real time with NutraLife.
                </Text>

                <View style={styles.syncBadge}>
                  <Ionicons name="sync-circle" size={18} color="#00D09E" />
                  <Text style={styles.syncBadgeText}>Connected to NutraLife Database</Text>
                </View>

                <View style={styles.inputRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Current Weight ({weightUnit})</Text>
                    <TextInput
                      style={styles.textInput}
                      value={currentWeight}
                      onChangeText={setCurrentWeight}
                      placeholder="e.g. 102.4"
                      placeholderTextColor="#555"
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Target Weight ({weightUnit})</Text>
                    <TextInput
                      style={styles.textInput}
                      value={targetWeight}
                      onChangeText={setTargetWeight}
                      placeholder="e.g. 95.0"
                      placeholderTextColor="#555"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View style={[styles.inputRow, { marginTop: 15 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Height ({heightUnit})</Text>
                    <TextInput
                      style={styles.textInput}
                      value={height}
                      onChangeText={setHeight}
                      placeholder="e.g. 180"
                      placeholderTextColor="#555"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Age (years)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={age}
                      onChangeText={setAge}
                      placeholder="e.g. 35"
                      placeholderTextColor="#555"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* ================= STEP 5: BLUEPRINT SUMMARY ================= */}
            {step === 5 && (
              <View style={styles.stepContainer}>
                <Text style={styles.sectionHeading}>Your Training Blueprint</Text>
                <Text style={styles.sectionSubtitle}>
                  Review your personalized blueprint before activating your goals.
                </Text>

                <View style={styles.summaryCard}>
                  <View style={styles.summaryHeaderRow}>
                    <Ionicons name="trophy" size={26} color="#00D09E" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.summaryTitle}>{selectedGoalMeta.title}</Text>
                      <Text style={styles.summarySubtitle}>
                        {experienceLevel.toUpperCase()} · {weeklySessions} SESSIONS / WEEK
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.statGrid}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>WEEKLY VOLUME</Text>
                      <Text style={styles.statValue}>{weeklySessions * 40} min</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>WEIGHT GOAL</Text>
                      <Text style={styles.statValue}>
                        {currentWeight} → {targetWeight} {weightUnit}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={{ marginTop: 4 }}>
                    <Text style={styles.statLabel}>RECOMMENDED PROTOCOL</Text>
                    <Text style={styles.planBadge}>{selectedGoalMeta.recommendedPlanName}</Text>
                  </View>

                  {selectedJoints.length > 0 && (
                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.statLabel}>TARGETED REHAB PROTOCOLS</Text>
                      <Text style={{ color: '#ccc', fontSize: 13, marginTop: 4 }}>
                        {selectedJoints.map(j => JOINT_CARE_AREAS.find(a => a.id === j)?.label).join(' • ')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Navigation CTA */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleNext}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator color="#111" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.primaryBtnText}>
                    {step === 5
                      ? isEditMode
                        ? 'Save Changes'
                        : 'Activate Training Blueprint'
                      : 'Continue'}
                  </Text>
                  <Ionicons name={step === 5 ? 'checkmark-circle' : 'arrow-forward'} size={20} color="#111" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  stepBadge: {
    color: '#00D09E',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#222',
    width: '100%',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#00D09E',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepContainer: {
    flex: 1,
  },
  sectionHeading: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  sectionSubtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  cardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#262626',
    gap: 14,
  },
  cardOptionSelected: {
    borderColor: '#00D09E',
    backgroundColor: 'rgba(0, 208, 158, 0.08)',
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 208, 158, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconBoxSelected: {
    backgroundColor: '#00D09E',
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#888',
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  inputGroupLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 10,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pillBtn: {
    flex: 1,
    minWidth: 60,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#262626',
  },
  pillBtnSelected: {
    borderColor: '#00D09E',
    backgroundColor: '#00D09E',
  },
  pillText: {
    color: '#CCC',
    fontSize: 14,
    fontWeight: '700',
  },
  pillTextSelected: {
    color: '#111',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A1A1A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#262626',
  },
  chipBtnSelected: {
    backgroundColor: '#00D09E',
    borderColor: '#00D09E',
  },
  chipText: {
    color: '#CCC',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#111',
    fontWeight: '700',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 208, 158, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 15,
    marginBottom: 10,
  },
  syncBadgeText: {
    color: '#00D09E',
    fontSize: 12,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 14,
  },
  inputLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1.5,
    borderColor: '#262626',
  },
  summaryCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginTop: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 208, 158, 0.3)',
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  summaryTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  summarySubtitle: {
    color: '#00D09E',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#262626',
    marginVertical: 16,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#141414',
    padding: 12,
    borderRadius: 10,
  },
  statLabel: {
    color: '#777',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  planBadge: {
    color: '#00D09E',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  bottomBar: {
    padding: 16,
    backgroundColor: '#0F0F0F',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  primaryBtn: {
    backgroundColor: '#00D09E',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#111',
    fontSize: 16,
    fontWeight: '800',
  },
});
