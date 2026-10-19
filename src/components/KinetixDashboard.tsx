import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { KinetixTheme } from '../constants/theme';
import { TrainingContext, supabase } from '../context/TrainingContext';
import KinetixHeader from './KinetixHeader';
import KinetixBottomNav from './KinetixBottomNav';
import {
  DATABASE_WORKSESSIONS,
  DATABASE_PLANS,
  DatabasePlan,
  DatabasePlanPhase,
  DatabaseWorksessionCard,
} from '../data/databaseLibraryData';
import { getDeletedPlanIds } from '../services/planPersistence';
import { WeeklyScheduleSlot } from '../types/database';
import {
  loadWeeklySchedule,
  getPlannedActivitiesForDate,
  buildDefaultHybridWeeklySchedule,
} from '../services/scheduleService';
import SportQuickLogModal from './SportQuickLogModal';
import { getExerciseTrackingType } from '../data/recoveryMetadata';


// Image mapping helper for dynamic worksession imagery
const getWorksessionImage = (modality?: string, type?: string) => {
  const m = (modality || '').toLowerCase();
  const t = (type || '').toLowerCase();
  if (m.includes('shoulder')) {
    return 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=400&q=80';
  }
  if (m.includes('knee') || m.includes('tendon')) {
    return 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=400&q=80';
  }
  if (m.includes('back') || m.includes('mcgill') || m.includes('spine')) {
    return 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80';
  }
  if (m.includes('ankle') || m.includes('achilles') || m.includes('calf')) {
    return 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=400&q=80';
  }
  if (m.includes('kettlebell')) {
    return 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=400&q=80';
  }
  if (m.includes('core') || m.includes('trx')) {
    return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80';
  }
  if (m.includes('yoga')) {
    return 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80';
  }
  if (m.includes('cardio') || m.includes('run')) {
    return 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=400&q=80';
  }
  if (m.includes('plyo') || m.includes('jump')) {
    return 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80';
  }
  if (t === 'rehab' || m.includes('rehab') || m.includes('recovery')) {
    return 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=400&q=80';
  }
  // Default strength & power
  return 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80';
};

interface PlanSessionItem {
  dayName: string;
  worksessionId: string;
  worksessionName: string;
  modality: string;
  exerciseCount: number;
  worksession: DatabaseWorksessionCard;
  trackType?: 'workout' | 'rehab';
}

