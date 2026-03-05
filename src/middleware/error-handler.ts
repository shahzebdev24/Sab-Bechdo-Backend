import { Request, Response, NextFunction } from 'express';
import { AppError } from '@core/errors/app-error.js';
import { logger } from '@config/logger.js';
import { sendError } from '@core/http/response.js';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ZodError) {
    const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    logger.warn({ err, path: req.path }, 'Validation error');
    sendError(res, 'VALIDATION_ERROR', message, 400);
    return;
  }

  if (err instanceof AppError) {
    logger.warn({ err, path: req.path }, err.message);
    sendError(res, err.code, err.message, err.statusCode);
    return;
  }

  // Log full error details for debugging
  logger.error({ 
    err, 
    path: req.path,
    stack: err.stack,
    message: err.message,
    name: err.name 
  }, 'Unhandled error');
  
  sendError(res, 'INTERNAL_ERROR', 'An unexpected error occurred', 500);
};
