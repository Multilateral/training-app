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

export interface UseWorkoutPlayerOptions {
  exercises: PlayerExercise[];
  leadInDurationSeconds?: number;
  initialExerciseIndex?: number;
  initialSetIndex?: number;
  onSetCompleted?: (log: SetResultLog) => void;
  onWorkoutCompleted?: (allLogs: SetResultLog[], totalDurationSeconds: number) => void;
}

// Bundled sound assets for countdown pips and transition chimes
const PIP_SOUND_ASSET = require('../../assets/sounds/pip.wav');
const CHIME_SOUND_ASSET = require('../../assets/sounds/chime.wav');

export function useWorkoutPlayer({
  exercises,
  leadInDurationSeconds = 5,
  initialExerciseIndex = 0,
  initialSetIndex = 0,
  onSetCompleted,
  onWorkoutCompleted,
}: UseWorkoutPlayerOptions) {
  // State Machine
  const [state, setState] = useState<WorkoutState>('READY');
  const [previousState, setPreviousState] = useState<WorkoutState>('READY');

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
  const endTimeRef = useRef<number | null>(null);
  const totalDurationMsRef = useRef<number>(leadInDurationSeconds * 1000);
  const pausedRemainingMsRef = useRef<number>(0);
  const timerIntervalRef = useRef<any>(null);

  // Time remaining & progress states for UI
  const [secondsRemaining, setSecondsRemaining] = useState<number>(leadInDurationSeconds);
  const [progress, setProgress] = useState<number>(0); // 0 (start) -> 1 (complete)

  // Overall workout time
  const workoutStartTimestampRef = useRef<number | null>(null);
  const [workoutElapsedSeconds, setWorkoutElapsedSeconds] = useState<number>(0);

  // Sound objects cached in memory
  const pipSoundRef = useRef<any>(null);
  const chimeSoundRef = useRef<any>(null);
  const pipUriRef = useRef<string | null>(null);
  const chimeUriRef = useRef<string | null>(null);
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
          const pipAsset = Asset.fromModule(PIP_SOUND_ASSET);
          const chimeAsset = Asset.fromModule(CHIME_SOUND_ASSET);
          await Promise.all([
            pipAsset.downloadAsync().catch((e: any) => console.log('[useWorkoutPlayer] pip download notice:', e)),
            chimeAsset.downloadAsync().catch((e: any) => console.log('[useWorkoutPlayer] chime download notice:', e)),
          ]);
          pipUriRef.current = pipAsset.localUri || pipAsset.uri;
          chimeUriRef.current = chimeAsset.localUri || chimeAsset.uri;
          console.log('[useWorkoutPlayer] Audio assets cached:', { pip: pipUriRef.current, chime: chimeUriRef.current });
        } catch (assetErr) {
          console.log('[useWorkoutPlayer] Asset caching notice:', assetErr);
        }

        // Preload/pre-create players for instant playback without initialization delay
        if (isMounted && nativeAudioModule?.type === 'expo-audio' && nativeAudioModule.createPlayer) {
          const pipSrc = pipUriRef.current || PIP_SOUND_ASSET;
          const chimeSrc = chimeUriRef.current || CHIME_SOUND_ASSET;
          if (!pipSoundRef.current && pipSrc) {
            pipSoundRef.current = nativeAudioModule.createPlayer(pipSrc);
            pipSoundRef.current.volume = 1.0;
          }
          if (!chimeSoundRef.current && chimeSrc) {
            chimeSoundRef.current = nativeAudioModule.createPlayer(chimeSrc);
            chimeSoundRef.current.volume = 1.0;
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
      try {
        if (pipSoundRef.current?.release) {
          pipSoundRef.current.release();
          pipSoundRef.current = null;
        }
        if (chimeSoundRef.current?.release) {
          chimeSoundRef.current.release();
          chimeSoundRef.current = null;
        }
        if (pipSoundRef.current?.unloadAsync) {
          pipSoundRef.current.unloadAsync();
          pipSoundRef.current = null;
        }
        if (chimeSoundRef.current?.unloadAsync) {
          chimeSoundRef.current.unloadAsync();
          chimeSoundRef.current = null;
        }
      } catch {}
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
  const targetReps =
    currentExercise?.target_reps ||
    parseInt(String(currentExercise?.reps || '').replace(/[^0-9]/g, '')) ||
    10;
  const targetWeight =
    parseInt(String(currentExercise?.target_weight || currentExercise?.load || currentExercise?.weight || '').replace(/[^0-9]/g, '')) ||
    0;
  const targetDurationSeconds =
    currentExercise?.target_duration_seconds ||
    currentExercise?.target_time ||
    parseInt(String(currentExercise?.reps || '').replace(/[^0-9]/g, '')) ||
    45;
  const targetRestSeconds =
    currentExercise?.target_rest_seconds ||
    currentExercise?.restSeconds ||
    60;

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

  // Sensory feedback helpers
  const playSound = useCallback(
    async (type: 'pip' | 'chime') => {
      if (isAudioMuted) return;

      // Web Audio API fallback for smooth low-latency beeps on Web
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            if (ctx.state === 'suspended') {
              await ctx.resume();
            }
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'pip') {
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              gain.gain.setValueAtTime(0.3, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
              osc.start(ctx.currentTime);
              osc.stop(ctx.currentTime + 0.15);
            } else {
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
            }
            return;
          }
        } catch {}
      }

      // Modern expo-audio playback (Expo SDK 57)
      if (nativeAudioModule?.type === 'expo-audio' && nativeAudioModule.createPlayer) {
        try {
          let player = type === 'pip' ? pipSoundRef.current : chimeSoundRef.current;
          if (!player) {
            const uri = type === 'pip' ? (pipUriRef.current || PIP_SOUND_ASSET) : (chimeUriRef.current || CHIME_SOUND_ASSET);
            player = nativeAudioModule.createPlayer(uri);
            player.volume = 1.0;
            if (type === 'pip') pipSoundRef.current = player;
            else chimeSoundRef.current = player;
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
            console.log(`[useWorkoutPlayer] expo-audio playing: ${type}`);
            return;
          }
        } catch (e) {
          console.warn('[useWorkoutPlayer] expo-audio play error:', e);
        }
      }

      // Legacy expo-av playback if linked
      if (nativeAudioModule?.type === 'expo-av' && nativeAudioModule.Sound) {
        try {
          let soundObj = type === 'pip' ? pipSoundRef.current : chimeSoundRef.current;
          if (!soundObj) {
            const uri = type === 'pip' ? (pipUriRef.current || PIP_SOUND_ASSET) : (chimeUriRef.current || CHIME_SOUND_ASSET);
            const source = typeof uri === 'string' ? { uri } : uri;
            const { sound } = await nativeAudioModule.Sound.createAsync(
              source,
              { shouldPlay: true, volume: 1.0 }
            );
            if (type === 'pip') pipSoundRef.current = sound;
            else chimeSoundRef.current = sound;
            console.log(`[useWorkoutPlayer] expo-av created & played: ${type}`);
            return;
          } else {
            await soundObj.setPositionAsync(0);
            await soundObj.playAsync();
            console.log(`[useWorkoutPlayer] expo-av replayed: ${type}`);
            return;
          }
        } catch (e) {
          console.warn('[useWorkoutPlayer] expo-av play error:', e);
        }
      }

      console.warn(`[useWorkoutPlayer] playSound(${type}) called, but no working audio engine available!`);
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

  // Cleanup sounds on unmount
  useEffect(() => {
    return () => {
      try {
        pipSoundRef.current?.unloadAsync?.().catch(() => {});
        chimeSoundRef.current?.unloadAsync?.().catch(() => {});
      } catch {}
    };
  }, []);

  // Timer interval engine
  const startIntervalTimer = useCallback(
    (durationMs: number, onComplete: () => void) => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      totalDurationMsRef.current = durationMs;
      endTimeRef.current = Date.now() + durationMs;

      setSecondsRemaining(Math.ceil(durationMs / 1000));
      setProgress(0);

      let lastReportedSec = Math.ceil(durationMs / 1000);

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

        // Sensory tick on countdown numbers (3, 2, 1)
        if (remainingSec !== lastReportedSec) {
          lastReportedSec = remainingSec;
          if (remainingSec <= 3 && remainingSec > 0) {
            triggerHaptic('light');
            playSound('pip');
          }
        }

        if (remainingMs <= 0) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
          endTimeRef.current = null;
          onComplete();
        }
      }, 100);
    },
    [playSound, triggerHaptic]
  );

  const handleLeadInCompleteRef = useRef<() => void>(() => {});
  const handleWorkCompleteRef = useRef<(customReps?: number, customWeight?: number) => void>(() => {});
  const handleRestCompleteRef = useRef<() => void>(() => {});

  // Background execution safety: recalculate when app returns from background
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active' && endTimeRef.current && state !== 'PAUSED') {
          const remainingMs = endTimeRef.current - Date.now();
          if (remainingMs <= 0) {
            // Timer expired while in background! Trigger completion immediately
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
            endTimeRef.current = null;
            setSecondsRemaining(0);
            setProgress(1);

            if (state === 'LEAD_IN') {
              handleLeadInCompleteRef.current();
            } else if (state === 'ACTIVE_WORK' && currentTrackingType === 'duration') {
              handleWorkCompleteRef.current();
            } else if (state === 'RESTING') {
              handleRestCompleteRef.current();
            }
          } else {
            // Recalculate remaining seconds correctly
            setSecondsRemaining(Math.ceil(remainingMs / 1000));
            setProgress(
              Math.min(1, Math.max(0, 1 - remainingMs / totalDurationMsRef.current))
            );
          }
        }
      }
    );

    return () => subscription.remove();
  }, [state, currentTrackingType]);

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

    if (currentTrackingType === 'duration') {
      const workDurationMs = targetDurationSeconds * 1000;
      startIntervalTimer(workDurationMs, () => handleWorkCompleteRef.current());
    } else {
      // Manual input exercises wait for user to click "Log & Rest"
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setSecondsRemaining(targetDurationSeconds);
      setProgress(0);
    }
  }, [currentTrackingType, targetDurationSeconds, triggerHaptic, playSound, startIntervalTimer]);

  // 2. ACTIVE_WORK -> RESTING
  const handleWorkComplete = useCallback(
    (customReps?: number, customWeight?: number) => {
      triggerHaptic('success');
      playSound('chime');

      const repsToLog = typeof customReps === 'number' ? customReps : actualReps;
      const weightToLog = typeof customWeight === 'number' ? customWeight : actualWeight;
      const durationLogged =
        currentTrackingType === 'duration' ? targetDurationSeconds : 0;

      const newLog: SetResultLog = {
        exerciseIndex: currentExerciseIndex,
        exerciseName: currentExercise?.name || 'Exercise',
        setNumber: currentSetIndex + 1,
        reps: repsToLog,
        weight: weightToLog,
        durationSeconds: durationLogged,
        completedAt: Date.now(),
      };

      setLoggedSets((prev) => [...prev, newLog]);
      if (onSetCompleted) onSetCompleted(newLog);

      setState('RESTING');
      const restDurationMs = targetRestSeconds * 1000;
      startIntervalTimer(restDurationMs, () => handleRestCompleteRef.current());
    },
    [
      triggerHaptic,
      playSound,
      actualReps,
      actualWeight,
      currentTrackingType,
      targetDurationSeconds,
      currentExerciseIndex,
      currentExercise?.name,
      currentSetIndex,
      onSetCompleted,
      targetRestSeconds,
      startIntervalTimer,
    ]
  );

  // 3. RESTING -> NEXT SET / NEXT EXERCISE / COMPLETED
  const handleRestComplete = useCallback(() => {
    triggerHaptic('heavy');
    playSound('chime');

    const curExIdx = currentExerciseIndexRef.current;
    const curSetIdx = currentSetIndexRef.current;
    const ex = exercises[curExIdx] || exercises[0];
    const tSets = ex?.totalSets || ex?.sets || 3;

    const isLastSetOfEx = curSetIdx + 1 >= tSets;
    const isLastExOfWorkout = curExIdx + 1 >= exercises.length;

    if (!isLastSetOfEx) {
      // Advance to next set of current exercise
      setCurrentSetIndex(curSetIdx + 1);
      setState('LEAD_IN');
      startIntervalTimer(leadInDurationSeconds * 1000, () => handleLeadInCompleteRef.current());
    } else if (!isLastExOfWorkout) {
      // Advance to next exercise
      setCurrentExerciseIndex(curExIdx + 1);
      setCurrentSetIndex(0);
      setState('LEAD_IN');
      startIntervalTimer(leadInDurationSeconds * 1000, () => handleLeadInCompleteRef.current());
    } else {
      // All exercises & sets finished!
      setState('COMPLETED');
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (onWorkoutCompleted) {
        onWorkoutCompleted(loggedSets, workoutElapsedSeconds);
      }
    }
  }, [
    exercises,
    triggerHaptic,
    playSound,
    leadInDurationSeconds,
    startIntervalTimer,
    onWorkoutCompleted,
    loggedSets,
    workoutElapsedSeconds,
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
      setState('LEAD_IN');
      startIntervalTimer(leadInDurationSeconds * 1000, handleLeadInComplete);
    }
  }, [state, leadInDurationSeconds, startIntervalTimer, handleLeadInComplete]);

  const startGuidedSet = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setState('LEAD_IN');
    startIntervalTimer(leadInDurationSeconds * 1000, handleLeadInComplete);
  }, [leadInDurationSeconds, startIntervalTimer, handleLeadInComplete]);

  const resetGuided = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
    endTimeRef.current = null;
    setState('READY');
    setSecondsRemaining(leadInDurationSeconds);
    setProgress(0);
  }, [leadInDurationSeconds]);

  const syncPosition = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
      endTimeRef.current = null;
      setCurrentExerciseIndex(exerciseIndex);
      setCurrentSetIndex(setIndex);
      setState('READY');
      setSecondsRemaining(leadInDurationSeconds);
      setProgress(0);
    },
    [leadInDurationSeconds]
  );

  const pause = useCallback(() => {
    if (state === 'PAUSED' || state === 'COMPLETED' || state === 'READY') return;
    if (endTimeRef.current) {
      pausedRemainingMsRef.current = Math.max(0, endTimeRef.current - Date.now());
    }
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
    setPreviousState(state);
    setState('PAUSED');
  }, [state]);

  const resume = useCallback(() => {
    if (state !== 'PAUSED') return;
    const remainingMs = pausedRemainingMsRef.current;
    setState(previousState);

    if (previousState === 'LEAD_IN') {
      startIntervalTimer(remainingMs, handleLeadInComplete);
    } else if (previousState === 'ACTIVE_WORK' && currentTrackingType === 'duration') {
      startIntervalTimer(remainingMs, handleWorkComplete);
    } else if (previousState === 'RESTING') {
      startIntervalTimer(remainingMs, handleRestComplete);
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
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      handleRestComplete();
    }
  }, [state, handleRestComplete]);

  const addRestSeconds = useCallback((extraSeconds: number) => {
    if (endTimeRef.current) {
      endTimeRef.current += extraSeconds * 1000;
      totalDurationMsRef.current += extraSeconds * 1000;
      const remainingMs = Math.max(0, endTimeRef.current - Date.now());
      setSecondsRemaining(Math.ceil(remainingMs / 1000));
    }
  }, []);

  const nextExercise = useCallback(() => {
    if (currentExerciseIndex < exercises.length - 1) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setCurrentExerciseIndex((prev) => prev + 1);
      setCurrentSetIndex(0);
      setState('LEAD_IN');
      startIntervalTimer(leadInDurationSeconds * 1000, handleLeadInComplete);
    }
  }, [currentExerciseIndex, exercises.length, leadInDurationSeconds, startIntervalTimer, handleLeadInComplete]);

  const previousExercise = useCallback(() => {
    if (currentExerciseIndex > 0) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setCurrentExerciseIndex((prev) => prev - 1);
      setCurrentSetIndex(0);
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

  return {
    // Machine state
    state,
    previousState,
    isPaused: state === 'PAUSED',
    isActive: state !== 'READY' && state !== 'COMPLETED',
    isResting: state === 'RESTING',
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
  };
}
