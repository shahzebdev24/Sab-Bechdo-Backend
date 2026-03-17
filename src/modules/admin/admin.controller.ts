import { Request, Response, NextFunction } from 'express';
import * as adminService from './admin.service.js';
import { sendSuccess } from '@core/http/response.js';
import { DashboardStatsQueryDto } from './admin.validation.js';

/**
 * Get Dashboard Statistics
 * @route GET /api/v1/admin/dashboard/stats
 * @access Private (Admin only)
 */
export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query: DashboardStatsQueryDto = req.query;
    const stats = await adminService.getDashboardStats(query);
    sendSuccess(res, stats, 'Dashboard statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// ============================================
// USER MANAGEMENT CONTROLLER METHODS
// ============================================

/**
 * Get users list with filters
 */
export const getUsersList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const params = req.query;
    const result = await adminService.getUsersList(params);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await adminService.getUserById(id as string);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new user
 */
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = req.body;
    const user = await adminService.createUser(data);
    sendSuccess(res, user, 'User created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;
    const user = await adminService.updateUser(id as string, data);
    sendSuccess(res, user, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Block user
 */
export const blockUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.userId;
    const user = await adminService.blockUser(id as string, currentUserId);
    sendSuccess(res, user, 'User blocked successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Unblock user
 */
export const unblockUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await adminService.unblockUser(id as string);
    sendSuccess(res, user, 'User unblocked successfully');
  } catch (error) {
    next(error);
  }
};

// ============================================
// NOTIFICATIONS CONTROLLER METHODS
// ============================================

/**
 * Send system notification to all admins
 * @route POST /api/v1/admin/notifications/system
 * @access Private (Admin only)
 */
export const sendSystemNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, body, data } = req.body;
    await adminService.sendSystemNotification(title, body, data || {});
    sendSuccess(res, { sent: true }, 'System notification sent to all admins', 201);
  } catch (error) {
    next(error);
  }
};
