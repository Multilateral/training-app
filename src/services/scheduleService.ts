// ============================================================================
// Service: scheduleService.ts
// Manages the 7-Day Unified Weekly Schedule Planner (Workouts + Rehab + Sports),
// Plan-Schedule Frequency Dependencies, and Dynamic Rehab Completion Forecasts.
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../context/TrainingContext';
import { WeeklyScheduleSlot, ScheduleActivityType } from '../types/database';
import { DatabasePlan, DATABASE_WORKSESSIONS } from '../data/databaseLibraryData';
import { UserEnrollment } from './rehabProgressionService';

export const WEEKLY_SCHEDULE_STORAGE_KEY = '@kinetix_weekly_schedule_v1';

export const WEEKDAYS_ORDERED: Array<{
  day_of_week: WeeklyScheduleSlot['day_of_week'];
  shortLabel: string;
  letter: string;
  day_index: number;
}> = [
  { day_of_week: 'Monday', shortLabel: 'Mon', letter: 'M', day_index: 0 },
  { day_of_week: 'Tuesday', shortLabel: 'Tue', letter: 'T', day_index: 1 },
  { day_of_week: 'Wednesday', shortLabel: 'Wed', letter: 'W', day_index: 2 },
  { day_of_week: 'Thursday', shortLabel: 'Thu', letter: 'T', day_index: 3 },
  { day_of_week: 'Friday', shortLabel: 'Fri', letter: 'F', day_index: 4 },
  { day_of_week: 'Saturday', shortLabel: 'Sat', letter: 'S', day_index: 5 },
  { day_of_week: 'Sunday', shortLabel: 'Sun', letter: 'S', day_index: 6 },
];

export interface CollectiveSportOption {
  exercise_id: string;
  name: string;
  icon: string;
  default_duration_minutes: number;
  default_intensity: string;
}

export const COLLECTIVE_SPORTS_CATALOG: CollectiveSportOption[] = [
  {
    exercise_id: 'bedd9064-688f-45df-94d7-7f9ad2bb44f8',
    name: 'Volleyball',
    icon: 'baseball-outline',
    default_duration_minutes: 120,
    default_intensity: 'High',
  },
  {
    exercise_id: '1f49b421-bcc4-4857-b39d-d77eb4c6bc8d',
    name: 'Basketball',
    icon: 'basketball-outline',
    default_duration_minutes: 90,
    default_intensity: 'High',
  },
  {
    exercise_id: 'd77447ac-4b73-460c-bcf6-02b32967acca',
    name: 'Football',
    icon: 'american-football-outline',
    default_duration_minutes: 90,
    default_intensity: 'High',
  },
  {
    exercise_id: 'e88be6b6-90bb-4d39-bdfe-af55024527a8',
    name: 'Soccer',
    icon: 'football-outline',
    default_duration_minutes: 90,
    default_intensity: 'High',
  },
  {
    exercise_id: '73c46d43-c3ea-4135-990b-59bdf15f963a',
    name: 'Tennis',
    icon: 'tennisball-outline',
    default_duration_minutes: 90,
    default_intensity: 'Moderate',
  },
  {
    exercise_id: 'f3b09455-1f70-4b63-bcfd-454cbeac9583',
    name: 'Badminton',
    icon: 'tennisball-outline',
    default_duration_minutes: 60,
    default_intensity: 'Moderate',
  },
  {
    exercise_id: '1203e988-ae00-459f-942c-9a8de0b4deb2',
    name: 'Handball',
    icon: 'baseball-outline',
    default_duration_minutes: 90,
    default_intensity: 'High',
  },
  {
    exercise_id: '61893525-d2c5-40d9-962c-749ebe758268',
    name: 'Rugby',
    icon: 'american-football-outline',
    default_duration_minutes: 90,
    default_intensity: 'High',
  },
  {
    exercise_id: '3db451e9-85cd-4fe3-a4df-cd7124969be8',
    name: 'Hockey',
    icon: 'disc-outline',
    default_duration_minutes: 90,
    default_intensity: 'High',
  },
  {
    exercise_id: 'aa59925b-cf04-4271-a38b-6e56aeae46ae',
    name: 'Water Polo',
    icon: 'water-outline',
    default_duration_minutes: 75,
    default_intensity: 'High',
  },
  {
    exercise_id: '00fdc0b3-c6e0-4522-897d-222d7fbeab02',
    name: 'Baseball',
    icon: 'baseball-outline',
    default_duration_minutes: 120,
    default_intensity: 'Moderate',
  },
  {
    exercise_id: '7b3fe677-5976-485f-b666-c976c455823c',
    name: 'Cricket',
    icon: 'baseball-outline',
    default_duration_minutes: 120,
    default_intensity: 'Moderate',
  },
];

