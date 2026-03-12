import { Conversation, ConversationDocument } from '@models/conversation.model.js';
import { Message, MessageDocument } from '@models/message.model.js';
import mongoose from 'mongoose';

// Conversations
export const createConversation = async (
  buyerId: string,
  sellerId: string,
  adId?: string
): Promise<ConversationDocument> => {
  const conversation = new Conversation({
    participants: [new mongoose.Types.ObjectId(buyerId), new mongoose.Types.ObjectId(sellerId)],
    buyer: new mongoose.Types.ObjectId(buyerId),
    seller: new mongoose.Types.ObjectId(sellerId),
    ad: adId ? new mongoose.Types.ObjectId(adId) : null,
    unreadCounts: new Map([
      [buyerId, 0],
      [sellerId, 0],
    ]),
  });
  return await conversation.save();
};

export const findConversation = async (
  buyerId: string,
  sellerId: string,
  adId?: string
): Promise<ConversationDocument | null> => {
  const filter: Record<string, unknown> = {
    buyer: new mongoose.Types.ObjectId(buyerId),
    seller: new mongoose.Types.ObjectId(sellerId),
  };

  if (adId) {
    filter.ad = new mongoose.Types.ObjectId(adId);
  } else {
    filter.ad = null;
  }

  return await Conversation.findOne(filter)
    .populate('buyer', 'name avatarUrl username')
    .populate('seller', 'name avatarUrl username')
    .populate('ad', 'title photoUrls price');
};

export const findConversationById = async (id: string): Promise<ConversationDocument | null> => {
  return await Conversation.findById(id)
    .populate('buyer', 'name avatarUrl username')
    .populate('seller', 'name avatarUrl username')
    .populate('ad', 'title photoUrls price');
};

export const listUserConversations = async (
  userId: string,
  page: number,
  limit: number
): Promise<{ conversations: ConversationDocument[]; total: number }> => {
  const skip = (page - 1) * limit;

  const [conversations, total] = await Promise.all([
    Conversation.find({ participants: new mongoose.Types.ObjectId(userId) })
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('buyer', 'name avatarUrl username')
      .populate('seller', 'name avatarUrl username')
      .populate('ad', 'title photoUrls price'),
    Conversation.countDocuments({ participants: new mongoose.Types.ObjectId(userId) }),
  ]);

  return { conversations, total };
};

export const updateConversation = async (
  conversationId: string,
  lastMessage: string,
  receiverId: string
): Promise<void> => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return;

  conversation.lastMessage = lastMessage;
  conversation.lastMessageAt = new Date();

  // Increment unread count for receiver
  const currentCount = conversation.unreadCounts.get(receiverId) || 0;
  conversation.unreadCounts.set(receiverId, currentCount + 1);

  await conversation.save();
};

export const markConversationAsRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  await Conversation.findByIdAndUpdate(conversationId, {
    [`unreadCounts.${userId}`]: 0,
  });
};

// Messages
export const createMessage = async (
  conversationId: string,
  senderId: string,
  receiverId: string,
  body: string
): Promise<MessageDocument> => {
  const message = new Message({
    conversation: new mongoose.Types.ObjectId(conversationId),
    sender: new mongoose.Types.ObjectId(senderId),
    receiver: new mongoose.Types.ObjectId(receiverId),
    body,
  });
  return await message.save();
};

export const listMessages = async (
  conversationId: string,
  page: number,
  limit: number
): Promise<{ messages: MessageDocument[]; total: number }> => {
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find({ conversation: new mongoose.Types.ObjectId(conversationId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name avatarUrl username')
      .populate('receiver', 'name avatarUrl username'),
    Message.countDocuments({ conversation: new mongoose.Types.ObjectId(conversationId) }),
  ]);

  return { messages: messages.reverse(), total };
};

export const markMessagesAsRead = async (
  conversationId: string,
  userId: string
): Promise<number> => {
  const result = await Message.updateMany(
    {
      conversation: new mongoose.Types.ObjectId(conversationId),
      receiver: new mongoose.Types.ObjectId(userId),
      readAt: null,
    },
    { $set: { readAt: new Date() } }
  );
  return result.modifiedCount;
};
