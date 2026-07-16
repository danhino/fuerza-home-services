import { Request, Response } from 'express';
import { PrismaClient, JobStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

/**
 * POST /api/jobs/:id/review
 * Body: { rating: number (1-5), comment?: string }
 * Customer who owns the job leaves a review after completion.
 */
export const createReview = async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { rating, comment } = req.body;
    const userId = req.user.userId;

    try {
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
        }

        const job = await prisma.job.findUnique({ where: { id } });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        if (job.customerId !== userId) {
            return res.status(403).json({ error: 'Not authorized — only the customer who owns this job can review it' });
        }

        if (job.status !== JobStatus.COMPLETED) {
            return res.status(400).json({ error: 'Job must be completed before reviewing' });
        }

        if (!job.technicianId) {
            return res.status(400).json({ error: 'Job has no assigned technician to review' });
        }

        const existing = await prisma.review.findUnique({ where: { jobId: id } });
        if (existing) {
            return res.status(409).json({ error: 'This job has already been reviewed' });
        }

        const review = await prisma.review.create({
            data: {
                jobId: id,
                customerId: userId,
                technicianId: job.technicianId,
                rating,
                comment: comment || null,
            },
        });

        // Recalculate technician's average rating and review count
        const reviews = await prisma.review.findMany({
            where: { technicianId: job.technicianId },
        });
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await prisma.technicianProfile.update({
            where: { userId: job.technicianId },
            data: {
                averageRating: Math.round(avg * 10) / 10,
                reviewCount: reviews.length,
            },
        });

        res.status(201).json(review);
    } catch (error) {
        console.error('Create Review Error:', error);
        res.status(500).json({ error: 'Failed to create review' });
    }
};

/**
 * GET /api/technicians/:id/reviews
 * Public endpoint — returns the technician's last 10 reviews
 * plus their averageRating and reviewCount.
 */
export const getTechnicianReviews = async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    try {
        const [profile, reviews] = await Promise.all([
            prisma.technicianProfile.findUnique({
                where: { userId: id },
                select: { averageRating: true, reviewCount: true },
            }),
            prisma.review.findMany({
                where: { technicianId: id },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    customer: { select: { firstName: true } },
                    job: { select: { trade: true } },
                },
            }),
        ]);

        if (!profile) {
            return res.status(404).json({ error: 'Technician not found' });
        }

        res.json({
            averageRating: profile.averageRating,
            reviewCount: profile.reviewCount,
            reviews: reviews.map((r) => ({
                rating: r.rating,
                comment: r.comment,
                createdAt: r.createdAt,
                customerFirstName: r.customer.firstName,
                trade: r.job.trade,
                response: r.response,
                respondedAt: r.respondedAt,
            })),
        });
    } catch (error) {
        console.error('Get Technician Reviews Error:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};