export interface PlanScheduleDependencyReport {
  workoutDependency: {
    planId: string | null;
    planName: string;
    prescribedDaysPerWeek: number;
    scheduledDaysPerWeek: number;
    isFrequencyMet: boolean;
    statusLabel: string;
  };
  rehabDependency: {
    programId: string | null;
    programName: string;
    activePhaseId: string | null;
    activePhaseOrder: number;
    activePhaseTitle: string;
    totalPhases: number;
    prescribedDaysPerWeek: number;
    scheduledDaysPerWeek: number;
    isFrequencyMet: boolean;
    sessionsCompletedInPhase: number;
    requiredSessionsInPhase: number;
    isPhaseExtended: boolean;
    extendedSessionsCount: number;
    eligibleToAdvance: boolean;
    remainingSessionsInCurrentPhase: number;
    totalRemainingSessions: number;
    estimatedWeeksCurrentPhase: number;
    estimatedWeeksTotalRemaining: number;
    baselineWeeksTotal: number;
    extendedWeeksDelta: number;
    statusLabel: string;
  };
  sportsSummary: {
    scheduledDaysPerWeek: number;
    totalWeeklyMinutes: number;
    totalWeeklyHoursFormatted: string;
    sportNames: string[];
  };
}

/**
 * Generates the default Hybrid Athlete Weekly Schedule (e.g. Mon/Fri Volleyball + Lower Back Rehab,
 * Tue/Thu Plyometrics & Calisthenics + Lower Back Rehab, Sat Calisthenics, Wed/Sun Rest).
 */
