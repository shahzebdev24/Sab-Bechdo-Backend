import mongoose, { Schema, Document } from 'mongoose';

export interface IComment {
  ad: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  text: string;
  parentComment?: mongoose.Types.ObjectId;
}

export interface CommentDocument extends IComment, Document {
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<CommentDocument>(
  {
    ad: {
      type: Schema.Types.ObjectId,
      ref: 'Ad',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
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

commentSchema.index({ ad: 1, createdAt: -1 });

export const Comment = mongoose.model<CommentDocument>('Comment', commentSchema);
