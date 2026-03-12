import { z } from 'zod';

// Likes
export const likeAdSchema = z.object({
  adId: z.string(),
});

// Comments
export const createCommentSchema = z.object({
  text: z.string().min(1).max(500),
  parentCommentId: z.string().optional(),
});

export const listCommentsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(['recent', 'oldest']).default('recent'),
});

// Follows
export const followUserSchema = z.object({
  userId: z.string(),
});

export const listFollowsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateCommentDto = z.infer<typeof createCommentSchema>;
export type ListCommentsQueryDto = z.infer<typeof listCommentsQuerySchema>;
export type ListFollowsQueryDto = z.infer<typeof listFollowsQuerySchema>;
