import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, FlatList, LayoutChangeEvent, RefreshControl, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useGroups } from '../../hooks/useGroups';
import { useStateCoordinates } from '../../hooks/useStateCoordinates';
import { useCoordinateMapping } from '../../hooks/useCoordinateMapping';
import { CheckInConfirmModal } from '../../components/checkin/CheckInOverlay';
import { useQuickCheckIn } from '../../hooks/useQuickCheckIn';
import { colors } from '../../theme';
import { useCachedFetch } from '../../hooks/useCachedFetch';
import { CACHE_KEYS } from '../../lib/fetchCache';
import GroupsEmptyState from './components/GroupsEmptyState';
import GroupsGridPage, { SelectedGroupInfo } from './components/GroupsGridPage';
import GroupsListPage, { GroupListItemPayload } from './components/GroupsListPage';

export default function GroupsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [containerHeight, setContainerHeight] = useState(0);
  const { activeGroups, isLoading, fetchAll } = useGroups();
  const { coordinates } = useStateCoordinates();
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);
  if (!isLoading) hasLoadedOnce.current = true;
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { fetch: cachedFetchGroups, forceFetch: forceFetchGroups } = useCachedFetch(CACHE_KEYS.GROUPS, fetchAll);

  useFocusEffect(
    useCallback(() => {
      cachedFetchGroups();
    }, [cachedFetchGroups])
  );

  // Favourite groups (max 4) for the avatar selector
  const favouriteGroups = useMemo(() =>
    activeGroups
      .filter((g: any) => g.forest?.isFavourite),
  [activeGroups]);

  // Auto-select first favourite group (or first group as fallback)
  useEffect(() => {
    if (activeGroups.length > 0 && selectedGroup === null) {
      const target = (favouriteGroups[0] ?? activeGroups[0]) as any;
      const groupId = target.forest?.group?.id ?? target.group?.id ?? target.groupId ?? target.id;
      setSelectedGroup(groupId);
    }
  }, [activeGroups, favouriteGroups, selectedGroup]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await forceFetchGroups();
    setRefreshing(false);
  }, [forceFetchGroups]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerHeight(e.nativeEvent.layout.height);
  };

  // Build coordinate-level density data from selected group's members_coordinates_count
  const membersCoordinatesCount = useMemo(() => {
    if (selectedGroup == null) return [];
    const match = activeGroups.find((g: any) => {
      const gid = g.forest?.group?.id ?? g.group?.id ?? g.forest?.groupId ?? g.groupId ?? g.id;
      return gid === selectedGroup;
    }) as any;
    return match?.members_coordinates_count ?? [];
  }, [activeGroups, selectedGroup]);

  const { densityData } = useCoordinateMapping(coordinates, membersCoordinatesCount);

  const { pendingCheckIn, handleCellPress, confirmCheckIn, cancelCheckIn } = useQuickCheckIn(
    () => navigation.navigate('DailyInsight' as any)
  );

  // Build grid overlay data from active groups
  const groupGridData: Record<string, { count: number }> = {};
  activeGroups.forEach((g: any) => {
    const emotionKey = g._last_emotion_key || g.lastEmotionKey;
    if (emotionKey) {
      groupGridData[emotionKey] = {
        count: (groupGridData[emotionKey]?.count ?? 0) + 1,
      };
    }
  });

  // Resolve selected group info for display
  const selectedGroupInfo = useMemo<SelectedGroupInfo | null>(() => {
    if (selectedGroup == null) return null;
    const match = activeGroups.find((g: any) => {
      const gid = g.forest?.group?.id ?? g.groupId ?? g.id;
      return gid === selectedGroup;
    }) as any;
    if (!match) return null;
    const info = match.forest?.group;
    const rs = match.group?.running_stats ?? info?.running_stats ?? match.running_stats ?? null;
    const rawRole = (match.forest?.role ?? match.forest_map?.role ?? '') as string;
    return {
      name: info?.groupName || match.groupName || '',
      imageUrl: info?.imageKey as string | undefined,
      groupId: info?.id ?? match.groupId ?? match.id,
      forestId: match.forest?.id as number | undefined,
      runningStats: rs,
      role: rawRole ? rawRole.replace(/\b\w/g, (c: string) => c.toUpperCase()) : undefined,
      membersCoordinatesCount: match.members_coordinates_count ?? [],
      checkins7day: rs?.checkins_7day ?? [],
      checkins30day: rs?.checkins30day ?? [],
    };
  }, [activeGroups, selectedGroup]);

  const handleViewTrends = useCallback(
    (info: SelectedGroupInfo) => {
      navigation.navigate('GroupProfile', {
        groupId: info.groupId,
        groupName: info.name,
        forestId: info.forestId,
        runningStats: info.runningStats,
        imageUrl: info.imageUrl,
        role: info.role,
        membersCoordinatesCount: info.membersCoordinatesCount,
        checkins7day: info.checkins7day,
        checkins30day: info.checkins30day,
      });
    },
    [navigation]
  );

  const handleListItemPress = useCallback(
    (payload: GroupListItemPayload) => {
      navigation.navigate('GroupProfile', {
        groupId: payload.groupId,
        groupName: payload.groupName,
        forestId: payload.forestId,
        runningStats: payload.runningStats,
        imageUrl: payload.imageUrl,
        role: payload.role,
        membersCoordinatesCount: payload.membersCoordinatesCount,
        checkins7day: payload.checkins7day,
        checkins30day: payload.checkins30day,
      });
    },
    [navigation]
  );

  const renderItem = ({ item }: { item: string }) => {
    if (containerHeight === 0) return null;

    if (item === 'grid') {
      return (
        <GroupsGridPage
          containerHeight={containerHeight}
          hasLoadedOnce={hasLoadedOnce.current}
          activeGroups={activeGroups}
          favouriteGroups={favouriteGroups}
          selectedGroup={selectedGroup}
          selectedGroupInfo={selectedGroupInfo}
          densityData={densityData}
          groupGridData={groupGridData}
          dropdownOpen={dropdownOpen}
          onOpenDropdown={() => setDropdownOpen(true)}
          onCloseDropdown={() => setDropdownOpen(false)}
          onSelectGroup={setSelectedGroup}
          onViewTrends={handleViewTrends}
          onCellPress={handleCellPress}
        />
      );
    }

    return (
      <GroupsListPage
        containerHeight={containerHeight}
        activeGroups={activeGroups}
        isLoading={isLoading}
        onGroupPress={handleListItemPress}
      />
    );
  };

  const isEmpty = hasLoadedOnce.current && activeGroups.length === 0 && !isLoading;

  if (isEmpty) {
    return <GroupsEmptyState onCreate={() => navigation.navigate('CreateGroup')} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.fill} onLayout={handleLayout}>
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
  fill: { flex: 1 },
});
