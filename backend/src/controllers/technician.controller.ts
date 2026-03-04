import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

/**
 * PUT /api/technicians/me/status
 * Body: { isOnline: boolean }
 *
 * Updates (or creates) the TechnicianProfile for the authenticated user.
 */
export const updateTechnicianOnlineStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { isOnline } = req.body;

        // Upsert: update if exists, create if not
        const profile = await prisma.technicianProfile.upsert({
            where: { userId },
            update: { isOnline },
            create: { userId, isOnline: isOnline ?? true },
        });

        res.json({ success: true, isOnline: profile.isOnline });
    } catch (error) {
        console.error('Failed to update technician status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
};
