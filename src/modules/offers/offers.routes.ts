import { Router } from 'express';
import * as offersController from './offers.controller.js';
import { authenticate } from '@middleware/auth.js';
import { validateBody, validateQuery, validateParams } from '@middleware/validation.js';
import {
  createOfferSchema,
  updateOfferStatusSchema,
  listOffersQuerySchema,
} from './offers.validation.js';
import { z } from 'zod';

const router = Router();

// All offer routes require authentication
router.post('/', authenticate, validateBody(createOfferSchema), offersController.createOffer);

router.get(
  '/sent',
  authenticate,
  validateQuery(listOffersQuerySchema),
  offersController.listSentOffers
);

router.get(
  '/received',
  authenticate,
  validateQuery(listOffersQuerySchema),
  offersController.listReceivedOffers
);

router.get(
  '/ad/:adId',
  authenticate,
  validateParams(z.object({ adId: z.string() })),
  validateQuery(listOffersQuerySchema),
  offersController.listOffersByAd
);

router.patch(
  '/:offerId/status',
  authenticate,
  validateParams(z.object({ offerId: z.string() })),
  validateBody(updateOfferStatusSchema),
  offersController.updateOfferStatus
);

export default router;
