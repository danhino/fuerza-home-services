/**
 * Screen 4 — Price Estimate
 *
 * Displays the AI-powered price estimate with a full breakdown.
 * "Confirm & Book Now" → creates the job via API, navigates to Screen 5.
 * Progress bar at 85%.
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getServiceById } from '../../src/data/servicesCatalog';
import { useBookingStore } from '../../src/store/useBookingStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import api from '../../src/services/api';
import { ProgressBar } from './request';

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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PriceEstimateScreen() {
    const router = useRouter();
    const { serviceId } = useLocalSearchParams<{ serviceId: string }>();

    const estimate = useBookingStore((s) => s.estimate);
    const answers  = useBookingStore((s) => s.answers);
    const setJobId = useBookingStore((s) => s.setJobId);

    const location = useLocationStore((s) => s.location);
    const user     = useAuthStore((s) => s.user);

    const [booking, setBooking] = useState(false);

    const service = getServiceById(serviceId ?? '');

    if (!service || !estimate) {
        return (
            <SafeAreaView style={styles.safe} edges={['top']}>
                <Text style={{ color: FZ.muted, textAlign: 'center', marginTop: 40 }}>
                    Estimate unavailable. Please go back and try again.
                </Text>
            </SafeAreaView>
        );
    }

    const CATEGORY_TO_TRADE: Record<string, string> = {
        'electrical':  'ELECTRICAL',
        'plumbing':    'PLUMBING',
        'hvac':        'HVAC',
        'general':     'GENERAL_HANDYMAN',
        'appliances':  'GENERAL_HANDYMAN',
        'landscaping': 'GENERAL_HANDYMAN',
    };

    const handleBook = async () => {
        setBooking(true);
        try {
            // Build a human-readable description from answers
            const answerLines = Object.entries(answers)
                .filter(([, v]) => !v.startsWith('file://') && !v.startsWith('http'))
                .map(([, v]) => v)
                .join(', ');
            const description = `${service.name}: ${answerLines}`;

            // Collect photo URIs from answers
            const photos = Object.values(answers).filter(
                (v) => v.startsWith('file://') || v.startsWith('content://')
            );

            // TODO: Upload photos to Cloudflare R2 here and replace URIs with CDN URLs.
            // const uploadedUrls = await uploadPhotosToR2(photos);

            const trade = CATEGORY_TO_TRADE[service.category] ?? 'GENERAL_HANDYMAN';

            const res = await api.post('/jobs', {
                trade,
                description,
                address: user?.address ?? 'Address on file',
                lat: location?.coords.latitude ?? 0,
                lng: location?.coords.longitude ?? 0,
                photos,
                estimateLow: estimate.min,
                estimateHigh: estimate.max,
            });

            setJobId(res.data.id ?? 'confirmed');
            router.replace({
                pathname: '/(tabs)/booking-confirmed',
                params: { serviceId: service.id },
            });
        } catch (e: any) {
            const msg = e?.response?.data?.error ?? 'Could not complete booking. Please try again.';
            Alert.alert('Booking failed', msg);
        } finally {
            setBooking(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color="#ffffff" />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.headerTitle}>Your Estimate</Text>
                    <Text style={styles.headerSub}>{service.name}</Text>
                </View>
            </View>
            <ProgressBar step={4} />

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* ── AI badge ── */}
                <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeIcon}>✦</Text>
                    <Text style={styles.aiBadgeText}>AI Estimate Ready</Text>
                </View>

                {/* ── Price card ── */}
                <View style={styles.priceCard}>
                    <Text style={styles.priceLabel}>Estimated Range</Text>
                    <Text style={styles.priceValue}>
                        ${estimate.min} – ${estimate.max}
                    </Text>
                    <Text style={styles.priceNote}>
                        Final price confirmed after technician assesses the job
                    </Text>
                </View>

                {/* ── Breakdown ── */}
                <View style={styles.breakdownCard}>
                    <Text style={styles.breakdownTitle}>Price Breakdown</Text>
                    {estimate.breakdown.map((item, i) => (
                        <View key={i} style={[styles.breakdownRow, i > 0 && styles.breakdownRowBorder]}>
                            <Text style={styles.breakdownLabel}>{item.label}</Text>
                            <Text style={styles.breakdownValue}>
                                +${item.min}–${item.max}
                            </Text>
                        </View>
                    ))}
                    {/* Total row */}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total estimate</Text>
                        <Text style={styles.totalValue}>${estimate.min}–${estimate.max}</Text>
                    </View>
                </View>

                {/* ── Guarantee badge ── */}
                <View style={styles.guaranteeBadge}>
                    <MaterialCommunityIcons name="shield-check" size={18} color={FZ.green} />
                    <Text style={styles.guaranteeText}>
                        No payment until job is complete
                    </Text>
                </View>

                {/* ── CTA ── */}
                <TouchableOpacity
                    style={[styles.cta, booking && styles.ctaDisabled]}
                    onPress={handleBook}
                    disabled={booking}
                    activeOpacity={0.85}
                >
                    {booking ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.ctaText}>Confirm & Book Now</Text>
                    )}
                </TouchableOpacity>
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 14,
        gap: 12,
    },
    backBtn: {
        padding: 2,
    },
    headerText: {
        flex: 1,
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
        padding: 20,
        gap: 14,
        paddingBottom: 32,
    },
    // AI badge
    aiBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: FZ.navy,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    aiBadgeIcon: {
        color: FZ.orange,
        fontSize: 13,
        fontWeight: '600',
    },
    aiBadgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    // Price card
    priceCard: {
        backgroundColor: FZ.card,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: FZ.orange,
        padding: 20,
        alignItems: 'center',
        gap: 6,
    },
    priceLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: FZ.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    priceValue: {
        fontSize: 32,
        fontWeight: '700',
        color: FZ.text,
    },
    priceNote: {
        fontSize: 12,
        color: FZ.muted,
        textAlign: 'center',
        lineHeight: 17,
    },
    // Breakdown
    breakdownCard: {
        backgroundColor: FZ.card,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: FZ.border,
        padding: 16,
        gap: 0,
    },
    breakdownTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: FZ.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 9,
    },
    breakdownRowBorder: {
        borderTopWidth: 1,
        borderTopColor: FZ.border,
    },
    breakdownLabel: {
        fontSize: 13,
        color: FZ.text,
        flex: 1,
    },
    breakdownValue: {
        fontSize: 13,
        color: FZ.muted,
        fontWeight: '600',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        marginTop: 4,
        borderTopWidth: 2,
        borderTopColor: FZ.border,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: FZ.text,
    },
    totalValue: {
        fontSize: 14,
        fontWeight: '700',
        color: FZ.orange,
    },
    // Guarantee badge
    guaranteeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: FZ.greenLight,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    guaranteeText: {
        fontSize: 13,
        color: FZ.green,
        fontWeight: '600',
    },
    // CTA
    cta: {
        backgroundColor: FZ.navy,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 6,
    },
    ctaDisabled: {
        opacity: 0.5,
    },
    ctaText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
});
