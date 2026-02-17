import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../src/hooks/useThemeColor';
import { t, useLanguageStore } from '../../src/i18n';
import { useThemeStore, ThemePreference } from '../../src/store/useThemeStore';
import api from '../../src/services/api';

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
            <Text style={[styles.title, { color: textColor }]}>{t('profile.title')}</Text>
            <Text style={[styles.info, { color: textColor }]}>{t('profile.name')}: {user?.name}</Text>
            <Text style={[styles.info, { color: textColor }]}>{t('profile.role')}: {user?.role}</Text>

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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
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
