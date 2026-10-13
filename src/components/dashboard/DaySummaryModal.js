import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../../utils/dashboardUtils';

export default function DaySummaryModal({
  visible,
  day,
  workouts = [],
  hasPlannedSession = false,
  onClose,
  onLogForDay
}) {
  if (!day) return null;

  const totalDuration = workouts.reduce((sum, w) => sum + (parseInt(w.duration) || 0), 0);
  const isCompleted = workouts.length > 0;

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.dateTitle}>{day.fullName}</Text>
              <Text style={styles.dateSubtitle}>{day.dateStr} {day.isToday ? '(Today)' : ''}</Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                onClose();
              }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={18} color="#AAA" />
            </TouchableOpacity>
          </View>

          {/* Status Badge */}
          <View style={styles.statusRow}>
            {isCompleted ? (
              <View style={[styles.statusBadge, { backgroundColor: '#00D09E20', borderColor: '#00D09E66' }]}>
                <Ionicons name="checkmark-circle" size={14} color="#00D09E" />
                <Text style={[styles.statusBadgeText, { color: '#00D09E' }]}>
                  {workouts.length} Workout{workouts.length > 1 ? 's' : ''} Completed • {totalDuration} min
                </Text>
              </View>
            ) : hasPlannedSession ? (
              <View style={[styles.statusBadge, { backgroundColor: '#60A5FA20', borderColor: '#60A5FA66' }]}>
                <Ionicons name="calendar-outline" size={14} color="#60A5FA" />
                <Text style={[styles.statusBadgeText, { color: '#60A5FA' }]}>
                  Scheduled Training Day
                </Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: '#33334420', borderColor: '#444455' }]}>
                <Ionicons name="bed-outline" size={14} color="#8E8E9F" />
                <Text style={[styles.statusBadgeText, { color: '#8E8E9F' }]}>
                  Rest & Recovery Day
                </Text>
              </View>
            )}
          </View>

          {/* Workouts List or Empty State */}
          <ScrollView style={styles.scrollList}>
            {isCompleted ? (
              workouts.map((w, index) => (
                <View key={w.id || index} style={styles.workoutCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.workoutName}>{w.type || 'Workout'}</Text>
                    <View style={styles.workoutMetaRow}>
                      <Text style={styles.workoutDuration}>⏱️ {w.duration} min</Text>
                      {w.intensity && (
                        <Text style={styles.workoutIntensity}>• {w.intensity} Intensity</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.checkPill}>
                    <Ionicons name="checkmark" size={14} color="#00D09E" />
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>
                  {hasPlannedSession ? '🏋️' : '🧘'}
                </Text>
                <Text style={styles.emptyTitle}>
                  {hasPlannedSession ? 'Workout Pending' : 'No Workouts Logged'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {hasPlannedSession
                    ? 'A routine is scheduled for this day in your training plan.'
                    : 'Take time to recharge, hydrate, and recover.'}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            {!isCompleted && day.isToday && (
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('medium');
                  onClose();
                  onLogForDay && onLogForDay();
                }}
                style={styles.logTodayBtn}
              >
                <Ionicons name="add-circle" size={16} color="#111" />
                <Text style={styles.logTodayBtnText}>Quick Log Workout</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.dismissBtn}>
              <Text style={styles.dismissBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalBox: {
    backgroundColor: '#1E1E28',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#323242'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  dateTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800'
  },
  dateSubtitle: {
    color: '#8E8E9F',
    fontSize: 12,
    marginTop: 2
  },
  closeBtn: {
    backgroundColor: '#2A2A38',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusRow: {
    marginBottom: 14
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700'
  },
  scrollList: {
    maxHeight: 250,
    marginVertical: 6
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#262634',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#343446'
  },
  workoutName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700'
  },
  workoutMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4
  },
  workoutDuration: {
    color: '#00D09E',
    fontSize: 12,
    fontWeight: '600'
  },
  workoutIntensity: {
    color: '#8E8E9F',
    fontSize: 12
  },
  checkPill: {
    backgroundColor: '#00D09E18',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 4
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700'
  },
  emptySubtitle: {
    color: '#8E8E9F',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16
  },
  footer: {
    marginTop: 14,
    gap: 8
  },
  logTodayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00D09E',
    paddingVertical: 12,
    borderRadius: 12
  },
  logTodayBtnText: {
    color: '#111',
    fontWeight: '800',
    fontSize: 13
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: 10
  },
  dismissBtnText: {
    color: '#8E8E9F',
    fontSize: 13,
    fontWeight: '600'
  }
});
