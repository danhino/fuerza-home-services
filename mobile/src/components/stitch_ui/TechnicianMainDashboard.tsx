/**
 * TechnicianMainDashboard.tsx
 *
 * Presentational component matching Stitch Screen b151d673 — "Professional Technician Main Dashboard".
 * Pure UI: all data and callbacks provided via props, zero internal hooks.
 *
 * Stitch layout (780 × 1888 @2x mobile):
 *   ┌─ Greeting ("Good Morning, Juan!")                   ─┐
 *   │  Date subtitle ("Thursday, Oct 12")                   │
 *   │  Section: Your Next Job (highlighted card)            │
 *   │    • "Kitchen Faucet Repair"                          │
 *   │    • "123 Maple St, Springfield, IL"                  │
 *   │    • "Unit 4B • Entry Code: 1234"                     │
 *   │  Section: Upcoming Schedule (list of job rows)        │
 *   │    • Electrical Inspection — Sarah Jenkins — 4.2mi    │
 *   │    • AC Maintenance — Michael Ross — 1.5mi            │
 *   │    • Plumbing Consultation — David G. — 8.0mi         │
 *   └─ Bottom Tab Bar (handled by Expo Tabs, not here) ────┘
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Elevation, Radius } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { Palette, Brand } from '../../constants/Colors';

// ── Types ──────────────────────────────────────────────────

export interface NextJob {
    title: string;
    address: string;
    details?: string;           // e.g. "Unit 4B • Entry Code: 1234"
    scheduledTime?: string;     // e.g. "10:30 AM"
}

export interface UpcomingJob {
    title: string;
    customerName: string;
    distance: string;           // e.g. "4.2 miles away"
    iconColor?: string;
}

export interface TechnicianMainDashboardProps {
    // Greeting
    greeting: string;
    userName: string;
    dateSubtitle: string;       // e.g. "Thursday, Oct 12"
    textColor: string;
    backgroundColor: string;
    cardColor: string;

    // Next job
    nextJob: NextJob | null;
    nextJobLabel: string;
    onNextJobPress?: () => void;
    startNavigationLabel?: string;

    // Upcoming schedule
    upcomingJobs: UpcomingJob[];
    upcomingScheduleLabel: string;
    onJobPress?: (index: number) => void;

    // Notification
    onNotificationPress?: () => void;
}

// ── Component ──────────────────────────────────────────────

export function TechnicianMainDashboard(props: TechnicianMainDashboardProps) {
    const {
        greeting,
        userName,
        dateSubtitle,
        textColor,
        backgroundColor,
        cardColor,
        nextJob,
        nextJobLabel,
        onNextJobPress,
        startNavigationLabel,
        upcomingJobs,
        upcomingScheduleLabel,
        onJobPress,
        onNotificationPress,
    } = props;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Header ────────────────────────────── */}
                <View style={styles.header}>
                    <View style={styles.headerText}>
                        <Text style={[styles.greeting, { color: textColor }]}>
                            {greeting} {userName}!
                        </Text>
                        <Text style={[styles.dateSubtitle, { color: textColor }]}>
                            {dateSubtitle}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.bellButton, { backgroundColor: cardColor }]}
                        onPress={onNotificationPress}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="notifications-outline" size={24} color={textColor} />
                    </TouchableOpacity>
                </View>

                {/* ── Next Job Card ─────────────────────── */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>
                        {nextJobLabel}
                    </Text>
                    {nextJob ? (
                        <TouchableOpacity
                            style={[styles.nextJobCard, { backgroundColor: cardColor }]}
                            onPress={onNextJobPress}
                            activeOpacity={0.85}
                        >
                            <View style={styles.nextJobHeader}>
                                <View style={styles.nextJobIconCircle}>
                                    <Ionicons name="construct" size={22} color="#fff" />
                                </View>
                                <View style={styles.nextJobInfo}>
                                    <Text style={[styles.nextJobTitle, { color: textColor }]}>
                                        {nextJob.title}
                                    </Text>
                                    <Text style={styles.nextJobAddress}>
                                        {nextJob.address}
                                    </Text>
                                </View>
                                {nextJob.scheduledTime && (
                                    <Text style={styles.nextJobTime}>{nextJob.scheduledTime}</Text>
                                )}
                            </View>
                            {nextJob.details && (
                                <Text style={styles.nextJobDetails}>{nextJob.details}</Text>
                            )}
                            {startNavigationLabel && (
                                <TouchableOpacity
                                    style={styles.navButton}
                                    onPress={onNextJobPress}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons name="navigate" size={18} color="#fff" />
                                    <Text style={styles.navButtonText}>
                                        {startNavigationLabel}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.emptyCard, { backgroundColor: cardColor }]}>
                            <Ionicons name="checkmark-circle-outline" size={40} color={Brand.success} />
                            <Text style={[styles.emptyText, { color: textColor }]}>
                                No upcoming jobs
                            </Text>
                        </View>
                    )}
                </View>

                {/* ── Upcoming Schedule ─────────────────── */}
                {upcomingJobs.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>
                            {upcomingScheduleLabel}
                        </Text>
                        <View style={[styles.scheduleCard, { backgroundColor: cardColor }]}>
                            {upcomingJobs.map((job, idx) => (
                                <TouchableOpacity
                                    key={`${job.title}-${idx}`}
                                    style={[
                                        styles.scheduleRow,
                                        idx < upcomingJobs.length - 1 && styles.scheduleRowBorder,
                                    ]}
                                    onPress={() => onJobPress?.(idx)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.scheduleIcon, { backgroundColor: job.iconColor || Brand.primary }]}>
                                        <Ionicons name="build-outline" size={18} color="#fff" />
                                    </View>
                                    <View style={styles.scheduleInfo}>
                                        <Text style={[styles.scheduleTitle, { color: textColor }]}>
                                            {job.title}
                                        </Text>
                                        <Text style={styles.scheduleSubtitle}>
                                            {job.customerName} • {job.distance}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color={Palette.textSecondary} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: Spacing.xxl },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.screenPaddingH,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.lg,
    },
    headerText: { flex: 1 },
    greeting: {
        ...Typography.displaySm,
        marginBottom: 2,
    },
    dateSubtitle: {
        ...Typography.bodySm,
        opacity: 0.6,
    },
    bellButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        ...Elevation.low,
    },

    // Sections
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        ...Typography.titleLg,
        paddingHorizontal: Spacing.screenPaddingH,
        marginBottom: Spacing.md,
    },

    // Next Job Card
    nextJobCard: {
        marginHorizontal: Spacing.screenPaddingH,
        borderRadius: Radius.lg,
        padding: Spacing.cardPadding,
        ...Elevation.medium,
    },
    nextJobHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nextJobIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Brand.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    nextJobInfo: {
        flex: 1,
    },
    nextJobTitle: {
        ...Typography.titleSm,
        marginBottom: 2,
    },
    nextJobAddress: {
        ...Typography.bodySm,
        color: Palette.textSecondary,
    },
    nextJobTime: {
        ...Typography.bodySm,
        color: Brand.primary,
        fontWeight: '600',
    },
    nextJobDetails: {
        ...Typography.bodySm,
        color: Palette.textSecondary,
        marginTop: Spacing.sm,
        paddingLeft: 56, // aligned with text after icon
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Brand.primary,
        paddingVertical: Spacing.md,
        borderRadius: Radius.default,
        marginTop: Spacing.lg,
        gap: Spacing.sm,
    },
    navButtonText: {
        ...Typography.button,
        color: '#fff',
    },

    // Empty state
    emptyCard: {
        marginHorizontal: Spacing.screenPaddingH,
        borderRadius: Radius.lg,
        padding: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        ...Elevation.low,
    },
    emptyText: {
        ...Typography.bodySm,
        marginTop: Spacing.sm,
    },

    // Upcoming Schedule
    scheduleCard: {
        marginHorizontal: Spacing.screenPaddingH,
        borderRadius: Radius.lg,
        overflow: 'hidden',
        ...Elevation.low,
    },
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.cardPadding,
    },
    scheduleRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Palette.border,
    },
    scheduleIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    scheduleInfo: {
        flex: 1,
    },
    scheduleTitle: {
        ...Typography.titleSm,
        marginBottom: 2,
    },
    scheduleSubtitle: {
        ...Typography.caption,
        color: Palette.textSecondary,
    },
});