export function buildDefaultHybridWeeklySchedule(
  activeWorkoutPlan?: DatabasePlan | null,
  activeRehabPlan?: DatabasePlan | null
): WeeklyScheduleSlot[] {
  const workoutSessions = activeWorkoutPlan?.worksessions || [];
  const ws1 = workoutSessions[0];
  const ws2 = workoutSessions[1] || workoutSessions[0];
  const ws3 = workoutSessions[2] || workoutSessions[0];

  const defaultRehabWs =
    activeRehabPlan?.worksessions?.[0]?.worksession ||
    DATABASE_WORKSESSIONS.find(
      (w) =>
        w.type === 'rehab' &&
        (w.title.toLowerCase().includes('back') || w.title.toLowerCase().includes('mcgill'))
    ) ||
    DATABASE_WORKSESSIONS.find((w) => w.type === 'rehab');

  const rehabTitle =
    activeRehabPlan?.name || defaultRehabWs?.title || 'Lower Back Resilience & McGill Big 3';
  const rehabWsId =
    activeRehabPlan?.worksessions?.[0]?.worksessionId || defaultRehabWs?.id || 'ws-rehab-back';
  const rehabProgId = activeRehabPlan?.id || 'prog-lb-1';

  const workoutPlanId = activeWorkoutPlan?.id || 'plan-plyo-cali';

  return [
    // MONDAY (0): Volleyball Practice + Lower Back Rehab
    {
      id: 'sched-mon-sport',
      day_of_week: 'Monday',
      day_index: 0,
      activity_type: 'sport',
      title: 'Volleyball Practice',
      subtitle: 'Collective Sport • Team Practice',
      exercise_id: 'bedd9064-688f-45df-94d7-7f9ad2bb44f8',
      target_duration_minutes: 120,
      intensity_target: 'High',
      order_index: 0,
    },
    {
      id: 'sched-mon-rehab',
      day_of_week: 'Monday',
      day_index: 0,
      activity_type: 'rehab',
      title: rehabTitle,
      subtitle: 'Active Phase Rehab Protocol',
      worksession_id: rehabWsId,
      program_id: rehabProgId,
      bind_to_active_phase: true,
      target_duration_minutes: 25,
      intensity_target: 'Light',
      order_index: 1,
    },

    // TUESDAY (1): Workout Plan Session 1 + Lower Back Rehab
    {
      id: 'sched-tue-workout',
      day_of_week: 'Tuesday',
      day_index: 1,
      activity_type: 'workout',
      title: ws1?.worksessionName || 'Plyometrics & Explosive Power',
      subtitle: activeWorkoutPlan?.name || 'Plyometrics & Calisthenics Plan',
      worksession_id: ws1?.worksessionId || 'ws-plyo-1',
      program_id: workoutPlanId,
      bind_to_active_phase: true,
      target_duration_minutes: 45,
      intensity_target: 'High',
      order_index: 0,
    },
    {
      id: 'sched-tue-rehab',
      day_of_week: 'Tuesday',
      day_index: 1,
      activity_type: 'rehab',
      title: rehabTitle,
      subtitle: 'Active Phase Rehab Protocol',
      worksession_id: rehabWsId,
      program_id: rehabProgId,
      bind_to_active_phase: true,
      target_duration_minutes: 25,
      intensity_target: 'Light',
      order_index: 1,
    },

    // WEDNESDAY (2): Active Recovery / Rest Day
    {
      id: 'sched-wed-rest',
      day_of_week: 'Wednesday',
      day_index: 2,
      activity_type: 'rest',
      title: 'Rest & Tissue Adaptation Day',
      subtitle: 'Off Day • Central Nervous System Recovery',
      target_duration_minutes: 0,
      intensity_target: 'Rest',
      order_index: 0,
    },

    // THURSDAY (3): Workout Plan Session 2 + Lower Back Rehab
    {
      id: 'sched-thu-workout',
      day_of_week: 'Thursday',
      day_index: 3,
      activity_type: 'workout',
      title: ws2?.worksessionName || 'Calisthenics Strength & Control',
      subtitle: activeWorkoutPlan?.name || 'Plyometrics & Calisthenics Plan',
      worksession_id: ws2?.worksessionId || 'ws-cali-1',
      program_id: workoutPlanId,
      bind_to_active_phase: true,
      target_duration_minutes: 45,
      intensity_target: 'High',
      order_index: 0,
    },
    {
      id: 'sched-thu-rehab',
      day_of_week: 'Thursday',
      day_index: 3,
      activity_type: 'rehab',
      title: rehabTitle,
      subtitle: 'Active Phase Rehab Protocol',
      worksession_id: rehabWsId,
      program_id: rehabProgId,
      bind_to_active_phase: true,
      target_duration_minutes: 25,
      intensity_target: 'Light',
      order_index: 1,
    },

    // FRIDAY (4): Volleyball Practice + Lower Back Rehab
    {
      id: 'sched-fri-sport',
      day_of_week: 'Friday',
      day_index: 4,
      activity_type: 'sport',
      title: 'Volleyball Practice',
      subtitle: 'Collective Sport • Match Play & Drills',
      exercise_id: 'bedd9064-688f-45df-94d7-7f9ad2bb44f8',
      target_duration_minutes: 120,
      intensity_target: 'High',
      order_index: 0,
    },
    {
      id: 'sched-fri-rehab',
      day_of_week: 'Friday',
      day_index: 4,
      activity_type: 'rehab',
      title: rehabTitle,
      subtitle: 'Active Phase Rehab Protocol',
      worksession_id: rehabWsId,
      program_id: rehabProgId,
      bind_to_active_phase: true,
      target_duration_minutes: 25,
      intensity_target: 'Light',
      order_index: 1,
    },

    // SATURDAY (5): Workout Plan Session 3
    {
      id: 'sched-sat-workout',
      day_of_week: 'Saturday',
      day_index: 5,
      activity_type: 'workout',
      title: ws3?.worksessionName || 'Calisthenics & Athletic Mobility',
      subtitle: activeWorkoutPlan?.name || 'Plyometrics & Calisthenics Plan',
      worksession_id: ws3?.worksessionId || 'ws-cali-2',
      program_id: workoutPlanId,
      bind_to_active_phase: true,
      target_duration_minutes: 45,
      intensity_target: 'Moderate',
      order_index: 0,
    },

    // SUNDAY (6): Rest Day
    {
      id: 'sched-sun-rest',
      day_of_week: 'Sunday',
      day_index: 6,
      activity_type: 'rest',
      title: 'Full Rest & Recovery Day',
      subtitle: 'Off Day • Sleep & Hydration Focus',
      target_duration_minutes: 0,
      intensity_target: 'Rest',
      order_index: 0,
    },
  ];
}

/**
 * Loads the user's weekly schedule from Supabase / Workspaces / AsyncStorage,
 * seeding the default hybrid schedule if none exists yet.
 */
