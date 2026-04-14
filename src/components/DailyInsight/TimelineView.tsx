import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import EmotionBadge from '../EmotionBadge';
import { XanoTimelineCheckIn } from '../../api';
import { useEmotionStates } from '../../hooks/useEmotionStates';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface TimelineViewProps {
  checkIns: XanoTimelineCheckIn[];
}

interface TimelineRow {
  dateLabel: string;
  items: { name: string; colour: string; isPleasant: boolean }[];
}

/** Convert any date/datetime string to YYYY-MM-DD in the device's local timezone. */
function toLocalDateString(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value.slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Format a date relative to today in the user's local timezone. */
function formatDayLabel(d: Date, daysAgo: number): string {
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  const weekday = d.toLocaleString('default', { weekday: 'short' });
  const day = d.getDate();
  const month = d.toLocaleString('default', { month: 'short' });
  return `${weekday}, ${day} ${month}`;
}

function buildLast7Days(
  checkIns: XanoTimelineCheckIn[],
  pleasantSet: Set<string>,
): TimelineRow[] {
  const rows: TimelineRow[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = toLocalDateString(d.toISOString());
    const dayLabel = formatDayLabel(d, i);

    const dayCheckIns = checkIns.filter((c) => toLocalDateString(c.loggedDate) === dayStr);

    const items = dayCheckIns.map((c) => ({
      name: c.state.Display,
      colour: c.state.emotionColour,
      isPleasant: pleasantSet.has(c.state.Display.toLowerCase()),
    }));

    rows.push({ dateLabel: dayLabel, items });
  }
  return rows;
}

export default function TimelineView({ checkIns }: TimelineViewProps) {
  const { emotionStates } = useEmotionStates();

  // Build set of pleasant emotion names from grid position (col 2-3 = right side = pleasant)
  const pleasantSet = React.useMemo(() => {
    const set = new Set<string>();
    emotionStates.forEach((e) => {
      if (e.col >= 2) set.add(e.name.toLowerCase());
    });
    return set;
  }, [emotionStates]);

  const rows = buildLast7Days(checkIns, pleasantSet);

  // Stagger animation
  const animValues = useRef(rows.map(() => new Animated.Value(0))).current;
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    animValues.forEach((a) => a.setValue(0));
    Animated.stagger(
      180,
      animValues.map((a) =>
        Animated.timing(a, { toValue: 1, duration: 400, useNativeDriver: true }),
      ),
    ).start();
    setAnimKey((k) => k + 1);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.columnHeaders}>
        <Text style={styles.columnLabel}>Unpleasant</Text>
        <View style={styles.columnLabelSpacer} />
        <Text style={styles.columnLabel}>Pleasant</Text>
      </View>
      <View style={styles.timeline}>
        {rows.map((row, index) => {
          const opacity = animValues[index] ?? new Animated.Value(1);
          return (
            <Animated.View key={`${index}-${animKey}`} style={[styles.row, { opacity }]}>
              {/* Left side badges (unpleasant) — right-aligned toward center */}
              <View style={styles.side}>
                {row.items
                  .filter((item) => !item.isPleasant)
                  .map((item, i) => (
                    <View key={i} style={styles.badgeRight}>
                      <EmotionBadge
                        emotionName={item.name}
                        emotionColour={item.colour}
                        compact
                      />
                    </View>
                  ))}
              </View>

              {/* Center date */}
              <View style={styles.dateColumn}>
                <View style={styles.dateDot} />
                <Text style={styles.dateLabel}>{row.dateLabel}</Text>
              </View>

              {/* Right side badges (pleasant) */}
              <View style={[styles.side, styles.rightSide]}>
                {row.items.length === 0 ? (
                  <Text style={styles.noCheckIn}>No check in</Text>
                ) : (
                  row.items
                    .filter((item) => item.isPleasant)
                    .map((item, i) => (
                      <EmotionBadge
                        key={i}
                        emotionName={item.name}
                        emotionColour={item.colour}
                        compact
                      />
                    ))
                )}
              </View>
            </Animated.View>
          );
        })}
        {/* Vertical axis line */}
        <View style={styles.axisLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  timeline: {
    position: 'relative',
    paddingVertical: spacing.sm,
  },
  axisLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 2,
    backgroundColor: colors.border,
    zIndex: -1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    minHeight: 40,
  },
  side: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
    paddingRight: spacing.sm,
  },
  rightSide: {
    alignItems: 'flex-start',
    paddingRight: 0,
    paddingLeft: spacing.sm,
  },
  dateColumn: {
    alignItems: 'center',
    width: 80,
  },
  dateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginBottom: 2,
  },
  dateLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  badgeRight: {
    alignSelf: 'flex-end',
  },
  noCheckIn: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textPlaceholder,
    fontStyle: 'italic',
  },
  columnHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  columnLabel: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  columnLabelSpacer: {
    width: 80,
  },
});
