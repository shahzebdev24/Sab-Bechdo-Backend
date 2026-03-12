import * as reviewsRepository from './reviews.repository.js';
import * as adsRepository from '../ads/ads.repository.js';
import { CreateReviewDto, ListReviewsQueryDto } from './reviews.validation.js';
import { NotFoundError, BadRequestError, ConflictError } from '@core/errors/app-error.js';
import { ReviewDocument } from '@models/review.model.js';

export const createReview = async (
  data: CreateReviewDto,
  buyerId: string
): Promise<ReviewDocument> => {
  // Check if ad exists
  const ad = await adsRepository.findById(data.adId);
  if (!ad) {
    throw new NotFoundError('Ad not found');
  }

  // Prevent self-review
  if (ad.owner.toString() === buyerId) {
    throw new BadRequestError('You cannot review your own ad');
  }

  // Check if seller ID matches ad owner
  if (ad.owner.toString() !== data.sellerId) {
    throw new BadRequestError('Seller ID does not match ad owner');
  }

  // Check if already reviewed
  const hasReviewed = await reviewsRepository.hasReviewed(buyerId, data.adId);
  if (hasReviewed) {
    throw new ConflictError('You have already reviewed this seller for this ad');
  }

  return await reviewsRepository.create({ ...data, buyerId });
};

export const getSellerReviews = async (
  sellerId: string,
  query: ListReviewsQueryDto
): Promise<{
  reviews: ReviewDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const { page, limit } = query;
  const { reviews, total } = await reviewsRepository.findBySellerPaginated(sellerId, page, limit);

  return {
    reviews,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};
