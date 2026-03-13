import mongoose, { Schema, Document } from 'mongoose';
import {
  AD_CATEGORIES,
  AD_CONDITIONS,
  AD_STATUS,
  AdCategory,
  AdCondition,
  AdStatus,
} from '@common/constants.js';

export type { AdCategory, AdCondition, AdStatus };

export interface AdLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export interface IAd {
  title: string;
  description: string;
  price: number;
  currency: string;
  category: AdCategory;
  condition: AdCondition;
  owner: mongoose.Types.ObjectId;
  photoUrls: string[];
  videoUrl?: string;
  location: AdLocation;
  status: AdStatus;
  views: number;
  viewedBy: mongoose.Types.ObjectId[];
  likesCount: number;
  commentsCount: number;
  isDeleted: boolean;
  rejectionReason?: string;
  resubmittedAt?: Date;
  previousStatus?: AdStatus;
}

export interface AdDocument extends IAd, Document {
  createdAt: Date;
  updatedAt: Date;
}

const adLocationSchema = new Schema<AdLocation>(
  {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number,
      default: null,
    },
    address: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const adSchema = new Schema<AdDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'PKR',
      uppercase: true,
    },
    category: {
      type: String,
      enum: Object.values(AD_CATEGORIES),
      required: true,
    },
    condition: {
      type: String,
      enum: Object.values(AD_CONDITIONS),
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    photoUrls: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 5,
        message: 'Maximum 5 photos allowed',
      },
    },
    videoUrl: {
      type: String,
      default: null,
    },
    location: {
      type: adLocationSchema,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(AD_STATUS),
      default: AD_STATUS.PENDING,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewedBy: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    resubmittedAt: {
      type: Date,
      default: null,
    },
    previousStatus: {
      type: String,
      enum: Object.values(AD_STATUS),
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as mongoose.Types.ObjectId).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Text index for search
adSchema.index({ title: 'text', description: 'text' });

// Compound indexes for filtering
adSchema.index({ category: 1, status: 1, isDeleted: 1 });
adSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });
adSchema.index({ owner: 1, status: 1, isDeleted: 1 });
adSchema.index({ isDeleted: 1 });

// Geospatial index for location-based queries
adSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

export const Ad = mongoose.model<AdDocument>('Ad', adSchema);
