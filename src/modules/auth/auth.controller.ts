import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import { sendSuccess } from '@core/http/response.js';
import {
  SignupDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshTokenDto,
  FirebaseAuthDto,
} from './auth.validation.js';

export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data: SignupDto = req.body;
    const result = await authService.signup(data);
    sendSuccess(res, result, 'Account created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data: LoginDto = req.body;
    const result = await authService.login(data);
    sendSuccess(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data: ForgotPasswordDto = req.body;
    await authService.forgotPassword(data);
    sendSuccess(res, null, 'If the email exists, a reset link has been sent');
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data: ResetPasswordDto = req.body;
    await authService.resetPassword(data);
    sendSuccess(res, null, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data: RefreshTokenDto = req.body;
    const tokens = await authService.refreshToken(data.refreshToken);
    sendSuccess(res, tokens, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

export const firebaseAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data: FirebaseAuthDto = req.body;
    const result = await authService.firebaseAuth(data);
    sendSuccess(res, result, 'Firebase authentication successful');
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await authService.getProfile(userId);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    await authService.logout(userId);
    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};
