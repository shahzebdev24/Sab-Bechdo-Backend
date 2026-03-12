import { Router } from 'express';
import * as reviewsController from './reviews.controller.js';
import { authenticate } from '@middleware/auth.js';
import { validateBody, validateQuery, validateParams } from '@middleware/validation.js';
import { createReviewSchema, listReviewsQuerySchema } from './reviews.validation.js';
import { z } from 'zod';

const router = Router();

// Protected routes
router.post('/', authenticate, validateBody(createReviewSchema), reviewsController.createReview);

// Public routes
router.get(
  '/seller/:sellerId',
  validateParams(z.object({ sellerId: z.string() })),
  validateQuery(listReviewsQuerySchema),
  reviewsController.getSellerReviews
);

export default router;
