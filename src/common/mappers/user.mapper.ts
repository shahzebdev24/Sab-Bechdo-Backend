import { UserDocument } from '@models/user.model.js';
import { UserResponse, LinkedProviderResponse } from '@core/types/index.js';

export class UserMapper {
  static toResponse(user: UserDocument): UserResponse {
    const linkedProviders: LinkedProviderResponse[] = user.linkedProviders?.map((lp) => ({
      provider: lp.provider,
      linkedAt: lp.linkedAt,
    })) || [];

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      username: user.username,
      phone: user.phone,
      location: user.location,
      linkedProviders: linkedProviders.length > 0 ? linkedProviders : undefined,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static toResponseList(users: UserDocument[]): UserResponse[] {
    return users.map((user) => this.toResponse(user));
  }
}
