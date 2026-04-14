/**
 * Screen 1 — Category Select
 *
 * Entry point for the customer service request flow.
 * Displays a 2-column grid of service categories.
 */

import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CATEGORIES, Category, getServiceCountByCategory } from '../../src/data/servicesCatalog';
import { useBookingStore } from '../../src/store/useBookingStore';

// ─── Design tokens ────────────────────────────────────────────────────────────

const FZ = {
    navy:        '#0f2240',
    orange:      '#f57c20',
    orangeLight: '#fff3ea',
    orangeDark:  '#c45e0d',
    bg:          '#f7f8fa',
    card:        '#ffffff',
    border:      'rgba(0,0,0,0.08)',
    text:        '#111827',
    muted:       '#6b7280',
    green:       '#12895e',
    greenLight:  '#e8f7f2',
} as const;

const PROGRESS_PCTS = [0, 0.15, 0.40, 0.85, 1.0];

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_W = (SCREEN_W - 24 * 2 - CARD_GAP) / 2;

// ─── Progress bar (shared across all 5 screens) ──────────────────────────────

export function ProgressBar({ step }: { step: 1 | 2 | 3 | 4 | 5 }) {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(anim, {
            toValue: PROGRESS_PCTS[step - 1],
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [step]);

    const width = anim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={progressStyles.track}>
            <Animated.View style={[progressStyles.fill, { width }]} />
        </View>
    );
}

const progressStyles = StyleSheet.create({
    track: {
        height: 3,
        backgroundColor: FZ.border,
    },
    fill: {
        height: 3,
        backgroundColor: FZ.orange,
    },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

const serviceCounts = getServiceCountByCategory();

export default function CategorySelectScreen() {
    const router = useRouter();
    const reset = useBookingStore((s) => s.reset);

    // Always reset when entering Step 1
    useEffect(() => {
        reset();
    }, []);

    const handleCategoryPress = (cat: Category) => {
        router.push({
            pathname: '/(tabs)/service-select',
            params: { categoryId: cat.id },
        });
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Book a Service</Text>
                <Text style={styles.headerSub}>What do you need help with?</Text>
            </View>
            <ProgressBar step={1} />

            {/* ── Category grid ── */}
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.grid}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={styles.card}
                            onPress={() => handleCategoryPress(cat)}
                            activeOpacity={0.75}
                        >
                            <Text style={styles.cardIcon}>{cat.icon}</Text>
                            <Text style={styles.cardName}>{cat.name}</Text>
                            <Text style={styles.cardCount}>
                                {serviceCounts[cat.id]}{' '}
                                {serviceCounts[cat.id] === 1 ? 'service' : 'services'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: FZ.bg,
    },
    header: {
        backgroundColor: FZ.navy,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 14,
    },
    headerTitle: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    headerSub: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 11,
        marginTop: 2,
    },
    scroll: {
        padding: 24,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: CARD_GAP,
    },
    card: {
        width: CARD_W,
        backgroundColor: FZ.card,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: FZ.border,
        padding: 18,
        alignItems: 'center',
        gap: 8,
    },
    cardIcon: {
        fontSize: 28,
    },
    cardName: {
        fontSize: 13,
        fontWeight: '600',
        color: FZ.text,
        textAlign: 'center',
    },
    cardCount: {
        fontSize: 11,
        color: FZ.muted,
    },
});
