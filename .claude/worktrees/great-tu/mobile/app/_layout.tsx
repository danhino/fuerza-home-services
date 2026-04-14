import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../src/store/useAuthStore';
import { View, ActivityIndicator } from 'react-native';
import { useLanguageStore } from '../src/i18n';
import { useThemeStore } from '../src/store/useThemeStore';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from '../src/constants/Config';
import { registerForPushNotificationsAsync, setupNotificationHandlers } from '../src/services/notifications';
import api from '../src/services/api';

export default function RootLayout() {
    const { isAuthenticated, user } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    const [isMounted, setIsMounted] = useState(false);
    const cleanupRef = useRef<(() => void) | null>(null);

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

    // Push notification registration (technicians only)
    useEffect(() => {
        if (!isAuthenticated || !user) return;
        if (user.role !== 'TECHNICIAN' && user.role !== 'BOTH') return;

        registerForPushNotificationsAsync().then((token) => {
            if (token) {
                api.put('/users/me/push-token', { pushToken: token }).catch(console.error);
            }
        });

        cleanupRef.current = setupNotificationHandlers(router);
        return () => cleanupRef.current?.();
    }, [isAuthenticated, user?.role]);

    return (
        <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
            <Slot />
        </StripeProvider>
    );
}
