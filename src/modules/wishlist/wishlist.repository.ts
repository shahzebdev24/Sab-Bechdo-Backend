import { User } from '@models/user.model.js';
import { Ad, AdDocument } from '@models/ad.model.js';
import mongoose from 'mongoose';

export const addToWishlist = async (userId: string, adId: string): Promise<boolean> => {
  const result = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { wishlist: new mongoose.Types.ObjectId(adId) } },
    { new: true }
  );
  return result !== null;
};

export const removeFromWishlist = async (userId: string, adId: string): Promise<boolean> => {
  const result = await User.findByIdAndUpdate(
    userId,
    { $pull: { wishlist: new mongoose.Types.ObjectId(adId) } },
    { new: true }
  );
  return result !== null;
};

export const getWishlist = async (
  userId: string,
  page: number,
  limit: number
): Promise<{ ads: AdDocument[]; total: number }> => {
  const user = await User.findById(userId).select('wishlist');
  if (!user) {
    return { ads: [], total: 0 };
  }

  const total = user.wishlist.length;
  const skip = (page - 1) * limit;

  const ads = await Ad.find({ _id: { $in: user.wishlist } })
    .skip(skip)
    .limit(limit)
    .populate('owner', 'name email avatarUrl username')
    .sort({ createdAt: -1 });

  return { ads, total };
};

export const isInWishlist = async (userId: string, adId: string): Promise<boolean> => {
  const user = await User.findById(userId).select('wishlist');
  if (!user) {
    return false;
  }
  return user.wishlist.some((id) => id.toString() === adId);
};
