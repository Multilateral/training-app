// ============================================================================
// Zustand Store: useProgramBuilderStore.ts
// Centralized state management for the Top-Down Canvas Program Builder
// ============================================================================

import { create } from 'zustand';
import { supabase } from '../context/TrainingContext';

export interface BuilderExercise {
  id: string;
  name: string;
  muscle_group?: string;
  equipment?: string;
  tracking_type: 'reps' | 'time' | 'reps_weight';
  target_sets: number;
  target_reps: number;
  target_time: number;
  target_rest_seconds?: number;
  target_duration_seconds?: number;
  cue?: string;
  is_new?: boolean;
}

export interface BuilderWorksession {
  id: string;
  name: string;
  modality: string;
  day_name?: string;
  is_new?: boolean;
  exercises: BuilderExercise[];
}

export interface BuilderPhase {
  id: string;
  phase_order: number;
  title: string;
  description: string;
  required_sessions_to_pass: number;
  max_allowed_pain_score: number;
  worksessions: BuilderWorksession[];
}

export interface ProgramMetadata {
  id?: string;
  title: string;
  description: string;
  target_joint: string;
  estimated_weeks: number;
}

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface ProgramBuilderState {
  // Program Info
  program: ProgramMetadata;
  phases: BuilderPhase[];

  // Sheet Overlays & Navigation State
  activePhaseIdForSheet: string | null;
  isWorksheetSheetOpen: boolean;
  isExerciseQuickCreateOpen: boolean;
  draftWorksessionForExercise: BuilderWorksession | null;

  // Auto-Save Lifecycle
  saveStatus: AutoSaveStatus;
  lastSavedAt: string | null;
  hasUnsavedChanges: boolean;
  saveTimerRef: any;

  // Actions: Program Metadata
  setProgramMeta: (updates: Partial<ProgramMetadata>, userId?: string) => void;

  // Actions: Phase Management
  addPhase: (userId?: string) => void;
  updatePhase: (phaseId: string, updates: Partial<BuilderPhase>, userId?: string) => void;
  duplicatePhase: (phaseId: string, userId?: string) => void;
  removePhase: (phaseId: string, userId?: string) => void;
  reorderPhases: (newPhases: BuilderPhase[], userId?: string) => void;

  // Actions: Worksession Management
  addWorksessionToPhase: (phaseId: string, worksession: BuilderWorksession, userId?: string) => void;
  removeWorksessionFromPhase: (phaseId: string, worksessionId: string, userId?: string) => void;

  // Actions: Bottom Sheet & Inline Creation
  openWorksheetSheet: (phaseId: string) => void;
  closeWorksheetSheet: () => void;
  openExerciseQuickCreate: (worksession?: BuilderWorksession) => void;
  closeExerciseQuickCreate: () => void;
  attachExerciseToDraftWorksession: (exercise: BuilderExercise) => void;
  updateExerciseInDraftWorksession: (index: number, updates: Partial<BuilderExercise>) => void;
  removeExerciseFromDraftWorksession: (index: number) => void;

  // Actions: Persistence & Cloud Sync
  scheduleAutoSave: (userId?: string) => void;
  loadDraftFromCloud: (userId: string) => Promise<boolean>;
  publishProgram: (userId: string) => Promise<{ success: boolean; program_id?: string; message?: string }>;
  resetBuilder: () => void;
  startNewProgram: () => void;
  loadPlanForEditing: (plan: any) => void;
}

const DEFAULT_PROGRAM: ProgramMetadata = {
  title: 'Lower Back Resilience Protocol',
  description: 'Phased, criteria-gated rehabilitation program restoring spinal stiffness, hip hinge control, and dynamic endurance.',
  target_joint: 'lumbar_spine',
  estimated_weeks: 8,
};

