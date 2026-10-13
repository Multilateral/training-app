import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../../utils/dashboardUtils';

export default function ActiveGoalsTracker({
  goals = [],
  onOpenGoalEditor
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        triggerHaptic('light');
        onOpenGoalEditor && onOpenGoalEditor();
      }}
      style={styles.card}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.iconCircle}>
            <Ionicons name="trophy" size={14} color="#FFD15C" />
          </View>
          <Text style={styles.headerTitle}>Weekly Goals Tracker</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={styles.editHintText}>Edit</Text>
          <Ionicons name="chevron-forward" size={14} color="#8E8E9F" />
        </View>
      </View>

      {/* Goal Items */}
      <View style={styles.goalsList}>
        {goals.map((goal) => {
          const target = goal.target_value || 1;
          const current = Math.min(goal.current_value || 0, target * 1.5);
          const percent = Math.min(Math.round((current / target) * 100), 100);
          const isFinished = current >= target;

          // Color themes based on goal type
          let barColor = '#00D09E';
          let badgeBg = '#00D09E18';
          let badgeTextColor = '#00D09E';
          if (goal.type === 'recovery_target') {
            barColor = '#38BDF8';
            badgeBg = '#38BDF818';
            badgeTextColor = '#38BDF8';
          } else if (goal.type === 'volume') {
            barColor = '#C084FC';
            badgeBg = '#C084FC18';
            badgeTextColor = '#C084FC';
          }

          return (
            <View key={goal.id} style={styles.goalRow}>
              {/* Labels & Progress numbers */}
              <View style={styles.goalInfoRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
                  {isFinished && (
                    <View style={styles.doneBadge}>
                      <Ionicons name="checkmark-circle" size={12} color="#00D09E" />
                    </View>
                  )}
                </View>

                <View style={[styles.progressBadge, { backgroundColor: badgeBg }]}>
                  <Text style={[styles.progressBadgeText, { color: badgeTextColor }]}>
                    {goal.current_value || 0} / {goal.target_value} {goal.unit || ''}
                  </Text>
                </View>
              </View>

              {/* Progress Bar Track */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${percent}%`,
                      backgroundColor: barColor
                    }
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A22',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2D2D38'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFD15C20',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2
  },
  editHintText: {
    color: '#8E8E9F',
    fontSize: 12,
    fontWeight: '600'
  },
  goalsList: {
    gap: 12
  },
  goalRow: {
    gap: 6
  },
  goalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  goalTitle: {
    color: '#D8D8E5',
    fontSize: 13,
    fontWeight: '600'
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  progressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  progressBadgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#262633',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3
  }
});
