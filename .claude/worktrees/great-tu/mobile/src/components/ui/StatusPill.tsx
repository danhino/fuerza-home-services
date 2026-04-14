/**
 * StatusPill — Job status indicator with icon and color.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

// ─── Types ───────────────────────────────────────────────────────────────────

export type JobStatus =
    | 'REQUESTED'
    | 'MATCHED'
    | 'EN_ROUTE'
    | 'ARRIVED'
    | 'WORKING'
    | 'COMPLETED'
    | 'CANCELLED';

export interface StatusPillProps {
    /** The current job status */
    status: JobStatus;
    /** Optional compact mode (icon-only) */
    compact?: boolean;
}

// ─── Status Config ───────────────────────────────────────────────────────────

interface StatusConfig {
    label: string;
    color: string;
    bgColor: string;
    icon: keyof typeof Ionicons.glyphMap;
}

const STATUS_MAP: Record<JobStatus, StatusConfig> = {
    REQUESTED: {
        label: 'Requested',
        color: '#2563EB',
        bgColor: '#DBEAFE',
        icon: 'time-outline',
    },
    MATCHED: {
        label: 'Matched',
        color: '#7C3AED',
        bgColor: '#EDE9FE',
        icon: 'people-outline',
    },
    EN_ROUTE: {
        label: 'En Route',
        color: '#EA580C',
        bgColor: '#FFF7ED',
        icon: 'car-outline',
    },
    ARRIVED: {
        label: 'Arrived',
        color: '#CA8A04',
        bgColor: '#FEF9C3',
        icon: 'location-outline',
    },
    WORKING: {
        label: 'Working',
        color: '#4F46E5',
        bgColor: '#EEF2FF',
        icon: 'construct-outline',
    },
    COMPLETED: {
        label: 'Completed',
        color: '#16A34A',
        bgColor: '#DCFCE7',
        icon: 'checkmark-circle-outline',
    },
    CANCELLED: {
        label: 'Cancelled',
        color: '#DC2626',
        bgColor: '#FEE2E2',
        icon: 'close-circle-outline',
    },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function StatusPill({ status, compact = false }: StatusPillProps) {
    const theme = useTheme();
    const config = STATUS_MAP[status];

    return (
        <View
            style={[
                styles.pill,
                {
                    backgroundColor: config.bgColor,
                    borderRadius: theme.radius.full,
                    paddingHorizontal: compact ? theme.spacing.sm : theme.spacing.md,
                    paddingVertical: compact ? 3 : theme.spacing.xs,
                },
            ]}
        >
            <Ionicons
                name={config.icon}
                size={compact ? 12 : 14}
                color={config.color}
            />
            {!compact && (
                <Text
                    style={[
                        theme.typography.captionMedium,
                        {
                            color: config.color,
                            marginLeft: theme.spacing.xs,
                        },
                    ]}
                    numberOfLines={1}
                >
                    {config.label}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
    },
});
