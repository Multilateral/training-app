import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../../utils/dashboardUtils';

export default function GoalEditorModal({
  visible,
  goals = [],
  onClose,
  onSaveGoals
}) {
  const [editableGoals, setEditableGoals] = useState(goals);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('3');
  const [newUnit, setNewUnit] = useState('Sessions');

  // Sync state when opened
  React.useEffect(() => {
    if (visible) {
      setEditableGoals(goals);
      setIsAddingNew(false);
    }
  }, [visible, goals]);

  const updateTargetValue = (id, delta) => {
    triggerHaptic('light');
    setEditableGoals(prev => prev.map(g => {
      if (g.id === id) {
        const nextVal = Math.max(1, (g.target_value || 1) + delta);
        return { ...g, target_value: nextVal };
      }
      return g;
    }));
  };

  const handleAddNewGoal = () => {
    if (!newTitle.trim()) {
      Alert.alert('Error', 'Please enter a goal title.');
      return;
    }
    const val = parseInt(newTarget) || 1;
    const newGoalObj = {
      id: `goal-custom-${Date.now()}`,
      title: newTitle.trim(),
      type: 'custom',
      target_value: val,
      current_value: 0,
      unit: newUnit.trim() || 'Sessions',
      timeframe: 'weekly'
    };
    setEditableGoals(prev => [...prev, newGoalObj]);
    setNewTitle('');
    setNewTarget('3');
    setIsAddingNew(false);
    triggerHaptic('medium');
  };

  const handleDeleteGoal = (id) => {
    triggerHaptic('light');
    setEditableGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleSave = () => {
    triggerHaptic('medium');
    onSaveGoals && onSaveGoals(editableGoals);
    onClose();
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="trophy" size={18} color="#FFD15C" />
              <Text style={styles.modalTitle}>Manage Weekly Goals</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#AAA" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Adjust your targets or add new performance milestones for the week.
          </Text>

          <ScrollView style={styles.goalsScroll}>
            {editableGoals.map((goal) => (
              <View key={goal.id} style={styles.goalCard}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalTypeSub}>
                    {goal.timeframe === 'weekly' ? 'Weekly target' : goal.timeframe} • {goal.unit || 'units'}
                  </Text>
                </View>

                {/* Stepper Controls */}
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    onPress={() => updateTargetValue(goal.id, -1)}
                    style={styles.stepBtn}
                  >
                    <Ionicons name="remove" size={16} color="#FFF" />
                  </TouchableOpacity>

                  <Text style={styles.targetNumberText}>{goal.target_value}</Text>

                  <TouchableOpacity
                    onPress={() => updateTargetValue(goal.id, 1)}
                    style={styles.stepBtn}
                  >
                    <Ionicons name="add" size={16} color="#FFF" />
                  </TouchableOpacity>

                  {goal.type === 'custom' && (
                    <TouchableOpacity
                      onPress={() => handleDeleteGoal(goal.id)}
                      style={[styles.stepBtn, { backgroundColor: '#FF4C4C20', marginLeft: 4 }]}
                    >
                      <Ionicons name="trash-outline" size={14} color="#FF4C4C" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            {/* Add New Custom Goal Form */}
            {isAddingNew ? (
              <View style={styles.addNewCard}>
                <Text style={styles.addCardTitle}>New Performance Goal</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Kettlebell Swings, 10k Steps"
                  placeholderTextColor="#666"
                  value={newTitle}
                  onChangeText={setNewTitle}
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Target</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="3"
                      placeholderTextColor="#666"
                      value={newTarget}
                      onChangeText={setNewTarget}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Unit</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Sessions / reps"
                      placeholderTextColor="#666"
                      value={newUnit}
                      onChangeText={setNewUnit}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                  <TouchableOpacity
                    onPress={() => setIsAddingNew(false)}
                    style={styles.cancelAddBtn}
                  >
                    <Text style={styles.cancelAddBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddNewGoal}
                    style={styles.confirmAddBtn}
                  >
                    <Text style={styles.confirmAddBtnText}>Add Goal</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setIsAddingNew(true)}
                style={styles.addNewTriggerBtn}
              >
                <Ionicons name="add-circle-outline" size={16} color="#00D09E" />
                <Text style={styles.addNewTriggerText}>Add Custom Goal</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Save Goals</Text>
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
    maxWidth: 420,
    maxHeight: '85%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#323242'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
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
  subtitle: {
    color: '#8E8E9F',
    fontSize: 12,
    marginVertical: 10
  },
  goalsScroll: {
    maxHeight: 340
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#262634',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#343446'
  },
  goalTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700'
  },
  goalTypeSub: {
    color: '#8E8E9F',
    fontSize: 11,
    marginTop: 2
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  stepBtn: {
    backgroundColor: '#343446',
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  targetNumberText: {
    color: '#00D09E',
    fontSize: 15,
    fontWeight: '800',
    minWidth: 26,
    textAlign: 'center'
  },
  addNewTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00D09E55',
    backgroundColor: '#00D09E10',
    marginTop: 4
  },
  addNewTriggerText: {
    color: '#00D09E',
    fontSize: 13,
    fontWeight: '700'
  },
  addNewCard: {
    backgroundColor: '#262634',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00D09E55',
    marginTop: 6
  },
  addCardTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#1E1E28',
    color: '#FFF',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#3A3A4C',
    marginBottom: 8
  },
  inputLabel: {
    color: '#8E8E9F',
    fontSize: 11,
    marginBottom: 4
  },
  cancelAddBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  cancelAddBtnText: {
    color: '#8E8E9F',
    fontSize: 12
  },
  confirmAddBtn: {
    backgroundColor: '#00D09E',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8
  },
  confirmAddBtnText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 12
  },
  footer: {
    marginTop: 16
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
