import { Router } from 'express';
import { getProfile, updateTechnicianStatus, updateLocation, updatePreferredLanguage } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/me', authenticate, getProfile);
router.put('/technician/status', authenticate, updateTechnicianStatus);
router.put('/technician/location', authenticate, updateLocation);
router.patch('/me/language', authenticate, updatePreferredLanguage);

export default router;
