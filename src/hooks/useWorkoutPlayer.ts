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
  inter_set_rest_seconds?: number;
  transition_rest_seconds?: number;
  default_inter_set_rest_seconds?: number;
  default_transition_rest_seconds?: number;
  target_rest_seconds?: number;
  restSeconds?: number;
  target_duration_seconds?: number;
  target_time?: number;
  hold_seconds_per_rep?: number;
  reset_seconds_per_rep?: number;
  seconds_per_rep?: number;
  transition_seconds?: number;
  high_phase_name?: string;
  low_phase_name?: string;
  is_unilateral?: boolean;
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
  initialCurrentRepNumber?: number;
  initialElapsedWorkMs?: number;
  onSetCompleted?: (log: SetResultLog) => void;
  onWorkoutCompleted?: (allLogs: SetResultLog[], totalDurationSeconds: number) => void;
  onStateChange?: (snapshot: any) => void;
}

// Bundled sound assets for countdown pips, transition chimes, and cadence audio pacing
const PIP_SOUND_ASSET = require('../../assets/sounds/pip.wav');
const CHIME_SOUND_ASSET = require('../../assets/sounds/chime.wav');
const GONG_SOUND_ASSET = require('../../assets/sounds/gong.wav');
const STATE_BEEP_ASSET = require('../../assets/sounds/state_beep.wav');
const CADENCE_UP_ASSET = require('../../assets/sounds/cadence_up.wav');
const CADENCE_DOWN_ASSET = require('../../assets/sounds/cadence_down.wav');
const REP_DING_ASSET = require('../../assets/sounds/rep_ding.wav');
const METRONOME_TICK_ASSET = require('../../assets/sounds/metronome_tick.wav');
const METRONOME_TICK_HIGH_ASSET = require('../../assets/sounds/metronome_tick_high.wav');
const METRONOME_EXTEND_ASSET = require('../../assets/sounds/state_beep.wav');
const METRONOME_RETURN_ASSET = require('../../assets/sounds/state_beep.wav');

// Shared AudioContext singleton for low-latency Web Audio synthesis without context exhaustion
let sharedWebAudioCtx: any = null;
const getWebAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!sharedWebAudioCtx || sharedWebAudioCtx.state === 'closed') {
    sharedWebAudioCtx = new AudioContextClass();
  }
  if (sharedWebAudioCtx.state === 'suspended') {
    sharedWebAudioCtx.resume().catch(() => {});
  }
  return sharedWebAudioCtx;
};

export type SoundType =
  | 'pip'
  | 'chime'
  | 'gong'
  | 'state_beep'
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
  gong: GONG_SOUND_ASSET,
  state_beep: STATE_BEEP_ASSET,
  cadence_up: CADENCE_UP_ASSET,
  cadence_down: CADENCE_DOWN_ASSET,
  rep_ding: REP_DING_ASSET,
  metronome_tick: METRONOME_TICK_ASSET,
  metronome_tick_high: METRONOME_TICK_HIGH_ASSET,
  metronome_extend: STATE_BEEP_ASSET,
  metronome_return: STATE_BEEP_ASSET,
  cadence_pulse: METRONOME_TICK_ASSET,
};

export type TrapezoidPhaseType = 'ramp_up' | 'high_plateau' | 'ramp_down' | 'low_plateau';

export interface CadencePhase {
  id: string;
  name: string;
  shortName: string;
  cue: string;
  durationMs: number;
  soundType: 'cadence_up' | 'cadence_down' | 'pip' | 'none';
  accentColor: string;
  trapezoidType?: TrapezoidPhaseType;
}

export interface CadenceProfile {
  enabled: boolean;
  exerciseName: string;
  totalReps: number;
  totalDurationMs: number;
  repDurationMs: number;
  phases: CadencePhase[];
  visualType?: 'trapezoid' | 'sine_wave' | 'circle';
  defaultAudioPacer?: AudioPacerMode;

  // Universal 4-phase trapezoid parameters
  lowDurationMs: number;
  rampUpDurationMs: number;
  highDurationMs: number;
  rampDownDurationMs: number;
  highPhaseName: string;
  lowPhaseName: string;
  isUnilateral?: boolean;

  // Compatibility aliases
  waveProfile?: 'trapezoid' | 'symmetric_sine' | 'isometric_hold' | 'skewed_tempo';
  holdDurationMs?: number;
  resetDurationMs?: number;
  riseDurationMs?: number;
}

/**
 * Helper to build a clean 4-phase universal trapezoid profile
 */
