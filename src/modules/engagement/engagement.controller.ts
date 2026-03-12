import { Request, Response, NextFunction } from 'express';
import * as engagementService from './engagement.service.js';
import { sendSuccess } from '@core/http/response.js';
import { BadRequestError } from '@core/errors/app-error.js';
import {
  CreateCommentDto,
  ListCommentsQueryDto,
  ListFollowsQueryDto,
} from './engagement.validation.js';

// Likes
export const likeAd = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { adId } = req.params;
    if (typeof adId !== 'string') {
      throw new BadRequestError('Invalid ad ID');
    }
    const userId = req.user!.userId;
    const result = await engagementService.likeAd(userId, adId);
    sendSuccess(res, result, 'Ad liked successfully');
  } catch (error) {
    next(error);
  }
};

export const unlikeAd = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { adId } = req.params;
    if (typeof adId !== 'string') {
      throw new BadRequestError('Invalid ad ID');
    }
    const userId = req.user!.userId;
    const result = await engagementService.unlikeAd(userId, adId);
    sendSuccess(res, result, 'Ad unliked successfully');
  } catch (error) {
    next(error);
  }
};

export const getLikeCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { adId } = req.params;
    if (typeof adId !== 'string') {
      throw new BadRequestError('Invalid ad ID');
    }
    const result = await engagementService.getLikeCount(adId);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const checkIfLiked = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { adId } = req.params;
    if (typeof adId !== 'string') {
      throw new BadRequestError('Invalid ad ID');
    }
    const userId = req.user!.userId;
    const result = await engagementService.checkIfLiked(userId, adId);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// Comments
export const createComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { adId } = req.params;
    if (typeof adId !== 'string') {
      throw new BadRequestError('Invalid ad ID');
    }
    const userId = req.user!.userId;
    const data: CreateCommentDto = req.body;
    const comment = await engagementService.createComment(adId, userId, data);
    sendSuccess(res, comment, 'Comment added successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { commentId } = req.params;
    if (typeof commentId !== 'string') {
      throw new BadRequestError('Invalid comment ID');
    }
    const userId = req.user!.userId;
    await engagementService.deleteComment(commentId, userId);
    sendSuccess(res, null, 'Comment deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const listComments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { adId } = req.params;
    if (typeof adId !== 'string') {
      throw new BadRequestError('Invalid ad ID');
    }
    const query: ListCommentsQueryDto = req.query as unknown as ListCommentsQueryDto;
    const result = await engagementService.listComments(adId, query);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// Follows
export const followUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    if (typeof userId !== 'string') {
      throw new BadRequestError('Invalid user ID');
    }
    const followerId = req.user!.userId;
    const result = await engagementService.followUser(followerId, userId);
    sendSuccess(res, result, 'User followed successfully');
  } catch (error) {
    next(error);
  }
};

export const unfollowUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    if (typeof userId !== 'string') {
      throw new BadRequestError('Invalid user ID');
    }
    const followerId = req.user!.userId;
    const result = await engagementService.unfollowUser(followerId, userId);
    sendSuccess(res, result, 'User unfollowed successfully');
  } catch (error) {
    next(error);
  }
};

export const listFollowers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    if (typeof userId !== 'string') {
      throw new BadRequestError('Invalid user ID');
    }
    const query: ListFollowsQueryDto = req.query as unknown as ListFollowsQueryDto;
    const result = await engagementService.listFollowers(userId, query);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const listFollowing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    if (typeof userId !== 'string') {
      throw new BadRequestError('Invalid user ID');
    }
    const query: ListFollowsQueryDto = req.query as unknown as ListFollowsQueryDto;
    const result = await engagementService.listFollowing(userId, query);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const checkIfFollowing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    if (typeof userId !== 'string') {
      throw new BadRequestError('Invalid user ID');
    }
    const followerId = req.user!.userId;
    const result = await engagementService.checkIfFollowing(followerId, userId);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getFollowStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    if (typeof userId !== 'string') {
      throw new BadRequestError('Invalid user ID');
    }
    const result = await engagementService.getFollowStats(userId);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
