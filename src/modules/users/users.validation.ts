import { z } from 'zod';

const locationSchema = z.object({
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores')
    .optional(),
  phone: z.string().min(10).max(20).optional(),
  location: locationSchema.optional(),
});

export const updatePreferencesSchema = z.object({
  notifications: z
    .object({
      chat: z.boolean().optional(),
      likes: z.boolean().optional(),
      comments: z.boolean().optional(),
      follows: z.boolean().optional(),
      system: z.boolean().optional(),
      newUserRegistration: z.boolean().optional(), // Admin-only notification
      newAdUpload: z.boolean().optional(), // Admin-only notification
    })
    .optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
});

export const topSellersQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(20).default(4),
});

export interface TopSellerResponse {
  id: string;
  name: string;
  avatarUrl?: string;
  location?: string;
  activeAdsCount: number;
  totalViews: number;
}

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesDto = z.infer<typeof updatePreferencesSchema>;
export type TopSellersQueryDto = z.infer<typeof topSellersQuerySchema>;
