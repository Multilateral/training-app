import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrainingContext, supabase } from '../context/TrainingContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import WorkoutRemindersConfig from '../components/WorkoutRemindersConfig';
import ActiveWorkoutStatusBar from '../components/ActiveWorkoutStatusBar';

export default function SettingsScreen() {
  const { session, workspaces, updateWorkspaces } = useContext(TrainingContext);
  const [defaultPlan, setDefaultPlan] = useState<any>(null);

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
            <View style={styles.row}>
              <Ionicons name="person-circle-outline" size={24} color="#00D09E" style={styles.icon} />
              <View style={styles.rowText}>
                <Text style={styles.label}>Account</Text>
                <Text style={styles.value}>
                  {session?.user?.user_metadata?.full_name || 
                   session?.user?.user_metadata?.name || 
                   session?.user?.user_metadata?.username || 
                   session?.user?.email || 
                   (session?.user ? 'Anonymous User' : 'Not logged in')}
                </Text>
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
  }
});
