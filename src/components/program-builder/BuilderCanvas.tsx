import React, { useEffect, useState } from 'react';
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
import { KinetixTheme } from '../../constants/theme';
import { useProgramBuilderStore } from '../../stores/useProgramBuilderStore';
import PhaseCard from './PhaseCard';
import WorksheetBottomSheet from './WorksheetBottomSheet';
import ExerciseQuickCreate from './ExerciseQuickCreate';

interface BuilderCanvasProps {
  userId?: string;
}

const TARGET_JOINTS = [
  { id: 'lumbar_spine', label: 'Lumbar Spine' },
  { id: 'patellar_tendon', label: 'Patellar Tendon' },
  { id: 'ankle', label: 'Ankle Stabilizers' },
  { id: 'shoulder', label: 'Rotator Cuff' },
  { id: 'hip', label: 'Hip & Pelvis' },
];

export default function BuilderCanvas({ userId }: BuilderCanvasProps) {
  const router = useRouter();
  const {
    program,
    phases,
    saveStatus,
    lastSavedAt,
    setProgramMeta,
    addPhase,
    loadDraftFromCloud,
    publishProgram,
  } = useProgramBuilderStore();

  const [isPublishing, setIsPublishing] = useState(false);

  // Attempt to restore cloud draft on mount only if starting from scratch without an explicit plan loaded
  useEffect(() => {
    if (userId && !program.id && !program.title) {
      loadDraftFromCloud(userId);
    }
  }, [userId, program.id, program.title, loadDraftFromCloud]);

  const handlePublish = async () => {
    if (!program.title.trim()) {
      Alert.alert('Missing Program Title', 'Please give your rehabilitation program a title before publishing.');
      return;
    }

    if (phases.length === 0) {
      Alert.alert('No Phases', 'Please add at least one phase to your program.');
      return;
    }

    const emptyPhase = phases.find((p) => p.worksessions.length === 0);
    if (emptyPhase) {
      Alert.alert(
        'Empty Phase Detected',
        `"${emptyPhase.title}" has no worksessions. Add at least one worksession to each phase or remove the empty phase.`
      );
      return;
    }

    setIsPublishing(true);
    try {
      const activeUid = userId || 'anonymous-user';
      const result = await publishProgram(activeUid);

      const isExisting = Boolean(program.id);
      if (result.success) {
        Alert.alert(
          isExisting ? 'Program Updated! 🎉' : 'Program Published! 🎉',
          `"${program.title}" has been successfully ${isExisting ? 'updated' : 'published'} into your active catalog with ${phases.length} criteria-based phases!`,
          [
            {
              text: 'View in Library',
              onPress: () => router.replace('/plans'),
            },
          ]
        );
      } else {
        Alert.alert('Publish Failed', result.message || 'Could not publish program.');
      }
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Card */}
        <View style={styles.headerCard}>
          {/* Top Status Row */}
          <View style={styles.headerTopRow}>
            <View style={styles.builderBadge}>
              <Ionicons name="construct-outline" size={12} color={KinetixTheme.colors.primary} />
              <Text style={styles.builderBadgeText}>TOP-DOWN PROGRAM CANVAS</Text>
            </View>

            {/* Auto-Save Indicator */}
            <View style={styles.saveStatusBadge}>
              {saveStatus === 'saving' && (
                <>
                  <ActivityIndicator size="small" color={KinetixTheme.colors.primary} style={{ transform: [{ scale: 0.7 }] }} />
                  <Text style={styles.saveStatusText}>Autosaving...</Text>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Ionicons name="cloud-done-outline" size={13} color="#059669" />
                  <Text style={[styles.saveStatusText, { color: '#059669' }]}>
                    Draft Saved {lastSavedAt ? `(${lastSavedAt})` : ''}
                  </Text>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <Ionicons name="cloud-offline-outline" size={13} color="#EF4444" />
                  <Text style={[styles.saveStatusText, { color: '#EF4444' }]}>Offline Draft</Text>
                </>
              )}
              {saveStatus === 'idle' && (
                <Text style={styles.saveStatusText}>Draft in memory</Text>
              )}
            </View>
          </View>

          {/* Program Title Input */}
          <TextInput
            style={styles.programTitleInput}
            value={program.title}
            onChangeText={(text) => setProgramMeta({ title: text }, userId)}
            placeholder="Program Title (e.g., Lower Back Resilience)"
            placeholderTextColor={KinetixTheme.colors.textMuted}
          />

          {/* Clinical Description Input */}
          <TextInput
            style={styles.programDescInput}
            value={program.description}
            onChangeText={(text) => setProgramMeta({ description: text }, userId)}
            placeholder="High-level clinical rehabilitation focus and pathology rationale..."
            placeholderTextColor={KinetixTheme.colors.textMuted}
            multiline
          />

          {/* Target Joint Selector */}
          <Text style={styles.sectionMiniLabel}>Clinical Focus Area</Text>
          <View style={styles.jointsRow}>
            {TARGET_JOINTS.map((j) => (
              <TouchableOpacity
                key={j.id}
                style={[styles.jointChip, program.target_joint === j.id && styles.jointChipActive]}
                onPress={() => setProgramMeta({ target_joint: j.id }, userId)}
              >
                <Text
                  style={[styles.jointChipText, program.target_joint === j.id && styles.jointChipTextActive]}
                >
                  {j.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.canvasHeading}>Progression Phases Timeline</Text>
            <Text style={styles.canvasSub}>Define phases, progression gates, and worksessions</Text>
          </View>
          <View style={styles.phaseCountPill}>
            <Text style={styles.phaseCountText}>{phases.length} PHASES</Text>
          </View>
        </View>

        {/* Vertical Timeline of Phases */}
        <View style={styles.timelineContainer}>
          {phases.map((phase, idx) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              isFirst={idx === 0}
              isLast={idx === phases.length - 1}
              totalPhases={phases.length}
              userId={userId}
            />
          ))}
        </View>

        {/* + Add New Phase Button */}
        <TouchableOpacity
          style={styles.addNewPhaseBtn}
          onPress={() => addPhase(userId)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color={KinetixTheme.colors.primary} />
          <Text style={styles.addNewPhaseText}>+ Add New Phase to Program</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Bottom Publishing Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInfo}>
          <Text style={styles.bottomBarTitle} numberOfLines={1}>
            {program.title || 'Untitled Program'}
          </Text>
          <Text style={styles.bottomBarMeta}>
            {phases.length} Phases •{' '}
            {phases.reduce((sum, p) => sum + p.worksessions.length, 0)} Worksessions
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.publishBtn, isPublishing && { opacity: 0.6 }]}
          onPress={handlePublish}
          disabled={isPublishing}
          activeOpacity={0.88}
        >
          {isPublishing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.publishBtnText}>
                {program.id ? 'Save & Update Program' : 'Publish Program'}
              </Text>
              <Ionicons name={program.id ? 'checkmark-circle-outline' : 'rocket-outline'} size={17} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Persistent Bottom Sheet Overlays */}
      <WorksheetBottomSheet userId={userId} />
      <ExerciseQuickCreate />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: KinetixTheme.colors.background,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    ...KinetixTheme.shadows.card,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  builderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  builderBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
    letterSpacing: 0.5,
  },
  saveStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saveStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  programTitleInput: {
    fontSize: 20,
    fontWeight: '900',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.3,
    paddingVertical: 4,
    marginBottom: 6,
  },
  programDescInput: {
    fontSize: 13,
    color: KinetixTheme.colors.textSecondary,
    lineHeight: 18,
    paddingVertical: 4,
    marginBottom: 12,
    minHeight: 40,
  },
  sectionMiniLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  jointsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  jointChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  jointChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  jointChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  jointChipTextActive: {
    color: '#059669',
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  canvasHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  canvasSub: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    marginTop: 1,
  },
  phaseCountPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  phaseCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: KinetixTheme.colors.textMuted,
    letterSpacing: 0.4,
  },
  timelineContainer: {
    marginTop: 4,
  },
  addNewPhaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: KinetixTheme.colors.primary,
    borderRadius: KinetixTheme.borderRadius.xl,
    paddingVertical: 14,
    marginTop: 4,
  },
  addNewPhaseText: {
    fontSize: 13,
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...KinetixTheme.shadows.card,
  },
  bottomBarInfo: {
    flex: 1,
    marginRight: 12,
  },
  bottomBarTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  bottomBarMeta: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    marginTop: 1,
  },
  publishBtn: {
    backgroundColor: KinetixTheme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: KinetixTheme.borderRadius.lg,
    ...KinetixTheme.shadows.primaryGlow,
  },
  publishBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
