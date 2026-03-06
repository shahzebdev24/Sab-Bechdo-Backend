import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validateBody } from '@middleware/validation.js';
import { authenticate } from '@middleware/auth.js';
import { authLimiter } from '@middleware/rate-limit.js';
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  firebaseAuthSchema,
} from './auth.validation.js';

const router = Router();

router.post('/signup', authLimiter, validateBody(signupSchema), authController.signup);

router.post('/login', authLimiter, validateBody(loginSchema), authController.login);

router.post(
  '/forgot-password',
  authLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  authLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

router.post('/refresh-token', validateBody(refreshTokenSchema), authController.refreshToken);

router.post('/firebase', authLimiter, validateBody(firebaseAuthSchema), authController.firebaseAuth);

router.get('/profile', authenticate, authController.getProfile);

router.post('/logout', authenticate, authController.logout);

export default router;
