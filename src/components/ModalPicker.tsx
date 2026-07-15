import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  TouchableOpacity,
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../theme';

export interface ModalPickerItem {
  label: string;
  value: string | number;
}

interface ModalPickerProps<T extends ModalPickerItem> {
  visible: boolean;
  onDismiss: () => void;
  data: T[];
  selectedValue: string | number | null;
  onSelect: (item: T) => void;
  keyExtractor?: (item: T) => string;
  animationType?: 'fade' | 'slide' | 'fadeSlide';
  maxHeight?: number;
  emptyText?: string;
  /** Show a search box that filters options by label. Default false. */
  searchable?: boolean;
  /** Placeholder for the search box (only when `searchable`). */
  searchPlaceholder?: string;
}

export default function ModalPicker<T extends ModalPickerItem>({
  visible,
  onDismiss,
  data,
  selectedValue,
  onSelect,
  keyExtractor,
  animationType = 'fade',
  maxHeight = 400,
  emptyText = 'No options available',
  searchable = false,
  searchPlaceholder = 'Search',
}: ModalPickerProps<T>) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => {
    if (!searchable) return data;
    const query = search.trim().toLowerCase();
    if (!query) return data;
    return data.filter((item) => item.label.toLowerCase().includes(query));
  }, [data, search, searchable]);

  // Clear the query whenever the picker is hidden so it reopens fresh.
  useEffect(() => {
    if (!visible) setSearch('');
  }, [visible]);

  useEffect(() => {
    if (animationType === 'fadeSlide' && visible) {
      slideAnim.setValue(0);
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    }
  }, [visible, animationType, slideAnim]);

  const handleDismiss = () => {
    if (animationType === 'fadeSlide') {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => onDismiss());
    } else {
      onDismiss();
    }
  };

  const useFadeSlide = animationType === 'fadeSlide';
  const modalAnimationType = useFadeSlide ? 'fade' : animationType;

  const slideTranslate = useFadeSlide
    ? slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [Dimensions.get('window').height, 0],
      })
    : 0;

  const ContentWrapper = useFadeSlide ? Animated.View : View;
  // A searchable picker uses a fixed height so the sheet doesn't resize as the
  // result count changes while typing; the list scrolls within it. Non-search
  // pickers keep shrink-to-fit (maxHeight) since their options are few.
  const sizeStyle = searchable ? { height: maxHeight } : { maxHeight };
  const contentStyle = useFadeSlide
    ? [styles.pickerContainer, sizeStyle, { transform: [{ translateY: slideTranslate }] }]
    : [styles.pickerContainer, sizeStyle];

  return (
    <Modal visible={visible} transparent animationType={modalAnimationType}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleDismiss}
      >
        <ContentWrapper style={contentStyle}>
          {searchable && (
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textPlaceholder}
              autoCorrect={false}
              autoCapitalize="none"
            />
          )}
          <FlatList
            data={filteredData}
            style={searchable ? styles.list : undefined}
            keyboardShouldPersistTaps="handled"
            keyExtractor={keyExtractor ?? ((item) => String(item.value))}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pickerRow}
                onPress={() => onSelect(item)}
              >
                <Text style={styles.pickerLabel}>{item.label}</Text>
                {item.value === selectedValue && (
                  <Text style={styles.pickerCheck}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyPicker}>
                <Text style={styles.emptyPickerText}>{emptyText}</Text>
              </View>
            }
          />
        </ContentWrapper>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  list: {
    flex: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.button,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  pickerLabel: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textPrimary,
  },
  pickerCheck: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bodyBold,
    color: colors.primary,
  },
  emptyPicker: { padding: spacing.xl, alignItems: 'center' },
  emptyPickerText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textPlaceholder,
  },
});
