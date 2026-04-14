
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createReview = async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { rating, tags, comment } = req.body;

    try {
        const job = await prisma.job.findUnique({ where: { id } });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        if (job.paymentHoldStatus !== 'CAPTURED') {
            return res.status(400).json({ error: 'Payment must be captured before reviewing' });
        }

        const review = await prisma.review.create({
            data: {
                jobId: id,
                rating,
                tags,
                comment
            }
        });

        res.json(review);
    } catch (error) {
        console.error('Create Review Error:', error);
        res.status(500).json({ error: 'Failed to create review' });
    }
};
