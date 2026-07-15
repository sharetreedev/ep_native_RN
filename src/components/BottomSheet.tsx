import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, colors, fonts, fontSizes, spacing } from '../theme';

interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  /** Optional title rendered above the content. */
  title?: string;
  /** Show the small drag-indicator pill at the top of the sheet. Default true. */
  showHandle?: boolean;
  /** Tap on the dimmed backdrop to dismiss. Default true. */
  dismissOnBackdropPress?: boolean;
  /**
   * Cap the sheet to the available screen height and let its content scroll when
   * it would otherwise overflow. Content still fits without scrolling at normal
   * sizes; this only kicks in when tall content (e.g. large accessibility font
   * sizes) would push the sheet past the top of the screen. Default false.
   */
  scrollable?: boolean;
  children: React.ReactNode;
}

/**
 * Shared bottom-sheet primitive: dimmed backdrop fades in while the sheet
 * springs up from the bottom edge. Closing reverses both. Use for any
 * action-sheet / option-list / detail-pane modal.
 */
export default function BottomSheet({
  visible,
  onDismiss,
  title,
  showHandle = true,
  dismissOnBackdropPress = true,
  scrollable = false,
  children,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    if (!visible) return;
    fadeAnim.setValue(0);
    slideAnim.setValue(Dimensions.get('window').height);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
      }),
    ]).start();
  }, [visible, fadeAnim, slideAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.container}>
        <TouchableWithoutFeedback
          onPress={dismissOnBackdropPress ? handleClose : undefined}
        >
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.sheet,
            // Cap to the space below the top safe-area inset so a tall sheet can
            // never push its content off the top of the screen.
            scrollable && { maxHeight: Dimensions.get('window').height - insets.top - spacing.base },
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {showHandle && <View style={styles.handle} />}
          {title && <Text style={styles.title}>{title}</Text>}
          {scrollable ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.scrollContent}
            >
              {children}
            </ScrollView>
          ) : (
            children
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing['2xl'],
  },
  scrollContent: {
    paddingBottom: spacing.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.base,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
});
