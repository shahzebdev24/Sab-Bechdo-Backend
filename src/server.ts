import { createApp } from './app.js';
import { config } from '@config/index.js';
import { logger } from '@config/logger.js';
import { connectDatabase, disconnectDatabase } from '@config/database.js';
import { initializeFirebase } from '@config/firebase.js';
import { createServer } from 'http';
import { initializeSocketIO } from './realtime/socket.js';

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Initialize Firebase Admin SDK
    initializeFirebase();

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.IO
    const io = initializeSocketIO(httpServer);
    logger.info('Socket.IO initialized');

    // Start server
    const server = httpServer.listen(config.port, () => {
      logger.info(
        {
          port: config.port,
          env: config.nodeEnv,
          apiVersion: config.apiVersion,
        },
        'Server started successfully with Socket.IO'
      );
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error({ port: config.port }, `Port ${config.port} is already in use`);
      } else {
        logger.error({ error: error.message, stack: error.stack }, 'Server error');
      }
      process.exit(1);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info({ signal }, 'Received shutdown signal');

      // Close Socket.IO connections
      io.close(() => {
        logger.info('Socket.IO closed');
      });

      server.close(async () => {
        logger.info('Server closed');
        await disconnectDatabase();
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error: any) {
    logger.error({ 
      error: error.message, 
      stack: error.stack,
      name: error.name 
    }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Promise Rejection');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught Exception');
  process.exit(1);
});
