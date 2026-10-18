import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { KinetixTheme } from '../constants/theme';
import { TrainingContext, supabase } from '../context/TrainingContext';
import { useProgramBuilderStore } from '../stores/useProgramBuilderStore';
import { DATABASE_PLANS } from '../data/databaseLibraryData';
import { getDeletedPlanIds, markPlanAsDeleted } from '../services/planPersistence';

export interface PlanBuilderProps {
  onSetDefaultPlan?: (planId: string) => void;
  defaultPlanId?: string | null;
  isEmbedded?: boolean;
  onPlanDeleted?: (planId: string) => void;
}

interface UnifiedPlan {
  id: string;
  name: string;
  type: 'rehab_program' | 'training_plan';
  is_standard_template: boolean;
  description: string;
  target_joint: string;
  goal_category: string;
  intensity?: string;
  sessions_per_week?: number;
  phases_count: number;
  worksessions_count: number;
  rawPlan: any;
}

export default function PlanBuilder({
  onSetDefaultPlan = () => {},
  defaultPlanId = null,
  isEmbedded = false,
  onPlanDeleted,
}: PlanBuilderProps) {
  const router = useRouter();
  const { session } = useContext(TrainingContext) || {};
  const userId = session?.user?.id;

  const { startNewProgram, loadPlanForEditing } = useProgramBuilderStore();

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<UnifiedPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'rehab' | 'workout'>('all');

  useEffect(() => {
    fetchPlans();
  }, [userId]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      // 1. Fetch training_plans
      const { data: trainingData, error: trainingError } = await supabase
        .from('training_plans')
        .select(`
          id, name, is_standard_template, user_id, schedule_type,
          goal_category, intensity, sessions_per_week, description,
          plan_worksessions (
            id, day_name, order_index, worksession_id,
            worksessions (
              id, name, modality, description,
              worksession_exercises (
                id, target_sets, target_reps, tracking_type, target_time, notes,
                exercises (id, name, category, equipment, muscle_group, instructions, difficulty, mechanics)
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (trainingError) {
        console.warn('Error loading training_plans:', trainingError.message);
      }

      // 2. Fetch rehab_programs with phases and worksessions
      const { data: rehabData, error: rehabError } = await supabase
        .from('rehab_programs')
        .select(`
          id, title, description, target_joint, estimated_weeks, is_active,
          program_phases (
            id, program_id, phase_order, title, description,
            required_sessions_to_pass, max_allowed_pain_score,
            phase_worksessions (
              id, day_name, order_index, worksession_id
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (rehabError) {
        console.warn('Error loading rehab_programs:', rehabError.message);
      }

      const deletedIds = await getDeletedPlanIds();
      const unified: UnifiedPlan[] = [];

      // Map rehab_programs
      if (rehabData && Array.isArray(rehabData)) {
        rehabData.forEach((rp: any) => {
          if (deletedIds.includes(rp.id)) return;
          const phases = rp.program_phases || [];
          const totalWs = phases.reduce(
            (acc: number, ph: any) => acc + (ph.phase_worksessions?.length || 0),
            0
          );
          unified.push({
            id: rp.id,
            name: rp.title || 'Untitled Rehab Program',
            type: 'rehab_program',
            is_standard_template: false,
            description: rp.description || '',
            target_joint: rp.target_joint || 'General',
            goal_category: 'Rehab Protocol',
            phases_count: phases.length,
            worksessions_count: totalWs,
            rawPlan: rp,
          });
        });
      }

      // Map training_plans
      if (trainingData && Array.isArray(trainingData)) {
        trainingData.forEach((tp: any) => {
          if (deletedIds.includes(tp.id)) return;
          // Avoid duplicate if same id exists in rehab_programs
          if (unified.some((u) => u.id === tp.id)) return;

          const pwList = tp.plan_worksessions || [];
          const isRehab =
            tp.name.toLowerCase().includes('rehab') ||
            tp.name.toLowerCase().includes('recovery') ||
            tp.goal_category?.toLowerCase().includes('rehab');

          unified.push({
            id: tp.id,
            name: tp.name || 'Untitled Plan',
            type: 'training_plan',
            is_standard_template: Boolean(tp.is_standard_template),
            description: tp.description || '',
            target_joint: tp.goal_category || (isRehab ? 'Rehab' : 'Full Body'),
            goal_category: isRehab ? 'Rehab Protocol' : tp.goal_category || 'Training',
            intensity: tp.intensity,
            sessions_per_week: tp.sessions_per_week,
            phases_count: 1,
            worksessions_count: pwList.length,
            rawPlan: tp,
          });
        });
      }

      // Map DATABASE_PLANS (Ensures custom workouts and standard plans are visible in Add/Edit tab)
      if (DATABASE_PLANS && Array.isArray(DATABASE_PLANS)) {
        DATABASE_PLANS.forEach((dp) => {
          if (deletedIds.includes(dp.id)) return;
          if (unified.some((u) => u.id === dp.id)) return;

          const isRehab =
            dp.name.toLowerCase().includes('rehab') ||
            dp.name.toLowerCase().includes('recovery') ||
            dp.goal_category?.toLowerCase().includes('rehab');

          unified.push({
            id: dp.id,
            name: dp.name || 'Untitled Workout Plan',
            type: 'training_plan',
            is_standard_template: Boolean(dp.is_standard_template),
            description: dp.description || '',
            target_joint: dp.goal_category || (isRehab ? 'Rehab' : 'Full Body'),
            goal_category: isRehab ? 'Rehab Protocol' : dp.goal_category || 'Training',
            intensity: 'Intermediate',
            sessions_per_week: dp.worksessions?.length || 3,
            phases_count: 1,
            worksessions_count: dp.worksessions?.length || 0,
            rawPlan: dp,
          });
        });
      }

      setPlans(unified);
    } catch (err) {
      console.error('Failed to fetch unified plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewOnCanvas = () => {
    startNewProgram();
    router.push('/program-builder');
  };

  const handleEditInCanvas = (plan: UnifiedPlan) => {
    loadPlanForEditing(plan.rawPlan);
    router.push('/program-builder');
  };

  const handleDeletePlan = async (plan: UnifiedPlan) => {
    Alert.alert(
      'Delete Plan',
      `Are you sure you want to delete "${plan.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Mark as permanently deleted in local persistence
              await markPlanAsDeleted(plan.id);

              // 2. Delete from Supabase
              if (plan.type === 'rehab_program') {
                await supabase.from('rehab_programs').delete().eq('id', plan.id);
              } else {
                await supabase.from('training_plans').delete().eq('id', plan.id);
              }

              // 3. Update local state
              setPlans((prev) => prev.filter((p) => p.id !== plan.id));

              // 4. Notify parent (KinetixLibrary) to update Rehab and Workout tabs immediately
              if (onPlanDeleted) {
                onPlanDeleted(plan.id);
              }

              Alert.alert('Plan Deleted', `"${plan.name}" was removed.`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete plan.');
            }
          },
        },
      ]
    );
  };

  // Filter plans based on search and type
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchesSearch =
        plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.target_joint.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterType === 'rehab') {
        return (
          plan.type === 'rehab_program' ||
          plan.goal_category.toLowerCase().includes('rehab') ||
          plan.name.toLowerCase().includes('rehab') ||
          plan.name.toLowerCase().includes('recovery')
        );
      }

      if (filterType === 'workout') {
        return (
          plan.type === 'training_plan' &&
          !plan.goal_category.toLowerCase().includes('rehab') &&
          !plan.name.toLowerCase().includes('rehab') &&
          !plan.name.toLowerCase().includes('recovery')
        );
      }

      return true;
    });
  }, [plans, searchQuery, filterType]);

  const rehabCount = useMemo(
    () =>
      plans.filter(
        (p) =>
          p.type === 'rehab_program' ||
          p.goal_category.toLowerCase().includes('rehab') ||
          p.name.toLowerCase().includes('rehab')
      ).length,
    [plans]
  );

  const workoutCount = useMemo(
    () =>
      plans.filter(
        (p) =>
          p.type === 'training_plan' &&
          !p.goal_category.toLowerCase().includes('rehab') &&
          !p.name.toLowerCase().includes('rehab')
      ).length,
    [plans]
  );

  const ContentWrapper = isEmbedded ? View : ScrollView;

  return (
    <View style={[styles.container, isEmbedded && { paddingBottom: 24 }]}>
      <ContentWrapper
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================= */}
        {/* SECTION 1: TOP-DOWN CANVAS BUILDER FOR NEW PLANS          */}
        {/* ========================================================= */}
        <View style={styles.canvasHeroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconBox}>
              <Ionicons name="construct" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.heroTitle}>Top-Down Canvas Builder</Text>
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              </View>
              <Text style={styles.heroSubtitle}>Criteria-Based Multi-Phase Programs</Text>
            </View>
          </View>

          <Text style={styles.heroDesc}>
            Design structured multi-week programs on a unified timeline canvas. Configure clinical
            progression gates, duplicate entire phases with one tap, and inline-create worksessions
            and exercises without leaving your workspace.
          </Text>

          {/* Key Feature Highlights */}
          <View style={styles.featureHighlights}>
            <View style={styles.featurePill}>
              <Ionicons name="shield-checkmark-outline" size={12} color="#2563EB" />
              <Text style={styles.featurePillText}>Progression Gates</Text>
            </View>
            <View style={styles.featurePill}>
              <Ionicons name="copy-outline" size={12} color="#2563EB" />
              <Text style={styles.featurePillText}>1-Tap Duplicate Phase</Text>
            </View>
            <View style={styles.featurePill}>
              <Ionicons name="flash-outline" size={12} color="#2563EB" />
              <Text style={styles.featurePillText}>Inline Worksession & Moves</Text>
            </View>
            <View style={styles.featurePill}>
              <Ionicons name="cloud-upload-outline" size={12} color="#2563EB" />
              <Text style={styles.featurePillText}>Autosaving Drafts</Text>
            </View>
          </View>

          {/* Primary CTA Button */}
          <TouchableOpacity
            style={styles.canvasHeroBtn}
            onPress={handleCreateNewOnCanvas}
            activeOpacity={0.88}
          >
            <Ionicons name="sparkles" size={16} color="#FFFFFF" />
            <Text style={styles.canvasHeroBtnText}>Create New Plan on Canvas</Text>
            <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ========================================================= */}
        {/* SECTION 2: ALREADY CREATED PLANS (MODIFIABLE WITH CANVAS) */}
        {/* ========================================================= */}
        <View style={styles.existingSectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="layers-outline" size={18} color="#2563EB" />
            <Text style={styles.sectionTitleText}>Already Created Plans</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{plans.length}</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitleText}>
            Modify any plan or program using the Top-Down Canvas Builder logic.
          </Text>
        </View>

        {/* Search & Filter Bar */}
        <View style={styles.controlsRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color={KinetixTheme.colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search plans, goals, or targets..."
              placeholderTextColor={KinetixTheme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={KinetixTheme.colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Track Filter Tabs */}
          <View style={styles.filterTabsRow}>
            <TouchableOpacity
              style={[styles.filterTab, filterType === 'all' && styles.filterTabActive]}
              onPress={() => setFilterType('all')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterTabText, filterType === 'all' && styles.filterTabTextActive]}>
                All ({plans.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, filterType === 'rehab' && styles.filterTabActive]}
              onPress={() => setFilterType('rehab')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterTabText, filterType === 'rehab' && styles.filterTabTextActive]}>
                Rehab ({rehabCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, filterType === 'workout' && styles.filterTabActive]}
              onPress={() => setFilterType('workout')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterTabText, filterType === 'workout' && styles.filterTabTextActive]}>
                Workouts ({workoutCount})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading Indicator */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading existing plans...</Text>
          </View>
        ) : filteredPlans.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={42} color={KinetixTheme.colors.textMuted} />
            <Text style={styles.emptyTitle}>No Plans Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'No programs matched your search query.'
                : 'You have not created any plans yet. Tap the button above to build one on the canvas!'}
            </Text>
          </View>
        ) : (
          /* Plan Cards List */
          <View style={styles.cardsList}>
            {filteredPlans.map((plan) => {
              const isActive = defaultPlanId === plan.id;
              const isMultiPhase = plan.type === 'rehab_program' || plan.phases_count > 1;

              return (
                <View key={plan.id} style={[styles.planCard, isActive && styles.planCardActive]}>
                  {/* Top Header Row */}
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.cardTitle}>{plan.name}</Text>
                      {plan.description ? (
                        <Text style={styles.cardDesc} numberOfLines={2}>
                          {plan.description}
                        </Text>
                      ) : null}
                    </View>

                    {/* Active Plan Pill */}
                    {isActive ? (
                      <View style={styles.activePill}>
                        <Ionicons name="checkmark-circle" size={13} color="#059669" />
                        <Text style={styles.activePillText}>Active</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Badges Row */}
                  <View style={styles.badgesRow}>
                    {isMultiPhase ? (
                      <View style={[styles.badge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                        <Ionicons name="shield-checkmark" size={11} color="#059669" />
                        <Text style={[styles.badgeText, { color: '#059669' }]}>Multi-Phase Criteria</Text>
                      </View>
                    ) : (
                      <View style={[styles.badge, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                        <Ionicons name="barbell" size={11} color="#2563EB" />
                        <Text style={[styles.badgeText, { color: '#2563EB' }]}>Routine Plan</Text>
                      </View>
                    )}

                    {plan.is_standard_template ? (
                      <View style={[styles.badge, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }]}>
                        <Text style={[styles.badgeText, { color: '#475569' }]}>Template</Text>
                      </View>
                    ) : (
                      <View style={[styles.badge, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
                        <Text style={[styles.badgeText, { color: '#64748B' }]}>Custom</Text>
                      </View>
                    )}

                    {plan.target_joint ? (
                      <View style={[styles.badge, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}>
                        <Text style={[styles.badgeText, { color: '#7C3AED' }]}>
                          {plan.target_joint}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Metadata Summary Stats */}
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Ionicons name="layers-outline" size={13} color="#64748B" />
                      <Text style={styles.statText}>
                        {plan.phases_count} {plan.phases_count === 1 ? 'Phase' : 'Phases'}
                      </Text>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statItem}>
                      <Ionicons name="flash-outline" size={13} color="#64748B" />
                      <Text style={styles.statText}>
                        {plan.worksessions_count} {plan.worksessions_count === 1 ? 'Session' : 'Sessions'}
                      </Text>
                    </View>

                    {plan.sessions_per_week ? (
                      <>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                          <Ionicons name="calendar-outline" size={13} color="#64748B" />
                          <Text style={styles.statText}>{plan.sessions_per_week}x / week</Text>
                        </View>
                      </>
                    ) : null}
                  </View>

                  {/* Card Bottom Actions */}
                  <View style={styles.cardActionsRow}>
                    {/* Primary Button: Modify on Canvas */}
                    <TouchableOpacity
                      style={styles.modifyCanvasBtn}
                      onPress={() => handleEditInCanvas(plan)}
                      activeOpacity={0.88}
                    >
                      <Ionicons name="construct-outline" size={15} color="#FFFFFF" />
                      <Text style={styles.modifyCanvasBtnText}>Edit in Canvas Builder</Text>
                      <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Secondary: Set as Active / Default */}
                    {!isActive && onSetDefaultPlan && (
                      <TouchableOpacity
                        style={styles.secondaryActionBtn}
                        onPress={() => onSetDefaultPlan(plan.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="star-outline" size={15} color="#475569" />
                      </TouchableOpacity>
                    )}

                    {/* Delete Action */}
                    <TouchableOpacity
                      style={[styles.secondaryActionBtn, { borderColor: '#FEE2E2' }]}
                      onPress={() => handleDeletePlan(plan)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ContentWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KinetixTheme.colors.background,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },

  /* Section 1: Hero Canvas Banner */
  canvasHeroCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    marginBottom: 20,
    ...KinetixTheme.shadows.card,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  heroIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  newBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
    marginTop: 1,
  },
  heroDesc: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 12,
  },
  featureHighlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  featurePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E40AF',
  },
  canvasHeroBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  canvasHeroBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Section 2: Existing Plans */
  existingSectionHeader: {
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  sectionSubtitleText: {
    fontSize: 12,
    color: KinetixTheme.colors.textMuted,
    marginTop: 2,
  },

  /* Controls (Search & Filters) */
  controlsRow: {
    gap: 10,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: KinetixTheme.colors.text,
    padding: 0,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#2563EB',
  },

  /* Loading & Empty */
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: KinetixTheme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },

  /* Cards List */
  cardsList: {
    gap: 12,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...KinetixTheme.shadows.card,
  },
  planCardActive: {
    borderColor: '#2563EB',
    borderWidth: 1.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 10,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modifyCanvasBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modifyCanvasBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