export async function loadWeeklySchedule(params?: {
  userId?: string;
  workspaces?: any;
  activeWorkoutPlan?: DatabasePlan | null;
  activeRehabPlan?: DatabasePlan | null;
}): Promise<WeeklyScheduleSlot[]> {
  const uid = params?.userId;

  // 1. Try Supabase user_weekly_schedules first if authenticated
  if (uid) {
    try {
      const { data, error } = await supabase
        .from('user_weekly_schedules')
        .select('*')
        .eq('user_id', uid)
        .order('day_index', { ascending: true })
        .order('order_index', { ascending: true });

      if (!error && data && data.length > 0) {
        await AsyncStorage.setItem(WEEKLY_SCHEDULE_STORAGE_KEY, JSON.stringify(data));
        return data as WeeklyScheduleSlot[];
      }
    } catch (e) {
      console.warn('[scheduleService] Cloud schedule fetch fallback:', e);
    }
  }

  // 2. Try workspaces.weekly_schedule
  if (
    params?.workspaces?.weekly_schedule &&
    Array.isArray(params.workspaces.weekly_schedule) &&
    params.workspaces.weekly_schedule.length > 0
  ) {
    return params.workspaces.weekly_schedule;
  }

  // 3. Try local AsyncStorage
  try {
    const cached = await AsyncStorage.getItem(WEEKLY_SCHEDULE_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[scheduleService] AsyncStorage read error:', e);
  }

  // 4. Seed default hybrid schedule
  const seeded = buildDefaultHybridWeeklySchedule(
    params?.activeWorkoutPlan,
    params?.activeRehabPlan
  );

  try {
    await AsyncStorage.setItem(WEEKLY_SCHEDULE_STORAGE_KEY, JSON.stringify(seeded));
  } catch {}

  if (uid) {
    // Persist initial seed to Supabase in background
    syncScheduleToSupabase(seeded, uid).catch(() => {});
  }

  return seeded;
}

async function syncScheduleToSupabase(slots: WeeklyScheduleSlot[], userId: string): Promise<void> {
  try {
    await supabase.from('user_weekly_schedules').delete().eq('user_id', userId);

    if (slots.length === 0) return;

    const rows = slots.map((s, idx) => ({
      user_id: userId,
      day_of_week: s.day_of_week,
      day_index: s.day_index,
      activity_type: s.activity_type,
      title: s.title,
      subtitle: s.subtitle || null,
      worksession_id: s.worksession_id || null,
      program_id: s.program_id || null,
      exercise_id: s.exercise_id || null,
      bind_to_active_phase: s.bind_to_active_phase ?? true,
      target_duration_minutes: s.target_duration_minutes ?? 45,
      intensity_target: s.intensity_target || 'Moderate',
      notes: s.notes || null,
      order_index: typeof s.order_index === 'number' ? s.order_index : idx,
      updated_at: new Date().toISOString(),
    }));

    await supabase.from('user_weekly_schedules').insert(rows);
  } catch (err) {
    console.warn('[scheduleService] Failed to sync schedule to Supabase:', err);
  }
}

/**
 * Saves the updated 7-day weekly schedule to AsyncStorage, Workspaces, and Supabase.
 */
export async function saveWeeklySchedule(params: {
  slots: WeeklyScheduleSlot[];
  userId?: string;
  updateWorkspaces?: (newWs: any) => Promise<void>;
  currentWorkspaces?: any;
}): Promise<WeeklyScheduleSlot[]> {
  const sorted = [...params.slots].sort((a, b) => {
    if (a.day_index !== b.day_index) return a.day_index - b.day_index;
    return (a.order_index || 0) - (b.order_index || 0);
  });

  try {
    await AsyncStorage.setItem(WEEKLY_SCHEDULE_STORAGE_KEY, JSON.stringify(sorted));
  } catch (e) {
    console.warn('[scheduleService] Error saving schedule to AsyncStorage:', e);
  }

  if (params.updateWorkspaces) {
    try {
      await params.updateWorkspaces({
        ...(params.currentWorkspaces || {}),
        weekly_schedule: sorted,
      });
    } catch (e) {
      console.warn('[scheduleService] Error saving schedule to workspaces:', e);
    }
  }

  if (params.userId) {
    await syncScheduleToSupabase(sorted, params.userId);
  }

  return sorted;
}

/**
 * Given a calendar date string (YYYY-MM-DD), resolves the Monday-first day_index (0..6)
 * and returns all planned activities for that date.
 */
export function getPlannedActivitiesForDate(
  dateKey: string,
  schedule: WeeklyScheduleSlot[]
): {
  dayIndex: number;
  dayName: WeeklyScheduleSlot['day_of_week'];
  slots: WeeklyScheduleSlot[];
  activeSlots: WeeklyScheduleSlot[];
  hasPlannedWorkout: boolean;
  hasPlannedRehab: boolean;
  hasPlannedSport: boolean;
  isPlannedRest: boolean;
} {
  const dateObj = new Date(dateKey + 'T12:00:00');
  const jsDay = isNaN(dateObj.getTime()) ? new Date().getDay() : dateObj.getDay();
  const dayIndex = (jsDay + 6) % 7; // 0 = Monday ... 6 = Sunday
  const dayMeta = WEEKDAYS_ORDERED[dayIndex] || WEEKDAYS_ORDERED[0];

  const daySlots = (schedule || [])
    .filter((s) => Number(s.day_index) === dayIndex)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  const activeSlots = daySlots.filter((s) => s.activity_type !== 'rest');
  const hasPlannedWorkout = activeSlots.some((s) => s.activity_type === 'workout');
  const hasPlannedRehab = activeSlots.some((s) => s.activity_type === 'rehab');
  const hasPlannedSport = activeSlots.some((s) => s.activity_type === 'sport');
  const isPlannedRest =
    activeSlots.length === 0 || daySlots.every((s) => s.activity_type === 'rest');

  return {
    dayIndex,
    dayName: dayMeta.day_of_week,
    slots: daySlots,
    activeSlots,
    hasPlannedWorkout,
    hasPlannedRehab,
    hasPlannedSport,
    isPlannedRest,
  };
}

/**
 * Computes the live dependency between the user's active Workout & Rehab plans
 * and their 7-day weekly schedule, including prescribed vs. scheduled days/week
 * and dynamic completion timeline forecasts accounting for phase retention ("Keep Practicing").
 */
export function computePlanScheduleDependencies(params: {
  schedule: WeeklyScheduleSlot[];
  activeWorkoutPlan?: DatabasePlan | null;
  activeRehabPlan?: DatabasePlan | null;
  enrollment?: UserEnrollment | null;
}): PlanScheduleDependencyReport {
  const schedule = params.schedule || [];

  // 1. Workout Plan Dependency
  const workoutSlots = schedule.filter((s) => s.activity_type === 'workout');
  const uniqueWorkoutDays = new Set(workoutSlots.map((s) => s.day_index)).size;
  const prescribedWorkoutDays = Math.max(
    1,
    Math.min(6, params.activeWorkoutPlan?.worksessions?.length || 3)
  );
  const workoutPlanName = params.activeWorkoutPlan?.name || 'Plyometrics & Calisthenics';
  const isWorkoutFreqMet = uniqueWorkoutDays >= prescribedWorkoutDays;

  const workoutStatusLabel = isWorkoutFreqMet
    ? `${uniqueWorkoutDays}/${prescribedWorkoutDays} days/wk scheduled ✓`
    : `${uniqueWorkoutDays}/${prescribedWorkoutDays} days/wk (${
        prescribedWorkoutDays - uniqueWorkoutDays
      } more recommended)`;

  // 2. Rehab Plan Dependency & Phase Retention Timeline
  const rehabSlots = schedule.filter((s) => s.activity_type === 'rehab');
  const uniqueRehabDays = new Set(rehabSlots.map((s) => s.day_index)).size;

  const enrollment = params.enrollment;
  const rehabProgramName =
    enrollment?.program?.title || params.activeRehabPlan?.name || 'Lower Back Resilience';

  const phases = enrollment?.program?.phases || params.activeRehabPlan?.phases || [];
  const totalPhases = Math.max(1, phases.length || 3);

  const currentPhase = enrollment?.current_phase || phases[0];
  const activePhaseOrder = currentPhase?.phase_order || 1;
  const activePhaseTitle =
    currentPhase?.title || 'Phase 1: Acute Decompression & McGill Big 3';

  const prescribedRehabDays = enrollment?.custom_target_days_per_week || 3;
  const isRehabFreqMet = uniqueRehabDays >= prescribedRehabDays;

  const sessionsCompletedInPhase = enrollment?.sessions_completed_in_phase ?? 5;
  const requiredSessionsInPhase = currentPhase?.required_sessions_to_pass || 8;
  const isPhaseExtended = Boolean(enrollment?.is_phase_extended);
  const extendedSessionsCount = Number(enrollment?.extended_sessions_count || 0);
  const eligibleToAdvance = Boolean(
    enrollment?.eligible_to_advance ||
      (sessionsCompletedInPhase >= requiredSessionsInPhase &&
        (enrollment?.avg_pain_last_3 ?? 3.0) <= (currentPhase?.max_allowed_pain_score ?? 4.0))
  );

  // Remaining sessions in current phase:
  // If user chose "Keep Practicing", add extendedSessionsCount buffer so timeline reflects longer phase!
  const baseRemainingCurrent = Math.max(0, requiredSessionsInPhase - sessionsCompletedInPhase);
  const remainingSessionsInCurrentPhase = isPhaseExtended
    ? Math.max(2, baseRemainingCurrent + extendedSessionsCount)
    : Math.max(1, baseRemainingCurrent);

  // Remaining sessions in future phases
  let remainingSessionsFuturePhases = 0;
  if (phases.length > 0) {
    phases.forEach((ph: any) => {
      if ((ph.phase_order || 1) > activePhaseOrder) {
        remainingSessionsFuturePhases += ph.required_sessions_to_pass || 10;
      }
    });
  } else {
    // Default 3-phase assumption (Phase 2: 10, Phase 3: 12)
    if (activePhaseOrder === 1) remainingSessionsFuturePhases = 22;
    else if (activePhaseOrder === 2) remainingSessionsFuturePhases = 12;
  }

  const totalRemainingSessions =
    remainingSessionsInCurrentPhase + remainingSessionsFuturePhases;

  const effectiveRehabRate = Math.max(1, uniqueRehabDays || prescribedRehabDays);
  const estimatedWeeksCurrentPhase = Math.max(
    1,
    Math.ceil(remainingSessionsInCurrentPhase / effectiveRehabRate)
  );
  const estimatedWeeksTotalRemaining = Math.max(
    1,
    Math.ceil(totalRemainingSessions / effectiveRehabRate)
  );

  const baselineRemainingSessions = Math.max(1, baseRemainingCurrent) + remainingSessionsFuturePhases;
  const baselineWeeksTotal = Math.max(
    1,
    Math.ceil(baselineRemainingSessions / Math.max(1, prescribedRehabDays))
  );
  const extendedWeeksDelta = Math.max(0, estimatedWeeksTotalRemaining - baselineWeeksTotal);

  const rehabStatusLabel = isRehabFreqMet
    ? `${uniqueRehabDays}/${prescribedRehabDays} days/wk scheduled ✓`
    : `${uniqueRehabDays}/${prescribedRehabDays} days/wk (${
        prescribedRehabDays - uniqueRehabDays
      } more recommended)`;

  // 3. Sports Summary
  const sportSlots = schedule.filter((s) => s.activity_type === 'sport');
  const uniqueSportDays = new Set(sportSlots.map((s) => s.day_index)).size;
  const totalWeeklyMinutes = sportSlots.reduce(
    (sum, s) => sum + (Number(s.target_duration_minutes) || 90),
    0
  );
  const hours = (totalWeeklyMinutes / 60).toFixed(1).replace(/\.0$/, '');
  const sportNames = Array.from(
    new Set(sportSlots.map((s) => s.title.replace(/Practice|Session/gi, '').trim()))
  );

  return {
    workoutDependency: {
      planId: params.activeWorkoutPlan?.id || null,
      planName: workoutPlanName,
      prescribedDaysPerWeek: prescribedWorkoutDays,
      scheduledDaysPerWeek: uniqueWorkoutDays,
      isFrequencyMet: isWorkoutFreqMet,
      statusLabel: workoutStatusLabel,
    },
    rehabDependency: {
      programId: enrollment?.program_id || params.activeRehabPlan?.id || null,
      programName: rehabProgramName,
      activePhaseId: currentPhase?.id || null,
      activePhaseOrder,
      activePhaseTitle,
      totalPhases,
      prescribedDaysPerWeek: prescribedRehabDays,
      scheduledDaysPerWeek: uniqueRehabDays,
      isFrequencyMet: isRehabFreqMet,
      sessionsCompletedInPhase,
      requiredSessionsInPhase,
      isPhaseExtended,
      extendedSessionsCount,
      eligibleToAdvance,
      remainingSessionsInCurrentPhase,
      totalRemainingSessions,
      estimatedWeeksCurrentPhase,
      estimatedWeeksTotalRemaining,
      baselineWeeksTotal,
      extendedWeeksDelta,
      statusLabel: rehabStatusLabel,
    },
    sportsSummary: {
      scheduledDaysPerWeek: uniqueSportDays,
      totalWeeklyMinutes,
      totalWeeklyHoursFormatted: `${hours}h / wk`,
      sportNames,
    },
  };
}
