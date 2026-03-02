import { create } from 'zustand';
import { socketService } from '../services/socket.service';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TradeFilter = 'ALL' | 'PLUMBER' | 'ELECTRICIAN' | 'HVAC' | 'POOL';

export interface TechnicianLocation {
    techId: string;
    name: string;
    lat: number;
    lng: number;
    trade: string;
    rating: number;
    isOnline: boolean;
}

interface MapState {
    technicianLocations: Record<string, TechnicianLocation>;
    selectedTrade: TradeFilter;
    setSelectedTrade: (trade: TradeFilter) => void;
    updateTechnicianLocation: (data: TechnicianLocation) => void;
    removeTechnician: (techId: string) => void;
    getFilteredLocations: () => TechnicianLocation[];
    getOnlineCount: () => number;
    initializeSocketListeners: () => void;
    cleanupSocketListeners: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useMapStore = create<MapState>((set, get) => ({
    technicianLocations: {},
    selectedTrade: 'ALL',

    setSelectedTrade: (trade) => set({ selectedTrade: trade }),

    updateTechnicianLocation: (data) => {
        set((state) => ({
            technicianLocations: {
                ...state.technicianLocations,
                [data.techId]: data,
            },
        }));
    },

    removeTechnician: (techId) => {
        set((state) => {
            const { [techId]: _, ...rest } = state.technicianLocations;
            return { technicianLocations: rest };
        });
    },

    getFilteredLocations: () => {
        const { technicianLocations, selectedTrade } = get();
        const all = Object.values(technicianLocations).filter((t) => t.isOnline);
        if (selectedTrade === 'ALL') return all;
        return all.filter((t) => t.trade === selectedTrade);
    },

    getOnlineCount: () => {
        const { technicianLocations } = get();
        return Object.values(technicianLocations).filter((t) => t.isOnline).length;
    },

    initializeSocketListeners: () => {
        socketService.on('technician:moved', (data: TechnicianLocation) => {
            get().updateTechnicianLocation(data);
        });
        socketService.on('technician:offline', (data: { techId: string }) => {
            get().removeTechnician(data.techId);
        });
    },

    cleanupSocketListeners: () => {
        socketService.off('technician:moved');
        socketService.off('technician:offline');
    },
}));
