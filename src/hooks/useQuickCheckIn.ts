import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { useCheckIn } from '../contexts/CheckInContext';
import { useCheckIns } from './useCheckIns';
import { useStateCoordinates } from './useStateCoordinates';
import { useEmotionStates, MappedEmotion } from './useEmotionStates';

interface PendingCheckIn {
  emotion: MappedEmotion;
  coordinateId: number;
}

/**
 * Reusable hook for quick check-in from any PulseGrid overlay.
 * Resolves an 8×8 grid (row, col) to a coordinate + emotion,
 * shows a pending state for the confirmation modal, and handles submission.
 */
export function useQuickCheckIn(onComplete?: () => void) {
  const { user, refreshUser, _setUser } = useAuth();
  const { coordinates } = useStateCoordinates();
  const { emotionStates } = useEmotionStates();
  const { createCheckIn } = useCheckIns(user?.id, emotionStates);
  const { markCheckedInToday } = useCheckIn();

  const [pendingCheckIn, setPendingCheckIn] = useState<PendingCheckIn | null>(null);

  /** Called when an empty cell is tapped on the 8×8 grid overlay */
  const handleCellPress = useCallback((row: number, col: number) => {
    // Invert the mapping formula to get axis values
    // row 0-3 → yAxis 4,3,2,1 | row 4-7 → yAxis -1,-2,-3,-4
    const yAxis = row <= 3 ? 4 - row : 3 - row;
    // col 0-3 → xAxis -4,-3,-2,-1 | col 4-7 → xAxis 1,2,3,4
    const xAxis = col <= 3 ? col - 4 : col - 3;

    const coord = coordinates.find(c => c.xAxis === xAxis && c.yAxis === yAxis);
    if (!coord) return;

    const emotion = emotionStates.find(e => e.xanoId === coord.emotion_states_id);
    if (!emotion) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPendingCheckIn({ emotion, coordinateId: coord.id });
  }, [coordinates, emotionStates]);

  /** Called when the user confirms the check-in */
  const confirmCheckIn = useCallback(() => {
    if (!pendingCheckIn) return;
    const { emotion, coordinateId } = pendingCheckIn;
    setPendingCheckIn(null);

    // Update local state immediately so the UI reflects the check-in
    markCheckedInToday();
    _setUser((prev) => prev ? { ...prev, recentStateCoordinates: coordinateId } : prev);

    // Navigate straight away — DailyInsight has its own loader
    onComplete?.();

    // Fire API calls in the background
    // Quick check-ins are always initiated by tapping a PulseGrid cell
    createCheckIn(emotion, coordinateId, undefined, 'grid')
      .then(() => refreshUser())
      .catch(() => {});
  }, [pendingCheckIn, createCheckIn, markCheckedInToday, _setUser, refreshUser, onComplete]);

  /** Called when the user cancels */
  const cancelCheckIn = useCallback(() => {
    setPendingCheckIn(null);
  }, []);

  return {
    pendingCheckIn,
    handleCellPress,
    confirmCheckIn,
    cancelCheckIn,
  };
}
