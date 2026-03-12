import mongoose, { Schema, Document } from 'mongoose';

export interface IReview {
  seller: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  ad: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
}

export interface ReviewDocument extends IReview, Document {
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<ReviewDocument>(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ad: {
      type: Schema.Types.ObjectId,
      ref: 'Ad',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
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

// Unique constraint: one review per buyer per ad
reviewSchema.index({ buyer: 1, ad: 1 }, { unique: true });

// Index for seller reviews lookup
reviewSchema.index({ seller: 1, createdAt: -1 });

export const Review = mongoose.model<ReviewDocument>('Review', reviewSchema);
