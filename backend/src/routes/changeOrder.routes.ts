import { Router } from 'express';
import { createChangeOrder, updateChangeOrderStatus } from '../controllers/changeOrder.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// /api/change-orders/:id/approve
router.post('/:id/approve', authenticate, (req, res) => {
    req.body.status = 'APPROVED';
    updateChangeOrderStatus(req, res);
});

// /api/change-orders/:id/decline
router.post('/:id/decline', authenticate, (req, res) => {
    req.body.status = 'DECLINED';
    updateChangeOrderStatus(req, res);
});

export default router;
