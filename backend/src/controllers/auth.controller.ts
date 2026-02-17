import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.utils';

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

        const token = generateToken({ userId: user.id, role: user.role });
        res.status(201).json({ token, user: { id: user.id, name: user.name, firstName: user.firstName, lastName: user.lastName, role: user.role, preferredLanguage: user.preferredLanguage } });
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

        const token = generateToken({ userId: user.id, role: user.role });
        res.json({ token, user: { id: user.id, name: user.name, firstName: user.firstName, lastName: user.lastName, role: user.role, preferredLanguage: user.preferredLanguage } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};
