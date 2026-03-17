import { Router } from 'express';
import multer from 'multer';
import { createJob, getOpenJobs, acceptJob, updateJobStatus, getJobs, capturePayment, getEstimate } from '../controllers/job.controller';
import { authenticate } from '../middleware/auth.middleware';
import { createChangeOrder, getChangeOrderHistory } from '../controllers/changeOrder.controller';
import { createReview } from '../controllers/review.controller';
import { getReceipt } from '../controllers/receipt.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB per file

router.post('/estimate', authenticate, getEstimate);
router.post('/', authenticate, upload.array('photos', 10), createJob);
router.get('/', authenticate, getJobs);
router.get('/open', authenticate, getOpenJobs);
router.post('/accept', authenticate, acceptJob);
router.put('/status', authenticate, updateJobStatus);
router.get('/:id/change-orders', authenticate, getChangeOrderHistory);
router.post('/:id/change-orders', authenticate, createChangeOrder);
router.post('/:id/payments/capture', authenticate, capturePayment);
router.post('/:id/reviews', authenticate, createReview);
router.get('/:id/receipt', authenticate, getReceipt);

export default router;
