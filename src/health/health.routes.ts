import { Router, Request, Response } from 'express';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get('/ready', (_req: Request, res: Response) => {
  // Add checks for database, redis, etc. when implemented
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
});

export default router;
