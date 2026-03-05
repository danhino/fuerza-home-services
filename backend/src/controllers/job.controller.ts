import { Response } from 'express';
import { PrismaClient, JobStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { socketService } from '../services/socket.service';
import { captureHold, createPayout } from '../services/payment.service';
import { calculatePricing, getTradeEstimate, getEstimateForTrade } from '../services/pricing.service';
import { sendNewJobAlert, sendJobStatusAlert } from '../services/push.service';

const prisma = new PrismaClient();

export const capturePayment = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { tipAmountCents } = req.body; // Optional tip in cents

        const job = await prisma.job.findUnique({
            where: { id },
            include: {
                estimate: true,
                changeOrders: { where: { status: 'APPROVED' }, include: { items: true } },
                customer: { include: { user: true } },
                technician: { include: { user: true } }
            },
        });

        if (!job) return res.status(404).json({ error: 'Job not found' });
        if (!job.holdRef) return res.status(400).json({ error: 'No payment hold found for this job' });
        if (job.paymentHoldStatus === 'CAPTURED') return res.status(400).json({ error: 'Payment already captured' });

        // Calculate Totals
        const baseAmount = job.estimate?.currentAmount || 0; // In dollars
        const changeOrders = job.changeOrders || [];
        const changeOrderTotal = changeOrders.reduce((sum: number, co: any) => sum + co.totalAmount, 0); // In dollars

        const subtotalDollars = baseAmount + changeOrderTotal;
        const subtotalCents = Math.round(subtotalDollars * 100);
        const finalTipCents = tipAmountCents || 0;
        const totalAmountCents = subtotalCents + finalTipCents;

        // Calculate Platform Fees
        // Fee = $2.00 Booking Fee + 3% of Labor
        // Assumption: Base estimate is treated as Labor for MVP simplicity unless broken down
        // We'll treat the entire subtotal as subject to the 3% fee for now to ensure coverage, 
        // or strictly follow the plan: Base + Labor COs.
        // Let's stick to the plan: Base + Labor COs.

        let laborAmount = baseAmount;
        changeOrders.forEach((co: any) => {
            if (co.items) {
                co.items.forEach((item: any) => {
                    if (item.type === 'LABOR') {
                        laborAmount += (item.quantity * item.unitPrice);
                    }
                });
            }
        });

        const bookingFeeCents = 200; // $2.00
        const laborFeeCents = Math.round(laborAmount * 100 * 0.03); // 3%
        const totalPlatformFeeCents = bookingFeeCents + laborFeeCents;

        const feeBreakdown = {
            bookingFee: 200,
            laborFee: laborFeeCents,
            totalFee: totalPlatformFeeCents,
            calculationBase: laborAmount
        };

        // Capture Payment via Stripe
        const success = await captureHold(job.holdRef, totalAmountCents);

        if (!success) {
            return res.status(500).json({ error: 'Failed to capture payment with payment provider' });
        }

        // Update Job
        const updatedJob = await prisma.job.update({
            where: { id },
            data: {
                status: JobStatus.COMPLETED,
                paymentHoldStatus: 'CAPTURED',
                finalAmount: totalAmountCents,
                tipAmount: finalTipCents,
                feeBreakdown: feeBreakdown as any // Cast to any to avoid Json compatibility issues if present
            },
            include: {
                customer: { include: { user: true } },
                technician: { include: { user: true } }
            }
        });

        // Notify
        socketService.emitToUser(job.customerId, 'job:payment', { job: updatedJob });
        if (job.technicianId) {
            socketService.emitToUser(job.technicianId, 'job:payment', { job: updatedJob });
        }

        // Auto-payout: transfer technician's portion (88%) to their Connect account
        if (job.technicianId) {
            const payoutResult = await createPayout(id);
            if (payoutResult.success) {
                console.log(`[Payout] Transferred $${(payoutResult.payoutAmount! / 100).toFixed(2)} to technician ${job.technicianId}`);
            } else {
                console.error(`[Payout] Failed for job ${id}:`, payoutResult.error);
            }
        }

        res.json(updatedJob);

    } catch (error) {
        console.error('Capture Payment Error:', error);
        res.status(500).json({ error: 'Failed to capture payment' });
    }
};

