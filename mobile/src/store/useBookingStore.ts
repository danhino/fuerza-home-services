/**
 * useBookingStore — State for the new 5-step service intake wizard.
 *
 * Passes data between:
 *   CategorySelectScreen → ServiceSelectScreen → ServiceQuestionsScreen
 *   → PriceEstimateScreen → BookingConfirmedScreen
 */

import { create } from 'zustand';
import { EstimateResult } from '../utils/pricingEngine';

export type BookingCertificationLevel = 'CERTIFIED' | 'NON_CERTIFIED';
export type BookingPaymentMethod = 'IN_APP' | 'CASH';

interface BookingState {
    /** Selected service id (e.g. 'replace_outlet') */
    serviceId: string | null;
    /** Map of questionId → selected answer (choice questions) or URI (photo questions) */
    answers: Record<string, string>;
    /** Computed price result from pricingEngine */
    estimate: EstimateResult | null;
    /** Final booked job id (set after successful API call) */
    jobId: string | null;
    /** Whether the liability disclaimer has been accepted this booking */
    disclaimerAccepted: boolean;
    /** ISO timestamp of disclaimer acceptance */
    disclaimerAcceptedAt: string | null;
    /** Certification tier the customer accepted the disclaimer for */
    certificationLevelSelected: BookingCertificationLevel | null;
    /** How the customer will pay */
    paymentMethod: BookingPaymentMethod;
    /** Technician chosen from the map (direct booking), if any */
    selectedTechnicianId: string | null;
    /** Service id from a previous job — used by "Try Again" / "Book Again" */
    lastServiceId: string | null;

    setServiceId: (id: string) => void;
    setAnswer: (questionId: string, value: string) => void;
    setEstimate: (result: EstimateResult) => void;
    setJobId: (id: string) => void;
    acceptDisclaimer: (level: BookingCertificationLevel) => void;
    setPaymentMethod: (method: BookingPaymentMethod) => void;
    setSelectedTechnician: (id: string | null) => void;
    setLastServiceId: (id: string | null) => void;
    reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
    serviceId: null,
    answers: {},
    estimate: null,
    jobId: null,
    disclaimerAccepted: false,
    disclaimerAcceptedAt: null,
    certificationLevelSelected: null,
    paymentMethod: 'IN_APP',
    selectedTechnicianId: null,
    lastServiceId: null,

    setServiceId: (id) => set({ serviceId: id, answers: {}, estimate: null, jobId: null }),
    setAnswer: (questionId, value) =>
        set((state) => ({ answers: { ...state.answers, [questionId]: value } })),
    setEstimate: (result) => set({ estimate: result }),
    setJobId: (id) => set({ jobId: id }),
    acceptDisclaimer: (level) =>
        set({
            disclaimerAccepted: true,
            disclaimerAcceptedAt: new Date().toISOString(),
            certificationLevelSelected: level,
        }),
    setPaymentMethod: (method) => set({ paymentMethod: method }),
    setSelectedTechnician: (id) => set({ selectedTechnicianId: id }),
    setLastServiceId: (id) => set({ lastServiceId: id }),
    reset: () =>
        set({
            serviceId: null,
            answers: {},
            estimate: null,
            jobId: null,
            disclaimerAccepted: false,
            disclaimerAcceptedAt: null,
            certificationLevelSelected: null,
            paymentMethod: 'IN_APP',
            selectedTechnicianId: null,
            lastServiceId: null,
        }),
}));
