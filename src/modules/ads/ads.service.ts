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

  // If ad was rejected and user is editing, change status to pending (resubmission)
  const updateData: any = { ...data };
  if (ad.status === 'rejected') {
    updateData.status = 'pending';
    updateData.previousStatus = 'rejected';
    updateData.resubmittedAt = new Date();
    // Keep rejection reason for admin reference
  }

  const updatedAd = await adsRepository.update(id, updateData);
  if (!updatedAd) {
    throw new NotFoundError('Ad not found');
  }

  // If resubmitted, notify user
  if (ad.status === 'rejected') {
    await notificationsService.createNotification(
      ownerId,
      'ad_status',
      'Ad Resubmitted',
      `Your ad "${updatedAd.title}" has been resubmitted for review.`,
      { adId: updatedAd._id.toString(), status: 'pending', action: 'resubmitted' }
    );
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
  // Fetch ads that have either video OR images (for reels section) - only show active ads
  const { ads, total } = await adsRepository.list({ 
    ...query, 
    hasMedia: true, // Changed from hasVideo to hasMedia to include both videos and images
    status: 'active', // Only show active ads in reels
    sort: 'recent' 
  });

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

/**
 * Admin: List all ads (including pending and rejected)
 */
export const listAllAdsAdmin = async (
  query: ListAdsQueryDto
): Promise<{ ads: AdResponse[]; total: number; page: number; limit: number; totalPages: number }> => {
  // Admin can see all ads regardless of status
  const { ads, total } = await adsRepository.list(query);

  // Map ads to response format without wishlist check (admin view)
  const mappedAds = ads.map((ad) => AdMapper.toResponse(ad, false));

  return {
    ads: mappedAds,
    total,
    page: query.page || 1,
    limit: query.limit || 20,
    totalPages: Math.ceil(total / (query.limit || 20)),
  };
};

/**
 * Admin: Approve ad (change status from pending to active)
 */
export const approveAd = async (id: string): Promise<AdDocument> => {
  const ad = await adsRepository.findById(id);
  if (!ad) {
    throw new NotFoundError('Ad not found');
  }

  // Update status and clear rejection/resubmission data
  const updatedAd = await adsRepository.update(id, {
    status: 'active',
    rejectionReason: null,
    resubmittedAt: null,
    previousStatus: ad.status,
  });
  
  if (!updatedAd) {
    throw new NotFoundError('Ad not found');
  }

  // Send notification to ad owner
  await notificationsService.createNotification(
    updatedAd.owner.toString(),
    'ad_status',
    'Ad Approved! 🎉',
    `Your ad "${updatedAd.title}" has been approved and is now live!`,
    { adId: updatedAd._id.toString(), status: 'active', action: 'approved' }
  );

  return updatedAd;
};

/**
 * Admin: Reject ad (change status to rejected)
 */
export const rejectAd = async (id: string, reason?: string): Promise<AdDocument> => {
  const ad = await adsRepository.findById(id);
  if (!ad) {
    throw new NotFoundError('Ad not found');
  }

  // Update status and save rejection reason
  const updatedAd = await adsRepository.update(id, {
    status: 'rejected',
    rejectionReason: reason || 'Does not meet our guidelines',
    resubmittedAt: null, // Clear resubmission date
    previousStatus: ad.status,
  });
  
  if (!updatedAd) {
    throw new NotFoundError('Ad not found');
  }

  // Send notification to ad owner with rejection reason
  const message = reason
    ? `Your ad "${updatedAd.title}" was rejected. Reason: ${reason}`
    : `Your ad "${updatedAd.title}" was rejected. Please review our guidelines and try again.`;

  await notificationsService.createNotification(
    updatedAd.owner.toString(),
    'ad_status',
    'Ad Rejected',
    message,
    { adId: updatedAd._id.toString(), status: 'rejected', action: 'rejected', reason }
  );

  return updatedAd;
};
