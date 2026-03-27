import React from 'react';
import LastCheckInCard from './LastCheckInCard';
import { XanoRecentCheckInEmotion, XanoLast7CheckIn } from '../api';

interface LastCheckInWidgetProps {
  recentEmotion?: XanoRecentCheckInEmotion | null;
  last7CheckIns?: XanoLast7CheckIn[] | null;
  onTrendsPress?: () => void;
}

/**
 * Widget wrapper for the last check-in block on My Pulse.
 * Composes LastCheckInCard as a single screen-level widget.
 */
export default function LastCheckInWidget({ recentEmotion, last7CheckIns, onTrendsPress }: LastCheckInWidgetProps) {
  return (
    <LastCheckInCard
      recentEmotion={recentEmotion}
      last7CheckIns={last7CheckIns}
      onTrendsPress={onTrendsPress}
    />
  );
}
