/**
 * LoadingOverlay — Full-screen semi-transparent overlay with spinner.
 */
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LoadingOverlayProps {
    /** Whether the overlay is visible */
    visible: boolean;
    /** Optional message below the spinner */
    message?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
    const theme = useTheme();

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
            <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
                <View
                    style={[
                        styles.card,
                        {
                            backgroundColor: theme.colors.surfaceElevated,
                            borderRadius: theme.radius.lg,
                            padding: theme.spacing['2xl'],
                        },
                        theme.shadow.modal,
                    ]}
                >
                    <ActivityIndicator size="large" color={theme.colors.accent} />
                    {message && (
                        <Text
                            style={[
                                theme.typography.bodySm,
                                {
                                    color: theme.colors.textSecondary,
                                    marginTop: theme.spacing.lg,
                                    textAlign: 'center',
                                },
                            ]}
                        >
                            {message}
                        </Text>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        alignItems: 'center',
        minWidth: 140,
    },
});
