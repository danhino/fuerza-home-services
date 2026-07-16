import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { createReview, getTechnicianReviews } from '../controllers/review.controller';

const router = Router();

// POST /api/jobs/:id/review — customer reviews a completed job
router.post('/jobs/:id/review', authenticate, createReview);

// GET /api/technicians/:id/reviews — public: technician's last 10 reviews + rating summary
router.get('/technicians/:id/reviews', getTechnicianReviews);

export default router;
