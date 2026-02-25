import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
    ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, Platform, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import api from '../../src/services/api';
import { useThemeColor } from '../../src/hooks/useThemeColor';
import { t, useLanguageStore } from '../../src/i18n';
import { useTriageStore } from '../../src/store/useTriageStore';
import { ScreenHeader, CategoryChip } from '../../src/components/stitch_ui';
import { Typography } from '../../src/constants/Typography';
import { Spacing, Radius, Elevation } from '../../src/constants/Spacing';
import { Brand, Palette } from '../../src/constants/Colors';

type Trade = 'PLUMBER' | 'ELECTRICIAN' | 'POOL' | 'CLEANING';

const TRADES: { key: Trade; icon: string; color: string; i18nKey: string }[] = [
    { key: 'PLUMBER', icon: 'water', color: '#007AFF', i18nKey: 'filter.plumber' },
    { key: 'ELECTRICIAN', icon: 'flash', color: '#FF9500', i18nKey: 'filter.electrician' },
    { key: 'POOL', icon: 'water-outline', color: '#5AC8FA', i18nKey: 'filter.pool' },
    { key: 'CLEANING', icon: 'sparkles', color: '#34C759', i18nKey: 'filter.cleaning' },
];

interface IssueTile {
    tag: string;
    i18nKey: string;
    suggestedDescription: string;
}

const ISSUE_TILES: Record<Trade, IssueTile[]> = {
    PLUMBER: [
        { tag: 'leakUnderSink', i18nKey: 'issue.plumber.leakUnderSink', suggestedDescription: 'There is a leak under the sink that needs repair.' },
        { tag: 'replaceToilet', i18nKey: 'issue.plumber.replaceToilet', suggestedDescription: 'Need to replace an old or broken toilet.' },
        { tag: 'showerLever', i18nKey: 'issue.plumber.showerLever', suggestedDescription: 'The shower lever/handle is broken and needs fixing.' },
        { tag: 'cloggedSink', i18nKey: 'issue.plumber.cloggedSink', suggestedDescription: 'The sink is clogged and not draining properly.' },
        { tag: 'waterHeater', i18nKey: 'issue.plumber.waterHeater', suggestedDescription: 'Water heater is not heating water.' },
        { tag: 'runningToilet', i18nKey: 'issue.plumber.runningToilet', suggestedDescription: 'The toilet keeps running and won\'t stop.' },
        { tag: 'lowPressure', i18nKey: 'issue.plumber.lowPressure', suggestedDescription: 'Experiencing low water pressure throughout the house.' },
    ],
    ELECTRICIAN: [
        { tag: 'replaceOutlet', i18nKey: 'issue.electrician.replaceOutlet', suggestedDescription: 'Need to replace a damaged or outdated outlet.' },
        { tag: 'ceilingFan', i18nKey: 'issue.electrician.ceilingFan', suggestedDescription: 'Need a ceiling fan installed.' },
        { tag: 'evCharger', i18nKey: 'issue.electrician.evCharger', suggestedDescription: 'Need a Tesla/EV charger installed at home.' },
        { tag: 'breaker', i18nKey: 'issue.electrician.breaker', suggestedDescription: 'A circuit breaker needs to be replaced.' },
        { tag: 'lightSwitch', i18nKey: 'issue.electrician.lightSwitch', suggestedDescription: 'A light switch is not working properly.' },
        { tag: 'gfci', i18nKey: 'issue.electrician.gfci', suggestedDescription: 'The GFCI outlet keeps tripping.' },
        { tag: 'lightFixture', i18nKey: 'issue.electrician.lightFixture', suggestedDescription: 'Need a light fixture installed.' },
    ],
    POOL: [
        { tag: 'pumpDiagnosis', i18nKey: 'issue.pool.pumpDiagnosis', suggestedDescription: 'Pool pump needs diagnosis — not working correctly.' },
        { tag: 'cleaning', i18nKey: 'issue.pool.cleaning', suggestedDescription: 'Need a full pool cleaning.' },
        { tag: 'filterCleaning', i18nKey: 'issue.pool.filterCleaning', suggestedDescription: 'Pool filter needs cleaning or replacement.' },
        { tag: 'pumpStopped', i18nKey: 'issue.pool.pumpStopped', suggestedDescription: 'Pool pump has stopped working entirely.' },
        { tag: 'stains', i18nKey: 'issue.pool.stains', suggestedDescription: 'Pool has stains that need treatment.' },
        { tag: 'algae', i18nKey: 'issue.pool.algae', suggestedDescription: 'Pool has algae buildup.' },
        { tag: 'cloudyWater', i18nKey: 'issue.pool.cloudyWater', suggestedDescription: 'Pool water is cloudy and unclear.' },
        { tag: 'lights', i18nKey: 'issue.pool.lights', suggestedDescription: 'Pool lights need repair or installation.' },
    ],
    CLEANING: [
        { tag: 's', i18nKey: 'issue.cleaning.s', suggestedDescription: 'Small house cleaning (1-2 rooms).' },
        { tag: 'm', i18nKey: 'issue.cleaning.m', suggestedDescription: 'Medium house cleaning (3-4 rooms).' },
        { tag: 'l', i18nKey: 'issue.cleaning.l', suggestedDescription: 'Large house cleaning (5-6 rooms).' },
        { tag: 'xl', i18nKey: 'issue.cleaning.xl', suggestedDescription: 'Extra-large house cleaning (7+ rooms).' },
    ],
};

