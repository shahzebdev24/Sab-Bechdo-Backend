export interface JwtPayload {
  userId: string;
  email: string;
  role?: string;
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LinkedProviderResponse {
  provider: string;
  linkedAt: Date;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  username?: string;
  phone?: string;
  location?: {
    city?: string;
    region?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  linkedProviders?: LinkedProviderResponse[];
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
