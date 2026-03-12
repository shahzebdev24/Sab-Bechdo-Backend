import { z } from 'zod';
import { OFFER_STATUS } from '@models/offer.model.js';

export const createOfferSchema = z.object({
  adId: z.string(),
  amount: z.number().min(1).max(1000000000), // Reasonable max
  message: z.string().max(500).optional(),
});

export const updateOfferStatusSchema = z.object({
  status: z.enum([OFFER_STATUS.ACCEPTED, OFFER_STATUS.REJECTED, OFFER_STATUS.CANCELLED]),
});

export const listOffersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateOfferDto = z.infer<typeof createOfferSchema>;
export type UpdateOfferStatusDto = z.infer<typeof updateOfferStatusSchema>;
export type ListOffersQueryDto = z.infer<typeof listOffersQuerySchema>;
