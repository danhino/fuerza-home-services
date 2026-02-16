import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
    ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, Platform
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

export default function RequestScreen() {
    const router = useRouter();
    const language = useLanguageStore((s) => s.language);

    const [selectedTrade, setSelectedTrade] = useState<Trade>('PLUMBER');
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
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

            // For MVP, send photos as base64 in JSON body
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

            await api.post('/jobs', {
                trade: selectedTrade,
                description,
                address,
                lat,
                lng,
                photos: photoData,
            });

            Alert.alert(t('request.success'), t('request.successBody'));
            router.back();
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
                                onPress={() => setSelectedTrade(trade.key)}
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
