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
        
        // Verify user is participant
        await chatService.getConversation(conversationId, userId);
        
        socket.join(`conversation:${conversationId}`);
        logger.info(`User ${userId} joined conversation ${conversationId}`);
      } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Error joining conversation');
        socket.emit('error', { message: 'Failed to join conversation' });
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

        // Save message
        const message = await chatService.sendMessage(conversationId, userId, body);

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
          const notification = await notificationsService.createNotification(
            receiverId,
            'chat',
            'New message',
            body.substring(0, 100),
            { conversationId, senderId: userId }
          );

          // Send notification to receiver (only if notification was created)
          if (notification) {
            io.to(`user:${receiverId}`).emit('notification:new', notification);
          }
        }

        logger.info(`Message sent in conversation ${conversationId}`);
      } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Error sending message');
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('message:read', async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data;
        await chatService.markAsRead(conversationId, userId);

        // Notify other participant
        socket.to(`conversation:${conversationId}`).emit('messages:read', {
          conversationId,
          userId,
        });
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
export const emitNotification = (userId: string, notification: unknown): void => {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit('notification:new', notification);
  }
};
