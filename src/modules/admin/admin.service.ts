import * as adminRepository from './admin.repository.js';
import { AD_STATUS, DASHBOARD_CONSTANTS } from '@common/constants.js';
import { DashboardStatsQueryDto } from './admin.validation.js';

/**
 * Dashboard Statistics Response Interface
 */
export interface DashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    newToday: number;
    growth: number;
  };
  ads: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    newToday: number;
    growth: number;
  };
}

/**
 * Calculate growth percentage
 */
const calculateGrowth = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(2));
};

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (query: DashboardStatsQueryDto): Promise<DashboardStats> => {
  // Parse dates or use defaults
  const endDate = query.endDate ? new Date(query.endDate) : new Date();
  const startDate = query.startDate 
    ? new Date(query.startDate)
    : new Date(endDate.getTime() - DASHBOARD_CONSTANTS.DEFAULT_DATE_RANGE_DAYS * 24 * 60 * 60 * 1000);

  // Calculate start of today for "new today" counts
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // Fetch all user statistics in parallel
  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    newUsersToday,
    usersBeforeStartDate,
  ] = await Promise.all([
    adminRepository.getTotalUsersCount(),
    adminRepository.getActiveUsersCount(),
    adminRepository.getInactiveUsersCount(),
    adminRepository.getNewUsersCount(startOfToday, endOfToday),
    adminRepository.getUsersCountBeforeDate(startDate),
  ]);

  // Calculate user growth
  const userGrowth = calculateGrowth(totalUsers, usersBeforeStartDate);

  // Fetch all ad statistics in parallel
  const [
    totalAds,
    pendingAds,
    approvedAds,
    rejectedAds,
    newAdsToday,
    adsBeforeStartDate,
  ] = await Promise.all([
    adminRepository.getTotalAdsCount(),
    adminRepository.getAdsCountByStatus(AD_STATUS.PENDING),
    adminRepository.getAdsCountByStatus(AD_STATUS.ACTIVE),
    adminRepository.getAdsCountByStatus(AD_STATUS.REJECTED),
    adminRepository.getNewAdsCount(startOfToday, endOfToday),
    adminRepository.getAdsCountBeforeDate(startDate),
  ]);

  // Calculate ad growth
  const adGrowth = calculateGrowth(totalAds, adsBeforeStartDate);

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      newToday: newUsersToday,
      growth: userGrowth,
    },
    ads: {
      total: totalAds,
      pending: pendingAds,
      approved: approvedAds,
      rejected: rejectedAds,
      newToday: newAdsToday,
      growth: adGrowth,
    },
  };
};

// ============================================
// USER MANAGEMENT SERVICE METHODS
// ============================================

import { hashPassword } from '@core/auth/password.js';
import { ConflictError, NotFoundError, BadRequestError } from '@core/errors/app-error.js';
import { AUTH_PROVIDERS } from '@common/constants.js';
import * as authRepository from '../auth/auth.repository.js';

export interface GetUsersListParams {
  search?: string;
  status?: 'active' | 'inactive' | 'blocked' | 'all';
  role?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role: 'customer' | 'admin';
  phone?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: 'customer' | 'admin';
  phone?: string;
}

/**
 * Get users list with filters
 */
