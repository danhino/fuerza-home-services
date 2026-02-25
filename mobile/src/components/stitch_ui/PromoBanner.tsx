import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../constants/Typography';
import { Spacing, Radius, Elevation } from '../../constants/Spacing';
import { Brand } from '../../constants/Colors';

interface PromoBannerProps {
    title: string;
    description: string;
    ctaLabel?: string;
    onPress?: () => void;
}

export function PromoBanner({ title, description, ctaLabel, onPress }: PromoBannerProps) {
    return (
        <TouchableOpacity activeOpacity={0.9} onPress={onPress} disabled={!onPress}>
            <LinearGradient
                colors={[Brand.primary, '#1A5FB4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.banner, Elevation.medium]}
            >
                <View style={styles.textBlock}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.description}>{description}</Text>
                    {ctaLabel && (
                        <View style={styles.ctaRow}>
                            <Text style={styles.ctaText}>{ctaLabel}</Text>
                            <Ionicons name="arrow-forward" size={14} color="#fff" />
                        </View>
                    )}
                </View>
                <Ionicons name="pricetag" size={40} color="rgba(255,255,255,0.25)" />
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    banner: {
        borderRadius: Radius.lg,
        padding: Spacing.cardPadding,
        flexDirection: 'row',
        alignItems: 'center',
    },
    textBlock: { flex: 1 },
    title: {
        ...Typography.titleLg,
        color: '#fff',
        marginBottom: 4,
    },
    description: {
        ...Typography.bodySm,
        color: 'rgba(255,255,255,0.85)',
    },
    ctaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.sm,
        gap: 4,
    },
    ctaText: {
        ...Typography.button,
        color: '#fff',
        fontSize: 14,
    },
});
