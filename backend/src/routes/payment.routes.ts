import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware';
import { createHold } from '../services/payment.service';

const prisma = new PrismaClient();
const router = Router();

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

export default router;
