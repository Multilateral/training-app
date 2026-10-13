import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../../utils/dashboardUtils';

export const BODY_AREAS = [
  {
    id: 'knees',
    label: 'Knees',
    icon: 'fitness-outline',
    sorePrompt: "Flagged Knee Stiffness — Prepend 5-min Spanish Squat & TKE prep to today's workout?",
    recoveryWorksessionId: 'b0000001-0000-4000-a000-000000000002',
    recoverySessionName: "Jumper's Knee Relief (Spanish Squat & TKE)"
  },
  {
    id: 'lower_back',
    label: 'Lower Back',
    icon: 'body-outline',
    sorePrompt: "Flagged Lower Back Tension — Prepend McGill Big 3 & Cat-Camel stability prep to today's workout?",
    recoveryWorksessionId: 'b0000001-0000-4000-a000-000000000003',
    recoverySessionName: 'Acute Lower Back McGill Protocol'
  },
  {
    id: 'shoulders',
    label: 'Shoulders',
    icon: 'barbell-outline',
    sorePrompt: "Flagged Shoulder Tightness — Prepend Sleeper Stretch & Rotator Cuff prep to today's workout?",
    recoveryWorksessionId: 'b0000001-0000-4000-a000-000000000001',
    recoverySessionName: "Overhead Shoulder Protocol (Rotator Cuff Prep)"
  },
  {
    id: 'ankles',
    label: 'Ankles / Achilles',
    icon: 'walk-outline',
    sorePrompt: "Flagged Achilles Stiffness — Prepend Soleus Wall Sit & Tibialis prep to today's workout?",
    recoveryWorksessionId: 'b0000001-0000-4000-a000-000000000004',
    recoverySessionName: 'Lower Leg & Achilles Resilience'
  }
];

export default function RecoveryBodyMap({
  readinessState = {},
  onToggleArea,
  onStartRecoveryPrep
}) {
  // Find any flagged sore area (or the most recently flagged)
  const flaggedArea = BODY_AREAS.find(a => readinessState[a.id] === 'sore');
  const soreCount = BODY_AREAS.filter(a => readinessState[a.id] === 'sore').length;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[styles.iconCircle, soreCount > 0 && { backgroundColor: '#FF6B0025' }]}>
            <Ionicons 
              name={soreCount > 0 ? "medkit" : "shield-checkmark"} 
              size={15} 
              color={soreCount > 0 ? "#FF8833" : "#00D09E"} 
            />
          </View>
          <View>
            <Text style={styles.headerTitle}>Body Readiness & Prehab Map</Text>
            <Text style={styles.headerSubtext}>
              {soreCount === 0 ? 'All joints primed & ready' : `${soreCount} area flagged for prep`}
            </Text>
          </View>
        </View>

        <View style={[
          styles.statusPill, 
          { backgroundColor: soreCount > 0 ? '#FF6B0018' : '#00D09E18' }
        ]}>
          <Text style={[
            styles.statusPillText, 
            { color: soreCount > 0 ? '#FF8833' : '#00D09E' }
          ]}>
            {soreCount > 0 ? 'Prep Needed' : 'Good / Primed'}
          </Text>
        </View>
      </View>

      {/* Segmented Pill Selectors */}
      <View style={styles.pillGrid}>
        {BODY_AREAS.map((area) => {
          const isSore = readinessState[area.id] === 'sore';

          return (
            <TouchableOpacity
              key={area.id}
              activeOpacity={0.7}
              onPress={() => {
                triggerHaptic(isSore ? 'light' : 'medium');
                const nextState = isSore ? 'good' : 'sore';
                onToggleArea && onToggleArea(area.id, nextState);
              }}
              style={[
                styles.jointPill,
                isSore ? styles.jointPillSore : styles.jointPillPrimed
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons
                  name={isSore ? "alert-circle" : "checkmark-circle-outline"}
                  size={15}
                  color={isSore ? "#FF8833" : "#00D09E"}
                />
                <Text style={[
                  styles.jointLabel,
                  isSore ? styles.jointLabelSore : styles.jointLabelPrimed
                ]}>
                  {area.label}
                </Text>
              </View>

              <Text style={[
                styles.jointStatusText,
                isSore ? styles.jointStatusTextSore : styles.jointStatusTextPrimed
              ]}>
                {isSore ? 'Tight / Sore' : 'Primed'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Immediate Contextual Prompt if marked Tight / Sore */}
      {flaggedArea && (
        <View style={styles.promptBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 }}>
            <Ionicons name="sparkles" size={18} color="#FFB800" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.promptTitle}>{flaggedArea.sorePrompt}</Text>
              <Text style={styles.promptSubtext}>
                Targets {flaggedArea.label} before heavy loading to reduce injury risk.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              triggerHaptic('medium');
              onStartRecoveryPrep && onStartRecoveryPrep(flaggedArea);
            }}
            style={styles.addWarmupBtn}
          >
            <Ionicons name="play" size={13} color="#111" />
            <Text style={styles.addWarmupBtnText}>Add Warm-up</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00D09E20',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700'
  },
  headerSubtext: {
    color: '#8E8E9F',
    fontSize: 12,
    marginTop: 1
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700'
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6
  },
  jointPill: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1
  },
  jointPillPrimed: {
    backgroundColor: '#22222D',
    borderColor: '#323242'
  },
  jointPillSore: {
    backgroundColor: '#FF6B0018',
    borderColor: '#FF6B0066'
  },
  jointLabel: {
    fontSize: 13,
    fontWeight: '600'
  },
  jointLabelPrimed: {
    color: '#D8D8E5'
  },
  jointLabelSore: {
    color: '#FF8833',
    fontWeight: '700'
  },
  jointStatusText: {
    fontSize: 11,
    fontWeight: '600'
  },
  jointStatusTextPrimed: {
    color: '#00D09E'
  },
  jointStatusTextSore: {
    color: '#FF8833',
    fontWeight: 'bold'
  },
  promptBanner: {
    marginTop: 12,
    backgroundColor: '#241F18',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFB80055',
    gap: 12
  },
  promptTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18
  },
  promptSubtext: {
    color: '#D1A354',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16
  },
  addWarmupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00D09E',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start'
  },
  addWarmupBtnText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 13
  }
});