const DEFAULT_INITIAL_PHASES: BuilderPhase[] = [
  {
    id: 'phase-seed-1',
    phase_order: 1,
    title: 'Phase 1: Acute Decompression & McGill Big 3',
    description: 'Establish core isometric stiffness, quiet pain triggers, and rebuild endurance without joint shear.',
    required_sessions_to_pass: 8,
    max_allowed_pain_score: 4.0,
    worksessions: [
      {
        id: 'ws-seed-1',
        name: 'McGill Big 3 Stabilization',
        modality: 'Clinical Rehab',
        day_name: 'Day 1',
        is_new: false,
        exercises: [
          {
            id: 'ex-seed-1',
            name: 'Modified McGill Curl-Up',
            muscle_group: 'Core / Anterior Chain',
            equipment: 'Bodyweight',
            tracking_type: 'time',
            target_sets: 3,
            target_reps: 5,
            target_time: 10,
            cue: 'Hold each rep for 8-10 seconds without flattening lower back.',
          },
          {
            id: 'ex-seed-2',
            name: 'Side Bridge (Knees Bent / Straight)',
            muscle_group: 'Quadratus Lumborum / Obliques',
            equipment: 'Bodyweight',
            tracking_type: 'time',
            target_sets: 3,
            target_reps: 4,
            target_time: 10,
            cue: 'Elevate pelvis, align shoulder directly over elbow.',
          },
          {
            id: 'ex-seed-3',
            name: 'Bird Dog (Controlled Cross-Pattern)',
            muscle_group: 'Erector Spinae / Glutes',
            equipment: 'Bodyweight',
            tracking_type: 'time',
            target_sets: 3,
            target_reps: 5,
            target_time: 8,
            cue: 'Zero rotation through pelvic bowl while sweeping limbs.',
          },
        ],
      },
    ],
  },
  {
    id: 'phase-seed-2',
    phase_order: 2,
    title: 'Phase 2: Loaded Motor Control & Anti-Extension',
    description: 'Transition from pure isometric stiffness to controlled hip hinge loading and suitcase carries.',
    required_sessions_to_pass: 10,
    max_allowed_pain_score: 3.5,
    worksessions: [
      {
        id: 'ws-seed-2',
        name: 'Anti-Rotation & Hinge Capacity',
        modality: 'Strength & Rehab',
        day_name: 'Day 2',
        is_new: false,
        exercises: [
          {
            id: 'ex-seed-4',
            name: 'Pallof Press (Half-Kneeling)',
            muscle_group: 'Core / Anti-Rotation',
            equipment: 'Resistance Band',
            tracking_type: 'reps',
            target_sets: 3,
            target_reps: 12,
            target_time: 0,
            cue: 'Brace core before extending hands forward. Zero torso twisting.',
          },
        ],
      },
    ],
  },
];

