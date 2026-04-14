import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { t, useLanguageStore } from '../../src/i18n';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function TabLayout() {
    // Subscribe so tabs re-render on language change
    const language = useLanguageStore((s) => s.language);
    const user = useAuthStore((s) => s.user);
    const colorScheme = useColorScheme();

    const isTechnician = user?.role === 'TECHNICIAN' || user?.role === 'BOTH';
    const isDark = colorScheme === 'dark';

    const activeColor = '#FF6B2C';
    const inactiveColor = isDark ? '#9CA3AF' : '#6B7280';
    const backgroundColor = isDark ? '#0F1923' : '#FFFFFF';

    return (
        <Tabs 
            screenOptions={{ 
                headerShown: false,
                tabBarActiveTintColor: activeColor,
                tabBarInactiveTintColor: inactiveColor,
                tabBarStyle: {
                    backgroundColor: backgroundColor,
                    borderTopWidth: 1,
                    borderTopColor: isDark ? '#1C2733' : '#E5E7EB',
                }
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: t('tabs.home'),
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons 
                            name={isTechnician ? "view-dashboard" : "map-marker-radius"} 
                            size={24} 
                            color={color} 
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="request"
                options={{
                    title: 'Request',
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="wrench-clock" size={24} color={color} />
                    ),
                    // Customer: show, Tech: hide
                    tabBarButton: isTechnician ? () => null : undefined,
                }}
            />
            <Tabs.Screen
                name="jobs"
                options={{
                    title: t('tabs.jobs'),
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons 
                            name={isTechnician ? "briefcase" : "clipboard-list"} 
                            size={24} 
                            color={color} 
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="earnings"
                options={{
                    title: t('tabs.earnings'),
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="cash" size={24} color={color} />
                    ),
                    tabBarButton: isTechnician ? undefined : () => null,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: t('tabs.profile'),
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="account-circle" size={24} color={color} />
                    ),
                }}
            />

            {/* Hidden screens (navigated directly, don't show placeholder tabs) */}
            <Tabs.Screen
                name="job-detail"
                options={{
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="clipboard-text" size={24} color={color} />,
                    tabBarButton: () => null,
                }}
            />
            <Tabs.Screen
                name="estimate-change"
                options={{
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="calculator-variant" size={24} color={color} />,
                    tabBarButton: () => null,
                }}
            />
            <Tabs.Screen
                name="receipt"
                options={{
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="receipt" size={24} color={color} />,
                    tabBarButton: () => null,
                }}
            />
            <Tabs.Screen
                name="job-accepted"
                options={{
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="check-circle" size={24} color={color} />,
                    tabBarButton: () => null,
                }}
            />
            <Tabs.Screen
                name="active-job"
                options={{
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="progress-wrench" size={24} color={color} />,
                    tabBarButton: () => null,
                }}
            />
            <Tabs.Screen
                name="job-history"
                options={{
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="history" size={24} color={color} />,
                    tabBarButton: () => null,
                }}
            />
            {/* New 5-step booking flow — hidden from tab bar */}
            <Tabs.Screen
                name="service-select"
                options={{
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="format-list-bulleted" size={24} color={color} />,
                    tabBarButton: () => null,
                }}
            />
            <Tabs.Screen
                name="service-questions"
                options={{
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="clipboard-list-outline" size={24} color={color} />,
                    tabBarButton: () => null,
                }}
            />
            <Tabs.Screen
                name="service-estimate"
                options={{
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="tag-outline" size={24} color={color} />,
                    tabBarButton: () => null,
                }}
            />
            <Tabs.Screen
                name="booking-confirmed"
                options={{
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="check-decagram" size={24} color={color} />,
                    tabBarButton: () => null,
                }}
            />
        </Tabs>
    );
}
