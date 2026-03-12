import { Router } from 'express';
import multer from 'multer';
import * as mediaController from './media.controller.js';
import { authenticate } from '@middleware/auth.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
});

// Upload endpoint - supports both single and multiple files
router.post(
  '/upload',
  authenticate,
  upload.array('files', 10), // Max 10 files
  mediaController.uploadMedia
);

export default router;
