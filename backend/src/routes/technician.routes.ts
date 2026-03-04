import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { updateTechnicianOnlineStatus } from '../controllers/technician.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// PUT /api/technicians/me/status  — toggle online/offline
router.put('/me/status', updateTechnicianOnlineStatus);

export default router;
