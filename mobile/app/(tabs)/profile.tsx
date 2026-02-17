import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../src/hooks/useThemeColor';
import { t, useLanguageStore } from '../../src/i18n';
import api from '../../src/services/api';

export default function ProfileScreen() {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const { language, setLanguage } = useLanguageStore();

    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');

    const handleLogout = () => {
        logout();
        router.replace('/(auth)/login');
    };

    const toggleLanguage = async () => {
        const newLang = language === 'en' ? 'es' : 'en';
        setLanguage(newLang);
        // Persist to backend
        try {
            await api.patch('/users/me/language', { preferredLanguage: newLang });
        } catch { }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <Text style={[styles.title, { color: textColor }]}>{t('profile.title')}</Text>
            <Text style={[styles.info, { color: textColor }]}>{t('profile.name')}: {user?.name}</Text>
            <Text style={[styles.info, { color: textColor }]}>{t('profile.role')}: {user?.role}</Text>

            <View style={styles.langRow}>
                <Text style={[styles.info, { color: textColor }]}>{t('profile.language')}:</Text>
                <TouchableOpacity style={styles.langButton} onPress={toggleLanguage}>
                    <Text style={styles.langButtonText}>{language === 'en' ? '🇺🇸 English' : '🇪🇸 Español'}</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogout}>
                <Text style={styles.buttonText}>{t('profile.logout')}</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    info: { fontSize: 18, marginBottom: 10 },
    button: { marginTop: 30, backgroundColor: '#FF3B30', padding: 15, borderRadius: 8, minWidth: 150, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    langRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    langButton: { backgroundColor: 'rgba(0,122,255,0.1)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
    langButtonText: { color: '#007AFF', fontWeight: '600', fontSize: 16 },
});
