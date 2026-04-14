/**
 * Screen 3 — Service Questions
 *
 * Dynamic question cards for the selected service.
 * choice questions → option pills with radio check
 * photo questions  → dashed upload card with thumbnail preview
 *
 * CTA "Get AI Price Estimate →" is disabled until all choice questions answered.
 * On press: runs pricingEngine, stores result, navigates to Screen 4.
 */

import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getServiceById, ChoiceQuestion, PhotoQuestion, Question } from '../../src/data/servicesCatalog';
import { calculateEstimate } from '../../src/utils/pricingEngine';
import { useBookingStore } from '../../src/store/useBookingStore';
import { ProgressBar } from './request';

// ─── Design tokens ────────────────────────────────────────────────────────────

const FZ = {
    navy:        '#0f2240',
    orange:      '#f57c20',
    orangeLight: '#fff3ea',
    orangeDark:  '#c45e0d',
    bg:          '#f7f8fa',
    card:        '#ffffff',
    border:      'rgba(0,0,0,0.08)',
    text:        '#111827',
    muted:       '#6b7280',
} as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChoiceCard({
    question,
    selected,
    onSelect,
}: {
    question: ChoiceQuestion;
    selected: string | undefined;
    onSelect: (value: string) => void;
}) {
    return (
        <View style={cardStyles.container}>
            <Text style={cardStyles.label}>{question.label}</Text>
            {question.hint && <Text style={cardStyles.hint}>{question.hint}</Text>}
            <View style={cardStyles.options}>
                {question.options.map((opt) => {
                    const isSelected = selected === opt;
                    return (
                        <TouchableOpacity
                            key={opt}
                            style={[cardStyles.pill, isSelected && cardStyles.pillSelected]}
                            onPress={() => onSelect(opt)}
                            activeOpacity={0.75}
                        >
                            {/* Radio circle */}
                            <View style={[cardStyles.radio, isSelected && cardStyles.radioSelected]}>
                                {isSelected && <View style={cardStyles.radioDot} />}
                            </View>
                            <Text style={[cardStyles.pillText, isSelected && cardStyles.pillTextSelected]}>
                                {opt}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

function PhotoCard({
    question,
    uri,
    onPick,
}: {
    question: PhotoQuestion;
    uri: string | undefined;
    onPick: (uri: string) => void;
}) {
    const handlePress = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow photo access to attach images.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            allowsEditing: false,
        });
        if (!result.canceled && result.assets[0]) {
            onPick(result.assets[0].uri);
        }
    };

    return (
        <View style={cardStyles.container}>
            <Text style={cardStyles.label}>{question.label}</Text>
            {question.hint && <Text style={cardStyles.hint}>{question.hint}</Text>}

            <TouchableOpacity
                style={[photoStyles.uploadCard, uri ? photoStyles.uploadCardFilled : undefined]}
                onPress={handlePress}
                activeOpacity={0.8}
            >
                {uri ? (
                    <>
                        <Image source={{ uri }} style={photoStyles.thumbnail} resizeMode="cover" />
                        <View style={photoStyles.changeOverlay}>
                            <MaterialCommunityIcons name="camera-retake" size={18} color="#fff" />
                            <Text style={photoStyles.changeText}>Change</Text>
                        </View>
                    </>
                ) : (
                    <View style={photoStyles.placeholder}>
                        <MaterialCommunityIcons name="camera-plus-outline" size={28} color={FZ.muted} />
                        <Text style={photoStyles.placeholderText}>Tap to add photo</Text>
                        <Text style={photoStyles.placeholderSub}>Optional but helpful</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}

const cardStyles = StyleSheet.create({
    container: {
        backgroundColor: FZ.card,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: FZ.border,
        padding: 16,
        gap: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: FZ.text,
    },
    hint: {
        fontSize: 12,
        color: FZ.muted,
        marginTop: -4,
    },
    options: {
        gap: 8,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1.5,
        borderColor: FZ.border,
        borderRadius: 10,
        paddingVertical: 11,
        paddingHorizontal: 14,
        backgroundColor: FZ.card,
    },
    pillSelected: {
        borderColor: FZ.orange,
        backgroundColor: FZ.orangeLight,
    },
    radio: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1.5,
        borderColor: FZ.muted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        borderColor: FZ.orange,
    },
    radioDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: FZ.orange,
    },
    pillText: {
        fontSize: 14,
        color: FZ.text,
        fontWeight: '400',
        flex: 1,
    },
    pillTextSelected: {
        color: FZ.orange,
        fontWeight: '600',
    },
});

const photoStyles = StyleSheet.create({
    uploadCard: {
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: FZ.border,
        borderRadius: 10,
        height: 140,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadCardFilled: {
        borderStyle: 'solid',
        borderColor: FZ.orange,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    changeOverlay: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    changeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    placeholder: {
        alignItems: 'center',
        gap: 6,
    },
    placeholderText: {
        fontSize: 13,
        fontWeight: '600',
        color: FZ.muted,
    },
    placeholderSub: {
        fontSize: 11,
        color: FZ.muted,
    },
});

// ─── Step dots ────────────────────────────────────────────────────────────────

function StepDots({ total, active }: { total: number; active: number }) {
    return (
        <View style={dotStyles.row}>
            {Array.from({ length: total }).map((_, i) => (
                <View
                    key={i}
                    style={[dotStyles.dot, i + 1 === active && dotStyles.dotActive]}
                />
            ))}
        </View>
    );
}

const dotStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: 6,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 4,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: FZ.border,
    },
    dotActive: {
        backgroundColor: FZ.orange,
        width: 20,
    },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ServiceQuestionsScreen() {
    const router = useRouter();
    const { serviceId } = useLocalSearchParams<{ serviceId: string }>();

    const answers = useBookingStore((s) => s.answers);
    const setAnswer = useBookingStore((s) => s.setAnswer);
    const setEstimate = useBookingStore((s) => s.setEstimate);

    const service = useMemo(() => getServiceById(serviceId ?? ''), [serviceId]);

    // All choice questions must be answered to enable the CTA
    const allChoicesAnswered = useMemo(() => {
        if (!service) return false;
        return service.questions
            .filter((q): q is ChoiceQuestion => q.type === 'choice')
            .every((q) => !!answers[q.id]);
    }, [service, answers]);

    const handleGetEstimate = () => {
        if (!service) return;
        const result = calculateEstimate(service.id, answers);
        setEstimate(result);
        router.push({
            pathname: '/(tabs)/service-estimate',
            params: { serviceId: service.id },
        });
    };

    if (!service) {
        return (
            <SafeAreaView style={styles.safe} edges={['top']}>
                <Text style={{ color: FZ.muted, textAlign: 'center', marginTop: 40 }}>
                    Service not found.
                </Text>
            </SafeAreaView>
        );
    }

    const choiceCount = service.questions.filter((q) => q.type === 'choice').length;

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color="#ffffff" />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.headerTitle}>{service.name}</Text>
                    <Text style={styles.headerSub}>Tell us a bit more</Text>
                </View>
            </View>
            <ProgressBar step={3} />
            <StepDots total={choiceCount} active={Object.keys(answers).length + 1} />

            {/* ── Questions ── */}
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {service.questions.map((q: Question) => {
                    if (q.type === 'choice') {
                        return (
                            <ChoiceCard
                                key={q.id}
                                question={q}
                                selected={answers[q.id]}
                                onSelect={(val) => setAnswer(q.id, val)}
                            />
                        );
                    }
                    return (
                        <PhotoCard
                            key={q.id}
                            question={q}
                            uri={answers[q.id]}
                            onPick={(uri) => setAnswer(q.id, uri)}
                        />
                    );
                })}

                {/* ── CTA ── */}
                <TouchableOpacity
                    style={[styles.cta, !allChoicesAnswered && styles.ctaDisabled]}
                    onPress={handleGetEstimate}
                    disabled={!allChoicesAnswered}
                    activeOpacity={0.85}
                >
                    <Text style={styles.ctaText}>Get AI Price Estimate →</Text>
                </TouchableOpacity>
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
        gap: 14,
        paddingBottom: 32,
    },
    cta: {
        backgroundColor: FZ.orange,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 6,
    },
    ctaDisabled: {
        opacity: 0.35,
    },
    ctaText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
});
