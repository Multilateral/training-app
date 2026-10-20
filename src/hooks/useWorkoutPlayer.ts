import { useState, useRef, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Safe dynamic resolution of native audio modules to prevent crashes in Expo Go or clients without ExponentAV
let nativeAudioModule: {
  type: 'expo-audio' | 'expo-av';
  createPlayer?: (source: any) => any;
  setAudioModeAsync?: (mode: any) => Promise<void>;
  Sound?: any;
} | null = null;

try {
  const expoAudio = require('expo-audio');
  if (expoAudio?.createAudioPlayer) {
    nativeAudioModule = {
      type: 'expo-audio',
      createPlayer: expoAudio.createAudioPlayer,
      setAudioModeAsync: expoAudio.setAudioModeAsync,
    };
    console.log('[useWorkoutPlayer] Loaded expo-audio module successfully');
  }
} catch (e: any) {
  console.log('[useWorkoutPlayer] expo-audio failed to load:', e?.message || e);
}

if (!nativeAudioModule) {
  try {
    const expoAv = require('expo-av');
    if (expoAv?.Audio?.Sound) {
      nativeAudioModule = {
        type: 'expo-av',
        Sound: expoAv.Audio.Sound,
        setAudioModeAsync: expoAv.Audio.setAudioModeAsync,
      };
      console.log('[useWorkoutPlayer] Loaded expo-av module successfully');
    }
  } catch (e: any) {
    console.log('[useWorkoutPlayer] expo-av failed to load:', e?.message || e);
  }
}

if (!nativeAudioModule) {
  console.warn('[useWorkoutPlayer] NO native audio module available! Available modules:', Object.keys((globalThis as any).expo?.modules || {}));
}

export type WorkoutState =
  | 'READY'
  | 'LEAD_IN'
  | 'ACTIVE_WORK'
  | 'RESTING'
  | 'PAUSED'
  | 'COMPLETED';

export type ExerciseTrackingType = 'duration' | 'weight_reps' | 'reps_only';

export interface PlayerExercise {
  id?: string;
  name: string;
  cue?: string;
  totalSets?: number;
  sets?: number;
  target_reps?: number;
  reps?: string | number;
  target_weight?: number | string;
  load?: string;
  weight?: string;
  target_rest_seconds?: number;
  restSeconds?: number;
  target_duration_seconds?: number;
  target_time?: number;
  hold_seconds_per_rep?: number;
  reset_seconds_per_rep?: number;
  seconds_per_rep?: number;
  reps_per_set?: number[];
  durations_per_set?: number[];
  tracking_type?: string;
  trackingType?: string;
  equipment?: string;
  muscle_group?: string;
}

export interface SetResultLog {
  exerciseIndex: number;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weight: number;
  durationSeconds: number;
  completedAt: number;
}

export type AudioPacerMode = 'pulse' | 'tones' | 'metronome' | 'mute';

export interface UseWorkoutPlayerOptions {
  exercises: PlayerExercise[];
  leadInDurationSeconds?: number;
  initialExerciseIndex?: number;
  initialSetIndex?: number;
  initialState?: WorkoutState;
  initialSecondsRemaining?: number;
  initialEndTime?: number | null;
  initialTotalDurationMs?: number;
  initialWasAutoPaused?: boolean;
  initialCadenceMode?: 'auto' | 'free';
  initialAudioPacerMode?: AudioPacerMode;
  onSetCompleted?: (log: SetResultLog) => void;
  onWorkoutCompleted?: (allLogs: SetResultLog[], totalDurationSeconds: number) => void;
  onStateChange?: (snapshot: any) => void;
}

// Bundled sound assets for countdown pips, transition chimes, and cadence audio pacing
const PIP_SOUND_ASSET = require('../../assets/sounds/pip.wav');
const CHIME_SOUND_ASSET = require('../../assets/sounds/chime.wav');
const CADENCE_UP_ASSET = require('../../assets/sounds/cadence_up.wav');
const CADENCE_DOWN_ASSET = require('../../assets/sounds/cadence_down.wav');
const REP_DING_ASSET = require('../../assets/sounds/rep_ding.wav');
const METRONOME_TICK_ASSET = require('../../assets/sounds/metronome_tick.wav');
const METRONOME_TICK_HIGH_ASSET = require('../../assets/sounds/metronome_tick_high.wav');
const METRONOME_EXTEND_ASSET = require('../../assets/sounds/metronome_extend.wav');
const METRONOME_RETURN_ASSET = require('../../assets/sounds/metronome_return.wav');

export type SoundType =
  | 'pip'
  | 'chime'
  | 'cadence_up'
  | 'cadence_down'
  | 'rep_ding'
  | 'metronome_tick'
  | 'metronome_tick_high'
  | 'metronome_extend'
  | 'metronome_return'
  | 'cadence_pulse';

const SOUND_ASSETS: Record<SoundType, any> = {
  pip: PIP_SOUND_ASSET,
  chime: CHIME_SOUND_ASSET,
  cadence_up: CADENCE_UP_ASSET,
  cadence_down: CADENCE_DOWN_ASSET,
  rep_ding: REP_DING_ASSET,
  metronome_tick: METRONOME_TICK_ASSET,
  metronome_tick_high: METRONOME_TICK_HIGH_ASSET,
  metronome_extend: METRONOME_EXTEND_ASSET,
  metronome_return: METRONOME_RETURN_ASSET,
  cadence_pulse: METRONOME_TICK_ASSET,
};

export interface CadencePhase {
  id: string;
  name: string;
  shortName: string;
  cue: string;
  durationMs: number;
  soundType: 'cadence_up' | 'cadence_down' | 'pip' | 'none';
  accentColor: string;
}

export interface CadenceProfile {
  enabled: boolean;
  exerciseName: string;
  totalReps: number;
  totalDurationMs: number;
  repDurationMs: number;
  phases: CadencePhase[];
  visualType?: 'sine_wave' | 'circle';
  defaultAudioPacer?: AudioPacerMode;
  waveProfile?: 'symmetric_sine' | 'isometric_hold' | 'skewed_tempo';
  holdDurationMs?: number;
  resetDurationMs?: number;
  riseDurationMs?: number;
}

/**
 * Resolves an automated cadence pacing profile for exercises requiring controlled tempo,
 * rhythmic breathing, or structured isometric holds.
 */
export const resolveExerciseCadence = (
  ex: PlayerExercise | undefined,
  setIndex: number,
  targetDurationSeconds: number,
  targetReps: number
): CadenceProfile | null => {
  if (!ex) return null;

  const nameLower = (ex.name || '').toLowerCase();
  const cueLower = (ex.cue || '').toLowerCase();

  // 1. Cat-Cow Stretch / Segmental Spinal Flexion & Extension
  if (
    nameLower.includes('cat-cow') ||
    nameLower.includes('cat cow') ||
    cueLower.includes('segmental flexion') ||
    cueLower.includes('rhythmic breathing')
  ) {
    const reps = targetReps > 0 ? targetReps : 10;
    const secPerRep =
      typeof ex.seconds_per_rep === 'number' && ex.seconds_per_rep > 0
        ? ex.seconds_per_rep
        : typeof ex.hold_seconds_per_rep === 'number' && ex.hold_seconds_per_rep > 0
        ? ex.hold_seconds_per_rep
        : targetDurationSeconds > 0 && reps > 0
        ? targetDurationSeconds / reps
        : 5.0;
    const repMs = Math.round(secPerRep * 1000);
    const totalMs = repMs * reps;
    const halfMs = Math.round(repMs / 2);

    const phases: CadencePhase[] = [
      {
        id: 'cat',
        name: 'CAT (ARCH UP / FLEXION)',
        shortName: 'CAT',
        cue: 'Inhale deeply, tuck chin and round spine towards ceiling',
        durationMs: halfMs,
        soundType: 'cadence_up',
        accentColor: '#0284C7',
      },
      {
        id: 'cow',
        name: 'COW (DIP DOWN / EXTENSION)',
        shortName: 'COW',
        cue: 'Exhale slowly, lift gaze and drop belly toward the floor',
        durationMs: repMs - halfMs,
        soundType: 'cadence_down',
        accentColor: '#10B981',
      },
    ];

    return {
      enabled: true,
      exerciseName: ex.name,
      totalReps: reps,
      totalDurationMs: totalMs,
      repDurationMs: repMs,
      phases,
      visualType: 'sine_wave',
      defaultAudioPacer: 'metronome',
    };
  }

  // 2. Diaphragmatic / Box Breathing
  if (nameLower.includes('breath') || cueLower.includes('breathing')) {
    const reps = targetReps > 0 ? targetReps : 10;
    const secPerRep =
      typeof ex.seconds_per_rep === 'number' && ex.seconds_per_rep > 0
        ? ex.seconds_per_rep
        : targetDurationSeconds > 0 && reps > 0
        ? targetDurationSeconds / reps
        : 6.0;
    const repMs = Math.round(secPerRep * 1000);
    const totalMs = repMs * reps;
    const halfMs = Math.round(repMs / 2);

    return {
      enabled: true,
      exerciseName: ex.name,
      totalReps: reps,
      totalDurationMs: totalMs,
      repDurationMs: repMs,
      phases: [
        {
          id: 'inhale',
          name: 'INHALE (BELLY EXPANDS)',
          shortName: 'INHALE',
          cue: 'Inhale through nose, expanding ribcage 360°',
          durationMs: halfMs,
          soundType: 'cadence_up',
          accentColor: '#0284C7',
        },
        {
          id: 'exhale',
          name: 'EXHALE (ENGAGE CORE)',
          shortName: 'EXHALE',
          cue: 'Slow continuous exhale, gentle abdominal draw-in',
          durationMs: repMs - halfMs,
          soundType: 'cadence_down',
          accentColor: '#10B981',
        },
      ],
      visualType: 'sine_wave',
      defaultAudioPacer: 'metronome',
    };
  }

  // 3. Stuart McGill Protocol Descending Pyramids (Bird-Dog, McGill Curl-up, Side Plank)
  const isMcGill =
    nameLower.includes('mcgill') ||
    nameLower.includes('bird-dog') ||
    (nameLower.includes('side plank') && cueLower.includes('pyramid'));
  if (isMcGill) {
    const reps = targetReps > 0 ? targetReps : setIndex === 0 ? 5 : setIndex === 1 ? 3 : 1;
    const holdSec =
      typeof ex.hold_seconds_per_rep === 'number' && ex.hold_seconds_per_rep > 0
        ? ex.hold_seconds_per_rep
        : 10.0;
    const resetSec =
      typeof ex.reset_seconds_per_rep === 'number' && ex.reset_seconds_per_rep >= 0
        ? ex.reset_seconds_per_rep
        : 2.0; // Default 2.0s switch sides / release duration
    const secPerRep =
      typeof ex.seconds_per_rep === 'number' && ex.seconds_per_rep > 0
        ? ex.seconds_per_rep
        : holdSec + resetSec;
    const repMs = Math.round(secPerRep * 1000);
    const holdMs = Math.round(holdSec * 1000);
    const resetMs = Math.max(500, repMs - holdMs);
    const totalMs = repMs * reps;

    return {
      enabled: true,
      exerciseName: ex.name,
      totalReps: reps,
      totalDurationMs: totalMs,
      repDurationMs: repMs,
      waveProfile: 'isometric_hold',
      holdDurationMs: holdMs,
      resetDurationMs: resetMs,
      riseDurationMs: 1500,
      visualType: 'sine_wave',
      defaultAudioPacer: 'metronome',
      phases: [
        {
          id: 'extend_hold',
          name: 'EXTEND & HOLD',
          shortName: 'HOLD',
          cue: 'Reach long through fingertips and heel, maintain rigid core stiffness',
          durationMs: holdMs,
          soundType: 'cadence_up',
          accentColor: '#0284C7',
        },
        {
          id: 'return_reset',
          name: 'RELEASE & SWITCH',
          shortName: 'SWITCH',
          cue: 'Smooth controlled return and switch sides for next rep',
          durationMs: resetMs,
          soundType: 'cadence_down',
          accentColor: '#10B981',
        },
      ],
    };
  }

  // 4. Eccentric Strength / Controlled Tempo
  if (
    nameLower.includes('eccentric') ||
    cueLower.includes('eccentric') ||
    nameLower.includes('heel drop')
  ) {
    const reps = targetReps > 0 ? targetReps : 10;
    const repMs = 4000;
    const totalMs = reps * repMs;
    const eccentricMs = 2600;
    const concentricMs = 1400;

    return {
      enabled: true,
      exerciseName: ex.name,
      totalReps: reps,
      totalDurationMs: totalMs,
      repDurationMs: repMs,
      phases: [
        {
          id: 'eccentric',
          name: 'ECCENTRIC (LOWER DOWN)',
          shortName: 'LOWER',
          cue: 'Controlled lowering under tension',
          durationMs: eccentricMs,
          soundType: 'cadence_down',
          accentColor: '#8B5CF6',
        },
        {
          id: 'concentric',
          name: 'CONCENTRIC (DRIVE UP)',
          shortName: 'DRIVE',
          cue: 'Drive up with power to initial starting position',
          durationMs: concentricMs,
          soundType: 'cadence_up',
          accentColor: '#10B981',
        },
      ],
    };
  }

  // 5. Generic Paced Reps: Any exercise with seconds_per_rep / hold_seconds_per_rep or targetDurationSeconds with targetReps
  const genericSecPerRep =
    typeof ex.seconds_per_rep === 'number' && ex.seconds_per_rep > 0
      ? ex.seconds_per_rep
      : typeof ex.hold_seconds_per_rep === 'number' && ex.hold_seconds_per_rep > 0
      ? ex.hold_seconds_per_rep
      : targetDurationSeconds > 0 && targetReps > 0
      ? targetDurationSeconds / targetReps
      : 0;

  if (genericSecPerRep >= 2.0 && genericSecPerRep <= 60) {
    const reps = targetReps > 0 ? targetReps : 10;
    const repMs = Math.round(genericSecPerRep * 1000);
    const totalMs = repMs * reps;
    const halfMs = Math.round(repMs / 2);

    return {
      enabled: true,
      exerciseName: ex.name,
      totalReps: reps,
      totalDurationMs: totalMs,
      repDurationMs: repMs,
      phases: [
        {
          id: 'concentric_extend',
          name: 'CONCENTRIC / EXTEND',
          shortName: 'EXTEND',
          cue: 'Controlled extension towards peak position',
          durationMs: halfMs,
          soundType: 'cadence_up',
          accentColor: '#0284C7',
        },
        {
          id: 'eccentric_return',
          name: 'ECCENTRIC / RETURN',
          shortName: 'RETURN',
          cue: 'Smooth controlled return to starting position',
          durationMs: repMs - halfMs,
          soundType: 'cadence_down',
          accentColor: '#10B981',
        },
      ],
      visualType: 'sine_wave',
      defaultAudioPacer: 'metronome',
    };
  }

  // 6. Pure Duration / Isometric Exercises (e.g. Front Plank, Wall Sit, Dead Bug Hold, Side Plank)
  // Adaptive diaphragmatic breathing & core stabilization wave
  if (targetDurationSeconds > 0) {
    const durSec = targetDurationSeconds;
    // Calculate clinical diaphragmatic breathing harmonic (4.0s - 6.0s cycle)
    const nBreaths = Math.max(1, Math.round(durSec / 5.0));
    const cycleMs = Math.round((durSec * 1000) / nBreaths);
    const halfCycleMs = Math.round(cycleMs / 2);
    return {
      enabled: true,
      exerciseName: ex.name,
      totalReps: nBreaths,
      totalDurationMs: durSec * 1000,
      repDurationMs: cycleMs,
      visualType: 'sine_wave',
      defaultAudioPacer: 'metronome',
      phases: [
        {
          id: 'inhale_brace',
          name: 'INHALE & BRACE CORE',
          shortName: 'BRACE',
          cue: 'Inhale into ribs 360°, maintain rigid abdominal brace',
          durationMs: halfCycleMs,
          soundType: 'cadence_up',
          accentColor: '#0284C7',
        },
        {
          id: 'exhale_stabilize',
          name: 'EXHALE & STABILIZE',
          shortName: 'STABILIZE',
          cue: 'Slow continuous exhale over core brace, stabilize pelvis',
          durationMs: cycleMs - halfCycleMs,
          soundType: 'cadence_down',
          accentColor: '#10B981',
        },
      ],
    };
  }

  return null;
};

/**
 * Resolves the target hold duration for a specific set of an exercise.
 * Supports:
 * - Explicit `durations_per_set` array (e.g. [50, 30, 10])
 * - Explicit `reps_per_set` with hold time (e.g. [5, 3, 1] * 10s = [50, 30, 10])
 * - Stuart McGill descending pyramid (Set 1: 5 reps = 50s, Set 2: 3 reps = 30s, Set 3: 1 rep = 10s)
 * - Explicit `target_duration_seconds` or `target_time`
 */
/**
 * Resolves the target reps for a specific set of an exercise.
 */
export const getExerciseSetReps = (
  ex: PlayerExercise | undefined,
  setIndex: number
): number => {
  if (!ex) return 10;

  // 1. Explicit reps_per_set array
  if (Array.isArray(ex.reps_per_set) && typeof ex.reps_per_set[setIndex] === 'number') {
    return ex.reps_per_set[setIndex];
  }

  // 2. Explicit durations_per_set with hold time
  if (Array.isArray(ex.durations_per_set) && typeof ex.durations_per_set[setIndex] === 'number') {
    const holdTime = ex.seconds_per_rep || ex.hold_seconds_per_rep || 10;
    return Math.max(1, Math.round(ex.durations_per_set[setIndex] / holdTime));
  }

  // 3. Stuart McGill protocol pyramid
  const nameLower = (ex.name || '').toLowerCase();
  const cueLower = (ex.cue || '').toLowerCase();
  const isMcGill = nameLower.includes('mcgill') || nameLower.includes('bird-dog');
  const isPyramid = cueLower.includes('descending') || cueLower.includes('pyramid') || cueLower.includes('5-3-1');
  const tSets = ex.totalSets || ex.sets || 3;

  if ((isMcGill || isPyramid) && tSets >= 3 && !nameLower.includes('warmup')) {
    const mcgillReps = [5, 3, 1];
    if (setIndex < mcgillReps.length) {
      return mcgillReps[setIndex];
    }
  }

  if (typeof ex.target_reps === 'number' && ex.target_reps > 0) return ex.target_reps;
  const parsedDigits = parseInt(String(ex.reps || '').replace(/[^0-9]/g, ''));
  if (!isNaN(parsedDigits) && parsedDigits > 0) return parsedDigits;
  return 10;
};

/**
 * Resolves target work duration in seconds for timed or paced exercises.
 * - Explicit seconds_per_rep with target_reps
 * - Stuart McGill descending pyramid (Set 1: 5 reps = 50s, Set 2: 3 reps = 30s, Set 3: 1 rep = 10s)
 * - Explicit target_duration_seconds or target_time
 */
export const getExerciseSetDuration = (
  ex: PlayerExercise | undefined,
  setIndex: number
): number => {
  if (!ex) return 45;

  const holdSec = ex.hold_seconds_per_rep;
  const resetSec = typeof ex.reset_seconds_per_rep === 'number' ? ex.reset_seconds_per_rep : (holdSec ? 2 : 0);
  const secPerRep =
    typeof ex.seconds_per_rep === 'number' && ex.seconds_per_rep > 0
      ? ex.seconds_per_rep
      : holdSec
      ? holdSec + resetSec
      : undefined;

  // 0. Explicit seconds_per_rep with target reps
  if (typeof secPerRep === 'number' && secPerRep > 0) {
    const reps = getExerciseSetReps(ex, setIndex);
    if (reps > 0) {
      return Math.round(reps * secPerRep);
    }
  }

  // 1. Explicit durations_per_set array
  if (Array.isArray(ex.durations_per_set) && typeof ex.durations_per_set[setIndex] === 'number') {
    return ex.durations_per_set[setIndex];
  }

  // 2. Explicit reps_per_set with hold/rep time
  if (Array.isArray(ex.reps_per_set) && typeof ex.reps_per_set[setIndex] === 'number') {
    const repTime = secPerRep || 12;
    return ex.reps_per_set[setIndex] * repTime;
  }

  // 3. Stuart McGill protocol or descending pyramid hold (Default 10s hold + 2s switch = 12s per rep)
  const nameLower = (ex.name || '').toLowerCase();
  const cueLower = (ex.cue || '').toLowerCase();
  const isMcGill = nameLower.includes('mcgill') || nameLower.includes('bird-dog');
  const isPyramid = cueLower.includes('descending') || cueLower.includes('pyramid') || cueLower.includes('5-3-1');
  const tSets = ex.totalSets || ex.sets || 3;

  if ((isMcGill || isPyramid) && tSets >= 3 && !nameLower.includes('warmup')) {
    const mcgillReps = [5, 3, 1];
    const repTime = secPerRep || 12;
    if (setIndex < mcgillReps.length) {
      return mcgillReps[setIndex] * repTime;
    }
  }

  // 4. Target reps with hold time
  if (ex.hold_seconds_per_rep && ex.target_reps) {
    return ex.target_reps * ex.hold_seconds_per_rep;
  }

  // 5. Explicit target_duration_seconds or target_time
  if (typeof ex.target_duration_seconds === 'number' && ex.target_duration_seconds > 0) {
    return ex.target_duration_seconds;
  }
  if (typeof ex.target_time === 'number' && ex.target_time > 0) {
    return ex.target_time;
  }

  // 6. Parsed from reps string (e.g. "50s")
  const parsedDigits = parseInt(String(ex.reps || '').replace(/[^0-9]/g, ''));
  if (!isNaN(parsedDigits) && parsedDigits > 0) {
    return parsedDigits;
  }

  return 45;
};

/**
 * Resolves the target rest seconds for an exercise.
 * Accurately honors 0 seconds rest (e.g. Diaphragmatic Breathing or continuous transitions).
 */
export const getExerciseRestSeconds = (
  ex: PlayerExercise | undefined
): number => {
  if (!ex) return 60;
  if (typeof ex.target_rest_seconds === 'number') return ex.target_rest_seconds;
  if (typeof ex.restSeconds === 'number') return ex.restSeconds;
  return 60;
};

export function useWorkoutPlayer({
  exercises,
  leadInDurationSeconds = 5,
  initialExerciseIndex = 0,
  initialSetIndex = 0,
  initialState = 'READY',
  initialSecondsRemaining,
  initialEndTime = null,
  initialTotalDurationMs,
  initialWasAutoPaused = false,
  initialCadenceMode = 'auto',
  initialAudioPacerMode = 'metronome',
  onSetCompleted,
  onWorkoutCompleted,
  onStateChange,
}: UseWorkoutPlayerOptions) {
  // State Machine
  const [state, setState] = useState<WorkoutState>(initialState);
  const [previousState, setPreviousState] = useState<WorkoutState>(
    initialState === 'PAUSED' ? 'ACTIVE_WORK' : initialState
  );
  const [wasAutoPaused, setWasAutoPaused] = useState<boolean>(Boolean(initialWasAutoPaused));
  const wasAutoPausedRef = useRef<boolean>(Boolean(initialWasAutoPaused));

  // Exercise and Set pointers
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(initialExerciseIndex);
  const [currentSetIndex, setCurrentSetIndex] = useState<number>(initialSetIndex); // 0-indexed internally

  const currentExerciseIndexRef = useRef<number>(initialExerciseIndex);
  const currentSetIndexRef = useRef<number>(initialSetIndex);
  useEffect(() => {
    currentExerciseIndexRef.current = currentExerciseIndex;
  }, [currentExerciseIndex]);
  useEffect(() => {
    currentSetIndexRef.current = currentSetIndex;
  }, [currentSetIndex]);

  // Absolute Timestamp Timer Tracking
  const initialDurationSeconds =
    typeof initialSecondsRemaining === 'number'
      ? initialSecondsRemaining
      : (initialState === 'LEAD_IN' ? leadInDurationSeconds : 45);

  const endTimeRef = useRef<number | null>(initialEndTime);
  const totalDurationMsRef = useRef<number>(
    initialTotalDurationMs || (initialDurationSeconds * 1000)
  );
  const pausedRemainingMsRef = useRef<number>(
    initialState === 'PAUSED' ? initialDurationSeconds * 1000 : 0
  );
  const timerIntervalRef = useRef<any>(null);
  const restTransitionTimeoutRef = useRef<any>(null);
  const isRestTransitioningRef = useRef<boolean>(false);
  const [isRestTransitioning, setIsRestTransitioning] = useState<boolean>(false);

  // Time remaining & progress states for UI
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialDurationSeconds);
  const [progress, setProgress] = useState<number>(() => {
    if (initialState === 'PAUSED' && totalDurationMsRef.current > 0) {
      return Math.min(
        1,
        Math.max(0, 1 - pausedRemainingMsRef.current / totalDurationMsRef.current)
      );
    }
    return 0;
  });

  // Overall workout time
  const workoutStartTimestampRef = useRef<number | null>(null);
  const [workoutElapsedSeconds, setWorkoutElapsedSeconds] = useState<number>(0);

  // Sound objects cached in memory
  const soundPlayersRef = useRef<Record<SoundType, any>>({
    pip: null,
    chime: null,
    cadence_up: null,
    cadence_down: null,
    rep_ding: null,
    metronome_tick: null,
    metronome_tick_high: null,
    metronome_extend: null,
    metronome_return: null,
    cadence_pulse: null,
  });
  const soundUrisRef = useRef<Record<SoundType, string | null>>({
    pip: null,
    chime: null,
    cadence_up: null,
    cadence_down: null,
    rep_ding: null,
    metronome_tick: null,
    metronome_tick_high: null,
    metronome_extend: null,
    metronome_return: null,
    cadence_pulse: null,
  });
  // Dedicated pre-loaded player pool for metronome_tick for instantaneous zero-latency playback
  const tickPlayersPoolRef = useRef<any[]>([]);
  const tickPoolIndexRef = useRef<number>(0);
  // Dedicated pre-loaded player pool for warning pitch metronome_tick_high (1520Hz)
  const tickHighPlayersPoolRef = useRef<any[]>([]);
  const tickHighPoolIndexRef = useRef<number>(0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // Initialize native audio session (silent mode bypass on iOS and mixing with other apps)
  useEffect(() => {
    let isMounted = true;
    const initAudio = async () => {
      try {
        console.log('[useWorkoutPlayer] Initializing audio session, module:', nativeAudioModule?.type);
        if (nativeAudioModule?.type === 'expo-audio' && nativeAudioModule.setAudioModeAsync) {
          await nativeAudioModule.setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
            interruptionMode: 'mixWithOthers',
          });
          console.log('[useWorkoutPlayer] expo-audio setAudioModeAsync configured');
        } else if (nativeAudioModule?.type === 'expo-av' && nativeAudioModule.setAudioModeAsync) {
          await nativeAudioModule.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            interruptionModeIOS: 1, // MixWithOthers
            interruptionModeAndroid: 1,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
          console.log('[useWorkoutPlayer] expo-av setAudioModeAsync configured');
        }

        // Pre-download audio assets to local device cache for zero-latency offline playback
        try {
          const { Asset } = require('expo-asset');
          await Promise.all(
            (Object.keys(SOUND_ASSETS) as SoundType[]).map(async (key) => {
              try {
                const asset = Asset.fromModule(SOUND_ASSETS[key]);
                await asset.downloadAsync();
                soundUrisRef.current[key] = asset.localUri || asset.uri;
              } catch (e: any) {
                console.log(`[useWorkoutPlayer] ${key} download notice:`, e);
              }
            })
          );
          console.log('[useWorkoutPlayer] Audio assets cached:', soundUrisRef.current);
        } catch (assetErr) {
          console.log('[useWorkoutPlayer] Asset caching notice:', assetErr);
        }

        // Preload/pre-create players for instant playback without initialization delay
        if (isMounted && nativeAudioModule?.type === 'expo-audio' && nativeAudioModule.createPlayer) {
          const createAudioPlayer = nativeAudioModule.createPlayer;
          (Object.keys(SOUND_ASSETS) as SoundType[]).forEach((key) => {
            try {
              const src = soundUrisRef.current[key] || SOUND_ASSETS[key];
              if (src && !soundPlayersRef.current[key]) {
                const player = createAudioPlayer(src);
                player.volume = 1.0;
                soundPlayersRef.current[key] = player;
              }
            } catch (pErr) {
              console.log(`[useWorkoutPlayer] Player pre-creation error for ${key}:`, pErr);
            }
          });

          // Preload pool of 3 dedicated players for metronome_tick to achieve zero-latency playback
          const tickSrc = soundUrisRef.current['metronome_tick'] || SOUND_ASSETS['metronome_tick'];
          if (tickSrc) {
            try {
              tickPlayersPoolRef.current = [
                createAudioPlayer(tickSrc),
                createAudioPlayer(tickSrc),
                createAudioPlayer(tickSrc),
              ];
              tickPlayersPoolRef.current.forEach((p) => {
                if (p) p.volume = 1.0;
              });
            } catch (poolErr) {
              console.log('[useWorkoutPlayer] Tick pool creation error:', poolErr);
            }
          }

          // Preload pool of 3 dedicated players for metronome_tick_high to achieve zero-latency playback
          const tickHighSrc = soundUrisRef.current['metronome_tick_high'] || SOUND_ASSETS['metronome_tick_high'];
          if (tickHighSrc) {
            try {
              tickHighPlayersPoolRef.current = [
                createAudioPlayer(tickHighSrc),
                createAudioPlayer(tickHighSrc),
                createAudioPlayer(tickHighSrc),
              ];
              tickHighPlayersPoolRef.current.forEach((p) => {
                if (p) p.volume = 1.0;
              });
            } catch (poolErr) {
              console.log('[useWorkoutPlayer] High tick pool creation error:', poolErr);
            }
          }
          console.log('[useWorkoutPlayer] expo-audio players pre-created');
        }
      } catch (err) {
        console.warn('[useWorkoutPlayer] Audio initialization warning:', err);
      }
    };

    initAudio();

    return () => {
      isMounted = false;
      (Object.keys(soundPlayersRef.current) as SoundType[]).forEach((key) => {
        try {
          const p = soundPlayersRef.current[key];
          if (p?.release) p.release();
          if (p?.unloadAsync) p.unloadAsync();
          soundPlayersRef.current[key] = null;
        } catch {}
      });
      if (restTransitionTimeoutRef.current) {
        clearTimeout(restTransitionTimeoutRef.current);
        restTransitionTimeoutRef.current = null;
      }
    };
  }, []);

  // Logged sets repository
  const [loggedSets, setLoggedSets] = useState<SetResultLog[]>([]);

  // Current active exercise
  const currentExercise: PlayerExercise | undefined = exercises[currentExerciseIndex] || exercises[0];

  // Resolve tracking type for the current exercise
  const resolveTrackingType = useCallback((ex?: PlayerExercise): ExerciseTrackingType => {
    if (!ex) return 'duration';
    const raw = (ex.tracking_type || ex.trackingType || '').toLowerCase();
    if (raw === 'time' || raw === 'duration') return 'duration';
    if (raw === 'weight_reps') return 'weight_reps';
    return 'reps_only';
  }, []);

  const currentTrackingType = resolveTrackingType(currentExercise);

  // Current targets
  const totalSets = currentExercise?.totalSets || currentExercise?.sets || 3;
  const targetReps = getExerciseSetReps(currentExercise, currentSetIndex);
  const targetWeight =
    parseInt(String(currentExercise?.target_weight || currentExercise?.load || currentExercise?.weight || '').replace(/[^0-9]/g, '')) ||
    0;
  const targetDurationSeconds = getExerciseSetDuration(currentExercise, currentSetIndex);
  const targetRestSeconds = getExerciseRestSeconds(currentExercise);

  // Actual input states for manual sets
  const [prevSelectionKey, setPrevSelectionKey] = useState<string>(
    `${currentExerciseIndex}_${currentSetIndex}`
  );
  const [actualReps, setActualReps] = useState<number>(targetReps);
  const [actualWeight, setActualWeight] = useState<number>(targetWeight);

  const currentSelectionKey = `${currentExerciseIndex}_${currentSetIndex}`;
  if (prevSelectionKey !== currentSelectionKey) {
    setPrevSelectionKey(currentSelectionKey);
    setActualReps(targetReps);
    setActualWeight(targetWeight);
  }

  // Cadence Pacing State
  const [cadenceMode, setCadenceMode] = useState<'auto' | 'free'>(initialCadenceMode);
  const [audioPacerMode, setAudioPacerMode] = useState<AudioPacerMode>(initialAudioPacerMode);

  const cadenceProfile = resolveExerciseCadence(
    currentExercise,
    currentSetIndex,
    targetDurationSeconds,
    targetReps
  );

  const isCadenceActive = Boolean(
    cadenceProfile &&
    cadenceProfile.enabled &&
    cadenceMode === 'auto'
  );

  const [currentRepNumber, setCurrentRepNumber] = useState<number>(1);
  const [currentCadencePhase, setCurrentCadencePhase] = useState<CadencePhase | null>(
    cadenceProfile?.phases?.[0] || null
  );
  const [cadencePhaseSecondsRemaining, setCadencePhaseSecondsRemaining] = useState<number>(
    cadenceProfile ? (cadenceProfile.phases[0]?.durationMs || 0) / 1000 : 0
  );
  const [cadencePhaseProgress, setCadencePhaseProgress] = useState<number>(0);
  const [cadenceRepProgress, setCadenceRepProgress] = useState<number>(0);
  const [elapsedWorkMs, setElapsedWorkMs] = useState<number>(0);

  // Synchronized refs for cadence engine loop
  const stateRef = useRef<WorkoutState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const cadenceProfileRef = useRef<CadenceProfile | null>(cadenceProfile);
  useEffect(() => {
    cadenceProfileRef.current = cadenceProfile;
  }, [cadenceProfile]);

  const cadenceModeRef = useRef<'auto' | 'free'>(cadenceMode);
  useEffect(() => {
    cadenceModeRef.current = cadenceMode;
  }, [cadenceMode]);

  const audioPacerModeRef = useRef<AudioPacerMode>(audioPacerMode);
  useEffect(() => {
    audioPacerModeRef.current = audioPacerMode;
  }, [audioPacerMode]);

  const lastCompletedRepIndexRef = useRef<number>(0);
  const lastPlayedPhaseKeyRef = useRef<string>('');
  const lastPeakRepRef = useRef<number>(-1);
  const lastMetronomeSecRef = useRef<number>(-1);
  const lastBeepMsRef = useRef<number>(-1);

  // Update cadence phase defaults when exercise/set changes
  useEffect(() => {
    if (cadenceProfile) {
      setCurrentRepNumber(1);
      setCurrentCadencePhase(cadenceProfile.phases[0] || null);
      setCadencePhaseSecondsRemaining((cadenceProfile.phases[0]?.durationMs || 0) / 1000);
      setCadencePhaseProgress(0);
      setCadenceRepProgress(0);
    }
    lastCompletedRepIndexRef.current = 0;
    lastPlayedPhaseKeyRef.current = '';
    lastPeakRepRef.current = -1;
    lastMetronomeSecRef.current = -1;
    lastBeepMsRef.current = -1;
  }, [currentExerciseIndex, currentSetIndex]);

  // Synchronize exercise-specific default audio pacer (e.g. Cat-Cow -> 'pulse')
  useEffect(() => {
    if (cadenceProfile?.defaultAudioPacer) {
      setAudioPacerMode(cadenceProfile.defaultAudioPacer);
    }
  }, [currentExerciseIndex, cadenceProfile?.defaultAudioPacer]);

  // Sensory feedback helpers
  const playSound = useCallback(
    async (type: SoundType) => {
      if (isAudioMuted) return;

      // Web Audio API fallback for ultra low-latency synthesis on Web
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            if (ctx.state === 'suspended') {
              await ctx.resume();
            }

            if (type === 'pip') {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              gain.gain.setValueAtTime(0.3, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
              osc.start(ctx.currentTime);
              osc.stop(ctx.currentTime + 0.15);
              return;
            }

            if (type === 'cadence_up') {
              // Rising tone 480Hz -> 540Hz (Flexion/Inhale)
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(480, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(540, ctx.currentTime + 0.28);
              gain.gain.setValueAtTime(0.01, ctx.currentTime);
              gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.04);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
              osc.start(ctx.currentTime);
              osc.stop(ctx.currentTime + 0.32);
              return;
            }

            if (type === 'cadence_down') {
              // Descending tone 420Hz -> 360Hz (Extension/Exhale)
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(420, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(360, ctx.currentTime + 0.28);
              gain.gain.setValueAtTime(0.01, ctx.currentTime);
              gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.04);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
              osc.start(ctx.currentTime);
              osc.stop(ctx.currentTime + 0.32);
              return;
            }

            if (type === 'rep_ding') {
              // Dual harmonic bell chime: 880Hz + 1320Hz + 1760Hz
              const playChimeTone = (freq: number, vol: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                gain.gain.setValueAtTime(vol, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.65);
              };
              playChimeTone(880, 0.3);
              playChimeTone(1320, 0.18);
              playChimeTone(1760, 0.08);
              return;
            }

            if (type === 'metronome_tick') {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(1200, ctx.currentTime);
              gain.gain.setValueAtTime(0.25, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);
              osc.start(ctx.currentTime);
              osc.stop(ctx.currentTime + 0.04);
              return;
            }

            if (type === 'metronome_tick_high') {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(1520, ctx.currentTime);
              gain.gain.setValueAtTime(0.25, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);
              osc.start(ctx.currentTime);
              osc.stop(ctx.currentTime + 0.04);
              return;
            }

            if (type === 'metronome_extend') {
              // Higher, brighter accented tone at the extend/peak point (1750Hz)
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(1750, ctx.currentTime);
              gain.gain.setValueAtTime(0.32, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.048);
              osc.start(ctx.currentTime);
              osc.stop(ctx.currentTime + 0.05);
              return;
            }

            if (type === 'metronome_return') {
              // Lower, grounding resonant tone at the return/dip point (880Hz)
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              gain.gain.setValueAtTime(0.34, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.052);
              osc.start(ctx.currentTime);
              osc.stop(ctx.currentTime + 0.055);
              return;
            }

            if (type === 'chime') {
              // 3-tone harmonic major chime
              const playTone = (freq: number, startDelay: number, dur: number) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.type = 'sine';
                o.connect(g);
                g.connect(ctx.destination);
                o.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);
                g.gain.setValueAtTime(0.25, ctx.currentTime + startDelay);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + dur);
                o.start(ctx.currentTime + startDelay);
                o.stop(ctx.currentTime + startDelay + dur + 0.05);
              };
              playTone(523.25, 0, 0.45); // C5
              playTone(659.25, 0.08, 0.45); // E5
              playTone(783.99, 0.16, 0.55); // G5
              return;
            }
          }
        } catch {}
      }

      // Modern expo-audio playback (Expo SDK 57)
      if (nativeAudioModule?.type === 'expo-audio' && nativeAudioModule.createPlayer) {
        try {
          // Zero-latency round-robin pool for fast, high-frequency metronome ticks
          if (type === 'metronome_tick' && tickPlayersPoolRef.current.length > 0) {
            const pool = tickPlayersPoolRef.current;
            const idx = tickPoolIndexRef.current;
            tickPoolIndexRef.current = (idx + 1) % pool.length;
            const p = pool[idx];
            if (p) {
              if (p.currentTime > 0) {
                p.seekTo(0).then(() => p.play()).catch(() => p.play());
              } else {
                p.play();
              }
              // Immediately schedule zeroing out position in background ready for next cycle
              setTimeout(() => {
                p.seekTo(0).catch(() => {});
              }, 60);
              return;
            }
          }

          // Zero-latency round-robin pool for warning metronome_tick_high ticks
          if (type === 'metronome_tick_high' && tickHighPlayersPoolRef.current.length > 0) {
            const pool = tickHighPlayersPoolRef.current;
            const idx = tickHighPoolIndexRef.current;
            tickHighPoolIndexRef.current = (idx + 1) % pool.length;
            const p = pool[idx];
            if (p) {
              if (p.currentTime > 0) {
                p.seekTo(0).then(() => p.play()).catch(() => p.play());
              } else {
                p.play();
              }
              setTimeout(() => {
                p.seekTo(0).catch(() => {});
              }, 60);
              return;
            }
          }

          let player = soundPlayersRef.current[type];
          if (!player) {
            const uri = soundUrisRef.current[type] || SOUND_ASSETS[type];
            player = nativeAudioModule.createPlayer(uri);
            player.volume = 1.0;
            soundPlayersRef.current[type] = player;
          }

          if (player) {
            if (player.currentTime > 0) {
              player.seekTo(0).then(() => {
                player.play();
              }).catch(() => {
                player.play();
              });
            } else {
              player.play();
            }
            return;
          }
        } catch (e) {
          console.warn(`[useWorkoutPlayer] expo-audio play error (${type}):`, e);
        }
      }

      // Legacy expo-av playback if linked
      if (nativeAudioModule?.type === 'expo-av' && nativeAudioModule.Sound) {
        try {
          let soundObj = soundPlayersRef.current[type];
          if (!soundObj) {
            const uri = soundUrisRef.current[type] || SOUND_ASSETS[type];
            const source = typeof uri === 'string' ? { uri } : uri;
            const { sound } = await nativeAudioModule.Sound.createAsync(
              source,
              { shouldPlay: true, volume: 1.0 }
            );
            soundPlayersRef.current[type] = sound;
            return;
          } else {
            await soundObj.setPositionAsync(0);
            await soundObj.playAsync();
            return;
          }
        } catch (e) {
          console.warn(`[useWorkoutPlayer] expo-av play error (${type}):`, e);
        }
      }
    },
    [isAudioMuted]
  );

  const triggerHaptic = useCallback(async (type: 'light' | 'heavy' | 'success') => {
    try {
      if (type === 'light') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } else if (type === 'heavy') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      } else if (type === 'success') {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
          });
        } catch {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        }
      }
    } catch {
      // Graceful no-op on platforms/simulators without native haptics hardware
    }
  }, []);

  // Timer interval engine with automated sub-rep cadence biofeedback
  const startIntervalTimer = useCallback(
    (
      durationMs: number,
      onComplete: () => void,
      customEndTime?: number,
      totalDurationMsOverride?: number
    ) => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      totalDurationMsRef.current = totalDurationMsOverride || durationMs;
      endTimeRef.current = customEndTime || Date.now() + durationMs;

      if (!customEndTime && !totalDurationMsOverride) {
        lastCompletedRepIndexRef.current = 0;
        lastPlayedPhaseKeyRef.current = '';
        lastMetronomeSecRef.current = -1;
        lastBeepMsRef.current = -1;
      }

      const currentRemainingMs = Math.max(0, endTimeRef.current - Date.now());
      const initialRemainingSec = Math.ceil(currentRemainingMs / 1000);
      setSecondsRemaining(initialRemainingSec);
      setProgress(
        totalDurationMsRef.current > 0
          ? Math.min(1, Math.max(0, 1 - currentRemainingMs / totalDurationMsRef.current))
          : 0
      );

      let lastReportedSec = initialRemainingSec;

      // When starting a countdown (e.g. 5s Lead-In or 5s Rest Prep),
      // play the first tick immediately on the exact first second (e.g. 5)!
      if (
        !customEndTime &&
        (stateRef.current === 'LEAD_IN' || stateRef.current === 'RESTING') &&
        initialRemainingSec <= 5 &&
        initialRemainingSec > 0
      ) {
        triggerHaptic('light');
        if (audioPacerModeRef.current !== 'mute') {
          playSound('metronome_tick');
        }
      }

      timerIntervalRef.current = setInterval(() => {
        if (!endTimeRef.current) return;

        const remainingMs = Math.max(0, endTimeRef.current - Date.now());
        const remainingSec = Math.ceil(remainingMs / 1000);
        const calculatedProgress = Math.min(
          1,
          Math.max(0, 1 - remainingMs / totalDurationMsRef.current)
        );

        setSecondsRemaining(remainingSec);
        setProgress(calculatedProgress);

        // Sensory tick on countdown numbers (5, 4, 3, 2, 1) during lead-in or rest prep
        if (remainingSec !== lastReportedSec) {
          lastReportedSec = remainingSec;
          if (
            remainingSec <= 5 &&
            remainingSec > 0 &&
            (stateRef.current === 'LEAD_IN' || stateRef.current === 'RESTING')
          ) {
            triggerHaptic('light');
            if (audioPacerModeRef.current !== 'mute') {
              playSound('metronome_tick');
            }
          }
        }

        // Live Cadence Engine when in ACTIVE_WORK
        if (
          stateRef.current === 'ACTIVE_WORK' &&
          cadenceProfileRef.current &&
          cadenceModeRef.current === 'auto'
        ) {
          const profile = cadenceProfileRef.current;
          const elapsedWorkMs = Math.max(0, totalDurationMsRef.current - remainingMs);

          // Calculate current rep (0 to totalReps - 1)
          const repIndex = Math.min(
            profile.totalReps - 1,
            Math.floor(elapsedWorkMs / profile.repDurationMs)
          );
          const repNumber = repIndex + 1;
          const repElapsedMs = elapsedWorkMs - repIndex * profile.repDurationMs;
          const repProg = Math.min(1, Math.max(0, repElapsedMs / profile.repDurationMs));

          // Calculate phase inside this rep
          let accumulatedMs = 0;
          let foundPhaseIndex = 0;
          let phaseElapsedMs = 0;

          for (let i = 0; i < profile.phases.length; i++) {
            const p = profile.phases[i];
            if (repElapsedMs < accumulatedMs + p.durationMs || i === profile.phases.length - 1) {
              foundPhaseIndex = i;
              phaseElapsedMs = repElapsedMs - accumulatedMs;
              break;
            }
            accumulatedMs += p.durationMs;
          }

          const currentPhase = profile.phases[foundPhaseIndex];
          const phaseProg = Math.min(1, Math.max(0, phaseElapsedMs / currentPhase.durationMs));
          const phaseSec = Math.max(0, (currentPhase.durationMs - phaseElapsedMs) / 1000);

          setCurrentRepNumber(repNumber);
          setCurrentCadencePhase(currentPhase);
          setCadencePhaseProgress(phaseProg);
          setCadenceRepProgress(repProg);
          setElapsedWorkMs(elapsedWorkMs);
          setCadencePhaseSecondsRemaining(Number(phaseSec.toFixed(1)));

          // Rep index tracking
          if (repIndex > lastCompletedRepIndexRef.current) {
            lastCompletedRepIndexRef.current = repIndex;
            if (audioPacerModeRef.current === 'tones') {
              playSound('rep_ding');
              triggerHaptic('heavy');
            }
          }

          // Active Cadence Audio Pacer:
          // In 'metronome' (Tick) mode: steady rhythmic ticks, with modified beeps
          // specifically at the EXTEND point (peak/crest reversal) and RETURN point (base reversal),
          // with a subtle pitch change (metronome_tick_high) on the final countdown seconds of each phase.
          if (audioPacerModeRef.current === 'metronome') {
            const isIsometricHoldProfile = profile.waveProfile === 'isometric_hold';
            const riseMs = profile.riseDurationMs || 1500;

            if (isIsometricHoldProfile) {
              // 1. Isometric Hold Choreography:
              const phaseKey = `${repIndex}_${foundPhaseIndex}`;
              if (lastPlayedPhaseKeyRef.current !== phaseKey) {
                lastPlayedPhaseKeyRef.current = phaseKey;
                lastBeepMsRef.current = elapsedWorkMs;

                if (foundPhaseIndex === 0) {
                  // Rep start (lift & engage from base)
                  playSound('metronome_return');
                  triggerHaptic('light');
                } else if (foundPhaseIndex === 1) {
                  // End of hold: start release & switch sides
                  playSound('metronome_return');
                  triggerHaptic('light');
                }
              }

              // Peak Extend trigger at completion of rise (e.g. at 1.5s):
              // Accented high beep signaling full extension reached and isometric hold begins
              if (repElapsedMs >= riseMs && lastPeakRepRef.current !== repIndex && foundPhaseIndex === 0) {
                lastPeakRepRef.current = repIndex;
                lastBeepMsRef.current = elapsedWorkMs;
                playSound('metronome_extend');
                triggerHaptic('light');
              }
            } else {
              // 2. Symmetric Sine / Standard Wave Choreography:
              const phaseKey = `${repIndex}_${foundPhaseIndex}`;
              if (lastPlayedPhaseKeyRef.current !== phaseKey) {
                lastPlayedPhaseKeyRef.current = phaseKey;
                lastBeepMsRef.current = elapsedWorkMs;

                if (foundPhaseIndex === 1) {
                  // EXTEND POINT: Peak reversal (e.g. Cat Arch Crest / Concentric peak)
                  // Higher-pitched crisp accented beep so user knows to reverse direction
                  playSound('metronome_extend');
                  triggerHaptic('light');
                } else if (foundPhaseIndex === 0) {
                  // RETURN POINT: Base reversal (e.g. Cow Dip Base / Starting position)
                  // Distinct grounded resonant beep so user knows to reverse direction and extend
                  playSound('metronome_return');
                  triggerHaptic('light');
                }
              }
            }

            // Intermediate steady rhythm clicks on each second between extend and return points
            const currentSecondFloor = Math.floor(elapsedWorkMs / 1000);
            if (currentSecondFloor !== lastMetronomeSecRef.current && currentSecondFloor > 0) {
              lastMetronomeSecRef.current = currentSecondFloor;
              const msSinceLastBeep = elapsedWorkMs - lastBeepMsRef.current;
              const msToNextPhase = currentPhase.durationMs - phaseElapsedMs;
              // Avoid playing a regular click if an extend or return beep just occurred or is about to occur (< 280ms)
              if (msSinceLastBeep >= 280 && msToNextPhase >= 280) {
                // Subtle pitch change for the last 2 seconds before the phase ends
                const isWarningSecond = msToNextPhase <= 2200 && msToNextPhase > 300;
                if (isWarningSecond) {
                  playSound('metronome_tick_high');
                } else {
                  playSound('metronome_tick');
                }
              }
            }
          } else if (audioPacerModeRef.current === 'tones') {
            const phaseKey = `${repIndex}_${foundPhaseIndex}`;
            if (lastPlayedPhaseKeyRef.current !== phaseKey) {
              lastPlayedPhaseKeyRef.current = phaseKey;
              if (currentPhase.soundType !== 'none') {
                playSound(currentPhase.soundType);
                triggerHaptic('light');
              }
            }
          }
        }

        if (remainingMs <= 0) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
          endTimeRef.current = null;
          onComplete();
        }
      }, 25);
    },
    [playSound, triggerHaptic]
  );

  const handleLeadInCompleteRef = useRef<() => void>(() => {});
  const handleWorkCompleteRef = useRef<(customReps?: number, customWeight?: number) => void>(() => {});
  const handleRestCompleteRef = useRef<(autoPauseNext?: boolean) => void>(() => {});

  // Rest timer restoration on hook mount (when returning from another screen during rest)
  useEffect(() => {
    if (initialState === 'RESTING') {
      if (initialEndTime && initialEndTime > Date.now()) {
        const remainingMs = initialEndTime - Date.now();
        startIntervalTimer(
          remainingMs,
          () => handleRestCompleteRef.current(false),
          initialEndTime,
          initialTotalDurationMs || (targetRestSeconds * 1000)
        );
      } else if (initialEndTime && initialEndTime <= Date.now()) {
        // Rest completed while athlete was away! Advance set, but pause next active work
        handleRestCompleteRef.current(true);
      }
    }
  }, []);

  // Background execution safety:
  // - Auto-pause ACTIVE_WORK or LEAD_IN when user turns off screen or switches apps
  // - Keep RESTING timer running in background!
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'background' || nextAppState === 'inactive') {
          if (isRestTransitioningRef.current) {
            if (restTransitionTimeoutRef.current) {
              clearTimeout(restTransitionTimeoutRef.current);
              restTransitionTimeoutRef.current = null;
            }
            isRestTransitioningRef.current = false;
            setIsRestTransitioning(false);
            setPreviousState('ACTIVE_WORK');
            wasAutoPausedRef.current = true;
            setWasAutoPaused(true);
            setState('PAUSED');
          } else if (stateRef.current === 'ACTIVE_WORK' || stateRef.current === 'LEAD_IN') {
            if (endTimeRef.current) {
              pausedRemainingMsRef.current = Math.max(0, endTimeRef.current - Date.now());
            }
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
            setPreviousState(stateRef.current);
            wasAutoPausedRef.current = true;
            setWasAutoPaused(true);
            setState('PAUSED');
          }
          // Note: If stateRef.current === 'RESTING', do NOT pause! Rest timer continues running.
        } else if (nextAppState === 'active') {
          if (wasAutoPausedRef.current || stateRef.current === 'PAUSED') {
            // Stay paused until user explicitly hits Resume
            return;
          }

          if (stateRef.current === 'RESTING' && endTimeRef.current) {
            const remainingMs = endTimeRef.current - Date.now();
            if (remainingMs <= 0) {
              if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
              endTimeRef.current = null;
              setSecondsRemaining(0);
              setProgress(1);
              // Rest finished while in background! Advance set, but pause next active work
              handleRestCompleteRef.current(true);
            } else {
              setSecondsRemaining(Math.ceil(remainingMs / 1000));
              setProgress(
                totalDurationMsRef.current > 0
                  ? Math.min(1, Math.max(0, 1 - remainingMs / totalDurationMsRef.current))
                  : 0
              );
            }
          }
        }
      }
    );

    return () => subscription.remove();
  }, []);

  // Overall workout stopwatch
  useEffect(() => {
    let stopwatch: any = null;
    if (state !== 'READY' && state !== 'PAUSED' && state !== 'COMPLETED') {
      if (!workoutStartTimestampRef.current) {
        workoutStartTimestampRef.current = Date.now();
      }
      stopwatch = setInterval(() => {
        if (workoutStartTimestampRef.current) {
          const elapsed = Math.max(
            0,
            Math.floor((Date.now() - workoutStartTimestampRef.current) / 1000)
          );
          setWorkoutElapsedSeconds(elapsed);
        }
      }, 1000);
    }
    return () => {
      if (stopwatch) clearInterval(stopwatch);
    };
  }, [state]);

  // Transitions:
  // 1. LEAD_IN -> ACTIVE_WORK
  const handleLeadInComplete = useCallback(() => {
    triggerHaptic('success');
    playSound('chime');
    setState('ACTIVE_WORK');

    lastCompletedRepIndexRef.current = 0;
    lastPlayedPhaseKeyRef.current = '';
    lastPeakRepRef.current = -1;
    lastMetronomeSecRef.current = -1;
    lastBeepMsRef.current = -1;
    setCurrentRepNumber(1);
    if (cadenceProfileRef.current) {
      setCurrentCadencePhase(cadenceProfileRef.current.phases[0] || null);
      setCadencePhaseSecondsRemaining(
        (cadenceProfileRef.current.phases[0]?.durationMs || 0) / 1000
      );
      setCadencePhaseProgress(0);
      setCadenceRepProgress(0);
    }

    setElapsedWorkMs(0);

    const hasActiveCadence = Boolean(
      cadenceProfileRef.current &&
      cadenceProfileRef.current.enabled &&
      cadenceModeRef.current === 'auto'
    );

    if (currentTrackingType === 'duration' || hasActiveCadence) {
      const workDurationMs = targetDurationSeconds * 1000;
      startIntervalTimer(workDurationMs, () => handleWorkCompleteRef.current());
    } else {
      // Manual input exercises wait for user to click "Log & Rest"
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setSecondsRemaining(targetDurationSeconds);
      setProgress(0);
    }
  }, [currentTrackingType, targetDurationSeconds, triggerHaptic, playSound, startIntervalTimer]);

  // 2. ACTIVE_WORK -> RESTING (or COMPLETED if final set of entire worksession)
  const handleWorkComplete = useCallback(
    (customReps?: number, customWeight?: number) => {
      triggerHaptic('success');
      playSound('chime');

      const curExIdx = currentExerciseIndexRef.current;
      const curSetIdx = currentSetIndexRef.current;
      const ex = exercises[curExIdx] || exercises[0];
      const tSets = ex?.totalSets || ex?.sets || 3;
      const isLastSetOfEx = curSetIdx + 1 >= tSets;
      const isLastExOfWorkout = curExIdx + 1 >= exercises.length;

      const repsToLog = typeof customReps === 'number' ? customReps : actualReps;
      const weightToLog = typeof customWeight === 'number' ? customWeight : actualWeight;
      const durationLogged =
        currentTrackingType === 'duration' ? targetDurationSeconds : 0;

      const newLog: SetResultLog = {
        exerciseIndex: curExIdx,
        exerciseName: currentExercise?.name || 'Exercise',
        setNumber: curSetIdx + 1,
        reps: repsToLog,
        weight: weightToLog,
        durationSeconds: durationLogged,
        completedAt: Date.now(),
      };

      const updatedLogs = [...loggedSets, newLog];
      setLoggedSets(updatedLogs);
      if (onSetCompleted) onSetCompleted(newLog);

      // If this was the final set of the entire worksession, do NOT run rest timer!
      // Immediately transition to COMPLETED and invoke completion callback to save session.
      if (isLastSetOfEx && isLastExOfWorkout) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
        endTimeRef.current = null;
        setState('COMPLETED');
        if (onWorkoutCompleted) {
          onWorkoutCompleted(updatedLogs, workoutElapsedSeconds);
        }
        return;
      }

      if (targetRestSeconds <= 0) {
        // Zero rest time configured: immediately advance to next set or exercise
        handleRestCompleteRef.current();
        return;
      }

      setState('RESTING');
      const restDurationMs = targetRestSeconds * 1000;
      startIntervalTimer(restDurationMs, () => handleRestCompleteRef.current());
    },
    [
      triggerHaptic,
      playSound,
      exercises,
      actualReps,
      actualWeight,
      currentTrackingType,
      targetDurationSeconds,
      currentExercise?.name,
      onSetCompleted,
      targetRestSeconds,
      startIntervalTimer,
      onWorkoutCompleted,
      loggedSets,
      workoutElapsedSeconds,
    ]
  );

  // 3. RESTING -> NEXT SET / NEXT EXERCISE / COMPLETED
  // Note: 5s prep is included in the final 5s of RESTING.
  // A clean 1-second pause is held after rest completes so chime and rep start audio don't clash.
  const handleRestComplete = useCallback((autoPauseNext: boolean = false) => {
    if (isRestTransitioningRef.current) return;

    const curExIdx = currentExerciseIndexRef.current;
    const curSetIdx = currentSetIndexRef.current;
    const ex = exercises[curExIdx] || exercises[0];
    const tSets = ex?.totalSets || ex?.sets || 3;

    const isLastSetOfEx = curSetIdx + 1 >= tSets;
    const isLastExOfWorkout = curExIdx + 1 >= exercises.length;

    if (isLastSetOfEx && isLastExOfWorkout) {
      // All exercises & sets finished!
      setState('COMPLETED');
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
      endTimeRef.current = null;
      if (onWorkoutCompleted) {
        onWorkoutCompleted(loggedSets, workoutElapsedSeconds);
      }
      return;
    }

    triggerHaptic('heavy');
    playSound('chime');

    const shouldPause = autoPauseNext || (AppState.currentState !== 'active');

    const nextExIdx = isLastSetOfEx ? curExIdx + 1 : curExIdx;
    const nextSetIdx = isLastSetOfEx ? 0 : curSetIdx + 1;

    setCurrentExerciseIndex(nextExIdx);
    setCurrentSetIndex(nextSetIdx);
    currentExerciseIndexRef.current = nextExIdx;
    currentSetIndexRef.current = nextSetIdx;

    const nextEx = exercises[nextExIdx] || exercises[0];
    const nextTrackingType = resolveTrackingType(nextEx);
    const nextDuration = getExerciseSetDuration(nextEx, nextSetIdx);
    const nextReps = getExerciseSetReps(nextEx, nextSetIdx);
    const nextCadenceProfile = resolveExerciseCadence(
      nextEx,
      nextSetIdx,
      nextDuration,
      nextReps
    );

    // Reset cadence pointers for the upcoming set
    lastCompletedRepIndexRef.current = 0;
    lastPlayedPhaseKeyRef.current = '';
    lastPeakRepRef.current = -1;
    lastMetronomeSecRef.current = -1;
    lastBeepMsRef.current = -1;
    setCurrentRepNumber(1);
    if (nextCadenceProfile) {
      setCurrentCadencePhase(nextCadenceProfile.phases[0] || null);
      setCadencePhaseSecondsRemaining(
        (nextCadenceProfile.phases[0]?.durationMs || 0) / 1000
      );
      setCadencePhaseProgress(0);
      setCadenceRepProgress(0);
    }
    setElapsedWorkMs(0);

    if (shouldPause) {
      setState('PAUSED');
      setPreviousState('ACTIVE_WORK');
      wasAutoPausedRef.current = true;
      setWasAutoPaused(true);
      pausedRemainingMsRef.current = nextDuration * 1000;
      setSecondsRemaining(nextDuration);
      setProgress(0);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    } else {
      // Hold a short 1-second pause after rest completes so chime and rep start audio don't clash
      setSecondsRemaining(0);
      setProgress(1);
      setIsRestTransitioning(true);
      isRestTransitioningRef.current = true;

      if (restTransitionTimeoutRef.current) {
        clearTimeout(restTransitionTimeoutRef.current);
      }

      restTransitionTimeoutRef.current = setTimeout(() => {
        restTransitionTimeoutRef.current = null;
        isRestTransitioningRef.current = false;
        setIsRestTransitioning(false);

        // Advance directly to ACTIVE_WORK
        setState('ACTIVE_WORK');

        const hasActiveCadence = Boolean(
          nextCadenceProfile &&
          nextCadenceProfile.enabled &&
          cadenceModeRef.current === 'auto'
        );

        if (nextTrackingType === 'duration' || hasActiveCadence) {
          const workDurationMs = nextDuration * 1000;
          startIntervalTimer(workDurationMs, () => handleWorkCompleteRef.current());
        } else {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
          endTimeRef.current = null;
          setSecondsRemaining(nextDuration);
          setProgress(0);
        }
      }, 1000);
    }
  }, [
    exercises,
    triggerHaptic,
    playSound,
    startIntervalTimer,
    onWorkoutCompleted,
    loggedSets,
    workoutElapsedSeconds,
    resolveTrackingType,
  ]);

  // Keep callback refs synchronized for cyclic state machine invocations
  useEffect(() => {
    handleLeadInCompleteRef.current = handleLeadInComplete;
    handleWorkCompleteRef.current = handleWorkComplete;
    handleRestCompleteRef.current = handleRestComplete;
  }, [handleLeadInComplete, handleWorkComplete, handleRestComplete]);

  // Actions for the athlete:
  const startWorkout = useCallback(() => {
    if (state === 'READY') {
      workoutStartTimestampRef.current = Date.now();
      stateRef.current = 'LEAD_IN';
      setState('LEAD_IN');
      startIntervalTimer(leadInDurationSeconds * 1000, handleLeadInComplete);
    }
  }, [state, leadInDurationSeconds, startIntervalTimer, handleLeadInComplete]);

  const startGuidedSet = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    stateRef.current = 'LEAD_IN';
    setState('LEAD_IN');
    startIntervalTimer(leadInDurationSeconds * 1000, handleLeadInComplete);
  }, [leadInDurationSeconds, startIntervalTimer, handleLeadInComplete]);

  const resetGuided = useCallback(() => {
    if (restTransitionTimeoutRef.current) {
      clearTimeout(restTransitionTimeoutRef.current);
      restTransitionTimeoutRef.current = null;
    }
    isRestTransitioningRef.current = false;
    setIsRestTransitioning(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
    endTimeRef.current = null;
    setState('READY');
    setSecondsRemaining(leadInDurationSeconds);
    setProgress(0);
    setElapsedWorkMs(0);
  }, [leadInDurationSeconds]);

  const syncPosition = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      if (restTransitionTimeoutRef.current) {
        clearTimeout(restTransitionTimeoutRef.current);
        restTransitionTimeoutRef.current = null;
      }
      isRestTransitioningRef.current = false;
      setIsRestTransitioning(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
      endTimeRef.current = null;
      setCurrentExerciseIndex(exerciseIndex);
      setCurrentSetIndex(setIndex);
      setState('READY');
      setSecondsRemaining(leadInDurationSeconds);
      setProgress(0);
      setElapsedWorkMs(0);
    },
    [leadInDurationSeconds]
  );

  const pause = useCallback((isAuto: any = false) => {
    const isAutoBool = typeof isAuto === 'boolean' ? isAuto : false;
    if (state === 'PAUSED' || state === 'COMPLETED' || state === 'READY') return;
    if (isRestTransitioningRef.current) {
      if (restTransitionTimeoutRef.current) {
        clearTimeout(restTransitionTimeoutRef.current);
        restTransitionTimeoutRef.current = null;
      }
      isRestTransitioningRef.current = false;
      setIsRestTransitioning(false);
      setPreviousState('ACTIVE_WORK');
      wasAutoPausedRef.current = isAutoBool;
      setWasAutoPaused(isAutoBool);
      setState('PAUSED');
      return;
    }
    if (endTimeRef.current) {
      pausedRemainingMsRef.current = Math.max(0, endTimeRef.current - Date.now());
    }
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
    setPreviousState(state);
    wasAutoPausedRef.current = isAutoBool;
    setWasAutoPaused(isAutoBool);
    setState('PAUSED');
  }, [state]);

  const resume = useCallback(() => {
    if (state !== 'PAUSED') return;
    const remainingMs = pausedRemainingMsRef.current;
    const nextState = previousState || 'ACTIVE_WORK';
    wasAutoPausedRef.current = false;
    setWasAutoPaused(false);
    setState(nextState);

    if (nextState === 'LEAD_IN') {
      startIntervalTimer(remainingMs, handleLeadInComplete);
    } else if (
      nextState === 'ACTIVE_WORK' &&
      (currentTrackingType === 'duration' ||
        Boolean(
          cadenceProfileRef.current &&
          cadenceProfileRef.current.enabled &&
          cadenceModeRef.current === 'auto'
        ))
    ) {
      startIntervalTimer(remainingMs, handleWorkComplete);
    } else if (nextState === 'RESTING') {
      startIntervalTimer(remainingMs, () => handleRestComplete(false));
    }
  }, [
    state,
    previousState,
    currentTrackingType,
    startIntervalTimer,
    handleLeadInComplete,
    handleWorkComplete,
    handleRestComplete,
  ]);

  const skipLeadIn = useCallback(() => {
    if (state === 'LEAD_IN') {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      handleLeadInComplete();
    }
  }, [state, handleLeadInComplete]);

  const completeWorkSet = useCallback(
    (customReps?: number, customWeight?: number) => {
      if (state === 'ACTIVE_WORK') {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        handleWorkComplete(customReps, customWeight);
      }
    },
    [state, handleWorkComplete]
  );

  const skipRest = useCallback(() => {
    if (state === 'RESTING') {
      if (isRestTransitioningRef.current) return;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      handleRestComplete();
    }
  }, [state, handleRestComplete]);

  const addRestSeconds = useCallback((extraSeconds: number) => {
    if (isRestTransitioningRef.current) {
      if (restTransitionTimeoutRef.current) {
        clearTimeout(restTransitionTimeoutRef.current);
        restTransitionTimeoutRef.current = null;
      }
      isRestTransitioningRef.current = false;
      setIsRestTransitioning(false);
      startIntervalTimer(extraSeconds * 1000, () => handleRestCompleteRef.current());
      return;
    }
    if (endTimeRef.current) {
      endTimeRef.current += extraSeconds * 1000;
      totalDurationMsRef.current += extraSeconds * 1000;
      const remainingMs = Math.max(0, endTimeRef.current - Date.now());
      setSecondsRemaining(Math.ceil(remainingMs / 1000));
    }
  }, [startIntervalTimer]);

  const nextExercise = useCallback(() => {
    if (currentExerciseIndex < exercises.length - 1) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setCurrentExerciseIndex((prev) => prev + 1);
      setCurrentSetIndex(0);
      stateRef.current = 'LEAD_IN';
      setState('LEAD_IN');
      startIntervalTimer(leadInDurationSeconds * 1000, handleLeadInComplete);
    }
  }, [currentExerciseIndex, exercises.length, leadInDurationSeconds, startIntervalTimer, handleLeadInComplete]);

  const previousExercise = useCallback(() => {
    if (currentExerciseIndex > 0) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setCurrentExerciseIndex((prev) => prev - 1);
      setCurrentSetIndex(0);
      stateRef.current = 'LEAD_IN';
      setState('LEAD_IN');
      startIntervalTimer(leadInDurationSeconds * 1000, handleLeadInComplete);
    }
  }, [currentExerciseIndex, leadInDurationSeconds, startIntervalTimer, handleLeadInComplete]);

  const finishWorkout = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setState('COMPLETED');
    if (onWorkoutCompleted) {
      onWorkoutCompleted(loggedSets, workoutElapsedSeconds);
    }
  }, [loggedSets, workoutElapsedSeconds, onWorkoutCompleted]);

  const getSessionSnapshot = useCallback(() => {
    return {
      state,
      previousState,
      secondsRemaining,
      endTime: endTimeRef.current,
      totalDurationMs: totalDurationMsRef.current,
      pausedRemainingMs: pausedRemainingMsRef.current,
      wasAutoPaused: wasAutoPausedRef.current,
      currentExerciseIndex,
      currentSetIndex,
      cadenceMode,
      audioPacerMode,
    };
  }, [
    state,
    previousState,
    secondsRemaining,
    currentExerciseIndex,
    currentSetIndex,
    cadenceMode,
    audioPacerMode,
  ]);

  return {
    // Machine state
    state,
    previousState,
    wasAutoPaused,
    setWasAutoPaused,
    isPaused: state === 'PAUSED',
    isActive: state !== 'READY' && state !== 'COMPLETED',
    isResting: state === 'RESTING',
    isRestPrepPeriod:
      (state === 'RESTING' || (state === 'PAUSED' && previousState === 'RESTING')) &&
      secondsRemaining <= 5 &&
      secondsRemaining > 0,
    isRestTransitioning,
    isWork: state === 'ACTIVE_WORK',
    isLeadIn: state === 'LEAD_IN',
    isCompleted: state === 'COMPLETED',

    // Exercise & set progress
    currentExerciseIndex,
    currentExercise,
    currentSet: currentSetIndex + 1,
    totalSets,
    totalExercises: exercises.length,
    trackingType: currentTrackingType,

    // Target metrics
    targetReps,
    targetWeight,
    targetDurationSeconds,
    targetRestSeconds,

    // Live countdown & progress ring values
    secondsRemaining,
    endTime: endTimeRef.current,
    totalDurationMs: totalDurationMsRef.current,
    pausedRemainingMs: pausedRemainingMsRef.current,
    progress, // 0 -> 1 for SVG circular rings
    workoutElapsedSeconds,

    // User inputs for manual lifting
    actualReps,
    setActualReps,
    actualWeight,
    setActualWeight,

    // Sensory feedback
    playSound,
    triggerHaptic,
    isAudioMuted,
    setIsAudioMuted,

    // Cadence Pacing System
    isCadenceActive,
    cadenceProfile,
    cadenceMode,
    setCadenceMode,
    audioPacerMode,
    setAudioPacerMode,
    currentRepNumber,
    currentCadencePhase,
    cadencePhaseSecondsRemaining,
    cadencePhaseProgress,
    cadenceRepProgress,
    elapsedWorkMs,

    // Completed logs
    loggedSets,

    // State machine commands
    startWorkout,
    startGuidedSet,
    resetGuided,
    syncPosition,
    pause,
    resume,
    skipLeadIn,
    completeWorkSet,
    skipRest,
    addRestSeconds,
    nextExercise,
    previousExercise,
    finishWorkout,
    getSessionSnapshot,
  };
}
