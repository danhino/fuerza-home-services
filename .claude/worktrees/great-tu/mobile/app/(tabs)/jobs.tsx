import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
    RefreshControl, Image, Modal, Dimensions, Linking, TextInput, ScrollView,
    KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useJobStore, Job, ChangeOrder, ChangeOrderItem } from '../../src/store/useJobStore';
import { useThemeColor } from '../../src/hooks/useThemeColor';
import { t, useLanguageStore } from '../../src/i18n';
import { ScreenHeader, StatusBadge } from '../../src/components/stitch_ui';
import { Typography } from '../../src/constants/Typography';
import { Spacing, Radius, Elevation } from '../../src/constants/Spacing';
import { Brand, Palette } from '../../src/constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
    REQUESTED: 'info',
    MATCHED: 'info',
    EN_ROUTE: 'warning',
    ARRIVED: 'warning',
    WORKING: 'warning',
    COMPLETED: 'success',
    CANCELLED: 'danger',
};

export default function JobsScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { jobs, loading, refreshing, fetchJobs, initializeSocketListeners, cleanupSocketListeners, capturePayment } = useJobStore();
    const [role, setRole] = useState<'CUSTOMER' | 'TECHNICIAN' | 'BOTH'>(user?.role || 'CUSTOMER');

    // Change Order State
    const [isChangeOrderModalVisible, setIsChangeOrderModalVisible] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [coDescription, setCoDescription] = useState('');
    const [coType, setCoType] = useState<'LABOR' | 'PARTS'>('LABOR');
    const [coPrice, setCoPrice] = useState('');
    const [coItems, setCoItems] = useState<ChangeOrderItem[]>([]);
    const [coModalVisible, setCoModalVisible] = useState(false);

    // Media State
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

    // Invoice State
    const [selectedTipOption, setSelectedTipOption] = useState<number | 'custom'>(0.15);
    const [customTip, setCustomTip] = useState('');

    // Review State
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewTags, setReviewTags] = useState<string[]>([]);
    const [reviewComment, setReviewComment] = useState('');
    const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
    const language = useLanguageStore((s) => s.language);

    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const cardColor = useThemeColor({}, 'card');

    useEffect(() => {
        if (user) {
            fetchJobs(user.role);
            initializeSocketListeners();
        }
        return () => cleanupSocketListeners();
    }, [user]);

    const onRefresh = useCallback(async () => {
        await fetchJobs(user?.role || 'CUSTOMER');
    }, [user?.role, fetchJobs]);

    const acceptJob = async (jobId: string) => {
        try {
            await api.post('/jobs/accept', { jobId });
            Alert.alert(t('jobs.success'), t('jobs.accepted'));
            if (user) fetchJobs(user.role);
        } catch (e) {
            Alert.alert(t('home.error'), t('jobs.acceptFailed'));
        }
    };

    const submitChangeOrder = async () => {
        if (!selectedJobId) return;
        try {
            await api.post(`/jobs/${selectedJobId}/change-orders`, { items: coItems });
            Alert.alert(t('jobs.success'), 'Change Order Sent');
            setCoModalVisible(false);
            setCoItems([{ id: Date.now().toString(), type: 'PARTS', description: '', quantity: 1, unitPrice: 0 }]);
        } catch (e) {
            Alert.alert(t('home.error'), 'Failed to create change order');
        }
    };

    const updateChangeOrderStatus = async (coId: string, action: 'approve' | 'decline') => {
        try {
            await api.post(`/change-orders/${coId}/${action}`);
            Alert.alert(t('jobs.success'), `Change Order ${action}d`);
        } catch (e) {
            Alert.alert(t('home.error'), `Failed to ${action} change order`);
        }
    };

    const addCoItem = () => {
        const newItems: ChangeOrderItem[] = [...coItems, { id: Date.now().toString(), type: 'PARTS', description: '', quantity: 1, unitPrice: 0 }];
        setCoItems(newItems);
    };

    const updateCoItem = (index: number, field: keyof Omit<ChangeOrderItem, 'id'>, value: any) => {
        const newItems = [...coItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setCoItems(newItems);
    };

    const removeCoItem = (index: number) => {
        const newItems = [...coItems];
        newItems.splice(index, 1);
        setCoItems(newItems);
    };

    const submitReview = async (jobId: string) => {
        setIsReviewSubmitting(true);
        try {
            await useJobStore.getState().submitReview(jobId, reviewRating, reviewTags, reviewComment);
            Alert.alert(t('jobs.success'), 'Review Submitted');
        } catch (error) {
            Alert.alert(t('home.error'), 'Failed to submit review');
        } finally {
            setIsReviewSubmitting(false);
        }
    };

    const toggleReviewTag = (tag: string) => {
        if (reviewTags.includes(tag)) {
            setReviewTags(reviewTags.filter(t => t !== tag));
        } else {
            setReviewTags([...reviewTags, tag]);
        }
    };

    const renderReviewForm = (job: Job) => {
        const TAGS = ['Professional', 'Punctual', 'Clean', 'Expert', 'Friendly'];
        return (
            <View style={styles.reviewContainer}>
                <Text style={styles.reviewTitle}>Rate your Experience</Text>
                <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map(star => (
                        <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                            <Ionicons
                                name={star <= reviewRating ? "star" : "star-outline"}
                                size={32}
                                color="#FF9500"
                            />
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={styles.sectionTitle}>What went well?</Text>
                <View style={styles.tagsRow}>
                    {TAGS.map(tag => (
                        <TouchableOpacity
                            key={tag}
                            style={[styles.tagChip, reviewTags.includes(tag) && styles.tagChipSelected]}
                            onPress={() => toggleReviewTag(tag)}
                        >
                            <Text style={[styles.tagText, reviewTags.includes(tag) && styles.tagTextSelected]}>{tag}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TextInput
                    style={styles.commentInput}
                    placeholder="Leave a comment (optional)"
                    placeholderTextColor={Palette.textSecondary}
                    value={reviewComment}
                    onChangeText={setReviewComment}
                    multiline
                />
                <TouchableOpacity
                    style={styles.submitReviewButton}
                    onPress={() => submitReview(job.id)}
                    disabled={isReviewSubmitting}
                >
                    <Text style={styles.buttonText}>{isReviewSubmitting ? 'Submitting...' : 'Submit Review'}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderReceiptView = (job: Job) => {
        return (
            <View style={styles.receiptContainer}>
                <View style={styles.receiptHeader}>
                    <Ionicons name="checkmark-circle" size={48} color="#34C759" />
                    <Text style={styles.receiptTitle}>Payment Successful</Text>
                </View>
                <Text style={styles.receiptTotal}>${((job.finalAmount || 0) / 100).toFixed(2)}</Text>

                <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Transaction ID</Text>
                    <Text style={styles.receiptValue}>{job.holdRef?.slice(-8).toUpperCase()}</Text>
                </View>
                <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Warranty</Text>
                    <Text style={styles.receiptValue}>{job.warrantyDays || 30} Days</Text>
                </View>
                <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Receipt</Text>
                    <Text style={styles.receiptValue}>Emailed to you</Text>
                </View>

                {job.review && (
                    <View style={styles.reviewSummary}>
                        <Text style={styles.reviewSummaryTitle}>Your Review</Text>
                        <View style={styles.starsRow}>
                            {[...Array(job.review.rating)].map((_, i) => (
                                <Ionicons key={i} name="star" size={16} color="#FF9500" />
                            ))}
                        </View>
                        <Text style={styles.reviewComment}>{job.review.comment}</Text>
                    </View>
                )}
            </View>
        );
    };

    const handlePaymentCapture = async (job: Job) => {
        try {
            const baseAmount = job.estimate?.currentAmount || 0;
            const changeOrderTotal = (job.changeOrders || [])
                .filter(co => co.status === 'APPROVED')
                .reduce((sum, co) => sum + co.totalAmount, 0);

            const subtotal = baseAmount + changeOrderTotal;
            let tipCents = 0;

            if (selectedTipOption === 'custom') {
                tipCents = Math.round(parseFloat(customTip || '0') * 100);
            } else {
                tipCents = Math.round(subtotal * selectedTipOption * 100);
            }

            await capturePayment(job.id, tipCents);
            Alert.alert(t('jobs.success'), t('jobs.paymentCaptured'));
        } catch (error) {
            Alert.alert(t('home.error'), t('jobs.paymentFailed'));
        }
    };

    const renderInvoice = (job: Job) => {
        const baseAmount = job.estimate?.currentAmount || 0;
        const changeOrders = (job.changeOrders || []).filter(co => co.status === 'APPROVED');
        const changeOrderTotal = changeOrders.reduce((sum, co) => sum + co.totalAmount, 0);
        const subtotal = baseAmount + changeOrderTotal;

        const getTipAmount = () => {
            if (selectedTipOption === 'custom') {
                return parseFloat(customTip || '0');
            }
            return subtotal * selectedTipOption;
        };

        const tipAmount = getTipAmount();
        const total = subtotal + tipAmount;

        return (
            <View style={styles.invoiceContainer}>
                <Text style={styles.invoiceTitle}>{t('jobs.invoice.title')}</Text>

                <View style={styles.invoiceRow}>
                    <Text style={styles.invoiceLabel}>{t('jobs.invoice.baseEstimate')}</Text>
                    <Text style={styles.invoiceValue}>${baseAmount.toFixed(2)}</Text>
                </View>

                {changeOrders.map(co => (
                    <View key={co.id} style={styles.invoiceRow}>
                        <Text style={styles.invoiceLabel}>{t('jobs.invoice.changeOrder')}</Text>
                        <Text style={styles.invoiceValue}>${co.totalAmount.toFixed(2)}</Text>
                    </View>
                ))}

                <View style={[styles.invoiceRow, styles.invoiceSubtotal]}>
                    <Text style={styles.invoiceLabelBold}>{t('jobs.invoice.subtotal')}</Text>
                    <Text style={styles.invoiceValueBold}>${subtotal.toFixed(2)}</Text>
                </View>

                <Text style={styles.sectionTitle}>{t('jobs.invoice.addTip')}</Text>
                <View style={styles.tipSelector}>
                    {[0.10, 0.15, 0.20].map((opt) => (
                        <TouchableOpacity
                            key={opt}
                            style={[styles.tipOption, selectedTipOption === opt && styles.tipOptionSelected]}
                            onPress={() => { setSelectedTipOption(opt); setCustomTip(''); }}
                        >
                            <Text style={[styles.tipText, selectedTipOption === opt && styles.tipTextSelected]}>
                                {opt * 100}%
                            </Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={[styles.tipOption, selectedTipOption === 'custom' && styles.tipOptionSelected]}
                        onPress={() => setSelectedTipOption('custom')}
                    >
                        <Text style={[styles.tipText, selectedTipOption === 'custom' && styles.tipTextSelected]}>
                            {t('jobs.invoice.custom')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {selectedTipOption === 'custom' && (
                    <TextInput
                        style={styles.customTipInput}
                        value={customTip}
                        onChangeText={setCustomTip}
                        placeholder="0.00"
                        keyboardType="numeric"
                        placeholderTextColor={Palette.textSecondary}
                    />
                )}

                <View style={[styles.invoiceRow, styles.invoiceTotal]}>
                    <Text style={styles.invoiceTotalLabel}>{t('jobs.invoice.total')}</Text>
                    <Text style={styles.invoiceTotalValue}>${total.toFixed(2)}</Text>
                </View>

                <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => handlePaymentCapture(job)}
                >
                    <Text style={styles.payButtonText}>{t('jobs.invoice.pay')} ${total.toFixed(2)}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderItem = ({ item }: { item: Job }) => {
        const isSpanishCustomer =
            user?.role === 'TECHNICIAN' &&
            item.customer?.user?.preferredLanguage === 'es';

        const isTechnician = user?.role === 'TECHNICIAN';
        const isRequested = item.status === 'REQUESTED';

        return (
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                {(user?.role === 'CUSTOMER' && item.status === 'COMPLETED' && (item.paymentHoldStatus === 'HELD' || item.paymentHoldStatus === 'HOLD_PENDING')) ? (
                    renderInvoice(item)
                ) : (user?.role === 'CUSTOMER' && item.paymentHoldStatus === 'CAPTURED') ? (
                    !item.review ? renderReviewForm(item) : renderReceiptView(item)
                ) : (
                    <>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.jobTitle, { color: textColor }]}>{item.trade}</Text>
                            <View style={styles.badgeRow}>
                                <StatusBadge label={item.status} variant={STATUS_VARIANT[item.status] || 'neutral'} />
                                {isSpanishCustomer && (
                                    <StatusBadge label={t('jobs.customerLanguage.badgeSpanish')} variant="warning" />
                                )}
                            </View>
                        </View>

                        {isTechnician && item.issueTag && (
                            <StatusBadge
                                label={t(`issue.${item.trade.toLowerCase()}.${item.issueTag}`) || item.issueTag}
                                variant="info"
                            />
                        )}
                        <View style={styles.contentSection}>
                            <View style={styles.infoRow}>
                                <Text style={[styles.label, { color: textColor }]}>{t('jobs.customer')}:</Text>
                                <Text style={[styles.value, { color: textColor }]}>{item.customer?.user?.firstName ? `${item.customer.user.firstName} ${item.customer.user.lastName || ''}`.trim() : item.customer?.user?.name}</Text>
                            </View>

                            {isTechnician && item.address && (
                                <View style={styles.infoRow}>
                                    <Text style={[styles.label, { color: textColor }]}>{t('request.address')}:</Text>
                                    <Text style={[styles.value, { color: textColor }]}>{item.address}</Text>
                                </View>
                            )}

                            <Text style={[styles.description, { color: textColor }]}>{item.description}</Text>

                            {item.photos && item.photos.length > 0 && (
                                <FlatList
                                    data={item.photos}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    keyExtractor={(p, i) => `${item.id}-photo-${i}`}
                                    renderItem={({ item: photoUri }) => (
                                        <TouchableOpacity onPress={() => setSelectedPhoto(photoUri)}>
                                            <Image source={{ uri: photoUri }} style={styles.jobPhoto} />
                                        </TouchableOpacity>
                                    )}
                                    style={styles.photoList}
                                />
                            )}

                            {isTechnician && item.videoUrl && (
                                <TouchableOpacity
                                    style={styles.videoIndicator}
                                    onPress={() => setSelectedVideo(item.videoUrl!)}
                                >
                                    <Ionicons name="videocam" size={16} color={Brand.primary} />
                                    <Text style={styles.videoIndicatorText}>{t('request.videoAvailable')}</Text>
                                    <Ionicons name="open-outline" size={14} color={Brand.primary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Earnings breakdown for technicians — shown before accept */}
                        {isTechnician && isRequested && (() => {
                            const serviceFee = item.estimate?.currentAmount ?? item.estimateLow ?? 0;
                            const bookingFee = 2.99;
                            const platformCommission = serviceFee * 0.12;
                            const technicianEarnings = serviceFee * 0.88;
                            const customerTotal = serviceFee + bookingFee;
                            
                            return (
                                <View style={styles.earningsBox}>
                                    <Text style={styles.earningsTitle}>{t('jobs.earnings.title')}</Text>
                                    <View style={styles.earningsRow}>
                                        <Text style={styles.earningsLabel}>{t('jobs.earnings.customerPays')}</Text>
                                        <Text style={styles.earningsValue}>${customerTotal.toFixed(2)}</Text>
                                    </View>
                                    <View style={styles.earningsRow}>
                                        <Text style={styles.earningsLabel}>{t('jobs.earnings.platformFee')}</Text>
                                        <Text style={[styles.earningsValue, { color: '#FF3B30' }]}>-${platformCommission.toFixed(2)}</Text>
                                    </View>
                                    <View style={[styles.earningsRow, styles.earningsTotalRow]}>
                                        <Text style={styles.earningsTotalLabel}>{t('jobs.earnings.yourEarnings')}</Text>
                                        <Text style={styles.earningsTotalValue}>${technicianEarnings.toFixed(2)}</Text>
                                    </View>
                                </View>
                            );
                        })()}

                        {/* Change Orders List */}
                        {item.changeOrders && item.changeOrders.length > 0 && (
                            <View style={styles.changeOrdersSection}>
                                <Text style={styles.sectionTitle}>Change Orders</Text>
                                {item.changeOrders.map((co) => (
                                    <View key={co.id} style={styles.coCard}>
                                        <View style={styles.coHeader}>
                                            <StatusBadge
                                                label={co.status}
                                                variant={co.status === 'APPROVED' ? 'success' : co.status === 'DECLINED' ? 'danger' : 'warning'}
                                            />
                                            <Text style={styles.coTotal}>${co.totalAmount.toFixed(2)}</Text>
                                        </View>
                                        {co.items.map((line, idx) => (
                                            <Text key={idx} style={styles.coItemText}>
                                                {line.quantity}x {line.description} (${line.unitPrice})
                                            </Text>
                                        ))}
                                        {!isTechnician && co.status === 'PENDING' && (
                                            <View style={styles.coActions}>
                                                <TouchableOpacity
                                                    style={[styles.coButton, styles.declineButton]}
                                                    onPress={() => updateChangeOrderStatus(co.id, 'decline')}
                                                >
                                                    <Text style={styles.coButtonText}>Decline</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.coButton, styles.approveButton]}
                                                    onPress={() => updateChangeOrderStatus(co.id, 'approve')}
                                                >
                                                    <Text style={styles.coButtonText}>Approve</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Create Change Order Button (Technician Only, Active Jobs) */}
                        {isTechnician && ['MATCHED', 'EN_ROUTE', 'ARRIVED', 'WORKING'].includes(item.status) && (
                            <TouchableOpacity
                                style={styles.createCoButton}
                                onPress={() => {
                                    setSelectedJobId(item.id);
                                    setCoModalVisible(true);
                                }}
                            >
                                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                                <Text style={styles.buttonText}>Create Change Order</Text>
                            </TouchableOpacity>
                        )}

                        {isTechnician && isRequested && (
                            <TouchableOpacity style={styles.acceptButton} onPress={() => acceptJob(item.id)}>
                                <Text style={styles.acceptButtonText}>{t('jobs.acceptJob')}</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <ScreenHeader title={t('jobs.title')} textColor={textColor} />

            {jobs.length === 0 ? (
                <Text style={[styles.empty, { color: textColor }]}>{t('jobs.noJobs')}</Text>
            ) : (
                <FlatList
                    data={jobs}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                />
            )}

            {/* Full-screen photo viewer */}
            <Modal visible={!!selectedPhoto} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedPhoto(null)}>
                        <Ionicons name="close-circle" size={36} color="#fff" />
                    </TouchableOpacity>
                    {selectedPhoto && (
                        <Image
                            source={{ uri: selectedPhoto }}
                            style={styles.modalImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>

            {/* Full-screen video viewer */}
            <Modal visible={!!selectedVideo} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedVideo(null)}>
                        <Ionicons name="close-circle" size={36} color="#fff" />
                    </TouchableOpacity>
                    {selectedVideo && (
                        <View style={styles.videoModalContent}>
                            <Ionicons name="videocam" size={64} color="#fff" />
                            <Text style={styles.videoModalText}>{t('request.videoAvailable')}</Text>
                            <TouchableOpacity
                                style={styles.videoPlayButton}
                                onPress={() => {
                                    Linking.openURL(selectedVideo).catch(() => {
                                        Alert.alert(t('home.error'), 'Could not open video');
                                    });
                                }}
                            >
                                <Ionicons name="play-circle" size={28} color="#fff" />
                                <Text style={styles.videoPlayText}>Open Video</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </Modal>
            {/* Change Order Creation Modal */}
            <Modal visible={coModalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.coModalContent}>
                        <View style={styles.coModalHeader}>
                            <Text style={styles.coModalTitle}>New Change Order</Text>
                            <TouchableOpacity onPress={() => setCoModalVisible(false)}>
                                <Ionicons name="close" size={24} color={Palette.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.coItemsList}>
                            {coItems.map((item, index) => (
                                <View key={index} style={styles.coItemInputRow}>
                                    <View style={styles.coItemHeader}>
                                        <Text style={styles.coItemIndex}>Item {index + 1}</Text>
                                        {index > 0 && (
                                            <TouchableOpacity onPress={() => removeCoItem(index)}>
                                                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <TextInput
                                        placeholder="Description"
                                        placeholderTextColor={Palette.textSecondary}
                                        style={styles.input}
                                        value={item.description}
                                        onChangeText={(text) => updateCoItem(index, 'description', text)}
                                    />
                                    <View style={styles.row}>
                                        <TextInput
                                            placeholder="Qty"
                                            keyboardType="numeric"
                                            placeholderTextColor={Palette.textSecondary}
                                            style={[styles.input, { flex: 1, marginRight: Spacing.sm }]}
                                            value={item.quantity.toString()}
                                            onChangeText={(text) => updateCoItem(index, 'quantity', parseInt(text) || 0)}
                                        />
                                        <TextInput
                                            placeholder="Price"
                                            keyboardType="numeric"
                                            placeholderTextColor={Palette.textSecondary}
                                            style={[styles.input, { flex: 1 }]}
                                            value={item.unitPrice.toString()}
                                            onChangeText={(text) => updateCoItem(index, 'unitPrice', parseFloat(text) || 0)}
                                        />
                                    </View>
                                </View>
                            ))}
                            <TouchableOpacity style={styles.addItemButton} onPress={addCoItem}>
                                <Ionicons name="add" size={20} color={Brand.primary} />
                                <Text style={styles.addItemText}>Add Item</Text>
                            </TouchableOpacity>
                        </ScrollView>
                        <View style={styles.coModalFooter}>
                            <TouchableOpacity style={styles.submitCoButton} onPress={submitChangeOrder}>
                                <Text style={styles.buttonText}>Send to Customer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: {
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderRadius: Radius.lg,
        ...Elevation.medium,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
    badgeRow: { flexDirection: 'row', gap: Spacing.xs },
    jobTitle: { ...Typography.bodyLg, fontWeight: '700', flex: 1 },
    acceptButton: {
        marginTop: Spacing.md,
        backgroundColor: '#34C759',
        paddingVertical: Spacing.md,
        borderRadius: Radius.lg,
        alignItems: 'center',
        ...Elevation.low,
    },
    acceptButtonText: { ...Typography.button, color: '#fff' },
    buttonText: { ...Typography.bodySm, color: '#fff', fontWeight: '700' },
    empty: { ...Typography.bodyLg, textAlign: 'center', marginTop: 50 },

    // Content
    contentSection: { marginTop: Spacing.sm, gap: Spacing.sm },
    infoRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs },
    label: { ...Typography.caption, fontWeight: '600', opacity: 0.7 },
    value: { ...Typography.bodySm, fontWeight: '500' },
    description: { ...Typography.bodySm, lineHeight: 20, marginTop: Spacing.xs },
    photoList: { marginTop: Spacing.md, marginBottom: Spacing.xs },
    jobPhoto: { width: 120, height: 120, borderRadius: Radius.default, marginRight: Spacing.sm, backgroundColor: '#f0f0f0' },

    // Video indicator
    videoIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.sm,
        backgroundColor: '#E8F4FD',
        alignSelf: 'flex-start',
        paddingHorizontal: Spacing.sm + 2,
        paddingVertical: Spacing.xs + 1,
        borderRadius: Radius.full,
    },
    videoIndicatorText: { ...Typography.caption, color: Brand.primary, fontWeight: '600' },

    // Full-screen modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.92)', justifyContent: 'center', alignItems: 'center' },
    modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
    modalImage: { width: SCREEN_WIDTH - 40, height: SCREEN_HEIGHT * 0.7 },
    videoModalContent: { alignItems: 'center', gap: Spacing.lg },
    videoModalText: { ...Typography.bodyLg, color: '#fff', fontWeight: '600' },
    videoPlayButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Brand.primary,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: Radius.full,
        marginTop: Spacing.sm,
    },
    videoPlayText: { ...Typography.bodySm, color: '#fff', fontWeight: '700' },

    // Technician earnings breakdown
    earningsBox: {
        marginTop: Spacing.md,
        backgroundColor: '#E8F8EE',
        borderRadius: Radius.default,
        padding: Spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: '#34C759',
    },
    earningsTitle: { ...Typography.bodySm, fontWeight: '700', color: '#1B5E20', marginBottom: Spacing.sm },
    earningsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
    earningsLabel: { ...Typography.caption, color: Palette.textSecondary },
    earningsValue: { ...Typography.caption, fontWeight: '600', color: Palette.textPrimary },
    earningsTotalRow: {
        borderTopWidth: 1,
        borderTopColor: '#C8E6C9',
        paddingTop: Spacing.xs + 2,
        marginTop: Spacing.xs,
        marginBottom: 0,
    },
    earningsTotalLabel: { ...Typography.bodySm, fontWeight: '700', color: '#1B5E20' },
    earningsTotalValue: { ...Typography.bodySm, fontWeight: '700', color: '#34C759' },

    // Change Order Styles
    changeOrdersSection: { marginTop: Spacing.lg, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: Spacing.sm },
    sectionTitle: { ...Typography.bodySm, fontWeight: '700', marginBottom: Spacing.sm },
    coCard: {
        backgroundColor: '#f9f9f9',
        padding: Spacing.sm + 2,
        borderRadius: Radius.default,
        marginBottom: Spacing.sm,
        borderLeftWidth: 3,
        borderLeftColor: Brand.primary,
    },
    coHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
    coTotal: { ...Typography.bodySm, fontWeight: '700' },
    coItemText: { ...Typography.caption, color: Palette.textSecondary },
    coActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
    coButton: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.default, alignItems: 'center' },
    approveButton: { backgroundColor: '#34C759' },
    declineButton: { backgroundColor: '#FF3B30' },
    coButtonText: { ...Typography.caption, color: '#fff', fontWeight: '700' },
    createCoButton: {
        backgroundColor: Brand.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        borderRadius: Radius.default,
        marginTop: Spacing.md,
        gap: Spacing.sm,
    },

    // Modal Styles
    coModalContent: { backgroundColor: '#fff', width: '90%', maxHeight: '80%', borderRadius: Radius.lg, overflow: 'hidden' },
    coModalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: '#eee' },
    coModalTitle: { ...Typography.displaySm, fontWeight: '700' },
    coItemsList: { padding: Spacing.lg },
    coItemInputRow: { marginBottom: Spacing.lg, padding: Spacing.sm + 2, backgroundColor: '#f5f5f5', borderRadius: Radius.default },
    coItemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
    coItemIndex: { ...Typography.bodySm, fontWeight: '600', color: Palette.textSecondary },
    input: { backgroundColor: '#fff', padding: Spacing.sm + 2, borderRadius: Radius.default, borderWidth: 1, borderColor: '#ddd', marginBottom: Spacing.sm },
    row: { flexDirection: 'row' },
    addItemButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', padding: Spacing.sm + 2 },
    addItemText: { ...Typography.bodySm, color: Brand.primary, fontWeight: '600' },
    coModalFooter: { padding: Spacing.lg, borderTopWidth: 1, borderTopColor: '#eee' },
    submitCoButton: { backgroundColor: Brand.primary, paddingVertical: Spacing.md, borderRadius: Radius.default, alignItems: 'center' },

    // Invoice Styles
    invoiceContainer: { padding: Spacing.sm + 2 },
    invoiceTitle: { ...Typography.displaySm, fontWeight: '700', marginBottom: Spacing.lg, textAlign: 'center' },
    invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
    invoiceLabel: { ...Typography.bodySm, color: Palette.textSecondary },
    invoiceValue: { ...Typography.bodySm, fontWeight: '500' },
    invoiceSubtotal: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: Spacing.sm, marginTop: Spacing.sm },
    invoiceLabelBold: { ...Typography.bodyLg, fontWeight: '700' },
    invoiceValueBold: { ...Typography.bodyLg, fontWeight: '700' },
    tipSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
    tipOption: {
        flex: 1,
        paddingVertical: Spacing.sm + 2,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: Radius.default,
        marginHorizontal: Spacing.xs,
        alignItems: 'center',
    },
    tipOptionSelected: { backgroundColor: Brand.primary, borderColor: Brand.primary },
    tipText: { ...Typography.bodySm, color: Palette.textPrimary, fontWeight: '700' },
    tipTextSelected: { color: '#fff' },
    customTipInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: Radius.default,
        padding: Spacing.sm + 2,
        textAlign: 'right',
        marginBottom: Spacing.md,
        ...Typography.bodyLg,
        fontWeight: '700',
    },
    invoiceTotal: { marginTop: Spacing.lg, paddingTop: Spacing.lg, borderTopWidth: 2, borderTopColor: '#eee' },
    invoiceTotalLabel: { ...Typography.displaySm, fontWeight: '700' },
    invoiceTotalValue: { ...Typography.displayLg, color: '#34C759' },
    payButton: {
        backgroundColor: '#34C759',
        paddingVertical: Spacing.lg,
        borderRadius: Radius.lg,
        alignItems: 'center',
        marginTop: Spacing.xl,
        ...Elevation.medium,
    },
    payButtonText: { ...Typography.button, color: '#fff' },

    // Review Styles
    reviewContainer: { padding: Spacing.sm + 2 },
    reviewTitle: { ...Typography.displaySm, fontWeight: '700', textAlign: 'center', marginBottom: Spacing.lg },
    starsRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
    tagChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs + 2,
        borderRadius: Radius.full,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    tagChipSelected: { backgroundColor: Brand.primary, borderColor: Brand.primary },
    tagText: { ...Typography.bodySm, color: Palette.textPrimary },
    tagTextSelected: { color: '#fff', fontWeight: '700' },
    commentInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: Radius.default,
        padding: Spacing.sm + 2,
        height: 80,
        textAlignVertical: 'top',
        marginBottom: Spacing.lg,
        ...Typography.bodySm,
    },
    submitReviewButton: {
        backgroundColor: Brand.primary,
        paddingVertical: Spacing.md,
        borderRadius: Radius.default,
        alignItems: 'center',
    },

    // Receipt Styles
    receiptContainer: { padding: Spacing.lg, alignItems: 'center' },
    receiptHeader: { alignItems: 'center', marginBottom: Spacing.lg },
    receiptTitle: { ...Typography.displayLg, fontWeight: '700', marginTop: Spacing.sm },
    receiptTotal: { ...Typography.displayLg, fontWeight: '700', color: Palette.textPrimary, marginBottom: Spacing.lg, fontSize: 32 },
    receiptRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: Spacing.sm,
    },
    receiptLabel: { ...Typography.bodyLg, color: Palette.textSecondary },
    receiptValue: { ...Typography.bodyLg, fontWeight: '600' },
    reviewSummary: {
        marginTop: Spacing.xl,
        width: '100%',
        backgroundColor: '#f9f9f9',
        padding: Spacing.lg,
        borderRadius: Radius.default,
    },
    reviewSummaryTitle: { ...Typography.bodySm, fontWeight: '700', marginBottom: Spacing.sm },
    reviewComment: { ...Typography.bodySm, fontStyle: 'italic', color: Palette.textSecondary, marginTop: Spacing.sm },
});
