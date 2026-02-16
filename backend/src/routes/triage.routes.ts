import { Router } from 'express';
import { triage } from '../controllers/triage.controller';

const router = Router();

router.post('/', triage);

export default router;
