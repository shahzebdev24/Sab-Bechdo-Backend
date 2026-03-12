import cloudinary from '@config/cloudinary.js';
import { BadRequestError } from '@core/errors/app-error.js';
import { MEDIA_CONSTANTS } from '@common/constants.js';
import { UploadApiResponse } from 'cloudinary';

export interface MediaUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  resourceType: string;
  format: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
}

export const uploadImage = async (
  file: Express.Multer.File,
  userId: string
): Promise<MediaUploadResult> => {
  if (file.size > MEDIA_CONSTANTS.MAX_IMAGE_SIZE) {
    throw new BadRequestError('Image size must be less than 10MB');
  }

  try {
    const result: UploadApiResponse = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `sab-bechdo/ads/${userId}`,
          resource_type: 'image',
          allowed_formats: MEDIA_CONSTANTS.ALLOWED_IMAGE_FORMATS,
          transformation: [
            { width: 1200, height: 1200, crop: 'limit', quality: 'auto:good' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as UploadApiResponse);
        }
      );
      uploadStream.end(file.buffer);
    });

    return {
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    };
  } catch (error) {
    throw new BadRequestError('Failed to upload image');
  }
};

export const uploadVideo = async (
  file: Express.Multer.File,
  userId: string
): Promise<MediaUploadResult> => {
  if (file.size > MEDIA_CONSTANTS.MAX_VIDEO_SIZE) {
    throw new BadRequestError('Video size must be less than 100MB');
  }

  try {
    const result: UploadApiResponse = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `sab-bechdo/ads/${userId}`,
          resource_type: 'video',
          allowed_formats: MEDIA_CONSTANTS.ALLOWED_VIDEO_FORMATS,
          transformation: [
            { width: 720, height: 1280, crop: 'limit', quality: 'auto:good' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as UploadApiResponse);
        }
      );
      uploadStream.end(file.buffer);
    });

    return {
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      width: result.width,
      height: result.height,
      duration: result.duration,
      bytes: result.bytes,
    };
  } catch (error) {
    throw new BadRequestError('Failed to upload video');
  }
};

export const deleteMedia = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    // Silently fail - media might already be deleted
  }
};
