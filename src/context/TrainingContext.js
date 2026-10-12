import React, { useState, useEffect, createContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://nfzuvugwamzjsxngptta.supabase.co';
export const supabaseKey = 'sb_publishable_o11J7ZGIF1O0m9L0s5ouxw_xW0PY7IC';
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
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

  const logWorkout = async (type, duration, intensity, planId = null) => {
    const todayStr = getDateString();
    const todayProfile = history[todayStr] || { };
    const currentMove = todayProfile.move || { workouts: [], stepCount: 0 };
    
    const newWorkout = { id: Date.now().toString(), type, duration, intensity, planId };
    const updatedMove = { ...currentMove, workouts: [newWorkout, ...currentMove.workouts] };
    
    await saveToCloud(todayStr, { ...todayProfile, move: updatedMove });
    setLatestWorkout(newWorkout);
  };

  return (
    <TrainingContext.Provider value={{ 
      history, saveToCloud, workspaces, updateWorkspaces, logWorkout, latestWorkout,
      activeSessionMetadata, setActiveSessionMetadata,
      activeSessionState, setActiveSessionState,
      activeSessionTimer, setActiveSessionTimer,
      session
    }}>
      {children}
    </TrainingContext.Provider>
  );
};
