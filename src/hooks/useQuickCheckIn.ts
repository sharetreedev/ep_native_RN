import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { useCheckIn } from '../contexts/CheckInContext';
import { useMHFR } from '../contexts/MHFRContext';
import { useCheckIns } from './useCheckIns';
import { useStateCoordinates } from './useStateCoordinates';
import { useEmotionStates, MappedEmotion } from './useEmotionStates';
import { supportRequests } from '../api';
import { reportError } from '../lib/logger';
import { trackSupportRequestCreated } from '../lib/analyticsEvents';

interface PendingCheckIn {
  emotion: MappedEmotion;
  coordinateId: number;
}

export interface QuickCheckInSupportParams {
  supportRequestId: number;
  coordinateId: number;
  emotionName: string;
}

export interface UseQuickCheckInOptions {
  /**
   * Called when a check-in lands in a `needs_attention` coordinate AND the
   * user does not already have an OPEN support request. The hook has already
   * created the new support request — the screen just needs to navigate
   * (typically to `CheckinSupportRequest`). When the user already has an
   * OPEN support request the new check-in is linked server-side and this
   * callback is NOT fired — the modal just closes.
   */
  onSupportRequestNeeded?: (params: QuickCheckInSupportParams) => void;
}

/**
 * Reusable hook for quick check-in from any PulseGrid overlay.
 * Resolves an 8×8 grid (row, col) to a coordinate + emotion,
 * shows a pending state for the confirmation modal, and handles submission.
 *
 * Default behaviour: closes the modal silently and fires the check-in in the
 * background — no screen navigation. Quick check-ins are secondary actions
 * from within Pairs/Groups/Profile views, so we leave the user where they are
 * rather than pulling them into DailyInsight.
 */
export function useQuickCheckIn(options?: UseQuickCheckInOptions) {
  const { user, refreshUser, _setUser } = useAuth();
  const { coordinates } = useStateCoordinates();
  const { emotionStates } = useEmotionStates();
  const { createCheckIn } = useCheckIns();
  const { markCheckedInToday } = useCheckIn();
  const { hasOpenOwnRequest, refreshOwnSupportRequests } = useMHFR();

  const [pendingCheckIn, setPendingCheckIn] = useState<PendingCheckIn | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCellPress = useCallback((row: number, col: number) => {
    const yAxis = row <= 3 ? 4 - row : 3 - row;
    const xAxis = col <= 3 ? col - 4 : col - 3;

    const coord = coordinates.find(c => c.xAxis === xAxis && c.yAxis === yAxis);
    if (!coord) return;

    const emotion = emotionStates.find(e => e.xanoId === coord.emotion_states_id);
    if (!emotion) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPendingCheckIn({ emotion, coordinateId: coord.id });
  }, [coordinates, emotionStates]);

  const confirmCheckIn = useCallback(async () => {
    if (!pendingCheckIn || isSubmitting) return;
    const { emotion, coordinateId } = pendingCheckIn;

    const coord = coordinates.find(c => c.id === coordinateId);
    const needsAttention = !!coord?.needs_attention;
    const shouldTriggerSupportFlow = needsAttention && !hasOpenOwnRequest;

    // Fast path: not a support-triggering check-in. Close the modal, update
    // local state, fire the check-in in the background.
    if (!shouldTriggerSupportFlow) {
      setPendingCheckIn(null);
      markCheckedInToday();
      _setUser((prev) => prev ? { ...prev, recentStateCoordinates: coordinateId } : prev);
      createCheckIn(emotion, coordinateId, 'grid')
        .then(() => refreshUser())
        .catch(() => {});
      return;
    }

    // Support-flow path: need to await the check-in id so we can create the
    // support request and hand its id to the support screen. Keep the modal
    // visible (isSubmitting) so the user gets feedback during the round-trip.
    setIsSubmitting(true);
    try {
      const checkinId = await createCheckIn(emotion, coordinateId, 'grid');
      markCheckedInToday();
      _setUser((prev) => prev ? { ...prev, recentStateCoordinates: coordinateId } : prev);
      refreshUser().catch(() => {});

      if (!checkinId) {
        setPendingCheckIn(null);
        setIsSubmitting(false);
        return;
      }

      // Re-check open SR status against the server in case the cached
      // hasOpenOwnRequest is stale (e.g. one was opened from another device
      // since the screen mounted). If one is now OPEN, skip creating a new
      // one — the new check-in links to it server-side.
      try {
        const existing = await supportRequests.getAll();
        if (existing.some((r) => r.status === 'OPEN')) {
          refreshOwnSupportRequests().catch(() => {});
          setPendingCheckIn(null);
          setIsSubmitting(false);
          return;
        }
      } catch (e: unknown) {
        // If the lookup fails, fall through and create the SR — a duplicate
        // SR is recoverable, blocking support for someone who needs it is not.
        reportError('useQuickCheckIn.checkExistingSupportRequest', e);
      }

      const sr = await supportRequests.create(Number(user?.id ?? 0), Number(checkinId));
      trackSupportRequestCreated({ support_request_id: sr.id });
      refreshOwnSupportRequests().catch(() => {});
      const displayName = emotion.name.charAt(0).toUpperCase() + emotion.name.slice(1).toLowerCase();
      setPendingCheckIn(null);
      setIsSubmitting(false);
      options?.onSupportRequestNeeded?.({
        supportRequestId: sr.id,
        coordinateId,
        emotionName: displayName,
      });
    } catch (e: unknown) {
      reportError('useQuickCheckIn.confirm', e);
      setPendingCheckIn(null);
      setIsSubmitting(false);
    }
  }, [pendingCheckIn, isSubmitting, coordinates, hasOpenOwnRequest, createCheckIn, markCheckedInToday, _setUser, refreshUser, refreshOwnSupportRequests, user?.id, options]);

  const cancelCheckIn = useCallback(() => {
    if (isSubmitting) return;
    setPendingCheckIn(null);
  }, [isSubmitting]);

  return {
    pendingCheckIn,
    isSubmitting,
    handleCellPress,
    confirmCheckIn,
    cancelCheckIn,
  };
}
