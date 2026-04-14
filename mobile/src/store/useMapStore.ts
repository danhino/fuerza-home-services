import { create } from 'zustand';
import { socketService } from '../services/socket.service';
import api from '../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TradeFilter = 'ALL' | 'PLUMBER' | 'ELECTRICIAN' | 'HVAC' | 'POOL' | 'HOUSE_CLEANING' | 'GENERAL_HANDYMAN';

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
    fetchOnlineTechnicians: () => Promise<void>;
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

    fetchOnlineTechnicians: async () => {
        try {
            const res = await api.get('/technicians/online');
            const techs: TechnicianLocation[] = (res.data.technicians || []).map((t: any) => ({
                techId: t.id,
                name: t.name,
                lat: t.lat,
                lng: t.lng,
                trade: t.trade,
                rating: t.rating,
                isOnline: true,
            }));
            const map: Record<string, TechnicianLocation> = {};
            techs.forEach((t) => { map[t.techId] = t; });
            set({ technicianLocations: map });
        } catch (error: any) {
            // Silently ignore 401 — user may be logged out
            if (error?.response?.status !== 401) {
                console.error('[MapStore] Failed to fetch online technicians:', error);
            }
        }
    },

    initializeSocketListeners: () => {
        // New events from the updated backend
        socketService.on('technician_location', (data: { id: string; lat: number; lng: number; trade: string }) => {
            const existing = get().technicianLocations[data.id];
            get().updateTechnicianLocation({
                techId: data.id,
                name: existing?.name ?? '',
                lat: data.lat,
                lng: data.lng,
                trade: data.trade ?? existing?.trade ?? 'PLUMBER',
                rating: existing?.rating ?? 5.0,
                isOnline: true,
            });
        });

        socketService.on('technician_came_online', (data: { id: string; trade: string; name: string; rating: number; isOnline: boolean }) => {
            get().updateTechnicianLocation({
                techId: data.id,
                name: data.name,
                lat: 0,
                lng: 0,
                trade: data.trade,
                rating: data.rating,
                isOnline: true,
            });
        });

        socketService.on('technician_went_offline', (data: { id: string }) => {
            get().removeTechnician(data.id);
        });

        // Legacy events (backward compatibility)
        socketService.on('technician:moved', (data: TechnicianLocation) => {
            get().updateTechnicianLocation(data);
        });
        socketService.on('technician:offline', (data: { techId: string }) => {
            get().removeTechnician(data.techId);
        });
    },

    cleanupSocketListeners: () => {
        socketService.off('technician_location');
        socketService.off('technician_came_online');
        socketService.off('technician_went_offline');
        socketService.off('technician:moved');
        socketService.off('technician:offline');
    },
}));
