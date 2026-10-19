import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { KinetixTheme } from '../constants/theme';
import ExerciseVideoModal from './ExerciseVideoModal';
import KinetixBottomNav from './KinetixBottomNav';
import KinetixHeader from './KinetixHeader';
import { TrainingContext } from '../context/TrainingContext';
import { DATABASE_WORKSESSIONS } from '../data/databaseLibraryData';
import {
  getExerciseTrackingType,
  getExerciseDescription,
  getExerciseInstructions,
  getExerciseDifficulty,
  getExerciseMechanics,
  getExerciseMuscleGroup,
  getExerciseEquipment,
  getExerciseCategory,
  getExerciseVideoUrl,
  getExerciseVideoThumbnail,
} from '../data/recoveryMetadata';
import { useWorkoutPlayer, PlayerExercise, getExerciseSetDuration } from '../hooks/useWorkoutPlayer';
import GuidedCounterCard from './active-workout/GuidedCounterCard';

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
  target_rest_seconds?: number;
  target_duration_seconds?: number;
  target_reps?: number;
  hold_seconds_per_rep?: number;
  reps_per_set?: number[];
  durations_per_set?: number[];
  trackingType?: 'duration' | 'weight_reps' | 'bodyweight';
  tracking_type?: string;
  video_url?: string | null;
  video_thumbnail_url?: string | null;
  equipment?: string;
  muscle_group?: string;
  description?: string | null;
  instructions?: string | null;
  notes?: string | null;
  category?: string | null;
  difficulty?: string | null;
  mechanics?: string | null;
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

export interface WorkoutFinishSummary {
  durationMins: number;
  durationSecs: number;
  startTime: number;
  endTime: number;
  startTimeFormatted: string;
  endTimeFormatted: string;
  durationFormatted: string;
  worksessionName: string;
  exercisesCompleted: number;
  totalSets: number;
  sessionType?: 'rehab' | 'workout';
  isRehab?: boolean;
  category?: string;
}

interface KinetixActiveWorkoutProps {
  worksession?: any;
  plan?: any;
  onFinish?: (durationMins?: number, summary?: WorkoutFinishSummary) => void;
}

