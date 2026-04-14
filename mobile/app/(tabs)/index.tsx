/**
 * app/(tabs)/index.tsx — Home Tab
 *
 * Thin role-switch: reads user.role from useAuthStore and renders
 * the appropriate dashboard component.
 *
 *   TECHNICIAN  → <TechnicianMainDashboard />  (self-contained)
 *   else        → <HomeownerDashboard />        (Map-first customer home)
 */

import React from 'react';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useLanguageStore } from '../../src/i18n';

import { HomeownerDashboard } from '../../src/components/stitch_ui/HomeownerDashboard';
import { TechnicianMainDashboard } from '../../src/components/stitch_ui/TechnicianMainDashboard';

// ── Screen ───────────────────────────────────────────────

export default function HomeScreen() {
    const { user } = useAuthStore();
    useLanguageStore((s) => s.language); // triggers re-render on language change

    // ── Technician ────────────────────────────────────────
    if (user?.role === 'TECHNICIAN') {
        return <TechnicianMainDashboard />;
    }

    // ── Customer (Homeowner) — self-contained map dashboard
    return <HomeownerDashboard />;
}

