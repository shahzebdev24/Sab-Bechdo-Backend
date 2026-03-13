import { Ad, AdDocument } from '@models/ad.model.js';
import { CreateAdDto, UpdateAdDto, ListAdsQueryDto } from './ads.validation.js';
import mongoose from 'mongoose';

export const create = async (data: CreateAdDto & { owner: string }): Promise<AdDocument> => {
  const ad = new Ad(data);
  return await ad.save();
};

export const findById = async (id: string): Promise<AdDocument | null> => {
  return await Ad.findOne({ _id: id, isDeleted: false }).populate('owner', 'name email avatarUrl username');
};

export const findByIdAndOwner = async (id: string, ownerId: string): Promise<AdDocument | null> => {
  return await Ad.findOne({ _id: id, owner: ownerId, isDeleted: false });
};

export const update = async (id: string, data: UpdateAdDto): Promise<AdDocument | null> => {
  return await Ad.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const updateStatus = async (id: string, status: string): Promise<AdDocument | null> => {
  return await Ad.findByIdAndUpdate(id, { status }, { new: true });
};

export const deleteById = async (id: string): Promise<boolean> => {
  // Soft delete - mark as deleted instead of removing from DB
  const result = await Ad.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  return result !== null;
};

export const incrementViews = async (adId: string, userId?: string): Promise<void> => {
  if (!userId) {
    // Guest user - just increment view count
    await Ad.findByIdAndUpdate(adId, { $inc: { views: 1 } });
    return;
  }

  const ad = await Ad.findById(adId).select('owner viewedBy');
  if (!ad) return;

  // Don't increment if user is the owner
  if (ad.owner.toString() === userId) {
    return;
  }

  // Don't increment if user has already viewed this ad
  const hasViewed = ad.viewedBy.some((id) => id.toString() === userId);
  if (hasViewed) {
    return;
  }

  // Increment view count and add user to viewedBy array
  await Ad.findByIdAndUpdate(adId, {
    $inc: { views: 1 },
    $addToSet: { viewedBy: userId },
  });
};

interface ListAdsOptions extends ListAdsQueryDto {
  ownerId?: string;
  status?: string;
  hasVideo?: boolean;
  hasMedia?: boolean; // New: filter for ads with video OR images
}

export const list = async (options: ListAdsOptions): Promise<{ ads: AdDocument[]; total: number }> => {
  const {
    category,
    minPrice,
    maxPrice,
    lat,
    lng,
    radius,
    search,
    sort = 'recent',
    page = 1,
    limit = 20,
    ownerId,
    status,
    hasVideo,
    hasMedia,
  } = options;

  const filter: Record<string, unknown> = {};

  // Always exclude deleted ads
  filter.isDeleted = false;

  // Only add status filter if it's explicitly provided
  if (status !== undefined) {
    filter.status = status;
  }

  if (ownerId) {
    filter.owner = new mongoose.Types.ObjectId(ownerId);
  }

  if (category) {
    filter.category = category;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) {
      (filter.price as Record<string, unknown>).$gte = minPrice;
    }
    if (maxPrice !== undefined) {
      (filter.price as Record<string, unknown>).$lte = maxPrice;
    }
  }

  if (search) {
    filter.$text = { $search: search };
  }

  if (hasVideo) {
    filter.videoUrl = { $ne: null };
  }

  // Filter for ads with video OR images (for reels section)
  if (hasMedia) {
    filter.$or = [
      { videoUrl: { $ne: null } }, // Has video
      { photoUrls: { $exists: true, $ne: [], $not: { $size: 0 } } } // Has at least one image
    ];
  }

  // Location-based filtering (simple distance calculation)
  if (lat !== undefined && lng !== undefined && radius !== undefined) {
    const radiusInDegrees = radius / 111; // Approximate conversion (1 degree ≈ 111 km)
    filter['location.latitude'] = { $gte: lat - radiusInDegrees, $lte: lat + radiusInDegrees };
    filter['location.longitude'] = { $gte: lng - radiusInDegrees, $lte: lng + radiusInDegrees };
  }

  let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
  if (sort === 'price_asc') {
    sortOption = { price: 1 };
  } else if (sort === 'price_desc') {
    sortOption = { price: -1 };
  } else if (sort === 'views') {
    sortOption = { views: -1 };
  }

  const skip = (page - 1) * limit;

  const [ads, total] = await Promise.all([
    Ad.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('owner', 'name email avatarUrl username'),
    Ad.countDocuments(filter),
  ]);

  return { ads, total };
};

export const countByOwner = async (ownerId: string, status?: string): Promise<number> => {
  const filter: Record<string, unknown> = { 
    owner: new mongoose.Types.ObjectId(ownerId),
    isDeleted: false 
  };
  if (status) {
    filter.status = status;
  }
  return await Ad.countDocuments(filter);
};


export const isInWishlist = async (userId: string, adId: string): Promise<boolean> => {
  const { User } = await import('@models/index.js');
  const user = await User.findById(userId).select('wishlist');
  if (!user) return false;
  return user.wishlist.some((id) => id.toString() === adId);
};

export const getWishlistAdIds = async (userId: string): Promise<Set<string>> => {
  const { User } = await import('@models/index.js');
  const user = await User.findById(userId).select('wishlist');
  if (!user) return new Set();
  return new Set(user.wishlist.map((id) => id.toString()));
};
