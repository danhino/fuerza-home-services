/**
 * estimate-change.tsx — Propose / Accept / Decline price renegotiation
 *
 * Accessed from customer job tracking or technician active job screen.
 * Route params: { jobId: string }
 *
 * API:
 *   POST /api/jobs/:id/change-orders         → create proposal
 *   POST /api/change-orders/:id/approve      → accept
 *   POST /api/change-orders/:id/decline      → decline
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput as RNTextInput,
    ActivityIndicator,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useTheme } from '../../src/hooks/useTheme';
import { t, useLanguageStore } from '../../src/i18n';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useJobStore, ChangeOrder } from '../../src/store/useJobStore';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import api from '../../src/services/api';

// ─── Component ───────────────────────────────────────────────────────────────

export default function EstimateChangeScreen() {
    const theme = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ jobId: string }>();
    const jobId = params.jobId;

    useLanguageStore((s) => s.language);

    const user = useAuthStore((s) => s.user);
    const userId = user?.id;
    const userRole = user?.role;

    const job = useJobStore((s) => s.jobs.find((j) => j.id === jobId));
    const addChangeOrder = useJobStore((s) => s.addChangeOrderToJob);
    const updateChangeOrder = useJobStore((s) => s.updateChangeOrderInJob);

    // ── Derived state ────────────────────────────────────────────────────────

    const currentPrice = job?.estimate?.currentAmount ?? job?.estimateLow ?? 0;
    const changeOrders = useMemo(() => job?.changeOrders ?? [], [job?.changeOrders]);
    const pendingProposal = useMemo(
        () => changeOrders.find((co) => co.status === 'PENDING'),
        [changeOrders]
    );
    const hasPending = !!pendingProposal;

    // For the pending proposal, determine if current user is the proposer or receiver
    // Backend: only technicians create change orders, only customers respond
    const isReceiver = userRole === 'CUSTOMER' && hasPending;

    // ── Propose sheet state ──────────────────────────────────────────────────

    const [sheetOpen, setSheetOpen] = useState(false);
    const [newPrice, setNewPrice] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [respondingId, setRespondingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // ── Submit proposal ──────────────────────────────────────────────────────

    const submitProposal = useCallback(async () => {
        const priceNum = parseFloat(newPrice);
        if (isNaN(priceNum) || priceNum <= 0) return;
        setSubmitting(true);
        setError(null);
        try {
            const { data } = await api.post(`/api/jobs/${jobId}/change-orders`, {
                items: [{
                    type: 'LABOR',
                    description: reason || 'Price adjustment',
                    quantity: 1,
                    unitPrice: priceNum,
                }],
            });
            addChangeOrder(jobId!, data);
            setSheetOpen(false);
            setNewPrice('');
            setReason('');
        } catch {
            setError(t('estimateChange.failed'));
        } finally {
            setSubmitting(false);
        }
    }, [jobId, newPrice, reason, addChangeOrder]);

    // ── Respond to proposal ──────────────────────────────────────────────────

    const respondToProposal = useCallback(async (changeOrderId: string, action: 'approve' | 'decline') => {
        setRespondingId(changeOrderId);
        setError(null);
        try {
            const { data } = await api.post(`/api/change-orders/${changeOrderId}/${action}`);
            updateChangeOrder(jobId!, data);
        } catch {
            setError(t('estimateChange.responseFailed'));
        } finally {
            setRespondingId(null);
        }
    }, [jobId, updateChangeOrder]);

    // ── Status badge helper ──────────────────────────────────────────────────

    const statusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return t('estimateChange.pending');
            case 'APPROVED': return t('estimateChange.approved');
            case 'DECLINED': return t('estimateChange.declined');
            default: return status;
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return '#F59E0B';
            case 'APPROVED': return '#22C55E';
            case 'DECLINED': return '#EF4444';
            default: return theme.colors.textSecondary;
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingHorizontal: theme.spacing.lg }]}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[theme.typography.titleLg, { color: theme.colors.textPrimary, flex: 1, textAlign: 'center' }]}>
                    {t('estimateChange.title')}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.flex}
                contentContainerStyle={[styles.content, { paddingHorizontal: theme.spacing.lg }]}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Current Price Card ── */}
                <Card>
                    <Text style={[theme.typography.label, { color: theme.colors.textTertiary }]}>
                        {t('estimateChange.currentPrice')}
                    </Text>
                    <Text style={[styles.priceDisplay, { color: theme.colors.textPrimary }]}>
                        ${currentPrice.toFixed(2)}
                    </Text>
                </Card>

                {/* ── Pending Proposal Card ── */}
                {pendingProposal && (
                    <Card style={{ marginTop: theme.spacing.lg }}>
                        <View style={styles.proposalHeader}>
                            <Text style={[theme.typography.label, { color: theme.colors.textTertiary }]}>
                                {t('estimateChange.proposedPrice')}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: statusColor('PENDING') + '20' }]}>
                                <Text style={[theme.typography.caption, { color: statusColor('PENDING') }]}>
                                    {statusLabel('PENDING')}
                                </Text>
                            </View>
                        </View>
                        <Text style={[styles.priceDisplay, { color: theme.colors.accent }]}>
                            ${pendingProposal.totalAmount.toFixed(2)}
                        </Text>

                        {/* Reason (first item description) */}
                        {pendingProposal.items[0]?.description && (
                            <View style={{ marginTop: theme.spacing.md }}>
                                <Text style={[theme.typography.label, { color: theme.colors.textTertiary, marginBottom: 4 }]}>
                                    {t('estimateChange.reason')}
                                </Text>
                                <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary }]}>
                                    {pendingProposal.items[0].description}
                                </Text>
                            </View>
                        )}

                        {/* Timestamp */}
                        <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginTop: theme.spacing.sm }]}>
                            {new Date(pendingProposal.createdAt).toLocaleString()}
                        </Text>

                        {/* Accept / Decline buttons (only for receiver) */}
                        {isReceiver && (
                            <View style={[styles.actionRow, { marginTop: theme.spacing.lg }]}>
                                <Button
                                    label={t('estimateChange.accept')}
                                    variant="primary"
                                    size="md"
                                    loading={respondingId === pendingProposal.id}
                                    onPress={() => respondToProposal(pendingProposal.id, 'approve')}
                                    leftIcon={<Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />}
                                />
                                <View style={{ width: 12 }} />
                                <Button
                                    label={t('estimateChange.decline')}
                                    variant="destructive"
                                    size="md"
                                    loading={respondingId === pendingProposal.id}
                                    onPress={() => respondToProposal(pendingProposal.id, 'decline')}
                                    leftIcon={<Ionicons name="close-circle" size={18} color="#FFFFFF" />}
                                />
                            </View>
                        )}
                    </Card>
                )}

                {/* ── Error ── */}
                {error && (
                    <View style={[styles.errorBar, { backgroundColor: theme.colors.errorLight, borderRadius: theme.radius.md, marginTop: theme.spacing.lg }]}>
                        <Ionicons name="alert-circle" size={18} color={theme.colors.error} />
                        <Text style={[theme.typography.bodySm, { color: theme.colors.error, marginLeft: 8, flex: 1 }]}>
                            {error}
                        </Text>
                    </View>
                )}

                {/* ── Timeline / Audit Trail ── */}
                <View style={{ marginTop: theme.spacing.xl }}>
                    <Text style={[theme.typography.titleSm, { color: theme.colors.textPrimary, marginBottom: theme.spacing.md }]}>
                        {t('estimateChange.timeline')}
                    </Text>

                    {/* Original estimate */}
                    <View style={styles.timelineItem}>
                        <View style={[styles.timelineDot, { backgroundColor: theme.colors.accent }]} />
                        <View style={styles.timelineContent}>
                            <Text style={[theme.typography.bodySm, { color: theme.colors.textPrimary }]}>
                                {t('estimateChange.original')}
                            </Text>
                            <Text style={[theme.typography.titleSm, { color: theme.colors.textPrimary }]}>
                                ${currentPrice.toFixed(2)}
                            </Text>
                        </View>
                    </View>

                    {/* Change order events */}
                    {changeOrders.map((co) => (
                        <View key={co.id} style={styles.timelineItem}>
                            <View style={[styles.timelineDot, { backgroundColor: statusColor(co.status) }]} />
                            <View style={styles.timelineContent}>
                                <View style={styles.timelineRow}>
                                    <Text style={[theme.typography.bodySm, { color: theme.colors.textPrimary, flex: 1 }]}>
                                        {t('estimateChange.proposalSent')}
                                    </Text>
                                    <View style={[styles.statusBadgeSm, { backgroundColor: statusColor(co.status) + '20' }]}>
                                        <Text style={[theme.typography.caption, { color: statusColor(co.status), fontSize: 10 }]}>
                                            {statusLabel(co.status)}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={[theme.typography.titleSm, { color: theme.colors.textPrimary }]}>
                                    ${co.totalAmount.toFixed(2)}
                                </Text>
                                {co.items[0]?.description && (
                                    <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]} numberOfLines={1}>
                                        {co.items[0].description}
                                    </Text>
                                )}
                                <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginTop: 2 }]}>
                                    {new Date(co.createdAt).toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* ── Bottom: Propose a Change button ── */}
            {!hasPending && userRole === 'TECHNICIAN' && (
                <View
                    style={[
                        styles.bottomBar,
                        {
                            paddingHorizontal: theme.spacing.lg,
                            paddingBottom: Math.max(insets.bottom, theme.spacing.lg),
                            backgroundColor: theme.colors.background,
                            borderTopColor: theme.colors.divider,
                        },
                    ]}
                >
                    <Button
                        label={t('estimateChange.propose')}
                        variant="primary"
                        size="lg"
                        onPress={() => setSheetOpen(true)}
                        leftIcon={<MaterialCommunityIcons name="pencil-outline" size={20} color="#FFFFFF" />}
                    />
                </View>
            )}

            {/* ── Proposal Bottom Sheet (Modal) ── */}
            <Modal visible={sheetOpen} animationType="slide" transparent>
                <KeyboardAvoidingView
                    style={styles.flex}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <TouchableOpacity
                        style={styles.sheetBackdrop}
                        activeOpacity={1}
                        onPress={() => setSheetOpen(false)}
                    />
                    <View
                        style={[
                            styles.sheetContent,
                            {
                                backgroundColor: theme.colors.surface,
                                borderTopLeftRadius: theme.radius.xl,
                                borderTopRightRadius: theme.radius.xl,
                                paddingHorizontal: theme.spacing.lg,
                                paddingBottom: Math.max(insets.bottom, theme.spacing.xl),
                            },
                        ]}
                    >
                        {/* Handle */}
                        <View style={styles.sheetHandle}>
                            <View style={[styles.handleBar, { backgroundColor: theme.colors.borderLight }]} />
                        </View>

                        <Text style={[theme.typography.titleLg, { color: theme.colors.textPrimary, marginBottom: theme.spacing.lg }]}>
                            {t('estimateChange.propose')}
                        </Text>

                        {/* New price input */}
                        <Text style={[theme.typography.label, { color: theme.colors.textSecondary, marginBottom: 6 }]}>
                            {t('estimateChange.proposedPrice')}
                        </Text>
                        <RNTextInput
                            value={newPrice}
                            onChangeText={setNewPrice}
                            placeholder={t('estimateChange.newPricePlaceholder')}
                            placeholderTextColor={theme.colors.textTertiary}
                            keyboardType="decimal-pad"
                            style={[
                                styles.sheetInput,
                                {
                                    backgroundColor: theme.colors.background,
                                    color: theme.colors.textPrimary,
                                    borderColor: theme.colors.border,
                                    borderRadius: theme.radius.md,
                                    ...theme.typography.bodyLg,
                                },
                            ]}
                        />

                        {/* Reason input */}
                        <Text style={[theme.typography.label, { color: theme.colors.textSecondary, marginTop: theme.spacing.lg, marginBottom: 6 }]}>
                            {t('estimateChange.reason')}
                        </Text>
                        <RNTextInput
                            value={reason}
                            onChangeText={setReason}
                            placeholder={t('estimateChange.reasonPlaceholder')}
                            placeholderTextColor={theme.colors.textTertiary}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            style={[
                                styles.sheetInput,
                                {
                                    backgroundColor: theme.colors.background,
                                    color: theme.colors.textPrimary,
                                    borderColor: theme.colors.border,
                                    borderRadius: theme.radius.md,
                                    minHeight: 80,
                                    ...theme.typography.bodyLg,
                                },
                            ]}
                        />

                        {/* Submit */}
                        <View style={{ marginTop: theme.spacing.xl }}>
                            <Button
                                label={t('estimateChange.submitProposal')}
                                variant="primary"
                                size="lg"
                                loading={submitting}
                                disabled={!newPrice || parseFloat(newPrice) <= 0}
                                onPress={submitProposal}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1 },
    flex: { flex: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },

    content: {
        paddingTop: 16,
        paddingBottom: 40,
    },

    priceDisplay: {
        fontSize: 36,
        fontWeight: '700',
        marginTop: 8,
    },

    proposalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
    },
    statusBadgeSm: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },

    actionRow: {
        flexDirection: 'row',
    },

    errorBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },

    // Timeline
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 5,
        marginRight: 12,
    },
    timelineContent: {
        flex: 1,
    },
    timelineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },

    // Bottom bar
    bottomBar: {
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },

    // Sheet
    sheetBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheetContent: {
        paddingTop: 12,
    },
    sheetHandle: {
        alignItems: 'center',
        marginBottom: 16,
    },
    handleBar: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    sheetInput: {
        borderWidth: 1,
        padding: 14,
    },
});