export const buildTrapezoidProfile = ({
  exerciseName,
  totalReps,
  rampUpMs,
  highMs,
  rampDownMs,
  lowMs,
  highPhaseName,
  lowPhaseName,
  highCue,
  lowCue,
  isUnilateral = false,
  defaultAudioPacer = 'metronome',
}: {
  exerciseName: string;
  totalReps: number;
  rampUpMs: number;
  highMs: number;
  rampDownMs: number;
  lowMs: number;
  highPhaseName: string;
  lowPhaseName: string;
  highCue: string;
  lowCue: string;
  isUnilateral?: boolean;
  defaultAudioPacer?: AudioPacerMode;
}): CadenceProfile => {
  const repDurationMs = Math.max(1500, rampUpMs + highMs + rampDownMs + lowMs);
  const totalDurationMs = repDurationMs * totalReps;

  const phases: CadencePhase[] = [
    {
      id: 'ramp_up',
      name: `LIFT INTO ${highPhaseName.toUpperCase()}`,
      shortName: 'LIFT',
      cue: 'Controlled dynamic transition into peak position',
      durationMs: rampUpMs,
      soundType: 'cadence_up',
      accentColor: '#38BDF8',
      trapezoidType: 'ramp_up',
    },
    {
      id: 'high_plateau',
      name: highPhaseName.toUpperCase(),
      shortName: 'HOLD',
      cue: highCue,
      durationMs: highMs,
      soundType: 'none',
      accentColor: '#0284C7',
      trapezoidType: 'high_plateau',
    },
    {
      id: 'ramp_down',
      name: `LOWER INTO ${lowPhaseName.toUpperCase()}`,
      shortName: 'LOWER',
      cue: 'Controlled smooth return back to resting base',
      durationMs: rampDownMs,
      soundType: 'cadence_down',
      accentColor: '#F59E0B',
      trapezoidType: 'ramp_down',
    },
    {
      id: 'low_plateau',
      name: lowPhaseName.toUpperCase(),
      shortName: isUnilateral ? 'SWITCH' : 'BASE',
      cue: lowCue,
      durationMs: lowMs,
      soundType: 'none',
      accentColor: '#10B981',
      trapezoidType: 'low_plateau',
    },
  ];

  return {
    enabled: true,
    exerciseName,
    totalReps,
    totalDurationMs,
    repDurationMs,
    phases,
    visualType: 'trapezoid',
    defaultAudioPacer,
    lowDurationMs: lowMs,
    rampUpDurationMs: rampUpMs,
    highDurationMs: highMs,
    rampDownDurationMs: rampDownMs,
    highPhaseName,
    lowPhaseName,
    isUnilateral,
    waveProfile: 'trapezoid',
    holdDurationMs: highMs,
    resetDurationMs: lowMs,
    riseDurationMs: rampUpMs,
  };
};

