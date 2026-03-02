/**
 * app/(tabs)/index.tsx — Home Tab
 *
 * Thin role-switch: reads user.role from useAuthStore and renders
 * the appropriate dashboard component.
 *
 *   TECHNICIAN  → <TechnicianMainDashboard />  (Stitch b151d673)
 *   else        → <HomeownerDashboard />        (Map-first customer home)
 */

import React from 'react';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../src/hooks/useThemeColor';
import { t, useLanguageStore } from '../../src/i18n';

import { HomeownerDashboard } from '../../src/components/stitch_ui/HomeownerDashboard';

import {
    TechnicianMainDashboard,
    NextJob,
    UpcomingJob,
} from '../../src/components/stitch_ui/TechnicianMainDashboard';

// ── Helpers ───────────────────────────────────────────────

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return t('home.greeting.morning');
    if (h < 18) return t('home.greeting.afternoon');
    return t('home.greeting.evening');
}

function getDateSubtitle(): string {
    return new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
    });
}

// ── Technician mock data (replace with API later) ────────

const MOCK_NEXT_JOB: NextJob = {
    title: 'Kitchen Faucet Repair',
    address: '123 Maple St, Springfield, IL',
    details: 'Unit 4B • Entry Code: 1234',
    scheduledTime: '10:30 AM',
};

const MOCK_UPCOMING: UpcomingJob[] = [
    { title: 'Electrical Inspection', customerName: 'Sarah Jenkins', distance: '4.2 miles away', iconColor: '#FF9500' },
    { title: 'AC Maintenance', customerName: 'Michael Ross', distance: '1.5 miles away', iconColor: '#5AC8FA' },
    { title: 'Plumbing Consultation', customerName: 'David G.', distance: '8.0 miles away', iconColor: '#007AFF' },
];

// ── Screen ───────────────────────────────────────────────

export default function HomeScreen() {
    const { user } = useAuthStore();
    const router = useRouter();
    const _language = useLanguageStore((s) => s.language); // triggers re-render on language change

    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const cardColor = useThemeColor({}, 'card');

    // ── Technician ────────────────────────────────────────
    if (user?.role === 'TECHNICIAN') {
        return (
            <TechnicianMainDashboard
                greeting={getGreeting()}
                userName={user?.firstName || user?.name || ''}
                dateSubtitle={getDateSubtitle()}
                textColor={textColor}
                backgroundColor={backgroundColor}
                cardColor={cardColor}
                nextJob={MOCK_NEXT_JOB}
                nextJobLabel={t('home.nextJob') || 'Your Next Job'}
                onNextJobPress={() => router.push('/(tabs)/jobs')}
                startNavigationLabel={t('home.startNavigation') || 'Start Navigation'}
                upcomingJobs={MOCK_UPCOMING}
                upcomingScheduleLabel={t('home.upcomingSchedule') || 'Upcoming Schedule'}
                onJobPress={() => router.push('/(tabs)/jobs')}
            />
        );
    }

    // ── Customer (Homeowner) — self-contained map dashboard
    return <HomeownerDashboard />;
}

