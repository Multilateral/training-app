import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { KinetixTheme } from '../constants/theme';
import KinetixHeader from './KinetixHeader';
import KinetixBottomNav from './KinetixBottomNav';
import PlanBuilder from './PlanBuilder';
import ExerciseVideoModal from './ExerciseVideoModal';
import { TrainingContext, supabase } from '../context/TrainingContext';
import {
  getExerciseInstructions,
  getExerciseDescription,
  getExerciseDifficulty,
  getExerciseMechanics,
  getExerciseVideoUrl,
  getExerciseVideoThumbnail,
  getExerciseTrackingType,
} from '../data/recoveryMetadata';
import {
  DATABASE_WORKSESSIONS,
  DATABASE_PLANS,
  DatabaseWorksessionCard,
  DatabasePlan,
} from '../data/databaseLibraryData';

export interface DatabaseExercise {
  id: string;
  name: string;
  category: string;
  equipment?: string;
  muscle_group?: string;
  instructions?: string;
  description?: string;
  difficulty?: string;
  mechanics?: string;
  video_url?: string;
  video_thumbnail_url?: string;
  is_default?: boolean;
  tracking_type?: string;
}

type TrackMode = 'workout' | 'rehab' | 'exercises' | 'edit';

export default function KinetixLibrary() {
  const router = useRouter();
  const { setActiveSessionMetadata, session } = useContext(TrainingContext) || {};
  const [selectedTrack, setSelectedTrack] = useState<TrackMode>('workout');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);

  // Worksessions & Plans from database (initialized with full database export)
  const [worksessions, setWorksessions] = useState<DatabaseWorksessionCard[]>(DATABASE_WORKSESSIONS);
  const [plans, setPlans] = useState<DatabasePlan[]>(DATABASE_PLANS);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Exercises from Database
  const [dbExercises, setDbExercises] = useState<DatabaseExercise[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [selectedVideoExercise, setSelectedVideoExercise] = useState<DatabaseExercise | null>(null);

  // Fetch exercises and any newly updated worksessions/plans from Supabase on mount
  useEffect(() => {
    let isMounted = true;

    const loadLiveContent = async () => {
      // 1. Load exercises from cache or fetch live
      try {
        if (!(Platform.OS === 'web' && typeof window === 'undefined')) {
          const cached = await AsyncStorage.getItem('@cached_db_exercises');
          if (cached && isMounted) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setDbExercises(parsed);
            }
          }
        }
      } catch (e) {}

      try {
        setIsLoadingExercises(true);
        const { data: exercisesData, error: exError } = await supabase
          .from('exercises')
          .select('*')
          .order('name');

        if (!exError && exercisesData && isMounted) {
          setDbExercises(exercisesData);
          if (!(Platform.OS === 'web' && typeof window === 'undefined')) {
            await AsyncStorage.setItem('@cached_db_exercises', JSON.stringify(exercisesData)).catch(() => {});
          }
        }
      } catch (err) {
        console.error('[KinetixLibrary] Error fetching exercises:', err);
      } finally {
        if (isMounted) setIsLoadingExercises(false);
      }

      // 2. Fetch live worksessions if authenticated
      if (session?.user?.id) {
        try {
          const { data: userWs, error: wsErr } = await supabase
            .from('worksessions')
            .select(`
              id, name, modality, description, created_at,
              worksession_exercises (
                id, target_sets, target_reps, tracking_type, target_time, notes,
                exercises (id, name, category, equipment, muscle_group, instructions, difficulty, mechanics)
              )
            `)
            .order('created_at', { ascending: false });

          if (!wsErr && userWs && isMounted) {
            // merge user worksessions with standard database worksessions
            const mappedUserWs: DatabaseWorksessionCard[] = userWs.map((ws: any) => {
              const existing = DATABASE_WORKSESSIONS.find((d) => d.id === ws.id);
              if (existing) return existing;

              const isRehab =
                (ws.name || '').toLowerCase().includes('rehab') ||
                (ws.name || '').toLowerCase().includes('recovery') ||
                (ws.modality || '').toLowerCase().includes('rehab');

              const exercises = (ws.worksession_exercises || []).map((we: any) => ({
                name: we.exercises?.name || 'Exercise',
                cue: we.notes || we.exercises?.instructions || 'Controlled execution.',
                sets: we.target_sets || 3,
                reps: we.tracking_type === 'time' ? `${we.target_time || 45}s` : String(we.target_reps || 10),
                weight: 'Standard',
                restSeconds: 60,
                tracking_type: we.tracking_type || 'reps_weight',
                equipment: we.exercises?.equipment || 'Bodyweight',
                muscle_group: we.exercises?.muscle_group || 'General',
                difficulty: we.exercises?.difficulty || 'Intermediate',
                mechanics: we.exercises?.mechanics || 'Compound',
              }));

              const totalSets = exercises.reduce((acc: number, e: any) => acc + (e.sets || 3), 0);
              return {
                id: ws.id,
                type: isRehab ? 'rehab' : 'workout',
                category: ws.modality || (isRehab ? 'Clinical Rehab' : 'Strength & Power'),
                title: ws.name,
                filterTag: isRehab ? 'knee' : 'core',
                description: ws.description || '',
                metrics: {
                  duration: `${Math.max(15, exercises.length * 8)} min`,
                  sets: `${totalSets} Sets`,
                  reps: exercises[0] ? String(exercises[0].reps) : '8-12',
                  load: isRehab ? 'Light' : 'Moderate',
                },
                exercises,
              };
            });

            // Combine unique by id
            const existingIds = new Set(mappedUserWs.map((w) => w.id));
            const merged = [...mappedUserWs, ...DATABASE_WORKSESSIONS.filter((w) => !existingIds.has(w.id))];
            setWorksessions(merged);
          }
        } catch (e) {
          console.error('[KinetixLibrary] Error fetching user worksessions:', e);
        }

        // 3. Fetch live training plans if authenticated
        try {
          const { data: userPlans, error: planErr } = await supabase
            .from('training_plans')
            .select(`
              id, name, schedule_type, goal_category, description, is_standard_template,
              plan_worksessions (
                day_name, worksession_id,
                worksessions (id, name, modality, description)
              )
            `)
            .order('created_at', { ascending: false });

          if (!planErr && userPlans && isMounted) {
            const mappedUserPlans: DatabasePlan[] = userPlans.map((p: any) => {
              const existing = DATABASE_PLANS.find((dp) => dp.id === p.id);
              if (existing) return existing;

              return {
                id: p.id,
                name: p.name,
                schedule_type: p.schedule_type || 'floating',
                goal_category: p.goal_category || 'General',
                description: p.description || '',
                is_standard_template: p.is_standard_template || false,
                worksessions: (p.plan_worksessions || []).map((pw: any) => ({
                  dayName: pw.day_name || 'Day',
                  worksessionId: pw.worksession_id,
                  worksessionName: pw.worksessions?.name || 'Session',
                  modality: pw.worksessions?.modality || 'General',
                  exerciseCount: 3,
                  worksession: null,
                })),
              };
            });

            const existingPlanIds = new Set(mappedUserPlans.map((p) => p.id));
            const mergedPlans = [...mappedUserPlans, ...DATABASE_PLANS.filter((p) => !existingPlanIds.has(p.id))];
            setPlans(mergedPlans);
          }
        } catch (pe) {
          console.error('[KinetixLibrary] Error fetching user training plans:', pe);
        }
      }
    };

    loadLiveContent();

    return () => {
      isMounted = false;
    };
  }, [session, selectedTrack]);

  // Filter chips for Workouts track
  const workoutFilterChips: { id: string; label: string }[] = [
    { id: 'all', label: 'All Workouts' },
    { id: 'plans', label: 'Workout Plans' },
    { id: 'core', label: 'Core & Power' },
    { id: 'upper', label: 'Chest, Arms & Back' },
    { id: 'knee', label: 'Legs & Plyo' },
  ];

  // Filter chips for Rehab track
  const rehabFilterChips: { id: string; label: string }[] = [
    { id: 'all', label: 'All Protocols' },
    { id: 'plans', label: 'Rehab Plans' },
    { id: 'knee', label: 'Knee & Tendon' },
    { id: 'shoulder', label: 'Shoulder & Cuff' },
    { id: 'core', label: 'Lower Back McGill' },
  ];

  // Filter chips for Exercises track
  const exerciseChips: { id: string; label: string }[] = [
    { id: 'all', label: `All (${dbExercises.length || 111})` },
    { id: 'core', label: 'Core' },
    { id: 'legs', label: 'Knee & Legs' },
    { id: 'shoulder', label: 'Shoulder' },
    { id: 'upper', label: 'Upper Body' },
    { id: 'rehab', label: 'Rehab & Recovery' },
    { id: 'trx', label: 'TRX' },
    { id: 'kettlebell', label: 'Kettlebell' },
    { id: 'floor', label: 'Floor Mat & Yoga' },
    { id: 'weights', label: 'Dumbbell & Barbell' },
  ];

  // Filter worksessions based on active track, filter chip, and search query
  const filteredWorksessions = worksessions.filter((ws) => {
    if (ws.type !== selectedTrack) return false;
    if (activeFilter === 'plans') return false; // Handled separately in plans section

    if (activeFilter !== 'all') {
      if (ws.filterTag !== activeFilter) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = ws.title.toLowerCase().includes(q);
      const catMatch = ws.category.toLowerCase().includes(q);
      const descMatch = (ws.description || '').toLowerCase().includes(q);
      const exMatch = ws.exercises.some((e) => e.name.toLowerCase().includes(q));
      return titleMatch || catMatch || descMatch || exMatch;
    }

    return true;
  });

  // Filter plans based on track
  const filteredPlans = plans.filter((plan) => {
    const isRehabPlan =
      plan.name.toLowerCase().includes('rehab') ||
      plan.name.toLowerCase().includes('recovery') ||
      plan.goal_category?.toLowerCase().includes('rehab');

    if (selectedTrack === 'rehab' && !isRehabPlan) return false;
    if (selectedTrack === 'workout' && isRehabPlan) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = plan.name.toLowerCase().includes(q);
      const goalMatch = (plan.goal_category || '').toLowerCase().includes(q);
      const wsMatch = plan.worksessions.some((w) => w.worksessionName.toLowerCase().includes(q));
      return nameMatch || goalMatch || wsMatch;
    }

    return true;
  });

  // Filter database exercises
  const filteredExercises = dbExercises.filter((ex) => {
    const nameLower = (ex.name || '').toLowerCase();
    const catLower = (ex.category || '').toLowerCase();
    const equipLower = (ex.equipment || '').toLowerCase();
    const muscleLower = (ex.muscle_group || '').toLowerCase();
    const instLower = (ex.instructions || '').toLowerCase();

    if (activeFilter !== 'all') {
      switch (activeFilter) {
        case 'core':
          if (catLower !== 'core' && !muscleLower.includes('core') && !muscleLower.includes('abdominis') && !muscleLower.includes('obliques')) {
            return false;
          }
          break;
        case 'legs':
          if (
            catLower !== 'legs' &&
            equipLower !== 'plyo box' &&
            !muscleLower.includes('legs') &&
            !muscleLower.includes('knee') &&
            !muscleLower.includes('hamstring') &&
            !muscleLower.includes('quadriceps') &&
            !muscleLower.includes('glute') &&
            !muscleLower.includes('ankle') &&
            !muscleLower.includes('achilles')
          ) {
            return false;
          }
          break;
        case 'shoulder':
          if (catLower !== 'shoulders' && !muscleLower.includes('shoulder') && !muscleLower.includes('rotator') && !nameLower.includes('shoulder')) {
            return false;
          }
          break;
        case 'upper':
          if (
            !['chest', 'back', 'arms', 'shoulders'].includes(catLower) &&
            !muscleLower.includes('chest') &&
            !muscleLower.includes('back') &&
            !muscleLower.includes('arms') &&
            !muscleLower.includes('lat')
          ) {
            return false;
          }
          break;
        case 'rehab':
          if (catLower !== 'recovery' && !muscleLower.includes('rehab') && !muscleLower.includes('pain') && !muscleLower.includes('recovery')) {
            return false;
          }
          break;
        case 'trx':
          if (equipLower !== 'trx' && !nameLower.includes('trx')) {
            return false;
          }
          break;
        case 'kettlebell':
          if (equipLower !== 'kettlebell' && catLower !== 'kettlebell' && !nameLower.includes('kettlebell')) {
            return false;
          }
          break;
        case 'floor':
          if (equipLower !== 'floor mat' && catLower !== 'yoga') {
            return false;
          }
          break;
        case 'weights':
          if (
            !equipLower.includes('dumbbell') &&
            !equipLower.includes('barbell') &&
            equipLower !== 'pull-up bar' &&
            equipLower !== 'dip station'
          ) {
            return false;
          }
          break;
        default:
          break;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        nameLower.includes(q) ||
        catLower.includes(q) ||
        equipLower.includes(q) ||
        muscleLower.includes(q) ||
        instLower.includes(q)
      );
    }

    return true;
  });

  const startWorksession = (ws: DatabaseWorksessionCard, planName?: string) => {
    const isRehab = ws.type === 'rehab';
    const worksessionData = {
      name: ws.title,
      focus: ws.category,
      estimatedDuration: parseInt(ws.metrics.duration) || 30,
      type: ws.type,
      isRehab,
      category: ws.category,
      exercises: ws.exercises.map((e) => {
        const rawType = e.tracking_type || getExerciseTrackingType(e);
        const trackingMode =
          (e as any).trackingType ||
          (rawType === 'time' ? 'duration' : rawType === 'weight_reps' ? 'weight_reps' : 'bodyweight');

        return {
          name: e.name,
          cue: e.cue || 'Controlled form.',
          sets: e.sets || 3,
          reps: e.reps || (rawType === 'time' ? 45 : 10),
          weight: e.weight || (rawType === 'time' ? '0 kg' : 'Standard'),
          restSeconds: e.restSeconds || 60,
          trackingType: trackingMode,
          tracking_type: rawType,
        };
      }),
    };

    if (setActiveSessionMetadata) {
      setActiveSessionMetadata({
        isActive: true,
        worksessionName: ws.title,
        worksessionType: ws.type,
        isRehab,
        currentExerciseName: ws.exercises[0]?.name || 'Exercise 1',
        currentExerciseIndex: 0,
        totalExercises: ws.exercises.length,
        currentSet: 1,
        totalSets: ws.exercises[0]?.sets || 3,
        startTime: Date.now(),
      });
    }

    router.push({
      pathname: '/active-workout',
      params: {
        worksession: JSON.stringify(worksessionData),
        plan: JSON.stringify({ id: ws.id, name: planName || ws.title, type: ws.type, isRehab }),
      },
    });
  };

  const startSingleExercise = (exercise: DatabaseExercise) => {
    const instructions = exercise.instructions || getExerciseInstructions(exercise) || 'Focus on controlled tempo and full range of motion.';
    const isRehab = exercise.category === 'Recovery' || exercise.muscle_group?.toLowerCase().includes('rehab');
    const rawType = exercise.tracking_type || getExerciseTrackingType(exercise);
    const trackingMode = rawType === 'time' ? 'duration' : rawType === 'weight_reps' ? 'weight_reps' : 'bodyweight';

    const worksessionData = {
      name: exercise.name,
      focus: exercise.muscle_group || exercise.category || 'Targeted Movement',
      estimatedDuration: 15,
      type: isRehab ? 'rehab' : 'workout',
      isRehab,
      category: isRehab ? 'Clinical Rehab' : 'Strength & Power',
      exercises: [
        {
          name: exercise.name,
          cue: instructions,
          sets: 3,
          reps: rawType === 'time' ? 45 : (isRehab ? '12-15' : 10),
          weight: rawType === 'time' ? '0 kg' : (exercise.equipment === 'Bodyweight' || rawType === 'reps' ? 'Bodyweight' : 'Standard'),
          restSeconds: 60,
          trackingType: trackingMode,
          tracking_type: rawType,
        },
      ],
    };

    if (setActiveSessionMetadata) {
      setActiveSessionMetadata({
        isActive: true,
        worksessionName: exercise.name,
        worksessionType: isRehab ? 'rehab' : 'workout',
        isRehab,
        currentExerciseName: exercise.name,
        currentExerciseIndex: 0,
        totalExercises: 1,
        currentSet: 1,
        totalSets: 3,
        startTime: Date.now(),
      });
    }

    router.push({
      pathname: '/active-workout',
      params: {
        worksession: JSON.stringify(worksessionData),
        plan: JSON.stringify({ id: exercise.id, name: exercise.name, type: isRehab ? 'rehab' : 'workout', isRehab }),
      },
    });
  };

  const toggleCardExpand = (id: string) => {
    setExpandedCardId((prev) => (prev === id ? null : id));
  };

  const toggleExerciseExpand = (id: string) => {
    setExpandedExerciseId((prev) => (prev === id ? null : id));
  };

  return (
    <View style={styles.screen}>
      <KinetixHeader subtitle="DIRECTORY" iconName="barbell" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Primary Segmented Switcher (Workouts vs Rehab vs Exercises) */}
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              selectedTrack === 'workout' && styles.segmentBtnActive,
            ]}
            onPress={() => {
              setSelectedTrack('workout');
              setActiveFilter('all');
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="flash"
              size={16}
              color={selectedTrack === 'workout' ? KinetixTheme.colors.primary : KinetixTheme.colors.textMuted}
            />
            <Text
              style={[
                styles.segmentText,
                selectedTrack === 'workout' && styles.segmentTextActive,
              ]}
            >
              Workouts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              selectedTrack === 'rehab' && styles.segmentBtnActive,
            ]}
            onPress={() => {
              setSelectedTrack('rehab');
              setActiveFilter('all');
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="medkit"
              size={16}
              color={selectedTrack === 'rehab' ? KinetixTheme.colors.secondary : KinetixTheme.colors.textMuted}
            />
            <Text
              style={[
                styles.segmentText,
                selectedTrack === 'rehab' && { color: KinetixTheme.colors.secondary, fontWeight: '700' },
              ]}
            >
              Rehab
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              selectedTrack === 'exercises' && styles.segmentBtnActive,
            ]}
            onPress={() => {
              setSelectedTrack('exercises');
              setActiveFilter('all');
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="barbell"
              size={15}
              color={selectedTrack === 'exercises' ? KinetixTheme.colors.primary : KinetixTheme.colors.textMuted}
            />
            <View style={styles.tabBadgeRow}>
              <Text
                style={[
                  styles.segmentText,
                  selectedTrack === 'exercises' && styles.segmentTextActive,
                ]}
              >
                Exercises
              </Text>
              <View
                style={[
                  styles.countPill,
                  selectedTrack === 'exercises'
                    ? { backgroundColor: KinetixTheme.colors.primaryLight }
                    : { backgroundColor: '#CBD5E1' },
                ]}
              >
                <Text
                  style={[
                    styles.countPillText,
                    selectedTrack === 'exercises'
                      ? { color: KinetixTheme.colors.primary }
                      : { color: '#475569' },
                  ]}
                >
                  {dbExercises.length || 103}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Tab 4: Edit Studio (Plans, Worksessions, Exercises) */}
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              selectedTrack === 'edit' && styles.segmentBtnActive,
            ]}
            onPress={() => {
              setSelectedTrack('edit');
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="create-outline"
              size={15}
              color={selectedTrack === 'edit' ? KinetixTheme.colors.primary : KinetixTheme.colors.textMuted}
            />
            <Text
              style={[
                styles.segmentText,
                selectedTrack === 'edit' && styles.segmentTextActive,
              ]}
            >
              Add/Edit
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Input Bar & Filter Chips (Only for Workouts, Rehab, and Exercises) */}
        {selectedTrack !== 'edit' && (
          <>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={KinetixTheme.colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder={
                  selectedTrack === 'exercises'
                    ? `Search ${dbExercises.length || 103} exercises by name, muscle, equipment...`
                    : selectedTrack === 'rehab'
                    ? 'Search rehab protocols, knee, spine, cuff...'
                    : 'Search workouts, power, chest, kettlebell...'
                }
                placeholderTextColor={KinetixTheme.colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={KinetixTheme.colors.textMuted} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setSelectedTrack('edit')}>
                  <Ionicons name="options-outline" size={19} color={KinetixTheme.colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Chips Carousel */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {selectedTrack === 'workout'
                ? workoutFilterChips.map((chip) => {
                    const isActive = activeFilter === chip.id;
                    return (
                      <TouchableOpacity
                        key={chip.id}
                        style={[styles.chip, isActive && styles.chipActive]}
                        onPress={() => setActiveFilter(chip.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                          {chip.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                : selectedTrack === 'rehab'
                ? rehabFilterChips.map((chip) => {
                    const isActive = activeFilter === chip.id;
                    return (
                      <TouchableOpacity
                        key={chip.id}
                        style={[styles.chip, isActive && styles.chipActive]}
                        onPress={() => setActiveFilter(chip.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                          {chip.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                : exerciseChips.map((chip) => {
                    const isActive = activeFilter === chip.id;
                    return (
                      <TouchableOpacity
                        key={chip.id}
                        style={[styles.chip, isActive && styles.chipActive]}
                        onPress={() => setActiveFilter(chip.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                          {chip.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
            </ScrollView>
          </>
        )}

        {/* ========================================================= */}
        {/* VIEW 1 & 2: DATABASE WORKSESSIONS & PLANS (Workouts & Rehab) */}
        {/* ========================================================= */}
        {(selectedTrack === 'workout' || selectedTrack === 'rehab') && (
          <View style={styles.cardsList}>
            {/* 1. Database Multi-Day Training & Rehab Plans (SHOW FIRST) */}
            {(activeFilter === 'all' || activeFilter === 'plans') && filteredPlans.length > 0 && (
              <View style={styles.plansSectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons
                    name="layers-outline"
                    size={16}
                    color={selectedTrack === 'rehab' ? KinetixTheme.colors.secondary : '#7C3AED'}
                  />
                  <Text style={styles.sectionHeaderTitle}>
                    {selectedTrack === 'rehab' ? 'REHABILITATION & RECOVERY PROGRAMS' : 'TRAINING & WORKOUT PROGRAMS'} ({filteredPlans.length})
                  </Text>
                </View>

                {filteredPlans.map((plan) => {
                  const isExpanded = expandedCardId === plan.id;
                  const isRehab = plan.name.toLowerCase().includes('rehab') || plan.name.toLowerCase().includes('recovery');
                  const themeColor = isRehab ? KinetixTheme.colors.secondary : '#7C3AED';
                  const themeLight = isRehab ? KinetixTheme.colors.secondaryLight : '#F5F3FF';

                  return (
                    <View key={plan.id} style={[styles.card, styles.planCardBorder]}>
                      <TouchableOpacity
                        onPress={() => toggleCardExpand(plan.id)}
                        activeOpacity={0.8}
                        style={styles.cardHeaderTouchable}
                      >
                        <View style={styles.cardTitleCol}>
                          <View style={styles.cardBadgeRow}>
                            <View style={[styles.typeBadge, { backgroundColor: themeLight }]}>
                              <Text style={[styles.typeBadgeText, { color: themeColor }]}>
                                {plan.schedule_type === 'anchored' ? 'ANCHORED PLAN' : 'TRAINING PLAN'}
                              </Text>
                            </View>
                            <Text style={styles.cardCategory}>{plan.goal_category || 'Goal Program'}</Text>
                          </View>
                          <Text style={styles.cardTitle}>{plan.name}</Text>
                          {plan.description ? (
                            <Text style={styles.cardDescription} numberOfLines={isExpanded ? 4 : 2}>
                              {plan.description}
                            </Text>
                          ) : null}
                        </View>

                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={KinetixTheme.colors.textMuted}
                        />
                      </TouchableOpacity>

                      {/* Plan Summary Row */}
                      <View style={styles.metricsRow}>
                        <View style={styles.metricCol}>
                          <Text style={styles.metricLabel}>Sessions</Text>
                          <Text style={styles.metricVal}>{plan.worksessions.length} Days</Text>
                        </View>
                        <View style={styles.metricCol}>
                          <Text style={styles.metricLabel}>Schedule</Text>
                          <Text style={styles.metricVal}>
                            {plan.schedule_type === 'anchored' ? 'Weekly' : 'Flexible'}
                          </Text>
                        </View>
                        <View style={styles.metricCol}>
                          <Text style={styles.metricLabel}>Goal</Text>
                          <Text style={[styles.metricVal, { color: themeColor }]} numberOfLines={1}>
                            {plan.goal_category || 'Athlete'}
                          </Text>
                        </View>
                      </View>

                      {/* Plan Days / Worksessions List */}
                      {isExpanded && (
                        <View style={styles.expandedDrawer}>
                          <View style={styles.drawerHeaderRow}>
                            <Ionicons name="calendar-outline" size={14} color={KinetixTheme.colors.textMuted} />
                            <Text style={styles.drawerHeaderTitle}>
                              PLAN SESSIONS & WORKOUTS
                            </Text>
                          </View>

                          {plan.worksessions.map((sessionItem, sIdx) => {
                            const wsCard =
                              sessionItem.worksession ||
                              worksessions.find((w) => w.id === sessionItem.worksessionId) ||
                              null;
                            return (
                              <View key={sIdx} style={styles.planSessionRow}>
                                <View style={{ flex: 1, paddingRight: 8 }}>
                                  <Text style={styles.planSessionDayText}>{sessionItem.dayName}</Text>
                                  <Text style={styles.planSessionNameText}>{sessionItem.worksessionName}</Text>
                                  <Text style={styles.planSessionSubText}>
                                    {sessionItem.modality || 'Strength'} • {sessionItem.exerciseCount} exercises
                                  </Text>
                                </View>

                                {wsCard ? (
                                  <TouchableOpacity
                                    style={[styles.smallPlayBtn, { backgroundColor: themeColor }]}
                                    onPress={() => startWorksession(wsCard, plan.name)}
                                    activeOpacity={0.7}
                                  >
                                    <Ionicons name="play" size={14} color="#FFFFFF" />
                                    <Text style={styles.smallPlayBtnText}>Start</Text>
                                  </TouchableOpacity>
                                ) : null}
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* 2. Standalone Worksessions (SHOW SECOND) */}
            {activeFilter !== 'plans' && filteredWorksessions.length > 0 && (
              <View style={[styles.plansSectionContainer, { marginTop: (activeFilter === 'all' && filteredPlans.length > 0) ? 14 : 4 }]}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons
                    name={selectedTrack === 'rehab' ? 'medkit-outline' : 'barbell-outline'}
                    size={16}
                    color={selectedTrack === 'rehab' ? KinetixTheme.colors.secondary : KinetixTheme.colors.primary}
                  />
                  <Text style={styles.sectionHeaderTitle}>
                    {selectedTrack === 'rehab' ? 'INDIVIDUAL REHAB PROTOCOLS' : 'INDIVIDUAL WORKSESSIONS'} ({filteredWorksessions.length})
                  </Text>
                </View>

                {filteredWorksessions.map((ws) => {
                  const isRehab = ws.type === 'rehab';
                  const themeColor = isRehab ? KinetixTheme.colors.secondary : KinetixTheme.colors.primary;
                  const themeLight = isRehab ? KinetixTheme.colors.secondaryLight : KinetixTheme.colors.primaryLight;
                  const isExpanded = expandedCardId === ws.id;

                  return (
                    <View key={ws.id} style={styles.card}>
                      <TouchableOpacity
                        onPress={() => toggleCardExpand(ws.id)}
                        activeOpacity={0.8}
                        style={styles.cardHeaderTouchable}
                      >
                        <View style={styles.cardTitleCol}>
                          <View style={styles.cardBadgeRow}>
                            <View style={[styles.typeBadge, { backgroundColor: themeLight }]}>
                              <Text style={[styles.typeBadgeText, { color: themeColor }]}>
                                {ws.type}
                              </Text>
                            </View>
                            <Text style={styles.cardCategory}>{ws.category}</Text>
                          </View>
                          <Text style={styles.cardTitle}>{ws.title}</Text>
                          {ws.description ? (
                            <Text style={styles.cardDescription} numberOfLines={isExpanded ? 4 : 2}>
                              {ws.description}
                            </Text>
                          ) : null}
                        </View>

                        <TouchableOpacity
                          style={[styles.cardActionBtn, { backgroundColor: themeColor }]}
                          onPress={() => startWorksession(ws)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={isRehab ? 'medkit' : 'play'}
                            size={18}
                            color="#FFFFFF"
                          />
                        </TouchableOpacity>
                      </TouchableOpacity>

                      {/* 4-Metric Grid Row */}
                      <View style={styles.metricsRow}>
                        <View style={styles.metricCol}>
                          <Text style={styles.metricLabel}>Duration</Text>
                          <Text style={styles.metricVal}>{ws.metrics.duration}</Text>
                        </View>
                        <View style={styles.metricCol}>
                          <Text style={styles.metricLabel}>Sets</Text>
                          <Text style={styles.metricVal}>{ws.metrics.sets}</Text>
                        </View>
                        <View style={styles.metricCol}>
                          <Text style={styles.metricLabel}>Reps</Text>
                          <Text style={styles.metricVal}>{ws.metrics.reps}</Text>
                        </View>
                        <View style={styles.metricCol}>
                          <Text style={styles.metricLabel}>Load</Text>
                          <Text style={[styles.metricVal, { color: themeColor }]}>
                            {ws.metrics.load}
                          </Text>
                        </View>
                      </View>

                      {/* Exercises Drawer (Tap card to expand) */}
                      {isExpanded && ws.exercises && ws.exercises.length > 0 && (
                        <View style={styles.expandedDrawer}>
                          <View style={styles.drawerHeaderRow}>
                            <Ionicons name="list" size={14} color={KinetixTheme.colors.textMuted} />
                            <Text style={styles.drawerHeaderTitle}>
                              EXERCISE SEQUENCE ({ws.exercises.length} MOVES)
                            </Text>
                          </View>

                          {ws.exercises.map((ex, idx) => (
                            <View key={idx} style={styles.sequenceItemRow}>
                              <View style={[styles.sequenceIndexBadge, { backgroundColor: themeLight }]}>
                                <Text style={[styles.sequenceIndexText, { color: themeColor }]}>
                                  {idx + 1}
                                </Text>
                              </View>
                              <View style={{ flex: 1, paddingRight: 8 }}>
                                <Text style={styles.sequenceNameText}>{ex.name}</Text>
                                {ex.cue ? (
                                  <Text style={styles.sequenceCueText} numberOfLines={2}>
                                    {ex.cue}
                                  </Text>
                                ) : null}
                              </View>
                              <View style={styles.sequenceSetsBadge}>
                                <Text style={styles.sequenceSetsText}>
                                  {ex.sets}x{ex.reps}
                                </Text>
                              </View>
                            </View>
                          ))}

                          <TouchableOpacity
                            style={[styles.launchDrawerBtn, { backgroundColor: themeColor }]}
                            onPress={() => startWorksession(ws)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name={isRehab ? 'medkit' : 'play'} size={17} color="#FFFFFF" />
                            <Text style={styles.launchDrawerBtnText}>
                              Start {ws.title}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Empty State */}
            {((activeFilter === 'plans' && filteredPlans.length === 0) ||
              (activeFilter !== 'plans' && activeFilter !== 'all' && filteredWorksessions.length === 0) ||
              (activeFilter === 'all' && filteredPlans.length === 0 && filteredWorksessions.length === 0)) && (
              <View style={styles.emptyCard}>
                <Ionicons name="search-outline" size={36} color={KinetixTheme.colors.textMuted} />
                <Text style={styles.emptyTitle}>No sessions or plans found</Text>
                <Text style={styles.emptySubtitle}>Try adjusting your search query or filter tags.</Text>
              </View>
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: DATABASE EXERCISES (All 103 Exercises)            */}
        {/* ========================================================= */}
        {selectedTrack === 'exercises' && (
          <View style={styles.cardsList}>
            <View style={styles.resultsHeaderRow}>
              <Text style={styles.resultsCountText}>
                Showing <Text style={{ fontWeight: '800', color: KinetixTheme.colors.text }}>{filteredExercises.length}</Text> of {dbExercises.length} database exercises
              </Text>
              {isLoadingExercises && (
                <ActivityIndicator size="small" color={KinetixTheme.colors.primary} />
              )}
            </View>

            {filteredExercises.map((exercise) => {
              const isExpanded = expandedExerciseId === exercise.id;
              const instructions = exercise.instructions || getExerciseInstructions(exercise);
              const description = exercise.description || getExerciseDescription(exercise);
              const difficulty = exercise.difficulty || getExerciseDifficulty(exercise);
              const mechanics = exercise.mechanics || getExerciseMechanics(exercise);
              const videoUrl = exercise.video_url || getExerciseVideoUrl(exercise);

              const isRehab =
                exercise.category === 'Recovery' ||
                exercise.muscle_group?.toLowerCase().includes('rehab') ||
                exercise.muscle_group?.toLowerCase().includes('pain');

              const trackingType = exercise.tracking_type || getExerciseTrackingType(exercise);
              const metricBadge =
                trackingType === 'time'
                  ? { label: 'TIME', icon: 'timer-outline' as const, color: '#2563EB', bg: '#EFF6FF' }
                  : trackingType === 'weight_reps'
                  ? { label: 'WEIGHT + REPS', icon: 'barbell-outline' as const, color: '#7C3AED', bg: '#F5F3FF' }
                  : { label: 'REPS', icon: 'repeat-outline' as const, color: '#059669', bg: '#ECFDF5' };

              const badgeColor = isRehab ? KinetixTheme.colors.secondary : KinetixTheme.colors.primary;
              const badgeBg = isRehab ? KinetixTheme.colors.secondaryLight : KinetixTheme.colors.primaryLight;

              const getDifficultyColor = (diff?: string) => {
                const d = (diff || '').toLowerCase();
                if (d.includes('advanced')) return '#E11D48';
                if (d.includes('intermed')) return '#D97706';
                return '#059669';
              };

              return (
                <View key={exercise.id} style={styles.exerciseCard}>
                  <TouchableOpacity
                    onPress={() => toggleExerciseExpand(exercise.id)}
                    activeOpacity={0.8}
                    style={styles.exerciseCardTouchable}
                  >
                    <View style={styles.exerciseCardMain}>
                      <View style={styles.exerciseBadgesRow}>
                        <View style={[styles.exerciseTag, { backgroundColor: badgeBg }]}>
                          <Text style={[styles.exerciseTagText, { color: badgeColor }]}>
                            {exercise.equipment || exercise.category || 'EXERCISE'}
                          </Text>
                        </View>

                        {exercise.muscle_group ? (
                          <View style={styles.muscleTag}>
                            <Text style={styles.muscleTagText} numberOfLines={1}>
                              {exercise.muscle_group}
                            </Text>
                          </View>
                        ) : null}

                        {difficulty ? (
                          <View style={[styles.diffTag, { backgroundColor: `${getDifficultyColor(difficulty)}15` }]}>
                            <Text style={[styles.diffTagText, { color: getDifficultyColor(difficulty) }]}>
                              {difficulty}
                            </Text>
                          </View>
                        ) : null}

                        <View style={[styles.metricTag, { backgroundColor: metricBadge.bg }]}>
                          <Ionicons name={metricBadge.icon} size={11} color={metricBadge.color} />
                          <Text style={[styles.metricTagText, { color: metricBadge.color }]}>
                            {metricBadge.label}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.exerciseNameText}>{exercise.name}</Text>

                      <View style={styles.exerciseMetaLine}>
                        <Text style={styles.exerciseSubText}>
                          {exercise.category} {mechanics ? `• ${mechanics}` : ''}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.exerciseActionCol}>
                      <TouchableOpacity
                        style={styles.quickPlayBtn}
                        onPress={() => startSingleExercise(exercise)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="play" size={16} color="#FFFFFF" />
                      </TouchableOpacity>

                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={KinetixTheme.colors.textMuted}
                        style={{ marginTop: 6 }}
                      />
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.expandedDrawer}>
                      {description ? (
                        <View style={styles.coachingBox}>
                          <View style={styles.coachingHeader}>
                            <Ionicons name="medical-outline" size={15} color={badgeColor} />
                            <Text style={[styles.coachingTitle, { color: badgeColor }]}>
                              CLINICAL PROTOCOL & GUIDELINES
                            </Text>
                          </View>
                          <Text style={styles.coachingBody}>{description}</Text>
                        </View>
                      ) : instructions ? (
                        <View style={styles.coachingBox}>
                          <View style={styles.coachingHeader}>
                            <Ionicons name="bulb-outline" size={15} color={badgeColor} />
                            <Text style={[styles.coachingTitle, { color: badgeColor }]}>
                              COACHING CUES & EXECUTION
                            </Text>
                          </View>
                          <Text style={styles.coachingBody}>{instructions}</Text>
                        </View>
                      ) : null}

                      <View style={styles.specsRow}>
                        <View style={styles.specItem}>
                          <Text style={styles.specLabel}>Equipment</Text>
                          <Text style={styles.specValue} numberOfLines={1}>
                            {exercise.equipment || 'Bodyweight'}
                          </Text>
                        </View>
                        <View style={styles.specItem}>
                          <Text style={styles.specLabel}>Target</Text>
                          <Text style={styles.specValue} numberOfLines={1}>
                            {exercise.muscle_group || exercise.category}
                          </Text>
                        </View>
                        <View style={styles.specItem}>
                          <Text style={styles.specLabel}>Mechanics</Text>
                          <Text style={styles.specValue} numberOfLines={1}>
                            {mechanics || 'Compound'}
                          </Text>
                        </View>
                        <View style={styles.specItem}>
                          <Text style={styles.specLabel}>Tracking</Text>
                          <Text style={[styles.specValue, { color: metricBadge.color }]} numberOfLines={1}>
                            {metricBadge.label}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.drawerActionsRow}>
                        <TouchableOpacity
                          style={[styles.primaryActionBtn, { backgroundColor: badgeColor }]}
                          onPress={() => startSingleExercise(exercise)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="play-circle" size={18} color="#FFFFFF" />
                          <Text style={styles.primaryActionBtnText}>Start Guided Move</Text>
                        </TouchableOpacity>

                        {videoUrl ? (
                          <TouchableOpacity
                            style={styles.secondaryActionBtn}
                            onPress={() => setSelectedVideoExercise(exercise)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="videocam-outline" size={17} color={KinetixTheme.colors.text} />
                            <Text style={styles.secondaryActionBtnText}>Watch Demo</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            {filteredExercises.length === 0 && !isLoadingExercises && (
              <View style={styles.emptyCard}>
                <Ionicons name="fitness-outline" size={40} color={KinetixTheme.colors.textMuted} />
                <Text style={styles.emptyTitle}>No exercises matched</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? `No exercises match "${searchQuery}" in this category.` : 'Try clearing your filter selection.'}
                </Text>
                {searchQuery ? (
                  <TouchableOpacity
                    style={styles.clearSearchBtn}
                    onPress={() => setSearchQuery('')}
                  >
                    <Text style={styles.clearSearchText}>Clear Search</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: DEDICATED EDIT STUDIO (Plans, Sessions, Moves)     */}
        {/* ========================================================= */}
        {selectedTrack === 'edit' && (
          <View style={{ flex: 1, marginTop: 4 }}>
            <PlanBuilder isEmbedded={true} />
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Video Demonstration Modal */}
      {selectedVideoExercise && (
        <ExerciseVideoModal
          visible={!!selectedVideoExercise}
          onClose={() => setSelectedVideoExercise(null)}
          exercise={{
            ...selectedVideoExercise,
            video_url: selectedVideoExercise.video_url || getExerciseVideoUrl(selectedVideoExercise),
            instructions: selectedVideoExercise.instructions || getExerciseInstructions(selectedVideoExercise),
          }}
        />
      )}

      {/* Modal for Advanced Plan Builder */}
      <Modal
        visible={showCustomBuilder}
        animationType="slide"
        onRequestClose={() => setShowCustomBuilder(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#111' }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Custom Plan Studio</Text>
            <TouchableOpacity onPress={() => setShowCustomBuilder(false)} style={styles.closeModalBtn}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <PlanBuilder onSetDefaultPlan={() => {}} defaultPlanId={null} />
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <KinetixBottomNav activeTab="workouts" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: KinetixTheme.colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    padding: 4,
    borderRadius: KinetixTheme.borderRadius.lg,
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    borderRadius: KinetixTheme.borderRadius.md,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    ...KinetixTheme.shadows.card,
  },
  segmentText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  segmentTextActive: {
    fontWeight: '700',
    color: KinetixTheme.colors.primary,
  },
  tabBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  countPill: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
  },
  countPillText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    borderRadius: KinetixTheme.borderRadius.lg,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    gap: 8,
    ...KinetixTheme.shadows.card,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: KinetixTheme.colors.text,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: KinetixTheme.borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
  },
  chipActive: {
    backgroundColor: KinetixTheme.colors.primary,
    borderColor: KinetixTheme.colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardsList: {
    gap: 12,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  resultsCountText: {
    fontSize: 12,
    color: KinetixTheme.colors.textMuted,
    fontWeight: '500',
  },
  card: {
    backgroundColor: KinetixTheme.colors.surface,
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    ...KinetixTheme.shadows.card,
  },
  cardHeaderTouchable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitleCol: {
    flex: 1,
    paddingRight: 12,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardCategory: {
    fontSize: 12,
    color: KinetixTheme.colors.textMuted,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  cardDescription: {
    fontSize: 12,
    color: KinetixTheme.colors.textMuted,
    lineHeight: 17,
    marginTop: 4,
  },
  cardActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...KinetixTheme.shadows.card,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: KinetixTheme.colors.surfaceContainerLow,
    borderRadius: KinetixTheme.borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: KinetixTheme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    marginTop: 3,
  },
  expandedDrawer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  drawerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  drawerHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: KinetixTheme.colors.textMuted,
    letterSpacing: 0.5,
  },
  sequenceItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: KinetixTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sequenceIndexBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sequenceIndexText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sequenceNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
  },
  sequenceCueText: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    marginTop: 2,
  },
  sequenceSetsBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  sequenceSetsText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
  },
  launchDrawerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: KinetixTheme.borderRadius.md,
    marginTop: 6,
  },
  launchDrawerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  plansSectionContainer: {
    marginTop: 8,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 2,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: 0.5,
  },
  planCardBorder: {
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  planSessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: KinetixTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  planSessionDayText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7C3AED',
    textTransform: 'uppercase',
  },
  planSessionNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
    marginTop: 1,
  },
  planSessionSubText: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    marginTop: 1,
  },
  smallPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  smallPlayBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    overflow: 'hidden',
    ...KinetixTheme.shadows.card,
  },
  exerciseCardTouchable: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseCardMain: {
    flex: 1,
    paddingRight: 12,
  },
  exerciseBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  exerciseTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  exerciseTagText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  muscleTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  muscleTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  diffTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  diffTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metricTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metricTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  exerciseNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.2,
  },
  exerciseMetaLine: {
    marginTop: 3,
  },
  exerciseSubText: {
    fontSize: 12,
    color: KinetixTheme.colors.textMuted,
    fontWeight: '500',
  },
  exerciseActionCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: KinetixTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...KinetixTheme.shadows.card,
  },
  coachingBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  coachingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  coachingTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  coachingBody: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  specsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  specLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: KinetixTheme.colors.textMuted,
    textTransform: 'uppercase',
  },
  specValue: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
    marginTop: 2,
  },
  drawerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: KinetixTheme.borderRadius.md,
  },
  primaryActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: KinetixTheme.borderRadius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  secondaryActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: KinetixTheme.colors.text,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.lg,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: KinetixTheme.colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  clearSearchBtn: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: KinetixTheme.colors.primaryLight,
    borderRadius: 8,
  },
  clearSearchText: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.primary,
  },
  createTrackContainer: {
    gap: 14,
    paddingTop: 4,
  },
  createHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: KinetixTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...KinetixTheme.shadows.card,
  },
  createHeroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: KinetixTheme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createHeroTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: 0.5,
  },
  createHeroDesc: {
    fontSize: 12,
    color: KinetixTheme.colors.textMuted,
    marginTop: 2,
    lineHeight: 17,
  },
  createOptionsList: {
    gap: 12,
  },
  createOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: KinetixTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    ...KinetixTheme.shadows.card,
  },
  createOptionIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createOptionContent: {
    flex: 1,
  },
  createOptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  createOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
  },
  createBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  createBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  createOptionDesc: {
    fontSize: 11.5,
    color: KinetixTheme.colors.textMuted,
    lineHeight: 16,
  },
  openStudioPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: KinetixTheme.colors.primary,
    paddingVertical: 14,
    borderRadius: KinetixTheme.borderRadius.lg,
    marginTop: 4,
    ...KinetixTheme.shadows.card,
  },
  openStudioPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#16161F',
    borderBottomWidth: 1,
    borderBottomColor: '#262634',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeModalBtn: {
    padding: 4,
  },
});
