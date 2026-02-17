import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
    ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../src/services/api';
import { useTriageStore } from '../src/store/useTriageStore';
import { t, useLanguageStore } from '../src/i18n';
import { useThemeColor } from '../src/hooks/useThemeColor';

const PLATFORM_FEE = 2.99;

export default function EstimateScreen() {
    const router = useRouter();
    useLanguageStore((s) => s.language); // subscribe for re-render on language change
    const pending = useTriageStore((s) => s.pending);
    const triageResult = useTriageStore((s) => s.triageResult);
    const clearAll = useTriageStore((s) => s.clear);

    const [submitting, setSubmitting] = useState(false);

    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const cardColor = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');

    // Derive cost breakdown from triage result
    const laborLow = triageResult ? Math.round(triageResult.priceLow * 0.6) : 80;
    const laborHigh = triageResult ? Math.round(triageResult.priceHigh * 0.6) : 300;
    const partsLow = triageResult ? Math.round(triageResult.priceLow * 0.4) : 20;
    const partsHigh = triageResult ? Math.round(triageResult.priceHigh * 0.4) : 200;
    const totalLow = laborLow + partsLow + PLATFORM_FEE;
    const totalHigh = laborHigh + partsHigh + PLATFORM_FEE;

    const handleAgree = async () => {
        if (!pending) return;
        setSubmitting(true);
        try {
            await api.post('/jobs', {
                trade: pending.trade,
                description: pending.description,
                address: pending.address,
                lat: pending.lat,
                lng: pending.lng,
                photos: pending.photoData,
                issueTag: pending.issueTag || undefined,
                videoUrl: pending.videoData || undefined,
            });
            clearAll();
            Alert.alert(t('request.success'), t('request.successBody'));
            router.replace('/(tabs)/jobs');
        } catch (e) {
            Alert.alert(t('home.error'), t('request.failed'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        router.back();
    };

    // Guard — if no data, go back
    if (!pending || !triageResult) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor }]}>
                <Text style={{ color: textColor, textAlign: 'center', marginTop: 40 }}>
                    {t('estimate.noData')}
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor }}>
            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack}>
                        <Ionicons name="arrow-back" size={24} color={textColor} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: textColor }]}>
                        {t('estimate.title')}
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Subtitle */}
                <Text style={[styles.subtitle, { color: textColor }]}>
                    {t('estimate.subtitle')}
                </Text>

                {/* Breakdown Card */}
                <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
                    {/* Labor */}
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="construct-outline" size={20} color="#007AFF" />
                            <Text style={[styles.rowLabel, { color: textColor }]}>
                                {t('estimate.labor')}
                            </Text>
                        </View>
                        <Text style={[styles.rowValue, { color: textColor }]}>
                            ${laborLow} – ${laborHigh}
                        </Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: borderColor }]} />

                    {/* Parts */}
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="hardware-chip-outline" size={20} color="#FF9500" />
                            <Text style={[styles.rowLabel, { color: textColor }]}>
                                {t('estimate.parts')}
                            </Text>
                        </View>
                        <Text style={[styles.rowValue, { color: textColor }]}>
                            ${partsLow} – ${partsHigh}
                        </Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: borderColor }]} />

                    {/* Platform Fee */}
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="shield-checkmark-outline" size={20} color="#34C759" />
                            <Text style={[styles.rowLabel, { color: textColor }]}>
                                {t('estimate.platformFee')}
                            </Text>
                        </View>
                        <Text style={[styles.rowValue, { color: textColor }]}>
                            ${PLATFORM_FEE.toFixed(2)}
                        </Text>
                    </View>

                    <View style={[styles.totalDivider, { backgroundColor: textColor }]} />

                    {/* Total */}
                    <View style={styles.row}>
                        <Text style={[styles.totalLabel, { color: textColor }]}>
                            {t('estimate.total')}
                        </Text>
                        <Text style={[styles.totalValue, { color: textColor }]}>
                            ${totalLow.toFixed(2)} – ${totalHigh.toFixed(2)}
                        </Text>
                    </View>
                </View>

                {/* Disclaimer */}
                <View style={styles.disclaimer}>
                    <Ionicons name="information-circle-outline" size={18} color="#8E8E93" />
                    <Text style={styles.disclaimerText}>
                        {t('estimate.disclaimer')}
                    </Text>
                </View>

                {/* Agree Button */}
                <TouchableOpacity
                    style={[styles.agreeButton, submitting && styles.agreeButtonDisabled]}
                    onPress={handleAgree}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.agreeButtonText}>
                                {t('estimate.agree')}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20, paddingBottom: 40 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    subtitle: {
        fontSize: 14,
        marginBottom: 24,
        opacity: 0.7,
    },
    card: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowLabel: {
        fontSize: 16,
        marginLeft: 10,
    },
    rowValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        opacity: 0.3,
    },
    totalDivider: {
        height: 2,
        opacity: 0.2,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    disclaimer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 28,
        paddingHorizontal: 4,
    },
    disclaimerText: {
        fontSize: 13,
        color: '#8E8E93',
        marginLeft: 6,
        flex: 1,
        lineHeight: 18,
    },
    agreeButton: {
        backgroundColor: '#34C759',
        padding: 16,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    agreeButtonDisabled: {
        opacity: 0.6,
    },
    agreeButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
});
