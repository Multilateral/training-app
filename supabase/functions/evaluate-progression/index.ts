// ============================================================================
// Supabase Edge Function: evaluate-progression
// Path: supabase/functions/evaluate-progression/index.ts
// Runtime: Deno / TypeScript (Supabase Edge Runtime)
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestPayload {
  userId: string;
  programPhaseId: string;
  painScore: number;
  sessionId?: string;
  durationMinutes?: number;
  notes?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables on server.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: RequestPayload = await req.json();
    const { userId, programPhaseId, painScore, sessionId, durationMinutes, notes } = body;

    // 1. Validate payload
    if (!userId || !programPhaseId || typeof painScore !== "number") {
      return new Response(
        JSON.stringify({
          error: "Invalid payload. 'userId', 'programPhaseId', and numeric 'painScore' (0-10) are required.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (painScore < 0 || painScore > 10) {
      return new Response(
        JSON.stringify({ error: "painScore must be between 0 and 10." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Insert session log
    const { data: logEntry, error: logError } = await supabase
      .from("workout_session_logs")
      .insert({
        user_id: userId,
        program_phase_id: programPhaseId,
        session_id: sessionId ?? null,
        pain_score_recorded: painScore,
        duration_minutes: durationMinutes ?? 30,
        notes: notes ?? null,
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (logError) {
      throw logError;
    }

    // 3. Check active user enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from("user_enrollments")
      .select("id, program_id, current_phase_id, status")
      .eq("user_id", userId)
      .eq("current_phase_id", programPhaseId)
      .eq("status", "active")
      .maybeSingle();

    if (enrollError) throw enrollError;

    // If no active enrollment found for this phase, return log confirmation
    if (!enrollment) {
      return new Response(
        JSON.stringify({
          success: true,
          logId: logEntry.id,
          evaluated: false,
          message: "Session logged. User is not currently enrolled in an active progression gate for this phase.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Fetch phase configuration
    const { data: currentPhase, error: phaseError } = await supabase
      .from("program_phases")
      .select("id, program_id, phase_order, title, required_sessions_to_pass, max_allowed_pain_score")
      .eq("id", programPhaseId)
      .single();

    if (phaseError) throw phaseError;

    // 5. Count total completed sessions for this phase
    const { count: sessionsCompleted, error: countError } = await supabase
      .from("workout_session_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("program_phase_id", programPhaseId);

    if (countError) throw countError;

    const totalSessions = sessionsCompleted ?? 1;

    // 6. Calculate average pain over last 3 sessions (including this newly logged session)
    const { data: recentSessions, error: recentError } = await supabase
      .from("workout_session_logs")
      .select("pain_score_recorded")
      .eq("user_id", userId)
      .eq("program_phase_id", programPhaseId)
      .not("pain_score_recorded", "is", null)
      .order("completed_at", { ascending: false })
      .limit(3);

    if (recentError) throw recentError;

    const recentScores: number[] = (recentSessions || []).map((s: { pain_score_recorded: number }) => s.pain_score_recorded);
    const avgPain = recentScores.length > 0
      ? Number((recentScores.reduce((a, b) => a + b, 0) / recentScores.length).toFixed(2))
      : painScore;

    let advanced = false;
    let completedProgram = false;
    let requiresMoreTime = false;
    let nextPhaseData = null;

    // 7. PROGRESSION GATE EVALUATION
    if (totalSessions >= currentPhase.required_sessions_to_pass) {
      if (avgPain < Number(currentPhase.max_allowed_pain_score)) {
        // Find next phase
        const { data: nextPhase } = await supabase
          .from("program_phases")
          .select("id, title, phase_order")
          .eq("program_id", currentPhase.program_id)
          .eq("phase_order", currentPhase.phase_order + 1)
          .maybeSingle();

        if (nextPhase) {
          // Advance to next phase
          await supabase
            .from("user_enrollments")
            .update({
              current_phase_id: nextPhase.id,
              requires_more_time: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", enrollment.id);

          advanced = true;
          completedProgram = false;
          requiresMoreTime = false;
          nextPhaseData = nextPhase;
        } else {
          // Completed the entire program!
          await supabase
            .from("user_enrollments")
            .update({
              status: "completed",
              requires_more_time: false,
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", enrollment.id);

          advanced = true;
          completedProgram = true;
          requiresMoreTime = false;
        }
      } else {
        // Quota met, but pain is too high
        await supabase
          .from("user_enrollments")
          .update({
            requires_more_time: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", enrollment.id);

        advanced = false;
        completedProgram = false;
        requiresMoreTime = true;
      }
    } else {
      // Quota not yet met
      await supabase
        .from("user_enrollments")
        .update({
          requires_more_time: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", enrollment.id);

      advanced = false;
      completedProgram = false;
      requiresMoreTime = false;
    }

    return new Response(
      JSON.stringify({
        success: true,
        logId: logEntry.id,
        evaluated: true,
        advanced,
        completedProgram,
        requiresMoreTime,
        currentPhaseId: advanced && nextPhaseData ? nextPhaseData.id : currentPhase.id,
        currentPhaseOrder: advanced && nextPhaseData ? nextPhaseData.phase_order : currentPhase.phase_order,
        currentPhaseTitle: advanced && nextPhaseData ? nextPhaseData.title : currentPhase.title,
        sessionsCompleted: totalSessions,
        requiredSessions: currentPhase.required_sessions_to_pass,
        avgPainScore: avgPain,
        maxAllowedPainScore: currentPhase.max_allowed_pain_score,
        recentPainScores: recentScores,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
