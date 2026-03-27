import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { XanoRunningStats } from '../../api';
import { useEmotionStates } from '../../hooks/useEmotionStates';
import { getDirectionIcon } from '../../utils/getDirectionIcon';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';

interface TrendsViewProps {
  stats: XanoRunningStats | null;
  isLoading: boolean;
}

const TILES = [
  {
    label: 'Daily',
    key: 'direction_t_p' as const,
    getThemeColour: (stats: any, _emotionStates?: any[]) => stats?.current_checkin_location?.colour,
  },
  {
    label: '7 Day',
    key: 'direction_w1_w2' as const,
    getThemeColour: (stats: any, _emotionStates?: any[]) => stats?.w1?.themeColour ?? stats?.w1?.emotion_states?.themeColour,
  },
  {
    label: '30 Day',
    key: 'direction_m1_m2' as const,
    getThemeColour: (stats: any, _emotionStates?: any[]) => stats?.m1?.themeColour ?? stats?.m1?.emotion_states?.themeColour,
  },
  {
    label: 'All Time',
    key: 'direction_m1_at' as const,
    getThemeColour: (stats: any, emotionStates?: any[]) => {
      const modeStatesId = stats?.checkInMode?.emotion_states_id;
      if (modeStatesId && emotionStates) {
        const match = emotionStates.find((e: any) => e.xanoId === modeStatesId);
        if (match?.themeColour) return match.themeColour;
      }
      return stats?.checkInMode?.themeColour ?? stats?.checkInMode?.emotion_states?.themeColour;
    },
  },
];

export default function TrendsView({ stats, isLoading }: TrendsViewProps) {
  const { emotionStates } = useEmotionStates();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {TILES.map((tile) => {
        const direction = stats?.[tile.key];
        const themeColour = tile.getThemeColour(stats, emotionStates);
        const bgColor = themeColour ? `${themeColour}40` : undefined;
        return (
          <View key={tile.key} style={[styles.tile, bgColor ? { backgroundColor: bgColor } : undefined]}>
            <Text style={styles.tileLabel}>{tile.label}</Text>
            <View style={styles.tileIcon}>
              {getDirectionIcon(direction?.directionLabel, 28)}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  tile: {
    width: '47%',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.base,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  tileLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  tileIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
