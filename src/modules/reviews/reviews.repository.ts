import { Review, ReviewDocument } from '@models/review.model.js';
import { CreateReviewDto } from './reviews.validation.js';
import mongoose from 'mongoose';

export const create = async (
  data: CreateReviewDto & { buyerId: string }
): Promise<ReviewDocument> => {
  const review = new Review({
    seller: new mongoose.Types.ObjectId(data.sellerId),
    buyer: new mongoose.Types.ObjectId(data.buyerId),
    ad: new mongoose.Types.ObjectId(data.adId),
    rating: data.rating,
    comment: data.comment,
  });
  return await review.save();
};

export const findBySellerPaginated = async (
  sellerId: string,
  page: number,
  limit: number
): Promise<{ reviews: ReviewDocument[]; total: number }> => {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ seller: new mongoose.Types.ObjectId(sellerId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('buyer', 'name avatarUrl username')
      .populate('ad', 'title photoUrls'),
    Review.countDocuments({ seller: new mongoose.Types.ObjectId(sellerId) }),
  ]);

  return { reviews, total };
};

export const getSellerRating = async (
  sellerId: string
): Promise<{ averageRating: number; totalReviews: number }> => {
  const result = await Review.aggregate([
    { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (result.length === 0) {
    return { averageRating: 0, totalReviews: 0 };
  }

  return {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    totalReviews: result[0].totalReviews,
  };
};

export const hasReviewed = async (buyerId: string, adId: string): Promise<boolean> => {
  const review = await Review.findOne({
    buyer: new mongoose.Types.ObjectId(buyerId),
    ad: new mongoose.Types.ObjectId(adId),
  });
  return review !== null;
};
