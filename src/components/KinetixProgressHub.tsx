import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KinetixTheme } from '../constants/theme';
import { TrainingContext } from '../context/TrainingContext';
import KinetixHeader from './KinetixHeader';
import KinetixBottomNav from './KinetixBottomNav';

export default function KinetixProgressHub() {
  const { history, session } = useContext(TrainingContext) || {};
  const [selectedRange, setSelectedRange] = useState<'30' | '90' | '365'>('30');
  const [currentWeight, setCurrentWeight] = useState(78.4);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState('78.4');
  const [selectedDayIndex, setSelectedDayIndex] = useState(24); // Oct 24

  const athleteName = session?.user?.user_metadata?.full_name || 'Marcus Vance';

  // Sample calendar days for October (1 to 31)
  const calendarDays = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    // Some mock indicators matching Stitch design
    const hasStrength = [1, 2, 4, 7, 9, 10, 14, 15, 16, 18, 21, 23, 24].includes(day);
    const hasRehab = [2, 3, 8, 9, 11, 15, 17, 18, 22, 24].includes(day);
    return {
      day,
      hasStrength,
      hasRehab,
      isDual: hasStrength && hasRehab,
      isToday: day === 24,
    };
  });

  const handleSaveWeight = () => {
    const parsed = parseFloat(weightInput);
    if (!isNaN(parsed) && parsed > 30 && parsed < 250) {
      setCurrentWeight(parsed);
      setShowWeightModal(false);
      Alert.alert('Weight Logged', `Logged ${parsed.toFixed(1)} kg for today.`);
    } else {
      Alert.alert('Invalid Weight', 'Please enter a valid weight in kg.');
    }
  };

  return (
    <View style={styles.screen}>
      <KinetixHeader subtitle="PROGRESS & LOGS" iconName="pulse" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Athlete Profile Mini Card */}
        <View style={styles.profileMiniCard}>
          <View style={styles.profileLeft}>
            <View style={styles.profileAvatarBox}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
                }}
                style={styles.profileAvatar}
              />
              <View style={styles.profileOnlineDot} />
            </View>
            <View style={styles.profileTextCol}>
              <Text style={styles.profileName}>{athleteName}</Text>
              <Text style={styles.profileSubtitle}>Wk 14 Rehab & Performance</Text>
            </View>
          </View>
          <View style={styles.onTrackBadge}>
            <Text style={styles.onTrackBadgeText}>STATUS: ON TRACK</Text>
          </View>
        </View>

        {/* Section 2: Workout History Calendar */}
        <View style={styles.sectionCard}>
          <View style={styles.calendarTopBar}>
            <View style={styles.calendarHeaderLeft}>
              <View style={styles.calendarIconSquare}>
                <Ionicons name="calendar" size={16} color={KinetixTheme.colors.primary} />
              </View>
              <Text style={styles.calendarTitle}>October 2024</Text>
            </View>
            <View style={styles.chevronControls}>
              <TouchableOpacity style={styles.chevronBtn}>
                <Ionicons name="chevron-back" size={16} color={KinetixTheme.colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.chevronBtn}>
                <Ionicons name="chevron-forward" size={16} color={KinetixTheme.colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stat Chips Row */}
          <View style={styles.statChipsRow}>
            <View style={styles.statChip}>
              <Text style={[styles.statChipVal, { color: KinetixTheme.colors.primary }]}>18</Text>
              <Text style={styles.statChipLabel}>Workouts</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={[styles.statChipVal, { color: KinetixTheme.colors.secondary }]}>12</Text>
              <Text style={styles.statChipLabel}>Rehab Done</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statChipVal}>94%</Text>
              <Text style={styles.statChipLabel}>Attendance</Text>
            </View>
          </View>

          {/* 7-Day Header */}
          <View style={styles.weekdaysRow}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
              <Text key={idx} style={styles.weekdayLabel}>{day}</Text>
            ))}
          </View>

          {/* Monthly Calendar Grid (Starts on Tuesday = 1 blank slot for Mon) */}
          <View style={styles.gridContainer}>
            <View style={styles.daySlot} />
            {calendarDays.map((cd) => {
              const isSelected = selectedDayIndex === cd.day;
              return (
                <TouchableOpacity
                  key={cd.day}
                  style={[
                    styles.daySlot,
                    cd.isToday && styles.todaySlot,
                    isSelected && !cd.isToday && styles.selectedDaySlot,
                  ]}
                  onPress={() => setSelectedDayIndex(cd.day)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      cd.isToday && styles.todayNumber,
                      isSelected && styles.selectedDayNumber,
                    ]}
                  >
                    {cd.day}
                  </Text>
                  <View style={styles.dayDotsRow}>
                    {cd.hasStrength && <View style={[styles.microDot, { backgroundColor: KinetixTheme.colors.primary }]} />}
                    {cd.hasRehab && <View style={[styles.microDot, { backgroundColor: KinetixTheme.colors.secondary }]} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Calendar Legend */}
          <View style={styles.calendarLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: KinetixTheme.colors.primary }]} />
              <Text style={styles.legendText}>Strength</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: KinetixTheme.colors.secondary }]} />
              <Text style={styles.legendText}>Rehab</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={{ flexDirection: 'row', gap: 2 }}>
                <View style={[styles.legendDot, { backgroundColor: KinetixTheme.colors.primary }]} />
                <View style={[styles.legendDot, { backgroundColor: KinetixTheme.colors.secondary }]} />
              </View>
              <Text style={styles.legendText}>Dual Session</Text>
            </View>
          </View>

          {/* Selected Day Snippet */}
          <View style={styles.daySnippet}>
            <Ionicons name="checkmark-circle" size={18} color={KinetixTheme.colors.primary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <View style={styles.snippetTop}>
                <Text style={styles.snippetDayTitle}>
                  {selectedDayIndex === 24 ? 'Thu, Oct 24 • Today' : `Day ${selectedDayIndex} Logged`}
                </Text>
                <View style={styles.completedTag}>
                  <Text style={styles.completedTagText}>Completed ✓</Text>
                </View>
              </View>
              <Text style={styles.snippetDesc}>
                Strength & Power (45m) + Knee Recovery (15m)
              </Text>
            </View>
          </View>
        </View>

        {/* Section 3: Active Training & Rehab Goals Tracker */}
        <View style={styles.sectionCard}>
          <View style={styles.goalsTopBar}>
            <View style={styles.calendarHeaderLeft}>
              <View style={[styles.calendarIconSquare, { backgroundColor: KinetixTheme.colors.secondaryLight }]}>
                <Ionicons name="flag" size={16} color={KinetixTheme.colors.secondary} />
              </View>
              <Text style={styles.calendarTitle}>Active Period Goals</Text>
            </View>
            <TouchableOpacity style={styles.newGoalBtn} activeOpacity={0.7}>
              <Ionicons name="add" size={14} color={KinetixTheme.colors.primary} />
              <Text style={styles.newGoalBtnText}>New Goal</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.goalsList}>
            {/* Goal 1 */}
            <View style={styles.goalCard}>
              <View style={styles.goalTopRow}>
                <View>
                  <Text style={styles.goalTitle}>Weekly Training Consistency</Text>
                  <Text style={styles.goalSub}>Target: 5 sessions per week</Text>
                </View>
                <View style={styles.goalPillBlue}>
                  <Text style={styles.goalPillBlueText}>On Track</Text>
                </View>
              </View>
              <View style={styles.goalProgRow}>
                <Text style={styles.goalProgLabel}>4 / 5 completed</Text>
                <Text style={styles.goalProgPercent}>80%</Text>
              </View>
              <View style={styles.goalProgTrack}>
                <View style={[styles.goalProgFill, { width: '80%', backgroundColor: KinetixTheme.colors.primary }]} />
              </View>
            </View>

            {/* Goal 2 */}
            <View style={styles.goalCard}>
              <View style={styles.goalTopRow}>
                <View>
                  <Text style={styles.goalTitle}>Bilateral Quad Symmetry</Text>
                  <Text style={styles.goalSub}>Isometric peak quad force test</Text>
                </View>
                <View style={styles.goalPillGreen}>
                  <Text style={styles.goalPillGreenText}>Safe Window</Text>
                </View>
              </View>
              <View style={styles.goalProgRow}>
                <Text style={styles.goalProgLabel}>Current: 92% • Target: 95%</Text>
                <Text style={[styles.goalProgPercent, { color: KinetixTheme.colors.secondary }]}>92%</Text>
              </View>
              <View style={styles.goalProgTrack}>
                <View style={[styles.goalProgFill, { width: '92%', backgroundColor: KinetixTheme.colors.secondary }]} />
              </View>
            </View>

            {/* Goal 3 */}
            <View style={styles.goalCard}>
              <View style={styles.goalTopRow}>
                <View>
                  <Text style={styles.goalTitle}>Monthly Volume Target</Text>
                  <Text style={styles.goalSub}>Combined lower & upper tonnage</Text>
                </View>
                <View style={styles.goalPillBlue}>
                  <Text style={styles.goalPillBlueText}>Almost Met</Text>
                </View>
              </View>
              <View style={styles.goalProgRow}>
                <Text style={styles.goalProgLabel}>48.5k / 50.0k kg</Text>
                <Text style={styles.goalProgPercent}>97%</Text>
              </View>
              <View style={styles.goalProgTrack}>
                <View style={[styles.goalProgFill, { width: '97%', backgroundColor: '#6366F1' }]} />
              </View>
            </View>

            {/* Goal 4 */}
            <View style={styles.goalCardDone}>
              <View style={styles.goalDoneLeft}>
                <View style={styles.goalDoneIconBox}>
                  <Ionicons name="checkmark-circle" size={18} color={KinetixTheme.colors.secondary} />
                </View>
                <View>
                  <Text style={styles.goalTitle}>Pain-Free Squat Depth</Text>
                  <Text style={styles.goalSub}>Target 110° flexion achieved</Text>
                </View>
              </View>
              <View style={styles.goalPillGreen}>
                <Text style={styles.goalPillGreenText}>Completed ✓</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 4: Monthly Bodyweight Trend Section */}
        <View style={styles.sectionCard}>
          <View style={styles.goalsTopBar}>
            <View style={styles.calendarHeaderLeft}>
              <View style={styles.calendarIconSquare}>
                <Ionicons name="scale-outline" size={16} color={KinetixTheme.colors.primary} />
              </View>
              <Text style={styles.calendarTitle}>Bodyweight Trend</Text>
            </View>

            {/* Range Toggle */}
            <View style={styles.rangeToggleContainer}>
              <TouchableOpacity
                style={[styles.rangeToggleBtn, selectedRange === '30' && styles.rangeToggleBtnActive]}
                onPress={() => setSelectedRange('30')}
              >
                <Text style={[styles.rangeToggleText, selectedRange === '30' && styles.rangeToggleTextActive]}>
                  30D
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rangeToggleBtn, selectedRange === '90' && styles.rangeToggleBtnActive]}
                onPress={() => setSelectedRange('90')}
              >
                <Text style={[styles.rangeToggleText, selectedRange === '90' && styles.rangeToggleTextActive]}>
                  90D
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rangeToggleBtn, selectedRange === '365' && styles.rangeToggleBtnActive]}
                onPress={() => setSelectedRange('365')}
              >
                <Text style={[styles.rangeToggleText, selectedRange === '365' && styles.rangeToggleTextActive]}>
                  1Y
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Highlights Row */}
          <View style={styles.statChipsRow}>
            <View style={styles.statChip}>
              <Text style={styles.weightStatLabel}>Current</Text>
              <Text style={styles.weightStatVal}>{currentWeight.toFixed(1)} <Text style={styles.weightStatUnit}>kg</Text></Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.weightStatLabel}>30D Change</Text>
              <View style={styles.changeBadge}>
                <Text style={styles.changeBadgeText}>-1.8 kg</Text>
              </View>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.weightStatLabel}>Target</Text>
              <Text style={styles.weightStatVal}>77.5 <Text style={styles.weightStatUnit}>kg</Text></Text>
            </View>
          </View>

          {/* Infographic Trend Area Box */}
          <View style={styles.chartWrapper}>
            <View style={styles.chartTopLabels}>
              <Text style={styles.chartAxisLabel}>81.0 kg</Text>
              <View style={styles.targetDashedLegend}>
                <View style={styles.dashedLineSegment} />
                <Text style={styles.targetLegendText}>Target (77.5 kg)</Text>
              </View>
            </View>

            {/* Custom stylized chart visual */}
            <View style={styles.chartVisualArea}>
              <View style={styles.chartHGridLine} />
              <View style={[styles.chartHGridLine, { top: '50%' }]} />
              <View style={[styles.targetDashedHLine, { top: '80%' }]} />

              {/* Data points and curve visualization */}
              <View style={styles.chartPointsRow}>
                <View style={[styles.chartDotContainer, { top: '20%' }]}>
                  <View style={styles.chartDot} />
                </View>
                <View style={[styles.chartDotContainer, { top: '38%' }]}>
                  <View style={styles.chartDot} />
                </View>
                <View style={[styles.chartDotContainer, { top: '54%' }]}>
                  <View style={styles.chartDot} />
                </View>
                <View style={[styles.chartDotContainer, { top: '70%' }]}>
                  <View style={styles.chartDot} />
                </View>
                <View style={[styles.chartDotContainer, { top: '78%' }]}>
                  <View style={[styles.chartDot, styles.chartDotActive]} />
                </View>
              </View>
            </View>

            {/* X-Axis Dates */}
            <View style={styles.xAxisRow}>
              <Text style={styles.xAxisText}>Oct 1 (80.2kg)</Text>
              <Text style={styles.xAxisText}>Oct 10</Text>
              <Text style={styles.xAxisText}>Oct 18</Text>
              <Text style={[styles.xAxisText, { color: KinetixTheme.colors.primary, fontWeight: '700' }]}>
                Today ({currentWeight.toFixed(1)}kg)
              </Text>
            </View>
          </View>

          {/* Log Today's Weight Button */}
          <TouchableOpacity
            style={styles.logWeightBtn}
            onPress={() => setShowWeightModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={18} color={KinetixTheme.colors.primary} />
            <Text style={styles.logWeightBtnText}>Log Today's Weight</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Log Weight Modal */}
      <Modal
        visible={showWeightModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWeightModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalTopRow}>
              <Text style={styles.modalHeaderTitle}>Log Today's Weight</Text>
              <TouchableOpacity onPress={() => setShowWeightModal(false)}>
                <Ionicons name="close" size={20} color={KinetixTheme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInputLabel}>Bodyweight (kg):</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="decimal-pad"
              value={weightInput}
              onChangeText={setWeightInput}
              placeholder="e.g. 78.4"
            />

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveWeight}>
              <Text style={styles.modalSaveBtnText}>Save Entry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Nav */}
      <KinetixBottomNav activeTab="progress" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: KinetixTheme.colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  profileMiniCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    marginBottom: 14,
    ...KinetixTheme.shadows.card,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    position: 'relative',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  profileOnlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: KinetixTheme.colors.secondary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileTextCol: {
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 15,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.2,
  },
  profileSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: KinetixTheme.colors.textMuted,
    marginTop: 1,
  },
  onTrackBadge: {
    backgroundColor: KinetixTheme.colors.secondaryLight,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: KinetixTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  onTrackBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: KinetixTheme.colors.secondaryDark,
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    marginBottom: 14,
    ...KinetixTheme.shadows.card,
  },
  calendarTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarIconSquare: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: KinetixTheme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  chevronControls: {
    flexDirection: 'row',
    gap: 4,
  },
  chevronBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: KinetixTheme.borderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statChipVal: {
    fontSize: 16,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  statChipLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
    marginTop: 2,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
    marginBottom: 2,
  },
  weekdayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    width: 32,
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  daySlot: {
    width: '13%',
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  todaySlot: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: KinetixTheme.colors.primary,
  },
  selectedDaySlot: {
    backgroundColor: '#F1F5F9',
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: KinetixTheme.colors.text,
  },
  todayNumber: {
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
  },
  selectedDayNumber: {
    color: KinetixTheme.colors.primary,
  },
  dayDotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    height: 4,
  },
  microDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
    color: KinetixTheme.colors.textMuted,
  },
  daySnippet: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: KinetixTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 12,
  },
  snippetTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  snippetDayTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  completedTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  completedTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  snippetDesc: {
    fontSize: 11,
    color: KinetixTheme.colors.textSecondary,
    marginTop: 2,
  },
  goalsTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  newGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: KinetixTheme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  newGoalBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.primary,
  },
  goalsList: {
    gap: 10,
  },
  goalCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: KinetixTheme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  goalTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  goalTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  goalSub: {
    fontSize: 10,
    color: KinetixTheme.colors.textMuted,
    marginTop: 1,
  },
  goalPillBlue: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: KinetixTheme.borderRadius.full,
  },
  goalPillBlueText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1E40AF',
  },
  goalPillGreen: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: KinetixTheme.borderRadius.full,
  },
  goalPillGreenText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  goalProgRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  goalProgLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.textSecondary,
  },
  goalProgPercent: {
    fontSize: 11,
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
  },
  goalProgTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  goalProgFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalCardDone: {
    backgroundColor: '#F8FAFC',
    borderRadius: KinetixTheme.borderRadius.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  goalDoneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalDoneIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  rangeToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rangeToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    ...KinetixTheme.shadows.card,
  },
  rangeToggleText: {
    fontSize: 10,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  rangeToggleTextActive: {
    color: KinetixTheme.colors.primary,
    fontWeight: '700',
  },
  weightStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  weightStatVal: {
    fontSize: 16,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    marginTop: 2,
  },
  weightStatUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: KinetixTheme.colors.textMuted,
  },
  changeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  changeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  chartWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: KinetixTheme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  chartTopLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chartAxisLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  targetDashedLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dashedLineSegment: {
    width: 12,
    height: 2,
    borderBottomWidth: 2,
    borderStyle: 'dashed',
    borderColor: KinetixTheme.colors.secondary,
  },
  targetLegendText: {
    fontSize: 10,
    fontWeight: '600',
    color: KinetixTheme.colors.secondary,
  },
  chartVisualArea: {
    height: 100,
    width: '100%',
    position: 'relative',
    marginVertical: 4,
  },
  chartHGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  targetDashedHLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderBottomWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: KinetixTheme.colors.secondary,
  },
  chartPointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 10,
  },
  chartDotContainer: {
    position: 'absolute',
  },
  chartDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: KinetixTheme.colors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chartDotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2.5,
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  xAxisText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  logWeightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: KinetixTheme.borderRadius.md,
  },
  logWeightBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 20,
    ...KinetixTheme.shadows.card,
  },
  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: KinetixTheme.colors.textSecondary,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    borderRadius: KinetixTheme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
    marginBottom: 16,
  },
  modalSaveBtn: {
    backgroundColor: KinetixTheme.colors.primary,
    paddingVertical: 12,
    borderRadius: KinetixTheme.borderRadius.md,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
