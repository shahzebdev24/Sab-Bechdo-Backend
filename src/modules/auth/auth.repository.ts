import { User, UserDocument, CreateUserInput } from '@models/user.model.js';
import { AuthProvider, AUTH_PROVIDERS } from '@common/constants.js';
import { sanitizeEmail } from '@common/utils.js';

export const findByEmail = async (email: string): Promise<UserDocument | null> => {
  const sanitized = sanitizeEmail(email);
  return User.findOne({ email: sanitized }).select('+password').exec();
};

export const findById = async (id: string): Promise<UserDocument | null> => {
  return User.findById(id).select('+password').exec();
};

export const create = async (data: CreateUserInput): Promise<UserDocument> => {
  const sanitized = sanitizeEmail(data.email);
  const user = new User({
    ...data,
    email: sanitized,
  });
  return user.save();
};

export const updateResetToken = async (
  userId: string,
  resetToken: string,
  resetTokenExpiry: Date
): Promise<void> => {
  await User.findByIdAndUpdate(userId, {
    resetToken,
    resetTokenExpiry,
  }).exec();
};

export const findByResetToken = async (token: string): Promise<UserDocument | null> => {
  return User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: new Date() },
  })
    .select('+resetToken +resetTokenExpiry')
    .exec();
};

export const updatePassword = async (userId: string, hashedPassword: string): Promise<void> => {
  await User.findByIdAndUpdate(userId, {
    password: hashedPassword,
    $unset: { resetToken: 1, resetTokenExpiry: 1 },
  }).exec();
};

export const saveRefreshToken = async (userId: string, refreshToken: string): Promise<void> => {
  await User.findByIdAndUpdate(userId, {
    refreshToken,
  }).exec();
};

export const findByRefreshToken = async (refreshToken: string): Promise<UserDocument | null> => {
  return User.findOne({ refreshToken }).select('+refreshToken').exec();
};

export const revokeRefreshToken = async (userId: string): Promise<void> => {
  await User.findByIdAndUpdate(userId, {
    $unset: { refreshToken: 1 },
  }).exec();
};

export const findByLinkedProvider = async (
  provider: AuthProvider,
  providerId: string
): Promise<UserDocument | null> => {
  return User.findOne({
    linkedProviders: {
      $elemMatch: { provider, providerId },
    },
  }).exec();
};

export const linkProvider = async (
  userId: string,
  provider: AuthProvider,
  providerId: string | null
): Promise<UserDocument | null> => {
  return User.findByIdAndUpdate(
    userId,
    {
      $addToSet: {
        linkedProviders: {
          provider,
          providerId,
          linkedAt: new Date(),
        },
      },
    },
    { new: true }
  ).exec();
};

export const isProviderLinked = async (
  userId: string,
  provider: AuthProvider
): Promise<boolean> => {
  const user = await User.findOne({
    _id: userId,
    'linkedProviders.provider': provider,
  }).exec();
  
  return !!user;
};

export const updatePasswordAndLinkLocal = async (
  userId: string,
  hashedPassword: string
): Promise<UserDocument | null> => {
  return User.findByIdAndUpdate(
    userId,
    {
      password: hashedPassword,
      $addToSet: {
        linkedProviders: {
          provider: AUTH_PROVIDERS.LOCAL,
          providerId: null,
          linkedAt: new Date(),
        },
      },
    },
    { new: true }
  ).exec();
};
