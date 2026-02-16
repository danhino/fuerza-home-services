import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthRequest } from './auth.middleware';

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user || authReq.user.role !== Role.ADMIN) {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    next();
};
