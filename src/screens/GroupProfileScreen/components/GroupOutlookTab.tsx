import React from 'react';
import { View, Text } from 'react-native';
import { getDirectionIcon } from '../../../utils/getDirectionIcon';
import ProfileStatCard from '../../../components/ProfileStatCard';
import EmotionBadge from '../../../components/EmotionBadge';
import { colors } from '../../../theme';
import { styles } from '../styles';

interface DirectionItem {
  label: string;
  data: { directionLabel?: string; [key: string]: unknown } | undefined | null;
  themeColour: string | undefined;
}

interface GroupOutlookTabProps {
  directions: DirectionItem[];
  previousAverage: { emotion_name?: string; colour?: string } | undefined;
  todaysAverage: { emotion_name?: string; colour?: string } | undefined;
  dailyCheckinPercent: string;
  weeklyCheckinPercent: string;
  totalCheckins: string | number;
  modeEmotion: string | undefined;
  modeEmotionColour: string;
}

export default function GroupOutlookTab({
  directions,
  previousAverage,
  todaysAverage,
  dailyCheckinPercent,
  weeklyCheckinPercent,
  totalCheckins,
  modeEmotion,
  modeEmotionColour,
}: GroupOutlookTabProps) {
  return (
    <View style={styles.pulseContent}>
      {/* Direction row */}
      <View style={styles.directionRow}>
        {directions.map((item) => {
          const bgColor = item.themeColour ? `${item.themeColour}40` : undefined;
          return (
            <View key={item.label} style={[styles.directionTile, bgColor ? { backgroundColor: bgColor } : undefined]}>
              <Text style={styles.directionTileLabel}>{item.label}</Text>
              <View style={styles.directionTileIcon}>
                {getDirectionIcon(item.data?.directionLabel, 22)}
              </View>
            </View>
          );
        })}
      </View>

      {/* Daily Shift */}
      {(previousAverage || todaysAverage) && (
        <View style={styles.dailyShiftCard}>
          <Text style={styles.dailyShiftTitle}>Daily Shift</Text>
          <View style={styles.dailyShiftBadges}>
            {previousAverage?.emotion_name ? (
              <EmotionBadge
                emotionName={previousAverage.emotion_name}
                emotionColour={previousAverage.colour || colors.textPlaceholder}
              />
            ) : (
              <Text style={styles.noDataText}>No previous</Text>
            )}
            <Text style={styles.shiftArrow}>→</Text>
            {todaysAverage?.emotion_name ? (
              <EmotionBadge
                emotionName={todaysAverage.emotion_name}
                emotionColour={todaysAverage.colour || colors.textPlaceholder}
              />
            ) : (
              <Text style={styles.noDataText}>No current</Text>
            )}
          </View>
        </View>
      )}

      {/* Stats grid */}
      <View style={styles.statsGridTight}>
        <ProfileStatCard label="Daily Check-In %" value={dailyCheckinPercent} />
        <ProfileStatCard label="Weekly Check-In %" value={weeklyCheckinPercent} />
        <ProfileStatCard label="Total Check-Ins" value={String(totalCheckins)} />
        <ProfileStatCard
          label="Most Frequent"
          value={
            modeEmotion ? (
              <EmotionBadge emotionName={modeEmotion} emotionColour={modeEmotionColour} />
            ) : 'N/A'
          }
        />
      </View>
    </View>
  );
}
