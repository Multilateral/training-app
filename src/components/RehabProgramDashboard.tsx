import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { KinetixTheme } from '../constants/theme';
import {
  getActiveUserEnrollment,
  getLocalEnrollmentOverride,
  advanceToNextRehabPhase,
  keepPracticingCurrentRehabPhase,
  UserEnrollment,
  ProgramPhase,
} from '../services/rehabProgressionService';
import RehabPhaseRetentionModal from './RehabPhaseRetentionModal';


export interface RehabProgramDashboardProps {
  userId?: string;
  onStartSession?: (phase: ProgramPhase) => void;
}

// Fallback seed data if database is not yet populated or offline
const DEFAULT_LOWER_BACK_PROGRAM: UserEnrollment = {
  id: 'mock-enrollment-1',
  user_id: 'mock-user',
  program_id: 'prog-lb-1',
  current_phase_id: 'phase-lb-1',
  status: 'active',
  requires_more_time: true, // Demonstrating gentle banner
  started_at: new Date().toISOString(),
  sessions_completed_in_phase: 5,
  avg_pain_last_3: 3.2,
  program: {
    id: 'prog-lb-1',
    title: 'Lower Back Resilience',
    description: 'Phased, criteria-based lumbar spine rehabilitation targeting motor control, endurance, and loaded posterior chain strength.',
    target_joint: 'lumbar_spine',
    phases: [
      {
        id: 'phase-lb-1',
        program_id: 'prog-lb-1',
        phase_order: 1,
        title: 'Phase 1: Acute Decompression & McGill Big 3',
        description: 'Desensitize neural pain triggers and restore isometric spinal stiffness using the McGill Big 3 (Curl-up, Side Bridge, Bird Dog).',
        required_sessions_to_pass: 8,
        max_allowed_pain_score: 4.0,
      },
      {
        id: 'phase-lb-2',
        program_id: 'prog-lb-1',
        phase_order: 2,
        title: 'Phase 2: Loaded Motor Control & Anti-Extension',
        description: 'Progress from static core stiffness to loaded hip hinge mechanics and anti-rotational resistance (Pallof press, suitcase carries).',
        required_sessions_to_pass: 10,
        max_allowed_pain_score: 3.5,
      },
      {
        id: 'phase-lb-3',
        program_id: 'prog-lb-1',
        phase_order: 3,
        title: 'Phase 3: Dynamic Plyometric & Rotational Resilience',
        description: 'Recondition the athlete for high-velocity ground reaction forces, medicine ball rotational throws, and multi-planar return to sport.',
        required_sessions_to_pass: 12,
        max_allowed_pain_score: 3.0,
      },
    ],
  },
};

