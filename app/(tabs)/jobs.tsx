import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, Image } from 'react-native';
import api from '../../src/services/api';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useJobStore, Job } from '../../src/store/useJobStore';
import { useThemeColor } from '../../src/hooks/useThemeColor';
import { t, useLanguageStore } from '../../src/i18n';

export default function JobsScreen() {
    const { user } = useAuthStore();
    const { jobs, fetchJobs, initializeSocketListeners, cleanupSocketListeners } = useJobStore();
    const [refreshing, setRefreshing] = useState(false);
    // Force re-render on language change
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

    const onRefresh = async () => {
        setRefreshing(true);
        if (user) await fetchJobs(user.role);
        setRefreshing(false);
    };

    const acceptJob = async (jobId: string) => {
        try {
            await api.post('/jobs/accept', { jobId });
            Alert.alert(t('jobs.success'), t('jobs.accepted'));
            if (user) fetchJobs(user.role);
        } catch (e) {
            Alert.alert(t('home.error'), t('jobs.acceptFailed'));
        }
    };

    const renderItem = ({ item }: { item: Job }) => {
        const isSpanishCustomer =
            user?.role === 'TECHNICIAN' &&
            item.customer?.user?.preferredLanguage === 'es';

        const isTechnician = user?.role === 'TECHNICIAN';
        const isRequested = item.status === 'REQUESTED';

        return (
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.jobTitle, { color: textColor }]}>{item.trade} - {item.status}</Text>
                    {isSpanishCustomer && (
                        <View style={styles.esBadge}>
                            <Text style={styles.esBadgeText}>{t('jobs.customerLanguage.badgeSpanish')}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.contentSection}>
                    <View style={styles.infoRow}>
                        <Text style={[styles.label, { color: textColor }]}>{t('jobs.customer')}:</Text>
                        <Text style={[styles.value, { color: textColor }]}>{item.customer?.user?.name}</Text>
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
                                <Image source={{ uri: photoUri }} style={styles.jobPhoto} />
                            )}
                            style={styles.photoList}
                        />
                    )}
                </View>

                {isTechnician && isRequested && (
                    <TouchableOpacity style={styles.acceptButton} onPress={() => acceptJob(item.id)}>
                        <Text style={styles.buttonText}>{t('jobs.acceptJob')}</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor }]}>
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
        </View>
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
});
