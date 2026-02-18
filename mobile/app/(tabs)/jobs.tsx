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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
                        placeholderTextColor="#999"
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
                            <Text style={[styles.jobTitle, { color: textColor }]}>{item.trade} - {item.status}</Text>
                            {isSpanishCustomer && (
                                <View style={styles.esBadge}>
                                    <Text style={styles.esBadgeText}>{t('jobs.customerLanguage.badgeSpanish')}</Text>
                                </View>
                            )}
                        </View>

                        {isTechnician && item.issueTag && (
                            <View style={styles.issueTagBadge}>
                                <Text style={styles.issueTagText}>
                                    {t(`issue.${item.trade.toLowerCase()}.${item.issueTag}`) || item.issueTag}
                                </Text>
                            </View>
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
                                    <Ionicons name="videocam" size={16} color="#007AFF" />
                                    <Text style={styles.videoIndicatorText}>{t('request.videoAvailable')}</Text>
                                    <Ionicons name="open-outline" size={14} color="#007AFF" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Earnings breakdown for technicians — shown before accept */}
                        {isTechnician && isRequested && (item.estimateLow != null && item.estimateHigh != null) && (() => {
                            const PLATFORM_FEE = 2.99;
                            const earningsLow = Math.max(0, item.estimateLow! - PLATFORM_FEE);
                            const earningsHigh = Math.max(0, item.estimateHigh! - PLATFORM_FEE);
                            return (
                                <View style={styles.earningsBox}>
                                    <Text style={styles.earningsTitle}>{t('jobs.earnings.title')}</Text>
                                    <View style={styles.earningsRow}>
                                        <Text style={styles.earningsLabel}>{t('jobs.earnings.customerEstimate')}</Text>
                                        <Text style={styles.earningsValue}>${item.estimateLow!.toFixed(2)} – ${item.estimateHigh!.toFixed(2)}</Text>
                                    </View>
                                    <View style={styles.earningsRow}>
                                        <Text style={styles.earningsLabel}>{t('jobs.earnings.platformFee')}</Text>
                                        <Text style={[styles.earningsValue, { color: '#FF3B30' }]}>-${PLATFORM_FEE.toFixed(2)}</Text>
                                    </View>
                                    <View style={[styles.earningsRow, styles.earningsTotalRow]}>
                                        <Text style={styles.earningsTotalLabel}>{t('jobs.earnings.estimated')}</Text>
                                        <Text style={styles.earningsTotalValue}>${earningsLow.toFixed(2)} – ${earningsHigh.toFixed(2)}</Text>
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
                                            <Text style={styles.coStatus}>{co.status}</Text>
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
                                <Text style={styles.buttonText}>{t('jobs.acceptJob')}</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            {jobs.length === 0 ? (
                <Text style={[styles.empty, { color: textColor }]}>{t('jobs.noJobs')}</Text>
            ) : (
                <FlatList
                    data={jobs}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
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
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.coItemsList}>
                            {coItems.map((item, index) => (
                                <View key={index} style={styles.coItemInputRow}>
                                    <View style={styles.coItemHeader}>
                                        <Text style={styles.coItemIndex}>Item {index + 1}</Text>
                                        {index > 0 && (
                                            <TouchableOpacity onPress={() => removeCoItem(index)}>
                                                <Ionicons name="trash-outline" size={20} color="red" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <TextInput
                                        placeholder="Description"
                                        style={styles.input}
                                        value={item.description}
                                        onChangeText={(text) => updateCoItem(index, 'description', text)}
                                    />
                                    <View style={styles.row}>
                                        <TextInput
                                            placeholder="Qty"
                                            keyboardType="numeric"
                                            style={[styles.input, { flex: 1, marginRight: 8 }]}
                                            value={item.quantity.toString()}
                                            onChangeText={(text) => updateCoItem(index, 'quantity', parseInt(text) || 0)}
                                        />
                                        <TextInput
                                            placeholder="Price"
                                            keyboardType="numeric"
                                            style={[styles.input, { flex: 1 }]}
                                            value={item.unitPrice.toString()}
                                            onChangeText={(text) => updateCoItem(index, 'unitPrice', parseFloat(text) || 0)}
                                        />
                                    </View>
                                </View>
                            ))}
                            <TouchableOpacity style={styles.addItemButton} onPress={addCoItem}>
                                <Ionicons name="add" size={20} color="#007AFF" />
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
    container: { flex: 1, padding: 20 },
    card: { padding: 15, marginBottom: 15, borderRadius: 8, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    jobTitle: { fontSize: 18, fontWeight: 'bold', flex: 1 },
    acceptButton: { marginTop: 10, backgroundColor: '#34C759', padding: 10, borderRadius: 5, alignItems: 'center' },
    buttonText: { color: 'white', fontWeight: 'bold' },
    empty: { textAlign: 'center', marginTop: 50, fontSize: 16 },
    esBadge: {
        backgroundColor: '#FF9500',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        marginLeft: 8,
    },
    esBadgeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 11,
        textTransform: 'uppercase',
    },
    issueTagBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#E8F0FE',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 6,
    },
    issueTagText: {
        color: '#007AFF',
        fontWeight: '600',
        fontSize: 12,
    },
    videoIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        backgroundColor: '#E8F4FD',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    videoIndicatorText: {
        color: '#007AFF',
        fontWeight: '600',
        fontSize: 12,
    },
    contentSection: {
        marginTop: 10,
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        opacity: 0.7,
    },
    value: {
        fontSize: 14,
        fontWeight: '500',
    },
    description: {
        fontSize: 15,
        lineHeight: 20,
        marginTop: 4,
    },
    photoList: {
        marginTop: 12,
        marginBottom: 4,
    },
    jobPhoto: {
        width: 120,
        height: 120,
        borderRadius: 10,
        marginRight: 10,
        backgroundColor: '#f0f0f0',
    },

    // Full-screen modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalClose: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
    },
    modalImage: {
        width: SCREEN_WIDTH - 40,
        height: SCREEN_HEIGHT * 0.7,
    },
    videoModalContent: {
        alignItems: 'center',
        gap: 16,
    },
    videoModalText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    videoPlayButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        marginTop: 8,
    },
    videoPlayText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },

    // Technician earnings breakdown
    earningsBox: {
        marginTop: 12,
        backgroundColor: '#E8F8EE',
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#34C759',
    },
    earningsTitle: {
        fontWeight: '700',
        fontSize: 14,
        color: '#1B5E20',
        marginBottom: 8,
    },
    earningsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    earningsLabel: {
        fontSize: 13,
        color: '#555',
    },
    earningsValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    earningsTotalRow: {
        borderTopWidth: 1,
        borderTopColor: '#C8E6C9',
        paddingTop: 6,
        marginTop: 4,
        marginBottom: 0,
    },
    earningsTotalLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1B5E20',
    },
    earningsTotalValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#34C759',
    },

    // Change Order Styles
    changeOrdersSection: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    coCard: { backgroundColor: '#f9f9f9', padding: 10, borderRadius: 6, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#007AFF' },
    coHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    coStatus: { fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
    coTotal: { fontWeight: 'bold' },
    coItemText: { fontSize: 13, color: '#555' },
    coActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
    coButton: { flex: 1, padding: 8, borderRadius: 4, alignItems: 'center' },
    approveButton: { backgroundColor: '#34C759' },
    declineButton: { backgroundColor: '#FF3B30' },
    coButtonText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    createCoButton: { backgroundColor: '#007AFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, marginTop: 12, gap: 8 },

    // Modal Styles
    coModalContent: { backgroundColor: 'white', width: '90%', maxHeight: '80%', borderRadius: 12, overflow: 'hidden' },
    coModalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
    coModalTitle: { fontSize: 18, fontWeight: 'bold' },
    coItemsList: { padding: 16 },
    coItemInputRow: { marginBottom: 16, padding: 10, backgroundColor: '#f5f5f5', borderRadius: 8 },
    coItemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    coItemIndex: { fontWeight: '600', color: '#666' },
    input: { backgroundColor: 'white', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#ddd', marginBottom: 8 },
    row: { flexDirection: 'row' },
    addItemButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', padding: 10 },
    addItemText: { color: '#007AFF', fontWeight: '600' },
    coModalFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#eee' },
    submitCoButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' },

    // Invoice Styles
    invoiceContainer: { padding: 10 },
    invoiceTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    invoiceLabel: { fontSize: 14, color: '#555' },
    invoiceValue: { fontSize: 14, fontWeight: '500' },
    invoiceSubtotal: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8, marginTop: 8 },
    invoiceLabelBold: { fontSize: 16, fontWeight: 'bold' },
    invoiceValueBold: { fontSize: 16, fontWeight: 'bold' },
    tipSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    tipOption: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginHorizontal: 4, alignItems: 'center' },
    tipOptionSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
    tipText: { color: '#333', fontWeight: 'bold' },
    tipTextSelected: { color: 'white' },
    customTipInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, textAlign: 'right', marginBottom: 12, fontSize: 16, fontWeight: 'bold' },
    invoiceTotal: { marginTop: 16, paddingTop: 16, borderTopWidth: 2, borderTopColor: '#eee' },
    invoiceTotalLabel: { fontSize: 18, fontWeight: 'bold' },
    invoiceTotalValue: { fontSize: 22, fontWeight: 'bold', color: '#34C759' },
    payButton: { backgroundColor: '#34C759', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, elevation: 4 },
    payButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

    // Review Styles
    reviewContainer: { padding: 10 },
    reviewTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
    starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    tagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd' },
    tagChipSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
    tagText: { color: '#333' },
    tagTextSelected: { color: 'white', fontWeight: 'bold' },
    commentInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, height: 80, textAlignVertical: 'top', marginBottom: 16 },
    submitReviewButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' },

    // Receipt Styles
    receiptContainer: { padding: 16, alignItems: 'center' },
    receiptHeader: { alignItems: 'center', marginBottom: 16 },
    receiptTitle: { fontSize: 28, fontWeight: 'bold', marginTop: 8 },
    receiptTotal: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 16 },
    receiptRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 8 },
    receiptLabel: { color: '#666', fontSize: 16 },
    receiptValue: { fontWeight: '600', fontSize: 16 },
    reviewSummary: { marginTop: 24, width: '100%', backgroundColor: '#f9f9f9', padding: 16, borderRadius: 8 },
    reviewSummaryTitle: { fontWeight: 'bold', marginBottom: 8 },
    reviewComment: { fontStyle: 'italic', color: '#555', marginTop: 8 },
});
