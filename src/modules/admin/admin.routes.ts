import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { authenticate } from '@middleware/auth.js';
import { requireAdmin } from '@middleware/admin.js';
import { validateQuery, validateBody, validateParams } from '@middleware/validation.js';
import {
  dashboardStatsQuerySchema,
  getUsersQuerySchema,
  createUserBodySchema,
  updateUserBodySchema,
  userIdParamSchema,
} from './admin.validation.js';

const router = Router();

/**
 * Dashboard Statistics Routes
 * All routes require authentication and admin role
 */

// GET /api/v1/admin/dashboard/stats - Get dashboard statistics
router.get(
  '/dashboard/stats',
  authenticate,
  requireAdmin,
  validateQuery(dashboardStatsQuerySchema),
  adminController.getDashboardStats
);

/**
 * User Management Routes
 * All routes require authentication and admin role
 */

// GET /api/v1/admin/users - Get users list with filters
router.get(
  '/users',
  authenticate,
  requireAdmin,
  validateQuery(getUsersQuerySchema),
  adminController.getUsersList
);

// GET /api/v1/admin/users/:id - Get user by ID
router.get(
  '/users/:id',
  authenticate,
  requireAdmin,
  validateParams(userIdParamSchema),
  adminController.getUserById
);

// POST /api/v1/admin/users - Create new user
router.post(
  '/users',
  authenticate,
  requireAdmin,
  validateBody(createUserBodySchema),
  adminController.createUser
);

// PATCH /api/v1/admin/users/:id - Update user
router.patch(
  '/users/:id',
  authenticate,
  requireAdmin,
  validateParams(userIdParamSchema),
  validateBody(updateUserBodySchema),
  adminController.updateUser
);

// PATCH /api/v1/admin/users/:id/block - Block user
router.patch(
  '/users/:id/block',
  authenticate,
  requireAdmin,
  validateParams(userIdParamSchema),
  adminController.blockUser
);

// PATCH /api/v1/admin/users/:id/unblock - Unblock user
router.patch(
  '/users/:id/unblock',
  authenticate,
  requireAdmin,
  validateParams(userIdParamSchema),
  adminController.unblockUser
);

export default router;
