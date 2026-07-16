/**
 * pricing.service.ts — Single source of truth for all pricing calculations
 *
 * Import this wherever pricing is needed instead of duplicating constants.
 */

import {
    BOOKING_FEE,
    PLATFORM_COMMISSION_RATE,
    PAYMENT_TIMING,
    CERTIFICATION_LEVELS,
    FLAT_RATES,
    CLEANING_SIZE_RATES,
    type CertificationLevel,
    type CleaningSize,
} from '../config/pricing.config';
import type { PricingBreakdown } from '../types/pricing.types';

/**
 * Calculate full pricing breakdown from a base service fee.
 * Non-certified technicians price at 0.75× the base fee.
 *
 * Example: $100 service fee (CERTIFIED)
 *   → total: $102.99
 *   → platformCommission: $12.00 (12% of service fee)
 *   → technicianPayout: $88.00
 */
export function calculatePricing(
    baseServiceFee: number,
    certificationLevel: CertificationLevel = 'CERTIFIED'
): PricingBreakdown {
    const multiplier = CERTIFICATION_LEVELS[certificationLevel]?.priceMultiplier ?? 1.0;
    const serviceFee = Math.round(baseServiceFee * multiplier * 100) / 100;
    const bookingFee = BOOKING_FEE;
    const total = Math.round((serviceFee + bookingFee) * 100) / 100;
    const platformCommission = Math.round(serviceFee * PLATFORM_COMMISSION_RATE * 100) / 100;
    const technicianPayout = Math.round((serviceFee - platformCommission) * 100) / 100;

    return {
        serviceFee,
        bookingFee,
        total,
        platformCommission,
        technicianPayout,
        paymentTiming: PAYMENT_TIMING,
    };
}

/**
 * Get a flat-rate estimate for a given trade, with optional
 * House Cleaning size-based override.
 */
export function getEstimateForTrade(
    trade: string,
    cleaningSize?: string,
    certificationLevel: CertificationLevel = 'CERTIFIED'
): PricingBreakdown {
    // House Cleaning size-based pricing
    if (trade === 'HOUSE_CLEANING' && cleaningSize && cleaningSize in CLEANING_SIZE_RATES) {
        const rate = CLEANING_SIZE_RATES[cleaningSize as CleaningSize];
        return calculatePricing(rate, certificationLevel);
    }

    const rate = FLAT_RATES[trade as keyof typeof FLAT_RATES] ?? 140;
    return calculatePricing(rate, certificationLevel);
}

/**
 * @deprecated Use getEstimateForTrade() instead.
 * Kept for backward compatibility during migration.
 */
export function getTradeEstimate(trade: string) {
    const pricing = getEstimateForTrade(trade);
    return {
        trade,
        low: pricing.serviceFee,
        high: pricing.serviceFee,
        midpoint: pricing.serviceFee,
        pricing,
    };
}
