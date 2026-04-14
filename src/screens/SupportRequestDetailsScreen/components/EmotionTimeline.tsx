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
  const emotionTimeline = useMemo<TimelineEntry[]>(() => {
    const entries: TimelineEntry[] = [];

    const triggerName =
      sr.trigger_Emotion?.emotion_item?.Display ?? sr.trigger_Emotion?.emotion_name ?? '';
    const triggerColour =
      sr.trigger_Emotion?.emotion_item?.emotionColour ?? colors.textPlaceholder;

    if (triggerName) {
      entries.push({
        name: triggerName,
        colour: triggerColour,
        timestamp: sr.logged_Date,
      });
    }

    (sr.updated_Emotions_List ?? []).forEach((e) => {
      if (e.Display) {
        entries.push({
          name: e.Display,
          colour: e.emotionColour ?? colors.textPlaceholder,
          timestamp: e.timestamp,
        });
      }
    });

    if (sr.resolved_Emotion?.Display) {
      entries.push({
        name: sr.resolved_Emotion.Display,
        colour: sr.resolved_Emotion.emotionColour ?? colors.textPlaceholder,
        timestamp: sr.resolved_Date,
      });
    }

    // Most recent first
    entries.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
    return entries;
  }, [sr]);

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
