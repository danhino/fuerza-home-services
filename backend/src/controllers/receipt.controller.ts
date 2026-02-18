
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { emailService } from '../services/email.service';

const prisma = new PrismaClient();

export const getReceipt = async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    try {
        const job = await prisma.job.findUnique({
            where: { id },
            include: { customer: { include: { user: true } } }
        });

        if (!job) return res.status(404).json({ error: 'Job not found' });

        // Mock PDF generation - in real app, we'd generate a PDF here
        const receiptUrl = `https://fuerza.com/receipts/${id}.pdf`;

        // Update job with receipt info
        await prisma.job.update({
            where: { id },
            data: {
                receiptPdfUrl: receiptUrl,
                receiptEmailedAt: new Date(),
                warrantyDays: 30 // standard warranty
            }
        });

        // Email receipt
        const customerEmail = job.customer?.user.email;
        if (customerEmail) {
            await emailService.sendReceipt(customerEmail, receiptUrl);
        }

        res.json({
            receiptUrl,
            warrantyDays: 30,
            emailedTo: customerEmail
        });
    } catch (error) {
        console.error('Get Receipt Error:', error);
        res.status(500).json({ error: 'Failed to get receipt' });
    }
};
