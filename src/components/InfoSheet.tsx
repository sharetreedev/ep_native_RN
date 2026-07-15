import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Info, X, type LucideIcon } from 'lucide-react-native';
import BottomSheet from './BottomSheet';
import { colors, fonts, fontSizes, spacing } from '../theme';

interface InfoSheetProps {
    visible: boolean;
    onDismiss: () => void;
    /** Heading shown at the top of the sheet. */
    title: string;
    /**
     * Body copy. A single string is split into paragraphs on blank lines; an
     * array renders one paragraph per entry. For richer content pass `children`
     * instead (takes precedence over `body`).
     */
    body?: string | string[];
    children?: React.ReactNode;
    /** Leading icon shown in the header. Defaults to the Info glyph. */
    icon?: LucideIcon;
}

/**
 * Reusable feature-info popup.
 *
 * A bottom sheet with a leading icon, a close (X), a heading and body copy —
 * the app's default way to explain a feature, surface instructions, or give
 * extra context, in place of a native alert. Content scrolls if it would
 * otherwise overflow (e.g. at large accessibility font sizes).
 */
export default function InfoSheet({
    visible,
    onDismiss,
    title,
    body,
    children,
    icon: Icon = Info,
}: InfoSheetProps) {
    const paragraphs =
        typeof body === 'string'
            ? body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
            : Array.isArray(body)
              ? body
              : [];

    return (
        <BottomSheet visible={visible} onDismiss={onDismiss} showHandle={false} scrollable>
            <View style={styles.header}>
                <Icon color={colors.primary} size={40} />
                <TouchableOpacity
                    onPress={onDismiss}
                    style={styles.closeButton}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <X color={colors.textMuted} size={24} />
                </TouchableOpacity>
            </View>
            <Text style={styles.title}>{title}</Text>
            {children ??
                paragraphs.map((paragraph, i) => (
                    <Text key={i} style={styles.body}>
                        {paragraph}
                    </Text>
                ))}
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.base,
    },
    closeButton: {
        padding: spacing.xs,
    },
    title: {
        fontFamily: fonts.heading,
        fontSize: fontSizes['2xl'],
        color: colors.darkForest,
        marginBottom: spacing.base,
    },
    body: {
        fontFamily: fonts.body,
        fontSize: fontSizes.base,
        color: colors.textPrimary,
        lineHeight: 24,
        marginBottom: spacing.md,
    },
});
