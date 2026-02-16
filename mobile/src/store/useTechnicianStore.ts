import { create } from 'zustand';
import api from '../services/api';

interface TechnicianState {
    isOnline: boolean;
    updateStatus: (isOnline: boolean) => Promise<void>;
}

export const useTechnicianStore = create<TechnicianState>((set) => ({
    isOnline: false,
    updateStatus: async (isOnline) => {
        try {
            await api.put('/users/technician/status', { isOnline });
            set({ isOnline });
        } catch (error) {
            console.error('Failed to update status', error);
            // Optionally handle error state or revert
        }
    },
}));