/**
 * Resolves an automated cadence pacing profile for exercises requiring controlled tempo,
 * rhythmic breathing, or structured isometric holds using the universal trapezoid model.
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
        : 5.0;
    const rampMs = Math.round((ex.transition_seconds || 0.5) * 1000);

    // Calculate symmetric plateau durations for Cat arch and Cow dip from secPerRep
    const totalTransitionMs = rampMs * 2;
    const totalPlateauMs = Math.max(1000, Math.round(secPerRep * 1000) - totalTransitionMs);
    const symmetricHalfMs = Math.round(totalPlateauMs / 2);

    // If hold_seconds_per_rep & reset_seconds_per_rep are explicitly set AND sum with transitions to secPerRep, honor them;
    // otherwise dynamically derive symmetric holds so secPerRep is always strictly satisfied!
    const hasExplicitHoldsMatchingSec =
      typeof ex.hold_seconds_per_rep === 'number' &&
      typeof ex.reset_seconds_per_rep === 'number' &&
      Math.abs((ex.hold_seconds_per_rep + ex.reset_seconds_per_rep + (rampMs * 2) / 1000) - secPerRep) < 0.1;

    const holdMs = hasExplicitHoldsMatchingSec
      ? Math.round(ex.hold_seconds_per_rep! * 1000)
      : typeof ex.hold_seconds_per_rep === 'number' && ex.hold_seconds_per_rep > 0 && !ex.reset_seconds_per_rep
      ? Math.round(ex.hold_seconds_per_rep * 1000)
      : symmetricHalfMs;

    const resetMs = hasExplicitHoldsMatchingSec
      ? Math.round(ex.reset_seconds_per_rep! * 1000)
      : Math.max(500, Math.round(secPerRep * 1000) - totalTransitionMs - holdMs);

    return buildTrapezoidProfile({
      exerciseName: ex.name,
      totalReps: reps,
      rampUpMs: rampMs,
      highMs: holdMs,
      rampDownMs: rampMs,
      lowMs: resetMs,
      highPhaseName: ex.high_phase_name || 'Cat (Arch Up)',
      lowPhaseName: ex.low_phase_name || 'Cow (Dip Down)',
      highCue: 'Hold full Cat arch at peak spinal flexion',
      lowCue: 'Hold gentle Cow dip through pain-free extension',
      isUnilateral: false,
    });
  }

  // 2. Diaphragmatic / Box Breathing
  if (nameLower.includes('breath') || cueLower.includes('breathing')) {
    const reps = targetReps > 0 ? targetReps : 10;
    const secPerRep =
      typeof ex.seconds_per_rep === 'number' && ex.seconds_per_rep > 0
        ? ex.seconds_per_rep
        : 6.0;
    const halfSec = secPerRep / 2;
    const rampMs = Math.round(Math.min(1.5, halfSec * 0.4) * 1000);
    const holdMs = Math.round((halfSec - rampMs / 1000) * 1000);

    return buildTrapezoidProfile({
      exerciseName: ex.name,
      totalReps: reps,
      rampUpMs: rampMs,
      highMs: holdMs,
      rampDownMs: rampMs,
      lowMs: holdMs,
      highPhaseName: ex.high_phase_name || 'Inhale (Expand)',
      lowPhaseName: ex.low_phase_name || 'Exhale (Core Brace)',
      highCue: 'Inhale through nose, expanding ribcage 360°',
      lowCue: 'Slow continuous exhale, gentle abdominal draw-in',
      isUnilateral: false,
    });
  }

  // 3. Stuart McGill Protocol Descending Pyramids (Bird-Dog, McGill Curl-up, Side Plank)
  const isMcGill =
    nameLower.includes('mcgill') ||
    nameLower.includes('bird-dog') ||
    (nameLower.includes('side plank') && cueLower.includes('pyramid'));
  if (isMcGill) {
    const reps = targetReps > 0 ? targetReps : setIndex === 0 ? 5 : setIndex === 1 ? 3 : 1;
    const isMcGillCurl = nameLower.includes('mcgill');
    const isBirdDog = nameLower.includes('bird-dog') || nameLower.includes('bird dog');
    const holdSec =
      typeof ex.hold_seconds_per_rep === 'number' && ex.hold_seconds_per_rep > 0
        ? ex.hold_seconds_per_rep
        : 10.0;
    const resetSec =
      typeof ex.reset_seconds_per_rep === 'number' && ex.reset_seconds_per_rep >= 0
        ? ex.reset_seconds_per_rep
        : 2.0;
    const transSec =
      typeof ex.transition_seconds === 'number' && ex.transition_seconds > 0
        ? ex.transition_seconds
        : 1.0;

    return buildTrapezoidProfile({
      exerciseName: ex.name,
      totalReps: reps,
      rampUpMs: Math.round(transSec * 1000),
      highMs: Math.round(holdSec * 1000),
      rampDownMs: Math.round(transSec * 1000),
      lowMs: Math.round(resetSec * 1000),
      highPhaseName:
        ex.high_phase_name ||
        (isMcGillCurl ? 'Tensioned Core Hold' : 'Extend & Reach Hold'),
      lowPhaseName:
        ex.low_phase_name ||
        (isMcGillCurl ? 'Release to Floor' : 'Switch Sides'),
      highCue: isMcGillCurl
        ? 'Brace abdominal wall, maintain rigid block hover'
        : 'Reach long through fingertips and heel, maintain rigid core',
      lowCue: isMcGillCurl
        ? 'Rest head and shoulders on hands on floor'
        : 'Controlled switch to opposite limbs for next rep',
      isUnilateral: isBirdDog || Boolean(ex.is_unilateral),
    });
  }

  // 4. Alternating Core Motor Control (Psoas March, Deadbug)
  const isPsoasMarch = nameLower.includes('psoas') || nameLower.includes('march');
  const isDeadbug = nameLower.includes('deadbug') || nameLower.includes('dead bug');
  if (isPsoasMarch || isDeadbug) {
    const reps = targetReps > 0 ? targetReps : 10;
    const secPerRep =
      typeof ex.seconds_per_rep === 'number' && ex.seconds_per_rep > 0
        ? ex.seconds_per_rep
        : 4.0;
    const transMs = Math.round((ex.transition_seconds || 1.0) * 1000);
    const holdMs =
      typeof ex.hold_seconds_per_rep === 'number' && ex.hold_seconds_per_rep > 0
        ? Math.round(ex.hold_seconds_per_rep * 1000)
        : 1500;
    const resetMs = Math.max(500, Math.round(secPerRep * 1000) - transMs * 2 - holdMs);

    return buildTrapezoidProfile({
      exerciseName: ex.name,
      totalReps: reps,
      rampUpMs: transMs,
      highMs: holdMs,
      rampDownMs: transMs,
      lowMs: resetMs,
      highPhaseName: ex.high_phase_name || (isPsoasMarch ? 'Knee Lift & Core Brace' : 'Limb Reach & Brace'),
      lowPhaseName: ex.low_phase_name || 'Switch Sides / Reset',
      highCue: isPsoasMarch
        ? 'Lift knee to 90°, maintain rigid lumbar neutral brace'
        : 'Reach opposite arm & leg long while keeping core rigid',
      lowCue: 'Controlled return to floor and switch to opposite side',
      isUnilateral: true,
    });
  }

  // 5. Pure Duration / Isometric Exercises (e.g. Side Plank, Front Plank, Wall Sit)
  const rawTracking = (ex.tracking_type || ex.trackingType || '').toLowerCase();
  const isPureDuration =
    rawTracking === 'duration' ||
    rawTracking === 'time' ||
    (typeof ex.target_duration_seconds === 'number' && ex.target_duration_seconds > 0) ||
    String(ex.reps || '').toLowerCase().includes('s') ||
    nameLower.includes('plank') ||
    nameLower.includes('wall sit') ||
    nameLower.includes('hollow body') ||
    nameLower.includes('isometric');

  if (isPureDuration && targetDurationSeconds > 0) {
    const durSec = targetDurationSeconds;
    const isSidePlank = nameLower.includes('side plank');
    const resetSec =
      typeof ex.reset_seconds_per_rep === 'number' && ex.reset_seconds_per_rep >= 0
        ? ex.reset_seconds_per_rep
        : isSidePlank
        ? 3.0
        : 2.0;
    const transSec =
      typeof ex.transition_seconds === 'number' && ex.transition_seconds > 0
        ? ex.transition_seconds
        : 1.0;

    // For side planks, 2 reps default = Left side and Right side
    const reps = targetReps > 0 ? targetReps : isSidePlank ? 2 : 1;

    return buildTrapezoidProfile({
      exerciseName: ex.name,
      totalReps: reps,
      rampUpMs: Math.round(transSec * 1000),
      highMs: Math.round(durSec * 1000),
      rampDownMs: Math.round(transSec * 1000),
      lowMs: Math.round(resetSec * 1000),
      highPhaseName: ex.high_phase_name || (isSidePlank ? 'Side Plank Hold' : 'Isometric Hold'),
      lowPhaseName: ex.low_phase_name || (isSidePlank ? 'Switch Sides' : 'Rest / Reset'),
      highCue: isSidePlank
        ? 'Elevate hips into rigid straight lateral line, engage obliques'
        : 'Maintain rigid full-body tension throughout the hold',
      lowCue: isSidePlank
        ? 'Lower hips smoothly and switch to opposite side'
        : 'Controlled lower to resting position',
      isUnilateral: isSidePlank || Boolean(ex.is_unilateral),
    });
  }

  // 5. Generic Paced Reps: Controlled tempo resistance or bodyweight
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
    const transMs = Math.round((ex.transition_seconds || 1.0) * 1000);
    const holdMs =
      typeof ex.hold_seconds_per_rep === 'number' && ex.hold_seconds_per_rep > 0
        ? Math.round(ex.hold_seconds_per_rep * 1000)
        : Math.round(Math.max(500, (repMs - transMs * 2) * 0.4));
    const resetMs = Math.max(500, repMs - transMs * 2 - holdMs);

    return buildTrapezoidProfile({
      exerciseName: ex.name,
      totalReps: reps,
      rampUpMs: transMs,
      highMs: holdMs,
      rampDownMs: transMs,
      lowMs: resetMs,
      highPhaseName: ex.high_phase_name || 'Peak Contraction',
      lowPhaseName: ex.low_phase_name || 'Base / Reset',
      highCue: 'Drive under tension into peak position',
      lowCue: 'Smooth controlled return to starting position',
      isUnilateral: Boolean(ex.is_unilateral),
    });
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

  // 6. Parsed from reps string (e.g. "50s", "30s", "60s")
  const repsStr = String(ex.reps || '').toLowerCase().trim();
  const rawTracking = (ex.tracking_type || ex.trackingType || '').toLowerCase();
  const isDurationType = rawTracking === 'duration' || rawTracking === 'time';

  if (repsStr.includes('s') || isDurationType) {
    const parsedDigits = parseInt(repsStr.replace(/[^0-9]/g, ''));
    if (!isNaN(parsedDigits) && parsedDigits > 0) {
      return parsedDigits;
    }
  }

  // 7. For rep-based exercises without explicit duration:
  // Estimate work duration from target reps count (e.g. 10 reps @ 4.0s = 40s)
  const repsCount = getExerciseSetReps(ex, setIndex);
  if (repsCount > 0) {
    const tempo =
      typeof secPerRep === 'number' && secPerRep > 0
        ? secPerRep
        : typeof ex.seconds_per_rep === 'number' && ex.seconds_per_rep > 0
        ? ex.seconds_per_rep
        : 4.0;
    return Math.round(repsCount * tempo);
  }

  return 45;
};

/**
 * Resolves the inter-set rest seconds (pause between sets of the SAME exercise).
 * Accurately honors 0 seconds rest (e.g. Diaphragmatic Breathing or continuous transitions).
 */
