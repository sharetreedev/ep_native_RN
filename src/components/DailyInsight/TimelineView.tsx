import React, { useRef, useEffect, useState, useMemo } from 'react';
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
  items: { name: string; colour: string; isPleasant: boolean; intensity?: number }[];
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

    const dayCheckIns = checkIns
      .filter((c) => toLocalDateString(c.loggedDate) === dayStr)
      .sort((a, b) => new Date(b.loggedDate).getTime() - new Date(a.loggedDate).getTime());

    const items = dayCheckIns.map((c) => ({
      name: c.state.Display,
      colour: c.state.emotionColour,
      isPleasant: pleasantSet.has(c.state.Display.toLowerCase()),
      intensity: c.coordinate?.intensityNumber,
    }));

    rows.push({ dateLabel: dayLabel, items });
  }
  return rows;
}

function TimelineView({ checkIns }: TimelineViewProps) {
  const { emotionStates } = useEmotionStates();

  // Build set of pleasant emotion names from grid position (col 2-3 = right side = pleasant)
  const pleasantSet = React.useMemo(() => {
    const set = new Set<string>();
    emotionStates.forEach((e) => {
      if (e.col >= 2) set.add(e.name.toLowerCase());
    });
    return set;
  }, [emotionStates]);

  // `buildLast7Days` runs 7 × (filter + sort) over check-ins. Memoise so
  // parent re-renders (e.g. animation tick on DailyInsightScreen) don't
  // re-scan the timeline on every frame.
  const rows = useMemo(() => buildLast7Days(checkIns, pleasantSet), [checkIns, pleasantSet]);

  // Build a flat list of all visual rows (date headers + individual check-ins) for animation
  const flatRows = useMemo(() => {
    const result: { type: 'date'; dateLabel: string; hasItems: boolean }[] | { type: 'checkin'; item: { name: string; colour: string; isPleasant: boolean; intensity?: number } }[] = [];
    const out: ({ type: 'date'; dateLabel: string; hasItems: boolean } | { type: 'checkin'; item: { name: string; colour: string; isPleasant: boolean; intensity?: number } })[] = [];
    for (const row of rows) {
      out.push({ type: 'date', dateLabel: row.dateLabel, hasItems: row.items.length > 0 });
      for (const item of row.items) {
        out.push({ type: 'checkin', item });
      }
    }
    return out;
  }, [rows]);

  // Stagger animation
  const animValues = useRef(flatRows.map(() => new Animated.Value(0))).current;
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    animValues.forEach((a) => a.setValue(0));
    Animated.stagger(
      100,
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
        {flatRows.map((entry, index) => {
          const opacity = animValues[index] ?? new Animated.Value(1);

          if (entry.type === 'date') {
            return (
              <Animated.View key={`date-${index}-${animKey}`} style={[styles.dateRow, { opacity }]}>
                <View style={styles.side} />
                <View style={styles.dateColumn}>
                  <View style={styles.dateDot} />
                  <Text style={styles.dateLabel}>{entry.dateLabel}</Text>
                </View>
                <View style={[styles.side, styles.rightSide]}>
                  {!entry.hasItems && <Text style={styles.noCheckIn}>No check in</Text>}
                </View>
              </Animated.View>
            );
          }

          const { item } = entry;
          return (
            <Animated.View key={`ci-${index}-${animKey}`} style={[styles.row, { opacity }]}>
              {/* Left side — unpleasant */}
              <View style={styles.side}>
                {!item.isPleasant && (
                  <View style={styles.badgeRight}>
                    <EmotionBadge
                      emotionName={item.name}
                      emotionColour={item.colour}
                      intensity={item.intensity}
                      compact
                    />
                  </View>
                )}
              </View>

              {/* Center connector */}
              <View style={styles.dateColumn}>
                <View style={styles.connectorDot} />
              </View>

              {/* Right side — pleasant */}
              <View style={[styles.side, styles.rightSide]}>
                {item.isPleasant && (
                  <EmotionBadge
                    emotionName={item.name}
                    emotionColour={item.colour}
                    intensity={item.intensity}
                    compact
                  />
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    minHeight: 28,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    minHeight: 32,
  },
  connectorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
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

export default React.memo(TimelineView);
