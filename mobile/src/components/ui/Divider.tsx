/**
 * Divider — Horizontal rule with optional center label.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DividerProps {
    /** Optional label displayed in the center of the divider */
    label?: string;
    /** Style override */
    style?: ViewStyle;
    /** Vertical spacing around divider */
    spacing?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Divider({ label, style, spacing: spacingProp }: DividerProps) {
    const theme = useTheme();
    const verticalSpace = spacingProp ?? theme.spacing.lg;

    if (!label) {
        return (
            <View
                style={[
                    styles.line,
                    {
                        backgroundColor: theme.colors.divider,
                        marginVertical: verticalSpace,
                    },
                    style,
                ]}
            />
        );
    }

    return (
        <View style={[styles.container, { marginVertical: verticalSpace }, style]}>
            <View style={[styles.line, styles.flex, { backgroundColor: theme.colors.divider }]} />
            <Text
                style={[
                    theme.typography.caption,
                    {
                        color: theme.colors.textTertiary,
                        marginHorizontal: theme.spacing.md,
                    },
                ]}
            >
                {label}
            </Text>
            <View style={[styles.line, styles.flex, { backgroundColor: theme.colors.divider }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    line: {
        height: StyleSheet.hairlineWidth,
    },
    flex: {
        flex: 1,
    },
});
