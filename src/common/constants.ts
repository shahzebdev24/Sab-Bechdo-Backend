export const AUTH_CONSTANTS = {
  PASSWORD_RESET_EXPIRY_HOURS: 1,
  BCRYPT_SALT_ROUNDS: 12,
  MIN_PASSWORD_LENGTH: 8,
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  FORBIDDEN_ERROR: 'FORBIDDEN_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST_ERROR: 'BAD_REQUEST_ERROR',
} as const;

export const AUTH_PROVIDERS = {
  LOCAL: 'local',
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
  APPLE: 'apple',
} as const;

export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
} as const;

export const AD_CATEGORIES = {
  ELECTRONICS: 'electronics',
  VEHICLES: 'vehicles',
  PROPERTY: 'property',
  FASHION: 'fashion',
  HOME_GARDEN: 'home_garden',
  SPORTS: 'sports',
  BOOKS: 'books',
  PETS: 'pets',
  SERVICES: 'services',
  OTHER: 'other',
} as const;

export const AD_CONDITIONS = {
  NEW: 'new',
  USED: 'used',
} as const;

export const AD_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  SOLD: 'sold',
  ARCHIVED: 'archived',
  REJECTED: 'rejected',
} as const;

export const MEDIA_CONSTANTS = {
  ALLOWED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'webp', 'gif'] as string[],
  ALLOWED_VIDEO_FORMATS: ['mp4', 'mov', 'avi', 'webm'] as string[],
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_FILES_PER_UPLOAD: 10,
} as const;

export type AuthProvider = (typeof AUTH_PROVIDERS)[keyof typeof AUTH_PROVIDERS];
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export type AdCategory = (typeof AD_CATEGORIES)[keyof typeof AD_CATEGORIES];
export type AdCondition = (typeof AD_CONDITIONS)[keyof typeof AD_CONDITIONS];
export type AdStatus = (typeof AD_STATUS)[keyof typeof AD_STATUS];

