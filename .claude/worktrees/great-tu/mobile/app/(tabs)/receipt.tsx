/**
 * receipt.tsx — Job Complete / Receipt Screen
 *
 * Shown after a job is completed. Professional, printable-feeling receipt
 * with technician rating, price breakdown, change order history, and share.
 *
 * Route params: { jobId: string }
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Animated,
    Share,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useTheme } from '../../src/hooks/useTheme';
import { t, useLanguageStore } from '../../src/i18n';
import { useJobStore, Job } from '../../src/store/useJobStore';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Avatar } from '../../src/components/ui/Avatar';
import { SectionHeader } from '../../src/components/ui/SectionHeader';

// ─── Constants ───────────────────────────────────────────────────────────────

const BOOKING_FEE = 2.99;

const TRADE_LABEL: Record<string, string> = {
    PLUMBER: 'home.map.plumbing',
    ELECTRICIAN: 'home.map.electrical',
    HVAC: 'home.map.hvac',
    POOL: 'home.map.pool',
    HOUSE_CLEANING: 'home.map.cleaning',
    GENERAL_HANDYMAN: 'home.map.handyman',
};
const TRADE_COLOR: Record<string, string> = {
    PLUMBER: '#3B82F6',
    ELECTRICIAN: '#F59E0B',
    HVAC: '#8B5CF6',
    POOL: '#06B6D4',
    HOUSE_CLEANING: '#6B7280',
    GENERAL_HANDYMAN: '#F97316',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReceiptScreen() {
    const theme = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ jobId: string }>();
    const jobId = params.jobId;

    useLanguageStore((s) => s.language);

    const job = useJobStore((s) => s.jobs.find((j) => j.id === jobId));
    const submitReview = useJobStore((s) => s.submitReview);

    // ── State ────────────────────────────────────────────────────────────────

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [ratingDone, setRatingDone] = useState(false);

    // ── Animations ───────────────────────────────────────────────────────────

    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
        }).start();
    }, [scaleAnim]);

    // ── Derived ──────────────────────────────────────────────────────────────

    const hasExistingReview = !!job?.review;
    const techName = job?.technician?.user?.name || job?.technician?.user?.firstName || 'Technician';
    const trade = job?.trade || 'PLUMBER';
    const tradeColor = TRADE_COLOR[trade] || '#3B82F6';
    const serviceFee = job?.finalAmount || job?.estimate?.currentAmount || job?.estimateLow || 0;
    const totalCharged = serviceFee + BOOKING_FEE;
    const changeOrders = job?.changeOrders || [];
    const hasChanges = changeOrders.length > 0;
    const displayRating = hasExistingReview ? job!.review!.rating : rating;

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleSubmitRating = useCallback(async () => {
        if (rating === 0 || !jobId) return;
        setSubmitting(true);
        try {
            await submitReview(jobId, rating, [], comment);
            setRatingDone(true);
        } catch {
            // Error handled by store
        } finally {
            setSubmitting(false);
        }
    }, [jobId, rating, comment, submitReview]);

    const handleShare = useCallback(async () => {
        const tradeLabel = t(TRADE_LABEL[trade] || 'home.map.plumbing');
        const message = [
            `Fuerza Home Services — ${t('receipt.finalReceipt')}`,
            ``,
            `${t('receipt.service')}: ${tradeLabel}`,
            `${t('receipt.completedOn')}: ${new Date().toLocaleDateString()}`,
            ``,
            `${t('receipt.service')}: $${serviceFee.toFixed(2)}`,
            `${t('receipt.bookingFee')}: $${BOOKING_FEE.toFixed(2)}`,
            `${t('receipt.totalCharged')}: $${totalCharged.toFixed(2)}`,
            ``,
            `Technician: ${techName}`,
            job?.address ? `Address: ${job.address}` : '',
        ].filter(Boolean).join('\n');

        await Share.share({ message });
    }, [trade, serviceFee, totalCharged, techName, job?.address]);

    // ── Render ────────────────────────────────────────────────────────────────

    if (!job) {
        return (
            <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color={theme.colors.accent} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                style={styles.flex}
                contentContainerStyle={[styles.content, { paddingHorizontal: theme.spacing.lg }]}
                showsVerticalScrollIndicator={false}
            >
                {/* ═══ 1. SUCCESS HEADER ═══ */}
                <Animated.View style={[styles.successHeader, { transform: [{ scale: scaleAnim }] }]}>
                    <View style={[styles.checkCircle, { backgroundColor: '#22C55E' }]}>
                        <Ionicons name="checkmark" size={36} color="#FFFFFF" />
                    </View>
                    <Text style={[theme.typography.headingLg, { color: theme.colors.textPrimary, marginTop: 16 }]}>
                        {t('receipt.serviceComplete')}
                    </Text>
                    <Text style={[theme.typography.bodySm, { color: theme.colors.textTertiary, marginTop: 4 }]}>
                        {t('receipt.completedOn')} {new Date().toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                        })}
                    </Text>
                </Animated.View>

                {/* ═══ 2. TECHNICIAN CARD + RATING ═══ */}
                <Card style={{ marginTop: theme.spacing.xl }}>
                    <View style={styles.techRow}>
                        <Avatar name={techName} size="lg" />
                        <View style={[styles.techInfo, { marginLeft: theme.spacing.md }]}>
                            <Text style={[theme.typography.titleSm, { color: theme.colors.textPrimary }]}>
                                {techName}
                            </Text>
                            <Text style={[theme.typography.caption, { color: tradeColor }]}>
                                {t(TRADE_LABEL[trade] || 'home.map.plumbing')}
                            </Text>
                        </View>
                    </View>

                    {/* Star rating */}
                    <View style={[styles.divider, { backgroundColor: theme.colors.divider, marginVertical: theme.spacing.md }]} />

                    {hasExistingReview || ratingDone ? (
                        <View style={styles.ratingSection}>
                            <View style={styles.starRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Ionicons
                                        key={star}
                                        name={star <= displayRating ? 'star' : 'star-outline'}
                                        size={28}
                                        color={star <= displayRating ? '#F59E0B' : theme.colors.border}
                                    />
                                ))}
                            </View>
                            <Text style={[theme.typography.caption, { color: '#22C55E', marginTop: 8, textAlign: 'center' }]}>
                                {t('receipt.ratingSubmitted')}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.ratingSection}>
                            <Text style={[theme.typography.label, { color: theme.colors.textSecondary, marginBottom: 8 }]}>
                                {t('receipt.rateYourTech')}
                            </Text>
                            <View style={styles.starRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                        <Ionicons
                                            name={star <= rating ? 'star' : 'star-outline'}
                                            size={36}
                                            color={star <= rating ? '#F59E0B' : theme.colors.border}
                                            style={{ marginHorizontal: 4 }}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TextInput
                                style={[
                                    styles.commentInput,
                                    {
                                        color: theme.colors.textPrimary,
                                        backgroundColor: theme.colors.backgroundSecondary,
                                        borderColor: theme.colors.border,
                                        borderRadius: theme.radius.md,
                                        marginTop: theme.spacing.md,
                                    },
                                ]}
                                placeholder="Leave a comment (optional)"
                                placeholderTextColor={theme.colors.textTertiary}
                                value={comment}
                                onChangeText={setComment}
                                multiline
                                numberOfLines={3}
                            />
                            <View style={{ marginTop: theme.spacing.md }}>
                                <Button
                                    label={t('receipt.submitRating')}
                                    variant="primary"
                                    size="md"
                                    loading={submitting}
                                    onPress={handleSubmitRating}
                                    disabled={rating === 0}
                                />
                            </View>
                        </View>
                    )}
                </Card>

                {/* ═══ 3. PRICE BREAKDOWN ═══ */}
                <Card style={{ marginTop: theme.spacing.lg }}>
                    <Text style={[theme.typography.titleSm, { color: theme.colors.textPrimary, marginBottom: theme.spacing.md }]}>
                        {t('receipt.finalReceipt')}
                    </Text>

                    <View style={styles.feeRow}>
                        <Text style={[theme.typography.bodyLg, { color: theme.colors.textSecondary }]}>
                            {t('receipt.service')}
                        </Text>
                        <Text style={[theme.typography.bodyLg, { color: theme.colors.textPrimary }]}>
                            ${serviceFee.toFixed(2)}
                        </Text>
                    </View>
                    <View style={styles.feeRow}>
                        <Text style={[theme.typography.bodyLg, { color: theme.colors.textSecondary }]}>
                            {t('receipt.bookingFee')}
                        </Text>
                        <Text style={[theme.typography.bodyLg, { color: theme.colors.textPrimary }]}>
                            ${BOOKING_FEE.toFixed(2)}
                        </Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.colors.divider, marginVertical: theme.spacing.md }]} />

                    <View style={styles.feeRow}>
                        <Text style={[theme.typography.titleSm, { color: theme.colors.textPrimary }]}>
                            {t('receipt.totalCharged')}
                        </Text>
                        <Text style={[theme.typography.titleLg, { color: theme.colors.accent }]}>
                            ${totalCharged.toFixed(2)}
                        </Text>
                    </View>

                    <View style={[styles.paymentRow, { marginTop: theme.spacing.md }]}>
                        <Ionicons name="card-outline" size={16} color={theme.colors.textTertiary} />
                        <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginLeft: 6 }]}>
                            {t('receipt.cardEnding')} ****4242
                        </Text>
                    </View>
                </Card>

                {/* ═══ 4. PRICE CHANGE HISTORY ═══ */}
                {hasChanges && (
                    <Card style={{ marginTop: theme.spacing.lg }}>
                        <View style={styles.changeLogHeader}>
                            <Ionicons name="swap-vertical" size={18} color={theme.colors.textSecondary} />
                            <Text style={[theme.typography.titleSm, { color: theme.colors.textPrimary, marginLeft: 8 }]}>
                                {t('receipt.priceChangeLog')}
                            </Text>
                        </View>

                        {/* Original estimate */}
                        <View style={[styles.timelineItem, { marginTop: theme.spacing.md }]}>
                            <View style={[styles.timelineDot, { backgroundColor: theme.colors.border }]} />
                            <View style={styles.timelineContent}>
                                <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary }]}>
                                    {t('receipt.originalEstimate')}
                                </Text>
                                <Text style={[theme.typography.titleSm, { color: theme.colors.textPrimary }]}>
                                    ${(job.estimateLow || job.estimate?.currentAmount || 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>

                        {/* Change orders */}
                        {changeOrders.map((co) => (
                            <View key={co.id} style={styles.timelineItem}>
                                <View style={[styles.timelineDot, {
                                    backgroundColor: co.status === 'APPROVED' ? '#22C55E' : co.status === 'DECLINED' ? '#EF4444' : '#F59E0B',
                                }]} />
                                <View style={styles.timelineContent}>
                                    <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary }]}>
                                        ${co.totalAmount.toFixed(2)} — {co.status}
                                    </Text>
                                    <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
                                        {new Date(co.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                        ))}

                        {/* Final agreed */}
                        <View style={styles.timelineItem}>
                            <View style={[styles.timelineDot, { backgroundColor: '#22C55E' }]} />
                            <View style={styles.timelineContent}>
                                <Text style={[theme.typography.bodySm, { color: '#22C55E', fontWeight: '600' }]}>
                                    {t('receipt.finalAgreed')}
                                </Text>
                                <Text style={[theme.typography.titleSm, { color: '#22C55E' }]}>
                                    ${serviceFee.toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </Card>
                )}

                {/* ═══ 5. JOB DETAILS ═══ */}
                <View style={{ marginTop: theme.spacing.xl }}>
                    <SectionHeader title={t('receipt.jobDetails')} />

                    <View style={{ marginTop: theme.spacing.sm }}>
                        <View style={styles.detailRow}>
                            <MaterialCommunityIcons name="briefcase-outline" size={16} color={tradeColor} />
                            <Text style={[theme.typography.bodySm, { color: theme.colors.textPrimary, marginLeft: 8 }]}>
                                {t(TRADE_LABEL[trade] || 'home.map.plumbing')}
                            </Text>
                        </View>
                        {job.address && (
                            <View style={styles.detailRow}>
                                <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
                                <Text style={[theme.typography.bodySm, { color: theme.colors.textPrimary, marginLeft: 8, flex: 1 }]} numberOfLines={2}>
                                    {job.address}
                                </Text>
                            </View>
                        )}
                        {job.description && (
                            <View style={styles.detailRow}>
                                <Ionicons name="document-text-outline" size={16} color={theme.colors.textSecondary} />
                                <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary, marginLeft: 8, flex: 1 }]} numberOfLines={3}>
                                    {job.description}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Photos */}
                    {job.photos && job.photos.length > 0 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={[styles.photoStrip, { marginTop: theme.spacing.md }]}
                        >
                            {job.photos.map((uri, i) => (
                                <Image
                                    key={i}
                                    source={{ uri }}
                                    style={[styles.photoThumb, { borderRadius: theme.radius.md }]}
                                />
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Bottom spacer for fixed footer */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ═══ 6. FOOTER ═══ */}
            <View
                style={[
                    styles.footer,
                    {
                        paddingHorizontal: theme.spacing.lg,
                        paddingBottom: Math.max(insets.bottom, theme.spacing.lg),
                        backgroundColor: theme.colors.background,
                        borderTopColor: theme.colors.divider,
                    },
                ]}
            >
                <TouchableOpacity
                    onPress={handleShare}
                    style={[
                        styles.shareBtn,
                        {
                            borderColor: theme.colors.accent,
                            borderRadius: theme.radius.md,
                        },
                    ]}
                    activeOpacity={0.7}
                >
                    <Ionicons name="share-outline" size={18} color={theme.colors.accent} />
                    <Text style={[theme.typography.titleSm, { color: theme.colors.accent, marginLeft: 6 }]}>
                        {t('receipt.share')}
                    </Text>
                </TouchableOpacity>

                <View style={{ width: 12 }} />

                <View style={styles.doneBtnWrap}>
                    <Button
                        label={t('receipt.done')}
                        variant="primary"
                        size="lg"
                        onPress={() => router.replace('/(tabs)/')}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1 },
    flex: { flex: 1 },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    content: {
        paddingTop: 24,
        paddingBottom: 40,
    },

    // Success header
    successHeader: {
        alignItems: 'center',
    },
    checkCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },

    // Tech row
    techRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    techInfo: {
        flex: 1,
    },

    // Rating
    ratingSection: {
        alignItems: 'center',
    },
    starRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    commentInput: {
        width: '100%',
        minHeight: 70,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingTop: 10,
        fontSize: 14,
        textAlignVertical: 'top',
    },

    // Price
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    paymentRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    divider: {
        height: StyleSheet.hairlineWidth,
    },

    // Change log
    changeLogHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 12,
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 4,
        marginRight: 10,
    },
    timelineContent: {
        flex: 1,
    },

    // Job details
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 8,
    },

    // Photos
    photoStrip: {
        gap: 10,
    },
    photoThumb: {
        width: 80,
        height: 80,
    },

    // Footer
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderWidth: 1.5,
    },
    doneBtnWrap: {
        flex: 1,
    },
});
