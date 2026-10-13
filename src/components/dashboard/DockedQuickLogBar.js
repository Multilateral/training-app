import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../../utils/dashboardUtils';

export default function DockedQuickLogBar({
  onOpenQuickSet,
  onOpenMobility,
  onOpenCustomActivity
}) {
  return (
    <View style={styles.dockContainer}>
      <View style={styles.bar}>
        {/* Micro-Action 1: Quick Set / Weight */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic('medium');
            onOpenQuickSet && onOpenQuickSet();
          }}
          style={styles.actionBtn}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#00D09E18' }]}>
            <Ionicons name="barbell" size={15} color="#00D09E" />
          </View>
          <Text style={styles.actionLabel}>+ Quick Set</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        {/* Micro-Action 2: Fast Mobility / 5m */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic('medium');
            onOpenMobility && onOpenMobility();
          }}
          style={styles.actionBtn}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#38BDF818' }]}>
            <Ionicons name="flash" size={15} color="#38BDF8" />
          </View>
          <Text style={styles.actionLabel}>+ Mobility / 5m</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        {/* Micro-Action 3: Custom Activity */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic('medium');
            onOpenCustomActivity && onOpenCustomActivity();
          }}
          style={styles.actionBtn}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#C084FC18' }]}>
            <Ionicons name="add" size={16} color="#C084FC" />
          </View>
          <Text style={styles.actionLabel}>+ Activity</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dockContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: 'rgba(17, 17, 24, 0.94)',
    borderTopWidth: 1,
    borderTopColor: '#282836'
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E28',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#323242',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionLabel: {
    color: '#E0E0EC',
    fontSize: 12,
    fontWeight: '700'
  },
  separator: {
    width: 1,
    height: 22,
    backgroundColor: '#323242'
  }
});
