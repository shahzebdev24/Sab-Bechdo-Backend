import { Request, Response, NextFunction } from 'express';
import * as reviewsService from './reviews.service.js';
import { sendSuccess } from '@core/http/response.js';
import { BadRequestError } from '@core/errors/app-error.js';
import { CreateReviewDto, ListReviewsQueryDto } from './reviews.validation.js';

export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data: CreateReviewDto = req.body;
    const buyerId = req.user!.userId;
    const review = await reviewsService.createReview(data, buyerId);
    sendSuccess(res, review, 'Review created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getSellerReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sellerId } = req.params;
    if (typeof sellerId !== 'string') {
      throw new BadRequestError('Invalid seller ID');
    }
    const query: ListReviewsQueryDto = req.query as unknown as ListReviewsQueryDto;
    const result = await reviewsService.getSellerReviews(sellerId, query);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
