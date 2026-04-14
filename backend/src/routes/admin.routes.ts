import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/admin.middleware';
import { getAllUsers, deleteUser, updateUser } from '../controllers/admin.controller';

const router = Router();

// All routes require authentication AND admin role
router.use(authenticate, isAdmin);

router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id', updateUser);

export default router;
