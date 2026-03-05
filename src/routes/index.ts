import { Router } from 'express';
import authRoutes from '@modules/auth/auth.routes.js';
import healthRoutes from '../health/health.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/', healthRoutes);

export default router;
