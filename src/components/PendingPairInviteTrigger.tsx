import { useEffect, useRef, RefObject } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../lib/logger';

interface PendingPairInviteTriggerProps {
  /** Reset trigger state when this changes (typically user.id). Mirrors the
   *  PendingGroupInviteSheet sessionKey contract. */
  sessionKey?: string;
  /** Shared navigation container ref from AppNavigator. We can't use
   *  `useNavigation` here because the trigger renders as a sibling of
   *  `Stack.Navigator` — at first effect run the navigator hasn't mounted
   *  yet, and `navigation.navigate` throws "The 'navigation' object hasn't
   *  been initialized yet". The shared ref lets us wait for `isReady()`. */
  navRef: RefObject<NavigationContainerRef<RootStackParamList> | null>;
  /** Set true by AppNavigator's `onReady`. Used as an effect dep so the
   *  trigger re-runs once the navigator becomes usable — otherwise the
   *  first-render early-return on `!isReady()` would be the only attempt. */
  navReady: boolean;
}

/**
 * Headless orchestrator: when the user has pending **pair** invites AND no
 * pending group invites, present the PairInvite screen as a modal for the
 * first one. Pair invites only ever pop after the group invite sheet has
 * been cleared, matching the spec ("sequential popups, group first").
 *
 * Triggers at most one pair-invite modal per "burst" — i.e. after presenting
 * one, it waits for the pendingPairInvites list to shrink (the user
 * accepted/declined and AuthContext refreshed) before triggering the next.
 * This avoids stacking multiple modals on top of each other.
 */
export default function PendingPairInviteTrigger({ sessionKey, navRef, navReady }: PendingPairInviteTriggerProps) {
  const { user } = useAuth();

  // The pair id we last navigated to. Cleared once that invite leaves the
  // pendingPairInvites list (user took action and AuthContext refreshed),
  // freeing us to trigger the next.
  const inFlightRef = useRef<number | null>(null);
  // Reset on sign-in / user change.
  const sessionKeyRef = useRef(sessionKey);
  if (sessionKeyRef.current !== sessionKey) {
    sessionKeyRef.current = sessionKey;
    inFlightRef.current = null;
  }

  const pendingGroupCount = user?.pendingGroupInvites?.length ?? 0;
  const pendingPairInvites = user?.pendingPairInvites ?? [];
  const nextPair = pendingPairInvites[0];

  useEffect(() => {
    logger.log('[PendingPairInviteTrigger] state', {
      pendingGroupCount,
      pendingPairCount: pendingPairInvites.length,
      nextPairId: nextPair?.id,
      inFlight: inFlightRef.current,
    });

    // Clear the in-flight marker once the previously-shown pair invite is
    // gone from the list (handled / declined / went stale).
    if (inFlightRef.current != null) {
      const stillThere = pendingPairInvites.some((p) => p.id === inFlightRef.current);
      if (!stillThere) {
        inFlightRef.current = null;
      } else {
        // The user hasn't acted on the current modal yet — don't open another.
        return;
      }
    }

    // Spec: group invites take priority. Don't pop a pair while a group
    // invite is still waiting for the user.
    if (pendingGroupCount > 0) {
      logger.log('[PendingPairInviteTrigger] holding for group invites first');
      return;
    }
    if (!nextPair?.id) return;

    // Wait for the navigator to actually mount before trying to navigate.
    // On first render the trigger fires before NavigationContainer is ready.
    const ref = navRef.current;
    if (!ref?.isReady()) {
      logger.log('[PendingPairInviteTrigger] navigator not ready yet, deferring');
      return;
    }

    inFlightRef.current = nextPair.id;
    logger.info('[PendingPairInviteTrigger] navigating to PairInvite modal', { pairId: nextPair.id });
    // Pass the whole invite record so PairInviteScreen can render directly
    // without an API fetch — `/pairs/{id}` would reject with ERROR_FATAL
    // ("User is not Pairs with this person") for a pending invitee.
    ref.navigate('PairInvite', { invite: nextPair } as never);
  }, [pendingGroupCount, pendingPairInvites, nextPair?.id, navRef, navReady]);

  return null;
}
