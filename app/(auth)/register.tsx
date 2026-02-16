import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useThemeColor } from '../../src/hooks/useThemeColor';
import { t, useLanguageStore } from '../../src/i18n';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isTechnician, setIsTechnician] = useState(false);
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const { language } = useLanguageStore();

    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const borderColor = useThemeColor({}, 'border');

    const handleRegister = async () => {
        try {
            const role = isTechnician ? 'TECHNICIAN' : 'CUSTOMER';
            const response = await api.post('/auth/register', { email, phone, password, role, name: '' });
            const { token, user } = response.data;
            login(token, user);
            // Persist language to backend on registration
            try {
                await api.patch('/users/me/language', { preferredLanguage: language });
            } catch { }
            router.replace('/(tabs)');
        } catch (error) {
            Alert.alert(t('auth.registerFailed'), t('auth.tryAgain'));
        }
    };

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <Text style={[styles.title, { color: textColor }]}>{t('auth.createAccount')}</Text>

            <TextInput
                style={[styles.input, { borderColor, color: textColor }]}
                placeholder={t('auth.email')}
                placeholderTextColor={useThemeColor({}, 'icon')}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                style={[styles.input, { borderColor, color: textColor }]}
                placeholder={t('auth.phone')}
                placeholderTextColor={useThemeColor({}, 'icon')}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
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

            <View style={styles.switchContainer}>
                <Text style={{ color: textColor }}>{t('auth.iAmTechnician')}</Text>
                <Switch value={isTechnician} onValueChange={setIsTechnician} />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>{t('auth.register')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.link}>{t('auth.haveAccount')}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 15 },
    passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 15 },
    passwordInput: { flex: 1 },
    switchContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    button: { backgroundColor: '#34C759', padding: 15, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    link: { marginTop: 15, textAlign: 'center', color: '#007AFF' },
});
