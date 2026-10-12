import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Alert, Keyboard, Modal, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase, TrainingContext, getDateString } from '../context/TrainingContext';
import { getWorksessionDescription } from '../data/recoveryMetadata';

export default function WorkoutLoggerUI() {
  const router = useRouter();
  const { history, logWorkout, workspaces, activeSessionMetadata, session } = useContext(TrainingContext);
  const todayStr = getDateString ? getDateString() : new Date().toISOString().split('T')[0];
  const todayProfile = history[todayStr] || { foods: [], fastingCompletedHours: 0 };
  const moveProfile = todayProfile.move || { workouts: [], stepCount: 0 };

  const [manualWorkoutName, setManualWorkoutName] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutIntensity, setWorkoutIntensity] = useState('Medium');
  
  const [showWorksessionModal, setShowWorksessionModal] = useState(false);
  const [selectedModalPlanId, setSelectedModalPlanId] = useState(null);

  const [availablePlans, setAvailablePlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
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
    } finally {
      setLoadingPlans(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPlans();
    }, [session?.user?.id, workspaces?.defaultPlanId])
  );

  const handleLogWorkout = () => {
    const dur = parseInt(workoutDuration);
    const plan = availablePlans.find(p => p.id === workspaces?.defaultPlanId);
    
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
      let uid = session?.user?.id;
      if (!uid) {
        const { data: userData } = await supabase.auth.getUser();
        uid = userData?.user?.id;
      }
      if (!uid) {
        Alert.alert('Error', 'User session not found. Please log in again.');
        return;
      }

      const { data, error } = await supabase.from('active_sessions').insert([{
        user_id: uid,
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
      console.error('Failed to start session', e);
      Alert.alert('Error', 'Failed to start session.');
    }
  };

  const defaultPlan = availablePlans.find(p => p.id === workspaces?.defaultPlanId) || (availablePlans.length === 1 ? availablePlans[0] : null);
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

        {loadingPlans && !defaultPlan ? (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#00D09E" />
            <Text style={{ color: '#888', marginTop: 10, fontSize: 14 }}>Loading workout plans...</Text>
          </View>
        ) : (
          <>
            {defaultPlan && (
              <Text style={{ color: moveProfile.workouts.length > 0 ? '#FFB800' : '#00D09E', fontSize: 22, marginBottom: 6, fontWeight: 'bold', textAlign: 'center' }}>
                {defaultPlan.name}
              </Text>
            )}
            
            <Text style={[styles.sectionLabel, { color: moveProfile.workouts.length > 0 ? '#FFB800' : '#FFF', fontSize: 16, marginBottom: 16, fontWeight: '600', textAlign: 'center' }]}>
              {defaultPlan ? nextWorksessionStr : 'Ready to train?'}
            </Text>
            
            {!defaultPlan ? (
              <View style={{ alignItems: 'stretch' }}>
                <Text style={{ color: '#AAA', marginBottom: 15, textAlign: 'center', fontSize: 14, lineHeight: 20 }}>
                  {availablePlans.length > 0 
                    ? "Choose a session from your plans below or set your default in Workout Plans."
                    : "No default plan selected yet. You can set one in Workout Plans to quick-start sessions here."}
                </Text>

                {availablePlans.length > 0 && (
                  <TouchableOpacity 
                    style={[styles.primaryButton, { 
                      paddingVertical: 16, 
                      borderRadius: 14, 
                      backgroundColor: '#00D09E',
                      marginBottom: 10
                    }]} 
                    onPress={() => {
                      setSelectedModalPlanId(availablePlans[0]?.id || null);
                      setShowWorksessionModal(true);
                    }}
                  >
                    <Text style={[styles.buttonText, { fontSize: 16 }]}>START A WORKOUT</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                  style={{
                    paddingVertical: 13,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#00D09E60',
                    backgroundColor: '#00D09E15',
                    alignItems: 'center'
                  }}
                  onPress={() => router.push('/plans')}
                >
                  <Text style={{ color: '#00D09E', fontWeight: 'bold', fontSize: 14 }}>
                    OPEN WORKOUT PLANS
                  </Text>
                </TouchableOpacity>
              </View>
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
                  <>
                    <TouchableOpacity 
                      style={[styles.primaryButton, { 
                        paddingVertical: 18, 
                        borderRadius: 16, 
                        backgroundColor: moveProfile.workouts.length > 0 ? '#FFB800' : '#00D09E',
                        marginBottom: 10
                      }]} 
                      onPress={() => {
                        if (defaultPlan.schedule_type === 'floating' || defaultPlan.schedule_type === 'flexible') {
                          setSelectedModalPlanId(defaultPlan.id);
                          setShowWorksessionModal(true);
                        } else {
                          if (anchoredWsListForToday.length === 1) {
                            startActiveSession(defaultPlan, anchoredWsListForToday[0].worksessions);
                          } else {
                            setSelectedModalPlanId(defaultPlan.id);
                            setShowWorksessionModal(true);
                          }
                        }
                      }}
                    >
                      <Text style={[styles.buttonText, { fontSize: 18 }]}>START WORKOUT</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={{
                        paddingVertical: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: '#444',
                        backgroundColor: '#1E1E24',
                        alignItems: 'center'
                      }}
                      onPress={() => {
                        setSelectedModalPlanId(defaultPlan.id);
                        setShowWorksessionModal(true);
                      }}
                    >
                      <Text style={{ color: '#AAA', fontSize: 14, fontWeight: '600' }}>
                        Choose Another Session / Plan
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </>
        )}
      </View>
      
      {/* SELECT WORKSESSION MODAL */}
      <Modal visible={showWorksessionModal} transparent={true} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#1A1A1F', padding: 22, borderRadius: 20, width: '100%', maxWidth: 420, borderWidth: 1, borderColor: '#333' }}>
            <Text style={{ color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>
              Select Worksession
            </Text>
            
            <ScrollView style={{ width: '100%', maxHeight: 360 }}>
              {(() => {
                const planToUse = (selectedModalPlanId && availablePlans.find(p => p.id === selectedModalPlanId)) 
                  || defaultPlan 
                  || availablePlans[0];

                if (!planToUse) {
                  return (
                    <Text style={{ color: '#888', textAlign: 'center', marginVertical: 25 }}>
                      No workout plans found. Go to Workout Plans to create one.
                    </Text>
                  );
                }

                const worksessions = planToUse.plan_worksessions || [];

                return (
                  <View>
                    {availablePlans.length > 1 && (
                      <View style={{ marginBottom: 15 }}>
                        <Text style={{ color: '#888', fontSize: 12, marginBottom: 8, textTransform: 'uppercase', fontWeight: 'bold' }}>
                          Select Plan:
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                          {availablePlans.map(p => {
                            const isSelected = planToUse.id === p.id;
                            return (
                              <TouchableOpacity
                                key={p.id}
                                onPress={() => setSelectedModalPlanId(p.id)}
                                style={{
                                  paddingHorizontal: 14,
                                  paddingVertical: 8,
                                  borderRadius: 16,
                                  backgroundColor: isSelected ? '#00D09E' : '#2A2A31',
                                  marginRight: 8,
                                  borderWidth: 1,
                                  borderColor: isSelected ? '#00D09E' : '#444'
                                }}
                              >
                                <Text style={{ color: isSelected ? '#111' : '#FFF', fontSize: 13, fontWeight: 'bold' }}>
                                  {p.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}

                    {worksessions.length === 0 ? (
                      <Text style={{ color: '#888', textAlign: 'center', marginVertical: 20 }}>
                        No worksessions attached to {planToUse.name}.
                      </Text>
                    ) : (
                      worksessions.map(pw => (
                        <TouchableOpacity 
                          key={pw.id} 
                          style={{
                            padding: 16, 
                            borderRadius: 14, 
                            marginBottom: 10,
                            backgroundColor: '#2A2A31',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: '#3A3A45'
                          }}
                          onPress={() => {
                            setShowWorksessionModal(false);
                            startActiveSession(planToUse, pw.worksessions);
                          }}
                        >
                          <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
                              {pw.worksessions?.name || 'Workout Session'}
                            </Text>
                            {planToUse.schedule_type === 'anchored' && pw.day_name && (
                              <Text style={{ color: '#00D09E', fontSize: 13, marginTop: 4, fontWeight: '600' }}>
                                📅 {pw.day_name}
                              </Text>
                            )}
                            {pw.worksessions?.modality && (
                              <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
                                Modality: {pw.worksessions.modality}
                              </Text>
                            )}
                            {getWorksessionDescription(pw.worksessions) && (
                              <Text style={{ color: '#AAA', fontSize: 12, marginTop: 4, lineHeight: 16 }}>
                                {getWorksessionDescription(pw.worksessions)}
                              </Text>
                            )}
                          </View>
                          <View style={{ backgroundColor: '#00D09E', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}>
                            <Text style={{ color: '#111', fontWeight: 'bold', fontSize: 13 }}>START</Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                );
              })()}
            </ScrollView>
            
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: '#333', marginTop: 15, width: '100%', borderRadius: 12 }]} 
              onPress={() => setShowWorksessionModal(false)}
            >
              <Text style={[styles.buttonText, { color: '#FFF' }]}>Close</Text>
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
