/**
 * Screen 1 — Category Select
 *
 * Entry point for the customer service request flow.
 * Displays a 2-column grid of service categories.
 */

import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CATEGORIES, Category, getServiceCountByCategory } from '../../src/data/servicesCatalog';
import { useBookingStore, BookingCertificationLevel } from '../../src/store/useBookingStore';
import { DisclaimerModal } from '../../src/components/DisclaimerModal';
import { t } from '../../src/i18n';

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
    green:       '#12895e',
    greenLight:  '#e8f7f2',
} as const;

const PROGRESS_PCTS = [0, 0.15, 0.40, 0.85, 1.0];

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_W = (SCREEN_W - 24 * 2 - CARD_GAP) / 2;

// ─── Progress bar (shared across all 5 screens) ──────────────────────────────

export function ProgressBar({ step }: { step: 1 | 2 | 3 | 4 | 5 }) {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(anim, {
            toValue: PROGRESS_PCTS[step - 1],
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [step]);

    const width = anim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={progressStyles.track}>
            <Animated.View style={[progressStyles.fill, { width }]} />
        </View>
    );
}

const progressStyles = StyleSheet.create({
    track: {
        height: 3,
        backgroundColor: FZ.border,
    },
    fill: {
        height: 3,
        backgroundColor: FZ.orange,
    },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

const serviceCounts = getServiceCountByCategory();

/** Categories Independent Pros may serve (general handyman / house cleaning / landscaping) */
const INDEPENDENT_CATEGORY_IDS = ['general', 'house_cleaning', 'landscaping'];

export default function CategorySelectScreen() {
    const router = useRouter();
    const reset = useBookingStore((s) => s.reset);
    const acceptDisclaimer = useBookingStore((s) => s.acceptDisclaimer);

    // Certification tab — defaults to CERTIFIED
    const [certTab, setCertTab] = useState<BookingCertificationLevel>('CERTIFIED');
    const [disclaimerVisible, setDisclaimerVisible] = useState(false);
    const [disclaimerFor, setDisclaimerFor] = useState<BookingCertificationLevel>('CERTIFIED');

    // Always reset when entering Step 1 — but preserve direct-booking prefill
    // (map "Book {name}" flow / "Book Again") which sets state before navigating here.
    useEffect(() => {
        const s = useBookingStore.getState();
        const prefill = {
            disclaimerAccepted: s.disclaimerAccepted,
            disclaimerAcceptedAt: s.disclaimerAcceptedAt,
            certificationLevelSelected: s.certificationLevelSelected,
            selectedTechnicianId: s.selectedTechnicianId,
            lastServiceId: s.lastServiceId,
        };
        reset();
        if (prefill.disclaimerAccepted || prefill.selectedTechnicianId || prefill.lastServiceId) {
            useBookingStore.setState(prefill);
        }
        if (prefill.certificationLevelSelected === 'NON_CERTIFIED') {
            setCertTab('NON_CERTIFIED');
        }
        // Gate the flow behind the disclaimer if not yet accepted
        if (!prefill.disclaimerAccepted) {
            setDisclaimerFor(prefill.certificationLevelSelected ?? 'CERTIFIED');
            setDisclaimerVisible(true);
        }
    }, []);

    const handleTabSwitch = (tab: BookingCertificationLevel) => {
        if (tab === certTab) return;
        if (tab === 'NON_CERTIFIED') {
            // Switching to Independent Pros re-triggers the warning disclaimer
            setDisclaimerFor('NON_CERTIFIED');
            setDisclaimerVisible(true);
        } else {
            setCertTab('CERTIFIED');
            useBookingStore.setState({ certificationLevelSelected: 'CERTIFIED' });
        }
    };

    const handleDisclaimerAccept = () => {
        acceptDisclaimer(disclaimerFor);
        setCertTab(disclaimerFor);
        setDisclaimerVisible(false);
    };

    const handleDisclaimerDecline = () => {
        setDisclaimerVisible(false);
        const accepted = useBookingStore.getState().disclaimerAccepted;
        if (disclaimerFor === 'NON_CERTIFIED') {
            // "Show Certified Pros Instead"
            setCertTab('CERTIFIED');
            if (!accepted) {
                setDisclaimerFor('CERTIFIED');
                setDisclaimerVisible(true);
            }
        } else if (!accepted) {
            // Declined the entry disclaimer — leave the booking flow
            router.back();
        }
    };

    const handleCategoryPress = (cat: Category) => {
        router.push({
            pathname: '/(tabs)/service-select',
            params: { categoryId: cat.id },
        });
    };

    const visibleCategories =
        certTab === 'NON_CERTIFIED'
            ? CATEGORIES.filter((c) => INDEPENDENT_CATEGORY_IDS.includes(c.id))
            : CATEGORIES;

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Book a Service</Text>
                <Text style={styles.headerSub}>What do you need help with?</Text>
            </View>
            <ProgressBar step={1} />

            {/* ── Certified / Independent toggle ── */}
            <View style={styles.certToggleRow}>
                <TouchableOpacity
                    style={[styles.certToggleBtn, certTab === 'CERTIFIED' && styles.certToggleBtnActive]}
                    onPress={() => handleTabSwitch('CERTIFIED')}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.certToggleText, certTab === 'CERTIFIED' && styles.certToggleTextActive]}>
                        {t('cert.toggle.certified')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.certToggleBtn, certTab === 'NON_CERTIFIED' && styles.certToggleBtnActiveAmber]}
                    onPress={() => handleTabSwitch('NON_CERTIFIED')}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.certToggleText, certTab === 'NON_CERTIFIED' && styles.certToggleTextActive]}>
                        {t('cert.toggle.independent')}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ── Category grid ── */}
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.grid}>
                    {visibleCategories.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={styles.card}
                            onPress={() => handleCategoryPress(cat)}
                            activeOpacity={0.75}
                        >
                            <Text style={styles.cardIcon}>{cat.icon}</Text>
                            <Text style={styles.cardName}>{cat.name}</Text>
                            <Text style={styles.cardCount}>
                                {serviceCounts[cat.id]}{' '}
                                {serviceCounts[cat.id] === 1 ? 'service' : 'services'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* ── Booking disclaimer ── */}
            <DisclaimerModal
                visible={disclaimerVisible}
                certificationLevel={disclaimerFor}
                onAccept={handleDisclaimerAccept}
                onDecline={handleDisclaimerDecline}
            />
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
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 14,
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
    certToggleRow: {
        flexDirection: 'row',
        marginHorizontal: 24,
        marginTop: 16,
        backgroundColor: '#ecedf0',
        borderRadius: 12,
        padding: 4,
        gap: 4,
    },
    certToggleBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 9,
        alignItems: 'center',
    },
    certToggleBtnActive: {
        backgroundColor: FZ.navy,
    },
    certToggleBtnActiveAmber: {
        backgroundColor: FZ.orange,
    },
    certToggleText: {
        fontSize: 13,
        fontWeight: '600',
        color: FZ.muted,
    },
    certToggleTextActive: {
        color: '#ffffff',
    },
    scroll: {
        padding: 24,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: CARD_GAP,
    },
    card: {
        width: CARD_W,
        backgroundColor: FZ.card,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: FZ.border,
        padding: 18,
        alignItems: 'center',
        gap: 8,
    },
    cardIcon: {
        fontSize: 28,
    },
    cardName: {
        fontSize: 13,
        fontWeight: '600',
        color: FZ.text,
        textAlign: 'center',
    },
    cardCount: {
        fontSize: 11,
        color: FZ.muted,
    },
});
