import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import EmotionBadge from '../EmotionBadge';
import { XanoTimelineCheckIn } from '../../api';
import { useEmotionStates } from '../../hooks/useEmotionStates';
import { useAuth } from '../../contexts/AuthContext';
import { userDateOf, userDaysAgo } from '../../lib/userDate';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface TimelineViewProps {
  checkIns: XanoTimelineCheckIn[];
}

interface TimelineRow {
  dateLabel: string;
  items: { name: string; colour: string; isPleasant: boolean; intensity?: number }[];
}

/** Best timestamp for a check-in. `loggedDateTime` is unambiguous epoch ms;
 *  if absent fall back to the date string (which may bucket off-by-one for
 *  near-midnight check-ins, hence the preference). */
function checkInMoment(c: XanoTimelineCheckIn): number | string {
  if (typeof c.loggedDateTime === 'number') return c.loggedDateTime;
  if (typeof c.loggedDateUnix === 'number') return c.loggedDateUnix * 1000;
  if (typeof c.created_at === 'number') return c.created_at;
  return c.loggedDate;
}

/** "Today" / "Yesterday" / "Wed, 13 May" for a YYYY-MM-DD in the user's TZ. */
function formatDayLabel(dayStr: string, daysAgo: number): string {
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  const [y, m, d] = dayStr.split('-').map(Number);
  // Construct in UTC and read components back in UTC so the weekday/month
  // reflect the YYYY-MM-DD itself, not whatever timezone the device is in.
  const date = new Date(Date.UTC(y, m - 1, d));
  const weekday = date.toLocaleString('default', { weekday: 'short', timeZone: 'UTC' });
  const month = date.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
  return `${weekday}, ${d} ${month}`;
}

function buildLast7Days(
  checkIns: XanoTimelineCheckIn[],
  pleasantSet: Set<string>,
  timezone: string | null | undefined,
): TimelineRow[] {
  const rows: TimelineRow[] = [];
  for (let i = 0; i < 7; i++) {
    const dayStr = userDaysAgo(i, timezone);
    const dayLabel = formatDayLabel(dayStr, i);

    const dayCheckIns = checkIns
      .filter((c) => userDateOf(checkInMoment(c), timezone) === dayStr)
      .sort((a, b) => {
        const am = checkInMoment(a);
        const bm = checkInMoment(b);
        return (typeof bm === 'number' ? bm : new Date(bm).getTime())
          - (typeof am === 'number' ? am : new Date(am).getTime());
      });

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
  const { user } = useAuth();
  const timezone = user?.timezone;

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
  const rows = useMemo(
    () => buildLast7Days(checkIns, pleasantSet, timezone),
    [checkIns, pleasantSet, timezone],
  );

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
