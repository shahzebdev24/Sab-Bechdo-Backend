import { z } from 'zod';

export const createConversationSchema = z.object({
  sellerId: z.string().min(1, 'Seller ID is required'),
  adId: z.string().optional(), // Optional — ad-based or general conversation
});

export const sendMessageSchema = z.object({
  body: z.string().min(1).max(2000),
});

export const listConversationsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const listMessagesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateConversationDto = z.infer<typeof createConversationSchema>;
export type SendMessageDto = z.infer<typeof sendMessageSchema>;
export type ListConversationsQueryDto = z.infer<typeof listConversationsQuerySchema>;
export type ListMessagesQueryDto = z.infer<typeof listMessagesQuerySchema>;
