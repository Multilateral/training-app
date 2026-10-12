import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { TrainingContext, supabase } from '../context/TrainingContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { session } = useContext(TrainingContext);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Normally Supabase auth state change listener in _layout.tsx will handle
      // resetting the app state or we can explicitly redirect.
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <TouchableOpacity style={[styles.row, styles.borderBottom]} onPress={() => router.push('/plans')}>
              <View style={styles.rowTextWithIcon}>
                <Ionicons name="barbell-outline" size={24} color="#00D09E" style={styles.icon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Default Workout Plan</Text>
                  <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }}>
                    Manage and set default training plan
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            <View style={[styles.row, styles.borderBottom]}>
              <View style={styles.rowTextWithIcon}>
                <Ionicons name="notifications-outline" size={24} color="#00D09E" style={styles.icon} />
                <Text style={styles.label}>Push Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#333', true: '#00D09E' }}
                thumbColor={notificationsEnabled ? '#fff' : '#888'}
              />
            </View>
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

        {session && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF453A" style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
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
