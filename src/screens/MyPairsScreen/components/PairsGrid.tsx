import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronUp } from 'lucide-react-native';
import PulseGrid from '../../../components/visualization/PulseGrid';
import PairsAvatarOverlay, { OverlayUser, CoordinateUsers, StalenessLevel } from '../../../components/visualization/PairsAvatarOverlay';
import PulseLoader from '../../../components/PulseLoader';
import { colors, fonts } from '../../../theme';
import { logger } from '../../../lib/logger';

interface PairsGridProps {
    active: any[];
    currentUser: any;
    containerHeight: number;
    hasLoadedOnce: boolean;
    coordMap: Map<number, { row: number; col: number }>;
    emotionStates: { row: number; col: number; name: string; emotionColour: string }[];
    onEmotionLongPress: (emotion: any) => void;
    onOverlayUserPress: (user: OverlayUser) => void;
    onCellPress: (row: number, col: number) => void;
}

function PairsGrid({
    active,
    currentUser,
    containerHeight,
    hasLoadedOnce,
    coordMap,
    emotionStates,
    onEmotionLongPress,
    onOverlayUserPress,
    onCellPress,
}: PairsGridProps) {
    // Build grid overlay data from active pairs.
    // The API may include expanded user/emotion data; map by last check-in state.
    const pairsGridData = useMemo(() => {
        const data: Record<string, { users: { id: string }[] }> = {};
        active.forEach((pair: any) => {
            const emotionKey = pair._last_emotion_key || pair.lastEmotionKey;
            if (emotionKey) {
                if (!data[emotionKey]) data[emotionKey] = { users: [] };
                data[emotionKey].users.push({ id: String(pair.id) });
            }
        });
        return data;
    }, [active]);

    // Build avatar overlay data at coordinate level.
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
                hexColour: otherUser.profile_hex_colour || null,
                staleness: getStaleness(otherUser.lastCheckInDate || otherUser.last_check_in_date),
            });
        });

        // Add current user at their most recent check-in coordinate
        if (currentUser) {
            const rawCoord = currentUser.recentStateCoordinates;
            const selfCoordId = Number(typeof rawCoord === 'object' && rawCoord !== null ? rawCoord.id : rawCoord);
            if (selfCoordId && !isNaN(selfCoordId)) {
                addUser(selfCoordId, {
                    id: `self-${currentUser.id}`,
                    userId: currentUser.id,
                    name: currentUser.name,
                    avatarUrl: currentUser.avatarUrl || null,
                    hexColour: currentUser.profileHexColour || null,
                    isCurrentUser: true,
                });
            }
        }

        // Convert to CoordinateUsers[]
        const points: CoordinateUsers[] = [];
        for (const [key, users] of Object.entries(cellMap)) {
            const [row, col] = key.split('-').map(Number);
            points.push({ row, col, users });
        }

        // Debug: log overlay grouping
        if (__DEV__) {
            logger.log('[PairsOverlay] coordMap size:', coordMap.size,
                'active pairs:', active.length,
                'points:', points.map(p => `(${p.row},${p.col}): ${p.users.length} users [${p.users.map(u => u.id).join(',')}]`));
        }

        return points;
    }, [active, coordMap, currentUser]);

    // Resolve 8x8 grid position → emotion info (each emotion covers a 2x2 block)
    const getEmotionInfo = useCallback((row: number, col: number) => {
        const emotionRow = Math.floor(row / 2);
        const emotionCol = Math.floor(col / 2);
        const emotion = emotionStates.find(e => e.row === emotionRow && e.col === emotionCol);
        if (!emotion) return undefined;
        return { name: emotion.name, colour: emotion.emotionColour };
    }, [emotionStates]);

    if (containerHeight === 0) return null;

    return (
        <View style={[styles.page, { height: containerHeight }]}>
            <View style={styles.gridContainer}>
                {!hasLoadedOnce && active.length === 0 ? (
                    <PulseLoader delay={150} />
                ) : (
                    <PulseGrid
                        mode="pairs"
                        data={pairsGridData}
                        onEmotionLongPress={onEmotionLongPress}
                    >
                        <PairsAvatarOverlay
                            points={avatarPoints}
                            onUserPress={onOverlayUserPress}
                            getEmotionInfo={getEmotionInfo}
                            onCellPress={onCellPress}
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
}

export default React.memo(PairsGrid);

const styles = StyleSheet.create({
    page: { flex: 1, paddingHorizontal: 16, paddingBottom: 32 },
    gridContainer: { flex: 1, justifyContent: 'center' },
    swipeHint: { alignItems: 'center', opacity: 0.5 },
    swipeHintText: { fontFamily: fonts.bodyMedium, color: colors.textMuted, marginTop: 4 },
});
