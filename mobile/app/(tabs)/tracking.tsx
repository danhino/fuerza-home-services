/**
 * tracking.tsx — Customer Live Job Tracking
 *
 * Uber-style real-time map tracking of the technician's location.
 * Route params: { jobId: string }
 *
 * Socket events:
 *   location_update → { technicianId, lat, lng }
 *   job:status      → { jobId, status }
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useTheme } from '../../src/hooks/useTheme';
import { t, useLanguageStore } from '../../src/i18n';
import { useJobStore, Job } from '../../src/store/useJobStore';
import { StatusPill, JobStatus } from '../../src/components/ui/StatusPill';
import { Avatar } from '../../src/components/ui/Avatar';
import { Card } from '../../src/components/ui/Card';
import { socketService } from '../../src/services/socket.service';

// ─── Constants ───────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_HEIGHT * 0.55;

// Trade colors
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

// Default coordinates (San Antonio — will be overridden by real data)
const DEFAULT_CUSTOMER = { latitude: 29.4241, longitude: -98.4936 };
const DEFAULT_TECH = { latitude: 29.4320, longitude: -98.5000 };

// ─── Component ───────────────────────────────────────────────────────────────

export default function TrackingScreen() {
    const theme = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ jobId: string }>();
    const jobId = params.jobId;

    useLanguageStore((s) => s.language);

    const job = useJobStore((s) => s.jobs.find((j) => j.id === jobId));
    const updateJobStatus = useJobStore((s) => s.updateJobStatus);

    const mapRef = useRef<MapView>(null);

    // ── State ────────────────────────────────────────────────────────────────

    const [techLocation, setTechLocation] = useState(DEFAULT_TECH);
    const [jobComplete, setJobComplete] = useState(false);
    const celebrateAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Customer address — use default for now
    const customerLocation = DEFAULT_CUSTOMER;
    const status = (job?.status || 'MATCHED') as JobStatus;
    const trade = job?.trade || 'PLUMBER';
    const tradeColor = TRADE_COLOR[trade] || '#3B82F6';
    const techName = job?.technician?.user?.name || job?.technician?.user?.firstName || 'Technician';
    const serviceFee = job?.estimate?.currentAmount || job?.estimateLow || 0;

    // ── Current step index ───────────────────────────────────────────────────

    const currentStepIdx = STEPS.findIndex((s) => s.key === status);

    // ── Pulse animation for tech pin ─────────────────────────────────────────

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.6, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [pulseAnim]);

    // ── Socket listeners ─────────────────────────────────────────────────────

    useEffect(() => {
        // Join job room
        socketService.emit('join_room', `job_${jobId}`);

        // Listen for technician location updates
        const handleLocationUpdate = (data: { technicianId: string; lat: number; lng: number }) => {
            setTechLocation({ latitude: data.lat, longitude: data.lng });
        };

        // Listen for status updates
        const handleStatusUpdate = (data: { jobId: string; status: string }) => {
            if (data.jobId === jobId) {
                updateJobStatus(data.jobId, data.status);
            }
        };

        socketService.on('location_update', handleLocationUpdate);
        socketService.on('job:status', handleStatusUpdate);

        return () => {
            socketService.emit('leave_room', `job_${jobId}`);
            socketService.off('location_update');
            socketService.off('job:status');
        };
    }, [jobId, updateJobStatus]);

    // ── Handle completion ────────────────────────────────────────────────────

    useEffect(() => {
        if (status !== 'COMPLETED' || jobComplete) return;

        setJobComplete(true);
        Animated.spring(celebrateAnim, {
            toValue: 1,
            friction: 6,
            useNativeDriver: true,
        }).start();

        // Auto-navigate to receipt after 2s
        const timer = setTimeout(() => {
            router.replace({
                pathname: '/(tabs)/receipt',
                params: { jobId },
            });
        }, 2000);

        return () => clearTimeout(timer);
    }, [status, jobComplete, celebrateAnim, jobId, router]);

    // ── Fit map to both pins ─────────────────────────────────────────────────

    useEffect(() => {
        mapRef.current?.fitToCoordinates(
            [customerLocation, techLocation],
            { edgePadding: { top: 80, right: 60, bottom: 60, left: 60 }, animated: true }
        );
    }, [techLocation, customerLocation]);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
            {/* ═══ MAP ═══ */}
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                    latitude: (customerLocation.latitude + techLocation.latitude) / 2,
                    longitude: (customerLocation.longitude + techLocation.longitude) / 2,
                    latitudeDelta: 0.03,
                    longitudeDelta: 0.03,
                }}
            >
                {/* Customer pin */}
                <Marker coordinate={customerLocation}>
                    <View style={[styles.customerPin, { backgroundColor: theme.colors.accent }]}>
                        <Ionicons name="home" size={16} color="#FFFFFF" />
                    </View>
                </Marker>

                {/* Technician pin with pulse */}
                <Marker coordinate={techLocation}>
                    <View style={styles.techPinWrap}>
                        <Animated.View
                            style={[
                                styles.pulseRing,
                                {
                                    backgroundColor: tradeColor + '30',
                                    transform: [{ scale: pulseAnim }],
                                },
                            ]}
                        />
                        <View style={[styles.techPin, { backgroundColor: tradeColor }]}>
                            <MaterialCommunityIcons name="car" size={14} color="#FFFFFF" />
                        </View>
                    </View>
                </Marker>

                {/* Route line */}
                <Polyline
                    coordinates={[techLocation, customerLocation]}
                    strokeColor={tradeColor}
                    strokeWidth={3}
                    lineDashPattern={[8, 6]}
                />
            </MapView>

            {/* Back button overlay */}
            <SafeAreaView style={styles.backButtonWrap}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
                </TouchableOpacity>
            </SafeAreaView>

            {/* ═══ INFO PANEL ═══ */}
            <View
                style={[
                    styles.panel,
                    {
                        backgroundColor: theme.colors.background,
                        borderTopLeftRadius: theme.radius.xl,
                        borderTopRightRadius: theme.radius.xl,
                        paddingHorizontal: theme.spacing.lg,
                        paddingBottom: Math.max(insets.bottom, theme.spacing.lg),
                    },
                ]}
            >
                {/* Drag handle */}
                <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />

                {/* Technician info row */}
                <View style={styles.techRow}>
                    <Avatar name={techName} size="md" />
                    <View style={[styles.techInfo, { marginLeft: theme.spacing.md }]}>
                        <Text style={[theme.typography.titleSm, { color: theme.colors.textPrimary }]}>
                            {techName}
                        </Text>
                        <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
                            {t(TRADE_LABEL[trade] || 'home.map.plumbing')}
                        </Text>
                    </View>
                    {/* TODO Phase 3: Implement actual call and message functionality */}
                    <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: theme.colors.surface }]}>
                        <Ionicons name="call" size={18} color={theme.colors.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: theme.colors.surface, marginLeft: 8 }]}>
                        <Ionicons name="chatbubble" size={18} color={theme.colors.accent} />
                    </TouchableOpacity>
                </View>

                {/* Status + ETA */}
                <View style={[styles.statusEtaRow, { marginTop: theme.spacing.md }]}>
                    <StatusPill status={status} />
                    <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary, marginLeft: 12 }]}>
                        {t('tracking.eta')}
                    </Text>
                </View>

                {/* Job summary */}
                <View style={[styles.summaryRow, { marginTop: theme.spacing.md, paddingTop: theme.spacing.md, borderTopColor: theme.colors.divider }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
                            {t('tracking.jobSummary')}
                        </Text>
                        <Text style={[theme.typography.bodySm, { color: theme.colors.textPrimary, marginTop: 2 }]} numberOfLines={1}>
                            {t(TRADE_LABEL[trade] || 'home.map.plumbing')} — {job?.address || '—'}
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
                            {t('tracking.flatRate')}
                        </Text>
                        <Text style={[theme.typography.titleSm, { color: theme.colors.accent }]}>
                            ${serviceFee.toFixed(2)}
                        </Text>
                    </View>
                </View>

                {/* ═══ PROGRESS STEPPER ═══ */}
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

                {/* Problem link */}
                <TouchableOpacity style={{ marginTop: theme.spacing.lg, alignSelf: 'center' }}>
                    <Text style={[theme.typography.bodySm, { color: theme.colors.error, textDecorationLine: 'underline' }]}>
                        {t('tracking.problem')}
                    </Text>
                </TouchableOpacity>
            </View>

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
                            {t('tracking.jobComplete')}
                        </Text>
                        <Text style={[theme.typography.bodySm, { color: theme.colors.textTertiary, marginTop: 4 }]}>
                            {t('tracking.redirecting')}
                        </Text>
                    </Animated.View>
                </View>
            )}
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1 },

    // Map
    map: {
        width: SCREEN_WIDTH,
        height: MAP_HEIGHT,
    },
    customerPin: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    techPinWrap: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulseRing: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    techPin: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 5,
    },

    // Back button
    backButtonWrap: {
        position: 'absolute',
        top: 0,
        left: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },

    // Panel
    panel: {
        flex: 1,
        marginTop: -20,
        paddingTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 10,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 12,
    },

    // Tech row
    techRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    techInfo: {
        flex: 1,
    },
    actionIconBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Status + ETA
    statusEtaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    // Summary
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderTopWidth: StyleSheet.hairlineWidth,
    },

    // Progress stepper
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
});
