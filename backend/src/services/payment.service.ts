import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover',
});

// ── Types ────────────────────────────────────────────────────────────────────

interface HoldResult {
    success: boolean;
    holdRef?: string;
    error?: string;
}

interface PaymentIntentResult {
    success: boolean;
    clientSecret?: string;
    paymentIntentId?: string;
    error?: string;
}

// ── Stripe Customer ──────────────────────────────────────────────────────────

/**
 * Find or create a Stripe Customer for this user.
 * Persists `stripeCustomerId` on the User record.
 */
export async function getOrCreateStripeCustomer(
    userId: string,
    email?: string | null,
    name?: string
): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user?.stripeCustomerId) {
        return user.stripeCustomerId;
    }

    const customer = await stripe.customers.create({
        email: email || undefined,
        name: name || undefined,
        metadata: { fuerzaUserId: userId },
    });

    await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
    });

    return customer.id;
}

// ── PaymentIntent (for PaymentSheet) ─────────────────────────────────────────

/**
 * Create a PaymentIntent for the mobile PaymentSheet.
 * Does NOT confirm — the PaymentSheet handles card entry + confirmation.
 */
export async function createPaymentIntent(
    amountCents: number,
    stripeCustomerId: string,
    currency = 'usd'
): Promise<PaymentIntentResult> {
    if (!process.env.STRIPE_SECRET_KEY) {
        return { success: false, error: 'Stripe is not configured' };
    }

    if (amountCents < 50) {
        return { success: false, error: 'Amount too low (minimum 50 cents)' };
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountCents,
            currency,
            customer: stripeCustomerId,
            automatic_payment_methods: { enabled: true },
            metadata: { source: 'fuerza_booking' },
        });

        return {
            success: true,
            clientSecret: paymentIntent.client_secret!,
            paymentIntentId: paymentIntent.id,
        };
    } catch (err: any) {
        console.error('[PaymentService] createPaymentIntent failed:', err.message);
        return { success: false, error: err.message };
    }
}

// ── Ephemeral Key (for PaymentSheet customer context) ────────────────────────

export async function createEphemeralKey(stripeCustomerId: string): Promise<string | null> {
    try {
        const key = await stripe.ephemeralKeys.create(
            { customer: stripeCustomerId },
            { apiVersion: '2026-01-28.clover' }
        );
        return key.secret || null;
    } catch (err: any) {
        console.error('[PaymentService] ephemeralKey failed:', err.message);
        return null;
    }
}

// ── Stripe Connect Express ───────────────────────────────────────────────────

/**
 * Create a Connect Express account for a technician.
 * Persists `stripeConnectAccountId` on the TechnicianProfile.
 */
export async function createConnectAccount(
    userId: string,
    email?: string | null
): Promise<{ accountId: string } | { error: string }> {
    try {
        // Check if technician already has a Connect account
        const profile = await prisma.technicianProfile.findUnique({ where: { userId } });
        if (profile?.stripeConnectAccountId) {
            return { accountId: profile.stripeConnectAccountId };
        }

        const account = await stripe.accounts.create({
            type: 'express',
            email: email || undefined,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            metadata: { fuerzaUserId: userId },
        });

        await prisma.technicianProfile.upsert({
            where: { userId },
            update: { stripeConnectAccountId: account.id },
            create: {
                userId,
                stripeConnectAccountId: account.id,
            },
        });

        return { accountId: account.id };
    } catch (err: any) {
        console.error('[PaymentService] createConnectAccount failed:', err.message);
        return { error: err.message };
    }
}

/**
 * Generate an account link URL for Stripe Connect onboarding.
 */
export async function createAccountLink(
    accountId: string,
    returnUrl: string,
    refreshUrl: string
): Promise<{ url?: string; error?: string }> {
    try {
        const link = await stripe.accountLinks.create({
            account: accountId,
            type: 'account_onboarding',
            return_url: returnUrl,
            refresh_url: refreshUrl,
        });
        return { url: link.url };
    } catch (err: any) {
        console.error('[PaymentService] createAccountLink failed:', err.message);
        return { error: err.message };
    }
}

/**
 * Check if a Connect account is fully set up (charges_enabled).
 */
