import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../constants/Typography';
import { Spacing, Elevation, Radius } from '../../constants/Spacing';
import { Palette, Brand } from '../../constants/Colors';

interface ProCardProps {
    name: string;
    specialty: string;
    rating?: number;
    avatarColor?: string;
}

export function ProCard({ name, specialty, rating, avatarColor = Brand.primary }: ProCardProps) {
    return (
        <View style={[styles.card, Elevation.low]}>
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                <Ionicons name="person" size={24} color="#fff" />
            </View>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={styles.specialty} numberOfLines={1}>{specialty}</Text>
            {rating != null && (
                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#FF9500" />
                    <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: Radius.lg,
        padding: Spacing.md,
        marginRight: Spacing.md,
        width: 120,
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    name: {
        ...Typography.titleSm,
        color: Palette.textPrimary,
        marginBottom: 2,
        textAlign: 'center',
    },
    specialty: {
        ...Typography.caption,
        color: Palette.textSecondary,
        textAlign: 'center',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.xs,
        gap: 3,
    },
    ratingText: {
        ...Typography.caption,
        color: Palette.textSecondary,
    },
});
