import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import {
    createHold,
    createPaymentIntent,
    getOrCreateStripeCustomer,
    createEphemeralKey,
    createConnectAccount,
    createAccountLink,
    getConnectStatus,
    getPayoutHistory,
} from '../services/payment.service';

const prisma = new PrismaClient();
const router = Router();

/**
 * POST /api/payments/create-payment-intent
 * Body: { amountCents: number }
 *
 * Creates a Stripe PaymentIntent + ephemeral key for the mobile PaymentSheet.
 * Returns: { clientSecret, ephemeralKey, customerId, paymentIntentId }
 */
router.post('/create-payment-intent', authenticate, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId || authReq.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const { amountCents, jobId } = req.body;

        if (!amountCents || typeof amountCents !== 'number' || amountCents < 50) {
            return res.status(400).json({
                success: false,
                error: 'amountCents is required and must be at least 50',
            });
        }

        // Get user details for Stripe Customer creation
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Get or create Stripe Customer
        const stripeCustomerId = await getOrCreateStripeCustomer(
            userId,
            user.email,
            user.name
        );

        // Create ephemeral key for PaymentSheet
        const ephemeralKey = await createEphemeralKey(stripeCustomerId);

        // Create PaymentIntent (manual capture — authorized now, captured on completion)
        const result = await createPaymentIntent(amountCents, stripeCustomerId, 'usd', jobId);

        if (!result.success) {
            return res.status(402).json({
                success: false,
                error: result.error || 'Payment intent creation failed',
            });
        }

        // If tied to an existing job, mark its payment as authorized
        if (jobId) {
            await prisma.job.update({
                where: { id: jobId },
                data: {
                    paymentIntentId: result.paymentIntentId,
                    paymentHoldStatus: 'AUTHORIZED',
                },
            }).catch((err) => console.error('[PaymentRoute] Failed to mark job AUTHORIZED:', err.message));
        }

        return res.json({
            success: true,
            clientSecret: result.clientSecret,
            ephemeralKey,
            customerId: stripeCustomerId,
            paymentIntentId: result.paymentIntentId,
        });
    } catch (err: any) {
        console.error('[PaymentRoute] /create-payment-intent error:', err);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
});

/**
 * POST /api/payments/hold
 * Body: { amountCents: number }
 * Creates a Stripe PaymentIntent hold (manual capture).
 */
router.post('/hold', authenticate, async (req: Request, res: Response) => {
    try {
        const { amountCents } = req.body;

        if (!amountCents || typeof amountCents !== 'number' || amountCents < 50) {
            return res.status(400).json({
                success: false,
                error: 'amountCents is required and must be at least 50',
            });
        }

        const result = await createHold(amountCents);

        if (!result.success) {
            return res.status(402).json({
                success: false,
                error: result.error || 'Payment hold failed',
            });
        }

        return res.json({
            success: true,
            holdRef: result.holdRef,
        });
    } catch (err: any) {
        console.error('[PaymentRoute] /hold error:', err);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
});

// ── Stripe Connect Express ───────────────────────────────────────────────────

/**
 * POST /api/payments/connect/onboard
 * Creates a Connect Express account and returns the onboarding URL.
 */
router.post('/connect/onboard', authenticate, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId || authReq.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        const result = await createConnectAccount(userId, user.email);

        if ('error' in result) {
            return res.status(500).json({ success: false, error: result.error });
        }

        // Generate onboarding link — always build URLs server-side from BACKEND_URL
        // so we never pass a plain-HTTP LAN IP to Stripe (which rejects non-localhost HTTP).
        const base = (process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');
        const resultUrl = await createAccountLink(
            result.accountId,
            `${base}/api/payments/connect/return`,
            `${base}/api/payments/connect/refresh`
        );

        if (resultUrl.error) {
            return res.status(500).json({ success: false, error: resultUrl.error });
        }

        return res.json({ success: true, url: resultUrl.url, accountId: result.accountId });
    } catch (err: any) {
        console.error('[PaymentRoute] /connect/onboard error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * GET /api/payments/connect/return
 * Redirects back to the app after Stripe onboarding.
 */
router.get('/connect/return', (req: Request, res: Response) => {
    res.redirect('fuerza-home-services://profile');
});

/**
 * GET /api/payments/connect/refresh
 * Redirects back to the app if Stripe onboarding link expires.
 */
router.get('/connect/refresh', (req: Request, res: Response) => {
    res.redirect('fuerza-home-services://profile');
});

/**
 * GET /api/payments/connect/status
 * Returns whether the technician's Connect account is fully set up.
 */
router.get('/connect/status', authenticate, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId || authReq.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const profile = await prisma.technicianProfile.findUnique({ where: { userId } });

        if (!profile?.stripeConnectAccountId) {
            return res.json({ success: true, isSetup: false, hasAccount: false, requirements: [] });
        }

        const status = await getConnectStatus(profile.stripeConnectAccountId);
        return res.json({ success: true, hasAccount: true, ...status });
    } catch (err: any) {
        console.error('[PaymentRoute] /connect/status error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * GET /api/payments/connect/transfers
 * Returns payout history for the authenticated technician.
 */
router.get('/connect/transfers', authenticate, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId || authReq.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const transfers = await getPayoutHistory(userId);
        return res.json({ success: true, transfers });
    } catch (err: any) {
        console.error('[PaymentRoute] /connect/transfers error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