export const getExerciseInterSetRestSeconds = (
  ex: PlayerExercise | undefined
): number => {
  if (!ex) return 60;
  if (typeof ex.inter_set_rest_seconds === 'number') return ex.inter_set_rest_seconds;
  if (typeof ex.default_inter_set_rest_seconds === 'number') return ex.default_inter_set_rest_seconds;
  if (typeof ex.target_rest_seconds === 'number') return ex.target_rest_seconds;
  if (typeof ex.restSeconds === 'number') return ex.restSeconds;
  return 60;
};

/**
 * Resolves the transition rest seconds (pause triggered ONLY after completing the final set of an exercise,
 * allowing time to set up for the next movement).
 */
export const getExerciseTransitionRestSeconds = (
  ex: PlayerExercise | undefined
): number => {
  if (!ex) return 30;
  if (typeof ex.transition_rest_seconds === 'number') return ex.transition_rest_seconds;
  if (typeof ex.default_transition_rest_seconds === 'number') return ex.default_transition_rest_seconds;
  return 30;
};

/**
 * Resolves target rest seconds, supporting the final set override:
 * If on the final set of an exercise, uses transition_rest_seconds.
 * Otherwise, uses inter_set_rest_seconds.
 */
export const getExerciseRestSeconds = (
  ex: PlayerExercise | undefined,
  isFinalSetOfExercise: boolean = false
): number => {
  return isFinalSetOfExercise
    ? getExerciseTransitionRestSeconds(ex)
    : getExerciseInterSetRestSeconds(ex);
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
  initialCurrentRepNumber,
  initialElapsedWorkMs,
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
  const pausedTotalDurationMsRef = useRef<number>(
    initialTotalDurationMs || (initialDurationSeconds * 1000)
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
  const getWorkoutElapsedSeconds = useCallback(
    () =>
      workoutStartTimestampRef.current
        ? Math.max(1, Math.floor((Date.now() - workoutStartTimestampRef.current) / 1000))
        : 0,
    []
  );

  // Sound objects cached in memory
  const soundPlayersRef = useRef<Record<SoundType, any>>({
    pip: null,
    chime: null,
    gong: null,
    state_beep: null,
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
    gong: null,
    state_beep: null,
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
  // Dedicated pre-loaded player pool for state_beep (1400Hz unified transition cue)
  const stateBeepPlayersPoolRef = useRef<any[]>([]);
  const stateBeepPoolIndexRef = useRef<number>(0);
  // Dedicated pre-loaded player pool for metronome_extend (1750Hz) for instant crest reversal
  const extendPlayersPoolRef = useRef<any[]>([]);
  const extendPoolIndexRef = useRef<number>(0);
  // Dedicated pre-loaded player pool for metronome_return (880Hz) for instant base reversal
  const returnPlayersPoolRef = useRef<any[]>([]);
  const returnPoolIndexRef = useRef<number>(0);
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

          // Preload pool of 2 dedicated players for state_beep to achieve zero-latency playback
          const stateBeepSrc = soundUrisRef.current['state_beep'] || SOUND_ASSETS['state_beep'];
          if (stateBeepSrc) {
            try {
              stateBeepPlayersPoolRef.current = [
                createAudioPlayer(stateBeepSrc),
                createAudioPlayer(stateBeepSrc),
              ];
              stateBeepPlayersPoolRef.current.forEach((p) => {
                if (p) p.volume = 1.0;
              });
            } catch (poolErr) {
              console.log('[useWorkoutPlayer] State beep pool creation error:', poolErr);
            }
          }

          // Preload pool of 2 dedicated players for metronome_extend to achieve zero-latency playback
          const extendSrc = soundUrisRef.current['metronome_extend'] || SOUND_ASSETS['metronome_extend'];
          if (extendSrc) {
            try {
              extendPlayersPoolRef.current = [
                createAudioPlayer(extendSrc),
                createAudioPlayer(extendSrc),
              ];
              extendPlayersPoolRef.current.forEach((p) => {
                if (p) p.volume = 1.0;
              });
            } catch (poolErr) {
              console.log('[useWorkoutPlayer] Extend pool creation error:', poolErr);
            }
          }

          // Preload pool of 2 dedicated players for metronome_return to achieve zero-latency playback
          const returnSrc = soundUrisRef.current['metronome_return'] || SOUND_ASSETS['metronome_return'];
          if (returnSrc) {
            try {
              returnPlayersPoolRef.current = [
                createAudioPlayer(returnSrc),
                createAudioPlayer(returnSrc),
              ];
              returnPlayersPoolRef.current.forEach((p) => {
                if (p) p.volume = 1.0;
              });
            } catch (poolErr) {
              console.log('[useWorkoutPlayer] Return pool creation error:', poolErr);
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
      [
        ...tickPlayersPoolRef.current,
        ...tickHighPlayersPoolRef.current,
        ...stateBeepPlayersPoolRef.current,
        ...extendPlayersPoolRef.current,
        ...returnPlayersPoolRef.current,
      ].forEach((p) => {
        try {
          if (p?.release) p.release();
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
  const isCurrentSetFinalOfEx = currentSetIndex + 1 >= totalSets;
  const [isTransitionRest, setIsTransitionRest] = useState<boolean>(false);
  const targetRestSeconds = isTransitionRest
    ? getExerciseTransitionRestSeconds(currentExercise)
    : getExerciseRestSeconds(currentExercise, isCurrentSetFinalOfEx);

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

  // Pre-calculate initial cadence values if restoring an active or paused state
  const isRestoringWork = initialState === 'PAUSED' || initialState === 'ACTIVE_WORK';

  let initialCalculatedElapsedWorkMs = 0;
  if (isRestoringWork) {
    if (typeof initialElapsedWorkMs === 'number' && initialElapsedWorkMs >= 0) {
      initialCalculatedElapsedWorkMs = initialElapsedWorkMs;
    } else if (totalDurationMsRef.current > 0) {
      const remainingMs =
        initialState === 'PAUSED'
          ? pausedRemainingMsRef.current
          : initialEndTime
          ? Math.max(0, initialEndTime - Date.now())
          : (typeof initialSecondsRemaining === 'number' ? initialSecondsRemaining * 1000 : 0);
      initialCalculatedElapsedWorkMs = Math.max(0, totalDurationMsRef.current - remainingMs);
    }
  }

  let initialCalculatedRepIndex = 0;
  let initialCalculatedRepNumber = 1;
  let initialCalculatedPhase: CadencePhase | null = cadenceProfile?.phases?.[0] || null;
  let initialCalculatedPhaseSec = cadenceProfile?.phases?.[0] ? (cadenceProfile.phases[0].durationMs / 1000) : 0;
  let initialCalculatedPhaseProg = 0;
  let initialCalculatedRepProg = 0;

  if (isRestoringWork && cadenceProfile && cadenceProfile.enabled && cadenceProfile.repDurationMs > 0) {
    initialCalculatedRepIndex = Math.min(
      cadenceProfile.totalReps - 1,
      Math.max(0, Math.floor(initialCalculatedElapsedWorkMs / cadenceProfile.repDurationMs))
    );
    initialCalculatedRepNumber =
      typeof initialCurrentRepNumber === 'number' && initialCurrentRepNumber >= 1
        ? initialCurrentRepNumber
        : initialCalculatedRepIndex + 1;

    const repElapsedMs = initialCalculatedElapsedWorkMs - initialCalculatedRepIndex * cadenceProfile.repDurationMs;
    initialCalculatedRepProg = Math.min(1, Math.max(0, repElapsedMs / cadenceProfile.repDurationMs));

    let accumulatedMs = 0;
    let foundPhaseIndex = 0;
    let phaseElapsedMs = 0;

    for (let i = 0; i < cadenceProfile.phases.length; i++) {
      const p = cadenceProfile.phases[i];
      if (repElapsedMs < accumulatedMs + p.durationMs || i === cadenceProfile.phases.length - 1) {
        foundPhaseIndex = i;
        phaseElapsedMs = repElapsedMs - accumulatedMs;
        break;
      }
      accumulatedMs += p.durationMs;
    }

    const currentPhase = cadenceProfile.phases[foundPhaseIndex] || cadenceProfile.phases[0] || null;
    initialCalculatedPhase = currentPhase;
    if (currentPhase && currentPhase.durationMs > 0) {
      initialCalculatedPhaseProg = Math.min(1, Math.max(0, phaseElapsedMs / currentPhase.durationMs));
      initialCalculatedPhaseSec = Math.max(0, (currentPhase.durationMs - phaseElapsedMs) / 1000);
    }
  }

  const [currentRepNumber, setCurrentRepNumber] = useState<number>(initialCalculatedRepNumber);
  const [currentCadencePhase, setCurrentCadencePhase] = useState<CadencePhase | null>(initialCalculatedPhase);
  const [cadencePhaseSecondsRemaining, setCadencePhaseSecondsRemaining] = useState<number>(
    Number(initialCalculatedPhaseSec.toFixed(1))
  );
  const [cadencePhaseProgress, setCadencePhaseProgress] = useState<number>(initialCalculatedPhaseProg);
  const [cadenceRepProgress, setCadenceRepProgress] = useState<number>(initialCalculatedRepProg);
  const [elapsedWorkMs, setElapsedWorkMs] = useState<number>(initialCalculatedElapsedWorkMs);

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

  const lastCompletedRepIndexRef = useRef<number>(initialCalculatedRepIndex);
  const lastPlayedPhaseKeyRef = useRef<string>(
    isRestoringWork ? `${initialCalculatedRepIndex}_${initialCalculatedPhase?.id || 'restored'}` : ''
  );
  const lastPeakRepRef = useRef<number>(-1);
  const lastMetronomeSecRef = useRef<number>(-1);
  const lastBeepMsRef = useRef<number>(-1);
  const lastCountdownTickMsRef = useRef<number>(0);
  const lastCountdownTickSecRef = useRef<number>(-1);

  const isFirstMountRef = useRef<boolean>(true);

  // Update cadence phase defaults when exercise/set changes
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      // If we are restoring an existing active or paused state on mount, preserve calculated values
      if (initialState === 'PAUSED' || initialState === 'ACTIVE_WORK') {
        return;
      }
    }

    if (cadenceProfile) {
      setCurrentRepNumber(1);
      setCurrentCadencePhase(cadenceProfile.phases[0] || null);
      setCadencePhaseSecondsRemaining((cadenceProfile.phases[0]?.durationMs || 0) / 1000);
      setCadencePhaseProgress(0);
      setCadenceRepProgress(0);
      setElapsedWorkMs(0);
    }
    lastCompletedRepIndexRef.current = 0;
    // Set to '0_0' so metronome_return doesn't fire at t = 0 on top of the transition chime
    lastPlayedPhaseKeyRef.current = '0_0';
    lastPeakRepRef.current = -1;
    lastMetronomeSecRef.current = 0;
    lastBeepMsRef.current = 0;
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
          const ctx = getWebAudioContext();
          if (ctx) {

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

            if (type === 'state_beep' || type === 'metronome_extend' || type === 'metronome_return') {
              // Unified crisp state change cue tone (1400Hz pure sine beep)
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(1400, ctx.currentTime);
              gain.gain.setValueAtTime(0.32, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
              osc.start(ctx.currentTime);
              osc.stop(ctx.currentTime + 0.055);
              return;
            }

            if (type === 'gong') {
              // Rich multi-partial Tibetan bronze temple gong (2.4s decay)
              const f0 = 216.0;
              const partials = [
                { f: f0 * 0.5, amp: 0.35, decay: 1.1 },  // 108 Hz sub-bass
                { f: f0 * 1.0, amp: 0.50, decay: 1.0 },  // 216 Hz fundamental
                { f: f0 * 1.52, amp: 0.28, decay: 1.4 }, // 328 Hz inharmonic partial
                { f: f0 * 2.0, amp: 0.22, decay: 1.6 },  // 432 Hz octave
                { f: f0 * 2.76, amp: 0.16, decay: 2.2 }, // 596 Hz gong overtone
              ];
              partials.forEach((p) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(p.f, ctx.currentTime);
                gain.gain.setValueAtTime(p.amp * 0.38, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + Math.min(2.4, 2.2 / p.decay));
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 2.4);
              });
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
          // Zero-latency round-robin pool for state_beep (unified transition beep)
          if (
            (type === 'state_beep' || type === 'metronome_extend' || type === 'metronome_return') &&
            stateBeepPlayersPoolRef.current.length > 0
          ) {
            const pool = stateBeepPlayersPoolRef.current;
            const idx = stateBeepPoolIndexRef.current;
            stateBeepPoolIndexRef.current = (idx + 1) % pool.length;
            const p = pool[idx];
            if (p) {
              if (p.currentTime > 0) {
                p.seekTo(0).then(() => p.play()).catch(() => p.play());
              } else {
                p.play();
              }
              return;
            }
          }

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
              return;
            }
          }

          // Zero-latency round-robin pool for metronome_extend (crest reversal)
          if (type === 'metronome_extend' && extendPlayersPoolRef.current.length > 0) {
            const pool = extendPlayersPoolRef.current;
            const idx = extendPoolIndexRef.current;
            extendPoolIndexRef.current = (idx + 1) % pool.length;
            const p = pool[idx];
            if (p) {
              if (p.currentTime > 0) {
                p.seekTo(0).then(() => p.play()).catch(() => p.play());
              } else {
                p.play();
              }
              return;
            }
          }

          // Zero-latency round-robin pool for metronome_return (base reversal)
          if (type === 'metronome_return' && returnPlayersPoolRef.current.length > 0) {
            const pool = returnPlayersPoolRef.current;
            const idx = returnPoolIndexRef.current;
            returnPoolIndexRef.current = (idx + 1) % pool.length;
            const p = pool[idx];
            if (p) {
              if (p.currentTime > 0) {
                p.seekTo(0).then(() => p.play()).catch(() => p.play());
              } else {
                p.play();
              }
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
        lastCountdownTickMsRef.current = 0;
        lastCountdownTickSecRef.current = -1;
      }

      const currentRemainingMs = Math.max(0, endTimeRef.current - Date.now());
      const initialRemainingSec = Math.ceil(currentRemainingMs / 1000);
      setSecondsRemaining(initialRemainingSec);
      setProgress(
        totalDurationMsRef.current > 0
          ? Math.min(1, Math.max(0, 1 - currentRemainingMs / totalDurationMsRef.current))
          : 0
      );

      // Instantly synchronize cadence rep tracker on timer start/resume without waiting for first interval tick
      if (
        (stateRef.current === 'ACTIVE_WORK' || state === 'ACTIVE_WORK') &&
        cadenceProfileRef.current &&
        cadenceModeRef.current === 'auto'
      ) {
        const profile = cadenceProfileRef.current;
        const initialElapsedMs = Math.max(0, totalDurationMsRef.current - currentRemainingMs);
        const repIdx = Math.min(
          profile.totalReps - 1,
          Math.floor(initialElapsedMs / profile.repDurationMs)
        );
        setCurrentRepNumber(repIdx + 1);
        setElapsedWorkMs(initialElapsedMs);
      }

      // Throttled countdown tick function (strictly throttled to >= 700ms and once per second)
      const playCountdownTick = (sec: number) => {
        const now = Date.now();
        if (now - lastCountdownTickMsRef.current < 700 || lastCountdownTickSecRef.current === sec) {
          return;
        }
        lastCountdownTickMsRef.current = now;
        lastCountdownTickSecRef.current = sec;
        triggerHaptic('light');
        if (audioPacerModeRef.current !== 'mute') {
          playSound('metronome_tick');
        }
      };

      // When starting a countdown (e.g. 5s Lead-In or 5s Rest Prep),
      // play the first tick immediately on the exact first second (e.g. 5)!
      if (
        !customEndTime &&
        (stateRef.current === 'LEAD_IN' || stateRef.current === 'RESTING') &&
        initialRemainingSec <= 5 &&
        initialRemainingSec > 0
      ) {
        playCountdownTick(initialRemainingSec);
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
        if (
          remainingSec <= 5 &&
          remainingSec > 0 &&
          (stateRef.current === 'LEAD_IN' || stateRef.current === 'RESTING')
        ) {
          playCountdownTick(remainingSec);
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
          // In 'metronome' mode:
          // - High Plateau (Phase 1) entrance: state_beep (unified cue for extend / reach / arch)
          // - Low Plateau (Phase 3) entrance: state_beep (same unified cue for pause / release / switch sides)
          // - Holds and pauses remain in complete silence (no intermediate counting clicks between holds)
          if (audioPacerModeRef.current === 'metronome') {
            const phaseKey = `${repIndex}_${foundPhaseIndex}`;

            if (lastPlayedPhaseKeyRef.current !== phaseKey) {
              lastPlayedPhaseKeyRef.current = phaseKey;
              lastBeepMsRef.current = elapsedWorkMs;

              // Phase 1 (Entrance to high_plateau): Full extension / peak tension reached!
              // Phase 3 (Entrance to low_plateau): Base / floor release / pause / switch sides reached!
              if (foundPhaseIndex === 1 || foundPhaseIndex === 3) {
                playSound('state_beep');
                triggerHaptic('light');
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
    if (state !== 'READY' && state !== 'PAUSED' && state !== 'COMPLETED') {
      if (!workoutStartTimestampRef.current) {
        workoutStartTimestampRef.current = Date.now();
      }
    }
  }, [state]);

  // Transitions:
  // 1. LEAD_IN -> ACTIVE_WORK
  const handleLeadInComplete = useCallback(() => {
    triggerHaptic('success');
    playSound('chime');
    setState('ACTIVE_WORK');

    lastCompletedRepIndexRef.current = 0;
    // Set to '0_0' so metronome_return doesn't fire at t = 0 on top of the transition chime
    lastPlayedPhaseKeyRef.current = '0_0';
    lastPeakRepRef.current = -1;
    lastMetronomeSecRef.current = 0;
    lastBeepMsRef.current = 0;
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
      const workDurationMs =
        hasActiveCadence && cadenceProfileRef.current?.totalDurationMs
          ? cadenceProfileRef.current.totalDurationMs
          : targetDurationSeconds * 1000;
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
      playSound('gong');

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
        setIsTransitionRest(false);
        setState('COMPLETED');
        if (onWorkoutCompleted) {
          onWorkoutCompleted(updatedLogs, getWorkoutElapsedSeconds());
        }
        return;
      }

      // Step 2 Final Set Override logic:
      // If currentSet === totalSets (isLastSetOfEx), start rest timer using transition_rest_seconds.
      // Otherwise, use inter_set_rest_seconds.
      const effectiveRestSeconds = isLastSetOfEx
        ? getExerciseTransitionRestSeconds(currentExercise)
        : getExerciseInterSetRestSeconds(currentExercise);

      setIsTransitionRest(isLastSetOfEx);

      if (effectiveRestSeconds <= 0) {
        // Zero rest time configured: immediately advance to next set or exercise
        setIsTransitionRest(false);
        handleRestCompleteRef.current();
        return;
      }

      setState('RESTING');
      const restDurationMs = effectiveRestSeconds * 1000;
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
      currentExercise,
      onSetCompleted,
      targetRestSeconds,
      startIntervalTimer,
      onWorkoutCompleted,
      loggedSets,
      getWorkoutElapsedSeconds,
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
        onWorkoutCompleted(loggedSets, getWorkoutElapsedSeconds());
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
    setIsTransitionRest(false);

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
    // Set to '0_0' so metronome_return doesn't fire at t = 0 on top of the transition chime
    lastPlayedPhaseKeyRef.current = '0_0';
    lastPeakRepRef.current = -1;
    lastMetronomeSecRef.current = 0;
    lastBeepMsRef.current = 0;
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
          const workDurationMs =
            hasActiveCadence && nextCadenceProfile?.totalDurationMs
              ? nextCadenceProfile.totalDurationMs
              : nextDuration * 1000;
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
    getWorkoutElapsedSeconds,
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
      pausedTotalDurationMsRef.current = totalDurationMsRef.current;
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
    const totalDuration = pausedTotalDurationMsRef.current || totalDurationMsRef.current;
    const nextState = previousState || 'ACTIVE_WORK';
    wasAutoPausedRef.current = false;
    setWasAutoPaused(false);
    stateRef.current = nextState;
    setState(nextState);

    const targetEndTime = Date.now() + remainingMs;

    if (nextState === 'LEAD_IN') {
      startIntervalTimer(remainingMs, handleLeadInComplete, targetEndTime, totalDuration);
    } else if (
      nextState === 'ACTIVE_WORK' &&
      (currentTrackingType === 'duration' ||
        Boolean(
          cadenceProfileRef.current &&
          cadenceProfileRef.current.enabled &&
          cadenceModeRef.current === 'auto'
        ))
    ) {
      startIntervalTimer(remainingMs, handleWorkComplete, targetEndTime, totalDuration);
    } else if (nextState === 'RESTING') {
      startIntervalTimer(remainingMs, () => handleRestComplete(false), targetEndTime, totalDuration);
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
      onWorkoutCompleted(loggedSets, getWorkoutElapsedSeconds());
    }
  }, [loggedSets, getWorkoutElapsedSeconds, onWorkoutCompleted]);

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
      currentRepNumber,
      elapsedWorkMs,
    };
  }, [
    state,
    previousState,
    secondsRemaining,
    currentExerciseIndex,
    currentSetIndex,
    cadenceMode,
    audioPacerMode,
    currentRepNumber,
    elapsedWorkMs,
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
    isTransitionRest,
    upcomingExercise:
      isTransitionRest && currentExerciseIndex + 1 < exercises.length
        ? exercises[currentExerciseIndex + 1]
        : null,

    // Live countdown & progress ring values
    secondsRemaining,
    endTime: endTimeRef.current,
    totalDurationMs: totalDurationMsRef.current,
    pausedRemainingMs: pausedRemainingMsRef.current,
    progress, // 0 -> 1 for SVG circular rings
    workoutElapsedSeconds: getWorkoutElapsedSeconds(),

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
