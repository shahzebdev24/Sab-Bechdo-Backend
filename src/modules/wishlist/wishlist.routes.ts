import { Router } from 'express';
import * as wishlistController from './wishlist.controller.js';
import { authenticate } from '@middleware/auth.js';
import { validateQuery, validateParams } from '@middleware/validation.js';
import { wishlistQuerySchema } from './wishlist.validation.js';
import { z } from 'zod';

const router = Router();

// All wishlist routes require authentication
router.get('/', authenticate, validateQuery(wishlistQuerySchema), wishlistController.getWishlist);
router.post(
  '/:adId',
  authenticate,
  validateParams(z.object({ adId: z.string() })),
  wishlistController.addToWishlist
);
router.delete(
  '/:adId',
  authenticate,
  validateParams(z.object({ adId: z.string() })),
  wishlistController.removeFromWishlist
);

export default router;
