import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useJobStore } from '../../src/store/useJobStore';
import { useThemeColor } from '../../src/hooks/useThemeColor';
import { t } from '../../src/i18n';
import { StatusPill, JobStatus } from '../../src/components/ui/StatusPill';

export default function JobHistoryScreen() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const jobs = useJobStore((s) => s.jobs);
    
    const backgroundColor = useThemeColor({}, 'background');
    const surfaceColor = useThemeColor({}, 'card');
    const textColor = useThemeColor({}, 'text');
    const subtextColor = useThemeColor({ light: '#666', dark: '#A0A0A0' }, 'text');
    const borderColor = useThemeColor({}, 'border');
    const isDark = useColorScheme() === 'dark';

    // Show completed and cancelled jobs only
    const pastJobs = useMemo(() => {
        return jobs
            .filter((j) => j.status === 'COMPLETED' || j.status === 'CANCELLED')
            .sort((a, b) => {
                const dateA = a.updatedAt || a.createdAt || new Date().toISOString();
                const dateB = b.updatedAt || b.createdAt || new Date().toISOString();
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            });
    }, [jobs]);

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="documents-outline" size={64} color={borderColor} />
            <Text style={[styles.emptyText, { color: subtextColor }]}>
                {t('history.empty') || 'No past jobs found.'}
            </Text>
        </View>
    );

    const renderItem = ({ item }: { item: any }) => {
        const dateStr = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A');
        
        return (
            <TouchableOpacity 
                style={[styles.jobCard, { backgroundColor: surfaceColor, borderColor }]}
                onPress={() => router.push(`/(tabs)/job-detail?id=${item.id}`)}
            >
                <View style={styles.cardHeader}>
                    <Text style={[styles.jobTrade, { color: textColor }]}>
                        {t(`home.map.${item.trade.toLowerCase()}`) || item.trade}
                    </Text>
                    <StatusPill status={item.status as JobStatus} />
                </View>

                <View style={styles.cardBody}>
                    <Ionicons name="location-outline" size={16} color={subtextColor} />
                    <Text style={[styles.jobAddress, { color: subtextColor }]} numberOfLines={1}>
                        {item.address}
                    </Text>
                </View>

                <View style={[styles.cardFooter, { borderTopColor: borderColor }]}>
                    <Text style={[styles.jobDate, { color: subtextColor }]}>
                        {dateStr}
                    </Text>
                    <Text style={[styles.jobPrice, { color: textColor }]}>
                        ${(item.finalAmount || item.estimate?.currentAmount || item.estimateLow || 0).toFixed(2)}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <View style={[styles.header, { borderBottomColor: borderColor }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: textColor }]}>
                    {t('history.title') || 'Job History'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={pastJobs}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
        flexGrow: 1,
    },
    jobCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        // Elevation for Android
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    jobTrade: {
        fontSize: 16,
        fontWeight: '600',
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    jobAddress: {
        fontSize: 14,
        flex: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
    },
    jobDate: {
        fontSize: 12,
    },
    jobPrice: {
        fontSize: 16,
        fontWeight: '700',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '50%',
    },
    emptyText: {
        fontSize: 16,
        marginTop: 12,
    },
});
