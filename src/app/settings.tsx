import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrainingContext, supabase } from '../context/TrainingContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import WorkoutRemindersConfig from '../components/WorkoutRemindersConfig';
import ActiveWorkoutStatusBar from '../components/ActiveWorkoutStatusBar';

export default function SettingsScreen() {
  const { session, workspaces, updateWorkspaces } = useContext(TrainingContext);
  const [defaultPlan, setDefaultPlan] = useState<any>(null);

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
});
