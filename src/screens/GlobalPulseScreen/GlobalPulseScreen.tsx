import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts, fontSizes } from '../../theme';
import { checkIns, XanoGlobalPulse } from '../../api';
import PulseGrid from '../../components/visualization/PulseGrid';
import CoordinatesGrid from '../../components/visualization/CoordinatesGrid';
import { useStateCoordinates } from '../../hooks/useStateCoordinates';
import { useCoordinateMapping } from '../../hooks/useCoordinateMapping';
import { useCachedFetch } from '../../hooks/useCachedFetch';
import { CACHE_KEYS } from '../../lib/fetchCache';
import PulseLoader from '../../components/PulseLoader';
import { logger } from '../../lib/logger';

export default function GlobalPulseScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [globalData, setGlobalData] = useState<XanoGlobalPulse[]>([]);
    const hasLoadedOnce = useRef(false);
    const { coordinates } = useStateCoordinates();

    const fetchData = useCallback(async () => {
        try {
            setGlobalData(await checkIns.getGlobalPulse());
            hasLoadedOnce.current = true;
        } catch (error) {
            logger.error('[GlobalPulse] Failed to fetch:', error);
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

    // Grid placement goes through the shared helper, same as Group/Pair/User
    // pulse. Axis values are (-4..-1, 1..4) with no zero and an inverted Y, so
    // the naive `axis + 4` offset this screen used to do both shifted every
    // positive value and pushed the x=4 / y=4 bands off the 8x8 grid, silently
    // dropping 15 of 64 coordinates from the aggregate (EP-1193).
    const { densityData } = useCoordinateMapping(coordinates, globalData);

    if (!hasLoadedOnce.current) return <PulseLoader delay={150} />;

    return (
        <View style={styles.container}>
            <View style={styles.page}>
                <View style={styles.gridWrap}>
                    <PulseGrid mode="global" isInteractive={false}>
                        <View style={StyleSheet.absoluteFill}>
                            <CoordinatesGrid
                                visualizationMode="group"
                                densityData={densityData}
                                showCountAsPercentage
                            />
                        </View>
                    </PulseGrid>
                </View>

                {/* Spacer to match swipeHint on other screens */}
                <View style={styles.swipeHintSpacer} />
            </View>
        </View>
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
