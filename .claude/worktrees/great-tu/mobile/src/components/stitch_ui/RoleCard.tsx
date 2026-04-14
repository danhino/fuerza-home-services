import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
    StitchColors,
    StitchTypography,
    StitchSpacing,
    StitchRadius,
    StitchShadow,
} from '../../theme/stitchTokens';

interface RoleCardProps {
    /** Remote image URL for the hero banner */
    imageUri: string;
    /** Short label inside the badge chip, e.g. "HOMEOWNER" */
    badgeLabel: string;
    /** Badge colour variant */
    badgeVariant: 'primary' | 'emerald';
    /** Main heading, e.g. "I need a service" */
    title: string;
    /** Secondary description text */
    description: string;
    /** onPress handler */
    onPress: () => void;
}

/**
 * Vertical role-selection card matching the Stitch
 * "Role Selection Launch Screen" frame 1 : 1.
 *
 * Structure (from Stitch HTML):
 *   button.rounded-xl.border.shadow-sm
 *     div.h-40.bg-cover          ← hero image
 *       div.gradient-overlay     ← from-black/60
 *     div.p-5
 *       row: badge + arrow
 *       h3:  title
 *       p:   description
 */
export default function RoleCard({
    imageUri,
    badgeLabel,
    badgeVariant,
    title,
    description,
    onPress,
}: RoleCardProps) {
    const badgeBg =
        badgeVariant === 'primary'
            ? StitchColors.primaryTint
            : StitchColors.emerald100;
    const badgeText =
        badgeVariant === 'primary'
            ? StitchColors.primary
            : StitchColors.emerald700;

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.96}
            onPress={onPress}
        >
            {/* Hero image */}
            <View style={styles.imageWrapper}>
                <Image
                    source={{ uri: imageUri }}
                    style={styles.heroImage}
                    resizeMode="cover"
                />
                {/* Gradient overlay: from-black/60 via-transparent to-transparent */}
                <LinearGradient
                    colors={['transparent', 'transparent', 'rgba(0,0,0,0.60)']}
                    locations={[0, 0.4, 1]}
                    style={StyleSheet.absoluteFillObject}
                />
            </View>

            {/* Text area */}
            <View style={styles.textArea}>
                {/* Badge row */}
                <View style={styles.badgeRow}>
                    <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.badgeText, { color: badgeText }]}>
                            {badgeLabel}
                        </Text>
                    </View>
                    <Ionicons
                        name="arrow-forward"
                        size={22}
                        color={StitchColors.primary}
                    />
                </View>

                {/* Title */}
                <Text style={styles.title}>{title}</Text>

                {/* Description */}
                <Text style={styles.description}>{description}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: StitchRadius.xl,
        borderWidth: 1,
        borderColor: StitchColors.border,
        backgroundColor: StitchColors.surface,
        overflow: 'hidden',
        ...StitchShadow.sm,
    },
    imageWrapper: {
        height: 160,                        // h-40 = 10rem = 160px
        width: '100%',
        backgroundColor: '#e2e8f0',        // fallback while loading
    },
    heroImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    textArea: {
        padding: StitchSpacing.cardPadding, // p-5 = 20
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    badge: {
        borderRadius: StitchRadius.full,
        paddingHorizontal: 10,              // px-2.5
        paddingVertical: 2,                 // py-0.5
    },
    badgeText: {
        ...StitchTypography.badge,
    },
    title: {
        ...StitchTypography.h3,
        marginTop: StitchSpacing.mt2,       // mt-2 = 8
    },
    description: {
        ...StitchTypography.sm,
        marginTop: StitchSpacing.mt1,       // mt-1 = 4
    },
});
