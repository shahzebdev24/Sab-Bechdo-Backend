import { Request, Response, NextFunction } from 'express';
import * as chatService from './chat.service.js';
import { sendSuccess } from '@core/http/response.js';
import { BadRequestError } from '@core/errors/app-error.js';
import {
  CreateConversationDto,
  ListConversationsQueryDto,
  ListMessagesQueryDto,
} from './chat.validation.js';

export const createOrGetConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const buyerId = req.user!.userId;
    const data: CreateConversationDto = req.body;
    const conversation = await chatService.createOrGetConversation(buyerId, data);
    sendSuccess(res, conversation, 'Conversation ready', 201);
  } catch (error) {
    next(error);
  }
};

export const listConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const query: ListConversationsQueryDto = req.query as unknown as ListConversationsQueryDto;
    const result = await chatService.listConversations(userId, query);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') {
      throw new BadRequestError('Invalid conversation ID');
    }
    const userId = req.user!.userId;
    const conversation = await chatService.getConversation(id, userId);
    sendSuccess(res, conversation);
  } catch (error) {
    next(error);
  }
};

export const listMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') {
      throw new BadRequestError('Invalid conversation ID');
    }
    const userId = req.user!.userId;
    const query: ListMessagesQueryDto = req.query as unknown as ListMessagesQueryDto;
    
    const result = await chatService.listMessages(id, userId, query);
    
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
    const { id } = req.params;
    if (typeof id !== 'string') {
      throw new BadRequestError('Invalid conversation ID');
    }
    const userId = req.user!.userId;
    const result = await chatService.markAsRead(id, userId);
    sendSuccess(res, result, 'Messages marked as read');
  } catch (error) {
    next(error);
  }
};

export const getUnreadCounts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const counts = await chatService.getUnreadCounts(userId);
    sendSuccess(res, { counts });
  } catch (error) {
    next(error);
  }
};
