import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Switch, Alert, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../utils/dashboardUtils';
import { 
  WEEK_DAYS_ORDER, 
  DEFAULT_REMINDERS, 
  scheduleWorkoutReminders, 
  sendTestWorkoutNotification,
  requestNotificationPermissions,
  checkNotificationPermissions
} from '../services/notificationService';

export default function WorkoutRemindersConfig({ 
  remindersData, 
  onUpdateReminders,
  defaultPlan 
}) {
  const initial = {
    ...DEFAULT_REMINDERS,
    ...(remindersData || {})
  };

  const [enabled, setEnabled] = useState(initial.enabled);
  const [hour, setHour] = useState(initial.hour !== undefined ? initial.hour : 18);
  const [minute, setMinute] = useState(initial.minute !== undefined ? initial.minute : 0);
  const [selectedDays, setSelectedDays] = useState(initial.days || ['Monday', 'Wednesday', 'Friday']);
  const [soundEnabled, setSoundEnabled] = useState(initial.soundEnabled !== false);
  const [hasPermission, setHasPermission] = useState(true);

  // Check initial permission
  useEffect(() => {
    checkNotificationPermissions().then(granted => {
      setHasPermission(granted);
    });
  }, []);

  // Format 12-hour display string
  const formatTime = (h, m) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    const displayMinute = m < 10 ? `0${m}` : m;
    return `${displayHour}:${displayMinute} ${period}`;
  };

  // Persist and apply changes
  const applySettings = async (nextEnabled, nextHour, nextMinute, nextDays, nextSound) => {
    const updated = {
      enabled: nextEnabled,
      hour: nextHour,
      minute: nextMinute,
      days: nextDays,
      soundEnabled: nextSound,
      time: `${nextHour < 10 ? '0' + nextHour : nextHour}:${nextMinute < 10 ? '0' + nextMinute : nextMinute}`
    };

    onUpdateReminders && onUpdateReminders(updated);
    await scheduleWorkoutReminders(updated);
  };

  // Toggle Master Switch
  const handleToggleMaster = async (val) => {
    triggerHaptic('medium');
    if (val) {
      const granted = await requestNotificationPermissions();
      setHasPermission(granted);
      if (!granted && Platform.OS !== 'web') {
        Alert.alert(
          'Notifications Permission',
          'Please allow notifications in your device settings to receive workout reminders.'
        );
      }
    }
    setEnabled(val);
    applySettings(val, hour, minute, selectedDays, soundEnabled);
  };

  // Adjust time by minutes
  const adjustMinutes = (deltaMinutes) => {
    triggerHaptic('light');
    let totalMinutes = hour * 60 + minute + deltaMinutes;
    // Wrap around 24 hours
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    totalMinutes = totalMinutes % (24 * 60);

    const newH = Math.floor(totalMinutes / 60);
    const newM = totalMinutes % 60;
    setHour(newH);
    setMinute(newM);
    applySettings(enabled, newH, newM, selectedDays, soundEnabled);
  };

  // Set time directly from preset
  const setPresetTime = (h, m) => {
    triggerHaptic('light');
    setHour(h);
    setMinute(m);
    applySettings(enabled, h, m, selectedDays, soundEnabled);
  };

  // Toggle individual day
  const toggleDay = (dayKey) => {
    triggerHaptic('light');
    let nextDays;
    if (selectedDays.includes(dayKey)) {
      if (selectedDays.length === 1) {
        Alert.alert('Notice', 'You must select at least one day for workout reminders.');
        return;
      }
      nextDays = selectedDays.filter(d => d !== dayKey);
    } else {
      nextDays = [...selectedDays, dayKey];
    }
    setSelectedDays(nextDays);
    applySettings(enabled, hour, minute, nextDays, soundEnabled);
  };

  // Quick Day Presets
  const applyDayPreset = (type) => {
    triggerHaptic('medium');
    let nextDays = [];
    if (type === 'weekdays') {
      nextDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    } else if (type === 'everyday') {
      nextDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    } else if (type === 'mwf') {
      nextDays = ['Monday', 'Wednesday', 'Friday'];
    } else if (type === 'plan' && defaultPlan?.plan_worksessions) {
      const planDays = defaultPlan.plan_worksessions
        .map(pw => pw.day_name?.split(' ')[0])
        .filter(Boolean);
      nextDays = Array.from(new Set(planDays));
      if (nextDays.length === 0) {
        nextDays = ['Monday', 'Wednesday', 'Friday'];
      }
    }
    setSelectedDays(nextDays);
    applySettings(enabled, hour, minute, nextDays, soundEnabled);
  };

  // Test Notification
  const handleTestNotification = async () => {
    triggerHaptic('heavy');
    await sendTestWorkoutNotification(formatTime(hour, minute));
  };

  return (
    <View style={styles.card}>
      {/* Master Toggle Row */}
      <View style={[styles.masterRow, enabled && styles.borderBottom]}>
        <View style={styles.masterInfo}>
          <View style={[styles.iconCircle, enabled && styles.iconCircleActive]}>
            <Ionicons 
              name={enabled ? "notifications" : "notifications-outline"} 
              size={20} 
              color={enabled ? "#00D09E" : "#888"} 
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.masterLabel}>Training Reminders</Text>
            <Text style={styles.masterSubtitle}>
              {enabled 
                ? `Active at ${formatTime(hour, minute)} (${selectedDays.length} days/wk)`
                : 'Get notified to start your scheduled workouts'}
            </Text>
          </View>
        </View>

        <Switch
          value={enabled}
          onValueChange={handleToggleMaster}
          trackColor={{ false: '#333', true: '#00D09E' }}
          thumbColor={enabled ? '#FFF' : '#888'}
        />
      </View>

      {/* Expanded Customizer (when enabled) */}
      {enabled && (
        <View style={styles.contentContainer}>
          {/* Section 1: Time Adjustment */}
          <View style={styles.sectionBlock}>
            <Text style={styles.subSectionTitle}>Reminder Time</Text>
            
            {/* Digital Clock Display & Steppers */}
            <View style={styles.timeBox}>
              <View style={styles.stepperGroup}>
                <TouchableOpacity 
                  onPress={() => adjustMinutes(-60)} 
                  style={styles.timeStepBtn}
                >
                  <Text style={styles.timeStepBtnText}>-1h</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => adjustMinutes(-15)} 
                  style={styles.timeStepBtn}
                >
                  <Text style={styles.timeStepBtnText}>-15m</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.timeDisplayWrapper}>
                <Ionicons name="time-outline" size={16} color="#00D09E" />
                <Text style={styles.timeDisplayText}>{formatTime(hour, minute)}</Text>
              </View>

              <View style={styles.stepperGroup}>
                <TouchableOpacity 
                  onPress={() => adjustMinutes(15)} 
                  style={styles.timeStepBtn}
                >
                  <Text style={styles.timeStepBtnText}>+15m</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => adjustMinutes(60)} 
                  style={styles.timeStepBtn}
                >
                  <Text style={styles.timeStepBtnText}>+1h</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Time Preset Chips */}
            <View style={styles.timePresetRow}>
              {[
                { label: '7:00 AM', h: 7, m: 0 },
                { label: '12:30 PM', h: 12, m: 30 },
                { label: '5:30 PM', h: 17, m: 30 },
                { label: '7:00 PM', h: 19, m: 0 },
                { label: '8:30 PM', h: 20, m: 30 }
              ].map(preset => {
                const isSelected = hour === preset.h && minute === preset.m;
                return (
                  <TouchableOpacity
                    key={preset.label}
                    onPress={() => setPresetTime(preset.h, preset.m)}
                    style={[
                      styles.presetChip,
                      isSelected && styles.presetChipActive
                    ]}
                  >
                    <Text style={[
                      styles.presetChipText,
                      isSelected && styles.presetChipTextActive
                    ]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section 2: Days of the Week Selection */}
          <View style={styles.sectionBlock}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.subSectionTitle}>Active Days</Text>
              <Text style={styles.daysCountText}>{selectedDays.length} of 7 days selected</Text>
            </View>

            {/* Day Pills */}
            <View style={styles.daysRow}>
              {WEEK_DAYS_ORDER.map(day => {
                const isActive = selectedDays.includes(day.key);
                return (
                  <TouchableOpacity
                    key={day.key}
                    onPress={() => toggleDay(day.key)}
                    style={[
                      styles.dayBtn,
                      isActive && styles.dayBtnActive
                    ]}
                  >
                    <Text style={[
                      styles.dayBtnText,
                      isActive && styles.dayBtnTextActive
                    ]}>
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick Day Shortcut Presets */}
            <View style={styles.dayShortcutsRow}>
              <TouchableOpacity 
                onPress={() => applyDayPreset('weekdays')} 
                style={styles.shortcutBtn}
              >
                <Text style={styles.shortcutBtnText}>Weekdays</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => applyDayPreset('mwf')} 
                style={styles.shortcutBtn}
              >
                <Text style={styles.shortcutBtnText}>Mon/Wed/Fri</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => applyDayPreset('everyday')} 
                style={styles.shortcutBtn}
              >
                <Text style={styles.shortcutBtnText}>Every Day</Text>
              </TouchableOpacity>
              {defaultPlan?.schedule_type === 'anchored' && (
                <TouchableOpacity 
                  onPress={() => applyDayPreset('plan')} 
                  style={[styles.shortcutBtn, { backgroundColor: '#00D09E18', borderColor: '#00D09E66' }]}
                >
                  <Text style={[styles.shortcutBtnText, { color: '#00D09E' }]}>Sync from Plan</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Section 3: Notification Preview */}
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="fitness" size={14} color="#00D09E" />
                <Text style={styles.previewAppName}>TRAINING APP</Text>
              </View>
              <Text style={styles.previewTimeLabel}>{formatTime(hour, minute)}</Text>
            </View>
            <Text style={styles.previewNotificationTitle}>Time to Train! 🏋️</Text>
            <Text style={styles.previewNotificationBody}>
              Ready for today's workout? Tap to view your session and start training.
            </Text>
          </View>

          {/* Section 4: Sound & Test Notification Action */}
          <View style={styles.footerRow}>
            <View style={styles.soundRow}>
              <Ionicons 
                name={soundEnabled ? "volume-high-outline" : "volume-mute-outline"} 
                size={18} 
                color="#888" 
              />
              <Text style={styles.soundLabel}>Play Sound</Text>
              <Switch
                value={soundEnabled}
                onValueChange={(val) => {
                  triggerHaptic('light');
                  setSoundEnabled(val);
                  applySettings(enabled, hour, minute, selectedDays, val);
                }}
                trackColor={{ false: '#333', true: '#00D09E' }}
                thumbColor={soundEnabled ? '#FFF' : '#888'}
              />
            </View>

            <TouchableOpacity 
              onPress={handleTestNotification}
              style={styles.testBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="paper-plane-outline" size={14} color="#00D09E" />
              <Text style={styles.testBtnText}>Send Test Notification</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#222',
    borderRadius: 12,
    overflow: 'hidden',
  },
  masterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D38',
  },
  masterInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2A2A35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: '#00D09E18',
  },
  masterLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  masterSubtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  contentContainer: {
    padding: 16,
    gap: 18,
    backgroundColor: '#1E1E26',
  },
  sectionBlock: {
    gap: 8,
  },
  subSectionTitle: {
    color: '#D0D0E0',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#262634',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#363648',
  },
  stepperGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  timeStepBtn: {
    backgroundColor: '#323244',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeStepBtnText: {
    color: '#DDD',
    fontSize: 11,
    fontWeight: '700',
  },
  timeDisplayWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E1E28',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00D09E55',
  },
  timeDisplayText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timePresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  presetChip: {
    backgroundColor: '#282836',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#343446',
  },
  presetChipActive: {
    backgroundColor: '#00D09E22',
    borderColor: '#00D09E',
  },
  presetChipText: {
    color: '#9E9EB2',
    fontSize: 11,
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: '#00D09E',
    fontWeight: '700',
  },
  daysCountText: {
    color: '#8E8E9F',
    fontSize: 11,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#282836',
    borderWidth: 1,
    borderColor: '#343446',
  },
  dayBtnActive: {
    backgroundColor: '#00D09E',
    borderColor: '#00D09E',
  },
  dayBtnText: {
    color: '#9E9EB2',
    fontSize: 12,
    fontWeight: '700',
  },
  dayBtnTextActive: {
    color: '#111',
    fontWeight: '800',
  },
  dayShortcutsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  shortcutBtn: {
    backgroundColor: '#262634',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#363648',
  },
  shortcutBtnText: {
    color: '#AAA',
    fontSize: 11,
    fontWeight: '600',
  },
  previewCard: {
    backgroundColor: '#242432',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#343446',
    gap: 4,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  previewAppName: {
    color: '#00D09E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  previewTimeLabel: {
    color: '#7E7E91',
    fontSize: 10,
  },
  previewNotificationTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  previewNotificationBody: {
    color: '#9E9EB2',
    fontSize: 12,
    lineHeight: 16,
  },
  footerRow: {
    gap: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#2C2C3A',
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  soundLabel: {
    flex: 1,
    color: '#AAA',
    fontSize: 13,
    marginLeft: 8,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#00D09E18',
    borderWidth: 1,
    borderColor: '#00D09E55',
  },
  testBtnText: {
    color: '#00D09E',
    fontSize: 13,
    fontWeight: '700',
  },
});
