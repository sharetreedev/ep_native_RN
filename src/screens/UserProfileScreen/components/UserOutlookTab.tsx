import React from 'react';
import { View, Text } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { getDirectionIcon } from '../../../utils/getDirectionIcon';
import ProfileStatCard from '../../../components/ProfileStatCard';
import EmotionBadge from '../../../components/EmotionBadge';
import { colors } from '../../../theme';
import { styles } from '../styles';

interface DirectionItem {
  label: string;
  data: { directionLabel?: string } | undefined;
  themeColour: string | undefined;
}

interface CheckinLocation {
  emotion_name?: string;
  colour?: string;
}

interface UserOutlookTabProps {
  directions: DirectionItem[];
  prevCheckin: CheckinLocation | undefined;
  currentCheckin: CheckinLocation | undefined;
  lastCheckinLabel: string;
  checkinRate: string;
  totalCheckins: string | number;
  modeEmotion: string | undefined;
  modeEmotionColour: string;
}

export default function UserOutlookTab({
  directions,
  prevCheckin,
  currentCheckin,
  lastCheckinLabel,
  checkinRate,
  totalCheckins,
  modeEmotion,
  modeEmotionColour,
}: UserOutlookTabProps) {
  return (
    <View style={styles.pulseContent}>
      {/* Direction row – 4 compact tiles in a single horizontal row */}
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

      {/* Daily Shift – prev → current emotion badges */}
      {(prevCheckin || currentCheckin) && (
        <View style={styles.dailyShiftCard}>
          <Text style={styles.dailyShiftTitle}>Daily Shift</Text>
          <View style={styles.dailyShiftBadges}>
            {prevCheckin?.emotion_name ? (
              <EmotionBadge
                emotionName={prevCheckin.emotion_name}
                emotionColour={prevCheckin.colour || colors.textPlaceholder}
              />
            ) : (
              <Text style={styles.noDataText}>No previous</Text>
            )}
            <Text style={styles.shiftArrow}>→</Text>
            {currentCheckin?.emotion_name ? (
              <EmotionBadge
                emotionName={currentCheckin.emotion_name}
                emotionColour={currentCheckin.colour || colors.textPlaceholder}
              />
            ) : (
              <Text style={styles.noDataText}>No current</Text>
            )}
          </View>
        </View>
      )}

      {/* Stats grid – 4 cards */}
      <View style={styles.statsGridTight}>
        <ProfileStatCard
          label="Last Check-In"
          value={String(lastCheckinLabel)}
          icon={<Calendar color={colors.textSecondary} size={16} />}
        />
        <ProfileStatCard
          label="Check-In Rate"
          value={String(checkinRate)}
        />
        <ProfileStatCard
          label="Total Check-Ins"
          value={String(totalCheckins)}
        />
        <ProfileStatCard
          label="Most Frequent"
          value={
            modeEmotion ? (
              <EmotionBadge
                emotionName={modeEmotion}
                emotionColour={modeEmotionColour}
              />
            ) : 'N/A'
          }
        />
      </View>
    </View>
  );
}
