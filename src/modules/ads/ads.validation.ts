import { z } from 'zod';
import { AD_CONDITIONS, AD_STATUS } from '@common/constants.js';

const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  address: z.string().optional(),
});

export const createAdSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  price: z.number().min(0),
  currency: z.string().default('PKR'),
  category: z.string().min(1, 'Category is required'),
  condition: z.enum([AD_CONDITIONS.NEW, AD_CONDITIONS.USED]),
  photoUrls: z.array(z.string().url()).max(5),
  videoUrl: z.string().url().optional(),
  location: locationSchema,
});

export const updateAdSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(2000).optional(),
  price: z.number().min(0).optional(),
  currency: z.string().optional(),
  category: z.string().min(1).optional(),
  condition: z.enum([AD_CONDITIONS.NEW, AD_CONDITIONS.USED]).optional(),
  photoUrls: z.array(z.string().url()).max(5).optional(),
  videoUrl: z.string().url().optional(),
  location: locationSchema.optional(),
});

export const updateAdStatusSchema = z.object({
  status: z.enum([AD_STATUS.ACTIVE, AD_STATUS.PENDING, AD_STATUS.SOLD, AD_STATUS.ARCHIVED, AD_STATUS.REJECTED]),
});

export const listAdsQuerySchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(0).optional(), // in kilometers
  search: z.string().optional(),
  sort: z.enum(['recent', 'price_asc', 'price_desc', 'views']).default('recent'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateAdDto = z.infer<typeof createAdSchema>;
export type UpdateAdDto = z.infer<typeof updateAdSchema>;
export type UpdateAdStatusDto = z.infer<typeof updateAdStatusSchema>;
export type ListAdsQueryDto = z.infer<typeof listAdsQuerySchema>;
