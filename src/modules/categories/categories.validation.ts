import { z } from 'zod';

/**
 * Get categories list query validation
 */
export const getCategoriesListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  search: z.string().trim().optional(),
  status: z.enum(['active', 'inactive', 'all']).optional().default('all'),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'itemCount']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type GetCategoriesListQueryDto = z.infer<typeof getCategoriesListQuerySchema>;

/**
 * Create category validation
 */
export const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name is too long'),
  description: z.string().trim().max(500, 'Description is too long').optional(),
  icon: z.string().trim().max(100, 'Icon name is too long').optional(),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;

/**
 * Update category validation
 */
export const updateCategorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name is too long').optional(),
  description: z.string().trim().max(500, 'Description is too long').optional(),
  icon: z.string().trim().max(100, 'Icon name is too long').optional(),
});

export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;

/**
 * Category ID param validation
 */
export const categoryIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
});

export type CategoryIdParamDto = z.infer<typeof categoryIdParamSchema>;
