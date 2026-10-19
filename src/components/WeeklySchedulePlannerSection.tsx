import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KinetixTheme } from '../constants/theme';
import { WeeklyScheduleSlot, ScheduleActivityType } from '../types/database';
import {
  WEEKDAYS_ORDERED,
  COLLECTIVE_SPORTS_CATALOG,
  PlanScheduleDependencyReport,
  CollectiveSportOption,
} from '../services/scheduleService';
import {
  DatabasePlan,
  DATABASE_WORKSESSIONS,
  DatabaseWorksessionCard,
} from '../data/databaseLibraryData';

export interface WeeklySchedulePlannerSectionProps {
  schedule: WeeklyScheduleSlot[];
  dependencyReport: PlanScheduleDependencyReport;
  activeWorkoutPlan?: DatabasePlan | null;
  activeRehabPlan?: DatabasePlan | null;
  todayDayIndex: number;
  selectedDayIndex?: number;
  onAddSlot: (newSlot: Omit<WeeklyScheduleSlot, 'id'>) => Promise<void> | void;
  onRemoveSlot: (slotId: string) => Promise<void> | void;
  onSetRestDay: (dayIndex: number) => Promise<void> | void;
  onResetDefaultSchedule: () => Promise<void> | void;
  onOpenPhaseRetentionModal: () => void;
}

const SPORT_DURATION_OPTIONS = [60, 90, 120, 150, 180];

