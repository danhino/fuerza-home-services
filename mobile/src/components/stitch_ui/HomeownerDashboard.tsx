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
import React, { useRef, useCallback, useEffect, useMemo } from 'react';
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
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/useAuthStore';
import { useMapStore, TradeFilter, TechnicianLocation } from '../../store/useMapStore';
import { useLocationStore } from '../../store/useLocationStore';
import { t, useLanguageStore } from '../../i18n';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

// ─── Re-exported types for backward compat with index.tsx ────────────────────

export type TradeKey = 'PLUMBER' | 'ELECTRICIAN' | 'HVAC' | 'POOL';

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
];

const CATEGORY_CARDS: TradeConfig[] = TRADE_FILTERS.slice(1); // Exclude 'ALL'

const TRADE_PIN_ICON: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
    PLUMBER: 'wrench',
    ELECTRICIAN: 'lightning-bolt',
    HVAC: 'snowflake',
    POOL: 'waves',
};

const TRADE_PIN_COLOR: Record<string, string> = {
    PLUMBER: '#3B82F6',
    ELECTRICIAN: '#F59E0B',
    HVAC: '#8B5CF6',
    POOL: '#06B6D4',
};

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

    // Derive filtered techs and online count via useMemo (stable references)
    const filteredTechs = useMemo(() => {
        const all = Object.values(technicianLocations).filter((t) => t.isOnline);
        if (selectedTrade === 'ALL') return all;
        return all.filter((t) => t.trade === selectedTrade);
    }, [technicianLocations, selectedTrade]);

    const onlineCount = useMemo(() => {
        return Object.values(technicianLocations).filter((t) => t.isOnline).length;
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

    // Socket listeners
    useEffect(() => {
        initSocket();
        return () => cleanupSocket();
    }, [initSocket, cleanupSocket]);

    // Start location tracking
    useEffect(() => {
        startTracking();
    }, [startTracking]);

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
                    <TechPin key={tech.techId} tech={tech} theme={theme} />
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

            {/* ═══ Layer 2: Trade Filter Chips ═══ */}
            <View style={[styles.chipRow, { top: insets.top + 60 }]}>
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
                        {t('home.map.techsNearby', { count: onlineCount })}
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
        </View>
    );
}

// ─── TechPin Sub-component ───────────────────────────────────────────────────

interface TechPinProps {
    tech: TechnicianLocation;
    theme: ReturnType<typeof useTheme>;
}

function TechPin({ tech, theme }: TechPinProps) {
    const pinColor = TRADE_PIN_COLOR[tech.trade] || '#6B7280';
    const pinIcon = TRADE_PIN_ICON[tech.trade] || 'wrench';

    return (
        <Marker
            coordinate={{ latitude: tech.lat, longitude: tech.lng }}
            tracksViewChanges={false}
        >
            {/* Custom pin */}
            <View style={[styles.pinOuter, { backgroundColor: pinColor }]}>
                <MaterialCommunityIcons name={pinIcon} size={16} color="#FFFFFF" />
            </View>

            {/* Callout */}
            <Callout tooltip>
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
                    <Text
                        style={[
                            theme.typography.titleSm,
                            { color: theme.colors.textPrimary },
                        ]}
                    >
                        {tech.name}
                    </Text>
                    <Text
                        style={[
                            theme.typography.caption,
                            { color: theme.colors.textSecondary, marginTop: 2 },
                        ]}
                    >
                        {tech.trade}
                    </Text>
                    <View style={styles.ratingRow}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text
                            style={[
                                theme.typography.captionMedium,
                                { color: theme.colors.textPrimary, marginLeft: 3 },
                            ]}
                        >
                            {tech.rating.toFixed(1)}
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
        padding: 10,
        minWidth: 120,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
});
