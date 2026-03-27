import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts, fontSizes } from '../../theme';
import { checkIns } from '../../api';
import PulseGrid from '../../components/visualization/PulseGrid';
import CoordinatesGrid from '../../components/visualization/CoordinatesGrid';
import { useStateCoordinates } from '../../hooks/useStateCoordinates';
import { useCachedFetch } from '../../hooks/useCachedFetch';
import { CACHE_KEYS } from '../../lib/fetchCache';
import PulseLoader from '../../components/PulseLoader';

export default function GlobalPulseScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [globalData, setGlobalData] = useState<Record<number, number>>({});
    const hasLoadedOnce = useRef(false);
    const { coordinates } = useStateCoordinates();

    const fetchData = useCallback(async () => {
        try {
            const data = await checkIns.getGlobalPulse();
            const countMap: Record<number, number> = {};
            data.forEach((item: any) => {
                countMap[item.stateCoordinates] = item.count;
            });
            setGlobalData(countMap);
            hasLoadedOnce.current = true;
        } catch (error) {
            console.error('[GlobalPulse] Failed to fetch:', error);
        }
    }, []);

    const { fetch: cachedFetchGlobal, forceFetch: forceFetchGlobal } = useCachedFetch(CACHE_KEYS.GLOBAL_PULSE, fetchData);

    useFocusEffect(
        useCallback(() => {
            cachedFetchGlobal();
        }, [cachedFetchGlobal])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await forceFetchGlobal();
        setRefreshing(false);
    }, [forceFetchGlobal]);

    // Build density points from state coordinates + global pulse counts
    const densityData = useMemo(() => {
        if (coordinates.length === 0) return [];
        const counts = coordinates.map(c => globalData[c.id] ?? 0);
        const maxCount = Math.max(...counts, 1);
        return coordinates
            .filter(c => c.xAxis != null && c.yAxis != null)
            .map(c => ({
                row: c.yAxis! + 4,
                col: c.xAxis! + 4,
                intensity: (globalData[c.id] ?? 0) / maxCount,
                count: globalData[c.id] ?? 0,
            }))
            .filter(p => p.intensity > 0);
    }, [coordinates, globalData]);

    if (!hasLoadedOnce.current) return <PulseLoader delay={150} />;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>Global Pulse</Text>
                </View>

                {/* Spacer to match GroupsScreen subHeader height */}
                <View style={styles.subHeaderSpacer} />

                <View style={styles.gridWrap}>
                    <PulseGrid mode="global" isInteractive={false}>
                        <View style={StyleSheet.absoluteFill}>
                            <CoordinatesGrid
                                visualizationMode="group"
                                densityData={densityData}
                            />
                        </View>
                    </PulseGrid>
                </View>

                {/* Spacer to match swipeHint on other screens */}
                <View style={styles.swipeHintSpacer} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    page: {
        flex: 1,
        paddingHorizontal: 16,
        paddingBottom: 32,
    },
    header: {
        paddingVertical: 16,
        paddingHorizontal: 8,
    },
    title: {
        fontSize: fontSizes['3xl'],
        fontFamily: fonts.heading,
        color: colors.textPrimary,
    },
    subHeaderSpacer: { height: 56 },
    gridWrap: {
        flex: 1,
        justifyContent: 'center',
    },
    swipeHintSpacer: { height: 46 },
});
