import * as notificationsRepository from './notifications.repository.js';
import { NotificationDocument, NotificationType } from '@models/notification.model.js';
import { ListNotificationsQueryDto, MarkAsReadDto } from './notifications.validation.js';
import { User } from '@models/user.model.js';
import { emitNotification, emitNotificationRemoval } from '../../realtime/socket.js';

export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<NotificationDocument | null> => {
  // Load user preferences to check if this notification type is enabled
  const user = await User.findById(userId).select('preferences');
  if (!user) {
    return null; // User not found, skip notification
  }

  // Map notification types to preference keys
  const preferenceMap: Record<NotificationType, keyof typeof user.preferences.notifications> = {
    like: 'likes',
    comment: 'comments',
    follow: 'follows',
    chat: 'chat',
    offer: 'system',
    system: 'system',
    ad_status: 'system',
  };

  const preferenceKey = preferenceMap[type];
  
  // Check if user has disabled this notification type
  if (preferenceKey && user.preferences?.notifications?.[preferenceKey] === false) {
    return null; // User has disabled this notification type
  }

  const notification = await notificationsRepository.create(userId, type, title, body, data);
  
  // Emit real-time notification via Socket.IO
  if (notification) {
    emitNotification(userId, notification);
  }

  return notification;
};

export const listNotifications = async (
  userId: string,
  query: ListNotificationsQueryDto
): Promise<{
  notifications: NotificationDocument[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const { page, limit, onlyUnread } = query;
  const { notifications, total } = await notificationsRepository.findByUser(
    userId,
    page,
    limit,
    onlyUnread
  );

  const unreadCount = await notificationsRepository.countUnread(userId);

  return {
    notifications,
    total,
    unreadCount,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const markAsRead = async (_userId: string, data: MarkAsReadDto): Promise<{ count: number }> => {
  const count = await notificationsRepository.markAsRead(data.ids);
  return { count };
};

export const markAllAsRead = async (userId: string): Promise<{ count: number }> => {
  const count = await notificationsRepository.markAllAsRead(userId);
  return { count };
};

export const getUnreadCount = async (userId: string): Promise<{ count: number }> => {
  const count = await notificationsRepository.countUnread(userId);
  return { count };
};

/**
 * Remove notification by action (for like/unlike behavior)
 * This ensures that if a user likes then unlikes, the notification is removed
 */
export const removeNotificationByAction = async (
  userId: string,
  type: NotificationType,
  data: Record<string, unknown>
): Promise<void> => {
  const deletedCount = await notificationsRepository.deleteByTypeAndData(userId, type, data);
  
  // Emit real-time notification removal via Socket.IO if any notifications were deleted
  if (deletedCount > 0) {
    emitNotificationRemoval(userId, {
      type,
      adId: data.adId as string,
      userId: data.userId as string,
      action: data.action as string,
    });
  }
};
