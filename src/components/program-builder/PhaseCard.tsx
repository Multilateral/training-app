import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KinetixTheme } from '../../constants/theme';
import {
  BuilderPhase,
  useProgramBuilderStore,
} from '../../stores/useProgramBuilderStore';
import ProgressionGateSettings from './ProgressionGateSettings';

interface PhaseCardProps {
  phase: BuilderPhase;
  isFirst: boolean;
  isLast: boolean;
  totalPhases: number;
  userId?: string;
}

export default function PhaseCard({
  phase,
  isFirst,
  isLast,
  totalPhases,
  userId,
}: PhaseCardProps) {
  const {
    updatePhase,
    duplicatePhase,
    removePhase,
    removeWorksessionFromPhase,
    openWorksheetSheet,
  } = useProgramBuilderStore();

  const handleDuplicate = () => {
    duplicatePhase(phase.id, userId);
  };

  const handleRemove = () => {
    if (totalPhases <= 1) {
      Alert.alert('Cannot Remove', 'A program must contain at least one phase.');
      return;
    }
    Alert.alert(
      'Remove Phase',
      `Are you sure you want to delete ${phase.title}? All attached worksessions in this phase will be removed from this program.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removePhase(phase.id, userId) },
      ]
    );
  };

  return (
    <View style={styles.timelineRow}>
      {/* Left Timeline Indicator */}
      <View style={styles.timelineColumn}>
        <View style={styles.timelineNode}>
          <Text style={styles.timelineNodeText}>{phase.phase_order}</Text>
        </View>
        {!isLast && <View style={styles.timelineStem} />}
      </View>

      {/* Main Phase Card */}
      <View style={styles.card}>
        {/* Card Header & Actions */}
        <View style={styles.cardHeader}>
          <View style={styles.phaseBadgeRow}>
            <View style={styles.phaseBadge}>
              <Text style={styles.phaseBadgeText}>PHASE {phase.phase_order}</Text>
            </View>
            <Text style={styles.metaBadge}>
              {phase.worksessions.length} {phase.worksessions.length === 1 ? 'Worksession' : 'Worksessions'}
            </Text>
          </View>

          {/* Action Icons */}
          <View style={styles.actionsRow}>
            {/* Duplicate Phase Button */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleDuplicate}
              activeOpacity={0.7}
              accessibilityLabel="Duplicate Phase"
            >
              <Ionicons name="copy-outline" size={16} color={KinetixTheme.colors.primary} />
              <Text style={styles.duplicateText}>Clone</Text>
            </TouchableOpacity>

            {/* Delete Phase Button */}
            {totalPhases > 1 && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={handleRemove}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={15} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Phase Title Input */}
        <TextInput
          style={styles.titleInput}
          value={phase.title}
          onChangeText={(text) => updatePhase(phase.id, { title: text }, userId)}
          placeholder="Phase Title (e.g., Phase 1: Acute Decompression)"
          placeholderTextColor={KinetixTheme.colors.textMuted}
        />

        {/* Phase Description Input */}
        <TextInput
          style={styles.descInput}
          value={phase.description}
          onChangeText={(text) => updatePhase(phase.id, { description: text }, userId)}
          placeholder="Clinical purpose, tissue loading goals, and exit criteria summary..."
          placeholderTextColor={KinetixTheme.colors.textMuted}
          multiline
        />

        {/* Progression Gate Settings */}
        <ProgressionGateSettings
          requiredSessions={phase.required_sessions_to_pass}
          maxPainScore={phase.max_allowed_pain_score}
          onUpdate={(updates) => updatePhase(phase.id, updates, userId)}
        />

        {/* Worksessions List inside this Phase */}
        <View style={styles.worksessionsContainer}>
          <View style={styles.wsHeaderRow}>
            <Text style={styles.wsSectionTitle}>Prescribed Worksessions</Text>
            <Text style={styles.wsCount}>{phase.worksessions.length} Routines</Text>
          </View>

          {phase.worksessions.length === 0 ? (
            <View style={styles.emptyWsBox}>
              <Ionicons name="fitness-outline" size={24} color="#94A3B8" />
              <Text style={styles.emptyWsText}>No worksessions attached to Phase {phase.phase_order} yet.</Text>
            </View>
          ) : (
            phase.worksessions.map((ws, wsIdx) => (
              <View key={ws.id || wsIdx} style={styles.wsItemCard}>
                <View style={styles.wsInfoCol}>
                  <View style={styles.wsTopInfoRow}>
                    <Text style={styles.wsDayPill}>{ws.day_name || `Routine ${wsIdx + 1}`}</Text>
                    <View style={styles.modalityTag}>
                      <Text style={styles.modalityText}>{ws.modality || 'Rehab'}</Text>
                    </View>
                  </View>
                  <Text style={styles.wsTitleText} numberOfLines={1}>
                    {ws.name}
                  </Text>
                  <Text style={styles.wsMetaSub}>
                    {ws.exercises?.length || 0} exercises prescribed
                  </Text>
                </View>

                {/* Remove worksession from phase */}
                <TouchableOpacity
                  style={styles.removeWsBtn}
                  onPress={() => removeWorksessionFromPhase(phase.id, ws.id, userId)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ))
          )}

          {/* + Add Worksession Button */}
          <TouchableOpacity
            style={styles.addWorksessionBtn}
            onPress={() => openWorksheetSheet(phase.id)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={17} color={KinetixTheme.colors.primary} />
            <Text style={styles.addWorksessionText}>+ Add Worksession to Phase {phase.phase_order}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineColumn: {
    alignItems: 'center',
    width: 32,
    marginRight: 10,
  },
  timelineNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: KinetixTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...KinetixTheme.shadows.card,
  },
  timelineNodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timelineStem: {
    flex: 1,
    width: 2,
    backgroundColor: '#CBD5E1',
    marginTop: 6,
    marginBottom: -10,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...KinetixTheme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  phaseBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phaseBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  phaseBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
    letterSpacing: 0.5,
  },
  metaBadge: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  duplicateText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.primary,
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
  },
  titleInput: {
    fontSize: 16,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  descInput: {
    fontSize: 12,
    color: KinetixTheme.colors.textSecondary,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    lineHeight: 16,
    marginBottom: 12,
    minHeight: 48,
  },
  worksessionsContainer: {
    marginTop: 4,
  },
  wsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  wsSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  wsCount: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    fontWeight: '600',
  },
  emptyWsBox: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: KinetixTheme.borderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    marginBottom: 10,
  },
  emptyWsText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  wsItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: KinetixTheme.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  wsInfoCol: {
    flex: 1,
  },
  wsTopInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  wsDayPill: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  modalityTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  modalityText: {
    fontSize: 9,
    fontWeight: '700',
    color: KinetixTheme.colors.textMuted,
  },
  wsTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
  },
  wsMetaSub: {
    fontSize: 10,
    color: KinetixTheme.colors.textMuted,
    marginTop: 1,
  },
  removeWsBtn: {
    padding: 4,
  },
  addWorksessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: KinetixTheme.borderRadius.md,
    paddingVertical: 10,
    marginTop: 6,
  },
  addWorksessionText: {
    fontSize: 12,
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
  },
});
