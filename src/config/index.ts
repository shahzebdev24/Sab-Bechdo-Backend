import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(3000),
  apiVersion: z.string().default('v1'),
  
  database: z.object({
    url: z.string().min(1, 'Database URL is required'),
  }),
  
  jwt: z.object({
    secret: z.string().min(32, 'JWT secret must be at least 32 characters'),
    refreshSecret: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
    accessExpiry: z.string().default('15m'),
    refreshExpiry: z.string().default('7d'),
  }),
  
  email: z.object({
    host: z.string().min(1),
    port: z.coerce.number(),
    user: z.string().email(),
    password: z.string().min(1),
    from: z.string().email(),
  }),
  
  frontendUrl: z.string().url(),
  
  cors: z.object({
    origin: z.union([z.string(), z.array(z.string())]).default('*'),
  }),
  
  rateLimit: z.object({
    windowMs: z.coerce.number().default(900000),
    maxRequests: z.coerce.number().default(100),
    authMax: z.coerce.number().default(5),
  }),
  
  firebase: z.object({
    projectId: z.string().min(1, 'Firebase project ID is required'),
    clientEmail: z.string().email('Firebase client email must be valid'),
    privateKey: z.string().min(1, 'Firebase private key is required'),
  }),
  
  cloudinary: z.object({
    cloudName: z.string().min(1, 'Cloudinary cloud name is required'),
    apiKey: z.string().min(1, 'Cloudinary API key is required'),
    apiSecret: z.string().min(1, 'Cloudinary API secret is required'),
  }),
});

export type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  const rawConfig = {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    apiVersion: process.env.API_VERSION,
    
    database: {
      url: process.env.DATABASE_URL,
    },
    
    jwt: {
      secret: process.env.JWT_SECRET,
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      accessExpiry: process.env.JWT_ACCESS_EXPIRY,
      refreshExpiry: process.env.JWT_REFRESH_EXPIRY,
    },
    
    email: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      from: process.env.EMAIL_FROM,
    },
    
    frontendUrl: process.env.FRONTEND_URL,
    
    cors: {
      origin: process.env.CORS_ORIGIN?.includes(',')
        ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
        : process.env.CORS_ORIGIN,
    },
    
    rateLimit: {
      windowMs: process.env.RATE_LIMIT_WINDOW_MS,
      maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
      authMax: process.env.AUTH_RATE_LIMIT_MAX,
    },
    
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
  };

  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      throw new Error(`Configuration validation failed:\n${issues.join('\n')}`);
    }
    throw error;
  }
}

export const config = loadConfig();
