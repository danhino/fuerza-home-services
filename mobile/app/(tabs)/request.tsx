/**
 * request.tsx — Multi-step Service Request Wizard
 *
 * 4-step checkout-style flow:
 *   Step 1: Select Trade (2-column grid)
 *   Step 2: Describe Issue (multiline + photos)
 *   Step 3: Service Address (input + map preview)
 *   Step 4: Review & Get Estimate → Confirm & Book
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    TextInput as RNTextInput,
    Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useTheme } from '../../src/hooks/useTheme';
import { t, useLanguageStore } from '../../src/i18n';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import api from '../../src/services/api';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { useStripe } from '@stripe/stripe-react-native';

// ─── Types ───────────────────────────────────────────────────────────────────

type Trade = 'PLUMBER' | 'ELECTRICIAN' | 'HVAC' | 'POOL' | 'HOUSE_CLEANING' | 'GENERAL_HANDYMAN';

interface TradeOption {
    key: Trade;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    color: string;
    i18nLabel: string;
    i18nDesc: string;
}

const TRADES: TradeOption[] = [
    { key: 'PLUMBER', icon: 'wrench', color: '#3B82F6', i18nLabel: 'home.map.plumbing', i18nDesc: 'request.plumbingDesc' },
    { key: 'ELECTRICIAN', icon: 'lightning-bolt', color: '#F59E0B', i18nLabel: 'home.map.electrical', i18nDesc: 'request.electricalDesc' },
    { key: 'HVAC', icon: 'snowflake', color: '#8B5CF6', i18nLabel: 'home.map.hvac', i18nDesc: 'request.hvacDesc' },
    { key: 'POOL', icon: 'waves', color: '#06B6D4', i18nLabel: 'home.map.pool', i18nDesc: 'request.poolDesc' },
    { key: 'HOUSE_CLEANING', icon: 'broom', color: '#22C55E', i18nLabel: 'request.houseCleaning', i18nDesc: 'request.cleaningDesc' },
    { key: 'GENERAL_HANDYMAN', icon: 'hammer-wrench', color: '#F97316', i18nLabel: 'request.generalHandyman', i18nDesc: 'request.handymanDesc' },
];

// ─── Issue Tiles ─────────────────────────────────────────────────────────────

interface IssueTile {
    i18nKey: string;
    /** Only used for HOUSE_CLEANING — sets the cleaning price hint */
    priceHint?: number;
    /** If true, clears description and focuses input instead of pre-populating */
    isOther?: boolean;
}

const ISSUE_TILES: Record<Trade, IssueTile[]> = {
    PLUMBER: [
        { i18nKey: 'tile.plumber.leakSink' },
        { i18nKey: 'tile.plumber.replaceToilet' },
        { i18nKey: 'tile.plumber.showerLever' },
        { i18nKey: 'tile.plumber.cloggedDrain' },
        { i18nKey: 'tile.plumber.waterHeater' },
    ],
    ELECTRICIAN: [
        { i18nKey: 'tile.electrician.replaceOutlet' },
        { i18nKey: 'tile.electrician.ceilingFan' },
        { i18nKey: 'tile.electrician.evCharger' },
        { i18nKey: 'tile.electrician.breaker' },
        { i18nKey: 'tile.electrician.lightSwitch' },
    ],
    HVAC: [
        { i18nKey: 'tile.hvac.dirtyFilters' },
        { i18nKey: 'tile.hvac.notCooling' },
        { i18nKey: 'tile.hvac.waterLeak' },
        { i18nKey: 'tile.hvac.notHeating' },
        { i18nKey: 'tile.hvac.restrictedAirflow' },
        { i18nKey: 'tile.hvac.notStarting' },
    ],
    POOL: [
        { i18nKey: 'tile.pool.cleaning' },
        { i18nKey: 'tile.pool.filterCleaning' },
        { i18nKey: 'tile.pool.pumpStopped' },
        { i18nKey: 'tile.pool.stains' },
        { i18nKey: 'tile.pool.algae' },
        { i18nKey: 'tile.pool.cloudyWater' },
        { i18nKey: 'tile.pool.lights' },
    ],
    HOUSE_CLEANING: [
        { i18nKey: 'tile.cleaning.small', priceHint: 125 },
        { i18nKey: 'tile.cleaning.medium', priceHint: 175 },
        { i18nKey: 'tile.cleaning.large', priceHint: 275 },
        { i18nKey: 'tile.cleaning.xl', priceHint: 325 },
    ],
    GENERAL_HANDYMAN: [
        { i18nKey: 'tile.handyman.assembleFurniture' },
        { i18nKey: 'tile.handyman.mountTv' },
        { i18nKey: 'tile.handyman.patchDrywall' },
        { i18nKey: 'tile.handyman.installLock' },
        { i18nKey: 'tile.handyman.caulking' },
        { i18nKey: 'tile.handyman.hangPictures' },
        { i18nKey: 'tile.handyman.squeakyDoor' },
        { i18nKey: 'tile.handyman.other', isOther: true },
    ],
};

