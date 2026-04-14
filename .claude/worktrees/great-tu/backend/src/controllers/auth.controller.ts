import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyToken } from '../utils/auth.utils';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
    try {
        const { phone, email, name, password, role, firstName, lastName } = req.body;

        if (!phone || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { phone },
                    { email }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User with this phone or email already exists' });
        }

        const hashedPassword = await hashPassword(password);
        const userRole = role === 'TECHNICIAN' ? Role.TECHNICIAN : Role.CUSTOMER;

        // Create the user first so we have an ID for the tokens
        const user = await prisma.user.create({
            data: {
                phone,
                email,
                name: name || `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
                firstName: firstName || '',
                lastName: lastName || '',
                password: hashedPassword,
                role: userRole,
            },
        });

        const refreshToken = generateRefreshToken({ userId: user.id });

        // Update with the refresh token
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken }
        });

        // Create profile based on role
        if (userRole === Role.TECHNICIAN) {
            await prisma.technicianProfile.create({
                data: { userId: user.id },
            });
        } else {
            await prisma.customerProfile.create({
                data: { userId: user.id },
            });
        }

        const accessToken = generateAccessToken({ userId: user.id, role: user.role });
        res.status(201).json({
            token: accessToken,
            refreshToken,
            user: { id: user.id, name: user.name, firstName: user.firstName, lastName: user.lastName, role: user.role, preferredLanguage: user.preferredLanguage },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { identifier, password } = req.body; // identifier can be phone or email

        if (!identifier || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { phone: identifier },
                    { email: identifier }
                ]
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const accessToken = generateAccessToken({ userId: user.id, role: user.role });
        const refreshToken = generateRefreshToken({ userId: user.id });

        // Store refresh token in DB
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken },
        });

        res.json({
            token: accessToken,
            refreshToken,
            user: { id: user.id, name: user.name, firstName: user.firstName, lastName: user.lastName, role: user.role, preferredLanguage: user.preferredLanguage },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

/**
 * POST /api/auth/refresh
 * Body: { refreshToken: string }
 * Returns a new accessToken and rotated refreshToken.
 */
export const refreshAccessToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        // Find user with this refresh token
        const user = await prisma.user.findFirst({
            where: { refreshToken },
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        // Generate new tokens (rotation)
        const newAccessToken = generateAccessToken({ userId: user.id, role: user.role });
        const newRefreshToken = generateRefreshToken({ userId: user.id });

        // Update stored refresh token
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: newRefreshToken },
        });

        res.json({
            token: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Token refresh failed' });
    }
};

/**
 * POST /api/auth/logout
 * Clears the user's refresh token from the DB.
 */
export const logout = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            await prisma.user.updateMany({
                where: { refreshToken },
                data: { refreshToken: null },
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
};
