import React from 'react';
import {
    TouchableOpacity,
    Text,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { colors, fonts, fontSizes, buttonStyles, spacing } from '../theme';

type ButtonVariant = 'primary' | 'destructive' | 'outline' | 'secondary';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    /** Override the screen-reader label. Defaults to `title`. Use when the
     *  visible text is an icon-only label or needs a fuller description. */
    accessibilityLabel?: string;
    /** Optional hint spoken after the label ("double-tap to submit form"). */
    accessibilityHint?: string;
}

export default function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    style,
    textStyle,
    accessibilityLabel,
    accessibilityHint,
}: ButtonProps) {
    // ── Resolve variant styles from theme tokens ──────────────────────────
    const resolveStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    container: buttonStyles.primary.container,
                    text: buttonStyles.primary.text,
                };
            case 'secondary':
            case 'outline':
                return {
                    container: buttonStyles.secondary.container,
                    text: buttonStyles.secondary.text,
                };
            case 'destructive':
                return {
                    container: {
                        ...buttonStyles.primary.container,
                        backgroundColor: colors.destructive,
                    },
                    text: buttonStyles.primary.text,
                };
        }
    };

    const variantStyles = resolveStyles();
    const sizeOverrides = sizeStyles[size];

    const txtColor = variantStyles.text.color;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? title}
            accessibilityHint={accessibilityHint}
            accessibilityState={{ disabled: disabled || loading, busy: loading }}
            style={[
                variantStyles.container,
                sizeOverrides.container,
                disabled && buttonStyles.primary.disabled,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={txtColor} size="small" />
            ) : (
                <Text
                    style={[
                        variantStyles.text,
                        sizeOverrides.text,
                        textStyle,
                    ]}
                >
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
    sm: {
        container: { paddingVertical: spacing.sm, paddingHorizontal: spacing.base },
        text: { fontSize: fontSizes.md },
    },
    md: {
        container: {},
        text: {},
    },
    lg: {
        container: { paddingVertical: spacing.base, paddingHorizontal: spacing.xl },
        text: { fontSize: fontSizes.lg },
    },
};
