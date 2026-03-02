/**
 * Card — Surface container with shadow and optional press behavior.
 */
import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CardProps {
    /** Card content */
    children: React.ReactNode;
    /** Makes the card tappable */
    onPress?: () => void;
    /** Style override */
    style?: ViewStyle;
    /** Padding override (defaults to Layout.cardPadding) */
    padding?: number;
    /** Whether to show shadow (default true) */
    elevated?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Card({
    children,
    onPress,
    style,
    padding,
    elevated = true,
}: CardProps) {
    const theme = useTheme();

    const cardStyle: ViewStyle[] = [
        styles.base,
        {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            padding: padding ?? theme.layout.cardPadding,
            borderColor: theme.colors.borderLight,
            borderWidth: StyleSheet.hairlineWidth,
        },
        elevated && theme.shadow.card,
        style,
    ].filter(Boolean) as ViewStyle[];

    if (onPress) {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={cardStyle}
                accessibilityRole="button"
            >
                {children}
            </TouchableOpacity>
        );
    }

    return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
    base: {
        overflow: 'hidden',
    },
});
