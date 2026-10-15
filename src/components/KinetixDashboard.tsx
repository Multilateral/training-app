import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { KinetixTheme } from '../constants/theme';
import { TrainingContext } from '../context/TrainingContext';
import KinetixHeader from './KinetixHeader';
import KinetixBottomNav from './KinetixBottomNav';
import { DATABASE_WORKSESSIONS } from '../data/databaseLibraryData';

export default function KinetixDashboard() {
  const router = useRouter();
  const { session, setActiveSessionMetadata } = useContext(TrainingContext) || {};
  const [activeTab, setActiveTab] = useState<'schedule' | 'logger'>('schedule');

  const athleteName = session?.user?.user_metadata?.full_name || 'Alex';
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const performanceWs = DATABASE_WORKSESSIONS.find((w) => w.id === 'b0000001-0000-4000-a000-000000000005') || DATABASE_WORKSESSIONS.find((w) => w.type === 'workout') || DATABASE_WORKSESSIONS[0];
  const rehabWs = DATABASE_WORKSESSIONS.find((w) => w.id === 'b0000001-0000-4000-a000-000000000002') || DATABASE_WORKSESSIONS.find((w) => w.type === 'rehab') || DATABASE_WORKSESSIONS[1];

  const startTodaySession = (track?: 'performance' | 'rehab' | 'full') => {
    const selected = track === 'rehab' ? rehabWs : performanceWs;
    const worksessionData = {
      name: selected.title,
      focus: selected.category,
      estimatedDuration: parseInt(selected.metrics.duration) || 30,
      exercises: selected.exercises.map((e) => ({
        name: e.name,
        cue: e.cue || 'Maintain strict form.',
        sets: e.sets || 3,
        reps: e.reps || 10,
        weight: e.weight || 'Standard',
        restSeconds: e.restSeconds || 60,
        tracking_type: e.tracking_type || 'reps_weight',
      })),
    };

    if (setActiveSessionMetadata) {
      setActiveSessionMetadata({
        isActive: true,
        worksessionName: selected.title,
        currentExerciseName: selected.exercises[0]?.name || 'Exercise 1',
        currentExerciseIndex: 0,
        totalExercises: selected.exercises.length,
        currentSet: 1,
        totalSets: selected.exercises[0]?.sets || 3,
        startTime: Date.now(),
      });
    }

    router.push({
      pathname: '/active-workout',
      params: {
        worksession: JSON.stringify(worksessionData),
        plan: JSON.stringify({ id: selected.id, name: selected.title }),
      },
    });
  };

  return (
    <View style={styles.screen}>
      <KinetixHeader subtitle="ATHLETIC LAB" iconName="flash" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Athlete Greeting & Live Date */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingSub}>Good morning, {athleteName}</Text>
          <Text style={styles.greetingDate}>{todayFormatted}</Text>
        </View>

        {/* Weekly Consistency Card */}
        <View style={styles.consistencyCard}>
          <View style={styles.consistencyHeader}>
            <View style={styles.consistencyTitleRow}>
              <Ionicons name="calendar-outline" size={17} color={KinetixTheme.colors.primary} />
              <Text style={styles.consistencyTitle}>Weekly Consistency</Text>
            </View>
            <View style={styles.consistencyBadge}>
              <Text style={styles.consistencyBadgeText}>80% Target Met</Text>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Completed</Text>
              <Text style={styles.metricValue}>4 / 5</Text>
              <Text style={styles.metricSub}>Sessions done</Text>
            </View>

            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Total Volume</Text>
              <Text style={styles.metricValue}>12.4k <Text style={styles.metricUnit}>kg</Text></Text>
              <Text style={[styles.metricSub, { color: KinetixTheme.colors.secondary }]}>+8% vs last wk</Text>
            </View>

            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Active Time</Text>
              <Text style={styles.metricValue}>3h 45m</Text>
              <Text style={styles.metricSub}>Across 4 days</Text>
            </View>
          </View>
        </View>

        {/* Today's Schedule Section */}
        <View style={styles.scheduleHeaderRow}>
          <Text style={styles.sectionHeading}>Today's Schedule</Text>
          <View style={styles.timeTag}>
            <Ionicons name="time-outline" size={13} color={KinetixTheme.colors.textMuted} />
            <Text style={styles.timeTagText}>60 MIN TOTAL</Text>
          </View>
        </View>

        {/* Track 1: Performance Track (Cobalt Blue Accent) */}
        <View style={styles.trackCard}>
          <View style={styles.trackTopBar}>
            <View style={styles.trackIndicatorRow}>
              <View style={[styles.trackDot, { backgroundColor: KinetixTheme.colors.primary }]} />
              <Text style={[styles.trackTrackTitle, { color: KinetixTheme.colors.primary }]}>
                Performance Track
              </Text>
            </View>
            <View style={styles.trackDurationPill}>
              <Text style={styles.trackDurationText}>45 min • 4 exercises</Text>
            </View>
          </View>

          <View style={styles.trackBannerRow}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=200&q=80',
              }}
              style={styles.trackImage}
            />
            <View style={styles.trackBannerInfo}>
              <Text style={styles.trackName}>Strength & Power</Text>
              <Text style={styles.trackDescription} numberOfLines={2}>
                Lower body explosiveness & posterior chain focus
              </Text>
              <View style={styles.badgesRow}>
                <View style={styles.rpeBadge}>
                  <Text style={styles.rpeBadgeText}>RPE 8.0</Text>
                </View>
                <Text style={styles.blockText}>Block A & B</Text>
              </View>
            </View>
          </View>

          {/* Exercises Preview List */}
          <View style={styles.exercisesList}>
            <View style={styles.exerciseItem}>
              <View style={styles.exerciseIndexBox}>
                <Text style={styles.exerciseIndexText}>1</Text>
              </View>
              <View style={styles.exerciseDetails}>
                <Text style={styles.exerciseTitle}>Trap Bar Deadlift</Text>
                <Text style={styles.exerciseType}>Main Compound Lift</Text>
              </View>
              <View style={styles.exerciseStats}>
                <Text style={styles.exerciseSetsReps}>4 sets × 6 reps</Text>
                <Text style={styles.exerciseLoad}>@ 140 kg</Text>
              </View>
            </View>

            <View style={styles.exerciseItem}>
              <View style={styles.exerciseIndexBox}>
                <Text style={styles.exerciseIndexText}>2</Text>
              </View>
              <View style={styles.exerciseDetails}>
                <Text style={styles.exerciseTitle}>Box Jumps</Text>
                <Text style={styles.exerciseType}>Reactive Power</Text>
              </View>
              <View style={styles.exerciseStats}>
                <Text style={styles.exerciseSetsReps}>3 sets × 5 reps</Text>
                <Text style={styles.exerciseLoad}>Bodyweight • 30"</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Track 2: Rehab & Prehab Track (Coral Accent) */}
        <View style={styles.trackCard}>
          <View style={styles.trackTopBar}>
            <View style={styles.trackIndicatorRow}>
              <View style={[styles.trackDot, { backgroundColor: KinetixTheme.colors.coral }]} />
              <Text style={[styles.trackTrackTitle, { color: KinetixTheme.colors.coral }]}>
                Rehab & Prehab Track
              </Text>
            </View>
            <View style={[styles.trackDurationPill, { backgroundColor: KinetixTheme.colors.coralLight }]}>
              <Text style={[styles.trackDurationText, { color: KinetixTheme.colors.coral }]}>
                15 min • 3 exercises
              </Text>
            </View>
          </View>

          <View style={styles.trackBannerRow}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=200&q=80',
              }}
              style={styles.trackImage}
            />
            <View style={styles.trackBannerInfo}>
              <Text style={styles.trackName}>Knee Recovery</Text>
              <Text style={styles.trackDescription} numberOfLines={2}>
                Patellar tendon isometric load & terminal extension
              </Text>
              <View style={styles.badgesRow}>
                <View style={[styles.rpeBadge, { backgroundColor: KinetixTheme.colors.coralLight }]}>
                  <Text style={[styles.rpeBadgeText, { color: KinetixTheme.colors.coral }]}>
                    Tendon Health
                  </Text>
                </View>
                <Text style={styles.blockText}>Prescribed Routine</Text>
              </View>
            </View>
          </View>

          {/* Exercises Preview List */}
          <View style={styles.exercisesList}>
            <View style={styles.exerciseItem}>
              <View style={[styles.exerciseIndexBox, { backgroundColor: KinetixTheme.colors.coralLight }]}>
                <Text style={[styles.exerciseIndexText, { color: KinetixTheme.colors.coral }]}>1</Text>
              </View>
              <View style={styles.exerciseDetails}>
                <Text style={styles.exerciseTitle}>Spanish Squats</Text>
                <Text style={styles.exerciseType}>Isometric Load</Text>
              </View>
              <View style={styles.exerciseStats}>
                <Text style={[styles.exerciseSetsReps, { color: KinetixTheme.colors.coral }]}>
                  3 sets × 45s
                </Text>
                <Text style={styles.exerciseLoad}>Static Hold</Text>
              </View>
            </View>

            <View style={styles.exerciseItem}>
              <View style={[styles.exerciseIndexBox, { backgroundColor: KinetixTheme.colors.coralLight }]}>
                <Text style={[styles.exerciseIndexText, { color: KinetixTheme.colors.coral }]}>2</Text>
              </View>
              <View style={styles.exerciseDetails}>
                <Text style={styles.exerciseTitle}>Terminal Knee Extension</Text>
                <Text style={styles.exerciseType}>Band Resistance</Text>
              </View>
              <View style={styles.exerciseStats}>
                <Text style={[styles.exerciseSetsReps, { color: KinetixTheme.colors.coral }]}>
                  3 sets × 12 reps
                </Text>
                <Text style={styles.exerciseLoad}>@ 15 kg band</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Primary Hub CTA: Start Workout Action Button */}
        <TouchableOpacity
          style={styles.startWorkoutButton}
          onPress={() => startTodaySession('full')}
          activeOpacity={0.88}
        >
          <View style={styles.ctaLeftContent}>
            <View style={styles.ctaPlayCircle}>
              <Ionicons name="play" size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.ctaTitle}>Start Workout</Text>
              <Text style={styles.ctaSubtitle}>Strength & Knee Recovery Sequence</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Persistent Bottom Nav */}
      <KinetixBottomNav activeTab="today" />
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
  greetingSection: {
    marginBottom: 16,
  },
  greetingSub: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  greetingDate: {
    fontSize: 24,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  consistencyCard: {
    backgroundColor: KinetixTheme.colors.surface,
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    marginBottom: 20,
    ...KinetixTheme.shadows.card,
  },
  consistencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  consistencyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  consistencyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  consistencyBadge: {
    backgroundColor: KinetixTheme.colors.secondaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: KinetixTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  consistencyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.secondaryDark,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
  },
  metricBlock: {
    flex: 1,
    backgroundColor: KinetixTheme.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: KinetixTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    marginTop: 3,
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: KinetixTheme.colors.textMuted,
  },
  metricSub: {
    fontSize: 10,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
    marginTop: 2,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.2,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.textMuted,
    letterSpacing: 0.5,
  },
  trackCard: {
    backgroundColor: KinetixTheme.colors.surface,
    borderRadius: KinetixTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    marginBottom: 14,
    ...KinetixTheme.shadows.card,
  },
  trackTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  trackIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trackTrackTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  trackDurationPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: KinetixTheme.borderRadius.full,
  },
  trackDurationText: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  trackBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  trackImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  trackBannerInfo: {
    flex: 1,
    minWidth: 0,
  },
  trackName: {
    fontSize: 16,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.2,
  },
  trackDescription: {
    fontSize: 12,
    color: KinetixTheme.colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  rpeBadge: {
    backgroundColor: KinetixTheme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rpeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: KinetixTheme.colors.primary,
  },
  blockText: {
    fontSize: 11,
    fontWeight: '600',
    color: KinetixTheme.colors.textMuted,
  },
  exercisesList: {
    paddingTop: 10,
    gap: 8,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KinetixTheme.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: KinetixTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  exerciseIndexBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: KinetixTheme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  exerciseIndexText: {
    fontSize: 12,
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
  },
  exerciseDetails: {
    flex: 1,
    minWidth: 0,
  },
  exerciseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
  },
  exerciseType: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    marginTop: 1,
  },
  exerciseStats: {
    alignItems: 'flex-end',
  },
  exerciseSetsReps: {
    fontSize: 12,
    fontWeight: '800',
    color: KinetixTheme.colors.primary,
  },
  exerciseLoad: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    marginTop: 1,
  },
  startWorkoutButton: {
    backgroundColor: KinetixTheme.colors.primary,
    borderRadius: KinetixTheme.borderRadius.xl,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    ...KinetixTheme.shadows.primaryGlow,
  },
  ctaLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ctaPlayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  ctaSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#DBEAFE',
    marginTop: 1,
  },
});
