import { Router } from 'express';
import * as categoriesController from './categories.controller.js';
import { authenticate } from '@middleware/auth.js';
import { requireRole } from '@middleware/role.js';
import { USER_ROLES } from '@common/constants.js';

const router = Router();

/**
 * Public routes (for mobile app)
 */
// Get all active categories
router.get('/', categoriesController.getActiveCategories);

/**
 * Admin routes (protected)
 */
// Get categories list with filters
router.get('/admin', authenticate, requireRole(USER_ROLES.ADMIN), categoriesController.getCategoriesList);

// Get category by ID
router.get('/admin/:id', authenticate, requireRole(USER_ROLES.ADMIN), categoriesController.getCategoryById);

// Create new category
router.post('/admin', authenticate, requireRole(USER_ROLES.ADMIN), categoriesController.createCategory);

// Update category
router.patch('/admin/:id', authenticate, requireRole(USER_ROLES.ADMIN), categoriesController.updateCategory);

// Toggle category status
router.patch(
  '/admin/:id/toggle-status',
  authenticate,
  requireRole(USER_ROLES.ADMIN),
  categoriesController.toggleCategoryStatus
);

// Delete category
router.delete('/admin/:id', authenticate, requireRole(USER_ROLES.ADMIN), categoriesController.deleteCategory);

export default router;
