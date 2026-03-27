import React, { useEffect, useRef } from 'react';
import {
  Modal,
  TouchableOpacity,
  View,
  Text,
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
}: ModalPickerProps<T>) {
  const slideAnim = useRef(new Animated.Value(0)).current;

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
  const contentStyle = useFadeSlide
    ? [styles.pickerContainer, { maxHeight, transform: [{ translateY: slideTranslate }] }]
    : [styles.pickerContainer, { maxHeight }];

  return (
    <Modal visible={visible} transparent animationType={modalAnimationType}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleDismiss}
      >
        <ContentWrapper style={contentStyle}>
          <FlatList
            data={data}
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
