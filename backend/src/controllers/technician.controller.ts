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

/**
 * GET /api/technicians/online
 * Returns all technicians who are currently online with their last known location.
 */
export const getOnlineTechnicians = async (_req: AuthRequest, res: Response) => {
    try {
        const profiles = await prisma.technicianProfile.findMany({
            where: { isOnline: true },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        rating: true,
                    },
                },
            },
        });

        const technicians = profiles.map((p) => ({
            id: p.user.id,
            name: p.user.name,
            lat: p.currentLat ?? 0,
            lng: p.currentLng ?? 0,
            trade: p.trades.length > 0 ? p.trades[0] : 'PLUMBER',
            rating: p.user.rating,
            isOnline: true,
        }));

        res.json({ technicians });
    } catch (error) {
        console.error('Failed to fetch online technicians:', error);
        res.status(500).json({ error: 'Failed to fetch online technicians' });
    }
};
