import { User, UserDocument } from '@models/user.model.js';
import { Ad } from '@models/ad.model.js';
import { DASHBOARD_CONSTANTS } from '@common/constants.js';
import { FilterQuery } from 'mongoose';

/**
 * Get total users count
 */
export const getTotalUsersCount = async (): Promise<number> => {
  return await User.countDocuments();
};

/**
 * Get active users count (logged in within last N days)
 */
export const getActiveUsersCount = async (days: number = DASHBOARD_CONSTANTS.ACTIVE_USER_DAYS_THRESHOLD): Promise<number> => {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - days);
  
  return await User.countDocuments({
    lastLoginAt: { $gte: thresholdDate },
  });
};

/**
 * Get inactive users count
 */
export const getInactiveUsersCount = async (days: number = DASHBOARD_CONSTANTS.ACTIVE_USER_DAYS_THRESHOLD): Promise<number> => {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - days);
  
  return await User.countDocuments({
    $or: [
      { lastLoginAt: { $lt: thresholdDate } },
      { lastLoginAt: { $exists: false } },
    ],
  });
};

/**
 * Get new users count within date range
 */
export const getNewUsersCount = async (startDate: Date, endDate: Date): Promise<number> => {
  return await User.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
  });
};

/**
 * Get users count before a specific date (for growth calculation)
 */
export const getUsersCountBeforeDate = async (date: Date): Promise<number> => {
  return await User.countDocuments({
    createdAt: { $lt: date },
  });
};

/**
 * Get total ads count
 */
export const getTotalAdsCount = async (): Promise<number> => {
  return await Ad.countDocuments();
};

/**
 * Get ads count by status
 */
export const getAdsCountByStatus = async (status: string): Promise<number> => {
  return await Ad.countDocuments({
    status,
  });
};

/**
 * Get new ads count within date range
 */
export const getNewAdsCount = async (startDate: Date, endDate: Date): Promise<number> => {
  return await Ad.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
  });
};

/**
 * Get ads count before a specific date (for growth calculation)
 */
export const getAdsCountBeforeDate = async (date: Date): Promise<number> => {
  return await Ad.countDocuments({
    createdAt: { $lt: date },
  });
};

// ============================================
// USER MANAGEMENT REPOSITORY METHODS
// ============================================

export interface GetUsersFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'blocked';
  role?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page: number;
  limit: number;
}

/**
 * Get users list with filters and pagination
 */
export const getUsersList = async (filters: GetUsersFilters) => {
  const {
    search,
    status,
    role,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page,
    limit,
  } = filters;

  // Build query
  const query: FilterQuery<UserDocument> = {};

  // Search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } },
    ];
  }

  // Status filter
  if (status === 'active') {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - DASHBOARD_CONSTANTS.ACTIVE_USER_DAYS_THRESHOLD);
    query.isActive = true;
    query.lastLoginAt = { $gte: thresholdDate };
  } else if (status === 'inactive') {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - DASHBOARD_CONSTANTS.ACTIVE_USER_DAYS_THRESHOLD);
    query.isActive = true;
    query.$or = [
      { lastLoginAt: { $lt: thresholdDate } },
      { lastLoginAt: { $exists: false } },
    ];
  } else if (status === 'blocked') {
    query.isActive = false;
  }

  // Role filter
  if (role && role !== 'all') {
    query.role = role;
  }

  // Sorting
  const sort: Record<string, 1 | -1> = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Pagination
  const skip = (page - 1) * limit;

  // Execute query
  const [users, total] = await Promise.all([
    User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-password -resetToken -resetTokenExpiry -refreshToken')
      .lean(),
    User.countDocuments(query),
  ]);

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get user by ID (full details for admin)
 */
export const getUserById = async (userId: string): Promise<UserDocument | null> => {
  return await User.findById(userId).select('-password -resetToken -resetTokenExpiry -refreshToken');
};

/**
 * Create new user (admin)
 */
export const createUser = async (data: {
  email: string;
  name: string;
  password: string;
  role: string;
  phone?: string;
}): Promise<UserDocument> => {
  const user = await User.create(data);
  return user;
};

/**
 * Update user (admin)
 */
export const updateUser = async (
  userId: string,
  data: {
    name?: string;
    email?: string;
    role?: string;
    phone?: string;
  }
): Promise<UserDocument | null> => {
  return await User.findByIdAndUpdate(userId, data, { new: true, runValidators: true }).select(
    '-password -resetToken -resetTokenExpiry -refreshToken'
  );
};

/**
 * Block user (set isActive to false)
 */
export const blockUser = async (userId: string): Promise<UserDocument | null> => {
  return await User.findByIdAndUpdate(
    userId,
    { isActive: false },
    { new: true }
  ).select('-password -resetToken -resetTokenExpiry -refreshToken');
};

/**
 * Unblock user (set isActive to true)
 */
export const unblockUser = async (userId: string): Promise<UserDocument | null> => {
  return await User.findByIdAndUpdate(
    userId,
    { isActive: true },
    { new: true }
  ).select('-password -resetToken -resetTokenExpiry -refreshToken');
};

/**
 * Check if email exists
 */
export const checkEmailExists = async (email: string, excludeUserId?: string): Promise<boolean> => {
  const query: FilterQuery<UserDocument> = { email };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }
  const count = await User.countDocuments(query);
  return count > 0;
};
