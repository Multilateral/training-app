// ============================================================================
// Service: rehabProgressionService.ts
// Handles communication with Supabase for criteria-based phase progressions
// ============================================================================

import { supabase } from '../context/TrainingContext';

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
  phases: ProgramPhase[];
}

export interface UserEnrollment {
  id: string;
  user_id: string;
  program_id: string;
  current_phase_id: string;
  status: 'active' | 'completed' | 'paused';
  requires_more_time: boolean;
  started_at: string;
  completed_at?: string;
  program?: RehabProgram;
  current_phase?: ProgramPhase;
  sessions_completed_in_phase?: number;
  avg_pain_last_3?: number;
}

export interface GatekeeperEvaluationResult {
  success: boolean;
  evaluated: boolean;
  advanced: boolean;
  completed_program: boolean;
  requires_more_time: boolean;
  current_phase_id?: string;
  current_phase_order?: number;
  current_phase_title?: string;
  sessions_completed?: number;
  required_sessions?: number;
  avg_pain_score?: number;
  max_allowed_pain_score?: number;
  recent_pain_scores?: number[];
  program_title?: string;
  message?: string;
}

/**
 * Fetch the active enrollment for a given user, including program and phase metadata.
 */
export async function getActiveUserEnrollment(userId?: string): Promise<UserEnrollment | null> {
  try {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
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
        started_at,
        completed_at,
        rehab_programs (
          id,
          title,
          description,
          target_joint,
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

    const currentPhase = sortedPhases.find((p) => p.id === enrollment.current_phase_id);

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

    return {
      id: enrollment.id,
      user_id: enrollment.user_id,
      program_id: enrollment.program_id,
      current_phase_id: enrollment.current_phase_id,
      status: enrollment.status as 'active' | 'completed' | 'paused',
      requires_more_time: Boolean(enrollment.requires_more_time),
      started_at: enrollment.started_at,
      completed_at: enrollment.completed_at,
      program: {
        id: rawProgram.id,
        title: rawProgram.title,
        description: rawProgram.description,
        target_joint: rawProgram.target_joint,
        phases: sortedPhases,
      },
      current_phase: currentPhase,
      sessions_completed_in_phase: completedCount,
      avg_pain_last_3: avgPain,
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
}): Promise<GatekeeperEvaluationResult> {
  const uid = params.userId || (await supabase.auth.getUser()).data.user?.id;
  if (!uid) {
    throw new Error('User must be authenticated to log a criteria-gated session.');
  }

  const { data, error } = await supabase.rpc('log_and_evaluate_rehab_session', {
    p_user_id: uid,
    p_program_phase_id: params.programPhaseId,
    p_pain_score: Math.round(params.painScore),
    p_session_id: params.sessionId || null,
    p_duration_minutes: params.durationMinutes || 30,
    p_notes: params.notes || null,
  });

  if (error) {
    console.error('[rehabProgressionService] RPC log_and_evaluate_rehab_session error:', error);
    throw error;
  }

  return data as GatekeeperEvaluationResult;
}

/**
 * Enroll or switch user into a rehabilitation program and set its first phase active
 */
export async function enrollUserInProgram(programId: string, userId?: string): Promise<boolean> {
  try {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return false;

    // 1. Fetch first phase of this program
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

    // 2. Pause any other active enrollments for this user
    await supabase
      .from('user_enrollments')
      .update({ status: 'paused', updated_at: new Date().toISOString() })
      .eq('user_id', uid)
      .eq('status', 'active');

    // 3. Upsert user enrollment for this program
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
          started_at: new Date().toISOString(),
        });
    }

    return true;
  } catch (err) {
    console.warn('[rehabProgressionService] Error in enrollUserInProgram:', err);
    return false;
  }
}
