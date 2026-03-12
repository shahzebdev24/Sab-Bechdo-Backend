import mongoose, { Schema, Document } from 'mongoose';

export interface IFollow {
  follower: mongoose.Types.ObjectId;
  followed: mongoose.Types.ObjectId;
}

export interface FollowDocument extends IFollow, Document {
  createdAt: Date;
}

const followSchema = new Schema<FollowDocument>(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    followed: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

// Unique constraint: one follow per follower-followed pair
followSchema.index({ follower: 1, followed: 1 }, { unique: true });

export const Follow = mongoose.model<FollowDocument>('Follow', followSchema);