export const createJob = async (req: AuthRequest, res: Response) => {
    try {
        const customerId = req.user.userId;
        const { trade, description, address, lat, lng, photos, issueTag, videoUrl, holdRef, holdAmountCents, estimateLow, estimateHigh, estimatedPrice, paymentIntentId, cleaningSize } = req.body;

        // Calculate pricing breakdown — uses size-based rate for House Cleaning
        const pricing = getEstimateForTrade(trade, cleaningSize);

        const job = await prisma.job.create({
            data: {
                customerId,
                trade,
                description,
                address,
                locationLat: lat,
                locationLng: lng,
                status: JobStatus.REQUESTED,
                issueTag: issueTag || null,
                videoUrl: videoUrl || null,
                photos: photos || [],
                ...(holdRef ? {
                    paymentProvider: 'STRIPE',
                    holdRef,
                    holdAmount: holdAmountCents || null,
                    paymentHoldStatus: 'HELD',
                } : {}),
                estimateLow: estimateLow || estimatedPrice || pricing.serviceFee,
                estimateHigh: estimateHigh || estimatedPrice || pricing.serviceFee,
                paymentIntentId: paymentIntentId || null,
                cleaningSize: cleaningSize || null,
                // Pricing breakdown
                serviceFee: pricing.serviceFee,
                bookingFee: pricing.bookingFee,
                platformCommission: pricing.platformCommission,
                technicianPayout: pricing.technicianPayout,
            },
        });

        // Fetch customer's preferred language to include in socket payload
        const customer = await prisma.user.findUnique({
            where: { id: customerId },
            select: { preferredLanguage: true, name: true, firstName: true },
        });

        // Notify all technicians with customer language info
        socketService.emit('job:new', {
            ...job,
            customerPreferredLanguage: customer?.preferredLanguage || 'en',
            customerName: customer?.name,
        });

        // Push notification to online technicians (fire and forget)
        const onlineTechs = await prisma.technicianProfile.findMany({
            where: { isOnline: true },
            select: { userId: true },
        });
        const techIds = onlineTechs.map(t => t.userId);
        sendNewJobAlert(techIds, job).catch(console.error);

        res.status(201).json(job);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create job' });
    }
};

export const getOpenJobs = async (req: AuthRequest, res: Response) => {
    try {
        // For MVP, just return all REQUESTED jobs. Ideally filter by location/trade.
        const jobs = await prisma.job.findMany({
            where: {
                status: JobStatus.REQUESTED,
                technicianId: null,
            },
            include: {
                estimate: true,
                customer: { include: { user: { select: { name: true, firstName: true, lastName: true, preferredLanguage: true } } } },
            },
        });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
};

export const getJobs = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.userId;
        const role = req.user.role;

        let where = {};
        if (role === 'CUSTOMER') {
            where = { customerId: userId };
        } else if (role === 'TECHNICIAN') {
            where = { technicianId: userId };
        }

        const jobs = await prisma.job.findMany({
            where,
            include: {
                estimate: true,
                customer: { include: { user: true } },
                technician: { include: { user: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user jobs' });
    }
};

export const acceptJob = async (req: AuthRequest, res: Response) => {
    try {
        const technicianId = req.user.userId;
        const { jobId } = req.body;

        const job = await prisma.job.update({
            where: { id: jobId },
            data: {
                technicianId,
                status: JobStatus.MATCHED,
            },
        });

        socketService.emitToUser(job.customerId, 'job:matched', { job });
        res.json(job);
    } catch (error) {
        res.status(500).json({ error: 'Failed to accept job' });
    }
};

export const updateJobStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { jobId, status } = req.body;

        const job = await prisma.job.update({
            where: { id: jobId },
            data: { status },
        });

        socketService.emitToUser(job.customerId, 'job:status', { jobId, status });

        // Push notification to customer (fire and forget)
        sendJobStatusAlert(job.customerId, status, jobId).catch(console.error);

        res.json(job);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
};

/**
 * POST /api/jobs/estimate
 * Body: { trade, issueDescription? }
 * Returns a flat-rate estimate with full pricing breakdown.
 */
export const getEstimate = async (req: AuthRequest, res: Response) => {
    try {
        const { trade, cleaningSize } = req.body;
        if (!trade) {
            return res.status(400).json({ error: 'Trade is required' });
        }

        const pricing = getEstimateForTrade(trade, cleaningSize);

        res.json({
            success: true,
            trade,
            cleaningSize: cleaningSize || null,
            estimatedPrice: pricing.serviceFee,
            ...pricing,
        });
    } catch (error) {
        console.error('Get Estimate Error:', error);
        res.status(500).json({ error: 'Failed to generate estimate' });
    }
};
