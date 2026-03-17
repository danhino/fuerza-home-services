import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, refreshAccessToken, logout } from '../controllers/auth.controller';

const router = Router();

// Rate limit: 10 requests per 15 minutes per IP for login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please try again later.' },
});

// Rate limit: 5 requests per hour per IP for register
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 60 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please try again later.' },
});

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);

export default router;
