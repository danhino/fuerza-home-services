/**
 * active-job.tsx — Technician Active Job Management
 *
 * Shows the technician their current active job and lets them
 * progress through: MATCHED → EN_ROUTE → ARRIVED → WORKING → COMPLETED
 *
 * Route params: { jobId: string }
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Animated,
    Dimensions,
    Linking,
    Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useTheme } from '../../src/hooks/useTheme';
import { t, useLanguageStore } from '../../src/i18n';
import { useJobStore, Job } from '../../src/store/useJobStore';
import { StatusPill, JobStatus } from '../../src/components/ui/StatusPill';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Avatar } from '../../src/components/ui/Avatar';
import { socketService } from '../../src/services/socket.service';
import api from '../../src/services/api';

// ─── Constants ───────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOOKING_FEE = 2.99;
const PLATFORM_FEE_RATE = 0.12;

const TRADE_ICON: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
    PLUMBER: 'wrench',
    ELECTRICIAN: 'lightning-bolt',
    HVAC: 'snowflake',
    POOL: 'waves',
    HOUSE_CLEANING: 'broom',
    GENERAL_HANDYMAN: 'hammer-wrench',
};
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

// Progress steps
const STEPS: { key: string; i18nKey: string }[] = [
    { key: 'MATCHED', i18nKey: 'tracking.matched' },
    { key: 'EN_ROUTE', i18nKey: 'tracking.enRoute' },
    { key: 'ARRIVED', i18nKey: 'tracking.arrived' },
    { key: 'WORKING', i18nKey: 'tracking.working' },
    { key: 'COMPLETED', i18nKey: 'tracking.complete' },
];

// Status → next status + button label
const NEXT_STATUS: Record<string, { next: string; i18nKey: string; icon: keyof typeof Ionicons.glyphMap }> = {
    MATCHED: { next: 'EN_ROUTE', i18nKey: 'activeJob.startDriving', icon: 'car' },
    EN_ROUTE: { next: 'ARRIVED', i18nKey: 'activeJob.arrived', icon: 'location' },
    ARRIVED: { next: 'WORKING', i18nKey: 'activeJob.startWorking', icon: 'construct' },
    WORKING: { next: 'COMPLETED', i18nKey: 'activeJob.markComplete', icon: 'checkmark-circle' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ActiveJobScreen() {
    const theme = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ jobId: string }>();
    const jobId = params.jobId;

    useLanguageStore((s) => s.language);

    const job = useJobStore((s) => s.jobs.find((j) => j.id === jobId));
    const updateJobStatusInStore = useJobStore((s) => s.updateJobStatus);

    // ── State ────────────────────────────────────────────────────────────────

    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [jobComplete, setJobComplete] = useState(false);
    const celebrateAnim = useRef(new Animated.Value(0)).current;

    // ── Derived data ─────────────────────────────────────────────────────────

    const status = (job?.status || 'MATCHED') as string;
    const trade = job?.trade || 'PLUMBER';
    const tradeIcon = TRADE_ICON[trade] || 'wrench';
    const tradeColor = TRADE_COLOR[trade] || '#3B82F6';
    const customerName = job?.customer?.user?.name || job?.customerName || 'Customer';
    const address = job?.address || '—';

    const serviceFee = job?.estimate?.currentAmount ?? job?.estimateLow ?? 0;
    const techReceives = serviceFee * 0.88;
    const customerTotal = serviceFee + BOOKING_FEE;

    const currentStepIdx = STEPS.findIndex((s) => s.key === status);
    const nextAction = NEXT_STATUS[status];

    // ── Socket listeners ─────────────────────────────────────────────────────

    useEffect(() => {
        socketService.emit('join_room', `job_${jobId}`);

        const handleStatusUpdate = (data: { jobId: string; status: string }) => {
            if (data.jobId === jobId) {
                updateJobStatusInStore(data.jobId, data.status);
            }
        };

        socketService.on('job:status', handleStatusUpdate);

        return () => {
            socketService.emit('leave_room', `job_${jobId}`);
            socketService.off('job:status');
        };
    }, [jobId, updateJobStatusInStore]);

    // ── Handle completion ────────────────────────────────────────────────────

    useEffect(() => {
        if (status !== 'COMPLETED' || jobComplete) return;
        setJobComplete(true);
        Animated.spring(celebrateAnim, {
            toValue: 1,
            friction: 6,
            useNativeDriver: true,
        }).start();
    }, [status, jobComplete, celebrateAnim]);

    // ── Actions ──────────────────────────────────────────────────────────────

    const handleUpdateStatus = useCallback(async () => {
        if (!nextAction || !jobId) return;
        setUpdating(true);
        setError(null);
        try {
            const { data } = await api.put(`/jobs/${jobId}/status`, {
                status: nextAction.next,
            });
            updateJobStatusInStore(jobId, nextAction.next);
        } catch (err: any) {
            console.error('[ActiveJob] Status update failed:', err);
            setError(t('activeJob.statusUpdateFailed'));
        } finally {
            setUpdating(false);
        }
    }, [jobId, nextAction, updateJobStatusInStore]);

    const openDirections = useCallback(() => {
        const encoded = encodeURIComponent(address);
        const url = Platform.select({
            ios: `maps://app?daddr=${encoded}`,
            android: `google.navigation:q=${encoded}`,
        }) || `https://maps.google.com/?daddr=${encoded}`;
        Linking.openURL(url).catch(console.error);
    }, [address]);

    // ── Not found ────────────────────────────────────────────────────────────

    if (!job) {
        return (
            <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.colors.accent} />
                    <Text style={[theme.typography.bodySm, { color: theme.colors.textTertiary, marginTop: 12 }]}>
                        Loading job...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
            {/* ── Header ── */}
            <View style={[styles.header, { paddingHorizontal: theme.spacing.lg }]}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[theme.typography.titleLg, { color: theme.colors.textPrimary, flex: 1, textAlign: 'center' }]}>
                    {t('activeJob.title')}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.flex}
                contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.spacing.lg }]}
                showsVerticalScrollIndicator={false}
            >
                {/* ═══ CUSTOMER INFO CARD ═══ */}
                <Card style={{ marginTop: theme.spacing.md }}>
                    <Text style={[theme.typography.label, { color: theme.colors.textTertiary, marginBottom: theme.spacing.sm }]}>
                        {t('activeJob.customerInfo')}
                    </Text>
                    <View style={styles.customerRow}>
                        <Avatar name={customerName} size="md" />
                        <View style={[styles.customerInfo, { marginLeft: theme.spacing.md }]}>
                            <Text style={[theme.typography.titleSm, { color: theme.colors.textPrimary }]}>
                                {customerName}
                            </Text>
                            <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]} numberOfLines={2}>
                                {address}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={openDirections}
                        style={[styles.directionsBtn, { backgroundColor: theme.colors.accent + '15', borderRadius: theme.radius.md, marginTop: theme.spacing.md }]}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="navigate" size={18} color={theme.colors.accent} />
                        <Text style={[theme.typography.titleSm, { color: theme.colors.accent, marginLeft: 8 }]}>
                            {t('activeJob.getDirections')}
                        </Text>
                    </TouchableOpacity>
                </Card>

                {/* ═══ STATUS CARD ═══ */}
                <Card style={{ marginTop: theme.spacing.md }}>
                    <View style={styles.statusHeader}>
                        <StatusPill status={status as JobStatus} />
                    </View>

                    {/* Progress stepper */}
                    <View style={[styles.stepper, { marginTop: theme.spacing.lg }]}>
                        {STEPS.map((step, idx) => {
                            const isActive = idx <= currentStepIdx;
                            const isCurrent = idx === currentStepIdx;
                            return (
                                <View key={step.key} style={styles.stepItem}>
                                    <View
                                        style={[
                                            styles.stepDot,
                                            {
                                                backgroundColor: isActive ? theme.colors.accent : theme.colors.border,
                                                borderWidth: isCurrent ? 2 : 0,
                                                borderColor: theme.colors.accent,
                                            },
                                        ]}
                                    >
                                        {isActive && (
                                            <Ionicons
                                                name={idx < currentStepIdx ? 'checkmark' : 'ellipse'}
                                                size={idx < currentStepIdx ? 10 : 6}
                                                color="#FFFFFF"
                                            />
                                        )}
                                    </View>
                                    {idx < STEPS.length - 1 && (
                                        <View
                                            style={[
                                                styles.stepLine,
                                                {
                                                    backgroundColor: idx < currentStepIdx ? theme.colors.accent : theme.colors.border,
                                                },
                                            ]}
                                        />
                                    )}
                                    <Text
                                        style={[
                                            theme.typography.caption,
                                            {
                                                color: isActive ? theme.colors.accent : theme.colors.textTertiary,
                                                fontWeight: isCurrent ? '700' : '400',
                                                marginTop: 4,
                                            },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {t(step.i18nKey)}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </Card>

                {/* ═══ JOB DETAILS CARD ═══ */}
                <Card style={{ marginTop: theme.spacing.md }}>
                    <Text style={[theme.typography.label, { color: theme.colors.textTertiary, marginBottom: theme.spacing.sm }]}>
                        {t('activeJob.jobDetails')}
                    </Text>

                    {/* Trade badge */}
                    <View style={styles.tradeBadgeRow}>
                        <View style={[styles.tradeCircle, { backgroundColor: tradeColor + '20' }]}>
                            <MaterialCommunityIcons name={tradeIcon} size={20} color={tradeColor} />
                        </View>
                        <Text style={[theme.typography.titleSm, { color: theme.colors.textPrimary, marginLeft: 10 }]}>
                            {t(TRADE_LABEL[trade] || 'home.map.plumbing')}
                        </Text>
                    </View>

                    {/* Description */}
                    <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary, marginTop: theme.spacing.sm }]}>
                        {job.description || '—'}
                    </Text>

                    {/* Photos */}
                    {job.photos && job.photos.length > 0 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={[styles.photoStrip, { marginTop: theme.spacing.md }]}
                        >
                            {job.photos.map((uri, i) => (
                                <Image
                                    key={i}
                                    source={{ uri }}
                                    style={[styles.photoThumb, { borderRadius: theme.radius.md }]}
                                />
                            ))}
                        </ScrollView>
                    )}

                    {/* Earnings breakdown */}
                    <View style={[styles.earningsBlock, { marginTop: theme.spacing.lg, borderTopColor: theme.colors.divider }]}>
                        <View style={styles.earningsRow}>
                            <Text style={[theme.typography.bodySm, { color: theme.colors.textTertiary }]}>
                                {t('jobs.earnings.customerPays')}
                            </Text>
                            <Text style={[theme.typography.bodySm, { color: theme.colors.textTertiary }]}>
                                ${customerTotal.toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.earningsRow}>
                            <Text style={[theme.typography.bodySm, { color: '#EF4444' }]}>
                                {t('jobs.earnings.platformFee')}
                            </Text>
                            <Text style={[theme.typography.bodySm, { color: '#EF4444' }]}>
                                -${(serviceFee * PLATFORM_FEE_RATE).toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.earningsRow}>
                            <Text style={[theme.typography.titleSm, { color: '#22C55E' }]}>
                                {t('jobs.earnings.yourEarnings')}
                            </Text>
                            <Text style={[theme.typography.titleSm, { color: '#22C55E', fontWeight: '700' }]}>
                                ${techReceives.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* ═══ PROPOSE PRICE CHANGE ═══ */}
                {status !== 'COMPLETED' && (
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: '/(tabs)/estimate-change', params: { jobId } })}
                        style={[styles.ghostBtn, { borderColor: theme.colors.border, borderRadius: theme.radius.md, marginTop: theme.spacing.md }]}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="cash-edit" size={18} color={theme.colors.textSecondary} />
                        <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary, marginLeft: 8 }]}>
                            {t('activeJob.proposeChange')}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Error */}
                {error && (
                    <Text style={[theme.typography.bodySm, { color: theme.colors.error, textAlign: 'center', marginTop: theme.spacing.md }]}>
                        {error}
                    </Text>
                )}

                {/* Bottom spacing */}
                <View style={{ height: 120 }} />
            </ScrollView>

            {/* ═══ BOTTOM STATUS UPDATE BUTTON ═══ */}
            {nextAction && !jobComplete && (
                <View
                    style={[
                        styles.bottomBar,
                        {
                            paddingHorizontal: theme.spacing.lg,
                            paddingBottom: Math.max(insets.bottom, theme.spacing.lg),
                            backgroundColor: theme.colors.background,
                            borderTopColor: theme.colors.divider,
                        },
                    ]}
                >
                    <Button
                        label={t(nextAction.i18nKey)}
                        onPress={handleUpdateStatus}
                        variant="primary"
                        size="lg"
                        loading={updating}
                        leftIcon={<Ionicons name={nextAction.icon} size={20} color="#FFFFFF" />}
                    />
                </View>
            )}

            {/* ═══ JOB COMPLETE OVERLAY ═══ */}
            {jobComplete && (
                <View style={styles.celebrateOverlay}>
                    <Animated.View
                        style={[
                            styles.celebrateCard,
                            {
                                backgroundColor: theme.colors.surface,
                                borderRadius: theme.radius.xl,
                                transform: [{ scale: celebrateAnim }],
                            },
                        ]}
                    >
                        <Ionicons name="checkmark-circle" size={56} color="#22C55E" />
                        <Text style={[theme.typography.headingLg, { color: theme.colors.textPrimary, marginTop: 12 }]}>
                            {t('activeJob.jobComplete')}
                        </Text>
                        <Text style={[theme.typography.titleSm, { color: '#22C55E', marginTop: 8 }]}>
                            {t('jobs.earnings.yourEarnings')}: ${techReceives.toFixed(2)}
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.replace({ pathname: '/(tabs)/jobs' })}
                            style={[styles.doneBtn, { backgroundColor: theme.colors.accent, borderRadius: theme.radius.md, marginTop: 20 }]}
                        >
                            <Text style={[theme.typography.titleSm, { color: '#FFFFFF' }]}>
                                {t('receipt.done')}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            )}
        </SafeAreaView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1 },
    flex: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { paddingBottom: 20 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },

    // Customer
    customerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    customerInfo: {
        flex: 1,
    },
    directionsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },

    // Status
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    // Stepper (reuse pattern from tracking.tsx)
    stepper: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    stepItem: {
        alignItems: 'center',
        flex: 1,
    },
    stepDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepLine: {
        position: 'absolute',
        top: 9,
        left: '60%',
        right: '-40%',
        height: 2,
        zIndex: -1,
    },

    // Trade badge
    tradeBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tradeCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Photos
    photoStrip: {
        gap: 8,
    },
    photoThumb: {
        width: 80,
        height: 80,
    },

    // Earnings
    earningsBlock: {
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    earningsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },

    // Ghost button
    ghostBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderWidth: 1,
    },

    // Bottom bar
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingTop: 12,
    },

    // Celebration overlay
    celebrateOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
    },
    celebrateCard: {
        paddingHorizontal: 48,
        paddingVertical: 40,
        alignItems: 'center',
    },
    doneBtn: {
        paddingHorizontal: 32,
        paddingVertical: 12,
    },
});
