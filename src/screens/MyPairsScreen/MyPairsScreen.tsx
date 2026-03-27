import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, ScrollView, LayoutChangeEvent, RefreshControl, Modal, TouchableWithoutFeedback, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import PulseGrid from '../../components/visualization/PulseGrid';
import PairsAvatarOverlay, { OverlayUser, CoordinateUsers, StalenessLevel } from '../../components/visualization/PairsAvatarOverlay';
import EmotionBadge from '../../components/EmotionBadge';
import CheckInWithUser from '../../components/CheckInWithUser';
import { Plus, ChevronUp, X, RefreshCw, Ban, Blend } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { usePairs } from '../../hooks/usePairs';
import { useAuth } from '../../contexts/AuthContext';
import { useStateCoordinates } from '../../hooks/useStateCoordinates';
import { useCoordinateMapping } from '../../hooks/useCoordinateMapping';
import { useEmotionStates } from '../../hooks/useEmotionStates';
import { useCheckIns } from '../../hooks/useCheckIns';
import { colors, fonts, fontSizes, borderRadius } from '../../theme';
import AvatarDisplay from '../../components/AvatarDisplay';
import ProfileTabs from '../../components/ProfileTabs';
import ConfirmModal from '../../components/ConfirmModal';
import PulseLoader from '../../components/PulseLoader';
import { useCachedFetch } from '../../hooks/useCachedFetch';
import { CACHE_KEYS } from '../../lib/fetchCache';

type PairTab = 'Trusted' | "I'm Supporting" | 'Supporting Me';
const PAIR_TABS: readonly PairTab[] = ['Trusted', "I'm Supporting", 'Supporting Me'] as const;

const MAX_PAIR_SLOTS = 5;

