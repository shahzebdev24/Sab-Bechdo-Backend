import * as authRepository from './auth.repository.js';
import {
  SignupDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  FirebaseAuthDto,
} from './auth.validation.js';
import { hashPassword, comparePassword } from '@core/auth/password.js';
import { generateAuthTokens, verifyRefreshToken } from '@core/auth/jwt.js';
import { AuthError, ConflictError, NotFoundError } from '@core/errors/app-error.js';
import { AuthTokens, UserResponse } from '@core/types/index.js';
import { UserDocument } from '@models/user.model.js';
import { sendPasswordResetEmail } from '@common/services/email.service.js';
import { AUTH_CONSTANTS, AUTH_PROVIDERS } from '@common/constants.js';
import { generateRandomToken } from '@common/utils.js';
import { UserMapper } from '@common/mappers/user.mapper.js';
import { getFirebaseAuth } from '@config/firebase.js';

const mapToUserResponse = (user: UserDocument): UserResponse => {
  return UserMapper.toResponse(user);
};

export const signup = async (data: SignupDto): Promise<{ user: UserResponse; tokens: AuthTokens }> => {
  const existingUser = await authRepository.findByEmail(data.email);
  
  if (existingUser) {
    // Check if local provider is already linked
    const hasLocalProvider = await authRepository.isProviderLinked(
      existingUser._id.toString(),
      AUTH_PROVIDERS.LOCAL
    );
    
    if (hasLocalProvider) {
      throw new ConflictError('Email already registered. Please login with your email and password.');
    }
    
    // User exists with social provider, link local provider
    const hashedPassword = await hashPassword(data.password);
    const updatedUser = await authRepository.updatePasswordAndLinkLocal(
      existingUser._id.toString(),
      hashedPassword
    );
    
    if (!updatedUser) {
      throw new AuthError('Failed to link local provider');
    }
    
    const tokens = generateAuthTokens(updatedUser._id.toString(), updatedUser.email, updatedUser.role);
    await authRepository.saveRefreshToken(updatedUser._id.toString(), tokens.refreshToken);
    
    return {
      user: mapToUserResponse(updatedUser),
      tokens,
    };
  }

  // New user - create account
  const hashedPassword = await hashPassword(data.password);

  const user = await authRepository.create({
    email: data.email,
    name: data.name,
    password: hashedPassword,
  });

  // Link local provider
  await authRepository.linkProvider(user._id.toString(), AUTH_PROVIDERS.LOCAL, null);

  const tokens = generateAuthTokens(user._id.toString(), user.email, user.role);
  
  await authRepository.saveRefreshToken(user._id.toString(), tokens.refreshToken);

  return {
    user: mapToUserResponse(user),
    tokens,
  };
};

export const login = async (data: LoginDto): Promise<{ user: UserResponse; tokens: AuthTokens }> => {
  const user = await authRepository.findByEmail(data.email);
  if (!user || !user.password) {
    throw new AuthError('Invalid email or password');
  }

  const isPasswordValid = await comparePassword(data.password, user.password);
  if (!isPasswordValid) {
    throw new AuthError('Invalid email or password');
  }

  const tokens = generateAuthTokens(user._id.toString(), user.email, user.role);
  
  await authRepository.saveRefreshToken(user._id.toString(), tokens.refreshToken);

  return {
    user: mapToUserResponse(user),
    tokens,
  };
};

export const forgotPassword = async (data: ForgotPasswordDto): Promise<void> => {
  const user = await authRepository.findByEmail(data.email);
  if (!user) {
    return;
  }

  const resetToken = generateRandomToken();
  const resetTokenExpiry = new Date(
    Date.now() + AUTH_CONSTANTS.PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000
  );

  await authRepository.updateResetToken(user._id.toString(), resetToken, resetTokenExpiry);
  await sendPasswordResetEmail(user.email, user.name, resetToken);
};

export const resetPassword = async (data: ResetPasswordDto): Promise<void> => {
  const user = await authRepository.findByResetToken(data.token);
  if (!user) {
    throw new AuthError('Invalid or expired reset token');
  }

  const hashedPassword = await hashPassword(data.password);
  await authRepository.updatePassword(user._id.toString(), hashedPassword);
};

export const refreshToken = async (refreshToken: string): Promise<AuthTokens> => {
  const decoded = verifyRefreshToken(refreshToken);

  const user = await authRepository.findByRefreshToken(refreshToken);
  if (!user) {
    throw new AuthError('Invalid or revoked refresh token');
  }

  if (user._id.toString() !== decoded.userId) {
    throw new AuthError('Token user mismatch');
  }

  const newTokens = generateAuthTokens(user._id.toString(), user.email, user.role);

  await authRepository.saveRefreshToken(user._id.toString(), newTokens.refreshToken);

  return newTokens;
};

export const firebaseAuth = async (
  data: FirebaseAuthDto
): Promise<{ user: UserResponse; tokens: AuthTokens }> => {
  try {
    const firebaseAuth = getFirebaseAuth();

    // Verify Firebase ID token
    const decodedToken = await firebaseAuth.verifyIdToken(data.token);

    const { uid, email, name, firebase } = decodedToken;

    if (!email) {
      throw new AuthError('Email not provided by Firebase authentication');
    }

    // Determine provider from Firebase sign-in method
    const signInProvider = firebase?.sign_in_provider || 'password';
    let authProvider: typeof AUTH_PROVIDERS[keyof typeof AUTH_PROVIDERS] = AUTH_PROVIDERS.LOCAL;

    if (signInProvider === 'google.com') {
      authProvider = AUTH_PROVIDERS.GOOGLE;
    } else if (signInProvider === 'facebook.com') {
      authProvider = AUTH_PROVIDERS.FACEBOOK;
    } else if (signInProvider === 'apple.com') {
      authProvider = AUTH_PROVIDERS.APPLE;
    }

    // Try to find user by Firebase UID and provider
    let user = await authRepository.findByLinkedProvider(authProvider, uid);

    if (!user) {
      // Check if user exists with this email (account linking scenario)
      const existingUser = await authRepository.findByEmail(email);

      if (existingUser) {
        // Account linking: Link new provider to existing account
        const isAlreadyLinked = await authRepository.isProviderLinked(
          existingUser._id.toString(),
          authProvider
        );

        if (isAlreadyLinked) {
          // Provider already linked, just login
          user = existingUser;
        } else {
          // Link new provider to existing account (keep existing name)
          user = await authRepository.linkProvider(existingUser._id.toString(), authProvider, uid);

          if (!user) {
            throw new AuthError('Failed to link provider');
          }
        }
      } else {
        // New user: Create account with this provider
        user = await authRepository.create({
          email,
          name: name || 'User',
        });

        // Link the provider
        await authRepository.linkProvider(user._id.toString(), authProvider, uid);
      }
    }

    // Generate JWT tokens
    const tokens = generateAuthTokens(user._id.toString(), user.email, user.role);

    await authRepository.saveRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      user: mapToUserResponse(user),
      tokens,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError('Invalid or expired Firebase token');
  }
};

export const getProfile = async (userId: string): Promise<UserResponse> => {
  const user = await authRepository.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  return mapToUserResponse(user);
};

export const logout = async (userId: string): Promise<void> => {
  await authRepository.revokeRefreshToken(userId);
};
