import { create } from 'zustand';
import { socketService } from '../services/socket.service';

interface TechnicianLocation {
    techId: string;
    lat: number;
    lng: number;
    trade?: string;
}

type TradeFilter = 'PLUMBER' | 'ELECTRICIAN' | 'POOL' | 'CLEANING';

interface MapState {
    technicianLocations: Record<string, TechnicianLocation>;
    tradeFilters: Record<TradeFilter, boolean>;
    updateTechnicianLocation: (data: TechnicianLocation) => void;
    toggleTradeFilter: (trade: TradeFilter) => void;
    getFilteredLocations: () => TechnicianLocation[];
    initializeSocketListeners: () => void;
    cleanupSocketListeners: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
    technicianLocations: {},
    tradeFilters: {
        PLUMBER: true,
        ELECTRICIAN: true,
        POOL: true,
        CLEANING: true,
    },
    updateTechnicianLocation: (data) => {
        set((state) => ({
            technicianLocations: {
                ...state.technicianLocations,
                [data.techId]: data,
            },
        }));
    },
    toggleTradeFilter: (trade) => {
        set((state) => ({
            tradeFilters: {
                ...state.tradeFilters,
                [trade]: !state.tradeFilters[trade],
            },
        }));
    },
    getFilteredLocations: () => {
        const { technicianLocations, tradeFilters } = get();
        return Object.values(technicianLocations).filter((tech) => {
            if (!tech.trade) return true; // Show if trade unknown
            return tradeFilters[tech.trade as TradeFilter] ?? true;
        });
    },
    initializeSocketListeners: () => {
        socketService.on('technician:moved', (data: TechnicianLocation) => {
            get().updateTechnicianLocation(data);
        });
    },
    cleanupSocketListeners: () => {
        socketService.off('technician:moved');
    }
}));
