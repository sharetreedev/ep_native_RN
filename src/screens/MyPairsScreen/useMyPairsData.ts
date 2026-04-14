import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { usePairs } from '../../hooks/usePairs';
import { useCheckIns } from '../../hooks/useCheckIns';
import { useCachedFetch } from '../../hooks/useCachedFetch';
import { CACHE_KEYS } from '../../lib/fetchCache';

/**
 * Groups the cached pairs + check-in fetches for MyPairsScreen.
 *
 * Consolidates what were previously four top-level hook calls + a
 * focus effect + an onRefresh handler in the screen component.
 */
export function useMyPairsData(currentUserId: string | undefined) {
    const { active, invites, isLoading, fetchAll, sendCheckinReminder, removePair } = usePairs();
    const { refetch: refetchCheckIns } = useCheckIns(currentUserId);
    const [refreshing, setRefreshing] = useState(false);

    const hasLoadedOnce = useRef(false);
    if (!isLoading) hasLoadedOnce.current = true;

    const { fetch: cachedFetchPairs, forceFetch: forceFetchPairs } = useCachedFetch(CACHE_KEYS.PAIRS, fetchAll);
    const { fetch: cachedFetchCheckIns, forceFetch: forceFetchCheckIns } = useCachedFetch(CACHE_KEYS.CHECK_INS, refetchCheckIns);

    useFocusEffect(
        useCallback(() => {
            cachedFetchPairs();
            cachedFetchCheckIns();
        }, [cachedFetchPairs, cachedFetchCheckIns])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([forceFetchPairs(), forceFetchCheckIns()]);
        setRefreshing(false);
    }, [forceFetchPairs, forceFetchCheckIns]);

    return {
        active,
        invites,
        isLoading,
        hasLoadedOnce,
        refreshing,
        onRefresh,
        sendCheckinReminder,
        removePair,
    };
}