export async function getConnectStatus(accountId: string): Promise<{
    isSetup: boolean;
    requirements: string[];
}> {
    try {
        const account = await stripe.accounts.retrieve(accountId);
        return {
            isSetup: account.charges_enabled ?? false,
            requirements: account.requirements?.currently_due || [],
        };
    } catch (err: any) {
        console.error('[PaymentService] getConnectStatus failed:', err.message);
        return { isSetup: false, requirements: [] };
    }
}

/**
 * Transfer technician's portion (88%) to their Connect account.
 * Commission: 12% of total.
 */
export async function createPayout(jobId: string): Promise<{
    success: boolean;
    transferId?: string;
    payoutAmount?: number;
    error?: string;
}> {
    try {
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: { technician: true },
        });

        if (!job) return { success: false, error: 'Job not found' };
        if (!job.technician?.stripeConnectAccountId) {
            return { success: false, error: 'Technician has no Connect account' };
        }
        if (!job.finalAmount || job.finalAmount <= 0) {
            return { success: false, error: 'No final amount set on job' };
        }

        // 88% of total goes to technician (12% commission)
        const technicianAmountCents = Math.round(job.finalAmount * 0.88);

        const transfer = await stripe.transfers.create({
            amount: technicianAmountCents,
            currency: 'usd',
            destination: job.technician.stripeConnectAccountId,
            metadata: { jobId, fuerzaTechnicianId: job.technicianId || '' },
        });

        // Update job with payout info
        await prisma.job.update({
            where: { id: jobId },
            data: {
                payoutStatus: 'PAID',
                payoutAmount: technicianAmountCents,
                transferId: transfer.id,
            },
        });

        return {
            success: true,
            transferId: transfer.id,
            payoutAmount: technicianAmountCents,
        };
    } catch (err: any) {
        console.error('[PaymentService] createPayout failed:', err.message);

        // Mark as failed
        await prisma.job.update({
            where: { id: jobId },
            data: { payoutStatus: 'FAILED' },
        }).catch(() => { });

        return { success: false, error: err.message };
    }
}

/**
 * Get payout/transfer history for a technician.
 */
export async function getPayoutHistory(userId: string) {
    return prisma.job.findMany({
        where: {
            technicianId: userId,
            payoutStatus: { not: null },
        },
        select: {
            id: true,
            trade: true,
            finalAmount: true,
            payoutAmount: true,
            payoutStatus: true,
            transferId: true,
            updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
    });
}

// ── Hold (manual capture) — existing functionality ───────────────────────────

/**
 * Create a payment hold (PaymentIntent with manual capture).
 * The funds are authorized but NOT captured until the job is completed.
 */
export async function createHold(amountCents: number, currency = 'usd'): Promise<HoldResult> {
    if (!process.env.STRIPE_SECRET_KEY) {
        return { success: false, error: 'Stripe is not configured' };
    }

    if (amountCents < 50) {
        return { success: false, error: 'Amount too low for a hold (minimum 50 cents)' };
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountCents,
            currency,
            capture_method: 'manual',
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never',
            },
            confirm: true,
            payment_method: 'pm_card_visa',
        });

        const held = paymentIntent.status === 'requires_capture';

        return {
            success: held,
            holdRef: paymentIntent.id,
            error: held ? undefined : `Unexpected status: ${paymentIntent.status}`,
        };
    } catch (err: any) {
        console.error('[PaymentService] Hold failed:', err.message);
        return {
            success: false,
            error: err.message || 'Failed to create payment hold',
        };
    }
}

/**
 * Cancel a previously-created hold (void the authorization).
 */
export async function cancelHold(holdRef: string): Promise<void> {
    try {
        await stripe.paymentIntents.cancel(holdRef);
    } catch (err: any) {
        console.error('[PaymentService] Cancel hold failed:', err.message);
    }
}

/**
 * Capture a held payment (charge the customer).
 */
export async function captureHold(holdRef: string, amountCents?: number): Promise<boolean> {
    try {
        const captured = await stripe.paymentIntents.capture(holdRef, amountCents ? { amount_to_capture: amountCents } : undefined);
        return captured.status === 'succeeded';
    } catch (err: any) {
        console.error('[PaymentService] Capture failed:', err.message);
        return false;
    }
}
