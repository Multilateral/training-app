import React, { useEffect, useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase, TrainingContext as HealthContext } from '../context/TrainingContext';
import { 
  getExerciseInstructions, 
  getExerciseDifficulty, 
  getExerciseMechanics, 
  getWorksessionExerciseCue,
  getExerciseVideoUrl,
  getExerciseVideoThumbnail
} from '../data/recoveryMetadata';
import ExerciseVideoModal from './ExerciseVideoModal';

export default function ActiveWorkoutEngine({ sessionId, plan, worksession, onFinish }) {
  useKeepAwake();
  const router = useRouter();
  const [selectedVideoExercise, setSelectedVideoExercise] = useState(null);

  const { activeSessionState, setActiveSessionState, activeSessionTimer, setActiveSessionTimer, setActiveSessionMetadata } = useContext(HealthContext);

  // Initialize global state on mount if it doesn't exist or is for a different session
  useEffect(() => {
    if (!activeSessionState || activeSessionTimer.sessionId !== sessionId) {
      setActiveSessionMetadata({ sessionId, plan, worksession });
      
      setActiveSessionTimer({ 
        restSeconds: 0, 
        isRestActive: false, 
        sessionStartTime: Date.now(),
        sessionId 
      });
      let initialExercises = [];
      if (worksession && worksession.worksession_exercises?.length > 0) {
        initialExercises = worksession.worksession_exercises.map((te) => {
          const numSets = te.target_sets || 3;
          const initialSets = [];
          for (let i = 0; i < numSets; i++) {
             initialSets.push({
               id: `s_${te.id}_${i}`,
               reps: te.tracking_type === 'time' ? (te.target_time || 30) : (te.target_reps || 10),
               weight: 0,
               done: false,
               loggedId: null
             });
          }
          const cue = te.notes || getWorksessionExerciseCue(worksession, te.exercises?.id || te.exercise_id);
          const inst = getExerciseInstructions(te.exercises) || getExerciseInstructions({ id: te.exercise_id, name: te.exercises?.name });
          const diff = getExerciseDifficulty(te.exercises) || getExerciseDifficulty({ id: te.exercise_id, name: te.exercises?.name });
          const mech = getExerciseMechanics(te.exercises) || getExerciseMechanics({ id: te.exercise_id, name: te.exercises?.name });
          const videoUrl = getExerciseVideoUrl(te.exercises) || getExerciseVideoUrl({ id: te.exercise_id, name: te.exercises?.name });
          const videoThumb = getExerciseVideoThumbnail(te.exercises) || getExerciseVideoThumbnail({ id: te.exercise_id, name: te.exercises?.name });

          return {
            id: te.id,
            exercise_id: te.exercises?.id || te.exercise_id,
            name: te.exercises?.name || 'Unknown Exercise',
            cue,
            instructions: inst,
            difficulty: diff,
            mechanics: mech,
            video_url: videoUrl,
            video_thumbnail_url: videoThumb,
            tracking_type: te.tracking_type,
            target_time: te.target_time,
            sets: initialSets
          };
        });
      }
      setActiveSessionState(initialExercises);
    }
  }, [sessionId]);

  const exercises = activeSessionState || [];
  const { restSeconds, isRestActive, sessionStartTime } = activeSessionTimer || { restSeconds: 0, isRestActive: false, sessionStartTime: Date.now() };

  useEffect(() => {
    let interval = null;
    if (isRestActive && restSeconds > 0) {
      interval = setInterval(() => { 
        setActiveSessionTimer(prev => ({ ...prev, restSeconds: prev.restSeconds - 1 })); 
      }, 1000);
    } else if (restSeconds === 0 && isRestActive) {
      setActiveSessionTimer(prev => ({ ...prev, isRestActive: false }));
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRestActive, restSeconds]);

  const updateSet = (exIndex, setIndex, field, value) => {
    const newExs = [...exercises];
    newExs[exIndex].sets[setIndex][field] = value;
    setActiveSessionState(newExs);
  };

  const handleCheckSet = async (exIndex, setIndex) => {
    const currentEx = exercises[exIndex];
    const currentSet = currentEx.sets[setIndex];
    if (currentSet.done) return; // already done

    // Optimistic UI update
    updateSet(exIndex, setIndex, 'done', true);
    
    // Start rest timer automatically
    setActiveSessionTimer(prev => ({ ...prev, restSeconds: 90, isRestActive: true }));

    try {
      const { data, error } = await supabase.from('exercise_logs').insert([{
        session_id: sessionId,
        exercise_name: currentEx.name,
        set_number: setIndex + 1,
        reps: currentSet.reps,
        weight: currentSet.weight,
        rpe: 8 // default RPE for now
      }]).select().single();

      if (error) throw error;
      updateSet(exIndex, setIndex, 'loggedId', data.id);
    } catch (e) {
      console.error('Failed to log set', e);
      Alert.alert('Error', 'Failed to save set to the cloud.');
      updateSet(exIndex, setIndex, 'done', false);
    }
  };

  const handleFinish = async () => {
    const durationMins = Math.max(1, Math.round((Date.now() - sessionStartTime) / 60000));
    try {
      const { error } = await supabase
        .from('active_sessions')
        .update({ end_time: new Date().toISOString() })
        .eq('id', sessionId);
      if (error) throw error;
      
      // Clear global state
      setActiveSessionMetadata(null);
      setActiveSessionState(null);
      setActiveSessionTimer({ restSeconds: 0, isRestActive: false, sessionStartTime: null });
      
      onFinish(durationMins);
    } catch (e) {
      console.error('Failed to finish session', e);
      Alert.alert('Error', 'Could not end the session.');
      // clear global state anyway
      setActiveSessionMetadata(null);
      setActiveSessionState(null);
      setActiveSessionTimer({ restSeconds: 0, isRestActive: false, sessionStartTime: null });
      onFinish(durationMins);
    }
  };

  const formatRestTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.headerTitle}>{plan?.name || 'Active Session'}</Text>
        </View>
        <View style={styles.restTimerBadge}>
          <Ionicons name="time-outline" size={16} color={isRestActive ? "#00D09E" : "#888"} />
          <Text style={[styles.restTimerText, isRestActive && { color: '#00D09E' }]}>
            {formatRestTime(restSeconds)}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollArea}>
        {exercises.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Text style={{ color: '#888', fontSize: 16 }}>No exercises in this plan yet.</Text>
          </View>
        ) : (
          exercises.map((ex, exIndex) => (
            <View key={ex.id} style={styles.exerciseCard}>
              <View style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {ex.video_url ? (
                      <TouchableOpacity
                        style={styles.watchDemoBtn}
                        onPress={() => setSelectedVideoExercise(ex)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="play-circle" size={15} color="#00D09E" style={{ marginRight: 4 }} />
                        <Text style={styles.watchDemoText}>Demo</Text>
                      </TouchableOpacity>
                    ) : null}
                    {ex.cue && (
                      <View style={{ backgroundColor: '#00D09E20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                        <Text style={{ color: '#00D09E', fontSize: 11, fontWeight: '700' }}>{ex.cue}</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                {(ex.difficulty || ex.mechanics) && (
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                    {ex.difficulty && (
                      <View style={{ backgroundColor: '#2A1F3D', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: '#C084FC', fontSize: 10, fontWeight: '600' }}>🎯 {ex.difficulty}</Text>
                      </View>
                    )}
                    {ex.mechanics && (
                      <View style={{ backgroundColor: '#1E293B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: '#38BDF8', fontSize: 10, fontWeight: '600' }}>⚡ {ex.mechanics}</Text>
                      </View>
                    )}
                  </View>
                )}

                {ex.instructions && (
                  <View style={{ backgroundColor: '#161620', borderRadius: 8, padding: 9, marginTop: 8, borderLeftWidth: 3, borderLeftColor: '#00D09E' }}>
                    <Text style={{ color: '#00D09E', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 }}>
                      Form & Execution Cue
                    </Text>
                    <Text style={{ color: '#D1D5DB', fontSize: 12, lineHeight: 16 }}>
                      {ex.instructions}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.setsHeader}>
                <Text style={styles.setHeaderText}>Set</Text>
                <Text style={[styles.setHeaderText, { flex: 2, textAlign: 'center' }]}>Weight</Text>
                <Text style={[styles.setHeaderText, { flex: 2, textAlign: 'center' }]}>
                  {ex.tracking_type === 'time' ? 'Seconds' : 'Reps'}
                </Text>
                <Text style={[styles.setHeaderText, { width: 50, textAlign: 'center' }]}>Done</Text>
              </View>

              {ex.sets.map((set, setIndex) => (
                <View key={set.id} style={[styles.setRow, set.done && styles.setRowDone]}>
                  <Text style={styles.setNumber}>{setIndex + 1}</Text>
                  
                  {/* Weight Adjuster */}
                  <View style={styles.adjuster}>
                    <TouchableOpacity onPress={() => updateSet(exIndex, setIndex, 'weight', Math.max(0, set.weight - 5))} style={styles.adjustBtn} disabled={set.done}>
                      <Text style={styles.adjustText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.valText}>{set.weight}</Text>
                    <TouchableOpacity onPress={() => updateSet(exIndex, setIndex, 'weight', set.weight + 5)} style={styles.adjustBtn} disabled={set.done}>
                      <Text style={styles.adjustText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Reps Adjuster */}
                  <View style={styles.adjuster}>
                    <TouchableOpacity onPress={() => updateSet(exIndex, setIndex, 'reps', Math.max(0, set.reps - 1))} style={styles.adjustBtn} disabled={set.done}>
                      <Text style={styles.adjustText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.valText}>{set.reps}</Text>
                    <TouchableOpacity onPress={() => updateSet(exIndex, setIndex, 'reps', set.reps + 1)} style={styles.adjustBtn} disabled={set.done}>
                      <Text style={styles.adjustText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Check Button */}
                  <TouchableOpacity 
                    style={[styles.checkBtn, set.done && styles.checkBtnDone]} 
                    onPress={() => handleCheckSet(exIndex, setIndex)}
                    disabled={set.done}
                  >
                    <Ionicons name="checkmark" size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.dashboardBtn} onPress={() => router.replace('/')}>
          <Ionicons name="home-outline" size={20} color="#00D09E" style={{ marginRight: 8 }} />
          <Text style={styles.dashboardBtnText}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
          <Text style={styles.finishBtnText}>Finish Workout</Text>
        </TouchableOpacity>
      </View>

      {/* Video Demonstration Modal */}
      <ExerciseVideoModal
        visible={!!selectedVideoExercise}
        exercise={selectedVideoExercise}
        onClose={() => setSelectedVideoExercise(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E24',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#2A2A31',
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A45',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restTimerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  restTimerText: {
    color: '#888',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  scrollArea: {
    flex: 1,
    padding: 15,
  },
  exerciseCard: {
    backgroundColor: '#2A2A31',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  exerciseName: {
    color: '#00D09E',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  setsHeader: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  setHeaderText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A3A45',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  setRowDone: {
    backgroundColor: '#3A3A4580',
    opacity: 0.6,
  },
  setNumber: {
    color: '#FFF',
    fontWeight: 'bold',
    width: 25,
  },
  adjuster: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E24',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  adjustBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  adjustText: {
    color: '#00D09E',
    fontSize: 18,
    fontWeight: 'bold',
  },
  valText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  checkBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },
  checkBtnDone: {
    backgroundColor: '#00D09E',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(30, 30, 36, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#3A3A45',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  dashboardBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2A2A31',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00D09E',
  },
  dashboardBtnText: {
    color: '#00D09E',
    fontSize: 16,
    fontWeight: 'bold',
  },
  finishBtn: {
    flex: 1,
    backgroundColor: '#00D09E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  watchDemoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00D09E18',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00D09E40',
  },
  watchDemoText: {
    color: '#00D09E',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  }
});
