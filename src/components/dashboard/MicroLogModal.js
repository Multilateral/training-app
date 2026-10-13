import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../../utils/dashboardUtils';

export default function MicroLogModal({
  visible,
  mode, // 'quick_set', 'mobility', 'custom'
  onClose,
  onSaveLog
}) {
  // Quick Set State
  const [exerciseName, setExerciseName] = useState('');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('3');

  // Mobility State
  const [mobilityDuration, setMobilityDuration] = useState('5');
  const [mobilityFocus, setMobilityFocus] = useState('Full Body Flow');

  // Custom Activity State
  const [activityName, setActivityName] = useState('');
  const [activityDuration, setActivityDuration] = useState('30');
  const [activityIntensity, setActivityIntensity] = useState('Medium');

  React.useEffect(() => {
    if (visible) {
      if (mode === 'quick_set') {
        setExerciseName('');
        setReps('10');
        setWeight('');
        setSets('3');
      } else if (mode === 'mobility') {
        setMobilityDuration('5');
        setMobilityFocus('Full Body Mobility Flow');
      } else {
        setActivityName('');
        setActivityDuration('30');
        setActivityIntensity('Medium');
      }
    }
  }, [visible, mode]);

  const handleSave = () => {
    triggerHaptic('medium');

    if (mode === 'quick_set') {
      if (!exerciseName.trim()) {
        Alert.alert('Required', 'Please enter an exercise name.');
        return;
      }
      const title = `${exerciseName.trim()} (${sets}×${reps}${weight ? ` @ ${weight}kg` : ''})`;
      const estimatedMins = Math.max(5, (parseInt(sets) || 3) * 3);
      onSaveLog && onSaveLog(title, estimatedMins, 'High');
    } else if (mode === 'mobility') {
      const dur = parseInt(mobilityDuration) || 5;
      const title = `${mobilityFocus} (${dur} min)`;
      onSaveLog && onSaveLog(title, dur, 'Low');
    } else if (mode === 'custom') {
      if (!activityName.trim()) {
        Alert.alert('Required', 'Please enter an activity name.');
        return;
      }
      const dur = parseInt(activityDuration) || 20;
      onSaveLog && onSaveLog(activityName.trim(), dur, activityIntensity);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name={mode === 'quick_set' ? 'barbell' : mode === 'mobility' ? 'flash' : 'fitness'}
                  size={16}
                  color={mode === 'quick_set' ? '#00D09E' : mode === 'mobility' ? '#38BDF8' : '#C084FC'}
                />
              </View>
              <Text style={styles.modalTitle}>
                {mode === 'quick_set' ? 'Log Quick Set / Weight' : mode === 'mobility' ? 'Fast Mobility Log' : 'Log Custom Activity'}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#AAA" />
            </TouchableOpacity>
          </View>

          {/* MODE 1: QUICK SET */}
          {mode === 'quick_set' && (
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Exercise Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Kettlebell Swing, Goblet Squat"
                placeholderTextColor="#666"
                value={exerciseName}
                onChangeText={setExerciseName}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Sets</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="3"
                    placeholderTextColor="#666"
                    value={sets}
                    onChangeText={setSets}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Reps</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor="#666"
                    value={reps}
                    onChangeText={setReps}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="24"
                    placeholderTextColor="#666"
                    value={weight}
                    onChangeText={setWeight}
                  />
                </View>
              </View>
            </View>
          )}

          {/* MODE 2: FAST MOBILITY */}
          {mode === 'mobility' && (
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Mobility Routine</Text>
              <TextInput
                style={styles.input}
                value={mobilityFocus}
                onChangeText={setMobilityFocus}
                placeholder="Routine name..."
                placeholderTextColor="#666"
              />

              <Text style={styles.inputLabel}>Duration</Text>
              <View style={styles.pillRow}>
                {['5', '10', '15', '20'].map(mins => (
                  <TouchableOpacity
                    key={mins}
                    onPress={() => {
                      triggerHaptic('light');
                      setMobilityDuration(mins);
                    }}
                    style={[
                      styles.durationPill,
                      mobilityDuration === mins && styles.durationPillActive
                    ]}
                  >
                    <Text style={[
                      styles.durationPillText,
                      mobilityDuration === mins && styles.durationPillTextActive
                    ]}>
                      {mins} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* MODE 3: CUSTOM ACTIVITY */}
          {mode === 'custom' && (
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Activity Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Running, Yoga, Basketball, Swimming"
                placeholderTextColor="#666"
                value={activityName}
                onChangeText={setActivityName}
              />

              <Text style={styles.inputLabel}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="30"
                placeholderTextColor="#666"
                value={activityDuration}
                onChangeText={setActivityDuration}
              />

              <Text style={styles.inputLabel}>Intensity</Text>
              <View style={styles.pillRow}>
                {['Low', 'Medium', 'High'].map(level => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => {
                      triggerHaptic('light');
                      setActivityIntensity(level);
                    }}
                    style={[
                      styles.durationPill,
                      activityIntensity === level && styles.durationPillActive
                    ]}
                  >
                    <Text style={[
                      styles.durationPillText,
                      activityIntensity === level && styles.durationPillTextActive
                    ]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSave}
            style={styles.saveBtn}
          >
            <Text style={styles.saveBtnText}>Save to Today's Log</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    maxWidth: 420,
    padding: 20,
    borderWidth: 1,
    borderColor: '#323242'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2A2A38',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800'
  },
  closeBtn: {
    backgroundColor: '#2A2A38',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  formContainer: {
    marginBottom: 18
  },
  inputLabel: {
    color: '#8E8E9F',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6
  },
  input: {
    backgroundColor: '#262634',
    color: '#FFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#38384A',
    marginBottom: 14
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10
  },
  durationPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#262634',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38384A'
  },
  durationPillActive: {
    backgroundColor: '#00D09E',
    borderColor: '#00D09E'
  },
  durationPillText: {
    color: '#AAA',
    fontSize: 13,
    fontWeight: '700'
  },
  durationPillTextActive: {
    color: '#111'
  },
  saveBtn: {
    backgroundColor: '#00D09E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  saveBtnText: {
    color: '#111',
    fontWeight: '800',
    fontSize: 14
  }
});
