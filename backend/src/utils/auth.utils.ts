import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyForDevelopmentOnly';

export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

/** Short-lived access token (15 minutes) */
export const generateAccessToken = (payload: object): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
};

/** Long-lived refresh token (30 days) */
export const generateRefreshToken = (payload: object): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
};

/** @deprecated Use generateAccessToken instead */
export const generateToken = (payload: object): string => {
    return generateAccessToken(payload);
};

export const verifyToken = (token: string): any => {
    return jwt.verify(token, JWT_SECRET);
};
