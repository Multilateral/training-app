import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { KinetixTheme } from '../../constants/theme';
import {
  BuilderWorksession,
  useProgramBuilderStore,
} from '../../stores/useProgramBuilderStore';
import {
  DATABASE_WORKSESSIONS,
  DatabaseWorksessionCard,
} from '../../data/databaseLibraryData';
import { supabase } from '../../context/TrainingContext';

interface WorksheetBottomSheetProps {
  userId?: string;
}

const MODALITIES = ['Clinical Rehab', 'Strength & Power', 'Mobility & Recovery', 'Core Stability'];
type TypeFilter = 'all' | 'rehab' | 'workout';

export default function WorksheetBottomSheet({ userId }: WorksheetBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['92%'], []);

  const {
    isWorksheetSheetOpen,
    activePhaseIdForSheet,
    closeWorksheetSheet,
    addWorksessionToPhase,
    openExerciseQuickCreate,
    draftWorksessionForExercise,
    updateExerciseInDraftWorksession,
    removeExerciseFromDraftWorksession,
  } = useProgramBuilderStore();

  const [activeTab, setActiveTab] = useState<'existing' | 'create_new'>('existing');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [worksessions, setWorksessions] = useState<DatabaseWorksessionCard[]>(DATABASE_WORKSESSIONS);

  // Inline creation state
  const [inlineName, setInlineName] = useState('');
  const [inlineModality, setInlineModality] = useState(MODALITIES[0]);

  // Sync bottom sheet visibility with store state
  useEffect(() => {
    if (isWorksheetSheetOpen) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isWorksheetSheetOpen]);

  // Load custom worksessions from database if user is logged in
  useEffect(() => {
    let isMounted = true;
    async function loadUserWorksessions() {
      if (!userId || !supabase) return;
      try {
        const { data: userWs, error } = await supabase
          .from('worksessions')
          .select(`
            id,
            name,
            modality,
            description,
            user_id,
            worksession_exercises (
              id,
              target_sets,
              target_reps,
              target_time,
              tracking_type,
              notes,
              exercises (id, name, category, equipment, muscle_group, instructions, difficulty, mechanics)
            )
          `)
          .order('created_at', { ascending: false });

        if (!error && userWs && isMounted) {
          const mappedUserWs: DatabaseWorksessionCard[] = userWs.map((ws: any) => {
            const existing = DATABASE_WORKSESSIONS.find((d) => d.id === ws.id);
            if (existing) return existing;

            const isRehab =
              (ws.name || '').toLowerCase().includes('rehab') ||
              (ws.name || '').toLowerCase().includes('recovery') ||
              (ws.modality || '').toLowerCase().includes('rehab');

            const exercises = (ws.worksession_exercises || []).map((we: any) => ({
              name: we.exercises?.name || 'Exercise',
              cue: we.notes || we.exercises?.instructions || 'Controlled execution.',
              sets: we.target_sets || 3,
              reps: we.tracking_type === 'time' ? `${we.target_time || 45}s` : String(we.target_reps || 10),
              weight: 'Standard',
              restSeconds: 60,
              tracking_type: we.tracking_type || 'reps_weight',
              equipment: we.exercises?.equipment || 'Bodyweight',
              muscle_group: we.exercises?.muscle_group || 'General',
              difficulty: we.exercises?.difficulty || 'Intermediate',
              mechanics: we.exercises?.mechanics || 'Compound',
            }));

            const totalSets = exercises.reduce((acc: number, e: any) => acc + (e.sets || 3), 0);
            return {
              id: ws.id,
              type: isRehab ? 'rehab' : 'workout',
              category: ws.modality || (isRehab ? 'Clinical Rehab' : 'Strength & Power'),
              title: ws.name,
              filterTag: isRehab ? 'knee' : 'core',
              description: ws.description || '',
              metrics: {
                duration: `${Math.max(15, exercises.length * 8)} min`,
                sets: `${totalSets} Sets`,
                reps: exercises[0] ? String(exercises[0].reps) : '8-12',
                load: isRehab ? 'Light' : 'Moderate',
              },
              exercises,
            };
          });

          const existingIds = new Set(mappedUserWs.map((w) => w.id));
          const merged = [...mappedUserWs, ...DATABASE_WORKSESSIONS.filter((w) => !existingIds.has(w.id))];
          setWorksessions(merged);
        }
      } catch (err) {
        console.error('[WorksheetBottomSheet] Error loading worksessions:', err);
      }
    }

    if (isWorksheetSheetOpen) {
      loadUserWorksessions();
    }

    return () => {
      isMounted = false;
    };
  }, [isWorksheetSheetOpen, userId]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.5}
      />
    ),
    []
  );

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      closeWorksheetSheet();
      Keyboard.dismiss();
    }
  }, [closeWorksheetSheet]);

  // Counts based on current search query
  const { totalMatchingCount, rehabCount, workoutCount } = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let rCount = 0;
    let wCount = 0;

    worksessions.forEach((ws) => {
      const matchesQuery =
        !q ||
        ws.title.toLowerCase().includes(q) ||
        (ws.category && ws.category.toLowerCase().includes(q)) ||
        (ws.filterTag && ws.filterTag.toLowerCase().includes(q)) ||
        (ws.description && ws.description.toLowerCase().includes(q));

      if (matchesQuery) {
        if (ws.type === 'rehab') rCount++;
        else wCount++;
      }
    });

    return {
      totalMatchingCount: rCount + wCount,
      rehabCount: rCount,
      workoutCount: wCount,
    };
  }, [worksessions, searchQuery]);

  // Tab 1: Choose Existing worksession — Grouped and Sorted
  const filteredExisting = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    // 1. Filter by search query
    let list = worksessions.filter((ws) => {
      if (!q) return true;
      return (
        ws.title.toLowerCase().includes(q) ||
        (ws.category && ws.category.toLowerCase().includes(q)) ||
        (ws.filterTag && ws.filterTag.toLowerCase().includes(q)) ||
        (ws.description && ws.description.toLowerCase().includes(q))
      );
    });

    // 2. Filter by type chip
    if (typeFilter !== 'all') {
      list = list.filter((ws) => ws.type === typeFilter);
    }

    // 3. Group & Sort
    return [...list].sort((a, b) => {
      // Primary Sort: Rehab protocols first, Workout sessions second
      if (a.type !== b.type) {
        return a.type === 'rehab' ? -1 : 1;
      }

      // Secondary Sort:
      if (a.type === 'rehab') {
        // Group rehab by target joint / filterTag, then by title
        const tagA = (a.filterTag || '').toLowerCase();
        const tagB = (b.filterTag || '').toLowerCase();
        if (tagA !== tagB) return tagA.localeCompare(tagB);
        return a.title.localeCompare(b.title);
      } else {
        // Group workouts by category / modality, then by title
        const catA = (a.category || '').toLowerCase();
        const catB = (b.category || '').toLowerCase();
        if (catA !== catB) return catA.localeCompare(catB);
        return a.title.localeCompare(b.title);
      }
    });
  }, [worksessions, searchQuery, typeFilter]);

  const handleSelectExisting = useCallback((item: DatabaseWorksessionCard) => {
    if (!activePhaseIdForSheet) return;

    const worksession: BuilderWorksession = {
      id: item.id,
      name: item.title,
      modality: item.category || (item.type === 'rehab' ? 'Clinical Rehab' : 'Strength & Power'),
      day_name: 'Scheduled Routine',
      is_new: false,
      exercises: (item.exercises || []).map((e, idx) => {
        const isTime = e.tracking_type === 'time';
        const parsedReps = parseInt(String(e.reps)) || 10;
        const defaultDuration = isTime ? parsedReps : 45;
        const defaultRest = e.restSeconds || 60;
        return {
          id: `ex-${item.id}-${idx}`,
          name: e.name,
          muscle_group: e.muscle_group || item.category,
          equipment: e.equipment || 'Standard',
          tracking_type: (e.tracking_type as any) || 'reps',
          target_sets: e.sets || 3,
          target_reps: parsedReps,
          target_time: defaultDuration,
          target_duration_seconds: defaultDuration,
          target_rest_seconds: defaultRest,
          cue: e.cue || 'Controlled execution.',
        };
      }),
    };

    addWorksessionToPhase(activePhaseIdForSheet, worksession, userId);
  }, [activePhaseIdForSheet, userId, addWorksessionToPhase]);

  const renderExistingItem = useCallback(
    ({ item, index }: { item: DatabaseWorksessionCard; index: number }) => {
      // Check if this card starts a new section
      const isFirstInGroup =
        index === 0 || filteredExisting[index - 1]?.type !== item.type;
      const isRehab = item.type === 'rehab';

      return (
        <View>
          {/* Section Header */}
          {isFirstInGroup && (
            <View
              style={[
                styles.sectionHeaderContainer,
                index > 0 && styles.sectionHeaderContainerSpaced,
              ]}
            >
              <View style={styles.sectionHeaderLeft}>
                <View
                  style={[
                    styles.sectionHeaderIconBox,
                    isRehab ? styles.rehabHeaderIconBox : styles.workoutHeaderIconBox,
                  ]}
                >
                  <Ionicons
                    name={isRehab ? 'medkit' : 'barbell'}
                    size={14}
                    color={isRehab ? '#059669' : KinetixTheme.colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionHeaderTitle}>
                    {isRehab
                      ? 'REHABILITATION & CLINICAL PROTOCOLS'
                      : 'TRAINING & WORKOUT SESSIONS'}
                  </Text>
                  <Text style={styles.sectionHeaderSubtitle} numberOfLines={1}>
                    {isRehab
                      ? 'Targeted joint recovery, pain relief & tissue loading'
                      : 'Hypertrophy, strength, conditioning & movement capacity'}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.sectionBadge,
                  isRehab ? styles.rehabSectionBadge : styles.workoutSectionBadge,
                ]}
              >
                <Text
                  style={[
                    styles.sectionBadgeText,
                    isRehab ? styles.rehabSectionBadgeText : styles.workoutSectionBadgeText,
                  ]}
                >
                  {isRehab ? `${rehabCount} Protocols` : `${workoutCount} Sessions`}
                </Text>
              </View>
            </View>
          )}

          {/* Worksession Card */}
          <TouchableOpacity
            style={[
              styles.existingCard,
              isRehab ? styles.rehabCardAccent : styles.workoutCardAccent,
            ]}
            onPress={() => handleSelectExisting(item)}
            activeOpacity={0.7}
          >
            <View style={styles.existingInfo}>
              <View style={styles.existingTagRow}>
                {/* Type Pill */}
                <View
                  style={[
                    styles.typeBadge,
                    isRehab ? styles.rehabTypeBadge : styles.workoutTypeBadge,
                  ]}
                >
                  <Ionicons
                    name={isRehab ? 'medkit' : 'barbell'}
                    size={10}
                    color={isRehab ? '#059669' : KinetixTheme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.typeBadgeText,
                      isRehab ? styles.rehabTypeBadgeText : styles.workoutTypeBadgeText,
                    ]}
                  >
                    {isRehab ? 'REHAB' : 'WORKOUT'}
                  </Text>
                </View>

                {/* Category / Target Joint Pill */}
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText}>
                    {isRehab && item.filterTag
                      ? item.filterTag.toUpperCase()
                      : item.category || 'General'}
                  </Text>
                </View>

                {/* Duration */}
                <View style={styles.durationPill}>
                  <Ionicons name="time-outline" size={11} color="#64748B" />
                  <Text style={styles.existingDuration}>{item.metrics?.duration || '30 min'}</Text>
                </View>
              </View>

              <Text style={styles.existingTitle}>{item.title}</Text>

              {item.description ? (
                <Text style={styles.existingDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}

              <View style={styles.cardFooterRow}>
                <View style={styles.footerBadge}>
                  <Ionicons name="list-outline" size={11} color="#059669" />
                  <Text style={styles.existingExCount}>
                    {item.exercises?.length || 0} exercises
                  </Text>
                </View>
                {item.metrics?.sets ? (
                  <Text style={styles.metricsDetail}>• {item.metrics.sets}</Text>
                ) : null}
                {item.metrics?.load ? (
                  <Text style={styles.metricsDetail}>• {item.metrics.load} load</Text>
                ) : null}
              </View>
            </View>

            <View
              style={[
                styles.selectCircle,
                isRehab ? styles.selectCircleRehab : styles.selectCircleWorkout,
              ]}
            >
              <Ionicons
                name="add"
                size={18}
                color={isRehab ? '#059669' : KinetixTheme.colors.primary}
              />
            </View>
          </TouchableOpacity>
        </View>
      );
    },
    [filteredExisting, handleSelectExisting, rehabCount, workoutCount]
  );

  const renderEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={38} color="#94A3B8" />
        <Text style={styles.emptyTitle}>No worksessions found</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery
            ? `No routines matched "${searchQuery}". Try adjusting your keywords or clearing the filter.`
            : 'No worksessions available for the selected filter.'}
        </Text>
        {(searchQuery.length > 0 || typeFilter !== 'all') && (
          <TouchableOpacity
            style={styles.resetFiltersBtn}
            onPress={() => {
              setSearchQuery('');
              setTypeFilter('all');
            }}
          >
            <Text style={styles.resetFiltersBtnText}>Reset All Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    [searchQuery, typeFilter]
  );

  const keyExtractor = useCallback((item: DatabaseWorksessionCard) => item.id, []);

  // Tab 2: Save inline-created worksession
  const handleSaveInline = () => {
    if (!activePhaseIdForSheet || !inlineName.trim()) return;

    const attachedExercises = draftWorksessionForExercise?.exercises || [];

    const newWs: BuilderWorksession = {
      id: `ws-inline-${Date.now()}`,
      name: inlineName.trim(),
      modality: inlineModality,
      day_name: 'Custom Protocol',
      is_new: true,
      exercises: attachedExercises,
    };

    addWorksessionToPhase(activePhaseIdForSheet, newWs, userId);

    // Reset local state
    setInlineName('');
    setInlineModality(MODALITIES[0]);
  };

  const handleOpenExerciseModal = () => {
    const currentDraft: BuilderWorksession = draftWorksessionForExercise || {
      id: `ws-draft-${Date.now()}`,
      name: inlineName.trim() || 'New Worksession',
      modality: inlineModality,
      exercises: [],
    };
    openExerciseQuickCreate(currentDraft);
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDynamicSizing={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.bottomSheetBg}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <View style={styles.contentContainer}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.sheetTitle}>Add Worksession to Phase</Text>
            <Text style={styles.sheetSubtitle}>Attach existing routine or design inline</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={() => bottomSheetRef.current?.close()}>
            <Ionicons name="close" size={20} color={KinetixTheme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'existing' && styles.tabBtnActive]}
            onPress={() => setActiveTab('existing')}
          >
            <Ionicons
              name="library-outline"
              size={15}
              color={activeTab === 'existing' ? KinetixTheme.colors.primary : KinetixTheme.colors.textMuted}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'existing' && styles.tabBtnTextActive,
              ]}
            >
              Choose Existing ({worksessions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'create_new' && styles.tabBtnActive]}
            onPress={() => setActiveTab('create_new')}
          >
            <Ionicons
              name="sparkles-outline"
              size={15}
              color={activeTab === 'create_new' ? KinetixTheme.colors.primary : KinetixTheme.colors.textMuted}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'create_new' && styles.tabBtnTextActive,
              ]}
            >
              Create New Inline
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Choose Existing */}
        {activeTab === 'existing' && (
          <View style={{ flex: 1 }}>
            {/* Search Bar */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={16} color={KinetixTheme.colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search worksessions by name or target area..."
                placeholderTextColor={KinetixTheme.colors.textMuted}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={KinetixTheme.colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Type Filter Chips */}
            <View style={styles.typeFilterRow}>
              <TouchableOpacity
                style={[
                  styles.typeChip,
                  typeFilter === 'all' && styles.typeChipActiveAll,
                ]}
                onPress={() => setTypeFilter('all')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="layers-outline"
                  size={13}
                  color={typeFilter === 'all' ? '#0F172A' : '#64748B'}
                />
                <Text
                  style={[
                    styles.typeChipText,
                    typeFilter === 'all' && styles.typeChipTextActiveAll,
                  ]}
                >
                  All ({totalMatchingCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeChip,
                  typeFilter === 'rehab' && styles.typeChipActiveRehab,
                ]}
                onPress={() => setTypeFilter('rehab')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="medkit-outline"
                  size={13}
                  color={typeFilter === 'rehab' ? '#059669' : '#64748B'}
                />
                <Text
                  style={[
                    styles.typeChipText,
                    typeFilter === 'rehab' && styles.typeChipTextActiveRehab,
                  ]}
                >
                  Rehab ({rehabCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeChip,
                  typeFilter === 'workout' && styles.typeChipActiveWorkout,
                ]}
                onPress={() => setTypeFilter('workout')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="barbell-outline"
                  size={13}
                  color={typeFilter === 'workout' ? KinetixTheme.colors.primary : '#64748B'}
                />
                <Text
                  style={[
                    styles.typeChipText,
                    typeFilter === 'workout' && styles.typeChipTextActiveWorkout,
                  ]}
                >
                  Workouts ({workoutCount})
                </Text>
              </TouchableOpacity>
            </View>

            <BottomSheetFlatList
              data={filteredExisting}
              keyExtractor={keyExtractor}
              renderItem={renderExistingItem}
              ListEmptyComponent={renderEmptyComponent}
              contentContainerStyle={styles.existingList}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
              initialNumToRender={8}
              maxToRenderPerBatch={10}
              windowSize={5}
            />
          </View>
        )}

        {/* Tab 2: Create New Inline */}
        {activeTab === 'create_new' && (
          <BottomSheetScrollView
            contentContainerStyle={styles.createForm}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {/* Worksession Name */}
            <Text style={styles.formLabel}>Worksession Title *</Text>
            <TextInput
              style={styles.formInput}
              value={inlineName}
              onChangeText={setInlineName}
              placeholder="e.g., Acute Pelvic Decompression Protocol"
              placeholderTextColor={KinetixTheme.colors.textMuted}
            />

            {/* Modality Chips */}
            <Text style={styles.formLabel}>Modality</Text>
            <View style={styles.modalityChipsRow}>
              {MODALITIES.map((mod) => (
                <TouchableOpacity
                  key={mod}
                  style={[styles.modalityChip, inlineModality === mod && styles.modalityChipActive]}
                  onPress={() => setInlineModality(mod)}
                >
                  <Text
                    style={[
                      styles.modalityChipText,
                      inlineModality === mod && styles.modalityChipTextActive,
                    ]}
                  >
                    {mod}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Attached Exercises List */}
            <View style={styles.inlineExSection}>
              <View style={styles.inlineExHeader}>
                <Text style={styles.formLabel}>
                  Prescribed Exercises ({draftWorksessionForExercise?.exercises?.length || 0})
                </Text>
                <TouchableOpacity
                  style={styles.quickAddExBtn}
                  onPress={handleOpenExerciseModal}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={15} color={KinetixTheme.colors.primary} />
                  <Text style={styles.quickAddExText}>+ Add Exercise</Text>
                </TouchableOpacity>
              </View>

              {(draftWorksessionForExercise?.exercises || []).length === 0 ? (
                <View style={styles.emptyExBox}>
                  <Ionicons name="barbell-outline" size={20} color="#94A3B8" />
                  <Text style={styles.emptyExText}>
                    No exercises added yet. Tap "+ Add Exercise" to quick-create exercises inline.
                  </Text>
                </View>
              ) : (
                draftWorksessionForExercise?.exercises.map((ex, exIdx) => {
                  const isTime = ex.tracking_type === 'time';
                  const currentTargetVal = isTime
                    ? ex.target_duration_seconds || ex.target_time || 45
                    : ex.target_reps || 10;
                  const currentRestVal = ex.target_rest_seconds || 60;

                  return (
                    <View key={ex.id || exIdx} style={styles.exCard}>
                      <View style={styles.exIndexBadge}>
                        <Text style={styles.exIndexText}>{exIdx + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.exCardHeaderRow}>
                          <Text style={styles.exTitle}>{ex.name}</Text>
                          <TouchableOpacity
                            onPress={() => removeExerciseFromDraftWorksession(exIdx)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="close-circle" size={16} color="#94A3B8" />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.exMeta}>
                          {ex.target_sets || 3} sets • {ex.equipment || 'Standard'}
                        </Text>

                        {/* Cascading Defaults Compact Interactive Row */}
                        <View style={styles.cascadeDefaultsRow}>
                          <Text style={styles.cascadeLabel}>Target:</Text>
                          <View style={styles.cascadeControlGroup}>
                            <TouchableOpacity
                              style={styles.cascadePillBtn}
                              onPress={() => {
                                if (isTime) {
                                  const newVal = Math.max(5, currentTargetVal - 5);
                                  updateExerciseInDraftWorksession(exIdx, {
                                    target_duration_seconds: newVal,
                                    target_time: newVal,
                                  });
                                } else {
                                  const newVal = Math.max(1, currentTargetVal - 1);
                                  updateExerciseInDraftWorksession(exIdx, {
                                    target_reps: newVal,
                                  });
                                }
                              }}
                            >
                              <Ionicons name="remove" size={11} color={KinetixTheme.colors.primary} />
                            </TouchableOpacity>
                            <View style={styles.cascadeValueBox}>
                              <Text style={styles.cascadeValueText}>
                                [ {currentTargetVal} ] {isTime ? 's' : 'Reps'}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.cascadePillBtn}
                              onPress={() => {
                                if (isTime) {
                                  const newVal = currentTargetVal + 5;
                                  updateExerciseInDraftWorksession(exIdx, {
                                    target_duration_seconds: newVal,
                                    target_time: newVal,
                                  });
                                } else {
                                  const newVal = currentTargetVal + 1;
                                  updateExerciseInDraftWorksession(exIdx, {
                                    target_reps: newVal,
                                  });
                                }
                              }}
                            >
                              <Ionicons name="add" size={11} color={KinetixTheme.colors.primary} />
                            </TouchableOpacity>
                          </View>

                          <Text style={styles.cascadeDivider}>|</Text>

                          <Text style={styles.cascadeLabel}>Rest:</Text>
                          <View style={styles.cascadeControlGroup}>
                            <TouchableOpacity
                              style={styles.cascadePillBtn}
                              onPress={() => {
                                const newVal = Math.max(10, currentRestVal - 10);
                                updateExerciseInDraftWorksession(exIdx, {
                                  target_rest_seconds: newVal,
                                });
                              }}
                            >
                              <Ionicons name="remove" size={11} color={KinetixTheme.colors.primary} />
                            </TouchableOpacity>
                            <View style={styles.cascadeValueBox}>
                              <Text style={styles.cascadeValueText}>[ {currentRestVal} ] s</Text>
                            </View>
                            <TouchableOpacity
                              style={styles.cascadePillBtn}
                              onPress={() => {
                                const newVal = currentRestVal + 10;
                                updateExerciseInDraftWorksession(exIdx, {
                                  target_rest_seconds: newVal,
                                });
                              }}
                            >
                              <Ionicons name="add" size={11} color={KinetixTheme.colors.primary} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Save & Attach Worksession to Phase */}
            <TouchableOpacity
              style={[styles.saveInlineBtn, !inlineName.trim() && { opacity: 0.5 }]}
              onPress={handleSaveInline}
              disabled={!inlineName.trim()}
              activeOpacity={0.88}
            >
              <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
              <Text style={styles.saveInlineBtnText}>Attach Worksession to Phase</Text>
            </TouchableOpacity>
          </BottomSheetScrollView>
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheetBg: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...KinetixTheme.shadows.card,
  },
  handleIndicator: {
    backgroundColor: '#CBD5E1',
    width: 44,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  sheetSubtitle: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: KinetixTheme.borderRadius.lg,
    padding: 3,
    marginVertical: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: KinetixTheme.borderRadius.md,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    ...KinetixTheme.shadows.card,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  tabBtnTextActive: {
    color: KinetixTheme.colors.primary,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: KinetixTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: KinetixTheme.colors.text,
  },
  typeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeChipActiveAll: {
    backgroundColor: '#FFFFFF',
    borderColor: '#0F172A',
    ...KinetixTheme.shadows.card,
  },
  typeChipActiveRehab: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  typeChipActiveWorkout: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  typeChipTextActiveAll: {
    color: '#0F172A',
    fontWeight: '800',
  },
  typeChipTextActiveRehab: {
    color: '#059669',
    fontWeight: '800',
  },
  typeChipTextActiveWorkout: {
    color: '#2563EB',
    fontWeight: '800',
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  sectionHeaderContainerSpaced: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },
  sectionHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  sectionHeaderIconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rehabHeaderIconBox: {
    backgroundColor: '#ECFDF5',
  },
  workoutHeaderIconBox: {
    backgroundColor: '#EFF6FF',
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  sectionHeaderSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  rehabSectionBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  workoutSectionBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  sectionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rehabSectionBadgeText: {
    color: '#059669',
  },
  workoutSectionBadgeText: {
    color: '#2563EB',
  },
  existingList: {
    paddingBottom: 48,
  },
  existingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    ...KinetixTheme.shadows.card,
  },
  rehabCardAccent: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  workoutCardAccent: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  existingInfo: {
    flex: 1,
  },
  existingTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  rehabTypeBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  workoutTypeBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  rehabTypeBadgeText: {
    color: '#059669',
  },
  workoutTypeBadgeText: {
    color: '#2563EB',
  },
  tagPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  existingDuration: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  existingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  existingDesc: {
    fontSize: 11,
    color: KinetixTheme.colors.textSecondary,
    lineHeight: 15,
    marginTop: 2,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  existingExCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  metricsDetail: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  selectCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  selectCircleRehab: {
    backgroundColor: '#ECFDF5',
  },
  selectCircleWorkout: {
    backgroundColor: '#EFF6FF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: KinetixTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  resetFiltersBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  resetFiltersBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.primary,
  },
  createForm: {
    paddingBottom: 30,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.textSecondary,
    marginBottom: 6,
    marginTop: 6,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: KinetixTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: KinetixTheme.colors.text,
    marginBottom: 10,
  },
  modalityChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  modalityChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalityChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: KinetixTheme.colors.primary,
  },
  modalityChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  modalityChipTextActive: {
    color: KinetixTheme.colors.primary,
    fontWeight: '800',
  },
  inlineExSection: {
    marginTop: 4,
    marginBottom: 16,
  },
  inlineExHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  quickAddExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quickAddExText: {
    fontSize: 11,
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
  },
  emptyExBox: {
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
  },
  emptyExText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 15,
  },
  exCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  exIndexBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exIndexText: {
    fontSize: 10,
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
  },
  exCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
  },
  exMeta: {
    fontSize: 10,
    color: KinetixTheme.colors.textMuted,
    marginTop: 1,
  },
  cascadeDefaultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cascadeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  cascadeControlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  cascadePillBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  cascadeValueBox: {
    paddingHorizontal: 4,
  },
  cascadeValueText: {
    fontSize: 10,
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
  },
  cascadeDivider: {
    fontSize: 10,
    color: '#CBD5E1',
    marginHorizontal: 2,
  },
  saveInlineBtn: {
    backgroundColor: KinetixTheme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: KinetixTheme.borderRadius.lg,
    ...KinetixTheme.shadows.primaryGlow,
  },
  saveInlineBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
