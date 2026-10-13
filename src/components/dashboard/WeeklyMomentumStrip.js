import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../../utils/dashboardUtils';

export default function WeeklyMomentumStrip({
  weekDays = [],
  history = {},
  defaultPlan = null,
  activeStreakDays = 0,
  onSelectDay
}) {
  const today = new Date();
  const hours = today.getHours();
  const greeting = hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening';
  
  const formattedToday = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <View style={styles.container}>
      {/* Header with Greeting & Streak */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greetingText}>{greeting}, Athlete 👋</Text>
          <Text style={styles.dateSubtext}>{formattedToday}</Text>
        </View>

        {activeStreakDays > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>{activeStreakDays}d streak</Text>
          </View>
        )}
      </View>

      {/* Weekly Momentum 7-Day Horizontal Strip */}
      <View style={styles.stripContainer}>
        {weekDays.map((day) => {
          const dayData = history[day.dateStr];
          const workouts = dayData?.move?.workouts || [];
          const isCompleted = workouts.length > 0;

          // Check if anchored default plan has a planned session on this day
          const hasPlannedSession = defaultPlan?.schedule_type === 'anchored' &&
            defaultPlan?.plan_worksessions?.some(pw => pw.day_name && pw.day_name.startsWith(day.fullName));

          let statusType = 'rest';
          if (isCompleted) {
            statusType = 'completed';
          } else if (day.isToday) {
            statusType = hasPlannedSession ? 'today-planned' : 'today';
          } else if (hasPlannedSession && day.isFuture) {
            statusType = 'planned';
          }

          return (
            <TouchableOpacity
              key={day.dateStr}
              activeOpacity={0.7}
              onPress={() => {
                triggerHaptic('light');
                onSelectDay && onSelectDay(day, workouts, hasPlannedSession);
              }}
              style={[
                styles.dayPill,
                day.isToday && styles.todayPillBorder,
                statusType === 'completed' && styles.completedPillBg
              ]}
            >
              {/* Day Label (M, T, W, ...) */}
              <Text style={[
                styles.dayLabel,
                day.isToday && styles.todayLabelText,
                statusType === 'completed' && styles.completedLabelText
              ]}>
                {day.label}
              </Text>

              {/* Day Number (12, 13, ...) */}
              <Text style={[
                styles.dayNum,
                day.isToday && styles.todayNumText,
                statusType === 'completed' && styles.completedNumText
              ]}>
                {day.dayNum}
              </Text>

              {/* Status Indicator Icon / Dot */}
              <View style={styles.statusIndicatorContainer}>
                {statusType === 'completed' ? (
                  <View style={styles.completedIconWrapper}>
                    <Ionicons name="checkmark" size={11} color="#111" />
                  </View>
                ) : statusType === 'today-planned' ? (
                  <View style={styles.plannedDotPulse} />
                ) : statusType === 'planned' ? (
                  <View style={styles.plannedDot} />
                ) : day.isToday ? (
                  <View style={styles.todayDot} />
                ) : (
                  <View style={styles.restDot} />
                )}
              </View>

              {/* Workout count badge if > 1 */}
              {workouts.length > 1 && (
                <View style={styles.multiWorkoutBadge}>
                  <Text style={styles.multiWorkoutText}>+{workouts.length - 1}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  greetingText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2
  },
  dateSubtext: {
    color: '#8E8E9F',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500'
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B0018',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF6B0040'
  },
  streakEmoji: {
    fontSize: 13,
    marginRight: 4
  },
  streakText: {
    color: '#FF8833',
    fontSize: 12,
    fontWeight: '700'
  },
  stripContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6
  },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    backgroundColor: '#22222D',
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 70,
    justifyContent: 'space-between'
  },
  todayPillBorder: {
    borderColor: '#00D09E',
    backgroundColor: '#00D09E12'
  },
  completedPillBg: {
    backgroundColor: '#00D09E22',
    borderColor: '#00D09E55'
  },
  dayLabel: {
    color: '#7E7E91',
    fontSize: 12,
    fontWeight: '600'
  },
  todayLabelText: {
    color: '#00D09E',
    fontWeight: 'bold'
  },
  completedLabelText: {
    color: '#00D09E',
    fontWeight: 'bold'
  },
  dayNum: {
    color: '#C0C0D0',
    fontSize: 14,
    fontWeight: '700',
    marginVertical: 4
  },
  todayNumText: {
    color: '#FFF',
    fontWeight: '800'
  },
  completedNumText: {
    color: '#00D09E',
    fontWeight: '800'
  },
  statusIndicatorContainer: {
    height: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  completedIconWrapper: {
    backgroundColor: '#00D09E',
    borderRadius: 8,
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  plannedDotPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#60A5FA',
    borderWidth: 1.5,
    borderColor: '#93C5FD'
  },
  plannedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#60A5FA88'
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D09E'
  },
  restDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3E3E4C'
  },
  multiWorkoutBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#00D09E',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1
  },
  multiWorkoutText: {
    color: '#111',
    fontSize: 8,
    fontWeight: 'bold'
  }
});
