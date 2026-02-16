import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { hashPassword } from '../utils/auth.utils';

const prisma = new PrismaClient();

export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
                technicianProfile: {
                    select: { isOnline: true, completedJobs: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({ where: { id: id as string } });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, phone, role, password } = req.body;

        const data: any = { name, email, phone, role };
        if (password) {
            data.password = await hashPassword(password);
        }

        const user = await prisma.user.update({
            where: { id: id as string },
            data,
            select: { id: true, name: true, email: true, role: true }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
};
