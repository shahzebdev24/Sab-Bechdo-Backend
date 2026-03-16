import { z } from 'zod';

/**
 * Dashboard Statistics Query Schema
 * Validates query parameters for dashboard stats endpoint
 */
export const dashboardStatsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type DashboardStatsQueryDto = z.infer<typeof dashboardStatsQuerySchema>;

// ============================================
// USER MANAGEMENT VALIDATION SCHEMAS
// ============================================

/**
 * Get users list query schema
 */
export const getUsersQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'blocked', 'all']).optional(),
  role: z.enum(['customer', 'admin', 'all']).optional(),
  sortBy: z.enum(['createdAt', 'name', 'email', 'updatedAt', 'lastLoginAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
});

/**
 * Create user body schema
 */
export const createUserBodySchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['customer', 'admin']),
  phone: z.string().optional(),
});

/**
 * Update user body schema
 */
export const updateUserBodySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['customer', 'admin']).optional(),
  phone: z.string().optional(),
});

/**
 * User ID param schema
 */
export const userIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
});
