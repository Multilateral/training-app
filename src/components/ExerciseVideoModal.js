import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  Dimensions,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KinetixTheme } from '../constants/theme';
import {
  getExerciseInstructions,
  getExerciseDescription,
  getExerciseDifficulty,
  getExerciseMechanics,
  getExerciseMuscleGroup,
  getExerciseEquipment,
  getExerciseVideoUrl,
} from '../data/recoveryMetadata';

// Safely require expo-video to prevent crashes if dev build lacks native module
let expoVideo = null;
try {
  expoVideo = require('expo-video');
} catch (e) {
  console.log('[ExerciseVideoModal] expo-video native module not available:', e?.message);
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function VideoPlayerInner({ videoUrl, thumbnailUrl }) {
  if (!expoVideo || !expoVideo.useVideoPlayer || !expoVideo.VideoView) {
    return (
      <View style={styles.fallbackContainer}>
        <View style={styles.fallbackIconBadge}>
          <Ionicons name="videocam-outline" size={28} color={KinetixTheme.colors.primary} />
        </View>
        <Text style={styles.fallbackTitle}>Video Player Preview</Text>
        <Text style={styles.fallbackSubtitle}>
          Native video module is optimizing for your device.
        </Text>
        <Text style={styles.fallbackUrl} numberOfLines={1}>
          {videoUrl}
        </Text>
      </View>
    );
  }

  const { useVideoPlayer, VideoView } = expoVideo;

  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize the video player
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Track player events
  useEffect(() => {
    if (!player) return;

    const statusSub = player.addListener?.('statusChange', ({ status }) => {
      if (status === 'readyToPlay' || status === 'playing') {
        setIsLoading(false);
      }
    });

    const playSub = player.addListener?.('playingChange', ({ isPlaying: playing }) => {
      setIsPlaying(playing);
    });

    const muteSub = player.addListener?.('mutedChange', ({ muted }) => {
      setIsMuted(muted);
    });

    return () => {
      statusSub?.remove?.();
      playSub?.remove?.();
      muteSub?.remove?.();
      player.pause?.();
    };
  }, [player]);

  const togglePlay = () => {
    if (!player) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const toggleMute = () => {
    if (!player) return;
    player.muted = !player.muted;
    setIsMuted(player.muted);
  };

  const restartVideo = () => {
    if (!player) return;
    player.currentTime = 0;
    player.play();
  };

  return (
    <View style={styles.playerWrapper}>
      <VideoView
        style={styles.videoView}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
        contentFit="contain"
        nativeControls={false}
      />

      {/* Buffering Indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      )}

      {/* Bottom Floating Control Bar */}
      <View style={styles.controlsBar}>
        <TouchableOpacity style={styles.controlBtn} onPress={togglePlay} activeOpacity={0.7}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn} onPress={restartVideo} activeOpacity={0.7}>
          <Ionicons name="refresh" size={17} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.controlBtn} onPress={toggleMute} activeOpacity={0.7}>
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={18}
            color={isMuted ? '#94A3B8' : '#10B981'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Helper to format structured description sections
function renderStructuredDescription(description) {
  if (!description) return null;

  // Check if text has colon-delimited section titles
  const sections = description.split(/\n\n+/);

  return (
    <View style={styles.descriptionContainer}>
      {sections.map((section, idx) => {
        const parts = section.split(/:\n|:\s+/);
        if (parts.length >= 2 && parts[0].length < 50) {
          const title = parts[0].trim();
          const body = parts.slice(1).join(':\n').trim();

          let iconName = 'information-circle-outline';
          let accentColor = KinetixTheme.colors.primary;
          let bgTint = '#F8FAFC';

          if (title.toLowerCase().includes('musculature') || title.toLowerCase().includes('purpose')) {
            iconName = 'body-outline';
            accentColor = '#2563EB';
            bgTint = '#EFF6FF';
          } else if (title.toLowerCase().includes('setup') || title.toLowerCase().includes('position')) {
            iconName = 'locate-outline';
            accentColor = '#059669';
            bgTint = '#ECFDF5';
          } else if (title.toLowerCase().includes('execution') || title.toLowerCase().includes('cues')) {
            iconName = 'sparkles-outline';
            accentColor = '#4F46E5';
            bgTint = '#EEF2FF';
          } else if (title.toLowerCase().includes('fault') || title.toLowerCase().includes('fix')) {
            iconName = 'alert-circle-outline';
            accentColor = '#D97706';
            bgTint = '#FFFBEB';
          } else if (title.toLowerCase().includes('rehab') || title.toLowerCase().includes('parameters') || title.toLowerCase().includes('loading')) {
            iconName = 'barbell-outline';
            accentColor = '#0284C7';
            bgTint = '#F0F9FF';
          }

          return (
            <View key={`desc-sec-${idx}`} style={[styles.descSectionCard, { backgroundColor: bgTint, borderColor: `${accentColor}25` }]}>
              <View style={styles.descSectionHeader}>
                <Ionicons name={iconName} size={15} color={accentColor} style={{ marginRight: 6 }} />
                <Text style={[styles.descSectionTitle, { color: accentColor }]}>{title}</Text>
              </View>
              <Text style={styles.descSectionBody}>{body}</Text>
            </View>
          );
        }

        return (
          <View key={`desc-sec-${idx}`} style={styles.descSectionCardSimple}>
            <Text style={styles.descSectionBody}>{section.trim()}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function ExerciseVideoModal({ visible, onClose, exercise }) {
  if (!visible || !exercise) return null;

  // Resolve metadata with knowledge base fallbacks
  const videoUrl = exercise.video_url || getExerciseVideoUrl(exercise);
  const instructions = exercise.instructions || getExerciseInstructions(exercise);
  const description = exercise.description || getExerciseDescription(exercise);
  const difficulty = exercise.difficulty || getExerciseDifficulty(exercise);
  const mechanics = exercise.mechanics || getExerciseMechanics(exercise);
  const muscleGroup = exercise.muscle_group || exercise.muscle || getExerciseMuscleGroup(exercise);
  const equipment = exercise.equipment || getExerciseEquipment(exercise);

  // User notes & prescribed parameters
  const userCues = exercise.notes || exercise.cue;
  const setsCount = exercise.totalSets || exercise.sets;
  const repsValue = exercise.reps || (exercise.target_reps ? `${exercise.target_reps} reps` : null);
  const durationValue = exercise.target_duration_seconds ? `${exercise.target_duration_seconds}s` : null;
  const restSec = typeof exercise.target_rest_seconds === 'number'
    ? exercise.target_rest_seconds
    : (typeof exercise.restSeconds === 'number' ? exercise.restSeconds : null);
  const loadValue = exercise.load || exercise.weight;

  // Difficulty badge styling
  const getDifficultyColor = (diff) => {
    const d = (diff || '').toLowerCase();
    if (d.includes('adv')) return { bg: '#FFE4E6', text: '#E11D48' };
    if (d.includes('inter')) return { bg: '#FEF3C7', text: '#B45309' };
    return { bg: '#ECFDF5', text: '#059669' };
  };

  const diffBadge = difficulty ? getDifficultyColor(difficulty) : null;

  // Swipe-down gesture handler to dismiss sheet smoothly
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 12;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 45) {
          onClose();
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* Tap outside sheet to dismiss */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheetContainer}>
          {/* Top Handle Indicator (swipe down to dismiss) */}
          <View style={styles.handleBarTouchArea} {...panResponder.panHandlers}>
            <View style={styles.handleBar} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={styles.tagRow}>
                <View style={styles.badgePrimary}>
                  <Ionicons name="fitness-outline" size={13} color={KinetixTheme.colors.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.badgePrimaryText}>EXERCISE GUIDE</Text>
                </View>
                {diffBadge && (
                  <View style={[styles.badgeDiff, { backgroundColor: diffBadge.bg }]}>
                    <Text style={[styles.badgeDiffText, { color: diffBadge.text }]}>{difficulty}</Text>
                  </View>
                )}
                {equipment && (
                  <View style={styles.badgeEquipment}>
                    <Text style={styles.badgeEquipmentText} numberOfLines={1}>{equipment}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.exerciseTitle} numberOfLines={2}>
                {exercise.name || 'Exercise Details'}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={KinetixTheme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Prescribed Workout Targets Banner (Sets / Reps / Load / Rest) */}
            {(setsCount || repsValue || durationValue || restSec !== null || loadValue) && (
              <View style={styles.targetsCard}>
                <Text style={styles.targetsCardHeader}>PRESCRIBED WORKOUT TARGETS</Text>
                <View style={styles.targetChipsRow}>
                  {setsCount && (
                    <View style={styles.targetChip}>
                      <Ionicons name="layers-outline" size={13} color={KinetixTheme.colors.primary} />
                      <Text style={styles.targetChipLabel}>Sets</Text>
                      <Text style={styles.targetChipValue}>{setsCount}</Text>
                    </View>
                  )}
                  {(repsValue || durationValue) && (
                    <View style={styles.targetChip}>
                      <Ionicons
                        name={durationValue ? 'timer-outline' : 'repeat-outline'}
                        size={13}
                        color={KinetixTheme.colors.primary}
                      />
                      <Text style={styles.targetChipLabel}>{durationValue ? 'Target' : 'Reps'}</Text>
                      <Text style={styles.targetChipValue}>{durationValue || repsValue}</Text>
                    </View>
                  )}
                  {loadValue && (
                    <View style={styles.targetChip}>
                      <Ionicons name="barbell-outline" size={13} color={KinetixTheme.colors.primary} />
                      <Text style={styles.targetChipLabel}>Load</Text>
                      <Text style={styles.targetChipValue}>{loadValue}</Text>
                    </View>
                  )}
                  {restSec !== null && (
                    <View style={styles.targetChip}>
                      <Ionicons name="hourglass-outline" size={13} color={KinetixTheme.colors.primary} />
                      <Text style={styles.targetChipLabel}>Rest</Text>
                      <Text style={styles.targetChipValue}>{restSec === 0 ? 'Continuous' : `${restSec}s`}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Video Player or Clean Placeholder Card */}
            {videoUrl ? (
              <VideoPlayerInner videoUrl={videoUrl} thumbnailUrl={exercise.video_thumbnail_url} />
            ) : (
              <View style={styles.noVideoCard}>
                <View style={styles.noVideoIconCircle}>
                  <Ionicons name="videocam-outline" size={24} color={KinetixTheme.colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.noVideoTitle}>Form Video Demonstration</Text>
                  <Text style={styles.noVideoSubtitle}>
                    Follow the verified biomechanical steps and clinical cues detailed below.
                  </Text>
                </View>
              </View>
            )}

            {/* Key Form Cues & Specific Execution Notes */}
            {userCues ? (
              <View style={styles.cuesCard}>
                <View style={styles.cuesHeader}>
                  <Ionicons name="bulb-outline" size={16} color={KinetixTheme.colors.secondaryDark} style={{ marginRight: 6 }} />
                  <Text style={styles.cuesHeaderText}>KEY FORM CUES & PROTOCOL NOTES</Text>
                </View>
                <Text style={styles.cuesText}>{userCues}</Text>
              </View>
            ) : null}

            {/* Step-by-Step Instructions */}
            {instructions ? (
              <View style={styles.instructionsContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="list-outline" size={16} color={KinetixTheme.colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.sectionHeaderText}>STEP-BY-STEP EXECUTION</Text>
                </View>
                <View style={styles.instructionsCard}>
                  <Text style={styles.instructionsText}>{instructions}</Text>
                </View>
              </View>
            ) : null}

            {/* Biomechanical Breakdown & Clinical Protocol Details */}
            {description ? (
              <View style={styles.biomechanicsContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="analytics-outline" size={16} color={KinetixTheme.colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.sectionHeaderText}>CLINICAL & BIOMECHANICAL PROTOCOL</Text>
                </View>
                {renderStructuredDescription(description)}
              </View>
            ) : null}

            {/* Movement Specifications Grid */}
            <View style={styles.specsSection}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="cog-outline" size={16} color={KinetixTheme.colors.textMuted} style={{ marginRight: 6 }} />
                <Text style={[styles.sectionHeaderText, { color: KinetixTheme.colors.textMuted }]}>
                  MOVEMENT SPECIFICATIONS
                </Text>
              </View>
              <View style={styles.specsGrid}>
                {muscleGroup ? (
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>TARGET MUSCULATURE</Text>
                    <Text style={styles.specValue}>{muscleGroup}</Text>
                  </View>
                ) : null}
                {mechanics ? (
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>MECHANICS PATTERN</Text>
                    <Text style={styles.specValue}>{mechanics}</Text>
                  </View>
                ) : null}
                {equipment ? (
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>EQUIPMENT</Text>
                    <Text style={styles.specValue}>{equipment}</Text>
                  </View>
                ) : null}
                {difficulty ? (
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>DIFFICULTY LEVEL</Text>
                    <Text style={styles.specValue}>{difficulty}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Bottom Return to Workout Action */}
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBtnText}>Return to Workout</Text>
            </TouchableOpacity>

            <View style={{ height: Platform.OS === 'ios' ? 40 : 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: Math.min(Math.round(SCREEN_HEIGHT * 0.88), 780),
    maxHeight: '92%',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: KinetixTheme.colors.border,
    ...KinetixTheme.shadows.card,
  },
  handleBarTouchArea: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: KinetixTheme.colors.borderSubtle,
    alignSelf: 'center',
  },
  doneBtn: {
    backgroundColor: KinetixTheme.colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: KinetixTheme.colors.border,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  badgePrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KinetixTheme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  badgePrimaryText: {
    color: KinetixTheme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeDiff: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeDiffText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeEquipment: {
    backgroundColor: KinetixTheme.colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
  },
  badgeEquipmentText: {
    color: KinetixTheme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  exerciseTitle: {
    color: KinetixTheme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: KinetixTheme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bodyScroll: {
    flex: 1,
    width: '100%',
  },
  bodyScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  targetsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
  },
  targetsCardHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: KinetixTheme.colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  targetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    gap: 5,
  },
  targetChipLabel: {
    fontSize: 11,
    color: KinetixTheme.colors.textMuted,
    fontWeight: '500',
  },
  targetChipValue: {
    fontSize: 12,
    color: KinetixTheme.colors.text,
    fontWeight: '700',
  },
  playerWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    marginBottom: 16,
  },
  videoView: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#E2E8F0',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  controlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 44,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  controlBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    alignItems: 'center',
    marginBottom: 16,
  },
  fallbackIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: KinetixTheme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  fallbackTitle: {
    color: KinetixTheme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  fallbackSubtitle: {
    color: KinetixTheme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  fallbackUrl: {
    color: KinetixTheme.colors.primary,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  noVideoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    marginBottom: 16,
    gap: 12,
  },
  noVideoIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: KinetixTheme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noVideoTitle: {
    color: KinetixTheme.colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  noVideoSubtitle: {
    color: KinetixTheme.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  cuesCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  cuesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cuesHeaderText: {
    color: KinetixTheme.colors.secondaryDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cuesText: {
    color: '#064E3B',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: KinetixTheme.colors.textMuted,
    letterSpacing: 0.6,
  },
  instructionsContainer: {
    marginBottom: 16,
  },
  instructionsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
  },
  instructionsText: {
    color: KinetixTheme.colors.text,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
  },
  biomechanicsContainer: {
    marginBottom: 16,
  },
  descriptionContainer: {
    gap: 10,
  },
  descSectionCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  descSectionCardSimple: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
  },
  descSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  descSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  descSectionBody: {
    color: KinetixTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
  },
  specsSection: {
    marginBottom: 12,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specBox: {
    width: '48.5%',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KinetixTheme.colors.border,
  },
  specLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: KinetixTheme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  specValue: {
    fontSize: 12,
    fontWeight: '700',
    color: KinetixTheme.colors.text,
    lineHeight: 16,
  },
});