export default function RehabProgramDashboard({
  userId,
  onStartSession,
}: RehabProgramDashboardProps) {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<UserEnrollment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showRetentionModal, setShowRetentionModal] = useState<boolean>(false);

  const fetchEnrollment = useCallback(async () => {
    try {
      const [data, localOverride] = await Promise.all([
        getActiveUserEnrollment(userId),
        getLocalEnrollmentOverride(),
      ]);
      if (data) {
        setEnrollment(data);
      } else {
        // Fallback to demo structure merged with any local phase retention overrides
        setEnrollment({
          ...DEFAULT_LOWER_BACK_PROGRAM,
          ...(localOverride || {}),
        });
      }
    } catch (err) {
      console.warn('[RehabProgramDashboard] Falling back to default program:', err);
      setEnrollment(DEFAULT_LOWER_BACK_PROGRAM);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchEnrollment();
  }, [fetchEnrollment]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEnrollment();
  };

  if (loading && !enrollment) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={KinetixTheme.colors.primary} />
        <Text style={styles.loadingText}>Loading Rehabilitation Program...</Text>
      </View>
    );
  }

  const currentProgram = enrollment?.program;
  const phases = currentProgram?.phases || [];
  const currentPhaseId = enrollment?.current_phase_id;
  const sessionsCompleted = enrollment?.sessions_completed_in_phase ?? 5;
  const avgPainLast3 = enrollment?.avg_pain_last_3 ?? 3.2;
  const requiresMoreTime = Boolean(enrollment?.requires_more_time);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Program Header */}
      <View style={styles.headerCard}>
        <View style={styles.programBadgeRow}>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusPillText}>CRITERIA-BASED PROTOCOL</Text>
          </View>
          <Text style={styles.programMetaText}>3 PHASES</Text>
        </View>

        <Text style={styles.programTitle}>{currentProgram?.title || 'Lower Back Resilience'}</Text>
        <Text style={styles.programDesc}>
          {currentProgram?.description ||
            'Progressive rehabilitation protocol. Progression between phases is strictly earned through session consistency and pain tolerance gates.'}
        </Text>
      </View>

      {/* Gentle Banner: Shown if requires_more_time is flagged */}
      {requiresMoreTime && (
        <View style={styles.gentleBanner}>
          <View style={styles.bannerHeader}>
            <View style={styles.bannerIconBadge}>
              <Ionicons name="sparkles" size={18} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Foundation Adaptation Period</Text>
              <Text style={styles.bannerSubtitle}>Criteria Gate Guidance</Text>
            </View>
            <View style={styles.bannerPill}>
              <Text style={styles.bannerPillText}>ACTIVE</Text>
            </View>
          </View>

          <Text style={styles.bannerQuote}>
            "Your tissues are still adapting. Let's stay in Phase 1 for a bit longer to build a solid foundation."
          </Text>

          <Text style={styles.bannerBody}>
            Biological remodeling of disc, ligamentous, and tendon collagen requires repetitive, pain-free
            stimulus. Your recent 3-session pain score averaged{' '}
            <Text style={{ fontWeight: '800', color: '#B45309' }}>{avgPainLast3} / 10</Text>. Continuing in
            Phase 1 allows mechanoreceptors to desensitize and prevents reinjury.
          </Text>

          <View style={styles.bannerMetaRow}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#B45309" />
            <Text style={styles.bannerMetaText}>
              Threshold Target: 3-session pain average &lt; 4.0 / 10
            </Text>
          </View>
        </View>
      )}

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeading}>Progression Phases</Text>
        <Text style={styles.sectionSub}>Earn each phase via criteria gates</Text>
      </View>

      {/* Phases List */}
      {phases.map((phase, index) => {
        const isActive = phase.id === currentPhaseId;
        const isPast =
          phases.findIndex((p) => p.id === currentPhaseId) > index;
        const isLocked = !isActive && !isPast;

        // Active Phase rendering
        if (isActive) {
          const reqSessions = phase.required_sessions_to_pass || 8;
          const progressPercent = Math.min(100, Math.round((sessionsCompleted / reqSessions) * 100));
          const isPainPassing = avgPainLast3 < phase.max_allowed_pain_score;

          return (
            <View key={phase.id} style={styles.activePhaseCard}>
              {/* Phase Top Bar */}
              <View style={styles.phaseTopBar}>
                <View style={styles.activeBadge}>
                  <Ionicons name="radio-button-on" size={12} color="#059669" />
                  <Text style={styles.activeBadgeText}>ACTIVE PHASE</Text>
                </View>
                <Text style={styles.phaseStepText}>Step {phase.phase_order} of {phases.length}</Text>
              </View>

              {/* Title & Description */}
              <Text style={styles.phaseTitle}>{phase.title}</Text>
              <Text style={styles.phaseDescription}>{phase.description}</Text>

              {/* Progress Bar Container */}
              <View style={styles.progressContainer}>
                <View style={styles.progressHeaderRow}>
                  <Text style={styles.progressLabel}>Session Quota Progress</Text>
                  <Text style={styles.progressValue}>
                    {sessionsCompleted} / {reqSessions} Sessions Completed
                  </Text>
                </View>

                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                </View>
                <Text style={styles.progressPercentSub}>
                  {progressPercent}% completed • {Math.max(0, reqSessions - sessionsCompleted)} sessions until gate evaluation
                </Text>
              </View>

              {/* Criteria Gatekeeper Box */}
              <View style={styles.gateCriteriaBox}>
                <View style={styles.gateCriteriaRow}>
                  <Ionicons
                    name={sessionsCompleted >= reqSessions ? 'checkmark-circle' : 'time-outline'}
                    size={16}
                    color={sessionsCompleted >= reqSessions ? '#059669' : '#64748B'}
                  />
                  <Text style={styles.gateCriteriaLabel}>Session Quota Requirement:</Text>
                  <Text style={styles.gateCriteriaVal}>
                    {sessionsCompleted >= reqSessions ? 'PASSED ✓' : `${sessionsCompleted}/${reqSessions}`}
                  </Text>
                </View>

                <View style={styles.gateCriteriaRow}>
                  <Ionicons
                    name={isPainPassing ? 'checkmark-circle' : 'alert-circle'}
                    size={16}
                    color={isPainPassing ? '#059669' : '#D97706'}
                  />
                  <Text style={styles.gateCriteriaLabel}>Last 3-Session Pain Avg:</Text>
                  <Text style={[styles.gateCriteriaVal, { color: isPainPassing ? '#059669' : '#D97706' }]}>
                    {avgPainLast3} / 10 ({isPainPassing ? 'Passing' : `Requires < ${phase.max_allowed_pain_score}`})
                  </Text>
                </View>
              </View>

              {/* Action Button to Start Phase Worksession */}
              <TouchableOpacity
                style={styles.startPhaseBtn}
                activeOpacity={0.88}
                onPress={() => {
                  if (onStartSession) {
                    onStartSession(phase);
                  } else {
                    router.push({
                      pathname: '/active-workout',
                      params: {
                        plan: JSON.stringify({
                          id: currentProgram?.id,
                          name: currentProgram?.title,
                          type: 'rehab',
                        }),
                        worksession: JSON.stringify({
                          name: phase.title,
                          focus: 'Lumbar Spine Decompression',
                          type: 'rehab',
                          estimatedDuration: 30,
                        }),
                      },
                    });
                  }
                }}
              >
                <View style={styles.startBtnContent}>
                  <Ionicons name="play-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.startBtnText}>Start Today's Rehabilitation Session</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>

              {/* User-Controlled Phase Retention ("Keep Practicing") Button */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: enrollment?.is_phase_extended ? '#FFFBEB' : '#F8FAFC',
                  borderWidth: 1,
                  borderColor: enrollment?.is_phase_extended ? '#FCD34D' : '#CBD5E1',
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  marginTop: 10,
                }}
                onPress={() => setShowRetentionModal(true)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Ionicons
                    name="shield-half"
                    size={16}
                    color={enrollment?.is_phase_extended ? '#B45309' : '#047857'}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '800',
                      color: enrollment?.is_phase_extended ? '#92400E' : '#0F172A',
                      flex: 1,
                    }}
                  >
                    {enrollment?.is_phase_extended
                      ? `Practicing Phase ${phase.phase_order} Longer (+${
                          enrollment?.extended_sessions_count || 3
                        } sessions) • Manage`
                      : 'Not Ready for Next Phase? Keep Practicing / Manage Phase'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color="#64748B" />
              </TouchableOpacity>
            </View>
          );
        }

        // Locked Phase rendering (Phase 2 & Phase 3)
        return (
          <View key={phase.id} style={styles.lockedPhaseCard}>
            <View style={styles.lockedTopBar}>
              <View style={styles.lockedBadge}>
                <Ionicons name="lock-closed" size={12} color="#64748B" />
                <Text style={styles.lockedBadgeText}>LOCKED • CRITERIA GATE</Text>
              </View>
              <Text style={styles.lockedStepText}>Phase {phase.phase_order}</Text>
            </View>

            <Text style={styles.lockedTitle}>{phase.title}</Text>
            <Text style={styles.lockedDescription}>{phase.description}</Text>

            {/* Lock Requirements Banner */}
            <View style={styles.lockedRequirementsBox}>
              <View style={styles.lockedReqHeader}>
                <Ionicons name="key-outline" size={14} color="#64748B" />
                <Text style={styles.lockedReqHeaderText}>Requirements to Unlock Phase {phase.phase_order}:</Text>
              </View>
              <Text style={styles.lockedReqItem}>
                • Complete all {phases[index - 1]?.required_sessions_to_pass || 8} sessions in Phase {phase.phase_order - 1}
              </Text>
              <Text style={styles.lockedReqItem}>
                • Maintain 3-session pain score average &lt; {phase.max_allowed_pain_score} / 10
              </Text>
            </View>
          </View>
        );
      })}

      <RehabPhaseRetentionModal
        visible={showRetentionModal}
        programTitle={currentProgram?.title || 'Lower Back Resilience'}
        currentPhaseOrder={
          phases.find((p) => p.id === currentPhaseId)?.phase_order || 1
        }
        currentPhaseTitle={
          phases.find((p) => p.id === currentPhaseId)?.title || 'Phase 1'
        }
        nextPhaseOrder={
          (phases.find((p) => p.id === currentPhaseId)?.phase_order || 1) + 1
        }
        nextPhaseTitle={
          phases.find(
            (p) =>
              p.phase_order ===
              (phases.find((cur) => cur.id === currentPhaseId)?.phase_order || 1) + 1
          )?.title || null
        }
        sessionsCompleted={sessionsCompleted}
        requiredSessions={
          phases.find((p) => p.id === currentPhaseId)?.required_sessions_to_pass || 8
        }
        avgPainScore={avgPainLast3}
        maxAllowedPainScore={
          phases.find((p) => p.id === currentPhaseId)?.max_allowed_pain_score || 4.0
        }
        isPhaseExtended={enrollment?.is_phase_extended}
        extendedSessionsCount={enrollment?.extended_sessions_count}
        onClose={() => setShowRetentionModal(false)}
        onAdvanceToNextPhase={async () => {
          await advanceToNextRehabPhase(userId, enrollment?.id);
          await fetchEnrollment();
          Alert.alert('Phase Advanced! 🎉', 'You have moved to the next rehabilitation phase.');
        }}
        onKeepPracticingCurrentPhase={async (extraSessions) => {
          await keepPracticingCurrentRehabPhase(userId, enrollment?.id, extraSessions);
          await fetchEnrollment();
          Alert.alert(
            'Phase Extended ✓',
            `Added +${extraSessions} practice sessions to your current phase.`
          );
        }}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KinetixTheme.colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: KinetixTheme.colors.textMuted,
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    ...KinetixTheme.shadows.card,
  },
  programBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: KinetixTheme.colors.primary,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
    letterSpacing: 0.5,
  },
  programMetaText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.textMuted,
  },
  programTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.4,
  },
  programDesc: {
    fontSize: 13,
    color: KinetixTheme.colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  gentleBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    marginBottom: 20,
    ...KinetixTheme.shadows.card,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  bannerIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
  },
  bannerSubtitle: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
  },
  bannerPill: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bannerPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78350F',
  },
  bannerQuote: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350F',
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  bannerBody: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
    marginBottom: 12,
  },
  bannerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  bannerMetaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  sectionSub: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    marginTop: 1,
  },
  activePhaseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 18,
    borderWidth: 2,
    borderColor: '#10B981',
    marginBottom: 16,
    ...KinetixTheme.shadows.card,
  },
  phaseTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  phaseStepText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.textMuted,
  },
  phaseTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.2,
  },
  phaseDescription: {
    fontSize: 12,
    color: KinetixTheme.colors.textSecondary,
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 14,
  },
  progressContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: KinetixTheme.borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressPercentSub: {
    fontSize: 10,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
    marginTop: 6,
  },
  gateCriteriaBox: {
    gap: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 14,
  },
  gateCriteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gateCriteriaLabel: {
    fontSize: 12,
    color: KinetixTheme.colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  gateCriteriaVal: {
    fontSize: 12,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  startPhaseBtn: {
    backgroundColor: '#10B981',
    borderRadius: KinetixTheme.borderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  startBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  lockedPhaseCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    opacity: 0.85,
  },
  lockedTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lockedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  lockedStepText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  lockedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569',
  },
  lockedDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  lockedRequirementsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lockedReqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  lockedReqHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  lockedReqItem: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginLeft: 4,
  },
});
