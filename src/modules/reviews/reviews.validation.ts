import { z } from 'zod';

export const createReviewSchema = z.object({
  sellerId: z.string(),
  adId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateReviewDto = z.infer<typeof createReviewSchema>;
export type ListReviewsQueryDto = z.infer<typeof listReviewsQuerySchema>;
