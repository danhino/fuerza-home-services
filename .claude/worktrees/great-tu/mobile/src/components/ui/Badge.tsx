/**
 * Badge — Small pill/chip for status and category indicators.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { Theme } from '../../constants/Theme';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
    /** Badge text */
    label: string;
    /** Visual variant */
    variant?: BadgeVariant;
    /** Size */
    size?: BadgeSize;
}

// ─── Variant Styles ──────────────────────────────────────────────────────────

const getVariantStyles = (theme: Theme, variant: BadgeVariant) => {
    const map: Record<BadgeVariant, { bg: ViewStyle; text: TextStyle }> = {
        default: {
            bg: { backgroundColor: theme.colors.backgroundTertiary },
            text: { color: theme.colors.textPrimary },
        },
        success: {
            bg: { backgroundColor: theme.colors.successLight },
            text: { color: theme.colors.successDark },
        },
        warning: {
            bg: { backgroundColor: theme.colors.warningLight },
            text: { color: theme.colors.warningDark },
        },
        error: {
            bg: { backgroundColor: theme.colors.errorLight },
            text: { color: theme.colors.errorDark },
        },
        info: {
            bg: { backgroundColor: theme.colors.infoLight },
            text: { color: theme.colors.infoDark },
        },
        outline: {
            bg: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border },
            text: { color: theme.colors.textSecondary },
        },
    };
    return map[variant];
};

// ─── Component ───────────────────────────────────────────────────────────────

export function Badge({ label, variant = 'default', size = 'sm' }: BadgeProps) {
    const theme = useTheme();
    const vs = getVariantStyles(theme, variant);

    const isSmall = size === 'sm';

    return (
        <View
            style={[
                styles.base,
                {
                    borderRadius: theme.radius.full,
                    paddingHorizontal: isSmall ? theme.spacing.sm : theme.spacing.md,
                    paddingVertical: isSmall ? 2 : theme.spacing.xs,
                },
                vs.bg,
            ]}
        >
            <Text
                style={[
                    isSmall ? theme.typography.caption : theme.typography.captionMedium,
                    vs.text,
                ]}
                numberOfLines={1}
            >
                {label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
    },
});
