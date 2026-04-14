import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes } from '../theme';

interface EmotionBadgeProps {
  emotionName: string;
  emotionColour: string;
  compact?: boolean;
  size?: 'default' | 'small' | 'compact';
}

const LIGHT_TEXT_EMOTIONS = ['depressed', 'ecstatic', 'enraged', 'blissful'];

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getEmotionFontColor(name: string): string {
  return LIGHT_TEXT_EMOTIONS.includes(name.toLowerCase()) ? colors.textOnPrimary : colors.textPrimary;
}

function EmotionBadge({ emotionName, emotionColour, compact, size }: EmotionBadgeProps) {
  const resolvedSize = size ?? (compact ? 'compact' : 'default');
  return (
    <View style={[styles.badge, { backgroundColor: emotionColour }, resolvedSize === 'small' && styles.badgeSmall, resolvedSize === 'compact' && styles.badgeCompact]}>
      <Text style={[styles.text, { color: getEmotionFontColor(emotionName) }, resolvedSize === 'small' && styles.textSmall, resolvedSize === 'compact' && styles.textCompact]}>{capitalize(emotionName)}</Text>
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
