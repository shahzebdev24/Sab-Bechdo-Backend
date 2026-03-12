import { Request, Response, NextFunction } from 'express';
import * as mediaService from './media.service.js';
import { sendSuccess } from '@core/http/response.js';
import { BadRequestError } from '@core/errors/app-error.js';

export const uploadMedia = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const files = req.files as Express.Multer.File[] | undefined;
    const file = req.file;

    if (!files && !file) {
      throw new BadRequestError('No files uploaded');
    }

    const results = [];

    if (file) {
      // Single file upload
      const isVideo = file.mimetype.startsWith('video/');
      const result = isVideo
        ? await mediaService.uploadVideo(file, userId)
        : await mediaService.uploadImage(file, userId);
      results.push(result);
    } else if (files) {
      // Multiple files upload
      for (const uploadedFile of files) {
        const isVideo = uploadedFile.mimetype.startsWith('video/');
        const result = isVideo
          ? await mediaService.uploadVideo(uploadedFile, userId)
          : await mediaService.uploadImage(uploadedFile, userId);
        results.push(result);
      }
    }

    sendSuccess(res, { files: results }, 'Media uploaded successfully', 201);
  } catch (error) {
    next(error);
  }
};
