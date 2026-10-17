import { Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';

const fallbackVibrate = (type) => {
  try {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(type === 'heavy' ? 25 : 10);
    }
  } catch (err) {
    // Suppress vibration errors on simulators or unsupported hardware
  }
};

// Safe haptic feedback wrapper across iOS, Android, and Web
export const triggerHaptic = (type = 'light') => {
  if (Platform.OS === 'web') return;
  try {
    if (Haptics && typeof Haptics.impactAsync === 'function') {
      const style = 
        type === 'heavy' ? Haptics.ImpactFeedbackStyle?.Heavy :
        type === 'medium' ? Haptics.ImpactFeedbackStyle?.Medium :
        Haptics.ImpactFeedbackStyle?.Light;

      Haptics.impactAsync(style).catch(() => {
        // Fallback silently if native Haptic module is not linked in current client build
        fallbackVibrate(type);
      });
      return;
    }
  } catch (e) {
    // Ignore synchronous errors
  }
  fallbackVibrate(type);
};

// Generates the 7 days of the current calendar week (Monday to Sunday)
export const getCurrentWeekDays = (referenceDate = new Date()) => {
  const d = new Date(referenceDate);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  // In Monday-first week: Monday is 0, Sunday is 6
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dayFullNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const days = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    const dateStr = cur.toISOString().split('T')[0];
    const isToday = dateStr === todayStr;
    const isPast = dateStr < todayStr;
    const isFuture = dateStr > todayStr;

    days.push({
      index: i,
      label: dayLabels[i],
      fullName: dayFullNames[i],
      date: cur,
      dateStr,
      dayNum: cur.getDate(),
      isToday,
      isPast,
      isFuture
    });
  }
  return days;
};

// Computes consecutive weekly active streak and total sessions this week
export const computeWeeklyMetrics = (history = {}, weekDays = []) => {
  let completedThisWeekCount = 0;
  let totalMinutesThisWeek = 0;
  let recoverySessionsThisWeek = 0;

  weekDays.forEach(day => {
    const dayData = history[day.dateStr];
    const workouts = dayData?.move?.workouts || [];
    if (workouts.length > 0) {
      completedThisWeekCount += workouts.length;
      workouts.forEach(w => {
        const dur = parseInt(w.duration) || 0;
        totalMinutesThisWeek += dur;
        const name = `${w.type || ''} ${w.worksessionName || ''}`.toLowerCase();
        const isRehab =
          w.sessionType === 'rehab' ||
          w.isRehab === true ||
          w.type === 'rehab' ||
          name.includes('rehab') ||
          name.includes('recovery') ||
          name.includes('mobility') ||
          name.includes('mcgill') ||
          name.includes('protocol') ||
          name.includes('relief') ||
          name.includes('tendon') ||
          name.includes('tendinopathy') ||
          name.includes('knee') ||
          name.includes('shoulder') ||
          name.includes('back') ||
          name.includes('achilles') ||
          name.includes('isometric');

        if (isRehab) {
          recoverySessionsThisWeek += 1;
        }
      });
    }
  });

  // Calculate consecutive active streak in days leading up to today
  let activeStreakDays = 0;
  const sortedDates = Object.keys(history).sort((a, b) => b.localeCompare(a));
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Check from today or yesterday backwards
  let checkDate = new Date();
  if (!(history[todayStr]?.move?.workouts?.length > 0)) {
    // If not worked out today, check if yesterday was worked out
    checkDate.setDate(checkDate.getDate() - 1);
  }

  for (let i = 0; i < 30; i++) {
    const str = checkDate.toISOString().split('T')[0];
    if (history[str]?.move?.workouts?.length > 0) {
      activeStreakDays++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    completedThisWeekCount,
    totalMinutesThisWeek,
    recoverySessionsThisWeek,
    activeStreakDays
  };
};

export const DEFAULT_GOALS = [
  {
    id: 'goal-weekly-freq',
    title: 'Weekly Workouts',
    type: 'weekly_frequency',
    target_value: 4,
    current_value: 0,
    unit: 'Sessions',
    timeframe: 'weekly'
  },
  {
    id: 'goal-recovery-rehab',
    title: 'Rehab / Mobility Protocols',
    type: 'recovery_target',
    target_value: 2,
    current_value: 0,
    unit: 'Protocols',
    timeframe: 'weekly'
  },
  {
    id: 'goal-active-time',
    title: 'Active Training Time',
    type: 'volume',
    target_value: 120,
    current_value: 0,
    unit: 'Min',
    timeframe: 'weekly'
  }
];
