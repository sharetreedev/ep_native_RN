import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { MeshGradientSlider } from '../../components/checkin';
import { CheckInTouchGrid } from '../../components/checkin/CheckInOverlay';
import PulseGrid from '../../components/visualization/PulseGrid';
import { RootStackParamList } from '../../types/navigation';
import { useSafeEdges } from '../../contexts/MHFRContext';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';
import { useCheckIns } from '../../hooks/useCheckIns';
import { useEmotionStates, MappedEmotion } from '../../hooks/useEmotionStates';
import { useScreenAnnouncement } from '../../hooks/useScreenAnnouncement';
import { useStateCoordinates } from '../../hooks/useStateCoordinates';
import { useAuth } from '../../contexts/AuthContext';
import { useCheckIn } from '../../contexts/CheckInContext';
import { supportRequests } from '../../api';
import PulseLoader from '../../components/PulseLoader';
import { reportError } from '../../lib/logger';
import { invalidate, CACHE_KEYS } from '../../lib/fetchCache';

type Props = NativeStackScreenProps<RootStackParamList, 'CheckIn'>;

export default function CheckInScreen({ route, navigation }: Props) {
    const isSupportRequest = route.params?.isSupportRequest ?? false;
    useScreenAnnouncement(isSupportRequest ? 'Support check in' : 'Check in');
    const { user, refreshUser, _setUser } = useAuth();
    const { markCheckedInToday, hasCheckedInToday } = useCheckIn();
    const { emotionStates } = useEmotionStates();
    const { coordinates } = useStateCoordinates();
    const [viewMode, setViewMode] = useState<'slider' | 'grid'>(user?.preferredCheckinView === 'grid' ? 'grid' : 'slider');
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Synchronous guard against rapid double-taps. `isSubmitting` state only
    // blocks touches after the next render — a fast second tap can land in
    // the same frame. The ref is set synchronously and caught at the top of
    // `handleComplete`, so the second call is dropped before any network
    // call fires.
    const inFlightRef = useRef(false);
    const safeEdges = useSafeEdges(['top']);
    const { createCheckIn } = useCheckIns();

    const handleComplete = useCallback(
        async (emotion: MappedEmotion, coordinateId: number, needsAttention?: boolean) => {
            if (inFlightRef.current) return;
            inFlightRef.current = true;
            setIsSubmitting(true);

            // Phase 1 — actually log the check-in. If this fails, nothing has
            // been persisted and we must tell the user clearly.
            let checkinId: string | null;
            try {
                checkinId = await createCheckIn(
                    emotion,
                    coordinateId,
                    viewMode,
                );
            } catch (e: unknown) {
                reportError('CheckIn.create', e);
                setIsSubmitting(false);
                Alert.alert(
                    'Check-in not saved',
                    'We couldn\'t save your check-in — this can happen on a bad connection. Please try again.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }],
                    { cancelable: false },
                );
                return;
            }
            if (!checkinId) {
                // Upstream guard in useCheckIns returns null for a missing
                // coordinate — treat as a failure from the user's perspective.
                setIsSubmitting(false);
                Alert.alert(
                    'Check-in not saved',
                    'Something went wrong saving your check-in. Please try again.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }],
                    { cancelable: false },
                );
                return;
            }

            // Phase 2 — the check-in is on the backend. Any failure past this
            // point is recoverable (stale UI at worst) so we don't show an
            // error — we just log it and carry on with navigation.
            markCheckedInToday();
            _setUser((prev) => prev ? { ...prev, recentStateCoordinates: coordinateId } : prev);
            refreshUser().catch((e) => reportError('CheckIn.refreshUser', e));
            // The new check-in invalidates the running-stats snapshot (current
            // emotion, direction, weekly/monthly aggregates, etc.). Mark the
            // cache key stale so the next MyPulse focus refetches fresh data
            // instead of serving up to 45s-old values.
            invalidate(CACHE_KEYS.RUNNING_STATS);

            // Optimistic timeline seed for DailyInsight. The Xano timeline
            // endpoint can lag by ~1s after a create (background task), so we
            // pass the just-completed check-in inline; DailyInsight merges it
            // into the timeline view until the server's response includes it.
            const coordinate = coordinates.find((c) => c.id === coordinateId);
            const justCheckedIn = {
                emotionName: emotion.name,
                emotionColour: emotion.emotionColour,
                coordinateId,
                intensity: coordinate?.intensityNumber,
                createdAt: new Date().toISOString(),
            };

            if (isSupportRequest) {
                navigation.replace('DailyInsight', { justCheckedIn });
                return;
            }

            if (needsAttention) {
                const displayName = emotion.name.charAt(0).toUpperCase() + emotion.name.slice(1).toLowerCase();
                try {
                    const sr = await supportRequests.create(0, Number(checkinId));
                    navigation.replace('CheckinSupportRequest', {
                        coordinateId,
                        emotionName: displayName,
                        supportRequestId: sr.id,
                    });
                } catch (e: unknown) {
                    // Support-request create failed but the check-in itself is
                    // saved. Send the user to DailyInsight so they still see
                    // their logged entry; they can open a support request
                    // manually from there.
                    reportError('CheckIn.createSupportRequest', e);
                    navigation.replace('DailyInsight', { justCheckedIn });
                }
            } else if (hasCheckedInToday) {
                navigation.navigate('Main' as any);
            } else {
                navigation.replace('DailyInsight', { justCheckedIn });
            }
        },
        [navigation, createCheckIn, refreshUser, _setUser, markCheckedInToday, hasCheckedInToday, isSupportRequest, viewMode, coordinates]
    );

    return (
        <SafeAreaView style={styles.container} edges={safeEdges}>
            {/* Tabs */}
            <View style={styles.tabContainer}>
                {hasCheckedInToday && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        accessibilityRole="button"
                        accessibilityLabel="Back"
                    >
                        <ArrowLeft size={22} color={colors.textPrimary} />
                    </TouchableOpacity>
                )}
                <View style={styles.tabBar} accessibilityRole="tablist">
                    <TouchableOpacity
                        onPress={() => setViewMode('slider')}
                        style={[styles.tab, viewMode === 'slider' && styles.activeTab]}
                        accessibilityRole="tab"
                        accessibilityLabel="Slider view"
                        accessibilityState={{ selected: viewMode === 'slider' }}
                    >
                        <Text style={[styles.tabText, viewMode === 'slider' && styles.activeTabText]}>
                            Slider
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setViewMode('grid')}
                        style={[styles.tab, viewMode === 'grid' && styles.activeTab]}
                        accessibilityRole="tab"
                        accessibilityLabel="Grid view"
                        accessibilityState={{ selected: viewMode === 'grid' }}
                    >
                        <Text style={[styles.tabText, viewMode === 'grid' && styles.activeTabText]}>
                            Grid
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {viewMode === 'grid' ? (
                <View style={styles.gridContainer}>
                    <Text style={styles.title}>How are you feeling?</Text>
                    <View style={styles.gridWrapper}>
                        <PulseGrid mode="checkin" isInteractive={false}>
                            <CheckInTouchGrid
                                coordinates={coordinates}
                                emotions={emotionStates}
                                selectedId={null}
                                onSelect={(cell) => handleComplete(
                                    cell.emotion,
                                    cell.coordinate.id,
                                    !!cell.coordinate.needs_attention,
                                )}
                            />
                        </PulseGrid>
                    </View>
                </View>
            ) : (
                <View style={styles.viewContainer}>
                    <MeshGradientSlider
                        emotions={emotionStates}
                        coordinates={coordinates}
                        onComplete={handleComplete}
                    />
                </View>
            )}

            {isSubmitting && (
                <View style={styles.loadingOverlay}>
                    <PulseLoader style={{ flex: 0, backgroundColor: 'transparent' }} size={60} />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    tabContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        marginBottom: 16,
        zIndex: 2,
    },
    backButton: {
        position: 'absolute',
        left: spacing.base,
        padding: 8,
        zIndex: 1,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: colors.border,
        padding: 4,
        borderRadius: borderRadius.full,
    },
    tab: {
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: borderRadius.full,
    },
    activeTab: {
        backgroundColor: colors.surface,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontWeight: '600',
        fontFamily: fonts.bodySemiBold,
        color: colors.textMuted,
    },
    activeTabText: {
        color: colors.textPrimary,
    },
    title: {
        fontFamily: fonts.heading,
        fontSize: fontSizes['2xl'],
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: spacing['2xl'],
    },
    gridContainer: {
        flex: 1,
        marginTop: -80,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    gridWrapper: {
        paddingHorizontal: spacing.lg,
    },
    viewContainer: {
        flex: 1,
        overflow: 'hidden',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
