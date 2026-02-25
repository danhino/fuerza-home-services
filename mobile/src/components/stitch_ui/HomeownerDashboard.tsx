/**
 * HomeownerDashboard.tsx
 *
 * Presentational component matching Stitch Screen 13fe14c8 — "Homeowner Dashboard".
 * Pure UI: all data and callbacks provided via props, zero internal hooks.
 *
 * Stitch layout (780 × 2268 @2x mobile):
 *   ┌─ GreetingHeader ("Good Morning", "Alex Johnson") ──┐
 *   │  Section: Categories (horizontal chip scroll)       │
 *   │    Plumbing · Electrical · HVAC · Pool Service      │
 *   │  Section: Nearby Pros (horizontal pro cards)        │
 *   │    Marco Rossi · Sarah Chen · David Miller          │
 *   │  PromoBanner ("Save 15% on First Task")             │
 *   └─ Bottom Tab Bar (handled by Expo Tabs, not here) ──┘
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GreetingHeader } from './GreetingHeader';
import { CategoryChip } from './CategoryChip';
import { ProCard } from './ProCard';
import { PromoBanner } from './PromoBanner';
import { Spacing, Elevation, Radius } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { Palette, Brand } from '../../constants/Colors';

// ── Types ──────────────────────────────────────────────────

export type TradeKey = 'PLUMBER' | 'ELECTRICIAN' | 'POOL' | 'CLEANING';

export interface TradeMeta {
    key: TradeKey;
    icon: string;
    color: string;
    label: string;
}

export interface ProInfo {
    name: string;
    specialty: string;
    rating: number;
    color: string;
}

export interface HomeownerDashboardProps {
    // Greeting
    greeting: string;
    userName: string;
    textColor: string;
    backgroundColor: string;
    cardColor: string;

    // Categories
    trades: TradeMeta[];
    selectedTrade?: TradeKey | null;
    onSelectTrade?: (key: TradeKey) => void;
    categoriesLabel: string;

    // Nearby pros
    nearbyPros: ProInfo[];
    nearbyProsLabel: string;

    // Promo
    promoTitle: string;
    promoDescription: string;
    promoCta: string;
    onPromoPress: () => void;

    // CTA
    requestServiceLabel: string;
    onRequestService: () => void;

    // Notification
    onNotificationPress?: () => void;
}

// ── Component ──────────────────────────────────────────────

export function HomeownerDashboard(props: HomeownerDashboardProps) {
    const {
        greeting,
        userName,
        textColor,
        backgroundColor,
        cardColor,
        trades,
        selectedTrade,
        onSelectTrade,
        categoriesLabel,
        nearbyPros,
        nearbyProsLabel,
        promoTitle,
        promoDescription,
        promoCta,
        onPromoPress,
        requestServiceLabel,
        onRequestService,
        onNotificationPress,
    } = props;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            {/* ── Greeting ──────────────────────────────── */}
            <GreetingHeader
                greeting={greeting}
                userName={userName}
                textColor={textColor}
                onNotificationPress={onNotificationPress}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Categories ────────────────────────── */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>
                        {categoriesLabel}
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipScroll}
                    >
                        {trades.map((trade) => (
                            <CategoryChip
                                key={trade.key}
                                icon={trade.icon}
                                label={trade.label}
                                color={trade.color}
                                isSelected={selectedTrade === trade.key}
                                onPress={() => onSelectTrade?.(trade.key)}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* ── Nearby Pros ───────────────────────── */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>
                        {nearbyProsLabel}
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipScroll}
                    >
                        {nearbyPros.map((pro) => (
                            <ProCard
                                key={pro.name}
                                name={pro.name}
                                specialty={pro.specialty}
                                rating={pro.rating}
                                avatarColor={pro.color}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* ── Promo Banner ──────────────────────── */}
                <View style={styles.promoSection}>
                    <PromoBanner
                        title={promoTitle}
                        description={promoDescription}
                        ctaLabel={promoCta}
                        onPress={onPromoPress}
                    />
                </View>

                {/* Spacer for bottom CTA */}
                <View style={{ height: 90 }} />
            </ScrollView>

            {/* ── Request Service CTA (fixed bottom) ──── */}
            <View style={[styles.bottomSheet, { backgroundColor: cardColor }]}>
                <TouchableOpacity
                    style={styles.requestButton}
                    onPress={onRequestService}
                    activeOpacity={0.85}
                >
                    <Ionicons name="add-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.requestButtonText}>{requestServiceLabel}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: Spacing.xl },

    // Sections
    section: { marginBottom: Spacing.xl },
    sectionTitle: {
        ...Typography.titleLg,
        paddingHorizontal: Spacing.screenPaddingH,
        marginBottom: Spacing.md,
    },
    chipScroll: {
        paddingHorizontal: Spacing.screenPaddingH,
    },

    // Promo
    promoSection: {
        paddingHorizontal: Spacing.screenPaddingH,
        marginBottom: Spacing.lg,
    },

    // Bottom sheet
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        padding: 16,
        paddingBottom: 32,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        ...Elevation.high,
    },
    requestButton: {
        backgroundColor: Brand.primary,
        padding: 16,
        borderRadius: Radius.lg,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    requestButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
