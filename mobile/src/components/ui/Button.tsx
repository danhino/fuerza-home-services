/**
 * Button — Primary CTA and action component.
 *
 * Variants: primary (orange fill), secondary (outline), ghost (text-only), destructive (red).
 * Sizes: sm, md, lg.
 */
import React from 'react';
import {
    TouchableOpacity,
    Text,
    ActivityIndicator,
    StyleSheet,
    ViewStyle,
    TextStyle,
    View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { Theme } from '../../constants/Theme';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
    /** Button label text */
    label: string;
    /** Press handler */
    onPress: () => void;
    /** Visual variant */
    variant?: ButtonVariant;
    /** Size preset */
    size?: ButtonSize;
    /** Shows spinner and disables press */
    loading?: boolean;
    /** Disables the button */
    disabled?: boolean;
    /** Icon element rendered before label */
    leftIcon?: React.ReactNode;
    /** Icon element rendered after label */
    rightIcon?: React.ReactNode;
    /** Optional style override */
    style?: ViewStyle;
}

// ─── Size Presets ────────────────────────────────────────────────────────────

const sizeStyles = (theme: Theme) => ({
    sm: {
        container: {
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.lg,
            borderRadius: theme.radius.sm,
            minHeight: 36,
        } as ViewStyle,
        text: {
            ...theme.typography.label,
        } as TextStyle,
        spinner: 16,
    },
    md: {
        container: {
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
            borderRadius: theme.radius.md,
            minHeight: 48,
        } as ViewStyle,
        text: {
            ...theme.typography.buttonSm,
        } as TextStyle,
        spinner: 18,
    },
    lg: {
        container: {
            paddingVertical: theme.spacing.lg,
            paddingHorizontal: theme.spacing['2xl'],
            borderRadius: theme.radius.md,
            minHeight: 56,
        } as ViewStyle,
        text: {
            ...theme.typography.buttonLg,
        } as TextStyle,
        spinner: 20,
    },
});

// ─── Variant Colors ──────────────────────────────────────────────────────────

const variantStyles = (theme: Theme, disabled: boolean) => ({
    primary: {
        container: {
            backgroundColor: disabled ? theme.colors.accentDisabled : theme.colors.accent,
        } as ViewStyle,
        text: {
            color: theme.colors.textOnAccent,
        } as TextStyle,
        spinnerColor: theme.colors.textOnAccent,
    },
    secondary: {
        container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: disabled ? theme.colors.border : theme.colors.accent,
        } as ViewStyle,
        text: {
            color: disabled ? theme.colors.textDisabled : theme.colors.accent,
        } as TextStyle,
        spinnerColor: theme.colors.accent,
    },
    ghost: {
        container: {
            backgroundColor: 'transparent',
        } as ViewStyle,
        text: {
            color: disabled ? theme.colors.textDisabled : theme.colors.accent,
        } as TextStyle,
        spinnerColor: theme.colors.accent,
    },
    destructive: {
        container: {
            backgroundColor: disabled ? theme.colors.errorLight : theme.colors.error,
        } as ViewStyle,
        text: {
            color: theme.colors.textOnAccent,
        } as TextStyle,
        spinnerColor: theme.colors.textOnAccent,
    },
});

// ─── Component ───────────────────────────────────────────────────────────────

export function Button({
    label,
    onPress,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    style,
}: ButtonProps) {
    const theme = useTheme();
    const isDisabled = disabled || loading;
    const sizes = sizeStyles(theme)[size];
    const variants = variantStyles(theme, isDisabled)[variant];

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.7}
            style={[
                styles.base,
                sizes.container,
                variants.container,
                isDisabled && styles.disabled,
                style,
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: isDisabled }}
            accessibilityLabel={label}
        >
            {loading ? (
                <ActivityIndicator size={sizes.spinner} color={variants.spinnerColor} />
            ) : (
                <View style={styles.content}>
                    {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
                    <Text style={[sizes.text, variants.text]} numberOfLines={1}>
                        {label}
                    </Text>
                    {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconLeft: {
        marginRight: 8,
    },
    iconRight: {
        marginLeft: 8,
    },
    disabled: {
        opacity: 0.6,
    },
});
