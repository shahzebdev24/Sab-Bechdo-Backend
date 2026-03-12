import { Request, Response, NextFunction } from 'express';
import * as offersService from './offers.service.js';
import { sendSuccess } from '@core/http/response.js';
import { BadRequestError } from '@core/errors/app-error.js';
import {
  CreateOfferDto,
  UpdateOfferStatusDto,
  ListOffersQueryDto,
} from './offers.validation.js';

export const createOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const data: CreateOfferDto = req.body;
    const offer = await offersService.createOffer(data, userId);
    sendSuccess(res, offer, 'Offer created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const listSentOffers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const query: ListOffersQueryDto = req.query as unknown as ListOffersQueryDto;
    const result = await offersService.listSentOffers(userId, query);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const listReceivedOffers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const query: ListOffersQueryDto = req.query as unknown as ListOffersQueryDto;
    const result = await offersService.listReceivedOffers(userId, query);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const listOffersByAd = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { adId } = req.params;
    if (typeof adId !== 'string') {
      throw new BadRequestError('Invalid ad ID');
    }
    const userId = req.user!.userId;
    const query: ListOffersQueryDto = req.query as unknown as ListOffersQueryDto;
    const result = await offersService.listOffersByAd(adId, userId, query);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const updateOfferStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { offerId } = req.params;
    if (typeof offerId !== 'string') {
      throw new BadRequestError('Invalid offer ID');
    }
    const userId = req.user!.userId;
    const data: UpdateOfferStatusDto = req.body;
    const offer = await offersService.updateOfferStatus(offerId, userId, data);
    sendSuccess(res, offer, 'Offer status updated successfully');
  } catch (error) {
    next(error);
  }
};
