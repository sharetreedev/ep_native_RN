import React, { useCallback, useState } from 'react';
import { View, FlatList, LayoutChangeEvent, RefreshControl, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { CheckInConfirmModal } from '../../components/checkin/CheckInOverlay';
import ConfirmModal from '../../components/ConfirmModal';
import { useAuth } from '../../contexts/AuthContext';
import { useQuickCheckIn } from '../../hooks/useQuickCheckIn';
import { useStateCoordinates } from '../../hooks/useStateCoordinates';
import { useEmotionStates } from '../../hooks/useEmotionStates';
import { useCoordinateMapping } from '../../hooks/useCoordinateMapping';
import { OverlayUser } from '../../components/visualization/PairsAvatarOverlay';
import { colors } from '../../theme';
import { useMyPairsData } from './useMyPairsData';
import PairsGrid from './components/PairsGrid';
import PairsRefinement from './components/PairsRefinement';
import PairActionsSheet from './components/PairActionsSheet';
import PairsEmptyState from './components/PairsEmptyState';

export default function MyPairsScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { user: currentUser } = useAuth();
    const {
        active,
        isLoading,
        hasLoadedOnce,
        refreshing,
        onRefresh,
        sendCheckinReminder,
        removePair,
    } = useMyPairsData(currentUser?.id);
    const { coordinates } = useStateCoordinates();
    const { emotionStates } = useEmotionStates();
    const { coordMap } = useCoordinateMapping(coordinates);

    const [containerHeight, setContainerHeight] = useState(0);
    const { pendingCheckIn, handleCellPress, confirmCheckIn, cancelCheckIn } = useQuickCheckIn(
        () => navigation.navigate('DailyInsight' as any)
    );
    const [supportSheetPair, setSupportSheetPair] = useState<any>(null);
    const [confirmStopPair, setConfirmStopPair] = useState<any>(null);
    const [stopLoading, setStopLoading] = useState(false);

    const handleLayout = (e: LayoutChangeEvent) => {
        setContainerHeight(e.nativeEvent.layout.height);
    };

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

    const handleEmotionLongPress = useCallback((emotion: any) => {
        navigation.navigate('EmotionDetail', { emotion });
    }, [navigation]);

    const handleInvitePress = useCallback(() => {
        navigation.navigate('InvitePairIntro');
    }, [navigation]);

    const handlePairPress = useCallback((userId: string, pairsId: number) => {
        navigation.navigate('UserProfile', { userId, pairsId });
    }, [navigation]);

    const renderItem = ({ item }: { item: string }) => {
        if (item === 'grid') {
            return (
                <PairsGrid
                    active={active}
                    currentUser={currentUser}
                    containerHeight={containerHeight}
                    hasLoadedOnce={hasLoadedOnce.current}
                    coordMap={coordMap}
                    emotionStates={emotionStates}
                    onEmotionLongPress={handleEmotionLongPress}
                    onOverlayUserPress={handleOverlayUserPress}
                    onCellPress={handleCellPress}
                />
            );
        }
        return (
            <PairsRefinement
                active={active}
                currentUser={currentUser}
                isLoading={isLoading}
                containerHeight={containerHeight}
                onInvitePress={handleInvitePress}
                onPairPress={handlePairPress}
                onOpenSupportSheet={setSupportSheetPair}
                onSendReminder={sendCheckinReminder}
            />
        );
    };

    const isEmpty = hasLoadedOnce.current && active.length === 0 && !isLoading;

    if (isEmpty) {
        return <PairsEmptyState onInvitePress={handleInvitePress} />;
    }

    return (
        <View style={styles.container}>
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

            <PairActionsSheet
                pair={supportSheetPair}
                onClose={() => setSupportSheetPair(null)}
                onStopSharing={handleStopSharingPress}
            />

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

            {pendingCheckIn && (
                <CheckInConfirmModal
                    emotion={pendingCheckIn.emotion}
                    onConfirm={confirmCheckIn}
                    onCancel={cancelCheckIn}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
});
