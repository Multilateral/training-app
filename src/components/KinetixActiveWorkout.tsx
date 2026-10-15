import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { KinetixTheme } from '../constants/theme';
import ExerciseVideoModal from './ExerciseVideoModal';
import KinetixBottomNav from './KinetixBottomNav';
import KinetixHeader from './KinetixHeader';
import { TrainingContext } from '../context/TrainingContext';
import { DATABASE_WORKSESSIONS } from '../data/databaseLibraryData';

interface ExerciseData {
  id?: string;
  name: string;
  cue?: string;
  sets?: number;
  totalSets?: number;
  reps: string | number;
  load?: string;
  weight?: string;
  restSeconds?: number;
  trackingType?: 'duration' | 'weight_reps' | 'bodyweight';
  tracking_type?: string;
  video_url?: string | null;
}

interface WorksessionData {
  id?: string;
  name: string;
  category?: string;
  focus?: string;
  duration?: number;
  estimatedDuration?: number;
  rpe?: string;
  exercises: ExerciseData[];
}

interface KinetixActiveWorkoutProps {
  worksession?: any;
  plan?: any;
  onFinish?: (durationMins?: number) => void;
}

const STANDBY_SESSIONS: WorksessionData[] = DATABASE_WORKSESSIONS.map((ws) => ({
  id: ws.id,
  name: ws.title,
  category: ws.type === 'rehab' ? 'Rehab Track' : 'Performance Track',
  focus: ws.description || ws.category || 'Targeted Protocol',
  duration: parseInt(ws.metrics.duration) || 30,
  rpe: ws.type === 'rehab' ? '5.0' : '8.0',
  exercises: ws.exercises.map((e) => ({
    name: e.name,
    cue: e.cue || 'Controlled form.',
    totalSets: e.sets || 3,
    reps: String(e.reps),
    load: e.weight || 'Standard',
    restSeconds: e.restSeconds || 60,
    trackingType: (e.tracking_type === 'time' ? 'duration' : 'weight_reps') as 'duration' | 'weight_reps',
    video_url: null,
  })),
}));

