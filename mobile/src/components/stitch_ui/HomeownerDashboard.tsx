/**
 * HomeownerDashboard — Map-first customer home screen.
 *
 * Uber-style layout with 5 absolute-positioned layers on top of MapView:
 *   Layer 0: Full-screen MapView with technician pins
 *   Layer 1: Floating top header (wordmark + address + avatar)
 *   Layer 2: Trade filter chips
 *   Layer 3: Bottom floating panel (tech count + categories + CTA)
 *   Layer 4: Recenter FAB
 */
import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from '../PlatformMap';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/useAuthStore';
import { useMapStore, TradeFilter, TechnicianLocation, CertificationLevel } from '../../store/useMapStore';
import { useLocationStore } from '../../store/useLocationStore';
import { useBookingStore } from '../../store/useBookingStore';
import { t, useLanguageStore } from '../../i18n';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { DisclaimerModal } from '../DisclaimerModal';

// ─── Re-exported types for backward compat with index.tsx ────────────────────

export type TradeKey = 'PLUMBER' | 'ELECTRICIAN' | 'HVAC' | 'POOL' | 'HOUSE_CLEANING' | 'GENERAL_HANDYMAN';

export interface TradeMeta {
    key: TradeKey;
    icon: string;
    color: string;
    label: string;
}

// ─── Trade Config ────────────────────────────────────────────────────────────

interface TradeConfig {
    key: TradeFilter;
    i18nKey: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    color: string;
}

const TRADE_FILTERS: TradeConfig[] = [
    { key: 'ALL', i18nKey: 'home.map.all', icon: 'view-grid', color: '#6B7280' },
    { key: 'PLUMBER', i18nKey: 'home.map.plumbing', icon: 'wrench', color: '#3B82F6' },
    { key: 'ELECTRICIAN', i18nKey: 'home.map.electrical', icon: 'lightning-bolt', color: '#F59E0B' },
    { key: 'HVAC', i18nKey: 'home.map.hvac', icon: 'snowflake', color: '#8B5CF6' },
    { key: 'POOL', i18nKey: 'home.map.pool', icon: 'waves', color: '#06B6D4' },
    { key: 'HOUSE_CLEANING', i18nKey: 'home.map.cleaning', icon: 'broom', color: '#6B7280' },
    { key: 'GENERAL_HANDYMAN', i18nKey: 'home.map.handyman', icon: 'hammer-wrench', color: '#F97316' },
];

const CATEGORY_CARDS: TradeConfig[] = TRADE_FILTERS.slice(1); // Exclude 'ALL'

const TRADE_PIN_ICON: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
    PLUMBER: 'wrench',
    ELECTRICIAN: 'lightning-bolt',
    HVAC: 'snowflake',
    POOL: 'waves',
    HOUSE_CLEANING: 'broom',
    GENERAL_HANDYMAN: 'hammer-wrench',
};

const TRADE_PIN_COLOR: Record<string, string> = {
    PLUMBER: '#3B82F6',
    ELECTRICIAN: '#F59E0B',
    HVAC: '#8B5CF6',
    POOL: '#06B6D4',
    HOUSE_CLEANING: '#6B7280',
    GENERAL_HANDYMAN: '#F97316',
};

const TRADE_I18N: Record<string, string> = {
    PLUMBER: 'home.map.plumbing',
    ELECTRICIAN: 'home.map.electrical',
    HVAC: 'home.map.hvac',
    POOL: 'home.map.pool',
    HOUSE_CLEANING: 'home.map.cleaning',
    GENERAL_HANDYMAN: 'home.map.handyman',
};

/** Typical price ranges per trade (dollars, CERTIFIED baseline) */
const TRADE_PRICE_RANGE: Record<string, [number, number]> = {
    PLUMBER: [110, 170],
    ELECTRICIAN: [130, 200],
    HVAC: [160, 240],
    POOL: [95, 145],
    HOUSE_CLEANING: [120, 180],
    GENERAL_HANDYMAN: [75, 115],
};

const NON_CERTIFIED_MULTIPLIER = 0.75;

type CertFilter = 'ALL' | CertificationLevel;

