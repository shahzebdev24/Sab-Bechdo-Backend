import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@core/auth/jwt.js';
import { AuthError } from '@core/errors/app-error.js';
import { JwtPayload } from '@core/types/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('No token provided');
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};
