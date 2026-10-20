import React, { useState, useEffect, createContext, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

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
    const saveActiveSession = async () => {
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
    };
    saveActiveSession();
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
        .select('history_data, workspaces_data')
        .eq('id', session.user.id)
        .single();

      if (data) {
        if (data.history_data) setHistory(data.history_data);
        if (data.workspaces_data) {
          setWorkspaces(data.workspaces_data);
          try {
            await AsyncStorage.setItem('@workspaces_data', JSON.stringify(data.workspaces_data));
          } catch (e) {}
        }
      }
    } catch (error) {
      console.error("Failed to load database: ", error);
    }
  };

  const updateDayProfile = async (dateStr, newProfileData) => {
    const newHistory = { ...history, [dateStr]: newProfileData };
    setHistory(newHistory);

    if (!session?.user?.id) return;

    try {
      const payload = {
        id: session.user.id,
        history_data: newHistory,
        updated_at: new Date().toISOString()
      };
      if (workspaces && Object.keys(workspaces).length > 0 && workspaces.defaultPlanId !== null) {
        payload.workspaces_data = workspaces;
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
    setWorkspaces(newWorkspaces);
    try {
      await AsyncStorage.setItem('@workspaces_data', JSON.stringify(newWorkspaces));
    } catch (e) {}

    if (!session?.user?.id) return;

    try {
      await supabase
        .from('user_profiles')
        .upsert({
          id: session.user.id,
          history_data: history,
          workspaces_data: newWorkspaces,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error("Failed to save workspaces: ", error);
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

      if (isSport) {
        try {
          await supabase.from('workout_session_logs').insert([{
            user_id: session.user.id,
            session_id: extraDetails.exerciseId || planId || 'sport-session',
            duration_minutes: durationMins,
            notes: `${type} • ${extraDetails.hoursPlayed || (durationMins / 60).toFixed(1)}h${extraDetails.rpe ? ` • RPE ${extraDetails.rpe}/10` : ''}${extraDetails.notes ? ` • ${extraDetails.notes}` : ''}`,
            completed_at: endTimeIso,
          }]);
        } catch (err) {
          console.warn('Sport workout_session_logs insert skipped:', err);
        }
      }
    }
  };

  return (
    <TrainingContext.Provider value={{ 
      history, saveToCloud, workspaces, updateWorkspaces, logWorkout, latestWorkout,
      activeSessionMetadata, setActiveSessionMetadata, updateActiveSessionMetadata,
      activeSessionState, setActiveSessionState,
      activeSessionTimer, setActiveSessionTimer,
      session
    }}>
      {children}
    </TrainingContext.Provider>
  );
};
