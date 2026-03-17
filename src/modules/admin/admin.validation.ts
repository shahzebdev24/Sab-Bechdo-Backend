import { z } from 'zod';

// ============================================
// DASHBOARD VALIDATION SCHEMAS
// ============================================

/**
 * Dashboard Statistics Query Schema
 * Validates query parameters for dashboard stats endpoint
 */
export const dashboardStatsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

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

// ============================================
// EXPORTED DTOS
// ============================================

export type DashboardStatsQueryDto = z.infer<typeof dashboardStatsQuerySchema>;
export type GetUsersQueryDto = z.infer<typeof getUsersQuerySchema>;
export type CreateUserBodyDto = z.infer<typeof createUserBodySchema>;
export type UpdateUserBodyDto = z.infer<typeof updateUserBodySchema>;
export type UserIdParamDto = z.infer<typeof userIdParamSchema>;

// ============================================
// NOTIFICATIONS VALIDATION SCHEMAS
// ============================================

/**
 * Send system notification body schema
 */
export const sendSystemNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must not exceed 100 characters'),
  body: z.string().min(1, 'Body is required').max(500, 'Body must not exceed 500 characters'),
  data: z.record(z.unknown()).optional(),
});

export type SendSystemNotificationDto = z.infer<typeof sendSystemNotificationSchema>;
