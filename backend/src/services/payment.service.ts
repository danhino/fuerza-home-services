import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover',
});

interface HoldResult {
    success: boolean;
    holdRef?: string;
    error?: string;
}

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
            // In production you'd attach a customer + payment method here.
            // For now we use automatic_payment_methods for test mode.
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never',
            },
            confirm: true,
            // Use a test payment method in dev
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
