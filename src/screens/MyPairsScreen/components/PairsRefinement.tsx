import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ChevronUp, Plus } from 'lucide-react-native';
import Avatar from '../../../components/Avatar';
import EmotionBadge from '../../../components/EmotionBadge';
import CheckInWithUser from '../../../components/CheckInWithUser';
import ProfileTabs from '../../../components/ProfileTabs';
import { colors, fonts, fontSizes } from '../../../theme';

type PairTab = 'Trusted' | "I'm Supporting" | 'Supporting Me';
const PAIR_TABS: readonly PairTab[] = ['Trusted', "I'm Supporting", 'Supporting Me'] as const;

const MAX_PAIR_SLOTS = 5;

interface PairsRefinementProps {
    active: any[];
    currentUser: any;
    isLoading: boolean;
    containerHeight: number;
    onInvitePress: () => void;
    onPairPress: (otherUserId: string, pairsId: number) => void;
    onOpenSupportSheet: (pair: any) => void;
    onSendReminder: (...args: any[]) => any;
}

function PairsRefinement({
    active,
    currentUser,
    isLoading,
    containerHeight,
    onInvitePress,
    onPairPress,
    onOpenSupportSheet,
    onSendReminder,
}: PairsRefinementProps) {
    const [activeTab, setActiveTab] = useState<PairTab>('Trusted');

    const currentId = Number(currentUser?.id);
    const trustedPairs = useMemo(() => active.filter((p: any) => p.pairType === 'DUAL' || !p.pairType), [active]);
    const imSupportingPairs = useMemo(() => active.filter((p: any) => p.pairType === 'PULL' && p.requestFromId === currentId), [active, currentId]);
    const supportingMePairs = useMemo(() => active.filter((p: any) => p.pairType === 'PULL' && p.requestToId === currentId), [active, currentId]);

    const displayedPairs = activeTab === 'Trusted' ? trustedPairs
        : activeTab === "I'm Supporting" ? imSupportingPairs
        : supportingMePairs;
    const filledSlots = trustedPairs.length;
    const emptySlotsCount = activeTab === 'Trusted' ? Math.max(0, MAX_PAIR_SLOTS - filledSlots) : 0;
    const emptySlots = Array(emptySlotsCount).fill(null);

    return (
        <View style={[styles.page, { height: containerHeight }]}>
            <TouchableOpacity style={styles.swipeHint}>
                <ChevronUp color={colors.textMuted} size={24} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>

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
                    const isSupportingMe = activeTab === 'Supporting Me';
                    const pairTypeLabel = isTrusted ? 'Trusted Pair' : 'Support Pair';
                    const isLast = index === displayedPairs.length - 1 && emptySlotsCount === 0;

                    if (isSupportingMe) {
                        // Support pair: simple row, tap opens sheet
                        return (
                            <TouchableOpacity
                                key={pair.id}
                                style={[styles.listItem, !isLast && styles.listItemBorder]}
                                onPress={() => onOpenSupportSheet(pair)}
                            >
                                <View style={styles.listItemLeft}>
                                    <Avatar
                                        source={avatarUrl}
                                        initials={initial}
                                        size="md"
                                        style={{ marginRight: 12 }}
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.listItemName} numberOfLines={1}>{name}</Text>
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
                            onPress={() => onPairPress(String(otherUserId), pair.id)}
                        >
                            <View style={styles.listItemLeft}>
                                <Avatar
                                    source={avatarUrl}
                                    initials={initial}
                                    size="md"
                                    style={{ marginRight: 12 }}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.listItemName} numberOfLines={1}>{name}</Text>
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
                                    onSendReminder={onSendReminder}
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
                            onPress={onInvitePress}
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

export default PairsRefinement;

const styles = StyleSheet.create({
    page: { flex: 1, paddingHorizontal: 16, paddingBottom: 0 },
    swipeHint: { alignItems: 'center', opacity: 0.5 },
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
});
