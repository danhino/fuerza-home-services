import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../src/store/useAuthStore';
import { View, ActivityIndicator } from 'react-native';
import { useLanguageStore } from '../src/i18n';
import { useThemeStore } from '../src/store/useThemeStore';

export default function RootLayout() {
    const { isAuthenticated } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        useLanguageStore.getState().loadLanguage();
        useThemeStore.getState().loadPreference();
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!isAuthenticated && !inAuthGroup) {
            // Redirect to the login page if not authenticated
            router.replace('/(auth)');
        } else if (isAuthenticated && inAuthGroup) {
            // Redirect to the home page if already authenticated
            router.replace('/(tabs)');
        }
    }, [isAuthenticated, segments, isMounted]);

    return <Slot />;
}
