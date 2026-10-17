import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  TextInput, Alert, ActivityIndicator, Platform, UIManager, Modal, KeyboardAvoidingView,
  LayoutAnimation
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase, TrainingContext } from '../context/TrainingContext';
import { 
  getExerciseInstructions, 
  getExerciseDifficulty, 
  getExerciseMechanics, 
  getWorksessionDescription, 
  getWorksessionExerciseCue,
  getExerciseVideoUrl,
  getExerciseVideoThumbnail
} from '../data/recoveryMetadata';
import ExerciseVideoModal from './ExerciseVideoModal';
import { KinetixTheme } from '../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MODALITIES = ['Yoga', 'Plyometrics', 'Calisthenics', 'Cardio', 'Weightlifting', 'Kettlebell', 'Core'];

export const CATEGORY_OPTIONS = [
  'Kettlebell',
  'Core',
  'Recovery',
  'Weightlifting',
  'Calisthenics',
  'Yoga',
  'Cardio',
  'Plyometrics',
  'Back',
  'Chest',
  'Legs',
  'Arms',
  'Collective Sports'
];

export const EQUIPMENT_OPTIONS = [
  'Kettlebell',
  'TRX',
  'Floor Mat',
  'Resistance Band',
  'Pull-up Bar',
  'Dumbbell / Barbell',
  'Bodyweight',
  'Ab Wheel',
  'Cardio Equipment',
  'Dip Station',
  'Plyo Box',
  'Sports Equipment',
  'Other'
];

export const MUSCLE_OPTIONS = [
  'Core',
  'Chest',
  'Back',
  'Legs',
  'Arms',
  'Shoulders',
  'Full Body',
  'Cardio',
  'Yoga',
  'Sports',
  'Knee Rehab',
  'Lower Back Pain',
  'Shoulder Rehab',
  'Ankle & Achilles',
  'Recovery'
];

export const getExerciseEquipment = (exercise) => {
  if (exercise?.equipment) return exercise.equipment;
  const name = (exercise?.name || '').toLowerCase();
  const cat = (exercise?.category || '').toLowerCase();
  
  if (name.includes('kettlebell') || cat.includes('kettlebell')) return 'Kettlebell';
  if (name.includes('trx')) return 'TRX';
  if (name.includes('ab wheel')) return 'Ab Wheel';
  if (name.includes('pull-up') || name.includes('muscle-up')) return 'Pull-up Bar';
  if (name.includes('dip')) return 'Dip Station';
  if (name.includes('barbell') || name.includes('dumbbell') || name.includes('bench press') || name.includes('deadlift') || name.includes('overhead press') || name.includes('curl')) return 'Dumbbell / Barbell';
  if (name.includes('box jump')) return 'Plyo Box';
  if (name.includes('jump rope')) return 'Cardio Equipment';
  if (name.includes('treadmill') || name.includes('cycl') || name.includes('rowing') || name.includes('stair')) return 'Cardio Equipment';
  if (cat === 'yoga' || name.includes('dog') || name.includes('pose') || name.includes('chaturanga') || name.includes('plank') || name.includes('push-up')) return 'Floor Mat';
  if (cat === 'collective sports' || name.includes('ball') || name.includes('tennis') || name.includes('hockey') || name.includes('cricket') || name.includes('badminton') || name.includes('rugby')) return 'Sports Equipment';
  return 'Bodyweight';
};

export const getExerciseMuscleGroup = (exercise) => {
  const cat = exercise?.category || '';
  const name = (exercise?.name || '').toLowerCase();

  if (cat === 'Core' || name.includes('plank') || name.includes('pike') || name.includes('climber') || name.includes('deadbug') || name.includes('crunch') || name.includes('twist') || name.includes('rollout') || name.includes('v-up') || name.includes('hollow body') || name.includes('body saw')) {
    return 'Core';
  }

  if (exercise?.muscle_group) return exercise.muscle_group;
  
  if (['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Shoulders', 'Full Body'].includes(cat)) {
    return cat;
  }
  
  if (name.includes('chest') || name.includes('bench press') || name.includes('push-up')) return 'Chest';
  if (name.includes('row') || name.includes('pull-up') || name.includes('deadlift') || name.includes('y-fly') || name.includes('t-fly') || name.includes('alligator')) return 'Back';
  if (name.includes('squat') || name.includes('lunge') || name.includes('hamstring') || name.includes('box jump') || name.includes('swing') || name.includes('clean') || name.includes('snatch') || name.includes('rdl')) return 'Legs';
  if (name.includes('curl') || name.includes('tricep') || name.includes('dip') || name.includes('muscle-up')) return 'Arms';
  if (name.includes('overhead press') || name.includes('halo') || name.includes('push press')) return 'Shoulders';
  if (cat === 'Cardio' || name.includes('running') || name.includes('cycling') || name.includes('treadmill') || name.includes('rowing') || name.includes('jump rope')) return 'Cardio';
  if (cat === 'Yoga' || name.includes('dog') || name.includes('pose')) return 'Yoga';
  if (cat === 'Collective Sports') return 'Sports';
  
  return cat || 'Full Body';
};

const ADMIN_EMAILS = ['condrea.vlad@gmail.com', 'condrea.vlad@icloud.com'];

