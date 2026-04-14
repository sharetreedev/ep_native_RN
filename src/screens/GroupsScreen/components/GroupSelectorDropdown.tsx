import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import Avatar from '../../../components/Avatar';
import { colors, fonts, fontSizes } from '../../../theme';

interface GroupSelectorDropdownProps {
  visible: boolean;
  favouriteGroups: any[];
  selectedGroup: number | null;
  onSelect: (groupId: number) => void;
  onClose: () => void;
}

export default function GroupSelectorDropdown({
  visible,
  favouriteGroups,
  selectedGroup,
  onSelect,
  onClose,
}: GroupSelectorDropdownProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.dropdownBackdrop} onPress={onClose}>
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
                    onSelect(groupId);
                    onClose();
                  }}
                >
                  <Avatar
                    source={imageUrl}
                    initials={initial}
                    size="sm"
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
  );
}

const styles = StyleSheet.create({
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
});
