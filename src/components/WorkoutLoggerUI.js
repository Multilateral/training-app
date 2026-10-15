import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase, TrainingContext, getDateString } from '../context/TrainingContext';
import { getWorksessionDescription, RECOVERY_WORKSESSIONS_METADATA } from '../data/recoveryMetadata';
import { 
  getCurrentWeekDays, 
  computeWeeklyMetrics, 
  DEFAULT_GOALS, 
  triggerHaptic 
} from '../utils/dashboardUtils';

// Dashboard Interactive Components
import WeeklyMomentumStrip from './dashboard/WeeklyMomentumStrip';
import ActiveGoalsTracker from './dashboard/ActiveGoalsTracker';
import RecoveryBodyMap from './dashboard/RecoveryBodyMap';
import ReadyStateHeroCard from './dashboard/ReadyStateHeroCard';
import DockedQuickLogBar from './dashboard/DockedQuickLogBar';
import DaySummaryModal from './dashboard/DaySummaryModal';
import GoalEditorModal from './dashboard/GoalEditorModal';
import SessionSwitcherModal from './dashboard/SessionSwitcherModal';
import MicroLogModal from './dashboard/MicroLogModal';

export default function WorkoutLoggerUI() {
  const router = useRouter();
  const { 
    history, 
    logWorkout, 
    workspaces, 
    updateWorkspaces, 
    activeSessionMetadata, 
    session 
  } = useContext(TrainingContext);

  const todayStr = getDateString ? getDateString() : new Date().toISOString().split('T')[0];
  const todayProfile = history[todayStr] || { foods: [], fastingCompletedHours: 0 };
  const moveProfile = todayProfile.move || { workouts: [], stepCount: 0 };

  // Data fetching state
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Swapped Hero session if user chooses another session for today
  const [swappedSession, setSwappedSession] = useState(null);

  // Body map readiness state (persisted in workspaces if available)
  const [readinessState, setReadinessState] = useState(workspaces?.readiness || {});

  // Modals state
  const [daySummaryModal, setDaySummaryModal] = useState({
    visible: false,
    day: null,
    workouts: [],
    hasPlannedSession: false
  });
  const [isGoalEditorVisible, setIsGoalEditorVisible] = useState(false);
  const [isSessionSwitcherVisible, setIsSessionSwitcherVisible] = useState(false);
  const [microLogModal, setMicroLogModal] = useState({
    visible: false,
    mode: 'quick_set' // 'quick_set', 'mobility', 'custom'
  });

  // Calculate current week days (Monday - Sunday)
  const weekDays = useMemo(() => getCurrentWeekDays(), []);

  // Compute metrics: weekly sessions completed, active minutes, recovery sessions, streaks
  const weeklyMetrics = useMemo(() => {
    return computeWeeklyMetrics(history, weekDays);
  }, [history, weekDays]);

  // Compute Active Goals with real-time weekly progress
  const activeGoals = useMemo(() => {
    const storedGoals = workspaces?.goals || DEFAULT_GOALS;
    return storedGoals.map(goal => {
      let current = 0;
      if (goal.type === 'weekly_frequency') {
        current = weeklyMetrics.completedThisWeekCount;
      } else if (goal.type === 'recovery_target') {
        current = weeklyMetrics.recoverySessionsThisWeek;
      } else if (goal.type === 'volume') {
        current = weeklyMetrics.totalMinutesThisWeek;
      } else {
        current = goal.current_value || 0;
      }
      return {
        ...goal,
        current_value: current
      };
    });
  }, [workspaces?.goals, weeklyMetrics]);

  // Fetch plans from database
  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const { data, error } = await supabase
        .from('training_plans')
        .select(`
          id, name, schedule_type, is_standard_template,
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

  // Determine Default Plan
  const defaultPlan = useMemo(() => {
    return availablePlans.find(p => p.id === workspaces?.defaultPlanId) ||
      (availablePlans.length > 0 ? availablePlans[0] : null);
  }, [availablePlans, workspaces?.defaultPlanId]);

  // Determine Scheduled Routine for Today's Hero Card
  const scheduledRoutine = useMemo(() => {
    if (swappedSession) return swappedSession;

    const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    if (defaultPlan) {
      if (defaultPlan.schedule_type === 'anchored') {
        const anchoredMatch = defaultPlan.plan_worksessions?.find(
          pw => pw.day_name && pw.day_name.startsWith(todayDayName)
        );
        if (anchoredMatch && anchoredMatch.worksessions) {
          const ws = anchoredMatch.worksessions;
          return {
            plan: defaultPlan,
            worksession: ws,
            name: ws.name,
            description: getWorksessionDescription(ws) || ws.description,
            durationEstimate: '30 min',
            targetAreas: [ws.modality || 'Strength', 'Anchored']
          };
        }
      }

      // Floating or fallback to first worksession in plan
      const firstPw = defaultPlan.plan_worksessions?.[0];
      if (firstPw && firstPw.worksessions) {
        const ws = firstPw.worksessions;
        return {
          plan: defaultPlan,
          worksession: ws,
          name: ws.name,
          description: getWorksessionDescription(ws) || ws.description,
          durationEstimate: '25-30 min',
          targetAreas: [ws.modality || 'Full Body', 'Floating']
        };
      }
    }

    // Default pre-seeded Fallback Routine: Worksession F (360° Core & Anti-Rotation)
    return {
      plan: defaultPlan,
      worksession: null,
      name: 'Worksession F: 360° Core & Anti-Rotation',
      description: 'Delivers comprehensive midsection conditioning across sagittal, frontal, and transverse planes.',
      durationEstimate: '25 min',
      targetAreas: ['Core', 'TRX', 'Anti-Rotation']
    };
  }, [swappedSession, defaultPlan]);

  // Start Active Workout flow
  const startActiveSession = async (plan, worksession) => {
    let wsToStart = worksession;
    let planToStart = plan || defaultPlan;

    // If worksession is null, attempt to find a default worksession from available plans
    if (!wsToStart) {
      if (availablePlans.length > 0 && availablePlans[0].plan_worksessions?.length > 0) {
        planToStart = availablePlans[0];
        wsToStart = availablePlans[0].plan_worksessions[0].worksessions;
      }
    }

    if (!wsToStart) {
      Alert.alert('Notice', 'No worksession attached. You can create or choose one in Workout Plans.');
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
          plan: JSON.stringify(planToStart || { name: 'Quick Workout' }),
          worksession: JSON.stringify(wsToStart)
        }
      });
    } catch (e) {
      console.error('Failed to start session', e);
      Alert.alert('Error', 'Failed to start workout session.');
    }
  };

  // Resume ongoing session
  const resumeActiveSession = () => {
    if (!activeSessionMetadata) return;
    router.push({
      pathname: '/active-workout',
      params: {
        sessionId: activeSessionMetadata.sessionId,
        plan: JSON.stringify(activeSessionMetadata.plan),
        worksession: JSON.stringify(activeSessionMetadata.worksession)
      }
    });
  };

  // Body Map Readiness Toggle
  const handleToggleReadinessArea = (areaId, nextState) => {
    const updated = { ...readinessState, [areaId]: nextState };
    setReadinessState(updated);
    if (updateWorkspaces) {
      updateWorkspaces({
        ...workspaces,
        readiness: updated
      });
    }
  };

  // Start Recovery / Prehab Protocol from Body Map Prompt
  const handleStartRecoveryPrep = async (area) => {
    triggerHaptic('medium');
    const targetWsId = area.recoveryWorksessionId;

    // Try finding the pre-built worksession in availablePlans
    let foundWs = null;
    let foundPlan = null;

    for (const p of availablePlans) {
      for (const pw of p.plan_worksessions || []) {
        if (pw.worksession_id === targetWsId || pw.worksessions?.id === targetWsId) {
          foundWs = pw.worksessions;
          foundPlan = p;
          break;
        }
      }
      if (foundWs) break;
    }

    if (foundWs) {
      startActiveSession(foundPlan, foundWs);
    } else {
      // Query worksession from Supabase directly
      try {
        const { data: wsData, error } = await supabase
          .from('worksessions')
          .select(`
            id, name, modality, description,
            worksession_exercises (
              id, target_sets, target_reps, tracking_type, target_time, notes,
              exercises (id, name, category, equipment, muscle_group, instructions, difficulty, mechanics)
            )
          `)
          .eq('id', targetWsId)
          .single();

        if (wsData) {
          startActiveSession({ name: 'Recovery & Prehab' }, wsData);
        } else {
          // Fallback: log a quick 5-min prep
          logWorkout(`Prehab Prep: ${area.recoverySessionName}`, 5, 'Low');
          Alert.alert('Prehab Logged', `5-minute ${area.label} prep was recorded to today's log.`);
        }
      } catch (err) {
        logWorkout(`Prehab Prep: ${area.recoverySessionName}`, 5, 'Low');
        Alert.alert('Prehab Logged', `5-minute ${area.label} prep was recorded to today's log.`);
      }
    }
  };

  // Save Goals update
  const handleSaveGoals = (updatedGoals) => {
    if (updateWorkspaces) {
      updateWorkspaces({
        ...workspaces,
        goals: updatedGoals
      });
    }

    // Also attempt background sync to user_goals table if it exists
    if (session?.user?.id) {
      updatedGoals.forEach(async (g) => {
        try {
          await supabase.from('user_goals').upsert({
            id: g.id.startsWith('goal-custom') ? undefined : g.id,
            user_id: session.user.id,
            title: g.title,
            type: g.type,
            target_value: g.target_value,
            unit: g.unit,
            timeframe: g.timeframe,
            updated_at: new Date().toISOString()
          });
        } catch (e) {
          // Gracefully fallback to workspaces_data
        }
      });
    }
  };

  // Micro-action log handler
  const handleSaveMicroLog = (title, duration, intensity) => {
    logWorkout(title, duration, intensity, defaultPlan?.id);
    triggerHaptic('heavy');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header & Weekly Momentum Strip */}
        <WeeklyMomentumStrip
          weekDays={weekDays}
          history={history}
          defaultPlan={defaultPlan}
          activeStreakDays={weeklyMetrics.activeStreakDays}
          onSelectDay={(day, workouts, hasPlannedSession) => {
            setDaySummaryModal({
              visible: true,
              day,
              workouts,
              hasPlannedSession
            });
          }}
        />

        {/* 2. Active Goals Tracker */}
        <ActiveGoalsTracker
          goals={activeGoals}
          onOpenGoalEditor={() => setIsGoalEditorVisible(true)}
        />

        {/* 3. Interactive Recovery Check-in / Body Map */}
        <RecoveryBodyMap
          readinessState={readinessState}
          onToggleArea={handleToggleReadinessArea}
          onStartRecoveryPrep={handleStartRecoveryPrep}
        />

        {/* 4. Dynamic "Ready-State" Hero Card (Today's Workout) */}
        {loadingPlans && !defaultPlan ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#00D09E" />
            <Text style={styles.loadingText}>Loading training routines...</Text>
          </View>
        ) : (
          <ReadyStateHeroCard
            scheduledSession={scheduledRoutine}
            activeSessionMetadata={activeSessionMetadata}
            todayWorkouts={moveProfile.workouts}
            onStartSession={() => startActiveSession(scheduledRoutine?.plan, scheduledRoutine?.worksession)}
            onResumeSession={resumeActiveSession}
            onOpenSessionSwitcher={() => setIsSessionSwitcherVisible(true)}
          />
        )}

        {/* Recent Workouts Logged Today List (if any) */}
        {moveProfile.workouts.length > 0 && (
          <View style={styles.todayWorkoutsSection}>
            <Text style={styles.sectionHeader}>Today's Completed Activities</Text>
            {moveProfile.workouts.map(w => (
              <View key={w.id} style={styles.workoutItemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.workoutItemTitle}>{w.type}</Text>
                  <Text style={styles.workoutItemMeta}>
                    {w.intensity ? `${w.intensity} Intensity • ` : ''}{w.duration} min
                  </Text>
                </View>
                <View style={styles.completedCheck}>
                  <Text style={{ color: '#00D09E', fontWeight: 'bold', fontSize: 12 }}>DONE</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 5. Docked Micro-Action Quick Log Bar (Bottom) */}
      <DockedQuickLogBar
        onOpenQuickSet={() => setMicroLogModal({ visible: true, mode: 'quick_set' })}
        onOpenMobility={() => setMicroLogModal({ visible: true, mode: 'mobility' })}
        onOpenCustomActivity={() => setMicroLogModal({ visible: true, mode: 'custom' })}
      />

      {/* MODALS */}
      <DaySummaryModal
        visible={daySummaryModal.visible}
        day={daySummaryModal.day}
        workouts={daySummaryModal.workouts}
        hasPlannedSession={daySummaryModal.hasPlannedSession}
        onClose={() => setDaySummaryModal({ visible: false, day: null, workouts: [], hasPlannedSession: false })}
        onLogForDay={() => setMicroLogModal({ visible: true, mode: 'custom' })}
      />

      <GoalEditorModal
        visible={isGoalEditorVisible}
        goals={activeGoals}
        onClose={() => setIsGoalEditorVisible(false)}
        onSaveGoals={handleSaveGoals}
      />

      <SessionSwitcherModal
        visible={isSessionSwitcherVisible}
        availablePlans={availablePlans}
        onClose={() => setIsSessionSwitcherVisible(false)}
        onSelectSession={(plan, worksession) => {
          setSwappedSession({
            plan,
            worksession,
            name: worksession.name,
            description: getWorksessionDescription(worksession) || worksession.description,
            durationEstimate: '25-30 min',
            targetAreas: [worksession.modality || 'Custom', 'Selected']
          });
        }}
      />

      <MicroLogModal
        visible={microLogModal.visible}
        mode={microLogModal.mode}
        onClose={() => setMicroLogModal({ visible: false, mode: 'quick_set' })}
        onSaveLog={handleSaveMicroLog}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111'
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110 // Ensures docked bar does not overlap cards
  },
  loadingCard: {
    backgroundColor: '#1E1E28',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#323242'
  },
  loadingText: {
    color: '#8E8E9F',
    fontSize: 13,
    marginTop: 10
  },
  todayWorkoutsSection: {
    backgroundColor: '#1A1A22',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2D2D38'
  },
  sectionHeader: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12
  },
  workoutItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#282836'
  },
  workoutItemTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600'
  },
  workoutItemMeta: {
    color: '#8E8E9F',
    fontSize: 12,
    marginTop: 2
  },
  completedCheck: {
    backgroundColor: '#00D09E18',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  }
});