export default function KinetixActiveWorkout({
  worksession,
  plan,
  onFinish,
}: KinetixActiveWorkoutProps) {
  const router = useRouter();
  const { activeSessionMetadata, setActiveSessionMetadata } = useContext(TrainingContext) || {};

  // Check whether we have an active workout session in progress
  const hasActiveSession = Boolean(
    activeSessionMetadata?.isActive || worksession?.exercises?.length
  );

  // Active workout states
  const [currentSessionName, setCurrentSessionName] = useState<string>(
    activeSessionMetadata?.worksessionName || worksession?.name || 'Strength & Power (Lower Body)'
  );

  const initialExercises: ExerciseData[] = worksession?.exercises && worksession.exercises.length > 0
    ? worksession.exercises.map((e: any, idx: number) => ({
        id: `ex-${idx}`,
        name: e.name || 'Exercise',
        cue: e.cue || '',
        totalSets: e.totalSets || e.sets || 3,
        reps: typeof e.reps === 'number' ? `${e.reps} reps` : (e.reps || '10 reps'),
        load: e.load || e.weight || 'Bodyweight',
        trackingType: e.trackingType || (e.tracking_type === 'time' ? 'duration' : 'weight_reps'),
        video_url: e.video_url || null,
      }))
    : activeSessionMetadata?.exercises && activeSessionMetadata.exercises.length > 0
    ? activeSessionMetadata.exercises
    : STANDBY_SESSIONS[0].exercises;

  const [currentExercises, setCurrentExercises] = useState<ExerciseData[]>(initialExercises);

  const [currentExIndex, setCurrentExIndex] = useState<number>(
    typeof activeSessionMetadata?.currentExerciseIndex === 'number'
      ? activeSessionMetadata.currentExerciseIndex
      : 0
  );
  const currentEx = currentExercises[currentExIndex] || currentExercises[0];

  const [currentSet, setCurrentSet] = useState<number>(
    typeof activeSessionMetadata?.currentSet === 'number'
      ? activeSessionMetadata.currentSet
      : 1
  );

  const [activeMode, setActiveMode] = useState<'duration' | 'weight_reps' | 'bodyweight'>('duration');

  // Modality States
  const [holdSeconds, setHoldSeconds] = useState(45);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [wrReps, setWrReps] = useState(8);
  const [wrWeight, setWrWeight] = useState(80);

  const [bwReps, setBwReps] = useState(12);
  const [bwExtraLoad, setBwExtraLoad] = useState<number>(0);

  const [currentDockLoad, setCurrentDockLoad] = useState(40);
  const [painLevel, setPainLevel] = useState<'0' | '2' | '5'>('0');
  const [selectedVideoModal, setSelectedVideoModal] = useState<any>(null);

  // Sync active session metadata globally whenever an active workout is in progress
  useEffect(() => {
    if (hasActiveSession && setActiveSessionMetadata) {
      setActiveSessionMetadata({
        isActive: true,
        worksessionName: currentSessionName,
        currentExerciseName: currentEx?.name || 'Exercise',
        currentExerciseIndex: currentExIndex,
        totalExercises: currentExercises.length,
        currentSet: currentSet,
        totalSets: currentEx?.totalSets || 4,
        currentLoad: currentDockLoad,
        startTime: activeSessionMetadata?.startTime || Date.now(),
        exercises: currentExercises,
      });
    }
  }, [hasActiveSession, currentSessionName, currentExIndex, currentSet, currentDockLoad, currentEx?.name]);

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && !isPaused && holdSeconds > 0) {
      interval = setInterval(() => {
        setHoldSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, isPaused, holdSeconds]);

  // Launch a session from Standby Mode
  const handleLaunchSession = (sessionData: WorksessionData) => {
    setCurrentSessionName(sessionData.name);
    setCurrentExercises(sessionData.exercises);
    setCurrentExIndex(0);
    setCurrentSet(1);
    setHoldSeconds(45);
    setTimerRunning(false);
    setIsPaused(false);

    if (setActiveSessionMetadata) {
      setActiveSessionMetadata({
        isActive: true,
        worksessionName: sessionData.name,
        currentExerciseName: sessionData.exercises[0].name,
        currentExerciseIndex: 0,
        totalExercises: sessionData.exercises.length,
        currentSet: 1,
        totalSets: sessionData.exercises[0].totalSets || 4,
        currentLoad: 40,
        startTime: Date.now(),
        exercises: sessionData.exercises,
      });
    }
  };

  const handleAdjustHold = (delta: number) => {
    setHoldSeconds((prev) => Math.max(5, prev + delta));
  };

  const handleCompleteSet = () => {
    const totalSetsForEx = currentEx?.totalSets || 4;
    if (currentSet < totalSetsForEx) {
      setCurrentSet((prev) => prev + 1);
      setHoldSeconds(45);
      setTimerRunning(false);
      Alert.alert('Set Logged! ✓', `Set ${currentSet} of ${currentEx.name} recorded.`);
    } else {
      if (currentExIndex < currentExercises.length - 1) {
        setCurrentExIndex((prev) => prev + 1);
        setCurrentSet(1);
        setHoldSeconds(45);
        setTimerRunning(false);
        Alert.alert('Exercise Completed! 🎉', `Moving to next: ${currentExercises[currentExIndex + 1]?.name}`);
      } else {
        Alert.alert('Workout Finished! 🏆', 'Great effort! Your session has been completed.', [
          {
            text: 'Finish & Save',
            onPress: () => {
              if (setActiveSessionMetadata) setActiveSessionMetadata(null);
              if (onFinish) onFinish(35);
              else router.replace('/history');
            },
          },
        ]);
      }
    }
  };

  const handleExitPress = () => {
    Alert.alert(
      'Session In Progress',
      'Choose an action for your active workout:',
      [
        {
          text: 'Minimize (Keep Active)',
          onPress: () => router.push('/'),
        },
        {
          text: 'Discard Session',
          style: 'destructive',
          onPress: () => {
            if (setActiveSessionMetadata) setActiveSessionMetadata(null);
            router.replace('/active-workout');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSkipSet = () => {
    const totalSetsForEx = currentEx?.totalSets || 4;
    if (currentSet < totalSetsForEx) {
      setCurrentSet((prev) => prev + 1);
    } else if (currentExIndex < currentExercises.length - 1) {
      setCurrentExIndex((prev) => prev + 1);
      setCurrentSet(1);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const overallProgress = Math.round(
    ((currentExIndex * 3 + currentSet) / (Math.max(1, currentExercises.length) * 3.5)) * 100
  );

  // ==========================================
  // 1. STANDBY MODE: User picks a worksession
  // ==========================================
  if (!hasActiveSession) {
    const todayRecommended = STANDBY_SESSIONS[0];

    return (
      <View style={styles.screen}>
        <KinetixHeader subtitle="ACTIVE STUDIO" iconName="play-circle" />

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.standbyScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Banner / Ready Launcher */}
          <View style={styles.standbyHeroCard}>
            <View style={styles.standbyHeroTop}>
              <View style={styles.standbyBadge}>
                <Ionicons name="flash" size={12} color={KinetixTheme.colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.standbyBadgeText}>READY TO TRAIN</Text>
              </View>
              <Text style={styles.standbyHeroStatus}>STANDBY MODE</Text>
            </View>
            <Text style={styles.standbyHeroTitle}>Select a Worksession</Text>
            <Text style={styles.standbyHeroSubtitle}>
              Choose a performance track or rehabilitation protocol below to start your guided session with real-time tracking, rep steppers, and rest clocks.
            </Text>
          </View>

          {/* Section: Today's Prescribed Session */}
          <View style={styles.standbySection}>
            <View style={styles.standbySectionHeader}>
              <View style={styles.standbyHeaderLeft}>
                <Ionicons name="calendar" size={16} color={KinetixTheme.colors.primary} />
                <Text style={styles.standbySectionTitle}>Today's Prescribed Session</Text>
              </View>
              <View style={styles.durationPill}>
                <Text style={styles.durationPillText}>{todayRecommended.duration} MIN TOTAL</Text>
              </View>
            </View>

            <View style={styles.featuredSessionCard}>
              <View style={styles.featuredTopRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.featuredBadgeRow}>
                    <View style={styles.performanceBadge}>
                      <Text style={styles.performanceBadgeText}>{todayRecommended.category}</Text>
                    </View>
                    <Text style={styles.rpeText}>RPE {todayRecommended.rpe}</Text>
                  </View>
                  <Text style={styles.featuredTitle}>{todayRecommended.name}</Text>
                  <Text style={styles.featuredSubtitle}>{todayRecommended.focus}</Text>
                </View>
              </View>

              {/* Exercise Previews */}
              <View style={styles.standbyExercisePillsRow}>
                {todayRecommended.exercises.slice(0, 3).map((ex, i) => (
                  <View key={i} style={styles.standbyExPill}>
                    <Text style={styles.standbyExPillIndex}>{i + 1}</Text>
                    <Text style={styles.standbyExPillName}>{ex.name}</Text>
                  </View>
                ))}
                {todayRecommended.exercises.length > 3 && (
                  <View style={styles.standbyExPillMore}>
                    <Text style={styles.standbyExPillMoreText}>+{todayRecommended.exercises.length - 3} more</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.featuredLaunchBtn}
                onPress={() => handleLaunchSession(todayRecommended)}
                activeOpacity={0.88}
              >
                <View style={styles.launchBtnContent}>
                  <Ionicons name="play" size={18} color="#FFFFFF" />
                  <Text style={styles.launchBtnText}>Start Today's Session</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: Targeted Worksessions List */}
          <View style={styles.standbySection}>
            <View style={styles.standbySectionHeader}>
              <View style={styles.standbyHeaderLeft}>
                <Ionicons name="barbell" size={16} color={KinetixTheme.colors.textSecondary} />
                <Text style={styles.standbySectionTitle}>All Available Worksessions</Text>
              </View>
              <Text style={styles.standbySectionCount}>{STANDBY_SESSIONS.length} Tracks</Text>
            </View>

            <View style={styles.standbyCardsList}>
              {STANDBY_SESSIONS.slice(1).map((sess) => {
                const isRehab = sess.category?.toLowerCase().includes('rehab');
                const themeColor = isRehab ? KinetixTheme.colors.secondary : KinetixTheme.colors.primary;
                const themeBg = isRehab ? KinetixTheme.colors.secondaryLight : KinetixTheme.colors.primaryLight;

                return (
                  <View key={sess.id} style={styles.standbyCard}>
                    <View style={styles.standbyCardTop}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <View style={styles.standbyCardTagRow}>
                          <View style={[styles.standbyTypeTag, { backgroundColor: themeBg }]}>
                            <Text style={[styles.standbyTypeTagText, { color: themeColor }]}>
                              {sess.category}
                            </Text>
                          </View>
                          <Text style={styles.standbyDurationText}>{sess.duration} min • {sess.exercises.length} moves</Text>
                        </View>
                        <Text style={styles.standbyCardTitle}>{sess.name}</Text>
                        <Text style={styles.standbyCardDesc}>{sess.focus}</Text>
                      </View>

                      <TouchableOpacity
                        style={[styles.standbyQuickStartBtn, { backgroundColor: themeColor }]}
                        onPress={() => handleLaunchSession(sess)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="play" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>

        {/* Persistent Bottom Navigation */}
        <KinetixBottomNav activeTab="active" />
      </View>
    );
  }

  // ==========================================
  // 2. IN-PROGRESS MODE: Live Guided Tracking
  // ==========================================
  return (
    <View style={styles.screen}>
      {/* Top Active Bar with Workout Session Name prominently displayed */}
      <View style={styles.topActiveBar}>
        <View style={styles.topActiveLeft}>
          <View style={styles.boltIconBox}>
            <Ionicons name="flash" size={18} color={KinetixTheme.colors.primary} />
          </View>
          <View style={styles.sessionNameContainer}>
            <Text style={styles.sessionNameHeading} numberOfLines={1}>
              {currentSessionName}
            </Text>
            <View style={styles.sessionSubRow}>
              <View style={styles.pulseGreenDot} />
              <Text style={styles.sessionInProgText}>IN PROGRESS</Text>
              <Text style={styles.sessionSubDot}>•</Text>
              <Text style={styles.sessionCounterText}>
                Ex {currentExIndex + 1} of {currentExercises.length}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.topActiveRight}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleExitPress}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={KinetixTheme.colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(10, overallProgress))}%` }]} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header & Exercise Title */}
        <View style={styles.exerciseTitleRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <View style={styles.exerciseTagRow}>
              <Text style={styles.exerciseStepText}>
                Exercise {currentExIndex + 1} of {currentExercises.length}
              </Text>
              <View style={styles.dotSeparator} />
              <View style={styles.activePill}>
                <Ionicons name="checkmark-circle" size={13} color={KinetixTheme.colors.secondary} />
                <Text style={styles.activePillText}>Active</Text>
              </View>
            </View>
            <Text style={styles.currentExerciseHeading}>{currentEx?.name}</Text>
          </View>

          <TouchableOpacity
            style={styles.infoBtn}
            onPress={() => setSelectedVideoModal(currentEx)}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={22} color={KinetixTheme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Adaptive Counter Display Card */}
        <View style={styles.counterCard}>
          {/* Mode Switcher Tabs */}
          <View style={styles.modeTabsRow}>
            <TouchableOpacity
              style={[styles.modeTab, activeMode === 'duration' && styles.modeTabActive]}
              onPress={() => setActiveMode('duration')}
            >
              <Ionicons
                name="timer-outline"
                size={14}
                color={activeMode === 'duration' ? KinetixTheme.colors.primary : KinetixTheme.colors.textMuted}
              />
              <Text style={[styles.modeTabText, activeMode === 'duration' && styles.modeTabTextActive]}>
                Hold / Timer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, activeMode === 'weight_reps' && styles.modeTabActive]}
              onPress={() => setActiveMode('weight_reps')}
            >
              <Ionicons
                name="barbell-outline"
                size={14}
                color={activeMode === 'weight_reps' ? KinetixTheme.colors.primary : KinetixTheme.colors.textMuted}
              />
              <Text style={[styles.modeTabText, activeMode === 'weight_reps' && styles.modeTabTextActive]}>
                Weight & Reps
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, activeMode === 'bodyweight' && styles.modeTabActive]}
              onPress={() => setActiveMode('bodyweight')}
            >
              <Ionicons
                name="body-outline"
                size={14}
                color={activeMode === 'bodyweight' ? KinetixTheme.colors.primary : KinetixTheme.colors.textMuted}
              />
              <Text style={[styles.modeTabText, activeMode === 'bodyweight' && styles.modeTabTextActive]}>
                Bodyweight
              </Text>
            </TouchableOpacity>
          </View>

          {/* View 1: Duration / Isometric View */}
          {activeMode === 'duration' && (
            <View style={styles.durationView}>
              <View style={styles.targetBanner}>
                <View style={styles.targetLeft}>
                  <View style={styles.pulseGreenDot} />
                  <Text style={styles.targetText}>Target: {currentEx?.reps || '45s'} Hold</Text>
                </View>
                <Text style={styles.targetRight}>
                  Set {currentSet} of {currentEx?.totalSets || 4}
                </Text>
              </View>

              {/* Digital Hold Clock */}
              <TouchableOpacity
                style={styles.clockCenter}
                onPress={() => setTimerRunning(!timerRunning)}
                activeOpacity={0.8}
              >
                <Text style={styles.clockDigits}>{formatTimer(holdSeconds)}</Text>
                <Text style={styles.clockSecLabel}>SEC</Text>
                <Text style={styles.clockSubText}>{currentEx?.name} Isometric Hold</Text>
                <View style={styles.clockProgressBar}>
                  <View style={[styles.clockProgressFill, { width: `${(holdSeconds / 45) * 100}%` }]} />
                </View>
              </TouchableOpacity>

              {/* Hold Stepper Presets */}
              <View style={styles.stepperRow}>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => handleAdjustHold(-5)}>
                  <Text style={styles.stepperBtnText}>-5s</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => handleAdjustHold(-1)}>
                  <Text style={styles.stepperBtnText}>-1s</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.stepperBtn, styles.stepperBtnPrimary]} onPress={() => handleAdjustHold(1)}>
                  <Text style={[styles.stepperBtnText, styles.stepperBtnTextPrimary]}>+1s</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.stepperBtn, styles.stepperBtnPrimary]} onPress={() => handleAdjustHold(5)}>
                  <Text style={[styles.stepperBtnText, styles.stepperBtnTextPrimary]}>+5s</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* View 2: Weight & Reps View */}
          {activeMode === 'weight_reps' && (
            <View style={styles.weightRepsView}>
              <View style={styles.targetBanner}>
                <Text style={styles.targetText}>Target: {currentEx?.reps || '8 reps'} · {currentEx?.load || '80kg'}</Text>
                <Text style={styles.targetRight}>{currentEx?.name}</Text>
              </View>

              <View style={styles.stepperColsRow}>
                {/* Reps Column */}
                <View style={styles.stepperCol}>
                  <Text style={styles.stepperColLabel}>REPS</Text>
                  <View style={styles.stepperBox}>
                    <TouchableOpacity style={styles.stepCircleBtn} onPress={() => setWrReps(Math.max(1, wrReps - 1))}>
                      <Ionicons name="remove" size={16} color={KinetixTheme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.stepperVal}>{wrReps}</Text>
                    <TouchableOpacity style={styles.stepCircleBtn} onPress={() => setWrReps(wrReps + 1)}>
                      <Ionicons name="add" size={16} color={KinetixTheme.colors.text} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.miniPillsRow}>
                    <TouchableOpacity style={styles.miniPill} onPress={() => setWrReps(wrReps + 1)}>
                      <Text style={styles.miniPillText}>+1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.miniPill} onPress={() => setWrReps(wrReps + 2)}>
                      <Text style={styles.miniPillText}>+2</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Weight Column */}
                <View style={styles.stepperCol}>
                  <Text style={styles.stepperColLabel}>LOAD (KG)</Text>
                  <View style={styles.stepperBox}>
                    <TouchableOpacity style={styles.stepCircleBtn} onPress={() => setWrWeight(Math.max(0, wrWeight - 2.5))}>
                      <Text style={styles.stepTextBtn}>-2.5</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperVal}>{wrWeight}<Text style={styles.stepperUnit}>kg</Text></Text>
                    <TouchableOpacity style={styles.stepCircleBtn} onPress={() => setWrWeight(wrWeight + 2.5)}>
                      <Text style={styles.stepTextBtn}>+2.5</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.miniPillsRow}>
                    <TouchableOpacity style={styles.miniPill} onPress={() => setWrWeight(wrWeight + 5)}>
                      <Text style={styles.miniPillText}>+5kg</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.miniPill} onPress={() => setWrWeight(wrWeight + 10)}>
                      <Text style={styles.miniPillText}>+10kg</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* View 3: Bodyweight + Extra Load View */}
          {activeMode === 'bodyweight' && (
            <View style={styles.bodyweightView}>
              <View style={styles.targetBanner}>
                <Text style={styles.targetText}>Target: {currentEx?.reps || '12 reps'} · Bodyweight</Text>
                <Text style={styles.targetRight}>{currentEx?.name}</Text>
              </View>

              <View style={styles.bwCounterRow}>
                <View>
                  <Text style={styles.bwLabel}>COMPLETED REPS</Text>
                  <Text style={styles.bwSub}>Unassisted reps</Text>
                </View>
                <View style={styles.bwControls}>
                  <TouchableOpacity style={styles.bwBtn} onPress={() => setBwReps(Math.max(1, bwReps - 1))}>
                    <Ionicons name="remove" size={18} color={KinetixTheme.colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.bwVal}>{bwReps}</Text>
                  <TouchableOpacity style={styles.bwBtn} onPress={() => setBwReps(bwReps + 1)}>
                    <Ionicons name="add" size={18} color={KinetixTheme.colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Added Extra Load Badges */}
              <View style={styles.extraLoadBox}>
                <View style={styles.extraLoadLeft}>
                  <Ionicons name="add-circle" size={18} color={KinetixTheme.colors.primary} />
                  <View>
                    <Text style={styles.extraLoadTitle}>Added Extra Load</Text>
                    <Text style={styles.extraLoadSub}>Vest, chain, or belt dumbbell</Text>
                  </View>
                </View>
                <View style={styles.extraLoadBadges}>
                  {[0, 5, 10].map((val) => {
                    const isSelected = bwExtraLoad === val;
                    return (
                      <TouchableOpacity
                        key={val}
                        style={[styles.extraPill, isSelected && styles.extraPillSelected]}
                        onPress={() => setBwExtraLoad(val)}
                      >
                        <Text style={[styles.extraPillText, isSelected && styles.extraPillTextSelected]}>
                          {val === 0 ? 'None' : `+${val}kg`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Essential Athlete Metrics Dock */}
        <View style={styles.metricsDock}>
          <View style={styles.dockCol}>
            <Text style={styles.dockLabel}>SET</Text>
            <Text style={styles.dockVal}>{currentSet} <Text style={styles.dockSub}>/ {currentEx?.totalSets || 4}</Text></Text>
          </View>
          <View style={styles.dockCol}>
            <Text style={styles.dockLabel}>{activeMode === 'duration' ? 'TIME' : 'REPS'}</Text>
            <Text style={[styles.dockVal, { color: KinetixTheme.colors.primary }]}>
              {activeMode === 'duration' ? `${holdSeconds}s` : `${activeMode === 'weight_reps' ? wrReps : bwReps} reps`}
            </Text>
          </View>
          <View style={styles.dockCol}>
            <Text style={styles.dockLabel}>LOAD</Text>
            <View style={styles.dockInlineStepper}>
              <TouchableOpacity onPress={() => setCurrentDockLoad(Math.max(0, currentDockLoad - 2.5))}>
                <Text style={styles.dockStepOp}>-</Text>
              </TouchableOpacity>
              <Text style={styles.dockVal}>{currentDockLoad}<Text style={styles.dockSub}>kg</Text></Text>
              <TouchableOpacity onPress={() => setCurrentDockLoad(currentDockLoad + 2.5)}>
                <Text style={styles.dockStepOp}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.dockCol}>
            <Text style={styles.dockLabel}>REST</Text>
            <Text style={styles.dockVal}>{currentEx?.restSeconds ? `${currentEx.restSeconds}s` : '60s'}</Text>
          </View>
        </View>

        {/* Simplified Discomfort / Pain Check */}
        <View style={styles.painCheckSection}>
          <Text style={styles.painHeading}>Discomfort / Tendon Sensitivity Check</Text>
          <View style={styles.painPillsRow}>
            <TouchableOpacity
              style={[
                styles.painPill,
                painLevel === '0' && styles.painPillGreen,
              ]}
              onPress={() => setPainLevel('0')}
            >
              <Ionicons name="checkmark-circle-outline" size={14} color={painLevel === '0' ? KinetixTheme.colors.secondary : KinetixTheme.colors.textMuted} />
              <Text style={[styles.painPillText, painLevel === '0' && { color: KinetixTheme.colors.secondary, fontWeight: '700' }]}>
                Pain-free (0/10)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.painPill,
                painLevel === '2' && styles.painPillBlue,
              ]}
              onPress={() => setPainLevel('2')}
            >
              <Ionicons name="alert-circle-outline" size={14} color={painLevel === '2' ? KinetixTheme.colors.primary : KinetixTheme.colors.textMuted} />
              <Text style={[styles.painPillText, painLevel === '2' && { color: KinetixTheme.colors.primary, fontWeight: '700' }]}>
                Mild (2/10)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.painPill,
                painLevel === '5' && styles.painPillRed,
              ]}
              onPress={() => setPainLevel('5')}
            >
              <Ionicons name="warning-outline" size={14} color={painLevel === '5' ? KinetixTheme.colors.coral : KinetixTheme.colors.textMuted} />
              <Text style={[styles.painPillText, painLevel === '5' && { color: KinetixTheme.colors.coral, fontWeight: '700' }]}>
                Stop Warning (5/10)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Control Dock */}
        <View style={styles.actionDock}>
          <TouchableOpacity
            style={styles.mainActionBtn}
            onPress={handleCompleteSet}
            activeOpacity={0.88}
          >
            <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
            <Text style={styles.mainActionBtnText}>Complete Set</Text>
          </TouchableOpacity>

          <View style={styles.subActionRow}>
            <TouchableOpacity
              style={styles.subActionBtn}
              onPress={() => setIsPaused(!isPaused)}
              activeOpacity={0.7}
            >
              <Ionicons name={isPaused ? 'play' : 'pause'} size={18} color={KinetixTheme.colors.text} />
              <Text style={styles.subActionBtnText}>{isPaused ? 'Resume' : 'Pause'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.subActionBtn}
              onPress={handleSkipSet}
              activeOpacity={0.7}
            >
              <Ionicons name="play-skip-forward" size={18} color={KinetixTheme.colors.text} />
              <Text style={styles.subActionBtnText}>Skip Set</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Workout Sequence List */}
        <View style={styles.sequenceSection}>
          <View style={styles.sequenceHeader}>
            <View style={styles.sequenceHeaderLeft}>
              <Ionicons name="list" size={18} color={KinetixTheme.colors.primary} />
              <Text style={styles.sequenceHeading}>Workout Sequence</Text>
            </View>
            <Text style={styles.sequenceCounter}>
              {currentExIndex + 1} of {currentExercises.length} In Progress
            </Text>
          </View>

          <View style={styles.sequenceList}>
            {currentExercises.map((ex: any, idx: number) => {
              const isPast = idx < currentExIndex;
              const isCurrent = idx === currentExIndex;

              return (
                <View
                  key={ex.id || idx}
                  style={[
                    styles.seqCard,
                    isCurrent && styles.seqCardCurrent,
                    isPast && styles.seqCardDone,
                  ]}
                >
                  <View style={styles.seqCardLeft}>
                    <View
                      style={[
                        styles.seqIconCircle,
                        isPast && { backgroundColor: KinetixTheme.colors.secondaryLight },
                        isCurrent && { backgroundColor: KinetixTheme.colors.primaryLight },
                      ]}
                    >
                      <Ionicons
                        name={isPast ? 'checkmark' : isCurrent ? 'play' : 'barbell'}
                        size={16}
                        color={isPast ? KinetixTheme.colors.secondary : isCurrent ? KinetixTheme.colors.primary : KinetixTheme.colors.textMuted}
                      />
                    </View>
                    <View style={styles.seqTextCol}>
                      <View style={styles.seqTitleRow}>
                        <Text style={[styles.seqTitle, isCurrent && styles.seqTitleCurrent]}>
                          {ex.name}
                        </Text>
                        <View
                          style={[
                            styles.seqStatusBadge,
                            isPast && { backgroundColor: KinetixTheme.colors.secondaryLight },
                            isCurrent && { backgroundColor: KinetixTheme.colors.primaryLight },
                          ]}
                        >
                          <Text
                            style={[
                              styles.seqStatusBadgeText,
                              isPast && { color: KinetixTheme.colors.secondary },
                              isCurrent && { color: KinetixTheme.colors.primary },
                            ]}
                          >
                            {isPast ? 'Done' : isCurrent ? 'In Progress' : 'Up Next'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.seqSubtitle}>
                        {isCurrent ? `Set ${currentSet} of ${ex.totalSets || 4} · ${ex.reps} · ${ex.load || ex.weight}` : `${ex.totalSets || 4} sets · ${ex.reps} · ${ex.load || ex.weight}`}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.seqSetsSummary}>
                    {isPast ? `${ex.totalSets || 4}/${ex.totalSets || 4}` : isCurrent ? `Set ${currentSet}/${ex.totalSets || 4}` : `${ex.totalSets || 4} sets`}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Video Demonstration Modal */}
      <ExerciseVideoModal
        visible={!!selectedVideoModal}
        exercise={selectedVideoModal}
        onClose={() => setSelectedVideoModal(null)}
      />

      {/* Persistent Bottom Navigation - Visible on active screen */}
      <KinetixBottomNav activeTab="active" />
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
  standbyScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },

  // Standby Mode Styles
  standbyHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    marginBottom: 16,
    ...KinetixTheme.shadows.card,
  },
  standbyHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  standbyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KinetixTheme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: KinetixTheme.borderRadius.full,
  },
  standbyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
    letterSpacing: 0.8,
  },
  standbyHeroStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: KinetixTheme.colors.textMuted,
    letterSpacing: 0.8,
  },
  standbyHeroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.3,
  },
  standbyHeroSubtitle: {
    fontSize: 12,
    color: KinetixTheme.colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  standbySection: {
    marginBottom: 18,
  },
  standbySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  standbyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  standbySectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  standbySectionCount: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  durationPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: KinetixTheme.borderRadius.full,
  },
  durationPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: KinetixTheme.colors.textMuted,
  },
  featuredSessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    ...KinetixTheme.shadows.card,
  },
  featuredTopRow: {
    marginBottom: 12,
  },
  featuredBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  performanceBadge: {
    backgroundColor: KinetixTheme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  performanceBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
    textTransform: 'uppercase',
  },
  rpeText: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  featuredTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  featuredSubtitle: {
    fontSize: 12,
    color: KinetixTheme.colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  standbyExercisePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  standbyExPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  standbyExPillIndex: {
    fontSize: 10,
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
  },
  standbyExPillName: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.textSecondary,
  },
  standbyExPillMore: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    justifyContent: 'center',
  },
  standbyExPillMoreText: {
    fontSize: 10,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  featuredLaunchBtn: {
    backgroundColor: KinetixTheme.colors.primary,
    borderRadius: KinetixTheme.borderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...KinetixTheme.shadows.primaryGlow,
  },
  launchBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  launchBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  standbyCardsList: {
    gap: 10,
  },
  standbyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    ...KinetixTheme.shadows.card,
  },
  standbyCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  standbyCardTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  standbyTypeTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  standbyTypeTagText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  standbyDurationText: {
    fontSize: 11,
    fontWeight: '500',
    color: KinetixTheme.colors.textMuted,
  },
  standbyCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.2,
  },
  standbyCardDesc: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  standbyQuickStartBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...KinetixTheme.shadows.card,
  },

  // In-Progress Top Active Bar Styles
  topActiveBar: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: KinetixTheme.colors.border,
  },
  topActiveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  boltIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: KinetixTheme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionNameContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  sessionNameHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.3,
  },
  sessionSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sessionInProgText: {
    fontSize: 10,
    fontWeight: '800',
    color: KinetixTheme.colors.secondary,
    letterSpacing: 0.8,
  },
  sessionSubDot: {
    fontSize: 10,
    color: KinetixTheme.colors.textMuted,
  },
  sessionCounterText: {
    fontSize: 10,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  topActiveRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarTrack: {
    height: 4,
    width: '100%',
    backgroundColor: '#E2E8F0',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: KinetixTheme.colors.primary,
  },

  // In-Progress Tracking Styles
  exerciseTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  exerciseTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  exerciseStepText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.secondary,
  },
  currentExerciseHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.4,
  },
  infoBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...KinetixTheme.shadows.card,
  },
  counterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    marginBottom: 12,
    ...KinetixTheme.shadows.card,
  },
  modeTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: KinetixTheme.borderRadius.md,
    padding: 3,
    marginBottom: 14,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: KinetixTheme.borderRadius.sm,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    ...KinetixTheme.shadows.card,
  },
  modeTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  modeTabTextActive: {
    color: KinetixTheme.colors.primary,
    fontWeight: '700',
  },
  durationView: {
    alignItems: 'center',
  },
  targetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  targetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: KinetixTheme.colors.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: KinetixTheme.borderRadius.full,
  },
  pulseGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: KinetixTheme.colors.secondary,
  },
  targetText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.secondaryDark,
  },
  targetRight: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  clockCenter: {
    alignItems: 'center',
    paddingVertical: 10,
    width: '100%',
  },
  clockDigits: {
    fontSize: 48,
    fontWeight: '900',
    color: KinetixTheme.colors.text,
    letterSpacing: -1,
  },
  clockSecLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: KinetixTheme.colors.textMuted,
    letterSpacing: 1.5,
  },
  clockSubText: {
    fontSize: 12,
    fontWeight: '500',
    color: KinetixTheme.colors.textSecondary,
    marginTop: 4,
  },
  clockProgressBar: {
    width: 180,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    marginTop: 10,
    overflow: 'hidden',
  },
  clockProgressFill: {
    height: '100%',
    backgroundColor: KinetixTheme.colors.primary,
    borderRadius: 3,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 14,
  },
  stepperBtn: {
    flex: 1,
    height: 38,
    borderRadius: KinetixTheme.borderRadius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnPrimary: {
    backgroundColor: KinetixTheme.colors.primaryLight,
    borderColor: '#BFDBFE',
  },
  stepperBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
  },
  stepperBtnTextPrimary: {
    color: KinetixTheme.colors.primary,
  },
  weightRepsView: {
    width: '100%',
  },
  stepperColsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stepperCol: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: KinetixTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  stepperColLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: KinetixTheme.colors.textMuted,
    letterSpacing: 0.8,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  stepCircleBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTextBtn: {
    fontSize: 10,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  stepperVal: {
    fontSize: 22,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  stepperUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  miniPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  miniPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  miniPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: KinetixTheme.colors.textSecondary,
  },
  bodyweightView: {
    width: '100%',
  },
  bwCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: KinetixTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  bwLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: KinetixTheme.colors.textMuted,
  },
  bwSub: {
    fontSize: 11,
    color: KinetixTheme.colors.textSecondary,
    marginTop: 1,
  },
  bwControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bwBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bwVal: {
    fontSize: 24,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    minWidth: 30,
    textAlign: 'center',
  },
  extraLoadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: KinetixTheme.borderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  extraLoadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  extraLoadTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
  },
  extraLoadSub: {
    fontSize: 10,
    color: KinetixTheme.colors.textMuted,
  },
  extraLoadBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  extraPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  extraPillSelected: {
    backgroundColor: KinetixTheme.colors.primaryLight,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  extraPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: KinetixTheme.colors.textSecondary,
  },
  extraPillTextSelected: {
    color: KinetixTheme.colors.primary,
    fontWeight: '700',
  },
  metricsDock: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dockCol: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.md,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    ...KinetixTheme.shadows.card,
  },
  dockLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: KinetixTheme.colors.textMuted,
    letterSpacing: 0.5,
  },
  dockVal: {
    fontSize: 15,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    marginTop: 2,
  },
  dockSub: {
    fontSize: 11,
    fontWeight: '500',
    color: KinetixTheme.colors.textMuted,
  },
  dockInlineStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dockStepOp: {
    fontSize: 12,
    fontWeight: '800',
    color: KinetixTheme.colors.textMuted,
    paddingHorizontal: 2,
  },
  painCheckSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    marginBottom: 14,
    ...KinetixTheme.shadows.card,
  },
  painHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  painPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  painPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: KinetixTheme.borderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  painPillGreen: {
    backgroundColor: KinetixTheme.colors.secondaryLight,
    borderColor: '#A7F3D0',
  },
  painPillBlue: {
    backgroundColor: KinetixTheme.colors.primaryLight,
    borderColor: '#BFDBFE',
  },
  painPillRed: {
    backgroundColor: KinetixTheme.colors.coralLight,
    borderColor: '#FECDD3',
  },
  painPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: KinetixTheme.colors.textSecondary,
  },
  actionDock: {
    gap: 8,
    marginBottom: 20,
  },
  mainActionBtn: {
    backgroundColor: KinetixTheme.colors.primary,
    borderRadius: KinetixTheme.borderRadius.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...KinetixTheme.shadows.primaryGlow,
  },
  mainActionBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  subActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  subActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: KinetixTheme.borderRadius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    ...KinetixTheme.shadows.card,
  },
  subActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sequenceSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    ...KinetixTheme.shadows.card,
  },
  sequenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sequenceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sequenceHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sequenceCounter: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  sequenceList: {
    gap: 8,
  },
  seqCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: KinetixTheme.borderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  seqCardCurrent: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: KinetixTheme.colors.primary,
  },
  seqCardDone: {
    opacity: 0.85,
  },
  seqCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  seqIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seqTextCol: {
    flex: 1,
  },
  seqTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seqTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
  },
  seqTitleCurrent: {
    color: KinetixTheme.colors.primary,
  },
  seqStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
  },
  seqStatusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: KinetixTheme.colors.textMuted,
  },
  seqSubtitle: {
    fontSize: 10,
    color: KinetixTheme.colors.textMuted,
    marginTop: 2,
  },
  seqSetsSummary: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.textSecondary,
  },
});
