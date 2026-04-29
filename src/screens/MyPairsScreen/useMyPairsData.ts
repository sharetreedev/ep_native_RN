import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { usePairs } from '../../hooks/usePairs';
import { useCachedFetch } from '../../hooks/useCachedFetch';
import { CACHE_KEYS } from '../../lib/fetchCache';

/**
 * Grouped cached pairs fetch + refresh handler for MyPairsScreen.
 */
export function useMyPairsData(_currentUserId: string | undefined) {
    const { active, invites, isLoading, fetchAll, sendCheckinReminder, removePair } = usePairs();
    const [refreshing, setRefreshing] = useState(false);

    const hasLoadedOnce = useRef(false);
    if (!isLoading) hasLoadedOnce.current = true;

    const { fetch: cachedFetchPairs, forceFetch: forceFetchPairs } = useCachedFetch(CACHE_KEYS.PAIRS, fetchAll);

    useFocusEffect(
        useCallback(() => {
            cachedFetchPairs();
        }, [cachedFetchPairs])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await forceFetchPairs();
        setRefreshing(false);
    }, [forceFetchPairs]);

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
