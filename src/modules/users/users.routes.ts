import { Router } from 'express';
import * as usersController from './users.controller.js';
import { authenticate } from '@middleware/auth.js';
import { validateBody, validateParams } from '@middleware/validation.js';
import { updateProfileSchema, updatePreferencesSchema } from './users.validation.js';
import { z } from 'zod';

const router = Router();

// Protected routes
router.get('/me', authenticate, usersController.getProfile);
router.patch('/me', authenticate, validateBody(updateProfileSchema), usersController.updateProfile);
router.get('/me/preferences', authenticate, usersController.getPreferences);
router.patch(
  '/me/preferences',
  authenticate,
  validateBody(updatePreferencesSchema),
  usersController.updatePreferences
);

// Public routes
router.get('/:id', validateParams(z.object({ id: z.string() })), usersController.getSellerProfile);

export default router;
