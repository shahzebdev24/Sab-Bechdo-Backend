import { Request, Response, NextFunction } from 'express';
import * as wishlistService from './wishlist.service.js';
import { sendSuccess } from '@core/http/response.js';
import { BadRequestError } from '@core/errors/app-error.js';
import { WishlistQueryDto } from './wishlist.validation.js';

export const getWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const query: WishlistQueryDto = req.query as unknown as WishlistQueryDto;
    const result = await wishlistService.getWishlist(userId, query);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { adId } = req.params;
    if (typeof adId !== 'string') {
      throw new BadRequestError('Invalid ad ID');
    }
    await wishlistService.addToWishlist(userId, adId);
    sendSuccess(res, null, 'Added to wishlist');
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { adId } = req.params;
    if (typeof adId !== 'string') {
      throw new BadRequestError('Invalid ad ID');
    }
    await wishlistService.removeFromWishlist(userId, adId);
    sendSuccess(res, null, 'Removed from wishlist');
  } catch (error) {
    next(error);
  }
};
