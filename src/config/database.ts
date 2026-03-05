import mongoose from 'mongoose';
import { config } from './index.js';
import { logger } from './logger.js';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.database.url);
    logger.info('Database connected successfully');

    mongoose.connection.on('error', (error) => {
      logger.error({ error }, 'Database connection error');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Database disconnected');
    });
  } catch (error) {
    logger.error({ error }, 'Failed to connect to database');
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error({ error }, 'Error disconnecting from database');
  }
};
