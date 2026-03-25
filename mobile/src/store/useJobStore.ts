
import { create } from 'zustand';
import { Alert } from 'react-native';
import api from '../services/api';
import { socketService } from '../services/socket.service';
import { t } from '../i18n';

export interface Job {
    id: string;
    description: string;
    status: string;
    trade: string;
    photos?: string[];
    address?: string;
    issueTag?: string;
    videoUrl?: string;
    customer?: { user: { name: string; firstName?: string; lastName?: string; preferredLanguage?: string } };
    technician?: { user: { name: string; firstName?: string; lastName?: string } };
    estimate?: { currentAmount: number };
    // Included in socket payloads
    paymentProvider?: 'STRIPE' | 'SQUARE' | 'NONE';
    holdRef?: string;
    holdAmount?: number;
    paymentHoldStatus?: 'NONE' | 'PENDING' | 'HOLD_PENDING' | 'HELD' | 'CAPTURED' | 'PAID' | 'FAILED';
    customerPreferredLanguage?: string;
    customerName?: string;
    // Estimate range for technician earnings display
    estimateLow?: number;
    estimateHigh?: number;
    changeOrders?: ChangeOrder[];
    finalAmount?: number;
    tipAmount?: number;
    feeBreakdown?: any;
    receiptPdfUrl?: string;
    receiptEmailedAt?: string;
    warrantyDays?: number;
    review?: Review;
}

export interface Review {
    id: string;
    jobId: string;
    rating: number;
    tags: string[];
    comment?: string;
    createdAt: string;
}

export interface ChangeOrder {
    id: string;
    jobId: string;
    status: 'PENDING' | 'APPROVED' | 'DECLINED';
    totalAmount: number;
    items: ChangeOrderItem[];
    createdAt: string;
}

export interface ChangeOrderItem {
    id: string;
    type: 'PARTS' | 'LABOR';
    description: string;
    quantity: number;
    unitPrice: number;
}

interface JobState {
    jobs: Job[];
    loading: boolean;
    refreshing: boolean;
    // Earnings
    todayEarnings: number;
    weekEarnings: number;
    pendingPayout: number;
    fetchJobs: (role: string) => Promise<void>;
    fetchEarnings: () => Promise<void>;
    initializeSocketListeners: () => void;
    cleanupSocketListeners: () => void;
    addJob: (job: Job) => void;
    updateJobStatus: (jobId: string, status: string) => void;
    addChangeOrderToJob: (jobId: string, changeOrder: ChangeOrder) => void;
    updateChangeOrderInJob: (jobId: string, changeOrder: ChangeOrder) => void;
    capturePayment: (jobId: string, tipAmountCents: number) => Promise<void>;
    submitReview: (jobId: string, rating: number, tags: string[], comment: string) => Promise<void>;
}

export const useJobStore = create<JobState>((set, get) => ({
    jobs: [],
    loading: false,
    refreshing: false,
    todayEarnings: 0,
    weekEarnings: 0,
    pendingPayout: 0,
    fetchEarnings: async () => {
        try {
            const res = await api.get('/jobs/earnings/summary');
            set({
                todayEarnings: res.data.todayEarnings || 0,
                weekEarnings: res.data.weekEarnings || 0,
                pendingPayout: res.data.pendingPayout || 0,
            });
        } catch (error) {
            console.error('Failed to fetch earnings', error);
        }
    },
    fetchJobs: async (role: string) => {
        set({ loading: true, refreshing: true });
        try {
            if (role === 'TECHNICIAN') {
                // Fetch both open jobs (for accepting) and tech's own assigned jobs
                const [openRes, myRes] = await Promise.all([
                    api.get('/jobs/open'),
                    api.get('/jobs'),
                ]);
                // Merge and deduplicate by id
                const merged = new Map<string, Job>();
                for (const j of [...myRes.data, ...openRes.data]) {
                    merged.set(j.id, j);
                }
                set({ jobs: Array.from(merged.values()) });
            } else {
                const res = await api.get('/jobs');
                set({ jobs: res.data });
            }
        } catch (error) {
            console.error('Failed to fetch jobs', error);
        } finally {
            set({ loading: false, refreshing: false });
        }
    },
    addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
    updateJobStatus: (jobId, status) => set((state) => ({
        jobs: state.jobs.map((j) => (j.id === jobId ? { ...j, status } : j))
    })),
    addChangeOrderToJob: (jobId, changeOrder) => set((state) => ({
        jobs: state.jobs.map((j) => {
            if (j.id !== jobId) return j;
            const currentOrders = j.changeOrders || [];
            return { ...j, changeOrders: [...currentOrders, changeOrder] };
        })
    })),
    updateChangeOrderInJob: (jobId, changeOrder) => set((state) => ({
        jobs: state.jobs.map((j) => {
            if (j.id !== jobId) return j;
            return {
                ...j,
                changeOrders: (j.changeOrders || []).map((co) =>
                    co.id === changeOrder.id ? changeOrder : co
                )
            };
        })
    })),
    capturePayment: async (jobId: string, tipAmountCents: number) => {
        try {
            const response = await api.post(`/jobs/${jobId}/payments/capture`, { tipAmountCents });
            const updatedJob = response.data;
            set((state) => ({
                jobs: state.jobs.map((j) => (j.id === jobId ? updatedJob : j)),
            }));
        } catch (error) {
            console.error('Capture payment failed', error);
            throw error;
        }
    },
    submitReview: async (jobId, rating, tags, comment) => {
        try {
            const res = await api.post(`/jobs/${jobId}/reviews`, { rating, tags, comment });
            const review = res.data;
            set((state) => ({
                jobs: state.jobs.map((j) => j.id === jobId ? { ...j, review } : j)
            }));
        } catch (error) {
            console.error('Submit review failed', error);
            throw error;
        }
    },
    initializeSocketListeners: () => {
        // Clean up any existing listeners first to prevent duplicates
        get().cleanupSocketListeners();

        socketService.on('job:new', (job: Job) => {
            get().addJob(job);

            // If the customer prefers Spanish, alert the technician
            const lang = job.customerPreferredLanguage || job.customer?.user?.preferredLanguage;
            if (lang === 'es') {
                Alert.alert(
                    t('jobs.customerLanguage.spanishCustomerTitle'),
                    t('jobs.customerLanguage.spanishCustomerBody')
                );
            }
        });

        socketService.on('job:status', ({ jobId, status }: { jobId: string, status: string }) => {
            get().updateJobStatus(jobId, status);
        });

        socketService.on('job:matched', ({ job }: { job: Job }) => {
            get().updateJobStatus(job.id, job.status);
        });

        socketService.on('job:changeOrder', ({ jobId, changeOrder }: { jobId: string, changeOrder: ChangeOrder }) => {
            get().addChangeOrderToJob(jobId, changeOrder);
            Alert.alert(t('jobs.changeOrder.newTitle'), t('jobs.changeOrder.newBody'));
        });

        socketService.on('job:changeOrderUpdate', ({ jobId, changeOrder, status }: { jobId: string, changeOrder: ChangeOrder, status: string }) => {
            get().updateChangeOrderInJob(jobId, changeOrder);
            Alert.alert(t('jobs.changeOrder.updateTitle'), t('jobs.changeOrder.updateBody', { status }));
        });
    },
    cleanupSocketListeners: () => {
        socketService.off('job:new');
        socketService.off('job:status');
        socketService.off('job:matched');
        socketService.off('job:changeOrder');
        socketService.off('job:changeOrderUpdate');
    }
}));