// Trade-specific flat-rate fallbacks
const FLAT_RATES: Record<Trade, number> = {
    PLUMBER: 140,
    ELECTRICIAN: 165,
    HVAC: 200,
    POOL: 120,
    HOUSE_CLEANING: 150,
    GENERAL_HANDYMAN: 95,
};

const TOTAL_STEPS = 4;
const BOOKING_FEE = 2.99;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Component ───────────────────────────────────────────────────────────────

export default function RequestScreen() {
    const theme = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ trade?: string }>();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    // Subscribe for re-render on language change
    useLanguageStore((s) => s.language);

    // ── Form State ───────────────────────────────────────────────────────────
    const [step, setStep] = useState(1);
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(
        (params.trade as Trade) || null
    );
    const [description, setDescription] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationDetected, setLocationDetected] = useState(false);
    const [selectedTile, setSelectedTile] = useState<string | null>(null);
    const [cleaningPriceHint, setCleaningPriceHint] = useState<number | null>(null);

    // ── Step 4 State ─────────────────────────────────────────────────────────
    const [estimating, setEstimating] = useState(false);
    const [estimate, setEstimate] = useState<{ serviceFee: number } | null>(null);
    const [booking, setBooking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Progress bar animation ───────────────────────────────────────────────
    const progressAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.spring(progressAnim, {
            toValue: step,
            useNativeDriver: false,
            damping: 20,
            stiffness: 200,
        }).start();
    }, [step, progressAnim]);

    // ── Locations ────────────────────────────────────────────────────────────
    const storeLocation = useLocationStore((s) => s.location);

    useEffect(() => {
        if (storeLocation) {
            setLocation({
                lat: storeLocation.coords.latitude,
                lng: storeLocation.coords.longitude,
            });
        }
    }, [storeLocation]);

    // ── Photo Handling ───────────────────────────────────────────────────────

    const pickPhotos = useCallback(async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 1,
            selectionLimit: 5 - photos.length,
        });
        if (result.canceled) return;

        const compressed: string[] = [];
        for (const asset of result.assets) {
            const manipulated = await ImageManipulator.manipulateAsync(
                asset.uri,
                [{ resize: { width: 800 } }],
                { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
            );
            compressed.push(manipulated.uri);
        }
        setPhotos((prev) => [...prev, ...compressed].slice(0, 5));
    }, [photos.length]);

    const removePhoto = useCallback((index: number) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
    }, []);

    // ── Use current location ─────────────────────────────────────────────────

    const useCurrentLocation = useCallback(async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });

        // Reverse geocode
        const [geo] = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
        });
        if (geo) {
            const parts = [geo.streetNumber, geo.street, geo.city, geo.region, geo.postalCode].filter(Boolean);
            setAddress(parts.join(', '));
            setLocationDetected(true);
        }
    }, []);

    // ── Estimate & Booking ───────────────────────────────────────────────────

    const fetchEstimate = useCallback(async () => {
        // For HOUSE_CLEANING with a price hint, skip the API call
        if (selectedTrade === 'HOUSE_CLEANING' && cleaningPriceHint) {
            setEstimate({ serviceFee: cleaningPriceHint });
            return;
        }

        setEstimating(true);
        setError(null);
        try {
            const { data } = await api.post('/jobs/estimate', {
                trade: selectedTrade,
                description,
                address,
            });
            setEstimate({ serviceFee: data.estimatedPrice || data.serviceFee || FLAT_RATES[selectedTrade || 'PLUMBER'] });
        } catch {
            // Trade-specific fallback
            setEstimate({ serviceFee: FLAT_RATES[selectedTrade || 'PLUMBER'] });
        } finally {
            setEstimating(false);
        }
    }, [selectedTrade, description, address, cleaningPriceHint]);

    // ── Friendly Stripe error mapper ──────────────────────────────────────
    const mapStripeError = useCallback((code?: string) => {
        const lang = useLanguageStore.getState().language;
        switch (code) {
            case 'Canceled':
                return lang === 'es' ? 'Pago cancelado.' : 'Payment cancelled.';
            case 'Failed':
                return lang === 'es'
                    ? 'El pago no se pudo procesar. Verifica tu tarjeta.'
                    : 'Payment could not be processed. Please check your card.';
            default:
                return lang === 'es'
                    ? 'Error al procesar el pago. Intenta de nuevo.'
                    : 'Payment error. Please try again.';
        }
    }, []);

    const handleBook = useCallback(async () => {
        setBooking(true);
        setError(null);
        try {
            const totalCents = Math.round(
                ((estimate?.serviceFee ?? 0) + BOOKING_FEE) * 100
            );

            // 1. Create PaymentIntent on the server
            console.log('[Payment] Step 1: Creating PaymentIntent, amount:', totalCents);
            const { data: pi } = await api.post('/payments/create-payment-intent', {
                amountCents: totalCents,
            });
            console.log('[Payment] Step 1 result:', JSON.stringify(pi, null, 2));

            if (!pi.success || !pi.clientSecret) {
                console.log('[Payment] Step 1 FAILED — no clientSecret');
                setError(mapStripeError());
                return;
            }

            // 2. Try PaymentSheet — will fail gracefully in Expo Go
            let paymentConfirmed = false;
            try {
                console.log('[Payment] Step 2: Initializing PaymentSheet');
                const { error: initError } = await initPaymentSheet({
                    paymentIntentClientSecret: pi.clientSecret,
                    customerEphemeralKeySecret: pi.ephemeralKey || undefined,
                    customerId: pi.customerId || undefined,
                    merchantDisplayName: 'Fuerza Home Services',
                    allowsDelayedPaymentMethods: false,
                });

                if (initError) {
                    console.log('[Payment] Step 2: initPaymentSheet error (likely Expo Go):', JSON.stringify(initError));
                    // Fall through to dev bypass below
                } else {
                    // 3. Present the PaymentSheet to the user
                    console.log('[Payment] Step 3: Presenting PaymentSheet');
                    const { error: presentError } = await presentPaymentSheet();

                    if (presentError) {
                        if (presentError.code === 'Canceled') {
                            setBooking(false);
                            return;
                        }
                        setError(mapStripeError(presentError.code));
                        return;
                    }
                    paymentConfirmed = true;
                }
            } catch (stripeErr) {
                console.log('[Payment] Stripe native module not available (Expo Go):', stripeErr);
            }

            // Dev bypass: if PaymentSheet couldn't open (Expo Go), proceed with the PI
            if (!paymentConfirmed) {
                console.log('[Payment] DEV MODE: Skipping PaymentSheet, using PaymentIntent directly');
            }

            // 4. Create the job using FormData for photo uploads
            const lat = location?.lat || 29.4241;
            const lng = location?.lng || -98.4936;

            const formData: any = new FormData();
            formData.append('trade', selectedTrade);
            formData.append('description', description);
            formData.append('address', address);
            formData.append('lat', String(lat));
            formData.append('lng', String(lng));
            if (estimate) {
                formData.append('estimatedPrice', String(estimate.serviceFee + BOOKING_FEE));
            }
            if (pi.paymentIntentId) {
                formData.append('paymentIntentId', pi.paymentIntentId);
            }

            // Append each photo as a file
            for (let i = 0; i < photos.length; i++) {
                const uri = photos[i];
                const filename = `photo_${i}_${Date.now()}.jpg`;
                formData.append('photos', {
                    uri,
                    name: filename,
                    type: 'image/jpeg',
                });
            }

            const { data } = await api.post('/jobs', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            router.replace({
                pathname: '/(tabs)/jobs',
                params: { jobId: data.id },
            });
        } catch {
            setError(t('request.bookingFailed'));
        } finally {
            setBooking(false);
        }
    }, [selectedTrade, description, address, location, photos, estimate, router, initPaymentSheet, presentPaymentSheet, mapStripeError]);

    // ── Step 4: trigger estimate on mount ─────────────────────────────────────

    useEffect(() => {
        if (step === 4 && !estimate && !estimating) {
            fetchEstimate();
        }
    }, [step, estimate, estimating, fetchEstimate]);

    // ── Navigation ───────────────────────────────────────────────────────────

    const canContinue = () => {
        switch (step) {
            case 1: return !!selectedTrade;
            case 2: return description.trim().length > 0;
            case 3: return locationDetected || address.trim().length >= 10;
            default: return true;
        }
    };

    const goNext = () => {
        if (step < TOTAL_STEPS) setStep(step + 1);
    };
    const goBack = () => {
        if (step > 1) {
            setStep(step - 1);
            if (step === 4) { setEstimate(null); setError(null); }
        } else {
            router.back();
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    const STEP_LABELS = [
        t('request.step1'),
        t('request.step2'),
        t('request.step3'),
        t('request.step4'),
    ];

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
            {/* ── Header ── */}
            <View style={[styles.header, { paddingHorizontal: theme.spacing.lg }]}>
                <TouchableOpacity onPress={goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[theme.typography.titleLg, { color: theme.colors.textPrimary, flex: 1, textAlign: 'center' }]}>
                    {t('request.title')}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {/* ── Progress Bar ── */}
            <View style={[styles.progressContainer, { paddingHorizontal: theme.spacing.lg }]}>
                <View style={[styles.progressTrack, { backgroundColor: theme.colors.backgroundTertiary, borderRadius: theme.radius.full }]}>
                    <Animated.View
                        style={[
                            styles.progressFill,
                            {
                                backgroundColor: theme.colors.accent,
                                borderRadius: theme.radius.full,
                                width: progressAnim.interpolate({
                                    inputRange: [1, TOTAL_STEPS],
                                    outputRange: ['25%', '100%'],
                                }),
                            },
                        ]}
                    />
                </View>
                <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginTop: 6, textAlign: 'center' }]}>
                    {STEP_LABELS[step - 1]}
                </Text>
            </View>

            {/* ── Step Content ── */}
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.spacing.lg }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {step === 1 && (
                        <StepSelectTrade
                            theme={theme}
                            selectedTrade={selectedTrade}
                            onSelect={setSelectedTrade}
                        />
                    )}
                    {step === 2 && (
                        <StepDescribeIssue
                            theme={theme}
                            selectedTrade={selectedTrade}
                            description={description}
                            setDescription={setDescription}
                            photos={photos}
                            pickPhotos={pickPhotos}
                            removePhoto={removePhoto}
                            selectedTile={selectedTile}
                            setSelectedTile={setSelectedTile}
                            setCleaningPriceHint={setCleaningPriceHint}
                        />
                    )}
                    {step === 3 && (
                        <StepAddress
                            theme={theme}
                            address={address}
                            setAddress={setAddress}
                            location={location}
                            locationDetected={locationDetected}
                            useCurrentLocation={useCurrentLocation}
                        />
                    )}
                    {step === 4 && (
                        <StepReview
                            theme={theme}
                            selectedTrade={selectedTrade}
                            description={description}
                            address={address}
                            estimating={estimating}
                            estimate={estimate}
                            error={error}
                        />
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Bottom Button ── */}
            <View
                style={[
                    styles.bottomBar,
                    {
                        paddingHorizontal: theme.spacing.lg,
                        paddingBottom: Math.max(insets.bottom, theme.spacing.lg),
                        backgroundColor: theme.colors.background,
                        borderTopColor: theme.colors.divider,
                    },
                ]}
            >
                {step < 4 ? (
                    <Button
                        label={t('request.continue')}
                        onPress={goNext}
                        variant="primary"
                        size="lg"
                        disabled={!canContinue()}
                        rightIcon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
                    />
                ) : (
                    <View>
                        <Button
                            label={t('request.confirmBook')}
                            onPress={handleBook}
                            variant="primary"
                            size="lg"
                            loading={booking}
                            disabled={estimating || !estimate}
                        />
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.cancelBtn}
                        >
                            <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
                                {t('request.cancel')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Step 1 — Select Trade
// ═══════════════════════════════════════════════════════════════════════════════

interface StepSelectTradeProps {
    theme: ReturnType<typeof useTheme>;
    selectedTrade: Trade | null;
    onSelect: (trade: Trade) => void;
}

function StepSelectTrade({ theme, selectedTrade, onSelect }: StepSelectTradeProps) {
    return (
        <View>
            <Text style={[theme.typography.headingSm, { color: theme.colors.textPrimary, marginBottom: theme.spacing.lg }]}>
                {t('request.selectTrade')}
            </Text>
            <View style={styles.tradeGrid}>
                {TRADES.map((trade) => {
                    const isSelected = selectedTrade === trade.key;
                    return (
                        <TouchableOpacity
                            key={trade.key}
                            onPress={() => onSelect(trade.key)}
                            activeOpacity={0.7}
                            style={[
                                styles.tradeCard,
                                {
                                    backgroundColor: theme.colors.surface,
                                    borderRadius: theme.radius.lg,
                                    borderColor: isSelected ? theme.colors.accent : theme.colors.borderLight,
                                    borderWidth: isSelected ? 2 : 1,
                                },
                                theme.shadow.card,
                            ]}
                        >
                            {/* Checkmark badge */}
                            {isSelected && (
                                <View style={[styles.checkBadge, { backgroundColor: theme.colors.accent }]}>
                                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                </View>
                            )}
                            {/* Icon circle */}
                            <View
                                style={[
                                    styles.tradeIconCircle,
                                    {
                                        backgroundColor: trade.color + '18',
                                        borderRadius: theme.radius.md,
                                    },
                                ]}
                            >
                                <MaterialCommunityIcons name={trade.icon} size={28} color={trade.color} />
                            </View>
                            <Text
                                style={[
                                    theme.typography.titleSm,
                                    { color: theme.colors.textPrimary, marginTop: theme.spacing.sm },
                                ]}
                            >
                                {t(trade.i18nLabel)}
                            </Text>
                            <Text
                                style={[
                                    theme.typography.caption,
                                    { color: theme.colors.textTertiary, marginTop: 2, textAlign: 'center' },
                                ]}
                            >
                                {t(trade.i18nDesc)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Step 2 — Describe Issue
// ═══════════════════════════════════════════════════════════════════════════════

interface StepDescribeIssueProps {
    theme: ReturnType<typeof useTheme>;
    selectedTrade: Trade | null;
    description: string;
    setDescription: (d: string) => void;
    photos: string[];
    pickPhotos: () => void;
    removePhoto: (i: number) => void;
    selectedTile: string | null;
    setSelectedTile: (tile: string | null) => void;
    setCleaningPriceHint: (price: number | null) => void;
}

function StepDescribeIssue({
    theme,
    selectedTrade,
    description,
    setDescription,
    photos,
    pickPhotos,
    removePhoto,
    selectedTile,
    setSelectedTile,
    setCleaningPriceHint,
}: StepDescribeIssueProps) {
    const tiles = selectedTrade ? ISSUE_TILES[selectedTrade] : [];

    const handleTileTap = (tile: IssueTile) => {
        const label = t(tile.i18nKey);
        if (selectedTile === tile.i18nKey) {
            // Deselect — clear description and price hint
            setSelectedTile(null);
            setDescription('');
            setCleaningPriceHint(null);
        } else {
            // Select — populate description and set price hint if applicable
            setSelectedTile(tile.i18nKey);
            if (tile.isOther) {
                // "Other" tile: clear description so user can type freely
                setDescription('');
            } else {
                setDescription(label);
            }
            if (tile.priceHint) {
                setCleaningPriceHint(tile.priceHint);
            } else {
                setCleaningPriceHint(null);
            }
        }
    };

    return (
        <View>
            <Text style={[theme.typography.headingSm, { color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }]}>
                {t('request.description')}
            </Text>
            <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary, marginBottom: theme.spacing.md }]}>
                {t('request.descriptionPlaceholder')}
            </Text>

            {/* ── Issue Tiles ── */}
            {tiles.length > 0 && (
                <View style={{ marginBottom: theme.spacing.lg }}>
                    <Text style={[theme.typography.label, { color: theme.colors.textTertiary, marginBottom: theme.spacing.sm }]}>
                        {t('request.quickSelect')}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tileStrip}>
                        {tiles.map((tile) => {
                            const isSelected = selectedTile === tile.i18nKey;
                            return (
                                <TouchableOpacity
                                    key={tile.i18nKey}
                                    onPress={() => handleTileTap(tile)}
                                    activeOpacity={0.7}
                                    style={[
                                        styles.issueTileChip,
                                        {
                                            backgroundColor: isSelected ? theme.colors.accent : theme.colors.surface,
                                            borderColor: isSelected ? theme.colors.accent : theme.colors.border,
                                            borderRadius: theme.radius.full,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            theme.typography.captionMedium,
                                            { color: isSelected ? '#FFFFFF' : theme.colors.textPrimary },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {t(tile.i18nKey)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Multiline input */}
            <RNTextInput
                value={description}
                onChangeText={setDescription}
                placeholder={t('request.descriptionPlaceholder')}
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={[
                    styles.descInput,
                    {
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.textPrimary,
                        borderColor: theme.colors.border,
                        borderRadius: theme.radius.md,
                        ...theme.typography.bodyLg,
                    },
                ]}
            />

            {/* Photo strip */}
            <Text style={[theme.typography.label, { color: theme.colors.textSecondary, marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm }]}>
                {t('request.photos')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoStrip}>
                {photos.map((uri, i) => (
                    <View key={i} style={[styles.photoThumb, { borderRadius: theme.radius.md }]}>
                        <Image source={{ uri }} style={[styles.photoImage, { borderRadius: theme.radius.md }]} />
                        <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(i)}>
                            <Ionicons name="close-circle" size={22} color={theme.colors.error} />
                        </TouchableOpacity>
                    </View>
                ))}
                {photos.length < 5 && (
                    <TouchableOpacity
                        onPress={pickPhotos}
                        style={[
                            styles.addPhotoBtn,
                            {
                                borderColor: theme.colors.border,
                                borderRadius: theme.radius.md,
                            },
                        ]}
                    >
                        <Ionicons name="camera" size={24} color={theme.colors.textTertiary} />
                        <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginTop: 4 }]}>
                            {t('request.addPhotos')}
                        </Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Step 3 — Service Address
// ═══════════════════════════════════════════════════════════════════════════════

interface StepAddressProps {
    theme: ReturnType<typeof useTheme>;
    address: string;
    setAddress: (a: string) => void;
    location: { lat: number; lng: number } | null;
    locationDetected: boolean;
    useCurrentLocation: () => void;
}

function StepAddress({ theme, address, setAddress, location, locationDetected, useCurrentLocation }: StepAddressProps) {
    return (
        <View>
            <Text style={[theme.typography.headingSm, { color: theme.colors.textPrimary, marginBottom: theme.spacing.lg }]}>
                {t('request.step3')}
            </Text>

            {/* Use current location (MODE A — primary) */}
            <TouchableOpacity
                onPress={useCurrentLocation}
                style={[
                    styles.locationBtn,
                    {
                        backgroundColor: theme.colors.accent + '12',
                        borderRadius: theme.radius.md,
                        padding: theme.spacing.md,
                        marginBottom: theme.spacing.lg,
                    },
                ]}
                activeOpacity={0.7}
            >
                <Ionicons name="locate" size={20} color={theme.colors.accent} />
                <Text style={[theme.typography.bodyLg, { color: theme.colors.accent, marginLeft: 10, fontWeight: '600' }]}>
                    {t('request.useCurrentLocation')}
                </Text>
            </TouchableOpacity>

            {/* TODO Phase 5: Replace with Google Places Autocomplete */}
            {/* Requires: EXPO_PUBLIC_GOOGLE_PLACES_API_KEY in .env */}
            {/* Package: react-native-google-places-autocomplete */}
            <RNTextInput
                value={address}
                onChangeText={(text) => {
                    setAddress(text);
                }}
                placeholder={t('request.addressPlaceholder')}
                placeholderTextColor={theme.colors.textTertiary}
                style={[
                    styles.addressInput,
                    {
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.textPrimary,
                        borderColor: theme.colors.border,
                        borderRadius: theme.radius.md,
                        ...theme.typography.bodyLg,
                    },
                ]}
            />

            {/* Location detected badge (MODE A success) */}
            {locationDetected && (
                <View style={[styles.detectedBadge, { marginTop: theme.spacing.sm }]}>
                    <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                    <Text style={[theme.typography.caption, { color: '#22C55E', marginLeft: 6, fontWeight: '600' }]}>
                        {t('request.locationDetected')}
                    </Text>
                </View>
            )}

            {/* Helper tip (MODE B hint) */}
            {!locationDetected && (
                <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginTop: theme.spacing.sm }]}>
                    {t('request.addressTip')}
                </Text>
            )}

            {/* Map preview */}
            {location && (
                <View style={[styles.mapContainer, { borderRadius: theme.radius.lg, marginTop: theme.spacing.xl }]}>
                    <MapView
                        style={styles.mapPreview}
                        region={{
                            latitude: location.lat,
                            longitude: location.lng,
                            latitudeDelta: 0.005,
                            longitudeDelta: 0.005,
                        }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        rotateEnabled={false}
                        pitchEnabled={false}
                    >
                        <Marker coordinate={{ latitude: location.lat, longitude: location.lng }}>
                            <View style={[styles.mapPin, { backgroundColor: theme.colors.accent }]}>
                                <Ionicons name="location" size={18} color="#FFFFFF" />
                            </View>
                        </Marker>
                    </MapView>
                </View>
            )}
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Step 4 — Review & Get Estimate
// ═══════════════════════════════════════════════════════════════════════════════

interface StepReviewProps {
    theme: ReturnType<typeof useTheme>;
    selectedTrade: Trade | null;
    description: string;
    address: string;
    estimating: boolean;
    estimate: { serviceFee: number } | null;
    error: string | null;
}

function StepReview({ theme, selectedTrade, description, address, estimating, estimate, error }: StepReviewProps) {
    const tradeConfig = TRADES.find((t) => t.key === selectedTrade);

    return (
        <View>
            <Text style={[theme.typography.headingSm, { color: theme.colors.textPrimary, marginBottom: theme.spacing.lg }]}>
                {t('request.reviewSummary')}
            </Text>

            {/* Summary card */}
            <Card>
                {/* Trade */}
                <View style={styles.reviewRow}>
                    <Text style={[theme.typography.label, { color: theme.colors.textTertiary }]}>
                        {t('request.tradeLabel')}
                    </Text>
                    <View style={styles.reviewValue}>
                        {tradeConfig && (
                            <MaterialCommunityIcons name={tradeConfig.icon} size={16} color={tradeConfig.color} />
                        )}
                        <Text style={[theme.typography.bodySm, { color: theme.colors.textPrimary, marginLeft: 6 }]}>
                            {tradeConfig ? t(tradeConfig.i18nLabel) : '—'}
                        </Text>
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

                {/* Issue */}
                <View style={styles.reviewRow}>
                    <Text style={[theme.typography.label, { color: theme.colors.textTertiary }]}>
                        {t('request.issueLabel')}
                    </Text>
                    <Text
                        style={[theme.typography.bodySm, { color: theme.colors.textPrimary, flex: 1, textAlign: 'right' }]}
                        numberOfLines={2}
                    >
                        {description || '—'}
                    </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

                {/* Address */}
                <View style={styles.reviewRow}>
                    <Text style={[theme.typography.label, { color: theme.colors.textTertiary }]}>
                        {t('request.addressLabel')}
                    </Text>
                    <Text
                        style={[theme.typography.bodySm, { color: theme.colors.textPrimary, flex: 1, textAlign: 'right' }]}
                        numberOfLines={2}
                    >
                        {address || '—'}
                    </Text>
                </View>
            </Card>

            {/* Estimate */}
            <View style={{ marginTop: theme.spacing.xl }}>
                {estimating ? (
                    <View style={styles.estimateLoading}>
                        <ActivityIndicator size="small" color={theme.colors.accent} />
                        <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary, marginLeft: 10 }]}>
                            {t('request.gettingEstimate')}
                        </Text>
                    </View>
                ) : estimate ? (
                    <Card>
                        <View style={styles.feeRow}>
                            <Text style={[theme.typography.bodyLg, { color: theme.colors.textPrimary }]}>
                                {t('request.serviceFee')}
                            </Text>
                            <Text style={[theme.typography.bodyLg, { color: theme.colors.textPrimary }]}>
                                ${estimate.serviceFee.toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.feeRow}>
                            <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary }]}>
                                {t('request.bookingFee')}
                            </Text>
                            <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary }]}>
                                ${BOOKING_FEE.toFixed(2)}
                            </Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: theme.colors.divider, marginVertical: theme.spacing.md }]} />
                        <View style={styles.feeRow}>
                            <Text style={[theme.typography.titleLg, { color: theme.colors.textPrimary }]}>
                                {t('request.totalEstimate')}
                            </Text>
                            <Text style={[theme.typography.titleLg, { color: theme.colors.accent }]}>
                                ${(estimate.serviceFee + BOOKING_FEE).toFixed(2)}
                            </Text>
                        </View>
                        <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginTop: theme.spacing.md }]}>
                            {t('request.priceLocked')}
                        </Text>
                    </Card>
                ) : null}
            </View>

            {/* Error */}
            {error && (
                <View style={[styles.errorBar, { backgroundColor: theme.colors.errorLight, borderRadius: theme.radius.md, marginTop: theme.spacing.lg }]}>
                    <Ionicons name="alert-circle" size={18} color={theme.colors.error} />
                    <Text style={[theme.typography.bodySm, { color: theme.colors.error, marginLeft: 8, flex: 1 }]}>
                        {error}
                    </Text>
                </View>
            )}
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1 },
    flex: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },

    // Progress
    progressContainer: {
        paddingVertical: 8,
    },
    progressTrack: {
        height: 4,
        width: '100%',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
    },

    // Scroll
    scrollContent: {
        paddingTop: 16,
        paddingBottom: 40,
    },

    // Trade grid
    tradeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    tradeCard: {
        width: (SCREEN_WIDTH - 48 - 12) / 2,
        paddingVertical: 20,
        paddingHorizontal: 12,
        alignItems: 'center',
        position: 'relative',
    },
    tradeIconCircle: {
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Description
    descInput: {
        borderWidth: 1,
        padding: 14,
        minHeight: 140,
    },

    // Issue tiles
    tileStrip: {
        gap: 8,
        paddingRight: 4,
    },
    issueTileChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
    },

    // Photos
    photoStrip: {
        gap: 10,
    },
    photoThumb: {
        width: 80,
        height: 80,
        overflow: 'hidden',
    },
    photoImage: {
        width: '100%',
        height: '100%',
    },
    photoRemove: {
        position: 'absolute',
        top: -2,
        right: -2,
    },
    addPhotoBtn: {
        width: 80,
        height: 80,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Address
    addressInput: {
        borderWidth: 1,
        padding: 14,
    },
    locationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mapContainer: {
        height: 180,
        overflow: 'hidden',
    },
    mapPreview: {
        ...StyleSheet.absoluteFillObject,
    },
    mapPin: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Review
    reviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    reviewValue: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    divider: {
        height: StyleSheet.hairlineWidth,
    },
    estimateLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
    },
    feeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    errorBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },

    // Bottom bar
    bottomBar: {
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    cancelBtn: {
        marginTop: 12,
        paddingVertical: 8,
    },
});
