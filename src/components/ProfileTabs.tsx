import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, fonts, fontSizes, spacing } from '../theme';

interface ProfileTabsProps<T extends string> {
  tabs: readonly T[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  containerStyle?: ViewStyle;
  tabStyle?: ViewStyle;
}

export default function ProfileTabs<T extends string>({ tabs, activeTab, onTabChange, containerStyle, tabStyle }: ProfileTabsProps<T>) {
  return (
    <View style={[styles.tabs, containerStyle]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => onTabChange(tab)}
          style={[styles.tab, tabStyle, activeTab === tab && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(48, 68, 43, 0.10)',
  },
  tab: {
    marginRight: spacing.xl,
    paddingBottom: spacing.md,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textPlaceholder,
  },
  tabTextActive: {
    color: colors.primary,
  },
});
