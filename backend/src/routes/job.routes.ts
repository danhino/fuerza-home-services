import { Router } from 'express';
import { createJob, getOpenJobs, acceptJob, updateJobStatus, getJobs, capturePayment } from '../controllers/job.controller';
import { authenticate } from '../middleware/auth.middleware';
import { createChangeOrder } from '../controllers/changeOrder.controller';
import { createReview } from '../controllers/review.controller';
import { getReceipt } from '../controllers/receipt.controller';

const router = Router();

router.post('/', authenticate, createJob);
router.get('/', authenticate, getJobs);
router.get('/open', authenticate, getOpenJobs);
router.post('/accept', authenticate, acceptJob);
router.put('/status', authenticate, updateJobStatus);
router.post('/:id/change-orders', authenticate, createChangeOrder);
router.post('/:id/payments/capture', authenticate, capturePayment);
router.post('/:id/reviews', authenticate, createReview);
router.get('/:id/receipt', authenticate, getReceipt);

export default router;
