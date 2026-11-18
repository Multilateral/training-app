import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrainingContext, supabase } from '../context/TrainingContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import WorkoutRemindersConfig from '../components/WorkoutRemindersConfig';
import ActiveWorkoutStatusBar from '../components/ActiveWorkoutStatusBar';
import TrainingOnboardingSurveyModal, {
  TRAINING_GOALS,
  EXPERIENCE_LEVELS,
  EQUIPMENT_OPTIONS,
  JOINT_CARE_AREAS,
} from '../components/TrainingOnboardingSurveyModal';

export default function SettingsScreen() {
  const { session, workspaces, updateWorkspaces, userProfile, updateUserProfile, saveToCloud } = useContext(TrainingContext) || {};
  const [defaultPlan, setDefaultPlan] = useState<any>(null);

  // Biometrics editing state
  const [isEditBiometricsModalVisible, setIsEditBiometricsModalVisible] = useState(false);
  const [editWeightInput, setEditWeightInput] = useState('');
  const [editTargetWeightInput, setEditTargetWeightInput] = useState('');
  const [editHeightInput, setEditHeightInput] = useState('');
  const [editAgeInput, setEditAgeInput] = useState('');
  const [isSavingBiometrics, setIsSavingBiometrics] = useState(false);

  const weightUnit = userProfile?.weightUnit || workspaces?.weightUnit || 'kg';
  const heightUnit = userProfile?.heightUnit || workspaces?.heightUnit || 'cm';
  const resolvedCurrentWeight = userProfile?.currentWeight || workspaces?.currentWeight || workspaces?.latest_weight;
  const resolvedTargetWeight = userProfile?.targetWeight || workspaces?.targetWeight || workspaces?.target_weight;
  const resolvedHeight = userProfile?.height || workspaces?.height;
  const resolvedAge = userProfile?.age || workspaces?.age;
  const resolvedGender = userProfile?.gender || workspaces?.gender;

  // Training Goals Diagnostic & Survey state
  const [isSurveyModalVisible, setIsSurveyModalVisible] = useState(false);

  // Resolved training goals metadata
  const currentGoalId = workspaces?.training_goal || 'hypertrophy';
  const currentGoalMeta = TRAINING_GOALS.find(g => g.id === currentGoalId) || TRAINING_GOALS[0];
  const currentWeeklySessions = workspaces?.weekly_target_sessions || 4;
  const currentFitnessLevel = workspaces?.fitness_level
    ? EXPERIENCE_LEVELS.find(l => l.id === workspaces.fitness_level)?.title || workspaces.fitness_level
    : 'Intermediate';
  const currentEquipment = workspaces?.equipment_access
    ? EQUIPMENT_OPTIONS.find(e => e.id === workspaces.equipment_access)?.title || workspaces.equipment_access
    : 'Commercial Gym';
  const currentJoints = (workspaces?.joint_focus || []).map(
    (j: string) => JOINT_CARE_AREAS.find(a => a.id === j)?.label || j
  );

  const openEditBiometricsModal = () => {
    setEditWeightInput(resolvedCurrentWeight ? String(resolvedCurrentWeight) : '');
    setEditTargetWeightInput(resolvedTargetWeight ? String(resolvedTargetWeight) : '');
    setEditHeightInput(resolvedHeight ? String(resolvedHeight) : '');
    setEditAgeInput(resolvedAge ? String(resolvedAge) : '');
    setIsEditBiometricsModalVisible(true);
  };

  const handleSaveBiometrics = async () => {
    const parsedWeight = parseFloat(editWeightInput);
    const parsedTarget = parseFloat(editTargetWeightInput);
    const parsedHeight = parseFloat(editHeightInput);
    const parsedAge = parseInt(editAgeInput, 10);

    if (isNaN(parsedWeight) || parsedWeight < 20 || parsedWeight > 300) {
      Alert.alert('Invalid Weight', 'Please enter a realistic weight (20-300 kg).');
      return;
    }

    setIsSavingBiometrics(true);
    try {
      const updates: any = {
        currentWeight: parsedWeight,
        weightUnit,
        heightUnit,
      };
      if (!isNaN(parsedTarget) && parsedTarget >= 20 && parsedTarget <= 300) {
        updates.targetWeight = parsedTarget;
      }
      if (!isNaN(parsedHeight) && parsedHeight >= 50 && parsedHeight <= 250) {
        updates.height = parsedHeight;
      }
      if (!isNaN(parsedAge) && parsedAge >= 10 && parsedAge <= 120) {
        updates.age = parsedAge;
      }

      if (updateUserProfile) {
        await updateUserProfile(updates);
      }

      const todayStr = new Date().toISOString().split('T')[0];
      if (saveToCloud) {
        await saveToCloud(todayStr, { weight: parsedWeight });
      }

      setIsEditBiometricsModalVisible(false);
      Alert.alert('Biometrics Saved', 'Your body parameters have been updated and synced with the database.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update biometrics');
    } finally {
      setIsSavingBiometrics(false);
    }
  };

  // Profile Name Editing State
  const [isEditNameModalVisible, setIsEditNameModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const openEditNameModal = () => {
    const currentName =
      session?.user?.user_metadata?.full_name ||
      session?.user?.user_metadata?.name ||
      session?.user?.user_metadata?.username ||
      '';
    setNameInput(currentName);
    setIsEditNameModalVisible(true);
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      Alert.alert('Invalid Name', 'Please enter your name.');
      return;
    }

    setIsSavingName(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: trimmed,
        },
      });

      if (error) {
        Alert.alert('Update Failed', error.message);
      } else {
        setIsEditNameModalVisible(false);
        Alert.alert('Profile Updated', `Your display name is now "${trimmed}".`);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update name');
    } finally {
      setIsSavingName(false);
    }
  };

  useEffect(() => {
    const fetchDefaultPlan = async () => {
      if (!workspaces?.defaultPlanId) return;
      try {
        const { data, error } = await supabase
          .from('training_plans')
          .select(`
            id, name, schedule_type,
            plan_worksessions (
              id, day_name, order_index,
              worksessions (id, name, modality)
            )
          `)
          .eq('id', workspaces.defaultPlanId)
          .single();
        if (data && !error) {
          setDefaultPlan(data);
        }
      } catch (err) {
        console.log('Failed to fetch default plan in settings', err);
      }
    };

    fetchDefaultPlan();
  }, [workspaces?.defaultPlanId]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleUpdateReminders = (updatedReminders: any) => {
    if (updateWorkspaces) {
      updateWorkspaces({
        ...workspaces,
        reminders: updatedReminders
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            {/* Display Name Row (Editable) */}
            <TouchableOpacity
              style={[styles.row, styles.borderBottom]}
              onPress={openEditNameModal}
              activeOpacity={0.7}
            >
              <View style={styles.rowTextWithIcon}>
                <Ionicons name="person-circle-outline" size={24} color="#00D09E" style={styles.icon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Display Name</Text>
                  <Text style={styles.value}>
                    {session?.user?.user_metadata?.full_name || 
                     session?.user?.user_metadata?.name || 
                     session?.user?.user_metadata?.username || 
                     'Tap to set your name'}
                  </Text>
                </View>
              </View>
              <View style={styles.editActionRow}>
                <Text style={styles.editText}>Edit</Text>
                <Ionicons name="chevron-forward" size={18} color="#00D09E" />
              </View>
            </TouchableOpacity>

            {/* Email Row (Read-only) */}
            <View style={styles.row}>
              <View style={styles.rowTextWithIcon}>
                <Ionicons name="mail-outline" size={22} color="#888" style={styles.icon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Email</Text>
                  <Text style={styles.value}>
                    {session?.user?.email || 'Not logged in'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Body Biometrics Section */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={styles.sectionTitle}>Body Biometrics</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0, 208, 158, 0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
              <Ionicons name="sync-circle" size={14} color="#00D09E" />
              <Text style={{ fontSize: 11, color: '#00D09E', fontWeight: '700' }}>NutraLife Sync</Text>
            </View>
          </View>

          <View style={styles.card}>
            {/* Current Weight */}
            <TouchableOpacity
              style={[styles.row, styles.borderBottom]}
              onPress={openEditBiometricsModal}
              activeOpacity={0.7}
            >
              <View style={styles.rowTextWithIcon}>
                <Ionicons name="scale-outline" size={22} color="#00D09E" style={styles.icon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Current Weight</Text>
                  <Text style={styles.value}>
                    {resolvedCurrentWeight ? `${Number(resolvedCurrentWeight).toFixed(1)} ${weightUnit}` : 'Tap to log weight'}
                  </Text>
                </View>
              </View>
              <View style={styles.editActionRow}>
                <Text style={styles.editText}>Edit</Text>
                <Ionicons name="chevron-forward" size={18} color="#00D09E" />
              </View>
            </TouchableOpacity>

            {/* Target Weight */}
            <TouchableOpacity
              style={[styles.row, styles.borderBottom]}
              onPress={openEditBiometricsModal}
              activeOpacity={0.7}
            >
              <View style={styles.rowTextWithIcon}>
                <Ionicons name="flag-outline" size={22} color="#00D09E" style={styles.icon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Target Weight</Text>
                  <Text style={styles.value}>
                    {resolvedTargetWeight ? `${Number(resolvedTargetWeight).toFixed(1)} ${weightUnit}` : 'Not set'}
                  </Text>
                </View>
              </View>
              <View style={styles.editActionRow}>
                <Text style={styles.editText}>Edit</Text>
                <Ionicons name="chevron-forward" size={18} color="#00D09E" />
              </View>
            </TouchableOpacity>

            {/* Height & Age Row */}
            <TouchableOpacity
              style={styles.row}
              onPress={openEditBiometricsModal}
              activeOpacity={0.7}
            >
              <View style={styles.rowTextWithIcon}>
                <Ionicons name="body-outline" size={22} color="#00D09E" style={styles.icon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Height & Age</Text>
                  <Text style={styles.value}>
                    {resolvedHeight ? `${resolvedHeight} ${heightUnit}` : '—'} · {resolvedAge ? `${resolvedAge} yrs` : '—'}{resolvedGender ? ` · ${resolvedGender}` : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.editActionRow}>
                <Text style={styles.editText}>Edit</Text>
                <Ionicons name="chevron-forward" size={18} color="#00D09E" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Training Goals & Blueprint Section */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={styles.sectionTitle}>Training Goals & Blueprint</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0, 208, 158, 0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
              <Ionicons name="sparkles" size={13} color="#00D09E" />
              <Text style={{ fontSize: 11, color: '#00D09E', fontWeight: '700' }}>Active Blueprint</Text>
            </View>
          </View>

          <View style={styles.card}>
            {/* Primary Focus */}
            <TouchableOpacity
              style={[styles.row, styles.borderBottom]}
              onPress={() => setIsSurveyModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.rowTextWithIcon}>
                <Ionicons name="barbell-outline" size={22} color="#00D09E" style={styles.icon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Primary Training Focus</Text>
                  <Text style={styles.value}>
                    {workspaces?.training_goal_title || currentGoalMeta.title}
                  </Text>
                </View>
              </View>
              <View style={styles.editActionRow}>
                <Text style={styles.editText}>Modify</Text>
                <Ionicons name="chevron-forward" size={18} color="#00D09E" />
              </View>
            </TouchableOpacity>

            {/* Weekly Target Sessions */}
            <TouchableOpacity
              style={[styles.row, styles.borderBottom]}
              onPress={() => setIsSurveyModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.rowTextWithIcon}>
                <Ionicons name="calendar-outline" size={22} color="#00D09E" style={styles.icon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Weekly Commitment</Text>
                  <Text style={styles.value}>
                    {currentWeeklySessions} sessions / week
                  </Text>
                </View>
              </View>
              <View style={styles.editActionRow}>
                <Text style={styles.editText}>Modify</Text>
                <Ionicons name="chevron-forward" size={18} color="#00D09E" />
              </View>
            </TouchableOpacity>

            {/* Equipment & Level */}
            <TouchableOpacity
              style={[styles.row, currentJoints.length > 0 ? styles.borderBottom : null]}
              onPress={() => setIsSurveyModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.rowTextWithIcon}>
                <Ionicons name="fitness-outline" size={22} color="#00D09E" style={styles.icon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Level & Equipment</Text>
                  <Text style={styles.value}>
                    {currentFitnessLevel} · {currentEquipment}
                  </Text>
                </View>
              </View>
              <View style={styles.editActionRow}>
                <Text style={styles.editText}>Modify</Text>
                <Ionicons name="chevron-forward" size={18} color="#00D09E" />
              </View>
            </TouchableOpacity>

            {/* Joint & Mobility Focus if present */}
            {currentJoints.length > 0 && (
              <TouchableOpacity
                style={styles.row}
                onPress={() => setIsSurveyModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={styles.rowTextWithIcon}>
                  <Ionicons name="shield-checkmark-outline" size={22} color="#00D09E" style={styles.icon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Joint Care & Resilience</Text>
                    <Text style={styles.value}>
                      {currentJoints.join(', ')}
                    </Text>
                  </View>
                </View>
                <View style={styles.editActionRow}>
                  <Text style={styles.editText}>Modify</Text>
                  <Ionicons name="chevron-forward" size={18} color="#00D09E" />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Retake Diagnostic Survey Button */}
          <TouchableOpacity
            style={styles.surveyCtaButton}
            onPress={() => setIsSurveyModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="compass-outline" size={18} color="#00D09E" />
            <Text style={styles.surveyCtaText}>Retake Full Diagnostic Survey</Text>
          </TouchableOpacity>
        </View>

        {/* Training Reminders & Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Training Reminders</Text>
          <WorkoutRemindersConfig
            remindersData={workspaces?.reminders}
            onUpdateReminders={handleUpdateReminders}
            defaultPlan={defaultPlan}
          />
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <TouchableOpacity style={[styles.row, styles.borderBottom]} onPress={() => router.push('/plans')}>
              <View style={styles.rowTextWithIcon}>
                <Ionicons name="barbell-outline" size={24} color="#00D09E" style={styles.icon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Default Workout Plan</Text>
                  <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }}>
                    {defaultPlan?.name ? `Active: ${defaultPlan.name}` : 'Manage and set default training plan'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            <View style={styles.row}>
              <View style={styles.rowTextWithIcon}>
                <Ionicons name="moon-outline" size={24} color="#00D09E" style={styles.icon} />
                <Text style={styles.label}>Dark Mode</Text>
              </View>
              <Switch
                value={true}
                disabled={true}
                trackColor={{ false: '#333', true: '#00D09E' }}
                thumbColor={'#fff'}
              />
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={[styles.row, styles.borderBottom]}>
              <View style={styles.rowTextWithIcon}>
                <Ionicons name="information-circle-outline" size={24} color="#00D09E" style={styles.icon} />
                <Text style={styles.label}>Version</Text>
              </View>
              <Text style={styles.value}>1.0.0</Text>
            </View>
            <TouchableOpacity style={styles.row}>
              <View style={styles.rowTextWithIcon}>
                <Ionicons name="document-text-outline" size={24} color="#00D09E" style={styles.icon} />
                <Text style={styles.label}>Terms of Service</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        {session && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF453A" style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* Floating In-Progress Status Bar */}
      <ActiveWorkoutStatusBar />

      {/* Edit Display Name Modal */}
      <Modal
        visible={isEditNameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditNameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="person-outline" size={22} color="#00D09E" />
              <Text style={styles.modalTitle}>Edit Display Name</Text>
            </View>

            <Text style={styles.modalSubtitle}>
              This is how your name will appear on the dashboard and workout greetings.
            </Text>

            <TextInput
              style={styles.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="e.g. Vlad"
              placeholderTextColor="#666"
              autoFocus={true}
              autoCapitalize="words"
              maxLength={40}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsEditNameModalVisible(false)}
                disabled={isSavingName}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveName}
                disabled={isSavingName}
              >
                {isSavingName ? (
                  <ActivityIndicator size="small" color="#111" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Biometrics Modal */}
      <Modal
        visible={isEditBiometricsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditBiometricsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="fitness-outline" size={22} color="#00D09E" />
              <Text style={styles.modalTitle}>Update Body Biometrics</Text>
            </View>

            <Text style={styles.modalSubtitle}>
              These values sync in real-time across both NutraLife and Training apps.
            </Text>

            <Text style={styles.inputLabel}>Current Weight ({weightUnit})</Text>
            <TextInput
              style={styles.nameInput}
              value={editWeightInput}
              onChangeText={setEditWeightInput}
              placeholder="e.g. 80.5"
              placeholderTextColor="#666"
              keyboardType="decimal-pad"
            />

            <Text style={styles.inputLabel}>Target Weight ({weightUnit})</Text>
            <TextInput
              style={styles.nameInput}
              value={editTargetWeightInput}
              onChangeText={setEditTargetWeightInput}
              placeholder="e.g. 75.0"
              placeholderTextColor="#666"
              keyboardType="decimal-pad"
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Height ({heightUnit})</Text>
                <TextInput
                  style={styles.nameInput}
                  value={editHeightInput}
                  onChangeText={setEditHeightInput}
                  placeholder="e.g. 180"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Age (years)</Text>
                <TextInput
                  style={styles.nameInput}
                  value={editAgeInput}
                  onChangeText={setEditAgeInput}
                  placeholder="e.g. 35"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsEditBiometricsModalVisible(false)}
                disabled={isSavingBiometrics}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveBiometrics}
                disabled={isSavingBiometrics}
              >
                {isSavingBiometrics ? (
                  <ActivityIndicator size="small" color="#111" />
                ) : (
                  <Text style={styles.saveBtnText}>Save & Sync</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Training Onboarding Diagnostic & Goal Modification Modal */}
      <TrainingOnboardingSurveyModal
        visible={isSurveyModalVisible}
        onClose={() => setIsSurveyModalVisible(false)}
        initialProfile={userProfile}
        workspaces={workspaces}
        updateWorkspaces={updateWorkspaces}
        userId={session?.user?.id}
        isEditMode={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
    marginLeft: 5,
  },
  card: {
    backgroundColor: '#222',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  rowTextWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowText: {
    flex: 1,
  },
  icon: {
    marginRight: 15,
  },
  label: {
    color: '#fff',
    fontSize: 16,
  },
  value: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#2A1A1A',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#4A2A2A',
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    color: '#FF453A',
    fontWeight: 'bold',
    fontSize: 16,
  },
  editActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editText: {
    color: '#00D09E',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#222',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    color: '#888',
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  inputLabel: {
    color: '#AAA',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameInput: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  cancelBtnText: {
    color: '#ccc',
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#00D09E',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#111',
    fontWeight: '700',
    fontSize: 14,
  },
  surveyCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 158, 0.3)',
  },
  surveyCtaText: {
    color: '#00D09E',
    fontWeight: '700',
    fontSize: 13,
  },
});
