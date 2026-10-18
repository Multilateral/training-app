import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KinetixTheme } from '../../constants/theme';
import { PlayerExercise } from '../../hooks/useWorkoutPlayer';

export interface SetRowData {
  setNumber: number;
  prevText: string;
  weight: number;
  reps: number;
  isCompleted: boolean;
}

interface ActiveWorkoutListViewProps {
  exercises: PlayerExercise[];
  exerciseSets: { [exerciseIndex: number]: SetRowData[] };
  onUpdateSet: (exerciseIndex: number, setIndex: number, updates: Partial<SetRowData>) => void;
  onToggleCompleteSet: (exerciseIndex: number, setIndex: number) => void;
  onAddSet: (exerciseIndex: number) => void;
  onLaunchGuidedMode: (exerciseIndex?: number) => void;
  isResting: boolean;
  restSecondsLeft: number;
  onAddRestTime: (seconds: number) => void;
  onSkipRest: () => void;
  onFinishWorkout: () => void;
  onOpenVideo?: (videoUrl: string, name: string) => void;
}

export default function ActiveWorkoutListView({
  exercises,
  exerciseSets,
  onUpdateSet,
  onToggleCompleteSet,
  onAddSet,
  onLaunchGuidedMode,
  isResting,
  restSecondsLeft,
  onAddRestTime,
  onSkipRest,
  onFinishWorkout,
  onOpenVideo,
}: ActiveWorkoutListViewProps) {
  const formatTimerDigits = (totalSecs: number) => {
    const mins = Math.floor(Math.max(0, totalSecs) / 60);
    const secs = Math.max(0, totalSecs) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollList}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Banner to launch Guided Mode */}
        <TouchableOpacity
          style={styles.guidedBanner}
          onPress={() => onLaunchGuidedMode()}
          activeOpacity={0.88}
        >
          <View style={styles.guidedBannerLeft}>
            <View style={styles.playIconCircle}>
              <Ionicons name="play" size={18} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.guidedBannerTitle}>Launch Guided Focus Mode</Text>
              <Text style={styles.guidedBannerSub}>
                Full-screen immersive player with interval timers & audio signals
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Exercises Static Tables */}
        {exercises.map((ex, exIdx) => {
          const sets = exerciseSets[exIdx] || [];
          const isTime = (ex.tracking_type || ex.trackingType || '').toLowerCase() === 'time';

          return (
            <View key={ex.id || exIdx} style={styles.exerciseCard}>
              {/* Exercise Header */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  <Text style={styles.exerciseMeta}>
                    {ex.muscle_group || 'General'} • {ex.equipment || 'Bodyweight'}
                  </Text>
                </View>

                <View style={styles.headerRightActions}>
                  {onOpenVideo && (
                    <TouchableOpacity
                      style={styles.miniHeaderBtn}
                      onPress={() => onOpenVideo('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', ex.name)}
                    >
                      <Ionicons name="play-circle-outline" size={18} color={KinetixTheme.colors.primary} />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.miniPlayBtn}
                    onPress={() => onLaunchGuidedMode(exIdx)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="play" size={13} color="#FFFFFF" />
                    <Text style={styles.miniPlayBtnText}>Focus</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {ex.cue ? (
                <View style={styles.cueBadge}>
                  <Text style={styles.cueText} numberOfLines={1}>
                    💡 {ex.cue}
                  </Text>
                </View>
              ) : null}

              {/* Table Column Headers */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.colHeader, styles.colSet]}>SET</Text>
                <Text style={[styles.colHeader, styles.colPrev]}>PREV</Text>
                <Text style={[styles.colHeader, styles.colWeight]}>{isTime ? 'LOAD' : 'KG'}</Text>
                <Text style={[styles.colHeader, styles.colReps]}>{isTime ? 'TIME' : 'REPS'}</Text>
                <Text style={[styles.colHeader, styles.colCheck]}>LOG</Text>
              </View>

              {/* Table Rows */}
              {sets.map((row, setIdx) => (
                <View
                  key={setIdx}
                  style={[
                    styles.tableRow,
                    row.isCompleted && styles.tableRowCompleted,
                  ]}
                >
                  {/* Set Number */}
                  <View style={styles.colSet}>
                    <Text style={[styles.cellText, row.isCompleted && styles.completedText]}>
                      {row.setNumber}
                    </Text>
                  </View>

                  {/* Previous Performance */}
                  <View style={styles.colPrev}>
                    <Text style={styles.prevText} numberOfLines={1}>
                      {row.prevText || '—'}
                    </Text>
                  </View>

                  {/* Load / Weight Input */}
                  <View style={styles.colWeight}>
                    <TextInput
                      style={[styles.numInput, row.isCompleted && styles.numInputCompleted]}
                      value={String(row.weight)}
                      keyboardType="numeric"
                      onChangeText={(val) =>
                        onUpdateSet(exIdx, setIdx, { weight: parseFloat(val) || 0 })
                      }
                      selectTextOnFocus
                    />
                  </View>

                  {/* Reps / Time Input */}
                  <View style={styles.colReps}>
                    <TextInput
                      style={[styles.numInput, row.isCompleted && styles.numInputCompleted]}
                      value={String(row.reps)}
                      keyboardType="numeric"
                      onChangeText={(val) =>
                        onUpdateSet(exIdx, setIdx, { reps: parseInt(val) || 0 })
                      }
                      selectTextOnFocus
                    />
                  </View>

                  {/* Checkbox Button */}
                  <View style={styles.colCheck}>
                    <TouchableOpacity
                      style={[
                        styles.checkCircle,
                        row.isCompleted && styles.checkCircleCompleted,
                      ]}
                      onPress={() => onToggleCompleteSet(exIdx, setIdx)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={row.isCompleted ? 'checkmark' : 'checkmark-outline'}
                        size={16}
                        color={row.isCompleted ? '#FFFFFF' : '#94A3B8'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* + Add Set Button */}
              <TouchableOpacity
                style={styles.addSetRowBtn}
                onPress={() => onAddSet(exIdx)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={15} color={KinetixTheme.colors.primary} />
                <Text style={styles.addSetRowText}>Add Set</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Finish Workout CTA at bottom of list */}
        <TouchableOpacity
          style={styles.finishWorkoutBottomBtn}
          onPress={onFinishWorkout}
          activeOpacity={0.88}
        >
          <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
          <Text style={styles.finishWorkoutBottomBtnText}>Finish Workout</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Rest Timer Bar (appears when resting) */}
      {isResting && (
        <View style={styles.floatingRestBar}>
          <View style={styles.floatingRestLeft}>
            <View style={styles.restPulseIconBox}>
              <Ionicons name="battery-charging" size={18} color="#059669" />
            </View>
            <View>
              <Text style={styles.floatingRestTitle}>
                RESTING: {formatTimerDigits(restSecondsLeft)}
              </Text>
              <Text style={styles.floatingRestSub}>Catch your breath</Text>
            </View>
          </View>

          <View style={styles.floatingRestRight}>
            <TouchableOpacity
              style={styles.floatingAddBtn}
              onPress={() => onAddRestTime(30)}
              activeOpacity={0.7}
            >
              <Text style={styles.floatingAddText}>+30s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.floatingSkipBtn}
              onPress={onSkipRest}
              activeOpacity={0.7}
            >
              <Text style={styles.floatingSkipText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollList: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  guidedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: KinetixTheme.colors.primary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    ...KinetixTheme.shadows.primaryGlow,
  },
  guidedBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  playIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidedBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  guidedBannerSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...KinetixTheme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  exerciseMeta: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniHeaderBtn: {
    padding: 4,
  },
  miniPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: KinetixTheme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  miniPlayBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cueBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  cueText: {
    fontSize: 11,
    color: KinetixTheme.colors.primary,
    fontWeight: '600',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 4,
  },
  colHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    textAlign: 'center',
  },
  colSet: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colPrev: {
    flex: 1.2,
    alignItems: 'center',
  },
  colWeight: {
    flex: 1,
    alignItems: 'center',
  },
  colReps: {
    flex: 1,
    alignItems: 'center',
  },
  colCheck: {
    width: 44,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    marginVertical: 2,
  },
  tableRowCompleted: {
    backgroundColor: '#ECFDF5',
  },
  cellText: {
    fontSize: 12,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  completedText: {
    color: '#059669',
  },
  prevText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  numInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    width: 54,
    height: 32,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  numInputCompleted: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
    color: '#065F46',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkCircleCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  addSetRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    marginTop: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
  },
  addSetRowText: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.primary,
  },
  finishWorkoutBottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  finishWorkoutBottomBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  floatingRestBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...KinetixTheme.shadows.card,
    borderWidth: 1,
    borderColor: '#334155',
  },
  floatingRestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  restPulseIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingRestTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  floatingRestSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  floatingRestRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingAddBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  floatingAddText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  floatingSkipBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  floatingSkipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
