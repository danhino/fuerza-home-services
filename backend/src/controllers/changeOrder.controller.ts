import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { socketService } from '../services/socket.service';
import { calculatePricing } from '../services/pricing.service';

const prisma = new PrismaClient();

/** Job statuses that allow change order creation */
const CHANGE_ORDER_ALLOWED_STATUSES = ['MATCHED', 'EN_ROUTE', 'ARRIVED', 'WORKING'];

export const createChangeOrder = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id; // jobId

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'Invalid job ID' });
        }

        const { items } = req.body; // Array of { type, description, quantity, unitPrice }

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Invalid items format' });
        }

        const technicianId = req.user.userId;

        // Verify job exists and belongs to technician
        const job = await prisma.job.findUnique({
            where: { id },
        });

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (job.technicianId !== technicianId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Only allow change orders during active job statuses
        if (!CHANGE_ORDER_ALLOWED_STATUSES.includes(job.status)) {
            return res.status(400).json({
                error: `Change orders are not allowed when job status is ${job.status}`,
            });
        }

        // Only one pending change order at a time
        const existingPending = await prisma.changeOrder.findFirst({
            where: { jobId: id, status: 'PENDING' },
        });
        if (existingPending) {
            return res.status(409).json({
                error: 'A pending change order already exists for this job',
            });
        }

        // Calculate total
        let totalAmount = 0;
        const changeOrderItems = items.map((item: any) => {
            const lineTotal = Number(item.quantity) * Number(item.unitPrice);
            totalAmount += lineTotal;
            return {
                type: String(item.type),
                description: String(item.description),
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
            };
        });

        // Create Change Order
        const changeOrder = await prisma.changeOrder.create({
            data: {
                jobId: id,
                totalAmount,
                status: 'PENDING',
                items: {
                    create: changeOrderItems,
                },
            },
            include: {
                items: true,
            },
        });

        // Notify Customer
        socketService.emitToUser(job.customerId, 'job:changeOrder', {
            jobId: id,
            changeOrder,
        });

        res.status(201).json(changeOrder);
    } catch (error) {
        console.error('Create Change Order Error:', error);
        res.status(500).json({ error: 'Failed to create change order' });
    }
};

export const updateChangeOrderStatus = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id; // changeOrderId

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'Invalid change order ID' });
        }

        const { status } = req.body; // APPROVED | DECLINED
        const userId = req.user.userId;

        const changeOrder = await prisma.changeOrder.findUnique({
            where: { id },
            include: { job: true },
        });

        if (!changeOrder) {
            return res.status(404).json({ error: 'Change order not found' });
        }

        // Only customer can approve/decline
        if (changeOrder.job.customerId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const updatedChangeOrder = await prisma.changeOrder.update({
            where: { id },
            data: { status: String(status) },
            include: { items: true },
        });

        // If approved, update the job's pricing to reflect the change order
        if (status === 'APPROVED') {
            const breakdown = calculatePricing(changeOrder.totalAmount);
            await prisma.job.update({
                where: { id: changeOrder.jobId },
                data: {
                    serviceFee: changeOrder.totalAmount,
                    estimateLow: changeOrder.totalAmount,
                    estimateHigh: changeOrder.totalAmount,
                    platformCommission: breakdown.platformCommission,
                    technicianPayout: breakdown.technicianPayout,
                },
            });
        }

        // Notify Technician
        if (changeOrder.job.technicianId) {
            socketService.emitToUser(changeOrder.job.technicianId, 'job:changeOrderUpdate', {
                jobId: changeOrder.jobId,
                changeOrder: updatedChangeOrder,
                status,
            });
        }

        res.json(updatedChangeOrder);

    } catch (error) {
        console.error('Update Change Order Status Error:', error);
        res.status(500).json({ error: 'Failed to update change order status' });
    }
};

export const getChangeOrderHistory = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string; // jobId
        const userId = req.user.userId;

        // Verify user is customer or technician on this job
        const job = await prisma.job.findUnique({ where: { id } });
        if (!job) return res.status(404).json({ error: 'Job not found' });
        if (job.customerId !== userId && job.technicianId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const changeOrders = await prisma.changeOrder.findMany({
            where: { jobId: id as string },
            include: { items: true },
            orderBy: { createdAt: 'asc' },
        });

        // Prepend original estimate as first entry
        const history = [
            {
                id: 'original',
                type: 'ORIGINAL',
                totalAmount: job.serviceFee ?? job.estimateLow,
                status: 'ORIGINAL',
                createdAt: job.createdAt,
                items: [],
            },
            ...changeOrders,
        ];

        res.json(history);
    } catch (error) {
        console.error('Get Change Order History Error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};
