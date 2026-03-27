import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { TriangleAlert } from 'lucide-react-native';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../theme';

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  loading?: boolean;
  /** 'center' shows a centered card, 'bottom' shows a bottom sheet */
  variant?: 'center' | 'bottom';
  /** Optional icon element to show above the title (center variant) or left of title (bottom variant) */
  icon?: React.ReactNode;
}

export default function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  loading = false,
  variant = 'center',
  icon,
}: ConfirmModalProps) {
  const confirmColor = destructive ? colors.destructive : colors.primary;

  if (variant === 'bottom') {
    return (
      <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
        <TouchableOpacity style={styles.overlayBottom} activeOpacity={1} onPress={onClose}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetCard}>
              <View style={styles.sheetHandle} />

              {icon && <View style={styles.sheetIcon}>{icon}</View>}
              <Text style={styles.sheetTitle}>{title}</Text>
              {message ? <Text style={styles.sheetMessage}>{message}</Text> : null}

              <View style={styles.sheetButtons}>
                <TouchableOpacity style={styles.sheetCancel} onPress={onClose} disabled={loading}>
                  <Text style={styles.sheetCancelText}>{cancelText}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sheetConfirm, { backgroundColor: confirmColor }, loading && styles.disabled]}
                  onPress={onConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.textOnPrimary} />
                  ) : (
                    <Text style={styles.sheetConfirmText}>{confirmText}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    );
  }

  // Center variant
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlayCenter} activeOpacity={1} onPress={onClose}>
        <TouchableWithoutFeedback>
          <View style={styles.centerCard}>
            {icon ? (
              <View style={[styles.iconWrap, destructive && styles.iconWrapDestructive]}>
                {icon}
              </View>
            ) : destructive ? (
              <View style={[styles.iconWrap, styles.iconWrapDestructive]}>
                <TriangleAlert color={colors.destructive} size={24} />
              </View>
            ) : null}

            <Text style={styles.centerTitle}>{title}</Text>
            {message ? <Text style={styles.centerMessage}>{message}</Text> : null}

            <View style={styles.centerButtons}>
              <TouchableOpacity
                style={[styles.centerButton, styles.centerCancel]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.centerCancelText}>{cancelText}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.centerButton, { backgroundColor: confirmColor }, loading && styles.disabled]}
                onPress={onConfirm}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
                ) : (
                  <Text style={styles.centerConfirmText}>{confirmText}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // ─── Shared ──────────────────────────────────
  disabled: {
    opacity: 0.5,
  },

  // ─── Center variant ──────────────────────────
  overlayCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing['2xl'],
  },
  centerCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  iconWrapDestructive: {
    backgroundColor: colors.destructiveLight,
  },
  centerTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  centerMessage: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  centerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.sm,
  },
  centerButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCancel: {
    backgroundColor: colors.surfaceMuted,
  },
  centerCancelText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
  centerConfirmText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textOnPrimary,
  },

  // ─── Bottom variant ──────────────────────────
  overlayBottom: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheetCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.md,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sheetIcon: {
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sheetMessage: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  sheetButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sheetCancel: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.button,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
  sheetConfirm: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetConfirmText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textOnPrimary,
  },
});
