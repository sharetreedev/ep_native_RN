import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
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
  children,
}: BottomSheetProps) {
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
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          {showHandle && <View style={styles.handle} />}
          {title && <Text style={styles.title}>{title}</Text>}
          {children}
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
