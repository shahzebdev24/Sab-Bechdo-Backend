import { Router } from 'express';
import * as adsController from './ads.controller.js';
import { authenticate, optionalAuthenticate } from '@middleware/auth.js';
import { requireAdmin } from '@middleware/admin.js';
import { validateBody, validateQuery, validateParams } from '@middleware/validation.js';
import {
  createAdSchema,
  updateAdSchema,
  updateAdStatusSchema,
  listAdsQuerySchema,
} from './ads.validation.js';
import { z } from 'zod';

const router = Router();

// Admin routes - must come first to avoid conflicts
router.get('/admin/all', authenticate, requireAdmin, validateQuery(listAdsQuerySchema), adsController.listAllAdsAdmin);
router.post('/:id/approve', authenticate, requireAdmin, validateParams(z.object({ id: z.string() })), adsController.approveAd);
router.post('/:id/reject', authenticate, requireAdmin, validateParams(z.object({ id: z.string() })), validateBody(z.object({ reason: z.string().optional() })), adsController.rejectAd);

// Public routes with optional authentication (for personalized isFavorite field)
router.get('/', optionalAuthenticate, validateQuery(listAdsQuerySchema), adsController.listAds);
router.get('/reels', optionalAuthenticate, validateQuery(listAdsQuerySchema), adsController.listReelsAds);
router.get(
  '/reels/:id',
  optionalAuthenticate,
  validateParams(z.object({ id: z.string() })),
  adsController.getReelById
);
router.get(
  '/seller/:sellerId',
  optionalAuthenticate,
  validateParams(z.object({ sellerId: z.string() })),
  validateQuery(listAdsQuerySchema.pick({ page: true, limit: true, sort: true })),
  adsController.listAdsBySeller
);

// Protected routes - must come before /:id to avoid route conflict
router.get('/me', authenticate, validateQuery(listAdsQuerySchema.pick({ page: true, limit: true, sort: true })), adsController.listMyAds);

// Public route with optional authentication - must come after /me
router.get('/:id', optionalAuthenticate, validateParams(z.object({ id: z.string() })), adsController.getAd);

// Protected routes
router.post('/', authenticate, validateBody(createAdSchema), adsController.createAd);
router.patch(
  '/:id',
  authenticate,
  validateParams(z.object({ id: z.string() })),
  validateBody(updateAdSchema),
  adsController.updateAd
);
router.patch(
  '/:id/status',
  authenticate,
  validateParams(z.object({ id: z.string() })),
  validateBody(updateAdStatusSchema),
  adsController.updateAdStatus
);
router.delete(
  '/:id',
  authenticate,
  validateParams(z.object({ id: z.string() })),
  adsController.deleteAd
);

export default router;
