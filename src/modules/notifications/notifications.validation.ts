import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  onlyUnread: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export const markAsReadSchema = z.object({
  ids: z.array(z.string()).min(1),
});

export type ListNotificationsQueryDto = z.infer<typeof listNotificationsQuerySchema>;
export type MarkAsReadDto = z.infer<typeof markAsReadSchema>;
