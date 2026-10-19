// ============================================================================
// Service: rehabProgressionService.ts
// Handles communication with Supabase for criteria-based phase progressions
// and user-controlled phase retention ("Keep Practicing Current Phase").
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../context/TrainingContext';

const LOCAL_ENROLLMENT_OVERRIDE_KEY = '@kinetix_rehab_enrollment_override_v1';

export interface ProgramPhase {
  id: string;
  program_id: string;
  phase_order: number;
  title: string;
  description?: string;
  required_sessions_to_pass: number;
  max_allowed_pain_score: number;
}

export interface RehabProgram {
  id: string;
  title: string;
  description?: string;
  target_joint?: string;
  estimated_weeks?: number;
  phases: ProgramPhase[];
}

export interface UserEnrollment {
  id: string;
  user_id: string;
  program_id: string;
  current_phase_id: string;
  status: 'active' | 'completed' | 'paused';
  requires_more_time: boolean;
  is_phase_extended?: boolean;
  extended_sessions_count?: number;
  progression_preference?: 'auto_advance' | 'prompt_user' | 'manual_hold';
  custom_target_days_per_week?: number | null;
  started_at: string;
  completed_at?: string;
  program?: RehabProgram;
  current_phase?: ProgramPhase;
  sessions_completed_in_phase?: number;
  avg_pain_last_3?: number;
  eligible_to_advance?: boolean;
}

export interface GatekeeperEvaluationResult {
  success: boolean;
  evaluated: boolean;
  advanced: boolean;
  eligible_to_advance?: boolean;
  completed_program: boolean;
  requires_more_time: boolean;
  is_phase_extended?: boolean;
  extended_sessions_count?: number;
  log_id?: string;
  current_phase_id?: string;
  current_phase_order?: number;
  current_phase_title?: string;
  next_phase_id?: string | null;
  next_phase_order?: number | null;
  next_phase_title?: string | null;
  sessions_completed?: number;
  required_sessions?: number;
  avg_pain_score?: number;
  max_allowed_pain_score?: number;
  recent_pain_scores?: number[];
  program_title?: string;
  message?: string;
}

export async function getLocalEnrollmentOverride(): Promise<Partial<UserEnrollment> | null> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_ENROLLMENT_OVERRIDE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveLocalEnrollmentOverride(override: Partial<UserEnrollment>): Promise<void> {
  try {
    const existing = (await getLocalEnrollmentOverride()) || {};
    await AsyncStorage.setItem(
      LOCAL_ENROLLMENT_OVERRIDE_KEY,
      JSON.stringify({ ...existing, ...override })
    );
  } catch (e) {
    console.warn('[rehabProgressionService] Failed to save local override:', e);
  }
}

/**
 * Fetch the active enrollment for a given user, including program, phase metadata,
 * and phase retention ("Keep Practicing") state.
 */
