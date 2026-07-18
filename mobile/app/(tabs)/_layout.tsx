import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t, useLanguageStore } from '../../src/i18n';
import { useAuthStore } from '../../src/store/useAuthStore';

const BRAND_ORANGE = '#FF6B2C';

/**
 * Tab icon with the Uber-style active indicator: a small orange pill
 * above the icon when the tab is focused.
 */
function TabIcon({
    name,
    color,
    focused,
}: {
    name: keyof typeof MaterialCommunityIcons.glyphMap;
    color: string;
    focused: boolean;
}) {
    return (
        <View style={{ alignItems: 'center', gap: 2 }}>
            {focused && (
                <View
                    style={{
                        width: 24,
                        height: 2,
                        borderRadius: 1,
                        backgroundColor: BRAND_ORANGE,
                        marginBottom: 2,
                    }}
                />
            )}
            <MaterialCommunityIcons name={name} size={26} color={color} />
        </View>
    );
}

export default function TabLayout() {
    // Subscribe so tabs re-render on language change
    useLanguageStore((s) => s.language);
    const user = useAuthStore((s) => s.user);
    const colorScheme = useColorScheme();
    const insets = useSafeAreaInsets();

    const isTechnician = user?.role === 'TECHNICIAN' || user?.role === 'BOTH';
    const isDark = colorScheme === 'dark';

    const inactiveColor = isDark ? '#6B7280' : '#9CA3AF';
    const backgroundColor = isDark ? '#0F1923' : '#FFFFFF';
    const borderTopColor = isDark ? '#1C2733' : '#E5E7EB';

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: BRAND_ORANGE,
                tabBarInactiveTintColor: inactiveColor,
                tabBarStyle: {
                    backgroundColor,
                    borderTopWidth: 1,
                    borderTopColor,
                    // Clean flat border only — no shadow/elevation
                    elevation: 0,
                    shadowOpacity: 0,
                    // 64px bar + safe area for the iPhone home indicator
                    height: 64 + insets.bottom,
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                    paddingTop: 4,
                },
                tabBarLabel: ({ focused, color, children }) => (
                    <Text
                        numberOfLines={1}
                        style={{
                            fontSize: 11,
                            fontWeight: focused ? '600' : '400',
                            marginTop: 2,
                            color,
                        }}
                    >
                        {children}
                    </Text>
                ),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: isTechnician ? t('tabs.dashboard') : t('tabs.home'),
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon
                            name={isTechnician ? 'view-dashboard-outline' : 'map-marker-radius'}
                            color={color}
                            focused={focused}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="request"
                options={{
                    title: t('tabs.request'),
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="plus-circle-outline" color={color} focused={focused} />
                    ),
                    // Customer: show, Tech: hide
                    tabBarButton: isTechnician ? () => null : undefined,
                }}
            />
            <Tabs.Screen
                name="jobs"
                options={{
                    title: isTechnician ? t('tabs.jobs') : t('tabs.myJobs'),
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon
                            name={isTechnician ? 'briefcase-outline' : 'clipboard-list-outline'}
                            color={color}
                            focused={focused}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="earnings"
                options={{
                    title: t('tabs.earnings'),
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="cash-multiple" color={color} focused={focused} />
                    ),
                    tabBarButton: isTechnician ? undefined : () => null,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: t('tabs.profile'),
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="account-circle-outline" color={color} focused={focused} />
                    ),
                }}
            />

            {/* Hidden screens (navigated directly, don't show placeholder tabs) */}
            <Tabs.Screen name="job-detail" options={{ tabBarButton: () => null }} />
            <Tabs.Screen name="estimate-change" options={{ tabBarButton: () => null }} />
            <Tabs.Screen name="job-accepted" options={{ tabBarButton: () => null }} />
            <Tabs.Screen name="active-job" options={{ tabBarButton: () => null }} />
            <Tabs.Screen name="job-history" options={{ tabBarButton: () => null }} />
            {/* New 5-step booking flow — hidden from tab bar */}
            <Tabs.Screen name="service-select" options={{ tabBarButton: () => null }} />
            <Tabs.Screen name="service-questions" options={{ tabBarButton: () => null }} />
            <Tabs.Screen name="service-estimate" options={{ tabBarButton: () => null }} />
            <Tabs.Screen name="booking-confirmed" options={{ tabBarButton: () => null }} />
        </Tabs>
    );
}
