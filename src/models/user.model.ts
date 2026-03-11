import mongoose, { Schema, Document } from 'mongoose';
import { AUTH_PROVIDERS, AuthProvider, USER_ROLES, UserRole } from '@common/constants.js';

export interface LinkedProvider {
  provider: AuthProvider;
  providerId: string | null;
  linkedAt: Date;
}

export interface IUser {
  email: string;
  name: string;
  password?: string;
  role: UserRole;
  linkedProviders: LinkedProvider[]; // All linked authentication methods
  resetToken?: string;
  resetTokenExpiry?: Date;
  refreshToken?: string; // Store current active refresh token
  isEmailVerified: boolean;
  isActive: boolean;
}

export interface UserDocument extends IUser, Document {
  createdAt: Date;
  updatedAt: Date;
}

const linkedProviderSchema = new Schema<LinkedProvider>(
  {
    provider: {
      type: String,
      enum: Object.values(AUTH_PROVIDERS),
      required: true,
    },
    providerId: {
      type: String,
      default: null,
    },
    linkedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      select: false, // Don't include password by default in queries
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CUSTOMER,
      required: true,
    },
    linkedProviders: {
      type: [linkedProviderSchema],
      default: [],
      required: true,
    },
    resetToken: {
      type: String,
      select: false,
    },
    resetTokenExpiry: {
      type: String,
      select: false,
    },
    refreshToken: {
      type: String,
      select: false, // Don't include in queries by default
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as mongoose.Types.ObjectId).toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.resetToken;
        delete ret.resetTokenExpiry;
        delete ret.refreshToken;
        return ret;
      },
    },
  }
);

// Compound index for linkedProviders lookup
userSchema.index({ 'linkedProviders.provider': 1, 'linkedProviders.providerId': 1 });

export const User = mongoose.model<UserDocument>('User', userSchema);

// DTOs for service layer
export interface CreateUserInput {
  email: string;
  name: string;
  password?: string;
}

export interface UpdateUserInput {
  name?: string;
  password?: string;
  isEmailVerified?: boolean;
  isActive?: boolean;
}
