/**
 * job-accepted.tsx — Customer Job Accepted Confirmation
 *
 * Shown after technician accepts the job.
 * Static confirmation screen (no live tracking).
 *
 * Route params: { jobId: string }
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useTheme } from '../../src/hooks/useTheme';
import { t, useLanguageStore } from '../../src/i18n';
import { useJobStore, Job } from '../../src/store/useJobStore';
import { Avatar } from '../../src/components/ui/Avatar';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import api from '../../src/services/api';

// ─── Constants ───────────────────────────────────────────────────────────────

const TRADE_COLOR: Record<string, string> = {
    PLUMBER: '#3B82F6',
    ELECTRICIAN: '#F59E0B',
    HVAC: '#8B5CF6',
    POOL: '#06B6D4',
    HOUSE_CLEANING: '#6B7280',
    GENERAL_HANDYMAN: '#F97316',
};

const TRADE_LABEL: Record<string, string> = {
    PLUMBER: 'home.map.plumbing',
    ELECTRICIAN: 'home.map.electrical',
    HVAC: 'home.map.hvac',
    POOL: 'home.map.pool',
    HOUSE_CLEANING: 'home.map.cleaning',
    GENERAL_HANDYMAN: 'home.map.handyman',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function JobAcceptedScreen() {
    const theme = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ jobId: string }>();
    const jobId = params.jobId;

    useLanguageStore((s) => s.language);

    const job = useJobStore((s) => s.jobs.find((j) => j.id === jobId));

    // ── State ────────────────────────────────────────────────────────────────

    const [isCancelling, setIsCancelling] = useState(false);

    // ── Derived data ─────────────────────────────────────────────────────────

    const trade = job?.trade || 'PLUMBER';
    const tradeColor = TRADE_COLOR[trade] || '#3B82F6';
    const techName = job?.technician?.user?.name || job?.technician?.user?.firstName || 'Technician';
    const techRating = job?.technician?.user?.rating || 5.0;
    const serviceFee = job?.estimate?.currentAmount || job?.estimateLow || 0;
    const address = job?.address || 'Service Address';

    // Static ETA (could be enhanced with actual calculation from backend in future)
    const estimatedArrivalText = '20–40 minutes';

    // ── Handle cancellation ──────────────────────────────────────────────────

    const handleCancel = () => {
        Alert.alert(
            t('jobAccepted.cancelTitle') || 'Cancel Request?',
            t('jobAccepted.cancelMsg') || 'Are you sure you want to cancel this service request?',
            [
                { text: t('common.no') || 'No', style: 'cancel' },
                {
                    text: t('common.yes') || 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsCancelling(true);
                            await api.put(`/jobs/${jobId}/cancel`);
                            router.replace('/(tabs)/');
                        } catch (error) {
                            Alert.alert(
                                t('common.error') || 'Error',
                                t('jobAccepted.cancelError') || 'Failed to cancel job'
                            );
                        } finally {
                            setIsCancelling(false);
                        }
                    },
                },
            ]
        );
    };

    // ── Handle message ───────────────────────────────────────────────────────

    const handleMessage = () => {
        // TODO: Implement chat navigation in Phase 3
        Alert.alert(
            'Coming Soon',
            'Direct messaging with technician will be available in Phase 3'
        );
    };

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <SafeAreaView
            style={[styles.root, { backgroundColor: theme.colors.background }]}
            edges={['top', 'left', 'right']}
        >
            {/* Header with back button */}
            <View style={[styles.header, { paddingHorizontal: theme.spacing.lg }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[theme.typography.titleMd, { color: theme.colors.textPrimary, flex: 1, textAlign: 'center' }]}>
                    {t('jobAccepted.title') || 'Technician On The Way'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Main content */}
            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingHorizontal: theme.spacing.lg, paddingBottom: Math.max(insets.bottom, theme.spacing.lg) },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Success icon */}
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.surface }]}>
                    <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
                </View>

                {/* Heading */}
                <Text style={[theme.typography.headingLg, { color: theme.colors.textPrimary, textAlign: 'center', marginTop: theme.spacing.lg }]}>
                    {t('jobAccepted.heading') || 'Your technician is on the way!'}
                </Text>

                {/* Technician card */}
                <Card
                    style={[
                        styles.techCard,
                        { marginTop: theme.spacing.xl, backgroundColor: theme.colors.surface },
                    ]}
                >
                    <View style={styles.techHeader}>
                        <Avatar name={techName} size="lg" />
                        <View style={[styles.techInfo, { marginLeft: theme.spacing.md }]}>
                            <Text style={[theme.typography.titleSm, { color: theme.colors.textPrimary }]}>
                                {techName}
                            </Text>
                            <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
                                {t(TRADE_LABEL[trade] || 'home.map.plumbing')}
                            </Text>
                            <View style={[styles.ratingRow, { marginTop: 4 }]}>
                                <Ionicons name="star" size={14} color="#F59E0B" />
                                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginLeft: 4 }]}>
                                    {techRating.toFixed(1)} ({t('jobAccepted.reviews') || 'reviews'})
                                </Text>
                            </View>
                        </View>
                    </View>
                </Card>

                {/* ETA section */}
                <View style={[styles.etaSection, { marginTop: theme.spacing.xl }]}>
                    <Ionicons name="time-outline" size={20} color={tradeColor} />
                    <View style={[styles.etaContent, { marginLeft: theme.spacing.md }]}>
                        <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
                            {t('jobAccepted.estimatedArrival') || 'Estimated Arrival'}
                        </Text>
                        <Text style={[theme.typography.titleSm, { color: theme.colors.textPrimary, marginTop: 2 }]}>
                            {estimatedArrivalText}
                        </Text>
                    </View>
                </View>

                {/* Job summary */}
                <Card
                    style={[
                        styles.summaryCard,
                        { marginTop: theme.spacing.lg, backgroundColor: theme.colors.surface },
                    ]}
                >
                    <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
                        {t('jobAccepted.jobSummary') || 'Job Summary'}
                    </Text>

                    <View style={[styles.summaryRow, { marginTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.divider, paddingTop: theme.spacing.md }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
                                {t('jobAccepted.serviceType') || 'Service Type'}
                            </Text>
                            <Text style={[theme.typography.bodySm, { color: theme.colors.textPrimary, marginTop: 4 }]}>
                                {t(TRADE_LABEL[trade] || 'home.map.plumbing')}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.summaryRow, { marginTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.divider, paddingTop: theme.spacing.md }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
                                {t('jobAccepted.address') || 'Service Address'}
                            </Text>
                            <Text style={[theme.typography.bodySm, { color: theme.colors.textPrimary, marginTop: 4 }]} numberOfLines={2}>
                                {address}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.summaryRow, { marginTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.divider, paddingTop: theme.spacing.md }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
                                {t('jobAccepted.estimate') || 'Estimate'}
                            </Text>
                        </View>
                        <Text style={[theme.typography.titleSm, { color: theme.colors.accent }]}>
                            ${serviceFee.toFixed(2)}
                        </Text>
                    </View>
                </Card>

                {/* Help/Problem link */}
                <TouchableOpacity style={{ marginTop: theme.spacing.lg, alignSelf: 'center' }}>
                    <Text style={[theme.typography.bodySm, { color: theme.colors.error, textDecorationLine: 'underline' }]}>
                        {t('jobAccepted.problemLink') || "There's a problem"}
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* CTA buttons at bottom */}
            <View
                style={[
                    styles.ctaContainer,
                    {
                        paddingHorizontal: theme.spacing.lg,
                        paddingBottom: Math.max(insets.bottom + 12, theme.spacing.lg),
                        backgroundColor: theme.colors.background,
                    },
                ]}
            >
                <TouchableOpacity
                    style={[
                        styles.ctaButton,
                        {
                            backgroundColor: theme.colors.accent,
                            borderRadius: theme.radius.md,
                        },
                    ]}
                    onPress={handleMessage}
                >
                    <Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" />
                    <Text
                        style={[
                            theme.typography.buttonMd,
                            { color: '#FFFFFF', marginLeft: theme.spacing.sm },
                        ]}
                    >
                        {t('jobAccepted.message') || 'Message Technician'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.ctaButton,
                        {
                            backgroundColor: theme.colors.surface,
                            borderRadius: theme.radius.md,
                            marginTop: theme.spacing.md,
                        },
                    ]}
                    onPress={handleCancel}
                    disabled={isCancelling}
                >
                    {isCancelling ? (
                        <ActivityIndicator color={theme.colors.error} size="small" />
                    ) : (
                        <>
                            <Ionicons name="close-circle-outline" size={18} color={theme.colors.error} />
                            <Text
                                style={[
                                    theme.typography.buttonMd,
                                    { color: theme.colors.error, marginLeft: theme.spacing.sm },
                                ]}
                            >
                                {t('jobAccepted.cancel') || 'Cancel Job'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },

    content: {
        flexGrow: 1,
        paddingTop: 12,
    },

    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },

    techCard: {
        padding: 16,
    },

    techHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    techInfo: {
        flex: 1,
    },

    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    etaSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
    },

    etaContent: {
        flex: 1,
    },

    summaryCard: {
        padding: 16,
    },

    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    ctaContainer: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },

    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
});
