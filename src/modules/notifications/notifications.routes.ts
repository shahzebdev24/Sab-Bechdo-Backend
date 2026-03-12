import { Router } from 'express';
import * as notificationsController from './notifications.controller.js';
import { authenticate } from '@middleware/auth.js';
import { validateBody, validateQuery } from '@middleware/validation.js';
import { listNotificationsQuerySchema, markAsReadSchema } from './notifications.validation.js';

const router = Router();

// All notification routes require authentication
router.get(
  '/',
  authenticate,
  validateQuery(listNotificationsQuerySchema),
  notificationsController.listNotifications
);

router.get('/unread-count', authenticate, notificationsController.getUnreadCount);

router.post(
  '/read',
  authenticate,
  validateBody(markAsReadSchema),
  notificationsController.markAsRead
);

router.post('/read-all', authenticate, notificationsController.markAllAsRead);

export default router;
