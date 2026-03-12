import { Like, LikeDocument } from '@models/like.model.js';
import { Comment, CommentDocument } from '@models/comment.model.js';
import { Follow, FollowDocument } from '@models/follow.model.js';
import { Ad } from '@models/ad.model.js';
import mongoose from 'mongoose';

// Likes
export const createLike = async (userId: string, adId: string): Promise<LikeDocument> => {
  const like = new Like({
    user: new mongoose.Types.ObjectId(userId),
    ad: new mongoose.Types.ObjectId(adId),
  });
  return await like.save();
};

export const deleteLike = async (userId: string, adId: string): Promise<boolean> => {
  const result = await Like.findOneAndDelete({
    user: new mongoose.Types.ObjectId(userId),
    ad: new mongoose.Types.ObjectId(adId),
  });
  return result !== null;
};

export const findLike = async (userId: string, adId: string): Promise<LikeDocument | null> => {
  return await Like.findOne({
    user: new mongoose.Types.ObjectId(userId),
    ad: new mongoose.Types.ObjectId(adId),
  });
};

export const countLikesByAd = async (adId: string): Promise<number> => {
  return await Like.countDocuments({ ad: new mongoose.Types.ObjectId(adId) });
};

export const incrementAdLikes = async (adId: string): Promise<void> => {
  await Ad.findByIdAndUpdate(adId, { $inc: { likesCount: 1 } });
};

export const decrementAdLikes = async (adId: string): Promise<void> => {
  await Ad.findByIdAndUpdate(adId, { $inc: { likesCount: -1 } });
};

// Comments
export const createComment = async (
  adId: string,
  userId: string,
  text: string,
  parentCommentId?: string
): Promise<CommentDocument> => {
  const comment = new Comment({
    ad: new mongoose.Types.ObjectId(adId),
    user: new mongoose.Types.ObjectId(userId),
    text,
    parentComment: parentCommentId ? new mongoose.Types.ObjectId(parentCommentId) : null,
  });
  return await comment.save();
};

export const deleteComment = async (commentId: string): Promise<boolean> => {
  const result = await Comment.findByIdAndDelete(commentId);
  return result !== null;
};

export const findCommentById = async (commentId: string): Promise<CommentDocument | null> => {
  return await Comment.findById(commentId);
};

export const listCommentsByAd = async (
  adId: string,
  page: number,
  limit: number,
  sort: 'recent' | 'oldest'
): Promise<{ comments: CommentDocument[]; total: number }> => {
  const skip = (page - 1) * limit;
  const sortOption = sort === 'recent' ? { createdAt: -1 } : { createdAt: 1 };

  const [comments, total] = await Promise.all([
    Comment.find({ ad: new mongoose.Types.ObjectId(adId), parentComment: null })
      .sort(sortOption as any)
      .skip(skip)
      .limit(limit)
      .populate('user', 'name avatarUrl username'),
    Comment.countDocuments({ ad: new mongoose.Types.ObjectId(adId), parentComment: null }),
  ]);

  return { comments, total };
};

export const incrementAdComments = async (adId: string): Promise<void> => {
  await Ad.findByIdAndUpdate(adId, { $inc: { commentsCount: 1 } });
};

export const decrementAdComments = async (adId: string): Promise<void> => {
  await Ad.findByIdAndUpdate(adId, { $inc: { commentsCount: -1 } });
};

// Follows
export const createFollow = async (
  followerId: string,
  followedId: string
): Promise<FollowDocument> => {
  const follow = new Follow({
    follower: new mongoose.Types.ObjectId(followerId),
    followed: new mongoose.Types.ObjectId(followedId),
  });
  return await follow.save();
};

export const deleteFollow = async (followerId: string, followedId: string): Promise<boolean> => {
  const result = await Follow.findOneAndDelete({
    follower: new mongoose.Types.ObjectId(followerId),
    followed: new mongoose.Types.ObjectId(followedId),
  });
  return result !== null;
};

export const findFollow = async (
  followerId: string,
  followedId: string
): Promise<FollowDocument | null> => {
  return await Follow.findOne({
    follower: new mongoose.Types.ObjectId(followerId),
    followed: new mongoose.Types.ObjectId(followedId),
  });
};

export const listFollowers = async (
  userId: string,
  page: number,
  limit: number
): Promise<{ followers: FollowDocument[]; total: number }> => {
  const skip = (page - 1) * limit;

  const [followers, total] = await Promise.all([
    Follow.find({ followed: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('follower', 'name avatarUrl username'),
    Follow.countDocuments({ followed: new mongoose.Types.ObjectId(userId) }),
  ]);

  return { followers, total };
};

export const listFollowing = async (
  userId: string,
  page: number,
  limit: number
): Promise<{ following: FollowDocument[]; total: number }> => {
  const skip = (page - 1) * limit;

  const [following, total] = await Promise.all([
    Follow.find({ follower: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('followed', 'name avatarUrl username'),
    Follow.countDocuments({ follower: new mongoose.Types.ObjectId(userId) }),
  ]);

  return { following, total };
};

export const countFollowers = async (userId: string): Promise<number> => {
  return await Follow.countDocuments({ followed: new mongoose.Types.ObjectId(userId) });
};

export const countFollowing = async (userId: string): Promise<number> => {
  return await Follow.countDocuments({ follower: new mongoose.Types.ObjectId(userId) });
};
