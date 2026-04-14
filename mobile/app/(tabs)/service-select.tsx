/**
 * Screen 2 — Service Select
 *
 * Lists all services for the chosen category.
 * Progress bar at 15%.
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
import {
    CATEGORIES,
    CategoryId,
    Service,
    getServicesByCategory,
} from '../../src/data/servicesCatalog';
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
} as const;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ServiceSelectScreen() {
    const router = useRouter();
    const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
    const setServiceId = useBookingStore((s) => s.setServiceId);

    const category = CATEGORIES.find((c) => c.id === (categoryId as CategoryId));
    const services = getServicesByCategory((categoryId as CategoryId) ?? 'electrical');

    const handleServicePress = (service: Service) => {
        setServiceId(service.id);
        router.push({
            pathname: '/(tabs)/service-questions',
            params: { serviceId: service.id },
        });
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color="#ffffff" />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.headerTitle}>
                        {category?.icon} {category?.name ?? 'Services'}
                    </Text>
                    <Text style={styles.headerSub}>Choose a service</Text>
                </View>
            </View>
            <ProgressBar step={2} />

            {/* ── Service list ── */}
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {services.map((service) => (
                    <TouchableOpacity
                        key={service.id}
                        style={styles.card}
                        onPress={() => handleServicePress(service)}
                        activeOpacity={0.75}
                    >
                        {/* Icon wrap */}
                        <View style={styles.iconWrap}>
                            <Text style={styles.serviceIcon}>{service.icon}</Text>
                        </View>

                        {/* Text */}
                        <View style={styles.cardBody}>
                            <Text style={styles.serviceName}>{service.name}</Text>
                            <Text style={styles.serviceHint}>{service.hint}</Text>
                        </View>

                        {/* Chevron */}
                        <MaterialCommunityIcons
                            name="chevron-right"
                            size={20}
                            color={FZ.muted}
                        />
                    </TouchableOpacity>
                ))}
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
        gap: 12,
    },
    card: {
        backgroundColor: FZ.card,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: FZ.border,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#fff3ea',
        alignItems: 'center',
        justifyContent: 'center',
    },
    serviceIcon: {
        fontSize: 20,
    },
    cardBody: {
        flex: 1,
    },
    serviceName: {
        fontSize: 14,
        fontWeight: '600',
        color: FZ.text,
    },
    serviceHint: {
        fontSize: 12,
        color: FZ.muted,
        marginTop: 2,
    },
});
