/**
 * pricing.service.ts — Single source of truth for all pricing calculations
 *
 * Import this wherever pricing is needed instead of duplicating constants.
 */

import {
    BOOKING_FEE,
    PLATFORM_COMMISSION_RATE,
    TECHNICIAN_PAYOUT_RATE,
    FLAT_RATES,
    CLEANING_SIZE_RATES,
    type CleaningSize,
} from '../config/pricing.config';
import type { PricingBreakdown } from '../types/pricing.types';

/**
 * Calculate full pricing breakdown from a base service fee.
 *
 * Example: $100 service fee
 *   → total: $102.99
 *   → platformCommission: $14.99 ($2.99 + $12.00)
 *   → technicianPayout: $88.00
 */
export function calculatePricing(baseServiceFee: number): PricingBreakdown {
    const serviceFee = Math.round(baseServiceFee * 100) / 100;
    const bookingFee = BOOKING_FEE;
    const total = Math.round((serviceFee + bookingFee) * 100) / 100;
    const commissionOnService = Math.round(serviceFee * PLATFORM_COMMISSION_RATE * 100) / 100;
    const platformCommission = Math.round((bookingFee + commissionOnService) * 100) / 100;
    const technicianPayout = Math.round(serviceFee * TECHNICIAN_PAYOUT_RATE * 100) / 100;

    return {
        serviceFee,
        bookingFee,
        total,
        platformCommission,
        technicianPayout,
    };
}

/**
 * Get a flat-rate estimate for a given trade, with optional
 * House Cleaning size-based override.
 */
export function getEstimateForTrade(
    trade: string,
    cleaningSize?: string
): PricingBreakdown {
    // House Cleaning size-based pricing
    if (trade === 'HOUSE_CLEANING' && cleaningSize && cleaningSize in CLEANING_SIZE_RATES) {
        const rate = CLEANING_SIZE_RATES[cleaningSize as CleaningSize];
        return calculatePricing(rate);
    }

    const rate = FLAT_RATES[trade as keyof typeof FLAT_RATES] ?? 140;
    return calculatePricing(rate);
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
