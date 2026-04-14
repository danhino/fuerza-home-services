import { create } from 'zustand';

// Temporary store to pass request data from the Request form to the Triage screen
// without going through URL params (base64 media is too large for route params).

interface PendingRequest {
    trade: string;
    description: string;
    address: string;
    lat: number;
    lng: number;
    issueTag?: string;
    photoData: string[];
    videoData?: string;
}

export interface TriageResult {
    likelyIssues: { name: string; confidence: number }[];
    severity: 'URGENT_SAMEDAY' | 'SCHEDULED';
    timeEstimateLowMins: number;
    timeEstimateHighMins: number;
    priceLow: number;
    priceHigh: number;
}

interface TriageStore {
    pending: PendingRequest | null;
    triageResult: TriageResult | null;
    setPending: (data: PendingRequest) => void;
    setTriageResult: (data: TriageResult) => void;
    clear: () => void;
}

export const useTriageStore = create<TriageStore>((set) => ({
    pending: null,
    triageResult: null,
    setPending: (data) => set({ pending: data }),
    setTriageResult: (data) => set({ triageResult: data }),
    clear: () => set({ pending: null, triageResult: null }),
}));
