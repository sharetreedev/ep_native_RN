import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ChevronUp } from 'lucide-react-native';
import Avatar from '../../../components/Avatar';
import { colors, fonts, fontSizes } from '../../../theme';

export interface GroupListItemPayload {
  groupId: number;
  groupName: string;
  forestId: number | undefined;
  runningStats: any;
  imageUrl: string | undefined;
  role: string | undefined;
  membersCoordinatesCount: any[];
  checkins7day: any[];
  checkins30day: any[];
}

interface GroupsListPageProps {
  containerHeight: number;
  activeGroups: any[];
  isLoading: boolean;
  onGroupPress: (payload: GroupListItemPayload) => void;
}

export default function GroupsListPage({
  containerHeight,
  activeGroups,
  isLoading,
  onGroupPress,
}: GroupsListPageProps) {
  return (
    <View style={[styles.page, styles.listPage, { height: containerHeight }]}>
      <TouchableOpacity style={styles.swipeHint}>
        <ChevronUp color={colors.textMuted} size={24} style={{ transform: [{ rotate: '180deg' }] }} />
      </TouchableOpacity>

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
              onPress={() => {
                const rs = group.group?.running_stats ?? groupInfo?.running_stats ?? group.running_stats ?? null;
                onGroupPress({
                  groupId,
                  groupName,
                  forestId,
                  runningStats: rs,
                  imageUrl: imageUrl ?? undefined,
                  role: role || undefined,
                  membersCoordinatesCount: group.members_coordinates_count ?? [],
                  checkins7day: rs?.checkins_7day ?? [],
                  checkins30day: rs?.checkins30day ?? [],
                });
              }}
            >
              <View style={styles.listItemLeft}>
                <Avatar
                  source={imageUrl}
                  initials={initial}
                  size="md"
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
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 16, paddingBottom: 32 },
  listPage: { paddingBottom: 0 },
  swipeHint: { alignItems: 'center', opacity: 0.5, flexShrink: 0 },
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
});
