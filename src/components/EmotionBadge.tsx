import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes } from '../theme';

interface EmotionBadgeProps {
  emotionName: string;
  emotionColour: string;
  compact?: boolean;
  size?: 'default' | 'small' | 'compact';
  /** Intensity level 1-4. Renders as a segmented battery-style pill variant. */
  intensity?: number;
}

// Emotions whose API-provided background colour is dark enough that the
// badge label must use white text. All other emotions use the default
// dark label. Keep in sync with LIGHT_LABEL_EMOTION_IDS in `lib/emotionUtils.ts`.
const LIGHT_TEXT_EMOTIONS = ['depressed', 'ecstatic', 'enraged', 'blissful'];
const MAX_BARS = 4;

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getEmotionFontColor(name: string): string {
  return LIGHT_TEXT_EMOTIONS.includes(name.toLowerCase()) ? colors.textOnPrimary : colors.textPrimary;
}

/** Battery-style segmented pill — the entire badge is divided into filled/unfilled segments. */
function IntensityBadge({ emotionName, emotionColour, intensity, resolvedSize }: {
  emotionName: string;
  emotionColour: string;
  intensity: number;
  resolvedSize: 'default' | 'small' | 'compact';
}) {
  const fontColor = getEmotionFontColor(emotionName);
  const clamped = Math.min(Math.max(intensity, 0), MAX_BARS);
  const height = resolvedSize === 'compact' ? 28 : resolvedSize === 'small' ? 36 : 40;
  const minWidth = resolvedSize === 'compact' ? 80 : resolvedSize === 'small' ? 100 : 120;
  const bRadius = resolvedSize === 'compact' ? 8 : 12;
  const gap = 2;
  const px = resolvedSize === 'compact' ? 12 : resolvedSize === 'small' ? 18 : 24;

  return (
    <View style={[intensityStyles.wrapper, { minWidth, height, borderRadius: bRadius }]}>
      {/* Segmented bars — background layer */}
      <View style={[intensityStyles.segmentRow, { borderRadius: bRadius, gap }]}>
        {Array.from({ length: MAX_BARS }, (_, i) => {
          const isFilled = i < clamped;
          const isFirst = i === 0;
          const isLast = i === MAX_BARS - 1;
          return (
            <View
              key={i}
              style={[
                intensityStyles.segment,
                {
                  backgroundColor: isFilled ? emotionColour : 'rgba(0,0,0,0.06)',
                  borderTopLeftRadius: isFirst ? bRadius : 0,
                  borderBottomLeftRadius: isFirst ? bRadius : 0,
                  borderTopRightRadius: isLast ? bRadius : 0,
                  borderBottomRightRadius: isLast ? bRadius : 0,
                },
              ]}
            />
          );
        })}
      </View>
      {/* Label — overlaid on top of bars */}
      <View style={[intensityStyles.labelOverlay, { paddingHorizontal: px }]}>
        <Text style={[
          intensityStyles.label,
          { color: fontColor },
          resolvedSize === 'compact' && intensityStyles.labelCompact,
          resolvedSize === 'small' && intensityStyles.labelSmall,
        ]}>
          {capitalize(emotionName)}
        </Text>
      </View>
    </View>
  );
}

const intensityStyles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
    position: 'relative',
    overflow: 'hidden',
  },
  segmentRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  segment: {
    flex: 1,
  },
  labelOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    textAlign: 'center',
  },
  labelSmall: {
    fontSize: fontSizes.md,
  },
  labelCompact: {
    fontSize: fontSizes.xs,
  },
});

function EmotionBadge({ emotionName, emotionColour, compact, size, intensity }: EmotionBadgeProps) {
  const resolvedSize = size ?? (compact ? 'compact' : 'default');

  // If intensity is provided, render the segmented battery variant
  if (intensity != null && intensity > 0) {
    return (
      <IntensityBadge
        emotionName={emotionName}
        emotionColour={emotionColour}
        intensity={intensity}
        resolvedSize={resolvedSize}
      />
    );
  }

  const fontColor = getEmotionFontColor(emotionName);

  return (
    <View style={[styles.badge, { backgroundColor: emotionColour }, resolvedSize === 'small' && styles.badgeSmall, resolvedSize === 'compact' && styles.badgeCompact]}>
      <Text style={[styles.text, { color: fontColor }, resolvedSize === 'small' && styles.textSmall, resolvedSize === 'compact' && styles.textCompact]}>{capitalize(emotionName)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 6,
    borderRadius: 12,
    minHeight: 40,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  badgeSmall: {
    paddingHorizontal: 18,
    paddingVertical: 5,
    minHeight: 36,
    borderRadius: 11,
  },
  textSmall: {
    fontSize: fontSizes.md,
  },
  badgeCompact: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    minHeight: 28,
    borderRadius: 8,
  },
  textCompact: {
    fontSize: fontSizes.xs,
  },
});

export default React.memo(EmotionBadge);
