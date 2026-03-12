import { Offer, OfferDocument, OfferStatus } from '@models/offer.model.js';
import mongoose from 'mongoose';

export const create = async (data: {
  adId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  message?: string;
}): Promise<OfferDocument> => {
  const offer = new Offer({
    ad: new mongoose.Types.ObjectId(data.adId),
    fromUser: new mongoose.Types.ObjectId(data.fromUserId),
    toUser: new mongoose.Types.ObjectId(data.toUserId),
    amount: data.amount,
    currency: data.currency,
    message: data.message,
    status: 'pending',
  });
  return await offer.save();
};

export const findById = async (id: string): Promise<OfferDocument | null> => {
  return await Offer.findById(id)
    .populate('ad', 'title price photoUrls')
    .populate('fromUser', 'name avatarUrl username')
    .populate('toUser', 'name avatarUrl username');
};

export const findSentOffers = async (
  userId: string,
  page: number,
  limit: number
): Promise<{ offers: OfferDocument[]; total: number }> => {
  const skip = (page - 1) * limit;

  const [offers, total] = await Promise.all([
    Offer.find({ fromUser: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('ad', 'title price photoUrls')
      .populate('toUser', 'name avatarUrl username'),
    Offer.countDocuments({ fromUser: new mongoose.Types.ObjectId(userId) }),
  ]);

  return { offers, total };
};

export const findReceivedOffers = async (
  userId: string,
  page: number,
  limit: number
): Promise<{ offers: OfferDocument[]; total: number }> => {
  const skip = (page - 1) * limit;

  const [offers, total] = await Promise.all([
    Offer.find({ toUser: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('ad', 'title price photoUrls')
      .populate('fromUser', 'name avatarUrl username'),
    Offer.countDocuments({ toUser: new mongoose.Types.ObjectId(userId) }),
  ]);

  return { offers, total };
};

export const findOffersByAd = async (
  adId: string,
  ownerId: string,
  page: number,
  limit: number
): Promise<{ offers: OfferDocument[]; total: number }> => {
  const skip = (page - 1) * limit;

  const filter = {
    ad: new mongoose.Types.ObjectId(adId),
    toUser: new mongoose.Types.ObjectId(ownerId),
  };

  const [offers, total] = await Promise.all([
    Offer.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('fromUser', 'name avatarUrl username'),
    Offer.countDocuments(filter),
  ]);

  return { offers, total };
};

export const updateStatus = async (
  offerId: string,
  status: OfferStatus
): Promise<OfferDocument | null> => {
  return await Offer.findByIdAndUpdate(offerId, { status }, { new: true })
    .populate('ad', 'title price photoUrls')
    .populate('fromUser', 'name avatarUrl username')
    .populate('toUser', 'name avatarUrl username');
};

export const countPendingOffersForAd = async (adId: string): Promise<number> => {
  return await Offer.countDocuments({
    ad: new mongoose.Types.ObjectId(adId),
    status: 'pending',
  });
};
