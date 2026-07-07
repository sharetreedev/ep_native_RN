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
  KeyboardAvoidingView,
  Platform,
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
  /** Show a search field above the list that filters by label. Default false. */
  searchable?: boolean;
  /** Placeholder for the search field when `searchable`. */
  searchPlaceholder?: string;
  /**
   * Optional right-aligned content per row (e.g. a dial code), rendered before
   * the selected-row checkmark.
   */
  renderTrailing?: (item: T) => React.ReactNode;
  /**
   * Text a row is matched against when `searchable`. Defaults to the label.
   * Override to search across extra fields (e.g. dial code + ISO).
   */
  getSearchText?: (item: T) => string;
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
  renderTrailing,
  getSearchText,
}: ModalPickerProps<T>) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [search, setSearch] = useState('');

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

  // Clear the query whenever the sheet closes so it reopens fresh.
  useEffect(() => {
    if (!visible) setSearch('');
  }, [visible]);

  const filteredData = useMemo(() => {
    if (!searchable) return data;
    const query = search.trim().toLowerCase();
    if (!query) return data;
    const textOf = getSearchText ?? ((item: T) => item.label);
    return data.filter((item) => textOf(item).toLowerCase().includes(query));
  }, [searchable, search, data, getSearchText]);

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
  const contentStyle = useFadeSlide
    ? [styles.pickerContainer, { maxHeight, transform: [{ translateY: slideTranslate }] }]
    : [styles.pickerContainer, { maxHeight }];

  return (
    <Modal
      visible={visible}
      transparent
      animationType={modalAnimationType}
      onRequestClose={handleDismiss}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Full-bleed dismiss layer: a tap anywhere outside the sheet closes it. */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleDismiss}
        />
        {/* Claim touches so taps inside the sheet (padding, gaps, empty list
            area) don't bubble to the dismiss layer and close it mid-selection. */}
        <ContentWrapper style={contentStyle} onStartShouldSetResponder={() => true}>
          {searchable && (
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textPlaceholder}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              accessibilityLabel={searchPlaceholder}
              clearButtonMode="while-editing"
            />
          )}
          <FlatList
            data={filteredData}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            keyExtractor={keyExtractor ?? ((item) => String(item.value))}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pickerRow}
                onPress={() => onSelect(item)}
              >
                <Text style={styles.pickerLabel}>{item.label}</Text>
                <View style={styles.pickerRowRight}>
                  {renderTrailing?.(item)}
                  {String(item.value) === String(selectedValue) && (
                    <Text style={styles.pickerCheck}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyPicker}>
                <Text style={styles.emptyPickerText}>
                  {searchable && search.trim() ? 'No matches' : emptyText}
                </Text>
              </View>
            }
          />
        </ContentWrapper>
      </KeyboardAvoidingView>
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
  searchInput: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textPrimary,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  pickerRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pickerLabel: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    flexShrink: 1,
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
