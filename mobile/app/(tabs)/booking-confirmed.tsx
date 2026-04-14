/**
 * Screen 5 — Booking Confirmed
 *
 * Final confirmation screen shown after a successful booking.
 * "Book Another Service" resets the flow and navigates back to CategorySelectScreen.
 * Progress bar at 100%.
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getServiceById } from '../../src/data/servicesCatalog';
import { useBookingStore } from '../../src/store/useBookingStore';
import { ProgressBar } from './request';

// ─── Design tokens ────────────────────────────────────────────────────────────

const FZ = {
    navy:        '#0f2240',
    orange:      '#f57c20',
    orangeLight: '#fff3ea',
    bg:          '#f7f8fa',
    card:        '#ffffff',
    border:      'rgba(0,0,0,0.08)',
    text:        '#111827',
    muted:       '#6b7280',
    green:       '#12895e',
    greenLight:  '#e8f7f2',
} as const;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BookingConfirmedScreen() {
    const router = useRouter();
    const { serviceId } = useLocalSearchParams<{ serviceId: string }>();

    const estimate = useBookingStore((s) => s.estimate);
    const reset    = useBookingStore((s) => s.reset);

    const service = getServiceById(serviceId ?? '');

    const handleBookAnother = () => {
        reset();
        // Navigate back to the Request tab (CategorySelectScreen)
        router.replace('/(tabs)/request');
    };

    const handleViewJobs = () => {
        reset();
        router.replace('/(tabs)/jobs');
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Booking Confirmed</Text>
                <Text style={styles.headerSub}>We'll match you with a nearby pro</Text>
            </View>
            <ProgressBar step={5} />

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Checkmark ── */}
                <View style={styles.iconWrap}>
                    <Text style={styles.checkIcon}>✅</Text>
                </View>

                {/* ── Heading ── */}
                <Text style={styles.heading}>You're booked!</Text>
                <Text style={styles.subheading}>
                    A technician will be dispatched shortly. You'll get a notification when one is matched.
                </Text>

                {/* ── Summary card ── */}
                {service && (
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>Booking Summary</Text>

                        <View style={styles.summaryRow}>
                            <View style={styles.summaryIconWrap}>
                                <Text style={styles.summaryIcon}>{service.icon}</Text>
                            </View>
                            <View style={styles.summaryBody}>
                                <Text style={styles.summaryServiceName}>{service.name}</Text>
                                {estimate && (
                                    <Text style={styles.summaryEstimate}>
                                        ${estimate.min} – ${estimate.max} estimate
                                    </Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.summaryDivider} />

                        <View style={styles.summaryFeeLine}>
                            <MaterialCommunityIcons name="shield-check" size={16} color={FZ.green} />
                            <Text style={styles.summaryFeeText}>
                                $0 platform fee until job is complete
                            </Text>
                        </View>
                    </View>
                )}

                {/* ── View Jobs CTA ── */}
                <TouchableOpacity
                    style={styles.viewJobsBtn}
                    onPress={handleViewJobs}
                    activeOpacity={0.85}
                >
                    <MaterialCommunityIcons name="briefcase-outline" size={18} color={FZ.navy} />
                    <Text style={styles.viewJobsText}>View My Jobs</Text>
                </TouchableOpacity>

                {/* ── Book Another CTA ── */}
                <TouchableOpacity
                    style={styles.bookAnotherBtn}
                    onPress={handleBookAnother}
                    activeOpacity={0.85}
                >
                    <Text style={styles.bookAnotherText}>Book Another Service</Text>
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
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 14,
        alignItems: 'center',
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
        gap: 16,
        alignItems: 'center',
    },
    // Checkmark
    iconWrap: {
        marginTop: 16,
        marginBottom: 4,
    },
    checkIcon: {
        fontSize: 52,
    },
    // Heading
    heading: {
        fontSize: 26,
        fontWeight: '700',
        color: FZ.text,
        textAlign: 'center',
    },
    subheading: {
        fontSize: 14,
        color: FZ.muted,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 10,
    },
    // Summary card
    summaryCard: {
        backgroundColor: FZ.card,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: FZ.border,
        padding: 16,
        width: '100%',
        gap: 12,
    },
    summaryTitle: {
        fontSize: 11,
        fontWeight: '600',
        color: FZ.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    summaryIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: FZ.orangeLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryIcon: {
        fontSize: 22,
    },
    summaryBody: {
        flex: 1,
        gap: 2,
    },
    summaryServiceName: {
        fontSize: 15,
        fontWeight: '600',
        color: FZ.text,
    },
    summaryEstimate: {
        fontSize: 13,
        color: FZ.muted,
    },
    summaryDivider: {
        height: 1,
        backgroundColor: FZ.border,
    },
    summaryFeeLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    summaryFeeText: {
        fontSize: 13,
        color: FZ.green,
        fontWeight: '600',
    },
    // Buttons
    viewJobsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: FZ.navy,
        paddingVertical: 13,
        justifyContent: 'center',
    },
    viewJobsText: {
        color: FZ.navy,
        fontSize: 15,
        fontWeight: '600',
    },
    bookAnotherBtn: {
        width: '100%',
        backgroundColor: FZ.orange,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
    },
    bookAnotherText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
});
