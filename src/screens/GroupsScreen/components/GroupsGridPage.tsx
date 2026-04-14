import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronUp, ChevronDown } from 'lucide-react-native';
import PulseGrid from '../../../components/visualization/PulseGrid';
import CoordinatesGrid from '../../../components/visualization/CoordinatesGrid';
import PairsAvatarOverlay from '../../../components/visualization/PairsAvatarOverlay';
import Avatar from '../../../components/Avatar';
import PulseLoader from '../../../components/PulseLoader';
import GroupSelectorDropdown from './GroupSelectorDropdown';
import { colors, fonts, fontSizes } from '../../../theme';

export interface SelectedGroupInfo {
  name: string;
  imageUrl: string | undefined;
  groupId: number;
  forestId: number | undefined;
  runningStats: any;
  role: string | undefined;
  membersCoordinatesCount: any[];
  checkins7day: any[];
  checkins30day: any[];
}

interface GroupsGridPageProps {
  containerHeight: number;
  hasLoadedOnce: boolean;
  activeGroups: any[];
  favouriteGroups: any[];
  selectedGroup: number | null;
  selectedGroupInfo: SelectedGroupInfo | null;
  densityData: any;
  groupGridData: Record<string, { count: number }>;
  dropdownOpen: boolean;
  onOpenDropdown: () => void;
  onCloseDropdown: () => void;
  onSelectGroup: (groupId: number) => void;
  onViewTrends: (info: SelectedGroupInfo) => void;
  onCellPress: (row: number, col: number) => void;
}

export default function GroupsGridPage({
  containerHeight,
  hasLoadedOnce,
  activeGroups,
  favouriteGroups,
  selectedGroup,
  selectedGroupInfo,
  densityData,
  groupGridData,
  dropdownOpen,
  onOpenDropdown,
  onCloseDropdown,
  onSelectGroup,
  onViewTrends,
  onCellPress,
}: GroupsGridPageProps) {
  return (
    <View style={[styles.page, { height: containerHeight }]}>
      <View style={styles.subHeader}>
        <View>
          <Text style={styles.subLabel}>Last 24 hours</Text>
          {selectedGroupInfo && (
            <TouchableOpacity
              style={styles.selectedGroupRow}
              onPress={() => favouriteGroups.length > 1 && onOpenDropdown()}
              activeOpacity={favouriteGroups.length > 1 ? 0.6 : 1}
            >
              <Avatar
                source={selectedGroupInfo.imageUrl}
                name={selectedGroupInfo.name}
                size="xs"
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
              onViewTrends(selectedGroupInfo);
            }
          }}
        >
          <Text style={styles.viewTrends}>View Trends ›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gridWrap}>
        {!hasLoadedOnce && activeGroups.length === 0 ? (
          <PulseLoader delay={150} />
        ) : (
          <PulseGrid mode="group" data={groupGridData} isInteractive={false}>
            <View style={StyleSheet.absoluteFill}>
              <CoordinatesGrid
                visualizationMode="group"
                densityData={densityData}
              />
            </View>
            <PairsAvatarOverlay
              points={[]}
              onUserPress={() => {}}
              onCellPress={onCellPress}
            />
          </PulseGrid>
        )}
      </View>

      <GroupSelectorDropdown
        visible={dropdownOpen}
        favouriteGroups={favouriteGroups}
        selectedGroup={selectedGroup}
        onSelect={onSelectGroup}
        onClose={onCloseDropdown}
      />

      <TouchableOpacity style={styles.swipeHint}>
        <Text style={styles.swipeHintText}>Swipe up for List</Text>
        <ChevronUp color={colors.textMuted} size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 16, paddingBottom: 32 },
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
  swipeHint: { alignItems: 'center', opacity: 0.5, flexShrink: 0 },
  swipeHintText: { fontFamily: fonts.bodyMedium, color: colors.textMuted, marginTop: 4 },
});
