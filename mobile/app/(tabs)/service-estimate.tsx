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
import { useStripe } from '../../src/components/PlatformStripe';
import { DisclaimerModal } from '../../src/components/DisclaimerModal';
import { t } from '../../src/i18n';

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

    const paymentMethod = useBookingStore((s) => s.paymentMethod);
    const setPaymentMethod = useBookingStore((s) => s.setPaymentMethod);
    const certificationLevel = useBookingStore((s) => s.certificationLevelSelected);
    const selectedTechnicianId = useBookingStore((s) => s.selectedTechnicianId);

    const location = useLocationStore((s) => s.location);
    const user     = useAuthStore((s) => s.user);

    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const [booking, setBooking] = useState(false);
    const [termsVisible, setTermsVisible] = useState(false);

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
        'electrical':     'ELECTRICAL',
        'plumbing':       'PLUMBING',
        'hvac':           'HVAC',
        'general':        'GENERAL_HANDYMAN',
        'appliances':     'GENERAL_HANDYMAN',
        'landscaping':    'GENERAL_HANDYMAN',
        'house_cleaning': 'HOUSE_CLEANING',
    };

    const handleBook = async () => {
        setBooking(true);
        try {
            let finalPaymentIntentId: string | null = null;

            // ── Steps 1-3: authorize card (IN_APP only — cash skips Stripe) ──
            if (paymentMethod === 'IN_APP') {
                const amountCents = Math.round(estimate.max * 100);
                const piRes = await api.post('/payments/create-payment-intent', {
                    amountCents,
                });
                const { clientSecret, paymentIntentId } = piRes.data as {
                    clientSecret: string;
                    paymentIntentId: string;
                };

                finalPaymentIntentId = paymentIntentId;

                try {
                    const { error: initError } = await initPaymentSheet({
                        paymentIntentClientSecret: clientSecret,
                        merchantDisplayName: 'Fuerza Home Services',
                    });
                    if (initError) {
                        Alert.alert('Payment error', initError.message);
                        return;
                    }

                    const { error: presentError } = await presentPaymentSheet();
                    if (presentError) {
                        if (presentError.code !== 'Canceled') {
                            Alert.alert('Payment failed', presentError.message);
                        }
                        return;
                    }
                } catch (stripeErr: any) {
                    // Expo Go — native Stripe module unavailable; skip payment in dev
                    console.log('DEV MODE: Skipping PaymentSheet', stripeErr?.message);
                    finalPaymentIntentId = 'dev-bypass';
                }
            }

            // ── Step 4: Build description & create job ─────────────────────
            const answerLines = Object.entries(answers)
                .filter(([, v]) => !v.startsWith('file://') && !v.startsWith('http'))
                .map(([, v]) => v)
                .join(', ');
            const description = `${service.name}: ${answerLines}`;

            const trade = CATEGORY_TO_TRADE[service.category] ?? 'GENERAL_HANDYMAN';

            const formData = new FormData();
            formData.append('trade', trade);
            formData.append('description', description);
            formData.append('address', (user as any)?.address ?? 'Address on file');
            formData.append('lat', String(location?.coords.latitude ?? 0));
            formData.append('lng', String(location?.coords.longitude ?? 0));
            formData.append('estimateLow', String(estimate.min));
            formData.append('estimateHigh', String(estimate.max));
            formData.append('serviceId', serviceId ?? '');
            formData.append('paymentMethod', paymentMethod);
            formData.append('certificationLevel', certificationLevel ?? 'CERTIFIED');
            if (selectedTechnicianId) formData.append('technicianId', selectedTechnicianId);
            if (finalPaymentIntentId) formData.append('paymentIntentId', finalPaymentIntentId);

            const photoUris = Object.values(answers).filter(
                (v) => v.startsWith('file://') || v.startsWith('content://')
            );
            photoUris.forEach((uri, index) => {
                const filename = uri.split('/').pop() ?? `photo${index}.jpg`;
                formData.append('photos', {
                    uri,
                    name: filename,
                    type: 'image/jpeg',
                } as any);
            });

            const res = await api.post('/jobs', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // ── Step 5: Navigate to confirmation ──────────────────────────
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

                {/* ── Payment method selector ── */}
                <Text style={styles.payMethodTitle}>{t('payment.methodTitle')}</Text>

                <TouchableOpacity
                    style={[styles.payCard, paymentMethod === 'IN_APP' && styles.payCardSelected]}
                    onPress={() => setPaymentMethod('IN_APP')}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons
                        name="credit-card"
                        size={22}
                        color={paymentMethod === 'IN_APP' ? FZ.orange : FZ.muted}
                    />
                    <View style={styles.payCardBody}>
                        <View style={styles.payCardTitleRow}>
                            <Text style={styles.payCardTitle}>{t('payment.inApp')}</Text>
                            <View style={styles.popularBadge}>
                                <Text style={styles.popularBadgeText}>{t('payment.mostPopular')}</Text>
                            </View>
                        </View>
                        <Text style={styles.payCardDesc}>{t('payment.inAppDesc')}</Text>
                    </View>
                    <MaterialCommunityIcons
                        name={paymentMethod === 'IN_APP' ? 'radiobox-marked' : 'radiobox-blank'}
                        size={20}
                        color={paymentMethod === 'IN_APP' ? FZ.orange : FZ.border}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.payCard, paymentMethod === 'CASH' && styles.payCardSelected]}
                    onPress={() => setPaymentMethod('CASH')}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons
                        name="cash"
                        size={22}
                        color={paymentMethod === 'CASH' ? FZ.orange : FZ.muted}
                    />
                    <View style={styles.payCardBody}>
                        <Text style={styles.payCardTitle}>{t('payment.cash')}</Text>
                        <Text style={styles.payCardDesc}>{t('payment.cashDesc')}</Text>
                    </View>
                    <MaterialCommunityIcons
                        name={paymentMethod === 'CASH' ? 'radiobox-marked' : 'radiobox-blank'}
                        size={20}
                        color={paymentMethod === 'CASH' ? FZ.orange : FZ.border}
                    />
                </TouchableOpacity>

                {/* ── Guarantee badge ── */}
                <View style={styles.guaranteeBadge}>
                    <MaterialCommunityIcons name="shield-check" size={18} color={FZ.green} />
                    <Text style={styles.guaranteeText}>
                        No payment until job is complete
                    </Text>
                </View>

                {/* ── Compact disclaimer reminder ── */}
                <View style={styles.reminderBox}>
                    <Text style={styles.reminderText}>
                        {paymentMethod === 'IN_APP'
                            ? t('payment.authNote', { amount: estimate.max.toFixed(2) })
                            : t('payment.cashNote')}
                    </Text>
                    <TouchableOpacity onPress={() => setTermsVisible(true)} activeOpacity={0.7}>
                        <Text style={styles.viewTermsLink}>{t('payment.viewTerms')}</Text>
                    </TouchableOpacity>
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

            {/* ── Full terms modal ── */}
            <DisclaimerModal
                visible={termsVisible}
                certificationLevel={certificationLevel ?? 'CERTIFIED'}
                onAccept={() => setTermsVisible(false)}
                onDecline={() => setTermsVisible(false)}
            />
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
    // Payment method selector
    payMethodTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: FZ.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 4,
    },
    payCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: FZ.card,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: FZ.border,
        padding: 14,
    },
    payCardSelected: {
        borderColor: FZ.orange,
        backgroundColor: FZ.orangeLight,
    },
    payCardBody: {
        flex: 1,
        gap: 2,
    },
    payCardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    payCardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: FZ.text,
    },
    payCardDesc: {
        fontSize: 11,
        color: FZ.muted,
        lineHeight: 15,
    },
    popularBadge: {
        backgroundColor: FZ.green,
        borderRadius: 8,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    popularBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#ffffff',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },

    // Disclaimer reminder
    reminderBox: {
        backgroundColor: '#fef8ec',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#f6dfb2',
        padding: 12,
        gap: 6,
    },
    reminderText: {
        fontSize: 11,
        color: '#8a6116',
        lineHeight: 16,
    },
    viewTermsLink: {
        fontSize: 11,
        fontWeight: '700',
        color: FZ.orangeDark,
        textDecorationLine: 'underline',
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
