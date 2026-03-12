import { z } from 'zod';
import { MEDIA_CONSTANTS } from '@common/constants.js';

export const uploadMediaSchema = z.object({
  files: z
    .array(
      z.object({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z.string(),
        size: z.number(),
        buffer: z.instanceof(Buffer),
      })
    )
    .max(MEDIA_CONSTANTS.MAX_FILES_PER_UPLOAD, 'Maximum 10 files allowed'),
});

export type UploadMediaDto = z.infer<typeof uploadMediaSchema>;
