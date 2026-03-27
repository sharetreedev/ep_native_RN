import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, ScrollView, LayoutChangeEvent, RefreshControl, StyleSheet, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import PulseGrid from '../../components/visualization/PulseGrid';
import CoordinatesGrid from '../../components/visualization/CoordinatesGrid';
import { Plus, ChevronUp, ChevronDown, Users } from 'lucide-react-native';
import { useGroups } from '../../hooks/useGroups';
import { useStateCoordinates } from '../../hooks/useStateCoordinates';
import { useCoordinateMapping } from '../../hooks/useCoordinateMapping';
import { colors, fonts, fontSizes, borderRadius } from '../../theme';
import AvatarDisplay from '../../components/AvatarDisplay';
import PulseLoader from '../../components/PulseLoader';
import { useCachedFetch } from '../../hooks/useCachedFetch';
import { CACHE_KEYS } from '../../lib/fetchCache';

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
  const selectedGroupInfo = useMemo(() => {
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

  const renderItem = ({ item }: { item: string }) => {
    if (containerHeight === 0) return null;

    if (item === 'grid') {
      return (
        <View style={[styles.page, { height: containerHeight }]}>
          <View style={styles.gridHeader}>
            <Text style={styles.screenTitle}>My Groups</Text>
            <TouchableOpacity style={styles.createRow} onPress={() => navigation.navigate('CreateGroup')}>
              <Plus color={colors.textSecondary} size={18} strokeWidth={2.5} />
              <Text style={styles.createText}>Create</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.subHeader}>
            <View>
              <Text style={styles.subLabel}>Last 24 hours</Text>
              {selectedGroupInfo && (
                <TouchableOpacity
                  style={styles.selectedGroupRow}
                  onPress={() => favouriteGroups.length > 1 && setDropdownOpen(true)}
                  activeOpacity={favouriteGroups.length > 1 ? 0.6 : 1}
                >
                  <AvatarDisplay
                    imageUrl={selectedGroupInfo.imageUrl}
                    fallbackText={selectedGroupInfo.name.charAt(0).toUpperCase()}
                    size={28}
                    borderRadius={10}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.selectedGroupName}>{selectedGroupInfo.name}</Text>
                  {favouriteGroups.length > 1 && (
                    <ChevronDown color={colors.textMuted} size={16} style={{ marginLeft: 6 }} />
                  )}
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={() => {
                if (selectedGroupInfo) {
                  navigation.navigate('GroupProfile', {
                    groupId: selectedGroupInfo.groupId,
                    groupName: selectedGroupInfo.name,
                    forestId: selectedGroupInfo.forestId,
                    runningStats: selectedGroupInfo.runningStats,
                    imageUrl: selectedGroupInfo.imageUrl,
                    role: selectedGroupInfo.role,
                    membersCoordinatesCount: selectedGroupInfo.membersCoordinatesCount,
                    checkins7day: selectedGroupInfo.checkins7day,
                    checkins30day: selectedGroupInfo.checkins30day,
                  });
                }
              }}
            >
              <Text style={styles.viewTrends}>View Trends ›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridWrap}>
            {!hasLoadedOnce.current && activeGroups.length === 0 ? (
              <PulseLoader delay={150} />
            ) : (
              <PulseGrid mode="group" data={groupGridData} isInteractive={false}>
                <View style={StyleSheet.absoluteFill}>
                  <CoordinatesGrid
                    visualizationMode="group"
                    densityData={densityData}
                  />
                </View>
              </PulseGrid>
            )}
          </View>

          {/* Group selector dropdown */}
          <Modal
            visible={dropdownOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setDropdownOpen(false)}
          >
            <Pressable style={styles.dropdownBackdrop} onPress={() => setDropdownOpen(false)}>
              <View style={styles.dropdownCard}>
                <Text style={styles.dropdownTitle}>Your favourite groups</Text>
                <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={true} bounces={false}>
                  {favouriteGroups.map((g: any) => {
                    const info = g.forest?.group;
                    const groupId = info?.id ?? g.groupId ?? g.id;
                    const imageUrl = info?.imageKey;
                    const name = info?.groupName || g.groupName || '';
                    const initial = name.charAt(0).toUpperCase();
                    const isActive = groupId === selectedGroup;

                    return (
                      <TouchableOpacity
                        key={`dd-${g.id ?? groupId}`}
                        style={[styles.dropdownItem, isActive && styles.dropdownItemActive]}
                        onPress={() => {
                          setSelectedGroup(groupId);
                          setDropdownOpen(false);
                        }}
                      >
                        <AvatarDisplay
                          imageUrl={imageUrl}
                          fallbackText={initial}
                          size={36}
                          borderRadius={10}
                          style={{ marginRight: 12 }}
                        />
                        <Text style={[styles.dropdownName, isActive && styles.dropdownNameActive]}>
                          {name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </Pressable>
          </Modal>

          <TouchableOpacity style={styles.swipeHint}>
            <Text style={styles.swipeHintText}>Swipe up for List</Text>
            <ChevronUp color={colors.textMuted} size={24} />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.page, styles.listPage, { height: containerHeight }]}>
        <TouchableOpacity style={styles.swipeHint}>
          <ChevronUp color={colors.textMuted} size={24} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>All Groups</Text>
          <TouchableOpacity style={styles.createRow} onPress={() => navigation.navigate('CreateGroup' as any)}>
            <Plus color={colors.textSecondary} size={18} strokeWidth={2.5} />
            <Text style={styles.createTextBold}>Create</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} nestedScrollEnabled>
          {activeGroups.length === 0 && !isLoading && (
            <Text style={styles.emptyText}>No groups yet</Text>
          )}
          {activeGroups.map((group: any, index: number) => {
            const groupInfo = group.forest?.group;
            const groupName = groupInfo?.groupName || group.groupName || `Group #${group.groupId ?? group.id}`;
            const imageUrl = groupInfo?.imageKey;
            const rawRole = (group.forest?.role ?? group.forest_map?.role ?? '') as string;
            const role = rawRole.replace(/\b\w/g, (c: string) => c.toUpperCase());
            const memberCount = groupInfo?.member_count as number | undefined;
            const forestId = group.forest?.id;
            const initial = groupName.charAt(0).toUpperCase();
            const isLast = index === activeGroups.length - 1;
            const groupId = groupInfo?.id ?? group.groupId ?? group.id;

            return (
              <TouchableOpacity
                key={`group-${group.id ?? index}`}
                style={[styles.listItem, !isLast && styles.listItemBorder]}
                onPress={() => { const rs = group.group?.running_stats ?? groupInfo?.running_stats ?? group.running_stats ?? null; navigation.navigate('GroupProfile', { groupId, groupName, forestId, runningStats: rs, imageUrl: imageUrl ?? undefined, role: role || undefined, membersCoordinatesCount: group.members_coordinates_count ?? [], checkins7day: rs?.checkins_7day ?? [], checkins30day: rs?.checkins30day ?? [] }); }}
              >
                <View style={styles.listItemLeft}>
                  <AvatarDisplay
                    imageUrl={imageUrl}
                    fallbackText={initial}
                    size={40}
                    borderRadius={12}
                    style={{ marginRight: 12 }}
                  />
                  <View>
                    <Text style={styles.listItemName}>{groupName}</Text>
                    {(role || memberCount != null) ? (
                      <Text style={styles.listItemRole}>
                        {role}{role && memberCount != null ? ' · ' : ''}{memberCount != null ? `${memberCount} ${memberCount === 1 ? 'member' : 'members'}` : ''}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <Text style={styles.listItemChevron}>›</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const isEmpty = hasLoadedOnce.current && activeGroups.length === 0 && !isLoading;

  if (isEmpty) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={[styles.gridHeader, { paddingHorizontal: 24 }]}>
          <Text style={styles.screenTitle}>My Groups</Text>
          <TouchableOpacity style={styles.createRow} onPress={() => navigation.navigate('CreateGroup')}>
            <Plus color={colors.textSecondary} size={18} strokeWidth={2.5} />
            <Text style={styles.createText}>Create</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateCard}>
            <Users color={colors.primary} size={48} style={styles.emptyStateIcon} />
            <Text style={styles.emptyStateTitle}>Create your first Group</Text>
            <Text style={styles.emptyStateSub}>
              Lead and participate more consciously by seeing how everyone is feeling without compromising confidentiality.
            </Text>
            <TouchableOpacity style={styles.emptyStateCta} onPress={() => navigation.navigate('CreateGroup')}>
              <Text style={styles.emptyStateCtaText}>+ Discover Groups</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  page: { flex: 1, paddingHorizontal: 16, paddingBottom: 32 },
  listPage: { paddingBottom: 0 },
  gridHeader: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  screenTitle: {
    fontSize: fontSizes['3xl'],
    fontFamily: fonts.heading,
    color: colors.textPrimary,
  },
  createRow: { flexDirection: 'row', alignItems: 'center' },
  createText: {
    fontFamily: fonts.bodyBold,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 4,
  },
  createTextBold: {
    fontFamily: fonts.bodyBold,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 4,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  subLabel: { fontSize: fontSizes.sm, fontFamily: fonts.bodyBold, color: colors.textMuted },
  viewTrends: { fontFamily: fonts.bodyMedium, color: colors.textSecondary },
  selectedGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  selectedGroupName: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
  },
  gridWrap: { flex: 1, justifyContent: 'center' },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  dropdownCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  dropdownTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textMuted,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  dropdownScroll: {
    maxHeight: 240,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  dropdownItemActive: {
    backgroundColor: colors.primaryLight,
  },
  dropdownName: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  dropdownNameActive: {
    fontFamily: fonts.bodyBold,
    color: colors.primary,
  },
  swipeHint: { alignItems: 'center', opacity: 0.5, flexShrink: 0 },
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
  listItemLeft: { flexDirection: 'row', alignItems: 'center' },
  listItemName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.textPrimary },
  listItemRole: { fontSize: fontSizes.sm, fontFamily: fonts.bodyMedium, color: colors.textSecondary },
  listItemChevron: { color: colors.textPlaceholder },
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
