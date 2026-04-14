import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useThemeColor } from '../../src/hooks/useThemeColor';
import { t, useLanguageStore } from '../../src/i18n';

export default function LoginScreen() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const { language, setLanguage } = useLanguageStore();

    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const borderColor = useThemeColor({}, 'border');

    const handleLogin = async () => {
        try {
            const response = await api.post('/auth/login', { identifier, password });
            const { token, refreshToken, user } = response.data;
            login(token, user, refreshToken);
            // Sync language from server if user already had a preference
            if (user.preferredLanguage) {
                setLanguage(user.preferredLanguage);
            }
            router.replace('/(tabs)');
        } catch (error) {
            Alert.alert(t('auth.loginFailed'), t('auth.invalidCredentials'));
        }
    };

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'es' : 'en');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
                <Ionicons name="language" size={20} color="#007AFF" />
                <Text style={styles.langText}>{language === 'en' ? 'Español' : 'English'}</Text>
            </TouchableOpacity>

            <Text style={[styles.title, { color: textColor }]}>{t('auth.title')}</Text>
            <TextInput
                style={[styles.input, { borderColor, color: textColor }]}
                placeholder={t('auth.emailOrPhone')}
                placeholderTextColor={useThemeColor({}, 'icon')}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
            />
            <View style={[styles.passwordContainer, { borderColor }]}>
                <TextInput
                    style={[styles.passwordInput, { color: textColor }]}
                    placeholder={t('auth.password')}
                    placeholderTextColor={useThemeColor({}, 'icon')}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color={useThemeColor({}, 'icon')} />
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>{t('auth.login')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.link}>{t('auth.noAccount')}</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 15 },
    passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 15 },
    passwordInput: { flex: 1 },
    button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    link: { marginTop: 15, textAlign: 'center', color: '#007AFF' },
    langToggle: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 6, marginBottom: 20, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: 'rgba(0,122,255,0.1)' },
    langText: { color: '#007AFF', fontWeight: '600', fontSize: 14 },
});
