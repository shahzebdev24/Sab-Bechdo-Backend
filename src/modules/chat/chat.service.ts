import * as chatRepository from './chat.repository.js';
import { NotFoundError, BadRequestError } from '@core/errors/app-error.js';
import { ConversationDocument } from '@models/conversation.model.js';
import { MessageDocument } from '@models/message.model.js';
import { Ad } from '@models/ad.model.js';
import { User } from '@models/user.model.js';
import {
  CreateConversationDto,
  ListConversationsQueryDto,
  ListMessagesQueryDto,
} from './chat.validation.js';
import { logger } from '@config/logger.js';

export const createOrGetConversation = async (
  buyerId: string,
  data: CreateConversationDto
): Promise<ConversationDocument> => {
  const { sellerId, adId } = data;

  // Validate: User cannot chat with themselves
  if (buyerId === sellerId) {
    throw new BadRequestError('You cannot start a conversation with yourself');
  }

  // Validate: Ad exists and is accessible
  const ad = await Ad.findById(adId);
  if (!ad) {
    throw new NotFoundError('Ad not found');
  }
  if (ad.isDeleted) {
    throw new BadRequestError('This ad is no longer available');
  }

  // Validate: Seller exists
  const seller = await User.findById(sellerId);
  if (!seller) {
    throw new NotFoundError('Seller not found');
  }

  // Validate: Seller owns the ad
  if (ad.owner.toString() !== sellerId) {
    throw new BadRequestError('The specified seller does not own this ad');
  }

  // Try to find existing conversation for this buyer-seller-ad combination
  let conversation = await chatRepository.findConversation(buyerId, sellerId, adId);

  if (conversation) {
    logger.info(
      { conversationId: conversation._id.toString(), buyerId, sellerId, adId },
      'Existing conversation found'
    );
    return conversation;
  }

  // Create new conversation
  conversation = await chatRepository.createConversation(buyerId, sellerId, adId);
  
  logger.info(
    { conversationId: conversation._id.toString(), buyerId, sellerId, adId },
    'New conversation created'
  );

  return conversation;
};

export const getConversation = async (
  conversationId: string,
  userId: string
): Promise<ConversationDocument> => {
  const conversation = await chatRepository.findConversationById(conversationId);

  if (!conversation) {
    throw new NotFoundError('Conversation not found');
  }

  // Verify user is a participant
  const isParticipant = conversation.participants.some(
    (p) => p.toString() === userId
  );

  if (!isParticipant) {
    throw new BadRequestError('You are not a participant in this conversation');
  }

  return conversation;
};

export const listConversations = async (
  userId: string,
  query: ListConversationsQueryDto
): Promise<{
  conversations: ConversationDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const { page, limit } = query;
  const { conversations, total } = await chatRepository.listUserConversations(userId, page, limit);

  return {
    conversations,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const listMessages = async (
  conversationId: string,
  userId: string,
  query: ListMessagesQueryDto
): Promise<{
  messages: MessageDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  // Verify user is participant
  await getConversation(conversationId, userId);

  // Ensure page and limit are numbers
  const page = Number(query.page);
  const limit = Number(query.limit);
  
  const { messages, total } = await chatRepository.listMessages(conversationId, page, limit);

  return {
    messages,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const markAsRead = async (conversationId: string, userId: string): Promise<{ count: number }> => {
  // Verify user is participant
  await getConversation(conversationId, userId);

  const count = await chatRepository.markMessagesAsRead(conversationId, userId);
  await chatRepository.markConversationAsRead(conversationId, userId);

  return { count };
};

export const getUnreadCounts = async (userId: string): Promise<Array<{ conversationId: string; count: number }>> => {
  const { conversations } = await chatRepository.listUserConversations(userId, 1, 100);
  
  const counts = conversations.map(conv => {
    const unreadCount = conv.unreadCounts.get(userId) || 0;
    return {
      conversationId: conv._id.toString(),
      count: unreadCount,
    };
  });

  return counts;
};

// This will be called from Socket.IO handler
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  body: string
): Promise<MessageDocument> => {
  const conversation = await chatRepository.findConversationById(conversationId);

  if (!conversation) {
    throw new NotFoundError('Conversation not found');
  }

  // Verify sender is a participant
  const isParticipant = conversation.participants.some(
    (p) => p.toString() === senderId
  );

  if (!isParticipant) {
    throw new BadRequestError('You are not a participant in this conversation');
  }

  // Determine receiver
  const receiverId = conversation.participants
    .find((p) => p.toString() !== senderId)
    ?.toString();

  if (!receiverId) {
    throw new BadRequestError('Receiver not found');
  }

  // Create message
  const message = await chatRepository.createMessage(conversationId, senderId, receiverId, body);

  // Update conversation
  await chatRepository.updateConversation(conversationId, body, receiverId);

  return message;
};
