import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Safely require expo-video to prevent crashes if dev build lacks native module
let expoVideo = null;
try {
  expoVideo = require('expo-video');
} catch (e) {
  console.log('[ExerciseVideoModal] expo-video native module not available:', e?.message);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function VideoPlayerInner({ videoUrl, thumbnailUrl }) {
  if (!expoVideo || !expoVideo.useVideoPlayer || !expoVideo.VideoView) {
    return (
      <View style={styles.fallbackContainer}>
        <Ionicons name="videocam-outline" size={48} color="#00D09E" />
        <Text style={styles.fallbackTitle}>Native Video Module Not Linked</Text>
        <Text style={styles.fallbackSubtitle}>
          Rebuild your development client to enable native video playback.
        </Text>
        <Text style={styles.fallbackUrl} numberOfLines={2}>
          Source: {videoUrl}
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
          <ActivityIndicator size="large" color="#00D09E" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      )}

      {/* Bottom Floating Control Bar */}
      <View style={styles.controlsBar}>
        <TouchableOpacity style={styles.controlBtn} onPress={togglePlay} activeOpacity={0.7}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={22}
            color="#FFF"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn} onPress={restartVideo} activeOpacity={0.7}>
          <Ionicons name="refresh" size={20} color="#FFF" />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.controlBtn} onPress={toggleMute} activeOpacity={0.7}>
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={20}
            color={isMuted ? '#9CA3AF' : '#00D09E'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ExerciseVideoModal({ visible, onClose, exercise }) {
  if (!visible || !exercise) return null;

  const videoUrl = exercise.video_url;
  const instructions = exercise.instructions || exercise.cue;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={styles.tagRow}>
                <View style={styles.badgePrimary}>
                  <Ionicons name="play-circle" size={12} color="#00D09E" style={{ marginRight: 4 }} />
                  <Text style={styles.badgePrimaryText}>Form Demonstration</Text>
                </View>
                {exercise.equipment ? (
                  <View style={styles.badgeSecondary}>
                    <Text style={styles.badgeSecondaryText}>{exercise.equipment}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.exerciseTitle} numberOfLines={2}>
                {exercise.name || 'Exercise Demo'}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {/* Video View */}
            {videoUrl ? (
              <VideoPlayerInner videoUrl={videoUrl} thumbnailUrl={exercise.video_thumbnail_url} />
            ) : (
              <View style={styles.noVideoCard}>
                <Ionicons name="videocam-off-outline" size={36} color="#6B7280" />
                <Text style={styles.noVideoText}>No demo video linked for this exercise yet.</Text>
              </View>
            )}

            {/* Exercise Instructions & Cues */}
            {instructions ? (
              <View style={styles.instructionsCard}>
                <View style={styles.instructionsHeader}>
                  <Ionicons name="bulb-outline" size={16} color="#00D09E" style={{ marginRight: 6 }} />
                  <Text style={styles.instructionsHeaderText}>Key Form Cues & Execution</Text>
                </View>
                <Text style={styles.instructionsText}>{instructions}</Text>
              </View>
            ) : null}

            {/* Target Muscle / Details if available */}
            {exercise.muscle_group || exercise.category ? (
              <View style={styles.metaRow}>
                {exercise.muscle_group ? (
                  <View style={styles.metaPill}>
                    <Text style={styles.metaLabel}>Target Muscle:</Text>
                    <Text style={styles.metaValue}>{exercise.muscle_group}</Text>
                  </View>
                ) : null}
                {exercise.difficulty ? (
                  <View style={styles.metaPill}>
                    <Text style={styles.metaLabel}>Difficulty:</Text>
                    <Text style={styles.metaValue}>{exercise.difficulty}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E1E24',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: '#3A3A45',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A31',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  badgePrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00D09E20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgePrimaryText: {
    color: '#00D09E',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeSecondary: {
    backgroundColor: '#2A2A31',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeSecondaryText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  exerciseTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2A31',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  playerWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#3A3A45',
  },
  videoView: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 8,
  },
  controlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: 'rgba(15, 17, 21, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackContainer: {
    width: '100%',
    padding: 24,
    backgroundColor: '#161620',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A31',
    alignItems: 'center',
  },
  fallbackTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
  },
  fallbackSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  fallbackUrl: {
    color: '#00D09E',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  noVideoCard: {
    width: '100%',
    padding: 30,
    backgroundColor: '#161620',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A31',
  },
  noVideoText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  instructionsCard: {
    backgroundColor: '#2A2A31',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00D09E',
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  instructionsHeaderText: {
    color: '#00D09E',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  instructionsText: {
    color: '#E5E7EB',
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  metaPill: {
    flex: 1,
    backgroundColor: '#161620',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A31',
  },
  metaLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metaValue: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
