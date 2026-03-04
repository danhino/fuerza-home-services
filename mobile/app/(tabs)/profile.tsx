import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../src/hooks/useThemeColor';
import { t, useLanguageStore } from '../../src/i18n';
import { useThemeStore, ThemePreference } from '../../src/store/useThemeStore';
import api from '../../src/services/api';
import { useState, useEffect, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';

const THEME_OPTIONS: { key: ThemePreference; icon: string }[] = [
    { key: 'system', icon: 'phone-portrait-outline' },
    { key: 'light', icon: 'sunny-outline' },
    { key: 'dark', icon: 'moon-outline' },
];

export default function ProfileScreen() {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const { language, setLanguage } = useLanguageStore();
    const { preference, setPreference } = useThemeStore();

    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const cardColor = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');

    // ── Connect Status (technicians only) ────────────────────────────────────
    const isTechnician = user?.role === 'TECHNICIAN' || user?.role === 'BOTH';
    const [connectStatus, setConnectStatus] = useState<{
        isSetup: boolean;
        hasAccount: boolean;
        loading: boolean;
    }>({ isSetup: false, hasAccount: false, loading: true });
    const [onboarding, setOnboarding] = useState(false);

    const checkConnectStatus = useCallback(async () => {
        if (!isTechnician) return;
        try {
            const { data } = await api.get('/payments/connect/status');
            setConnectStatus({
                isSetup: data.isSetup || false,
                hasAccount: data.hasAccount || false,
                loading: false,
            });
        } catch {
            setConnectStatus((s) => ({ ...s, loading: false }));
        }
    }, [isTechnician]);

    useEffect(() => {
        checkConnectStatus();
    }, [checkConnectStatus]);

    const handleSetupPayouts = useCallback(async () => {
        setOnboarding(true);
        try {
            // Get the base API URL to pass real HTTP endpoints to Stripe
            // which redirect back to our custom deep links
            const apiUrl = api.defaults.baseURL || 'http://localhost:3000/api';
            const { data } = await api.post('/payments/connect/onboard', {
                returnUrl: `${apiUrl}/payments/connect/return`,
                refreshUrl: `${apiUrl}/payments/connect/refresh`,
            });

            if (data.success && data.url) {
                await WebBrowser.openBrowserAsync(data.url);
                // Re-check status after returning from onboarding
                checkConnectStatus();
            } else {
                Alert.alert(
                    language === 'es' ? 'Error' : 'Error',
                    language === 'es'
                        ? 'No se pudo iniciar la configuración de pagos.'
                        : 'Could not start payout setup.'
                );
            }
        } catch {
            Alert.alert(
                language === 'es' ? 'Error' : 'Error',
                language === 'es'
                    ? 'Error de conexión. Intenta de nuevo.'
                    : 'Connection error. Please try again.'
            );
        } finally {
            setOnboarding(false);
        }
    }, [language, checkConnectStatus]);

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleLogout = () => {
        logout();
        router.replace('/(auth)/login');
    };

    const toggleLanguage = async () => {
        const newLang = language === 'en' ? 'es' : 'en';
        setLanguage(newLang);
        try {
            await api.patch('/users/me/language', { preferredLanguage: newLang });
        } catch { }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={[styles.title, { color: textColor }]}>{t('profile.title')}</Text>
                <Text style={[styles.info, { color: textColor }]}>{t('profile.name')}: {user?.name}</Text>
                <Text style={[styles.info, { color: textColor }]}>{t('profile.role')}: {user?.role}</Text>

                {/* ── Payment Setup (technicians only) ── */}
                {isTechnician && (
                    <View style={[styles.payoutCard, {
                        backgroundColor: connectStatus.isSetup ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                        borderColor: connectStatus.isSetup ? '#22C55E' : '#EAB308',
                    }]}>
                        {connectStatus.loading ? (
                            <ActivityIndicator color={textColor} />
                        ) : connectStatus.isSetup ? (
                            <>
                                <View style={styles.payoutHeader}>
                                    <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                                    <Text style={[styles.payoutTitle, { color: '#22C55E' }]}>
                                        {language === 'es' ? 'Pagos Activos' : 'Payouts Active'}
                                    </Text>
                                </View>
                                <Text style={[styles.payoutSubtext, { color: textColor }]}>
                                    {language === 'es'
                                        ? 'Tu cuenta de pagos está configurada. Recibirás pagos automáticos.'
                                        : 'Your payout account is set up. You will receive automatic payouts.'}
                                </Text>
                            </>
                        ) : (
                            <>
                                <View style={styles.payoutHeader}>
                                    <Ionicons name="warning" size={24} color="#EAB308" />
                                    <Text style={[styles.payoutTitle, { color: '#EAB308' }]}>
                                        {language === 'es' ? 'Configura tus pagos' : 'Set up payouts to start earning'}
                                    </Text>
                                </View>
                                <Text style={[styles.payoutSubtext, { color: textColor }]}>
                                    {language === 'es'
                                        ? 'Conecta tu cuenta bancaria para recibir pagos por trabajos completados.'
                                        : 'Connect your bank account to receive payments for completed jobs.'}
                                </Text>
                                <TouchableOpacity
                                    style={styles.setupButton}
                                    onPress={handleSetupPayouts}
                                    disabled={onboarding}
                                >
                                    {onboarding ? (
                                        <ActivityIndicator color="#FFF" size="small" />
                                    ) : (
                                        <Text style={styles.setupButtonText}>
                                            {language === 'es' ? 'Configurar Pagos' : 'Set Up Payouts'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}

                {/* Language Selector */}
                <View style={styles.sectionRow}>
                    <Text style={[styles.info, { color: textColor }]}>{t('profile.language')}:</Text>
                    <TouchableOpacity style={styles.langButton} onPress={toggleLanguage}>
                        <Text style={styles.langButtonText}>{language === 'en' ? '🇺🇸 English' : '🇪🇸 Español'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Theme Selector */}
                <View style={styles.sectionRow}>
                    <Text style={[styles.info, { color: textColor }]}>{t('profile.theme')}:</Text>
                </View>
                <View style={[styles.themeRow, { borderColor }]}>
                    {THEME_OPTIONS.map((opt) => {
                        const isActive = preference === opt.key;
                        return (
                            <TouchableOpacity
                                key={opt.key}
                                style={[
                                    styles.themeOption,
                                    isActive && styles.themeOptionActive,
                                    { borderColor: isActive ? '#007AFF' : borderColor },
                                    isActive && { backgroundColor: 'rgba(0,122,255,0.1)' },
                                ]}
                                onPress={() => setPreference(opt.key)}
                            >
                                <Ionicons
                                    name={opt.icon as any}
                                    size={20}
                                    color={isActive ? '#007AFF' : textColor}
                                />
                                <Text style={[
                                    styles.themeLabel,
                                    { color: isActive ? '#007AFF' : textColor },
                                    isActive && { fontWeight: '700' },
                                ]}>
                                    {t(`profile.theme.${opt.key}`)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 20, alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    info: { fontSize: 18, marginBottom: 10 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    langButton: { backgroundColor: 'rgba(0,122,255,0.1)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
    langButtonText: { color: '#007AFF', fontWeight: '600', fontSize: 16 },
    themeRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1.5,
    },
    themeOptionActive: {},
    themeLabel: { fontSize: 14 },

    // Payout card
    payoutCard: {
        borderWidth: 1.5,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        width: '100%',
    },
    payoutHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    payoutTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    payoutSubtext: {
        fontSize: 14,
        opacity: 0.8,
        marginBottom: 12,
    },
    setupButton: {
        backgroundColor: '#FF6B2C',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
    },
    setupButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
    },

    logoutButton: {
        marginTop: 30,
        backgroundColor: '#FF3B30',
        padding: 15,
        borderRadius: 8,
        minWidth: 150,
        alignItems: 'center',
    },
    logoutButtonText: { color: '#fff', fontWeight: 'bold' },
});