export const getUsersList = async (params: GetUsersListParams) => {
  const {
    search,
    status,
    role,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = params;

  // Convert 'all' to undefined for repository
  const statusFilter = status === 'all' ? undefined : status;
  const roleFilter = role === 'all' ? undefined : role;

  const result = await adminRepository.getUsersList({
    search,
    status: statusFilter,
    role: roleFilter,
    sortBy,
    sortOrder,
    page,
    limit,
  });

  // Map users to include computed status
  const usersWithStatus = result.users.map((user: any) => {
    let userStatus = 'active';
    
    if (!user.isActive) {
      userStatus = 'blocked';
    } else if (user.lastLoginAt) {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - DASHBOARD_CONSTANTS.ACTIVE_USER_DAYS_THRESHOLD);
      if (new Date(user.lastLoginAt) < thresholdDate) {
        userStatus = 'inactive';
      }
    } else {
      userStatus = 'inactive';
    }

    return {
      ...user,
      status: userStatus,
    };
  });

  return {
    users: usersWithStatus,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  };
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string) => {
  const user = await adminRepository.getUserById(userId);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Compute status
  let status = 'active';
  if (!user.isActive) {
    status = 'blocked';
  } else if (user.lastLoginAt) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - DASHBOARD_CONSTANTS.ACTIVE_USER_DAYS_THRESHOLD);
    if (new Date(user.lastLoginAt) < thresholdDate) {
      status = 'inactive';
    }
  } else {
    status = 'inactive';
  }

  return {
    ...user.toObject(),
    status,
  };
};

/**
 * Create new user (admin)
 */
export const createUser = async (data: CreateUserData) => {
  // Check if email already exists
  const emailExists = await adminRepository.checkEmailExists(data.email);
  if (emailExists) {
    throw new ConflictError('Email already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create user
  const user = await adminRepository.createUser({
    email: data.email,
    name: data.name,
    password: hashedPassword,
    role: data.role,
    phone: data.phone,
  });

  // Link local provider
  await authRepository.linkProvider(user._id.toString(), AUTH_PROVIDERS.LOCAL, null);

  return {
    ...user.toObject(),
    status: 'inactive', // New users are inactive until first login
  };
};

/**
 * Update user (admin)
 */
export const updateUser = async (userId: string, data: UpdateUserData) => {
  // Check if user exists
  const existingUser = await adminRepository.getUserById(userId);
  if (!existingUser) {
    throw new NotFoundError('User not found');
  }

  // If email is being updated, check uniqueness
  if (data.email && data.email !== existingUser.email) {
    const emailExists = await adminRepository.checkEmailExists(data.email, userId);
    if (emailExists) {
      throw new ConflictError('Email already exists');
    }
  }

  // Update user
  const updatedUser = await adminRepository.updateUser(userId, data);
  
  if (!updatedUser) {
    throw new NotFoundError('User not found');
  }

  // Compute status
  let status = 'active';
  if (!updatedUser.isActive) {
    status = 'blocked';
  } else if (updatedUser.lastLoginAt) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - DASHBOARD_CONSTANTS.ACTIVE_USER_DAYS_THRESHOLD);
    if (new Date(updatedUser.lastLoginAt) < thresholdDate) {
      status = 'inactive';
    }
  } else {
    status = 'inactive';
  }

  return {
    ...updatedUser.toObject(),
    status,
  };
};

/**
 * Block user
 */
export const blockUser = async (userId: string, currentUserId: string) => {
  // Prevent self-blocking
  if (userId === currentUserId) {
    throw new BadRequestError('Cannot block your own account');
  }

  // Check if user exists
  const user = await adminRepository.getUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Block user
  const blockedUser = await adminRepository.blockUser(userId);
  
  if (!blockedUser) {
    throw new NotFoundError('User not found');
  }

  return {
    ...blockedUser.toObject(),
    status: 'blocked',
  };
};

/**
 * Unblock user
 */
export const unblockUser = async (userId: string) => {
  // Check if user exists
  const user = await adminRepository.getUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Unblock user
  const unblockedUser = await adminRepository.unblockUser(userId);
  
  if (!unblockedUser) {
    throw new NotFoundError('User not found');
  }

  // Compute status (will be inactive if never logged in)
  let status = 'active';
  if (unblockedUser.lastLoginAt) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - DASHBOARD_CONSTANTS.ACTIVE_USER_DAYS_THRESHOLD);
    if (new Date(unblockedUser.lastLoginAt) < thresholdDate) {
      status = 'inactive';
    }
  } else {
    status = 'inactive';
  }

  return {
    ...unblockedUser.toObject(),
    status,
  };
};
