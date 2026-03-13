import { Router } from 'express';
import * as chatController from './chat.controller.js';
import { authenticate } from '@middleware/auth.js';
import { validateBody, validateQuery, validateParams } from '@middleware/validation.js';
import {
  createConversationSchema,
  listConversationsQuerySchema,
  listMessagesQuerySchema,
} from './chat.validation.js';
import { z } from 'zod';

const router = Router();

// All chat routes require authentication
router.get(
  '/conversations',
  authenticate,
  validateQuery(listConversationsQuerySchema),
  chatController.listConversations
);

router.post(
  '/conversations',
  authenticate,
  validateBody(createConversationSchema),
  chatController.createOrGetConversation
);

router.get(
  '/conversations/:id',
  authenticate,
  validateParams(z.object({ id: z.string() })),
  chatController.getConversation
);

router.get(
  '/conversations/:id/messages',
  authenticate,
  validateParams(z.object({ id: z.string() })),
  validateQuery(listMessagesQuerySchema),
  chatController.listMessages
);

router.post(
  '/conversations/:id/read',
  authenticate,
  validateParams(z.object({ id: z.string() })),
  chatController.markAsRead
);

router.get(
  '/unread-counts',
  authenticate,
  chatController.getUnreadCounts
);

export default router;
