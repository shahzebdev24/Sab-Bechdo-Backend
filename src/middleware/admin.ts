import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '@core/errors/app-error.js';
import { USER_ROLES } from '@common/constants.js';

/**
 * Middleware to ensure the authenticated user has admin role
 * Must be used after authenticate middleware
 */
export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }
    
    if (req.user.role !== USER_ROLES.ADMIN) {
      throw new ForbiddenError('Admin access required');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};
