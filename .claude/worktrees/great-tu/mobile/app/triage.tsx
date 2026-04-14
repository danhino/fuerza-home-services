import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
    ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../src/services/api';
import { useThemeColor } from '../src/hooks/useThemeColor';
import { t, useLanguageStore } from '../src/i18n';
import { useTriageStore } from '../src/store/useTriageStore';

interface LikelyIssue {
    name: string;
    confidence: number;
}

interface TriageResult {
    likelyIssues: LikelyIssue[];
    severity: 'URGENT_SAMEDAY' | 'SCHEDULED';
    timeEstimateLowMins: number;
    timeEstimateHighMins: number;
    priceLow: number;
    priceHigh: number;
}

const FALLBACK_RESULT: TriageResult = {
    likelyIssues: [{ name: 'General service', confidence: 0.5 }],
    severity: 'SCHEDULED',
    timeEstimateLowMins: 30,
    timeEstimateHighMins: 180,
    priceLow: 100,
    priceHigh: 500,
};

export default function TriageScreen() {
    const router = useRouter();
    const language = useLanguageStore((s) => s.language);
    const pending = useTriageStore((s) => s.pending);
    const clearPending = useTriageStore((s) => s.clear);

    const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isFallback, setIsFallback] = useState(false);

    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const cardColor = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');

    useEffect(() => {
        if (!pending) {
            router.back();
            return;
        }
        callTriage();
    }, []);

    const callTriage = async () => {
        if (!pending) return;
        try {
            const response = await api.post('/triage', {
                trade: pending.trade,
                issueTag: pending.issueTag || undefined,
                description: pending.description,
                photoUrls: pending.photoData.length > 0 ? ['attached'] : [],
                videoUrl: pending.videoData ? 'attached' : undefined,
                preferredLanguage: language,
            });
            setTriageResult(response.data);
            setIsFallback(false);
        } catch (e) {
            console.log('Triage failed, using fallback:', e);
            setTriageResult(FALLBACK_RESULT);
            setIsFallback(true);
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => {
        if (!pending || !triageResult) return;
        // Store triage result for the estimate screen
        useTriageStore.getState().setTriageResult(triageResult);
        router.push('/estimate');
    };

    const handleEdit = () => {
        router.back();
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor }]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={[styles.loadingText, { color: textColor }]}>{t('triage.loading')}</Text>
            </View>
        );
    }

    const result = triageResult!;
    const isUrgent = result.severity === 'URGENT_SAMEDAY';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scroll}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleEdit}>
                            <Ionicons name="arrow-back" size={24} color={textColor} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: textColor }]}>{t('triage.title')}</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {/* Fallback warning */}
                    {isFallback && (
                        <View style={styles.fallbackBanner}>
                            <Ionicons name="warning" size={18} color="#FF9500" />
                            <Text style={styles.fallbackText}>{t('triage.fallback')}</Text>
                        </View>
                    )}

                    {/* Likely Issue */}
                    <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
                        <Text style={[styles.cardLabel, { color: textColor }]}>{t('triage.likelyIssue')}</Text>
                        {result.likelyIssues.map((issue, i) => (
                            <View key={i} style={styles.issueRow}>
                                <Text style={[styles.issueName, { color: textColor }]}>{issue.name}</Text>
                                <Text style={styles.issueConfidence}>
                                    {Math.round(issue.confidence * 100)}% {t('triage.confidence')}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Severity */}
                    <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
                        <Text style={[styles.cardLabel, { color: textColor }]}>{t('triage.severity')}</Text>
                        <View style={[styles.severityBadge, isUrgent ? styles.urgentBadge : styles.scheduledBadge]}>
                            <Ionicons
                                name={isUrgent ? 'alert-circle' : 'calendar'}
                                size={18}
                                color="#fff"
                            />
                            <Text style={styles.severityText}>
                                {isUrgent ? t('triage.severityUrgent') : t('triage.severityScheduled')}
                            </Text>
                        </View>
                    </View>

                    {/* Time Estimate */}
                    <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
                        <Text style={[styles.cardLabel, { color: textColor }]}>{t('triage.timeEstimate')}</Text>
                        <View style={styles.rangeRow}>
                            <Ionicons name="time-outline" size={22} color="#007AFF" />
                            <Text style={[styles.rangeText, { color: textColor }]}>
                                {result.timeEstimateLowMins} – {result.timeEstimateHighMins} {t('triage.minutes')}
                            </Text>
                        </View>
                    </View>

                    {/* Price Range */}
                    <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
                        <Text style={[styles.cardLabel, { color: textColor }]}>{t('triage.priceRange')}</Text>
                        <View style={styles.rangeRow}>
                            <Ionicons name="cash-outline" size={22} color="#34C759" />
                            <Text style={[styles.rangeText, { color: textColor }]}>
                                ${result.priceLow} – ${result.priceHigh}
                            </Text>
                        </View>
                    </View>

                    {/* Disclaimer */}
                    <View style={styles.disclaimerContainer}>
                        <Ionicons name="information-circle-outline" size={16} color="#8e8e93" />
                        <Text style={styles.disclaimerText}>{t('triage.disclaimer')}</Text>
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={[styles.editButton, { borderColor }]} onPress={handleEdit}>
                            <Ionicons name="pencil" size={18} color={textColor} />
                            <Text style={[styles.editButtonText, { color: textColor }]}>{t('triage.edit')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.continueButton, submitting && { opacity: 0.6 }]}
                            onPress={handleContinue}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.continueButtonText}>{t('triage.continue')}</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '500',
    },
    scroll: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        marginTop: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    fallbackBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFF3E0',
        padding: 12,
        borderRadius: 10,
        marginBottom: 16,
    },
    fallbackText: {
        color: '#E65100',
        fontSize: 13,
        flex: 1,
    },
    card: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
    },
    cardLabel: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        opacity: 0.6,
        marginBottom: 10,
    },
    issueRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    issueName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    issueConfidence: {
        fontSize: 12,
        color: '#8e8e93',
        fontWeight: '500',
    },
    severityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    urgentBadge: {
        backgroundColor: '#FF3B30',
    },
    scheduledBadge: {
        backgroundColor: '#007AFF',
    },
    severityText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    rangeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    rangeText: {
        fontSize: 22,
        fontWeight: '700',
    },
    disclaimerContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: 4,
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    disclaimerText: {
        color: '#8e8e93',
        fontSize: 12,
        lineHeight: 18,
        flex: 1,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    editButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    editButtonText: {
        fontWeight: '600',
        fontSize: 15,
    },
    continueButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        borderRadius: 12,
    },
    continueButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
