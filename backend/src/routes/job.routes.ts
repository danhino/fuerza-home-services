import { Router } from 'express';
import { createJob, getOpenJobs, acceptJob, updateJobStatus, getJobs } from '../controllers/job.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, createJob);
router.get('/', authenticate, getJobs);
router.get('/open', authenticate, getOpenJobs);
router.post('/accept', authenticate, acceptJob);
router.put('/status', authenticate, updateJobStatus);

export default router;
