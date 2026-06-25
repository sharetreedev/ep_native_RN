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

// Trigger and resolved rows for the same emotion can land a few ms apart, so
// timestamps within this window are treated as the same point on the timeline.
const DEDUP_TOLERANCE_MS = 60_000;

const hasRealColour = (c: string | null | undefined): c is string =>
  !!c && c.trim().length > 0;

function formatTimeAgo(ts: number | null): string {
  if (!ts) return '';
  return formatDistanceToNow(new Date(ts), { addSuffix: true });
}

function EmotionTimeline({ supportRequest: sr }: EmotionTimelineProps) {
  // updated_Emotions_List is the authoritative timeline: the backend writes
  // the trigger check-in as the first entry and the resolved check-in as the
  // last entry, so trigger_Emotion / resolved_Emotion would just duplicate
  // rows here.
  const emotionTimeline = useMemo<TimelineEntry[]>(() => {
    type WorkingEntry = {
      id: number | null;
      name: string;
      rawColour: string;
      timestamp: number | null;
    };

    const entries: WorkingEntry[] = (sr.updated_Emotions_List ?? [])
      .filter((e) => e.Display && e.timestamp != null)
      .map((e) => ({
        id: e.emotion_states_id ?? null,
        name: e.Display,
        rawColour: e.emotionColour ?? '',
        timestamp: e.timestamp,
      }));

    entries.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));

    // Collapse near-duplicate rows. The support request is logged a few ms
    // after the trigger check-in, so the trigger emotion appears twice with
    // slightly different timestamps — an exact name|timestamp key never
    // collapses them. Dedup by emotion_states_id (falling back to name) within
    // a ~60s window, and keep whichever copy carries a real colour so the grey
    // placeholder is never shown next to its properly-coloured twin.
    const kept: WorkingEntry[] = [];
    for (const entry of entries) {
      const dup = kept.find((k) => {
        const sameEmotion =
          k.id != null && entry.id != null ? k.id === entry.id : k.name === entry.name;
        if (!sameEmotion) return false;
        if (k.timestamp == null || entry.timestamp == null) return true;
        return Math.abs(k.timestamp - entry.timestamp) <= DEDUP_TOLERANCE_MS;
      });
      if (dup) {
        if (!hasRealColour(dup.rawColour) && hasRealColour(entry.rawColour)) {
          dup.rawColour = entry.rawColour;
        }
        continue;
      }
      kept.push(entry);
    }

    return kept.map((k) => ({
      name: k.name,
      colour: hasRealColour(k.rawColour) ? k.rawColour : colors.textPlaceholder,
      timestamp: k.timestamp,
    }));
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
