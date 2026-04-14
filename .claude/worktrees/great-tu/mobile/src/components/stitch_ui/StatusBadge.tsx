import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const VARIANT_COLORS: Record<Variant, { bg: string; text: string }> = {
    success: { bg: '#E8F8EE', text: '#1B5E20' },
    warning: { bg: '#FFF3E0', text: '#E65100' },
    danger: { bg: '#FFEBEE', text: '#C62828' },
    info: { bg: '#E3F2FD', text: '#0D47A1' },
    neutral: { bg: '#F5F5F5', text: '#616161' },
};

interface StatusBadgeProps {
    label: string;
    variant?: Variant;
}

export function StatusBadge({ label, variant = 'neutral' }: StatusBadgeProps) {
    const colors = VARIANT_COLORS[variant];
    return (
        <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: Spacing.sm + 2,
        paddingVertical: Spacing.xs,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    label: {
        ...Typography.caption,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
});
