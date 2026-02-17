import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Switch, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useTechnicianStore } from '../../src/store/useTechnicianStore';
import { useMapStore } from '../../src/store/useMapStore';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../src/hooks/useThemeColor';
import { t, useLanguageStore } from '../../src/i18n';

const TRADE_META: { key: 'PLUMBER' | 'ELECTRICIAN' | 'POOL' | 'CLEANING'; icon: string; color: string; i18nKey: string }[] = [
    { key: 'PLUMBER', icon: 'water', color: '#007AFF', i18nKey: 'filter.plumber' },
    { key: 'ELECTRICIAN', icon: 'flash', color: '#FF9500', i18nKey: 'filter.electrician' },
    { key: 'POOL', icon: 'water-outline', color: '#5AC8FA', i18nKey: 'filter.pool' },
    { key: 'CLEANING', icon: 'sparkles', color: '#34C759', i18nKey: 'filter.cleaning' },
];

const MARKER_COLORS: Record<string, string> = {
    PLUMBER: '#007AFF',
    ELECTRICIAN: '#FF9500',
    POOL: '#5AC8FA',
    CLEANING: '#34C759',
};

export default function HomeScreen() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const { isOnline, updateStatus } = useTechnicianStore();
    const { startTracking, stopTracking } = useLocationStore();
    const language = useLanguageStore((s) => s.language);

    const { tradeFilters, toggleTradeFilter, getFilteredLocations, initializeSocketListeners, cleanupSocketListeners } = useMapStore();

    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const cardColor = useThemeColor({}, 'card');

    useEffect(() => {
        initializeSocketListeners();
        return () => cleanupSocketListeners();
    }, []);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }
            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);
        })();
    }, []);

    const toggleStatus = () => {
        const newStatus = !isOnline;
        updateStatus(newStatus);
        if (newStatus) startTracking();
        else stopTracking();
    };

    // ── Technician View ──────────────────────────────
    if (user?.role === 'TECHNICIAN') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor }]}>
                <Text style={[styles.welcomeText, { color: textColor }]}>{t('home.welcome')}, {user?.firstName || user?.name || ''}!</Text>
                <Text style={[styles.title, { color: textColor }]}>{t('home.techDashboard')}</Text>
                <View style={styles.statusContainer}>
                    <Text style={[styles.statusText, { color: textColor }]}>
                        {t('home.status')}: {isOnline ? t('home.online') : t('home.offline')}
                    </Text>
                    <TouchableOpacity
                        style={[styles.button, isOnline ? styles.offlineButton : styles.onlineButton]}
                        onPress={toggleStatus}
                    >
                        <Text style={styles.buttonText}>{isOnline ? t('home.goOffline') : t('home.goOnline')}</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/(tabs)/jobs')}>
                    <Text style={styles.linkText}>{t('home.viewJobs')}</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // ── Customer View ────────────────────────────────
    const filteredLocations = getFilteredLocations();

    return (
        <SafeAreaView style={styles.container}>
            {/* Welcome banner */}
            <View style={styles.welcomeBanner}>
                <Text style={styles.welcomeBannerText}>{t('home.welcome')}, {user?.firstName || user?.name || ''}!</Text>
            </View>

            {location ? (
                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                    provider={PROVIDER_DEFAULT}
                    showsUserLocation
                >
                    {filteredLocations.map((tech) => (
                        <Marker
                            key={tech.techId}
                            coordinate={{ latitude: tech.lat, longitude: tech.lng }}
                            title={tech.trade || 'Technician'}
                            pinColor={MARKER_COLORS[tech.trade || 'PLUMBER'] || '#007AFF'}
                        />
                    ))}
                </MapView>
            ) : (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                    <Text>{errorMsg || t('home.locating')}</Text>
                </View>
            )}

            {/* Filter FAB */}
            <TouchableOpacity style={styles.filterFab} onPress={() => setShowFilters(!showFilters)}>
                <Ionicons name={showFilters ? 'close' : 'options'} size={24} color="#fff" />
            </TouchableOpacity>

            {/* Filter Panel */}
            {showFilters && (
                <View style={styles.filterPanel}>
                    <Text style={styles.filterTitle}>{t('filter.title')}</Text>
                    {TRADE_META.map((trade) => (
                        <View key={trade.key} style={styles.filterRow}>
                            <View style={[styles.filterIcon, { backgroundColor: trade.color }]}>
                                <Ionicons name={trade.icon as any} size={18} color="#fff" />
                            </View>
                            <Text style={styles.filterLabel}>{t(trade.i18nKey)}</Text>
                            <Switch
                                value={tradeFilters[trade.key]}
                                onValueChange={() => toggleTradeFilter(trade.key)}
                                trackColor={{ false: '#3a3a3c', true: trade.color }}
                                thumbColor="#fff"
                            />
                        </View>
                    ))}
                </View>
            )}

            {/* Request Service Button */}
            <View style={[styles.bottomSheet, { backgroundColor: cardColor }]}>
                <TouchableOpacity
                    style={styles.requestButton}
                    onPress={() => router.push('/(tabs)/request')}
                >
                    <Ionicons name="add-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.requestButtonText}>{t('home.requestServiceBtn')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: '100%', height: '100%' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', margin: 20, textAlign: 'center' },
    welcomeText: { fontSize: 20, fontWeight: '600', marginTop: 16, marginHorizontal: 20, textAlign: 'center' },
    welcomeBanner: {
        position: 'absolute' as const,
        top: 60,
        right: 16,
        backgroundColor: 'rgba(24,24,28,0.9)',
        borderRadius: 14,
        paddingVertical: 8,
        paddingHorizontal: 16,
        zIndex: 20,
    },
    welcomeBannerText: { color: '#fff', fontSize: 15, fontWeight: '600' as const },
    statusContainer: { alignItems: 'center', marginTop: 50 },
    statusText: { fontSize: 18, marginBottom: 20 },
    button: { padding: 15, borderRadius: 8, minWidth: 150, alignItems: 'center' },
    onlineButton: { backgroundColor: '#34C759' },
    offlineButton: { backgroundColor: '#FF3B30' },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    linkButton: { marginTop: 20, padding: 10 },
    linkText: { color: '#007AFF', fontSize: 16 },

    // Filter FAB
    filterFab: {
        position: 'absolute',
        top: 60,
        left: 16,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(30,30,34,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },

    // Filter Panel (dark overlay like screenshot)
    filterPanel: {
        position: 'absolute',
        bottom: 100,
        left: 16,
        backgroundColor: 'rgba(24,24,28,0.95)',
        borderRadius: 20,
        padding: 20,
        width: 240,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    filterTitle: {
        color: '#8e8e93',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1.5,
        marginBottom: 16,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    filterIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    filterLabel: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },

    // Bottom sheet
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        padding: 20,
        paddingBottom: 36,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    requestButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    requestButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
