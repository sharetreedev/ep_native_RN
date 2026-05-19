import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import EmotionBadge from '../../../components/EmotionBadge';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../../theme';
import type { XanoSupportRequest } from '../../../api/types';

interface EmotionTimelineProps {
  supportRequest: XanoSupportRequest;
}

interface TimelineEntry {
  name: string;
  colour: string;
  timestamp: number | null;
}

function formatTimeAgo(ts: number | null): string {
  if (!ts) return '';
  return formatDistanceToNow(new Date(ts), { addSuffix: true });
}

function EmotionTimeline({ supportRequest: sr }: EmotionTimelineProps) {
  // updated_Emotions_List is the authoritative timeline: the backend writes
  // the trigger check-in as the first entry and the resolved check-in as the
  // last entry, so trigger_Emotion / resolved_Emotion would just duplicate
  // rows here. The list also occasionally contains blank entries or two rows
  // with the same emotion + identical timestamp, which we filter out.
  const emotionTimeline = useMemo<TimelineEntry[]>(() => {
    const entries: TimelineEntry[] = (sr.updated_Emotions_List ?? [])
      .filter((e) => e.Display && e.timestamp != null)
      .map((e) => ({
        name: e.Display,
        colour: e.emotionColour || colors.textPlaceholder,
        timestamp: e.timestamp,
      }));

    entries.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));

    const seen = new Set<string>();
    return entries.filter((e) => {
      const key = `${e.name}|${e.timestamp}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [sr.updated_Emotions_List]);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Checkin History</Text>
      </View>

      {emotionTimeline.length > 0 ? (
        <View style={styles.timeline}>
          {emotionTimeline.map((entry, idx) => {
            const isLast = idx === emotionTimeline.length - 1;
            return (
              <View key={`${entry.name}-${idx}`} style={styles.timelineEntry}>
                <View style={styles.timelineTrack}>
                  <View style={[styles.timelineDot, { backgroundColor: entry.colour }]} />
                  {!isLast && <View style={styles.timelineLine} />}
                </View>

                <View style={styles.timelineContent}>
                  <EmotionBadge
                    emotionName={entry.name}
                    emotionColour={entry.colour}
                  />
                  {entry.timestamp ? (
                    <Text style={styles.timelineTs}>{formatTimeAgo(entry.timestamp)}</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.emptyLabel}>No emotions recorded</Text>
      )}
    </View>
  );
}

export default React.memo(EmotionTimeline);

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  timeline: { gap: 0 },
  timelineEntry: {
    flexDirection: 'row',
  },
  timelineTrack: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 8,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.base,
    gap: 4,
  },
  timelineTs: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textPlaceholder,
    marginLeft: 2,
  },
  emptyLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textPlaceholder,
  },
});
