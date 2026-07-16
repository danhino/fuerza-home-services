import { Response } from 'express';
import { PrismaClient, JobStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

const DISPUTE_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours after capture

/**
 * POST /api/jobs/:id/dispute
 * Body: { reason: string, description: string }
 * Customer opens a dispute on a completed job within 48h of payment capture.
 */
export const createDispute = async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { reason, description } = req.body;
    const userId = req.user.userId;

    try {
        if (!reason || !description) {
            return res.status(400).json({ error: 'reason and description are required' });
        }

        const job = await prisma.job.findUnique({ where: { id } });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        if (job.customerId !== userId) {
            return res.status(403).json({ error: 'Not authorized — only the customer who owns this job can dispute it' });
        }

        if (job.status !== JobStatus.COMPLETED) {
            return res.status(400).json({ error: 'Only completed jobs can be disputed' });
        }

        if (!job.capturedAt || Date.now() - new Date(job.capturedAt).getTime() > DISPUTE_WINDOW_MS) {
            return res.status(400).json({ error: 'Disputes must be opened within 48 hours of payment capture' });
        }

        const dispute = await prisma.dispute.create({
            data: {
                jobId: id,
                customerId: userId,
                reason,
                description,
            },
        });

        // TODO: Send email notification to admin (wire up in Phase 4 with SendGrid)

        res.status(201).json({ success: true, disputeId: dispute.id });
    } catch (error) {
        console.error('Create Dispute Error:', error);
        res.status(500).json({ error: 'Failed to create dispute' });
    }
};