export async function getActiveUserEnrollment(userId?: string): Promise<UserEnrollment | null> {
  try {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    const localOverride = await getLocalEnrollmentOverride();

    if (!uid) return null;

    // 1. Fetch active enrollment
    const { data: enrollment, error } = await supabase
      .from('user_enrollments')
      .select(`
        id,
        user_id,
        program_id,
        current_phase_id,
        status,
        requires_more_time,
        is_phase_extended,
        extended_sessions_count,
        progression_preference,
        custom_target_days_per_week,
        started_at,
        completed_at,
        rehab_programs (
          id,
          title,
          description,
          target_joint,
          estimated_weeks,
          program_phases (
            id,
            program_id,
            phase_order,
            title,
            description,
            required_sessions_to_pass,
            max_allowed_pain_score
          )
        )
      `)
      .eq('user_id', uid)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[rehabProgressionService] Error fetching user enrollment:', error.message);
      return null;
    }

    if (!enrollment) return null;

    const rawProgram: any = enrollment.rehab_programs;
    const sortedPhases: ProgramPhase[] = (rawProgram?.program_phases || []).sort(
      (a: ProgramPhase, b: ProgramPhase) => a.phase_order - b.phase_order
    );

    const activePhaseId =
      localOverride?.program_id === enrollment.program_id && localOverride?.current_phase_id
        ? localOverride.current_phase_id
        : enrollment.current_phase_id;

    const currentPhase =
      sortedPhases.find((p) => p.id === activePhaseId) ||
      sortedPhases.find((p) => p.id === enrollment.current_phase_id) ||
      sortedPhases[0];

    // 2. Fetch session count and recent pain scores for the active phase
    let completedCount = 0;
    let avgPain = 0;

    if (currentPhase) {
      const { count } = await supabase
        .from('workout_session_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('program_phase_id', currentPhase.id);

      completedCount = count || 0;

      const { data: recentSessions } = await supabase
        .from('workout_session_logs')
        .select('pain_score_recorded')
        .eq('user_id', uid)
        .eq('program_phase_id', currentPhase.id)
        .not('pain_score_recorded', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(3);

      if (recentSessions && recentSessions.length > 0) {
        const sum = recentSessions.reduce((acc, s: any) => acc + (s.pain_score_recorded || 0), 0);
        avgPain = Number((sum / recentSessions.length).toFixed(1));
      }
    }

    const reqSessions = currentPhase?.required_sessions_to_pass || 8;
    const maxPain = currentPhase?.max_allowed_pain_score || 3.5;
    const isExtended = Boolean(
      enrollment.is_phase_extended ?? localOverride?.is_phase_extended ?? false
    );
    const extCount = Number(
      enrollment.extended_sessions_count ?? localOverride?.extended_sessions_count ?? 0
    );
    const eligibleToAdvance = completedCount >= reqSessions && avgPain <= maxPain;

    return {
      id: enrollment.id,
      user_id: enrollment.user_id,
      program_id: enrollment.program_id,
      current_phase_id: currentPhase?.id || enrollment.current_phase_id,
      status: enrollment.status as 'active' | 'completed' | 'paused',
      requires_more_time: Boolean(enrollment.requires_more_time),
      is_phase_extended: isExtended,
      extended_sessions_count: extCount,
      progression_preference:
        (enrollment.progression_preference as any) ||
        localOverride?.progression_preference ||
        'prompt_user',
      custom_target_days_per_week:
        enrollment.custom_target_days_per_week ?? localOverride?.custom_target_days_per_week ?? null,
      started_at: enrollment.started_at,
      completed_at: enrollment.completed_at,
      program: {
        id: rawProgram.id,
        title: rawProgram.title,
        description: rawProgram.description,
        target_joint: rawProgram.target_joint,
        estimated_weeks: rawProgram.estimated_weeks,
        phases: sortedPhases,
      },
      current_phase: currentPhase,
      sessions_completed_in_phase: completedCount,
      avg_pain_last_3: avgPain,
      eligible_to_advance: eligibleToAdvance,
    };
  } catch (err) {
    console.error('[rehabProgressionService] Exception in getActiveUserEnrollment:', err);
    return null;
  }
}

/**
 * Calls the progression gatekeeper RPC function `log_and_evaluate_rehab_session`
 */
export async function logAndEvaluateRehabSession(params: {
  userId?: string;
  programPhaseId: string;
  painScore: number;
  sessionId?: string;
  durationMinutes?: number;
  notes?: string;
  autoAdvance?: boolean;
}): Promise<GatekeeperEvaluationResult> {
  const uid = params.userId || (await supabase.auth.getUser()).data.user?.id;
  if (!uid) {
    throw new Error('User must be authenticated to log a criteria-gated session.');
  }

  try {
    const { data, error } = await supabase.rpc('log_and_evaluate_rehab_session', {
      p_user_id: uid,
      p_program_phase_id: params.programPhaseId,
      p_pain_score: Math.round(params.painScore),
      p_session_id: params.sessionId || null,
      p_duration_minutes: params.durationMinutes || 30,
      p_notes: params.notes || null,
      p_auto_advance: Boolean(params.autoAdvance),
    });

    if (!error && data) {
      return data as GatekeeperEvaluationResult;
    }

    if (error) {
      console.warn(
        '[rehabProgressionService] RPC log_and_evaluate_rehab_session error, initiating graceful fallback:',
        error.message
      );
    }
  } catch (rpcEx: any) {
    console.warn('[rehabProgressionService] RPC exception, initiating graceful fallback:', rpcEx.message);
  }

  // --------------------------------------------------------------------------
  // Resilient Client-Side Fallback:
  // Directly records the workout session log and evaluates criteria against RLS
  // --------------------------------------------------------------------------
  let insertedLogId: string | undefined;
  try {
    const { data: insertedLog, error: insErr } = await supabase
      .from('workout_session_logs')
      .insert({
        user_id: uid,
        session_id: params.sessionId || null,
        program_phase_id: params.programPhaseId,
        pain_score_recorded: Math.round(params.painScore),
        duration_minutes: params.durationMinutes || 30,
        notes: params.notes || null,
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle();

    if (!insErr && insertedLog) {
      insertedLogId = insertedLog.id;
    }
  } catch (insCatch) {
    console.warn('[rehabProgressionService] Fallback session insert error:', insCatch);
  }

  try {
    const enrollment = await getActiveUserEnrollment(uid);
    if (!enrollment || enrollment.current_phase_id !== params.programPhaseId) {
      return {
        success: true,
        log_id: insertedLogId,
        evaluated: false,
        advanced: false,
        eligible_to_advance: false,
        completed_program: false,
        requires_more_time: false,
        message: 'Session logged. User is not currently active in this phase.',
      };
    }

    const currentPhase = enrollment.current_phase;
    const requiredSessions = currentPhase?.required_sessions_to_pass || 8;
    const maxAllowedPain = currentPhase?.max_allowed_pain_score || 3.5;
    const sessionsCompleted = enrollment.sessions_completed_in_phase || 1;
    const avgPain = enrollment.avg_pain_last_3 || Math.round(params.painScore);

    let advanced = false;
    let eligibleToAdvance = false;
    let completedProgram = false;
    let requiresMoreTime = false;
    let nextPhase: ProgramPhase | undefined;

    const phases = enrollment.program?.phases || [];
    const currentOrder = currentPhase?.phase_order || 1;
    nextPhase = phases.find((p) => p.phase_order === currentOrder + 1);

    if (sessionsCompleted >= requiredSessions) {
      if (avgPain <= maxAllowedPain) {
        eligibleToAdvance = true;
        if (params.autoAdvance || enrollment.progression_preference === 'auto_advance') {
          if (nextPhase) {
            await supabase
              .from('user_enrollments')
              .update({
                current_phase_id: nextPhase.id,
                requires_more_time: false,
                is_phase_extended: false,
                extended_sessions_count: 0,
                updated_at: new Date().toISOString(),
              })
              .eq('id', enrollment.id);
            advanced = true;
          } else {
            await supabase
              .from('user_enrollments')
              .update({
                status: 'completed',
                requires_more_time: false,
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', enrollment.id);
            advanced = true;
            completedProgram = true;
          }
        }
      } else {
        await supabase
          .from('user_enrollments')
          .update({
            requires_more_time: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', enrollment.id);
        requiresMoreTime = true;
      }
    }

    return {
      success: true,
      log_id: insertedLogId,
      evaluated: true,
      advanced,
      eligible_to_advance: eligibleToAdvance,
      completed_program: completedProgram,
      requires_more_time: requiresMoreTime,
      is_phase_extended: enrollment.is_phase_extended,
      extended_sessions_count: enrollment.extended_sessions_count,
      current_phase_id:
        advanced && !completedProgram && nextPhase ? nextPhase.id : currentPhase?.id,
      current_phase_order:
        advanced && !completedProgram && nextPhase
          ? nextPhase.phase_order
          : currentPhase?.phase_order,
      current_phase_title:
        advanced && !completedProgram && nextPhase ? nextPhase.title : currentPhase?.title,
      next_phase_id: nextPhase?.id || null,
      next_phase_order: nextPhase?.phase_order || null,
      next_phase_title: nextPhase?.title || null,
      sessions_completed: sessionsCompleted,
      required_sessions: requiredSessions,
      avg_pain_score: avgPain,
      max_allowed_pain_score: maxAllowedPain,
      program_title: enrollment.program?.title,
    };
  } catch (evalErr) {
    console.warn('[rehabProgressionService] Fallback evaluation exception:', evalErr);
    return {
      success: true,
      log_id: insertedLogId,
      evaluated: false,
      advanced: false,
      eligible_to_advance: false,
      completed_program: false,
      requires_more_time: false,
      message: 'Session recorded successfully.',
    };
  }
}

/**
 * Explicitly advance the user to the next rehabilitation phase
 * when they feel ready and choose "Advance to Next Phase".
 */
export async function advanceToNextRehabPhase(
  userId?: string,
  enrollmentId?: string
): Promise<{
  success: boolean;
  advanced?: boolean;
  completed_program?: boolean;
  new_phase_id?: string;
  new_phase_order?: number;
  new_phase_title?: string;
}> {
  try {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (uid) {
      const { data, error } = await supabase.rpc('advance_rehab_phase', {
        p_user_id: uid,
        p_enrollment_id: enrollmentId && !enrollmentId.startsWith('mock-') ? enrollmentId : null,
      });

      if (!error && data && data.success) {
        await saveLocalEnrollmentOverride({
          current_phase_id: data.new_phase_id,
          is_phase_extended: false,
          extended_sessions_count: 0,
          progression_preference: 'prompt_user',
        });
        return data;
      }
    }

    // Local fallback if mock or offline
    const override = (await getLocalEnrollmentOverride()) || {};
    await saveLocalEnrollmentOverride({
      ...override,
      is_phase_extended: false,
      extended_sessions_count: 0,
      progression_preference: 'prompt_user',
    });
    return { success: true, advanced: true };
  } catch (err) {
    console.warn('[rehabProgressionService] Error in advanceToNextRehabPhase:', err);
    return { success: false };
  }
}

/**
 * User-controlled Phase Retention ("Keep Practicing Current Phase"):
 * Keeps the user in their current phase even after meeting session/pain criteria,
 * increments extended_sessions_count, and updates the dynamic timeline forecast.
 */
export async function keepPracticingCurrentRehabPhase(
  userId?: string,
  enrollmentId?: string,
  additionalSessions: number = 3
): Promise<{
  success: boolean;
  is_phase_extended: boolean;
  extended_sessions_count: number;
}> {
  try {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (uid) {
      const { data, error } = await supabase.rpc('extend_rehab_phase', {
        p_user_id: uid,
        p_enrollment_id: enrollmentId && !enrollmentId.startsWith('mock-') ? enrollmentId : null,
        p_additional_sessions: additionalSessions,
      });

      if (!error && data && data.success) {
        await saveLocalEnrollmentOverride({
          is_phase_extended: true,
          extended_sessions_count: data.extended_sessions_count,
          progression_preference: 'manual_hold',
        });
        return {
          success: true,
          is_phase_extended: true,
          extended_sessions_count: data.extended_sessions_count,
        };
      }
    }

    // Local fallback
    const override = (await getLocalEnrollmentOverride()) || {};
    const nextCount = (override.extended_sessions_count || 0) + Math.max(1, additionalSessions);
    await saveLocalEnrollmentOverride({
      ...override,
      is_phase_extended: true,
      extended_sessions_count: nextCount,
      progression_preference: 'manual_hold',
    });

    return {
      success: true,
      is_phase_extended: true,
      extended_sessions_count: nextCount,
    };
  } catch (err) {
    console.warn('[rehabProgressionService] Error in keepPracticingCurrentRehabPhase:', err);
    return {
      success: false,
      is_phase_extended: true,
      extended_sessions_count: additionalSessions,
    };
  }
}

/**
 * Enroll or switch user into a rehabilitation program and set its first phase active
 */
export async function enrollUserInProgram(programId: string, userId?: string): Promise<boolean> {
  try {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return false;

    const { data: phases, error: pErr } = await supabase
      .from('program_phases')
      .select('id')
      .eq('program_id', programId)
      .order('phase_order', { ascending: true })
      .limit(1);

    if (pErr || !phases || phases.length === 0) {
      return false;
    }

    const firstPhaseId = phases[0].id;

    await supabase
      .from('user_enrollments')
      .update({ status: 'paused', updated_at: new Date().toISOString() })
      .eq('user_id', uid)
      .eq('status', 'active');

    const { data: existing } = await supabase
      .from('user_enrollments')
      .select('id, current_phase_id')
      .eq('user_id', uid)
      .eq('program_id', programId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('user_enrollments')
        .update({
          status: 'active',
          current_phase_id: existing.current_phase_id || firstPhaseId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('user_enrollments')
        .insert({
          user_id: uid,
          program_id: programId,
          current_phase_id: firstPhaseId,
          status: 'active',
          requires_more_time: false,
          is_phase_extended: false,
          extended_sessions_count: 0,
          progression_preference: 'prompt_user',
          started_at: new Date().toISOString(),
        });
    }

    return true;
  } catch (err) {
    console.warn('[rehabProgressionService] Error in enrollUserInProgram:', err);
    return false;
  }
}
