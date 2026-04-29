import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, PanResponder, GestureResponderEvent, LayoutChangeEvent, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Pause, SkipBack, SkipForward, Volume2, ArrowLeft } from 'lucide-react-native';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { colors, fonts, fontSizes, borderRadius, spacing, buttonStyles } from '../../theme';
import { RootStackParamList } from '../../types/navigation';
import { useCourses } from '../../hooks/useCourses';
import { useSafeEdges } from '../../contexts/MHFRContext';

const SKIP_SECONDS = 15;

export default function LessonScreen() {
  const safeEdges = useSafeEdges(['top']);
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Lessons'>>();
  const lesson = route.params?.lesson;

  const { markLessonComplete } = useCourses();

  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const maxPositionRef = useRef(0);
  const [hasReached80, setHasReached80] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPosition, setScrubPosition] = useState(0);
  const trackWidthRef = useRef(0);
  const trackXRef = useRef(0);

  const clampRatio = (pageX: number) => {
    const ratio = (pageX - trackXRef.current) / trackWidthRef.current;
    return Math.max(0, Math.min(1, ratio));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e: GestureResponderEvent) => {
        setIsScrubbing(true);
        setScrubPosition(clampRatio(e.nativeEvent.pageX));
      },
      onPanResponderMove: (e: GestureResponderEvent) => {
        setScrubPosition(clampRatio(e.nativeEvent.pageX));
      },
      onPanResponderRelease: (e: GestureResponderEvent) => {
        const ratio = clampRatio(e.nativeEvent.pageX);
        const newMs = ratio * durationMs;
        soundRef.current?.setPositionAsync(newMs);
        setIsScrubbing(false);
      },
      onPanResponderTerminate: () => {
        setIsScrubbing(false);
      },
    })
  ).current;

  const onTrackLayout = (e: LayoutChangeEvent) => {
    trackWidthRef.current = e.nativeEvent.layout.width;
    e.target.measureInWindow((x: number) => {
      trackXRef.current = x;
    });
  };

  const audioUrl = lesson?.audio_url?.url;
  const duration = durationMs / 1000;
  const position = isScrubbing ? scrubPosition * duration : positionMs / 1000;

  // Pause audio when user navigates away from this screen
  useFocusEffect(
    useCallback(() => {
      return () => {
        soundRef.current?.pauseAsync();
      };
    }, [])
  );

  // Load audio when screen mounts with an audio URL
  useEffect(() => {
    if (!audioUrl) return;

    let sound: Audio.Sound;

    const load = async () => {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound: s } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false },
        onPlaybackStatusUpdate,
      );
      sound = s;
      soundRef.current = s;
      setIsLoaded(true);
    };

    load();

    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [audioUrl]);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setPositionMs(status.positionMillis);
    setDurationMs(status.durationMillis ?? 0);
    setIsPlaying(status.isPlaying);

    // Track furthest position reached for 80% threshold
    if (status.positionMillis > maxPositionRef.current) {
      maxPositionRef.current = status.positionMillis;
      const dur = status.durationMillis ?? 0;
      if (dur > 0 && maxPositionRef.current >= dur * 0.8) {
        setHasReached80(true);
      }
    }

    if (status.didJustFinish) {
      setIsPlaying(false);
      setPositionMs(0);
      setHasReached80(true);
    }
  }, []);

  const togglePlay = async () => {
    if (!soundRef.current || !isLoaded) return;
    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  };

  const skip = async (seconds: number) => {
    if (!soundRef.current || !isLoaded) return;
    const newPos = Math.max(0, Math.min(positionMs + seconds * 1000, durationMs));
    await soundRef.current.setPositionAsync(newPos);
  };

  const formatTime = (seconds: number) => {
    const s = Math.round(seconds);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMarkComplete = useCallback(async () => {
    if (!lesson?.id || isCompleting || isCompleted) return;
    setIsCompleting(true);
    try {
      const result = await markLessonComplete(lesson.id);
      if (!result) {
        Alert.alert('Error', 'Failed to mark lesson as complete. Please try again.');
        setIsCompleting(false);
        return;
      }
      setIsCompleted(true);
      // Navigate back to MyPulse, signaling course completion if this was the last lesson
      (navigation as any).navigate('Main', {
        screen: 'MyPulse',
        params: lesson.is_last_module
          ? { courseCompleted: true, courseName: result?.course_enrollment?.course?.name }
          : undefined,
      });
    } catch {
      Alert.alert('Error', 'Failed to mark lesson as complete. Please try again.');
      setIsCompleting(false);
    }
  }, [lesson?.id, isCompleting, isCompleted, markLessonComplete, navigation]);

  const canComplete = hasReached80 && !isCompleted;

  const lessonIndex = lesson?.index ?? 1;
  const lessonTitle = lesson?.title ?? 'Why Pulse & Emotions';
  const lessonBody = lesson?.detail ??
    'Understanding your emotional state is the first step towards emotional intelligence. In this lesson, we explore the science behind the circumplex grid and how high energy differ from high pleasantness.';

  return (
    <SafeAreaView style={styles.container} edges={safeEdges}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            (navigation as any).navigate('Main', { screen: 'MyPulse' });
          }
        }} style={styles.backButton}>
          <ArrowLeft color={colors.textSecondary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lesson #{lessonIndex}</Text>
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('Main', { screen: 'MyPulse' })}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Exit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.lessonLabel}>Lesson {lessonIndex}</Text>
        <Text style={styles.lessonTitle}>{lessonTitle}</Text>
        <Text style={styles.lessonBody}>{lessonBody}</Text>

        <View style={styles.artworkWrap}>
          <View style={styles.artwork}>
            <View style={styles.artworkOverlay} />
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
              }}
              style={styles.artworkImage}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.player}>
        <View
          style={styles.progressHitArea}
          onLayout={onTrackLayout}
          {...panResponder.panHandlers}
        >
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${duration > 0 ? (position / duration) * 100 : 0}%` }]} />
          </View>
          {duration > 0 && (
            <View style={[styles.scrubThumb, { left: `${duration > 0 ? (position / duration) * 100 : 0}%` }]} />
          )}
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>-{formatTime(Math.max(0, duration - position))}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity>
            <Volume2 color={colors.textPlaceholder} size={24} />
          </TouchableOpacity>

          <View style={styles.controlsCenter}>
            <TouchableOpacity onPress={() => skip(-SKIP_SECONDS)}>
              <SkipBack color={colors.textPrimary} size={28} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
              {isPlaying ? (
                <Pause color={colors.textOnPrimary} size={32} />
              ) : (
                <Play color={colors.textOnPrimary} size={32} />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => skip(SKIP_SECONDS)}>
              <SkipForward color={colors.textPrimary} size={28} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity>
            <Text style={styles.speedText}>1x</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.completeButton,
            (!canComplete) && styles.completeButtonDisabled,
            isCompleted && styles.completeButtonDone,
          ]}
          onPress={handleMarkComplete}
          disabled={!canComplete}
        >
          {isCompleting ? (
            <ActivityIndicator size="small" color={colors.textOnPrimary} />
          ) : (
            <Text style={[
              styles.completeButtonText,
              (!canComplete && !isCompleted) && styles.completeButtonTextDisabled,
            ]}>
              {isCompleted ? 'Completed' : 'Mark as Complete'}
            </Text>
          )}
        </TouchableOpacity>
        {!isCompleted && (
          <Text style={styles.completeHint}>To complete the lesson, make sure you finish the audio</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: { width: 40 },
  skipButton: { width: 40, alignItems: 'flex-end' as const },
  skipText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  scroll: { flex: 1, paddingHorizontal: 24 },
  scrollContent: { paddingBottom: 24 },
  lessonLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.bodyBold,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  lessonTitle: {
    fontSize: fontSizes['3xl'],
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  lessonBody: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 32,
  },
  artworkWrap: { alignItems: 'center' },
  artwork: {
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: colors.lessonCardStart,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  artworkOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: colors.primary,
    opacity: 0.2,
  },
  artworkImage: {
    width: 192,
    height: 192,
    borderRadius: 96,
    opacity: 0.8,
  },
  player: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 40,
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 40,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 12,
  },
  progressHitArea: {
    paddingVertical: 12,
    marginBottom: -8,
    justifyContent: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  scrubThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    marginLeft: -8,
    top: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  timeText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  controlsCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  speedText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bodyBold,
    color: colors.textMuted,
  },
  completeButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  completeButtonDisabled: {
    opacity: 0.4,
  },
  completeButtonDone: {
    backgroundColor: colors.surfaceMuted,
    opacity: 1,
  },
  completeButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textOnPrimary,
  },
  completeButtonTextDisabled: {
    color: colors.textOnPrimary,
  },
  completeHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
});
