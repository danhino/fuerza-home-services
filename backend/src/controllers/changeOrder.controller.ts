import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { socketService } from '../services/socket.service';

const prisma = new PrismaClient();

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
