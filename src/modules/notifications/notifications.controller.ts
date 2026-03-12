import { Request, Response, NextFunction } from 'express';
import * as notificationsService from './notifications.service.js';
import { sendSuccess } from '@core/http/response.js';
import { ListNotificationsQueryDto, MarkAsReadDto } from './notifications.validation.js';

export const listNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const query: ListNotificationsQueryDto = req.query as unknown as ListNotificationsQueryDto;
    const result = await notificationsService.listNotifications(userId, query);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const data: MarkAsReadDto = req.body;
    const result = await notificationsService.markAsRead(userId, data);
    sendSuccess(res, result, 'Notifications marked as read');
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const result = await notificationsService.markAllAsRead(userId);
    sendSuccess(res, result, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const result = await notificationsService.getUnreadCount(userId);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
