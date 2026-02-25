/**
 * app/(tabs)/index.tsx — Home Tab
 *
 * Thin role-switch: reads user.role from useAuthStore and renders
 * the appropriate Stitch dashboard component.
 *
 *   TECHNICIAN  → <TechnicianMainDashboard />  (Stitch b151d673)
 *   else        → <HomeownerDashboard />        (Stitch 13fe14c8)
 */

import React from 'react';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../src/hooks/useThemeColor';
import { t, useLanguageStore } from '../../src/i18n';

import {
    HomeownerDashboard,
    TradeMeta,
    TradeKey,
} from '../../src/components/stitch_ui/HomeownerDashboard';

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

// ── Customer constants ────────────────────────────────────

const TRADES: TradeMeta[] = [
    { key: 'PLUMBER', icon: 'water', color: '#007AFF', label: 'Plumbing' },
    { key: 'ELECTRICIAN', icon: 'flash', color: '#FF9500', label: 'Electrical' },
    { key: 'POOL', icon: 'water-outline', color: '#5AC8FA', label: 'Pool Service' },
    { key: 'CLEANING', icon: 'sparkles', color: '#34C759', label: 'Cleaning' },
];

const NEARBY_PROS = [
    { name: 'Marco Rossi', specialty: 'Master Plumber', rating: 4.9, color: '#007AFF' },
    { name: 'Sarah Chen', specialty: 'Certified Electrician', rating: 4.8, color: '#FF9500' },
    { name: 'David Miller', specialty: 'HVAC Specialist', rating: 4.7, color: '#5AC8FA' },
];

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

    // ── Customer (Homeowner) ──────────────────────────────
    return (
        <HomeownerDashboard
            greeting={getGreeting()}
            userName={user?.firstName || user?.name || ''}
            textColor={textColor}
            backgroundColor={backgroundColor}
            cardColor={cardColor}
            trades={TRADES}
            categoriesLabel={t('home.categories') || 'Categories'}
            nearbyPros={NEARBY_PROS}
            nearbyProsLabel={t('home.nearbyPros') || 'Nearby Pros'}
            promoTitle={t('home.promo.title') || 'Save 15% on First Task'}
            promoDescription={t('home.promo.description') || 'Book your first cleaning or repair service today!'}
            promoCta={t('home.promo.cta') || 'Book Now'}
            onPromoPress={() => router.push('/(tabs)/request')}
            requestServiceLabel={t('home.requestServiceBtn') || 'Request a Service'}
            onRequestService={() => router.push('/(tabs)/request')}
        />
    );
}
