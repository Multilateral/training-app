import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrainingContext, supabase } from '../context/TrainingContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import WorkoutRemindersConfig from '../components/WorkoutRemindersConfig';
import ActiveWorkoutStatusBar from '../components/ActiveWorkoutStatusBar';
import { pickAndUploadAvatar } from '../utils/avatarManager';
import TrainingOnboardingSurveyModal, {
  TRAINING_GOALS,
  EXPERIENCE_LEVELS,
  EQUIPMENT_OPTIONS,
  JOINT_CARE_AREAS,
} from '../components/TrainingOnboardingSurveyModal';

export default function SettingsScreen() {
  const {
    session,
    workspaces,
    updateWorkspaces,
    userProfile,
    updateUserProfile,
    saveToCloud,
  } = useContext(TrainingContext) || {};

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
  const currentGoalMeta = TRAINING_GOALS.find((g) => g.id === currentGoalId) || TRAINING_GOALS[0];
  const currentWeeklySessions = workspaces?.weekly_target_sessions || 4;
  const currentFitnessLevel = workspaces?.fitness_level
    ? EXPERIENCE_LEVELS.find((l) => l.id === workspaces.fitness_level)?.title || workspaces.fitness_level
    : 'Intermediate';
  const currentEquipment = workspaces?.equipment_access
    ? EQUIPMENT_OPTIONS.find((e) => e.id === workspaces.equipment_access)?.title || workspaces.equipment_access
    : 'Commercial Gym';
  const currentJoints = (workspaces?.joint_focus || []).map(
    (j: string) => JOINT_CARE_AREAS.find((a) => a.id === j)?.label || j
  );

  // Profile photo updating state
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  const handlePickAvatar = async (useCamera: boolean) => {
    if (!session?.user?.id) {
      Alert.alert('Notice', 'Please sign in to update your profile picture.');
      return;
    }
    setIsUpdatingAvatar(true);
    try {
      const newAvatarUrl = await pickAndUploadAvatar(session.user.id, useCamera, workspaces);
      if (newAvatarUrl) {
        if (updateUserProfile) {
          await updateUserProfile({ avatar: newAvatarUrl });
        }
        Alert.alert(
          'Profile Photo Synchronized',
          'Your profile photo has been updated and synchronized with NutraLife.'
        );
      }
    } catch (err: any) {
      console.error('Error changing avatar:', err);
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const showAvatarPickerActionSheet = () => {
    Alert.alert(
      'Profile Photo',
      'Choose how you want to update your profile photo. This photo is shared with NutraLife.',
      [
        {
          text: 'Take Photo',
          onPress: () => handlePickAvatar(true),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => handlePickAvatar(false),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

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
      userProfile?.name ||
      workspaces?.name ||
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
        if (updateUserProfile) {
          await updateUserProfile({ name: trimmed });
        }
        if (updateWorkspaces) {
          updateWorkspaces({
            ...workspaces,
            name: trimmed,
          });
        }
        setIsEditNameModalVisible(false);
        Alert.alert('Profile Updated', `Your display name is now "${trimmed}".`);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update name');
    } finally {
      setIsSavingName(false);
    }
  };

  // Unit System Toggle (Metric vs Imperial)
  const handleToggleUnits = async (system: 'metric' | 'imperial') => {
    const newWeightUnit = system === 'metric' ? 'kg' : 'lbs';
    const newHeightUnit = system === 'metric' ? 'cm' : 'in';
    if (updateUserProfile) {
      await updateUserProfile({ weightUnit: newWeightUnit, heightUnit: newHeightUnit });
    }
    if (updateWorkspaces) {
      updateWorkspaces({
        ...workspaces,
        weightUnit: newWeightUnit,
        heightUnit: newHeightUnit,
      });
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
      router.replace('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleUpdateReminders = (updatedReminders: any) => {
    if (updateWorkspaces) {
      updateWorkspaces({
        ...workspaces,
        reminders: updatedReminders,
      });
    }
  };

  const athleteDisplayName =
    userProfile?.name ||
    workspaces?.name ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    session?.user?.user_metadata?.username ||
    (session?.user?.email
      ? session.user.email.split('@')[0].charAt(0).toUpperCase() +
        session.user.email.split('@')[0].slice(1)
      : 'Athlete');

  const athleteEmail = session?.user?.email || '';

  const isMetric = weightUnit === 'kg';

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Bar (Stitch Spec) */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#131B2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings & Preferences</Text>
        <View style={styles.headerAvatarCircle}>
          {userProfile?.avatar || workspaces?.avatar ? (
            <Image
              source={{ uri: userProfile?.avatar || workspaces?.avatar }}
              style={styles.headerAvatarImg}
            />
          ) : (
            <Ionicons name="person" size={16} color="#FFFFFF" />
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Athlete Profile Card (Stitch Spec) */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            {/* Avatar with Live Sync Green Dot */}
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={showAvatarPickerActionSheet}
              activeOpacity={0.8}
              disabled={isUpdatingAvatar}
            >
              <View style={styles.avatarContainer}>
                {userProfile?.avatar || workspaces?.avatar ? (
                  <Image
                    source={{ uri: userProfile?.avatar || workspaces?.avatar }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={32} color="#004AC6" />
                  </View>
                )}
                {isUpdatingAvatar && (
                  <View style={styles.avatarLoadingBadge}>
                    <ActivityIndicator size="small" color="#004AC6" />
                  </View>
                )}
              </View>
              <View style={styles.avatarStatusBadge}>
                <View style={styles.avatarStatusDot} />
              </View>
            </TouchableOpacity>

            {/* Profile Info & Edit Pill */}
            <View style={styles.profileInfoCol}>
              <View style={styles.profileNameRow}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {athleteDisplayName}
                </Text>
                <TouchableOpacity
                  style={styles.editPillBtn}
                  onPress={openEditNameModal}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={13} color="#004AC6" />
                  <Text style={styles.editPillText}>EDIT</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {athleteEmail}
              </Text>
            </View>
          </View>

          {/* Quick Telemetry Chips (3 Columns: Age, Height, Weight) */}
          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryChip}>
              <Text style={styles.telemetryLabel}>AGE</Text>
              <Text style={styles.telemetryValue}>
                {resolvedAge ? `${resolvedAge}` : '—'}
              </Text>
              <Text style={styles.telemetryUnit}>yrs</Text>
            </View>

            <View style={styles.telemetryDivider} />

            <View style={styles.telemetryChip}>
              <Text style={styles.telemetryLabel}>HEIGHT</Text>
              <Text style={styles.telemetryValue}>
                {resolvedHeight ? `${resolvedHeight}` : '—'}
              </Text>
              <Text style={styles.telemetryUnit}>{heightUnit}</Text>
            </View>

            <View style={styles.telemetryDivider} />

            <View style={styles.telemetryChip}>
              <Text style={styles.telemetryLabel}>WEIGHT</Text>
              <Text style={styles.telemetryValue}>
                {resolvedCurrentWeight ? Number(resolvedCurrentWeight).toFixed(1) : '—'}
              </Text>
              <Text style={styles.telemetryUnit}>{weightUnit}</Text>
            </View>
          </View>
        </View>

        {/* 2. Measurement System Segmented Switch (Stitch Spec) */}
        <View style={styles.card}>
          <View style={styles.settingItemRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="resize-outline" size={20} color="#004AC6" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Measurement System</Text>
                <Text style={styles.settingSubtitle}>Units across training & biometrics</Text>
              </View>
            </View>

            {/* Segmented Switcher */}
            <View style={styles.segmentedToggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, isMetric && styles.toggleBtnActive]}
                onPress={() => handleToggleUnits('metric')}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleBtnText, isMetric && styles.toggleBtnTextActive]}>
                  Metric
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, !isMetric && styles.toggleBtnActive]}
                onPress={() => handleToggleUnits('imperial')}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleBtnText, !isMetric && styles.toggleBtnTextActive]}>
                  Imperial
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 3. Training Targets (Stitch Spec) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="fitness-outline" size={18} color="#004AC6" />
              <Text style={styles.cardHeaderTitle}>TRAINING TARGETS</Text>
            </View>
          </View>

          {/* Stepper Weekly Sessions */}
          <TouchableOpacity
            style={styles.innerSubCard}
            onPress={() => setIsSurveyModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.innerSubCardTitle}>Weekly Training Target</Text>
              <Text style={styles.innerSubCardSubtitle}>Combined rehab & load days</Text>
            </View>
            <View style={styles.innerNumberPill}>
              <Text style={styles.innerNumberValue}>{currentWeeklySessions}</Text>
              <Text style={styles.innerNumberUnit}>days</Text>
            </View>
          </TouchableOpacity>

          {/* Daily Calorie Target */}
          <View style={[styles.innerSubCard, { marginTop: 8 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.innerSubCardTitle}>Active Calorie Burn Goal</Text>
              <Text style={styles.innerSubCardSubtitle}>Daily movement threshold</Text>
            </View>
            <View style={styles.innerNumberPill}>
              <Text style={styles.innerNumberValue}>
                {userProfile?.targetCalories || 750}
              </Text>
              <Text style={styles.innerNumberUnit}>kcal</Text>
            </View>
          </View>
        </View>

        {/* 4. Baseline Biometrics (Stitch Spec) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="scale-outline" size={18} color="#004AC6" />
              <Text style={styles.cardHeaderTitle}>BASELINE BIOMETRICS</Text>
            </View>
            <TouchableOpacity
              onPress={openEditBiometricsModal}
              style={styles.headerActionBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.headerActionText}>LOG NEW</Text>
              <Ionicons name="add" size={14} color="#004AC6" />
            </TouchableOpacity>
          </View>

          {/* Weight & Composition 2-Column Grid */}
          <View style={styles.biometricsGrid}>
            {/* Card 1: Current Mass */}
            <TouchableOpacity
              style={styles.biometricColCard}
              onPress={openEditBiometricsModal}
              activeOpacity={0.8}
            >
              <View style={styles.biometricColHeader}>
                <Text style={styles.biometricColLabel}>CURRENT MASS</Text>
                <Ionicons name="trending-down" size={16} color="#006C49" />
              </View>
              <View style={styles.biometricNumberRow}>
                <Text style={styles.biometricNumber}>
                  {resolvedCurrentWeight ? Number(resolvedCurrentWeight).toFixed(1) : '—'}
                </Text>
                <Text style={styles.biometricUnit}>{weightUnit}</Text>
              </View>
              <View style={styles.biometricBarTrack}>
                <View
                  style={[
                    styles.biometricBarFill,
                    {
                      width: resolvedCurrentWeight && resolvedTargetWeight
                        ? `${Math.min(100, Math.max(10, Math.round((Number(resolvedTargetWeight) / Number(resolvedCurrentWeight)) * 100)))}%`
                        : '75%',
                      backgroundColor: '#004AC6',
                    },
                  ]}
                />
              </View>
              <Text style={styles.biometricSubText}>
                {resolvedTargetWeight
                  ? `Target: ${Number(resolvedTargetWeight).toFixed(1)} ${weightUnit}`
                  : 'Target: Not set'}
              </Text>
            </TouchableOpacity>

            {/* Card 2: Training Blueprint */}
            <TouchableOpacity
              style={styles.biometricColCard}
              onPress={() => setIsSurveyModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.biometricColHeader}>
                <Text style={styles.biometricColLabel}>BLUEPRINT</Text>
                <Ionicons name="sparkles" size={15} color="#004AC6" />
              </View>
              <View style={styles.biometricNumberRow}>
                <Text style={[styles.biometricNumber, { fontSize: 16 }]} numberOfLines={1}>
                  {workspaces?.training_goal_title || currentGoalMeta.title}
                </Text>
              </View>
              <View style={styles.biometricBarTrack}>
                <View style={[styles.biometricBarFill, { width: '70%', backgroundColor: '#006C49' }]} />
              </View>
              <Text style={styles.biometricSubText} numberOfLines={1}>
                {currentEquipment}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. Account & Clinical Team / Plan (Stitch Spec) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#004AC6" />
              <Text style={styles.cardHeaderTitle}>ACCOUNT & CLINICAL TEAM</Text>
            </View>
            <View style={styles.statusBadgeGreen}>
              <Text style={styles.statusBadgeGreenText}>Active Plan</Text>
            </View>
          </View>

          {/* Tier Card */}
          <View style={styles.innerSubCard}>
            <View style={styles.tierIconBadge}>
              <Ionicons name="ribbon-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.innerSubCardTitle}>
                {defaultPlan?.name || 'Pro Athletic + Rehab Tier'}
              </Text>
              <Text style={styles.innerSubCardSubtitle}>Clinical Telemetry · Active Blueprint</Text>
            </View>
            <TouchableOpacity
              style={styles.manageBtn}
              onPress={() => router.push('/plans')}
              activeOpacity={0.7}
            >
              <Text style={styles.manageBtnText}>MANAGE</Text>
            </TouchableOpacity>
          </View>

          {/* Connected Health Integrations */}
          <View style={styles.integrationsContainer}>
            <Text style={styles.integrationsHeader}>SYNCHRONIZED SYSTEMS</Text>

            <View style={styles.integrationRow}>
              <View style={styles.integrationLeft}>
                <View style={[styles.integrationIcon, { backgroundColor: '#FFDADB' }]}>
                  <Ionicons name="heart" size={16} color="#AD0033" />
                </View>
                <View>
                  <Text style={styles.integrationTitle}>NutraLife Health Sync</Text>
                  <Text style={styles.integrationSubtitle}>Body mass, caloric telemetry & biometrics</Text>
                </View>
              </View>
              <View style={styles.liveSyncBadge}>
                <Ionicons name="sync" size={13} color="#006C49" />
                <Text style={styles.liveSyncText}>Live Sync</Text>
              </View>
            </View>

            <View style={styles.integrationRow}>
              <View style={styles.integrationLeft}>
                <View style={[styles.integrationIcon, { backgroundColor: '#EAEDFF' }]}>
                  <Ionicons name="fitness" size={16} color="#004AC6" />
                </View>
                <View>
                  <Text style={styles.integrationTitle}>Apple Health / Google Fit</Text>
                  <Text style={styles.integrationSubtitle}>Heart rate, step cadence & active kcal</Text>
                </View>
              </View>
              <View style={styles.liveSyncBadge}>
                <Ionicons name="checkmark-circle" size={13} color="#006C49" />
                <Text style={styles.liveSyncText}>Connected</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 6. Notifications & Training Reminders (Stitch Spec) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="notifications-outline" size={18} color="#004AC6" />
              <Text style={styles.cardHeaderTitle}>NOTIFICATIONS & REMINDERS</Text>
            </View>
            <View style={styles.statusBadgeBlue}>
              <Text style={styles.statusBadgeBlueText}>Push Enabled</Text>
            </View>
          </View>

          <WorkoutRemindersConfig
            remindersData={workspaces?.reminders}
            onUpdateReminders={handleUpdateReminders}
            defaultPlan={defaultPlan}
          />
        </View>

        {/* 7. App Info & Log Out Footer (Stitch Spec) */}
        <View style={styles.footerSection}>
          <Text style={styles.engineText}>KINETIX BIOMECHANICS ENGINE</Text>
          <Text style={styles.versionText}>
            v2.4.1 (Build 8820) · FDA Class II SaMD Tracked
          </Text>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={19} color="#AD0033" />
            <Text style={styles.logoutBtnText}>Log Out of Athlete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating In-Progress Status Bar */}
      <ActiveWorkoutStatusBar />

      {/* Edit Display Name Modal (Clean White Card) */}
      <Modal
        visible={isEditNameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditNameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="person-outline" size={20} color="#004AC6" />
              <Text style={styles.modalTitle}>Edit Display Name</Text>
            </View>

            <Text style={styles.modalSubtitle}>
              This is how your name will appear on the athlete dashboard and guided sessions.
            </Text>

            <TextInput
              style={styles.modalInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="e.g. Marcus Vance"
              placeholderTextColor="#737686"
              autoFocus={true}
              autoCapitalize="words"
              maxLength={40}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsEditNameModalVisible(false)}
                disabled={isSavingName}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveName}
                disabled={isSavingName}
              >
                {isSavingName ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Biometrics Modal (Clean White Card) */}
      <Modal
        visible={isEditBiometricsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditBiometricsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="fitness-outline" size={20} color="#004AC6" />
              <Text style={styles.modalTitle}>Update Body Biometrics</Text>
            </View>

            <Text style={styles.modalSubtitle}>
              These parameters calibrate kinetic load efficiency and synchronize with NutraLife.
            </Text>

            <Text style={styles.modalInputLabel}>Current Weight ({weightUnit})</Text>
            <TextInput
              style={styles.modalInput}
              value={editWeightInput}
              onChangeText={setEditWeightInput}
              placeholder="e.g. 78.4"
              placeholderTextColor="#737686"
              keyboardType="decimal-pad"
            />

            <Text style={styles.modalInputLabel}>Target Weight ({weightUnit})</Text>
            <TextInput
              style={styles.modalInput}
              value={editTargetWeightInput}
              onChangeText={setEditTargetWeightInput}
              placeholder="e.g. 77.5"
              placeholderTextColor="#737686"
              keyboardType="decimal-pad"
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalInputLabel}>Height ({heightUnit})</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editHeightInput}
                  onChangeText={setEditHeightInput}
                  placeholder="e.g. 188"
                  placeholderTextColor="#737686"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalInputLabel}>Age (years)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editAgeInput}
                  onChangeText={setEditAgeInput}
                  placeholder="e.g. 28"
                  placeholderTextColor="#737686"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsEditBiometricsModalVisible(false)}
                disabled={isSavingBiometrics}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveBiometrics}
                disabled={isSavingBiometrics}
              >
                {isSavingBiometrics ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save & Sync</Text>
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
    backgroundColor: '#FAF8FF',
  },
  headerBar: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8FF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEDFF',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EAEDFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#131B2E',
  },
  headerAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#004AC6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerAvatarImg: {
    width: 32,
    height: 32,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#EAEDFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 64,
    height: 64,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLoadingBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarStatusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#006C49',
  },
  profileInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#131B2E',
    flex: 1,
  },
  editPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAEDFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  editPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#004AC6',
  },
  profileEmail: {
    fontSize: 12,
    color: '#004AC6',
    fontWeight: '500',
    marginTop: 2,
  },
  telemetryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  telemetryChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  telemetryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#737686',
    letterSpacing: 0.5,
  },
  telemetryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#131B2E',
    marginTop: 2,
  },
  telemetryUnit: {
    fontSize: 10,
    color: '#737686',
    fontWeight: '500',
  },
  settingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F2F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#131B2E',
  },
  settingSubtitle: {
    fontSize: 11,
    color: '#737686',
    marginTop: 1,
  },
  segmentedToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#737686',
  },
  toggleBtnTextActive: {
    color: '#004AC6',
    fontWeight: '700',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#131B2E',
    letterSpacing: 0.8,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#004AC6',
  },
  innerSubCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  innerSubCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#131B2E',
  },
  innerSubCardSubtitle: {
    fontSize: 11,
    color: '#737686',
    marginTop: 2,
  },
  innerNumberPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  innerNumberValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#004AC6',
  },
  innerNumberUnit: {
    fontSize: 11,
    color: '#737686',
  },
  biometricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  biometricColCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 12,
  },
  biometricColHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  biometricColLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#737686',
  },
  biometricNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 4,
  },
  biometricNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#131B2E',
  },
  biometricUnit: {
    fontSize: 12,
    color: '#737686',
    fontWeight: '600',
  },
  biometricBarTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 4,
  },
  biometricBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  biometricSubText: {
    fontSize: 10,
    color: '#737686',
    marginTop: 2,
  },
  statusBadgeGreen: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusBadgeGreenText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#006C49',
  },
  statusBadgeBlue: {
    backgroundColor: '#EAEDFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  statusBadgeBlueText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#004AC6',
  },
  tierIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#004AC6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  manageBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#004AC6',
  },
  integrationsContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  integrationsHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#737686',
    letterSpacing: 0.6,
  },
  integrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  integrationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  integrationIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  integrationTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#131B2E',
  },
  integrationSubtitle: {
    fontSize: 10,
    color: '#737686',
  },
  liveSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  liveSyncText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#006C49',
  },
  footerSection: {
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  engineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#737686',
    letterSpacing: 1,
  },
  versionText: {
    fontSize: 11,
    color: '#737686',
  },
  logoutBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 10,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#AD0033',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#131B2E',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#737686',
    lineHeight: 17,
    marginBottom: 14,
  },
  modalInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#434655',
    marginBottom: 4,
    marginTop: 6,
  },
  modalInput: {
    backgroundColor: '#F2F3FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 14,
    color: '#131B2E',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#434655',
  },
  modalSaveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#004AC6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
