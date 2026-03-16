import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { updateTechnicianOnlineStatus, getOnlineTechnicians } from '../controllers/technician.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/technicians/online — get all online technicians for customer map
router.get('/online', getOnlineTechnicians);

// PUT /api/technicians/me/status  — toggle online/offline
router.put('/me/status', updateTechnicianOnlineStatus);

export default router;
