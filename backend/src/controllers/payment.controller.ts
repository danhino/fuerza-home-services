import { Request, Response } from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { stripe } from '../services/payment.service';

const prisma = new PrismaClient();

/**
 * POST /api/payments/webhook
 * Stripe webhook handler. Requires the RAW request body for signature
 * verification — the route uses express.raw(), and server.ts exempts
 * this path from the global express.json() parser.
 */
export const handleStripeWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('[Webhook] STRIPE_WEBHOOK_SECRET not set');
        return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
        console.error('[Webhook] Signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    try {
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const intent = event.data.object as Stripe.PaymentIntent;
                const jobId = intent.metadata?.jobId;
                if (jobId) {
                    await prisma.job.update({
                        where: { id: jobId },
                        data: { paymentHoldStatus: 'PAID' },
                    });
                    console.log(`[Webhook] PaymentIntent succeeded for job ${jobId}`);
                }
                break;
            }

            case 'payment_intent.payment_failed': {
                const intent = event.data.object as Stripe.PaymentIntent;
                const jobId = intent.metadata?.jobId;
                if (jobId) {
                    await prisma.job.update({
                        where: { id: jobId },
                        data: { paymentHoldStatus: 'FAILED' },
                    });
                    console.log(`[Webhook] PaymentIntent failed for job ${jobId}`);
                }
                break;
            }

            case 'payment_intent.amount_capturable_updated': {
                // Authorization succeeded — card is valid and funds reserved
                const intent = event.data.object as Stripe.PaymentIntent;
                const jobId = intent.metadata?.jobId;
                if (jobId) {
                    await prisma.job.update({
                        where: { id: jobId },
                        data: { paymentHoldStatus: 'AUTHORIZED' },
                    });
                    console.log(`[Webhook] PaymentIntent authorized for job ${jobId}`);
                }
                break;
            }

            default:
                console.log(`[Webhook] Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (err) {
        console.error('[Webhook] Handler error:', err);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
};
