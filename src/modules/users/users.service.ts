import * as usersRepository from './users.repository.js';
import * as adsRepository from '../ads/ads.repository.js';
import * as reviewsRepository from '../reviews/reviews.repository.js';
import { UpdateProfileDto } from './users.validation.js';
import { NotFoundError, ConflictError } from '@core/errors/app-error.js';
import { UserDocument } from '@models/user.model.js';
import { AD_STATUS } from '@common/constants.js';

export interface SellerStats {
  activeAds: number;
  soldItems: number;
  totalAds: number;
  rating: number;
  totalReviews: number;
}

export interface SellerProfileResponse {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  username?: string;
  joinedAt: Date;
  stats: SellerStats;
}

export const getProfile = async (userId: string): Promise<UserDocument> => {
  const user = await usersRepository.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
};

export const updateProfile = async (
  userId: string,
  data: UpdateProfileDto
): Promise<UserDocument> => {
  try {
    const updatedUser = await usersRepository.updateProfile(userId, data);
    if (!updatedUser) {
      throw new NotFoundError('User not found');
    }
    return updatedUser;
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      throw new ConflictError('Username already taken');
    }
    throw error;
  }
};

export const getPreferences = async (userId: string) => {
  const user = await usersRepository.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Return preferences with defaults
  return {
    notifications: {
      chat: user.preferences?.notifications?.chat ?? true,
      likes: user.preferences?.notifications?.likes ?? true,
      comments: user.preferences?.notifications?.comments ?? true,
      follows: user.preferences?.notifications?.follows ?? true,
      system: user.preferences?.notifications?.system ?? true,
      newUserRegistration: user.preferences?.notifications?.newUserRegistration ?? false, // Admin-only, default false
      newAdUpload: user.preferences?.notifications?.newAdUpload ?? false, // Admin-only, default false
    },
    theme: user.preferences?.theme ?? 'system',
    language: user.preferences?.language ?? 'en',
  };
};

export const updatePreferences = async (
  userId: string,
  preferences: Partial<{
    notifications: Partial<{
      chat: boolean;
      likes: boolean;
      comments: boolean;
      follows: boolean;
      system: boolean;
      newUserRegistration: boolean; // Admin-only
      newAdUpload: boolean; // Admin-only
    }>;
    theme: 'light' | 'dark' | 'system';
    language: string;
  }>
) => {
  const user = await usersRepository.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Update using repository with proper nested field updates
  const updatedUser = await usersRepository.updatePreferences(userId, preferences);
  if (!updatedUser) {
    throw new NotFoundError('User not found');
  }

  // Return only preferences
  return {
    notifications: {
      chat: updatedUser.preferences?.notifications?.chat ?? true,
      likes: updatedUser.preferences?.notifications?.likes ?? true,
      comments: updatedUser.preferences?.notifications?.comments ?? true,
      follows: updatedUser.preferences?.notifications?.follows ?? true,
      system: updatedUser.preferences?.notifications?.system ?? true,
      newUserRegistration: updatedUser.preferences?.notifications?.newUserRegistration ?? false, // Admin-only
      newAdUpload: updatedUser.preferences?.notifications?.newAdUpload ?? false, // Admin-only
    },
    theme: updatedUser.preferences?.theme ?? 'system',
    language: updatedUser.preferences?.language ?? 'en',
  };
};

export const getSellerProfile = async (sellerId: string): Promise<SellerProfileResponse> => {
  const user = await usersRepository.findByIdPublic(sellerId);
  if (!user) {
    throw new NotFoundError('Seller not found');
  }

  // Get stats
  const [activeAds, soldItems, totalAds, reviewStats] = await Promise.all([
    adsRepository.countByOwner(sellerId, AD_STATUS.ACTIVE),
    adsRepository.countByOwner(sellerId, AD_STATUS.SOLD),
    adsRepository.countByOwner(sellerId),
    reviewsRepository.getSellerRating(sellerId),
  ]);

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    username: user.username,
    joinedAt: user.createdAt,
    stats: {
      activeAds,
      soldItems,
      totalAds,
      rating: reviewStats.averageRating,
      totalReviews: reviewStats.totalReviews,
    },
  };
};
