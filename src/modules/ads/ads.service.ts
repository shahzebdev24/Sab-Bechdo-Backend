import * as adsRepository from './ads.repository.js';
import { CreateAdDto, UpdateAdDto, UpdateAdStatusDto, ListAdsQueryDto } from './ads.validation.js';
import { NotFoundError } from '@core/errors/app-error.js';
import { AdDocument } from '@models/ad.model.js';
import { AdMapper, AdResponse } from '@common/mappers/ad.mapper.js';
import * as notificationsService from '@modules/notifications/notifications.service.js';

export const createAd = async (data: CreateAdDto, ownerId: string): Promise<AdDocument> => {
  return await adsRepository.create({ ...data, owner: ownerId });
};

export const getAdById = async (id: string, incrementView = false, userId?: string): Promise<AdResponse> => {
  const ad = await adsRepository.findById(id);
  if (!ad) {
    throw new NotFoundError('Ad not found');
  }

  if (incrementView) {
    await adsRepository.incrementViews(id, userId);
  }

  // Check if ad is in user's wishlist
  let isFavorite = false;
  if (userId) {
    isFavorite = await adsRepository.isInWishlist(userId, id);
  }

  return AdMapper.toResponse(ad, isFavorite);
};

export const updateAd = async (id: string, ownerId: string, data: UpdateAdDto): Promise<AdDocument> => {
  const ad = await adsRepository.findByIdAndOwner(id, ownerId);
  if (!ad) {
    throw new NotFoundError('Ad not found or you do not have permission to update it');
  }

  const updatedAd = await adsRepository.update(id, data);
  if (!updatedAd) {
    throw new NotFoundError('Ad not found');
  }

  return updatedAd;
};

export const updateAdStatus = async (
  id: string,
  ownerId: string,
  data: UpdateAdStatusDto
): Promise<AdDocument> => {
  const ad = await adsRepository.findByIdAndOwner(id, ownerId);
  if (!ad) {
    throw new NotFoundError('Ad not found or you do not have permission to update it');
  }

  const updatedAd = await adsRepository.updateStatus(id, data.status);
  if (!updatedAd) {
    throw new NotFoundError('Ad not found');
  }

  // Send notification to ad owner about status change
  const statusMessages: Record<string, string> = {
    active: `Your ad "${updatedAd.title}" is now live! 🎉`,
    sold: `Congratulations! Your ad "${updatedAd.title}" is marked as sold`,
    archived: `Your ad "${updatedAd.title}" has been archived`,
    pending: `Your ad "${updatedAd.title}" is pending review`,
  };

  const message = statusMessages[data.status] || `Your ad "${updatedAd.title}" status changed to ${data.status}`;

  await notificationsService.createNotification(
    ownerId,
    'ad_status',
    'Ad Status Update',
    message,
    { adId: updatedAd._id.toString(), status: data.status }
  );

  return updatedAd;
};

export const deleteAd = async (id: string, ownerId: string): Promise<void> => {
  const ad = await adsRepository.findByIdAndOwner(id, ownerId);
  if (!ad) {
    throw new NotFoundError('Ad not found or you do not have permission to delete it');
  }

  const deleted = await adsRepository.deleteById(id);
  if (!deleted) {
    throw new NotFoundError('Ad not found');
  }
};

export const listAds = async (
  query: ListAdsQueryDto,
  userId?: string
): Promise<{ ads: AdResponse[]; total: number; page: number; limit: number; totalPages: number }> => {
  // Public ads list - only show active ads
  const { ads, total } = await adsRepository.list({ ...query, status: 'active' });

  // Check wishlist status for each ad if user is logged in
  let wishlistAdIds: Set<string> = new Set();
  if (userId) {
    wishlistAdIds = await adsRepository.getWishlistAdIds(userId);
  }

  // Map ads to response format with isFavorite
  const mappedAds = ads.map((ad) => {
    const isFavorite = wishlistAdIds.has(ad._id.toString());
    return AdMapper.toResponse(ad, isFavorite);
  });

  return {
    ads: mappedAds,
    total,
    page: query.page || 1,
    limit: query.limit || 20,
    totalPages: Math.ceil(total / (query.limit || 20)),
  };
};

export const listReelsAds = async (
  query: Omit<ListAdsQueryDto, 'sort'>,
  userId?: string
): Promise<{ ads: AdResponse[]; total: number; page: number; limit: number; totalPages: number }> => {
  const { ads, total } = await adsRepository.list({ ...query, hasVideo: true, sort: 'recent' });

  // Check wishlist status for each ad if user is logged in
  let wishlistAdIds: Set<string> = new Set();
  if (userId) {
    wishlistAdIds = await adsRepository.getWishlistAdIds(userId);
  }

  // Map ads to response format with isFavorite
  const mappedAds = ads.map((ad) => {
    const isFavorite = wishlistAdIds.has(ad._id.toString());
    return AdMapper.toResponse(ad, isFavorite);
  });

  return {
    ads: mappedAds,
    total,
    page: query.page || 1,
    limit: query.limit || 20,
    totalPages: Math.ceil(total / (query.limit || 20)),
  };
};

export const listAdsBySeller = async (
  sellerId: string,
  query: Pick<ListAdsQueryDto, 'page' | 'limit' | 'sort'>,
  requesterId?: string
): Promise<{ ads: AdResponse[]; total: number; page: number; limit: number; totalPages: number }> => {
  // If requester is the seller, show all their ads; otherwise only active ads
  const status = requesterId === sellerId ? undefined : 'active';

  const { ads, total } = await adsRepository.list({
    ...query,
    ownerId: sellerId,
    status,
  });

  // Check wishlist status for each ad if user is logged in
  let wishlistAdIds: Set<string> = new Set();
  if (requesterId) {
    wishlistAdIds = await adsRepository.getWishlistAdIds(requesterId);
  }

  // Map ads to response format with isFavorite
  const mappedAds = ads.map((ad) => {
    const isFavorite = wishlistAdIds.has(ad._id.toString());
    return AdMapper.toResponse(ad, isFavorite);
  });

  return {
    ads: mappedAds,
    total,
    page: query.page || 1,
    limit: query.limit || 20,
    totalPages: Math.ceil(total / (query.limit || 20)),
  };
};