export default function KinetixDashboard() {
  const router = useRouter();
  const {
    session,
    workspaces,
    updateWorkspaces,
    history,
    logWorkout,
    setActiveSessionMetadata,
  } = useContext(TrainingContext) || {};

  // Available plans state: initialized with static database plans, augmented with live plans from DB
  const [plans, setPlans] = useState<DatabasePlan[]>(DATABASE_PLANS);
  const [selectedWorkoutPlanId, setSelectedWorkoutPlanId] = useState<string | null>(null);
  const [selectedRehabId, setSelectedRehabId] = useState<string | null>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleSlot[]>(() =>
    buildDefaultHybridWeeklySchedule()
  );
  const [sportLogSlot, setSportLogSlot] = useState<WeeklyScheduleSlot | null>(null);


  const athleteName = useMemo(() => {
    const rawName =
      session?.user?.user_metadata?.full_name ||
      session?.user?.user_metadata?.name ||
      session?.user?.user_metadata?.username;

    if (rawName && typeof rawName === 'string' && rawName.trim()) {
      return rawName.trim().split(' ')[0];
    }

    if (session?.user?.email) {
      const emailPrefix = session.user.email.split('@')[0];
      const clean = emailPrefix.split(/[._-]/)[0];
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }

    return 'Athlete';
  }, [session?.user]);

  const todayDate = new Date();
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(todayDate);
  const todayDayName = todayDate.toLocaleDateString('en-US', { weekday: 'long' });

  const greetingTimeOfDay = useMemo(() => {
    const hour = todayDate.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, [todayDate]);

  // 1. Sync active workout plan and active rehab plan IDs
  const syncActivePlans = async () => {
    try {
      const [storedWorkout, storedLegacy, storedRehab] = await Promise.all([
        AsyncStorage.getItem('@active_workout_plan_id'),
        AsyncStorage.getItem('@active_plan_id'),
        AsyncStorage.getItem('@active_rehab_plan_id'),
      ]);

      // 1. Workout Plan Candidate
      const workoutCandidate =
        workspaces?.activeWorkoutPlanId ||
        workspaces?.defaultPlanId ||
        workspaces?.activePlanId ||
        storedWorkout ||
        storedLegacy;

      if (workoutCandidate) {
        setSelectedWorkoutPlanId(workoutCandidate);
      } else {
        const firstWorkout = DATABASE_PLANS.find(
          (p) => !p.name.toLowerCase().includes('rehab') && !p.name.toLowerCase().includes('recovery')
        );
        if (firstWorkout) setSelectedWorkoutPlanId(firstWorkout.id);
      }

      // 2. Rehab Plan / Protocol Candidate
      const rehabCandidate = workspaces?.activeRehabPlanId || storedRehab;
      if (rehabCandidate) {
        setSelectedRehabId(rehabCandidate);
      } else {
        const firstRehabWs = DATABASE_WORKSESSIONS.find((w) => w.type === 'rehab');
        if (firstRehabWs) {
          setSelectedRehabId(firstRehabWs.id);
        } else {
          const firstRehabPlan = DATABASE_PLANS.find(
            (p) => p.name.toLowerCase().includes('rehab') || p.name.toLowerCase().includes('recovery')
          );
          if (firstRehabPlan) setSelectedRehabId(firstRehabPlan.id);
        }
      }
      const loadedSched = await loadWeeklySchedule({
        userId: session?.user?.id,
        workspaces,
      });
      if (loadedSched && loadedSched.length > 0) {
        setWeeklySchedule(loadedSched);
      }
    } catch (e) {
      console.error('[KinetixDashboard] Error syncing active plans:', e);
    }
  };

  useEffect(() => {
    syncActivePlans();
  }, [
    session?.user?.id,
    workspaces?.weekly_schedule,
    workspaces?.activeWorkoutPlanId,
    workspaces?.defaultPlanId,
    workspaces?.activePlanId,
    workspaces?.activeRehabPlanId,
  ]);

  // Re-sync whenever dashboard regains focus (e.g. after choosing in Workouts)
  useFocusEffect(
    React.useCallback(() => {
      syncActivePlans();
    }, [
      workspaces?.activeWorkoutPlanId,
      workspaces?.defaultPlanId,
      workspaces?.activePlanId,
      workspaces?.activeRehabPlanId,
    ])
  );

  // Helper to map DB worksession exercise preserving rest and hold-time rep pyramids
  const mapDbWorksessionExercise = (we: any) => {
    const ex = we.exercises || {};
    const isHold =
      we.tracking_type === 'time' ||
      we.tracking_type === 'duration' ||
      Boolean(we.target_time && we.target_time > 0) ||
      Boolean(we.target_duration_seconds && we.target_duration_seconds > 0);

    const rawRest =
      typeof we.target_rest_seconds === 'number'
        ? we.target_rest_seconds
        : typeof we.restSeconds === 'number'
        ? we.restSeconds
        : typeof ex.default_rest_seconds === 'number'
        ? ex.default_rest_seconds
        : 60;

    const exName = (ex.name || we.name || 'Exercise').toLowerCase();
    const cueLower = (we.notes || ex.instructions || '').toLowerCase();
    const isMcGill = exName.includes('mcgill') || exName.includes('bird-dog');
    const isPyramid = cueLower.includes('descending') || cueLower.includes('pyramid') || cueLower.includes('50s, 30s') || cueLower.includes('5-3-1');
    const tSets = we.target_sets || 3;

    let holdSecondsPerRep: number | undefined = we.hold_seconds_per_rep || undefined;
    let repsPerSet: number[] | undefined = we.reps_per_set || undefined;
    let durationsPerSet: number[] | undefined = we.durations_per_set || undefined;

    if ((isMcGill || isPyramid) && tSets >= 3 && !exName.includes('warmup')) {
      holdSecondsPerRep = 10;
      repsPerSet = [5, 3, 1];
      durationsPerSet = [50, 30, 10];
    } else if (exName.includes('warmup') && (isMcGill || isPyramid)) {
      holdSecondsPerRep = 10;
      repsPerSet = [3];
      durationsPerSet = [30];
    }

    let formattedReps = '10';
    if (durationsPerSet && durationsPerSet.length > 0) {
      formattedReps = `${durationsPerSet[0]}s (${repsPerSet ? repsPerSet.join('-') : '5-3-1'} reps × 10s)`;
    } else if (isHold) {
      const dur = we.target_duration_seconds || we.target_time || 45;
      formattedReps = `${dur}s`;
    } else if (we.target_reps) {
      formattedReps = String(we.target_reps);
    } else if (we.reps) {
      formattedReps = String(we.reps);
    }

    return {
      name: ex.name || we.name || 'Exercise',
      cue: we.notes || ex.instructions || 'Controlled execution.',
      sets: tSets,
      reps: formattedReps,
      weight: 'Standard',
      restSeconds: rawRest,
      target_rest_seconds: rawRest,
      target_duration_seconds: we.target_duration_seconds || (isHold ? (we.target_time || 45) : undefined),
      target_reps: we.target_reps || undefined,
      hold_seconds_per_rep: holdSecondsPerRep,
      reps_per_set: repsPerSet,
      durations_per_set: durationsPerSet,
      tracking_type: isHold ? 'duration' : (we.tracking_type || 'reps'),
      equipment: ex.equipment || 'Bodyweight',
      muscle_group: ex.muscle_group || 'General',
      difficulty: ex.difficulty || 'Intermediate',
      mechanics: ex.mechanics || 'Compound',
      description: ex.description || null,
    };
  };

  // 2. Fetch live plans from Supabase if authenticated
  useEffect(() => {
    let isMounted = true;
    const fetchLivePlans = async () => {
      if (!session?.user?.id) return;

      let mappedUserPlans: DatabasePlan[] = [];
      try {
        const { data: userPlans, error: planErr } = await supabase
          .from('training_plans')
          .select(`
            id, name, schedule_type, goal_category, description, is_standard_template,
            plan_worksessions (
              id, day_name, order_index, worksession_id,
              worksessions (
                id, name, modality, description,
                worksession_exercises (
                  id, order_index, target_sets, target_reps, tracking_type, target_time, target_rest_seconds, target_duration_seconds, notes,
                  exercises (id, name, category, equipment, muscle_group, instructions, description, difficulty, mechanics, default_rest_seconds, default_duration_seconds, default_reps)
                )
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (!planErr && userPlans) {
          mappedUserPlans = userPlans.map((p: any) => {
            const existing = DATABASE_PLANS.find((dp) => dp.id === p.id);
            if (existing) return existing;

            const isRehab =
              (p.name || '').toLowerCase().includes('rehab') ||
              (p.name || '').toLowerCase().includes('recovery') ||
              (p.goal_category || '').toLowerCase().includes('rehab');

            const sessions = (p.plan_worksessions || []).map((pw: any) => {
              const ws = pw.worksessions;
              const exercises = (ws?.worksession_exercises || [])
                .slice()
                .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
                .map(mapDbWorksessionExercise);

              const totalSets = exercises.reduce((acc: number, e: any) => acc + (e.sets || 3), 0);
              const fullWs: DatabaseWorksessionCard = {
                id: ws?.id || pw.worksession_id,
                type: isRehab ? 'rehab' : 'workout',
                category: ws?.modality || (isRehab ? 'Clinical Rehab' : 'Strength & Power'),
                title: ws?.name || 'Worksession',
                filterTag: isRehab ? 'knee' : 'core',
                description: ws?.description || '',
                metrics: {
                  duration: `${Math.max(15, exercises.length * 8)} min`,
                  sets: `${totalSets} Sets`,
                  reps: exercises[0] ? String(exercises[0].reps) : '8-12',
                  load: isRehab ? 'Light' : 'Moderate',
                },
                exercises,
              };

              return {
                dayName: pw.day_name || 'Day',
                worksessionId: pw.worksession_id,
                worksessionName: ws?.name || 'Session',
                modality: ws?.modality || 'General',
                exerciseCount: exercises.length || 3,
                worksession: fullWs,
              };
            });

            return {
              id: p.id,
              name: p.name,
              schedule_type: p.schedule_type || 'floating',
              goal_category: p.goal_category || 'General',
              description: p.description || '',
              is_standard_template: p.is_standard_template || false,
              worksessions: sessions,
            };
          });
        }
      } catch (err) {
        console.error('[KinetixDashboard] Error fetching live training plans:', err);
      }

      // Fetch live rehab programs with phases and worksessions
      let mappedRehabPrograms: DatabasePlan[] = [];
      try {
        const { data: rehabData, error: rehabErr } = await supabase
          .from('rehab_programs')
          .select(`
            id, title, description, target_joint, estimated_weeks,
            program_phases (
              id, phase_order, title, description, required_sessions_to_pass, max_allowed_pain_score,
              phase_worksessions (
                id, order_index, day_name, worksession_id
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (!rehabErr && rehabData) {
          // Collect all unique worksession IDs across all phases
          const wsIds: string[] = [];
          rehabData.forEach((rp: any) => {
            (rp.program_phases || []).forEach((ph: any) => {
              (ph.phase_worksessions || []).forEach((pw: any) => {
                if (pw.worksession_id) wsIds.push(pw.worksession_id);
              });
            });
          });

          // Fetch worksessions in batch if any exist
          const worksessionMap = new Map<string, any>();
          if (wsIds.length > 0) {
            const { data: wsList } = await supabase
              .from('worksessions')
              .select(`
                id, name, modality, description,
                worksession_exercises (
                  id, order_index, target_sets, target_reps, tracking_type, target_time, target_rest_seconds, target_duration_seconds, notes,
                  exercises (id, name, category, equipment, muscle_group, instructions, description, difficulty, mechanics, default_rest_seconds, default_duration_seconds, default_reps)
                )
              `)
              .in('id', wsIds);

            if (wsList) {
              wsList.forEach((ws: any) => worksessionMap.set(ws.id, ws));
            }
          }

          mappedRehabPrograms = rehabData.map((rp: any) => {
            const sortedPhases = (rp.program_phases || []).sort(
              (a: any, b: any) => a.phase_order - b.phase_order
            );

            const phases: DatabasePlanPhase[] = sortedPhases.map((ph: any) => {
              const pwList = (ph.phase_worksessions || []).sort(
                (a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)
              );

              const phaseSessions = pwList.map((pw: any, pIdx: number) => {
                const ws = worksessionMap.get(pw.worksession_id);
                const exercises = (ws?.worksession_exercises || [])
                  .slice()
                  .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
                  .map(mapDbWorksessionExercise);

                const totalSets = exercises.reduce((acc: number, e: any) => acc + (e.sets || 3), 0);
                const fullWs: DatabaseWorksessionCard = {
                  id: ws?.id || pw.worksession_id,
                  type: 'rehab',
                  category: ws?.modality || 'Clinical Rehab',
                  title: ws?.name || `Phase ${ph.phase_order} Session ${pIdx + 1}`,
                  filterTag: 'knee',
                  description: ws?.description || '',
                  metrics: {
                    duration: `${Math.max(15, exercises.length * 8)} min`,
                    sets: `${totalSets} Sets`,
                    reps: exercises[0] ? String(exercises[0].reps) : '8-12',
                    load: 'Light',
                  },
                  exercises,
                };

                return {
                  dayName: pw.day_name || `Phase ${ph.phase_order} - Session ${pIdx + 1}`,
                  worksessionId: ws?.id || pw.worksession_id,
                  worksessionName: ws?.name || 'Rehab Session',
                  modality: ws?.modality || 'Clinical Rehab',
                  exerciseCount: exercises.length || 3,
                  worksession: fullWs,
                };
              });

              return {
                id: ph.id,
                phase_order: ph.phase_order,
                title: ph.title,
                description: ph.description || '',
                required_sessions_to_pass: ph.required_sessions_to_pass,
                max_allowed_pain_score: Number(ph.max_allowed_pain_score),
                worksessions: phaseSessions,
              };
            });

            const allWorksessions = phases.flatMap((ph) => ph.worksessions);

            return {
              id: rp.id,
              name: rp.title,
              schedule_type: 'criteria_progression',
              goal_category: rp.target_joint ? `Rehab (${rp.target_joint})` : 'Clinical Rehab',
              description: rp.description || '',
              is_standard_template: false,
              phases,
              worksessions: allWorksessions,
            };
          });
        }
      } catch (rErr) {
        console.error('[KinetixDashboard] Error fetching user rehab programs:', rErr);
      }

      if (isMounted) {
        const allFetched = [...mappedRehabPrograms, ...mappedUserPlans];
        const deletedIds = await getDeletedPlanIds();
        const existingPlanIds = new Set(allFetched.map((p) => p.id));
        const existingPlanNames = new Set(allFetched.map((p) => p.name.trim().toLowerCase()));
        const mergedPlans = [
          ...allFetched,
          ...DATABASE_PLANS.filter(
            (p) => !existingPlanIds.has(p.id) && !existingPlanNames.has(p.name.trim().toLowerCase())
          ),
        ].filter((p) => !deletedIds.includes(p.id));
        setPlans(mergedPlans);
      }
    };

    fetchLivePlans();
    return () => {
      isMounted = false;
    };
  }, [session?.user?.id]);

  // 3. Resolve Currently Active Workout Plan
  const activeWorkoutPlan = useMemo(() => {
    const workoutPlans = plans.filter(
      (p) => !p.name.toLowerCase().includes('rehab') && !p.name.toLowerCase().includes('recovery')
    );
    if (selectedWorkoutPlanId) {
      const found = plans.find((p) => p.id === selectedWorkoutPlanId);
      if (found && !found.name.toLowerCase().includes('rehab') && !found.name.toLowerCase().includes('recovery')) {
        return found;
      }
    }
    return workoutPlans[0] || plans[0] || DATABASE_PLANS[0];
  }, [plans, selectedWorkoutPlanId]);

  // 4. Resolve Currently Active Rehab Plan or Individual Protocol
  const activeRehabPlan = useMemo((): DatabasePlan => {
    if (selectedRehabId) {
      const foundPlan = plans.find((p) => p.id === selectedRehabId);
      if (foundPlan) return foundPlan;

      const foundWs = DATABASE_WORKSESSIONS.find((w) => w.id === selectedRehabId);
      if (foundWs) {
        return {
          id: foundWs.id,
          name: foundWs.title,
          schedule_type: 'floating',
          goal_category: foundWs.category || 'Clinical Rehab',
          description: foundWs.description || '',
          is_standard_template: false,
          worksessions: [
            {
              dayName: 'Daily Protocol',
              worksessionId: foundWs.id,
              worksessionName: foundWs.title,
              modality: foundWs.category,
              exerciseCount: foundWs.exercises?.length || 4,
              worksession: foundWs,
            },
          ],
        };
      }
    }

    const defaultRehabWs = DATABASE_WORKSESSIONS.find((w) => w.type === 'rehab');
    if (defaultRehabWs) {
      return {
        id: defaultRehabWs.id,
        name: defaultRehabWs.title,
        schedule_type: 'floating',
        goal_category: defaultRehabWs.category || 'Clinical Rehab',
        description: defaultRehabWs.description || '',
        is_standard_template: false,
        worksessions: [
          {
            dayName: 'Daily Protocol',
            worksessionId: defaultRehabWs.id,
            worksessionName: defaultRehabWs.title,
            modality: defaultRehabWs.category,
            exerciseCount: defaultRehabWs.exercises?.length || 4,
            worksession: defaultRehabWs,
          },
        ],
      };
    }

    const defaultRehabPlan = plans.find(
      (p) => p.name.toLowerCase().includes('rehab') || p.name.toLowerCase().includes('recovery')
    );
    return defaultRehabPlan || DATABASE_PLANS[0];
  }, [plans, selectedRehabId]);

  // 5. Helper to resolve worksession cards for any plan
  const resolvePlanSessions = (targetPlan: DatabasePlan | null, defaultTrack: 'workout' | 'rehab'): PlanSessionItem[] => {
    if (!targetPlan || !targetPlan.worksessions) return [];

    return targetPlan.worksessions.map((pw, idx) => {
      let wsCard = pw.worksession;
      if (!wsCard || !wsCard.exercises || wsCard.exercises.length === 0) {
        const found = DATABASE_WORKSESSIONS.find((w) => w.id === pw.worksessionId);
        if (found) wsCard = found;
      }

      const isRehab = defaultTrack === 'rehab' || (pw.modality || '').toLowerCase().includes('rehab');

      if (!wsCard) {
        wsCard = {
          id: pw.worksessionId || `ws-fallback-${idx}`,
          type: isRehab ? 'rehab' : 'workout',
          category: pw.modality || (isRehab ? 'Clinical Rehab' : 'Strength & Power'),
          title: pw.worksessionName || `Session ${idx + 1}`,
          filterTag: isRehab ? 'knee' : 'core',
          description: 'Prescribed routine tailored for athletic performance and tissue resilience.',
          metrics: {
            duration: isRehab ? '30 min' : '45 min',
            sets: '9 Sets',
            reps: '10',
            load: isRehab ? 'Light' : 'Moderate',
          },
          exercises: [
            {
              name: isRehab ? 'Mobility & Activation' : 'Dynamic Joint Activation',
              cue: 'Focus on fluid range of motion.',
              sets: 3,
              reps: '10',
              weight: 'Bodyweight',
              restSeconds: 45,
              tracking_type: 'reps',
            },
          ],
        };
      }

      return {
        dayName: pw.dayName || `Day ${idx + 1}`,
        worksessionId: pw.worksessionId,
        worksessionName: wsCard.title || pw.worksessionName,
        modality: wsCard.category || pw.modality || (isRehab ? 'Rehab' : 'Strength'),
        exerciseCount: wsCard.exercises?.length || pw.exerciseCount || 3,
        worksession: wsCard,
        trackType: isRehab ? 'rehab' : 'workout',
      };
    });
  };

  const resolvedWorkoutSessions = useMemo(
    () => resolvePlanSessions(activeWorkoutPlan, 'workout'),
    [activeWorkoutPlan]
  );
  const resolvedRehabSessions = useMemo(
    () => resolvePlanSessions(activeRehabPlan, 'rehab'),
    [activeRehabPlan]
  );

  // 6. Compute Schedule helper
  const computeSchedule = (targetPlan: DatabasePlan | null, sessions: PlanSessionItem[]) => {
    if (!sessions || sessions.length === 0) {
      return { todaySessions: [] as PlanSessionItem[], upcomingSessions: [] as PlanSessionItem[], isRestDay: false };
    }

    if (targetPlan?.schedule_type === 'anchored') {
      const todayMatches = sessions.filter((s) => {
        const d = (s.dayName || '').toLowerCase().trim();
        const t = todayDayName.toLowerCase().trim();
        return d.startsWith(t) || d.includes(t);
      });

      const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const todayIndex = (todayDate.getDay() + 6) % 7; // 0 = Mon, 6 = Sun

      const upcoming = sessions
        .filter((s) => !todayMatches.includes(s))
        .sort((a, b) => {
          const aIndex = dayOrder.findIndex((d) => (a.dayName || '').toLowerCase().includes(d));
          const bIndex = dayOrder.findIndex((d) => (b.dayName || '').toLowerCase().includes(d));
          const aOffset = (aIndex - todayIndex + 7) % 7 || 7;
          const bOffset = (bIndex - todayIndex + 7) % 7 || 7;
          return aOffset - bOffset;
        });

      return {
        todaySessions: todayMatches,
        upcomingSessions: upcoming,
        isRestDay: todayMatches.length === 0,
      };
    }

    // Floating schedule: Session 0 is today, subsequent are upcoming
    return {
      todaySessions: [sessions[0]],
      upcomingSessions: sessions.slice(1),
      isRestDay: false,
    };
  };

  const todayIsoKey = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todayPlanned = useMemo(
    () => getPlannedActivitiesForDate(todayIsoKey, weeklySchedule),
    [todayIsoKey, weeklySchedule]
  );

  const todaySportSlots = useMemo(
    () => todayPlanned.activeSlots.filter((s) => s.activity_type === 'sport'),
    [todayPlanned]
  );

  const workoutSchedule = useMemo(() => {
    const base = computeSchedule(activeWorkoutPlan, resolvedWorkoutSessions);
    if (weeklySchedule.length === 0) return base;

    const plannedWorkoutSlots = todayPlanned.activeSlots.filter(
      (s) => s.activity_type === 'workout'
    );
    if (plannedWorkoutSlots.length === 0) {
      return {
        todaySessions: [] as PlanSessionItem[],
        upcomingSessions: resolvedWorkoutSessions,
        isRestDay: true,
      };
    }

    const mappedToday: PlanSessionItem[] = plannedWorkoutSlots.map((slot, idx) => {
      const fromResolved =
        resolvedWorkoutSessions.find(
          (r) =>
            (slot.worksession_id && r.worksessionId === slot.worksession_id) ||
            r.worksessionName.toLowerCase() === slot.title.toLowerCase()
        ) || resolvedWorkoutSessions[idx % Math.max(resolvedWorkoutSessions.length, 1)];

      const fromCatalog = slot.worksession_id
        ? DATABASE_WORKSESSIONS.find((w) => w.id === slot.worksession_id)
        : DATABASE_WORKSESSIONS.find(
            (w) => w.type === 'workout' && w.title.toLowerCase() === slot.title.toLowerCase()
          );

      const wsCard = fromCatalog || fromResolved?.worksession || DATABASE_WORKSESSIONS[0];
      return {
        dayName: todayDayName,
        worksessionId: wsCard.id,
        worksessionName: wsCard.title || slot.title,
        modality: wsCard.category || slot.subtitle || 'Strength & Power',
        exerciseCount: wsCard.exercises?.length || 3,
        worksession: wsCard,
        trackType: 'workout',
      };
    });

    const todayIds = new Set(mappedToday.map((m) => m.worksessionId));
    const upcoming = resolvedWorkoutSessions.filter((r) => !todayIds.has(r.worksessionId));

    return {
      todaySessions: mappedToday,
      upcomingSessions: upcoming.length > 0 ? upcoming : base.upcomingSessions,
      isRestDay: false,
    };
  }, [activeWorkoutPlan, resolvedWorkoutSessions, todayDayName, weeklySchedule, todayPlanned]);

  const rehabSchedule = useMemo(() => {
    const base = computeSchedule(activeRehabPlan, resolvedRehabSessions);
    if (weeklySchedule.length === 0) return base;

    const plannedRehabSlots = todayPlanned.activeSlots.filter(
      (s) => s.activity_type === 'rehab'
    );
    if (plannedRehabSlots.length === 0) {
      return {
        todaySessions: [] as PlanSessionItem[],
        upcomingSessions: resolvedRehabSessions,
        isRestDay: true,
      };
    }

    const mappedToday: PlanSessionItem[] = plannedRehabSlots.map((slot, idx) => {
      const fromResolved =
        resolvedRehabSessions.find(
          (r) =>
            (slot.worksession_id && r.worksessionId === slot.worksession_id) ||
            r.worksessionName.toLowerCase() === slot.title.toLowerCase()
        ) || resolvedRehabSessions[idx % Math.max(resolvedRehabSessions.length, 1)];

      const fromCatalog = slot.worksession_id
        ? DATABASE_WORKSESSIONS.find((w) => w.id === slot.worksession_id)
        : DATABASE_WORKSESSIONS.find(
            (w) => w.type === 'rehab' && w.title.toLowerCase() === slot.title.toLowerCase()
          );

      const wsCard =
        fromCatalog ||
        fromResolved?.worksession ||
        DATABASE_WORKSESSIONS.find((w) => w.type === 'rehab') ||
        DATABASE_WORKSESSIONS[0];

      return {
        dayName: todayDayName,
        worksessionId: wsCard.id,
        worksessionName: wsCard.title || slot.title,
        modality: wsCard.category || slot.subtitle || 'Clinical Rehab',
        exerciseCount: wsCard.exercises?.length || 4,
        worksession: wsCard,
        trackType: 'rehab',
      };
    });

    const todayIds = new Set(mappedToday.map((m) => m.worksessionId));
    const upcoming = resolvedRehabSessions.filter((r) => !todayIds.has(r.worksessionId));

    return {
      todaySessions: mappedToday,
      upcomingSessions: upcoming.length > 0 ? upcoming : base.upcomingSessions,
      isRestDay: false,
    };
  }, [activeRehabPlan, resolvedRehabSessions, todayDayName, weeklySchedule, todayPlanned]);

  const allUpcomingSessions = useMemo(() => {
    return [
      ...workoutSchedule.upcomingSessions.map((s) => ({ ...s, trackType: 'workout' as const })),
      ...rehabSchedule.upcomingSessions.map((s) => ({ ...s, trackType: 'rehab' as const })),
    ];
  }, [workoutSchedule.upcomingSessions, rehabSchedule.upcomingSessions]);

  const handleSaveSportLog = async (logData: {
    sportTitle: string;
    durationMinutes: number;
    hoursPlayed: number;
    intensity: string;
    rpe: number;
    notes: string;
    exerciseId?: string | null;
  }) => {
    if (logWorkout) {
      await logWorkout(
        logData.sportTitle,
        logData.durationMinutes,
        logData.intensity,
        logData.exerciseId || 'sport-session',
        {
          isSport: true,
          sessionType: 'sport',
          category: 'Collective Sports',
          hoursPlayed: logData.hoursPlayed,
          rpe: logData.rpe,
          notes: logData.notes,
          exerciseId: logData.exerciseId,
          durationFormatted: `${logData.hoursPlayed}h (${logData.durationMinutes}m)`,
        }
      );
      Alert.alert(
        'Sport Practice Logged! 🏐',
        `Recorded ${logData.hoursPlayed}h of ${logData.sportTitle} (RPE ${logData.rpe}/10).`
      );
    }
  };

  // Combined scheduled duration for today
  const totalTodayDuration = useMemo(() => {
    let mins = 0;
    todaySportSlots.forEach((s) => {
      mins += s.target_duration_minutes || 120;
    });
    workoutSchedule.todaySessions.forEach((s) => {
      mins += parseInt(s.worksession?.metrics?.duration || '45') || 45;
    });
    rehabSchedule.todaySessions.forEach((s) => {
      mins += parseInt(s.worksession?.metrics?.duration || '30') || 30;
    });
    if (mins === 0) return 'RECOVERY DAY';
    return `${mins} MIN TOTAL`;
  }, [todaySportSlots, workoutSchedule.todaySessions, rehabSchedule.todaySessions]);

  // 7. Dynamic Weekly Consistency Calculation from History
  const weeklyConsistency = useMemo(() => {
    let completedCount = 0;
    let totalSecs = 0;
    const targetSessions =
      (activeWorkoutPlan?.worksessions?.length || 4) +
      (activeRehabPlan?.worksessions?.length || 1);

    if (history) {
      const now = new Date();
      const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);

      Object.entries(history).forEach(([dateStr, dayData]: [string, any]) => {
        const d = new Date(dateStr);
        if (d >= startOfWeek && d <= now) {
          const workouts = dayData?.move?.workouts || [];
          completedCount += workouts.length;
          workouts.forEach((w: any) => {
            totalSecs += w.durationSeconds || (w.duration ? w.duration * 60 : 1500);
          });
        }
      });
    }

    const totalMinutes = Math.round(totalSecs / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMins = totalMinutes % 60;
    const percentMet = Math.min(100, Math.round((completedCount / Math.max(targetSessions, 1)) * 100));

    return {
      completedCount,
      targetSessions,
      percentMet,
      activeTimeFormatted: totalHours > 0 ? `${totalHours}h ${remainingMins}m` : `${remainingMins}m`,
    };
  }, [history, activeWorkoutPlan, activeRehabPlan]);

  // 8. Launch active workout
  const startSession = (selectedWs: DatabaseWorksessionCard, planObj?: DatabasePlan | null) => {
    const isRehab =
      selectedWs.type === 'rehab' ||
      (selectedWs.category || '').toLowerCase().includes('rehab') ||
      (selectedWs.title || '').toLowerCase().includes('rehab');

    const worksessionData = {
      name: selectedWs.title,
      focus: selectedWs.category,
      estimatedDuration: parseInt(selectedWs.metrics?.duration || '30') || 30,
      type: selectedWs.type,
      isRehab,
      category: selectedWs.category,
      exercises: (selectedWs.exercises || []).map((e) => ({
        name: e.name,
        cue: e.cue || 'Maintain strict form.',
        sets: e.sets || 3,
        reps: e.reps || 10,
        weight: e.weight || 'Standard',
        restSeconds: typeof e.restSeconds === 'number' ? e.restSeconds : (typeof (e as any).target_rest_seconds === 'number' ? (e as any).target_rest_seconds : 60),
        target_rest_seconds: typeof (e as any).target_rest_seconds === 'number' ? (e as any).target_rest_seconds : (typeof e.restSeconds === 'number' ? e.restSeconds : 60),
        target_duration_seconds: (e as any).target_duration_seconds,
        target_reps: (e as any).target_reps,
        hold_seconds_per_rep: (e as any).hold_seconds_per_rep,
        reps_per_set: (e as any).reps_per_set,
        durations_per_set: (e as any).durations_per_set,
        tracking_type: e.tracking_type || getExerciseTrackingType(e) || 'bodyweight',
        equipment: e.equipment,
        muscle_group: e.muscle_group,
      })),
    };

    if (setActiveSessionMetadata) {
      setActiveSessionMetadata({
        isActive: true,
        worksessionName: selectedWs.title,
        worksessionType: selectedWs.type,
        isRehab,
        currentExerciseName: selectedWs.exercises?.[0]?.name || 'Exercise 1',
        currentExerciseIndex: 0,
        totalExercises: selectedWs.exercises?.length || 0,
        currentSet: 1,
        totalSets: selectedWs.exercises?.[0]?.sets || 3,
        startTime: Date.now(),
      });
    }

    router.push({
      pathname: '/active-workout',
      params: {
        worksession: JSON.stringify(worksessionData),
        plan: JSON.stringify({
          id: planObj?.id || (isRehab ? activeRehabPlan?.id : activeWorkoutPlan?.id) || selectedWs.id,
          name: planObj?.name || (isRehab ? activeRehabPlan?.name : activeWorkoutPlan?.name) || selectedWs.title,
          type: selectedWs.type,
          isRehab,
        }),
      },
    });
  };

  // Helper to render session card for either track
  const renderSessionCard = (
    item: PlanSessionItem,
    planObj: DatabasePlan | null,
    isRehabTrack: boolean,
    keyIdx: number | string
  ) => {
    const ws = item.worksession;
    const isRehab = isRehabTrack || ws.type === 'rehab';
    const themeColor = isRehab ? KinetixTheme.colors.coral : KinetixTheme.colors.primary;
    const themeLight = isRehab ? KinetixTheme.colors.coralLight : KinetixTheme.colors.primaryLight;
    const bannerImg = getWorksessionImage(item.modality, ws.type);

    return (
      <View key={keyIdx} style={styles.trackCard}>
        {/* Track Top Bar */}
        <View style={styles.trackTopBar}>
          <View style={styles.trackIndicatorRow}>
            <View style={[styles.trackDot, { backgroundColor: themeColor }]} />
            <Text style={[styles.trackTrackTitle, { color: themeColor }]}>
              {isRehab ? 'Rehab & Recovery Track' : 'Performance Track'}
            </Text>
          </View>
          <View style={[styles.trackDurationPill, isRehab && { backgroundColor: themeLight }]}>
            <Text
              style={[
                styles.trackDurationText,
                isRehab && { color: themeColor },
              ]}
            >
              {ws.metrics?.duration || '35 min'} • {ws.exercises?.length || 3} exercises
            </Text>
          </View>
        </View>

        {/* Track Banner Info */}
        <View style={styles.trackBannerRow}>
          <Image source={{ uri: bannerImg }} style={styles.trackImage} />
          <View style={styles.trackBannerInfo}>
            <Text style={styles.trackName} numberOfLines={1}>
              {ws.title}
            </Text>
            <Text style={styles.trackDescription} numberOfLines={2}>
              {ws.description || `${item.dayName} • Structured athletic focus on ${item.modality}`}
            </Text>
            <View style={styles.badgesRow}>
              <View style={[styles.rpeBadge, { backgroundColor: themeLight }]}>
                <Text style={[styles.rpeBadgeText, { color: themeColor }]}>
                  {ws.metrics?.load || 'Standard Load'}
                </Text>
              </View>
              <Text style={styles.blockText}>{item.modality}</Text>
            </View>
          </View>
        </View>

        {/* Exercises Dynamic Preview List */}
        <View style={styles.exercisesList}>
          {(ws.exercises || []).slice(0, 3).map((ex: any, exIdx: number) => (
            <View key={exIdx} style={styles.exerciseItem}>
              <View
                style={[
                  styles.exerciseIndexBox,
                  isRehab && { backgroundColor: themeLight },
                ]}
              >
                <Text
                  style={[
                    styles.exerciseIndexText,
                    isRehab && { color: themeColor },
                  ]}
                >
                  {exIdx + 1}
                </Text>
              </View>
              <View style={styles.exerciseDetails}>
                <Text style={styles.exerciseTitle} numberOfLines={1}>
                  {ex.name}
                </Text>
                <Text style={styles.exerciseType} numberOfLines={1}>
                  {ex.muscle_group || ex.mechanics || ws.category}
                </Text>
              </View>
              <View style={styles.exerciseStats}>
                <Text
                  style={[
                    styles.exerciseSetsReps,
                    isRehab && { color: themeColor },
                  ]}
                >
                  {ex.sets} sets × {ex.reps}
                </Text>
                <Text style={styles.exerciseLoad}>
                  {ex.weight || ex.equipment || 'Standard'}
                </Text>
              </View>
            </View>
          ))}

          {(ws.exercises?.length || 0) > 3 && (
            <Text style={styles.moreExercisesText}>
              + {(ws.exercises?.length || 0) - 3} more exercises in this routine
            </Text>
          )}
        </View>

        {/* Start Workout Action Button */}
        <TouchableOpacity
          style={[styles.startWorkoutButton, { backgroundColor: themeColor }]}
          onPress={() => startSession(ws, planObj)}
          activeOpacity={0.88}
        >
          <View style={styles.ctaLeftContent}>
            <View style={styles.ctaPlayCircle}>
              <Ionicons name="play" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.ctaTitle}>
                {isRehab ? 'Start Rehab Protocol' : 'Start Workout'}
              </Text>
              <Text style={styles.ctaSubtitle} numberOfLines={1}>
                {ws.title}
              </Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        {isRehab && planObj?.phases && planObj.phases.length > 0 && (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              backgroundColor: '#FFF1F2',
              paddingVertical: 9,
              borderRadius: 8,
              marginTop: 8,
              borderWidth: 1,
              borderColor: '#FECDD3',
            }}
            onPress={() => router.push('/rehab-program')}
            activeOpacity={0.8}
          >
            <Ionicons name="shield-checkmark" size={15} color={themeColor} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: themeColor }}>
              Criteria Progression Roadmap ({planObj.phases.length} Phases)
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <KinetixHeader subtitle="ATHLETIC LAB" iconName="flash" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Athlete Greeting & Live Date */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingSub}>{greetingTimeOfDay}, {athleteName}</Text>
          <Text style={styles.greetingDate}>{todayFormatted}</Text>
        </View>

        {/* Weekly Consistency Card (Dynamic from History & Active Plan) */}
        <View style={styles.consistencyCard}>
          <View style={styles.consistencyHeader}>
            <View style={styles.consistencyTitleRow}>
              <Ionicons name="calendar-outline" size={17} color={KinetixTheme.colors.primary} />
              <Text style={styles.consistencyTitle}>Weekly Consistency</Text>
            </View>
            <View style={styles.consistencyBadge}>
              <Text style={styles.consistencyBadgeText}>
                {weeklyConsistency.percentMet}% Target Met
              </Text>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Completed</Text>
              <Text style={styles.metricValue}>
                {weeklyConsistency.completedCount} / {weeklyConsistency.targetSessions}
              </Text>
              <Text style={styles.metricSub}>Sessions target</Text>
            </View>

            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Schedule</Text>
              <Text style={styles.metricValue} numberOfLines={1}>
                {activeWorkoutPlan?.schedule_type === 'anchored' ? 'Anchored' : 'Floating'}
              </Text>
              <Text style={[styles.metricSub, { color: KinetixTheme.colors.primary }]}>
                {activeWorkoutPlan?.goal_category || 'Active'}
              </Text>
            </View>

            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Active Time</Text>
              <Text style={styles.metricValue}>{weeklyConsistency.activeTimeFormatted}</Text>
              <Text style={styles.metricSub}>This week</Text>
            </View>
          </View>
        </View>

        {/* Active Plans Container (Workout Plan & Rehab Protocol) */}
        <View style={styles.activePlansContainer}>
          {/* Row 1: Active Workout Plan */}
          <View style={styles.activePlanRow}>
            <View style={styles.activePlanInfoCol}>
              <View style={styles.activePlanBadgeRow}>
                <View style={styles.activePlanIndicatorDot} />
                <Text style={styles.activePlanBadgeText}>ACTIVE WORKOUT PLAN</Text>
              </View>
              <Text style={styles.activePlanNameText} numberOfLines={1}>
                {activeWorkoutPlan?.name || 'No Workout Plan Active'}
              </Text>
              <Text style={styles.activePlanScheduleMetaText} numberOfLines={1}>
                {activeWorkoutPlan?.schedule_type === 'anchored' ? 'Fixed Days Schedule' : 'Floating Sequence'} •{' '}
                {resolvedWorkoutSessions.length} {resolvedWorkoutSessions.length === 1 ? 'Session' : 'Sessions'}
              </Text>
            </View>

            <View style={styles.activePlanStatusBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#059669" />
              <Text style={styles.activePlanStatusText}>Active</Text>
            </View>
          </View>

          <View style={styles.activePlansDivider} />

          {/* Row 2: Active Rehab Protocol */}
          <View style={styles.activePlanRow}>
            <View style={styles.activePlanInfoCol}>
              <View style={styles.activePlanBadgeRow}>
                <View style={[styles.activePlanIndicatorDot, { backgroundColor: KinetixTheme.colors.coral }]} />
                <Text style={[styles.activePlanBadgeText, { color: KinetixTheme.colors.coral }]}>ACTIVE REHAB PROTOCOL</Text>
              </View>
              <Text style={styles.activePlanNameText} numberOfLines={1}>
                {activeRehabPlan?.name || 'No Rehab Protocol Active'}
              </Text>
              <Text style={styles.activePlanScheduleMetaText} numberOfLines={1}>
                {activeRehabPlan?.schedule_type === 'anchored' ? 'Fixed Days Schedule' : 'Targeted Protocol'} •{' '}
                {resolvedRehabSessions.length} {resolvedRehabSessions.length === 1 ? 'Routine' : 'Routines'}
              </Text>
            </View>

            <View style={[styles.activePlanStatusBadge, { backgroundColor: KinetixTheme.colors.coralLight, borderColor: '#FED7AA' }]}>
              <Ionicons name="checkmark-circle" size={14} color={KinetixTheme.colors.coral} />
              <Text style={[styles.activePlanStatusText, { color: KinetixTheme.colors.coral }]}>Active</Text>
            </View>
          </View>

          <View style={styles.activePlansDivider} />

          {/* Row 3: Unified Weekly Schedule & Sports Routine */}
          <View style={styles.activePlanRow}>
            <View style={styles.activePlanInfoCol}>
              <View style={styles.activePlanBadgeRow}>
                <View style={[styles.activePlanIndicatorDot, { backgroundColor: '#D97706' }]} />
                <Text style={[styles.activePlanBadgeText, { color: '#D97706' }]}>
                  WEEKLY HYBRID SCHEDULE
                </Text>
              </View>
              <Text style={styles.activePlanNameText} numberOfLines={1}>
                {todayPlanned.activeSlots.length > 0
                  ? `${todayDayName}: ${todayPlanned.activeSlots.map((s) => s.title).join(' + ')}`
                  : `${todayDayName}: Scheduled Rest & Recovery Day`}
              </Text>
              <Text style={styles.activePlanScheduleMetaText} numberOfLines={1}>
                Sports, Workout Plan & Rehab Phase Dependencies synced
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.activePlanStatusBadge,
                { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
              ]}
              onPress={() => router.push('/history')}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar" size={13} color={KinetixTheme.colors.primary} />
              <Text style={[styles.activePlanStatusText, { color: KinetixTheme.colors.primary }]}>
                Edit Schedule
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Schedule Section Heading */}
        <View style={styles.scheduleHeaderRow}>
          <Text style={styles.sectionHeading}>Today's Schedule</Text>
          <View style={styles.timeTag}>
            <Ionicons
              name={workoutSchedule.isRestDay && rehabSchedule.todaySessions.length === 0 && todaySportSlots.length === 0 ? 'leaf-outline' : 'time-outline'}
              size={13}
              color={workoutSchedule.isRestDay && rehabSchedule.todaySessions.length === 0 && todaySportSlots.length === 0 ? '#059669' : KinetixTheme.colors.textMuted}
            />
            <Text
              style={[
                styles.timeTagText,
                workoutSchedule.isRestDay && rehabSchedule.todaySessions.length === 0 && todaySportSlots.length === 0 && { color: '#059669', fontWeight: '800' },
              ]}
            >
              {totalTodayDuration}
            </Text>
          </View>
        </View>

        {/* 0. Today's Scheduled Collective Sport Practice Cards */}
        {todaySportSlots.map((sportSlot) => {
          const targetHrs = ((sportSlot.target_duration_minutes || 120) / 60)
            .toFixed(1)
            .replace(/\.0$/, '');
          return (
            <View
              key={sportSlot.id}
              style={[
                styles.trackCard,
                { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' },
              ]}
            >
              <View style={styles.trackTopBar}>
                <View style={styles.trackIndicatorRow}>
                  <View style={[styles.trackDot, { backgroundColor: '#D97706' }]} />
                  <Text style={[styles.trackTrackTitle, { color: '#D97706' }]}>
                    Collective Sports Practice
                  </Text>
                </View>
                <View style={[styles.trackDurationPill, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.trackDurationText, { color: '#B45309' }]}>
                    Target: {targetHrs}h ({sportSlot.target_duration_minutes || 120} min)
                  </Text>
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={styles.trackName}>{sportSlot.title}</Text>
                <Text style={styles.trackDescription}>
                  Scheduled for {todayDayName} • Manual hours & RPE tracking enabled
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.startWorkoutButton, { backgroundColor: '#D97706' }]}
                onPress={() => setSportLogSlot(sportSlot)}
                activeOpacity={0.88}
              >
                <View style={styles.ctaLeftContent}>
                  <View style={styles.ctaPlayCircle}>
                    <Ionicons name="time-outline" size={20} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.ctaTitle}>Log Practice Hours</Text>
                    <Text style={styles.ctaSubtitle}>
                      Record {targetHrs}h {sportSlot.title} & RPE
                    </Text>
                  </View>
                </View>
                <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          );
        })}

        {/* 1. Both Tracks Rest Day */}
        {workoutSchedule.isRestDay && rehabSchedule.todaySessions.length === 0 && (
          <View style={styles.restDayCard}>
            <View style={styles.restDayHeader}>
              <View style={styles.restDayIconBadge}>
                <Ionicons name="sparkles" size={18} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.restDayTitle}>Active Recovery & Regeneration</Text>
                <Text style={styles.restDaySub}>
                  No prescribed session for {todayDayName} in {activeWorkoutPlan?.name || 'Active Plan'}
                </Text>
              </View>
            </View>
            <Text style={styles.restDayBody}>
              Tendon remodeling, neuromuscular adaptation, and systemic recovery happen on rest days.
              Focus on hydration, mobility, and light movement.
            </Text>

            {allUpcomingSessions.length > 0 && (
              <TouchableOpacity
                style={styles.trainAheadBtn}
                onPress={() => {
                  const firstUpcoming = allUpcomingSessions[0];
                  const planObj = firstUpcoming.trackType === 'rehab' ? activeRehabPlan : activeWorkoutPlan;
                  startSession(firstUpcoming.worksession, planObj);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="flash-outline" size={15} color={KinetixTheme.colors.primary} />
                <Text style={styles.trainAheadBtnText}>
                  Train Next Session Early ({allUpcomingSessions[0].dayName})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 2. Performance Track Rest Day (while Rehab is active) */}
        {workoutSchedule.isRestDay && rehabSchedule.todaySessions.length > 0 && (
          <View style={styles.restDayCardCompact}>
            <View style={styles.restDayHeaderCompact}>
              <View style={styles.restDayIconBadgeCompact}>
                <Ionicons name="sparkles" size={16} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.restDayTitleCompact}>Performance Track: Recovery Day</Text>
                <Text style={styles.restDaySubCompact}>
                  Rest day in {activeWorkoutPlan?.name || 'Workout Plan'}. Complete your active rehab protocol below.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 3. Performance Track Today's Sessions */}
        {!workoutSchedule.isRestDay &&
          workoutSchedule.todaySessions.map((item, sIndex) =>
            renderSessionCard(item, activeWorkoutPlan, false, `workout-${sIndex}`)
          )}

        {/* 4. Rehab Track Today's Sessions */}
        {rehabSchedule.todaySessions.map((item, sIndex) =>
          renderSessionCard(item, activeRehabPlan, true, `rehab-${sIndex}`)
        )}

        {/* Upcoming Training Sessions Section */}
        {allUpcomingSessions.length > 0 && (
          <View style={styles.upcomingSection}>
            <View style={styles.upcomingHeaderRow}>
              <View style={styles.upcomingTitleGroup}>
                <Ionicons name="calendar-outline" size={16} color={KinetixTheme.colors.primary} />
                <Text style={styles.upcomingSectionTitle}>
                  Upcoming Training Sessions
                </Text>
              </View>
              <Text style={styles.upcomingCountBadge}>
                {allUpcomingSessions.length} {allUpcomingSessions.length === 1 ? 'SESSION' : 'SESSIONS'}
              </Text>
            </View>

            {allUpcomingSessions.map((item, idx) => {
              const isRehab = item.trackType === 'rehab';
              const planObj = isRehab ? activeRehabPlan : activeWorkoutPlan;
              const themeColor = isRehab ? KinetixTheme.colors.coral : KinetixTheme.colors.primary;
              const themeLight = isRehab ? KinetixTheme.colors.coralLight : KinetixTheme.colors.primaryLight;

              return (
                <TouchableOpacity
                  key={`upcoming-${idx}`}
                  style={styles.upcomingItemCard}
                  activeOpacity={0.7}
                  onPress={() => startSession(item.worksession, planObj)}
                >
                  <View style={[styles.upcomingDayBadge, isRehab && { backgroundColor: themeLight }]}>
                    <Text style={[styles.upcomingDayText, isRehab && { color: themeColor }]}>
                      {item.dayName.toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.upcomingInfoCol}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <View style={[styles.trackPillSmall, { backgroundColor: isRehab ? themeLight : '#ECFDF5' }]}>
                        <Text style={[styles.trackPillSmallText, { color: isRehab ? themeColor : '#059669' }]}>
                          {isRehab ? 'REHAB' : 'WORKOUT'}
                        </Text>
                      </View>
                      <Text style={styles.upcomingTitleText} numberOfLines={1}>
                        {item.worksession.title}
                      </Text>
                    </View>
                    <Text style={styles.upcomingMetaText} numberOfLines={1}>
                      {item.modality} • {item.worksession.metrics?.duration || '35 min'} •{' '}
                      {item.worksession.exercises?.length || 3} exercises
                    </Text>
                  </View>

                  <View style={[styles.upcomingPlayBtn, isRehab && { backgroundColor: themeLight }]}>
                    <Ionicons name="play" size={13} color={themeColor} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Empty Sessions State */}
        {resolvedWorkoutSessions.length === 0 && resolvedRehabSessions.length === 0 && (
          <View style={styles.emptyPlanCard}>
            <Ionicons name="barbell-outline" size={36} color={KinetixTheme.colors.textMuted} />
            <Text style={styles.emptyPlanTitle}>No Sessions Attached</Text>
            <Text style={styles.emptyPlanSubtitle}>
              Neither your active workout plan nor your active rehab protocol has worksessions attached yet.
              Choose another active plan or protocol in the Workouts tab.
            </Text>
            <TouchableOpacity
              style={styles.emptyPlanChangeBtn}
              onPress={() => router.push('/plans')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyPlanChangeBtnText}>Browse Plans in Workouts</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <SportQuickLogModal
        visible={Boolean(sportLogSlot)}
        sportTitle={sportLogSlot?.title || 'Volleyball Practice'}
        exerciseId={sportLogSlot?.exercise_id}
        defaultDurationMinutes={sportLogSlot?.target_duration_minutes || 120}
        defaultIntensity={sportLogSlot?.intensity_target || 'High'}
        targetDateLabel={`Today (${todayFormatted})`}
        onClose={() => setSportLogSlot(null)}
        onSaveLog={handleSaveSportLog}
      />

      {/* Persistent Bottom Nav */}
      <KinetixBottomNav activeTab="today" />
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
  greetingSection: {
    marginBottom: 16,
  },
  greetingSub: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  greetingDate: {
    fontSize: 24,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  consistencyCard: {
    backgroundColor: KinetixTheme.colors.surface,
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    marginBottom: 16,
    ...KinetixTheme.shadows.card,
  },
  consistencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  consistencyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  consistencyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  consistencyBadge: {
    backgroundColor: KinetixTheme.colors.secondaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: KinetixTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  consistencyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.secondaryDark,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
  },
  metricBlock: {
    flex: 1,
    backgroundColor: KinetixTheme.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: KinetixTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    marginTop: 3,
  },
  metricSub: {
    fontSize: 10,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
    marginTop: 2,
  },
  activePlansContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    overflow: 'hidden',
    ...KinetixTheme.shadows.card,
  },
  activePlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  activePlansDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 14,
  },
  activePlanStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    ...KinetixTheme.shadows.card,
  },
  activePlanInfoCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },
  activePlanBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  activePlanIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: KinetixTheme.colors.primary,
  },
  activePlanBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
    letterSpacing: 0.6,
  },
  activePlanNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.2,
  },
  activePlanScheduleMetaText: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  activePlanStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: KinetixTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  activePlanStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.2,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.textMuted,
    letterSpacing: 0.5,
  },
  restDayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 20,
    ...KinetixTheme.shadows.card,
  },
  restDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  restDayIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restDayTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
  },
  restDaySub: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '500',
    marginTop: 1,
  },
  restDayBody: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 14,
  },
  trainAheadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: KinetixTheme.colors.primaryLight,
    paddingVertical: 10,
    borderRadius: KinetixTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  trainAheadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.primary,
  },
  restDayCardCompact: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 16,
  },
  restDayHeaderCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  restDayIconBadgeCompact: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restDayTitleCompact: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  restDaySubCompact: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '500',
    marginTop: 1,
  },
  trackCard: {
    backgroundColor: KinetixTheme.colors.surface,
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    marginBottom: 16,
    ...KinetixTheme.shadows.card,
  },
  trackTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  trackIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trackTrackTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  trackDurationPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: KinetixTheme.borderRadius.full,
  },
  trackDurationText: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  trackBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  trackImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  trackBannerInfo: {
    flex: 1,
    minWidth: 0,
  },
  trackName: {
    fontSize: 16,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.2,
  },
  trackDescription: {
    fontSize: 12,
    color: KinetixTheme.colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  rpeBadge: {
    backgroundColor: KinetixTheme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rpeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.primary,
  },
  blockText: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  exercisesList: {
    paddingTop: 10,
    gap: 8,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KinetixTheme.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: KinetixTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  exerciseIndexBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: KinetixTheme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  exerciseIndexText: {
    fontSize: 12,
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
  },
  exerciseDetails: {
    flex: 1,
    minWidth: 0,
  },
  exerciseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
  },
  exerciseType: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    marginTop: 1,
  },
  exerciseStats: {
    alignItems: 'flex-end',
  },
  exerciseSetsReps: {
    fontSize: 12,
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
  },
  exerciseLoad: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    marginTop: 1,
  },
  moreExercisesText: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
    textAlign: 'center',
    paddingVertical: 2,
  },
  startWorkoutButton: {
    backgroundColor: KinetixTheme.colors.primary,
    borderRadius: KinetixTheme.borderRadius.xl,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    ...KinetixTheme.shadows.primaryGlow,
  },
  ctaLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  ctaPlayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  ctaSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#DBEAFE',
    marginTop: 1,
  },
  upcomingSection: {
    marginTop: 6,
    marginBottom: 16,
  },
  upcomingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  upcomingTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  upcomingSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.2,
  },
  upcomingCountBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: KinetixTheme.colors.textMuted,
    letterSpacing: 0.5,
  },
  upcomingItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    ...KinetixTheme.shadows.card,
  },
  upcomingDayBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
    minWidth: 54,
    alignItems: 'center',
  },
  upcomingDayText: {
    fontSize: 10,
    fontWeight: '800',
    color: KinetixTheme.colors.textSecondary,
    letterSpacing: 0.4,
  },
  upcomingInfoCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  trackPillSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trackPillSmallText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  upcomingTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
  },
  upcomingMetaText: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    marginTop: 2,
  },
  upcomingPlayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: KinetixTheme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    marginBottom: 16,
  },
  emptyPlanTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    marginTop: 10,
  },
  emptyPlanSubtitle: {
    fontSize: 12,
    color: KinetixTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  emptyPlanChangeBtn: {
    marginTop: 14,
    backgroundColor: KinetixTheme.colors.primary,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: KinetixTheme.borderRadius.md,
  },
  emptyPlanChangeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
