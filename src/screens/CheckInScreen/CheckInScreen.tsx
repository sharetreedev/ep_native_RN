import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { MeshGradientSlider } from '../../components/checkin';
import { CheckInTouchGrid, CheckInConfirmModal } from '../../components/checkin/CheckInOverlay';
import PulseGrid from '../../components/visualization/PulseGrid';
import { RootStackParamList } from '../../types/navigation';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';
import { useCheckIns } from '../../hooks/useCheckIns';
import { useEmotionStates, MappedEmotion } from '../../hooks/useEmotionStates';
import { useStateCoordinates } from '../../hooks/useStateCoordinates';
import { useAuth } from '../../contexts/AuthContext';
import { useCheckIn } from '../../contexts/CheckInContext';
import { supportRequests } from '../../api';
import PulseLoader from '../../components/PulseLoader';

type Props = NativeStackScreenProps<RootStackParamList, 'CheckIn'>;

export default function CheckInScreen({ route, navigation }: Props) {
    const isSupportRequest = route.params?.isSupportRequest ?? false;
    const supportRequestId = route.params?.supportRequestId;
    const { refreshUser } = useAuth();
    const { markCheckedInToday, hasCheckedInToday } = useCheckIn();
    const { emotionStates } = useEmotionStates();
    const { coordinates } = useStateCoordinates();
    const [viewMode, setViewMode] = useState<'slider' | 'grid'>('slider');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCoord, setSelectedCoord] = useState<{ emotion: MappedEmotion; coordinateId: number; needsAttention: boolean } | null>(null);
    const { createCheckIn } = useCheckIns(undefined, emotionStates);

    const handleComplete = useCallback(
        async (emotion: MappedEmotion, coordinateId: number, needsAttention?: boolean) => {
            setIsSubmitting(true);
            try {
                const checkinId = await createCheckIn(
                    emotion,
                    coordinateId,
                    isSupportRequest ? supportRequestId : undefined,
                );
                markCheckedInToday();
                await refreshUser();

                if (isSupportRequest) {
                    // Re-checkin from support request flow — return to daily insight
                    navigation.replace('DailyInsight');
                    return;
                }

                if (needsAttention) {
                    const displayName = emotion.name.charAt(0).toUpperCase() + emotion.name.slice(1).toLowerCase();
                    // Create a support request linked to this check-in
                    const sr = await supportRequests.create(0, Number(checkinId));
                    navigation.replace('CheckinSupportRequest', {
                        coordinateId,
                        emotionName: displayName,
                        supportRequestId: sr.id,
                    });
                } else {
                    navigation.replace('DailyInsight');
                }
            } catch {
                // Non-fatal: optimistically navigate even if save fails
                navigation.replace('DailyInsight');
            }
        },
        [navigation, createCheckIn, refreshUser, markCheckedInToday, isSupportRequest, supportRequestId]
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Tabs */}
            <View style={styles.tabContainer}>
                {hasCheckedInToday && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <ArrowLeft size={22} color={colors.textPrimary} />
                    </TouchableOpacity>
                )}
                <View style={styles.tabBar}>
                    <TouchableOpacity
                        onPress={() => setViewMode('slider')}
                        style={[styles.tab, viewMode === 'slider' && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, viewMode === 'slider' && styles.activeTabText]}>
                            Slider
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setViewMode('grid')}
                        style={[styles.tab, viewMode === 'grid' && styles.activeTab]}
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
                                selectedId={selectedCoord?.coordinateId ?? null}
                                onSelect={(cell) => setSelectedCoord({
                                    emotion: cell.emotion,
                                    coordinateId: cell.coordinate.id,
                                    needsAttention: !!cell.coordinate.needs_attention,
                                })}
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

            {selectedCoord && (
                <CheckInConfirmModal
                    emotion={selectedCoord.emotion}
                    onConfirm={() => {
                        const { emotion, coordinateId, needsAttention } = selectedCoord;
                        setSelectedCoord(null);
                        handleComplete(emotion, coordinateId, needsAttention);
                    }}
                    onCancel={() => setSelectedCoord(null)}
                />
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
