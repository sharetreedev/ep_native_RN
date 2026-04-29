/**
 * Pure derivation: given a user with `pairs[]`, return the subset that
 * either need attention (recent check-in flagged `needs_attention`) or
 * are inactive (no check-in within the last 7 days). Used by both v1's
 * suggested-check-in avatar row and v2's "Things to do" hook so the
 * underlying logic stays in one place.
 */
export type SuggestedPairReason = 'needs_attention' | 'inactive';

export type SuggestedPair = {
  pair: any;
  reason: SuggestedPairReason;
  emotionColour?: string;
};

export function getSuggestedPairs(
  user: { pairs?: any[] } | null | undefined,
): SuggestedPair[] {
  if (!user?.pairs?.length) return [];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return user.pairs.reduce<SuggestedPair[]>((acc, pair: any) => {
    const pairUser = pair._pair_user || pair._user || pair.other_user;
    if (!pairUser) return acc;

    const needsAttention =
      pairUser._recent_coordinate?.needs_attention ||
      pairUser.recentCoordinate?.needs_attention;
    if (needsAttention) {
      const colour =
        pairUser._recent_emotion?.emotionColour ||
        pairUser.recentEmotion?.emotionColour ||
        pairUser._emotion_states?.emotionColour;
      acc.push({ pair, reason: 'needs_attention', emotionColour: colour });
      return acc;
    }

    const lastCheckin = pairUser.lastCheckInDate;
    if (!lastCheckin) {
      acc.push({ pair, reason: 'inactive' });
      return acc;
    }
    const lastDate = new Date(
      typeof lastCheckin === 'number' ? lastCheckin : lastCheckin,
    );
    if (lastDate < sevenDaysAgo) {
      acc.push({ pair, reason: 'inactive' });
    }
    return acc;
  }, []);
}
