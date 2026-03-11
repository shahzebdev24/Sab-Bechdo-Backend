import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '@core/errors/app-error.js';
import { UserRole } from '@common/constants.js';

/**
 * Middleware to check if user has required role
 * Usage: router.get('/admin/users', authenticate, requireRole('admin'), getUsers)
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      // Check if user has required role
      const userRole = req.user.role;
      
      if (!userRole || !allowedRoles.includes(userRole as UserRole)) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user is admin
 * Usage: router.get('/admin/users', authenticate, requireAdmin, getUsers)
 */
export const requireAdmin = requireRole('admin');

/**
 * Middleware to check if user is customer
 * Usage: router.post('/orders', authenticate, requireCustomer, createOrder)
 */
export const requireCustomer = requireRole('customer');

/**
 * Middleware to allow both admin and customer
 * Usage: router.get('/products', authenticate, requireAnyRole, getProducts)
 */
export const requireAnyRole = requireRole('admin', 'customer');
