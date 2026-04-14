/**
 * pricing.types.ts — Shared pricing types
 */

export interface PricingBreakdown {
    /** The base service fee for the trade (dollars) */
    serviceFee: number;
    /** Fixed booking fee kept by platform (dollars) */
    bookingFee: number;
    /** Total customer pays: serviceFee + bookingFee (dollars) */
    total: number;
    /** Platform commission: bookingFee + 12% of serviceFee (dollars) */
    platformCommission: number;
    /** Technician payout: 88% of serviceFee (dollars) */
    technicianPayout: number;
}

export interface FlatRateEstimate {
    trade: string;
    low: number;
    high: number;
    midpoint: number;
    pricing: PricingBreakdown;
}
