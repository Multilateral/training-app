import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../../utils/dashboardUtils';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ReadyStateHeroCard({
  scheduledSession,
  activeSessionMetadata,
  todayWorkouts = [],
  onStartSession,
  onResumeSession,
  onOpenSessionSwitcher
}) {
  const [isExerciseDrawerOpen, setIsExerciseDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    triggerHaptic('light');
    if (Platform.OS !== 'web' && UIManager.setLayoutAnimationEnabledExperimental) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setIsExerciseDrawerOpen(!isExerciseDrawerOpen);
  };

  const hasTrainedToday = todayWorkouts.length > 0;
  const isResumable = !!activeSessionMetadata;

  // Extract exercise count & target areas
  const exercises = scheduledSession?.worksession?.worksession_exercises || [];
  const exerciseCount = exercises.length || 5;

  const targetAreas = scheduledSession?.targetAreas || ['Core', 'Strength'];
  const durationEstimate = scheduledSession?.durationEstimate || '25-30 min';

  return (
    <View style={[
      styles.card,
      hasTrainedToday && styles.cardCompletedToday,
      isResumable && styles.cardResumable
    ]}>
      {/* Top Status & Badge Bar */}
      <View style={styles.topBar}>
        <View style={styles.sessionTypeBadge}>
          <Text style={styles.sessionTypeEmoji}>
            {isResumable ? '⚡' : hasTrainedToday ? '🎉' : '🎯'}
          </Text>
          <Text style={styles.sessionTypeText}>
            {isResumable
              ? 'ACTIVE WORKOUT IN PROGRESS'
              : hasTrainedToday
              ? 'WORKOUT LOGGED TODAY'
              : "TODAY'S SCHEDULED SESSION"}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic('light');
            onOpenSessionSwitcher && onOpenSessionSwitcher();
          }}
          style={styles.swapBtn}
        >
          <Ionicons name="swap-horizontal" size={14} color="#00D09E" />
          <Text style={styles.swapBtnText}>Swap</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Session Name */}
      <Text style={styles.sessionTitle}>
        {isResumable
          ? activeSessionMetadata?.worksession?.name || 'Active Session'
          : scheduledSession?.name || '360° Core & Anti-Rotation'}
      </Text>

      {/* Description / Subtext */}
      {scheduledSession?.description && (
        <Text style={styles.sessionDescription} numberOfLines={2}>
          {scheduledSession.description}
        </Text>
      )}

      {/* Metadata Badges (Duration, Target Areas, Exercises) */}
      <View style={styles.badgesRow}>
        <View style={styles.metaBadge}>
          <Ionicons name="time-outline" size={13} color="#93C5FD" />
          <Text style={[styles.metaBadgeText, { color: '#93C5FD' }]}>
            {durationEstimate}
          </Text>
        </View>

        <View style={styles.metaBadge}>
          <Ionicons name="layers-outline" size={13} color="#C084FC" />
          <Text style={[styles.metaBadgeText, { color: '#C084FC' }]}>
            {exerciseCount} exercises
          </Text>
        </View>

        {targetAreas.slice(0, 2).map((area, idx) => (
          <View key={idx} style={[styles.metaBadge, { backgroundColor: '#2B2B38' }]}>
            <Text style={[styles.metaBadgeText, { color: '#E0E0EC' }]}>
              {area}
            </Text>
          </View>
        ))}
      </View>

      {/* Primary Execution Action Button */}
      {isResumable ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            triggerHaptic('heavy');
            onResumeSession && onResumeSession();
          }}
          style={[styles.primaryActionBtn, styles.resumeBtn]}
        >
          <Ionicons name="play-forward" size={18} color="#111" />
          <Text style={styles.primaryActionBtnText}>RESUME ACTIVE WORKOUT</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            triggerHaptic('heavy');
            onStartSession && onStartSession();
          }}
          style={styles.primaryActionBtn}
        >
          <Ionicons name="play" size={18} color="#111" />
          <Text style={styles.primaryActionBtnText}>
            {hasTrainedToday ? 'START ANOTHER ROUND' : 'START WORKOUT'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Secondary Controls (Quick Customizer / Preview Exercises) */}
      {exercises.length > 0 && (
        <View style={styles.secondaryBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleDrawer}
            style={styles.previewToggle}
          >
            <Text style={styles.previewToggleText}>
              {isExerciseDrawerOpen ? 'Hide Routine' : 'Preview Exercises'}
            </Text>
            <Ionicons
              name={isExerciseDrawerOpen ? "chevron-up" : "chevron-down"}
              size={14}
              color="#8E8E9F"
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Expandable Exercise Routine Preview Drawer */}
      {isExerciseDrawerOpen && exercises.length > 0 && (
        <View style={styles.exerciseDrawer}>
          {exercises.map((item, idx) => (
            <View key={item.id || idx} style={styles.exerciseItemRow}>
              <View style={styles.exerciseIndexBadge}>
                <Text style={styles.exerciseIndexText}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseItemName}>
                  {item.exercises?.name || 'Exercise'}
                </Text>
                <Text style={styles.exerciseItemMeta}>
                  {item.target_sets} sets × {item.target_reps ? `${item.target_reps} reps` : `${item.target_time || 30}s`}
                  {item.exercises?.muscle_group ? ` • ${item.exercises.muscle_group}` : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E28',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#00D09E40',
    shadowColor: '#00D09E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4
  },
  cardCompletedToday: {
    borderColor: '#FFD15C44',
    backgroundColor: '#202028'
  },
  cardResumable: {
    borderColor: '#FFB80088',
    backgroundColor: '#26221A'
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sessionTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00D09E15',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00D09E33'
  },
  sessionTypeEmoji: {
    fontSize: 12
  },
  sessionTypeText: {
    color: '#00D09E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  swapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#272733',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#39394A'
  },
  swapBtnText: {
    color: '#00D09E',
    fontSize: 12,
    fontWeight: '700'
  },
  sessionTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 6
  },
  sessionDescription: {
    color: '#9E9EB2',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#242433',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333344'
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00D09E',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#00D09E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3
  },
  resumeBtn: {
    backgroundColor: '#FFB800',
    shadowColor: '#FFB800'
  },
  primaryActionBtnText: {
    color: '#111',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  secondaryBar: {
    marginTop: 12,
    alignItems: 'center'
  },
  previewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10
  },
  previewToggleText: {
    color: '#8E8E9F',
    fontSize: 12,
    fontWeight: '600'
  },
  exerciseDrawer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2F2F3D',
    paddingTop: 12,
    gap: 8
  },
  exerciseItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#252532',
    padding: 10,
    borderRadius: 10
  },
  exerciseIndexBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#343444',
    alignItems: 'center',
    justifyContent: 'center'
  },
  exerciseIndexText: {
    color: '#00D09E',
    fontSize: 11,
    fontWeight: '700'
  },
  exerciseItemName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700'
  },
  exerciseItemMeta: {
    color: '#8E8E9F',
    fontSize: 11,
    marginTop: 2
  }
});
