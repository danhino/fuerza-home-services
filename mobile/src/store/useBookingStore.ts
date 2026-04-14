/**
 * useBookingStore — State for the new 5-step service intake wizard.
 *
 * Passes data between:
 *   CategorySelectScreen → ServiceSelectScreen → ServiceQuestionsScreen
 *   → PriceEstimateScreen → BookingConfirmedScreen
 */

import { create } from 'zustand';
import { EstimateResult } from '../utils/pricingEngine';

interface BookingState {
    /** Selected service id (e.g. 'replace_outlet') */
    serviceId: string | null;
    /** Map of questionId → selected answer (choice questions) or URI (photo questions) */
    answers: Record<string, string>;
    /** Computed price result from pricingEngine */
    estimate: EstimateResult | null;
    /** Final booked job id (set after successful API call) */
    jobId: string | null;

    setServiceId: (id: string) => void;
    setAnswer: (questionId: string, value: string) => void;
    setEstimate: (result: EstimateResult) => void;
    setJobId: (id: string) => void;
    reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
    serviceId: null,
    answers: {},
    estimate: null,
    jobId: null,

    setServiceId: (id) => set({ serviceId: id, answers: {}, estimate: null, jobId: null }),
    setAnswer: (questionId, value) =>
        set((state) => ({ answers: { ...state.answers, [questionId]: value } })),
    setEstimate: (result) => set({ estimate: result }),
    setJobId: (id) => set({ jobId: id }),
    reset: () => set({ serviceId: null, answers: {}, estimate: null, jobId: null }),
}));
