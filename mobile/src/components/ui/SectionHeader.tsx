/**
 * SectionHeader — Section title row with optional "See all" link.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SectionHeaderProps {
    /** Section title */
    title: string;
    /** "See all" press handler — hides the link if not provided */
    onSeeAll?: () => void;
    /** Custom label for the right link (defaults to "See all") */
    actionLabel?: string;
    /** Style override */
    style?: ViewStyle;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SectionHeader({
    title,
    onSeeAll,
    actionLabel = 'See all',
    style,
}: SectionHeaderProps) {
    const theme = useTheme();

    return (
        <View style={[styles.container, { marginBottom: theme.spacing.md }, style]}>
            <Text
                style={[
                    theme.typography.headingSm,
                    { color: theme.colors.textPrimary, flex: 1 },
                ]}
                numberOfLines={1}
            >
                {title}
            </Text>

            {onSeeAll && (
                <TouchableOpacity
                    onPress={onSeeAll}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={actionLabel}
                >
                    <Text
                        style={[
                            theme.typography.label,
                            { color: theme.colors.accent },
                        ]}
                    >
                        {actionLabel}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
});