export default function WeeklySchedulePlannerSection({
  schedule,
  dependencyReport,
  activeWorkoutPlan,
  activeRehabPlan,
  todayDayIndex,
  selectedDayIndex,
  onAddSlot,
  onRemoveSlot,
  onSetRestDay,
  onResetDefaultSchedule,
  onOpenPhaseRetentionModal,
}: WeeklySchedulePlannerSectionProps) {
  const [editorVisible, setEditorVisible] = useState<boolean>(false);
  const [editingDayIndex, setEditingDayIndex] = useState<number>(todayDayIndex);
  const [activeTab, setActiveTab] = useState<ScheduleActivityType>('sport');

  // Sport picker state inside editor modal
  const [selectedSport, setSelectedSport] = useState<CollectiveSportOption>(
    COLLECTIVE_SPORTS_CATALOG[0]
  );
  const [sportDurationMins, setSportDurationMins] = useState<number>(120);
  const [sportIntensity, setSportIntensity] = useState<string>('High');

  const openDayEditor = (dayIdx: number, initialTab: ScheduleActivityType = 'workout') => {
    setEditingDayIndex(dayIdx);
    setActiveTab(initialTab);
    setEditorVisible(true);
  };

  const editingDayMeta =
    WEEKDAYS_ORDERED.find((d) => d.day_index === editingDayIndex) || WEEKDAYS_ORDERED[0];

  // Workout sessions available to schedule
  const availableWorkoutSessions: Array<{
    id: string;
    title: string;
    subtitle: string;
    durationMins: number;
    planId: string | null;
  }> = React.useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      subtitle: string;
      durationMins: number;
      planId: string | null;
    }> = [];

    if (activeWorkoutPlan?.worksessions && activeWorkoutPlan.worksessions.length > 0) {
      activeWorkoutPlan.worksessions.forEach((pw) => {
        const dur = parseInt(pw.worksession?.metrics?.duration || '45', 10) || 45;
        list.push({
          id: pw.worksessionId || pw.worksession?.id || `ws-${pw.worksessionName}`,
          title: pw.worksession?.title || pw.worksessionName || 'Workout Session',
          subtitle: `${activeWorkoutPlan.name} • Prescribed Session`,
          durationMins: dur,
          planId: activeWorkoutPlan.id,
        });
      });
    }

    DATABASE_WORKSESSIONS.filter((w) => w.type === 'workout').forEach((ws) => {
      if (!list.some((item) => item.id === ws.id || item.title === ws.title)) {
        const dur = parseInt(ws.metrics?.duration || '45', 10) || 45;
        list.push({
          id: ws.id,
          title: ws.title,
          subtitle: `${ws.category} • Library Worksession`,
          durationMins: dur,
          planId: activeWorkoutPlan?.id || null,
        });
      }
    });

    return list;
  }, [activeWorkoutPlan]);

  // Rehab sessions available to schedule
  const availableRehabSessions: Array<{
    id: string;
    title: string;
    subtitle: string;
    durationMins: number;
    programId: string | null;
    bindToActivePhase: boolean;
  }> = React.useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      subtitle: string;
      durationMins: number;
      programId: string | null;
      bindToActivePhase: boolean;
    }> = [];

    const activePhaseLabel = dependencyReport.rehabDependency.activePhaseTitle;
    const activeProgName = dependencyReport.rehabDependency.programName;

    // Primary option: Dynamic Active Phase Rehab Session
    list.push({
      id:
        activeRehabPlan?.worksessions?.[0]?.worksessionId ||
        DATABASE_WORKSESSIONS.find((w) => w.type === 'rehab')?.id ||
        'ws-rehab-active-phase',
      title: activeProgName,
      subtitle: `Dynamic Phase Binding • Currently ${activePhaseLabel}`,
      durationMins: 25,
      programId: dependencyReport.rehabDependency.programId || activeRehabPlan?.id || 'prog-lb-1',
      bindToActivePhase: true,
    });

    DATABASE_WORKSESSIONS.filter((w) => w.type === 'rehab').forEach((ws) => {
      if (!list.some((item) => item.title.toLowerCase() === ws.title.toLowerCase())) {
        const dur = parseInt(ws.metrics?.duration || '25', 10) || 25;
        list.push({
          id: ws.id,
          title: ws.title,
          subtitle: `${ws.category} • Targeted Rehab Protocol`,
          durationMins: dur,
          programId: activeRehabPlan?.id || null,
          bindToActivePhase: true,
        });
      }
    });

    return list;
  }, [activeRehabPlan, dependencyReport.rehabDependency]);

  const handleAddSportSlot = async () => {
    await onAddSlot({
      day_of_week: editingDayMeta.day_of_week,
      day_index: editingDayIndex,
      activity_type: 'sport',
      title: `${selectedSport.name} Practice`,
      subtitle: `Collective Sport • ${(sportDurationMins / 60).toFixed(1).replace(/\.0$/, '')}h Target`,
      exercise_id: selectedSport.exercise_id,
      target_duration_minutes: sportDurationMins,
      intensity_target: sportIntensity,
      order_index: 0,
    });
    setEditorVisible(false);
  };

  const handleAddWorkoutSlot = async (wsItem: (typeof availableWorkoutSessions)[0]) => {
    await onAddSlot({
      day_of_week: editingDayMeta.day_of_week,
      day_index: editingDayIndex,
      activity_type: 'workout',
      title: wsItem.title,
      subtitle: wsItem.subtitle,
      worksession_id: wsItem.id,
      program_id: wsItem.planId,
      bind_to_active_phase: true,
      target_duration_minutes: wsItem.durationMins,
      intensity_target: 'High',
      order_index: 1,
    });
    setEditorVisible(false);
  };

  const handleAddRehabSlot = async (rehabItem: (typeof availableRehabSessions)[0]) => {
    await onAddSlot({
      day_of_week: editingDayMeta.day_of_week,
      day_index: editingDayIndex,
      activity_type: 'rehab',
      title: rehabItem.title,
      subtitle: rehabItem.subtitle,
      worksession_id: rehabItem.id,
      program_id: rehabItem.programId,
      bind_to_active_phase: rehabItem.bindToActivePhase,
      target_duration_minutes: rehabItem.durationMins,
      intensity_target: 'Light',
      order_index: 2,
    });
    setEditorVisible(false);
  };

  const handleConfirmRestDay = async () => {
    await onSetRestDay(editingDayIndex);
    setEditorVisible(false);
  };

  const { workoutDependency, rehabDependency, sportsSummary } = dependencyReport;

  return (
    <View style={styles.sectionCard}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconSquare}>
            <Ionicons name="layers" size={16} color={KinetixTheme.colors.primary} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Weekly Training Schedule</Text>
            <Text style={styles.sectionSub}>
              Combine Sports, Workout Plans & Rehab Protocols
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.resetTemplateBtn}
          onPress={() => {
            Alert.alert(
              'Reset Hybrid Schedule',
              'Restore the default hybrid template (Mon/Fri Volleyball + Rehab, Tue/Thu Workout + Rehab, Sat Workout, Wed/Sun Rest)?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Restore Template',
                  onPress: () => onResetDefaultSchedule(),
                },
              ]
            );
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={13} color={KinetixTheme.colors.primary} />
          <Text style={styles.resetTemplateText}>Template</Text>
        </TouchableOpacity>
      </View>

      {/* ==================================================================== */}
      {/* 1. PLAN-SCHEDULE DEPENDENCY & DYNAMIC TIMELINE FORECAST              */}
      {/* ==================================================================== */}
      <View style={styles.dependencyContainer}>
        <View style={styles.dependencyHeaderRow}>
          <Ionicons name="git-network-outline" size={14} color="#0F172A" />
          <Text style={styles.dependencyHeaderTitle}>
            PLAN-SCHEDULE DEPENDENCY & TIMELINE FORECAST
          </Text>
        </View>

        {/* A. Workout Plan Dependency Row */}
        <View style={styles.depCard}>
          <View style={styles.depTopRow}>
            <View style={styles.depBadgeRow}>
              <View style={[styles.depDot, { backgroundColor: KinetixTheme.colors.primary }]} />
              <Text style={[styles.depTrackLabel, { color: KinetixTheme.colors.primary }]}>
                WORKOUT PLAN
              </Text>
            </View>
            <View
              style={[
                styles.freqPill,
                workoutDependency.isFrequencyMet ? styles.freqPillMet : styles.freqPillWarn,
              ]}
            >
              <Ionicons
                name={workoutDependency.isFrequencyMet ? 'checkmark-circle' : 'alert-circle'}
                size={12}
                color={workoutDependency.isFrequencyMet ? '#15803D' : '#B45309'}
              />
              <Text
                style={[
                  styles.freqPillText,
                  workoutDependency.isFrequencyMet
                    ? styles.freqPillTextMet
                    : styles.freqPillTextWarn,
                ]}
              >
                {workoutDependency.statusLabel}
              </Text>
            </View>
          </View>
          <Text style={styles.depPlanTitle} numberOfLines={1}>
            {workoutDependency.planName}
          </Text>
        </View>

        {/* B. Rehab Plan Dependency & Phase Retention Row */}
        <View style={[styles.depCard, styles.depCardRehab]}>
          <View style={styles.depTopRow}>
            <View style={styles.depBadgeRow}>
              <View
                style={[styles.depDot, { backgroundColor: KinetixTheme.colors.secondary }]}
              />
              <Text style={[styles.depTrackLabel, { color: KinetixTheme.colors.secondary }]}>
                REHAB PROTOCOL • PHASE {rehabDependency.activePhaseOrder} OF{' '}
                {rehabDependency.totalPhases}
              </Text>
            </View>
            <View
              style={[
                styles.freqPill,
                rehabDependency.isFrequencyMet ? styles.freqPillMet : styles.freqPillWarn,
              ]}
            >
              <Ionicons
                name={rehabDependency.isFrequencyMet ? 'checkmark-circle' : 'alert-circle'}
                size={12}
                color={rehabDependency.isFrequencyMet ? '#15803D' : '#B45309'}
              />
              <Text
                style={[
                  styles.freqPillText,
                  rehabDependency.isFrequencyMet
                    ? styles.freqPillTextMet
                    : styles.freqPillTextWarn,
                ]}
              >
                {rehabDependency.statusLabel}
              </Text>
            </View>
          </View>

          <Text style={styles.depPlanTitle} numberOfLines={1}>
            {rehabDependency.programName}
          </Text>
          <Text style={styles.depPhaseSub} numberOfLines={1}>
            Active: {rehabDependency.activePhaseTitle} ({rehabDependency.sessionsCompletedInPhase}/
            {rehabDependency.requiredSessionsInPhase} sessions)
          </Text>

          {/* Dynamic Forecast & Phase Retention Metrics */}
          <View style={styles.timelineMetricsRow}>
            <View style={styles.timelineMetricItem}>
              <Ionicons name="hourglass-outline" size={12} color="#059669" />
              <Text style={styles.timelineMetricText}>
                Phase {rehabDependency.activePhaseOrder}: ~
                {rehabDependency.estimatedWeeksCurrentPhase}{' '}
                {rehabDependency.estimatedWeeksCurrentPhase === 1 ? 'wk' : 'wks'} left
              </Text>
            </View>
            <Text style={styles.timelineDot}>•</Text>
            <View style={styles.timelineMetricItem}>
              <Ionicons name="calendar-outline" size={12} color="#0F172A" />
              <Text style={styles.timelineMetricText}>
                Full Rehab Est: ~{rehabDependency.estimatedWeeksTotalRemaining} wks
              </Text>
            </View>
          </View>

          {rehabDependency.isPhaseExtended && (
            <View style={styles.extendedNoticeBar}>
              <Ionicons name="shield-half" size={13} color="#B45309" />
              <Text style={styles.extendedNoticeText}>
                Practicing Current Phase Longer (+{rehabDependency.extendedSessionsCount} extra
                sessions • Timeline adjusted)
              </Text>
            </View>
          )}

          {/* User-Controlled Phase Retention / Readiness Button */}
          <TouchableOpacity
            style={styles.retentionActionBtn}
            onPress={onOpenPhaseRetentionModal}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={14} color="#047857" />
            <Text style={styles.retentionActionBtnText}>
              {rehabDependency.eligibleToAdvance
                ? 'Ready for Next Phase or Keep Practicing? Choose Here'
                : 'Not Ready to Advance? Extend Current Phase Practice'}
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#047857" />
          </TouchableOpacity>
        </View>

        {/* C. Collective Sports Summary Bar */}
        {sportsSummary.scheduledDaysPerWeek > 0 && (
          <View style={styles.sportsSummaryBar}>
            <View style={styles.sportsSummaryLeft}>
              <Ionicons name="trophy" size={14} color="#D97706" />
              <Text style={styles.sportsSummaryTitle}>
                {sportsSummary.sportNames.join(', ') || 'Collective Sports'}:{' '}
                {sportsSummary.scheduledDaysPerWeek} days/wk
              </Text>
            </View>
            <View style={styles.sportsHoursPill}>
              <Text style={styles.sportsHoursPillText}>
                {sportsSummary.totalWeeklyHoursFormatted}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* ==================================================================== */}
      {/* 2. 7-DAY INTERACTIVE WEEKLY SCHEDULE (MON - SUN)                     */}
      {/* ==================================================================== */}
      <View style={styles.daysListContainer}>
        {WEEKDAYS_ORDERED.map((dayMeta) => {
          const isToday = dayMeta.day_index === todayDayIndex;
          const isSelectedDay = dayMeta.day_index === selectedDayIndex;
          const daySlots = schedule
            .filter((s) => Number(s.day_index) === dayMeta.day_index)
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

          const activeSlots = daySlots.filter((s) => s.activity_type !== 'rest');
          const isRest = activeSlots.length === 0;

          return (
            <View
              key={dayMeta.day_of_week}
              style={[
                styles.dayRowCard,
                isToday && styles.dayRowCardToday,
                isSelectedDay && !isToday && styles.dayRowCardSelected,
              ]}
            >
              {/* Day Header Bar */}
              <View style={styles.dayRowHeader}>
                <View style={styles.dayRowHeaderLeft}>
                  <View
                    style={[
                      styles.dayBadgeCircle,
                      isToday && styles.dayBadgeCircleToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayBadgeLetter,
                        isToday && styles.dayBadgeLetterToday,
                      ]}
                    >
                      {dayMeta.shortLabel}
                    </Text>
                  </View>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.dayFullName}>{dayMeta.day_of_week}</Text>
                      {isToday && (
                        <View style={styles.todayMiniTag}>
                          <Text style={styles.todayMiniTagText}>TODAY</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.daySummarySub}>
                      {isRest
                        ? 'Rest & Recovery Day'
                        : `${activeSlots.length} ${
                            activeSlots.length === 1 ? 'activity' : 'activities'
                          } • ${activeSlots.reduce(
                            (sum, s) => sum + (s.target_duration_minutes || 30),
                            0
                          )} min total`}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.addDaySlotBtn}
                  onPress={() => openDayEditor(dayMeta.day_index, 'sport')}
                  activeOpacity={0.75}
                >
                  <Ionicons name="add" size={14} color={KinetixTheme.colors.primary} />
                  <Text style={styles.addDaySlotBtnText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Stacked Activities for this Day */}
              <View style={styles.dayActivitiesStack}>
                {isRest ? (
                  <TouchableOpacity
                    style={styles.restSlotItem}
                    onPress={() => openDayEditor(dayMeta.day_index, 'workout')}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="moon-outline" size={15} color="#64748B" />
                    <Text style={styles.restSlotText}>
                      Rest & Tissue Adaptation Day (Tap + Add to schedule training)
                    </Text>
                  </TouchableOpacity>
                ) : (
                  activeSlots.map((slot) => {
                    const isSport = slot.activity_type === 'sport';
                    const isRehab = slot.activity_type === 'rehab';

                    const accentColor = isSport
                      ? '#D97706'
                      : isRehab
                      ? KinetixTheme.colors.secondary
                      : KinetixTheme.colors.primary;

                    const bgTint = isSport
                      ? '#FFFBEB'
                      : isRehab
                      ? '#ECFDF5'
                      : '#EFF6FF';

                    const borderColor = isSport
                      ? '#FDE68A'
                      : isRehab
                      ? '#A7F3D0'
                      : '#BFDBFE';

                    const iconName = isSport
                      ? 'trophy-outline'
                      : isRehab
                      ? 'bandage-outline'
                      : 'barbell-outline';

                    const durationLabel = isSport
                      ? `${((slot.target_duration_minutes || 120) / 60)
                          .toFixed(1)
                          .replace(/\.0$/, '')}h (${slot.target_duration_minutes || 120}m)`
                      : `${slot.target_duration_minutes || 35}m`;

                    return (
                      <View
                        key={slot.id}
                        style={[
                          styles.slotCard,
                          { backgroundColor: bgTint, borderColor },
                        ]}
                      >
                        <View style={styles.slotCardLeft}>
                          <View
                            style={[
                              styles.slotIconBox,
                              { backgroundColor: '#FFFFFF', borderColor },
                            ]}
                          >
                            <Ionicons name={iconName as any} size={15} color={accentColor} />
                          </View>
                          <View style={{ flex: 1, paddingRight: 6 }}>
                            <View style={styles.slotTitleRow}>
                              <Text style={styles.slotTitle} numberOfLines={1}>
                                {slot.title}
                              </Text>
                              <View
                                style={[
                                  styles.slotDurationChip,
                                  { borderColor: `${accentColor}40` },
                                ]}
                              >
                                <Text
                                  style={[styles.slotDurationChipText, { color: accentColor }]}
                                >
                                  {durationLabel}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.slotSubtitle} numberOfLines={1}>
                              {isRehab && slot.bind_to_active_phase
                                ? `Phase ${rehabDependency.activePhaseOrder} Active • ${
                                    slot.subtitle || 'Clinical Rehab'
                                  }`
                                : slot.subtitle || `${slot.intensity_target || 'High'} Intensity`}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.slotActionsRow}>
                          <TouchableOpacity
                            style={styles.slotDeleteBtn}
                            onPress={() => onRemoveSlot(slot.id)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="close" size={14} color="#64748B" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* ==================================================================== */}
      {/* 3. DAY SCHEDULE EDITOR MODAL                                         */}
      {/* ==================================================================== */}
      <Modal
        visible={editorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditorVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalTopRow}>
              <View>
                <Text style={styles.modalTitle}>
                  Schedule {editingDayMeta.day_of_week}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Stack Sports, Workout Plans, Rehab Protocols, or Rest
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setEditorVisible(false)}
              >
                <Ionicons name="close" size={20} color={KinetixTheme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Day Selector Strip inside Modal */}
            <View style={styles.modalDayStrip}>
              {WEEKDAYS_ORDERED.map((d) => {
                const isSelected = d.day_index === editingDayIndex;
                return (
                  <TouchableOpacity
                    key={d.day_index}
                    style={[
                      styles.modalDayPill,
                      isSelected && styles.modalDayPillActive,
                    ]}
                    onPress={() => setEditingDayIndex(d.day_index)}
                  >
                    <Text
                      style={[
                        styles.modalDayPillText,
                        isSelected && styles.modalDayPillTextActive,
                      ]}
                    >
                      {d.shortLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Activity Type Tabs */}
            <View style={styles.typeTabsRow}>
              {[
                { key: 'sport', label: 'Sport', icon: 'trophy-outline', color: '#D97706' },
                {
                  key: 'workout',
                  label: 'Workout',
                  icon: 'barbell-outline',
                  color: KinetixTheme.colors.primary,
                },
                {
                  key: 'rehab',
                  label: 'Rehab',
                  icon: 'bandage-outline',
                  color: KinetixTheme.colors.secondary,
                },
                { key: 'rest', label: 'Off Day', icon: 'moon-outline', color: '#64748B' },
              ].map((t) => {
                const isActive = activeTab === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[
                      styles.typeTabBtn,
                      isActive && {
                        backgroundColor: `${t.color}15`,
                        borderColor: t.color,
                      },
                    ]}
                    onPress={() => setActiveTab(t.key as ScheduleActivityType)}
                  >
                    <Ionicons
                      name={t.icon as any}
                      size={14}
                      color={isActive ? t.color : KinetixTheme.colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.typeTabText,
                        isActive && { color: t.color, fontWeight: '800' },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              {/* TAB 1: COLLECTIVE SPORT */}
              {activeTab === 'sport' && (
                <View>
                  <Text style={styles.pickerSectionLabel}>CHOOSE COLLECTIVE SPORT</Text>
                  <View style={styles.sportsGrid}>
                    {COLLECTIVE_SPORTS_CATALOG.map((sport) => {
                      const isPicked = selectedSport.exercise_id === sport.exercise_id;
                      return (
                        <TouchableOpacity
                          key={sport.exercise_id}
                          style={[
                            styles.sportChoiceCard,
                            isPicked && styles.sportChoiceCardActive,
                          ]}
                          onPress={() => {
                            setSelectedSport(sport);
                            setSportDurationMins(sport.default_duration_minutes);
                          }}
                        >
                          <Ionicons
                            name={sport.icon as any}
                            size={16}
                            color={isPicked ? '#B45309' : KinetixTheme.colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.sportChoiceText,
                              isPicked && styles.sportChoiceTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {sport.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={styles.pickerSectionLabel}>TARGET PRACTICE DURATION</Text>
                  <View style={styles.durationChipsRow}>
                    {SPORT_DURATION_OPTIONS.map((mins) => {
                      const isPicked = sportDurationMins === mins;
                      const hrs = (mins / 60).toFixed(1).replace(/\.0$/, '');
                      return (
                        <TouchableOpacity
                          key={mins}
                          style={[
                            styles.durationChip,
                            isPicked && styles.durationChipActive,
                          ]}
                          onPress={() => setSportDurationMins(mins)}
                        >
                          <Text
                            style={[
                              styles.durationChipText,
                              isPicked && styles.durationChipTextActive,
                            ]}
                          >
                            {hrs}h ({mins}m)
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={styles.confirmAddSportBtn}
                    onPress={handleAddSportSlot}
                  >
                    <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.confirmAddSportText}>
                      Add {selectedSport.name} ({(sportDurationMins / 60).toFixed(1)}h) to{' '}
                      {editingDayMeta.day_of_week}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* TAB 2: WORKOUT PLAN SESSIONS */}
              {activeTab === 'workout' && (
                <View>
                  <Text style={styles.pickerSectionLabel}>
                    SELECT WORKOUT SESSION TO ADD TO {editingDayMeta.day_of_week.toUpperCase()}
                  </Text>
                  {availableWorkoutSessions.map((ws) => (
                    <TouchableOpacity
                      key={ws.id}
                      style={styles.optionRowCard}
                      onPress={() => handleAddWorkoutSlot(ws)}
                    >
                      <View style={styles.optionIconBlue}>
                        <Ionicons
                          name="barbell-outline"
                          size={16}
                          color={KinetixTheme.colors.primary}
                        />
                      </View>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.optionTitle}>{ws.title}</Text>
                        <Text style={styles.optionSub}>{ws.subtitle}</Text>
                      </View>
                      <View style={styles.optionAddPill}>
                        <Ionicons name="add" size={14} color={KinetixTheme.colors.primary} />
                        <Text style={styles.optionAddPillText}>{ws.durationMins}m</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* TAB 3: REHAB PROTOCOL SESSIONS */}
              {activeTab === 'rehab' && (
                <View>
                  <Text style={styles.pickerSectionLabel}>
                    SELECT REHAB PROTOCOL (BOUND TO CURRENT PHASE)
                  </Text>
                  {availableRehabSessions.map((rh) => (
                    <TouchableOpacity
                      key={rh.id}
                      style={[styles.optionRowCard, { borderColor: '#A7F3D0' }]}
                      onPress={() => handleAddRehabSlot(rh)}
                    >
                      <View style={styles.optionIconGreen}>
                        <Ionicons
                          name="bandage-outline"
                          size={16}
                          color={KinetixTheme.colors.secondary}
                        />
                      </View>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.optionTitle}>{rh.title}</Text>
                        <Text style={styles.optionSub}>{rh.subtitle}</Text>
                      </View>
                      <View style={[styles.optionAddPill, { backgroundColor: '#ECFDF5' }]}>
                        <Ionicons
                          name="add"
                          size={14}
                          color={KinetixTheme.colors.secondary}
                        />
                        <Text
                          style={[
                            styles.optionAddPillText,
                            { color: KinetixTheme.colors.secondary },
                          ]}
                        >
                          {rh.durationMins}m
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* TAB 4: REST / OFF DAY */}
              {activeTab === 'rest' && (
                <View style={styles.restConfirmBox}>
                  <Ionicons name="moon" size={28} color="#64748B" />
                  <Text style={styles.restConfirmTitle}>
                    Set {editingDayMeta.day_of_week} as an Off / Rest Day
                  </Text>
                  <Text style={styles.restConfirmDesc}>
                    This will clear scheduled workouts on {editingDayMeta.day_of_week} and dedicate
                    the day to central nervous system and tissue recovery.
                  </Text>
                  <TouchableOpacity
                    style={styles.restConfirmBtn}
                    onPress={handleConfirmRestDay}
                  >
                    <Text style={styles.restConfirmBtnText}>
                      Set {editingDayMeta.day_of_week} as Rest Day
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    marginBottom: 14,
    ...KinetixTheme.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconSquare: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: KinetixTheme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  sectionSub: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    fontWeight: '500',
  },
  resetTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  resetTemplateText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.primary,
  },
  dependencyContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    gap: 8,
  },
  dependencyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  dependencyHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  depCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  depCardRehab: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  depTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  depBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  depDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  depTrackLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  freqPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 99,
  },
  freqPillMet: {
    backgroundColor: '#DCFCE7',
  },
  freqPillWarn: {
    backgroundColor: '#FEF3C7',
  },
  freqPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  freqPillTextMet: {
    color: '#15803D',
  },
  freqPillTextWarn: {
    color: '#B45309',
  },
  depPlanTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  depPhaseSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
    marginTop: 2,
  },
  timelineMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
  },
  timelineMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timelineMetricText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  timelineDot: {
    fontSize: 10,
    color: '#059669',
  },
  extendedNoticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  extendedNoticeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#92400E',
    flex: 1,
  },
  retentionActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  retentionActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
    flex: 1,
    marginLeft: 6,
  },
  sportsSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  sportsSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  sportsSummaryTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#92400E',
  },
  sportsHoursPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  sportsHoursPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#B45309',
  },
  daysListContainer: {
    gap: 10,
  },
  dayRowCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayRowCardToday: {
    backgroundColor: '#F8FAFC',
    borderColor: KinetixTheme.colors.primary,
    borderWidth: 1.5,
  },
  dayRowCardSelected: {
    borderColor: '#94A3B8',
  },
  dayRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayRowHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayBadgeCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeCircleToday: {
    backgroundColor: KinetixTheme.colors.primary,
  },
  dayBadgeLetter: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  dayBadgeLetterToday: {
    color: '#FFFFFF',
  },
  dayFullName: {
    fontSize: 13,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  todayMiniTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  todayMiniTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
  },
  daySummarySub: {
    fontSize: 10.5,
    color: KinetixTheme.colors.textMuted,
    fontWeight: '500',
  },
  addDaySlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  addDaySlotBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.primary,
  },
  dayActivitiesStack: {
    gap: 6,
  },
  restSlotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
  },
  restSlotText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 9,
    borderRadius: 9,
    borderWidth: 1,
  },
  slotCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  slotIconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    flexShrink: 1,
  },
  slotDurationChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  slotDurationChipText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  slotSubtitle: {
    fontSize: 10.5,
    color: KinetixTheme.colors.textSecondary,
    marginTop: 1,
  },
  slotActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  slotActionBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  slotDeleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 18,
    ...KinetixTheme.shadows.card,
  },
  modalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: KinetixTheme.colors.text,
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: KinetixTheme.colors.textMuted,
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDayStrip: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  modalDayPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalDayPillActive: {
    backgroundColor: KinetixTheme.colors.primary,
  },
  modalDayPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.textSecondary,
  },
  modalDayPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  typeTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  typeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.textSecondary,
  },
  pickerSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: KinetixTheme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  sportChoiceCard: {
    width: '31.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sportChoiceCardActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  sportChoiceText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.textSecondary,
    flex: 1,
  },
  sportChoiceTextActive: {
    color: '#92400E',
    fontWeight: '800',
  },
  durationChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  durationChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  durationChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  durationChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: KinetixTheme.colors.textSecondary,
  },
  durationChipTextActive: {
    color: '#92400E',
    fontWeight: '800',
  },
  confirmAddSportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#D97706',
    paddingVertical: 12,
    borderRadius: 10,
  },
  confirmAddSportText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  optionRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    gap: 10,
  },
  optionIconBlue: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconGreen: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  optionSub: {
    fontSize: 10.5,
    color: KinetixTheme.colors.textMuted,
    marginTop: 1,
  },
  optionAddPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  optionAddPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
  },
  restConfirmBox: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  restConfirmTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    marginTop: 8,
  },
  restConfirmDesc: {
    fontSize: 11.5,
    color: KinetixTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 16,
  },
  restConfirmBtn: {
    backgroundColor: '#475569',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  restConfirmBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
