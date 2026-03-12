import { Notification, NotificationDocument, NotificationType } from '@models/notification.model.js';
import mongoose from 'mongoose';

export const create = async (
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<NotificationDocument> => {
  const notification = new Notification({
    user: new mongoose.Types.ObjectId(userId),
    type,
    title,
    body,
    data,
    isRead: false,
  });
  return await notification.save();
};

export const findByUser = async (
  userId: string,
  page: number,
  limit: number,
  onlyUnread: boolean = false
): Promise<{ notifications: NotificationDocument[]; total: number }> => {
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = { user: new mongoose.Types.ObjectId(userId) };

  if (onlyUnread) {
    filter.isRead = false;
  }

  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);

  return { notifications, total };
};

export const markAsRead = async (notificationIds: string[]): Promise<number> => {
  const result = await Notification.updateMany(
    { _id: { $in: notificationIds.map((id) => new mongoose.Types.ObjectId(id)) } },
    { $set: { isRead: true } }
  );
  return result.modifiedCount;
};

export const markAllAsRead = async (userId: string): Promise<number> => {
  const result = await Notification.updateMany(
    { user: new mongoose.Types.ObjectId(userId), isRead: false },
    { $set: { isRead: true } }
  );
  return result.modifiedCount;
};

export const countUnread = async (userId: string): Promise<number> => {
  return await Notification.countDocuments({
    user: new mongoose.Types.ObjectId(userId),
    isRead: false,
  });
};

export const deleteById = async (notificationId: string): Promise<boolean> => {
  const result = await Notification.findByIdAndDelete(notificationId);
  return result !== null;
};