export default function RequestScreen() {
    const router = useRouter();
    const language = useLanguageStore((s) => s.language);

    const [selectedTrade, setSelectedTrade] = useState<Trade>('PLUMBER');
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [selectedIssueTag, setSelectedIssueTag] = useState<string | null>(null);
    const [photos, setPhotos] = useState<string[]>([]);
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

    // Address autocomplete state
    const [addressSuggestions, setAddressSuggestions] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const borderColor = useThemeColor({}, 'border');
    const cardColor = useThemeColor({}, 'card');

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
            }
        })();
    }, []);

    const searchAddress = (query: string) => {
        if (searchTimer) clearTimeout(searchTimer);
        setAddress(query);
        if (query.length < 3) {
            setAddressSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=us&addressdetails=0`,
                    { headers: { 'User-Agent': 'FuerzaHomeServices/1.0' } }
                );
                const data = await response.json();
                setAddressSuggestions(data);
                setShowSuggestions(data.length > 0);
            } catch (e) {
                setShowSuggestions(false);
            }
        }, 400);
        setSearchTimer(timer);
    };

    const selectSuggestion = (item: { display_name: string; lat: string; lon: string }) => {
        setAddress(item.display_name);
        setLocation({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
        setShowSuggestions(false);
        setAddressSuggestions([]);
    };

    const pickAndCompressPhotos = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 1,
            selectionLimit: 5,
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
    };

    const removePhoto = (index: number) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
    };

    const MAX_VIDEO_SIZE_MB = 50;
    const MAX_VIDEO_DURATION_SEC = 60;

    const pickVideo = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['videos'],
            allowsMultipleSelection: false,
            quality: 0.5,
            videoMaxDuration: MAX_VIDEO_DURATION_SEC,
        });

        if (result.canceled || !result.assets?.[0]) return;

        const asset = result.assets[0];

        // Duration check
        if (asset.duration && asset.duration / 1000 > MAX_VIDEO_DURATION_SEC) {
            Alert.alert(t('home.error'), t('request.videoTooLong'));
            return;
        }

        // Size check
        if (asset.fileSize && asset.fileSize > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
            Alert.alert(t('home.error'), t('request.videoTooLarge'));
            return;
        }

        setVideoUri(asset.uri);
    };

    const handleSubmit = async () => {
        if (!address.trim()) {
            Alert.alert(t('home.error'), t('request.address'));
            return;
        }
        if (!description.trim()) {
            Alert.alert(t('home.error'), t('request.description'));
            return;
        }

        setSubmitting(true);
        try {
            const lat = location?.lat || 29.7604;
            const lng = location?.lng || -95.3698;

            // Convert photos to base64
            const photoData: string[] = [];
            for (const uri of photos) {
                const response = await fetch(uri);
                const blob = await response.blob();
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
                photoData.push(base64);
            }

            // Convert video to base64
            let videoData: string | undefined;
            if (videoUri) {
                const vResp = await fetch(videoUri);
                const vBlob = await vResp.blob();
                videoData = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(vBlob);
                });
            }

            // Store data and navigate to triage screen
            useTriageStore.getState().setPending({
                trade: selectedTrade,
                description,
                address,
                lat,
                lng,
                issueTag: selectedIssueTag || undefined,
                photoData,
                videoData,
            });
            router.push('/triage');
        } catch (e) {
            Alert.alert(t('home.error'), t('request.failed'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor }}>
            <ScreenHeader
                title={t('request.title')}
                onBack={() => router.back()}
                textColor={textColor}
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {/* Trade Picker — reuse CategoryChip */}
                    <Text style={[styles.sectionLabel, { color: textColor }]}>{t('request.selectTrade')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                        {TRADES.map((trade) => (
                            <CategoryChip
                                key={trade.key}
                                icon={trade.icon}
                                label={t(trade.i18nKey)}
                                color={trade.color}
                                isSelected={selectedTrade === trade.key}
                                onPress={() => { setSelectedTrade(trade.key); setSelectedIssueTag(null); }}
                            />
                        ))}
                    </ScrollView>

                    {/* Issue Tiles */}
                    <Text style={[styles.sectionLabel, { color: textColor }]}>{t('request.issueType')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                        {ISSUE_TILES[selectedTrade].map((tile) => {
                            const isSelected = selectedIssueTag === tile.tag;
                            const tradeColor = TRADES.find((tr) => tr.key === selectedTrade)?.color || Brand.primary;
                            return (
                                <TouchableOpacity
                                    key={tile.tag}
                                    style={[
                                        styles.issueTile,
                                        { borderColor: tradeColor },
                                        isSelected && { backgroundColor: tradeColor },
                                    ]}
                                    onPress={() => {
                                        if (isSelected) {
                                            setSelectedIssueTag(null);
                                        } else {
                                            setSelectedIssueTag(tile.tag);
                                            if (!description.trim()) {
                                                setDescription(tile.suggestedDescription);
                                            }
                                        }
                                    }}
                                >
                                    <Text style={[
                                        styles.issueTileText,
                                        { color: isSelected ? '#fff' : tradeColor },
                                    ]}>
                                        {t(tile.i18nKey)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Address */}
                    <Text style={[styles.sectionLabel, { color: textColor }]}>{t('request.address')}</Text>
                    <View style={{ zIndex: 10 }}>
                        <TextInput
                            style={[styles.input, { borderColor, color: textColor, backgroundColor: cardColor }]}
                            placeholder={t('request.addressPlaceholder')}
                            placeholderTextColor={Palette.textSecondary}
                            value={address}
                            onChangeText={searchAddress}
                            onFocus={() => { if (addressSuggestions.length > 0) setShowSuggestions(true); }}
                        />
                        {showSuggestions && addressSuggestions.length > 0 && (
                            <View style={[styles.suggestionsContainer, { backgroundColor: cardColor, borderColor }]}>
                                {addressSuggestions.map((item, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[styles.suggestionItem, idx < addressSuggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor }]}
                                        onPress={() => selectSuggestion(item)}
                                    >
                                        <Ionicons name="location-outline" size={16} color={Palette.textSecondary} />
                                        <Text style={[styles.suggestionText, { color: textColor }]} numberOfLines={2}>
                                            {item.display_name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Description */}
                    <Text style={[styles.sectionLabel, { color: textColor }]}>{t('request.description')}</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { borderColor, color: textColor, backgroundColor: cardColor }]}
                        placeholder={t('request.descriptionPlaceholder')}
                        placeholderTextColor={Palette.textSecondary}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />

                    {/* Photos */}
                    <Text style={[styles.sectionLabel, { color: textColor }]}>{t('request.photos')}</Text>
                    <View style={styles.photoRow}>
                        {photos.map((uri, i) => (
                            <View key={i} style={styles.photoThumb}>
                                <Image source={{ uri }} style={styles.photoImage} />
                                <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(i)}>
                                    <Ionicons name="close-circle" size={22} color="#FF3B30" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {photos.length < 5 && (
                            <TouchableOpacity style={[styles.addMediaBtn, { borderColor }]} onPress={pickAndCompressPhotos}>
                                <Ionicons name="camera" size={26} color={Palette.textSecondary} />
                                <Text style={styles.addMediaText}>{t('request.addPhotos')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Video */}
                    <Text style={[styles.sectionLabel, { color: textColor }]}>{t('request.video')}</Text>
                    {videoUri ? (
                        <View style={styles.videoRow}>
                            <View style={styles.videoAttached}>
                                <Ionicons name="videocam" size={20} color={Brand.primary} />
                                <Text style={styles.videoAttachedText}>{t('request.videoAdded')}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setVideoUri(null)}>
                                <Ionicons name="close-circle" size={24} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={[styles.addMediaBtn, styles.addVideoBtn, { borderColor }]} onPress={pickVideo}>
                            <Ionicons name="videocam-outline" size={26} color={Palette.textSecondary} />
                            <Text style={styles.addMediaText}>{t('request.addVideo')}</Text>
                        </TouchableOpacity>
                    )}

                    {/* Submit */}
                    <TouchableOpacity
                        style={[styles.submitButton, submitting && { opacity: 0.6 }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                        activeOpacity={0.85}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitText}>{t('request.submit')}</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scroll: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: 40,
    },
    sectionLabel: {
        ...Typography.caption,
        fontWeight: '600',
        marginBottom: Spacing.sm,
        marginTop: Spacing.xl,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    chipScroll: {
        gap: Spacing.sm,
        paddingRight: Spacing.lg,
    },

    // Issue tiles
    issueTile: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md + 2,
        borderRadius: Radius.full,
        borderWidth: 1.5,
    },
    issueTileText: {
        ...Typography.caption,
        fontWeight: '600',
    },

    // Inputs
    input: {
        borderWidth: 1,
        borderRadius: Radius.lg,
        padding: Spacing.md + 2,
        ...Typography.bodyLg,
    },
    textArea: { minHeight: 100 },

    // Address suggestions
    suggestionsContainer: {
        borderWidth: 1,
        borderTopWidth: 0,
        borderBottomLeftRadius: Radius.lg,
        borderBottomRightRadius: Radius.lg,
        overflow: 'hidden',
        marginTop: -4,
    },
    suggestionItem: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md + 2,
        gap: Spacing.sm,
    },
    suggestionText: {
        ...Typography.bodySm,
        flex: 1,
    },

    // Photos
    photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    photoThumb: { width: 80, height: 80, borderRadius: Radius.default, overflow: 'hidden' },
    photoImage: { width: '100%', height: '100%' },
    photoRemove: { position: 'absolute', top: -2, right: -2 },
    addMediaBtn: {
        width: 80,
        height: 80,
        borderRadius: Radius.default,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
    },
    addMediaText: {
        ...Typography.caption,
        color: Palette.textSecondary,
        textAlign: 'center',
    },

    // Video
    addVideoBtn: {
        flexDirection: 'row',
        width: 'auto',
        height: 'auto',
        paddingVertical: Spacing.md + 2,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
    },
    videoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    videoAttached: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    videoAttachedText: { ...Typography.bodySm, color: Brand.primary, fontWeight: '600' },

    // Submit
    submitButton: {
        backgroundColor: Brand.primary,
        padding: Spacing.lg,
        borderRadius: Radius.lg,
        alignItems: 'center',
        marginTop: Spacing.xl + Spacing.xs,
        ...Elevation.medium,
    },
    submitText: {
        color: '#fff',
        ...Typography.button,
    },
});
