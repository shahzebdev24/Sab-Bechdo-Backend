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
  linkedProviders?: LinkedProviderResponse[];
  createdAt: Date;
}
