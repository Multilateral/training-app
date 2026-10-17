import React, { useState, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { KinetixTheme } from '../constants/theme';
import { TrainingContext } from '../context/TrainingContext';
import { getCurrentWeekDays, computeWeeklyMetrics } from '../utils/dashboardUtils';
import KinetixHeader from './KinetixHeader';
import KinetixBottomNav from './KinetixBottomNav';
import { DATABASE_WORKSESSIONS } from '../data/databaseLibraryData';

interface GoalItem {
  id: string;
  title: string;
  type: 'weekly_frequency' | 'recovery_target' | 'volume' | 'custom';
  target_value: number;
  current_value?: number;
  unit: string;
  timeframe?: string;
}

const INITIAL_KINETIX_GOALS: GoalItem[] = [
  {
    id: 'goal-weekly-freq',
    title: 'Weekly Training Consistency',
    type: 'weekly_frequency',
    target_value: 4,
    current_value: 0,
    unit: 'sessions',
    timeframe: 'weekly',
  },
  {
    id: 'goal-rehab-target',
    title: 'Rehab & Mobility Protocols',
    type: 'recovery_target',
    target_value: 2,
    current_value: 0,
    unit: 'protocols',
    timeframe: 'weekly',
  },
  {
    id: 'goal-active-volume',
    title: 'Weekly Training Volume',
    type: 'volume',
    target_value: 120,
    current_value: 0,
    unit: 'mins',
    timeframe: 'weekly',
  },
  {
    id: 'goal-quad-symmetry',
    title: 'Bilateral Quad Symmetry',
    type: 'custom',
    target_value: 95,
    current_value: 92,
    unit: '% force',
    timeframe: 'weekly',
  },
];

const STANDARD_GOAL_IDS = [
  'goal-weekly-freq',
  'goal-rehab-target',
  'goal-active-volume',
  'goal-quad-symmetry',
  'goal-recovery-rehab',
  'goal-active-time',
];

export default function KinetixProgressHub() {
  const router = useRouter();
  const {
    history,
    session,
    workspaces,
    updateWorkspaces,
    saveToCloud,
  } = useContext(TrainingContext) || {};

  // Calendar month state
  const [viewDate, setViewDate] = useState(() => new Date());
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayStr);

  // Bodyweight state
  const [selectedRange, setSelectedRange] = useState<'30' | '90' | '365'>('30');
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [targetWeightInput, setTargetWeightInput] = useState('');

  // Goal Modal state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoals, setEditingGoals] = useState<GoalItem[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('3');
  const [newGoalUnit, setNewGoalUnit] = useState('sessions');
  const [isAddingNewGoal, setIsAddingNewGoal] = useState(false);

  const athleteName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split('@')[0] ||
    'Marcus Vance';

  // Helper to determine if a workout is rehab/recovery
  const isRehabWorkout = (w: any) => {
    if (!w) return false;
    // 1. Explicit properties
    if (w.sessionType === 'rehab' || w.isRehab === true) return true;
    if (w.type === 'rehab') return true;
    if (
      w.category &&
      (w.category.toLowerCase().includes('rehab') ||
        w.category.toLowerCase().includes('recovery'))
    ) {
      return true;
    }

    // 2. Lookup against known database worksessions by title or id
    const title = (w.worksessionName || w.type || '').trim().toLowerCase();
    const dbMatch = DATABASE_WORKSESSIONS.find(
      (d) =>
        d.title.trim().toLowerCase() === title ||
        d.id === w.planId ||
        (title.length > 5 && d.title.toLowerCase().includes(title))
    );
    if (dbMatch && dbMatch.type === 'rehab') return true;

    // 3. Keyword heuristic on title & description
    return (
      title.includes('rehab') ||
      title.includes('mcgill') ||
      title.includes('protocol') ||
      title.includes('relief') ||
      title.includes('recovery') ||
      title.includes('mobility') ||
      title.includes('tendon') ||
      title.includes('tendinopathy') ||
      title.includes('achilles') ||
      title.includes('knee') ||
      title.includes('shoulder') ||
      title.includes('back') ||
      title.includes('spine') ||
      title.includes('lumbar') ||
      title.includes('isometric') ||
      title.includes('resilience') ||
      title.includes('posture')
    );
  };

  // ----------------------------------------------------
  // 1. Calendar Calculations
  // ----------------------------------------------------
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun, 1 is Mon
  const leadingBlanks = (firstDayIndex + 6) % 7; // Monday-first calendar

  const handlePrevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthTitle = viewDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const calendarDays = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const dateKey = `${year}-${mStr}-${dStr}`;
      const dayData = history?.[dateKey];
      const workouts: any[] = dayData?.move?.workouts || [];

      const hasRehab = workouts.some((w) => isRehabWorkout(w));
      const hasStrength = workouts.some((w) => !isRehabWorkout(w));

      return {
        day,
        dateKey,
        workouts,
        hasStrength,
        hasRehab,
        isDual: hasStrength && hasRehab,
        isToday: dateKey === todayStr,
      };
    });
  }, [year, month, daysInMonth, history, todayStr]);

  // Monthly stats (divided by Strength vs Rehab Done)
  const { monthStrength, monthRehab, attendanceRate } = useMemo(() => {
    let strengthCount = 0;
    let rehabCount = 0;
    let activeDays = 0;

    calendarDays.forEach((cd) => {
      if (cd.workouts.length > 0) {
        activeDays += 1;
        cd.workouts.forEach((w) => {
          if (isRehabWorkout(w)) {
            rehabCount += 1;
          } else {
            strengthCount += 1;
          }
        });
      }
    });

    const now = new Date();
    const isCurrent = now.getFullYear() === year && now.getMonth() === month;
    const isPast =
      year < now.getFullYear() ||
      (year === now.getFullYear() && month < now.getMonth());
    const elapsed = isCurrent ? now.getDate() : isPast ? daysInMonth : 0;
    const rate =
      elapsed > 0
        ? Math.min(100, Math.round((activeDays / elapsed) * 100))
        : activeDays > 0
        ? 100
        : 0;

    return {
      monthStrength: strengthCount,
      monthRehab: rehabCount,
      attendanceRate: rate,
    };
  }, [calendarDays, year, month, daysInMonth]);

  // Selected Day Details
  const selectedDayData = useMemo(() => {
    const found = calendarDays.find((cd) => cd.dateKey === selectedDateKey);
    if (found) return found;

    const dayWorkouts: any[] = history?.[selectedDateKey]?.move?.workouts || [];
    const dateObj = new Date(selectedDateKey + 'T12:00:00');
    return {
      day: isNaN(dateObj.getTime()) ? 1 : dateObj.getDate(),
      dateKey: selectedDateKey,
      workouts: dayWorkouts,
      hasStrength: dayWorkouts.some((w) => !isRehabWorkout(w)),
      hasRehab: dayWorkouts.some((w) => isRehabWorkout(w)),
      isDual: false,
      isToday: selectedDateKey === todayStr,
    };
  }, [calendarDays, selectedDateKey, history, todayStr]);

  const selectedDayFormattedTitle = useMemo(() => {
    const d = new Date(selectedDateKey + 'T12:00:00');
    if (isNaN(d.getTime())) return selectedDateKey;
    const formatted = d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    return selectedDayData.isToday ? `${formatted} • Today` : formatted;
  }, [selectedDateKey, selectedDayData.isToday]);

  // ----------------------------------------------------
  // 2. Logged Workouts History List
  // ----------------------------------------------------
  const allLoggedWorkouts = useMemo(() => {
    const workoutsList: any[] = [];
    if (history && typeof history === 'object') {
      Object.keys(history).forEach((dateKey) => {
        const dayData = history[dateKey];
        if (dayData?.move?.workouts && Array.isArray(dayData.move.workouts)) {
          dayData.move.workouts.forEach((w: any) => {
            workoutsList.push({
              ...w,
              dateKey,
            });
          });
        }
      });
    }

    workoutsList.sort((a, b) => {
      const tA = new Date(
        a.endTime || a.completedAt || a.startTime || parseInt(a.id, 10) || 0
      ).getTime();
      const tB = new Date(
        b.endTime || b.completedAt || b.startTime || parseInt(b.id, 10) || 0
      ).getTime();
      return tB - tA;
    });

    return workoutsList;
  }, [history]);

  // ----------------------------------------------------
  // 3. Active Period Goals
  // ----------------------------------------------------
  const currentWeekDays = useMemo(() => getCurrentWeekDays(), []);
  const weeklyMetrics = useMemo(
    () => computeWeeklyMetrics(history || {}, currentWeekDays),
    [history, currentWeekDays]
  );

  const activeGoals: GoalItem[] = useMemo(() => {
    if (workspaces && Array.isArray(workspaces.goals)) {
      return workspaces.goals;
    }
    return INITIAL_KINETIX_GOALS;
  }, [workspaces?.goals]);

  const computeGoalProgress = (goal: GoalItem) => {
    let cur = goal.current_value || 0;
    if (goal.type === 'weekly_frequency') {
      cur = weeklyMetrics.completedThisWeekCount;
    } else if (goal.type === 'recovery_target') {
      cur = weeklyMetrics.recoverySessionsThisWeek;
    } else if (goal.type === 'volume') {
      cur = weeklyMetrics.totalMinutesThisWeek;
    }
    const tgt = Math.max(1, goal.target_value || 1);
    const pct = Math.min(100, Math.round((cur / tgt) * 100));
    const isDone = cur >= tgt;
    return { currentVal: cur, targetVal: tgt, percent: pct, isDone };
  };

  const openGoalModal = () => {
    setEditingGoals(activeGoals.map((g) => ({ ...g })));
    setIsAddingNewGoal(false);
    setShowGoalModal(true);
  };

  const handleStepGoal = (id: string, delta: number) => {
    setEditingGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          return {
            ...g,
            target_value: Math.max(1, (g.target_value || 1) + delta),
          };
        }
        return g;
      })
    );
  };

  const handleDeleteGoal = (id: string) => {
    setEditingGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleRemoveAllStandardGoals = () => {
    Alert.alert(
      'Remove Standard Goals',
      'Remove all standard goals that came with the app? You can add your own custom goals instead.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove All Standard',
          style: 'destructive',
          onPress: () => {
            setEditingGoals((prev) =>
              prev.filter((g) => !STANDARD_GOAL_IDS.includes(g.id))
            );
          },
        },
      ]
    );
  };

  const handleRestoreStandardGoals = () => {
    setEditingGoals((prev) => {
      const existingIds = new Set(prev.map((g) => g.id));
      const missing = INITIAL_KINETIX_GOALS.filter((g) => !existingIds.has(g.id));
      return [...missing, ...prev];
    });
  };

  const handleRestoreStandardGoalsAndSave = async () => {
    if (updateWorkspaces) {
      const existingIds = new Set((workspaces?.goals || []).map((g: any) => g.id));
      const missing = INITIAL_KINETIX_GOALS.filter((g) => !existingIds.has(g.id));
      const updated = [...missing, ...(workspaces?.goals || [])];
      await updateWorkspaces({
        ...(workspaces || {}),
        goals: updated,
      });
      Alert.alert('Goals Restored', 'Standard goals have been added back to your profile.');
    }
  };

  const handleAddCustomGoal = () => {
    if (!newGoalTitle.trim()) {
      Alert.alert('Required', 'Please enter a goal title.');
      return;
    }
    const tgt = parseInt(newGoalTarget, 10) || 1;
    const newObj: GoalItem = {
      id: `custom-goal-${Date.now()}`,
      title: newGoalTitle.trim(),
      type: 'custom',
      target_value: tgt,
      current_value: 0,
      unit: newGoalUnit.trim() || 'sessions',
      timeframe: 'weekly',
    };
    setEditingGoals((prev) => [...prev, newObj]);
    setNewGoalTitle('');
    setNewGoalTarget('3');
    setNewGoalUnit('sessions');
    setIsAddingNewGoal(false);
  };

  const handleSaveGoals = async () => {
    if (updateWorkspaces) {
      await updateWorkspaces({
        ...(workspaces || {}),
        goals: editingGoals,
      });
    }
    setShowGoalModal(false);
    Alert.alert('Goals Updated', 'Your active period goals have been saved.');
  };

  // ----------------------------------------------------
  // 4. Bodyweight Trend Calculations
  // ----------------------------------------------------
  const targetWeight = Number(workspaces?.target_weight) || 77.5;

  const allWeightEntries = useMemo(() => {
    const map = new Map<string, { date: string; weight: number; timestamp: number }>();

    // 1. Extract from history
    if (history && typeof history === 'object') {
      Object.keys(history).forEach((dKey) => {
        const w = history[dKey]?.weight;
        if (typeof w === 'number' && w > 20 && w < 300) {
          map.set(dKey, {
            date: dKey,
            weight: w,
            timestamp: new Date(dKey + 'T12:00:00').getTime(),
          });
        }
      });
    }

    // 2. Extract from workspaces.bodyweight_logs
    if (workspaces?.bodyweight_logs && Array.isArray(workspaces.bodyweight_logs)) {
      workspaces.bodyweight_logs.forEach((log: any) => {
        const w = Number(log.weight);
        if (log.date && !isNaN(w) && w > 20 && w < 300) {
          map.set(log.date, {
            date: log.date,
            weight: w,
            timestamp: log.timestamp || new Date(log.date + 'T12:00:00').getTime(),
          });
        }
      });
    }

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [history, workspaces]);

  const currentWeight = useMemo(() => {
    if (allWeightEntries.length > 0) {
      return allWeightEntries[allWeightEntries.length - 1].weight;
    }
    return Number(workspaces?.latest_weight) || 78.4;
  }, [allWeightEntries, workspaces]);

  const rangeEntries = useMemo(() => {
    const rangeDays = parseInt(selectedRange, 10);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - rangeDays);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    return allWeightEntries.filter((e) => e.date >= cutoffStr);
  }, [allWeightEntries, selectedRange]);

  const { weightChangeStr } = useMemo(() => {
    if (rangeEntries.length >= 2) {
      const diff =
        rangeEntries[rangeEntries.length - 1].weight - rangeEntries[0].weight;
      return {
        weightChangeStr: diff > 0 ? `+${diff.toFixed(1)} kg` : `${diff.toFixed(1)} kg`,
      };
    }
    if (allWeightEntries.length >= 2) {
      const diff = currentWeight - allWeightEntries[0].weight;
      return {
        weightChangeStr: diff > 0 ? `+${diff.toFixed(1)} kg` : `${diff.toFixed(1)} kg`,
      };
    }
    return {
      weightChangeStr: '0.0 kg',
    };
  }, [rangeEntries, allWeightEntries, currentWeight]);

  // Chart data points and scaling
  const { chartPoints, minScale, maxScale, targetPercent, xAxisLabels } = useMemo(() => {
    const displayEntries =
      rangeEntries.length > 0
        ? rangeEntries
        : allWeightEntries.length > 0
        ? allWeightEntries
        : [{ date: todayStr, weight: currentWeight, timestamp: Date.now() }];

    const weights = displayEntries.map((e) => e.weight).concat(targetWeight);
    let minVal = Math.floor(Math.min(...weights) - 0.5);
    let maxVal = Math.ceil(Math.max(...weights) + 0.5);
    if (maxVal - minVal < 2) {
      maxVal = minVal + 3;
    }
    const scaleRange = maxVal - minVal;
    const tgtPct = Math.max(
      8,
      Math.min(92, ((maxVal - targetWeight) / scaleRange) * 100)
    );

    const points = displayEntries.map((entry, idx) => {
      const leftPct =
        displayEntries.length === 1
          ? 50
          : (idx / (displayEntries.length - 1)) * 88 + 6;
      const topPct = Math.max(
        8,
        Math.min(92, ((maxVal - entry.weight) / scaleRange) * 100)
      );
      const isLast = idx === displayEntries.length - 1;
      return {
        ...entry,
        leftPercent: leftPct,
        topPercent: topPct,
        isLast,
      };
    });

    // Generate x-axis labels
    const labels: { text: string; isHighlighted?: boolean }[] = [];
    if (displayEntries.length >= 2) {
      const firstD = new Date(displayEntries[0].date + 'T12:00:00');
      const firstStr = !isNaN(firstD.getTime())
        ? firstD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : displayEntries[0].date;
      labels.push({ text: `${firstStr} (${displayEntries[0].weight.toFixed(1)}kg)` });

      if (displayEntries.length >= 3) {
        const midIndex = Math.floor(displayEntries.length / 2);
        const midD = new Date(displayEntries[midIndex].date + 'T12:00:00');
        const midStr = !isNaN(midD.getTime())
          ? midD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : displayEntries[midIndex].date;
        labels.push({ text: midStr });
      }

      const lastEntry = displayEntries[displayEntries.length - 1];
      const isToday = lastEntry.date === todayStr;
      const lastD = new Date(lastEntry.date + 'T12:00:00');
      const lastStr = isToday
        ? 'Today'
        : !isNaN(lastD.getTime())
        ? lastD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : lastEntry.date;

      labels.push({
        text: `${lastStr} (${lastEntry.weight.toFixed(1)}kg)`,
        isHighlighted: true,
      });
    } else {
      labels.push({
        text: `Today (${currentWeight.toFixed(1)}kg)`,
        isHighlighted: true,
      });
    }

    return {
      chartPoints: points,
      minScale: minVal,
      maxScale: maxVal,
      targetPercent: tgtPct,
      xAxisLabels: labels,
    };
  }, [rangeEntries, allWeightEntries, targetWeight, currentWeight, todayStr]);

  const openWeightModal = () => {
    setWeightInput(currentWeight.toFixed(1));
    setTargetWeightInput(targetWeight.toFixed(1));
    setShowWeightModal(true);
  };

  const handleSaveWeight = async () => {
    const parsed = parseFloat(weightInput);
    if (isNaN(parsed) || parsed < 30 || parsed > 250) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight between 30 and 250 kg.');
      return;
    }

    const parsedTarget = parseFloat(targetWeightInput);
    const validTarget =
      !isNaN(parsedTarget) && parsedTarget >= 30 && parsedTarget <= 250
        ? parsedTarget
        : targetWeight;

    // 1. Save to history cloud
    if (saveToCloud) {
      const todayProfile = history?.[todayStr] || {};
      await saveToCloud(todayStr, {
        ...todayProfile,
        weight: parsed,
      });
    }

    // 2. Save to workspaces
    const existingLogs = Array.isArray(workspaces?.bodyweight_logs)
      ? workspaces.bodyweight_logs
      : [];
    const filtered = existingLogs.filter((l: any) => l.date !== todayStr);
    const updatedLogs = [
      ...filtered,
      { date: todayStr, weight: parsed, timestamp: Date.now() },
    ];

    if (updateWorkspaces) {
      await updateWorkspaces({
        ...(workspaces || {}),
        bodyweight_logs: updatedLogs,
        latest_weight: parsed,
        target_weight: validTarget,
      });
    }

    setShowWeightModal(false);
    Alert.alert('Weight Logged', `Logged ${parsed.toFixed(1)} kg for today.`);
  };

  return (
    <View style={styles.screen}>
      <KinetixHeader subtitle="PROGRESS & LOGS" iconName="pulse" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Athlete Profile Mini Card */}
        <View style={styles.profileMiniCard}>
          <View style={styles.profileLeft}>
            <View style={styles.profileAvatarBox}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
                }}
                style={styles.profileAvatar}
              />
              <View style={styles.profileOnlineDot} />
            </View>
            <View style={styles.profileTextCol}>
              <Text style={styles.profileName}>{athleteName}</Text>
              <Text style={styles.profileSubtitle}>Performance & Rehab Tracker</Text>
            </View>
          </View>
          <View style={styles.onTrackBadge}>
            <Text style={styles.onTrackBadgeText}>STATUS: ON TRACK</Text>
          </View>
        </View>

        {/* Section 1: Workout History Calendar */}
        <View style={styles.sectionCard}>
          <View style={styles.calendarTopBar}>
            <View style={styles.calendarHeaderLeft}>
              <View style={styles.calendarIconSquare}>
                <Ionicons name="calendar" size={16} color={KinetixTheme.colors.primary} />
              </View>
              <Text style={styles.calendarTitle}>{monthTitle}</Text>
            </View>
            <View style={styles.chevronControls}>
              <TouchableOpacity
                style={styles.chevronBtn}
                onPress={handlePrevMonth}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={16} color={KinetixTheme.colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.chevronBtn}
                onPress={handleNextMonth}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={16} color={KinetixTheme.colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stat Chips Row */}
          <View style={styles.statChipsRow}>
            <View style={styles.statChip}>
              <Text style={[styles.statChipVal, { color: KinetixTheme.colors.primary }]}>
                {monthStrength}
              </Text>
              <Text style={styles.statChipLabel}>Strength</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={[styles.statChipVal, { color: KinetixTheme.colors.secondary }]}>
                {monthRehab}
              </Text>
              <Text style={styles.statChipLabel}>Rehab Done</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statChipVal}>{attendanceRate}%</Text>
              <Text style={styles.statChipLabel}>Attendance</Text>
            </View>
          </View>

          {/* 7-Day Header */}
          <View style={styles.weekdaysRow}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
              <Text key={idx} style={styles.weekdayLabel}>
                {day}
              </Text>
            ))}
          </View>

          {/* Monthly Calendar Grid */}
          <View style={styles.gridContainer}>
            {/* Leading blanks for Monday-first calendar */}
            {Array.from({ length: leadingBlanks }).map((_, bIdx) => (
              <View key={`blank-${bIdx}`} style={styles.daySlot} />
            ))}

            {calendarDays.map((cd) => {
              const isSelected = selectedDateKey === cd.dateKey;
              return (
                <TouchableOpacity
                  key={cd.dateKey}
                  style={[
                    styles.daySlot,
                    cd.isToday && styles.todaySlot,
                    isSelected && !cd.isToday && styles.selectedDaySlot,
                  ]}
                  onPress={() => setSelectedDateKey(cd.dateKey)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      cd.isToday && styles.todayNumber,
                      isSelected && styles.selectedDayNumber,
                    ]}
                  >
                    {cd.day}
                  </Text>
                  <View style={styles.dayDotsRow}>
                    {cd.hasStrength && (
                      <View
                        style={[
                          styles.microDot,
                          { backgroundColor: KinetixTheme.colors.primary },
                        ]}
                      />
                    )}
                    {cd.hasRehab && (
                      <View
                        style={[
                          styles.microDot,
                          { backgroundColor: KinetixTheme.colors.secondary },
                        ]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Calendar Legend */}
          <View style={styles.calendarLegend}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: KinetixTheme.colors.primary },
                ]}
              />
              <Text style={styles.legendText}>Strength</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: KinetixTheme.colors.secondary },
                ]}
              />
              <Text style={styles.legendText}>Rehab</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={{ flexDirection: 'row', gap: 2 }}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: KinetixTheme.colors.primary },
                  ]}
                />
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: KinetixTheme.colors.secondary },
                  ]}
                />
              </View>
              <Text style={styles.legendText}>Dual Session</Text>
            </View>
          </View>

          {/* Selected Day Snippet */}
          <View
            style={[
              styles.daySnippet,
              selectedDayData.workouts.length === 0 && styles.restDaySnippet,
              selectedDayData.hasRehab && !selectedDayData.hasStrength && styles.rehabDaySnippet,
            ]}
          >
            <Ionicons
              name={
                selectedDayData.workouts.length === 0
                  ? 'moon-outline'
                  : selectedDayData.hasRehab && !selectedDayData.hasStrength
                  ? 'bandage-outline'
                  : selectedDayData.isDual
                  ? 'checkmark-done-circle'
                  : 'barbell-outline'
              }
              size={18}
              color={
                selectedDayData.workouts.length === 0
                  ? KinetixTheme.colors.textMuted
                  : selectedDayData.hasRehab && !selectedDayData.hasStrength
                  ? KinetixTheme.colors.secondary
                  : KinetixTheme.colors.primary
              }
              style={{ marginTop: 2 }}
            />
            <View style={{ flex: 1 }}>
              <View style={styles.snippetTop}>
                <Text style={styles.snippetDayTitle}>
                  {selectedDayFormattedTitle}
                </Text>
                <View
                  style={[
                    styles.completedTag,
                    selectedDayData.workouts.length === 0 && styles.restDayTag,
                    selectedDayData.hasRehab && !selectedDayData.hasStrength && styles.rehabTag,
                  ]}
                >
                  <Text
                    style={[
                      styles.completedTagText,
                      selectedDayData.workouts.length === 0 && styles.restDayTagText,
                      selectedDayData.hasRehab && !selectedDayData.hasStrength && styles.rehabTagText,
                    ]}
                  >
                    {selectedDayData.workouts.length === 0
                      ? 'Rest Day'
                      : selectedDayData.isDual
                      ? 'Dual Session ✓'
                      : selectedDayData.hasRehab
                      ? 'Rehab Done ✓'
                      : 'Strength Done ✓'}
                  </Text>
                </View>
              </View>
              <Text style={styles.snippetDesc}>
                {selectedDayData.workouts.length > 0
                  ? selectedDayData.workouts
                      .map((w: any) => {
                        const isRehab = isRehabWorkout(w);
                        const dur = w.durationFormatted || (w.duration ? `${w.duration}m` : 'Done');
                        const tag = isRehab ? 'Rehab Protocol' : 'Strength Session';
                        return `${w.type || w.worksessionName || 'Session'} (${dur}) • ${tag}`;
                      })
                      .join('  •  ')
                  : 'No workout sessions logged for this day.'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 2: Logged Workouts & Session Timestamps */}
        <View style={styles.sectionCard}>
          <View style={styles.calendarTopBar}>
            <View style={styles.calendarHeaderLeft}>
              <View style={[styles.calendarIconSquare, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="time" size={16} color={KinetixTheme.colors.primary} />
              </View>
              <Text style={styles.calendarTitle}>Recent Workout Activity</Text>
            </View>
            <View style={styles.workoutCountBadge}>
              <Text style={styles.workoutCountBadgeText}>
                {allLoggedWorkouts.length > 0
                  ? `${allLoggedWorkouts.length} Completed`
                  : 'Logged Sessions'}
              </Text>
            </View>
          </View>

          <View style={styles.workoutListContainer}>
            {allLoggedWorkouts.length > 0 ? (
              allLoggedWorkouts.slice(0, 5).map((workout, index) => {
                const isRehab = isRehabWorkout(workout);
                const accentColor = isRehab
                  ? KinetixTheme.colors.secondary
                  : KinetixTheme.colors.primary;
                const accentBg = isRehab
                  ? KinetixTheme.colors.secondaryLight
                  : KinetixTheme.colors.primaryLight;
                const timeDisplay =
                  workout.timeOfDay ||
                  (workout.startTime
                    ? new Date(workout.startTime).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : 'Logged');
                const dateDisplay =
                  workout.dateFormatted || workout.dateKey || 'Recently';
                const durationDisplay =
                  workout.durationFormatted || `${workout.duration || 20} min`;

                return (
                  <View key={workout.id || index} style={styles.workoutHistoryItem}>
                    <View style={styles.workoutItemLeft}>
                      <View style={[styles.workoutIconBox, { backgroundColor: accentBg }]}>
                        <Ionicons
                          name={isRehab ? 'bandage-outline' : 'barbell-outline'}
                          size={18}
                          color={accentColor}
                        />
                      </View>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.workoutItemTitle} numberOfLines={1}>
                          {workout.type || workout.worksessionName || 'Workout Session'}
                        </Text>
                        <View style={styles.workoutItemMetaRow}>
                          <Ionicons
                            name="calendar-outline"
                            size={12}
                            color={KinetixTheme.colors.textMuted}
                          />
                          <Text style={styles.workoutItemMetaText}>{dateDisplay}</Text>
                          <Text style={styles.workoutItemDot}>•</Text>
                          <Ionicons name="time-outline" size={12} color="#059669" />
                          <Text
                            style={[
                              styles.workoutItemMetaText,
                              { color: '#059669', fontWeight: '700' },
                            ]}
                          >
                            {timeDisplay}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.workoutItemRight}>
                      <View
                        style={[
                          styles.workoutDurationBadge,
                          { borderColor: `${accentColor}30` },
                        ]}
                      >
                        <Ionicons name="stopwatch-outline" size={12} color={accentColor} />
                        <Text
                          style={[
                            styles.workoutDurationText,
                            { color: accentColor },
                          ]}
                        >
                          {durationDisplay}
                        </Text>
                      </View>
                      {workout.intensity ? (
                        <Text style={styles.workoutIntensityText}>
                          {workout.intensity} Intensity
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyWorkoutsContainer}>
                <Ionicons
                  name="barbell-outline"
                  size={28}
                  color={KinetixTheme.colors.textMuted}
                />
                <Text style={styles.emptyWorkoutsTitle}>No Workouts Logged Yet</Text>
                <Text style={styles.emptyWorkoutsDesc}>
                  Start an active workout session to record sets, reps, and track progress here.
                </Text>
                <TouchableOpacity
                  style={styles.emptyStartBtn}
                  onPress={() => router.push('/active-workout')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="play" size={14} color="#FFFFFF" />
                  <Text style={styles.emptyStartBtnText}>Start Workout</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Section 3: Active Training & Rehab Goals Tracker */}
        <View style={styles.sectionCard}>
          <View style={styles.goalsTopBar}>
            <View style={styles.calendarHeaderLeft}>
              <View
                style={[
                  styles.calendarIconSquare,
                  { backgroundColor: KinetixTheme.colors.secondaryLight },
                ]}
              >
                <Ionicons name="flag" size={16} color={KinetixTheme.colors.secondary} />
              </View>
              <Text style={styles.calendarTitle}>Active Period Goals</Text>
            </View>
            <TouchableOpacity
              style={styles.newGoalBtn}
              onPress={openGoalModal}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={14} color={KinetixTheme.colors.primary} />
              <Text style={styles.newGoalBtnText}>Manage Goals</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.goalsList}>
            {activeGoals.length > 0 ? (
              activeGoals.map((goal) => {
                const { currentVal, targetVal, percent, isDone } = computeGoalProgress(goal);

                if (isDone) {
                  return (
                    <TouchableOpacity
                      key={goal.id}
                      style={styles.goalCardDone}
                      onPress={openGoalModal}
                      activeOpacity={0.8}
                    >
                      <View style={styles.goalDoneLeft}>
                        <View style={styles.goalDoneIconBox}>
                          <Ionicons
                            name="checkmark-circle"
                            size={18}
                            color={KinetixTheme.colors.secondary}
                          />
                        </View>
                        <View>
                          <Text style={styles.goalTitle}>{goal.title}</Text>
                          <Text style={styles.goalSub}>
                            Target achieved ({currentVal} / {targetVal} {goal.unit})
                          </Text>
                        </View>
                      </View>
                      <View style={styles.goalPillGreen}>
                        <Text style={styles.goalPillGreenText}>Completed ✓</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }

                const pillStyle =
                  percent >= 70 ? styles.goalPillBlue : styles.goalPillSlate;
                const pillTextStyle =
                  percent >= 70 ? styles.goalPillBlueText : styles.goalPillSlateText;
                const pillLabel =
                  percent >= 70 ? 'On Track' : percent >= 30 ? 'In Progress' : 'Started';

                return (
                  <TouchableOpacity
                    key={goal.id}
                    style={styles.goalCard}
                    onPress={openGoalModal}
                    activeOpacity={0.8}
                  >
                    <View style={styles.goalTopRow}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.goalTitle}>{goal.title}</Text>
                        <Text style={styles.goalSub}>
                          Target: {targetVal} {goal.unit} per week
                        </Text>
                      </View>
                      <View style={pillStyle}>
                        <Text style={pillTextStyle}>{pillLabel}</Text>
                      </View>
                    </View>
                    <View style={styles.goalProgRow}>
                      <Text style={styles.goalProgLabel}>
                        {currentVal} / {targetVal} {goal.unit}
                      </Text>
                      <Text style={styles.goalProgPercent}>{percent}%</Text>
                    </View>
                    <View style={styles.goalProgTrack}>
                      <View
                        style={[
                          styles.goalProgFill,
                          {
                            width: `${percent}%`,
                            backgroundColor:
                              percent >= 70
                                ? KinetixTheme.colors.primary
                                : '#6366F1',
                          },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyGoalsContainer}>
                <View style={styles.emptyGoalsIconBox}>
                  <Ionicons name="flag-outline" size={24} color={KinetixTheme.colors.textMuted} />
                </View>
                <Text style={styles.emptyGoalsTitle}>No Active Goals</Text>
                <Text style={styles.emptyGoalsDesc}>
                  You have removed the standard starter goals. Tap below to create your own personalized goals or restore default goals anytime.
                </Text>
                <View style={styles.emptyGoalsBtnRow}>
                  <TouchableOpacity
                    style={styles.emptyAddGoalBtn}
                    onPress={() => {
                      setEditingGoals([]);
                      setIsAddingNewGoal(true);
                      setShowGoalModal(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={14} color="#FFFFFF" />
                    <Text style={styles.emptyAddGoalBtnText}>Add Custom Goal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.emptyRestoreBtn}
                    onPress={handleRestoreStandardGoalsAndSave}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="refresh-outline" size={14} color={KinetixTheme.colors.primary} />
                    <Text style={styles.emptyRestoreBtnText}>Restore Defaults</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Section 4: Monthly Bodyweight Trend Section */}
        <View style={styles.sectionCard}>
          <View style={styles.goalsTopBar}>
            <View style={styles.calendarHeaderLeft}>
              <View style={styles.calendarIconSquare}>
                <Ionicons name="scale-outline" size={16} color={KinetixTheme.colors.primary} />
              </View>
              <Text style={styles.calendarTitle}>Bodyweight Trend</Text>
            </View>

            {/* Range Toggle */}
            <View style={styles.rangeToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.rangeToggleBtn,
                  selectedRange === '30' && styles.rangeToggleBtnActive,
                ]}
                onPress={() => setSelectedRange('30')}
              >
                <Text
                  style={[
                    styles.rangeToggleText,
                    selectedRange === '30' && styles.rangeToggleTextActive,
                  ]}
                >
                  30D
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.rangeToggleBtn,
                  selectedRange === '90' && styles.rangeToggleBtnActive,
                ]}
                onPress={() => setSelectedRange('90')}
              >
                <Text
                  style={[
                    styles.rangeToggleText,
                    selectedRange === '90' && styles.rangeToggleTextActive,
                  ]}
                >
                  90D
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.rangeToggleBtn,
                  selectedRange === '365' && styles.rangeToggleBtnActive,
                ]}
                onPress={() => setSelectedRange('365')}
              >
                <Text
                  style={[
                    styles.rangeToggleText,
                    selectedRange === '365' && styles.rangeToggleTextActive,
                  ]}
                >
                  1Y
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Highlights Row */}
          <View style={styles.statChipsRow}>
            <View style={styles.statChip}>
              <Text style={styles.weightStatLabel}>Current</Text>
              <Text style={styles.weightStatVal}>
                {currentWeight.toFixed(1)}{' '}
                <Text style={styles.weightStatUnit}>kg</Text>
              </Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.weightStatLabel}>{selectedRange}D Change</Text>
              <View style={styles.changeBadge}>
                <Text style={styles.changeBadgeText}>{weightChangeStr}</Text>
              </View>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.weightStatLabel}>Target</Text>
              <Text style={styles.weightStatVal}>
                {targetWeight.toFixed(1)}{' '}
                <Text style={styles.weightStatUnit}>kg</Text>
              </Text>
            </View>
          </View>

          {/* Infographic Trend Area Box */}
          <View style={styles.chartWrapper}>
            <View style={styles.chartTopLabels}>
              <Text style={styles.chartAxisLabel}>{maxScale.toFixed(1)} kg</Text>
              <View style={styles.targetDashedLegend}>
                <View style={styles.dashedLineSegment} />
                <Text style={styles.targetLegendText}>
                  Target ({targetWeight.toFixed(1)} kg)
                </Text>
              </View>
            </View>

            {/* Custom stylized chart visual */}
            <View style={styles.chartVisualArea}>
              <View style={styles.chartHGridLine} />
              <View style={[styles.chartHGridLine, { top: '50%' }]} />
              <View
                style={[
                  styles.targetDashedHLine,
                  { top: `${targetPercent}%` },
                ]}
              />

              {/* Data points dynamically positioned */}
              <View style={styles.chartPointsContainer}>
                {chartPoints.map((pt, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.chartDotContainer,
                      {
                        left: `${pt.leftPercent}%`,
                        top: `${pt.topPercent}%`,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.chartDot,
                        pt.isLast && styles.chartDotActive,
                      ]}
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* X-Axis Dates */}
            <View style={styles.xAxisRow}>
              {xAxisLabels.map((lbl, idx) => (
                <Text
                  key={idx}
                  style={[
                    styles.xAxisText,
                    lbl.isHighlighted && {
                      color: KinetixTheme.colors.primary,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {lbl.text}
                </Text>
              ))}
            </View>
          </View>

          {/* Log Today's Weight Button */}
          <TouchableOpacity
            style={styles.logWeightBtn}
            onPress={openWeightModal}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={18} color={KinetixTheme.colors.primary} />
            <Text style={styles.logWeightBtnText}>Log Today's Weight</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Log Weight Modal */}
      <Modal
        visible={showWeightModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWeightModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalTopRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="scale" size={20} color={KinetixTheme.colors.primary} />
                <Text style={styles.modalHeaderTitle}>Log Bodyweight</Text>
              </View>
              <TouchableOpacity onPress={() => setShowWeightModal(false)}>
                <Ionicons name="close" size={20} color={KinetixTheme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInputLabel}>Today's Weight (kg):</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="decimal-pad"
              value={weightInput}
              onChangeText={setWeightInput}
              placeholder="e.g. 78.4"
            />

            <Text style={styles.modalInputLabel}>Target Weight (kg):</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="decimal-pad"
              value={targetWeightInput}
              onChangeText={setTargetWeightInput}
              placeholder="e.g. 77.5"
            />

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveWeight}>
              <Text style={styles.modalSaveBtnText}>Save Entry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Goal Management Modal */}
      <Modal
        visible={showGoalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <View style={styles.modalTopRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="trophy" size={20} color={KinetixTheme.colors.primary} />
                <Text style={styles.modalHeaderTitle}>Manage Period Goals</Text>
              </View>
              <TouchableOpacity onPress={() => setShowGoalModal(false)}>
                <Ionicons name="close" size={20} color={KinetixTheme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Adjust your targets, remove standard goals, or set your own custom performance milestones.
            </Text>

            {/* Quick Actions Bar */}
            <View style={styles.modalActionsBar}>
              {editingGoals.some((g) => STANDARD_GOAL_IDS.includes(g.id)) ? (
                <TouchableOpacity
                  style={styles.removeStandardBtn}
                  onPress={handleRemoveAllStandardGoals}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={13} color="#DC2626" />
                  <Text style={styles.removeStandardBtnText}>Remove Standard Goals</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.restoreStandardBtn}
                  onPress={handleRestoreStandardGoals}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh-outline" size={13} color={KinetixTheme.colors.primary} />
                  <Text style={styles.restoreStandardBtnText}>Restore Standard Goals</Text>
                </TouchableOpacity>
              )}

              {editingGoals.length > 0 && (
                <TouchableOpacity
                  style={styles.clearAllBtn}
                  onPress={() => setEditingGoals([])}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearAllBtnText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {editingGoals.map((g) => {
                const isStandard = STANDARD_GOAL_IDS.includes(g.id);
                return (
                  <View key={g.id} style={styles.goalEditorRow}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.goalEditorTitle}>{g.title}</Text>
                        <View style={isStandard ? styles.standardPill : styles.customPill}>
                          <Text style={isStandard ? styles.standardPillText : styles.customPillText}>
                            {isStandard ? 'Standard' : 'Custom'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.goalEditorSub}>
                        Target: {g.target_value} {g.unit}
                      </Text>
                    </View>

                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => handleStepGoal(g.id, -1)}
                      >
                        <Ionicons name="remove" size={14} color={KinetixTheme.colors.text} />
                      </TouchableOpacity>
                      <Text style={styles.stepperVal}>{g.target_value}</Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => handleStepGoal(g.id, 1)}
                      >
                        <Ionicons name="add" size={14} color={KinetixTheme.colors.text} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.stepperBtn, { backgroundColor: '#FEE2E2', marginLeft: 4 }]}
                        onPress={() => handleDeleteGoal(g.id)}
                      >
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {editingGoals.length === 0 && !isAddingNewGoal && (
                <View style={styles.modalEmptyBox}>
                  <Text style={styles.modalEmptyText}>
                    All goals removed. Tap "Add Custom Goal" below or "Restore Standard Goals" above.
                  </Text>
                </View>
              )}

              {isAddingNewGoal ? (
                <View style={styles.addGoalCard}>
                  <Text style={styles.addGoalCardTitle}>New Custom Goal</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Goal Title (e.g. Knee Symmetry)"
                    value={newGoalTitle}
                    onChangeText={setNewGoalTitle}
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalInputLabel}>Target</Text>
                      <TextInput
                        style={styles.modalInput}
                        keyboardType="numeric"
                        placeholder="3"
                        value={newGoalTarget}
                        onChangeText={setNewGoalTarget}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalInputLabel}>Unit</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="sessions / %"
                        value={newGoalUnit}
                        onChangeText={setNewGoalUnit}
                      />
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                    <TouchableOpacity
                      style={styles.cancelAddBtn}
                      onPress={() => setIsAddingNewGoal(false)}
                    >
                      <Text style={styles.cancelAddBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmAddBtn}
                      onPress={handleAddCustomGoal}
                    >
                      <Text style={styles.confirmAddBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addGoalTriggerBtn}
                  onPress={() => setIsAddingNewGoal(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle-outline" size={16} color={KinetixTheme.colors.primary} />
                  <Text style={styles.addGoalTriggerText}>Add Custom Goal</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveGoals}>
              <Text style={styles.modalSaveBtnText}>Save Goals</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Nav */}
      <KinetixBottomNav activeTab="progress" />
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
  profileMiniCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    marginBottom: 14,
    ...KinetixTheme.shadows.card,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    position: 'relative',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  profileOnlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: KinetixTheme.colors.secondary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileTextCol: {
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 15,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.2,
  },
  profileSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: KinetixTheme.colors.textMuted,
    marginTop: 1,
  },
  onTrackBadge: {
    backgroundColor: KinetixTheme.colors.secondaryLight,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: KinetixTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  onTrackBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: KinetixTheme.colors.secondaryDark,
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    marginBottom: 14,
    ...KinetixTheme.shadows.card,
  },
  calendarTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarIconSquare: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: KinetixTheme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  chevronControls: {
    flexDirection: 'row',
    gap: 4,
  },
  chevronBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: KinetixTheme.borderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statChipVal: {
    fontSize: 16,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  statChipLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
    marginTop: 2,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
    marginBottom: 2,
  },
  weekdayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    width: 32,
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  daySlot: {
    width: '13%',
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  todaySlot: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: KinetixTheme.colors.primary,
  },
  selectedDaySlot: {
    backgroundColor: '#F1F5F9',
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: KinetixTheme.colors.text,
  },
  todayNumber: {
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
  },
  selectedDayNumber: {
    color: KinetixTheme.colors.primary,
  },
  dayDotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    height: 4,
  },
  microDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
    color: KinetixTheme.colors.textMuted,
  },
  daySnippet: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: KinetixTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 12,
  },
  restDaySnippet: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  snippetTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  snippetDayTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  completedTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  completedTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  restDayTag: {
    backgroundColor: '#F1F5F9',
  },
  restDayTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  rehabDaySnippet: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  rehabTag: {
    backgroundColor: '#DCFCE7',
  },
  rehabTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  snippetDesc: {
    fontSize: 11,
    color: KinetixTheme.colors.textSecondary,
    marginTop: 2,
  },
  goalsTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  newGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: KinetixTheme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  newGoalBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.primary,
  },
  goalsList: {
    gap: 10,
  },
  goalCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: KinetixTheme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  goalTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  goalTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  goalSub: {
    fontSize: 10,
    color: KinetixTheme.colors.textMuted,
    marginTop: 1,
  },
  goalPillBlue: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: KinetixTheme.borderRadius.full,
  },
  goalPillBlueText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1E40AF',
  },
  goalPillGreen: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: KinetixTheme.borderRadius.full,
  },
  goalPillGreenText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  goalPillSlate: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: KinetixTheme.borderRadius.full,
  },
  goalPillSlateText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  goalProgRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  goalProgLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.textSecondary,
  },
  goalProgPercent: {
    fontSize: 11,
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
  },
  goalProgTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  goalProgFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalCardDone: {
    backgroundColor: '#F8FAFC',
    borderRadius: KinetixTheme.borderRadius.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  goalDoneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalDoneIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  rangeToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rangeToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    ...KinetixTheme.shadows.card,
  },
  rangeToggleText: {
    fontSize: 10,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  rangeToggleTextActive: {
    color: KinetixTheme.colors.primary,
    fontWeight: '700',
  },
  weightStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  weightStatVal: {
    fontSize: 16,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    marginTop: 2,
  },
  weightStatUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: KinetixTheme.colors.textMuted,
  },
  changeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  changeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  chartWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: KinetixTheme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  chartTopLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chartAxisLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  targetDashedLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dashedLineSegment: {
    width: 12,
    height: 2,
    borderBottomWidth: 2,
    borderStyle: 'dashed',
    borderColor: KinetixTheme.colors.secondary,
  },
  targetLegendText: {
    fontSize: 10,
    fontWeight: '600',
    color: KinetixTheme.colors.secondary,
  },
  chartVisualArea: {
    height: 100,
    width: '100%',
    position: 'relative',
    marginVertical: 4,
  },
  chartHGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  targetDashedHLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderBottomWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: KinetixTheme.colors.secondary,
  },
  chartPointsContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  chartDotContainer: {
    position: 'absolute',
    transform: [{ translateX: -4 }, { translateY: -4 }],
  },
  chartDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: KinetixTheme.colors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chartDotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2.5,
    backgroundColor: KinetixTheme.colors.primary,
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  xAxisText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  logWeightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: KinetixTheme.borderRadius.md,
  },
  logWeightBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 20,
    ...KinetixTheme.shadows.card,
  },
  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: KinetixTheme.colors.textMuted,
    marginBottom: 14,
    lineHeight: 16,
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: KinetixTheme.colors.textSecondary,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    borderRadius: KinetixTheme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '600',
    color: KinetixTheme.colors.text,
    marginBottom: 12,
  },
  modalSaveBtn: {
    backgroundColor: KinetixTheme.colors.primary,
    paddingVertical: 12,
    borderRadius: KinetixTheme.borderRadius.md,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSaveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  goalEditorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: KinetixTheme.borderRadius.md,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  goalEditorTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
  },
  goalEditorSub: {
    fontSize: 10,
    color: KinetixTheme.colors.textMuted,
    marginTop: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperVal: {
    fontSize: 13,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  addGoalTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: KinetixTheme.borderRadius.md,
    marginBottom: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: KinetixTheme.colors.primary,
  },
  addGoalTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.primary,
  },
  addGoalCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: KinetixTheme.borderRadius.md,
    padding: 12,
    marginBottom: 10,
  },
  addGoalCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    marginBottom: 8,
  },
  cancelAddBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelAddBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  confirmAddBtn: {
    backgroundColor: KinetixTheme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  confirmAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  workoutCountBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  workoutCountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
  },
  workoutListContainer: {
    gap: 10,
    marginTop: 6,
  },
  workoutHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: KinetixTheme.borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  workoutItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  workoutIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.2,
  },
  workoutItemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  workoutItemMetaText: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    fontWeight: '500',
  },
  workoutItemDot: {
    fontSize: 10,
    color: KinetixTheme.colors.textMuted,
    marginHorizontal: 2,
  },
  workoutItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  workoutDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  workoutDurationText: {
    fontSize: 11.5,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  workoutIntensityText: {
    fontSize: 10,
    color: KinetixTheme.colors.textMuted,
    fontWeight: '600',
  },
  emptyWorkoutsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: KinetixTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyWorkoutsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    marginTop: 8,
  },
  emptyWorkoutsDesc: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  emptyStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: KinetixTheme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  emptyStartBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  removeStandardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  removeStandardBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  restoreStandardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  restoreStandardBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.primary,
  },
  clearAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  clearAllBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  standardPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  standardPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: KinetixTheme.colors.primary,
  },
  customPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  customPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  modalEmptyBox: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: KinetixTheme.borderRadius.md,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  modalEmptyText: {
    fontSize: 11.5,
    color: KinetixTheme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  emptyGoalsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: KinetixTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyGoalsIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyGoalsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  emptyGoalsDesc: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 15,
  },
  emptyGoalsBtnRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  emptyAddGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: KinetixTheme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  emptyAddGoalBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyRestoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  emptyRestoreBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: KinetixTheme.colors.primary,
  },
});
