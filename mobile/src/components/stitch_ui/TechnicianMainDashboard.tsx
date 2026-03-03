/**
 * TechnicianMainDashboard.tsx
 *
 * Uber Driver–style technician command center.
 * Self-contained: reads from useAuthStore, useJobStore, useLanguageStore.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

import { useTheme } from '../../hooks/useTheme';
import { t, useLanguageStore } from '../../i18n';
import { useAuthStore } from '../../store/useAuthStore';
import { useJobStore, Job } from '../../store/useJobStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { StatusPill, JobStatus } from '../ui/StatusPill';
import { SectionHeader } from '../ui/SectionHeader';
import { Avatar } from '../ui/Avatar';
import api from '../../services/api';

// ─── Trade pin config (reuse from map system) ────────────────────────────────

const TRADE_ICON: Record<string, string> = {
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACTIVE_STATUSES = ['MATCHED', 'EN_ROUTE', 'ARRIVED', 'WORKING'];
const PENDING_STATUSES = ['REQUESTED'];
const COMPLETED_STATUSES = ['COMPLETED'];

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return t('home.greeting.morning');
    if (h < 18) return t('home.greeting.afternoon');
    return t('home.greeting.evening');
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TechnicianMainDashboard() {
    const theme = useTheme();
    const router = useRouter();
    const language = useLanguageStore((s) => s.language);

    const user = useAuthStore((s) => s.user);
    const isOnline = user?.isOnline ?? false;
    const jobs = useJobStore((s) => s.jobs);
    const fetchJobs = useJobStore((s) => s.fetchJobs);

    // ── Online / Offline state ───────────────────────────────────────────────

    const [toggling, setToggling] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Pulse animation while online
    useEffect(() => {
        if (!isOnline) return;
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [isOnline, pulseAnim]);

    const toggleOnline = useCallback(async () => {
        if (toggling) return;
        setToggling(true);
        const newStatus = !isOnline;
        try {
            await api.put('/api/technicians/me/status', { isOnline: newStatus });
            // Update store ONLY after API confirms success
            useAuthStore.getState().setIsOnline(newStatus);
        } catch {
            // API failed — do NOT update the store, show error toast
            Alert.alert(
                language === 'es'
                    ? 'Error al actualizar estado. Intenta de nuevo.'
                    : 'Failed to update status. Please try again.'
            );
        } finally {
            // Always re-enable the button regardless of success or failure
            setToggling(false);
        }
    }, [isOnline, toggling, language]);

    // ── Re-fetch jobs on focus ────────────────────────────────────────────────

    useFocusEffect(
        useCallback(() => {
            fetchJobs('TECHNICIAN');
        }, [fetchJobs])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchJobs('TECHNICIAN');
        setRefreshing(false);
    }, [fetchJobs]);

    // ── Derived data ─────────────────────────────────────────────────────────

    const activeJob = useMemo(
        () => jobs.find((j) => ACTIVE_STATUSES.includes(j.status)),
        [jobs]
    );
    const pendingJobs = useMemo(
        () => jobs.filter((j) => PENDING_STATUSES.includes(j.status)),
        [jobs]
    );
    const completedJobs = useMemo(
        () => jobs.filter((j) => COMPLETED_STATUSES.includes(j.status)).slice(0, 5),
        [jobs]
    );

    // Mock stats (would come from API in production)
    const todayEarnings = 0;
    const weekEarnings = 0;
    const pendingPayout = 0;
    const jobsToday = completedJobs.length;
    const techRating = 4.8;
    const acceptRate = 92;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
            {/* ═══ ONLINE / OFFLINE BANNER ═══ */}
            <View
                style={[
                    styles.statusBanner,
                    {
                        backgroundColor: isOnline ? '#22C55E' : theme.colors.backgroundTertiary,
                        paddingHorizontal: theme.spacing.lg,
                    },
                ]}
            >
                <View style={styles.statusRow}>
                    {isOnline && (
                        <Animated.View
                            style={[
                                styles.pulseDot,
                                { backgroundColor: '#FFFFFF', opacity: pulseAnim },
                            ]}
                        />
                    )}
                    <Text
                        style={[
                            theme.typography.titleSm,
                            {
                                color: isOnline ? '#FFFFFF' : theme.colors.textSecondary,
                                marginLeft: isOnline ? 10 : 0,
                                flex: 1,
                            },
                        ]}
                    >
                        {isOnline ? t('techDash.online') : t('techDash.offline')}
                    </Text>
                    <TouchableOpacity
                        onPress={toggleOnline}
                        disabled={toggling}
                        style={[
                            styles.toggleBtn,
                            {
                                backgroundColor: isOnline
                                    ? 'rgba(255,255,255,0.2)'
                                    : theme.colors.accent,
                                borderRadius: theme.radius.md,
                            },
                        ]}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                theme.typography.titleSm,
                                { color: '#FFFFFF' },
                            ]}
                        >
                            {isOnline ? t('techDash.goOffline') : t('techDash.goOnline')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ═══ GREETING ═══ */}
            <View style={[styles.greetingRow, { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg }]}>
                <View style={{ flex: 1 }}>
                    <Text style={[theme.typography.headingLg, { color: theme.colors.textPrimary }]}>
                        {getGreeting()}, {user?.firstName || user?.name || ''}
                    </Text>
                    <Text style={[theme.typography.bodySm, { color: theme.colors.textTertiary, marginTop: 2 }]}>
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => router.push('/(tabs)/profile')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Avatar name={user?.name || 'T'} size="md" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.flex}
                contentContainerStyle={[styles.content, { paddingHorizontal: theme.spacing.lg }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />
                }
            >
                {/* ═══ ACTIVE JOB CARD ═══ */}
                {activeJob && (
                    <Card style={{ marginTop: theme.spacing.lg }}>
                        <View style={styles.activeJobHeader}>
                            <Ionicons name="construct" size={20} color={theme.colors.accent} />
                            <Text style={[theme.typography.titleSm, { color: theme.colors.accent, marginLeft: 8, flex: 1 }]}>
                                {t('techDash.activeJob')}
                            </Text>
                            <StatusPill status={activeJob.status as JobStatus} compact />
                        </View>

                        <Text style={[theme.typography.titleLg, { color: theme.colors.textPrimary, marginTop: theme.spacing.sm }]}>
                            {activeJob.customer?.user?.name || activeJob.customerName || '—'}
                        </Text>
                        <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
                            {activeJob.address || '—'}
                        </Text>

                        <View style={{ marginTop: theme.spacing.md }}>
                            <Button
                                label={t('techDash.viewDetails')}
                                variant="primary"
                                size="sm"
                                onPress={() => router.push({ pathname: '/(tabs)/job-detail', params: { jobId: activeJob.id } })}
                            />
                        </View>
                    </Card>
                )}

                {/* ═══ EARNINGS SUMMARY ═══ */}
                <TouchableOpacity
                    onPress={() => router.push('/(tabs)/earnings')}
                    activeOpacity={0.7}
                    style={{ marginTop: theme.spacing.lg }}
                >
                    <Card>
                        <Text style={[theme.typography.label, { color: theme.colors.textTertiary }]}>
                            {t('techDash.todayEarnings')}
                        </Text>
                        <Text style={[styles.earningsAmount, { color: theme.colors.textPrimary }]}>
                            ${todayEarnings.toFixed(2)}
                        </Text>

                        <View style={[styles.earningsSubRow, { marginTop: theme.spacing.md }]}>
                            <View style={styles.earningsSub}>
                                <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
                                    {t('techDash.weekEarnings')}
                                </Text>
                                <Text style={[theme.typography.titleSm, { color: theme.colors.textPrimary }]}>
                                    ${weekEarnings.toFixed(2)}
                                </Text>
                            </View>
                            <View style={[styles.earningsDivider, { backgroundColor: theme.colors.divider }]} />
                            <View style={styles.earningsSub}>
                                <View style={styles.payoutRow}>
                                    <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
                                        {t('techDash.pendingPayout')}
                                    </Text>
                                    <Ionicons name="information-circle-outline" size={14} color={theme.colors.textTertiary} style={{ marginLeft: 4 }} />
                                </View>
                                <Text style={[theme.typography.titleSm, { color: theme.colors.textPrimary }]}>
                                    ${pendingPayout.toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </Card>
                </TouchableOpacity>

                {/* ═══ QUICK STATS ═══ */}
                <View style={[styles.statsRow, { marginTop: theme.spacing.lg }]}>
                    <View style={[styles.statChip, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md }]}>
                        <Text style={[theme.typography.titleSm, { color: theme.colors.accent }]}>{jobsToday}</Text>
                        <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>{t('techDash.jobsToday')}</Text>
                    </View>
                    <View style={[styles.statChip, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md }]}>
                        <Text style={[theme.typography.titleSm, { color: '#F59E0B' }]}>⭐ {techRating}</Text>
                        <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>{t('techDash.rating')}</Text>
                    </View>
                    <View style={[styles.statChip, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md }]}>
                        <Text style={[theme.typography.titleSm, { color: '#22C55E' }]}>{acceptRate}%</Text>
                        <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>{t('techDash.acceptRate')}</Text>
                    </View>
                </View>

                {/* ═══ PENDING JOB REQUESTS ═══ */}
                <SectionHeader
                    title={`${t('techDash.newRequests')} (${pendingJobs.length})`}
                    onSeeAll={pendingJobs.length > 3 ? () => router.push('/(tabs)/jobs') : undefined}
                    actionLabel={t('techDash.seeAll')}
                    style={{ marginTop: theme.spacing.xl }}
                />

                {pendingJobs.length === 0 ? (
                    <Card style={{ marginTop: theme.spacing.sm }}>
                        <View style={styles.emptyState}>
                            <Ionicons name="time-outline" size={36} color={theme.colors.textTertiary} />
                            <Text style={[theme.typography.bodySm, { color: theme.colors.textTertiary, textAlign: 'center', marginTop: theme.spacing.sm }]}>
                                {t('techDash.noRequests')}
                            </Text>
                        </View>
                    </Card>
                ) : (
                    pendingJobs.slice(0, 3).map((job, idx) => {
                        const trade = job.trade || 'PLUMBER';
                        const icon = TRADE_ICON[trade] || 'wrench';
                        const color = TRADE_COLOR[trade] || '#3B82F6';
                        const label = TRADE_LABEL[trade] || 'home.map.plumbing';
                        const isSpanish = job.customerPreferredLanguage === 'es' || job.customer?.user?.preferredLanguage === 'es';
                        const isNewest = idx === 0;

                        return (
                            <Card
                                key={job.id}
                                style={{
                                    marginTop: theme.spacing.sm,
                                    ...(isNewest ? { borderWidth: 1.5, borderColor: theme.colors.accent } : {}),
                                }}
                                onPress={() => router.push({ pathname: '/(tabs)/job-detail', params: { jobId: job.id, isNew: 'true' } })}
                            >
                                <View style={styles.requestRow}>
                                    <View style={[styles.tradeCircle, { backgroundColor: color + '20' }]}>
                                        <MaterialCommunityIcons name={icon as any} size={20} color={color} />
                                    </View>
                                    <View style={styles.requestInfo}>
                                        <View style={styles.requestTitleRow}>
                                            <Text style={[theme.typography.titleSm, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                                                {t(label)}
                                            </Text>
                                            {isSpanish && (
                                                <Badge label="ES" variant="warning" size="sm" />
                                            )}
                                        </View>
                                        <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]} numberOfLines={1}>
                                            {job.address || '—'}
                                        </Text>
                                        {(job.estimateLow || job.estimate?.currentAmount) && (
                                            <Text style={[theme.typography.bodySm, { color: theme.colors.accent, fontWeight: '600', marginTop: 2 }]}>
                                                ${(job.estimate?.currentAmount || job.estimateLow || 0).toFixed(2)}
                                            </Text>
                                        )}
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.viewBtn, { backgroundColor: theme.colors.accent + '15', borderRadius: theme.radius.sm }]}
                                        onPress={() => router.push({ pathname: '/(tabs)/job-detail', params: { jobId: job.id, isNew: 'true' } })}
                                    >
                                        <Text style={[theme.typography.caption, { color: theme.colors.accent, fontWeight: '700' }]}>
                                            {t('techDash.view')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </Card>
                        );
                    })
                )}

                {/* ═══ RECENT COMPLETED ═══ */}
                {completedJobs.length > 0 && (
                    <>
                        <SectionHeader
                            title={t('techDash.recentJobs')}
                            style={{ marginTop: theme.spacing.xl }}
                        />
                        {completedJobs.map((job) => {
                            const trade = job.trade || 'PLUMBER';
                            const color = TRADE_COLOR[trade] || '#3B82F6';
                            return (
                                <View
                                    key={job.id}
                                    style={[
                                        styles.recentRow,
                                        {
                                            borderBottomColor: theme.colors.divider,
                                            paddingVertical: theme.spacing.sm,
                                        },
                                    ]}
                                >
                                    <View style={[styles.recentDot, { backgroundColor: color }]} />
                                    <View style={styles.recentInfo}>
                                        <Text style={[theme.typography.bodySm, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                                            {t(TRADE_LABEL[trade] || 'home.map.plumbing')} — {job.customer?.user?.name || job.customerName || '—'}
                                        </Text>
                                        <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
                                            {new Date(job.changeOrders?.[0]?.createdAt || Date.now()).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <Text style={[theme.typography.titleSm, { color: '#22C55E' }]}>
                                        ${(job.finalAmount || job.estimate?.currentAmount || 0).toFixed(2)}
                                    </Text>
                                </View>
                            );
                        })}
                    </>
                )}

                {/* Bottom padding */}
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Backward-compat type exports (used by index.tsx) ────────────────────────

export interface NextJob {
    title: string;
    address: string;
    details?: string;
    scheduledTime?: string;
}

export interface UpcomingJob {
    title: string;
    customerName: string;
    distance: string;
    iconColor?: string;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1 },
    flex: { flex: 1 },
    content: {
        paddingBottom: 20,
    },

    // Status banner
    statusBanner: {
        paddingVertical: 14,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pulseDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    toggleBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },

    // Greeting
    greetingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    // Active job
    activeJobHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    // Earnings
    earningsAmount: {
        fontSize: 34,
        fontWeight: '700',
        marginTop: 4,
    },
    earningsSubRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    earningsSub: {
        flex: 1,
    },
    earningsDivider: {
        width: StyleSheet.hairlineWidth,
        height: 32,
        marginHorizontal: 12,
    },
    payoutRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    statChip: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },

    // Empty state
    emptyState: {
        alignItems: 'center',
        paddingVertical: 20,
    },

    // Pending requests
    requestRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tradeCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    requestInfo: {
        flex: 1,
        marginLeft: 12,
    },
    requestTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    viewBtn: {
        paddingHorizontal: 14,
        paddingVertical: 6,
    },

    // Recent
    recentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    recentDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 10,
    },
    recentInfo: {
        flex: 1,
    },
});