const STANDBY_SESSIONS: WorksessionData[] = DATABASE_WORKSESSIONS.map((ws) => ({
  id: ws.id,
  name: ws.title,
  category: ws.type === 'rehab' ? 'Rehab Track' : 'Performance Track',
  focus: ws.description || ws.category || 'Targeted Protocol',
  duration: parseInt(ws.metrics.duration) || 30,
  rpe: ws.type === 'rehab' ? '5.0' : '8.0',
  exercises: ws.exercises.map((e) => {
    const inferred = getExerciseTrackingType(e);
    const resolvedTrackingType: 'duration' | 'weight_reps' | 'bodyweight' =
      inferred === 'time' ? 'duration' : inferred === 'weight_reps' ? 'weight_reps' : 'bodyweight';
    return {
      name: e.name,
      cue: e.cue || 'Controlled form.',
      notes: e.cue || '',
      totalSets: e.sets || 3,
      reps: String(e.reps),
      load: e.weight || 'Standard',
      restSeconds: typeof e.restSeconds === 'number' ? e.restSeconds : (typeof (e as any).target_rest_seconds === 'number' ? (e as any).target_rest_seconds : 60),
      target_rest_seconds: typeof (e as any).target_rest_seconds === 'number' ? (e as any).target_rest_seconds : (typeof e.restSeconds === 'number' ? e.restSeconds : 60),
      target_duration_seconds: (e as any).target_duration_seconds,
      target_reps: (e as any).target_reps,
      hold_seconds_per_rep: (e as any).hold_seconds_per_rep,
      reps_per_set: (e as any).reps_per_set,
      durations_per_set: (e as any).durations_per_set,
      trackingType: resolvedTrackingType,
      tracking_type: e.tracking_type || inferred,
      video_url: (e as any).video_url || getExerciseVideoUrl(e) || null,
      video_thumbnail_url: (e as any).video_thumbnail_url || getExerciseVideoThumbnail(e) || null,
      equipment: e.equipment || getExerciseEquipment(e),
      muscle_group: e.muscle_group || getExerciseMuscleGroup(e),
      description: (e as any).description || getExerciseDescription(e) || null,
      instructions: (e as any).instructions || getExerciseInstructions(e) || null,
      difficulty: (e as any).difficulty || getExerciseDifficulty(e) || null,
      mechanics: (e as any).mechanics || getExerciseMechanics(e) || null,
      category: (e as any).category || getExerciseCategory(e) || null,
    };
  }),
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

  useKeepAwake();

  // Dual-Mode Training State (Manual mode by default)
  const [isGuidedMode, setIsGuidedMode] = useState<boolean>(false);

  // Active workout states
  const [currentSessionName, setCurrentSessionName] = useState<string>(
    activeSessionMetadata?.worksessionName || worksession?.name || 'Strength & Power (Lower Body)'
  );

  const initialExercises: ExerciseData[] = worksession?.exercises && worksession.exercises.length > 0
    ? worksession.exercises.map((e: any, idx: number) => {
        const inferred = getExerciseTrackingType(e);
        const rawType = e.tracking_type || inferred;
        const isDuration = rawType === 'time' || rawType === 'duration' || inferred === 'time';
        const isWeightReps = rawType === 'weight_reps';
        const resolvedTrackingType: 'duration' | 'weight_reps' | 'bodyweight' =
          e.trackingType || (isDuration ? 'duration' : isWeightReps ? 'weight_reps' : 'bodyweight');
        const restSec =
          typeof e.restSeconds === 'number'
            ? e.restSeconds
            : typeof e.target_rest_seconds === 'number'
            ? e.target_rest_seconds
            : 60;
        return {
          id: `ex-${idx}`,
          name: e.name || 'Exercise',
          cue: e.cue || '',
          notes: e.notes || e.cue || '',
          totalSets: e.totalSets || e.sets || 3,
          reps: typeof e.reps === 'number' ? (isDuration ? `${e.reps}s` : `${e.reps} reps`) : (e.reps || (isDuration ? '45s' : '10 reps')),
          load: e.load || e.weight || 'Bodyweight',
          restSeconds: restSec,
          target_rest_seconds: restSec,
          target_duration_seconds: e.target_duration_seconds || (isDuration ? (typeof e.reps === 'number' ? e.reps : 45) : undefined),
          target_reps: e.target_reps,
          hold_seconds_per_rep: e.hold_seconds_per_rep,
          reps_per_set: e.reps_per_set,
          durations_per_set: e.durations_per_set,
          trackingType: resolvedTrackingType,
          tracking_type: rawType,
          video_url: e.video_url || getExerciseVideoUrl(e) || null,
          video_thumbnail_url: e.video_thumbnail_url || getExerciseVideoThumbnail(e) || null,
          equipment: e.equipment || getExerciseEquipment(e),
          muscle_group: e.muscle_group || getExerciseMuscleGroup(e),
          description: e.description || getExerciseDescription(e) || null,
          instructions: e.instructions || getExerciseInstructions(e) || null,
          difficulty: e.difficulty || getExerciseDifficulty(e) || null,
          mechanics: e.mechanics || getExerciseMechanics(e) || null,
          category: e.category || getExerciseCategory(e) || null,
        };
      })
    : worksession?.worksession_exercises && worksession.worksession_exercises.length > 0
    ? worksession.worksession_exercises.map((we: any, idx: number) => {
        const ex = we.exercises || {};
        const inferred = getExerciseTrackingType(ex);
        const rawType = we.tracking_type || inferred;
        const isHold = rawType === 'time' || rawType === 'duration' || (we.target_time && we.target_time > 0) || inferred === 'time';
        const isWeightReps = rawType === 'weight_reps';
        const resolvedTrackingType: 'duration' | 'weight_reps' | 'bodyweight' =
          isHold ? 'duration' : isWeightReps ? 'weight_reps' : 'bodyweight';

        let parsedLoad = 'Bodyweight';
        if (we.notes && we.notes.toLowerCase().includes('load:')) {
          const match = we.notes.match(/load:\s*([0-9.]+\s*kg|[0-9.]+)/i);
          parsedLoad = match ? (match[1].includes('kg') ? match[1] : `${match[1]}kg`) : 'Standard';
        } else if (we.load || we.weight) {
          parsedLoad = we.load || we.weight;
        } else if (resolvedTrackingType === 'weight_reps') {
          parsedLoad = '60kg';
        }

        const restSec =
          typeof we.target_rest_seconds === 'number'
            ? we.target_rest_seconds
            : typeof we.restSeconds === 'number'
            ? we.restSeconds
            : typeof ex.default_rest_seconds === 'number'
            ? ex.default_rest_seconds
            : 60;

        return {
          id: `ex-${idx}`,
          name: ex.name || 'Exercise',
          cue: we.notes || ex.instructions || 'Maintain controlled posture.',
          notes: we.notes || ex.instructions || '',
          totalSets: we.target_sets || 3,
          reps: isHold
            ? (we.target_time ? `${we.target_time}s` : '45s')
            : (we.target_reps ? `${we.target_reps} reps` : '10 reps'),
          load: parsedLoad,
          restSeconds: restSec,
          target_rest_seconds: restSec,
          target_duration_seconds: we.target_duration_seconds || (isHold ? (we.target_time || 45) : undefined),
          target_reps: we.target_reps,
          hold_seconds_per_rep: we.hold_seconds_per_rep,
          reps_per_set: we.reps_per_set,
          durations_per_set: we.durations_per_set,
          trackingType: resolvedTrackingType,
          tracking_type: we.tracking_type || inferred,
          video_url: ex.video_url || getExerciseVideoUrl(ex) || null,
          video_thumbnail_url: ex.video_thumbnail_url || getExerciseVideoThumbnail(ex) || null,
          equipment: ex.equipment || getExerciseEquipment(ex),
          muscle_group: ex.muscle_group || getExerciseMuscleGroup(ex),
          description: we.description || ex.description || getExerciseDescription(ex) || null,
          instructions: ex.instructions || we.instructions || getExerciseInstructions(ex) || null,
          difficulty: ex.difficulty || we.difficulty || getExerciseDifficulty(ex) || null,
          mechanics: ex.mechanics || we.mechanics || getExerciseMechanics(ex) || null,
          category: ex.category || we.category || getExerciseCategory(ex) || null,
        };
      })
    : activeSessionMetadata?.exercises && activeSessionMetadata.exercises.length > 0
    ? activeSessionMetadata.exercises
    : STANDBY_SESSIONS[0].exercises;

  const [currentExercises, setCurrentExercises] = useState<ExerciseData[]>(initialExercises);

  // Target customization state
  const [isTargetModalVisible, setIsTargetModalVisible] = useState<boolean>(false);
  const [editTargetSets, setEditTargetSets] = useState<number>(3);
  const [editTargetReps, setEditTargetReps] = useState<number>(10);
  const [editTargetLoad, setEditTargetLoad] = useState<number>(60);
  const [editTargetTime, setEditTargetTime] = useState<number>(45);
  const [editTargetBwExtra, setEditTargetBwExtra] = useState<number>(0);

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

  const resolveTargetMode = (ex: any): 'duration' | 'weight_reps' | 'bodyweight' => {
    if (!ex) return 'duration';
    if (ex.trackingType === 'duration' || ex.trackingType === 'weight_reps' || ex.trackingType === 'bodyweight') {
      return ex.trackingType;
    }
    const raw = ex.tracking_type || getExerciseTrackingType(ex);
    if (raw === 'time' || raw === 'duration') return 'duration';
    if (raw === 'weight_reps') return 'weight_reps';
    const inferred = getExerciseTrackingType(ex);
    if (inferred === 'time') return 'duration';
    if (inferred === 'weight_reps') return 'weight_reps';
    return 'bodyweight';
  };

  const [activeMode, setActiveMode] = useState<'duration' | 'weight_reps' | 'bodyweight'>(() => resolveTargetMode(currentEx));

  // Modality States
  const [holdSeconds, setHoldSeconds] = useState(45);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [wrReps, setWrReps] = useState(8);
  const [wrWeight, setWrWeight] = useState(80);

  const [bwReps, setBwReps] = useState(12);
  const [bwExtraLoad, setBwExtraLoad] = useState<number>(0);

  const [currentDockLoad, setCurrentDockLoad] = useState(40);
  const [selectedVideoModal, setSelectedVideoModal] = useState<any>(null);

  // Live Workout Duration Stopwatch & Start Timestamp states
  const [workoutStartTime, setWorkoutStartTime] = useState<number>(() => {
    if (activeSessionMetadata?.startTime && typeof activeSessionMetadata.startTime === 'number') {
      return activeSessionMetadata.startTime;
    }
    return Date.now();
  });

  const [elapsedWorkoutSeconds, setElapsedWorkoutSeconds] = useState<number>(() => {
    const start = activeSessionMetadata?.startTime && typeof activeSessionMetadata.startTime === 'number'
      ? activeSessionMetadata.startTime
      : Date.now();
    return Math.max(0, Math.floor((Date.now() - start) / 1000));
  });

  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [completionSummary, setCompletionSummary] = useState<WorkoutFinishSummary | null>(null);

  // Non-blocking Toast HUD and Rest Timer States
  const [toastMessage, setToastMessage] = useState<{
    type: 'set_completed' | 'exercise_completed';
    title: string;
    subtitle: string;
    badgeText?: string;
  } | null>(null);

  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(-15)).current;
  const toastTimeoutRef = useRef<any>(null);

  const [isResting, setIsResting] = useState<boolean>(false);
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(0);
  const [totalRestTarget, setTotalRestTarget] = useState<number>(60);

  const triggerToast = (toast: {
    type: 'set_completed' | 'exercise_completed';
    title: string;
    subtitle: string;
    badgeText?: string;
  }) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(toast);
    toastOpacity.setValue(0);
    toastTranslateY.setValue(-15);

    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(toastTranslateY, {
        toValue: 0,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    toastTimeoutRef.current = setTimeout(() => {
      dismissToast();
    }, 3200);
  };

  const dismissToast = () => {
    Animated.timing(toastOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setToastMessage(null);
    });
  };

  const handleSkipRest = () => {
    setIsResting(false);
    setRestSecondsLeft(0);
  };

  const handleAddRestTime = (seconds: number) => {
    setRestSecondsLeft((prev) => Math.max(0, prev + seconds));
    setTotalRestTarget((prev) => Math.max(prev, restSecondsLeft + seconds));
  };



  // Formatting helpers for workout duration and timestamps
  const formatWorkoutDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimeOfDay = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const formatDateStamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Live stopwatch timer for overall workout session duration
  useEffect(() => {
    if (!hasActiveSession || isPaused) return;
    const interval = setInterval(() => {
      const start = workoutStartTime || Date.now();
      setElapsedWorkoutSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [hasActiveSession, isPaused, workoutStartTime]);

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
        startTime: workoutStartTime,
        exercises: currentExercises,
      });
    }
  }, [hasActiveSession, currentSessionName, currentExIndex, currentSet, currentDockLoad, currentEx?.name, workoutStartTime]);



  // Auto-adapt tracking metrics whenever current exercise changes
  useEffect(() => {
    if (currentEx) {
      const targetMode = resolveTargetMode(currentEx);
      setActiveMode(targetMode);

      if (targetMode === 'duration') {
        const parsedSecs =
          typeof currentEx.target_duration_seconds === 'number'
            ? currentEx.target_duration_seconds
            : parseInt(String(currentEx.reps).replace(/[^0-9]/g, '')) || 45;
        setHoldSeconds(parsedSecs);
        setTimerRunning(false);
        setIsPaused(false);
      } else if (targetMode === 'bodyweight') {
        const parsedReps =
          typeof currentEx.target_reps === 'number'
            ? currentEx.target_reps
            : parseInt(String(currentEx.reps).replace(/[^0-9]/g, '')) || 10;
        setBwReps(parsedReps);
        const parsedExtra = parseInt(String(currentEx.load || currentEx.weight).replace(/[^0-9]/g, '')) || 0;
        setBwExtraLoad(parsedExtra);
      } else {
        const parsedReps =
          typeof currentEx.target_reps === 'number'
            ? currentEx.target_reps
            : parseInt(String(currentEx.reps).replace(/[^0-9]/g, '')) || 8;
        setWrReps(parsedReps);
        const parsedWeight = parseInt(String(currentEx.load || currentEx.weight).replace(/[^0-9]/g, '')) || 60;
        if (parsedWeight > 0) {
          setWrWeight(parsedWeight);
          setCurrentDockLoad(parsedWeight);
        }
      }
    }
  }, [currentExIndex, currentEx?.name, currentEx?.trackingType, currentEx?.tracking_type]);

  // Launch a session from Standby Mode
  const handleLaunchSession = (sessionData: WorksessionData) => {
    const now = Date.now();
    setWorkoutStartTime(now);
    setElapsedWorkoutSeconds(0);
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
        startTime: now,
        exercises: sessionData.exercises,
      });
    }
  };

  const handleAdjustHold = (delta: number) => {
    setHoldSeconds((prev) => Math.max(5, prev + delta));
  };

  const handleOpenTargetModal = () => {
    setEditTargetSets(currentEx?.totalSets || 3);
    const parsedReps = parseInt(String(currentEx?.reps).replace(/[^0-9]/g, '')) || (activeMode === 'duration' ? 45 : 10);
    const parsedLoad = parseInt(String(currentEx?.load).replace(/[^0-9]/g, '')) || (activeMode === 'weight_reps' ? 60 : 0);

    if (activeMode === 'duration') {
      setEditTargetTime(parsedReps || 45);
    } else if (activeMode === 'weight_reps') {
      setEditTargetReps(parsedReps || 8);
      setEditTargetLoad(parsedLoad || 60);
    } else {
      setEditTargetReps(parsedReps || 12);
      setEditTargetBwExtra(bwExtraLoad || (parsedLoad > 0 ? parsedLoad : 0));
    }
    setIsTargetModalVisible(true);
  };

  const handleSaveTarget = () => {
    const updated = [...currentExercises];
    const ex = { ...updated[currentExIndex] };
    ex.totalSets = editTargetSets;

    if (activeMode === 'duration') {
      ex.reps = `${editTargetTime}s`;
      setHoldSeconds(editTargetTime);
    } else if (activeMode === 'weight_reps') {
      ex.reps = `${editTargetReps} reps`;
      ex.load = `${editTargetLoad}kg`;
      setWrReps(editTargetReps);
      setWrWeight(editTargetLoad);
      setCurrentDockLoad(editTargetLoad);
    } else if (activeMode === 'bodyweight') {
      ex.reps = `${editTargetReps} reps`;
      ex.load = editTargetBwExtra > 0 ? `BW +${editTargetBwExtra}kg` : 'Bodyweight';
      setBwReps(editTargetReps);
      setBwExtraLoad(editTargetBwExtra);
      if (editTargetBwExtra > 0) {
        setCurrentDockLoad(editTargetBwExtra);
      }
    }

    updated[currentExIndex] = ex;
    setCurrentExercises(updated);

    if (currentSet > editTargetSets) {
      setCurrentSet(editTargetSets);
    }

    if (setActiveSessionMetadata) {
      setActiveSessionMetadata((prev: any) => ({
        ...prev,
        totalSets: editTargetSets,
        currentLoad: activeMode === 'weight_reps' ? editTargetLoad : editTargetBwExtra,
        exercises: updated,
      }));
    }

    setIsTargetModalVisible(false);
  };

  const triggerFinish = () => {
    const now = Date.now();
    const durationSecs = Math.max(1, Math.floor((now - workoutStartTime) / 1000));
    const durationMins = Math.max(1, Math.round(durationSecs / 60));

    const isRehab = Boolean(
      worksession?.type === 'rehab' ||
      worksession?.isRehab === true ||
      plan?.type === 'rehab' ||
      currentSessionName.toLowerCase().includes('rehab') ||
      currentSessionName.toLowerCase().includes('protocol') ||
      currentSessionName.toLowerCase().includes('mcgill') ||
      currentSessionName.toLowerCase().includes('relief') ||
      currentSessionName.toLowerCase().includes('recovery') ||
      currentSessionName.toLowerCase().includes('mobility') ||
      currentSessionName.toLowerCase().includes('tendon') ||
      currentSessionName.toLowerCase().includes('achilles') ||
      currentSessionName.toLowerCase().includes('knee') ||
      currentSessionName.toLowerCase().includes('shoulder') ||
      currentSessionName.toLowerCase().includes('back')
    );

    const summary: WorkoutFinishSummary = {
      durationMins,
      durationSecs,
      startTime: workoutStartTime,
      endTime: now,
      startTimeFormatted: formatTimeOfDay(workoutStartTime),
      endTimeFormatted: formatTimeOfDay(now),
      durationFormatted: formatWorkoutDuration(durationSecs),
      worksessionName: currentSessionName,
      sessionType: isRehab ? 'rehab' : 'workout',
      isRehab,
      category: worksession?.focus || (isRehab ? 'Clinical Rehab' : 'Strength & Power'),
      exercisesCompleted: Math.min(currentExercises.length, currentExIndex + 1),
      totalSets: currentExercises.slice(0, currentExIndex + 1).reduce((sum, e) => sum + (e.totalSets || 3), 0),
    };
    setCompletionSummary(summary);
    setShowCompletionModal(true);
  };

  const handleConfirmFinish = () => {
    if (setActiveSessionMetadata) setActiveSessionMetadata(null);
    setShowCompletionModal(false);
    if (onFinish && completionSummary) {
      onFinish(completionSummary.durationMins, completionSummary);
    } else {
      router.replace('/history');
    }
  };

  // Guided Training State Machine Hook
  const player = useWorkoutPlayer({
    exercises: currentExercises as PlayerExercise[],
    leadInDurationSeconds: 5,
    initialExerciseIndex: currentExIndex,
    initialSetIndex: Math.max(0, currentSet - 1),
    onSetCompleted: (log) => {
      const completedSetNum = log.setNumber;
      const totalSetsForEx = currentEx?.totalSets || 4;
      const exRest =
        typeof currentEx?.restSeconds === 'number'
          ? currentEx.restSeconds
          : typeof (currentEx as any)?.target_rest_seconds === 'number'
          ? (currentEx as any).target_rest_seconds
          : 60;

      triggerToast({
        type: 'set_completed',
        title: `Set ${completedSetNum} Logged! ✓`,
        subtitle: `Next: Set ${Math.min(totalSetsForEx, completedSetNum + 1)} of ${totalSetsForEx}${exRest > 0 ? ` · ${exRest}s Rest` : ' · Continuous'}`,
        badgeText: `SET ${completedSetNum}/${totalSetsForEx}`,
      });
    },
    onWorkoutCompleted: () => {
      triggerFinish();
    },
  });

  // Bi-directional synchronization: Guided Player -> Active Workout Screen
  useEffect(() => {
    if (isGuidedMode) {
      if (player.currentExerciseIndex !== currentExIndex) {
        setCurrentExIndex(player.currentExerciseIndex);
      }
      if (player.currentSet !== currentSet) {
        setCurrentSet(player.currentSet);
      }
    }
  }, [isGuidedMode, player.currentExerciseIndex, player.currentSet]);

  // Active Rest countdown interval for manual workout mode
  useEffect(() => {
    let interval: any = null;
    if (isResting && restSecondsLeft > 0 && !isPaused) {
      interval = setInterval(() => {
        setRestSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            player.triggerHaptic('heavy');
            player.playSound('chime');
            triggerToast({
              type: 'set_completed',
              title: 'Rest Finished! ⚡',
              subtitle: `Ready for Set ${currentSet} of ${currentEx?.name || 'Exercise'}`,
              badgeText: 'TIME TO LIFT',
            });
            return 0;
          }
          if (prev <= 4 && prev > 1) {
            player.triggerHaptic('light');
            player.playSound('pip');
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isResting, restSecondsLeft, isPaused, currentSet, currentEx?.name, player]);

  // Manual mode isometric hold countdown timer interval with auditory and tactile cues
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && !isPaused && holdSeconds > 0) {
      interval = setInterval(() => {
        setHoldSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            player.triggerHaptic('success');
            player.playSound('chime');
            return 0;
          }
          if (prev <= 4 && prev > 1) {
            player.triggerHaptic('light');
            player.playSound('pip');
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, isPaused, holdSeconds, player]);

  const handleToggleMode = (enableGuided: boolean) => {
    if (enableGuided) {
      player.syncPosition(currentExIndex, Math.max(0, currentSet - 1));
      setIsGuidedMode(true);
    } else {
      if (player.isActive) {
        player.pause();
      }
      setIsGuidedMode(false);
    }
  };

  const handleCompleteSet = () => {
    const totalSetsForEx = currentEx?.totalSets || 4;
    const restDuration =
      typeof currentEx?.restSeconds === 'number'
        ? currentEx.restSeconds
        : typeof (currentEx as any)?.target_rest_seconds === 'number'
        ? (currentEx as any).target_rest_seconds
        : 60;

    // Audible and tactile feedback on set completion
    player.triggerHaptic('success');
    player.playSound('chime');

    if (currentSet < totalSetsForEx) {
      const completedSetNum = currentSet;
      const nextSetNum = currentSet + 1;
      setCurrentSet(nextSetNum);
      const parsedHold = getExerciseSetDuration(currentEx as any, nextSetNum - 1);
      setHoldSeconds(parsedHold);
      setTimerRunning(false);

      // Start automatic rest timer if restDuration > 0
      if (restDuration > 0) {
        setTotalRestTarget(restDuration);
        setRestSecondsLeft(restDuration);
        setIsResting(true);
      } else {
        setIsResting(false);
        setRestSecondsLeft(0);
      }

      // Non-blocking animated HUD toast
      triggerToast({
        type: 'set_completed',
        title: `Set ${completedSetNum} Logged! ✓`,
        subtitle: `Next: Set ${nextSetNum} of ${totalSetsForEx}${restDuration > 0 ? ` · ${restDuration}s Rest` : ' · Continuous'}`,
        badgeText: `SET ${completedSetNum}/${totalSetsForEx}`,
      });
    } else {
      if (currentExIndex < currentExercises.length - 1) {
        const finishedName = currentEx.name;
        const nextEx = currentExercises[currentExIndex + 1];
        const nextRest =
          typeof nextEx?.restSeconds === 'number'
            ? nextEx.restSeconds
            : typeof (nextEx as any)?.target_rest_seconds === 'number'
            ? (nextEx as any).target_rest_seconds
            : 60;

        setCurrentExIndex((prev) => prev + 1);
        setCurrentSet(1);
        const parsedHold = getExerciseSetDuration(nextEx as any, 0);
        setHoldSeconds(parsedHold);
        setTimerRunning(false);

        // Start rest before next exercise if nextRest > 0
        if (nextRest > 0) {
          setTotalRestTarget(nextRest);
          setRestSecondsLeft(nextRest);
          setIsResting(true);
        } else {
          setIsResting(false);
          setRestSecondsLeft(0);
        }

        // Celebratory non-blocking exercise completed toast
        triggerToast({
          type: 'exercise_completed',
          title: `${finishedName} Completed! 🎉`,
          subtitle: `Next up: ${nextEx.name} · ${nextEx.totalSets || 4} sets target${nextRest > 0 ? ` · ${nextRest}s Rest` : ''}`,
          badgeText: `EXERCISE ${currentExIndex + 1}/${currentExercises.length} DONE`,
        });
      } else {
        triggerFinish();
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
          text: 'Finish Workout Now',
          onPress: triggerFinish,
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
      const skippedSet = currentSet;
      setCurrentSet((prev) => prev + 1);
      triggerToast({
        type: 'set_completed',
        title: `Set ${skippedSet} Skipped ⏭️`,
        subtitle: `Now on Set ${skippedSet + 1} of ${totalSetsForEx}`,
        badgeText: 'SKIPPED',
      });
    } else if (currentExIndex < currentExercises.length - 1) {
      const skippedName = currentEx.name;
      const nextEx = currentExercises[currentExIndex + 1];
      setCurrentExIndex((prev) => prev + 1);
      setCurrentSet(1);
      triggerToast({
        type: 'exercise_completed',
        title: `${skippedName} Skipped ⏭️`,
        subtitle: `Now starting: ${nextEx.name}`,
        badgeText: 'SKIPPED',
      });
    }
  };

  const handleSelectExercise = (index: number) => {
    if (index < 0 || index >= currentExercises.length || index === currentExIndex) return;
    setCurrentExIndex(index);
    setCurrentSet(1);
    setIsResting(false);
    setRestSecondsLeft(0);
    if (isGuidedMode) {
      player.syncPosition(index, 0);
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
          {/* Live Workout Duration Stopwatch Pill - The one timer on top */}
          <View style={styles.workoutDurationBadge}>
            <Ionicons name="time-outline" size={13} color={KinetixTheme.colors.primary} />
            <Text style={styles.workoutDurationText}>{formatWorkoutDuration(elapsedWorkoutSeconds)}</Text>
          </View>

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

      {/* Non-blocking Animated Feedback Toast HUD */}
      {toastMessage && (
        <Animated.View
          style={[
            styles.toastWrapper,
            {
              opacity: toastOpacity,
              transform: [{ translateY: toastTranslateY }],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.toastCard,
              toastMessage.type === 'exercise_completed' && styles.toastCardCelebration,
            ]}
            onPress={dismissToast}
            activeOpacity={0.9}
          >
            <View
              style={[
                styles.toastIconBox,
                toastMessage.type === 'exercise_completed' && styles.toastIconBoxCelebration,
              ]}
            >
              <Ionicons
                name={toastMessage.type === 'exercise_completed' ? 'trophy' : 'checkmark-circle'}
                size={20}
                color={toastMessage.type === 'exercise_completed' ? '#D97706' : '#059669'}
              />
            </View>

            <View style={styles.toastTextCol}>
              <View style={styles.toastHeaderRow}>
                <Text style={styles.toastTitle}>{toastMessage.title}</Text>
                {toastMessage.badgeText && (
                  <View
                    style={[
                      styles.toastBadge,
                      toastMessage.type === 'exercise_completed' && styles.toastBadgeCelebration,
                    ]}
                  >
                    <Text
                      style={[
                        styles.toastBadgeText,
                        toastMessage.type === 'exercise_completed' && styles.toastBadgeTextCelebration,
                      ]}
                    >
                      {toastMessage.badgeText}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.toastSubtitle} numberOfLines={1}>
                {toastMessage.subtitle}
              </Text>
            </View>

            <TouchableOpacity onPress={dismissToast} style={styles.toastCloseBtn}>
              <Ionicons name="close" size={16} color={KinetixTheme.colors.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Live Rest Timer Strip */}
        {isResting && restSecondsLeft > 0 && (
          <View style={styles.restTimerBanner}>
            <View style={styles.restTimerLeft}>
              <View style={styles.pulseRestDot} />
              <View style={{ flex: 1 }}>
                <View style={styles.restTimerTitleRow}>
                  <Text style={styles.restTimerHeading}>REST TIMER</Text>
                  <Text style={styles.restTimerClock}>{formatTimer(restSecondsLeft)}</Text>
                </View>
                <View style={styles.restProgressBarTrack}>
                  <View
                    style={[
                      styles.restProgressBarFill,
                      { width: `${Math.min(100, Math.max(0, (restSecondsLeft / (totalRestTarget || 60)) * 100))}%` },
                    ]}
                  />
                </View>
              </View>
            </View>

            <View style={styles.restTimerActions}>
              <TouchableOpacity
                style={styles.restAddBtn}
                onPress={() => handleAddRestTime(30)}
                activeOpacity={0.7}
              >
                <Text style={styles.restAddBtnText}>+30s</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.restSkipBtn}
                onPress={handleSkipRest}
                activeOpacity={0.7}
              >
                <Text style={styles.restSkipBtnText}>Skip</Text>
                <Ionicons name="play-forward" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

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
              <TouchableOpacity
                onPress={() => {
                  const modes: ('duration' | 'weight_reps' | 'bodyweight')[] = ['duration', 'weight_reps', 'bodyweight'];
                  const nextIdx = (modes.indexOf(activeMode) + 1) % modes.length;
                  setActiveMode(modes[nextIdx]);
                }}
                activeOpacity={0.7}
                style={[
                  styles.metricIndicatorBadge,
                  activeMode === 'duration' && { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
                  activeMode === 'weight_reps' && { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
                  activeMode === 'bodyweight' && { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' },
                ]}
              >
                <Ionicons
                  name={activeMode === 'duration' ? 'timer-outline' : activeMode === 'weight_reps' ? 'barbell-outline' : 'body-outline'}
                  size={12}
                  color={activeMode === 'duration' ? '#059669' : activeMode === 'weight_reps' ? '#2563EB' : '#475569'}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.metricIndicatorText,
                    activeMode === 'duration' && { color: '#059669' },
                    activeMode === 'weight_reps' && { color: '#2563EB' },
                    activeMode === 'bodyweight' && { color: '#475569' },
                  ]}
                >
                  {activeMode === 'duration' ? 'TIME HOLD' : activeMode === 'weight_reps' ? 'WEIGHT & REPS' : 'BODYWEIGHT REPS'}
                </Text>
                <Ionicons
                  name="swap-horizontal"
                  size={11}
                  color={activeMode === 'duration' ? '#059669' : activeMode === 'weight_reps' ? '#2563EB' : '#475569'}
                  style={{ marginLeft: 3, opacity: 0.7 }}
                />
              </TouchableOpacity>
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

        {/* Mode Switcher Pill: Manual Log vs Guided Trainer */}
        <View style={styles.modeToggleRow}>
          <View style={styles.modeSegmentedContainer}>
            <TouchableOpacity
              style={[styles.modeTab, !isGuidedMode && styles.modeTabActive]}
              onPress={() => handleToggleMode(false)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="create-outline"
                size={14}
                color={!isGuidedMode ? '#FFFFFF' : KinetixTheme.colors.textSecondary}
              />
              <Text style={[styles.modeTabText, !isGuidedMode && styles.modeTabTextActive]}>
                Manual Log
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, isGuidedMode && styles.modeTabActiveGuided]}
              onPress={() => handleToggleMode(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="play"
                size={13}
                color={isGuidedMode ? '#FFFFFF' : KinetixTheme.colors.primary}
              />
              <Text style={[styles.modeTabText, isGuidedMode && styles.modeTabTextActive]}>
                Guided Trainer
              </Text>
              <View style={styles.guidedLiveBadge}>
                <Text style={styles.guidedLiveBadgeText}>AUTO</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Training Counter: Guided vs Adaptive Manual Counter */}
        {isGuidedMode ? (
          <GuidedCounterCard
            state={player.state}
            isPaused={player.isPaused}
            currentExercise={player.currentExercise}
            currentSet={player.currentSet}
            totalSets={player.totalSets}
            currentExerciseIndex={player.currentExerciseIndex}
            totalExercises={player.totalExercises}
            trackingType={player.trackingType}
            secondsRemaining={player.secondsRemaining}
            progress={player.progress}
            targetReps={player.targetReps}
            targetWeight={player.targetWeight}
            targetDurationSeconds={player.targetDurationSeconds}
            targetRestSeconds={player.targetRestSeconds}
            actualReps={player.actualReps}
            setActualReps={player.setActualReps}
            actualWeight={player.actualWeight}
            setActualWeight={player.setActualWeight}
            isAudioMuted={player.isAudioMuted}
            setIsAudioMuted={player.setIsAudioMuted}
            startGuidedSet={player.startGuidedSet}
            pause={player.pause}
            resume={player.resume}
            skipLeadIn={player.skipLeadIn}
            completeWorkSet={player.completeWorkSet}
            skipRest={player.skipRest}
            addRestSeconds={player.addRestSeconds}
            onOpenTargetModal={handleOpenTargetModal}
          />
        ) : (
          <View style={styles.counterCard}>
          {/* View 1: Duration / Isometric View */}
          {activeMode === 'duration' && (
            <View style={styles.durationView}>
              <TouchableOpacity
                style={styles.targetBanner}
                onPress={handleOpenTargetModal}
                activeOpacity={0.7}
              >
                <View style={styles.targetLeft}>
                  <View style={styles.pulseGreenDot} />
                  <Text style={styles.targetText}>Target: {currentEx?.reps || '45s'} Hold</Text>
                  <View style={styles.targetAdjustPill}>
                    <Ionicons name="pencil" size={10} color={KinetixTheme.colors.secondaryDark} />
                    <Text style={styles.targetAdjustPillText}>Adjust</Text>
                  </View>
                </View>
                <Text style={styles.targetRight}>
                  Set {currentSet} of {currentEx?.totalSets || 4}
                </Text>
              </TouchableOpacity>

              {/* Digital Hold Clock */}
              <TouchableOpacity
                style={styles.clockCenter}
                onPress={() => setTimerRunning(!timerRunning)}
                activeOpacity={0.8}
              >
                <Text style={styles.clockDigits} numberOfLines={1}>{formatTimer(holdSeconds)}</Text>
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
              <TouchableOpacity
                style={styles.targetBanner}
                onPress={handleOpenTargetModal}
                activeOpacity={0.7}
              >
                <View style={[styles.targetLeft, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="barbell-outline" size={13} color="#2563EB" />
                  <Text style={[styles.targetText, { color: '#1D4ED8' }]}>
                    Target: {currentEx?.reps || '8 reps'} · {currentEx?.load || '80kg'}
                  </Text>
                  <View style={[styles.targetAdjustPill, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="pencil" size={10} color="#2563EB" />
                    <Text style={[styles.targetAdjustPillText, { color: '#2563EB' }]}>Adjust</Text>
                  </View>
                </View>
                <Text style={styles.targetRight}>
                  Set {currentSet} of {currentEx?.totalSets || 4}
                </Text>
              </TouchableOpacity>

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
                    <TouchableOpacity
                      style={styles.stepCircleBtn}
                      onPress={() => {
                        const next = Math.max(0, wrWeight - 2.5);
                        setWrWeight(next);
                        setCurrentDockLoad(next);
                      }}
                    >
                      <Text style={styles.stepTextBtn}>-2.5</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperVal}>{wrWeight}<Text style={styles.stepperUnit}>kg</Text></Text>
                    <TouchableOpacity
                      style={styles.stepCircleBtn}
                      onPress={() => {
                        const next = wrWeight + 2.5;
                        setWrWeight(next);
                        setCurrentDockLoad(next);
                      }}
                    >
                      <Text style={styles.stepTextBtn}>+2.5</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.miniPillsRow}>
                    <TouchableOpacity
                      style={styles.miniPill}
                      onPress={() => {
                        const next = wrWeight + 5;
                        setWrWeight(next);
                        setCurrentDockLoad(next);
                      }}
                    >
                      <Text style={styles.miniPillText}>+5kg</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.miniPill}
                      onPress={() => {
                        const next = wrWeight + 10;
                        setWrWeight(next);
                        setCurrentDockLoad(next);
                      }}
                    >
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
              <TouchableOpacity
                style={styles.targetBanner}
                onPress={handleOpenTargetModal}
                activeOpacity={0.7}
              >
                <View style={[styles.targetLeft, { backgroundColor: '#F8FAFC' }]}>
                  <Ionicons name="body-outline" size={13} color="#475569" />
                  <Text style={[styles.targetText, { color: '#334155' }]}>
                    Target: {currentEx?.reps || '12 reps'} · {currentEx?.load || 'Bodyweight'}
                  </Text>
                  <View style={[styles.targetAdjustPill, { backgroundColor: '#E2E8F0' }]}>
                    <Ionicons name="pencil" size={10} color="#475569" />
                    <Text style={[styles.targetAdjustPillText, { color: '#475569' }]}>Adjust</Text>
                  </View>
                </View>
                <Text style={styles.targetRight}>
                  Set {currentSet} of {currentEx?.totalSets || 4}
                </Text>
              </TouchableOpacity>

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
                        onPress={() => {
                          setBwExtraLoad(val);
                          setCurrentDockLoad(val);
                        }}
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
        )}

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
            {activeMode === 'duration' ? (
              <Text style={[styles.dockVal, { color: KinetixTheme.colors.textSecondary, fontSize: 13 }]}>
                Bodyweight
              </Text>
            ) : activeMode === 'bodyweight' ? (
              <Text style={[styles.dockVal, { color: bwExtraLoad > 0 ? KinetixTheme.colors.primary : KinetixTheme.colors.textSecondary, fontSize: 13 }]}>
                {bwExtraLoad > 0 ? `+${bwExtraLoad}kg` : 'Bodyweight'}
              </Text>
            ) : (
              <View style={styles.dockInlineStepper}>
                <TouchableOpacity
                  onPress={() => {
                    const next = Math.max(0, wrWeight - 2.5);
                    setWrWeight(next);
                    setCurrentDockLoad(next);
                  }}
                >
                  <Text style={styles.dockStepOp}>-</Text>
                </TouchableOpacity>
                <Text style={styles.dockVal}>{wrWeight}<Text style={styles.dockSub}>kg</Text></Text>
                <TouchableOpacity
                  onPress={() => {
                    const next = wrWeight + 2.5;
                    setWrWeight(next);
                    setCurrentDockLoad(next);
                  }}
                >
                  <Text style={styles.dockStepOp}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.dockCol}>
            <Text style={styles.dockLabel}>REST</Text>
            <Text style={styles.dockVal}>
              {typeof currentEx?.restSeconds === 'number' ? `${currentEx.restSeconds}s` : '60s'}
            </Text>
          </View>
        </View>

        {/* Action Control Dock */}
        <View style={styles.actionDock}>
          {!isGuidedMode ? (
            <>
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

                <TouchableOpacity
                  style={[styles.subActionBtn, styles.finishActionBtn]}
                  onPress={triggerFinish}
                  activeOpacity={0.7}
                >
                  <Ionicons name="flag-outline" size={18} color={KinetixTheme.colors.primary} />
                  <Text style={[styles.subActionBtnText, { color: KinetixTheme.colors.primary, fontWeight: '700' }]}>Finish</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.subActionRow}>
              <TouchableOpacity
                style={styles.subActionBtn}
                onPress={player.isPaused ? player.resume : player.pause}
                activeOpacity={0.7}
              >
                <Ionicons name={player.isPaused ? 'play' : 'pause'} size={18} color={KinetixTheme.colors.text} />
                <Text style={styles.subActionBtnText}>{player.isPaused ? 'Resume' : 'Pause'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.subActionBtn}
                onPress={() => {
                  player.nextExercise();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="play-skip-forward" size={18} color={KinetixTheme.colors.text} />
                <Text style={styles.subActionBtnText}>Next Ex</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.subActionBtn, styles.finishActionBtn]}
                onPress={triggerFinish}
                activeOpacity={0.7}
              >
                <Ionicons name="flag-outline" size={18} color={KinetixTheme.colors.primary} />
                <Text style={[styles.subActionBtnText, { color: KinetixTheme.colors.primary, fontWeight: '700' }]}>Finish</Text>
              </TouchableOpacity>
            </View>
          )}
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
                <TouchableOpacity
                  key={ex.id || idx}
                  onPress={() => handleSelectExercise(idx)}
                  activeOpacity={0.75}
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
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Workout Completion & Timestamp Summary Modal */}
      <Modal
        visible={showCompletionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.completionCard}>
            <View style={styles.completionTrophyCircle}>
              <Ionicons name="trophy" size={32} color="#F59E0B" />
            </View>

            <Text style={styles.completionTitle}>Workout Completed!</Text>
            <Text style={styles.completionSubtitle}>Great effort! Here is your recorded session summary:</Text>

            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Session Name</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {completionSummary?.worksessionName || currentSessionName}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date</Text>
                <Text style={styles.summaryValue}>
                  {completionSummary ? formatDateStamp(completionSummary.startTime) : formatDateStamp(workoutStartTime)}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Started At</Text>
                <Text style={styles.summaryValue}>
                  {completionSummary?.startTimeFormatted || formatTimeOfDay(workoutStartTime)}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Completed At</Text>
                <Text style={styles.summaryValue}>
                  {completionSummary?.endTimeFormatted || formatTimeOfDay(Date.now())}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRowHighlight}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="timer" size={18} color="#059669" />
                  <Text style={styles.summaryLabelHighlight}>Total Duration</Text>
                </View>
                <Text style={styles.summaryValueHighlight}>
                  {completionSummary?.durationFormatted || formatWorkoutDuration(elapsedWorkoutSeconds)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveWorkoutBtn}
              onPress={handleConfirmFinish}
              activeOpacity={0.85}
            >
              <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
              <Text style={styles.saveWorkoutBtnText}>Save Workout to History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelCompletionBtn}
              onPress={() => setShowCompletionModal(false)}
            >
              <Text style={styles.cancelCompletionBtnText}>Return to Workout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Video Demonstration Modal */}
      <ExerciseVideoModal
        visible={!!selectedVideoModal}
        exercise={selectedVideoModal}
        onClose={() => setSelectedVideoModal(null)}
      />

      {/* Interactive Exercise Target Adjustment Modal */}
      <Modal
        visible={isTargetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTargetModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.targetModalCard}>
            {/* Modal Header */}
            <View style={styles.targetModalHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.targetModalPillRow}>
                  <Ionicons
                    name={activeMode === 'duration' ? 'timer-outline' : activeMode === 'weight_reps' ? 'barbell-outline' : 'body-outline'}
                    size={14}
                    color={activeMode === 'duration' ? KinetixTheme.colors.secondary : activeMode === 'weight_reps' ? '#2563EB' : '#475569'}
                  />
                  <Text
                    style={[
                      styles.targetModalPillText,
                      activeMode === 'duration' && { color: KinetixTheme.colors.secondary },
                      activeMode === 'weight_reps' && { color: '#2563EB' },
                      activeMode === 'bodyweight' && { color: '#475569' },
                    ]}
                  >
                    {activeMode === 'duration'
                      ? 'REHAB / ISOMETRIC TARGET'
                      : activeMode === 'weight_reps'
                      ? 'PROGRESSIVE OVERLOAD TARGET'
                      : 'BODYWEIGHT TARGET'}
                  </Text>
                </View>
                <Text style={styles.targetModalTitle}>{currentEx?.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsTargetModalVisible(false)}
                style={styles.targetModalCloseBtn}
              >
                <Ionicons name="close" size={20} color={KinetixTheme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {activeMode === 'duration' && (
              <View style={styles.rehabTargetNotice}>
                <Ionicons name="information-circle-outline" size={16} color="#059669" />
                <Text style={styles.rehabTargetNoticeText}>
                  Rehab exercises have clinically calibrated isometric hold targets. You can adjust duration based on your current tendon tolerance.
                </Text>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {/* Target Sets Row */}
              <View style={styles.targetControlSection}>
                <Text style={styles.targetControlLabel}>TARGET TOTAL SETS</Text>
                <View style={styles.targetStepperRow}>
                  <TouchableOpacity
                    style={styles.targetStepCircle}
                    onPress={() => setEditTargetSets((prev) => Math.max(1, prev - 1))}
                  >
                    <Ionicons name="remove" size={18} color={KinetixTheme.colors.text} />
                  </TouchableOpacity>
                  <View style={styles.targetValDisplay}>
                    <Text style={styles.targetValNum}>{editTargetSets}</Text>
                    <Text style={styles.targetValSub}>Sets</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.targetStepCircle}
                    onPress={() => setEditTargetSets((prev) => Math.min(10, prev + 1))}
                  >
                    <Ionicons name="add" size={18} color={KinetixTheme.colors.text} />
                  </TouchableOpacity>
                </View>
                <View style={styles.targetChipsRow}>
                  {[2, 3, 4, 5].map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.targetChip, editTargetSets === s && styles.targetChipActive]}
                      onPress={() => setEditTargetSets(s)}
                    >
                      <Text style={[styles.targetChipText, editTargetSets === s && styles.targetChipTextActive]}>
                        {s} Sets
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* View 1: Duration (Seconds hold) */}
              {activeMode === 'duration' && (
                <View style={styles.targetControlSection}>
                  <Text style={styles.targetControlLabel}>TARGET HOLD DURATION</Text>
                  <View style={styles.targetStepperRow}>
                    <TouchableOpacity
                      style={styles.targetStepCircle}
                      onPress={() => setEditTargetTime((prev) => Math.max(5, prev - 5))}
                    >
                      <Text style={styles.targetStepBtnText}>-5s</Text>
                    </TouchableOpacity>
                    <View style={styles.targetValDisplay}>
                      <Text style={[styles.targetValNum, { color: KinetixTheme.colors.secondaryDark }]}>
                        {editTargetTime}
                      </Text>
                      <Text style={styles.targetValSub}>Seconds</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.targetStepCircle}
                      onPress={() => setEditTargetTime((prev) => prev + 5)}
                    >
                      <Text style={styles.targetStepBtnText}>+5s</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.targetChipsRow}>
                    {[30, 45, 60, 90].map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.targetChip, editTargetTime === t && styles.targetChipActive]}
                        onPress={() => setEditTargetTime(t)}
                      >
                        <Text style={[styles.targetChipText, editTargetTime === t && styles.targetChipTextActive]}>
                          {t}s Hold
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* View 2: Weight & Reps */}
              {activeMode === 'weight_reps' && (
                <>
                  {/* Reps Target */}
                  <View style={styles.targetControlSection}>
                    <Text style={styles.targetControlLabel}>TARGET REPS PER SET</Text>
                    <View style={styles.targetStepperRow}>
                      <TouchableOpacity
                        style={styles.targetStepCircle}
                        onPress={() => setEditTargetReps((prev) => Math.max(1, prev - 1))}
                      >
                        <Ionicons name="remove" size={18} color={KinetixTheme.colors.text} />
                      </TouchableOpacity>
                      <View style={styles.targetValDisplay}>
                        <Text style={[styles.targetValNum, { color: '#2563EB' }]}>{editTargetReps}</Text>
                        <Text style={styles.targetValSub}>Reps</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.targetStepCircle}
                        onPress={() => setEditTargetReps((prev) => prev + 1)}
                      >
                        <Ionicons name="add" size={18} color={KinetixTheme.colors.text} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.targetChipsRow}>
                      {[
                        { r: 5, label: '5 (Strength)' },
                        { r: 8, label: '8 (Hypertrophy)' },
                        { r: 10, label: '10' },
                        { r: 12, label: '12 (Endurance)' },
                      ].map((item) => (
                        <TouchableOpacity
                          key={item.r}
                          style={[styles.targetChip, editTargetReps === item.r && styles.targetChipActiveBlue]}
                          onPress={() => setEditTargetReps(item.r)}
                        >
                          <Text
                            style={[
                              styles.targetChipText,
                              editTargetReps === item.r && styles.targetChipTextActiveBlue,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Weight / Load Target */}
                  <View style={styles.targetControlSection}>
                    <Text style={styles.targetControlLabel}>TARGET LOAD (KG)</Text>
                    <View style={styles.targetStepperRow}>
                      <TouchableOpacity
                        style={styles.targetStepCircle}
                        onPress={() => setEditTargetLoad((prev) => Math.max(0, prev - 2.5))}
                      >
                        <Text style={styles.targetStepBtnText}>-2.5</Text>
                      </TouchableOpacity>
                      <View style={styles.targetValDisplay}>
                        <Text style={[styles.targetValNum, { color: '#2563EB' }]}>
                          {editTargetLoad}
                          <Text style={{ fontSize: 16, color: KinetixTheme.colors.textMuted }}>kg</Text>
                        </Text>
                        <Text style={styles.targetValSub}>Target Weight</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.targetStepCircle}
                        onPress={() => setEditTargetLoad((prev) => prev + 2.5)}
                      >
                        <Text style={styles.targetStepBtnText}>+2.5</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.targetChipsRow}>
                      {[-10, -5, 5, 10].map((delta) => (
                        <TouchableOpacity
                          key={delta}
                          style={styles.targetChip}
                          onPress={() => setEditTargetLoad((prev) => Math.max(0, prev + delta))}
                        >
                          <Text style={styles.targetChipText}>
                            {delta > 0 ? `+${delta}kg` : `${delta}kg`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {/* View 3: Bodyweight Target */}
              {activeMode === 'bodyweight' && (
                <>
                  <View style={styles.targetControlSection}>
                    <Text style={styles.targetControlLabel}>TARGET BODYWEIGHT REPS</Text>
                    <View style={styles.targetStepperRow}>
                      <TouchableOpacity
                        style={styles.targetStepCircle}
                        onPress={() => setEditTargetReps((prev) => Math.max(1, prev - 1))}
                      >
                        <Ionicons name="remove" size={18} color={KinetixTheme.colors.text} />
                      </TouchableOpacity>
                      <View style={styles.targetValDisplay}>
                        <Text style={[styles.targetValNum, { color: '#334155' }]}>{editTargetReps}</Text>
                        <Text style={styles.targetValSub}>Reps</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.targetStepCircle}
                        onPress={() => setEditTargetReps((prev) => prev + 1)}
                      >
                        <Ionicons name="add" size={18} color={KinetixTheme.colors.text} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.targetChipsRow}>
                      {[8, 10, 12, 15, 20].map((r) => (
                        <TouchableOpacity
                          key={r}
                          style={[styles.targetChip, editTargetReps === r && styles.targetChipActive]}
                          onPress={() => setEditTargetReps(r)}
                        >
                          <Text style={[styles.targetChipText, editTargetReps === r && styles.targetChipTextActive]}>
                            {r} reps
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.targetControlSection}>
                    <Text style={styles.targetControlLabel}>EXTRA LOAD (WEIGHTED VEST / BELT)</Text>
                    <View style={styles.targetChipsRow}>
                      {[0, 5, 10, 15, 20].map((kg) => {
                        const isSel = editTargetBwExtra === kg;
                        return (
                          <TouchableOpacity
                            key={kg}
                            style={[styles.targetChip, isSel && styles.targetChipActive]}
                            onPress={() => setEditTargetBwExtra(kg)}
                          >
                            <Text style={[styles.targetChipText, isSel && styles.targetChipTextActive]}>
                              {kg === 0 ? 'Bodyweight (0kg)' : `+${kg}kg`}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Modal Action Buttons */}
            <View style={styles.targetModalActionsRow}>
              <TouchableOpacity
                style={styles.targetModalCancelBtn}
                onPress={() => setIsTargetModalVisible(false)}
              >
                <Text style={styles.targetModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.targetModalSaveBtn}
                onPress={handleSaveTarget}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.targetModalSaveText}>Save Target</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  workoutDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  workoutDurationText: {
    fontSize: 12,
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
    fontVariant: ['tabular-nums'],
  },
  finishActionBtn: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    ...KinetixTheme.shadows.card,
  },
  completionTrophyCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  completionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  completionSubtitle: {
    fontSize: 12.5,
    color: KinetixTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 14,
  },
  summaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    padding: 12,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
    maxWidth: '65%',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 3,
  },
  summaryRowHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 7,
    marginTop: 2,
  },
  summaryLabelHighlight: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#059669',
  },
  summaryValueHighlight: {
    fontSize: 14,
    fontWeight: '900',
    color: '#059669',
    fontVariant: ['tabular-nums'],
  },
  saveWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: KinetixTheme.colors.primary,
    borderRadius: KinetixTheme.borderRadius.lg,
    paddingVertical: 13,
    width: '100%',
    marginBottom: 8,
    ...KinetixTheme.shadows.card,
  },
  saveWorkoutBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelCompletionBtn: {
    paddingVertical: 6,
  },
  cancelCompletionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
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
  metricIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 6,
  },
  metricIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  modeToggleRow: {
    marginBottom: 14,
    width: '100%',
  },
  modeSegmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: KinetixTheme.colors.text,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeTabActiveGuided: {
    backgroundColor: KinetixTheme.colors.primary,
    shadowColor: KinetixTheme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.textSecondary,
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  guidedLiveBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 2,
  },
  guidedLiveBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    includeFontPadding: false,
    letterSpacing: 0.5,
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
  targetAdjustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: KinetixTheme.colors.secondaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  targetAdjustPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: KinetixTheme.colors.secondaryDark,
  },
  targetModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '92%',
    maxWidth: 440,
    ...KinetixTheme.shadows.card,
  },
  targetModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  targetModalPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  targetModalPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  targetModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  targetModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rehabTargetNotice: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  rehabTargetNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#065F46',
    lineHeight: 16,
  },
  targetControlSection: {
    marginBottom: 14,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  targetControlLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: KinetixTheme.colors.textMuted,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  targetStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  targetStepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetStepBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
  },
  targetValDisplay: {
    alignItems: 'center',
  },
  targetValNum: {
    fontSize: 26,
    fontWeight: '900',
    color: KinetixTheme.colors.text,
  },
  targetValSub: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    fontWeight: '600',
  },
  targetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  targetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  targetChipActive: {
    backgroundColor: KinetixTheme.colors.secondaryLight,
    borderColor: KinetixTheme.colors.secondary,
  },
  targetChipActiveBlue: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  targetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  targetChipTextActive: {
    color: KinetixTheme.colors.secondaryDark,
    fontWeight: '700',
  },
  targetChipTextActiveBlue: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  targetModalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  targetModalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  targetModalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: KinetixTheme.colors.textMuted,
  },
  targetModalSaveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: KinetixTheme.colors.primary,
  },
  targetModalSaveText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  toastWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 2,
    zIndex: 99,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 10,
    ...KinetixTheme.shadows.card,
  },
  toastCardCelebration: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  toastIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastIconBoxCelebration: {
    backgroundColor: '#FEF3C7',
  },
  toastTextCol: {
    flex: 1,
  },
  toastHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  toastTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  toastBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  toastBadgeCelebration: {
    backgroundColor: '#FEF3C7',
  },
  toastBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  toastBadgeTextCelebration: {
    color: '#D97706',
  },
  toastSubtitle: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    marginTop: 1,
  },
  toastCloseBtn: {
    padding: 4,
  },
  restTimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 12,
    gap: 10,
  },
  restTimerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pulseRestDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  restTimerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  restTimerHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E40AF',
    letterSpacing: 0.5,
  },
  restTimerClock: {
    fontSize: 13,
    fontWeight: '900',
    color: '#2563EB',
    fontVariant: ['tabular-nums'],
  },
  restProgressBarTrack: {
    height: 4,
    backgroundColor: '#DBEAFE',
    borderRadius: 2,
    overflow: 'hidden',
  },
  restProgressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  restTimerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  restAddBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  restAddBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  restSkipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  restSkipBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
