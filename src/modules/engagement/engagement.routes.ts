import { Router } from 'express';
import * as engagementController from './engagement.controller.js';
import { authenticate } from '@middleware/auth.js';
import { validateBody, validateQuery, validateParams } from '@middleware/validation.js';
import {
  createCommentSchema,
  listCommentsQuerySchema,
  listFollowsQuerySchema,
} from './engagement.validation.js';
import { z } from 'zod';

const router = Router();

// Likes
router.post(
  '/likes/:adId',
  authenticate,
  validateParams(z.object({ adId: z.string() })),
  engagementController.likeAd
);
router.delete(
  '/likes/:adId',
  authenticate,
  validateParams(z.object({ adId: z.string() })),
  engagementController.unlikeAd
);
router.get(
  '/likes/:adId/count',
  validateParams(z.object({ adId: z.string() })),
  engagementController.getLikeCount
);
router.get(
  '/likes/:adId/check',
  authenticate,
  validateParams(z.object({ adId: z.string() })),
  engagementController.checkIfLiked
);

// Comments
router.get(
  '/comments/ad/:adId',
  validateParams(z.object({ adId: z.string() })),
  validateQuery(listCommentsQuerySchema),
  engagementController.listComments
);
router.post(
  '/comments/ad/:adId',
  authenticate,
  validateParams(z.object({ adId: z.string() })),
  validateBody(createCommentSchema),
  engagementController.createComment
);
router.delete(
  '/comments/:commentId',
  authenticate,
  validateParams(z.object({ commentId: z.string() })),
  engagementController.deleteComment
);

// Follows
router.post(
  '/follows/:userId',
  authenticate,
  validateParams(z.object({ userId: z.string() })),
  engagementController.followUser
);
router.delete(
  '/follows/:userId',
  authenticate,
  validateParams(z.object({ userId: z.string() })),
  engagementController.unfollowUser
);
router.get(
  '/follows/:userId/followers',
  validateParams(z.object({ userId: z.string() })),
  validateQuery(listFollowsQuerySchema),
  engagementController.listFollowers
);
router.get(
  '/follows/:userId/following',
  validateParams(z.object({ userId: z.string() })),
  validateQuery(listFollowsQuerySchema),
  engagementController.listFollowing
);
router.get(
  '/follows/:userId/check',
  authenticate,
  validateParams(z.object({ userId: z.string() })),
  engagementController.checkIfFollowing
);
router.get(
  '/follows/:userId/stats',
  validateParams(z.object({ userId: z.string() })),
  engagementController.getFollowStats
);

export default router;
