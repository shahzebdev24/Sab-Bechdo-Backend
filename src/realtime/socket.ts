import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '@core/auth/jwt.js';
import { AuthError } from '@core/errors/app-error.js';
import * as chatService from '@modules/chat/chat.service.js';
import * as notificationsService from '@modules/notifications/notifications.service.js';
import { logger } from '@config/logger.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
}

// Global io instance
let ioInstance: Server | null = null;

export const getIO = (): Server | null => ioInstance;

export const initializeSocketIO = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // Configure based on your needs
      methods: ['GET', 'POST'],
    },
  });

  // Store global instance
  ioInstance = io;

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        throw new AuthError('Authentication token required');
      }

      const decoded = verifyAccessToken(token);
      socket.userId = decoded.userId;
      socket.email = decoded.email;

      next();
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Socket authentication failed');
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    logger.info(`User connected: ${userId}`);

    // Join user's personal room for notifications
    socket.join(`user:${userId}`);

    // Chat events
    socket.on('join_conversation', async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data;
        
        if (!conversationId) {
          socket.emit('error', { message: 'Conversation ID is required' });
          return;
        }
        
        // Verify user is participant
        const conversation = await chatService.getConversation(conversationId, userId);
        
        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }
        
        socket.join(`conversation:${conversationId}`);
        logger.info(
          { userId, conversationId, adId: conversation.ad?.toString() },
          'User joined conversation'
        );
      } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Error joining conversation');
        socket.emit('error', { 
          message: error instanceof Error ? error.message : 'Failed to join conversation' 
        });
      }
    });

    socket.on('leave_conversation', (data: { conversationId: string }) => {
      const { conversationId } = data;
      socket.leave(`conversation:${conversationId}`);
      logger.info(`User ${userId} left conversation ${conversationId}`);
    });

    socket.on('message:send', async (data: { conversationId: string; body: string }) => {
      try {
        const { conversationId, body } = data;

        // Validate message body
        if (!body || body.trim().length === 0) {
          socket.emit('error', { message: 'Message body cannot be empty' });
          return;
        }

        if (body.length > 2000) {
          socket.emit('error', { message: 'Message is too long (max 2000 characters)' });
          return;
        }

        // Save message
        const message = await chatService.sendMessage(conversationId, userId, body.trim());

        // Populate message with sender/receiver info
        await message.populate('sender', 'name avatarUrl username');
        await message.populate('receiver', 'name avatarUrl username');

        // Broadcast to conversation room
        io.to(`conversation:${conversationId}`).emit('message:new', {
          message,
          conversationId,
        });

        // Create notification for receiver
        const conversation = await chatService.getConversation(conversationId, userId);
        const receiverId = conversation.participants
          .find((p) => p.toString() !== userId)
          ?.toString();

        if (receiverId) {
          // Get ad info for notification context
          const adTitle = conversation.ad ? (conversation.ad as any).title : 'an item';
          
          const notification = await notificationsService.createNotification(
            receiverId,
            'chat',
            'New message',
            `New message about ${adTitle}: ${body.substring(0, 100)}`,
            { 
              conversationId, 
              senderId: userId,
              adId: conversation.ad ? conversation.ad.toString() : undefined,
            }
          );

          // Send notification to receiver (only if notification was created)
          if (notification) {
            io.to(`user:${receiverId}`).emit('notification:new', notification);
          }
        }

        logger.info(
          { conversationId, senderId: userId, messageLength: body.length },
          'Message sent successfully'
        );
      } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Error sending message');
        socket.emit('error', { 
          message: error instanceof Error ? error.message : 'Failed to send message' 
        });
      }
    });

    socket.on('message:read', async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data;
        const result = await chatService.markAsRead(conversationId, userId);

        // Notify other participant that messages were read
        socket.to(`conversation:${conversationId}`).emit('messages:read', {
          conversationId,
          userId,
          count: result.count,
        });

        logger.info(
          { conversationId, userId, count: result.count },
          'Messages marked as read'
        );
      } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Error marking messages as read');
      }
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${userId}`);
    });
  });

  return io;
};

// Helper function to emit notifications (can be called from services)
export const emitNotification = (userId: string, notification: any): void => {
  if (ioInstance) {
    // Emit generic notification event
    ioInstance.to(`user:${userId}`).emit('notification:new', notification);
    
    // Also emit type-specific event for better filtering on frontend
    if (notification.type) {
      ioInstance.to(`user:${userId}`).emit(`notification:${notification.type}`, notification);
    }
  }
};

// Helper function to emit notification removal (for like/unlike behavior)
export const emitNotificationRemoval = (userId: string, data: { type: string; adId?: string; userId?: string; action?: string }): void => {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit('notification:removed', data);
  }
};
