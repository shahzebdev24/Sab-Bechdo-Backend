import mongoose, { Schema, Document } from 'mongoose';

export const OFFER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export type OfferStatus = (typeof OFFER_STATUS)[keyof typeof OFFER_STATUS];

export interface IOffer {
  ad: mongoose.Types.ObjectId;
  fromUser: mongoose.Types.ObjectId;
  toUser: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: OfferStatus;
  message?: string;
}

export interface OfferDocument extends IOffer, Document {
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<OfferDocument>(
  {
    ad: {
      type: Schema.Types.ObjectId,
      ref: 'Ad',
      required: true,
      index: true,
    },
    fromUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    toUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'PKR',
      uppercase: true,
    },
    status: {
      type: String,
      enum: Object.values(OFFER_STATUS),
      default: OFFER_STATUS.PENDING,
      index: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
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

// Composite index for finding offers from a user on a specific ad
offerSchema.index({ ad: 1, fromUser: 1 });
offerSchema.index({ ad: 1, status: 1 });

export const Offer = mongoose.model<OfferDocument>('Offer', offerSchema);
