import { z } from 'zod';

export const wishlistQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type WishlistQueryDto = z.infer<typeof wishlistQuerySchema>;
