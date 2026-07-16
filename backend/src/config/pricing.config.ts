/**
 * pricing.config.ts — Central pricing configuration
 *
 * Adjust rates here without touching controller logic.
 */

export const BOOKING_FEE = 2.99; // dollars — 100% kept by platform
export const PLATFORM_COMMISSION_RATE = 0.12; // 12% of service fee
export const TECHNICIAN_PAYOUT_RATE = 1 - PLATFORM_COMMISSION_RATE; // 88%
export const PAYMENT_TIMING = 'on_completion' as const; // authorize at booking, capture on completion
export const STRIPE_AUTH_WINDOW_DAYS = 7; // Stripe authorization expiry

/**
 * Certification tiers — pricing multiplier and which trades each tier may serve.
 */
export const CERTIFICATION_LEVELS = {
    CERTIFIED: {
        label: 'Certified & Insured',
        priceMultiplier: 1.0,
        allowedTrades: [
            'ELECTRICAL', 'PLUMBING', 'HVAC', 'POOL', 'APPLIANCES',
        ],
    },
    NON_CERTIFIED: {
        label: 'Independent Pro',
        priceMultiplier: 0.75,
        allowedTrades: [
            'GENERAL_HANDYMAN', 'HOUSE_CLEANING', 'LANDSCAPING',
        ],
    },
} as const;

export type CertificationLevel = keyof typeof CERTIFICATION_LEVELS;

/**
 * Payment methods — cash jobs still owe 12% of the estimated
 * final payment to Fuerza.
 */
export const PAYMENT_METHODS = {
    IN_APP: { label: 'Pay in app', commissionRate: 0.12 },
    CASH: { label: 'Cash', commissionRate: 0.12 },
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

/**
 * Flat-rate estimates per trade (in dollars).
 */
export const FLAT_RATES = {
    PLUMBING: 140,
    ELECTRICAL: 165,
    HVAC: 200,
    POOL: 120,
    HOUSE_CLEANING: 150,
    GENERAL_HANDYMAN: 95,
} as const;

/**
 * Size-based pricing for House Cleaning (in dollars).
 */
export const CLEANING_SIZE_RATES = {
    SMALL: 125,
    MEDIUM: 175,
    LARGE: 275,
    XL: 325,
} as const;

export type CleaningSize = keyof typeof CLEANING_SIZE_RATES;
