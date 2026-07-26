import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  TextInput, Alert, ActivityIndicator, LayoutAnimation, Platform, UIManager, Modal, KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../context/TrainingContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MODALITIES = ['Yoga', 'Plyometrics', 'Calisthenics', 'Cardio', 'Weightlifting'];

export default function PlanBuilder({ onSetDefaultPlan, defaultPlanId }) {
  const [activeTab, setActiveTab] = useState('plans');
  const [standardPlans, setStandardPlans] = useState([]);
  const [customPlans, setCustomPlans] = useState([]);
  const [worksessions, setWorksessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Exercises
  const [exercisesList, setExercisesList] = useState([]);
  const [isExerciseModalVisible, setIsExerciseModalVisible] = useState(false);
  const [selectedExerciseFilter, setSelectedExerciseFilter] = useState('All');
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');

  // Worksession Focus Mode
  const [isFocusModeVisible, setIsFocusModeVisible] = useState(false);
  const [draftWsId, setDraftWsId] = useState(null);
  const [draftWsName, setDraftWsName] = useState('');
  const [draftWsModality, setDraftWsModality] = useState(MODALITIES[0]);
  const [draftExercises, setDraftExercises] = useState([]); 

  // Create Plan
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanSchedule, setNewPlanSchedule] = useState('floating');
  const [newPlanGoal, setNewPlanGoal] = useState('Hypertrophy');
  const [newPlanIntensity, setNewPlanIntensity] = useState('Intermediate');
  const [newPlanSessions, setNewPlanSessions] = useState('3');
  const [newPlanDescription, setNewPlanDescription] = useState('');

  // Edit Plan
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editPlanName, setEditPlanName] = useState('');
  const [editPlanGoal, setEditPlanGoal] = useState('Hypertrophy');
  const [editPlanIntensity, setEditPlanIntensity] = useState('Intermediate');
  const [editPlanSessions, setEditPlanSessions] = useState('3');
  const [editPlanDescription, setEditPlanDescription] = useState('');

  const [isAddWsModalVisible, setIsAddWsModalVisible] = useState(false);
  const [activePlanForWs, setActivePlanForWs] = useState(null);
  const [selectedDayForAnchored, setSelectedDayForAnchored] = useState('Monday');
  const [selectedWsIdForAttach, setSelectedWsIdForAttach] = useState(null);
  
  // For attaching worksession modal
  const [newWsName, setNewWsName] = useState('');

  // Exercises Tab
  const [isCreatingExercise, setIsCreatingExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseCategory, setNewExerciseCategory] = useState('Chest');
  const [globalExerciseSearchQuery, setGlobalExerciseSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    const { data, error } = await supabase.from('exercises').select('*').order('name');
    if (!error && data) {
      setExercisesList(data);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;

      const { data: plansData, error: plansError } = await supabase
        .from('training_plans')
        .select(`
          id, name, is_standard_template, user_id, schedule_type,
          goal_category, intensity, sessions_per_week, description,
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
        `);

      if (plansError) throw plansError;

      plansData.forEach(p => {
        if (p.plan_worksessions) {
          p.plan_worksessions.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        }
      });

      const standards = plansData.filter(p => p.is_standard_template);
      const customs = plansData.filter(p => !p.is_standard_template && p.user_id === userData.user.id);

      const { data: wsData, error: wsError } = await supabase
        .from('worksessions')
        .select(`
          id, name, modality, user_id,
          worksession_exercises (
            id, target_sets, target_reps,
            exercises (id, name, category)
          )
        `)
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (wsError) throw wsError;

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setStandardPlans(standards);
      setCustomPlans(customs);
      setWorksessions(wsData);
    } catch (e) {
      console.error('Error fetching data', e);
      Alert.alert('Error', 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  // --- WORKSESSION FOCUS MODE LOGIC ---

  const openFocusMode = (ws = null) => {
    if (ws) {
      setDraftWsId(ws.id);
      setDraftWsName(ws.name);
      setDraftWsModality(ws.modality);
      setDraftExercises(ws.worksession_exercises ? [...ws.worksession_exercises] : []);
    } else {
      setDraftWsId(null);
      setDraftWsName('');
      setDraftWsModality(MODALITIES[0]);
      setDraftExercises([]);
    }
    setIsFocusModeVisible(true);
  };

  const closeFocusMode = () => {
    Alert.alert('Discard Changes?', 'Any unsaved changes will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => {
          setIsFocusModeVisible(false);
          setIsExerciseModalVisible(false);
      }}
    ]);
  };

  const saveFocusMode = async () => {
    if (!draftWsName.trim()) {
      Alert.alert('Validation', 'Please enter a worksession name.');
      return;
    }
    setLoading(true);
    try {
      let currentWsId = draftWsId;
      const { data: userData } = await supabase.auth.getUser();

      if (!currentWsId) {
        // Create new worksession
        const { data, error } = await supabase.from('worksessions').insert([{
          user_id: userData.user.id,
          name: draftWsName,
          modality: draftWsModality
        }]).select().single();
        if (error) throw error;
        currentWsId = data.id;
      } else {
        // Update existing worksession
        const { error } = await supabase.from('worksessions').update({
          name: draftWsName,
          modality: draftWsModality
        }).eq('id', currentWsId);
        if (error) throw error;

        // Delete existing worksession_exercises
        await supabase.from('worksession_exercises').delete().eq('worksession_id', currentWsId);
      }

      // Bulk insert new draftExercises
      if (draftExercises.length > 0) {
        const inserts = draftExercises.map(ex => ({
          worksession_id: currentWsId,
          exercise_id: ex.exercise_id || ex.exercises?.id, 
          target_sets: ex.target_sets || 3,
          target_reps: ex.target_reps || 10
        }));
        const { error: insertError } = await supabase.from('worksession_exercises').insert(inserts);
        if (insertError) throw insertError;
      }

      setIsFocusModeVisible(false);
      await fetchData();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save worksession.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExerciseToDraft = (exerciseId) => {
    const exObj = exercisesList.find(e => e.id === exerciseId);
    if (!exObj) return;

    setDraftExercises(prev => [...prev, {
      id: `temp-${Date.now()}`,
      exercise_id: exerciseId,
      exercises: { id: exerciseId, name: exObj.name, category: exObj.category },
      target_sets: 3,
      target_reps: 10
    }]);
    setIsExerciseModalVisible(false);
  };

  const moveDraftExercise = (index, direction) => {
    const newDraft = [...draftExercises];
    if (direction === 'up' && index > 0) {
      const temp = newDraft[index];
      newDraft[index] = newDraft[index - 1];
      newDraft[index - 1] = temp;
    } else if (direction === 'down' && index < newDraft.length - 1) {
      const temp = newDraft[index];
      newDraft[index] = newDraft[index + 1];
      newDraft[index + 1] = temp;
    }
    setDraftExercises(newDraft);
  };

  const removeDraftExercise = (index) => {
    const newDraft = [...draftExercises];
    newDraft.splice(index, 1);
    setDraftExercises(newDraft);
  };

  const handleDeleteWorksession = async (id) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await supabase.from('worksessions').delete().eq('id', id);
          await fetchData();
        } catch (e) {
          Alert.alert('Error', 'Failed to delete.');
        }
      }}
    ]);
  };

  // --- PLAN LOGIC ---

  const handleCopyPlan = async (planToCopy) => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user.id;

      // 1. Create new plan
      const { data: newPlan, error: planError } = await supabase.from('training_plans').insert([{
        user_id: userId,
        name: `${planToCopy.name} (Copy)`,
        schedule_type: planToCopy.schedule_type,
        is_standard_template: false,
        goal_category: planToCopy.goal_category,
        intensity: planToCopy.intensity,
        sessions_per_week: planToCopy.sessions_per_week,
        description: planToCopy.description
      }]).select().single();
      
      if (planError) throw planError;
      const newPlanId = newPlan.id;

      // 2. Iterate and copy worksessions
      if (planToCopy.plan_worksessions) {
        for (const pw of planToCopy.plan_worksessions) {
          const oldWs = pw.worksessions;
          if (oldWs) {
            // Copy worksession
            const { data: newWs, error: wsError } = await supabase.from('worksessions').insert([{
              user_id: userId,
              name: oldWs.name,
              modality: oldWs.modality
            }]).select().single();
            
            if (wsError) throw wsError;
            const newWsId = newWs.id;

            // Copy worksession exercises
            if (oldWs.worksession_exercises && oldWs.worksession_exercises.length > 0) {
              const exerciseInserts = oldWs.worksession_exercises.map(ex => ({
                worksession_id: newWsId,
                exercise_id: ex.exercises?.id,
                target_sets: ex.target_sets,
                target_reps: ex.target_reps
              }));
              const { error: exError } = await supabase.from('worksession_exercises').insert(exerciseInserts);
              if (exError) throw exError;
            }

            // Link to new plan
            const { error: linkError } = await supabase.from('plan_worksessions').insert([{
              plan_id: newPlanId,
              worksession_id: newWsId,
              order_index: pw.order_index,
              day_name: pw.day_name
            }]);
            if (linkError) throw linkError;
          }
        }
      }
      
      await fetchData();
      Alert.alert('Success', 'Plan copied successfully!');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to copy plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlanName.trim()) {
      Alert.alert('Validation', 'Please enter a plan name.');
      return;
    }
    try {
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from('training_plans').insert([{
        user_id: userData.user.id,
        name: newPlanName,
        schedule_type: newPlanSchedule,
        is_standard_template: false,
        goal_category: newPlanGoal,
        intensity: newPlanIntensity,
        sessions_per_week: parseInt(newPlanSessions) || 3,
        description: newPlanDescription
      }]);
      setIsCreatingPlan(false);
      setNewPlanName('');
      setNewPlanSchedule('floating');
      setNewPlanGoal('Hypertrophy');
      setNewPlanIntensity('Intermediate');
      setNewPlanSessions('3');
      setNewPlanDescription('');
      await fetchData();
    } catch (e) {
      Alert.alert('Error', 'Failed to create plan.');
    }
  };

  const handleDeletePlan = async (id) => {
    Alert.alert('Delete Plan', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await supabase.from('training_plans').delete().eq('id', id);
          await fetchData();
        } catch (e) {
          Alert.alert('Error', 'Failed to delete.');
        }
      }}
    ]);
  };

  const saveEditPlan = async (id) => {
    try {
      await supabase.from('training_plans').update({ 
        name: editPlanName,
        goal_category: editPlanGoal,
        intensity: editPlanIntensity,
        sessions_per_week: parseInt(editPlanSessions) || 3,
        description: editPlanDescription
      }).eq('id', id);
      setEditingPlanId(null);
      await fetchData();
    } catch(e) {
      Alert.alert('Error', 'Failed to update plan.');
    }
  };

  const handleAddWorksessionToPlan = async (wsId) => {
    if (!activePlanForWs) return;
    try {
      const plan = customPlans.find(p => p.id === activePlanForWs) || standardPlans.find(p => p.id === activePlanForWs);
      const nextIndex = (plan.plan_worksessions?.length || 0) + 1;
      const defaultName = plan.schedule_type === 'anchored' ? selectedDayForAnchored : `Worksession ${nextIndex}`;

      await supabase.from('plan_worksessions').insert([{
        plan_id: plan.id,
        worksession_id: wsId,
        order_index: nextIndex,
        day_name: defaultName
      }]);
      setIsAddWsModalVisible(false);
      await fetchData();
    } catch (e) {
      Alert.alert('Error', 'Failed to attach worksession.');
    }
  };

  const handleRemoveWorksessionFromPlan = async (pwId) => {
    try {
      await supabase.from('plan_worksessions').delete().eq('id', pwId);
      await fetchData();
    } catch (e) {
      Alert.alert('Error', 'Failed to remove.');
    }
  };

  const handleFinalAddWorksession = async () => {
    const activePlanObj = customPlans.find(p => p.id === activePlanForWs) || standardPlans.find(p => p.id === activePlanForWs);
    const isAnchored = activePlanObj?.schedule_type === 'anchored';
    
    if (isAnchored && !selectedDayForAnchored) {
      Alert.alert('Validation', 'Please select a day.');
      return;
    }
    
    if (!selectedWsIdForAttach && !newWsName.trim()) {
      Alert.alert('Validation', 'Please select a worksession or type a new name.');
      return;
    }

    try {
      if (newWsName.trim()) {
        const { data: userData } = await supabase.auth.getUser();
        const { data: wsData, error: wsError } = await supabase.from('worksessions').insert([{
          user_id: userData.user.id,
          name: newWsName,
          modality: MODALITIES[0]
        }]).select().single();
        if (wsError) throw wsError;
        await handleAddWorksessionToPlan(wsData.id);
      } else if (selectedWsIdForAttach) {
        await handleAddWorksessionToPlan(selectedWsIdForAttach);
      }
      setNewWsName('');
      setSelectedWsIdForAttach(null);
    } catch (e) {
      Alert.alert('Error', 'Failed to add worksession.');
    }
  };

  const handleCreateExercise = async () => {
    if (!newExerciseName.trim()) {
      Alert.alert('Validation', 'Please enter an exercise name.');
      return;
    }
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from('exercises').insert([{
        user_id: userData.user.id,
        name: newExerciseName,
        category: newExerciseCategory
      }]);
      setIsCreatingExercise(false);
      setNewExerciseName('');
      setNewExerciseCategory('Chest');
      await fetchExercises();
    } catch (e) {
      Alert.alert('Error', 'Failed to create exercise.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExercise = async (id) => {
    Alert.alert('Delete Exercise', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await supabase.from('exercises').delete().eq('id', id);
          await fetchExercises();
        } catch (e) {
          Alert.alert('Error', 'Failed to delete.');
        }
      }}
    ]);
  };

  const renderExerciseCard = (exercise) => {
    return (
      <View key={exercise.id} style={styles.planCard}>
        <View style={styles.planHeader}>
          <Text style={styles.planName}>{exercise.name}</Text>
          <View style={styles.metadataBadge}><Text style={styles.metadataText}>{exercise.category}</Text></View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => handleDeleteExercise(exercise.id)} style={styles.actionIcon}>
            <Ionicons name="trash" size={18} color="#FF4C4C" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };  const renderWorksessionCard = (ws) => {
    return (
      <View key={ws.id} style={styles.planCard}>
        <View style={styles.planHeader}>
          <Text style={styles.planName}>{ws.name} <Text style={{fontSize: 12, color: '#888'}}>({ws.modality})</Text></Text>
        </View>

        <View style={styles.exerciseSummaryList}>
          {ws.worksession_exercises?.map(te => (
            <Text key={te.id} style={styles.exerciseSummaryText}>• {te.exercises?.name} ({te.target_sets}x{te.target_reps})</Text>
          ))}
          {(!ws.worksession_exercises || ws.worksession_exercises.length === 0) && (
            <Text style={styles.exerciseSummaryText}>No exercises added.</Text>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => openFocusMode(ws)} style={styles.actionIcon}>
            <Ionicons name="pencil" size={18} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteWorksession(ws.id)} style={styles.actionIcon}>
            <Ionicons name="trash" size={18} color="#FF4C4C" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPlanCard = (plan) => {
    const isEditing = editingPlanId === plan.id;
    return (
      <View key={plan.id} style={styles.planCard}>
        <View style={styles.planHeader}>
          {isEditing ? (
            <View style={{ flex: 1, gap: 10 }}>
              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Name</Text>
                <TextInput style={[styles.input, styles.editInput]} value={editPlanName} onChangeText={setEditPlanName} placeholderTextColor="#666" />
              </View>
              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Goal</Text>
                <TextInput style={[styles.input, styles.editInput]} value={editPlanGoal} onChangeText={setEditPlanGoal} placeholderTextColor="#666" />
              </View>
              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Intensity</Text>
                <TextInput style={[styles.input, styles.editInput]} value={editPlanIntensity} onChangeText={setEditPlanIntensity} placeholderTextColor="#666" />
              </View>
              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Days/Week</Text>
                <TextInput style={[styles.input, styles.editInput]} value={editPlanSessions} onChangeText={setEditPlanSessions} keyboardType="numeric" placeholderTextColor="#666" />
              </View>
              <View style={[styles.editRow, { alignItems: 'flex-start' }]}>
                <Text style={[styles.editLabel, { marginTop: 10 }]}>Description</Text>
                <TextInput style={[styles.input, styles.editInput, { height: 60 }]} value={editPlanDescription} onChangeText={setEditPlanDescription} multiline placeholderTextColor="#666" />
              </View>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <Text style={styles.planName}>{plan.name} <Text style={{fontSize: 12, color: '#888'}}>({plan.schedule_type})</Text></Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 4 }}>
                {plan.goal_category && <View style={styles.metadataBadge}><Text style={styles.metadataText}>{plan.goal_category}</Text></View>}
                {plan.intensity && <View style={styles.metadataBadge}><Text style={styles.metadataText}>{plan.intensity}</Text></View>}
                {plan.sessions_per_week && <View style={styles.metadataBadge}><Text style={styles.metadataText}>{plan.sessions_per_week} days/week</Text></View>}
              </View>
              {plan.description ? <Text style={{ color: '#AAA', fontSize: 13, marginTop: 4 }}>{plan.description}</Text> : null}
            </View>
          )}
        </View>

        {!isEditing && (
          <View>
            {plan.plan_worksessions?.map((pw) => (
              <View key={pw.id} style={{ marginBottom: 15, backgroundColor: '#1E1E24', padding: 12, borderRadius: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
                    {pw.worksessions?.name}
                    {plan.schedule_type === 'anchored' ? ` (${pw.day_name})` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {isEditing && (
          <View style={styles.editExercisesContainer}>
            {plan.plan_worksessions?.map((pw) => (
              <View key={pw.id} style={styles.exerciseEditRow}>
                <View>
                  <Text style={styles.exerciseEditName}>{pw.worksessions?.name}</Text>
                  {plan.schedule_type === 'anchored' && (
                    <Text style={styles.exerciseEditDetails}>{pw.day_name}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => handleRemoveWorksessionFromPlan(pw.id)} style={{ padding: 5 }}>
                  <Ionicons name="close-circle" size={24} color="#FF4C4C" />
                </TouchableOpacity>
              </View>
            ))}
            
            <TouchableOpacity style={[styles.addExerciseBtn, { backgroundColor: '#444', marginTop: 10 }]} onPress={() => { setActivePlanForWs(plan.id); setIsAddWsModalVisible(true); }}>
              <Ionicons name="add-circle-outline" size={18} color="#FFF" />
              <Text style={styles.addExerciseBtnText}>Attach Worksession</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isEditing && (
          <View style={styles.cardActions}>
            {defaultPlanId === plan.id ? (
              <View style={[styles.actionIcon, { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00D09E20', paddingHorizontal: 10, borderRadius: 20 }]}>
                <Ionicons name="checkmark-circle" size={16} color="#00D09E" style={{ marginRight: 4 }} />
                <Text style={{ color: '#00D09E', fontWeight: 'bold', fontSize: 12 }}>Default Plan</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={() => onSetDefaultPlan && onSetDefaultPlan(plan.id)} style={[styles.actionIcon, { flexDirection: 'row', alignItems: 'center' }]}>
                <Ionicons name="star-outline" size={16} color="#888" style={{ marginRight: 4 }} />
                <Text style={{ color: '#888', fontSize: 12 }}>Set Default</Text>
              </TouchableOpacity>
            )}
            
            {plan.is_standard_template && (
              <TouchableOpacity onPress={() => handleCopyPlan(plan)} style={[styles.actionIcon, { flexDirection: 'row', alignItems: 'center' }]}>
                <Ionicons name="copy-outline" size={16} color="#00D09E" style={{ marginRight: 4 }} />
                <Text style={{ color: '#00D09E', fontSize: 12 }}>Copy to Custom</Text>
              </TouchableOpacity>
            )}
            
            {!plan.is_standard_template && (
              <>
                <TouchableOpacity onPress={() => { 
                  setEditingPlanId(plan.id); 
                  setEditPlanName(plan.name); 
                  setEditPlanGoal(plan.goal_category || '');
                  setEditPlanIntensity(plan.intensity || '');
                  setEditPlanSessions(plan.sessions_per_week?.toString() || '');
                  setEditPlanDescription(plan.description || '');
                }} style={styles.actionIcon}>
                  <Ionicons name="pencil" size={18} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeletePlan(plan.id)} style={styles.actionIcon}>
                  <Ionicons name="trash" size={18} color="#FF4C4C" />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {isEditing && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 15 }}>
            <TouchableOpacity style={[styles.startButton, { width: 150, justifyContent: 'center', alignItems: 'center' }]} onPress={() => saveEditPlan(plan.id)}>
              <Text style={styles.startButtonText}>Save Plan</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {!isFocusModeVisible ? (
        <>
          <View style={styles.tabContainer}>
            {['plans', 'worksessions', 'exercises'].map(tab => (
              <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab === 'worksessions' ? 'Worksessions' : tab === 'exercises' ? 'Exercises' : 'Plans'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <View style={styles.centerContainer}><ActivityIndicator size="large" color="#00D09E" /></View>
          ) : (
            <ScrollView style={styles.scrollContent}>
              {/* WORKSESSIONS TAB */}
              {activeTab === 'worksessions' && (
                <TouchableOpacity style={styles.createButton} onPress={() => openFocusMode()}>
                  <Ionicons name="add" size={24} color="#FFF" />
                  <Text style={styles.createButtonText}>Create Worksession</Text>
                </TouchableOpacity>
              )}

              {activeTab === 'worksessions' && worksessions.map(renderWorksessionCard)}

              {/* EXERCISES TAB */}
              {activeTab === 'exercises' && !isCreatingExercise && (
                <View style={{ marginBottom: 15 }}>
                  <TextInput
                    style={[styles.input, { marginBottom: 10, padding: 12 }]}
                    placeholder="Search exercises..."
                    placeholderTextColor="#666"
                    value={globalExerciseSearchQuery}
                    onChangeText={setGlobalExerciseSearchQuery}
                  />
                  <TouchableOpacity style={styles.createButton} onPress={() => setIsCreatingExercise(true)}>
                    <Ionicons name="add" size={24} color="#FFF" />
                    <Text style={styles.createButtonText}>Create Exercise</Text>
                  </TouchableOpacity>
                </View>
              )}

              {isCreatingExercise && activeTab === 'exercises' && (
                <View style={styles.createForm}>
                  <View style={styles.formHeader}>
                    <Text style={styles.formTitle}>New Exercise</Text>
                    <TouchableOpacity onPress={() => setIsCreatingExercise(false)}><Ionicons name="close" size={24} color="#AAA" /></TouchableOpacity>
                  </View>
                  <Text style={styles.label}>Exercise Name</Text>
                  <TextInput style={styles.input} placeholder="e.g., Bench Press" placeholderTextColor="#666" value={newExerciseName} onChangeText={setNewExerciseName} />
                  
                  <Text style={styles.label}>Category</Text>
                  <TextInput style={styles.input} placeholder="e.g., Chest" placeholderTextColor="#666" value={newExerciseCategory} onChangeText={setNewExerciseCategory} />

                  <TouchableOpacity style={styles.saveButton} onPress={handleCreateExercise}><Text style={styles.saveButtonText}>Save Exercise</Text></TouchableOpacity>
                </View>
              )}

              {activeTab === 'exercises' && (() => {
                const filtered = exercisesList.filter(ex => 
                  ex.name.toLowerCase().includes(globalExerciseSearchQuery.toLowerCase()) || 
                  ex.category.toLowerCase().includes(globalExerciseSearchQuery.toLowerCase())
                );
                const grouped = filtered.reduce((acc, ex) => {
                  if (!acc[ex.category]) acc[ex.category] = [];
                  acc[ex.category].push(ex);
                  return acc;
                }, {});
                return Object.keys(grouped).sort().map(category => (
                  <View key={category} style={{ marginBottom: 10 }}>
                    <Text style={{ color: '#AAA', fontSize: 16, fontWeight: 'bold', marginBottom: 10, marginTop: 5 }}>{category}</Text>
                    {grouped[category].map(renderExerciseCard)}
                  </View>
                ));
              })()}

              {/* PLANS TAB */}
              {activeTab === 'plans' && !isCreatingPlan && !editingPlanId && (
                <TouchableOpacity style={styles.createButton} onPress={() => setIsCreatingPlan(true)}>
                  <Ionicons name="add" size={24} color="#FFF" />
                  <Text style={styles.createButtonText}>Create Plan</Text>
                </TouchableOpacity>
              )}

              {isCreatingPlan && activeTab === 'plans' && (
                <View style={styles.createForm}>
                  <View style={styles.formHeader}>
                    <Text style={styles.formTitle}>New Plan</Text>
                    <TouchableOpacity onPress={() => setIsCreatingPlan(false)}><Ionicons name="close" size={24} color="#AAA" /></TouchableOpacity>
                  </View>
                  <Text style={styles.label}>Plan Name</Text>
                  <TextInput style={styles.input} placeholder="e.g., Summer Shred" placeholderTextColor="#666" value={newPlanName} onChangeText={setNewPlanName} />

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Goal</Text>
                      <TextInput style={styles.input} value={newPlanGoal} onChangeText={setNewPlanGoal} placeholder="e.g. Strength" placeholderTextColor="#666" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Intensity</Text>
                      <TextInput style={styles.input} value={newPlanIntensity} onChangeText={setNewPlanIntensity} placeholder="e.g. Adv" placeholderTextColor="#666" />
                    </View>
                    <View style={{ width: 60 }}>
                      <Text style={styles.label}>Days</Text>
                      <TextInput style={styles.input} value={newPlanSessions} onChangeText={setNewPlanSessions} keyboardType="numeric" placeholder="3" placeholderTextColor="#666" />
                    </View>
                  </View>

                  <Text style={styles.label}>Description</Text>
                  <TextInput style={[styles.input, { height: 60 }]} value={newPlanDescription} onChangeText={setNewPlanDescription} multiline placeholder="Brief description..." placeholderTextColor="#666" />
                  
                  <Text style={styles.label}>Schedule Type</Text>
                  <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                    <TouchableOpacity style={[styles.modalityPill, newPlanSchedule === 'anchored' && styles.modalityPillActive, { flex: 1, alignItems: 'center' }]} onPress={() => setNewPlanSchedule('anchored')}>
                      <Text style={[styles.modalityText, newPlanSchedule === 'anchored' && styles.modalityTextActive]}>Anchored</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalityPill, newPlanSchedule === 'floating' && styles.modalityPillActive, { flex: 1, alignItems: 'center' }]} onPress={() => setNewPlanSchedule('floating')}>
                      <Text style={[styles.modalityText, newPlanSchedule === 'floating' && styles.modalityTextActive]}>Floating</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.saveButton} onPress={handleCreatePlan}><Text style={styles.saveButtonText}>Save Plan</Text></TouchableOpacity>
                </View>
              )}

              {activeTab === 'plans' && (
                <>
                  {standardPlans.length > 0 && <Text style={{ color: '#AAA', fontSize: 16, fontWeight: 'bold', marginBottom: 15, marginTop: 5 }}>Standard Templates</Text>}
                  {standardPlans.map(renderPlanCard)}
                  
                  <Text style={{ color: '#AAA', fontSize: 16, fontWeight: 'bold', marginBottom: 15, marginTop: 15 }}>Your Custom Plans</Text>
                  {customPlans.length === 0 ? (
                    <Text style={{ color: '#666', marginBottom: 20 }}>You haven't created any custom plans yet.</Text>
                  ) : (
                    customPlans.map(renderPlanCard)
                  )}
                </>
              )}

            </ScrollView>
          )}
        </>
      ) : (
        <View style={styles.focusContainer}>
          <View style={styles.focusHeader}>
            <TouchableOpacity onPress={closeFocusMode}>
              <Text style={styles.focusCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.focusTitle}>{draftWsId ? 'Edit Worksession' : 'New Worksession'}</Text>
            <TouchableOpacity onPress={saveFocusMode}>
              <Text style={styles.focusSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.focusContent}>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} placeholder="e.g., Pull Day" placeholderTextColor="#666" value={draftWsName} onChangeText={setDraftWsName} />
            <Text style={styles.label}>Modality</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalityScroll}>
              {MODALITIES.map(m => (
                <TouchableOpacity key={m} style={[styles.modalityPill, draftWsModality === m && styles.modalityPillActive]} onPress={() => setDraftWsModality(m)}>
                  <Text style={[styles.modalityText, draftWsModality === m && styles.modalityTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.draftExercisesContainer}>
              <Text style={styles.label}>Exercises</Text>
              {draftExercises.map((ex, index) => (
                <View key={ex.id} style={styles.exerciseEditRow}>
                  <View style={styles.exerciseEditReorderArrows}>
                    <TouchableOpacity onPress={() => moveDraftExercise(index, 'up')} disabled={index === 0}>
                      <Ionicons name="chevron-up" size={24} color={index === 0 ? '#444' : '#00D09E'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => moveDraftExercise(index, 'down')} disabled={index === draftExercises.length - 1}>
                      <Ionicons name="chevron-down" size={24} color={index === draftExercises.length - 1 ? '#444' : '#00D09E'} />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1, paddingLeft: 10 }}>
                    <Text style={styles.exerciseEditName}>{ex.exercises?.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <TextInput 
                        style={styles.smallInput} 
                        value={ex.target_sets?.toString()} 
                        keyboardType="numeric"
                        onChangeText={(text) => {
                          const newDraft = [...draftExercises];
                          newDraft[index].target_sets = parseInt(text) || 0;
                          setDraftExercises(newDraft);
                        }}
                      />
                      <Text style={{ color: '#888', marginHorizontal: 4 }}>sets x</Text>
                      <TextInput 
                        style={styles.smallInput} 
                        value={ex.target_reps?.toString()} 
                        keyboardType="numeric"
                        onChangeText={(text) => {
                          const newDraft = [...draftExercises];
                          newDraft[index].target_reps = parseInt(text) || 0;
                          setDraftExercises(newDraft);
                        }}
                      />
                      <Text style={{ color: '#888', marginLeft: 4 }}>reps</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => removeDraftExercise(index)} style={{ padding: 5 }}>
                    <Ionicons name="trash" size={24} color="#FF4C4C" />
                  </TouchableOpacity>
                </View>
              ))}
              {draftExercises.length === 0 && <Text style={{ color: '#666', marginBottom: 15 }}>No exercises added yet.</Text>}
              
              <TouchableOpacity style={styles.addExerciseBtn} onPress={() => setIsExerciseModalVisible(true)}>
                <Ionicons name="add" size={18} color="#FFF" />
                <Text style={styles.addExerciseBtnText}>Add Exercise</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Exercise Selection Modal */}
      <Modal visible={isExerciseModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.exerciseModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Exercise</Text>
              <TouchableOpacity onPress={() => { setIsExerciseModalVisible(false); setExerciseSearchQuery(''); }}><Ionicons name="close" size={24} color="#FFF" /></TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { marginHorizontal: 20, marginBottom: 15 }]}
              placeholder="Search exercises..."
              placeholderTextColor="#888"
              value={exerciseSearchQuery}
              onChangeText={setExerciseSearchQuery}
            />
            
            <View style={styles.filterScrollContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['All', ...MODALITIES].map(cat => (
                  <TouchableOpacity key={cat} style={[styles.filterPill, selectedExerciseFilter === cat && styles.filterPillActive]} onPress={() => setSelectedExerciseFilter(cat)}>
                    <Text style={[styles.filterText, selectedExerciseFilter === cat && styles.filterTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <ScrollView 
              style={styles.exerciseListScroll}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
            >
              {exercisesList
                .filter(e => selectedExerciseFilter === 'All' || e.category === selectedExerciseFilter)
                .filter(e => e.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase()))
                .map(ex => (
                <TouchableOpacity key={ex.id} style={styles.exerciseListItem} onPress={() => handleAddExerciseToDraft(ex.id)}>
                  <View>
                    <Text style={styles.exerciseListItemName}>{ex.name}</Text>
                    <Text style={styles.exerciseListItemCategory}>{ex.category}</Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color="#00D09E" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Worksession to Plan Modal */}
      <Modal visible={isAddWsModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.exerciseModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Worksession</Text>
              <TouchableOpacity onPress={() => { setIsAddWsModalVisible(false); setSelectedWsIdForAttach(null); setNewWsName(''); }}><Ionicons name="close" size={24} color="#FFF" /></TouchableOpacity>
            </View>

            <ScrollView style={[styles.exerciseListScroll, { maxHeight: 200, marginBottom: 15 }]}>
              <Text style={[styles.label, { marginBottom: 10 }]}>Your Worksessions</Text>
              {worksessions.map(ws => (
                <TouchableOpacity 
                  key={ws.id} 
                  style={[styles.exerciseListItem, selectedWsIdForAttach === ws.id && { borderColor: '#00D09E', borderWidth: 1 }]} 
                  onPress={() => {
                    setSelectedWsIdForAttach(ws.id);
                    setNewWsName('');
                  }}
                >
                  <View>
                    <Text style={styles.exerciseListItemName}>{ws.name}</Text>
                    <Text style={styles.exerciseListItemCategory}>{ws.modality}</Text>
                  </View>
                  {selectedWsIdForAttach === ws.id && <Ionicons name="checkmark-circle" size={24} color="#00D09E" />}
                </TouchableOpacity>
              ))}
              {worksessions.length === 0 && <Text style={{ color: '#888' }}>No worksessions available.</Text>}
            </ScrollView>

            <View style={{ marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#3A3A45', paddingBottom: 15 }}>
              <Text style={styles.label}>Or Create & Attach New Worksession</Text>
              <TextInput 
                style={styles.input} 
                placeholder="New Worksession Name" 
                placeholderTextColor="#666" 
                value={newWsName} 
                onChangeText={(text) => {
                  setNewWsName(text);
                  if (text) setSelectedWsIdForAttach(null);
                }} 
              />
            </View>

            {(() => {
              const activePlanObj = customPlans.find(p => p.id === activePlanForWs) || standardPlans.find(p => p.id === activePlanForWs);
              const isAnchored = activePlanObj?.schedule_type === 'anchored';
              return isAnchored ? (
                <View style={{ marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#3A3A45', paddingBottom: 15 }}>
                  <Text style={styles.label}>Select Day</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <TouchableOpacity 
                        key={day} 
                        style={[styles.filterPill, selectedDayForAnchored === day && styles.filterPillActive]} 
                        onPress={() => setSelectedDayForAnchored(day)}
                      >
                        <Text style={[styles.filterText, selectedDayForAnchored === day && styles.filterTextActive]}>{day}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : null;
            })()}
            
            <TouchableOpacity style={styles.saveButton} onPress={handleFinalAddWorksession}>
              <Text style={styles.saveButtonText}>Add Worksession to Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E24' },
  tabContainer: { flexDirection: 'row', marginHorizontal: 15, marginTop: 15, marginBottom: 20, backgroundColor: '#2A2A31', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#3A3A45' },
  tabText: { color: '#888', fontWeight: '600', fontSize: 13 },
  activeTabText: { color: '#FFF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flex: 1, paddingHorizontal: 15 },
  createButton: { flexDirection: 'row', backgroundColor: '#00D09E', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  createButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  createForm: { backgroundColor: '#2A2A31', borderRadius: 12, padding: 20, marginBottom: 20 },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  formTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  label: { color: '#AAA', fontSize: 14, marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#1E1E24', color: '#FFF', padding: 15, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#3A3A45', marginBottom: 10 },
  smallInput: { backgroundColor: '#121214', color: '#FFF', padding: 8, borderRadius: 8, fontSize: 14, borderWidth: 1, borderColor: '#3A3A45', width: 40, textAlign: 'center' },
  modalityScroll: { marginBottom: 20 },
  modalityPill: { backgroundColor: '#1E1E24', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#3A3A45' },
  modalityPillActive: { backgroundColor: '#00D09E20', borderColor: '#00D09E' },
  modalityText: { color: '#AAA', fontWeight: '500' },
  modalityTextActive: { color: '#00D09E', fontWeight: 'bold' },
  saveButton: { backgroundColor: '#00D09E', padding: 16, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  planList: { paddingBottom: 40 },
  planCard: { backgroundColor: '#2A2A31', borderRadius: 12, padding: 16, marginBottom: 15 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  planName: { color: '#FFF', fontSize: 18, fontWeight: 'bold', flex: 1 },
  startButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00D09E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginLeft: 10 },
  startButtonText: { color: '#FFF', fontWeight: 'bold', marginRight: 4, fontSize: 14 },
  exerciseSummaryList: { marginTop: 5 },
  exerciseSummaryText: { color: '#AAA', fontSize: 14, marginBottom: 4 },
  editExercisesContainer: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#3A3A45', paddingTop: 10 },
  exerciseEditRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E1E24', padding: 12, borderRadius: 8, marginBottom: 8 },
  exerciseEditReorderArrows: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingRight: 10, borderRightWidth: 1, borderRightColor: '#3A3A45' },
  exerciseEditName: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  exerciseEditDetails: { color: '#888', fontSize: 12, marginTop: 4 },
  addExerciseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3A3A45', padding: 12, borderRadius: 8, marginTop: 10 },
  addExerciseBtnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 6 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 10, alignItems: 'center' },
  actionIcon: { padding: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  exerciseModalContent: { backgroundColor: '#2A2A31', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  filterScrollContainer: { marginBottom: 15 },
  filterPill: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#1E1E24', borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#3A3A45' },
  filterPillActive: { backgroundColor: '#00D09E20', borderColor: '#00D09E' },
  filterText: { color: '#AAA', fontWeight: '500' },
  filterTextActive: { color: '#00D09E', fontWeight: 'bold' },
  exerciseListScroll: { flex: 1 },
  exerciseListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E1E24', padding: 15, borderRadius: 12, marginBottom: 10 },
  exerciseListItemName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  exerciseListItemCategory: { color: '#888', fontSize: 12, marginTop: 4 },
  focusContainer: { flex: 1, backgroundColor: '#1E1E24', paddingTop: 50 },
  metadataBadge: { backgroundColor: '#3A3A45', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  metadataText: { color: '#00D09E', fontSize: 11, fontWeight: 'bold' },
  editRow: { flexDirection: 'row', alignItems: 'center' },
  editLabel: { color: '#AAA', fontSize: 13, width: 75, fontWeight: 'bold' },
  editInput: { flex: 1, marginBottom: 0, padding: 8 },
  focusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#2A2A31' },
  focusCancelText: { color: '#FF4C4C', fontSize: 16, fontWeight: '500' },
  focusSaveText: { color: '#00D09E', fontSize: 16, fontWeight: 'bold' },
  focusTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  focusContent: { flex: 1, padding: 20 },
  draftExercisesContainer: { marginTop: 20, paddingBottom: 50 }
});
