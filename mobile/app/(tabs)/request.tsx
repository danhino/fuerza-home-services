import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
    ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, Platform, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import api from '../../src/services/api';
import { useThemeColor } from '../../src/hooks/useThemeColor';
import { t, useLanguageStore } from '../../src/i18n';

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

            // Navigate to triage screen with all data
            router.push({
                pathname: '/triage',
                params: {
                    trade: selectedTrade,
                    description,
                    address,
                    lat: lat.toString(),
                    lng: lng.toString(),
                    issueTag: selectedIssueTag || '',
                    photoData: JSON.stringify(photoData),
                    videoData: videoData || '',
                },
            });
        } catch (e) {
            Alert.alert(t('home.error'), t('request.failed'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={textColor} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: textColor }]}>{t('request.title')}</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Trade Picker */}
                <Text style={[styles.sectionLabel, { color: textColor }]}>{t('request.selectTrade')}</Text>
                <View style={styles.tradeRow}>
                    {TRADES.map((trade) => {
                        const isSelected = selectedTrade === trade.key;
                        return (
                            <TouchableOpacity
                                key={trade.key}
                                style={[
                                    styles.tradeChip,
                                    { borderColor: trade.color },
                                    isSelected && { backgroundColor: trade.color },
                                ]}
                                onPress={() => { setSelectedTrade(trade.key); setSelectedIssueTag(null); }}
                            >
                                <Ionicons
                                    name={trade.icon as any}
                                    size={18}
                                    color={isSelected ? '#fff' : trade.color}
                                />
                                <Text style={[
                                    styles.tradeChipText,
                                    { color: isSelected ? '#fff' : trade.color },
                                ]}>
                                    {t(trade.i18nKey)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Issue Tiles */}
                <Text style={[styles.sectionLabel, { color: textColor }]}>{t('request.issueType')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.issueTileScroll}>
                    {ISSUE_TILES[selectedTrade].map((tile) => {
                        const isSelected = selectedIssueTag === tile.tag;
                        const tradeColor = TRADES.find((tr) => tr.key === selectedTrade)?.color || '#007AFF';
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
                <TextInput
                    style={[styles.input, { borderColor, color: textColor, backgroundColor: cardColor }]}
                    placeholder={t('request.addressPlaceholder')}
                    placeholderTextColor="#8e8e93"
                    value={address}
                    onChangeText={setAddress}
                />

                {/* Description */}
                <Text style={[styles.sectionLabel, { color: textColor }]}>{t('request.description')}</Text>
                <TextInput
                    style={[styles.input, styles.textArea, { borderColor, color: textColor, backgroundColor: cardColor }]}
                    placeholder={t('request.descriptionPlaceholder')}
                    placeholderTextColor="#8e8e93"
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
                        <TouchableOpacity style={[styles.addPhotoBtn, { borderColor }]} onPress={pickAndCompressPhotos}>
                            <Ionicons name="camera" size={28} color="#8e8e93" />
                            <Text style={styles.addPhotoText}>{t('request.addPhotos')}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Video */}
                <Text style={[styles.sectionLabel, { color: textColor }]}>{t('request.video')}</Text>
                {videoUri ? (
                    <View style={styles.videoRow}>
                        <View style={styles.videoAttached}>
                            <Ionicons name="videocam" size={20} color="#007AFF" />
                            <Text style={styles.videoAttachedText}>{t('request.videoAdded')}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setVideoUri(null)}>
                            <Ionicons name="close-circle" size={24} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={[styles.addVideoBtn, { borderColor }]} onPress={pickVideo}>
                        <Ionicons name="videocam-outline" size={28} color="#8e8e93" />
                        <Text style={styles.addVideoText}>{t('request.addVideo')}</Text>
                    </TouchableOpacity>
                )}

                {/* Submit */}
                <TouchableOpacity
                    style={[styles.submitButton, submitting && { opacity: 0.6 }]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitText}>{t('request.submit')}</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    scroll: { padding: 20, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, marginTop: 40 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    sectionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },

    // Trade chips
    tradeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

    // Issue tiles
    issueTileScroll: { marginBottom: 4 },
    issueTile: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1.5,
        marginRight: 8,
    },
    issueTileText: { fontSize: 13, fontWeight: '600' },
    tradeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 2,
        gap: 6,
    },
    tradeChipText: { fontWeight: '700', fontSize: 13 },

    // Inputs
    input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
    textArea: { minHeight: 100 },

    // Photos
    photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    photoThumb: { width: 80, height: 80, borderRadius: 10, overflow: 'hidden' },
    photoImage: { width: '100%', height: '100%' },
    photoRemove: { position: 'absolute', top: -2, right: -2 },
    addPhotoBtn: {
        width: 80, height: 80, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed',
        justifyContent: 'center', alignItems: 'center',
    },
    addPhotoText: { fontSize: 9, color: '#8e8e93', marginTop: 2, textAlign: 'center' },

    // Video
    videoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    videoAttached: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    videoAttachedText: { color: '#007AFF', fontWeight: '600', fontSize: 14 },
    addVideoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderStyle: 'dashed',
    },
    addVideoText: { color: '#8e8e93', fontSize: 14 },

    // Submit
    submitButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 28,
    },
    submitText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
});
