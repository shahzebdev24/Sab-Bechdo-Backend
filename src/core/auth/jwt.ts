import jwt from 'jsonwebtoken';
import { config } from '@config/index.js';
import { JwtPayload, AuthTokens } from '@core/types/index.js';
import { AuthError } from '@core/errors/app-error.js';

export const generateAccessToken = (userId: string, email: string): string => {
  const payload: JwtPayload = {
    userId,
    email,
    type: 'access',
  };
  
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiry,
  });
};

export const generateRefreshToken = (userId: string, email: string): string => {
  const payload: JwtPayload = {
    userId,
    email,
    type: 'refresh',
  };
  
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });
};

export const generateAuthTokens = (userId: string, email: string): AuthTokens => {
  return {
    accessToken: generateAccessToken(userId, email),
    refreshToken: generateRefreshToken(userId, email),
  };
};

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    if (decoded.type !== 'access') {
      throw new AuthError('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError('Invalid token');
    }
    throw error;
  }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
    
    if (decoded.type !== 'refresh') {
      throw new AuthError('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError('Invalid refresh token');
    }
    throw error;
  }
};
