import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                technicianProfile: true,
                customerProfile: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

export const updateTechnicianStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.userId;
        const { isOnline } = req.body;

        const techProfile = await prisma.technicianProfile.update({
            where: { userId },
            data: { isOnline },
        });

        res.json(techProfile);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
};

export const updateLocation = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.userId;
        const { lat, lng } = req.body;

        const techProfile = await prisma.technicianProfile.update({
            where: { userId },
            data: { currentLat: lat, currentLng: lng },
        });

        res.json(techProfile);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update location' });
    }
};

export const updatePreferredLanguage = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.userId;
        const { preferredLanguage } = req.body;

        if (!['en', 'es'].includes(preferredLanguage)) {
            return res.status(400).json({ error: 'Invalid language. Must be "en" or "es".' });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { preferredLanguage },
            select: { id: true, preferredLanguage: true },
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update language preference' });
    }
};
