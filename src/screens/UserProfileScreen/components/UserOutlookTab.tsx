import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { getDirectionIcon } from '../../../utils/getDirectionIcon';
import ProfileStatCard from '../../../components/ProfileStatCard';
import EmotionBadge from '../../../components/EmotionBadge';
import { XanoDirection, XanoShift } from '../../../api';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../../theme';
import { styles } from '../styles';

interface DirectionItem {
  label: string;
  data: XanoDirection | undefined | null;
  shift?: XanoShift | undefined | null;
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

const DIRECTION_DESCRIPTIONS: Record<string, string> = {
  'Daily': 'Comparison between your current check-in and previous check-in',
  '7 Day': 'Comparison between the last 7 days and previous 7 days',
  '30 Day': 'Comparison between the last 30 days and previous 30 days',
  'All Time': 'Comparison between the last 30 days and all time average',
};

function capitalize(str?: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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
  const [expandedTile, setExpandedTile] = useState<string | null>(null);

  return (
    <View style={styles.pulseContent}>
      {/* Direction row – 4 compact tiles in a single horizontal row */}
      <View style={styles.directionRow}>
        {directions.map((item) => {
          const bgColor = item.themeColour ? `${item.themeColour}40` : undefined;
          const isExpanded = expandedTile === item.label;
          return (
            <TouchableOpacity
              key={item.label}
              style={[styles.directionTile, bgColor ? { backgroundColor: bgColor } : undefined, isExpanded && expandStyles.activeTile]}
              onPress={() => setExpandedTile(isExpanded ? null : item.label)}
              activeOpacity={0.7}
            >
              <Text style={styles.directionTileLabel}>{item.label}</Text>
              <View style={styles.directionTileIcon}>
                {getDirectionIcon(item.data?.directionLabel, 22)}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Expanded detail card — floats above content */}
      {expandedTile && (() => {
        const item = directions.find(d => d.label === expandedTile);
        if (!item?.data) return null;
        const d = item.data;
        const s = item.shift;
        const desc = d.description || DIRECTION_DESCRIPTIONS[item.label] || '';
        const prevEmotion = d.previousEmotion || prevCheckin?.emotion_name;
        const prevColour = d.previousEmotionColour || prevCheckin?.colour;
        const currEmotion = d.currentEmotion || currentCheckin?.emotion_name;
        const currColour = d.currentEmotionColour || currentCheckin?.colour;
        const directionText = d.direction || d.directionLabel;
        const shiftSignificance = s?.significance || d.significance || d.shiftLabel;
        const shiftMagnitude = s?.magnitude ?? d.magnitude;

        return (
          <View style={expandStyles.cardWrapper}>
          <View style={expandStyles.card}>
            {desc ? (
              <>
                <Text style={expandStyles.sectionLabel}>Description:</Text>
                <Text style={expandStyles.description}>{desc}</Text>
              </>
            ) : null}

            {(prevEmotion || currEmotion) ? (
              <>
                <Text style={[expandStyles.sectionLabel, { marginTop: 12 }]}>Emotions:</Text>
                <View style={expandStyles.emotionRow}>
                  {prevEmotion ? (
                    <View style={expandStyles.emotionItem}>
                      <EmotionBadge emotionName={prevEmotion} emotionColour={prevColour || colors.textPlaceholder} size="small" />
                      <Text style={expandStyles.periodLabel}>Previous Period</Text>
                    </View>
                  ) : null}
                  {prevEmotion && currEmotion ? <Text style={expandStyles.arrow}>›</Text> : null}
                  {currEmotion ? (
                    <View style={expandStyles.emotionItem}>
                      <EmotionBadge emotionName={currEmotion} emotionColour={currColour || colors.textPlaceholder} size="small" />
                      <Text style={expandStyles.periodLabel}>Current Period</Text>
                    </View>
                  ) : null}
                </View>
              </>
            ) : null}

            {directionText ? (
              <View style={expandStyles.row}>
                <Text style={expandStyles.sectionLabel}>Direction:</Text>
                <Text style={expandStyles.value}>{capitalize(directionText)}</Text>
              </View>
            ) : null}

            {(shiftSignificance || shiftMagnitude != null) ? (
              <View style={expandStyles.row}>
                <Text style={expandStyles.sectionLabel}>Shift:</Text>
                <Text style={expandStyles.value}>
                  {capitalize(shiftSignificance)}{shiftMagnitude != null ? ` (Magnitude = ${Number(shiftMagnitude).toFixed(1)})` : ''}
                </Text>
              </View>
            ) : null}
          </View>
          </View>
        );
      })()}

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

const expandStyles = StyleSheet.create({
  activeTile: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  cardWrapper: {
    zIndex: 10,
  },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  sectionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  emotionItem: {
    alignItems: 'center',
    gap: 4,
  },
  periodLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  arrow: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes['2xl'],
    color: colors.textMuted,
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 8,
  },
  value: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    flex: 1,
  },
});
