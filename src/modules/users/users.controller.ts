import { Request, Response, NextFunction } from 'express';
import * as usersService from './users.service.js';
import { sendSuccess } from '@core/http/response.js';
import { BadRequestError } from '@core/errors/app-error.js';
import { UpdateProfileDto } from './users.validation.js';

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await usersService.getProfile(userId);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const data: UpdateProfileDto = req.body;
    const user = await usersService.updateProfile(userId, data);
    sendSuccess(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const getPreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const preferences = await usersService.getPreferences(userId);
    sendSuccess(res, preferences);
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const data = req.body;
    const preferences = await usersService.updatePreferences(userId, data);
    sendSuccess(res, preferences, 'Preferences updated successfully');
  } catch (error) {
    next(error);
  }
};

export const getTopSellers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = Number(req.query.limit) || 4;
    const sellers = await usersService.getTopSellers(limit);
    sendSuccess(res, sellers);
  } catch (error) {
    next(error);
  }
};

export const getSellerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') {
      throw new BadRequestError('Invalid user ID');
    }
    const seller = await usersService.getSellerProfile(id);
    sendSuccess(res, seller);
  } catch (error) {
    next(error);
  }
};
