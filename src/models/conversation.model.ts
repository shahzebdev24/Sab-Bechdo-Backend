import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation {
  participants: mongoose.Types.ObjectId[];
  buyer: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  ad?: mongoose.Types.ObjectId;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCounts: Map<string, number>;
}

export interface ConversationDocument extends IConversation, Document {
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<ConversationDocument>(
  {
    participants: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      required: true,
      validate: {
        validator: (v: mongoose.Types.ObjectId[]) => v.length === 2,
        message: 'Conversation must have exactly 2 participants',
      },
    },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ad: {
      type: Schema.Types.ObjectId,
      ref: 'Ad',
      default: null,
    },
    lastMessage: {
      type: String,
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
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

// Unique conversation per buyer-seller-ad combination
conversationSchema.index({ buyer: 1, seller: 1, ad: 1 }, { unique: true });
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

export const Conversation = mongoose.model<ConversationDocument>('Conversation', conversationSchema);
