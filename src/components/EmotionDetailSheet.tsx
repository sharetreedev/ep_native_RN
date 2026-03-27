import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { MappedEmotion } from '../hooks/useEmotionStates';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EmotionDetailSheetProps {
  emotion: MappedEmotion | null;
  visible: boolean;
  onClose: () => void;
  /** Sibling emotions in the same cluster/zone */
  clusterEmotions?: MappedEmotion[];
}

const LIGHT_TEXT_EMOTIONS = ['depressed', 'ecstatic', 'enraged', 'blissful'];

function getEmotionFontColor(name: string): string {
  return LIGHT_TEXT_EMOTIONS.includes(name.toLowerCase()) ? '#FFFFFF' : '#1F2937';
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getZoneLabel(energy: 'high' | 'low', pleasantness: 'high' | 'low'): string {
  const e = energy === 'high' ? 'High Energy' : 'Low Energy';
  const p = pleasantness === 'high' ? 'Pleasant' : 'Unpleasant';
  return `${e} · ${p}`;
}

export default function EmotionDetailSheet({
  emotion,
  visible,
  onClose,
  clusterEmotions = [],
}: EmotionDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
      ]).start();
    } else {
      backdropAnim.setValue(0);
      slideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [visible]);

  if (!emotion) return null;

  const emotionColor = emotion.emotionColour ||
    colors.emotional[emotion.id as keyof typeof colors.emotional] ||
    colors.primary;
  const zoneLabel = getZoneLabel(emotion.energy, emotion.pleasantness);
  const siblings = clusterEmotions.filter((e) => e.id !== emotion.id);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.overlay, { opacity: backdropAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {/* Close */}
          <View style={styles.header}>
            <View style={{ width: 32 }} />
            <Text style={styles.headerTitle}>{capitalize(emotion.name)}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
              <X color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Emotion color card */}
            <View style={[styles.emotionCard, { backgroundColor: emotionColor }]}>
              <Text style={[styles.emotionCardText, { color: getEmotionFontColor(emotion.name) }]}>
                {capitalize(emotion.name)}
              </Text>
            </View>

            {/* Cluster / Zone */}
            <View style={styles.clusterSection}>
              <Text style={styles.sectionLabel}>Cluster</Text>
              <Text style={styles.zoneLabel}>{zoneLabel}</Text>
              {siblings.length > 0 && (
                <View style={styles.siblingRow}>
                  {siblings.map((sib) => {
                    const sibColor = sib.emotionColour ||
                      colors.emotional[sib.id as keyof typeof colors.emotional] ||
                      colors.textMuted;
                    return (
                      <View key={sib.id} style={[styles.siblingChip, { backgroundColor: sibColor }]}>
                        <Text style={[styles.siblingChipText, { color: getEmotionFontColor(sib.name) }]}>
                          {capitalize(sib.name)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Description */}
            {emotion.description ? (
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionLabel}>Description</Text>
                <Text style={styles.descriptionText}>{emotion.description}</Text>
              </View>
            ) : null}

            {/* Regulation strategy */}
            {emotion.regulationStrategy ? (
              <View style={styles.strategySection}>
                <Text style={styles.strategyLabel}>How to shift state</Text>
                <Text style={styles.strategyText}>{emotion.regulationStrategy}</Text>
              </View>
            ) : null}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: SCREEN_HEIGHT * 0.75,
    paddingHorizontal: spacing.xl,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.full,
  },
  scroll: {
    flexGrow: 0,
  },
  emotionCard: {
    width: 106,
    height: 106,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    alignSelf: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  emotionCardText: {
    fontSize: fontSizes.lg - 2,
    fontFamily: fonts.heading,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  clusterSection: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.base,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  zoneLabel: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.headingSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  siblingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.xs,
  },
  siblingChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  siblingChipText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.bodyMedium,
  },
  descriptionSection: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.base,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  descriptionText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  strategySection: {
    backgroundColor: colors.primaryLight,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(145,162,125,0.2)',
    marginBottom: 32,
  },
  strategyLabel: {
    color: colors.textPrimary,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  strategyText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    lineHeight: 24,
  },
});