const CERT_FILTERS: { key: CertFilter; i18nKey: string }[] = [
    { key: 'ALL', i18nKey: 'cert.filter.all' },
    { key: 'CERTIFIED', i18nKey: 'cert.filter.certified' },
    { key: 'NON_CERTIFIED', i18nKey: 'cert.filter.independent' },
];

// ─── Default region (San Antonio, TX) ────────────────────────────────────────

const DEFAULT_REGION = {
    latitude: 29.4241,
    longitude: -98.4936,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOTTOM_PANEL_HEIGHT = 260;

// ─── Component ───────────────────────────────────────────────────────────────

export function HomeownerDashboard() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const mapRef = useRef<MapView>(null);

    // Stores — select raw state (NOT derived methods to avoid infinite loop)
    const user = useAuthStore((s) => s.user);
    const location = useLocationStore((s) => s.location);
    const startTracking = useLocationStore((s) => s.startTracking);
    const selectedTrade = useMapStore((s) => s.selectedTrade);
    const setSelectedTrade = useMapStore((s) => s.setSelectedTrade);
    const technicianLocations = useMapStore((s) => s.technicianLocations);
    const initSocket = useMapStore((s) => s.initializeSocketListeners);
    const cleanupSocket = useMapStore((s) => s.cleanupSocketListeners);
    const fetchOnlineTechs = useMapStore((s) => s.fetchOnlineTechnicians);

    // Certification filter + pending disclaimer state for direct booking
    const [certFilter, setCertFilter] = useState<CertFilter>('ALL');
    const [pendingTech, setPendingTech] = useState<TechnicianLocation | null>(null);

    const acceptDisclaimer = useBookingStore((s) => s.acceptDisclaimer);
    const setSelectedTechnician = useBookingStore((s) => s.setSelectedTechnician);

    // Derive filtered techs and online count via useMemo (stable references)
    const filteredTechs = useMemo(() => {
        let all = Object.values(technicianLocations).filter((t) => t.isOnline);
        if (certFilter !== 'ALL') all = all.filter((t) => t.certificationLevel === certFilter);
        if (selectedTrade === 'ALL') return all;
        return all.filter((t) => t.trade === selectedTrade);
    }, [technicianLocations, selectedTrade, certFilter]);

    const { certifiedCount, independentCount } = useMemo(() => {
        const online = Object.values(technicianLocations).filter((t) => t.isOnline);
        return {
            certifiedCount: online.filter((t) => t.certificationLevel === 'CERTIFIED').length,
            independentCount: online.filter((t) => t.certificationLevel === 'NON_CERTIFIED').length,
        };
    }, [technicianLocations]);

    // Subscribe to language for re-render
    useLanguageStore((s) => s.language);

    // Pulsing dot animation
    const pulseAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [pulseAnim]);

    // Socket listeners + fetch current online technicians
    useEffect(() => {
        initSocket();
        if (user?.id) {
            fetchOnlineTechs();
        }
        return () => cleanupSocket();
    }, [initSocket, cleanupSocket, fetchOnlineTechs, user?.id]);

    // Start location tracking
    useEffect(() => {
        startTracking();
    }, [startTracking]);

    // Animate map to user's actual location when it becomes available
    useEffect(() => {
        if (location?.coords?.latitude && mapRef.current) {
            mapRef.current.animateToRegion(
                {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                },
                1000
            );
        }
    }, [location?.coords?.latitude, location?.coords?.longitude]);

    // Map region from user location
    const userRegion = location
        ? {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
        }
        : DEFAULT_REGION;

    const recenterMap = useCallback(() => {
        mapRef.current?.animateToRegion(userRegion, 500);
    }, [userRegion]);

    const navigateToRequest = useCallback((trade?: TradeFilter) => {
        if (trade && trade !== 'ALL') {
            router.push({ pathname: '/(tabs)/request', params: { trade } });
        } else {
            router.push('/(tabs)/request');
        }
    }, [router]);

    // "Book {name}" from a map pin → disclaimer first, then the request flow
    const handleBookTech = useCallback((tech: TechnicianLocation) => {
        setPendingTech(tech);
    }, []);

    const handleDisclaimerAccept = useCallback(() => {
        if (!pendingTech) return;
        acceptDisclaimer(pendingTech.certificationLevel);
        setSelectedTechnician(pendingTech.techId);
        const trade = pendingTech.trade as TradeFilter;
        setPendingTech(null);
        navigateToRequest(trade);
    }, [pendingTech, acceptDisclaimer, setSelectedTechnician, navigateToRequest]);

    const handleDisclaimerDecline = useCallback(() => {
        // For Independent Pros the secondary action is "Show Certified Pros Instead"
        if (pendingTech?.certificationLevel === 'NON_CERTIFIED') {
            setCertFilter('CERTIFIED');
        }
        setPendingTech(null);
    }, [pendingTech]);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <View style={styles.root}>
            {/* ═══ Layer 0: Map ═══ */}
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                initialRegion={userRegion}
                showsUserLocation
                showsMyLocationButton={false}
                showsCompass={false}
                mapPadding={{ top: 0, right: 0, bottom: BOTTOM_PANEL_HEIGHT, left: 0 }}
            >
                {filteredTechs.map((tech) => (
                    <TechPin key={tech.techId} tech={tech} theme={theme} onBook={handleBookTech} />
                ))}
            </MapView>

            {/* ═══ Layer 1: Top Header ═══ */}
            <View
                style={[
                    styles.topHeader,
                    {
                        top: insets.top + 8,
                        paddingHorizontal: theme.spacing.lg,
                    },
                ]}
            >
                {/* Wordmark */}
                <Text
                    style={[
                        theme.typography.headingSm,
                        { color: theme.colors.accent, letterSpacing: -0.5 },
                    ]}
                >
                    Fuerza
                </Text>

                {/* Address pill */}
                <TouchableOpacity
                    style={[
                        styles.addressPill,
                        {
                            backgroundColor: theme.colors.surface,
                            borderRadius: theme.radius.full,
                        },
                        theme.shadow.card,
                    ]}
                    activeOpacity={0.7}
                >
                    <Ionicons name="location" size={14} color={theme.colors.accent} />
                    <Text
                        style={[
                            theme.typography.label,
                            {
                                color: theme.colors.textPrimary,
                                marginLeft: 4,
                                maxWidth: SCREEN_WIDTH * 0.45,
                            },
                        ]}
                        numberOfLines={1}
                    >
                        {t('home.map.yourLocation')}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={theme.colors.textTertiary} style={{ marginLeft: 2 }} />
                </TouchableOpacity>

                {/* User avatar */}
                <Avatar
                    name={user?.name}
                    size="sm"
                />
            </View>

            {/* ═══ Layer 2a: Certification Filter Chips ═══ */}
            <View style={[styles.chipRow, { top: insets.top + 60 }]}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
                >
                    {CERT_FILTERS.map((cf) => {
                        const isSelected = certFilter === cf.key;
                        return (
                            <TouchableOpacity
                                key={cf.key}
                                onPress={() => setCertFilter(cf.key)}
                                activeOpacity={0.8}
                                style={[
                                    styles.chip,
                                    {
                                        backgroundColor: isSelected
                                            ? theme.colors.accent
                                            : theme.colors.surface,
                                        borderColor: isSelected
                                            ? theme.colors.accent
                                            : theme.colors.border,
                                        borderRadius: theme.radius.full,
                                    },
                                    theme.shadow.card,
                                ]}
                            >
                                <Text
                                    style={[
                                        theme.typography.label,
                                        {
                                            color: isSelected ? '#FFFFFF' : theme.colors.textPrimary,
                                        },
                                    ]}
                                >
                                    {t(cf.i18nKey)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ═══ Layer 2b: Trade Filter Chips ═══ */}
            <View style={[styles.chipRow, { top: insets.top + 104 }]}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
                >
                    {TRADE_FILTERS.map((trade) => {
                        const isSelected = selectedTrade === trade.key;
                        return (
                            <TouchableOpacity
                                key={trade.key}
                                onPress={() => setSelectedTrade(trade.key)}
                                activeOpacity={0.8}
                                style={[
                                    styles.chip,
                                    {
                                        backgroundColor: isSelected
                                            ? theme.colors.accent
                                            : theme.colors.surface,
                                        borderColor: isSelected
                                            ? theme.colors.accent
                                            : theme.colors.border,
                                        borderRadius: theme.radius.full,
                                    },
                                    theme.shadow.card,
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name={trade.icon}
                                    size={16}
                                    color={isSelected ? '#FFFFFF' : trade.color}
                                />
                                <Text
                                    style={[
                                        theme.typography.label,
                                        {
                                            color: isSelected
                                                ? '#FFFFFF'
                                                : theme.colors.textPrimary,
                                            marginLeft: 6,
                                        },
                                    ]}
                                >
                                    {t(trade.i18nKey)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ═══ Layer 4: Recenter FAB ═══ */}
            <TouchableOpacity
                onPress={recenterMap}
                activeOpacity={0.8}
                style={[
                    styles.fab,
                    {
                        bottom: BOTTOM_PANEL_HEIGHT + 16,
                        right: theme.spacing.lg,
                        backgroundColor: theme.colors.surface,
                        borderRadius: theme.radius.full,
                    },
                    theme.shadow.medium,
                ]}
                accessibilityLabel={t('home.map.recenter')}
            >
                <Ionicons name="locate" size={22} color={theme.colors.accent} />
            </TouchableOpacity>

            {/* ═══ Layer 3: Bottom Panel ═══ */}
            <View
                style={[
                    styles.bottomPanel,
                    {
                        backgroundColor: theme.colors.surface,
                        borderTopLeftRadius: theme.radius.xl,
                        borderTopRightRadius: theme.radius.xl,
                        paddingBottom: Math.max(insets.bottom, 16),
                    },
                    theme.shadow.modal,
                ]}
            >
                {/* ── Tech count row ── */}
                <View style={styles.techCountRow}>
                    <Animated.View
                        style={[
                            styles.liveDot,
                            {
                                backgroundColor: theme.colors.success,
                                transform: [{ scale: pulseAnim }],
                            },
                        ]}
                    />
                    <Text
                        style={[
                            theme.typography.bodySm,
                            {
                                color: theme.colors.textSecondary,
                                marginLeft: 8,
                            },
                        ]}
                    >
                        {t('cert.nearby', { certified: certifiedCount, independent: independentCount })}
                    </Text>
                </View>

                {/* ── Category quick-select cards ── */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScroll}
                    style={{ marginBottom: theme.spacing.lg }}
                >
                    {CATEGORY_CARDS.map((cat) => (
                        <TouchableOpacity
                            key={cat.key}
                            onPress={() => navigateToRequest(cat.key)}
                            activeOpacity={0.7}
                            style={[
                                styles.categoryCard,
                                {
                                    backgroundColor: theme.isDark
                                        ? theme.colors.backgroundTertiary
                                        : theme.colors.backgroundSecondary,
                                    borderRadius: theme.radius.md,
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.categoryIcon,
                                    {
                                        backgroundColor: cat.color + '18',
                                        borderRadius: theme.radius.md,
                                    },
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name={cat.icon}
                                    size={24}
                                    color={cat.color}
                                />
                            </View>
                            <Text
                                style={[
                                    theme.typography.captionMedium,
                                    {
                                        color: theme.colors.textPrimary,
                                        marginTop: 6,
                                        textAlign: 'center',
                                    },
                                ]}
                                numberOfLines={2}
                            >
                                {t(cat.i18nKey)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* ── Request CTA ── */}
                <View style={{ paddingHorizontal: theme.spacing.lg }}>
                    <Button
                        label={t('home.map.requestService')}
                        onPress={() => navigateToRequest()}
                        variant="primary"
                        size="lg"
                        leftIcon={
                            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                        }
                    />
                </View>
            </View>

            {/* ═══ Booking disclaimer ═══ */}
            <DisclaimerModal
                visible={pendingTech !== null}
                certificationLevel={pendingTech?.certificationLevel ?? 'CERTIFIED'}
                technicianName={pendingTech?.name}
                onAccept={handleDisclaimerAccept}
                onDecline={handleDisclaimerDecline}
            />
        </View>
    );
}

// ─── TechPin Sub-component ───────────────────────────────────────────────────

interface TechPinProps {
    tech: TechnicianLocation;
    theme: ReturnType<typeof useTheme>;
    onBook: (tech: TechnicianLocation) => void;
}

function TechPin({ tech, theme, onBook }: TechPinProps) {
    const pinColor = TRADE_PIN_COLOR[tech.trade] || '#6B7280';
    const pinIcon = TRADE_PIN_ICON[tech.trade] || 'wrench';

    const isCertified = tech.certificationLevel === 'CERTIFIED';
    const certColor = isCertified ? '#12895E' : '#F59E0B';
    const firstName = tech.name.split(' ')[0] || tech.name;

    const [rangeMin, rangeMax] = TRADE_PRICE_RANGE[tech.trade] || [95, 145];
    const multiplier = isCertified ? 1 : NON_CERTIFIED_MULTIPLIER;
    const min = Math.round(rangeMin * multiplier);
    const max = Math.round(rangeMax * multiplier);

    return (
        <Marker
            coordinate={{ latitude: tech.lat, longitude: tech.lng }}
            tracksViewChanges={false}
        >
            {/* Custom pin */}
            <View style={[styles.pinOuter, { backgroundColor: pinColor }]}>
                <MaterialCommunityIcons name={pinIcon} size={16} color="#FFFFFF" />
            </View>

            {/* Callout — onPress covers the whole card (buttons inside callouts
                don't receive touches on Android) */}
            <Callout tooltip onPress={() => onBook(tech)}>
                <View
                    style={[
                        styles.callout,
                        {
                            backgroundColor: theme.colors.surface,
                            borderRadius: theme.radius.md,
                        },
                        theme.shadow.medium,
                    ]}
                >
                    {/* Avatar + name */}
                    <View style={styles.calloutHeaderRow}>
                        <Avatar name={tech.name} size="sm" />
                        <Text
                            style={[
                                theme.typography.titleSm,
                                { color: theme.colors.textPrimary, marginLeft: 8, flexShrink: 1 },
                            ]}
                            numberOfLines={1}
                        >
                            {tech.name}
                        </Text>
                    </View>

                    {/* Certification badge */}
                    <View style={[styles.certBadge, { backgroundColor: certColor + '18' }]}>
                        <MaterialCommunityIcons
                            name={isCertified ? 'shield-check' : 'alert-circle'}
                            size={13}
                            color={certColor}
                        />
                        <Text
                            style={[
                                theme.typography.captionMedium,
                                { color: certColor, marginLeft: 4 },
                            ]}
                        >
                            {isCertified ? t('cert.certified') : t('cert.independent')}
                        </Text>
                    </View>

                    {/* Star rating */}
                    <Text
                        style={[
                            theme.typography.captionMedium,
                            { color: theme.colors.textPrimary, marginTop: 4 },
                        ]}
                    >
                        {t('cert.reviews', { rating: tech.averageRating.toFixed(1), count: tech.reviewCount })}
                    </Text>

                    {/* Trade + price range */}
                    <Text
                        style={[
                            theme.typography.caption,
                            { color: theme.colors.textSecondary, marginTop: 2 },
                        ]}
                    >
                        {t(TRADE_I18N[tech.trade] ?? 'home.map.handyman')}
                    </Text>
                    <Text
                        style={[
                            theme.typography.caption,
                            { color: theme.colors.textSecondary, marginTop: 2 },
                        ]}
                    >
                        {t('cert.typical', { min, max })}
                    </Text>

                    {/* Book button (visual — tap anywhere on callout triggers) */}
                    <View
                        style={[
                            styles.bookBtn,
                            { backgroundColor: theme.colors.accent, borderRadius: theme.radius.sm },
                        ]}
                    >
                        <Text style={[theme.typography.captionMedium, { color: '#FFFFFF' }]}>
                            {t('cert.book', { name: firstName })}
                        </Text>
                    </View>
                </View>
            </Callout>
        </Marker>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },

    // Layer 1: Top header
    topHeader: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    addressPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },

    // Layer 2: Filter chips
    chipRow: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 10,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        borderWidth: 1,
    },

    // Layer 3: Bottom panel
    bottomPanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: 16,
    },
    techCountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 14,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    categoryScroll: {
        paddingHorizontal: 16,
    },
    categoryCard: {
        width: (SCREEN_WIDTH - 64) / 4,
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        marginRight: 8,
    },
    categoryIcon: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Layer 4: FAB
    fab: {
        position: 'absolute',
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },

    // Pin
    pinOuter: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },

    // Callout
    callout: {
        padding: 12,
        minWidth: 180,
        maxWidth: 240,
    },
    calloutHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    certBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        marginTop: 6,
    },
    bookBtn: {
        alignItems: 'center',
        paddingVertical: 8,
        marginTop: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
});
