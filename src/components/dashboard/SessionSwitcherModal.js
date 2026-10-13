import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../../utils/dashboardUtils';
import { getWorksessionDescription } from '../../data/recoveryMetadata';

export default function SessionSwitcherModal({
  visible,
  availablePlans = [],
  onClose,
  onSelectSession
}) {
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all', 'plans', 'kettlebell', 'core', 'recovery'

  // Extract all distinct worksessions from plans and templates
  const allSessions = [];
  const sessionMap = new Set();

  availablePlans.forEach(plan => {
    (plan.plan_worksessions || []).forEach(pw => {
      const ws = pw.worksessions;
      if (ws && !sessionMap.has(ws.id)) {
        sessionMap.add(ws.id);
        allSessions.push({
          worksession: ws,
          plan: plan,
          id: ws.id,
          name: ws.name,
          modality: ws.modality || 'Strength',
          description: getWorksessionDescription(ws) || ws.description,
          exerciseCount: ws.worksession_exercises?.length || 0
        });
      }
    });
  });

  const filteredSessions = allSessions.filter(s => {
    if (selectedCategory === 'all') return true;
    const mod = (s.modality || '').toLowerCase();
    const name = (s.name || '').toLowerCase();
    if (selectedCategory === 'kettlebell') return mod.includes('kettlebell') || name.includes('kettlebell');
    if (selectedCategory === 'core') return mod.includes('core') || name.includes('core') || mod.includes('trx');
    if (selectedCategory === 'recovery') return mod.includes('recovery') || mod.includes('rehab') || name.includes('rehab') || name.includes('relief');
    return true;
  });

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.modalTitle}>Choose Workout Routine</Text>
              <Text style={styles.modalSubtitle}>Swap today's focus to any routine</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#AAA" />
            </TouchableOpacity>
          </View>

          {/* Category Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {[
              { id: 'all', label: 'All Routines' },
              { id: 'core', label: 'Core & TRX' },
              { id: 'kettlebell', label: 'Kettlebell' },
              { id: 'recovery', label: 'Rehab & Relief' }
            ].map(tab => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => {
                  triggerHaptic('light');
                  setSelectedCategory(tab.id);
                }}
                style={[
                  styles.filterPill,
                  selectedCategory === tab.id && styles.filterPillActive
                ]}
              >
                <Text style={[
                  styles.filterPillText,
                  selectedCategory === tab.id && styles.filterPillTextActive
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Session Cards List */}
          <ScrollView style={styles.sessionsList}>
            {filteredSessions.map(item => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => {
                  triggerHaptic('medium');
                  onSelectSession && onSelectSession(item.plan, item.worksession);
                  onClose();
                }}
                style={styles.sessionCard}
              >
                <View style={{ flex: 1, marginRight: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Text style={styles.sessionName}>{item.name}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <View style={styles.modalityBadge}>
                      <Text style={styles.modalityText}>{item.modality}</Text>
                    </View>
                    {item.exerciseCount > 0 && (
                      <Text style={styles.exerciseCountText}>
                        {item.exerciseCount} exercises
                      </Text>
                    )}
                  </View>

                  {item.description && (
                    <Text style={styles.sessionDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                </View>

                <View style={styles.selectBtn}>
                  <Text style={styles.selectBtnText}>Select</Text>
                  <Ionicons name="checkmark" size={14} color="#111" />
                </View>
              </TouchableOpacity>
            ))}

            {filteredSessions.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No routines found for this filter.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end'
  },
  modalBox: {
    backgroundColor: '#1E1E28',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#323242'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800'
  },
  modalSubtitle: {
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
  filterScroll: {
    flexDirection: 'row',
    marginBottom: 14,
    maxHeight: 38
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#262634',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#343446'
  },
  filterPillActive: {
    backgroundColor: '#00D09E',
    borderColor: '#00D09E'
  },
  filterPillText: {
    color: '#AAA',
    fontSize: 12,
    fontWeight: '700'
  },
  filterPillTextActive: {
    color: '#111'
  },
  sessionsList: {
    maxHeight: 400
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#242432',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#343446'
  },
  sessionName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700'
  },
  modalityBadge: {
    backgroundColor: '#1C2833',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  modalityText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '700'
  },
  exerciseCountText: {
    color: '#8E8E9F',
    fontSize: 11
  },
  sessionDescription: {
    color: '#8E8E9F',
    fontSize: 12,
    lineHeight: 16
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00D09E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  },
  selectBtnText: {
    color: '#111',
    fontWeight: '800',
    fontSize: 12
  },
  emptyBox: {
    paddingVertical: 30,
    alignItems: 'center'
  },
  emptyText: {
    color: '#888',
    fontSize: 13
  }
});
