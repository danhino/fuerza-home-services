/**
 * DisclaimerModal — Pre-booking liability disclaimer.
 *
 * CERTIFIED      → blue/green themed "Before You Book" terms.
 * NON_CERTIFIED  → amber warning for Independent Pros.
 *
 * The primary CTA stays disabled until the user checks the
 * acknowledgement checkbox. Fully bilingual via the i18n store.
 */
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../hooks/useTheme';
import { t, useLanguageStore } from '../i18n';
import type { CertificationLevel } from '../store/useMapStore';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface DisclaimerModalProps {
    visible: boolean;
    certificationLevel: CertificationLevel;
    technicianName?: string;
    onAccept: () => void;
    onDecline: () => void;
}

// ─── Accent colors (mode-independent, match existing inline palette) ─────────

const GREEN = '#12895E';
const GREEN_LIGHT = '#E8F7F2';
const AMBER = '#F59E0B';
const AMBER_LIGHT = '#FEF3E2';
const ORANGE = '#F57C20';

// ─── Component ───────────────────────────────────────────────────────────────

export function DisclaimerModal({
    visible,
    certificationLevel,
    technicianName,
    onAccept,
    onDecline,
}: DisclaimerModalProps) {
    const theme = useTheme();
    useLanguageStore((s) => s.language);

    const [checked, setChecked] = useState(false);

    // Reset the checkbox every time the modal is shown
    useEffect(() => {
        if (visible) setChecked(false);
    }, [visible]);

    const isCertified = certificationLevel === 'CERTIFIED';
    const accent = isCertified ? GREEN : AMBER;
    const accentLight = isCertified ? GREEN_LIGHT : AMBER_LIGHT;

    const title = isCertified ? t('disclaimer.certified.title') : t('disclaimer.independent.title');
    const body = isCertified ? t('disclaimer.certified.body') : t('disclaimer.independent.body');
    const checkboxLabel = isCertified
        ? t('disclaimer.certified.checkbox')
        : t('disclaimer.independent.checkbox');
    const primaryLabel = isCertified ? t('disclaimer.certified.cta') : t('disclaimer.independent.cta');
    const secondaryLabel = isCertified
        ? t('disclaimer.cancel')
        : t('disclaimer.independent.showCertified');

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onDecline}>
            <View style={styles.overlay}>
                <View
                    style={[
                        styles.card,
                        {
                            backgroundColor: theme.colors.surface,
                            borderRadius: theme.radius.xl,
                        },
                        theme.shadow.modal,
                    ]}
                >
                    {/* Icon */}
                    <View style={[styles.iconCircle, { backgroundColor: accentLight }]}>
                        <MaterialCommunityIcons
                            name={isCertified ? 'shield-check' : 'alert-circle'}
                            size={32}
                            color={accent}
                        />
                    </View>

                    {/* Title */}
                    <Text
                        style={[
                            theme.typography.titleLg,
                            { color: theme.colors.textPrimary, textAlign: 'center', marginTop: 12 },
                        ]}
                    >
                        {title}
                    </Text>

                    {technicianName ? (
                        <Text
                            style={[
                                theme.typography.bodySm,
                                { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 4 },
                            ]}
                        >
                            {technicianName}
                        </Text>
                    ) : null}

                    {/* Body */}
                    <ScrollView
                        style={styles.bodyScroll}
                        showsVerticalScrollIndicator={false}
                    >
                        <Text
                            style={[
                                theme.typography.bodySm,
                                { color: theme.colors.textSecondary, lineHeight: 20 },
                            ]}
                        >
                            {body}
                        </Text>
                    </ScrollView>

                    {/* Checkbox */}
                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setChecked((c) => !c)}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons
                            name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                            size={24}
                            color={checked ? accent : theme.colors.textTertiary}
                        />
                        <Text
                            style={[
                                theme.typography.bodySm,
                                { color: theme.colors.textPrimary, marginLeft: 10, flex: 1 },
                            ]}
                        >
                            {checkboxLabel}
                        </Text>
                    </TouchableOpacity>

                    {/* Primary CTA — disabled until checked */}
                    <TouchableOpacity
                        onPress={onAccept}
                        disabled={!checked}
                        activeOpacity={0.85}
                        style={[
                            styles.primaryBtn,
                            {
                                backgroundColor: isCertified ? GREEN : ORANGE,
                                borderRadius: theme.radius.md,
                                opacity: checked ? 1 : 0.45,
                            },
                        ]}
                    >
                        <Text style={[theme.typography.titleSm, { color: '#FFFFFF' }]}>
                            {primaryLabel}
                        </Text>
                    </TouchableOpacity>

                    {/* Secondary */}
                    <TouchableOpacity onPress={onDecline} style={styles.secondaryBtn} activeOpacity={0.7}>
                        <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary, fontWeight: '600' }]}>
                            {secondaryLabel}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 420,
        maxHeight: '85%',
        padding: 24,
        alignItems: 'center',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bodyScroll: {
        alignSelf: 'stretch',
        marginTop: 14,
        maxHeight: 260,
        flexGrow: 0,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'stretch',
        marginTop: 16,
    },
    primaryBtn: {
        alignSelf: 'stretch',
        alignItems: 'center',
        paddingVertical: 14,
        marginTop: 16,
    },
    secondaryBtn: {
        paddingVertical: 12,
        marginTop: 4,
    },
});
