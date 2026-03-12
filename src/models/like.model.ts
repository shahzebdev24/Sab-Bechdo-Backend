import mongoose, { Schema, Document } from 'mongoose';

export interface ILike {
  user: mongoose.Types.ObjectId;
  ad: mongoose.Types.ObjectId;
}

export interface LikeDocument extends ILike, Document {
  createdAt: Date;
}

const likeSchema = new Schema<LikeDocument>(
  {
    user: {
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
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

// Unique constraint: one like per user per ad
likeSchema.index({ user: 1, ad: 1 }, { unique: true });

export const Like = mongoose.model<LikeDocument>('Like', likeSchema);
