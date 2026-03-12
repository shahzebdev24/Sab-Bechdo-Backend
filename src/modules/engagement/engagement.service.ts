import * as engagementRepository from './engagement.repository.js';
import * as adsRepository from '../ads/ads.repository.js';
import { NotFoundError, BadRequestError } from '@core/errors/app-error.js';
import { CommentDocument } from '@models/comment.model.js';
import { FollowDocument } from '@models/follow.model.js';
import { CreateCommentDto, ListCommentsQueryDto, ListFollowsQueryDto } from './engagement.validation.js';
import * as notificationsService from '@modules/notifications/notifications.service.js';
import { User } from '@models/user.model.js';

// Likes
export const likeAd = async (userId: string, adId: string): Promise<{ liked: boolean }> => {
  const ad = await adsRepository.findById(adId);
  if (!ad) {
    throw new NotFoundError('Ad not found');
  }

  const existingLike = await engagementRepository.findLike(userId, adId);
  if (existingLike) {
    return { liked: true }; // Already liked, idempotent
  }

  await engagementRepository.createLike(userId, adId);
  await engagementRepository.incrementAdLikes(adId);

  // Notification will be created by notifications service
  return { liked: true };
};

export const unlikeAd = async (userId: string, adId: string): Promise<{ unliked: boolean }> => {
  const deleted = await engagementRepository.deleteLike(userId, adId);
  if (deleted) {
    await engagementRepository.decrementAdLikes(adId);
  }
  return { unliked: deleted };
};

export const getLikeCount = async (adId: string): Promise<{ count: number }> => {
  const count = await engagementRepository.countLikesByAd(adId);
  return { count };
};

export const checkIfLiked = async (userId: string, adId: string): Promise<{ isLiked: boolean }> => {
  const like = await engagementRepository.findLike(userId, adId);
  return { isLiked: like !== null };
};

// Comments
export const createComment = async (
  adId: string,
  userId: string,
  data: CreateCommentDto
): Promise<CommentDocument> => {
  const ad = await adsRepository.findById(adId);
  if (!ad) {
    throw new NotFoundError('Ad not found');
  }

  // Sanitize text (basic XSS prevention)
  const sanitizedText = data.text.replace(/<[^>]*>/g, '').trim();
  if (!sanitizedText) {
    throw new BadRequestError('Comment text cannot be empty');
  }

  // Validate parent comment if provided
  if (data.parentCommentId) {
    const parentComment = await engagementRepository.findCommentById(data.parentCommentId);
    if (!parentComment || parentComment.ad.toString() !== adId) {
      throw new BadRequestError('Invalid parent comment');
    }
  }

  const comment = await engagementRepository.createComment(
    adId,
    userId,
    sanitizedText,
    data.parentCommentId
  );

  await engagementRepository.incrementAdComments(adId);

  return comment;
};

export const deleteComment = async (commentId: string, userId: string): Promise<void> => {
  const comment = await engagementRepository.findCommentById(commentId);
  if (!comment) {
    throw new NotFoundError('Comment not found');
  }

  if (comment.user.toString() !== userId) {
    throw new BadRequestError('You can only delete your own comments');
  }

  const deleted = await engagementRepository.deleteComment(commentId);
  if (deleted) {
    await engagementRepository.decrementAdComments(comment.ad.toString());
  }
};

export const listComments = async (
  adId: string,
  query: ListCommentsQueryDto
): Promise<{
  comments: CommentDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const { page, limit, sort } = query;
  const { comments, total } = await engagementRepository.listCommentsByAd(adId, page, limit, sort);

  return {
    comments,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// Follows
export const followUser = async (
  followerId: string,
  followedId: string
): Promise<{ followed: boolean }> => {
  if (followerId === followedId) {
    throw new BadRequestError('You cannot follow yourself');
  }

  const existingFollow = await engagementRepository.findFollow(followerId, followedId);
  if (existingFollow) {
    return { followed: true }; // Already following, idempotent
  }

  await engagementRepository.createFollow(followerId, followedId);
  return { followed: true };
};

export const unfollowUser = async (
  followerId: string,
  followedId: string
): Promise<{ unfollowed: boolean }> => {
  const deleted = await engagementRepository.deleteFollow(followerId, followedId);
  return { unfollowed: deleted };
};

export const listFollowers = async (
  userId: string,
  query: ListFollowsQueryDto
): Promise<{
  followers: FollowDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const { page, limit } = query;
  const { followers, total } = await engagementRepository.listFollowers(userId, page, limit);

  return {
    followers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const listFollowing = async (
  userId: string,
  query: ListFollowsQueryDto
): Promise<{
  following: FollowDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const { page, limit } = query;
  const { following, total } = await engagementRepository.listFollowing(userId, page, limit);

  return {
    following,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const checkIfFollowing = async (
  followerId: string,
  followedId: string
): Promise<{ isFollowing: boolean }> => {
  const follow = await engagementRepository.findFollow(followerId, followedId);
  return { isFollowing: follow !== null };
};

export const getFollowStats = async (
  userId: string
): Promise<{ followersCount: number; followingCount: number }> => {
  const [followersCount, followingCount] = await Promise.all([
    engagementRepository.countFollowers(userId),
    engagementRepository.countFollowing(userId),
  ]);

  return { followersCount, followingCount };
};
