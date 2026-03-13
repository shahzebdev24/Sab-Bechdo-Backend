import * as wishlistRepository from './wishlist.repository.js';
import * as adsRepository from '../ads/ads.repository.js';
import { NotFoundError } from '@core/errors/app-error.js';
import { WishlistQueryDto } from './wishlist.validation.js';
import { AdMapper, AdResponse } from '@common/mappers/ad.mapper.js';
import * as notificationsService from '@modules/notifications/notifications.service.js';
import { User } from '@models/user.model.js';

export const addToWishlist = async (userId: string, adId: string): Promise<void> => {
  // Check if ad exists
  const ad = await adsRepository.findById(adId);
  if (!ad) {
    throw new NotFoundError('Ad not found');
  }

  // Check if already in wishlist
  const existingWishlist = await wishlistRepository.findWishlistItem(userId, adId);
  if (existingWishlist) {
    return; // Already in wishlist, idempotent
  }

  await wishlistRepository.addToWishlist(userId, adId);

  // Send notification to ad owner (if not adding own ad)
  const adOwnerId = ad.owner._id?.toString() || ad.owner.toString();
  if (adOwnerId !== userId) {
    const user = await User.findById(userId).select('name');
    
    await notificationsService.createNotification(
      adOwnerId,
      'like',
      'Added to Wishlist',
      `${user?.name || 'Someone'} added your "${ad.title}" to their wishlist`,
      { adId: ad._id.toString(), userId, action: 'wishlist' }
    );
  }
};

export const removeFromWishlist = async (userId: string, adId: string): Promise<void> => {
  await wishlistRepository.removeFromWishlist(userId, adId);
  
  // Remove wishlist notification if it exists
  const ad = await adsRepository.findById(adId);
  if (ad) {
    const adOwnerId = ad.owner._id?.toString() || ad.owner.toString();
    if (adOwnerId !== userId) {
      await notificationsService.removeNotificationByAction(
        adOwnerId,
        'like',
        { adId, userId, action: 'wishlist' }
      );
    }
  }
};

export const getWishlist = async (
  userId: string,
  query: WishlistQueryDto
): Promise<{ ads: AdResponse[]; total: number; page: number; limit: number; totalPages: number }> => {
  const { page, limit } = query;
  const { ads, total } = await wishlistRepository.getWishlist(userId, page, limit);

  // Map ads to response format and mark all as favorite since they're from wishlist
  const mappedAds = ads.map((ad) => AdMapper.toResponse(ad, true));

  return {
    ads: mappedAds,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};
