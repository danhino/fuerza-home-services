/**
 * pricing.config.ts — Central pricing configuration
 *
 * Adjust rates here without touching controller logic.
 */

export const BOOKING_FEE = 2.99; // dollars — 100% kept by platform
export const PLATFORM_COMMISSION_RATE = 0.12; // 12% of service fee
export const TECHNICIAN_PAYOUT_RATE = 1 - PLATFORM_COMMISSION_RATE; // 88%

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