export default function MyPairsScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [containerHeight, setContainerHeight] = useState(0);
    const { active, invites, isLoading, fetchAll, sendCheckinReminder, removePair } = usePairs();
    const { user: currentUser } = useAuth();
    const { coordinates } = useStateCoordinates();
    const { emotionStates } = useEmotionStates();
    const { lastCheckIn, refetch: refetchCheckIns } = useCheckIns(currentUser?.id);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<PairTab>('Trusted');
    const [supportSheetPair, setSupportSheetPair] = useState<any>(null);
    const [confirmStopPair, setConfirmStopPair] = useState<any>(null);
    const [stopLoading, setStopLoading] = useState(false);

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

    const handleLayout = (e: LayoutChangeEvent) => {
        setContainerHeight(e.nativeEvent.layout.height);
    };

    // Build grid overlay data from active pairs
    // The API may include expanded user/emotion data; map by last check-in state
    const pairsGridData: Record<string, { users: { id: string }[] }> = {};
    active.forEach((pair: any) => {
        const emotionKey = pair._last_emotion_key || pair.lastEmotionKey;
        if (emotionKey) {
            if (!pairsGridData[emotionKey]) pairsGridData[emotionKey] = { users: [] };
            pairsGridData[emotionKey].users.push({ id: String(pair.id) });
        }
    });

    const { coordMap } = useCoordinateMapping(coordinates);

    // Build avatar overlay data at coordinate level
    const avatarPoints = useMemo(() => {
        const cellMap: Record<string, OverlayUser[]> = {};
        const now = Date.now();

        const addUser = (coordId: number | undefined, user: OverlayUser) => {
            if (!coordId) return;
            const pos = coordMap.get(coordId);
            if (!pos) return;
            const key = `${pos.row}-${pos.col}`;
            if (!cellMap[key]) cellMap[key] = [];
            cellMap[key].push(user);
        };

        const getStaleness = (lastCheckInDate: string | number | null | undefined): StalenessLevel => {
            if (!lastCheckInDate) return 'stale48';
            const checkInTime = new Date(lastCheckInDate).getTime();
            const hoursAgo = (now - checkInTime) / (1000 * 60 * 60);
            if (hoursAgo > 48) return 'stale48';
            if (hoursAgo > 24) return 'stale24';
            return 'fresh';
        };

        // Add each pair at their last coordinate
        active.forEach((pair: any) => {
            const otherUser = pair.other_user;
            if (!otherUser) return;
            // recentStateCoordinates may be numeric id, string id, or object with id
            const rawCoord = otherUser.recentStateCoordinates;
            const coordId = Number(typeof rawCoord === 'object' && rawCoord !== null ? rawCoord.id : rawCoord);
            if (!coordId || isNaN(coordId)) return;
            const currentId = Number(currentUser?.id);
            const otherUserId = otherUser.id
                ?? (pair.pairUserIDs || []).find((uid: number) => uid !== currentId)
                ?? pair.id;
            addUser(coordId, {
                id: `pair-${pair.id}`,
                userId: String(otherUserId),
                pairsId: pair.id,
                name: otherUser.fullName || otherUser.full_name || otherUser.firstName || otherUser.first_name || 'Pair',
                avatarUrl: otherUser.profilePic_url || otherUser.avatar?.url || null,
                staleness: getStaleness(otherUser.lastCheckInDate || otherUser.last_check_in_date),
            });
        });

        // Add current user at their last check-in coordinate
        if (lastCheckIn?.coordinateId && currentUser) {
            addUser(lastCheckIn.coordinateId, {
                id: `self-${currentUser.id}`,
                userId: currentUser.id,
                name: currentUser.name,
                avatarUrl: currentUser.avatarUrl || null,
                isCurrentUser: true,
            });
        }

        // Convert to CoordinateUsers[]
        const points: CoordinateUsers[] = [];
        for (const [key, users] of Object.entries(cellMap)) {
            const [row, col] = key.split('-').map(Number);
            points.push({ row, col, users });
        }

        // Debug: log overlay grouping
        if (__DEV__) {
            console.log('[PairsOverlay] coordMap size:', coordMap.size,
                'active pairs:', active.length,
                'points:', points.map(p => `(${p.row},${p.col}): ${p.users.length} users [${p.users.map(u => u.id).join(',')}]`));
        }

        return points;
    }, [active, coordMap, lastCheckIn, currentUser]);

    const currentId = Number(currentUser?.id);
    const trustedPairs = useMemo(() => active.filter((p: any) => p.pairType === 'DUAL' || !p.pairType), [active]);
    const imSupportingPairs = useMemo(() => active.filter((p: any) => p.pairType === 'PULL' && p.requestFromId === currentId), [active, currentId]);
    const supportingMePairs = useMemo(() => active.filter((p: any) => p.pairType === 'PULL' && p.requestToId === currentId), [active, currentId]);

    const handleStopSharingPress = useCallback((pair: any) => {
        setSupportSheetPair(null);
        setConfirmStopPair(pair);
    }, []);

    const handleStopSharingConfirm = useCallback(async () => {
        if (!confirmStopPair) return;
        setStopLoading(true);
        try {
            await removePair(confirmStopPair.id);
            setConfirmStopPair(null);
        } finally {
            setStopLoading(false);
        }
    }, [confirmStopPair, removePair]);

    const handleOverlayUserPress = useCallback((user: OverlayUser) => {
        if (user.isCurrentUser) {
            navigation.navigate('UserProfile', { userId: 'current-user', isNotPair: true });
        } else {
            navigation.navigate('UserProfile', { userId: user.userId, pairsId: user.pairsId });
        }
    }, [navigation]);

    // Resolve 8x8 grid position → emotion info (each emotion covers a 2x2 block)
    const getEmotionInfo = useCallback((row: number, col: number) => {
        const emotionRow = Math.floor(row / 2);
        const emotionCol = Math.floor(col / 2);
        const emotion = emotionStates.find(e => e.row === emotionRow && e.col === emotionCol);
        if (!emotion) return undefined;
        return { name: emotion.name, colour: emotion.emotionColour };
    }, [emotionStates]);

    const renderItem = ({ item }: { item: string }) => {
        if (containerHeight === 0) return null;

        if (item === 'grid') {
            return (
                <View style={[styles.page, { height: containerHeight }]}>
                    <View style={styles.pageHeader}>
                        <Text style={styles.title}>My Pairs</Text>
                        <TouchableOpacity
                            style={styles.inviteButton}
                            onPress={() => navigation.navigate('InvitePairIntro')}
                        >
                            <Plus color={colors.textSecondary} size={18} strokeWidth={2.5} />
                            <Text style={styles.inviteText}>Invite</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Spacer to match GroupsScreen subHeader height */}
                    <View style={styles.subHeaderSpacer} />

                    <View style={styles.gridContainer}>
                        {!hasLoadedOnce.current && active.length === 0 ? (
                            <PulseLoader delay={150} />
                        ) : (
                            <PulseGrid
                                mode="pairs"
                                data={pairsGridData}
                                onEmotionLongPress={(emotion) => navigation.navigate('EmotionDetail', { emotion })}
                            >
                                <PairsAvatarOverlay
                                    points={avatarPoints}
                                    onUserPress={handleOverlayUserPress}
                                    getEmotionInfo={getEmotionInfo}
                                />
                            </PulseGrid>
                        )}
                    </View>

                    <TouchableOpacity style={styles.swipeHint}>
                        <Text style={styles.swipeHintText}>Swipe up for List</Text>
                        <ChevronUp color={colors.textMuted} size={24} />
                    </TouchableOpacity>
                </View>
            );
        } else {
            const displayedPairs = activeTab === 'Trusted' ? trustedPairs
                : activeTab === "I'm Supporting" ? imSupportingPairs
                : supportingMePairs;
            const filledSlots = trustedPairs.length;
            const emptySlotsCount = activeTab === 'Trusted' ? Math.max(0, MAX_PAIR_SLOTS - filledSlots) : 0;
            const emptySlots = Array(emptySlotsCount).fill(null);

            return (
                <View style={[styles.page, styles.listPage, { height: containerHeight }]}>
                    <TouchableOpacity style={styles.swipeHint}>
                        <ChevronUp color={colors.textMuted} size={24} style={{ transform: [{ rotate: '180deg' }] }} />
                    </TouchableOpacity>

                    <View style={styles.listHeader}>
                        <Text style={styles.listTitle}>All Pairs</Text>
                        <TouchableOpacity style={styles.createRow} onPress={() => navigation.navigate('InvitePairIntro')}>
                            <Plus color={colors.textSecondary} size={18} strokeWidth={2.5} />
                            <Text style={styles.createTextBold}>Invite</Text>
                        </TouchableOpacity>
                    </View>

                    <ProfileTabs<PairTab>
                        tabs={PAIR_TABS}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        containerStyle={{ paddingHorizontal: 8, marginTop: 12 }}
                        tabStyle={{ marginRight: 16 }}
                    />

                    <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                        {displayedPairs.length === 0 && !isLoading && (
                            <Text style={styles.emptyText}>
                                {activeTab === 'Trusted' ? 'No trusted pairs yet'
                                    : activeTab === "I'm Supporting" ? "You're not supporting anyone yet"
                                    : 'No one is supporting you yet'}
                            </Text>
                        )}
                        {displayedPairs.map((pair: any, index: number) => {
                            const otherUser = pair.other_user;
                            const firstName = otherUser?.firstName || otherUser?.first_name || '';
                            const lastName = otherUser?.lastName || otherUser?.last_name || '';
                            const name = otherUser?.fullName || otherUser?.full_name || [firstName, lastName].filter(Boolean).join(' ') || pair.invite_email || `Pair #${pair.id}`;
                            const avatarUrl = otherUser?.profilePic_url || null;
                            const otherUserId = otherUser?.id
                                ?? (pair.pairUserIDs || []).find((uid: number) => uid !== currentId)
                                ?? pair.id;
                            const initial = name.charAt(0).toUpperCase();
                            const isTrusted = pair.pairType === 'DUAL' || !pair.pairType;
                            const isImSupporting = activeTab === "I'm Supporting";
                            const isSupportingMe = activeTab === 'Supporting Me';
                            const pairTypeLabel = isTrusted ? 'Trusted Pair' : 'Support Pair';
                            const isLast = index === displayedPairs.length - 1 && emptySlotsCount === 0;

                            if (isSupportingMe) {
                                // Support pair: simple row, tap opens sheet
                                return (
                                    <TouchableOpacity
                                        key={pair.id}
                                        style={[styles.listItem, !isLast && styles.listItemBorder]}
                                        onPress={() => setSupportSheetPair(pair)}
                                    >
                                        <View style={styles.listItemLeft}>
                                            <AvatarDisplay
                                                imageUrl={avatarUrl}
                                                fallbackText={initial}
                                                size={40}
                                                borderRadius={12}
                                                style={{ marginRight: 12 }}
                                            />
                                            <View>
                                                <Text style={styles.listItemName}>{name}</Text>
                                                <Text style={styles.listItemMeta}>{pairTypeLabel}</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            }

                            // Trusted pair: full details
                            const lastCheckInDate = otherUser?.lastCheckInDate;
                            const daysSinceCheckIn = lastCheckInDate
                                ? Math.floor((Date.now() - new Date(lastCheckInDate).getTime()) / (1000 * 60 * 60 * 24))
                                : null;
                            const hasRecentCheckIn = daysSinceCheckIn !== null && daysSinceCheckIn <= 7;
                            const lastEmotion = otherUser?.recent_checkin_emotion
                                || (otherUser?.Display ? { Display: otherUser.Display, emotionColour: otherUser.emotionColour } : null);

                            let lastCheckInLabel = '';
                            if (lastCheckInDate) {
                                const msAgo = Date.now() - new Date(lastCheckInDate).getTime();
                                const minsAgo = Math.floor(msAgo / (1000 * 60));
                                const hoursAgo = Math.floor(msAgo / (1000 * 60 * 60));
                                const daysAgo = Math.floor(msAgo / (1000 * 60 * 60 * 24));
                                if (minsAgo < 1) lastCheckInLabel = 'Just now';
                                else if (minsAgo < 60) lastCheckInLabel = `${minsAgo}m ago`;
                                else if (hoursAgo < 24) lastCheckInLabel = `${hoursAgo}h ago`;
                                else if (daysAgo === 1) lastCheckInLabel = '1 day ago';
                                else lastCheckInLabel = `${daysAgo} days ago`;
                            }

                            const metaText = lastCheckInLabel
                                ? `${pairTypeLabel} · ${lastCheckInLabel}`
                                : pairTypeLabel;

                            return (
                                <TouchableOpacity
                                    key={pair.id}
                                    style={[styles.listItem, !isLast && styles.listItemBorder]}
                                    onPress={() => navigation.navigate('UserProfile', { userId: String(otherUserId), pairsId: pair.id })}
                                >
                                    <View style={styles.listItemLeft}>
                                        <AvatarDisplay
                                            imageUrl={avatarUrl}
                                            fallbackText={initial}
                                            size={40}
                                            borderRadius={12}
                                            style={{ marginRight: 12 }}
                                        />
                                        <View>
                                            <Text style={styles.listItemName}>{name}</Text>
                                            <Text style={styles.listItemMeta}>{metaText}</Text>
                                        </View>
                                    </View>
                                    {hasRecentCheckIn && lastEmotion ? (
                                        <View style={styles.badgeWrap}>
                                            <EmotionBadge
                                                emotionName={lastEmotion.Display}
                                                emotionColour={lastEmotion.emotionColour}
                                                size="small"
                                            />
                                        </View>
                                    ) : (
                                        <CheckInWithUser
                                            firstName={firstName || name.split(' ')[0]}
                                            fullName={name}
                                            currentUserFirstName={currentUser?.firstName || currentUser?.name?.split(' ')[0]}
                                            pairsUserId={otherUserId}
                                            onSendReminder={sendCheckinReminder}
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        })}

                        {emptySlots.map((_, index) => {
                            const isLast = index === emptySlotsCount - 1;
                            return (
                                <TouchableOpacity
                                    key={`empty-${index}`}
                                    style={[styles.listItem, !isLast && styles.listItemBorder]}
                                    onPress={() => navigation.navigate('InvitePairIntro')}
                                >
                                    <View style={styles.listItemLeft}>
                                        <View style={styles.emptySlotIcon}>
                                            <Plus color={colors.textPlaceholder} size={16} />
                                        </View>
                                        <Text style={styles.emptySlotText}>Empty Slot</Text>
                                    </View>
                                    <Text style={styles.emptySlotInvite}>Invite</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            );
        }
    };

    const isEmpty = hasLoadedOnce.current && active.length === 0 && !isLoading;

    if (isEmpty) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={[styles.pageHeader, { paddingHorizontal: 24 }]}>
                    <Text style={styles.title}>My Pairs</Text>
                    <TouchableOpacity
                        style={styles.inviteButton}
                        onPress={() => navigation.navigate('InvitePairIntro')}
                    >
                        <Plus color={colors.textSecondary} size={18} strokeWidth={2.5} />
                        <Text style={styles.inviteText}>Invite</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.emptyStateContainer}>
                    <View style={styles.emptyStateCard}>
                        <Blend color={colors.primary} size={48} style={styles.emptyStateIcon} />
                        <Text style={styles.emptyStateTitle}>Stay Connected</Text>
                        <Text style={styles.emptyStateSub}>
                            Build deeper support by inviting someone you trust
                        </Text>
                        <TouchableOpacity style={styles.emptyStateCta} onPress={() => navigation.navigate('InvitePairIntro')}>
                            <Text style={styles.emptyStateCtaText}>+ Discover Pairing</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.flex} onLayout={handleLayout}>
                <FlatList
                    data={['grid', 'list']}
                    renderItem={renderItem}
                    pagingEnabled
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                    keyExtractor={(item) => item}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                />
            </View>
            {/* Support Pair Actions Sheet */}
            <Modal
                animationType="fade"
                transparent
                visible={!!supportSheetPair}
                onRequestClose={() => setSupportSheetPair(null)}
            >
                <TouchableOpacity
                    style={styles.sheetOverlay}
                    activeOpacity={1}
                    onPress={() => setSupportSheetPair(null)}
                >
                    <TouchableWithoutFeedback>
                        <View style={styles.sheetCard}>
                            <View style={styles.sheetHandle} />
                            <View style={styles.sheetHeader}>
                                <Text style={styles.sheetTitle}>
                                    {supportSheetPair?.other_user?.fullName || supportSheetPair?.other_user?.firstName || 'Pair'}
                                </Text>
                                <TouchableOpacity onPress={() => setSupportSheetPair(null)} hitSlop={8}>
                                    <X color={colors.textSecondary} size={20} />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.sheetOption}
                                onPress={() => {
                                    // TODO: implement pair type update request API
                                    Alert.alert('Request Sent', 'A request to update the pair type has been sent.');
                                    setSupportSheetPair(null);
                                }}
                            >
                                <RefreshCw color={colors.primary} size={20} />
                                <Text style={styles.sheetOptionText}>Request Pair Type Update</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.sheetOption}
                                onPress={() => handleStopSharingPress(supportSheetPair)}
                            >
                                <Ban color={colors.destructive} size={20} />
                                <Text style={[styles.sheetOptionText, { color: colors.destructive }]}>
                                    Stop Sharing with {supportSheetPair?.other_user?.firstName || supportSheetPair?.other_user?.fullName?.split(' ')[0] || 'Pair'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>

            {/* Stop Sharing Confirmation */}
            <ConfirmModal
                visible={!!confirmStopPair}
                onClose={() => setConfirmStopPair(null)}
                onConfirm={handleStopSharingConfirm}
                title="Stop Sharing"
                message={`Are you sure you want to stop sharing your emotional checkins with ${confirmStopPair?.other_user?.fullName || confirmStopPair?.other_user?.firstName || 'this pair'}?`}
                confirmText="Stop Sharing"
                cancelText="Cancel"
                destructive
                loading={stopLoading}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    page: { flex: 1, paddingHorizontal: 16, paddingBottom: 32 },
    listPage: { paddingBottom: 0 },
    pageHeader: {
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    title: {
        fontSize: fontSizes['3xl'],
        fontFamily: fonts.heading,
        color: colors.textPrimary,
    },
    inviteButton: { flexDirection: 'row', alignItems: 'center' },
    inviteText: {
        fontFamily: fonts.bodyBold,
        fontWeight: '600',
        color: colors.textSecondary,
        marginLeft: 4,
    },
    subHeaderSpacer: { height: 56 },
    gridContainer: { flex: 1, justifyContent: 'center' },
    swipeHint: { alignItems: 'center', opacity: 0.5 },
    swipeHintText: { fontFamily: fonts.bodyMedium, color: colors.textMuted, marginTop: 4 },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,
        marginBottom: 16,
    },
    listTitle: {
        fontSize: fontSizes['3xl'],
        fontFamily: fonts.heading,
        color: colors.textPrimary,
    },
    createRow: { flexDirection: 'row', alignItems: 'center' },
    createText: {
        fontFamily: fonts.bodyMedium,
        color: colors.textSecondary,
        marginLeft: 4,
    },
    createTextBold: {
        fontFamily: fonts.bodyBold,
        fontWeight: '600',
        color: colors.textSecondary,
        marginLeft: 4,
    },
    listScroll: { flex: 1 },
    listContent: { paddingHorizontal: 8, paddingBottom: 16 },
    emptyText: {
        fontFamily: fonts.body,
        fontSize: fontSizes.base,
        color: colors.textMuted,
        textAlign: 'center',
        paddingVertical: 24,
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
    },
    listItemBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.borderLight,
    },
    listItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    badgeWrap: { alignSelf: 'center' },
    listItemName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.textPrimary },
    listItemMeta: { fontSize: fontSizes.sm, fontFamily: fonts.bodyMedium, color: colors.textSecondary },
    listItemChevron: { color: colors.textPlaceholder },
    emptySlotIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    emptySlotText: {
        fontFamily: fonts.bodyMedium,
        fontSize: fontSizes.base,
        color: colors.textPlaceholder,
    },
    emptySlotInvite: {
        fontFamily: fonts.bodyBold,
        fontSize: fontSizes.sm,
        color: colors.primary,
    },
    sheetOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: colors.overlay,
    },
    sheetCard: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: borderRadius.lg,
        borderTopRightRadius: borderRadius.lg,
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 12,
    },
    sheetHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border,
        alignSelf: 'center',
        marginBottom: 16,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sheetTitle: {
        fontFamily: fonts.heading,
        fontSize: fontSizes.xl,
        color: colors.textPrimary,
    },
    sheetOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.borderLight,
    },
    sheetOptionText: {
        fontFamily: fonts.bodyMedium,
        fontSize: fontSizes.base,
        color: colors.textPrimary,
        marginLeft: 12,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    emptyStateCard: {
        backgroundColor: 'rgba(145, 162, 125, 0.25)',
        borderRadius: borderRadius.lg,
        paddingVertical: 40,
        paddingHorizontal: 32,
        alignItems: 'center',
        width: '100%',
    },
    emptyStateIcon: {
        marginBottom: 16,
    },
    emptyStateTitle: {
        fontFamily: fonts.heading,
        fontSize: fontSizes.xl,
        color: colors.darkForest,
        textAlign: 'center',
    },
    emptyStateSub: {
        fontFamily: fonts.body,
        fontSize: fontSizes.sm,
        color: colors.darkForest,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    emptyStateCta: {
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: borderRadius.button,
        paddingHorizontal: 24,
        paddingVertical: 12,
        marginTop: 24,
    },
    emptyStateCtaText: {
        fontFamily: fonts.bodyBold,
        fontWeight: '600',
        fontSize: fontSizes.md,
        color: colors.primary,
    },
});
