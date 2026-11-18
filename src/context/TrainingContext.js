import React, { useState, useEffect, createContext, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import {
  getUserWeightKg,
  calculateDurationCalories,
  resolveSportMET,
} from '../utils/calorieEngine';

const isServer = Platform.OS === 'web' && typeof window === 'undefined';

const ssrSafeStorage = {
  getItem: async (key) => {
    if (isServer) return null;
    return AsyncStorage.getItem(key);
  },
  setItem: async (key, value) => {
    if (isServer) return;
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key) => {
    if (isServer) return;
    return AsyncStorage.removeItem(key);
  },
};

export const supabaseUrl = 'https://nfzuvugwamzjsxngptta.supabase.co';
export const supabaseKey = 'sb_publishable_o11J7ZGIF1O0m9L0s5ouxw_xW0PY7IC';
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: ssrSafeStorage,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
});

export const getDateString = (dateObj = new Date()) => {
  return dateObj.toISOString().split('T')[0];
};

export const TrainingContext = createContext();

export const TrainingProvider = ({ children, session }) => {
  const [history, setHistory] = useState({});
  const [workspaces, setWorkspaces] = useState({ defaultPlanId: null });
  const [latestWorkout, setLatestWorkout] = useState(null);
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    avatar: null,
    currentWeight: null,
    targetWeight: null,
    height: null,
    age: null,
    gender: null,
    weightUnit: 'kg',
    heightUnit: 'cm',
  });

  const [activeSessionMetadata, setActiveSessionMetadata] = useState(null);
  const [activeSessionState, setActiveSessionState] = useState(null);
  const [activeSessionTimer, setActiveSessionTimer] = useState({ restSeconds: 0, isRestActive: false, sessionStartTime: null });

  useEffect(() => {
    const loadActiveSession = async () => {
      try {
        const metadata = await AsyncStorage.getItem('@active_session_metadata');
        const state = await AsyncStorage.getItem('@active_session_state');
        const timer = await AsyncStorage.getItem('@active_session_timer');
        if (metadata && state && timer) {
          setActiveSessionMetadata(JSON.parse(metadata));
          setActiveSessionState(JSON.parse(state));
          setActiveSessionTimer(JSON.parse(timer));
        }
      } catch (e) { console.error('Failed to load active session', e); }
    };
    loadActiveSession();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        if (activeSessionMetadata) {
          await AsyncStorage.setItem('@active_session_metadata', JSON.stringify(activeSessionMetadata));
          await AsyncStorage.setItem('@active_session_state', JSON.stringify(activeSessionState));
          await AsyncStorage.setItem('@active_session_timer', JSON.stringify(activeSessionTimer));
        } else {
          await AsyncStorage.removeItem('@active_session_metadata');
          await AsyncStorage.removeItem('@active_session_state');
          await AsyncStorage.removeItem('@active_session_timer');
        }
      } catch (e) { console.error('Failed to save active session', e); }
    }, 500);
    return () => clearTimeout(timer);
  }, [activeSessionMetadata, activeSessionState, activeSessionTimer]);

  const updateActiveSessionMetadata = useCallback((updater) => {
    setActiveSessionMetadata((prev) => {
      let next;
      if (typeof updater === 'function') {
        next = updater(prev);
      } else if (!updater) {
        next = null;
      } else {
        next = { ...(prev || {}), ...updater };
      }

      if (next === prev) return prev;
      if (!prev && !next) return null;
      if (prev && next && typeof prev === 'object' && typeof next === 'object') {
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(next);
        if (prevKeys.length === nextKeys.length) {
          let hasDiff = false;
          for (let i = 0; i < nextKeys.length; i++) {
            const k = nextKeys[i];
            if (prev[k] !== next[k]) {
              hasDiff = true;
              break;
            }
          }
          if (!hasDiff) return prev;
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const loadCachedWorkspaces = async () => {
      try {
        const cached = await AsyncStorage.getItem('@workspaces_data');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            setWorkspaces(prev => ({ ...prev, ...parsed }));
          }
        }
      } catch (e) {
        console.error('Failed to load cached workspaces', e);
      }
    };
    loadCachedWorkspaces();
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadDatabase();
    }
  }, [session]);

  const loadDatabase = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('history_data, workspaces_data, current_weight, target_weight, height, age, gender, weight_unit, height_unit, target_calories, target_protein, target_carbs, target_fat, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (data) {
        if (data.history_data) setHistory(data.history_data);
        const rawWorkspaces = data.workspaces_data || {};

        const resolvedWeight = data.current_weight != null
          ? Number(data.current_weight)
          : (Number(rawWorkspaces.currentWeight) || Number(rawWorkspaces.latest_weight) || null);

        const resolvedTargetWeight = data.target_weight != null
          ? Number(data.target_weight)
          : (Number(rawWorkspaces.targetWeight) || Number(rawWorkspaces.target_weight) || null);

        const resolvedHeight = data.height != null
          ? Number(data.height)
          : (Number(rawWorkspaces.height) || null);

        const resolvedAge = data.age != null
          ? parseInt(data.age, 10)
          : (parseInt(rawWorkspaces.age, 10) || null);

        const resolvedGender = data.gender || rawWorkspaces.gender || null;
        const resolvedWeightUnit = data.weight_unit || rawWorkspaces.weightUnit || 'kg';
        const resolvedHeightUnit = data.height_unit || rawWorkspaces.heightUnit || 'cm';
        const resolvedName = session?.user?.user_metadata?.full_name || rawWorkspaces.name || '';
        const resolvedAvatar = data.avatar_url || rawWorkspaces.avatar || null;

        const newProfile = {
          name: resolvedName,
          email: session?.user?.email || '',
          avatar: resolvedAvatar,
          currentWeight: resolvedWeight,
          targetWeight: resolvedTargetWeight,
          height: resolvedHeight,
          age: resolvedAge,
          gender: resolvedGender,
          weightUnit: resolvedWeightUnit,
          heightUnit: resolvedHeightUnit,
        };
        setUserProfile(newProfile);

        // Harmonize workspaces with both camelCase and snake_case conventions
        const harmonizedWorkspaces = {
          ...rawWorkspaces,
          avatar: resolvedAvatar,
          currentWeight: resolvedWeight,
          latest_weight: resolvedWeight,
          targetWeight: resolvedTargetWeight,
          target_weight: resolvedTargetWeight,
          height: resolvedHeight,
          age: resolvedAge,
          gender: resolvedGender,
          weightUnit: resolvedWeightUnit,
          heightUnit: resolvedHeightUnit,
        };
        setWorkspaces(harmonizedWorkspaces);
        try {
          await AsyncStorage.setItem('@workspaces_data', JSON.stringify(harmonizedWorkspaces));
        } catch (e) {}
      }
    } catch (error) {
      console.error("Failed to load database: ", error);
    }
  };

  const updateDayProfile = async (dateStr, newProfileData) => {
    // Merge into existing day profile so nutrition data (e.g., foods, water) is never erased
    const existingDay = history[dateStr] || {};
    const mergedDay = { ...existingDay, ...newProfileData };
    const newHistory = { ...history, [dateStr]: mergedDay };
    setHistory(newHistory);

    if (!session?.user?.id) return;

    try {
      const payload = {
        id: session.user.id,
        history_data: newHistory,
        updated_at: new Date().toISOString()
      };

      if (newProfileData.weight != null) {
        const numWeight = Number(newProfileData.weight);
        payload.current_weight = numWeight;
        setUserProfile(prev => ({ ...prev, currentWeight: numWeight }));
        setWorkspaces(prev => ({
          ...prev,
          currentWeight: numWeight,
          latest_weight: numWeight,
        }));
      }

      if (workspaces && Object.keys(workspaces).length > 0) {
        payload.workspaces_data = {
          ...workspaces,
          ...(newProfileData.weight != null ? { currentWeight: Number(newProfileData.weight), latest_weight: Number(newProfileData.weight) } : {})
        };
      }

      await supabase
        .from('user_profiles')
        .upsert(payload);
    } catch (error) {
      console.error("Failed to save database: ", error);
    }
  };

  const saveToCloud = async (dateStr, newProfileData) => {
    await updateDayProfile(dateStr, newProfileData);
  };

  const updateWorkspaces = async (newWorkspaces) => {
    const mergedWorkspaces = { ...workspaces, ...newWorkspaces };
    setWorkspaces(mergedWorkspaces);
    try {
      await AsyncStorage.setItem('@workspaces_data', JSON.stringify(mergedWorkspaces));
    } catch (e) {}

    if (!session?.user?.id) return;

    try {
      const payload = {
        id: session.user.id,
        history_data: history,
        workspaces_data: mergedWorkspaces,
        updated_at: new Date().toISOString()
      };

      if (mergedWorkspaces.currentWeight != null || mergedWorkspaces.latest_weight != null) {
        const w = Number(mergedWorkspaces.currentWeight ?? mergedWorkspaces.latest_weight);
        if (!isNaN(w)) {
          payload.current_weight = w;
          mergedWorkspaces.currentWeight = w;
          mergedWorkspaces.latest_weight = w;
        }
      }

      if (mergedWorkspaces.targetWeight != null || mergedWorkspaces.target_weight != null) {
        const tw = Number(mergedWorkspaces.targetWeight ?? mergedWorkspaces.target_weight);
        if (!isNaN(tw)) {
          payload.target_weight = tw;
          mergedWorkspaces.targetWeight = tw;
          mergedWorkspaces.target_weight = tw;
        }
      }

      if (mergedWorkspaces.height != null) {
        const h = Number(mergedWorkspaces.height);
        if (!isNaN(h)) payload.height = h;
      }

      if (mergedWorkspaces.age != null) {
        const a = parseInt(mergedWorkspaces.age, 10);
        if (!isNaN(a)) payload.age = a;
      }

      if (mergedWorkspaces.gender != null) {
        payload.gender = mergedWorkspaces.gender;
      }

      if (mergedWorkspaces.avatar !== undefined) {
        payload.avatar_url = mergedWorkspaces.avatar;
      }

      await supabase
        .from('user_profiles')
        .upsert(payload);
    } catch (error) {
      console.error("Failed to save workspaces: ", error);
    }
  };

  const updateUserProfile = async (profileUpdates) => {
    const updated = { ...userProfile, ...profileUpdates };
    setUserProfile(updated);

    const mergedWorkspaces = {
      ...workspaces,
      currentWeight: updated.currentWeight,
      latest_weight: updated.currentWeight,
      targetWeight: updated.targetWeight,
      target_weight: updated.targetWeight,
      height: updated.height,
      age: updated.age,
      gender: updated.gender,
      weightUnit: updated.weightUnit,
      heightUnit: updated.heightUnit,
      ...(updated.avatar !== undefined ? { avatar: updated.avatar } : {}),
    };
    setWorkspaces(mergedWorkspaces);

    if (!session?.user?.id) return;

    try {
      const payload = {
        id: session.user.id,
        workspaces_data: mergedWorkspaces,
        updated_at: new Date().toISOString(),
      };
      if (updated.avatar !== undefined) payload.avatar_url = updated.avatar;
      if (updated.currentWeight != null) payload.current_weight = Number(updated.currentWeight);
      if (updated.targetWeight != null) payload.target_weight = Number(updated.targetWeight);
      if (updated.height != null) payload.height = Number(updated.height);
      if (updated.age != null) payload.age = parseInt(updated.age, 10);
      if (updated.gender != null) payload.gender = updated.gender;
      if (updated.weightUnit != null) payload.weight_unit = updated.weightUnit;
      if (updated.heightUnit != null) payload.height_unit = updated.heightUnit;

      await supabase
        .from('user_profiles')
        .upsert(payload);
    } catch (error) {
      console.error("Failed to save user profile: ", error);
    }
  };

  const logWorkout = async (type, duration, intensity, planId = null, extraDetails = {}) => {
    const targetDateStr = extraDetails.targetDateKey || getDateString();
    const dayProfile = history[targetDateStr] || {};
    const currentMove = dayProfile.move || { workouts: [], stepCount: 0 };
    
    const now = new Date();
    const startTimeIso = extraDetails.startTime 
      ? new Date(extraDetails.startTime).toISOString() 
      : new Date(now.getTime() - (duration ? duration * 60000 : 1500000)).toISOString();
    const endTimeIso = extraDetails.endTime 
      ? new Date(extraDetails.endTime).toISOString() 
      : now.toISOString();

    const durationMins = typeof duration === 'number' && duration > 0 
      ? duration 
      : Math.max(1, Math.round((extraDetails.durationSeconds || 0) / 60)) || 20;

    const durationSecs = extraDetails.durationSeconds || (durationMins * 60);

    const formatDurationStr = (sec) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      if (m >= 60 && s === 0) {
        const hrs = (m / 60).toFixed(1).replace(/\.0$/, '');
        return `${hrs}h (${m} min)`;
      }
      if (s === 0) return `${m} min`;
      return `${m}m ${s.toString().padStart(2, '0')}s`;
    };

    const checkTitle = `${type || ''} ${extraDetails.worksessionName || ''}`.toLowerCase();
    const isSport = Boolean(
      extraDetails.isSport ||
      extraDetails.sessionType === 'sport' ||
      (extraDetails.category || '').toLowerCase().includes('sport') ||
      checkTitle.includes('volleyball') ||
      checkTitle.includes('basketball') ||
      checkTitle.includes('football') ||
      checkTitle.includes('soccer') ||
      checkTitle.includes('tennis') ||
      checkTitle.includes('badminton') ||
      checkTitle.includes('handball') ||
      checkTitle.includes('rugby') ||
      checkTitle.includes('hockey') ||
      checkTitle.includes('water polo') ||
      checkTitle.includes('baseball') ||
      checkTitle.includes('cricket')
    );

    const isRehab = !isSport && Boolean(
      extraDetails.isRehab ||
      extraDetails.sessionType === 'rehab' ||
      checkTitle.includes('rehab') ||
      checkTitle.includes('protocol') ||
      checkTitle.includes('mcgill') ||
      checkTitle.includes('relief') ||
      checkTitle.includes('recovery') ||
      checkTitle.includes('mobility') ||
      checkTitle.includes('tendon') ||
      checkTitle.includes('achilles') ||
      checkTitle.includes('back')
    );

    const resolvedSessionType = isSport ? 'sport' : isRehab ? 'rehab' : 'workout';

    // Calculate calories burned across all workout categories using clinical METs
    const userWeightKg = getUserWeightKg(userProfile);
    const resolvedCalories =
      typeof extraDetails.caloriesBurned === 'number' && extraDetails.caloriesBurned > 0
        ? Math.round(extraDetails.caloriesBurned)
        : Math.round(
            calculateDurationCalories(
              isSport ? resolveSportMET(type) : isRehab ? 3.5 : 5.0,
              userWeightKg,
              durationSecs
            )
          );

    const newWorkout = { 
      id: Date.now().toString(), 
      type, 
      sessionType: resolvedSessionType,
      isRehab,
      isSport,
      category: extraDetails.category || (isSport ? 'Collective Sports' : isRehab ? 'Clinical Rehab' : 'Strength & Power'),
      duration: durationMins,
      durationSeconds: durationSecs,
      durationFormatted: extraDetails.durationFormatted || formatDurationStr(durationSecs),
      caloriesBurned: resolvedCalories,
      hoursPlayed: extraDetails.hoursPlayed || (isSport ? Number((durationMins / 60).toFixed(2)) : null),
      rpe: extraDetails.rpe || null,
      notes: extraDetails.notes || null,
      intensity: intensity || 'High', 
      planId,
      startTime: startTimeIso,
      endTime: endTimeIso,
      completedAt: endTimeIso,
      timeOfDay: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      dateFormatted: now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
      worksessionName: extraDetails.worksessionName || type,
      exercisesCompleted: extraDetails.exercisesCompleted || null,
      totalSets: extraDetails.totalSets || null,
    };
    
    const updatedMove = { ...currentMove, workouts: [newWorkout, ...currentMove.workouts] };
    
    await saveToCloud(targetDateStr, { ...dayProfile, move: updatedMove });
    setLatestWorkout(newWorkout);

    if (session?.user?.id) {
      try {
        await supabase.from('active_sessions').insert([{
          user_id: session.user.id,
          start_time: startTimeIso,
          end_time: endTimeIso,
        }]);
      } catch (err) {
        console.error('Failed to log to active_sessions:', err);
      }

      // Universal workout session log insertion for all modalities
      try {
        await supabase.from('workout_session_logs').insert([{
          user_id: session.user.id,
          session_id: extraDetails.exerciseId || planId || (isSport ? 'sport-session' : 'workout-session'),
          program_phase_id: extraDetails.programPhaseId || null,
          duration_minutes: durationMins,
          calories_burned: resolvedCalories,
          started_at: startTimeIso,
          completed_at: endTimeIso,
          pain_score_recorded: extraDetails.painScore != null ? Math.round(extraDetails.painScore) : null,
          notes: extraDetails.notes || `${type} • ${extraDetails.hoursPlayed ? `${extraDetails.hoursPlayed}h` : formatDurationStr(durationSecs)}${extraDetails.rpe ? ` • RPE ${extraDetails.rpe}/10` : ''}`,
        }]);
      } catch (err) {
        console.warn('workout_session_logs insert skipped:', err);
      }
    }
  };

  return (
    <TrainingContext.Provider value={{ 
      history, saveToCloud, workspaces, updateWorkspaces, logWorkout, latestWorkout,
      userProfile, updateUserProfile,
      activeSessionMetadata, setActiveSessionMetadata, updateActiveSessionMetadata,
      activeSessionState, setActiveSessionState,
      activeSessionTimer, setActiveSessionTimer,
      session
    }}>
      {children}
    </TrainingContext.Provider>
  );
};
