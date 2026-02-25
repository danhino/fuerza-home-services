import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { t, useLanguageStore } from '../../src/i18n';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function TabLayout() {
    // Subscribe so tabs re-render on language change
    const language = useLanguageStore((s) => s.language);
    const user = useAuthStore((s) => s.user);

    const isTechnician = user?.role === 'TECHNICIAN' || user?.role === 'BOTH';

    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: '#007AFF', headerShown: false }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: t('tabs.home'),
                    tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="jobs"
                options={{
                    title: t('tabs.jobs'),
                    tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />,
                    // Customers: hide Jobs from tab bar (accessible via navigation)
                    href: isTechnician ? undefined : null,
                }}
            />
            <Tabs.Screen
                name="earnings"
                options={{
                    title: t('tabs.earnings'),
                    tabBarIcon: ({ color }) => <Ionicons name="cash" size={24} color={color} />,
                    // Only visible for technicians
                    href: isTechnician ? undefined : null,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: t('tabs.profile'),
                    tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
                }}
            />
            {/* Request screen is navigated to but hidden from tab bar */}
            <Tabs.Screen
                name="request"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
