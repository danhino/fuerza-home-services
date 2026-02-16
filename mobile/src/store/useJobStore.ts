
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
    customer?: { user: { name: string; preferredLanguage?: string } };
    technician?: { user: { name: string } };
    estimate?: { currentAmount: number };
    // Included in socket payloads
    customerPreferredLanguage?: string;
    customerName?: string;
}

interface JobState {
    jobs: Job[];
    loading: boolean;
    refreshing: boolean;
    fetchJobs: (role: string) => Promise<void>;
    initializeSocketListeners: () => void;
    cleanupSocketListeners: () => void;
    addJob: (job: Job) => void;
    updateJobStatus: (jobId: string, status: string) => void;
}

export const useJobStore = create<JobState>((set, get) => ({
    jobs: [],
    loading: false,
    refreshing: false,
    fetchJobs: async (role: string) => {
        set({ loading: true, refreshing: true });
        try {
            const res = await api.get(role === 'TECHNICIAN' ? '/jobs/open' : '/jobs');
            set({ jobs: res.data });
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
    initializeSocketListeners: () => {
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
    },
    cleanupSocketListeners: () => {
        socketService.off('job:new');
        socketService.off('job:status');
        socketService.off('job:matched');
    }
}));
