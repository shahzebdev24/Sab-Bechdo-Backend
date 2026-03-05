import * as authRepository from './auth.repository.js';
import {
  SignupDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SocialAuthDto,
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
    
    const tokens = generateAuthTokens(updatedUser._id.toString(), updatedUser.email);
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

  const tokens = generateAuthTokens(user._id.toString(), user.email);
  
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

  const tokens = generateAuthTokens(user._id.toString(), user.email);
  
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

  const newTokens = generateAuthTokens(user._id.toString(), user.email);

  await authRepository.saveRefreshToken(user._id.toString(), newTokens.refreshToken);

  return newTokens;
};

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

interface FacebookUserInfo {
  id: string;
  name: string;
  email?: string;
}

export const socialAuth = async (data: SocialAuthDto): Promise<{ user: UserResponse; tokens: AuthTokens }> => {
  let userData: { email: string; name: string; id: string; emailVerified: boolean };

  // Verify token with provider
  if (data.provider === 'google') {
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${data.token}`
      );
      
      if (!response.ok) {
        throw new AuthError('Invalid Google token');
      }
      
      const googleData = await response.json() as GoogleUserInfo;
      userData = {
        email: googleData.email,
        name: googleData.name || googleData.given_name || 'User',
        id: googleData.id,
        emailVerified: googleData.verified_email,
      };
    } catch (error) {
      throw new AuthError('Failed to verify Google token');
    }
  } else if (data.provider === 'facebook') {
    try {
      const response = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email&access_token=${data.token}`
      );
      
      if (!response.ok) {
        throw new AuthError('Invalid Facebook token');
      }
      
      const fbData = await response.json() as FacebookUserInfo;
      userData = {
        email: fbData.email || `${fbData.id}@facebook.com`,
        name: fbData.name || 'User',
        id: fbData.id,
        emailVerified: !!fbData.email, // Facebook only returns email if verified
      };
    } catch (error) {
      throw new AuthError('Failed to verify Facebook token');
    }
  } else if (data.provider === 'apple') {
    // Apple token verification is more complex, requires JWT verification
    // For now, accept the data from client (should implement proper verification)
    userData = {
      email: data.email || `apple_user@apple.com`,
      name: data.name || 'User',
      id: `apple_${Date.now()}`,
      emailVerified: true, // Apple verifies emails
    };
  } else {
    throw new AuthError('Unsupported provider');
  }

  // Try to find user by this specific provider and ID
  let user = await authRepository.findByLinkedProvider(data.provider, userData.id);

  if (!user) {
    // Check if user exists with this email (account linking scenario)
    const existingUser = await authRepository.findByEmail(userData.email);
    
    if (existingUser) {
      // Account linking: Link new provider to existing account
      // Only link if email is verified by OAuth provider (security requirement)
      if (!userData.emailVerified) {
        throw new AuthError('Email not verified by provider. Cannot link accounts.');
      }

      // Check if this provider is already linked
      const isAlreadyLinked = await authRepository.isProviderLinked(
        existingUser._id.toString(),
        data.provider
      );

      if (isAlreadyLinked) {
        // Provider already linked, just login
        user = existingUser;
      } else {
        // Link new provider to existing account (keep existing name)
        user = await authRepository.linkProvider(
          existingUser._id.toString(),
          data.provider,
          userData.id
        );
        
        if (!user) {
          throw new AuthError('Failed to link provider');
        }
      }
    } else {
      // New user: Create account with this provider
      user = await authRepository.create({
        email: userData.email,
        name: userData.name,
      });

      // Link the provider
      await authRepository.linkProvider(user._id.toString(), data.provider, userData.id);
    }
  }

  const tokens = generateAuthTokens(user._id.toString(), user.email);
  
  await authRepository.saveRefreshToken(user._id.toString(), tokens.refreshToken);

  return {
    user: mapToUserResponse(user),
    tokens,
  };
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
