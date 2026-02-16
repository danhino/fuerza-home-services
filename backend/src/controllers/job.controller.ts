import { Response } from 'express';
import { PrismaClient, JobStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { socketService } from '../services/socket.service';

const prisma = new PrismaClient();

export const createJob = async (req: AuthRequest, res: Response) => {
    try {
        const customerId = req.user.userId;
        const { trade, description, address, lat, lng, photos, issueTag, videoUrl } = req.body;

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
            },
        });

        // Fetch customer's preferred language to include in socket payload
        const customer = await prisma.user.findUnique({
            where: { id: customerId },
            select: { preferredLanguage: true, name: true },
        });

        // Notify all technicians with customer language info
        socketService.emit('job:new', {
            ...job,
            customerPreferredLanguage: customer?.preferredLanguage || 'en',
            customerName: customer?.name,
        });

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
            include: { customer: { include: { user: { select: { name: true, preferredLanguage: true } } } } },
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
        res.json(job);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
};
