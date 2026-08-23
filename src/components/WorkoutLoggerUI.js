import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Alert, Keyboard, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase, TrainingContext, getDateString } from '../context/TrainingContext';

export default function WorkoutLoggerUI() {
  const router = useRouter();
  const { history, logWorkout, workspaces, activeSessionMetadata } = useContext(TrainingContext);
  const todayStr = getDateString ? getDateString() : new Date().toISOString().split('T')[0];
  const todayProfile = history[todayStr] || { foods: [], fastingCompletedHours: 0 };
  const moveProfile = todayProfile.move || { workouts: [], stepCount: 0 };

  const [manualWorkoutName, setManualWorkoutName] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutIntensity, setWorkoutIntensity] = useState('Medium');
  
  const [activeWorkoutSession, setActiveWorkoutSession] = useState(null);
  const [showWorksessionModal, setShowWorksessionModal] = useState(false);

  const [availablePlans, setAvailablePlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedWorksessionToStart, setSelectedWorksessionToStart] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('training_plans')
        .select(`
          id, name, schedule_type,
          plan_worksessions (
            id, day_name, order_index, worksession_id,
            worksessions (
              id, name, modality,
              worksession_exercises (
                id, target_sets, target_reps,
                exercises (id, name, category)
              )
            )
          )
        `)
        .order('is_standard_template', { ascending: false });
      if (data) {
        data.forEach(p => {
          if (p.plan_worksessions) {
            p.plan_worksessions.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
          }
        });
        setAvailablePlans(data);
      }
    } catch (e) {
      console.log('Error fetching plans in WorkoutLoggerUI', e);
    }
  };

  const handleLogWorkout = () => {
    const dur = parseInt(workoutDuration);
    const plan = availablePlans.find(p => p.id === workspaces.defaultPlanId);
    
    if (!dur || dur <= 0) {
      Alert.alert("Error", "Please enter a valid duration.");
      return;
    }
    
    let logName = manualWorkoutName.trim();
    
    if (!logName) {
      if (!plan) {
        Alert.alert("Error", "Please enter a workout name or set a default plan.");
        return;
      }
      logName = plan?.name || 'Workout';
      if (plan?.schedule_type === 'anchored') {
        const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const ws = plan.plan_worksessions?.find(pw => pw.day_name === todayDayName)?.worksessions;
        if (ws) logName = ws.name;
      }
    }
    
    logWorkout(logName, dur, workoutIntensity, plan?.id);
    setWorkoutDuration('');
    setManualWorkoutName('');
    Keyboard.dismiss();
  };

  const startActiveSession = async (plan, worksession) => {
    if (!worksession) {
      Alert.alert('Error', 'No worksession selected.');
      return;
    }
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('active_sessions').insert([{
        user_id: userData.user.id,
        start_time: new Date().toISOString()
      }]).select().single();

      if (error) throw error;
      router.push({
        pathname: '/active-workout',
        params: {
          sessionId: data.id,
          plan: JSON.stringify(plan),
          worksession: JSON.stringify(worksession)
        }
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to start session.');
    }
  };

  const defaultPlan = availablePlans.find(p => p.id === workspaces.defaultPlanId);
  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const anchoredWsListForToday = defaultPlan?.schedule_type === 'anchored' 
    ? defaultPlan.plan_worksessions?.filter(pw => pw.day_name.startsWith(todayDayName))
    : [];

  let nextWorksessionStr = defaultPlan?.name || "Workout";
  if (defaultPlan) {
    if (defaultPlan.schedule_type === 'floating' || defaultPlan.schedule_type === 'flexible') {
      if (moveProfile.workouts.length > 0) {
        nextWorksessionStr = "Awesome work today! 🎉";
      } else {
        const sortedDates = Object.keys(history).sort((a,b) => b.localeCompare(a));
        let lastWorkoutDate = null;
        for (const d of sortedDates) {
          if (history[d]?.move?.workouts?.length > 0) {
            lastWorkoutDate = d;
            break;
          }
        }
        
        if (lastWorkoutDate && lastWorkoutDate !== todayStr) {
          const todayDate = new Date(todayStr);
          const lastDate = new Date(lastWorkoutDate);
          const diffTime = Math.abs(todayDate - lastDate);
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            nextWorksessionStr = "You trained yesterday. Keep the momentum going!";
          } else {
            nextWorksessionStr = `It's been ${diffDays} days since your last training. Let's get moving!`;
          }
        } else {
          nextWorksessionStr = "Ready to start your fitness journey? Let's go!";
        }
      }
    } else {
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = new Date();
      let nextWsList = [];
      let nextWsDayName = null;
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        const dayName = daysOfWeek[checkDate.getDay()];
        const wsList = defaultPlan.plan_worksessions?.filter(pw => pw.day_name.startsWith(dayName));
        if (wsList && wsList.length > 0) {
          nextWsList = wsList.map(pw => pw.worksessions);
          nextWsDayName = i === 0 ? 'Today' : dayName;
          break;
        }
      }
      if (nextWsList.length > 0) {
        const sessionNames = nextWsList.map(ws => ws.name).join(' & ');
        nextWorksessionStr = moveProfile.workouts.length > 0 ? `Next up: ${nextWsDayName} - ${sessionNames}` : `Next Session: ${nextWsDayName} - ${sessionNames}`;
      } else {
        nextWorksessionStr = "No upcoming sessions";
      }
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {/* START WORKOUT CARD */}
      <View style={[styles.card, { 
        backgroundColor: moveProfile.workouts.length > 0 ? '#FFB80010' : '#00D09E10', 
        borderColor: moveProfile.workouts.length > 0 ? '#FFB800' : '#00D09E', 
        borderWidth: 1, 
        padding: 20, 
        alignItems: 'stretch',
        marginBottom: 15
      }]}>
        
        {moveProfile.workouts.length > 0 && (
          <View style={{ alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#FFB80040' }}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>🔥</Text>
            <Text style={{ color: '#FFB800', fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>Great job today!</Text>
            <Text style={{ color: '#AAA', fontSize: 14, textAlign: 'center', marginTop: 5 }}>Workout logged successfully. Want to go for another round?</Text>
          </View>
        )}

        {defaultPlan && (
          <Text style={{ color: moveProfile.workouts.length > 0 ? '#FFB800' : '#00D09E', fontSize: 20, marginBottom: 5, fontWeight: 'bold', textAlign: 'center' }}>
            {defaultPlan.name}
          </Text>
        )}
        
        <Text style={[styles.sectionLabel, { color: moveProfile.workouts.length > 0 ? '#FFB800' : '#00D09E', fontSize: 20, marginBottom: 15, fontWeight: 'bold', textAlign: 'center' }]}>
          {defaultPlan ? nextWorksessionStr : 'Ready to train?'}
        </Text>
        
        {!defaultPlan ? (
          <Text style={{color: '#AAA', marginBottom: 15}}>Set a default plan in the Settings to quick-start sessions here.</Text>
        ) : (
          <>
            {activeSessionMetadata ? (
              <TouchableOpacity 
                style={[styles.primaryButton, { 
                  paddingVertical: 18, 
                  borderRadius: 16, 
                  backgroundColor: '#FFB800' 
                }]} 
                onPress={() => {
                  router.push({
                    pathname: '/active-workout',
                    params: {
                      sessionId: activeSessionMetadata.sessionId,
                      plan: JSON.stringify(activeSessionMetadata.plan),
                      worksession: JSON.stringify(activeSessionMetadata.worksession)
                    }
                  });
                }}
              >
                <Text style={[styles.buttonText, { fontSize: 18 }]}>RESUME ACTIVE WORKOUT</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.primaryButton, { 
                  paddingVertical: 18, 
                  borderRadius: 16, 
                  backgroundColor: moveProfile.workouts.length > 0 ? '#FFB800' : '#00D09E' 
                }]} 
                onPress={() => {
                  if (defaultPlan.schedule_type === 'floating' || defaultPlan.schedule_type === 'flexible') {
                    setShowWorksessionModal(true);
                  } else {
                    if (anchoredWsListForToday.length === 1) {
                      startActiveSession(defaultPlan, anchoredWsListForToday[0].worksessions);
                    } else {
                      setShowWorksessionModal(true);
                    }
                  }
                }}
              >
                <Text style={[styles.buttonText, { fontSize: 18 }]}>START WORKOUT</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
      
      <Modal visible={showWorksessionModal} transparent={true} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#1A1A1F', padding: 25, borderRadius: 20, width: '80%', alignItems: 'center', borderWidth: 1, borderColor: '#333' }}>
            <Text style={{ color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Select Worksession</Text>
            
            <ScrollView style={{ width: '100%', maxHeight: 300 }}>
              {(() => {
                let listToRender = defaultPlan?.plan_worksessions || [];
                // If anchored and there are multiple for today, show today's only. Or just show all if none for today
                if (defaultPlan?.schedule_type === 'anchored' && anchoredWsListForToday.length > 1) {
                  listToRender = anchoredWsListForToday;
                }
                return listToRender.map(pw => (
                  <TouchableOpacity 
                    key={pw.id} 
                    style={{
                      padding: 15, borderRadius: 12, marginBottom: 10,
                      backgroundColor: '#2A2A31'
                    }}
                    onPress={() => {
                      setShowWorksessionModal(false);
                      startActiveSession(defaultPlan, pw.worksessions);
                    }}
                  >
                    <Text style={{ color: '#FFF', fontWeight: 'bold', textAlign: 'center' }}>
                      {pw.worksessions?.name} {defaultPlan.schedule_type === 'anchored' ? `(${pw.day_name})` : ''}
                    </Text>
                  </TouchableOpacity>
                ));
              })()}
            </ScrollView>
            
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: '#444', marginTop: 20, width: '100%' }]} 
              onPress={() => setShowWorksessionModal(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MANUAL LOG BOX */}
      <View style={[styles.card, { marginBottom: 15 }]}>
        <Text style={styles.sectionLabel}>Manual Log</Text>

        <TextInput style={styles.input} placeholder="Workout Name (Optional)" placeholderTextColor="#888" value={manualWorkoutName} onChangeText={setManualWorkoutName} />
        <TextInput style={styles.input} placeholder="Duration (minutes)" placeholderTextColor="#888" keyboardType="numeric" value={workoutDuration} onChangeText={setWorkoutDuration} />
        
        <View style={styles.intensityRow}>
          {['Low', 'Medium', 'High'].map(level => (
            <TouchableOpacity key={level} style={[styles.intensityBtn, workoutIntensity === level && styles.intensityBtnActive]} onPress={() => setWorkoutIntensity(level)}>
              <Text style={[styles.intensityText, workoutIntensity === level && styles.intensityTextActive]}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogWorkout}>
          <Text style={styles.buttonText}>Save Workout</Text>
        </TouchableOpacity>
      </View>

      {moveProfile.workouts.length > 0 && (
        <View style={[styles.card, { alignItems: 'stretch' }]}>
          <Text style={styles.sectionLabel}>Today's Workouts</Text>
          {moveProfile.workouts.map(w => (
            <View key={w.id} style={styles.listItem}>
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemText}>{w.type}</Text>
                <Text style={styles.macroBadge}>{w.intensity} Intensity</Text>
              </View>
              <Text style={[styles.listItemText, { color: '#00D09E' }]}>{w.duration} min</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#1E1E24', borderRadius: 15, padding: 15 },
  sectionLabel: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginBottom: 10 },
  input: { backgroundColor: '#2A2A31', color: '#FFF', borderRadius: 8, padding: 12, marginBottom: 15 },
  primaryButton: { backgroundColor: '#00D09E', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#111', fontWeight: 'bold' },
  intensityRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  intensityBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#2A2A31', marginHorizontal: 5, alignItems: 'center' },
  intensityBtnActive: { backgroundColor: '#00D09E' },
  intensityText: { color: '#AAA' },
  intensityTextActive: { color: '#111', fontWeight: 'bold' },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#333' },
  listItemInfo: { flex: 1 },
  listItemText: { color: '#FFF', fontSize: 16 },
  macroBadge: { color: '#AAA', fontSize: 12, marginTop: 4 }
});
