import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { Palette } from '../../constants/Colors';
import { Elevation } from '../../constants/Spacing';

interface CategoryChipProps {
    icon: string;
    label: string;
    color: string;
    isSelected?: boolean;
    onPress?: () => void;
}

export function CategoryChip({ icon, label, color, isSelected = false, onPress }: CategoryChipProps) {
    return (
        <TouchableOpacity
            style={[
                styles.chip,
                isSelected && { borderColor: color, borderWidth: 2 },
                Elevation.low,
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={[styles.iconCircle, { backgroundColor: `${color}18` }]}>
                <Ionicons name={icon as any} size={20} color={color} />
            </View>
            <Text style={styles.label} numberOfLines={1}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    chip: {
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        marginRight: Spacing.sm,
        width: 80,
        borderWidth: 1,
        borderColor: Palette.border,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    label: {
        ...Typography.caption,
        color: Palette.textPrimary,
        textAlign: 'center',
    },
});
