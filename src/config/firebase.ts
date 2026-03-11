import admin from 'firebase-admin';
import config from './index.js';
import logger from './logger.js';

let firebaseInitialized = false;

export const initializeFirebase = (): void => {
  if (firebaseInitialized) {
    logger.warn('Firebase Admin already initialized');
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      }),
    });

    firebaseInitialized = true;
    logger.info('Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
};

export const getFirebaseAuth = () => {
  if (!firebaseInitialized) {
    throw new Error('Firebase Admin not initialized. Call initializeFirebase() first.');
  }
  return admin.auth();
};

export { admin };