export default function PlanBuilder({ onSetDefaultPlan = () => {}, defaultPlanId = null, initialTab = 'plans', isEmbedded = false }) {
  const router = useRouter();
  const { session } = useContext(TrainingContext);
  const userId = session?.user?.id;
  const userEmail = session?.user?.email?.toLowerCase();
  const isAdmin = !!userEmail && ADMIN_EMAILS.includes(userEmail);

  const handleStartSession = async (plan, worksession) => {
    if (!worksession) {
      Alert.alert('Error', 'No worksession selected.');
      return;
    }
    try {
      const uid = userId || (await supabase.auth.getUser())?.data?.user?.id;
      if (!uid) {
        Alert.alert('Error', 'User session not found.');
        return;
      }
      const { data, error } = await supabase.from('active_sessions').insert([{
        user_id: uid,
        start_time: new Date().toISOString()
      }]).select().single();

      if (error) throw error;

      // Ensure worksession exercises are formatted properly with target sets, reps, load, and tracking type
      const rawExercises = worksession.worksession_exercises || worksession.exercises || [];
      const formattedExercises = rawExercises.map((we, idx) => {
        const ex = we.exercises || we;
        const isHold = we.tracking_type === 'time' || (we.target_time && we.target_time > 0);
        
        let parsedLoad = 'Bodyweight';
        if (we.notes && we.notes.includes('Load:')) {
          const match = we.notes.match(/Load:\s*([0-9.]+\s*kg|[0-9.]+)/i);
          parsedLoad = match ? (match[1].includes('kg') ? match[1] : `${match[1]}kg`) : 'Standard';
        } else if (we.target_load) {
          parsedLoad = `${we.target_load}kg`;
        } else if (we.load || we.weight) {
          parsedLoad = we.load || we.weight;
        } else if (ex.equipment && (ex.equipment.includes('Barbell') || ex.equipment.includes('Dumbbell') || ex.equipment === 'Kettlebell')) {
          parsedLoad = '60kg';
        }

        return {
          id: `ex-${idx}`,
          name: ex.name || 'Exercise',
          cue: we.notes || ex.instructions || 'Controlled form.',
          sets: we.target_sets || we.sets || 3,
          totalSets: we.target_sets || we.sets || 3,
          reps: isHold ? (we.target_time ? `${we.target_time}s` : '45s') : (we.target_reps ? `${we.target_reps} reps` : '10 reps'),
          load: parsedLoad,
          weight: parsedLoad,
          tracking_type: we.tracking_type || (isHold ? 'time' : 'reps'),
          trackingType: isHold ? 'duration' : (parsedLoad !== 'Bodyweight' && parsedLoad !== 'Standard' ? 'weight_reps' : 'bodyweight'),
          restSeconds: isHold ? 45 : 60,
          equipment: ex.equipment,
          muscle_group: ex.muscle_group,
        };
      });

      const worksessionToLaunch = {
        ...worksession,
        exercises: formattedExercises.length > 0 ? formattedExercises : worksession.exercises,
      };

      router.push({
        pathname: '/active-workout',
        params: {
          sessionId: data.id,
          plan: plan ? JSON.stringify(plan) : JSON.stringify({ name: worksession.name || 'Custom Session' }),
          worksession: JSON.stringify(worksessionToLaunch)
        }
      });
    } catch (e) {
      console.error('Failed to start session', e);
      Alert.alert('Error', 'Failed to start session.');
    }
  };
  
  const [activeTab, setActiveTab] = useState(initialTab || 'plans');
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

  // Plan card fold / unfold state (all folded by default, only one unfolded at a time)
  const [expandedPlanId, setExpandedPlanId] = useState(null);

  const togglePlanFold = (planId) => {
    if (Platform.OS !== 'web' && UIManager.setLayoutAnimationEnabledExperimental) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpandedPlanId(prev => (prev === planId ? null : planId));
  };

  const [isAddWsModalVisible, setIsAddWsModalVisible] = useState(false);
  const [activePlanForWs, setActivePlanForWs] = useState(null);
  const [selectedDayForAnchored, setSelectedDayForAnchored] = useState('Monday');
  const [selectedTimeForAnchored, setSelectedTimeForAnchored] = useState('Any Time');
  const [selectedWsIdForAttach, setSelectedWsIdForAttach] = useState(null);

  // Edit Day Modal
  const [isEditDayModalVisible, setIsEditDayModalVisible] = useState(false);
  const [editDayPwId, setEditDayPwId] = useState(null);
  const [editDaySelectedDay, setEditDaySelectedDay] = useState('Monday');
  const [editDaySelectedTime, setEditDaySelectedTime] = useState('Any Time');
  
  // For attaching worksession modal
  const [newWsName, setNewWsName] = useState('');

  // Exercises Tab
  const [isCreatingExercise, setIsCreatingExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseCategory, setNewExerciseCategory] = useState('Chest');
  const [newExerciseEquipment, setNewExerciseEquipment] = useState('Bodyweight');
  const [newExerciseVideoUrl, setNewExerciseVideoUrl] = useState('');
  const [isDefaultExercise, setIsDefaultExercise] = useState(false);
  const [selectedVideoExercise, setSelectedVideoExercise] = useState(null);
  const [globalExerciseSearchQuery, setGlobalExerciseSearchQuery] = useState('');
  const [exerciseSortMode, setExerciseSortMode] = useState('category'); // 'category' | 'muscle' | 'equipment' | 'alpha'
  const [exerciseFilterTag, setExerciseFilterTag] = useState('All');
  const [pickerSortMode, setPickerSortMode] = useState('category'); // for worksession modal
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  const [showAllExercises, setShowAllExercises] = useState(false);

  useEffect(() => {
    fetchData();
    fetchExercises();
  }, [userId]);

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase.from('exercises').select('*').order('name');
      if (!error && data) {
        setExercisesList(data);
      }
    } catch (err) {
      console.error('Failed to fetch exercises:', err);
    }
  };

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [plansRes, wsRes] = await Promise.all([
        supabase
          .from('training_plans')
          .select(`
            id, name, is_standard_template, user_id, schedule_type,
            goal_category, intensity, sessions_per_week, description,
            plan_worksessions (
              id, day_name, order_index, worksession_id,
              worksessions (
                id, name, modality, description,
                worksession_exercises (
                  id, target_sets, target_reps, tracking_type, target_time, notes,
                  exercises (id, name, category, equipment, muscle_group, instructions, difficulty, mechanics)
                )
              )
            )
          `),
        supabase
          .from('worksessions')
          .select(`
            id, name, modality, description, user_id,
            worksession_exercises (
              id, target_sets, target_reps, tracking_type, target_time, notes,
              exercises (id, name, category, equipment, muscle_group, instructions, difficulty, mechanics)
            )
          `)
          .or(`user_id.eq.${userId},user_id.is.null,id.in.(b0000001-0000-4000-a000-000000000001,b0000001-0000-4000-a000-000000000002,b0000001-0000-4000-a000-000000000003,b0000001-0000-4000-a000-000000000004,b0000001-0000-4000-a000-000000000005,b0000001-0000-4000-a000-000000000006)`)
          .order('created_at', { ascending: false })
      ]);

      if (plansRes.error) throw plansRes.error;
      if (wsRes.error) throw wsRes.error;

      const plansData = plansRes.data;
      if (plansData) {
        const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
        plansData.forEach(p => {
          if (p.plan_worksessions) {
            if (p.schedule_type === 'anchored') {
              p.plan_worksessions.sort((a, b) => {
                const dayA = a.day_name.split(' ')[0];
                const dayB = b.day_name.split(' ')[0];
                const timeA = a.day_name.split(' ')[1] || '';
                const timeB = b.day_name.split(' ')[1] || '';
                const diff = (dayOrder[dayA] || 8) - (dayOrder[dayB] || 8);
                if (diff !== 0) return diff;
                if (timeA === 'AM' && timeB === 'PM') return -1;
                if (timeA === 'PM' && timeB === 'AM') return 1;
                return 0;
              });
            } else {
              p.plan_worksessions.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
            }
          }
        });

        const standards = plansData.filter(p => p.is_standard_template);
        const customs = plansData.filter(p => !p.is_standard_template && p.user_id === userId);

        setStandardPlans(standards);
        setCustomPlans(customs);
      }
      setWorksessions(wsRes.data);
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
      setDraftExercises(ws.worksession_exercises ? ws.worksession_exercises.map(we => {
        let parsedLoad = '';
        if (we.notes && we.notes.includes('Load:')) {
          const m = we.notes.match(/Load:\s*([0-9.]+\s*kg|[0-9.]+)/i);
          parsedLoad = m ? m[1].replace(/kg/i, '').trim() : '';
        }
        return {
          ...we,
          target_load: parsedLoad
        };
      }) : []);
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

      if (!currentWsId) {
        // Create new worksession
        const { data, error } = await supabase.from('worksessions').insert([{
          user_id: userId,
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
        const inserts = draftExercises.map(ex => {
          let notesVal = ex.notes || null;
          if (ex.target_load && String(ex.target_load).trim() !== '') {
            const cleanLoad = String(ex.target_load).replace(/[^0-9.]/g, '');
            if (cleanLoad) {
              notesVal = notesVal ? `${notesVal} | Load: ${cleanLoad}kg` : `Load: ${cleanLoad}kg`;
            }
          }
          return {
            worksession_id: currentWsId,
            exercise_id: ex.exercise_id || ex.exercises?.id, 
            tracking_type: ex.tracking_type || 'reps',
            target_sets: ex.target_sets || 0,
            target_reps: ex.target_reps || 0,
            target_time: ex.target_time || 0,
            notes: notesVal
          };
        });
        const { error: insertError } = await supabase.from('worksession_exercises').insert(inserts);
        if (insertError) throw insertError;
      }

      setIsFocusModeVisible(false);
      setDraftWsId(null);
      setDraftWsName('');
      setDraftWsModality(MODALITIES[0]);
      setDraftExercises([]);
      await fetchData();
      Alert.alert('Success', 'Worksession created successfully!');
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

    const isWeighted = exObj.equipment && (exObj.equipment.includes('Barbell') || exObj.equipment.includes('Dumbbell') || exObj.equipment === 'Kettlebell');

    setDraftExercises(prev => [...prev, {
      id: `temp-${Date.now()}`,
      exercise_id: exerciseId,
      exercises: { id: exerciseId, name: exObj.name, category: exObj.category, equipment: exObj.equipment },
      tracking_type: 'reps',
      target_sets: 3,
      target_reps: 10,
      target_time: 60,
      target_load: isWeighted ? '60' : ''
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
                tracking_type: ex.tracking_type || 'reps',
                target_sets: ex.target_sets || 0,
                target_reps: ex.target_reps || 0,
                target_time: ex.target_time || 0
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
      await supabase.from('training_plans').insert([{
        user_id: userId,
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
      Alert.alert('Success', 'Plan created successfully!');
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
      const timeSuffix = selectedTimeForAnchored === 'Any Time' ? '' : ` ${selectedTimeForAnchored}`;
      const defaultName = plan.schedule_type === 'anchored' ? `${selectedDayForAnchored}${timeSuffix}` : `Worksession ${nextIndex}`;

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

  const moveWorksessionInPlan = async (planId, currentIndex, direction) => {
    const plan = customPlans.find(p => p.id === planId) || standardPlans.find(p => p.id === planId);
    if (!plan) return;
    
    const newWorksessions = [...(plan.plan_worksessions || [])];
    if (direction === 'up' && currentIndex > 0) {
      const temp = newWorksessions[currentIndex];
      newWorksessions[currentIndex] = newWorksessions[currentIndex - 1];
      newWorksessions[currentIndex - 1] = temp;
    } else if (direction === 'down' && currentIndex < newWorksessions.length - 1) {
      const temp = newWorksessions[currentIndex];
      newWorksessions[currentIndex] = newWorksessions[currentIndex + 1];
      newWorksessions[currentIndex + 1] = temp;
    } else {
      return;
    }

    setLoading(true);
    try {
      for (let i = 0; i < newWorksessions.length; i++) {
        await supabase.from('plan_worksessions').update({ order_index: i + 1 }).eq('id', newWorksessions[i].id);
      }
      await fetchData();
    } catch (e) {
      Alert.alert('Error', 'Failed to reorder.');
      setLoading(false);
    }
  };

  const updateWorksessionDay = async (pwId, newDayName) => {
    try {
      await supabase.from('plan_worksessions').update({ day_name: newDayName }).eq('id', pwId);
      setIsEditDayModalVisible(false);
      await fetchData();
    } catch (e) {
      Alert.alert('Error', 'Failed to update day.');
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
        const { data: wsData, error: wsError } = await supabase.from('worksessions').insert([{
          user_id: userId,
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
      const makeDefault = isAdmin && isDefaultExercise;
      const cat = newExerciseCategory.trim() || 'Chest';
      const eq = newExerciseEquipment.trim() || 'Bodyweight';
      const vid = newExerciseVideoUrl.trim() || null;

      if (editingExerciseId) {
        const { error } = await supabase.from('exercises').update({
          name: newExerciseName.trim(),
          category: cat,
          muscle_group: cat,
          equipment: eq,
          video_url: vid,
          is_default: makeDefault,
          user_id: makeDefault ? null : userId
        }).eq('id', editingExerciseId);
        if (error) throw error;
        setEditingExerciseId(null);
        Alert.alert('Success', 'Exercise updated successfully!');
      } else {
        const { error } = await supabase.from('exercises').insert([{
          user_id: makeDefault ? null : userId,
          name: newExerciseName.trim(),
          category: cat,
          muscle_group: cat,
          equipment: eq,
          video_url: vid,
          is_default: makeDefault
        }]);
        if (error) throw error;
        Alert.alert('Success', makeDefault ? 'Default exercise created for all users!' : 'Custom exercise created successfully!');
      }

      setIsCreatingExercise(false);
      setNewExerciseName('');
      setNewExerciseCategory('Chest');
      setNewExerciseEquipment('Bodyweight');
      setNewExerciseVideoUrl('');
      setIsDefaultExercise(false);
      await fetchExercises();
    } catch (e) {
      console.error('Failed to save exercise:', e);
      Alert.alert('Error', e.message || 'Failed to save exercise.');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToDefault = async (exercise) => {
    Alert.alert(
      'Make Default Exercise',
      `Promote "${exercise.name}" to a default library exercise for all users?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('exercises')
                .update({ is_default: true, user_id: null })
                .eq('id', exercise.id);
              if (error) throw error;
              await fetchExercises();
              Alert.alert('Success', `"${exercise.name}" is now a default exercise for all users!`);
            } catch (e) {
              Alert.alert('Error', e.message || 'Failed to promote exercise.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteExercise = async (exercise) => {
    const isDefault = exercise.is_default || !exercise.user_id;
    Alert.alert(
      'Delete Exercise',
      isDefault
        ? `Are you sure you want to delete default exercise "${exercise.name}"? This removes it for all users.`
        : `Delete "${exercise.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase.from('exercises').delete().eq('id', exercise.id);
              if (error) throw error;
              await fetchExercises();
            } catch (e) {
              Alert.alert('Error', e.message || 'Failed to delete.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderExerciseCard = (exercise) => {
    const isOwner = exercise.user_id === userId;
    const isDefault = exercise.is_default || !exercise.user_id;
    const eq = getExerciseEquipment(exercise);
    const mg = getExerciseMuscleGroup(exercise);
    const instructions = getExerciseInstructions(exercise);
    const difficulty = getExerciseDifficulty(exercise);
    const mechanics = getExerciseMechanics(exercise);

    return (
      <View key={exercise.id} style={styles.planCard}>
        <View style={styles.planHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.planName}>{exercise.name}</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              {exercise.category && (
                <View style={[styles.metadataBadge, { backgroundColor: '#1E2522' }]}>
                  <Text style={[styles.metadataText, { color: '#34D399' }]}>🏷️ {exercise.category}</Text>
                </View>
              )}
              <View style={[styles.metadataBadge, { backgroundColor: '#252530' }]}>
                <Text style={styles.metadataText}>💪 {exercise.muscle_group || mg}</Text>
              </View>
              <View style={[styles.metadataBadge, { backgroundColor: '#1C2833' }]}>
                <Text style={[styles.metadataText, { color: '#60A5FA' }]}>⚙️ {eq}</Text>
              </View>
              {difficulty && (
                <View style={[styles.metadataBadge, { backgroundColor: '#2A1F3D' }]}>
                  <Text style={[styles.metadataText, { color: '#C084FC' }]}>🎯 {difficulty}</Text>
                </View>
              )}
              {mechanics && (
                <View style={[styles.metadataBadge, { backgroundColor: '#1E293B' }]}>
                  <Text style={[styles.metadataText, { color: '#38BDF8' }]}>⚡ {mechanics}</Text>
                </View>
              )}
              <View style={[styles.metadataBadge, { backgroundColor: isDefault ? '#1A2E26' : '#332414' }]}>
                <Text style={[styles.metadataText, { color: isDefault ? '#00D09E' : '#FFA726' }]}>
                  {isDefault ? 'Default' : 'Custom'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {instructions && (
          <View style={{ backgroundColor: '#171720', borderRadius: 8, padding: 10, marginTop: 10, borderLeftWidth: 3, borderLeftColor: '#00D09E' }}>
            <Text style={{ color: '#00D09E', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 }}>
              Instructions & Form Cues
            </Text>
            <Text style={{ color: '#D1D5DB', fontSize: 13, lineHeight: 18 }}>
              {instructions}
            </Text>
          </View>
        )}

        <View style={styles.cardActions}>
          {getExerciseVideoUrl(exercise) ? (
            <TouchableOpacity 
              onPress={() => setSelectedVideoExercise({ ...exercise, video_url: getExerciseVideoUrl(exercise), instructions })} 
              style={[styles.actionIcon, { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00D09E20', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 5 }]}
            >
              <Ionicons name="play-circle" size={16} color="#00D09E" />
              <Text style={{ color: '#00D09E', fontSize: 12, fontWeight: 'bold' }}>Watch Demo</Text>
            </TouchableOpacity>
          ) : null}

          {isAdmin && !isDefault && (
            <TouchableOpacity 
              onPress={() => handlePromoteToDefault(exercise)} 
              style={[styles.actionIcon, { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3A331E', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 5 }]}
            >
              <Ionicons name="globe-outline" size={16} color="#FFD700" />
              <Text style={{ color: '#FFD700', fontSize: 12, fontWeight: 'bold' }}>Make Default</Text>
            </TouchableOpacity>
          )}

          {(isOwner || isAdmin) && (
            <TouchableOpacity onPress={() => handleDeleteExercise(exercise)} style={styles.actionIcon}>
              <Ionicons name="trash" size={18} color="#FF4C4C" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderWorksessionCard = (ws) => {
    const wsDesc = getWorksessionDescription(ws);
    const isTemplate = !ws.user_id || ws.id?.startsWith('b0000001');

    return (
      <View key={ws.id} style={styles.planCard}>
        <View style={styles.planHeader}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={styles.planName}>{ws.name}</Text>
              {isTemplate && (
                <View style={{ backgroundColor: '#00D09E20', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ color: '#00D09E', fontSize: 10, fontWeight: '700' }}>RECOVERY PROTOCOL</Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Modality: {ws.modality}</Text>
          </View>
        </View>

        {wsDesc && (
          <Text style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 18, marginTop: 8, marginBottom: 4 }}>
            {wsDesc}
          </Text>
        )}

        <View style={styles.exerciseSummaryList}>
          {ws.worksession_exercises?.map(te => {
            const cue = te.notes || getWorksessionExerciseCue(ws, te.exercises?.id || te.exercise_id);
            return (
              <View key={te.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 3 }}>
                <Text style={styles.exerciseSummaryText}>
                  • {te.exercises?.name} {te.tracking_type === 'time' ? `(${te.target_time}s hold)` : `(${te.target_sets}x${te.target_reps})`}
                </Text>
                {cue && (
                  <View style={{ backgroundColor: '#252530', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ color: '#00D09E', fontSize: 10, fontWeight: '600' }}>{cue}</Text>
                  </View>
                )}
              </View>
            );
          })}
          {(!ws.worksession_exercises || ws.worksession_exercises.length === 0) && (
            <Text style={styles.exerciseSummaryText}>No exercises added.</Text>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity 
            onPress={() => handleStartSession(null, ws)} 
            style={[styles.actionIcon, { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00D09E20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }]}
          >
            <Ionicons name="play" size={14} color="#00D09E" style={{ marginRight: 4 }} />
            <Text style={{ color: '#00D09E', fontWeight: 'bold', fontSize: 12 }}>Start</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openFocusMode(ws)} style={styles.actionIcon}>
            <Ionicons name="pencil" size={18} color="#888" />
          </TouchableOpacity>
          {(!isTemplate || isAdmin) && (
            <TouchableOpacity onPress={() => handleDeleteWorksession(ws.id)} style={styles.actionIcon}>
              <Ionicons name="trash" size={18} color="#FF4C4C" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderPlanCard = (plan) => {
    const isEditing = editingPlanId === plan.id;
    const isExpanded = expandedPlanId === plan.id || isEditing;

    return (
      <View key={plan.id} style={styles.planCard}>
        {/* Plan Header (Click to fold / unfold when not editing) */}
        {isEditing ? (
          <View style={styles.planHeader}>
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
          </View>
        ) : (
          <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={() => togglePlanFold(plan.id)}
            style={{ width: '100%' }}
          >
            <View style={[styles.planHeader, { marginBottom: 0, alignItems: 'flex-start' }]}>
              <View style={{ flex: 1, marginRight: 10 }}>
                {/* 1. Name of the plan */}
                <Text style={styles.planName}>{plan.name}</Text>
                
                {/* 2. Type & How many days a week */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 4, alignItems: 'center' }}>
                  <View style={[styles.metadataBadge, { backgroundColor: '#1C2833' }]}>
                    <Text style={[styles.metadataText, { color: '#60A5FA' }]}>
                      📅 {plan.schedule_type ? plan.schedule_type.charAt(0).toUpperCase() + plan.schedule_type.slice(1) : 'Schedule'}
                    </Text>
                  </View>
                  {plan.sessions_per_week ? (
                    <View style={styles.metadataBadge}>
                      <Text style={styles.metadataText}>⏱️ {plan.sessions_per_week} days/week</Text>
                    </View>
                  ) : null}
                  {isExpanded && plan.goal_category ? (
                    <View style={[styles.metadataBadge, { backgroundColor: '#252530' }]}>
                      <Text style={styles.metadataText}>{plan.goal_category}</Text>
                    </View>
                  ) : null}
                  {isExpanded && plan.intensity ? (
                    <View style={[styles.metadataBadge, { backgroundColor: '#2A1F3D' }]}>
                      <Text style={[styles.metadataText, { color: '#C084FC' }]}>{plan.intensity}</Text>
                    </View>
                  ) : null}
                </View>

                {/* 3. Description */}
                {plan.description ? (
                  <Text style={{ color: '#AAA', fontSize: 13, marginTop: 6, lineHeight: 18 }}>
                    {plan.description}
                  </Text>
                ) : null}
              </View>

              {/* Fold / Unfold Chevron & Status Indicator */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                {defaultPlanId === plan.id && (
                  <View style={[styles.metadataBadge, { backgroundColor: '#00D09E20', paddingHorizontal: 7, paddingVertical: 3 }]}>
                    <Text style={[styles.metadataText, { color: '#00D09E', fontSize: 10 }]}>★ Default</Text>
                  </View>
                )}
                <View style={{
                  backgroundColor: '#1E1E24',
                  borderRadius: 16,
                  width: 30,
                  height: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#3A3A45'
                }}>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#00D09E" 
                  />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* UNFOLDED VIEW: WORKSESSIONS & ACTIONS */}
        {!isEditing && isExpanded && (
          <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: '#3A3A45', paddingTop: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: '#888', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Attached Worksessions ({plan.plan_worksessions?.length || 0})
              </Text>
            </View>

            {plan.plan_worksessions && plan.plan_worksessions.length > 0 ? (
              plan.plan_worksessions.map((pw) => (
                <View key={pw.id} style={{ marginBottom: 10, backgroundColor: '#1E1E24', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#2E2E38' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>
                        {pw.worksessions?.name}
                        {plan.schedule_type === 'anchored' ? ` (${pw.day_name})` : ''}
                      </Text>
                      {pw.worksessions?.modality && (
                        <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
                          {pw.worksessions.modality}
                        </Text>
                      )}
                      {getWorksessionDescription(pw.worksessions) && (
                        <Text style={{ color: '#AAA', fontSize: 12, marginTop: 4, lineHeight: 16 }}>
                          {getWorksessionDescription(pw.worksessions)}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#00D09E',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 14
                      }}
                      onPress={() => handleStartSession(plan, pw.worksessions)}
                    >
                      <Ionicons name="play" size={13} color="#111" style={{ marginRight: 3 }} />
                      <Text style={{ color: '#111', fontWeight: 'bold', fontSize: 12 }}>Start</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                <Text style={{ color: '#666', fontSize: 13 }}>No worksessions attached to this plan yet.</Text>
              </View>
            )}

            {/* Plan Card Actions */}
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
                    setExpandedPlanId(plan.id);
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
          </View>
        )}

        {/* EDITING STATE */}
        {isEditing && (
          <View style={styles.editExercisesContainer}>
            {plan.plan_worksessions?.map((pw, index) => (
              <View key={pw.id} style={styles.exerciseEditRow}>
                {plan.schedule_type !== 'anchored' && (
                  <View style={styles.exerciseEditReorderArrows}>
                    <TouchableOpacity onPress={() => moveWorksessionInPlan(plan.id, index, 'up')} disabled={index === 0}>
                      <Ionicons name="chevron-up" size={24} color={index === 0 ? '#444' : '#00D09E'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => moveWorksessionInPlan(plan.id, index, 'down')} disabled={index === plan.plan_worksessions.length - 1}>
                      <Ionicons name="chevron-down" size={24} color={index === plan.plan_worksessions.length - 1 ? '#444' : '#00D09E'} />
                    </TouchableOpacity>
                  </View>
                )}
                <View style={{ flex: 1, paddingLeft: plan.schedule_type === 'anchored' ? 0 : 10 }}>
                  <Text style={styles.exerciseEditName}>{pw.worksessions?.name}</Text>
                  {plan.schedule_type === 'anchored' && (
                    <TouchableOpacity 
                      style={[styles.smallToggle, { alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#3A3A45', borderColor: '#4A4A55' }]}
                      onPress={() => {
                        setEditDayPwId(pw.id);
                        const parts = pw.day_name.split(' ');
                        setEditDaySelectedDay(parts[0] || 'Monday');
                        setEditDaySelectedTime(parts[1] || 'Any Time');
                        setIsEditDayModalVisible(true);
                      }}
                    >
                      <Text style={{ color: '#FFF', fontSize: 13, fontWeight: 'bold' }}>{pw.day_name}</Text>
                    </TouchableOpacity>
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

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 15, gap: 12 }}>
              <TouchableOpacity 
                style={[styles.startButton, { width: 120, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]} 
                onPress={() => setEditingPlanId(null)}
              >
                <Text style={[styles.startButtonText, { color: '#AAA' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.startButton, { width: 120, justifyContent: 'center', alignItems: 'center' }]} 
                onPress={() => saveEditPlan(plan.id)}
              >
                <Text style={styles.startButtonText}>Save Plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const ContentContainer = isEmbedded ? View : ScrollView;

  return (
    <View style={[styles.container, isEmbedded && { flex: 0, paddingBottom: 24 }]}>
      <View style={styles.tabContainer}>
        {['plans', 'worksessions', 'exercises'].map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons 
                name={tab === 'worksessions' ? 'flash-outline' : tab === 'exercises' ? 'barbell-outline' : 'layers-outline'} 
                size={14} 
                color={activeTab === tab ? '#2563EB' : '#64748B'} 
                style={{ marginRight: 5 }} 
              />
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'worksessions' ? 'Worksessions' : tab === 'exercises' ? 'Exercises' : 'Plans'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerContainer}><ActivityIndicator size="large" color="#2563EB" /></View>
      ) : (
        <ContentContainer style={styles.scrollContent} {...(!isEmbedded ? { keyboardShouldPersistTaps: 'handled' } : {})}>
          {/* PLANS TAB (Existing Plans & Direct Creation) */}
          {activeTab === 'plans' && (
            <View>
              {/* Existing Plans Section */}
              <View style={styles.existingSectionWrapper}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="layers-outline" size={16} color="#2563EB" />
                  <Text style={styles.sectionTitleText}>Existing Plans ({customPlans.length + standardPlans.length})</Text>
                </View>

                <View style={styles.simpleSectionList}>
                  {[...customPlans, ...standardPlans].map(plan => {
                    const isEditing = editingPlanId === plan.id;
                    return (
                      <View key={plan.id}>
                        <View style={[styles.simpleSectionCard, isEditing && styles.simpleSectionCardActive]}>
                          <View style={styles.simpleSectionContent}>
                            <Text style={styles.simpleSectionName}>{plan.name}</Text>
                            {plan.is_standard_template ? (
                              <View style={styles.badgeTemplate}>
                                <Text style={styles.badgeTemplateText}>Template</Text>
                              </View>
                            ) : null}
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <TouchableOpacity
                              style={[styles.simpleEditButton, isEditing && styles.simpleEditButtonActive]}
                              onPress={() => {
                                if (isEditing) {
                                  setEditingPlanId(null);
                                } else {
                                  if (plan.is_standard_template && !isAdmin) {
                                    handleCopyPlan(plan);
                                  } else {
                                    setEditingPlanId(plan.id);
                                    setEditPlanName(plan.name);
                                    setEditPlanGoal(plan.goal_category || '');
                                    setEditPlanIntensity(plan.intensity || '');
                                    setEditPlanSessions(plan.sessions_per_week?.toString() || '');
                                    setEditPlanDescription(plan.description || '');
                                  }
                                }
                              }}
                            >
                              <Ionicons 
                                name={isEditing ? "close-outline" : "create-outline"} 
                                size={14} 
                                color={isEditing ? "#FFFFFF" : "#2563EB"} 
                              />
                              <Text style={[styles.simpleEditButtonText, isEditing && { color: '#FFFFFF' }]}>
                                {isEditing ? "Cancel" : "Edit"}
                              </Text>
                            </TouchableOpacity>
                            {!plan.is_standard_template && (
                              <TouchableOpacity onPress={() => handleDeletePlan(plan.id)} style={{ padding: 6 }}>
                                <Ionicons name="trash-outline" size={16} color="#F43F5E" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>

                        {/* Inline Plan Editor if this plan is selected */}
                        {isEditing && (
                          <View style={[styles.createForm, { marginBottom: 14, borderColor: '#2563EB', borderWidth: 1.5 }]}>
                            <View style={styles.formHeader}>
                              <Text style={[styles.formTitle, { color: '#2563EB' }]}>Edit Plan: {plan.name}</Text>
                            </View>

                            <Text style={styles.label}>Plan Name</Text>
                            <TextInput
                              style={styles.input}
                              value={editPlanName}
                              onChangeText={setEditPlanName}
                              placeholderTextColor="#94A3B8"
                            />

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Goal</Text>
                                <TextInput
                                  style={styles.input}
                                  value={editPlanGoal}
                                  onChangeText={setEditPlanGoal}
                                  placeholderTextColor="#94A3B8"
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Intensity</Text>
                                <TextInput
                                  style={styles.input}
                                  value={editPlanIntensity}
                                  onChangeText={setEditPlanIntensity}
                                  placeholderTextColor="#94A3B8"
                                />
                              </View>
                              <View style={{ width: 68 }}>
                                <Text style={styles.label}>Days</Text>
                                <TextInput
                                  style={styles.input}
                                  value={editPlanSessions}
                                  onChangeText={setEditPlanSessions}
                                  keyboardType="numeric"
                                  placeholderTextColor="#94A3B8"
                                />
                              </View>
                            </View>

                            <Text style={styles.label}>Description</Text>
                            <TextInput
                              style={[styles.input, { height: 60 }]}
                              value={editPlanDescription}
                              onChangeText={setEditPlanDescription}
                              multiline
                              placeholderTextColor="#94A3B8"
                            />

                            <View style={{ marginTop: 8, marginBottom: 8 }}>
                              <Text style={styles.label}>Attached Worksessions ({plan.plan_worksessions?.length || 0})</Text>
                              {plan.plan_worksessions?.map((pw, index) => (
                                <View key={pw.id} style={styles.exerciseEditRow}>
                                  {plan.schedule_type !== 'anchored' && (
                                    <View style={styles.exerciseEditReorderArrows}>
                                      <TouchableOpacity onPress={() => moveWorksessionInPlan(plan.id, index, 'up')} disabled={index === 0}>
                                        <Ionicons name="chevron-up" size={22} color={index === 0 ? '#CBD5E1' : '#2563EB'} />
                                      </TouchableOpacity>
                                      <TouchableOpacity onPress={() => moveWorksessionInPlan(plan.id, index, 'down')} disabled={index === plan.plan_worksessions.length - 1}>
                                        <Ionicons name="chevron-down" size={22} color={index === plan.plan_worksessions.length - 1 ? '#CBD5E1' : '#2563EB'} />
                                      </TouchableOpacity>
                                    </View>
                                  )}
                                  <View style={{ flex: 1, paddingLeft: plan.schedule_type === 'anchored' ? 0 : 10 }}>
                                    <Text style={styles.exerciseEditName}>{pw.worksessions?.name || 'Worksession'}</Text>
                                    {plan.schedule_type === 'anchored' && (
                                      <TouchableOpacity 
                                        style={[styles.smallToggle, { alignSelf: 'flex-start', marginTop: 6, backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
                                        onPress={() => {
                                          setEditDayPwId(pw.id);
                                          const parts = (pw.day_name || 'Monday').split(' ');
                                          setEditDaySelectedDay(parts[0] || 'Monday');
                                          setEditDaySelectedTime(parts[1] || 'Any Time');
                                          setIsEditDayModalVisible(true);
                                        }}
                                      >
                                        <Text style={{ color: '#2563EB', fontSize: 12, fontWeight: 'bold' }}>{pw.day_name}</Text>
                                      </TouchableOpacity>
                                    )}
                                  </View>
                                  <TouchableOpacity onPress={() => handleRemoveWorksessionFromPlan(pw.id)} style={{ padding: 6 }}>
                                    <Ionicons name="trash-outline" size={20} color="#F43F5E" />
                                  </TouchableOpacity>
                                </View>
                              ))}

                              <TouchableOpacity 
                                style={styles.addExerciseBtn} 
                                onPress={() => { setActivePlanForWs(plan.id); setIsAddWsModalVisible(true); }}
                              >
                                <Ionicons name="add-circle-outline" size={18} color="#2563EB" />
                                <Text style={styles.addExerciseBtnText}>Attach Worksession</Text>
                              </TouchableOpacity>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                              <TouchableOpacity 
                                style={[styles.saveButton, { flex: 1, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' }]} 
                                onPress={() => setEditingPlanId(null)}
                              >
                                <Text style={[styles.saveButtonText, { color: '#64748B' }]}>Cancel</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={[styles.saveButton, { flex: 2 }]} 
                                onPress={() => saveEditPlan(plan.id)}
                              >
                                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                                <Text style={styles.saveButtonText}>Save Plan Changes</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                  {[...customPlans, ...standardPlans].length === 0 && (
                    <Text style={{ color: '#64748B', fontSize: 13, paddingVertical: 8 }}>No plans available.</Text>
                  )}
                </View>
              </View>

              {/* Option to Create New Plan */}
              <View style={styles.createForm}>
                <View style={styles.formHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.headerIconCircle, { backgroundColor: '#EFF6FF' }]}>
                      <Ionicons name="layers" size={17} color="#2563EB" />
                    </View>
                    <View>
                      <Text style={styles.formTitle}>New Plan</Text>
                      <Text style={styles.formSubtitle}>Design a multi-day or floating routine</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.label}>Plan Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Summer Shred"
                  placeholderTextColor="#94A3B8"
                  value={newPlanName}
                  onChangeText={setNewPlanName}
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Goal</Text>
                    <TextInput
                      style={styles.input}
                      value={newPlanGoal}
                      onChangeText={setNewPlanGoal}
                      placeholder="e.g. Strength"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Intensity</Text>
                    <TextInput
                      style={styles.input}
                      value={newPlanIntensity}
                      onChangeText={setNewPlanIntensity}
                      placeholder="e.g. Adv"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View style={{ width: 68 }}>
                    <Text style={styles.label}>Days</Text>
                    <TextInput
                      style={styles.input}
                      value={newPlanSessions}
                      onChangeText={setNewPlanSessions}
                      keyboardType="numeric"
                      placeholder="3"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, { height: 60 }]}
                  value={newPlanDescription}
                  onChangeText={setNewPlanDescription}
                  multiline
                  placeholder="Brief description..."
                  placeholderTextColor="#94A3B8"
                />
                
                <Text style={styles.label}>Schedule Type</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                  <TouchableOpacity
                    style={[styles.scheduleBtn, newPlanSchedule === 'anchored' && styles.scheduleBtnActive]}
                    onPress={() => setNewPlanSchedule('anchored')}
                  >
                    <Ionicons name="calendar-outline" size={15} color={newPlanSchedule === 'anchored' ? '#2563EB' : '#64748B'} style={{ marginRight: 6 }} />
                    <Text style={[styles.scheduleBtnText, newPlanSchedule === 'anchored' && styles.scheduleBtnTextActive]}>Anchored</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.scheduleBtn, newPlanSchedule === 'floating' && styles.scheduleBtnActive]}
                    onPress={() => setNewPlanSchedule('floating')}
                  >
                    <Ionicons name="swap-horizontal-outline" size={15} color={newPlanSchedule === 'floating' ? '#2563EB' : '#64748B'} style={{ marginRight: 6 }} />
                    <Text style={[styles.scheduleBtnText, newPlanSchedule === 'floating' && styles.scheduleBtnTextActive]}>Floating</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.saveButton, { marginTop: 6 }]}
                  onPress={handleCreatePlan}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveButtonText}>Save Plan</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* WORKSESSIONS TAB (Existing Worksessions & Direct Creation) */}
          {activeTab === 'worksessions' && (
            <View>
              {/* Existing Worksessions Section */}
              <View style={styles.existingSectionWrapper}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="barbell-outline" size={16} color="#2563EB" />
                  <Text style={styles.sectionTitleText}>Existing Worksessions ({worksessions.length})</Text>
                </View>

                <View style={styles.simpleSectionList}>
                  {worksessions.map(ws => {
                    const isBeingEdited = draftWsId === ws.id;
                    const isTemplate = !ws.user_id || ws.id?.startsWith('b0000001');
                    return (
                      <View key={ws.id} style={[styles.simpleSectionCard, isBeingEdited && styles.simpleSectionCardActive]}>
                        <View style={styles.simpleSectionContent}>
                          <Text style={styles.simpleSectionName}>{ws.name}</Text>
                          {isTemplate ? (
                            <View style={styles.badgeTemplate}>
                              <Text style={styles.badgeTemplateText}>Template</Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <TouchableOpacity
                            style={[styles.simpleEditButton, isBeingEdited && styles.simpleEditButtonActive]}
                            onPress={() => {
                              if (isBeingEdited) {
                                openFocusMode(null);
                              } else {
                                openFocusMode(ws);
                              }
                            }}
                          >
                            <Ionicons 
                              name={isBeingEdited ? "close-outline" : "create-outline"} 
                              size={14} 
                              color={isBeingEdited ? "#FFFFFF" : "#2563EB"} 
                            />
                            <Text style={[styles.simpleEditButtonText, isBeingEdited && { color: '#FFFFFF' }]}>
                              {isBeingEdited ? "Cancel" : "Edit"}
                            </Text>
                          </TouchableOpacity>
                          {(!isTemplate || isAdmin) && (
                            <TouchableOpacity onPress={() => handleDeleteWorksession(ws.id)} style={{ padding: 6 }}>
                              <Ionicons name="trash-outline" size={16} color="#F43F5E" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })}
                  {worksessions.length === 0 && (
                    <Text style={{ color: '#64748B', fontSize: 13, paddingVertical: 8 }}>No worksessions available.</Text>
                  )}
                </View>
              </View>

              {/* Worksession Create / Edit Form */}
              <View style={[styles.createForm, draftWsId && { borderColor: '#2563EB', borderWidth: 1.5 }]}>
                <View style={styles.formHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                        <Ionicons name="barbell" size={20} color="#2563EB" />
                      </View>
                      <View>
                        <Text style={styles.formTitle}>{draftWsId ? "Edit Worksession" : "New Worksession"}</Text>
                        <Text style={styles.formSubtitle}>{draftWsId ? `Editing: ${draftWsName || 'Routine'}` : "Build a standalone routine or session"}</Text>
                      </View>
                    </View>
                    {draftWsId && (
                      <TouchableOpacity
                        onPress={() => {
                          setDraftWsId(null);
                          setDraftWsName('');
                          setDraftWsModality(MODALITIES[0]);
                          setDraftExercises([]);
                        }}
                        style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F1F5F9' }}
                      >
                        <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <Text style={styles.label}>Worksession Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Pull Day & Core"
                  placeholderTextColor="#94A3B8"
                  value={draftWsName}
                  onChangeText={setDraftWsName}
                />

                <Text style={styles.label}>Modality</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalityScroll}>
                  {MODALITIES.map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.modalityPill, draftWsModality === m && styles.modalityPillActive]}
                      onPress={() => setDraftWsModality(m)}
                    >
                      <Text style={[styles.modalityText, draftWsModality === m && styles.modalityTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.draftExercisesContainer}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={[styles.label, { marginTop: 0, marginBottom: 0 }]}>Exercises ({draftExercises.length})</Text>
                    <TouchableOpacity
                      style={styles.addExerciseSmallBtn}
                      onPress={() => setIsExerciseModalVisible(true)}
                    >
                      <Ionicons name="add" size={16} color="#2563EB" />
                      <Text style={styles.addExerciseSmallBtnText}>Add Move</Text>
                    </TouchableOpacity>
                  </View>

                  {draftExercises.map((ex, index) => (
                    <View key={ex.id || index} style={styles.exerciseEditRow}>
                      <View style={styles.exerciseEditReorderArrows}>
                        <TouchableOpacity onPress={() => moveDraftExercise(index, 'up')} disabled={index === 0}>
                          <Ionicons name="chevron-up" size={22} color={index === 0 ? '#CBD5E1' : '#2563EB'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => moveDraftExercise(index, 'down')} disabled={index === draftExercises.length - 1}>
                          <Ionicons name="chevron-down" size={22} color={index === draftExercises.length - 1 ? '#CBD5E1' : '#2563EB'} />
                        </TouchableOpacity>
                      </View>

                      <View style={{ flex: 1, paddingLeft: 10 }}>
                        <Text style={styles.exerciseEditName}>{ex.exercises?.name || ex.name || 'Exercise'}</Text>
                        
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 6 }}>
                          <TouchableOpacity 
                            style={[styles.smallToggle, (!ex.tracking_type || ex.tracking_type === 'reps') && styles.smallToggleActive]}
                            onPress={() => {
                              const newDraft = [...draftExercises];
                              newDraft[index].tracking_type = 'reps';
                              setDraftExercises(newDraft);
                            }}>
                            <Text style={[styles.smallToggleText, (!ex.tracking_type || ex.tracking_type === 'reps') && styles.smallToggleTextActive]}>Reps</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.smallToggle, ex.tracking_type === 'time' && styles.smallToggleActive, { marginLeft: 6 }]}
                            onPress={() => {
                              const newDraft = [...draftExercises];
                              newDraft[index].tracking_type = 'time';
                              setDraftExercises(newDraft);
                            }}>
                            <Text style={[styles.smallToggleText, ex.tracking_type === 'time' && styles.smallToggleTextActive]}>Time</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {ex.tracking_type === 'time' ? (
                            <>
                              <TextInput 
                                style={styles.smallInput} 
                                value={ex.target_time?.toString() || '60'} 
                                keyboardType="numeric"
                                onChangeText={(text) => {
                                  const newDraft = [...draftExercises];
                                  newDraft[index].target_time = parseInt(text) || 0;
                                  setDraftExercises(newDraft);
                                }}
                              />
                              <Text style={{ color: '#64748B', marginHorizontal: 6, fontSize: 13, fontWeight: '500' }}>seconds</Text>
                            </>
                          ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                              <TextInput 
                                style={styles.smallInput} 
                                value={ex.target_sets?.toString() || '3'} 
                                keyboardType="numeric"
                                onChangeText={(text) => {
                                  const newDraft = [...draftExercises];
                                  newDraft[index].target_sets = parseInt(text) || 0;
                                  setDraftExercises(newDraft);
                                }}
                              />
                              <Text style={{ color: '#64748B', marginHorizontal: 4, fontSize: 13, fontWeight: '500' }}>sets x</Text>
                              <TextInput 
                                style={styles.smallInput} 
                                value={ex.target_reps?.toString() || '10'} 
                                keyboardType="numeric"
                                onChangeText={(text) => {
                                  const newDraft = [...draftExercises];
                                  newDraft[index].target_reps = parseInt(text) || 0;
                                  setDraftExercises(newDraft);
                                }}
                              />
                              <Text style={{ color: '#64748B', marginHorizontal: 4, fontSize: 13, fontWeight: '500' }}>reps</Text>
                              <Text style={{ color: '#2563EB', marginHorizontal: 4, fontWeight: '700' }}>@</Text>
                              <TextInput 
                                style={[styles.smallInput, { width: 48, color: '#2563EB', fontWeight: 'bold' }]} 
                                placeholder="kg"
                                placeholderTextColor="#94A3B8"
                                value={ex.target_load?.toString() || ''} 
                                keyboardType="numeric"
                                onChangeText={(text) => {
                                  const newDraft = [...draftExercises];
                                  newDraft[index].target_load = text;
                                  setDraftExercises(newDraft);
                                }}
                              />
                              <Text style={{ color: '#64748B', marginLeft: 4, fontSize: 13, fontWeight: '500' }}>kg</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <TouchableOpacity onPress={() => removeDraftExercise(index)} style={{ padding: 6 }}>
                        <Ionicons name="trash-outline" size={20} color="#F43F5E" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {draftExercises.length === 0 && (
                    <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed', marginBottom: 14 }}>
                      <Ionicons name="barbell-outline" size={26} color="#94A3B8" style={{ marginBottom: 6 }} />
                      <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center' }}>
                        No exercises added to sequence yet.
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity style={styles.addExerciseBtn} onPress={() => setIsExerciseModalVisible(true)}>
                    <Ionicons name="add" size={18} color="#2563EB" />
                    <Text style={styles.addExerciseBtnText}>Add Exercise</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.saveButton, { marginTop: 6 }]}
                  onPress={saveFocusMode}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveButtonText}>{draftWsId ? "Save Worksession Changes" : "Save Worksession"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* EXERCISES TAB (Existing Exercises & Direct Creation) */}
          {activeTab === 'exercises' && (
            <View>
              {/* Existing Exercises Section */}
              <View style={styles.existingSectionWrapper}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="fitness-outline" size={16} color="#2563EB" />
                  <Text style={styles.sectionTitleText}>Existing Exercises ({exercisesList.length})</Text>
                </View>

                <View style={styles.exerciseSearchContainer}>
                  <Ionicons name="search" size={16} color="#94A3B8" />
                  <TextInput
                    style={styles.exerciseSearchInput}
                    placeholder="Search existing exercises to edit..."
                    placeholderTextColor="#94A3B8"
                    value={globalExerciseSearchQuery}
                    onChangeText={setGlobalExerciseSearchQuery}
                  />
                  {globalExerciseSearchQuery ? (
                    <TouchableOpacity onPress={() => setGlobalExerciseSearchQuery('')}>
                      <Ionicons name="close-circle" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={styles.simpleSectionList}>
                  {(() => {
                    const q = globalExerciseSearchQuery.trim().toLowerCase();
                    const filtered = q
                      ? exercisesList.filter(e => e.name.toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q) || (e.muscle_group || '').toLowerCase().includes(q) || (e.equipment || '').toLowerCase().includes(q))
                      : (showAllExercises ? exercisesList : exercisesList.slice(0, 8));

                    return (
                      <>
                        {filtered.map(ex => {
                          const isBeingEdited = editingExerciseId === ex.id;
                          const isCustom = Boolean(ex.user_id && !ex.is_default);
                          return (
                            <View key={ex.id} style={[styles.simpleSectionCard, isBeingEdited && styles.simpleSectionCardActive]}>
                              <View style={styles.simpleSectionContent}>
                                <Text style={styles.simpleSectionName}>{ex.name}</Text>
                                {isCustom ? (
                                  <View style={[styles.badgeTemplate, { backgroundColor: '#FEF3C7' }]}>
                                    <Text style={[styles.badgeTemplateText, { color: '#D97706' }]}>Custom</Text>
                                  </View>
                                ) : null}
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <TouchableOpacity
                                  style={[styles.simpleEditButton, isBeingEdited && styles.simpleEditButtonActive]}
                                  onPress={() => {
                                    if (isBeingEdited) {
                                      setEditingExerciseId(null);
                                      setNewExerciseName('');
                                      setNewExerciseCategory('Chest');
                                      setNewExerciseEquipment('Bodyweight');
                                      setNewExerciseVideoUrl('');
                                      setIsDefaultExercise(false);
                                    } else {
                                      setEditingExerciseId(ex.id);
                                      setNewExerciseName(ex.name);
                                      setNewExerciseCategory(ex.category || ex.muscle_group || 'Chest');
                                      setNewExerciseEquipment(ex.equipment || 'Bodyweight');
                                      setNewExerciseVideoUrl(ex.video_url || '');
                                      setIsDefaultExercise(Boolean(ex.is_default));
                                    }
                                  }}
                                >
                                  <Ionicons 
                                    name={isBeingEdited ? "close-outline" : "create-outline"} 
                                    size={14} 
                                    color={isBeingEdited ? "#FFFFFF" : "#2563EB"} 
                                  />
                                  <Text style={[styles.simpleEditButtonText, isBeingEdited && { color: '#FFFFFF' }]}>
                                    {isBeingEdited ? "Cancel" : "Edit"}
                                  </Text>
                                </TouchableOpacity>
                                {(isCustom || isAdmin) && (
                                  <TouchableOpacity onPress={() => handleDeleteExercise(ex)} style={{ padding: 6 }}>
                                    <Ionicons name="trash-outline" size={16} color="#F43F5E" />
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          );
                        })}

                        {!q && exercisesList.length > 8 && (
                          <TouchableOpacity
                            style={styles.showMoreBtn}
                            onPress={() => setShowAllExercises(!showAllExercises)}
                          >
                            <Text style={styles.showMoreBtnText}>
                              {showAllExercises ? "Show Less" : `Show All ${exercisesList.length} Exercises`}
                            </Text>
                            <Ionicons name={showAllExercises ? "chevron-up" : "chevron-down"} size={14} color="#2563EB" />
                          </TouchableOpacity>
                        )}
                      </>
                    );
                  })()}
                  {exercisesList.length === 0 && (
                    <Text style={{ color: '#64748B', fontSize: 13, paddingVertical: 8 }}>No exercises available.</Text>
                  )}
                </View>
              </View>

              {/* Exercise Create / Edit Form */}
              <View style={[styles.createForm, editingExerciseId && { borderColor: '#2563EB', borderWidth: 1.5 }]}>
                <View style={styles.formHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                        <Ionicons name="fitness" size={20} color="#2563EB" />
                      </View>
                      <View>
                        <Text style={styles.formTitle}>{editingExerciseId ? "Edit Exercise" : "New Exercise"}</Text>
                        <Text style={styles.formSubtitle}>{editingExerciseId ? `Editing: ${newExerciseName || 'Exercise'}` : "Add a custom exercise to your library"}</Text>
                      </View>
                    </View>
                    {editingExerciseId && (
                      <TouchableOpacity
                        onPress={() => {
                          setEditingExerciseId(null);
                          setNewExerciseName('');
                          setNewExerciseCategory('Chest');
                          setNewExerciseEquipment('Bodyweight');
                          setNewExerciseVideoUrl('');
                          setIsDefaultExercise(false);
                        }}
                        style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F1F5F9' }}
                      >
                        <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <Text style={styles.label}>Exercise Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Incline Dumbbell Bench Press"
                  placeholderTextColor="#94A3B8"
                  value={newExerciseName}
                  onChangeText={setNewExerciseName}
                />
                
                <Text style={styles.label}>Muscle Group</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  {MUSCLE_OPTIONS.map(m => (
                    <TouchableOpacity 
                      key={m} 
                      style={[styles.smallPill, newExerciseCategory === m && styles.smallPillActive]}
                      onPress={() => setNewExerciseCategory(m)}
                    >
                      <Text style={[styles.smallPillText, newExerciseCategory === m && styles.smallPillTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TextInput
                  style={[styles.input, { marginBottom: 14 }]}
                  placeholder="Or custom muscle group..."
                  placeholderTextColor="#94A3B8"
                  value={newExerciseCategory}
                  onChangeText={setNewExerciseCategory}
                />

                <Text style={styles.label}>Equipment</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  {EQUIPMENT_OPTIONS.map(eq => (
                    <TouchableOpacity 
                      key={eq} 
                      style={[styles.smallPill, newExerciseEquipment === eq && styles.smallPillActive]}
                      onPress={() => setNewExerciseEquipment(eq)}
                    >
                      <Text style={[styles.smallPillText, newExerciseEquipment === eq && styles.smallPillTextActive]}>{eq}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TextInput
                  style={[styles.input, { marginBottom: 14 }]}
                  placeholder="Or custom equipment..."
                  placeholderTextColor="#94A3B8"
                  value={newExerciseEquipment}
                  onChangeText={setNewExerciseEquipment}
                />

                <Text style={[styles.label, { marginBottom: 4, marginTop: 4 }]}>Bunny.net Video Demo URL (Optional):</Text>
                <TextInput 
                  style={[styles.input, { marginBottom: 14 }]} 
                  placeholder="e.g., https://vz-xxxx.b-cdn.net/VIDEO_ID/playlist.m3u8" 
                  placeholderTextColor="#94A3B8" 
                  value={newExerciseVideoUrl} 
                  onChangeText={setNewExerciseVideoUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {isAdmin && (
                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18, marginTop: 6 }}
                    onPress={() => setIsDefaultExercise(!isDefaultExercise)}
                  >
                    <Ionicons 
                      name={isDefaultExercise ? "checkbox" : "square-outline"} 
                      size={22} 
                      color={isDefaultExercise ? "#2563EB" : "#94A3B8"} 
                    />
                    <Text style={{ color: '#0F172A', marginLeft: 8, fontSize: 14, fontWeight: '500' }}>
                      Make default for all users (Global Library)
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.saveButton, { marginTop: 8 }]}
                  onPress={handleCreateExercise}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveButtonText}>{editingExerciseId ? "Save Exercise Changes" : "Save Exercise"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ContentContainer>
      )}

      {/* Exercise Selection Modal */}
      <Modal visible={isExerciseModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.exerciseModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Exercise</Text>
              <TouchableOpacity onPress={() => { setIsExerciseModalVisible(false); setExerciseSearchQuery(''); }}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { marginHorizontal: 20, marginBottom: 12 }]}
              placeholder="Search by name, muscle, equipment..."
              placeholderTextColor="#94A3B8"
              value={exerciseSearchQuery}
              onChangeText={setExerciseSearchQuery}
            />

            {/* Toggle Sort: Category vs Muscle vs Equipment in Worksession Modal */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 20, alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>FILTER BY:</Text>
              <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <TouchableOpacity 
                  style={[styles.smallToggle, pickerSortMode === 'category' && styles.smallToggleActive]}
                  onPress={() => { setPickerSortMode('category'); setSelectedExerciseFilter('All'); }}
                >
                  <Text style={[styles.smallToggleText, pickerSortMode === 'category' && styles.smallToggleTextActive]}>Category</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.smallToggle, pickerSortMode === 'muscle' && styles.smallToggleActive]}
                  onPress={() => { setPickerSortMode('muscle'); setSelectedExerciseFilter('All'); }}
                >
                  <Text style={[styles.smallToggleText, pickerSortMode === 'muscle' && styles.smallToggleTextActive]}>Muscle</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.smallToggle, pickerSortMode === 'equipment' && styles.smallToggleActive]}
                  onPress={() => { setPickerSortMode('equipment'); setSelectedExerciseFilter('All'); }}
                >
                  <Text style={[styles.smallToggleText, pickerSortMode === 'equipment' && styles.smallToggleTextActive]}>Equipment</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.filterScrollContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['All', ...(pickerSortMode === 'category' ? CATEGORY_OPTIONS : pickerSortMode === 'equipment' ? EQUIPMENT_OPTIONS : MUSCLE_OPTIONS)].map(cat => (
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
                .filter(e => {
                  if (selectedExerciseFilter === 'All') return true;
                  if (pickerSortMode === 'category') {
                    return (e.category || 'Other') === selectedExerciseFilter;
                  }
                  if (pickerSortMode === 'equipment') {
                    return getExerciseEquipment(e) === selectedExerciseFilter;
                  }
                  return getExerciseMuscleGroup(e) === selectedExerciseFilter;
                })
                .filter(e => {
                  const q = exerciseSearchQuery.toLowerCase();
                  return e.name.toLowerCase().includes(q) || 
                         getExerciseMuscleGroup(e).toLowerCase().includes(q) || 
                         getExerciseEquipment(e).toLowerCase().includes(q);
                })
                .map(ex => (
                <TouchableOpacity key={ex.id} style={styles.exerciseListItem} onPress={() => handleAddExerciseToDraft(ex.id)}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={styles.exerciseListItemName}>{ex.name}</Text>
                      {ex.user_id && !ex.is_default && (
                        <View style={[styles.metadataBadge, { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }]}>
                          <Text style={[styles.metadataText, { color: '#D97706', fontSize: 10 }]}>Custom</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, alignItems: 'center' }}>
                      <Text style={{ color: '#2563EB', fontSize: 12, fontWeight: '600' }}>💪 {getExerciseMuscleGroup(ex)}</Text>
                      <Text style={{ color: '#CBD5E1', fontSize: 11 }}>•</Text>
                      <Text style={{ color: '#475569', fontSize: 12, fontWeight: '600' }}>⚙️ {getExerciseEquipment(ex)}</Text>
                    </View>
                  </View>
                  <Ionicons name="add-circle" size={24} color="#2563EB" />
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
              <TouchableOpacity onPress={() => { setIsAddWsModalVisible(false); setSelectedWsIdForAttach(null); setNewWsName(''); }}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={[styles.exerciseListScroll, { maxHeight: 200, marginBottom: 15 }]}>
              <Text style={[styles.label, { marginBottom: 10 }]}>Your Worksessions</Text>
              {worksessions.map(ws => (
                <TouchableOpacity 
                  key={ws.id} 
                  style={[styles.exerciseListItem, selectedWsIdForAttach === ws.id && { borderColor: '#2563EB', borderWidth: 1.5, backgroundColor: '#EFF6FF' }]} 
                  onPress={() => {
                    setSelectedWsIdForAttach(ws.id);
                    setNewWsName('');
                  }}
                >
                  <View>
                    <Text style={styles.exerciseListItemName}>{ws.name}</Text>
                    <Text style={styles.exerciseListItemCategory}>{ws.modality}</Text>
                  </View>
                  {selectedWsIdForAttach === ws.id && <Ionicons name="checkmark-circle" size={22} color="#2563EB" />}
                </TouchableOpacity>
              ))}
              {worksessions.length === 0 && <Text style={{ color: '#64748B', fontSize: 13, fontStyle: 'italic' }}>No worksessions available.</Text>}
            </ScrollView>

            <View style={{ marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 15 }}>
              <Text style={styles.label}>Or Create & Attach New Worksession</Text>
              <TextInput 
                style={styles.input} 
                placeholder="New Worksession Name" 
                placeholderTextColor="#94A3B8" 
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
                <View style={{ marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 15 }}>
                  <Text style={styles.label}>Select Day</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
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
                  <Text style={styles.label}>Select Time (Optional)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['Any Time', 'AM', 'PM'].map(time => (
                      <TouchableOpacity 
                        key={time} 
                        style={[styles.filterPill, selectedTimeForAnchored === time && styles.filterPillActive]} 
                        onPress={() => setSelectedTimeForAnchored(time)}
                      >
                        <Text style={[styles.filterText, selectedTimeForAnchored === time && styles.filterTextActive]}>{time}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : null;
            })()}
            
            <TouchableOpacity style={styles.saveButton} onPress={handleFinalAddWorksession}>
              <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveButtonText}>Add Worksession to Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isEditDayModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.exerciseModalContent, { height: 'auto', paddingBottom: 40 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Day</Text>
              <TouchableOpacity onPress={() => setIsEditDayModalVisible(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.label}>Select Day</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <TouchableOpacity 
                    key={day} 
                    style={[styles.filterPill, editDaySelectedDay === day && styles.filterPillActive]} 
                    onPress={() => setEditDaySelectedDay(day)}
                  >
                    <Text style={[styles.filterText, editDaySelectedDay === day && styles.filterTextActive]}>{day}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.label}>Select Time (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['Any Time', 'AM', 'PM'].map(time => (
                  <TouchableOpacity 
                    key={time} 
                    style={[styles.filterPill, editDaySelectedTime === time && styles.filterPillActive]} 
                    onPress={() => setEditDaySelectedTime(time)}
                  >
                    <Text style={[styles.filterText, editDaySelectedTime === time && styles.filterTextActive]}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={() => {
                const timeSuffix = editDaySelectedTime === 'Any Time' ? '' : ` ${editDaySelectedTime}`;
                updateWorksessionDay(editDayPwId, `${editDaySelectedDay}${timeSuffix}`);
              }}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveButtonText}>Save Day</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    backgroundColor: KinetixTheme.colors.background,
  },
  tabContainer: { 
    flexDirection: 'row', 
    marginHorizontal: 16, 
    marginTop: 14, 
    marginBottom: 16, 
    backgroundColor: '#E2E8F0', 
    borderRadius: 12, 
    padding: 4,
  },
  tab: { 
    flex: 1, 
    paddingVertical: 10, 
    alignItems: 'center', 
    borderRadius: 9,
  },
  activeTab: { 
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { 
    color: '#64748B', 
    fontWeight: '600', 
    fontSize: 13,
  },
  activeTabText: { 
    color: '#2563EB', 
    fontWeight: 'bold',
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: KinetixTheme.colors.background,
  },
  scrollContent: { 
    flex: 1, 
    paddingHorizontal: 16,
  },
  createButton: { 
    flexDirection: 'row', 
    backgroundColor: '#2563EB', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 20,
    ...KinetixTheme.shadows.card,
  },
  createButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginLeft: 8,
  },
  createForm: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 18, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...KinetixTheme.shadows.card,
  },
  formHeader: { 
    marginBottom: 16,
  },
  formTitle: { 
    color: '#0F172A', 
    fontSize: 18, 
    fontWeight: 'bold',
  },
  formSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 2,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { 
    color: '#475569', 
    fontSize: 13, 
    fontWeight: '600',
    marginBottom: 6, 
    marginTop: 10,
  },
  input: { 
    backgroundColor: '#F8FAFC', 
    color: '#0F172A', 
    paddingHorizontal: 14, 
    paddingVertical: 12, 
    borderRadius: 10, 
    fontSize: 15, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    marginBottom: 8,
  },
  smallInput: { 
    backgroundColor: '#FFFFFF', 
    color: '#0F172A', 
    paddingHorizontal: 6, 
    paddingVertical: 6, 
    borderRadius: 8, 
    fontSize: 13, 
    borderWidth: 1, 
    borderColor: '#CBD5E1', 
    minWidth: 42, 
    textAlign: 'center',
    fontWeight: '600',
  },
  modalityScroll: { 
    marginBottom: 16,
  },
  modalityPill: { 
    backgroundColor: '#F1F5F9', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20, 
    marginRight: 8, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
  },
  modalityPillActive: { 
    backgroundColor: '#EFF6FF', 
    borderColor: '#2563EB',
  },
  modalityText: { 
    color: '#64748B', 
    fontWeight: '500',
    fontSize: 13,
  },
  modalityTextActive: { 
    color: '#2563EB', 
    fontWeight: 'bold',
  },
  saveButton: { 
    flexDirection: 'row',
    backgroundColor: '#2563EB', 
    paddingVertical: 14, 
    paddingHorizontal: 20, 
    borderRadius: 12, 
    alignItems: 'center',
    justifyContent: 'center',
    ...KinetixTheme.shadows.card,
  },
  saveButtonText: { 
    color: '#FFFFFF', 
    fontSize: 15, 
    fontWeight: 'bold',
  },
  scheduleBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 9,
  },
  scheduleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  scheduleBtnText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 13,
  },
  scheduleBtnTextActive: {
    color: '#2563EB',
    fontWeight: 'bold',
  },
  planList: { paddingBottom: 40 },
  planCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 14, 
    padding: 16, 
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...KinetixTheme.shadows.card,
  },
  planHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12,
  },
  planName: { 
    color: '#0F172A', 
    fontSize: 17, 
    fontWeight: 'bold', 
    flex: 1,
  },
  startButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#2563EB', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20, 
    marginLeft: 10,
  },
  startButtonText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold', 
    marginRight: 4, 
    fontSize: 13,
  },
  exerciseSummaryList: { marginTop: 4 },
  exerciseSummaryText: { color: '#64748B', fontSize: 13, marginBottom: 3 },
  editExercisesContainer: { 
    marginTop: 14, 
    borderTopWidth: 1, 
    borderTopColor: '#E2E8F0', 
    paddingTop: 10,
  },
  exerciseEditRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  exerciseEditReorderArrows: { 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingRight: 10, 
    borderRightWidth: 1, 
    borderRightColor: '#E2E8F0',
  },
  exerciseEditName: { color: '#0F172A', fontSize: 15, fontWeight: '600' },
  exerciseEditDetails: { color: '#64748B', fontSize: 12, marginTop: 3 },
  addExerciseBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#EFF6FF', 
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 12, 
    borderRadius: 10, 
    marginTop: 10,
  },
  addExerciseBtnText: { color: '#2563EB', fontWeight: 'bold', marginLeft: 6, fontSize: 14 },
  addExerciseSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addExerciseSmallBtnText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 10, alignItems: 'center' },
  actionIcon: { padding: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'flex-end' },
  exerciseModalContent: { 
    backgroundColor: '#FFFFFF', 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    height: '82%', 
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { color: '#0F172A', fontSize: 18, fontWeight: 'bold' },
  filterScrollContainer: { marginBottom: 12 },
  filterPill: { 
    paddingHorizontal: 14, 
    paddingVertical: 7, 
    backgroundColor: '#F1F5F9', 
    borderRadius: 20, 
    marginRight: 8, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
  },
  filterPillActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  filterText: { color: '#64748B', fontWeight: '500', fontSize: 12 },
  filterTextActive: { color: '#2563EB', fontWeight: 'bold' },
  exerciseListScroll: { flex: 1 },
  exerciseListItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC', 
    padding: 14, 
    borderRadius: 12, 
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  exerciseListItemName: { color: '#0F172A', fontSize: 15, fontWeight: 'bold' },
  exerciseListItemCategory: { color: '#64748B', fontSize: 12, marginTop: 3 },
  focusContainer: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: 50 },
  metadataBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  metadataText: { color: '#2563EB', fontSize: 11, fontWeight: 'bold' },
  editRow: { flexDirection: 'row', alignItems: 'center' },
  editLabel: { color: '#64748B', fontSize: 13, width: 75, fontWeight: 'bold' },
  editInput: { flex: 1, marginBottom: 0, padding: 8 },
  focusHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingBottom: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0',
  },
  focusCancelText: { color: '#F43F5E', fontSize: 15, fontWeight: '500' },
  focusSaveText: { color: '#2563EB', fontSize: 15, fontWeight: 'bold' },
  focusTitle: { color: '#0F172A', fontSize: 18, fontWeight: 'bold' },
  focusContent: { flex: 1, padding: 20 },
  draftExercisesContainer: { marginTop: 16, paddingBottom: 40 },
  smallToggle: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8, 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#CBD5E1',
  },
  smallToggleActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  smallToggleText: { color: '#64748B', fontSize: 12, fontWeight: '500' },
  smallToggleTextActive: { color: '#2563EB', fontWeight: 'bold' },
  sortBarContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 },
  sortBarLabel: { color: '#64748B', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
  sortSegmentGroup: { 
    flexDirection: 'row', 
    backgroundColor: '#F1F5F9', 
    borderRadius: 8, 
    padding: 3, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
  },
  sortSegment: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  sortSegmentActive: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  sortSegmentText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  sortSegmentTextActive: { color: '#2563EB', fontWeight: 'bold' },
  smallPill: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    backgroundColor: '#F1F5F9', 
    borderRadius: 16, 
    marginRight: 8, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
  },
  smallPillActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  smallPillText: { color: '#64748B', fontSize: 12, fontWeight: '500' },
  smallPillTextActive: { color: '#2563EB', fontWeight: 'bold' },
  existingSectionWrapper: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  simpleSectionList: {
    gap: 8,
  },
  simpleSectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    ...KinetixTheme.shadows.card,
  },
  simpleSectionCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#F8FAFC',
  },
  simpleSectionContent: {
    flex: 1,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  simpleSectionName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  badgeTemplate: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  badgeTemplateText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  simpleEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  simpleEditButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  simpleEditButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 4,
    marginBottom: 6,
  },
  showMoreBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  exerciseSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  exerciseSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  }
});