export const useProgramBuilderStore = create<ProgramBuilderState>((set, get) => ({
  program: DEFAULT_PROGRAM,
  phases: DEFAULT_INITIAL_PHASES,

  activePhaseIdForSheet: null,
  isWorksheetSheetOpen: false,
  isExerciseQuickCreateOpen: false,
  draftWorksessionForExercise: null,

  saveStatus: 'idle',
  lastSavedAt: null,
  hasUnsavedChanges: false,
  saveTimerRef: null,

  setProgramMeta: (updates, userId) => {
    set((state) => ({
      program: { ...state.program, ...updates },
      hasUnsavedChanges: true,
    }));
    get().scheduleAutoSave(userId);
  },

  addPhase: (userId) => {
    set((state) => {
      const nextOrder = state.phases.length + 1;
      const newPhase: BuilderPhase = {
        id: `phase-temp-${Date.now()}`,
        phase_order: nextOrder,
        title: `Phase ${nextOrder}: New Progression Phase`,
        description: 'Define clinical objectives, progression criteria, and prescribed worksessions.',
        required_sessions_to_pass: 8,
        max_allowed_pain_score: 3.5,
        worksessions: [],
      };
      return {
        phases: [...state.phases, newPhase],
        hasUnsavedChanges: true,
      };
    });
    get().scheduleAutoSave(userId);
  },

  updatePhase: (phaseId, updates, userId) => {
    set((state) => ({
      phases: state.phases.map((p) => (p.id === phaseId ? { ...p, ...updates } : p)),
      hasUnsavedChanges: true,
    }));
    get().scheduleAutoSave(userId);
  },

  duplicatePhase: (phaseId, userId) => {
    set((state) => {
      const targetIndex = state.phases.findIndex((p) => p.id === phaseId);
      if (targetIndex === -1) return state;

      const sourcePhase = state.phases[targetIndex];
      const clonedWorksessions: BuilderWorksession[] = sourcePhase.worksessions.map((ws, wIdx) => ({
        ...ws,
        id: `ws-clone-${Date.now()}-${wIdx}`,
        is_new: true,
        exercises: ws.exercises.map((ex, eIdx) => ({
          ...ex,
          id: `ex-clone-${Date.now()}-${eIdx}`,
          is_new: true,
        })),
      }));

      const clonedPhase: BuilderPhase = {
        id: `phase-clone-${Date.now()}`,
        phase_order: sourcePhase.phase_order + 1,
        title: `${sourcePhase.title.replace(/Phase \d+:\s*/, '')} (Progression)`,
        description: sourcePhase.description,
        required_sessions_to_pass: sourcePhase.required_sessions_to_pass,
        max_allowed_pain_score: Math.max(2.5, Number((sourcePhase.max_allowed_pain_score - 0.5).toFixed(1))),
        worksessions: clonedWorksessions,
      };

      const updatedPhases = [...state.phases];
      updatedPhases.splice(targetIndex + 1, 0, clonedPhase);

      // Re-index all phase_order numbers sequentially
      const normalizedPhases = updatedPhases.map((p, idx) => ({
        ...p,
        phase_order: idx + 1,
        title: p.title.startsWith('Phase ')
          ? p.title.replace(/^Phase \d+/, `Phase ${idx + 1}`)
          : `Phase ${idx + 1}: ${p.title}`,
      }));

      return {
        phases: normalizedPhases,
        hasUnsavedChanges: true,
      };
    });
    get().scheduleAutoSave(userId);
  },

  removePhase: (phaseId, userId) => {
    set((state) => {
      if (state.phases.length <= 1) return state; // Keep at least one phase
      const filtered = state.phases.filter((p) => p.id !== phaseId);
      const normalized = filtered.map((p, idx) => ({
        ...p,
        phase_order: idx + 1,
        title: p.title.startsWith('Phase ')
          ? p.title.replace(/^Phase \d+/, `Phase ${idx + 1}`)
          : p.title,
      }));
      return {
        phases: normalized,
        hasUnsavedChanges: true,
      };
    });
    get().scheduleAutoSave(userId);
  },

  reorderPhases: (newPhases, userId) => {
    const normalized = newPhases.map((p, idx) => ({
      ...p,
      phase_order: idx + 1,
    }));
    set({ phases: normalized, hasUnsavedChanges: true });
    get().scheduleAutoSave(userId);
  },

  addWorksessionToPhase: (phaseId, worksession, userId) => {
    set((state) => ({
      phases: state.phases.map((p) => {
        if (p.id !== phaseId) return p;
        return {
          ...p,
          worksessions: [...p.worksessions, worksession],
        };
      }),
      isWorksheetSheetOpen: false,
      activePhaseIdForSheet: null,
      hasUnsavedChanges: true,
    }));
    get().scheduleAutoSave(userId);
  },

  removeWorksessionFromPhase: (phaseId, worksessionId, userId) => {
    set((state) => ({
      phases: state.phases.map((p) => {
        if (p.id !== phaseId) return p;
        return {
          ...p,
          worksessions: p.worksessions.filter((w) => w.id !== worksessionId),
        };
      }),
      hasUnsavedChanges: true,
    }));
    get().scheduleAutoSave(userId);
  },

  openWorksheetSheet: (phaseId) => {
    set({
      activePhaseIdForSheet: phaseId,
      isWorksheetSheetOpen: true,
      draftWorksessionForExercise: null,
    });
  },

  closeWorksheetSheet: () => {
    set({
      isWorksheetSheetOpen: false,
      activePhaseIdForSheet: null,
      draftWorksessionForExercise: null,
    });
  },

  openExerciseQuickCreate: (worksession) => {
    set({
      isExerciseQuickCreateOpen: true,
      draftWorksessionForExercise: worksession || null,
    });
  },

  closeExerciseQuickCreate: () => {
    set({
      isExerciseQuickCreateOpen: false,
      draftWorksessionForExercise: null,
    });
  },

  attachExerciseToDraftWorksession: (exercise) => {
    set((state) => {
      if (!state.draftWorksessionForExercise) return state;
      const updated = {
        ...state.draftWorksessionForExercise,
        exercises: [...state.draftWorksessionForExercise.exercises, exercise],
      };
      return {
        draftWorksessionForExercise: updated,
        isExerciseQuickCreateOpen: false,
      };
    });
  },

  updateExerciseInDraftWorksession: (index, updates) => {
    set((state) => {
      if (!state.draftWorksessionForExercise) return state;
      const updatedList = state.draftWorksessionForExercise.exercises.map((ex, idx) =>
        idx === index ? { ...ex, ...updates } : ex
      );
      return {
        draftWorksessionForExercise: {
          ...state.draftWorksessionForExercise,
          exercises: updatedList,
        },
      };
    });
  },

  removeExerciseFromDraftWorksession: (index) => {
    set((state) => {
      if (!state.draftWorksessionForExercise) return state;
      return {
        draftWorksessionForExercise: {
          ...state.draftWorksessionForExercise,
          exercises: state.draftWorksessionForExercise.exercises.filter((_, idx) => idx !== index),
        },
      };
    });
  },

  // Debounced auto-save to Supabase builder_drafts table
  scheduleAutoSave: (userId) => {
    const state = get();
    if (state.saveTimerRef) {
      clearTimeout(state.saveTimerRef);
    }

    const timer = setTimeout(async () => {
      try {
        const uid = userId || (await supabase.auth.getUser()).data.user?.id;
        if (!uid) return;

        set({ saveStatus: 'saving' });

        const payload = {
          program: get().program,
          phases: get().phases,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.rpc('save_builder_draft', {
          p_user_id: uid,
          p_draft_key: 'active_program_builder',
          p_payload: payload,
        });

        if (error) {
          console.warn('[useProgramBuilderStore] Auto-save error:', error.message);
          set({ saveStatus: 'error' });
        } else {
          set({
            saveStatus: 'saved',
            lastSavedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            hasUnsavedChanges: false,
          });
        }
      } catch (err) {
        console.error('[useProgramBuilderStore] Auto-save exception:', err);
        set({ saveStatus: 'error' });
      }
    }, 1200); // 1.2s debounce

    set({ saveTimerRef: timer });
  },

  loadDraftFromCloud: async (userId) => {
    try {
      set({ saveStatus: 'saving' });
      const { data, error } = await supabase
        .from('builder_drafts')
        .select('payload, updated_at')
        .eq('user_id', userId)
        .eq('draft_key', 'active_program_builder')
        .maybeSingle();

      if (error || !data || !data.payload) {
        set({ saveStatus: 'idle' });
        return false;
      }

      const { program, phases } = data.payload;
      if (program && phases && Array.isArray(phases) && phases.length > 0) {
        set({
          program,
          phases,
          saveStatus: 'saved',
          lastSavedAt: new Date(data.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          hasUnsavedChanges: false,
        });
        return true;
      }
      set({ saveStatus: 'idle' });
      return false;
    } catch (err) {
      console.warn('[useProgramBuilderStore] Could not load draft:', err);
      set({ saveStatus: 'idle' });
      return false;
    }
  },

  publishProgram: async (userId) => {
    try {
      set({ saveStatus: 'saving' });
      const { program, phases } = get();

      const fullPayload = {
        id: program.id || null,
        title: program.title.trim() || 'Untitled Program',
        description: program.description.trim(),
        target_joint: program.target_joint,
        estimated_weeks: program.estimated_weeks || 8,
        phases,
      };

      const { data, error } = await supabase.rpc('publish_rehab_program', {
        p_user_id: userId,
        p_program: fullPayload,
      });

      if (error) {
        console.error('[useProgramBuilderStore] Publish error:', error);
        set({ saveStatus: 'error' });
        return { success: false, message: error.message };
      }

      if (program.id) {
        try {
          await supabase.from('training_plans').update({
            name: program.title,
            description: program.description,
            goal_category: program.target_joint,
          }).eq('id', program.id);
        } catch {
          // Non-critical if not existing in training_plans
        }
      }

      set({
        saveStatus: 'saved',
        hasUnsavedChanges: false,
      });

      return {
        success: true,
        program_id: data?.program_id,
        message: data?.message || 'Program published successfully!',
      };
    } catch (err: any) {
      console.error('[useProgramBuilderStore] Publish exception:', err);
      set({ saveStatus: 'error' });
      return { success: false, message: err.message || 'Failed to publish program.' };
    }
  },

  resetBuilder: () => {
    set({
      program: DEFAULT_PROGRAM,
      phases: DEFAULT_INITIAL_PHASES,
      saveStatus: 'idle',
      lastSavedAt: null,
      hasUnsavedChanges: false,
    });
  },

  startNewProgram: () => {
    set({
      program: {
        title: '',
        description: '',
        target_joint: 'lumbar_spine',
        estimated_weeks: 8,
      },
      phases: [
        {
          id: `phase-${Date.now()}-1`,
          phase_order: 1,
          title: 'Phase 1: Foundation & Acute Adaptation',
          description: 'Establish baseline motor control, tissue tolerance, and exercise adherence.',
          required_sessions_to_pass: 8,
          max_allowed_pain_score: 3.5,
          worksessions: [],
        },
      ],
      saveStatus: 'idle',
      lastSavedAt: null,
      hasUnsavedChanges: false,
    });
  },

  loadPlanForEditing: (plan: any) => {
    if (!plan) return;

    // Case 1: Program with existing program_phases (rehab_programs)
    if (plan.program_phases && Array.isArray(plan.program_phases) && plan.program_phases.length > 0) {
      const sortedPhases = [...plan.program_phases].sort((a, b) => (a.phase_order || 1) - (b.phase_order || 1));
      const builderPhases: BuilderPhase[] = sortedPhases.map((ph: any, pIdx: number) => {
        const pwList = ph.phase_worksessions || [];
        const sortedWs = [...pwList].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

        const worksessions: BuilderWorksession[] = sortedWs.map((pw: any, wIdx: number) => {
          const ws = pw.worksessions || {};
          const weList = ws.worksession_exercises || [];
          const exercises: BuilderExercise[] = weList.map((we: any, eIdx: number) => {
            const ex = we.exercises || {};
            return {
              id: ex.id || we.exercise_id || `ex-${pIdx}-${wIdx}-${eIdx}`,
              name: ex.name || 'Exercise',
              muscle_group: ex.muscle_group || 'General',
              equipment: ex.equipment || 'Bodyweight',
              tracking_type: we.tracking_type || 'reps',
              target_sets: we.target_sets || 3,
              target_reps: we.target_reps || 10,
              target_time: we.target_time || 45,
              cue: we.notes || ex.instructions || '',
              is_new: false,
            };
          });

          return {
            id: ws.id || pw.worksession_id || `ws-${pIdx}-${wIdx}`,
            name: ws.name || pw.day_name || `Session ${wIdx + 1}`,
            modality: ws.modality || 'Clinical Rehab',
            day_name: pw.day_name || `Day ${wIdx + 1}`,
            is_new: false,
            exercises,
          };
        });

        return {
          id: ph.id || `phase-${pIdx + 1}`,
          phase_order: ph.phase_order || pIdx + 1,
          title: ph.title || `Phase ${pIdx + 1}`,
          description: ph.description || '',
          required_sessions_to_pass: ph.required_sessions_to_pass || 8,
          max_allowed_pain_score: Number(ph.max_allowed_pain_score) || 3.5,
          worksessions,
        };
      });

      set({
        program: {
          id: plan.id,
          title: plan.title || plan.name || 'Untitled Program',
          description: plan.description || '',
          target_joint: plan.target_joint || plan.goal_category || 'lumbar_spine',
          estimated_weeks: plan.estimated_weeks || 8,
        },
        phases: builderPhases,
        hasUnsavedChanges: false,
        saveStatus: 'idle',
        lastSavedAt: null,
      });
      return;
    }

    // Case 2: Standard Plan with plan_worksessions (training_plans)
    const pwList = plan.plan_worksessions || [];
    const worksessions: BuilderWorksession[] = pwList.map((pw: any, wIdx: number) => {
      const ws = pw.worksessions || {};
      const weList = ws.worksession_exercises || [];
      const exercises: BuilderExercise[] = weList.map((we: any, eIdx: number) => {
        const ex = we.exercises || {};
        return {
          id: ex.id || we.exercise_id || `ex-${wIdx}-${eIdx}`,
          name: ex.name || 'Exercise',
          muscle_group: ex.muscle_group || 'General',
          equipment: ex.equipment || 'Bodyweight',
          tracking_type: we.tracking_type || 'reps',
          target_sets: we.target_sets || 3,
          target_reps: we.target_reps || 10,
          target_time: we.target_time || 45,
          cue: we.notes || ex.instructions || '',
          is_new: false,
        };
      });

      return {
        id: ws.id || pw.worksession_id || `ws-${wIdx}`,
        name: ws.name || pw.day_name || `Session ${wIdx + 1}`,
        modality: ws.modality || 'Strength & Conditioning',
        day_name: pw.day_name || `Day ${wIdx + 1}`,
        is_new: false,
        exercises,
      };
    });

    const initialPhases: BuilderPhase[] = [
      {
        id: `phase-${plan.id || Date.now()}-1`,
        phase_order: 1,
        title: 'Phase 1: Foundation & Progression',
        description: plan.description || 'Core phase prescribed for this training routine.',
        required_sessions_to_pass: plan.sessions_per_week ? Number(plan.sessions_per_week) * 2 : 8,
        max_allowed_pain_score: 3.5,
        worksessions,
      },
    ];

    set({
      program: {
        id: plan.id,
        title: plan.name || plan.title || 'Untitled Plan',
        description: plan.description || '',
        target_joint: plan.goal_category || 'general',
        estimated_weeks: 6,
      },
      phases: initialPhases,
      hasUnsavedChanges: false,
      saveStatus: 'idle',
      lastSavedAt: null,
    });
  },
}));
