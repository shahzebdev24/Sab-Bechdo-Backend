import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  conversation: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  body: string;
  readAt?: Date;
  deliveredAt?: Date; // When message was delivered to receiver
}

export interface MessageDocument extends IMessage, Document {
  createdAt: Date;
  updatedAt: Date;
  isRead: boolean; // Virtual field for convenience
}

const messageSchema = new Schema<MessageDocument>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    readAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as mongoose.Types.ObjectId).toString();
        ret.isRead = ret.readAt !== null && ret.readAt !== undefined;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Virtual field for isRead
messageSchema.virtual('isRead').get(function(this: MessageDocument) {
  return this.readAt !== null && this.readAt !== undefined;
});

// Index for paginated message history
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, readAt: 1 });

export const Message = mongoose.model<MessageDocument>('Message', messageSchema);
