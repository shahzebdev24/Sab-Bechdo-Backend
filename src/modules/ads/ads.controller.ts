import { Request, Response, NextFunction } from 'express';
import * as adsService from './ads.service.js';
import { sendSuccess } from '@core/http/response.js';
import { BadRequestError } from '@core/errors/app-error.js';
import {
  CreateAdDto,
  UpdateAdDto,
  UpdateAdStatusDto,
  ListAdsQueryDto,
} from './ads.validation.js';

export const createAd = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data: CreateAdDto = req.body;
    const ownerId = req.user!.userId;
    const ad = await adsService.createAd(data, ownerId);
    sendSuccess(res, ad, 'Ad created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getAd = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') {
      throw new BadRequestError('Invalid ad ID');
    }
    const userId = req.user?.userId; // Optional - works for both authenticated and guest users
    const ad = await adsService.getAdById(id, true, userId);
    sendSuccess(res, ad);
  } catch (error) {
    next(error);
  }
};

export const updateAd = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') {
      throw new BadRequestError('Invalid ad ID');
    }
    const data: UpdateAdDto = req.body;
    const ownerId = req.user!.userId;
    const ad = await adsService.updateAd(id, ownerId, data);
    sendSuccess(res, ad, 'Ad updated successfully');
  } catch (error) {
    next(error);
  }
};

export const updateAdStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') {
      throw new BadRequestError('Invalid ad ID');
    }
    const data: UpdateAdStatusDto = req.body;
    const ownerId = req.user!.userId;
    const ad = await adsService.updateAdStatus(id, ownerId, data);
    sendSuccess(res, ad, 'Ad status updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteAd = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') {
      throw new BadRequestError('Invalid ad ID');
    }
    const ownerId = req.user!.userId;
    await adsService.deleteAd(id, ownerId);
    sendSuccess(res, null, 'Ad deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const listAds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query: ListAdsQueryDto = req.query as unknown as ListAdsQueryDto;
    const userId = req.user?.userId; // Optional - works for both authenticated and guest users
    const result = await adsService.listAds(query, userId);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const listReelsAds = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = req.query as unknown as Omit<ListAdsQueryDto, 'sort'>;
    const userId = req.user?.userId; // Optional - works for both authenticated and guest users
    const result = await adsService.listReelsAds(query, userId);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const listAdsBySeller = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sellerId } = req.params;
    if (typeof sellerId !== 'string') {
      throw new BadRequestError('Invalid seller ID');
    }
    const query = req.query as unknown as Pick<ListAdsQueryDto, 'page' | 'limit' | 'sort'>;
    const requesterId = req.user?.userId;
    const result = await adsService.listAdsBySeller(sellerId, query, requesterId);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const listMyAds = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ownerId = req.user!.userId;
    const query = req.query as unknown as Pick<ListAdsQueryDto, 'page' | 'limit' | 'sort'>;
    const result = await adsService.listAdsBySeller(ownerId, query, ownerId);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
