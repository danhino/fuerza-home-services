/**
 * job-detail.tsx — Technician Job Detail / Accept-or-Decline screen
 *
 * Shows full job details before the technician commits.
 * Route params: { jobId: string }
 *
 * API:
 *   POST /api/jobs/accept  → { jobId }
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Modal,
    Animated,
    Dimensions,
    Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useTheme } from '../../src/hooks/useTheme';
import { t, useLanguageStore } from '../../src/i18n';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useJobStore, Job } from '../../src/store/useJobStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Avatar } from '../../src/components/ui/Avatar';
import api from '../../src/services/api';

// ─── Constants ───────────────────────────────────────────────────────────────

const COUNTDOWN_SECONDS = 45;
const BOOKING_FEE = 2.99;
const PLATFORM_FEE_RATE = 0.12;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Trade pin config (same as map)
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function haversineDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 3958.8; // Earth radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function JobDetailScreen() {
    const theme = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ jobId: string; isNew?: string }>();
    const jobId = params.jobId;
    const isNew = params.isNew === 'true';

    useLanguageStore((s) => s.language);

    const job = useJobStore((s) => s.jobs.find((j) => j.id === jobId));
    const storeLocation = useLocationStore((s) => s.location);

    // ── State ────────────────────────────────────────────────────────────────

    const [accepting, setAccepting] = useState(false);
    const [declining, setDeclining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [descExpanded, setDescExpanded] = useState(false);
    const [photoModal, setPhotoModal] = useState<string | null>(null);

    // ── Countdown timer ──────────────────────────────────────────────────────

    const [countdown, setCountdown] = useState(isNew ? COUNTDOWN_SECONDS : 0);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!isNew) return;
        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isNew]);

    // Handle timer expiry outside the state updater to avoid
    // "Cannot update a component while rendering a different component"
    useEffect(() => {
        if (isNew && countdown === 0) {
            Alert.alert(t('jobDetail.timerExpired'));
            router.back();
        }
    }, [countdown, isNew, router]);

    // Pulse animation for "New Job" banner
    useEffect(() => {
        if (!isNew) return;
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 0.7, duration: 600, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [isNew, pulseAnim]);

    // ── Derived data ─────────────────────────────────────────────────────────

    const customerName = job?.customer?.user?.name || job?.customerName || 'Customer';
    const customerLang = job?.customer?.user?.preferredLanguage || job?.customerPreferredLanguage;
    const isSpanish = customerLang === 'es';
    const trade = job?.trade || 'PLUMBER';
    const tradeIcon = TRADE_ICON[trade] || 'wrench';
    const tradeColor = TRADE_COLOR[trade] || '#3B82F6';
    const tradeLabel = TRADE_LABEL[trade] || 'home.map.plumbing';

    // Estimate — prefer estimate.currentAmount, fall back to estimateLow
    const rawServiceFee = job?.estimate?.currentAmount ?? job?.estimateLow ?? null;
    const serviceFee = rawServiceFee; // null means "no estimate available"
    const platformCommission = serviceFee != null ? serviceFee * PLATFORM_FEE_RATE : null;
    const total = serviceFee != null ? serviceFee + BOOKING_FEE : null;
    const techReceives = serviceFee != null ? serviceFee * 0.88 : null;

    // Distance (client-side)
    const distance = useMemo((): number | null => {
        if (!storeLocation || !job?.address) return null;
        // TODO: Calculate actual distance when job coordinates are available
        return null;
    }, [storeLocation, job]) as number | null;

    // ── Actions ──────────────────────────────────────────────────────────────

    const handleAccept = useCallback(async () => {
        setAccepting(true);
        setError(null);
        try {
            await api.post('/api/jobs/accept', { jobId });
            // Refresh job store so the dashboard shows the accepted job
            await useJobStore.getState().fetchJobs('TECHNICIAN');
            router.replace({
                pathname: '/(tabs)/active-job',
                params: { jobId },
            });
        } catch {
            setError(t('jobDetail.acceptFailed'));
        } finally {
            setAccepting(false);
        }
    }, [jobId, router]);

    const handleDecline = useCallback(() => {
        setDeclining(true);
        // No backend decline endpoint yet — just navigate back
        router.back();
    }, [router]);

    // ── Render: Loading state ────────────────────────────────────────────────

    if (!job) {
        return (
            <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color={theme.colors.accent} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
            {/* ── New Job Banner ── */}
            {isNew && countdown > 0 && (
                <Animated.View
                    style={[
                        styles.newJobBanner,
                        {
                            backgroundColor: theme.colors.accent,
                            opacity: pulseAnim,
                        },
                    ]}
                >
                    <Ionicons name="flash" size={18} color="#FFFFFF" />
                    <Text style={[theme.typography.titleSm, { color: '#FFFFFF', marginLeft: 8 }]}>
                        {t('jobDetail.newJob')}
                    </Text>
                    <View style={styles.spacer} />
                    <View style={[styles.timerBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                        <Text style={[theme.typography.titleSm, { color: '#FFFFFF' }]}>
                            {countdown}s
                        </Text>
                    </View>
                </Animated.View>
            )}

            {/* ── Header ── */}
            <View style={[styles.header, { paddingHorizontal: theme.spacing.lg }]}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.flex}
                contentContainerStyle={[styles.content, { paddingHorizontal: theme.spacing.lg }]}
                showsVerticalScrollIndicator={false}
            >
                {/* ═══ CUSTOMER INFO ═══ */}
                <View style={styles.customerRow}>
                    <Avatar name={customerName} size="lg" />
                    <View style={[styles.customerInfo, { marginLeft: theme.spacing.md }]}>
                        <View style={styles.nameRow}>
                            <Text style={[theme.typography.titleLg, { color: theme.colors.textPrimary }]}>
                                {customerName}
                            </Text>
                            {isSpanish && (
                                <View style={[styles.esBadge, { backgroundColor: theme.colors.accent }]}>
                                    <Text style={[styles.esBadgeText]}>{t('jobDetail.badgeES')}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* ═══ TRADE BANNER ═══ */}
                <View
                    style={[
                        styles.tradeBanner,
                        {
                            backgroundColor: tradeColor + '15',
                            borderLeftColor: tradeColor,
                            borderRadius: theme.radius.md,
                            marginTop: theme.spacing.lg,
                        },
                    ]}
                >
                    <MaterialCommunityIcons name={tradeIcon} size={24} color={tradeColor} />
                    <Text style={[theme.typography.titleSm, { color: tradeColor, marginLeft: 10 }]}>
                        {t(tradeLabel)}
                    </Text>
                    {job.issueTag && (
                        <>
                            <Text style={[theme.typography.bodySm, { color: theme.colors.textTertiary, marginHorizontal: 8 }]}>•</Text>
                            <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary }]}>
                                {job.issueTag}
                            </Text>
                        </>
                    )}
                </View>

                {/* ═══ ADDRESS & DISTANCE ═══ */}
                <Card style={{ marginTop: theme.spacing.lg }}>
                    <View style={styles.addressRow}>
                        <Ionicons name="location" size={20} color={theme.colors.accent} />
                        <View style={{ marginLeft: 10, flex: 1 }}>
                            <Text style={[theme.typography.bodyLg, { color: theme.colors.textPrimary }]}>
                                {job.address || '—'}
                            </Text>
                            {distance !== null && (
                                <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginTop: 2 }]}>
                                    {distance.toFixed(1)} mi {t('jobDetail.distance')}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Mini map */}
                    <View style={[styles.miniMap, { borderRadius: theme.radius.md, marginTop: theme.spacing.md }]}>
                        <MapView
                            style={StyleSheet.absoluteFillObject}
                            region={{
                                latitude: 29.4241,
                                longitude: -98.4936,
                                latitudeDelta: 0.02,
                                longitudeDelta: 0.02,
                            }}
                            scrollEnabled={false}
                            zoomEnabled={false}
                            rotateEnabled={false}
                            pitchEnabled={false}
                        >
                            <Marker coordinate={{ latitude: 29.4241, longitude: -98.4936 }}>
                                <View style={[styles.pinCircle, { backgroundColor: tradeColor }]}>
                                    <Ionicons name="location" size={14} color="#FFFFFF" />
                                </View>
                            </Marker>
                        </MapView>
                    </View>
                </Card>

                {/* ═══ ISSUE DESCRIPTION ═══ */}
                <View style={{ marginTop: theme.spacing.xl }}>
                    <Text style={[theme.typography.titleSm, { color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }]}>
                        {t('jobDetail.issueDescription')}
                    </Text>
                    <Text
                        style={[theme.typography.bodyLg, { color: theme.colors.textSecondary, lineHeight: 22 }]}
                        numberOfLines={descExpanded ? undefined : 4}
                    >
                        {job.description || '—'}
                    </Text>
                    {(job.description?.length || 0) > 150 && (
                        <TouchableOpacity onPress={() => setDescExpanded(!descExpanded)} style={{ marginTop: 4 }}>
                            <Text style={[theme.typography.bodySm, { color: theme.colors.accent, fontWeight: '600' }]}>
                                {descExpanded ? t('jobDetail.showLess') : t('jobDetail.showMore')}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* ═══ PHOTO GALLERY ═══ */}
                {job.photos && job.photos.length > 0 && (
                    <View style={{ marginTop: theme.spacing.xl }}>
                        <Text style={[theme.typography.titleSm, { color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }]}>
                            {t('jobDetail.photos')}
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoStrip}>
                            {job.photos.map((uri, i) => (
                                <TouchableOpacity
                                    key={i}
                                    onPress={() => setPhotoModal(uri)}
                                    activeOpacity={0.8}
                                >
                                    <Image
                                        source={{ uri }}
                                        style={[styles.photoThumb, { borderRadius: theme.radius.md }]}
                                    />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* ═══ ESTIMATE SECTION ═══ */}
                <Card style={{ marginTop: theme.spacing.xl, padding: 16 }}>
                    <Text style={[theme.typography.titleSm, { color: theme.colors.textPrimary, marginBottom: 12 }]}>
                        {t('jobs.earnings.title')}
                    </Text>

                    <View style={styles.feeRow}>
                        <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary }]}>
                            {t('jobs.earnings.customerPays')}
                        </Text>
                        <Text style={[theme.typography.bodySm, { color: theme.colors.textPrimary, fontWeight: '600' }]}>
                            {total != null ? `$${total.toFixed(2)}` : '$—'}
                        </Text>
                    </View>

                    <View style={styles.feeRow}>
                        <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary }]}>
                            {t('jobs.earnings.platformFee')}
                        </Text>
                        <Text style={[theme.typography.bodySm, { color: '#FF3B30', fontWeight: '600' }]}>
                            {platformCommission != null ? `-$${platformCommission.toFixed(2)}` : '$—'}
                        </Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.colors.divider, marginVertical: 12 }]} />

                    <View style={[styles.feeRow, { alignItems: 'center' }]}>
                        <Text style={[theme.typography.titleSm, { color: theme.colors.textPrimary }]}>
                            {t('jobs.earnings.yourEarnings')}
                        </Text>
                        <Text style={[theme.typography.titleLg, { color: '#22C55E', fontWeight: 'bold' }]}>
                            {techReceives != null ? `$${techReceives.toFixed(2)}` : '$—'}
                        </Text>
                    </View>
                </Card>

                {/* Bottom spacer for fixed CTA */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ═══ FOOTER ACTION BAR ═══ */}
            <View
                style={[
                    styles.footer,
                    {
                        paddingHorizontal: theme.spacing.lg,
                        paddingBottom: Math.max(insets.bottom, theme.spacing.lg),
                        backgroundColor: theme.colors.background,
                        borderTopColor: theme.colors.divider,
                    },
                ]}
            >
                <TouchableOpacity
                    onPress={handleDecline}
                    disabled={declining}
                    style={[
                        styles.declineBtn,
                        {
                            backgroundColor: '#EF444415',
                            borderColor: '#EF4444',
                            borderRadius: theme.radius.md,
                        },
                    ]}
                    activeOpacity={0.7}
                >
                    <Text style={[theme.typography.titleSm, { color: '#EF4444' }]}>
                        {t('jobDetail.decline')}
                    </Text>
                </TouchableOpacity>

                <View style={{ width: 12 }} />

                <View style={styles.acceptBtnWrap}>
                    <Button
                        label={t('jobDetail.accept')}
                        variant="primary"
                        size="lg"
                        loading={accepting}
                        onPress={handleAccept}
                        leftIcon={<Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />}
                    />
                </View>
            </View>

            {/* ── Error ── */}
            {error && (
                <View
                    style={[
                        styles.errorFloat,
                        {
                            bottom: Math.max(insets.bottom, 16) + 80,
                            backgroundColor: theme.colors.errorLight,
                            borderRadius: theme.radius.md,
                            marginHorizontal: theme.spacing.lg,
                        },
                    ]}
                >
                    <Ionicons name="alert-circle" size={18} color={theme.colors.error} />
                    <Text style={[theme.typography.bodySm, { color: theme.colors.error, marginLeft: 8, flex: 1 }]}>
                        {error}
                    </Text>
                </View>
            )}

            {/* ═══ PHOTO FULLSCREEN MODAL ═══ */}
            <Modal visible={!!photoModal} transparent animationType="fade">
                <View style={styles.photoModalBackdrop}>
                    <TouchableOpacity
                        style={styles.photoModalClose}
                        onPress={() => setPhotoModal(null)}
                    >
                        <Ionicons name="close-circle" size={36} color="#FFFFFF" />
                    </TouchableOpacity>
                    {photoModal && (
                        <Image
                            source={{ uri: photoModal }}
                            style={styles.photoModalImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1 },
    flex: { flex: 1 },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    // New job banner
    newJobBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    spacer: { flex: 1 },
    timerBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },

    content: {
        paddingTop: 4,
        paddingBottom: 40,
    },

    // Customer
    customerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    customerInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    esBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    esBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },

    // Trade banner
    tradeBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderLeftWidth: 4,
    },

    // Address
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    miniMap: {
        height: 120,
        overflow: 'hidden',
    },
    pinCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Photos
    photoStrip: {
        gap: 10,
    },
    photoThumb: {
        width: 100,
        height: 100,
    },

    // Estimate
    priceDisplay: {
        fontSize: 36,
        fontWeight: '700',
        marginTop: 6,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
    },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    earningsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    // Footer
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    declineBtn: {
        width: '35%',
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
    },
    acceptBtnWrap: {
        flex: 1,
    },

    // Error
    errorFloat: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },

    // Photo modal
    photoModalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoModalClose: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
    },
    photoModalImage: {
        width: SCREEN_WIDTH - 32,
        height: SCREEN_WIDTH - 32,
    },
});
